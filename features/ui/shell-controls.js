
(function(){
  const $=id=>document.getElementById(id); const app=$('fg3App'); if(!app||$('fg12RainOrb'))return;
  const header=document.querySelector('.fg3-header'),nav=document.querySelector('.fg3-nav');
  const toast=m=>window.fg51Toast?window.fg51Toast(m):console.log(m);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Header utility cluster.
  const tools=document.createElement('div'); tools.className='fg12-tools'; tools.innerHTML=`
    <div class="fg12-net" id="fg12Net"><i></i><span>Online</span></div>
    <button class="fg12-tool" data-fg12="command" id="fg12Command" title="Tìm nhanh · Ctrl+K" aria-label="Tìm nhanh">⌕</button>
    <button class="fg12-tool" data-fg12="saved" id="fg12SavedBtn" title="Hành trình đã lưu" aria-label="Hành trình đã lưu">☆</button>
    <button class="fg12-tool" data-fg12="theme" id="fg12Theme" title="Đổi giao diện sáng/tối" aria-label="Đổi giao diện sáng tối">◐</button>
    <button class="fg12-tool" data-fg12="full" id="fg12Full" title="Toàn màn hình" aria-label="Toàn màn hình">⛶</button>`;
  header?.appendChild(tools);

  function updateNet(){const n=$('fg12Net');if(!n)return;const on=navigator.onLine!==false;n.classList.toggle('off',!on);n.querySelector('span').textContent=on?'Online':'Offline'}
  addEventListener('online',updateNet);addEventListener('offline',updateNet);updateNet();
  $('fg12Command').onclick=()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}));
  const themeKey='floodguard_fg12_theme'; try{if(localStorage.getItem(themeKey)==='dark')document.body.classList.add('fg12-dark')}catch(_){}
  function syncTheme(){const d=document.body.classList.contains('fg12-dark');$('fg12Theme')?.classList.toggle('active',d);$('fg12Theme').textContent=d?'☀':'◐'} syncTheme();
  $('fg12Theme').onclick=()=>{document.body.classList.toggle('fg12-dark');try{localStorage.setItem(themeKey,document.body.classList.contains('fg12-dark')?'dark':'light')}catch(_){};syncTheme();setTimeout(()=>{try{map.invalidateSize()}catch(e){}},80)};
  $('fg12Full').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(e){toast('Trình duyệt không cho phép toàn màn hình trong ngữ cảnh này.')}};
  document.addEventListener('fullscreenchange',()=>{$('fg12Full')?.classList.toggle('active',!!document.fullscreenElement)});

  // Rain scenario control shared by every module.
  const rainOrb=document.createElement('button');rainOrb.id='fg12RainOrb';rainOrb.className='fg12-rain-orb';rainOrb.innerHTML='<span class="live"></span><span>Kịch bản mưa</span><b>100 mm</b><span>⌄</span>';app.appendChild(rainOrb);
  const rainPop=document.createElement('div');rainPop.id='fg12RainPop';rainPop.className='fg12-rain-pop';rainPop.innerHTML=`<div class="fg12-rain-head"><b>Kịch bản lượng mưa dùng chung</b><div class="fg12-rain-value"><input id="fg12RainNumber" type="number" min="0" max="600" step="1" value="100"><span>mm</span></div></div><input id="fg12RainRange" class="fg12-range" type="range" min="0" max="600" step="1" value="100"><div class="fg12-presets"><button data-fg12-rain="50">50</button><button data-fg12-rain="100">100</button><button data-fg12-rain="150">150</button><button data-fg12-rain="200">200</button><button data-fg12-rain="300">300</button></div><div class="fg12-rain-actions"><button class="primary" id="fg12OpenLive">⛈ Mở Thời tiết</button><button class="ghost" id="fg12CloseRain">Xong</button></div>`;app.appendChild(rainPop);
  function currentRain(){const s=window.FG70_ROUTE_STATE;let v=Number(s?.rain??$('fg3RouteRain')?.value??$('fg3Rain')?.value??100);return Number.isFinite(v)?Math.max(0,Math.min(600,v)):100}
  function renderRain(v=currentRain()){v=Math.round(Number(v)||0);rainOrb.querySelector('b').textContent=`${v} mm`;$('fg12RainNumber').value=v;$('fg12RainRange').value=v}
  function setRain(v,source='fg12'){v=Math.max(0,Math.min(600,Number(v)||0));window.FG90SetRain?.(v,source);renderRain(v)}
  rainOrb.onclick=e=>{e.stopPropagation();rainPop.classList.toggle('show');renderRain()};$('fg12CloseRain').onclick=()=>rainPop.classList.remove('show');$('fg12RainRange').oninput=e=>{$('fg12RainNumber').value=e.target.value;setRain(e.target.value,'fg12-range')};$('fg12RainNumber').onchange=e=>setRain(e.target.value,'fg12-number');rainPop.querySelectorAll('[data-fg12-rain]').forEach(b=>b.onclick=()=>setRain(b.dataset.fg12Rain,'fg12-preset'));$('fg12OpenLive').onclick=()=>{rainPop.classList.remove('show');$('fg10LiveBtn')?.click()};document.addEventListener('click',e=>{if(!e.target.closest('#fg12RainPop,#fg12RainOrb'))rainPop.classList.remove('show')});

  // Active Trip favorite/share actions.
  const trip=$('fg90ActiveTrip');
  if(trip){const actions=document.createElement('div');actions.className='fg12-trip-actions';actions.innerHTML='<button id="fg12SaveTrip" title="Lưu hành trình">☆</button><button id="fg12ShareTrip" title="Chia sẻ hành trình">↗</button>';trip.appendChild(actions);actions.onclick=e=>e.stopPropagation()}
  const saveKey='floodguard_fg12_saved_trips';
  const loadSaved=()=>{try{return JSON.parse(localStorage.getItem(saveKey)||'[]')}catch(e){return[]}};
  const writeSaved=a=>{try{localStorage.setItem(saveKey,JSON.stringify(a.slice(0,12)))}catch(e){}};
  function snapshot(){const s=window.FG70_ROUTE_STATE||{};const from=(s.from||$('fg3RouteFrom')?.value||'').trim(),to=(s.to||$('fg3RouteTo')?.value||'').trim();return {from,to,rain:currentRain(),travelMode:s.travelMode||document.querySelector('.fg3-route-mode.active')?.dataset.routeMode||'car',preference:s.preference||document.querySelector('.fg62-prefbtn.active')?.dataset.routePref||'safe',ts:Date.now()}}
  function tripKey(s){return `${s.from}|${s.to}|${s.travelMode}`.toLowerCase()}
  function syncSaveButton(){const b=$('fg12SaveTrip');if(!b)return;const s=snapshot(),saved=loadSaved().some(x=>tripKey(x)===tripKey(s)&&s.from&&s.to);b.classList.toggle('on',saved);b.textContent=saved?'★':'☆'}
  $('fg12SaveTrip')?.addEventListener('click',()=>{const s=snapshot();if(!s.from||!s.to){toast('Hãy tạo hành trình trước khi lưu.');return}let a=loadSaved(),k=tripKey(s),i=a.findIndex(x=>tripKey(x)===k);if(i>=0){a.splice(i,1);toast('Đã bỏ hành trình khỏi danh sách lưu.')}else{a.unshift(s);toast('Đã lưu hành trình trên trình duyệt này.')}writeSaved(a);syncSaveButton();renderSaved()});
  async function shareTrip(){const s=snapshot();if(!s.from||!s.to){toast('Hãy tạo hành trình trước khi chia sẻ.');return}const sel=window.FG70_ROUTE_STATE?.analyses?.find(a=>a.index===window.FG70_ROUTE_STATE?.selectedIndex);const text=`FloodGuard HCMC\n${s.from} → ${s.to}\n${s.travelMode==='walk'?'Đi bộ':s.travelMode==='motorbike'?'Xe máy':'Ô tô'} · Mưa ${s.rain} mm${sel?` · ${window.FGRouteTime(sel)} · ${Number(sel.distance).toFixed(1)} km · ${Number(sel.exposureKm||0).toFixed(1)} km phơi nhiễm lịch sử`:''}`;try{if(navigator.share)await navigator.share({title:'FloodGuard HCMC',text});else{await navigator.clipboard.writeText(text);toast('Đã sao chép tóm tắt hành trình.')}}catch(e){}}
  $('fg12ShareTrip')?.addEventListener('click',shareTrip);

  // Saved trips popup.
  const savedPop=document.createElement('div');savedPop.id='fg12SavedPop';savedPop.className='fg12-saved-pop';app.appendChild(savedPop);
  function renderSaved(){const a=loadSaved();savedPop.innerHTML=`<div class="fg12-saved-title"><b>Hành trình đã lưu</b><span style="font-size:7px;color:#8294a6">${a.length}/12</span></div>`+(a.length?a.map((x,i)=>`<div class="fg12-saved-item" data-fg12-load="${i}"><div><b>${esc(x.from)} → ${esc(x.to)}</b><span>${x.travelMode==='walk'?'Đi bộ':x.travelMode==='motorbike'?'Xe máy':'Ô tô'} · ${Number(x.rain)||0} mm · ${x.preference==='fast'?'Nhanh nhất':'Ít nguy cơ ngập'}</span></div><button data-fg12-del="${i}" title="Xóa">×</button></div>`).join(''):'<div class="fg12-saved-empty">Chưa có hành trình nào được lưu.</div>');savedPop.querySelectorAll('[data-fg12-load]').forEach(el=>el.onclick=e=>{if(e.target.closest('[data-fg12-del]'))return;const x=a[Number(el.dataset.fg12Load)];savedPop.classList.remove('show');if(!$('fg3RoutePanel')?.classList.contains('show'))$('fg3RouteBtn')?.click();setTimeout(()=>{const f=$('fg3RouteFrom'),t=$('fg3RouteTo');if(f){f.value=x.from;f.dispatchEvent(new Event('input',{bubbles:true}))}if(t){t.value=x.to;t.dispatchEvent(new Event('input',{bubbles:true}))}document.querySelector(`[data-route-mode="${x.travelMode}"]`)?.click();document.querySelector(`[data-route-pref="${x.preference}"]`)?.click();setRain(x.rain,'fg12-saved');setTimeout(()=>$('fg3RouteRun')?.click(),120)},100)});savedPop.querySelectorAll('[data-fg12-del]').forEach(b=>b.onclick=e=>{e.stopPropagation();a.splice(Number(b.dataset.fg12Del),1);writeSaved(a);renderSaved();syncSaveButton()})}
  renderSaved();$('fg12SavedBtn').onclick=e=>{e.stopPropagation();renderSaved();savedPop.classList.toggle('show')};document.addEventListener('click',e=>{if(!e.target.closest('#fg12SavedPop,#fg12SavedBtn'))savedPop.classList.remove('show')});

  // Smart actions appear after a route has been computed.
  const quick=document.createElement('div');quick.id='fg12Quick';quick.className='fg12-quick';quick.innerHTML='<button class="main" data-fg12-action="analyze"><strong>☔</strong> Phân tích tuyến</button><button data-fg12-action="live"><strong>⛈</strong> Thời tiết</button><button data-fg12-action="ev"><strong>⚡</strong> Trạm sạc dọc tuyến</button><button data-fg12-action="gauge"><strong>🌧</strong> Trạm đo dọc tuyến</button>';app.appendChild(quick);
  function selectedRoute(){const s=window.FG70_ROUTE_STATE;return s?.analyses?.find(a=>a.index===s.selectedIndex)||s?.analyses?.[0]}
  quick.onclick=e=>{const b=e.target.closest('[data-fg12-action]');if(!b)return;const a=b.dataset.fg12Action,s=window.FG70_ROUTE_STATE,sel=selectedRoute();if(a==='live'){$('fg10LiveBtn')?.click();return}if(a==='ev'){$('fg3EVBtn')?.click();setTimeout(()=>document.querySelector('[data-ev-context="route"]')?.click(),80);return}if(a==='gauge'){$('fg3StationBtn')?.click();setTimeout(()=>document.querySelector('[data-station-context="route"]')?.click(),80);return}if(a==='analyze'){const st=sel?.unique?.[0]?.street||sel?.matched?.[0]?.street;if(st){const select=$('fg3StreetSelect');if(select&&[...select.options].some(o=>o.value===st)){select.value=st;select.dispatchEvent(new Event('change',{bubbles:true}))}}$('fg3AnalyzeBtn')?.click()}};

  // Mobile nav.
  const mobile=document.createElement('div');mobile.className='fg12-mobile-nav';mobile.id='fg12MobileNav';mobile.innerHTML=`<button data-target="fg3RouteBtn">🛣<span>Lộ trình</span></button><button data-target="fg10LiveBtn">⛈<span>Thời tiết</span></button><button data-target="fg3AnalyzeBtn">☔<span>Phân tích</span></button><button data-target="fg3EVBtn">⚡<span>Trạm sạc</span></button><button data-target="fg3StationBtn">🌧<span>Trạm đo</span></button><button data-target="fg70DecisionBtn">◈<span>Trung tâm</span></button>`;app.appendChild(mobile);mobile.onclick=e=>{const b=e.target.closest('[data-target]');if(!b)return;$(b.dataset.target)?.click()};
  const backdrop=document.createElement('div');backdrop.id='fg12Backdrop';backdrop.className='fg12-backdrop';app.appendChild(backdrop);
  const panelIds=['fg3RoutePanel','fg4EvPanel','fg3Drawer','fg10Panel','fg70Panel','fg3StationPanel'];
  function panelOpen(id){const e=$(id);return !!e&&(e.classList.contains('show')||e.classList.contains('open'))}
  function updatePanels(){const open=panelIds.some(panelOpen);backdrop.classList.toggle('show',open&&matchMedia('(max-width:700px)').matches);mobile.querySelectorAll('button').forEach(b=>{const target=b.dataset.target;let p=target==='fg3RouteBtn'?'fg3RoutePanel':target==='fg10LiveBtn'?'fg10Panel':target==='fg3AnalyzeBtn'?'fg3Drawer':target==='fg3EVBtn'?'fg4EvPanel':target==='fg3StationBtn'?'fg3StationPanel':target==='fg70DecisionBtn'?'fg70Panel':'';b.classList.toggle('active',panelOpen(p))})}
  panelIds.forEach(id=>{const e=$(id);if(e)new MutationObserver(updatePanels).observe(e,{attributes:true,attributeFilter:['class']})});
  backdrop.onclick=()=>{[['fg3RoutePanel','fg3RouteClose'],['fg4EvPanel','fg4EvClose'],['fg3Drawer','fg3Close'],['fg10Panel','fg10Close'],['fg70Panel','fg70Close'],['fg3StationPanel','fg3StationClose']].forEach(([p,c])=>{if(panelOpen(p))$(c)?.click()})};

  function enrichTrip(s){renderRain(s?.rain??currentRain());syncSaveButton();const sel=s?.analyses?.find(a=>a.index===s.selectedIndex)||s?.analyses?.[0];quick.classList.toggle('show',!!sel);const trip=$('fg90ActiveTrip');if(!trip)return;const sp=trip.querySelector('.txt span');if(!sel){if(sp)sp.textContent='Chưa có thời gian di chuyển · tạo lộ trình để tính';return;}if(sp)sp.textContent=`${s.travelMode==='walk'?'🚶 Đi bộ':s.travelMode==='motorbike'?'🛵 Xe máy':'🚗 Ô tô'} · ${window.FGRouteTime(sel)} · ${Number(sel.distance).toFixed(1)} km · ${Number(sel.exposureKm||0).toFixed(1)} km đoạn cần chú ý`}
  document.addEventListener('fg70:route',e=>setTimeout(()=>enrichTrip(e.detail),0));
  ['fg3RouteRain','fg3Rain','fcRain'].forEach(id=>$(id)?.addEventListener('change',()=>setTimeout(()=>renderRain(),0)));

  // Polished keyboard shortcuts: / focuses route origin, R opens rain composer, F toggles fullscreen.
  document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const tag=(document.activeElement?.tagName||'').toLowerCase();if(['input','textarea','select'].includes(tag))return;if(e.key==='/'){e.preventDefault();$('fg3RouteBtn')?.click();setTimeout(()=>$('fg3RouteFrom')?.focus(),100)}else if(e.key.toLowerCase()==='r'){e.preventDefault();rainPop.classList.toggle('show');renderRain()}else if(e.key.toLowerCase()==='f'){$('fg12Full')?.click()}});

  // Initial product cleanup and title/tooltips.
  const decision=$('fg70DecisionBtn');if(decision)decision.textContent='◈ Trung tâm';
  const live=$('fg10LiveBtn');if(live)live.textContent='⛈ Thời tiết';
  const foot=document.querySelector('.fg3-footnote');if(foot)foot.style.display='none';
  renderRain();syncSaveButton();updatePanels();
  setTimeout(()=>{const s=window.FG70_ROUTE_STATE;if(s)enrichTrip(s)},900);
})();
