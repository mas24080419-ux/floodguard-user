
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.FGRouteTime=function(a){
   const n=a?.duration;
   return (a?.etaType==='traffic'||a?.etaType==='walking')&&Number.isFinite(n)&&n>=0?Math.max(1,Math.round(n))+' phút':'Chưa có thời gian';
 };
 window.FGGoogleRouteURL=function(start,end,mode){
   if(!start||!end||![start.lat,start.lon,end.lat,end.lon].every(v=>v!==null&&v!==''&&Number.isFinite(Number(v))))return '';
   if(Math.abs(Number(start.lat))>90||Math.abs(Number(end.lat))>90||Math.abs(Number(start.lon))>180||Math.abs(Number(end.lon))>180)return '';
   const u=new URL('https://www.google.com/maps/dir/');
   u.searchParams.set('api','1');u.searchParams.set('origin',Number(start.lat)+','+Number(start.lon));
   u.searchParams.set('destination',Number(end.lat)+','+Number(end.lon));
   u.searchParams.set('travelmode',mode==='motorbike'?'two-wheeler':mode==='walk'?'walking':'driving');
   return u.href;
 };
 window.FGRouteSourcePanel=function(start,end,mode,provider,a){
   const url=window.FGGoogleRouteURL(start,end,mode),updated=a?.fetchedAt?new Date(a.fetchedAt).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}):'';
   const point=p=>esc(p?.label||'Điểm trên bản đồ')+' ('+Number(p?.lat).toFixed(5)+', '+Number(p?.lon).toFixed(5)+')';
   if(!window.FGRouteHasETA(a))return '<section class="fg-routing-source" aria-label="Nguồn tuyến đường"><strong>Đã tìm được tuyến đường</strong><p>'+esc(provider)+' · Dữ liệu OpenStreetMap'+(updated?' · Lấy lúc '+esc(updated):'')+'</p><small>Chưa có thời gian theo giao thông. '+esc(a?.route?.trafficUnavailableReason||'Dịch vụ thời gian chưa được kích hoạt.')+' Tuyến và chỉ dẫn vẫn hiển thị. Nguy cơ ngập được đánh giá riêng từ dữ liệu lịch sử.'+(mode==='motorbike'?' Tuyến xe máy dùng chế độ motor_scooter của Valhalla; hạn chế đường phụ thuộc dữ liệu bản đồ.':'')+'</small><details><summary>Điểm đầu cuối và Google Maps</summary><p>Điểm đi: '+point(start)+'<br>Điểm đến: '+point(end)+'</p>'+(url?'<a class="fg-google-maps-link" data-google-maps href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Mở Google Maps ↗</a>':'')+'</details><a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener noreferrer">Báo lỗi dữ liệu bản đồ ↗</a></section>';
   return '<section class="fg-routing-source" aria-label="Nguồn tuyến và thời gian"><strong>'+
   (mode==='walk'?'Thời gian đi bộ dự kiến':'Thời gian dự kiến theo giao thông')+
   '</strong><p>© TomTom'+(updated?' · Tính lúc '+esc(updated):'')+
   (mode!=='walk'?' · Khởi hành ngay. Thông tin giao thông được tính theo dữ liệu TomTom có sẵn.':'.')+
   '</p><small>Nguy cơ ngập do FloodGuard đánh giá riêng từ dữ liệu lịch sử. Thời gian chưa được hiệu chỉnh riêng cho độ ngập dự báo.'+
   (mode==='motorbike'?' Chế độ xe máy của TomTom đang ở bản beta; dữ liệu hạn chế phương tiện có thể chưa đầy đủ.':'')+
   '</small><details><summary>Điểm đầu cuối và đối chiếu Google Maps</summary><p>Điểm đi: '+point(start)+'<br>Điểm đến: '+point(end)+'</p>'+
   (url?'<a class="fg-google-maps-link" data-google-maps href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Đối chiếu Google Maps ↗</a>':'')+
   '<small>Google Maps tính lại tuyến từ cùng hai điểm; không nhận tuyến né ngập đang chọn. Với tên khu vực, hãy kiểm tra ghim hoặc chọn địa chỉ cụ thể.</small></details></section>';
 };
 window.FGRouteHasETA=a=>(a?.etaType==='traffic'||a?.etaType==='walking')&&Number.isFinite(a?.duration);
 let routeServiceStatus=null,routeServiceStatusAt=0,lastGeometryRequest=0,geometryQueue=Promise.resolve(),statusPromise=null;
 const geometryInflight=new Map(),providerCooldown=new Map();
 const geometryCache=new Map();
 function abortError(){const e=Error('Yêu cầu đã hủy');e.name='AbortError';return e}
 window.FGRouteAwait=function(task,signal){if(!signal)return Promise.resolve(task);if(signal.aborted){Promise.resolve(task).catch(()=>{});return Promise.reject(abortError())}return new Promise((resolve,reject)=>{const stop=()=>{cleanup();reject(abortError())},cleanup=()=>signal.removeEventListener('abort',stop);signal.addEventListener('abort',stop,{once:true});Promise.resolve(task).then(value=>{cleanup();resolve(value)},e=>{cleanup();reject(e)})})};
 async function routeJSON(url,timeout=8000){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);try{const r=await fetch(url,{signal:controller.signal,cache:'no-store'});const data=await r.json().catch(()=>({}));if(!r.ok){const e=Error(r.status===429?'Dịch vụ đang giới hạn lượt gọi. Vui lòng chờ một lát rồi thử lại.':data.message||data.error||'Dịch vụ tìm đường chưa phản hồi.');e.status=r.status;e.retryAfter=Math.min(60000,Math.max(30000,(Number(r.headers?.get('Retry-After'))||30)*1000));throw e}return data}catch(e){if(e.name==='AbortError'){const timeoutError=Error('Dịch vụ phản hồi quá chậm. Vui lòng thử lại hoặc chọn điểm trên bản đồ.');timeoutError.code='timeout';throw timeoutError}throw e}finally{clearTimeout(timer)}}
 async function serviceConfigured(){if(Date.now()-routeServiceStatusAt<(routeServiceStatus===null?10000:60000)&&routeServiceStatusAt)return routeServiceStatus;if(statusPromise)return statusPromise;statusPromise=(async()=>{try{const d=await routeJSON('https://floodguard-rescue-backend.onrender.com/api/routes/traffic-status',4000);routeServiceStatus=typeof d.configured==='boolean'?d.configured:null}catch{routeServiceStatus=null}routeServiceStatusAt=Date.now();return routeServiceStatus})().finally(()=>{statusPromise=null});return statusPromise}
 async function geometryFetch(url){const previous=geometryQueue;let release;geometryQueue=new Promise(resolve=>{release=resolve});await previous;try{const wait=1100-(Date.now()-lastGeometryRequest);if(wait>0)await new Promise(resolve=>setTimeout(resolve,wait));lastGeometryRequest=Date.now();return await routeJSON(url)}finally{release()}}
 async function freeGeometry(start,end,mode,reason){const key=[mode,start.lat,start.lon,end.lat,end.lon].join('|');if(geometryInflight.has(key))return geometryInflight.get(key);const task=freeGeometryUncached(start,end,mode,reason).finally(()=>geometryInflight.delete(key));geometryInflight.set(key,task);return task}
 async function freeGeometryUncached(start,end,mode,reason){
  const key=[mode,start.lat,start.lon,end.lat,end.lon].join('|'),cached=geometryCache.get(key);if(cached&&Date.now()-cached.at<120000)return cached.value;
  const query=start.lon+','+start.lat+';'+end.lon+','+end.lat+'?alternatives=true&steps=true&geometries=geojson&overview=full';
  const costing=mode==='motorbike'?'motor_scooter':mode==='walk'?'pedestrian':'auto',request={locations:[{lat:start.lat,lon:start.lon},{lat:end.lat,lon:end.lon}],costing,format:'osrm',shape_format:'geojson',units:'kilometers',alternates:2};
  if(mode==='motorbike')request.costing_options={motor_scooter:{use_highways:0}};
  const valhalla={provider:'Valhalla · OpenStreetMap',url:'https://valhalla1.openstreetmap.de/route?json='+encodeURIComponent(JSON.stringify(request))};
  const endpoints=mode==='motorbike'?[valhalla]:mode==='walk'?[{provider:'OSRM · OpenStreetMap',url:'https://routing.openstreetmap.de/routed-foot/route/v1/driving/'+query},valhalla]:[{provider:'OSRM · OpenStreetMap',url:'https://router.project-osrm.org/route/v1/driving/'+query},{provider:'OSRM · OpenStreetMap',url:'https://routing.openstreetmap.de/routed-car/route/v1/driving/'+query},valhalla];
  let lastError;
  for(const endpoint of endpoints){const serviceKey=new URL(endpoint.url).origin+new URL(endpoint.url).pathname.split('/route')[0];if((providerCooldown.get(serviceKey)||0)>Date.now()){lastError=Error('Dịch vụ đang tạm gián đoạn. Vui lòng thử lại sau một lát.');continue}try{
   let data;try{data=await geometryFetch(endpoint.url)}catch(e){if(mode!=='motorbike'||e.status===429||e.status===400)throw e;data=await geometryFetch(endpoint.url)}
   if(data.code!=='Ok'||!Array.isArray(data.routes)||!data.routes.length)throw Error('Không tìm thấy đường nối hai điểm. Hãy kiểm tra ghim địa chỉ.');
   const fetchedAt=new Date().toISOString();
   const routes=data.routes.filter(r=>Number.isFinite(r.distance)&&r.distance>=0&&r.geometry?.type==='LineString'&&Array.isArray(r.geometry.coordinates)&&r.geometry.coordinates.length>=2&&r.geometry.coordinates.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))).map(r=>({...r,duration:null,legs:(r.legs||[]).map(l=>({...l,duration:null,steps:(l.steps||[]).map(s=>({...s,duration:null}))})),etaType:'unavailable',travelMode:mode,routingProvider:endpoint.provider,fetchedAt,modeBeta:false,trafficUnavailableReason:reason}));
   if(!routes.length)throw Error('Dịch vụ không trả về đường hợp lệ.');
   const result={data:{code:'Ok',routes},provider:endpoint.provider};geometryCache.set(key,{at:Date.now(),value:result});if(geometryCache.size>20)geometryCache.delete(geometryCache.keys().next().value);return result;
  }catch(e){lastError=e;if(!e.status||e.status===429||e.status>=500)providerCooldown.set(serviceKey,Date.now()+(e.retryAfter||30000))}}
  throw lastError||Error('Chưa tải được lộ trình. Vui lòng thử lại.');
 }
 window.FGRouteTraffic=async function(start,end,mode,options={}){if(options.signal?.aborted)throw abortError();return window.FGRouteAwait(routeTask(start,end,mode,options.signal),options.signal)};
 async function routeTask(start,end,mode,signal){
  if(!['car','motorbike','walk'].includes(mode)||![start?.lat,start?.lon,end?.lat,end?.lon].every(v=>typeof v==='number'&&Number.isFinite(v))||[start,end].some(p=>p.lat<10||p.lat>11.6||p.lon<105.8||p.lon>107.4))throw Error('Hãy chọn hai điểm hợp lệ tại TP.HCM và vùng lân cận.');
  const configured=await serviceConfigured();if(signal?.aborted)throw abortError();let reason='Dữ liệu giao thông chưa được kích hoạt.';
  if(configured===true){
   if(typeof window.FG31RoutingAPI!=='function')throw Error('Hệ thống tài khoản đang khởi động. Vui lòng thử lại sau.');
   const trafficController=new AbortController(),abortTraffic=()=>trafficController.abort();signal?.addEventListener('abort',abortTraffic,{once:true});const timer=setTimeout(abortTraffic,8000);
   try{const data=await window.FGRouteAwait(window.FG31RoutingAPI({start:{lat:start.lat,lon:start.lon},end:{lat:end.lat,lon:end.lon},travelMode:mode},{signal:trafficController.signal}),trafficController.signal);if(data.code!=='Ok'||!data.routes?.length)throw Error('Dịch vụ chưa trả về lộ trình hợp lệ.');return {data,provider:'TomTom'};}
   catch(e){if(signal?.aborted)throw abortError();if(e.status===401||e.status===403||e.status===400||e.code==='authentication_required'||e.code==='invalid_request')throw e;reason=e.name==='AbortError'?'Dịch vụ giao thông phản hồi quá chậm.':e.message||'Dữ liệu giao thông hiện chưa phản hồi.';}finally{clearTimeout(timer);signal?.removeEventListener('abort',abortTraffic)}
  }
  if(signal?.aborted)throw abortError();return freeGeometry(start,end,mode,reason);
 }

})();
