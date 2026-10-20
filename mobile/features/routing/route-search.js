
(function(){
 const $=id=>document.getElementById(id);
 const panel=$('fg3RoutePanel'), status=$('fg3RouteStatus'), results=$('fg3RouteResults');
 if(!panel||!window.L||typeof map==='undefined') return;
 const routeLayer=L.layerGroup().addTo(map), routePointLayer=L.layerGroup().addTo(map);
 let startPoint=null,endPoint=null,pickMode=null,lastRoutes=[],recommendedIndex=null,selectedIndex=null,travelMode='car',routePreference='safe',autoRunTimer=null,routeRequestSeq=0,routeSessionReady=false,routeRunController=null;
 const ROUTE_MODES={
   car:{icon:'🚗',label:'Ô tô',key:'car',color:'#1a73e8',endpoints:[{name:'OSRM',url:'https://router.project-osrm.org/route/v1/driving/'},{name:'OpenStreetMap DE',url:'https://routing.openstreetmap.de/routed-car/route/v1/driving/'}],note:'Tuyến ô tô; thời gian chỉ hiển thị khi có dữ liệu giao thông.'},
   motorbike:{icon:'🛵',label:'Xe máy',key:'motorbike',color:'#7c3aed',endpoints:[{name:'OSRM',url:'https://router.project-osrm.org/route/v1/driving/'},{name:'OpenStreetMap DE',url:'https://routing.openstreetmap.de/routed-car/route/v1/driving/'}],note:'Tuyến xe máy theo chế độ riêng của dịch vụ; hạn chế đường phụ thuộc dữ liệu bản đồ.'},
   walk:{icon:'🚶',label:'Đi bộ',key:'walk',color:'#059669',endpoints:[{name:'OpenStreetMap DE Foot',url:'https://routing.openstreetmap.de/routed-foot/route/v1/driving/'}],note:'Tuyến đi bộ theo mạng đường dành cho người đi bộ. FloodGuard đánh giá nguy cơ ngập riêng.'}
 };
 const suggestState={from:null,to:null};
 function closeOtherPanels(){['fg3Drawer','fg3Overview','fg3StationPanel','fg3Layers'].forEach(id=>{const e=$(id);if(e)e.classList.remove('open','show')})}
 function showStatus(html,type=''){status.className='fg3-route-status'+(type?' '+type:'');status.innerHTML=html}
 function setRouteTools(show){const e=$('fg80RouteTools');if(e)e.hidden=!show}
 function cancelPendingRoute(){window.FGRouteMotion?.cancel(map);routeRequestSeq++;routeRunController?.abort();routeRunController=null;clearTimeout(autoRunTimer);autoRunTimer=null;const b=$('fg3RouteRun');if(b){b.disabled=false;b.removeAttribute('aria-busy')}}
 function clearRouteVisuals({points=false,statusToo=false}={}){routeLayer.clearLayers();lastRoutes=[];recommendedIndex=selectedIndex=null;routeSessionReady=false;results.innerHTML='';const s=$('fg3RouteSummary');if(s)s.style.display='none';setRouteTools(false);if(points){routePointLayer.clearLayers();startPoint=endPoint=null}if(statusToo&&status){status.innerHTML='';status.style.display='none'}}
 function invalidateEndpoint(which){cancelPendingRoute();if(which==='from')startPoint=null;else if(which==='to')endPoint=null;clearRouteVisuals();drawEndpointMarkers();}
 function openPanel(){closeOtherPanels();panel.classList.add('show');$('fg3RouteBtn')?.classList.add('active')}
 function closePanel(){panel.classList.remove('show');$('fg3RouteBtn')?.classList.remove('active');setPickMode(null);hideSuggestions()}
 $('fg3RouteBtn').onclick=()=>{const on=!panel.classList.contains('show');if(on)openPanel();else closePanel()};$('fg3RouteClose').onclick=closePanel;
 ['fg3OverviewBtn','fg3MapBtn','fg3StationBtn','fg3AnalyzeBtn','fg3EVBtn'].forEach(id=>$(id)?.addEventListener('click',()=>{panel.classList.remove('show');$('fg3RouteBtn')?.classList.remove('active');setPickMode(null);hideSuggestions()}));
 function updateModeUI(announce=false){
   const cfg=ROUTE_MODES[travelMode]||ROUTE_MODES.car;
   document.querySelectorAll('#fg3RouteModebar [data-route-mode]').forEach(b=>{const active=b.dataset.routeMode===travelMode;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false')});
   const runBtn=$('fg3RouteRun');if(runBtn)runBtn.textContent='Đường đi';
   if(announce){

   }
 }
 function hasRouteEndpoints(){
   const from=String($('fg3RouteFrom')?.value||'').trim(),to=String($('fg3RouteTo')?.value||'').trim();
   return !!((startPoint&&endPoint)||(from&&to));
 }
 function setTravelMode(m,announce=true){
   if(!ROUTE_MODES[m])return false;
   const changed=travelMode!==m,wasPending=!!routeRunController;
   if(changed)cancelPendingRoute();
   travelMode=m;updateModeUI(false);
   const cfg=ROUTE_MODES[travelMode];
   if(announce){
     if(changed && (routeSessionReady||wasPending) && hasRouteEndpoints()){

       clearTimeout(autoRunTimer);autoRunTimer=setTimeout(()=>run(true),120);
     }else if(hasRouteEndpoints()){

     }else{
       routeLayer.clearLayers();routePointLayer.clearLayers();lastRoutes=[];selectedIndex=null;recommendedIndex=null;results.innerHTML='';$('fg3RouteSummary').style.display='none';

     }
   }
   return changed;
 }
 window.FG49SetRouteMode=setTravelMode;
 const modebar=$('fg3RouteModebar');
 if(modebar){
   modebar.addEventListener('click',ev=>{const b=ev.target.closest('[data-route-mode]');if(!b)return;ev.preventDefault();ev.stopPropagation();setTravelMode(b.dataset.routeMode,true)});
   modebar.addEventListener('keydown',ev=>{if(!['ArrowLeft','ArrowRight'].includes(ev.key))return;const buttons=[...modebar.querySelectorAll('[data-route-mode]')];let i=buttons.findIndex(b=>b.dataset.routeMode===travelMode);i=(i+(ev.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[i].focus();setTravelMode(buttons[i].dataset.routeMode,true)});
 }
 updateModeUI(false);
 const prefbar=$('fg62Prefbar');
 function recommendedFor(analyses){
   const known=analyses.filter(a=>a.riskLevel&&a.riskLevel!=='UNKNOWN'),ranked=[...(routePreference==='safe'&&known.length?known:analyses)];
   if(routePreference==='safe'&&!known.length)return ranked.sort((a,b)=>a.distance-b.distance)[0];
   if(routePreference==='fast')ranked.sort((x,y)=>analyses.every(window.FGRouteHasETA)?x.duration-y.duration||x.riskIndex-y.riskIndex||x.distance-y.distance:x.distance-y.distance||x.riskIndex-y.riskIndex);
   else ranked.sort((x,y)=>x.riskIndex-y.riskIndex||x.duration-y.duration||x.distance-y.distance);
   return ranked[0];
 }
 function applyPreference(pref){
   if(!['safe','fast'].includes(pref))return;
   routePreference=pref; document.querySelectorAll('[data-route-pref]').forEach(b=>b.classList.toggle('active',b.dataset.routePref===pref));
   if(lastRoutes.length){const rec=recommendedFor(lastRoutes);recommendedIndex=rec.index;selectedIndex=rec.index;drawRoutes(lastRoutes,selectedIndex,true);renderResults(lastRoutes,rec,Math.max(0,Number($('fg3RouteRain').value)||0));updateRouteSummary(lastRoutes,rec);if(window.FG70_ROUTE_STATE!==undefined)fg70Publish();}
 }
 prefbar?.addEventListener('click',e=>{const b=e.target.closest('[data-route-pref]');if(b)applyPreference(b.dataset.routePref)});
 function normalizeName(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/\bduong\b/g,' ').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
 const streetNorm=STREET_CATALOG.map(x=>({name:x.name,n:normalizeName(x.name)})).filter(x=>x.n.length>=5&&!/^d\d+$/.test(x.n));
 function matchStreet(stepName){const n=normalizeName(stepName);if(!n)return null;let best=null;for(const s of streetNorm){if(n.includes(s.n)||s.n.includes(n)){if(!best||s.n.length>best.n.length)best=s}}return best?.name||null}
 function streetHazard(street,rain){
   const c=typeof catalog==='function'?catalog(street):(STREET_CATALOG.find(x=>x.name===street)||{}),rows=FORECAST_EVENTS.filter(x=>x.street===street&&x.rain!=null&&x.depth!=null&&String(x.rain).trim()!==''&&String(x.depth).trim()!==''&&Number.isFinite(Number(x.rain))&&Number.isFinite(Number(x.depth)));
   if(rows.length>=2){
     const vals=rows.map(x=>Number(x.rain)).filter(Number.isFinite),mn=Math.min(...vals),mx=Math.max(...vals);
     if(rain>mx)return {score:3,label:'Ngoài phạm vi lịch sử',detail:`${fmt1(rain)} mm vượt mức lớn nhất ${fmt1(mx)} mm đã quan sát; không dự báo số cm.`,depth:null,valid:false};
     if(rain<mn)return {score:1,label:'Thấp hơn mẫu ngập lịch sử',detail:`${fmt1(rain)} mm thấp hơn mức thấp nhất ${fmt1(mn)} mm trong mẫu ngập của tuyến.`,depth:null,valid:false};
     const sg=signal(rain,rows),an=analogue(rain,rows);return {score:sg.score,label:sg.score>=3?'Nguy cơ cao':sg.score===2?'Cần chú ý':'Rủi ro thấp hơn',detail:sg.note,depth:an?.depth??null,valid:true};
   }
   if(c.recurrence_2026)return {score:2,label:'Có bằng chứng tái diễn 2026',detail:'Có trong bối cảnh/danh mục ngập chính thức 2026 nhưng chưa đủ dữ liệu mưa–ngập để dự báo số cm.',depth:null,valid:false};
   if((c.occurrence_rows||0)>0)return {score:1,label:'Từng có bằng chứng ngập',detail:'Có bằng chứng lịch sử nhưng chưa đủ dữ liệu định lượng cho kịch bản mưa này.',depth:null,valid:false};
   return {score:0,label:'Chưa có bằng chứng trong dataset',detail:'Không có bằng chứng ngập đã liên kết trong bộ dữ liệu hiện tại.',depth:null,valid:false};
 }
 function setPickMode(mode){pickMode=mode;['fg3PickFrom','fg3PickTo'].forEach(id=>$(id)?.classList.remove('active'));$('fg3RouteSelectHint')?.classList.toggle('show',!!mode);if(mode){$(mode==='from'?'fg3PickFrom':'fg3PickTo')?.classList.add('active');$('fg3RouteSelectHint').textContent=mode==='from'?'Click lên bản đồ để chọn ĐIỂM ĐI':'Click lên bản đồ để chọn ĐIỂM ĐẾN';map.getContainer().style.cursor='crosshair'}else map.getContainer().style.cursor=''}
 $('fg3PickFrom').onclick=()=>setPickMode(pickMode==='from'?null:'from');$('fg3PickTo').onclick=()=>setPickMode(pickMode==='to'?null:'to');
 map.on('click',e=>{if(!pickMode)return;const p={lat:e.latlng.lat,lon:e.latlng.lng,label:`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`};cancelPendingRoute();if(pickMode==='from'){startPoint=p;$('fg3RouteFrom').value=p.label}else{endPoint=p;$('fg3RouteTo').value=p.label}clearRouteVisuals();setPickMode(null);drawEndpointMarkers()});
 function endpointIcon(letter,color){return L.divIcon({className:'',html:`<div style="width:25px;height:25px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.30);display:grid;place-items:center;color:white;font-size:9px;font-weight:900">${letter}</div>`,iconSize:[25,25],iconAnchor:[12,12]})}
 function drawEndpointMarkers(){routePointLayer.clearLayers();if(startPoint)L.marker([startPoint.lat,startPoint.lon],{icon:endpointIcon('A','#2563eb')}).bindPopup(`<b>Điểm đi</b><br>${esc(startPoint.label||'')}`).addTo(routePointLayer);if(endPoint)L.marker([endPoint.lat,endPoint.lon],{icon:endpointIcon('B','#ef4444')}).bindPopup(`<b>Điểm đến</b><br>${esc(endPoint.label||'')}`).addTo(routePointLayer);try{fg70Publish()}catch(e){}}
 $('fg3UseCurrentRoad').onclick=()=>{const st=document.getElementById('fg3RoadName')?.textContent?.trim();const p=typeof localRoadPoint==='function'?localRoadPoint(st):STREETS.find(x=>x.name===st);cancelPendingRoute();clearRouteVisuals();if(p){startPoint={lat:p.lat,lon:p.lon,label:st};$('fg3RouteFrom').value=st;drawEndpointMarkers();showStatus(`Đã dùng <b>${esc(st)}</b> làm điểm đi.`,'ok')}else{$('fg3RouteFrom').value=st||$('fg3RouteFrom').value;startPoint=null;drawEndpointMarkers();showStatus('Tuyến đang chọn chưa có tọa độ cục bộ; app sẽ thử định vị khi tìm đường.')}};
 document.querySelectorAll('[data-route-rain]').forEach(b=>b.onclick=()=>{const v=b.dataset.routeRain;$('fg3RouteRain').value=v;document.querySelectorAll('[data-route-rain]').forEach(x=>x.classList.toggle('active',x===b));if(lastRoutes.length)window.FG70ReassessRain?.(v)});
 $('fg3RouteSwap').onclick=()=>{
   const swapBtn=$('fg3RouteSwap'),from=$('fg3RouteFrom'),to=$('fg3RouteTo');if(!from||!to)return;
   const hadRoute=routeSessionReady||lastRoutes.length>0;cancelPendingRoute();hideSuggestions();
   const fv=from.value,tv=to.value,tp=startPoint;startPoint=endPoint;endPoint=tp;from.value=tv;to.value=fv;
   from.classList.remove('fg80-invalid');to.classList.remove('fg80-invalid');drawEndpointMarkers();
   routeSessionReady=false;lastRoutes=[];recommendedIndex=selectedIndex=null;routeLayer.clearLayers();results.innerHTML='';$('fg3RouteSummary').style.display='none';setRouteTools(false);
   swapBtn?.classList.remove('fg80-swapping');void swapBtn?.offsetWidth;swapBtn?.classList.add('fg80-swapping');setTimeout(()=>swapBtn?.classList.remove('fg80-swapping'),380);
   if(hadRoute&&hasRouteEndpoints())setTimeout(()=>run(false),90);
 };
 async function searchPlaces(q){return await window.FG81_NET.searchPlaces(q)}
 function hideSuggestions(){['fg3SuggestFrom','fg3SuggestTo'].forEach(id=>$(id)?.classList.remove('show'))}
 function shortPlace(x){const d=String(x.display_name||'');const parts=d.split(',').map(s=>s.trim()).filter(Boolean);return {title:parts.slice(0,2).join(', '),sub:parts.slice(2,5).join(', ')}}
 function bindSuggest(inputId,boxId,which){
   const input=$(inputId),box=$(boxId);let timer=null,seq=0;
   input.addEventListener('input',()=>{['fg3SuggestFrom','fg3SuggestTo'].forEach(id=>{if(id!==boxId)$(id)?.classList.remove('show')});if(which==='from')startPoint=null;else endPoint=null;clearTimeout(timer);const q=input.value.trim(),my=++seq;if(q.length<3){box.classList.remove('show');box.innerHTML='';return}timer=setTimeout(async()=>{box.innerHTML='<div class="fg3-route-suggest-item">Đang tìm…</div>';box.classList.add('show');let data=[];try{data=await searchPlaces(q)}catch(e){}if(my!==seq||input.value.trim()!==q)return;if(!data.length){box.innerHTML='<div class="fg3-route-suggest-item">Không tìm thấy gợi ý phù hợp.</div>';return}box.innerHTML=data.map((x,i)=>{const s=shortPlace(x);return `<div class="fg3-route-suggest-item" data-i="${i}"><b>${esc(s.title||x.display_name)}</b><span>${esc(s.sub||'TP.HCM')}</span></div>`}).join('');box.querySelectorAll('[data-i]').forEach(el=>el.onclick=e=>{e.stopPropagation();++seq;clearTimeout(timer);const x=data[Number(el.dataset.i)],pt={lat:Number(x.lat),lon:Number(x.lon),label:x.display_name};if(which==='from')startPoint=pt;else endPoint=pt;input.value=shortPlace(x).title||x.display_name;cancelPendingRoute();routeSessionReady=false;lastRoutes=[];recommendedIndex=selectedIndex=null;routeLayer.clearLayers();results.innerHTML='';$('fg3RouteSummary').style.display='none';setRouteTools(false);input.classList.remove('fg80-invalid');box.classList.remove('show');drawEndpointMarkers()})},450)});
   input.addEventListener('focus',()=>{['fg3SuggestFrom','fg3SuggestTo'].forEach(id=>{if(id!==boxId)$(id)?.classList.remove('show')});if(box.innerHTML)box.classList.add('show')});
 }
 bindSuggest('fg3RouteFrom','fg3SuggestFrom','from');bindSuggest('fg3RouteTo','fg3SuggestTo','to');
 ['fg3RouteFrom','fg3RouteTo'].forEach(id=>{const input=$(id);if(!input)return;input.addEventListener('input',()=>{invalidateEndpoint(id==='fg3RouteFrom'?'from':'to');input.classList.remove('fg80-invalid')});input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();hideSuggestions();run(false)}})});
 document.addEventListener('click',e=>{if(!e.target.closest('.fg3-route-field'))hideSuggestions()});
 async function geocode(q){const raw=String(q||'').trim();const m=raw.match(/^(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)$/);if(m)return {lat:Number(m[1]),lon:Number(m[2]),label:raw};const data=await searchPlaces(raw);if(!data.length)throw new Error(`Không tìm thấy địa điểm: ${raw}`);const x=data[0];return {lat:Number(x.lat),lon:Number(x.lon),label:x.display_name||raw}}
 async function resolvePoints(request){const from=$('fg3RouteFrom'),to=$('fg3RouteTo');from?.classList.remove('fg80-invalid');to?.classList.remove('fg80-invalid');const fromText=String(from?.value||'').trim(),toText=String(to?.value||'').trim();if(!fromText){from?.classList.add('fg80-invalid');throw Error('Hãy nhập điểm đi.')}if(!toText){to?.classList.add('fg80-invalid');throw Error('Hãy nhập điểm đến.')}const [a,b]=await Promise.all([startPoint?Promise.resolve(startPoint):geocode(fromText),endPoint?Promise.resolve(endPoint):geocode(toText)]);if(request!==routeRequestSeq||from.value.trim()!==fromText||to.value.trim()!==toText){const e=Error('Yêu cầu đã thay đổi');e.name='AbortError';throw e}if(!Number.isFinite(a?.lat)||!Number.isFinite(a?.lon)||!Number.isFinite(b?.lat)||!Number.isFinite(b?.lon))throw Error('Tọa độ điểm đi hoặc điểm đến không hợp lệ.');startPoint=a;endPoint=b;drawEndpointMarkers();return [a,b]}
 function analyzeRoute(route,rain,index){
   const matched=[];let riskIndex=0,highN=0,medN=0,highKm=0,medKm=0;
   const steps=(route.legs||[]).flatMap(l=>l.steps||[]);
   steps.forEach((step,si)=>{const street=matchStreet(step.name);if(!street)return;const hz=streetHazard(street,rain),km=Math.max(.08,(Number(step.distance)||0)/1000);riskIndex+=hz.score*km;if(hz.score>=3){highN++;highKm+=km}else if(hz.score>=2){medN++;medKm+=km}matched.push({street,hz,step,si,km})});
   const unique=[],seen=new Set();matched.sort((a,b)=>b.hz.score-a.hz.score||b.km-a.km).forEach(x=>{if(!seen.has(x.street)){seen.add(x.street);unique.push(x)}});
   const evidenceSteps=steps.filter(st=>Number(st.distance)>0),unknownSteps=evidenceSteps.filter(st=>!matched.some(x=>x.step===st&&x.hz.valid)).length;
   const riskLevel=!evidenceSteps.length||unknownSteps?'UNKNOWN':highN?'HIGH':medN?'MEDIUM':'LOW';
   const via=[];for(const st of steps){const name=String(st.name||'').trim();if(name&&!via.includes(name))via.push(name);if(via.length>=3)break}
   return {route,index,travelMode:route.travelMode||travelMode,routingProvider:route.routingProvider||'TomTom',etaType:route.etaType,fetchedAt:route.fetchedAt,modeBeta:route.modeBeta,riskLevel,unknownSteps,riskIndex,highN,medN,highKm,medKm,exposureKm:highKm+medKm,matched,unique,distance:route.distance/1000,duration:Number.isFinite(route.duration)?route.duration/60:null,steps,via};
 }
 function riskLabel(a){if(a.riskLevel==='UNKNOWN'||!a.unique?.length)return ['Chưa đủ thông tin','unknown'];if(a.highN>0)return ['Nguy cơ cao','high'];if(a.medN>0)return ['Cần chú ý','med'];if(a.unique.length)return ['Có tiền lệ ngập','low'];return ['Chưa đủ thông tin','unknown']}
 function updateRouteSummary(analyses,recommended){
   const box=$('fg3RouteSummary');if(!box)return;box.style.display='grid';$('fg3RouteCount').textContent=analyses.length;$('fg3RouteRiskRoads').textContent=recommended?recommended.unique.filter(x=>x.hz.score>=2).length:'—';$('fg3RouteRainShow').textContent=`${fmt1(Math.max(0,Number($('fg3RouteRain').value)||0))} mm`;
 }
 function drawRoutes(analyses,selIdx,fit=true){
   routeLayer.clearLayers();const selected=analyses.find(a=>a.index===selIdx)||analyses[0];
   analyses.filter(a=>a.index!==selected.index).forEach(a=>{const coords=a.route.geometry.coordinates.map(c=>[c[1],c[0]]);L.polyline(coords,{color:'#aeb8c2',weight:5,opacity:.58,lineCap:'round'}).bindTooltip(`${window.FGRouteTime(a)} · ${fmt1(a.distance)} km`).on('click',()=>selectRoute(a.index)).addTo(routeLayer)});
   const cfg=ROUTE_MODES[travelMode]||ROUTE_MODES.car;const coords=selected.route.geometry.coordinates.map(c=>[c[1],c[0]]);L.polyline(coords,{className:'fg-route-reveal',color:cfg.color,weight:7,opacity:.96,lineCap:'round',attribution:selected.routingProvider==='TomTom'?'© TomTom':'© OpenStreetMap contributors'}).bindTooltip(`${cfg.icon} ${cfg.label} · ${window.FGRouteTime(selected)} · ${fmt1(selected.distance)} km`).addTo(routeLayer);
   selected.matched.forEach(m=>{if(m.hz.score<2||!m.step.geometry?.coordinates)return;const sc=m.step.geometry.coordinates.map(c=>[c[1],c[0]]);L.polyline(sc,{color:m.hz.score>=3?'#ef4444':'#f59e0b',weight:10,opacity:.92,lineCap:'round'}).bindPopup(`<div class="p-title">${m.hz.score>=3?'⚠':'◉'} ${esc(m.street)}</div><div class="p-sub"><b>${esc(m.hz.label)}</b><br>${esc(m.hz.detail)}${Number.isFinite(m.hz.depth)?`<br><b>Độ ngập tham chiếu:</b> ${fmt1(m.hz.depth)} cm`:''}<br><b>Đoạn route:</b> ${fmt1(m.km)} km</div>`).addTo(routeLayer)});
   if(fit&&coords.length){const routeBounds=L.latLngBounds(coords);if(window.FGRouteMotion)window.FGRouteMotion.focus(map,routeBounds,panel);else map.fitBounds(routeBounds,{padding:[70,70]});}
 }
 function instructionText(step){const m=step.maneuver||{},name=step.name||'đường tiếp theo';const type=m.type||'';if(type==='depart')return `Bắt đầu theo ${name}`;if(type==='arrive')return 'Đến điểm đến';if(type==='turn')return `${m.modifier?.includes('left')?'Rẽ trái':m.modifier?.includes('right')?'Rẽ phải':'Rẽ'} vào ${name}`;if(type==='roundabout'||type==='rotary')return `Đi qua vòng xoay vào ${name}`;if(type==='merge')return `Nhập vào ${name}`;if(type==='fork')return `Đi theo nhánh vào ${name}`;if(type==='continue')return `Tiếp tục trên ${name}`;return `${name}`}
 function renderResults(analyses,recommended,rain){
   const cfg=ROUTE_MODES[travelMode]||ROUTE_MODES.car;
   const selected=analyses.find(a=>a.index===selectedIndex)||recommended;
   document.querySelectorAll('[data-route-pref="fast"]').forEach(b=>{b.textContent=analyses.every(window.FGRouteHasETA)?'⚡ Nhanh nhất':'↔ Ngắn nhất'});
   const hasETA=analyses.every(window.FGRouteHasETA);
   results.innerHTML=window.FGRouteSourcePanel(startPoint,endPoint,travelMode,selected.routingProvider,selected)+analyses.map(a=>{
     const [lab,cls]=riskLabel(a),rec=a.index===recommended.index,sel=a.index===selected.index;
     const via=a.via.length?`Qua ${a.via.map(esc).join(' → ')}`:'Theo lộ trình được đề xuất';
     const riskText=a.riskLevel==='UNKNOWN'?'Chưa đủ thông tin cho toàn tuyến':a.highN?`${a.highN} đoạn nguy cơ cao`:a.medN?`${a.medN} đoạn cần chú ý`:a.unique.length?`${a.unique.length} tuyến có tiền lệ ngập`:'Chưa phát hiện tuyến ngập đã ghép trong dataset';
     const exposure=a.exposureKm>0?`<span class="fg62-exposure">⚠ ${fmt1(a.exposureKm)} km cần chú ý</span>`:'';
     const streets=a.unique.slice(0,5).map(x=>`<button type="button" class="fg62-streetbtn" data-street-detail="${esc(x.street)}">${x.hz.score>=3?'⚠':x.hz.score>=2?'◉':'•'} ${esc(x.street)}</button>`).join('');
     const steps=a.steps.slice(0,12).map((st,i)=>`<div class="fg3-route-step"><span class="fg3-route-step-no">${i+1}</span><div><b>${esc(instructionText(st))}</b><small>${st.name?esc(st.name):''}</small></div><span>${st.distance>=1000?fmt1(st.distance/1000)+' km':Math.round(st.distance)+' m'}</span></div>`).join('');
     const recPrefix=rec?(a.riskLevel==='UNKNOWN'?'↔ Tuyến tham khảo · ':routePreference==='safe'?'✓ Ít nguy cơ ngập hơn · ':(hasETA?'⚡ Nhanh nhất · ':'↔ Ngắn nhất · ')):'';
     const badge=a.riskLevel==='UNKNOWN'?'CHƯA ĐỦ THÔNG TIN':rec?(routePreference==='safe'?'ÍT NGẬP HƠN':(hasETA?'NHANH NHẤT':'NGẮN NHẤT')):lab;
     return `<div class="fg3-route-card ${rec&&a.riskLevel!=='UNKNOWN'?'recommended':''} ${sel?'selected':''}" data-route-index="${a.index}"><div class="fg3-route-card-head"><div><div style="margin-bottom:5px"><span class="fg49-modepill ${travelMode==='motorbike'?'motorbike':travelMode==='walk'?'walk':''}">${cfg.icon} ${cfg.label}${travelMode==='motorbike'&&a.modeBeta?' · TomTom beta':''}</span></div><div class="fg3-route-card-time">${window.FGRouteTime(a)}</div><div class="fg3-route-cardmeta"><span>${fmt1(a.distance)} km</span>${exposure}</div><div class="fg3-route-card-route">${via}</div><span class="fg3-route-riskpill ${cls}">${recPrefix}${riskText}</span>${streets?`<div class="fg62-streets">${streets}</div>`:''}</div><span class="fg3-route-badge ${rec&&a.riskLevel!=='UNKNOWN'?'best':cls}">${badge}</span></div><div class="fg62-route-extra"><button class="fg3-route-detailbtn" data-detail="${a.index}">☰ Chỉ dẫn từng chặng</button><button class="fg62-route-action ev" data-ev-near="${a.index}">⚡ Trạm sạc gần điểm đến</button></div><div class="fg3-route-steps" id="fg3Steps${a.index}">${steps}${a.steps.length>12?`<div class="fg3-route-empty">+ ${a.steps.length-12} bước khác</div>`:''}</div></div>`
   }).join('');
   results.querySelectorAll('[data-route-index]').forEach(card=>card.onclick=e=>{if(e.target.closest('[data-detail],[data-street-detail],[data-ev-near]'))return;selectRoute(Number(card.dataset.routeIndex))});
   results.querySelectorAll('[data-detail]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const box=$(`fg3Steps${btn.dataset.detail}`);box?.classList.toggle('show');btn.textContent=box?.classList.contains('show')?'▲ Ẩn chỉ dẫn':'☰ Chỉ dẫn từng chặng'});
   results.querySelectorAll('[data-street-detail]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();panel.classList.remove('show');$('fg3RouteBtn')?.classList.remove('active');window.FG62OpenStreetDetail?.(btn.dataset.streetDetail,rain)});
   results.querySelectorAll('[data-ev-near]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();if(endPoint)window.FG62FindSaferEV?.(endPoint,endPoint.label||$('fg3RouteTo').value)});
   setRouteTools(analyses.length>0);
 }
 function selectRoute(idx,selectionSource='user'){selectedIndex=idx;if(selectionSource==='user'&&window.FGAnalyticsRouteAttempt)window.FGAnalytics?.emit('route_option_selected',{option_index:Number(idx),road_ids:window.FGAnalytics.roadIds((lastRoutes.find(a=>a.index===idx)?.unique||[]).map(x=>x.street))},window.FGAnalyticsRouteAttempt,'choice:'+window.FGAnalyticsRouteAttempt+':'+idx);drawRoutes(lastRoutes,idx,true);const recommended=lastRoutes.find(a=>a.index===recommendedIndex)||recommendedFor(lastRoutes);renderResults(lastRoutes,recommended,Math.max(0,Number($('fg3RouteRain').value)||0));updateRouteSummary(lastRoutes,recommended);if(window.FG70_ROUTE_STATE!==undefined)fg70Publish()}
 function fg19MobileMapReveal(){
   if(document.documentElement.classList.contains('fg-compact-app')&&document.documentElement.classList.contains('fg-destination-flow'))return false;
   const preview=document.documentElement.dataset.fgPreviewMode||'';
   const forced=document.documentElement.dataset.fgDisplayMode||'auto';
   const mobile=(preview==='mobile')||(preview!=='desktop'&&forced!=='desktop'&&window.innerWidth<=700)||document.body.classList.contains('fg-mobile-production');
   if(!mobile)return false;
   closePanel();
   document.querySelectorAll('#fg12MobileNav button').forEach(b=>b.classList.remove('active'));
   try{map.invalidateSize({pan:false});}catch(e){}
   window.fg51Toast?.('Đã hiển thị lộ trình trên bản đồ');
   return true;
 }
 async function run(isAutoModeSwitch=false){
   window.FGRouteMotion?.cancel(map);routeRunController?.abort();const controller=new AbortController();routeRunController=controller;
   const seq=++routeRequestSeq,modeAtStart=travelMode,cfg=ROUTE_MODES[modeAtStart]||ROUTE_MODES.car;
   const analyticsAttempt=window.FGAnalytics?.startAttempt(modeAtStart,[$('fg3RouteFrom').value.trim(),$('fg3RouteTo').value.trim()]);let analyticsStage='validation';
   if(analyticsAttempt)controller.signal.addEventListener('abort',()=>window.FGAnalytics?.finishAttempt(analyticsAttempt,'route_search_failed',{stage:analyticsStage,reason:'cancelled'}),{once:true});
   const rain=Math.max(0,Number($('fg3RouteRain').value)||0),btn=$('fg3RouteRun');btn.disabled=true;btn.setAttribute('aria-busy','true');const retained=lastRoutes.length>0&&lastRoutes.every(a=>a.travelMode===modeAtStart);if(!retained)clearRouteVisuals();fg70Publish();hideSuggestions();$('fg3RouteFrom')?.classList.remove('fg80-invalid');$('fg3RouteTo')?.classList.remove('fg80-invalid');showStatus(`Đang tìm vị trí và các phương án cho <b>${cfg.icon} ${cfg.label}</b>…`);if(!retained)results.innerHTML='';setRouteTools(false);
   try{
     if(String($('fg3RouteFrom')?.value||'').trim()&&String($('fg3RouteTo')?.value||'').trim())analyticsStage='geocode';
     const [a,b]=await window.FGRouteAwait(resolvePoints(seq),controller.signal);if(seq!==routeRequestSeq)return;
     showStatus(`Đã định vị điểm đi/đến. Đang tính route <b>${cfg.icon} ${cfg.label}</b> và kiểm tra nguy cơ ngập…`,'ok');
     const query=`${a.lon},${a.lat};${b.lon},${b.lat}?alternatives=true&steps=true&geometries=geojson&overview=full&continue_straight=false`;
     analyticsStage='routing';
     const routed=await window.FGRouteTraffic(a,b,modeAtStart,{signal:controller.signal});if(seq!==routeRequestSeq)return;const data=routed.data;if(data.code!=='Ok'||!data.routes?.length)throw Object.assign(new Error(`Không tìm được lộ trình ${cfg.label.toLowerCase()} giữa hai điểm này.`),{code:'no_route'});
     const analyses=data.routes.map((x,i)=>({...analyzeRoute(x,rain,i),routingProvider:routed.provider}));
     const recommended=recommendedFor(analyses);
     lastRoutes=analyses;recommendedIndex=recommended.index;selectedIndex=recommended.index;drawRoutes(analyses,selectedIndex,true);renderResults(analyses,recommended,rain);updateRouteSummary(analyses,recommended);
     routeSessionReady=true;fg70Publish();window.FGAnalyticsRouteAttempt=window.FGAnalytics?.isAttemptCurrent?.(analyticsAttempt)?analyticsAttempt.id:null;
     window.FGAnalytics?.finishAttempt(analyticsAttempt,'route_search_succeeded',{route_count:analyses.length,road_ids:window.FGAnalytics.roadIds(analyses.flatMap(a=>a.unique.map(x=>x.street)))});
     const alt=analyses.length>1?`Có <b>${analyses.length}</b> phương án. Route màu xanh là phương án đang chọn.`:'Dịch vụ hiện chỉ trả về <b>1 phương án</b> cho cặp điểm này.';
     if(seq!==routeRequestSeq)return;showStatus(`Đã tìm đường bằng <b>${esc(routed.provider)}</b>. ${alt}`,'ok');
     if(!isAutoModeSwitch)fg19MobileMapReveal();
   }catch(e){window.FGAnalytics?.finishAttempt(analyticsAttempt,'route_search_failed',{stage:analyticsStage,reason:window.FGAnalytics.reason(e,analyticsStage)});if(seq===routeRequestSeq){if(e.name==='AbortError')return;console.error(e);setRouteTools(retained);showStatus(`<b>Chưa hoàn thành tìm đường:</b> ${esc(e.message||String(e))}${retained?'<br>Đang giữ lộ trình trước đó; chưa có kết quả mới.':''}<br><button type="button" class="fg3-route-detailbtn" data-route-retry>Thử lại</button> · Bạn có thể chọn điểm trực tiếp trên bản đồ.`,'error')}}
   finally{if(seq===routeRequestSeq){btn.disabled=false;btn.removeAttribute('aria-busy');routeRunController=null}}
 }

 status.addEventListener('click',e=>{if(e.target.closest('[data-route-retry]')&&!$('fg3RouteRun').disabled)run(false)});

 function fg70Publish(){
   const detail={analyses:lastRoutes,selectedIndex,recommendedIndex,preference:routePreference,travelMode,rain:Math.max(0,Number($('fg3RouteRain').value)||0),from:$('fg3RouteFrom').value,to:$('fg3RouteTo').value,start:startPoint?{lat:startPoint.lat,lon:startPoint.lon,label:startPoint.label||$('fg3RouteFrom').value}:null,end:endPoint?{lat:endPoint.lat,lon:endPoint.lon,label:endPoint.label||$('fg3RouteTo').value}:null};
   window.FG70_ROUTE_STATE=detail;document.dispatchEvent(new CustomEvent('fg70:route',{detail}));return detail;
 }
 window.FG70RouteSnapshot=()=>fg70Publish();
 // A selected search result supplies coordinates, without starting a route request.
 window.FG70SetEndpoint=function(which,point){
   const lat=Number(point?.lat),lon=Number(point?.lon);
   const numeric=v=>typeof v==='number'||(typeof v==='string'&&v.trim()!=='');
   if(!['from','to'].includes(which)||!numeric(point?.lat)||!numeric(point?.lon)||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return false;
   cancelPendingRoute();clearRouteVisuals({statusToo:true});
   const value={lat,lon,label:String(point.label||`${lat}, ${lon}`).slice(0,500)};
   if(which==='from')startPoint=value;else endPoint=value;
   const input=$(which==='from'?'fg3RouteFrom':'fg3RouteTo');input.value=value.label;input.classList.remove('fg80-invalid');hideSuggestions();drawEndpointMarkers();return true;
 };
 window.FG70SelectRoute=function(idx,selectionSource='user'){if(!lastRoutes.some(a=>a.index===Number(idx)))return false;selectRoute(Number(idx),selectionSource);return true};
 window.FG70ReassessRain=function(v){const rain=Math.max(0,Number(v)||0);$('fg3RouteRain').value=rain;if(!lastRoutes.length){fg70Publish();return false}const analyses=lastRoutes.map(a=>analyzeRoute(a.route,rain,a.index));const rec=recommendedFor(analyses);lastRoutes=analyses;recommendedIndex=rec.index;if(!analyses.some(a=>a.index===selectedIndex))selectedIndex=rec.index;drawRoutes(analyses,selectedIndex,true);renderResults(analyses,rec,rain);updateRouteSummary(analyses,rec);fg70Publish();return true};

 // Reassess the current route when rainfall changes, without calling routing services again.
 let rainTimer=null;$('fg3RouteRain')?.addEventListener('input',()=>{clearTimeout(rainTimer);rainTimer=setTimeout(()=>{const v=Math.max(0,Number($('fg3RouteRain').value)||0);if(lastRoutes.length)window.FG70ReassessRain(v)},260)});

 // Use browser geolocation as a route origin.
 $('fg80UseMyLocation')?.addEventListener('click',()=>{if(!navigator.geolocation){window.fg51Toast?.('Trình duyệt không hỗ trợ vị trí thiết bị');return}const hadRoute=routeSessionReady||lastRoutes.length>0;cancelPendingRoute();navigator.geolocation.getCurrentPosition(pos=>{startPoint={lat:pos.coords.latitude,lon:pos.coords.longitude,label:'Vị trí của tôi'};$('fg3RouteFrom').value='Vị trí của tôi';clearRouteVisuals();drawEndpointMarkers();window.fg51Toast?.('Đã dùng vị trí hiện tại làm điểm đi');if(hadRoute&&String($('fg3RouteTo').value||'').trim())setTimeout(()=>run(false),80)},()=>window.fg51Toast?.('Không thể lấy vị trí. Hãy kiểm tra quyền truy cập vị trí.'),{enableHighAccuracy:true,timeout:10000,maximumAge:60000})});

 function resetRoute(clearInputs=false){cancelPendingRoute();routeLayer.clearLayers();routePointLayer.clearLayers();lastRoutes=[];recommendedIndex=selectedIndex=null;startPoint=endPoint=null;routeSessionReady=false;results.innerHTML='';$('fg3RouteSummary').style.display='none';setRouteTools(false);if(clearInputs){$('fg3RouteFrom').value='';$('fg3RouteTo').value=''}$('fg3RouteFrom')?.classList.remove('fg80-invalid');$('fg3RouteTo')?.classList.remove('fg80-invalid');}
 $('fg80ClearRoute')?.addEventListener('click',()=>{resetRoute(false);window.fg51Toast?.('Đã xóa lộ trình trên bản đồ')});

 function selectedAnalysis(){return lastRoutes.find(a=>a.index===selectedIndex)||lastRoutes.find(a=>a.index===recommendedIndex)||lastRoutes[0]||null}
 function routeSummaryText(){const a=selectedAnalysis();if(!a)return '';const cfg=ROUTE_MODES[travelMode]||ROUTE_MODES.car;const [lab]=riskLabel(a),rain=Math.max(0,Number($('fg3RouteRain').value)||0);return `FloodGuard HCMC 9.0\n${cfg.icon} ${cfg.label}: ${$('fg3RouteFrom').value} → ${$('fg3RouteTo').value}\nKhoảng cách: ${fmt1(a.distance)} km\nThời gian ước tính: ${window.FGRouteTime(a)}\nKịch bản mưa: ${fmt1(rain)} mm\nĐánh giá theo dữ liệu lịch sử: ${lab}\nĐoạn cần chú ý: ${fmt1(a.exposureKm)} km\nLưu ý: ${window.FGRouteHasETA(a)?'ETA theo TomTom':'Chưa có thời gian theo giao thông'}; nguy cơ ngập dựa trên dữ liệu lịch sử.`}
 $('fg80CopyRoute')?.addEventListener('click',async()=>{const t=routeSummaryText();if(!t)return;try{await navigator.clipboard.writeText(t);window.fg51Toast?.('Đã sao chép tóm tắt hành trình')}catch(e){window.fg51Toast?.('Trình duyệt không cho phép sao chép tự động')}});
 $('fg80ExportRoute')?.addEventListener('click',()=>{const a=selectedAnalysis();if(!a?.route?.geometry)return;const feature={type:'Feature',geometry:a.route.geometry,properties:{application:'FloodGuard HCMC 9.0',mode:travelMode,preference:routePreference,from:$('fg3RouteFrom').value,to:$('fg3RouteTo').value,rain_mm:Math.max(0,Number($('fg3RouteRain').value)||0),distance_km:Number(a.distance.toFixed(3)),duration_min:Number.isFinite(a.duration)?Number(a.duration.toFixed(1)):null,exposure_km:Number(a.exposureKm.toFixed(3)),risk_level:a.riskLevel||'UNKNOWN',unknown_steps:a.unknownSteps??null,risk_label:riskLabel(a)[0],note:'Historical flood-evidence screening; not real-time flood or traffic status.'}};const blob=new Blob([JSON.stringify(feature,null,2)],{type:'application/geo+json;charset=utf-8'}),u=URL.createObjectURL(blob),x=document.createElement('a');x.href=u;x.download='FloodGuard_route.geojson';x.click();setTimeout(()=>URL.revokeObjectURL(u),1000);window.fg51Toast?.('Đã xuất GeoJSON của lộ trình đang chọn')});

 $('fg3RouteRun').onclick=()=>run(false);
 $('fg3ResetBtn')?.addEventListener('click',()=>resetRoute(false));
})();
