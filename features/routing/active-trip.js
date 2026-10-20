
(function(){
 const $=id=>document.getElementById(id),MAX_RAIN=600;
 // Simplified top navigation: one authoritative entry point per module.
 const nav=document.querySelector('.fg3-nav');['fg3RouteBtn','fg3AnalyzeBtn','fg3EVBtn','fg3StationBtn','fg70DecisionBtn'].forEach(id=>{const e=$(id);if(e&&nav)nav.appendChild(e)});
 const decision=$('fg70DecisionBtn');if(decision)decision.innerHTML='◈ Trung tâm';
 const analyze=$('fg3AnalyzeBtn');if(analyze){analyze.classList.remove('primary');analyze.innerHTML='☔ Phân tích'}
 const route=$('fg3RouteBtn');if(route)route.classList.add('primary');
 // Active Trip pill
 const app=$('fg3App'),header=document.querySelector('.fg3-header');
 const trip=document.createElement('div');trip.className='fg90-active-trip';trip.id='fg90ActiveTrip';trip.innerHTML='<div class="ico">🛣</div><div class="txt"><b>Chưa có Active Trip</b><span>Chọn điểm đi và điểm đến để mọi module dùng cùng một hành trình.</span></div><div class="rain">100 mm</div>';app?.appendChild(trip);trip.onclick=()=>route?.click();
 function modeLabel(m){return m==='walk'?'🚶 Đi bộ':m==='motorbike'?'🛵 Xe máy':'🚗 Ô tô'}
 function clampRain(v,notify=false){let n=Number(v);if(!Number.isFinite(n))n=100;if(n<0)n=0;if(n>MAX_RAIN){n=MAX_RAIN;if(notify)window.fg51Toast?.(`Kịch bản mưa tối đa của giao diện là ${MAX_RAIN} mm. Giá trị đã được giới hạn.`)}return Math.round(n*10)/10}
 let syncing=false,manualRainEditing=false;
 window.FG90_RAIN_SOURCE='manual';
 window.FG90SetRain=function(v,source=''){
   const n=clampRain(v,true);
   if(syncing)return n;
   if(source==='fg10-live' && manualRainEditing)return n;
   syncing=true;
   ['fg3RouteRain','fg3Rain','fcRain'].forEach(id=>{
     const e=$(id);if(!e||id===source)return;
     if(document.activeElement===e && manualRainEditing)return;
     e.value=n;
   });
   window.FG90_RAIN_SOURCE=source==='fg10-live'?'live':'manual';
   const k=$('fg3RainKpi');if(k)k.textContent=`${n} mm`;
   document.querySelectorAll('[data-rain],[data-route-rain]').forEach(b=>b.classList.toggle('active',Number(b.dataset.rain||b.dataset.routeRain)===n));
   if(source!=='fg3RouteRain'&&window.FG70ReassessRain)try{window.FG70ReassessRain(n)}catch(e){}
   syncing=false;renderTrip();return n
 };
 function renderTrip(){const s=window.FG70_ROUTE_STATE;const from=(s?.from||$('fg3RouteFrom')?.value||'').trim(),to=(s?.to||$('fg3RouteTo')?.value||'').trim(),rain=clampRain(s?.rain??$('fg3RouteRain')?.value??100);trip.querySelector('.rain').textContent=`${rain} mm`;if(from||to){trip.querySelector('b').textContent=`${from||'Điểm đi'} → ${to||'Điểm đến'}`;trip.querySelector('span').textContent=`${modeLabel(s?.travelMode||document.querySelector('.fg3-route-mode.active')?.dataset.routeMode)} · ${s?.analyses?.length?`${s.analyses.length} phương án đã tính`:'chưa tính lộ trình'} · dùng chung cho Phân tích / Trạm sạc`;}else{trip.querySelector('b').textContent='Chưa có Active Trip';trip.querySelector('span').textContent='Chọn điểm đi và điểm đến để mọi module dùng cùng một hành trình.'}}
 function syncRainField(id){
   const e=$(id);if(!e)return;e.max=MAX_RAIN;e.step='1';e.inputMode='decimal';
   e.addEventListener('focus',()=>{manualRainEditing=true;try{e.select()}catch(_){}});
   e.addEventListener('input',()=>{
     manualRainEditing=true;window.FG90_RAIN_SOURCE='manual';
     if(window.FG10DisableAutoForManual)window.FG10DisableAutoForManual();
   });
   const commit=()=>{
     const raw=Number(String(e.value).replace(',','.'));
     const n=clampRain(raw,true);e.value=n;
     e.classList.toggle('fg90-invalid-rain',!Number.isFinite(raw)||raw>MAX_RAIN||raw<0);
     setTimeout(()=>e.classList.remove('fg90-invalid-rain'),1400);
     manualRainEditing=false;window.FG90SetRain(n,id);
   };
   e.addEventListener('change',commit);
   e.addEventListener('blur',()=>{if(manualRainEditing)commit()});
   e.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();commit();e.blur()}});
 }
 ['fg3RouteRain','fg3Rain','fcRain'].forEach(syncRainField);
 document.addEventListener('click',e=>{const b=e.target.closest('[data-route-rain],[data-rain]');if(!b)return;const v=Number(b.dataset.routeRain||b.dataset.rain);if(Number.isFinite(v))setTimeout(()=>window.FG90SetRain(v,'preset'),0)});
 ['fg3RouteFrom','fg3RouteTo'].forEach(id=>$(id)?.addEventListener('input',renderTrip));document.querySelectorAll('.fg3-route-mode').forEach(b=>b.addEventListener('click',()=>setTimeout(renderTrip,0)));
 document.addEventListener('fg70:route',e=>{window.FG90SetRain(e.detail?.rain??100,'fg3RouteRain');renderTrip();renderDecision(e.detail)});
 // Compact route decision summary
 function renderDecision(s){const box=$('fg90RouteDecision');if(!box)return;if(!s?.analyses?.length){box.hidden=true;box.innerHTML='';return}const selected=s.analyses.find(a=>a.index===s.selectedIndex)||s.analyses[0],fast=s.analyses.reduce((a,b)=>s.analyses.every(window.FGRouteHasETA)?(b.duration<a.duration?b:a):(b.distance<a.distance?b:a),s.analyses[0]),safe=s.analyses.reduce((a,b)=>b.exposureKm<a.exposureKm?b:a,s.analyses[0]);box.hidden=false;box.innerHTML=`<div class="fg90-decision-card sel"><b>${window.FGRouteTime(selected)} · ${Number(selected.distance).toFixed(1)} km</b><span>Phương án đang chọn · ${Number(selected.exposureKm).toFixed(1)} km đoạn cần chú ý</span></div><div class="fg90-decision-card"><b>${window.FGRouteHasETA(fast)?window.FGRouteTime(fast):Number(fast.distance).toFixed(1)+' km'}</b><span>${s.analyses.every(window.FGRouteHasETA)?'Nhanh nhất trong '+s.analyses.length+' phương án · theo TomTom':'Quãng đường ngắn nhất trong các phương án hiện có'}</span></div><div class="fg90-decision-card"><b>${Number(safe.exposureKm).toFixed(1)} km</b><span>Ít phơi nhiễm lịch sử nhất trong các route hiện có</span></div>`}
 // Recent trips are useful but not primary: collapsed by default.
 const recent=$('fg51Recent');if(recent){recent.classList.add('collapsed');const head=recent.querySelector('.fg51-recent-head');if(head&&!$('fg90RecentToggle')){const t=document.createElement('button');t.type='button';t.id='fg90RecentToggle';t.className='fg90-recent-toggle';t.textContent='Mở ▾';const del=$('fg51ClearRecent');head.insertBefore(t,del||null);const toggle=()=>{recent.classList.toggle('collapsed');t.textContent=recent.classList.contains('collapsed')?'Mở ▾':'Thu gọn ▴'};t.onclick=e=>{e.stopPropagation();toggle()};head.onclick=e=>{if(e.target.closest('#fg51ClearRecent,#fg90RecentToggle'))return;toggle()}}}
 // Initial cleanup / recover bad persisted values (e.g. 20000 mm from older builds)
 setTimeout(()=>{const rr=$('fg3RouteRain');const raw=Number(rr?.value);if(rr&&(!Number.isFinite(raw)||raw<0||raw>MAX_RAIN)){rr.value=clampRain(raw,true)}window.FG90SetRain(rr?.value||100,'fg3RouteRain');renderTrip();const s=window.FG70_ROUTE_STATE;if(s)renderDecision(s)},500);
 // Improve global navigation semantics and active state.
 ['fg3RouteBtn','fg3AnalyzeBtn','fg3EVBtn','fg3StationBtn','fg70DecisionBtn'].forEach(id=>$(id)?.addEventListener('click',()=>{document.querySelectorAll('.fg3-nav .fg3-btn').forEach(b=>b.classList.remove('primary'));$(id)?.classList.add('primary')}));
})();
