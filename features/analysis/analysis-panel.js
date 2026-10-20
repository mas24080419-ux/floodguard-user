
(function(){
 const $=id=>document.getElementById(id); const app=$('fg3App');
 const isSingleStreetEntry=x=>{const n=String(x?.name||'').trim();return !!n&&!n.includes(';')};
 const sorted=STREET_CATALOG.filter(isSingleStreetEntry).sort((a,b)=>a.name.localeCompare(b.name,'vi'));
 const byStreet=new Map(); FORECAST_EVENTS.forEach(e=>{if(!byStreet.has(e.street))byStreet.set(e.street,[]);byStreet.get(e.street).push(e)});
 const totalQuant=STREET_CATALOG.filter(x=>x.quant_events>0).length;
 $('fg3StreetN').textContent=STREET_CATALOG.length; $('fg3QuantN').textContent=totalQuant; $('fg3EvN').textContent=EV.length;
 const sel=$('fg3StreetSelect'); sel.innerHTML=sorted.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');
 let current=sorted.some(x=>x.name==='Thảo Điền')?'Thảo Điền':sorted[0].name; let scenarioRain=100;
 function cat(st){return STREET_CATALOG.find(x=>x.name===st)||{tier:'OCCURRENCE_ONLY',quant_events:0,occurrence_rows:0,sources:[]}}
 function rowsFor(st){return byStreet.get(st)||window.FG15MultiModel?.rows(st)||[]}
 function linksFor(st){return STREET_RAIN_LINK_IMPORT.filter(x=>x.street===st)}
 const rainMasterById=new Map(RAIN_MASTER_IMPORT.map(x=>[x.id,x]));
 function badgeModelUse(v){return v==='Có'?'<span class="fg3-rainbadge ok">DÙNG ĐƯỢC</span>':v==='Có điều kiện'?'<span class="fg3-rainbadge cond">CÓ ĐIỀU KIỆN</span>':'<span class="fg3-rainbadge no">KHÔNG DÙNG TRAIN</span>'}

 const stationCatalog=[
   ...RAIN_STATIONS_IMPORT.map((s,i)=>({...s,key:'master-'+i,kind:'master',kindLabel:'Rainfall Master',place:s.location||'—',sourceUrl:s.url||'',sourceText:'Rainfall Master Excel'})),
   ...RAIN_AUTO.map((s,i)=>({...s,key:'auto-'+i,kind:'auto',kindLabel:'Tự động',place:s.area||'—',sourceUrl:s.source_url||'',sourceText:s.source_table||'Bảng 3.42'})),
   ...RAIN_REG.map((s,i)=>({...s,key:'reg-'+i,kind:'reg',kindLabel:'Khu vực',place:s.name||'—',sourceUrl:s.source_url||'',sourceText:s.source_table||'Bảng 3.8'}))
 ];
 let stationFilter='master',stationContext='start';
 function routeGeometryCoords(){
   const rs=window.FG70_ROUTE_STATE; if(!rs?.analyses?.length)return [];
   const a=rs.analyses.find(x=>x.index===rs.selectedIndex)||rs.analyses.find(x=>x.index===rs.recommendedIndex)||rs.analyses[0];
   return a?.route?.geometry?.coordinates||[];
 }
 function stationOrigin(st){
   const routeState=window.FG70_ROUTE_STATE;
   if(routeState){
     if(stationContext==='end'&&routeState.end&&Number.isFinite(Number(routeState.end.lat))&&Number.isFinite(Number(routeState.end.lon))){
       return {lat:Number(routeState.end.lat),lon:Number(routeState.end.lon),basis:'điểm đến của Active Trip',label:String(routeState.to||routeState.end.label||'Điểm đến').trim(),context:'route-end'};
     }
     if(stationContext==='route'){
       const coords=routeGeometryCoords();
       if(coords.length)return {basis:'khoảng cách nhỏ nhất tới hình học của Active Trip',label:`${routeState.from||'Điểm đi'} → ${routeState.to||'Điểm đến'}`,context:'route-path',coords};
     }
     const routeStart=routeState.start;
     if(routeStart&&Number.isFinite(Number(routeStart.lat))&&Number.isFinite(Number(routeStart.lon))){
       return {lat:Number(routeStart.lat),lon:Number(routeStart.lon),basis:'điểm đi của Active Trip',label:String(routeState.from||routeStart.label||'Điểm đi').trim(),context:'route-start'};
     }
   }
   const routeInput=String($('fg3RouteFrom')?.value||'').trim();
   if(routeInput){const routeLocal=localRoadPoint(routeInput);if(routeLocal)return {lat:Number(routeLocal.lat),lon:Number(routeLocal.lon),basis:'điểm đại diện cục bộ của Điểm đi',label:routeInput,context:'route-start'};}
   const rp=localRoadPoint(st); if(rp)return {lat:rp.lat,lon:rp.lon,basis:'điểm đại diện của tuyến phân tích',label:st,context:'analysis'};
   const evs=candidateStationsFor(st); if(evs.length)return {lat:evs.reduce((a,x)=>a+x.lat,0)/evs.length,lon:evs.reduce((a,x)=>a+x.lon,0)/evs.length,basis:'tâm cụm trạm EV liên kết',label:st,context:'analysis'};
   return null;
 }
 function stationDistance(s,origin){
   if(!origin)return NaN;
   if(origin.context==='route-path'&&origin.coords?.length){
     const step=Math.max(1,Math.floor(origin.coords.length/180));let best=Infinity;
     for(let i=0;i<origin.coords.length;i+=step){const c=origin.coords[i];if(!c)continue;best=Math.min(best,hav(s.lat,s.lon,Number(c[1]),Number(c[0])))}
     const last=origin.coords[origin.coords.length-1];if(last)best=Math.min(best,hav(s.lat,s.lon,Number(last[1]),Number(last[0])));return best;
   }
   return hav(origin.lat,origin.lon,s.lat,s.lon);
 }
 function stationDistanceLabel(s,origin){const d=stationDistance(s,origin);return Number.isFinite(d)?`${fmt1(d)} km đường thẳng`:'Chưa tính được khoảng cách'}
 function stationKindClass(k){return k==='auto'?'auto':k==='reg'?'reg':''}
 function renderStationPanel(){
   $('fg3StationMasterN').textContent=RAIN_STATIONS_IMPORT.length;$('fg3StationAutoN').textContent=RAIN_AUTO.length;$('fg3StationRegN').textContent=RAIN_REG.length;
   const origin=stationOrigin(current);
   const ranked=stationCatalog.map(s=>({...s,dist:stationDistance(s,origin)})).sort((a,b)=>Number.isFinite(a.dist)&&Number.isFinite(b.dist)?a.dist-b.dist:0);
   const near=ranked.find(x=>Number.isFinite(x.dist));
   const contextLabel=origin?.label||current;
   const contextTitle=origin?.context==='route-path'?'Trạm gần DỌC LỘ TRÌNH':origin?.context==='route-end'?'Trạm gần ĐIỂM ĐẾN của Active Trip':origin?.context==='route-start'?'Trạm gần ĐIỂM ĐI của Active Trip':'Trạm gần tuyến đang phân tích';
   document.querySelectorAll('[data-station-context]').forEach(b=>b.classList.toggle('active',b.dataset.stationContext===stationContext));
   $('fg3NearestStationSummary').innerHTML=near?`<div class="kicker">${contextTitle} · ${esc(contextLabel)}</div><b>🌧 ${esc(near.name)} · ${fmt1(near.dist)} km</b><p>${esc(near.place)} · ${esc(near.kindLabel)}. Khoảng cách tính từ ${esc(origin.basis)}.</p>`:`<div class="kicker">${contextTitle} · ${esc(contextLabel)}</div><b>Chưa xác định</b><p>Vị trí hiện tại chưa có tọa độ tham chiếu đủ rõ để tính khoảng cách tới trạm đo.</p>`;
   document.querySelectorAll('.fg3-station-tab').forEach(b=>b.classList.toggle('active',b.dataset.stationFilter===stationFilter));
   const list=ranked.filter(s=>stationFilter==='all'||s.kind===stationFilter);
   $('fg3StationList').innerHTML=list.map(s=>`<div class="fg3-station-card"><div class="fg3-station-card-top"><div class="fg3-station-name">🌧 ${esc(s.name)}</div><span class="fg3-station-kind ${stationKindClass(s.kind)}">${esc(s.kindLabel)}</span></div><div class="fg3-station-place">${esc(s.place)}<br><span style="color:#94a3b8">${esc(s.sourceText)}</span></div><div class="fg3-station-coord">${Number(s.lat).toFixed(6)}, ${Number(s.lon).toFixed(6)}</div><div class="fg3-station-distance">↔ ${stationDistanceLabel(s,origin)}</div><div class="fg3-station-actions"><button class="fg3-station-action primary" data-station-focus="${esc(s.key)}">Xem trên bản đồ</button><a class="fg3-station-action" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}">Google Maps</a>${s.sourceUrl?`<a class="fg3-station-action" target="_blank" rel="noopener" href="${s.sourceUrl}">Nguồn ↗</a>`:''}</div></div>`).join('');
 }
 function focusGaugeStation(s){
   closePanels();
   [rainAutoLayer,rainRegLayer,rainMasterLayer].forEach(l=>{if(!map.hasLayer(l))map.addLayer(l)});
   map.setView([s.lat,s.lon],15,{animate:true});
   L.popup().setLatLng([s.lat,s.lon]).setContent(`<div class="p-title">🌧 ${esc(s.name)}</div><div class="p-sub"><b>Loại:</b> ${esc(s.kindLabel)}<br><b>Vị trí:</b> ${esc(s.place)}<br><b>Tọa độ:</b> ${Number(s.lat).toFixed(6)}, ${Number(s.lon).toFixed(6)}<br><b>Nguồn:</b> ${esc(s.sourceText)}</div>${s.sourceUrl?btn(s.sourceUrl,'Mở nguồn'):''}${btn(`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`,'Google Maps')}`).openOn(map);
 }
 function openStationPanel(){closePanels();$('fg3StationPanel').classList.add('show');renderStationPanel()}

 document.addEventListener('fg70:route',()=>{if($('fg3StationPanel')?.classList.contains('show'))renderStationPanel()});

 function renderSubdailyChart(st){
   const dates=new Set(linksFor(st).map(x=>x.date).filter(Boolean));
   const all=SUBDAILY_RAIN_IMPORT.filter(x=>dates.has(x.date)&&Number.isFinite(Number(x.rain))&&x.derived!=='Có');
   $('fg3ImportSubdailyN').textContent=all.length;
   if(!all.length){$('fg3SubdailyTitle').textContent='Mưa theo mốc giờ / khoảng thời gian';$('fg3SubdailyChart').innerHTML='<div class="fg3-note">Chưa có chuỗi mưa theo mốc giờ trùng ngày với sự kiện của tuyến này trong file Excel.</div>';return}
   const groups=new Map(); all.forEach(x=>{const k=x.date+'|'+x.location;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)});
   const best=[...groups.entries()].sort((a,b)=>b[1].length-a[1].length||String(b[1][0].date).localeCompare(String(a[1][0].date)))[0][1];
   function timeVal(s){const m=String(s||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):9999}
   best.sort((a,b)=>timeVal(a.time)-timeVal(b.time));
   const W=330,H=120,p={l:31,r:8,t:9,b:28};const ymax=Math.max(10,...best.map(x=>Number(x.rain)))+8;const X=i=>p.l+(best.length===1?0.5:i/(best.length-1))*(W-p.l-p.r);const Y=v=>H-p.b-Number(v)/ymax*(H-p.t-p.b);
   let grid='';for(let i=0;i<=3;i++){const v=ymax*i/3;grid+=`<line x1="${p.l}" y1="${Y(v)}" x2="${W-p.r}" y2="${Y(v)}" stroke="#e8eef5"/><text x="${p.l-5}" y="${Y(v)+3}" text-anchor="end" font-size="6.5" fill="#94a3b8">${Math.round(v)}</text>`}
   const poly=best.map((x,i)=>`${X(i)},${Y(x.rain)}`).join(' ');const pts=best.map((x,i)=>`<circle cx="${X(i)}" cy="${Y(x.rain)}" r="4" fill="#0ea5e9" stroke="#fff" stroke-width="1.6"><title>${esc(x.time||'—')} · ${fmt1(Number(x.rain))} mm · ${esc(x.location)}</title></circle><text x="${X(i)}" y="${H-10}" text-anchor="middle" font-size="6" fill="#718399">${esc(String(x.time||'').replace('đến ','').slice(0,11))}</text>`).join('');
   $('fg3SubdailyTitle').textContent=`Mưa theo mốc giờ · ${best[0].date} · ${best[0].location}`;
   $('fg3SubdailyChart').innerHTML=`<div class="fg3-subchart"><svg viewBox="0 0 ${W} ${H}">${grid}<polyline points="${poly}" fill="none" stroke="#1677ff" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"/>${pts}<text x="8" y="${H/2}" transform="rotate(-90 8 ${H/2})" text-anchor="middle" font-size="6.5" fill="#718399">mm</text></svg><div class="fg3-subcaption">Các giá trị là số đo/tích lũy tại mốc thời gian do nguồn công bố; không tự chuyển chênh lệch tích lũy thành lượng mưa theo giờ. Đây là bối cảnh cùng ngày sự kiện, không mặc định là số đo trực tiếp trên tuyến.</div></div>`;
 }
 function renderImportedRain(st,rain){
   const links=linksFor(st);$('fg3RainImportCount').textContent=`${RAIN_MASTER_IMPORT.length} quan sát mưa duy nhất`;$('fg3ImportLinkedN').textContent=links.length;$('fg3ImportStationN').textContent=RAIN_STATIONS_IMPORT.length;
   const ranked=[...links].sort((a,b)=>Math.abs(Number(a.rain)-rain)-Math.abs(Number(b.rain)-rain));
   $('fg3ImportStreetRows').innerHTML=ranked.length?ranked.slice(0,6).map(x=>{const master=rainMasterById.get(x.rain_id)||{};const depth=Number.isFinite(Number(x.depth_exact))?`${fmt1(Number(x.depth_exact))} cm`:Number.isFinite(Number(x.depth_min))||Number.isFinite(Number(x.depth_max))?`${x.depth_min??'—'}–${x.depth_max??'—'} cm`:'chưa có số cm';return `<div class="fg3-rainrow"><b>${esc(x.date||'—')}</b> · mưa <b>${fmt1(Number(x.rain))} mm</b> · ngập ${depth}<span class="fg3-rainbadge q">${esc(x.quality||'—')}</span>${badgeModelUse(master.model_use)}<br><span>${esc(x.rain_context||x.rain_scope||'Bối cảnh sự kiện')} · ${esc(x.cause||'')}</span>${x.url?` · <a target="_blank" rel="noopener" href="${x.url}">Nguồn ↗</a>`:''}</div>`}).join(''):'<div class="fg3-note">File Excel chưa có liên kết mưa–tuyến riêng cho tuyến này.</div>';
   renderSubdailyChart(st);
   const rp=localRoadPoint(st);let origin=rp?{lat:rp.lat,lon:rp.lon}:null;if(!origin){const evs=candidateStationsFor(st);if(evs.length)origin={lat:evs.reduce((a,x)=>a+x.lat,0)/evs.length,lon:evs.reduce((a,x)=>a+x.lon,0)/evs.length}}
   if(origin){const near=RAIN_STATIONS_IMPORT.map(s=>({...s,dist:hav(origin.lat,origin.lon,s.lat,s.lon)})).sort((a,b)=>a.dist-b.dist).slice(0,3);$('fg3NearestRainStations').innerHTML=near.map(s=>`<div class="fg3-stationitem"><div><b>🌧 ${esc(s.name)}</b><small>${esc(s.location||'—')} · ${fmt1(s.dist)} km đường thẳng</small></div><a target="_blank" rel="noopener" href="${s.url}" style="font-size:7px;color:#1677ff;text-decoration:none;font-weight:800">Nguồn ↗</a></div>`).join('')}else $('fg3NearestRainStations').innerHTML='<div class="fg3-note">Chưa có tọa độ tham chiếu đủ rõ để tính trạm mưa gần tuyến.</div>';
   const wanted=['IMERG','CMORPH','MSWEP','ERA5','PDIR-Now'];const sats=[];wanted.forEach(n=>{const cand=SATELLITE_IMPORT.filter(x=>x.product===n);if(cand.length){const x=cand.find(y=>y.temporal)||cand[0];sats.push(x)}});$('fg3SatelliteProducts').innerHTML=sats.map(x=>`<div class="fg3-satitem"><b>${esc(x.product)}</b><small>${esc(x.spatial||'—')} · ${esc(x.temporal||'thời gian: xem nguồn')}</small><small>${esc(x.type||'')}</small>${x.url?`<small><a target="_blank" rel="noopener" href="${x.url}" style="color:#1677ff;text-decoration:none;font-weight:800">Nguồn ↗</a></small>`:''}</div>`).join('');
 }
 function formatRange(a,unit){if(!a.length)return 'Chưa có';return `${fmt1(Math.min(...a))}–${fmt1(Math.max(...a))} ${unit}`}
 function tierMeta(c){return c.tier==='FORECAST_READY'?['Đủ dữ liệu','tier-good','Có ≥2 sự kiện mưa–độ ngập định lượng để so sánh theo lịch sử.']:c.tier==='LIMITED_NUMERIC'?['Dữ liệu hạn chế','tier-warn','Chỉ có một sự kiện định lượng; kết quả chỉ nên dùng làm tham chiếu.']:['Bằng chứng từng ngập','tier-info','Có bằng chứng xảy ra ngập nhưng chưa đủ cặp mưa–độ ngập định lượng.']}
 function updateRoad(st){current=st; sel.value=st; if($('fg3StreetInput'))$('fg3StreetInput').value=st; window.FG_CURRENT_STREET=st; const c=cat(st), rows=rowsFor(st), t=tierMeta(c), linked=candidateStationsFor(st).length; $('fg3RoadName').textContent=st;$('fg3Tier').textContent=t[0];$('fg3Tier').className='fg3-tier '+t[1];$('fg3EventN').textContent=c.quant_events||0;$('fg3DepthRange').textContent=formatRange(rows.map(x=>Number(x.depth)).filter(Number.isFinite),'cm');$('fg3RainRange').textContent=formatRange(rows.map(x=>Number(x.rain)).filter(Number.isFinite),'mm');$('fg3EvLinked').textContent=linked;$('fg3RoadNote').textContent=t[2]+` Có ${c.occurrence_rows||0} dòng bằng chứng có nguồn.`;focusRoad(false);if($('fg3StationPanel').classList.contains('show'))renderStationPanel()}
 const fg3GeoCache=new Map();
 let fg3GeoMarker=null;
 function roadKey(s){return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim()}
 function localRoadPoint(st){
   const k=roadKey(st);
   let p=STREETS.find(x=>roadKey(x.name)===k);
   if(p)return p;
   p=STREETS.find(x=>{
     const parts=x.name.split(/\s*[\/–—]\s*|\s+-\s+/).map(roadKey).filter(Boolean);
     return parts.some(part=>part===k || (k.length>=7 && part.includes(k)) || (part.length>=7 && k.includes(part)));
   });
   return p||null;
 }
 function showRoadPoint(lat,lon,street,basis){
   map.setView([lat,lon],15,{animate:true});
   if(fg3GeoMarker){map.removeLayer(fg3GeoMarker);fg3GeoMarker=null}
   fg3GeoMarker=L.circleMarker([lat,lon],{radius:9,color:'#2563eb',weight:3,fillColor:'#ffffff',fillOpacity:1}).addTo(map);
   const note=basis==='dataset'?'Điểm đại diện có sẵn trong bộ dữ liệu.':basis==='osm'?'Vị trí được tìm trên OpenStreetMap chỉ để điều hướng bản đồ; không phải vị trí cảm biến đo ngập.':'Vị trí tham chiếu từ các trạm EV liên kết; không phải tọa độ chính xác của tuyến/ngập.';
   fg3GeoMarker.bindPopup(`<div class="p-title">⌖ ${esc(street)}</div><div class="p-sub">${note}</div>`).openPopup();
 }
 async function focusRoad(zoom=true){
   if(!zoom)return;
   const street=current;
   const btn=$('fg3FocusBtn');
   const original=btn?btn.innerHTML:'';
   const local=localRoadPoint(street);
   if(local){showRoadPoint(local.lat,local.lon,street,'dataset');return}
   if(fg3GeoCache.has(street)){
     const g=fg3GeoCache.get(street);
     if(g){showRoadPoint(g.lat,g.lon,street,'osm');return}
   }
   if(btn){btn.disabled=true;btn.textContent='Đang tìm tuyến…'}
   try{
     const queries=[`${street}, Thành phố Hồ Chí Minh, Việt Nam`,`${street}, Việt Nam`];
     let hit=null;
     for(const q of queries){
       const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&addressdetails=1&bounded=1&viewbox=106.25,11.35,107.65,10.15&q='+encodeURIComponent(q);
       const res=await fetch(url,{headers:{'Accept':'application/json'}});
       if(!res.ok)continue;
       const data=await res.json();
       if(data&&data.length){hit={lat:Number(data[0].lat),lon:Number(data[0].lon),display:data[0].display_name};break}
     }
     fg3GeoCache.set(street,hit);
     if(hit&&Number.isFinite(hit.lat)&&Number.isFinite(hit.lon)){showRoadPoint(hit.lat,hit.lon,street,'osm');return}
     const evs=candidateStationsFor(street);
     if(evs.length){
       const b=L.latLngBounds(evs.map(e=>[e.lat,e.lon]));
       map.fitBounds(b,{padding:[90,90],maxZoom:14});
       const c=b.getCenter();showRoadPoint(c.lat,c.lng,street,'ev');
       return;
     }
     L.popup().setLatLng(map.getCenter()).setContent(`<div class="p-title">Chưa tìm thấy vị trí</div><div class="p-sub">Không tìm thấy tọa độ bản đồ đáng tin cậy cho <b>${esc(street)}</b>. Dữ liệu phân tích của tuyến vẫn được giữ nguyên.</div>`).openOn(map);
   }catch(err){
     const evs=candidateStationsFor(street);
     if(evs.length){const b=L.latLngBounds(evs.map(e=>[e.lat,e.lon]));map.fitBounds(b,{padding:[90,90],maxZoom:14});const c=b.getCenter();showRoadPoint(c.lat,c.lng,street,'ev')}
     else L.popup().setLatLng(map.getCenter()).setContent(`<div class="p-title">Không thể tải vị trí tuyến</div><div class="p-sub">Kiểm tra kết nối Internet rồi thử lại. Dữ liệu phân tích không bị ảnh hưởng.</div>`).openOn(map);
   }finally{if(btn){btn.disabled=false;btn.innerHTML=original}}
 }
 function setRain(v){scenarioRain=Number(v)||0;$('fg3Rain').value=scenarioRain;$('fg3RainKpi').textContent=fmt1(scenarioRain)+' mm';document.querySelectorAll('#fg3Presets .fg3-chip').forEach(b=>b.classList.toggle('active',Number(b.dataset.rain)===scenarioRain))}
 function simpleRiskLabel(sig,c,validity){if(!validity.valid)return [validity.code==='OUT_OF_RANGE'?'Ngoài phạm vi dữ liệu':'Chưa đủ dữ liệu','risk-med'];if(sig.score>=3)return ['Cao','risk-high'];if(sig.score===2)return ['Cần chú ý','risk-med'];return ['Thấp hơn tiền lệ','risk-low']}
 function chart(rows,rain,pred,isValid=true){const el=$('fg3Chart');if(!rows.length){el.innerHTML='<div class="fg3-note">Tuyến này chưa có cặp mưa–độ ngập định lượng.</div>';return}const W=350,H=140,p={l:30,r:8,t:8,b:24};const xs=rows.map(x=>x.rain).concat(isValid?[rain]:[]),ys=rows.map(x=>x.depth).concat(isValid&&Number.isFinite(pred)?[pred]:[]);let xmin=Math.max(0,Math.min(...xs)-8),xmax=Math.max(...xs)+8;if(xmax===xmin)xmax=xmin+1;let ymax=Math.max(10,...ys)+5;const X=x=>p.l+(x-xmin)/(xmax-xmin)*(W-p.l-p.r),Y=y=>H-p.b-y/ymax*(H-p.t-p.b);let g='';for(let i=0;i<=3;i++){const y=ymax*i/3;g+=`<line x1="${p.l}" y1="${Y(y)}" x2="${W-p.r}" y2="${Y(y)}" stroke="#edf2f7"/><text x="${p.l-5}" y="${Y(y)+3}" text-anchor="end" font-size="7" fill="#94a3b8">${Math.round(y)}</text>`}const pts=rows.map(x=>`<circle cx="${X(x.rain)}" cy="${Y(x.depth)}" r="3.5" fill="#1677ff" opacity=".7"><title>${x.date}: ${x.rain} mm / ${x.depth} cm</title></circle>`).join('');const t=isValid&&Number.isFinite(pred)?`<line x1="${X(rain)}" y1="${p.t}" x2="${X(rain)}" y2="${H-p.b}" stroke="#e5484d" stroke-dasharray="3 3"/><circle cx="${X(rain)}" cy="${Y(pred)}" r="5" fill="#e5484d" stroke="white" stroke-width="2"/>`:'';el.innerHTML=`<svg viewBox="0 0 ${W} ${H}">${g}<line x1="${p.l}" y1="${H-p.b}" x2="${W-p.r}" y2="${H-p.b}" stroke="#cbd5e1"/>${pts}${t}<text x="${W/2}" y="${H-5}" text-anchor="middle" font-size="7.5" fill="#718399">Lượng mưa (mm)</text></svg>${!isValid?'<div class="fg3-note" style="margin-top:6px">Kịch bản hiện tại không được vẽ thành điểm dự báo vì chưa đủ cơ sở định lượng.</div>':''}`}
 function renderMultiModel(mm){
   window.FGModelInsights?.render(mm);
   const grid=$('fg15ModelGrid'),meta=$('fg15ModelMeta'),ens=$('fg15Ensemble'),metrics=$('fg15Metrics');if(!grid||!meta||!ens||!metrics)return;
   if(!mm){ens.textContent='—';meta.textContent='Multi-Model chưa sẵn sàng.';grid.innerHTML='';metrics.innerHTML='';return}
   ens.textContent=Number.isFinite(mm.ensemble)?`${fmt1(mm.ensemble)} cm`:'N/A';
   meta.innerHTML=`${esc(mm.street)} · ${fmt1(mm.rain)} mm${mm.tide!=null?` · triều ${fmt1(mm.tide)} m`:''} · <b>${mm.dataN}</b> core event Tuyến×Ngày${Number.isFinite(mm.minRain)?` · range ${fmt1(mm.minRain)}–${fmt1(mm.maxRain)} mm`:''} · đồng thuận nội bộ <span class="fg16-confidence ${String(mm.confidence||'low').toLowerCase()}">${esc(mm.confidence||'LOW')}</span>${mm.consensusBand?` · consensus ${fmt1(mm.consensusBand.low)}–${fmt1(mm.consensusBand.high)} cm`:''}`;
   grid.innerHTML=mm.models.map(m=>`<div class="fg15-model ${m.available?'ok':'off'}"><div class="fg15-modeltop"><div class="fg15-modelname">${esc(m.name)}</div><span class="fg15-modeltag">${m.tag?esc(m.tag):(m.available?'ACTIVE':'N/A')}</span></div><div class="fg15-modelpred">${m.available&&Number.isFinite(m.pred)?fmt1(m.pred)+' cm':'Không chạy'}</div><div class="fg15-modelsub">n=${m.n}${m.metrics?` · ${esc(m.validation||'CV')} MAE ${fmt1(m.metrics.mae)} · RMSE ${fmt1(m.metrics.rmse)}`:''}${Number.isFinite(m.r2)?` · R² train ${m.r2.toFixed(2)}`:''}<br>${esc(m.note||'')}${m.available&&!m.ensembleEligible?'<br><b>Không đưa vào Ensemble.</b>':''}</div>${mm.weights?.find(w=>w.id===m.id)?`<div class="fg16-weight">Ensemble weight ${(100*mm.weights.find(w=>w.id===m.id).w).toFixed(1)}%</div>`:''}</div>`).join('');
   const active=mm.models.filter(m=>m.available),best=window.FG15MultiModel?.bestMetrics(mm);const maes=active.map(m=>m.metrics?.mae).filter(Number.isFinite),rmses=active.map(m=>m.metrics?.rmse).filter(Number.isFinite);
   metrics.innerHTML=`<div class="fg15-metric"><b>${mm.availableN}/${mm.models.filter(m=>m.ensembleEligible).length}</b><span>model Ensemble hợp lệ</span></div><div class="fg15-metric"><b>${best?esc(best.name):'—'}</b><span>CV MAE thấp nhất</span></div><div class="fg15-metric"><b>${maes.length?fmt1(Math.min(...maes))+' cm':'—'}</b><span>best CV MAE</span></div>`;const note=$('fg15ModelNote');if(note){const eb=mm.evidenceBand;note.innerHTML=`<b>Validation chống leakage:</b> local = LOOCV sau khử lặp Tuyến×Ngày; hierarchical = Group-by-Date CV. ${eb&&Number.isFinite(eb.lower)?`Historical interval evidence gần kịch bản: ${fmt1(eb.lower)}${Number.isFinite(eb.upper)?'–'+fmt1(eb.upper):'+'} cm (n=${eb.n}); đây là envelope quan sát, không phải confidence interval.`:''} Rain+Tide bị loại khỏi Ensemble vì chỉ có ${mm.tideIndependentDates} ngày độc lập.`}
 }
 function analyze(){
 const typedStreet=String($('fg3StreetInput')?.value||'').trim();
 const typedHit=resolveStreetChoice(typedStreet);
 if(typedHit){sel.value=typedHit.name;current=typedHit.name}
 else current=sel.value;
 updateRoad(current);
 const c=cat(current),rows=rowsFor(current),rain=Math.max(0,Number($('fg3Rain').value)||0);setRain(rain);
 const validity=scenarioValidity(rain,rows);
 const sig=validity.valid?signal(rain,rows):{label:validity.label,score:0,note:validity.note};
 const an=validity.valid?analogue(rain,rows):null;
 const tideRaw=String($('fg15Tide')?.value||'').trim(),tide=tideRaw===''?null:Number(tideRaw);
 const mm=window.FG15MultiModel?.predict(current,rain,Number.isFinite(tide)?tide:null)||null;
 const primaryDepth=mm?mm.ensemble:(an?an.depth:NaN);
 const primaryRisk=Number.isFinite(primaryDepth)?(primaryDepth>=40?['NGUY CƠ CAO','risk-high']:primaryDepth>=20?['CẦN CHÚ Ý','risk-med']:['NGUY CƠ THẤP THEO MẪU','risk-low']):mm?['Chưa đủ dữ liệu','']:simpleRiskLabel(sig,c,validity);
 $('fg3Risk').textContent=primaryRisk[0];$('fg3Risk').className='big '+primaryRisk[1];$('fg3RiskDesc').textContent=mm&&Number.isFinite(mm.ensemble)?`Phân loại từ Audited Ensemble ${fmt1(mm.ensemble)} cm, ${mm.availableN} model hợp lệ · đồng thuận nội bộ ${mm.confidence}.`:mm?'Chưa đủ model hợp lệ cho lượng mưa đã chọn; không điền độ ngập hoặc kết luận nguy cơ thấp.':sig.note;
 $('fg3PredDepth').textContent=Number.isFinite(primaryDepth)?fmt1(primaryDepth)+' cm':'Chưa thể ước lượng';
 $('fg3PredDepth').className='big '+(Number.isFinite(primaryDepth)&&primaryDepth>=40?'risk-high':Number.isFinite(primaryDepth)&&primaryDepth>=20?'risk-med':'');
 $('fg3PredDesc').textContent=mm&&Number.isFinite(mm.ensemble)?`Audited Ensemble từ ${mm.availableN} model; n=${mm.dataN} sự kiện Tuyến×Ngày · đồng thuận nội bộ ${mm.confidence}${mm.consensusBand?` · consensus ${fmt1(mm.consensusBand.low)}–${fmt1(mm.consensusBand.high)} cm`:''}. Không ngoại suy local model ngoài range training.`:(an?`Ước lượng tương đồng lịch sử; khoảng độ ngập nguồn ${fmt1(an.min)}–${fmt1(an.max)} cm.`:validity.note);
 // Technical diagnostics are intentionally absent from the user summary.
 const diagnostics=getComputedStyle($('fg3ResultWrap').querySelector('.fg15-modelbox')).display!=='none';
 if(diagnostics)renderMultiModel(mm);
 const affected=candidateStationsFor(current);
 let high=[],med=[],scored=[];
 if(validity.valid){
   scored=affected.map(s=>{const pair=(s.candidate_pairs||[]).find(p=>p.street===current);const risk=impactLevel(sig.score,pair?pair.priority:s.screening_priority);return {s,pair,risk}});high=scored.filter(x=>x.risk==='HIGH');med=scored.filter(x=>x.risk==='MEDIUM');
   $('fg3ImpactEV').textContent=high.length;$('fg3ImpactEV').className='big '+(high.length?'risk-high':med.length?'risk-med':'risk-low');
   $('fg3ImpactEVDesc').textContent=high.length?`${high.length} trạm đạt mức rủi ro CAO trong kịch bản ${fmt1(rain)} mm.`:med.length?`Chưa có mức CAO; ${med.length} trạm ở mức TRUNG BÌNH theo kịch bản.`:'Không có trạm liên kết trực tiếp đạt mức rủi ro đáng chú ý trong kịch bản.';
 }else{
   $('fg3ImpactEV').textContent='—';$('fg3ImpactEV').className='big';
   $('fg3ImpactEVDesc').textContent=affected.length?`Có ${affected.length} trạm liên kết ứng viên, nhưng chưa thể xếp rủi ro vì dự báo ngập không đủ cơ sở.`:'Chưa có trạm liên kết trực tiếp với tuyến này.';
 }
 if(diagnostics){
 $('fg3RiskStations').innerHTML=!validity.valid?`<div class="fg3-note">Chưa xếp hạng trạm sạc theo kịch bản. ${esc(validity.note)}</div>`:high.length?high.map(({s})=>`<div class="fg3-riskline"><div><div class="fg3-riskname">${esc(s.name)}</div><div class="fg3-riskmeta">${esc(s.id)} · ${s.power??'—'} kW · ${s.ports??'—'} cổng · <a target="_blank" rel="noopener" href="${s.gmap}">Bản đồ ↗</a></div></div><span class="fg3-badge-high">RỦI RO CAO</span></div>`).join(''):med.length?`<div class="fg3-note">Không có trạm mức CAO. Có ${med.length} trạm mức TRUNG BÌNH trong kịch bản này.</div>`:'<div class="fg3-note">Không có trạm sạc liên kết trực tiếp cần cảnh báo trong kịch bản hiện tại.</div>';
 const altBlocks=[];const used=new Set();
 if(validity.valid)high.forEach(({s})=>{altFor(s,current,rain).forEach(a=>{if(used.has(a.id))return;used.add(a.id);altBlocks.push(`<div class="fg3-alt"><b>${esc(a.name)}</b><small>Thay thế cho ${esc(s.name)} · ${fmt1(a.dist)} km đường thẳng · ${a.power??'—'} kW · ${a.ports??'—'} cổng</small><small><a target="_blank" rel="noopener" href="${a.gmap}">Mở Google Maps ↗</a></small></div>`)})});
 $('fg3Alternatives').innerHTML=!validity.valid?'<div class="fg3-note">Chưa đề xuất trạm thay thế vì chưa xác định được trạm rủi ro cao một cách hợp lệ.</div>':altBlocks.length?altBlocks.slice(0,9).join(''):'<div class="fg3-note">Trạm thay thế sẽ xuất hiện khi có ít nhất một trạm được xếp mức rủi ro CAO.</div>';
 chart(rows,rain,an?an.depth:NaN,validity.valid);
 const near=an?an.nearest:[...rows].sort((a,b)=>Math.abs(a.rain-rain)-Math.abs(b.rain-rain)).slice(0,3);
 $('fg3Events').innerHTML=near.length?near.map(x=>`<div class="fg3-event"><b>${esc(x.date)}</b> · mưa <b>${fmt1(x.rain)} mm</b> · ngập <b>${fmt1(x.depth)} cm</b>${Number.isFinite(Number(x.tide))?` · triều ${fmt1(Number(x.tide))} m`:''}<br><span>${esc(x.cause||'')}</span> · <a target="_blank" rel="noopener" href="${x.source_url}">Nguồn ↗</a></div>`).join(''):'<div class="fg3-note">Không có sự kiện mưa–độ ngập định lượng để hiển thị. Các URL bằng chứng occurrence vẫn được giữ trong dataset.</div>';
 renderEVImpact(current,sig,an,validity);renderImportedRain(current,rain);}
 $('fg3Drawer').classList.add('open');
 }
 function streetNorm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim()}
 function resolveStreetChoice(q){const n=streetNorm(q);if(!n)return null;return sorted.find(x=>streetNorm(x.name)===n)||sorted.find(x=>streetNorm(x.name).startsWith(n))||sorted.find(x=>streetNorm(x.name).includes(n))||null}
 function renderStreetPicker(inputId,suggestId,onPick){
   const input=$(inputId),box=$(suggestId);if(!input||!box)return;
   const rank=(name,q)=>{if(!q)return 4;const n=streetNorm(name);if(n===q)return 0;if(n.startsWith(q))return 1;if(n.split(' ').some(w=>w.startsWith(q)))return 2;if(n.includes(q))return 3;return 4};
   const draw=()=>{
     const q=streetNorm(input.value);
     const hits=sorted.slice().sort((a,b)=>{const ra=rank(a.name,q),rb=rank(b.name,q);return ra-rb||a.name.localeCompare(b.name,'vi')});
     box.innerHTML=hits.map((x,i)=>`<button type="button" class="fg-street-option ${i===0?'active':''}" data-street="${esc(x.name)}"><b>${esc(x.name)}</b></button>`).join('');
     box.classList.toggle('show',hits.length>0&&(document.activeElement===input||q.length>0));
     box.scrollTop=0;
   };
   input.addEventListener('input',draw);input.addEventListener('focus',draw);
   input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const hit=resolveStreetChoice(input.value);if(hit){input.value=hit.name;box.classList.remove('show');onPick(hit.name)}}});
   box.addEventListener('click',e=>{const b=e.target.closest('[data-street]');if(!b)return;input.value=b.dataset.street;box.classList.remove('show');onPick(b.dataset.street)});
   document.addEventListener('click',e=>{if(e.target!==input&&!box.contains(e.target))box.classList.remove('show')});
 }
 function applyAnalysisStreet(){const hit=resolveStreetChoice($('fg3StreetInput')?.value);if(!hit){window.fg51Toast?.('Không tìm thấy tuyến trong dữ liệu FloodGuard');return false}sel.value=hit.name;updateRoad(hit.name);hideAnalyzeResults();return true}
 renderStreetPicker('fg3StreetInput','fg3StreetInputSuggest',st=>{sel.value=st;updateRoad(st);hideAnalyzeResults()});
 $('fg3StreetUse')?.addEventListener('click',applyAnalysisStreet);
 window.FG3StreetAPI={getCurrent:()=>current,select:(st,open=false)=>{const hit=resolveStreetChoice(st);if(!hit)return false;sel.value=hit.name;updateRoad(hit.name);hideAnalyzeResults();if(open)openDrawer();return true},list:()=>sorted.map(x=>x.name),resolve:q=>resolveStreetChoice(q)?.name||null};
 function openDrawer(){sel.value=current;if($('fg3StreetInput'))$('fg3StreetInput').value=current;$('fg3Rain').value=scenarioRain;hideAnalyzeResults();const sc=$('fg3Drawer')?.querySelector('.fg3-scroll');if(sc)sc.scrollTop=0;$('fg3Drawer').classList.add('open')}
 function closePanels(){ $('fg3Drawer').classList.remove('open');$('fg3Overview').classList.remove('show');$('fg3StationPanel').classList.remove('show');$('fg3Layers').classList.remove('show') }
 function hideAnalyzeResults(){
   $('fg3ResultStart')?.classList.add('fg3-analysis-hidden');
   $('fg3ResultWrap')?.classList.add('fg3-analysis-hidden');
 }
 function revealAnalyzeResults(){
   const drawer=$('fg3Drawer');
   const sc=drawer?drawer.querySelector('.fg3-scroll'):null;
   const anchor=$('fg3ResultStart');
   const wrap=$('fg3ResultWrap');
   anchor?.classList.remove('fg3-analysis-hidden');
   wrap?.classList.remove('fg3-analysis-hidden');
   if(sc&&anchor){
     const top=Math.max(0,anchor.offsetTop-10);
     try{sc.scrollTo({top,behavior:'smooth'})}catch(e){sc.scrollTop=top}
   }

 }
 function runDrawerAnalysis(){
   const btn=$('fg3Run');
   if(btn){btn.disabled=true;btn.classList.add('is-running');btn.textContent='Đang phân tích…'}
   setTimeout(()=>{
     try{analyze();revealAnalyzeResults();}
     finally{if(btn){btn.disabled=false;btn.classList.remove('is-running');btn.textContent='Đánh giá trạm sạc'}}
   },0);
 }
 $('fg3AnalyzeBtn').onclick=openDrawer;$('fg3QuickAnalyze').onclick=openDrawer;$('fg3Run').onclick=runDrawerAnalysis;$('fg3Close').onclick=()=> $('fg3Drawer').classList.remove('open');sel.onchange=()=>{current=sel.value;updateRoad(current);hideAnalyzeResults();};
 $('fg3OverviewBtn').onclick=()=>{const p=$('fg3Overview');const on=!p.classList.contains('show');closePanels();p.classList.toggle('show',on)};$('fg3MapBtn').onclick=closePanels;$('fg3StationBtn').onclick=openStationPanel;$('fg3StationClose').onclick=closePanels;document.querySelectorAll('.fg3-station-tab').forEach(b=>b.onclick=()=>{stationFilter=b.dataset.stationFilter;renderStationPanel()});document.querySelectorAll('[data-station-context]').forEach(b=>b.onclick=()=>{stationContext=b.dataset.stationContext||'start';renderStationPanel()});$('fg3StationList').onclick=e=>{const b=e.target.closest('[data-station-focus]');if(!b)return;const st=stationCatalog.find(x=>x.key===b.dataset.stationFocus);if(st)focusGaugeStation(st)};$('fg3ShowAllStations').onclick=()=>{closePanels();[rainAutoLayer,rainRegLayer,rainMasterLayer].forEach(l=>{if(!map.hasLayer(l))map.addLayer(l)});const coords=stationCatalog.map(s=>[s.lat,s.lon]);if(coords.length)map.fitBounds(L.latLngBounds(coords),{padding:[70,70]})};$('fg3FocusBtn').onclick=()=>focusRoad(true);$('fg3ResetBtn').onclick=()=>document.getElementById('homeBtn').click();$('fg3BaseBtn').onclick=()=>document.getElementById('baseBtn').click();$('fg3EVBtn').onclick=()=>{closePanels();if($('fg4EvRiskStreet')&&!$('fg4EvRiskStreet').value)$('fg4EvRiskStreet').value=current;map.setView([10.78,106.72],10);[evBase,evLow,evMed,evHigh].forEach(l=>{if(!map.hasLayer(l))map.addLayer(l)})};
 $('fg3LayerBtn').onclick=()=>{$('fg3Layers').classList.toggle('show')};document.querySelectorAll('#fg3Layers input').forEach(i=>i.onchange=()=>{const on=i.checked;if(i.dataset.layer==='ev')[evBase,evLow,evMed,evHigh].forEach(l=>on?map.addLayer(l):map.removeLayer(l));if(i.dataset.layer==='rain'){[rainAutoLayer,rainMasterLayer].forEach(l=>on?map.addLayer(l):map.removeLayer(l));if(!on)map.removeLayer(rainRegLayer)};if(i.dataset.layer==='core')on?map.addLayer(coreLayer):map.removeLayer(coreLayer);if(i.dataset.layer==='street')on?map.addLayer(streetLayer):map.removeLayer(streetLayer)});
 document.querySelectorAll('#fg3Presets .fg3-chip').forEach(b=>b.onclick=()=>setRain(b.dataset.rain));
 const search=$('fg3Search'),res=$('fg3Results');function showSearch(){const q=search.value.trim().toLocaleLowerCase('vi');res.innerHTML='';if(!q){res.classList.remove('show');return}const hits=sorted.filter(x=>x.name.toLocaleLowerCase('vi').includes(q)).slice(0,10);hits.forEach(x=>{const d=document.createElement('div');d.className='fg3-result';d.innerHTML=`<b>${esc(x.name)}</b>`;d.onclick=()=>{search.value='';res.classList.remove('show');updateRoad(x.name)};res.appendChild(d)});res.classList.toggle('show',hits.length>0)}search.oninput=showSearch;search.onfocus=showSearch;document.addEventListener('click',e=>{if(!e.target.closest('.fg3-search')&&!e.target.closest('.fg3-results'))res.classList.remove('show')});
 $('fg3OpenFull').onclick=()=>{ $('fg3Drawer').classList.remove('open');fcStreet.value=current;fcRain.value=scenarioRain;forecastPanel.classList.add('fg3-full-open','open');forecastPanel.setAttribute('aria-hidden','false');runAnalysis();};forecastClose.addEventListener('click',()=>{forecastPanel.classList.remove('fg3-full-open');});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanels()});
 window.FG62OpenStreetDetail=function(st,rain){
   if(!STREET_CATALOG.some(x=>x.name===st))return false;
   current=st; scenarioRain=Math.max(0,Number(rain)||scenarioRain||100); sel.value=st; $('fg3Rain').value=scenarioRain; updateRoad(st); hideAnalyzeResults(); $('fg3Drawer').classList.add('open'); return true;
 };
 updateRoad(current);setRain(100);setTimeout(()=>map.invalidateSize(),250);
})();
