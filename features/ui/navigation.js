
(function(){
 const $=id=>document.getElementById(id), nav=document.querySelector('.fg3-nav'), app=$('fg3App');
 if(!nav||!app||window.FG133_NAV_READY)return;window.FG133_NAV_READY=true;
 const defs=[
   ['fg3RouteBtn','🛣','Lộ trình','Lộ trình'],
   ['fg10LiveBtn','⛈','Thời tiết','Thời tiết'],
   ['fg3AnalyzeBtn','☔','Phân tích','Phân tích tuyến'],
   ['fg3EVBtn','⚡','Trạm sạc','Trạm sạc EV'],
   ['fg70DecisionBtn','◈','Trung tâm','Trung tâm quyết định']
 ];
 const panelMap={fg3RouteBtn:['fg3RoutePanel','show'],fg10LiveBtn:['fg10Panel','show'],fg3AnalyzeBtn:['fg3Drawer','open'],fg3EVBtn:['fg4EvPanel','show'],fg3StationBtn:['fg3StationPanel','show'],fg70DecisionBtn:['fg70Panel','show']};
 // authoritative desktop order and structured labels
 defs.forEach(([id,ico,label,title])=>{const b=$(id);if(!b)return;nav.appendChild(b);b.classList.remove('primary','active');b.innerHTML=`<span class="fg14-nav-ico" aria-hidden="true">${ico}</span><span class="fg14-nav-label">${label}</span>`;b.title=title;b.setAttribute('aria-label',title)});
 ['fg3OverviewBtn','fg3MapBtn'].forEach(id=>{const b=$(id);if(b)b.style.display='none'});
 function isPanelOpen(id){const m=panelMap[id],p=m&&$(m[0]);return !!(p&&p.classList.contains(m[1]))}
 function syncActive(){
   let active='fg3RouteBtn'; defs.forEach(([id])=>{if(isPanelOpen(id))active=id});
   defs.forEach(([id])=>{const b=$(id);if(!b)return;const on=id===active;b.classList.toggle('active',on);b.classList.toggle('primary',on);b.setAttribute('aria-current',on?'page':'false')});
   const mobile=$('fg12MobileNav');if(mobile){mobile.querySelectorAll('button').forEach(b=>{const moreOpen=document.getElementById('fg14MoreSheet')?.classList.contains('show');const on=moreOpen?b.hasAttribute('data-fg14-more'):b.dataset.target===active||b.hasAttribute('data-fg14-more')&&['fg3EVBtn','fg3StationBtn','fg70DecisionBtn'].includes(active);b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false');})}
 }

 const watched=[...new Set(Object.values(panelMap).map(x=>x[0]))].map($).filter(Boolean);const mo=new MutationObserver(()=>syncActive());watched.forEach(p=>mo.observe(p,{attributes:true,attributeFilter:['class']}));
 // Compact when idle; hover/focus restores labels.
 let compactTimer=null,over=false;
 function expand(){clearTimeout(compactTimer);nav.classList.remove('fg14-compact')}
 function compactLater(ms=90){clearTimeout(compactTimer);compactTimer=setTimeout(()=>{if(!over&&!nav.matches(':focus-within')&&innerWidth>900)nav.classList.add('fg14-compact')},ms)}
 nav.addEventListener('mouseenter',()=>{over=true;expand()});nav.addEventListener('mouseleave',()=>{over=false;compactLater(90)});nav.addEventListener('focusin',expand);nav.addEventListener('focusout',()=>compactLater(90));
 $('map')?.addEventListener('pointerdown',()=>compactLater(0));compactLater(1800);

 // Replace six-item mobile nav with 4 essential entries.
 const mobile=$('fg12MobileNav');
 if(mobile){
   mobile.innerHTML=`<button data-target="fg3RouteBtn">🛣<span>Lộ trình</span></button><button data-target="fg10LiveBtn">⛈<span>Thời tiết</span></button><button data-target="fg3AnalyzeBtn">☔<span>Phân tích</span></button><button type="button" data-fg14-more="1">•••<span>Thêm</span></button>`;
   mobile.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.fg14More){toggleMore();return}const t=b.dataset.target;if(t){closeMore();$(t)?.click();syncActive()}};
 }
 const back=document.createElement('div');back.className='fg14-more-backdrop';back.id='fg14MoreBack';app.appendChild(back);
 const sheet=document.createElement('div');sheet.className='fg14-more-sheet';sheet.id='fg14MoreSheet';sheet.innerHTML=`<div class="fg14-more-head"><b>Khám phá thêm</b><button type="button" id="fg14MoreClose" aria-label="Đóng">×</button></div><div class="fg14-more-grid"><button class="fg14-more-item" data-target="fg3EVBtn"><strong>⚡</strong><div><b>Trạm sạc</b><span>Tìm trạm và phương án thay thế</span></div></button><button class="fg14-more-item" data-target="fg3StationBtn"><strong>🌧</strong><div><b>Trạm đo</b><span>Mạng lưới quan trắc mưa</span></div></button><button class="fg14-more-item" data-target="fg70DecisionBtn"><strong>◈</strong><div><b>Trung tâm</b><span>Scenario Lab và dữ liệu</span></div></button></div>`;app.appendChild(sheet);
 function decorateMore(){const paths={rescue:'<path d="M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Z"/><path d="M12 8v8m-4-4h8"/>',charging:'<path d="M5 21V3h12v18M3 21h16M8 6h6v5H8zM17 6h2l2 3v8a2 2 0 0 1-4 0"/><path d="m11 13-2 3h3l-1 3"/>',community:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3"/>',account:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',admin:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-5"/>',logout:'<path d="M9 4H4v16h5m5-12 4 4-4 4m-6-4h13"/>'};sheet.querySelectorAll('.fg14-more-item').forEach(b=>{const key=b.dataset.target==='fg16RescueBtn'?'rescue':b.dataset.target==='fg3EVBtn'?'charging':b.hasAttribute('data-community-entry')?'community':b.id==='fg31MobileAccount'?'account':b.id==='fg35MobileAdmin'?'admin':b.id==='fg31MobileLogout'?'logout':null;if(!key)return;const icon=b.querySelector('strong');if(icon&&icon.dataset.fgIcon!==key){icon.dataset.fgIcon=key;icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+paths[key]+'</svg>';}});}
 function openMore(){Object.values(panelMap).forEach(([id,state])=>$(id)?.classList.remove(state));decorateMore();sheet.classList.add('show');back.classList.add('show');syncActive()}
 function closeMore(){sheet.classList.remove('show');back.classList.remove('show');syncActive()}
 function toggleMore(){sheet.classList.contains('show')?closeMore():openMore()}
 $('fg14MoreClose').onclick=closeMore;back.onclick=closeMore;sheet.onclick=e=>{const b=e.target.closest('button');if(!b||b.id==='fg14MoreClose')return;if(b.dataset.target){const t=b.dataset.target;closeMore();$(t)?.click();syncActive()}};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheet.classList.contains('show'))closeMore()});
 // Search remains a separate universal command, not a seventh tab.
 $('fg12Command')?.setAttribute('title','Tìm nhanh toàn FloodGuard · Ctrl+K');
 setTimeout(syncActive,150);
})();
