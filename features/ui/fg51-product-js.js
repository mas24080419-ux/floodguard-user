
(function(){
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const toast=$('fg51Toast');let toastTimer=null;
 function say(msg){if(!toast)return;toast.textContent=msg;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2200)}
 window.fg51Toast=say;
 // Quick dock
 document.querySelectorAll('[data-fg51-open]').forEach(b=>b.addEventListener('click',()=>{const target=$(b.dataset.fg51Open);target?.click();say('Đã mở '+(b.querySelector('b')?.textContent||'module'));}));
 $('fg51MapFocus')?.addEventListener('click',()=>{$('fg3MapBtn')?.click();try{map.invalidateSize();}catch(e){}say('Đã quay lại bản đồ');});
 // Keyboard shortcuts outside text fields
 document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const tag=(document.activeElement?.tagName||'').toLowerCase();if(['input','textarea','select'].includes(tag))return;const key=e.key.toLowerCase();const ids={1:'fg3RouteBtn',2:'fg3AnalyzeBtn',3:'fg3EVBtn',4:'fg3StationBtn',m:'fg3MapBtn'};if(ids[key]){$(ids[key])?.click();say(key==='m'?'Bản đồ':`Phím tắt ${key}`);}});
 // Persist route mode and inputs
 const STORE='floodguard-route-prefs-v51', RECENT='floodguard-recent-routes-v51';
 function getPrefs(){try{const value=JSON.parse(localStorage.getItem(STORE)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch(e){return {}}}
 function savePrefs(){const mode=document.querySelector('.fg3-route-mode.active')?.dataset.routeMode||'car';const v={mode,from:$('fg3RouteFrom')?.value||'',to:$('fg3RouteTo')?.value||'',rain:$('fg3RouteRain')?.value||'100'};try{localStorage.setItem(STORE,JSON.stringify(v))}catch(e){}}
 const prefs=getPrefs();
 setTimeout(()=>{if(prefs.from&&$('fg3RouteFrom'))$('fg3RouteFrom').value=prefs.from;if(prefs.to&&$('fg3RouteTo'))$('fg3RouteTo').value=prefs.to;if(prefs.rain&&$('fg3RouteRain'))$('fg3RouteRain').value=prefs.rain;if(prefs.mode){const b=[...document.querySelectorAll('.fg3-route-mode')].find(b=>b.dataset.routeMode===prefs.mode);b?.click();}},300);
 ['fg3RouteFrom','fg3RouteTo','fg3RouteRain'].forEach(id=>$(id)?.addEventListener('change',savePrefs));
 document.querySelectorAll('.fg3-route-mode').forEach(b=>b.addEventListener('click',()=>{setTimeout(savePrefs,0);say('Phương tiện: '+b.textContent.trim());}));
 // Recent trips
 function recent(){try{const rows=JSON.parse(localStorage.getItem(RECENT)||'[]');return Array.isArray(rows)?rows.filter(r=>r&&typeof r.from==='string'&&typeof r.to==='string'&&['car','motorbike','walk'].includes(r.mode)&&Number.isFinite(Number(r.rain))&&Number(r.rain)>=0).slice(0,6):[]}catch(e){return []}}
 function saveRecent(arr){try{localStorage.setItem(RECENT,JSON.stringify(arr.slice(0,6)))}catch(e){}}
 function modeInfo(mode){return mode==='motorbike'?['🛵','Xe máy']:mode==='walk'?['🚶','Đi bộ']:['🚗','Ô tô']}
 function renderRecent(){const box=$('fg51RecentList');if(!box)return;const arr=recent();if(!arr.length){box.innerHTML='<span class="fg51-recent-empty">Chưa có hành trình nào.</span>';return}box.innerHTML=arr.map((r,i)=>{const m=modeInfo(r.mode);return `<button type="button" class="fg51-trip" data-trip="${i}"><strong>${m[0]} ${esc(r.from)}</strong><span>→ ${esc(r.to)}</span><small>${m[1]} · ${esc(r.rain)} mm</small></button>`}).join('');box.querySelectorAll('[data-trip]').forEach(b=>b.onclick=()=>{const r=arr[Number(b.dataset.trip)];if(!r)return;const f=$('fg3RouteFrom'),t=$('fg3RouteTo'),rn=$('fg3RouteRain');f.value=r.from;t.value=r.to;rn.value=r.rain;f.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('input',{bubbles:true}));rn.dispatchEvent(new Event('input',{bubbles:true}));[...document.querySelectorAll('.fg3-route-mode')].find(b=>b.dataset.routeMode===r.mode)?.click();savePrefs();say('Đã nạp hành trình gần đây');});}
 $('fg51ClearRecent')?.addEventListener('click',()=>{saveRecent([]);renderRecent();say('Đã xóa lịch sử hành trình');});
 const results=$('fg3RouteResults');if(results){let wasEmpty=true;new MutationObserver(()=>{const has=!!results.querySelector('.fg3-route-card');if(has&&wasEmpty){const from=$('fg3RouteFrom')?.value.trim(),to=$('fg3RouteTo')?.value.trim(),rain=$('fg3RouteRain')?.value||'100',mode=document.querySelector('.fg3-route-mode.active')?.dataset.routeMode||'car';if(from&&to){let arr=recent().filter(x=>!(x.from===from&&x.to===to&&x.mode===mode));arr.unshift({from,to,rain,mode,time:Date.now()});saveRecent(arr);renderRecent();savePrefs();say('Đã lưu hành trình vào mục gần đây');}}wasEmpty=!has;}).observe(results,{childList:true,subtree:true});}
 renderRecent();
 // Give the route run button more context
 function syncRun(){const b=$('fg3RouteRun');if(b)b.textContent='Đường đi';}
 document.querySelectorAll('.fg3-route-mode').forEach(b=>b.addEventListener('click',syncRun));setTimeout(syncRun,350);
 // Toast for common UI actions
 $('fg3FocusBtn')?.addEventListener('click',()=>say('Đang đưa tuyến được chọn vào giữa bản đồ'));
 $('fg4UseMyLocation')?.addEventListener('click',()=>say('Đang yêu cầu quyền truy cập vị trí thiết bị'));
 // Improve header active state based on panels
 const nav=['fg3OverviewBtn','fg3MapBtn','fg3RouteBtn','fg3StationBtn','fg3AnalyzeBtn','fg3EVBtn'];nav.forEach(id=>$(id)?.addEventListener('click',()=>{nav.forEach(x=>$(x)?.classList.remove('fg51-active'));$(id)?.classList.add('fg51-active');}));
})();
