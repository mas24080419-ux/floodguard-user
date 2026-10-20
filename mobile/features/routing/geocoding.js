
(function(){
  const DISTRICT_POINTS=[
    ['Quận 1',10.7756,106.7004],['Quận 3',10.7844,106.6844],['Quận 4',10.7578,106.7020],['Quận 5',10.7540,106.6630],['Quận 6',10.7469,106.6350],['Quận 7',10.7340,106.7210],['Quận 8',10.7240,106.6280],['Quận 10',10.7721,106.6679],['Quận 11',10.7629,106.6505],['Quận 12',10.8672,106.6413],
    ['Bình Thạnh',10.8106,106.7091],['Gò Vấp',10.8387,106.6653],['Tân Bình',10.8012,106.6520],['Tân Phú',10.7916,106.6260],['Phú Nhuận',10.7990,106.6800],['Bình Tân',10.7653,106.6030],['Hóc Môn',10.8830,106.5870],['Củ Chi',10.9730,106.4930],['Nhà Bè',10.6950,106.7040],['Cần Giờ',10.4110,106.9540],['Thủ Đức',10.8494,106.7537]
  ];
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
  function uniqPlaces(rows){const seen=new Set();return (rows||[]).filter(x=>{const lat=Number(x.lat),lon=Number(x.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon))return false;const k=lat.toFixed(5)+','+lon.toFixed(5);if(seen.has(k))return false;seen.add(k);return true}).slice(0,8)}
  function localPlaces(raw){
    const q=norm(raw);if(!q)return[];const out=[];
    try{(window.STREETS||STREETS||[]).forEach(x=>{const n=norm(x.name);if(n&&(q.includes(n)||n.includes(q))&&Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lon)))out.push({lat:Number(x.lat),lon:Number(x.lon),display_name:`${x.name}, TP.HCM — điểm đại diện trong dữ liệu FloodGuard`,_provider:'Dữ liệu cục bộ',_fallback:true})})}catch(e){}
    DISTRICT_POINTS.forEach(([name,lat,lon])=>{const n=norm(name);if(q.includes(n)||n.includes(q))out.push({lat,lon,display_name:`${name}, Thành phố Hồ Chí Minh — tâm khu vực tham chiếu`,_provider:'Dữ liệu cục bộ',_fallback:true})});
    return uniqPlaces(out);
  }
  async function fetchJSON(url,opts={},timeout=7000){
    const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);
    try{const r=await fetch(url,{...opts,signal:c.signal,cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json()}finally{clearTimeout(t)}
  }
  function nominatimURL(query){return 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=vn&addressdetails=1&accept-language=vi&viewbox=106.35,11.20,107.10,10.30&bounded=1&q='+encodeURIComponent(query)}
  async function fromNominatim(query){const d=await fetchJSON(nominatimURL(query),{headers:{Accept:'application/json'}},6500);return (Array.isArray(d)?d:[]).map(x=>({...x,_provider:'Nominatim'}))}
  async function fromPhoton(query){
    const d=await fetchJSON('https://photon.komoot.io/api/?limit=5&q='+encodeURIComponent(query),{headers:{Accept:'application/json'}},6500);
    return (d.features||[]).map(f=>{const p=f.properties||{},c=f.geometry?.coordinates||[];const label=[p.name,p.street,p.district,p.city,p.county,p.state,p.country].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(', ');return {lat:c[1],lon:c[0],display_name:label||query,_provider:'Photon'}})
      .filter(x=>Number(x.lat)>10.0&&Number(x.lat)<11.5&&Number(x.lon)>106.0&&Number(x.lon)<108.0);
  }
  async function fromArcGIS(query){
    const u='https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&countryCode=VNM&maxLocations=5&outFields=Match_addr,LongLabel&singleLine='+encodeURIComponent(query);
    const d=await fetchJSON(u,{headers:{Accept:'application/json'}},7000);
    return (d.candidates||[]).map(x=>({lat:x.location?.y,lon:x.location?.x,display_name:x.attributes?.LongLabel||x.address||query,_provider:'ArcGIS'}))
      .filter(x=>Number(x.lat)>10.0&&Number(x.lat)<11.5&&Number(x.lon)>106.0&&Number(x.lon)<108.0);
  }
  const placeCache=new Map(),placeInflight=new Map();let placeQueue=Promise.resolve(),lastPlaceRequest=0;
  async function searchPlaces(raw){const key=String(raw||'').trim().toLocaleLowerCase('vi').replace(/\s+/g,' '),cached=placeCache.get(key);if(cached&&Date.now()-cached.at<300000)return cached.rows;if(placeInflight.has(key))return placeInflight.get(key);const task=searchPlacesUncached(raw).then(rows=>{if(rows.length){placeCache.set(key,{at:Date.now(),rows});if(placeCache.size>60)placeCache.delete(placeCache.keys().next().value)}return rows}).finally(()=>placeInflight.delete(key));placeInflight.set(key,task);return task}
  async function searchPlacesUncached(raw){
    raw=String(raw||'').trim();if(raw.length<3)return[];
    const local=localPlaces(raw),query=/hcm|hồ chí minh|ho chi minh|sài gòn|sai gon/i.test(raw)?raw:`${raw}, Thành phố Hồ Chí Minh, Việt Nam`;
    const providers=[fromPhoton,fromArcGIS];
    for(const fn of providers){try{const previous=placeQueue;let release;placeQueue=new Promise(resolve=>{release=resolve});await previous;let rows;try{const wait=900-(Date.now()-lastPlaceRequest);if(wait>0)await new Promise(resolve=>setTimeout(resolve,wait));lastPlaceRequest=Date.now();rows=uniqPlaces(await fn(query));}finally{release()}if(rows.length)return uniqPlaces([...rows,...local])}catch(e){console.warn('FloodGuard geocoder fallback:',e)}}
    if(local.length)return local;
    throw new Error('Không kết nối được dịch vụ tìm địa điểm. Bạn vẫn có thể bấm nút chọn trên bản đồ ở bên phải ô Điểm đi/Điểm đến.');
  }
  async function routeOSRM(endpoints,query,label){
    const errors=[];
    for(const ep of endpoints||[]){
      try{const data=await fetchJSON(ep.url+query,{headers:{Accept:'application/json'}},9000);if(data?.code==='Ok'&&data.routes?.length)return {data,provider:ep.name||'Routing service'};errors.push((ep.name||ep.url)+': không có route')}catch(e){errors.push((ep.name||ep.url)+': '+(e.name==='AbortError'?'timeout':e.message))}
    }
    throw new Error(`Các máy chủ định tuyến ${String(label||'').toLowerCase()} đều không phản hồi. ${errors.slice(0,2).join(' · ')}`);
  }
  window.FG81_NET={fetchJSON,searchPlaces,routeOSRM,localPlaces};
})();
