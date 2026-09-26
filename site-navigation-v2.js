(()=>{
'use strict';
if(window.__FG_SITE_NAV_V6__)return;window.__FG_SITE_NAV_V6__=true;
function installAtelierTheme(){
 if(document.querySelector('link[data-fg-atelier-v47]')||[...document.styleSheets].some(s=>String(s.href||'').includes('site-atelier-v47.css')))return;
 const l=document.createElement('link');l.rel='stylesheet';l.href='./site-atelier-v47.css?v=47';l.dataset.fgAtelierV47='1';document.head.appendChild(l);
}
function installCinematicTheme(){
 if(document.querySelector('link[data-fg-cinematic-v48]')||[...document.styleSheets].some(s=>String(s.href||'').includes('site-cinematic-v48.css')))return;
 const l=document.createElement('link');l.rel='stylesheet';l.href='./site-cinematic-v48.css?v=48';l.dataset.fgCinematicV48='1';document.head.appendChild(l);
}
function installEditorialTheme(){
 document.documentElement.dataset.fgEditorial='1';
 if(document.querySelector('link[data-fg-editorial-v49]')||[...document.styleSheets].some(s=>String(s.href||'').includes('site-editorial-v49.css')))return;
 const l=document.createElement('link');l.rel='stylesheet';l.href='./site-editorial-v49.css?v=49';l.dataset.fgEditorialV49='1';document.head.appendChild(l);
}
const ROUTES={
 'trang chủ':'./',
 'vấn đề':'./problem.html',
 'tính năng':'./features.html',
 'cách hoạt động':'./how-it-works.html',
 'cảnh báo':'./alerts.html',
 'trạm sạc ev':'./ev.html',
 'cứu hộ':'./rescue.html',
 'giới thiệu':'./about.html'
};
const ORDER=['Vấn đề','Tính năng','Cách hoạt động','Cảnh báo','Trạm sạc EV','Cứu hộ','Giới thiệu'];
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function norm(s){return String(s||'').trim().toLowerCase().replace(/\s+/g,' ')}
function replaceLink(a,href){const clone=a.cloneNode(true);clone.setAttribute('href',href);a.replaceWith(clone);return clone}
function ensureOrderedLinks(container,home=false){
 if(!container)return;
 const existing=[...container.querySelectorAll('a')];
 const map=new Map(existing.map(a=>[norm(a.textContent).replace(/→/g,'').trim(),a]));
 const frag=document.createDocumentFragment();
 if(home){const h=map.get('trang chủ');if(h)frag.appendChild(h)}
 ORDER.forEach(label=>{
  const key=norm(label);let a=map.get(key);
  if(!a){a=document.createElement('a');a.textContent=label}
  a.setAttribute('href',ROUTES[key]);frag.appendChild(a);
 });
 existing.forEach(a=>{const k=norm(a.textContent).replace(/→/g,'').trim();if(!ROUTES[k]&&k!=='trang chủ')frag.appendChild(a)});
 container.replaceChildren(frag);
}
function installMotionStyles(){
 if(document.getElementById('fgSmoothMotionV4'))return;
 const s=document.createElement('style');s.id='fgSmoothMotionV4';s.textContent=`
 :root{--fg-ease:cubic-bezier(.22,.61,.36,1);--fg-ease-out:cubic-bezier(.16,1,.3,1)}
 @view-transition{navigation:auto}
 ::view-transition-old(root){animation:fgVtOld .18s var(--fg-ease) both}
 ::view-transition-new(root){animation:fgVtNew .42s var(--fg-ease-out) both}
 @keyframes fgVtOld{to{opacity:.22;transform:translateY(-5px) scale(.996);filter:blur(.7px)}}
 @keyframes fgVtNew{from{opacity:.18;transform:translateY(10px) scale(.996);filter:blur(.7px)}to{opacity:1;transform:none;filter:none}}
 html.fg-js-motion main,html.fg-js-motion #fgWebsiteHome{transition:opacity .22s var(--fg-ease),transform .22s var(--fg-ease),filter .22s var(--fg-ease)}
 html.fg-js-motion.fg-enter main,html.fg-js-motion.fg-enter #fgWebsiteHome{opacity:0;transform:translateY(9px);filter:blur(.6px)}
 html.fg-js-motion.fg-page-leaving main,html.fg-js-motion.fg-page-leaving #fgWebsiteHome{opacity:.12;transform:translateY(-7px) scale(.998);filter:blur(.8px);pointer-events:none}
 .fg-reveal{opacity:0;transform:translateY(22px) scale(.992);filter:blur(1.5px);transition:opacity .58s var(--fg-ease-out),transform .58s var(--fg-ease-out),filter .58s var(--fg-ease-out);transition-delay:var(--fg-delay,0ms);will-change:opacity,transform}
 .fg-reveal.fg-visible{opacity:1;transform:none;filter:none;will-change:auto}
 .site-links a,.wh-links a{position:relative;transition:color .22s var(--fg-ease)}
 .site-links a:after,.wh-links a:after{content:"";position:absolute;left:0;right:100%;bottom:-7px;height:2px;border-radius:999px;background:linear-gradient(90deg,#2f7ae5,#6b62e6);transition:right .28s var(--fg-ease-out)}
 .site-links a:hover:after,.site-links a.active:after,.wh-links a:hover:after{right:0}
 .site-btn,.wh-btn,.fgmp-card,.info-card,.step,.threshold,.problem-stat,.impact-box,.wh-card,.wh-step,.wh-panel{transition:transform .25s var(--fg-ease-out),box-shadow .25s var(--fg-ease-out),border-color .25s var(--fg-ease-out),background-color .25s var(--fg-ease-out)}
 .info-card:hover,.step:hover,.threshold:hover,.problem-stat:hover,.impact-box:hover{transform:translateY(-4px);box-shadow:0 18px 38px rgba(24,64,108,.10);border-color:#cbdced}
 @media(max-width:980px){.mobile-drawer{display:grid!important;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-9px) scale(.985);transform-origin:top right;transition:opacity .22s var(--fg-ease),transform .28s var(--fg-ease-out),visibility .22s}.mobile-drawer.open{opacity:1;visibility:visible;pointer-events:auto;transform:none}}
 @media(prefers-reduced-motion:reduce){::view-transition-old(root),::view-transition-new(root){animation:none!important}html.fg-js-motion main,html.fg-js-motion #fgWebsiteHome,.fg-reveal,.site-btn,.wh-btn,.fgmp-card,.info-card,.step,.threshold,.problem-stat,.impact-box,.mobile-drawer{transition:none!important;animation:none!important;transform:none!important;filter:none!important;opacity:1!important}}
 `;document.head.appendChild(s);
}
function buildHomepageExplore(root){
 if(document.getElementById('fgMultiPageExplore'))return;
 ['features','how','watchlist','ev','rescue','about'].forEach(id=>{const el=root.querySelector('#'+id);if(el)el.style.display='none'});
 if(!document.getElementById('fgMultiPageHomeStyle')){
  const st=document.createElement('style');st.id='fgMultiPageHomeStyle';st.textContent=`
  #fgMultiPageExplore{padding:70px 0 76px;background:#fff;border-top:1px solid #e0e9f3;border-bottom:1px solid #e0e9f3}
  #fgMultiPageExplore .fgmp-head{max-width:760px;margin-bottom:27px}#fgMultiPageExplore .fgmp-head span{font-size:11px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#2d6fc8}#fgMultiPageExplore .fgmp-head h2{font-size:clamp(30px,4vw,46px);line-height:1.08;letter-spacing:-.04em;margin:8px 0 10px;color:#102a43}#fgMultiPageExplore .fgmp-head p{margin:0;color:#6b7f93;font-size:14px;line-height:1.7}
  #fgMultiPageExplore .fgmp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}#fgMultiPageExplore .fgmp-card{display:block;text-decoration:none;color:#17304f;border:1px solid #dfe9f3;border-radius:20px;padding:20px;background:#f9fbfe;min-height:155px}#fgMultiPageExplore .fgmp-card:hover{transform:translateY(-5px);background:#fff;box-shadow:0 18px 38px rgba(26,64,108,.10);border-color:#cddced}#fgMultiPageExplore .fgmp-card.problem{background:linear-gradient(145deg,#f6faff,#edf5ff);border-color:#cfe0f3}#fgMultiPageExplore .fgmp-icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#eaf3ff;margin-bottom:14px;font-size:18px}#fgMultiPageExplore .fgmp-card b{display:block;font-size:16px;margin-bottom:6px}#fgMultiPageExplore .fgmp-card small{display:block;color:#718399;font-size:11px;line-height:1.55}#fgMultiPageExplore .fgmp-card em{display:block;margin-top:12px;color:#2d6fc8;font-size:10px;font-style:normal;font-weight:900}
  @media(max-width:860px){#fgMultiPageExplore .fgmp-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){#fgMultiPageExplore{padding:48px 0}#fgMultiPageExplore .fgmp-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(st);
 }
 const section=document.createElement('section');section.id='fgMultiPageExplore';section.innerHTML=`<div class="wh-shell"><div class="fgmp-head"><span>Bắt đầu từ vấn đề</span><h2>Hiểu vì sao ngập xảy ra trước khi xem FloodGuard làm gì</h2><p>Website đi theo một câu chuyện rõ ràng: thực trạng và nguyên nhân ngập → tính năng → cách hệ thống hoạt động → các module cảnh báo, EV và cứu hộ.</p></div><div class="fgmp-grid"><a class="fgmp-card problem" href="./problem.html"><span class="fgmp-icon">🌧</span><b>Vấn đề ngập đô thị</b><small>Thực trạng TP.HCM, các nguyên nhân chính và tác động tới giao thông, EV và cứu hộ.</small><em>Xem vấn đề trước →</em></a><a class="fgmp-card" href="./features.html"><span class="fgmp-icon">🧩</span><b>Tính năng</b><small>Dự báo ngập, tìm đường, Watchlist, EV và SOS trong cùng nền tảng.</small><em>Mở trang →</em></a><a class="fgmp-card" href="./how-it-works.html"><span class="fgmp-icon">⚙️</span><b>Cách hoạt động</b><small>Từ dữ liệu mưa và lịch sử ngập đến mức rủi ro trên tuyến đường.</small><em>Mở trang →</em></a><a class="fgmp-card" href="./alerts.html"><span class="fgmp-icon">🔔</span><b>Cảnh báo</b><small>Watchlist, ngưỡng MEDIUM/HIGH và email cảnh báo tự động.</small><em>Mở trang →</em></a><a class="fgmp-card" href="./ev.html"><span class="fgmp-icon">⚡</span><b>Trạm sạc EV</b><small>Khả năng tiếp cận trạm sạc trong bối cảnh mưa và ngập.</small><em>Mở trang →</em></a><a class="fgmp-card" href="./rescue.html"><span class="fgmp-icon">🆘</span><b>Cứu hộ</b><small>Gửi SOS, chia sẻ vị trí, theo dõi trạng thái và trao đổi hỗ trợ.</small><em>Mở trang →</em></a><a class="fgmp-card" href="./about.html"><span class="fgmp-icon">FG</span><b>Giới thiệu</b><small>Phạm vi, mục tiêu và nguyên tắc phát triển FloodGuard HCMC.</small><em>Mở trang →</em></a></div></div>`;
 const footer=root.querySelector('.wh-footer');if(footer)footer.before(section);else root.appendChild(section);
}
function rewriteHomeNav(){
 const root=document.getElementById('fgWebsiteHome');if(!root)return;
 root.querySelectorAll('.wh-links a,.wh-foot-links a').forEach(a=>{const key=norm(a.textContent).replace(/→/g,'').trim();if(ROUTES[key])replaceLink(a,ROUTES[key])});
 ensureOrderedLinks(root.querySelector('.wh-links'));
 const foot=root.querySelector('.wh-foot-links');if(foot)ensureOrderedLinks(foot);
 buildHomepageExplore(root);
 const params=new URLSearchParams(location.search);
 if(params.get('login')==='1'||location.hash==='#login'){root.classList.add('hidden');document.getElementById('authScreen')?.classList.remove('hidden');document.body.style.overflow='hidden'}
}
function normalizeSiteNav(){
 ensureOrderedLinks(document.querySelector('.site-links'));
 ensureOrderedLinks(document.querySelector('.mobile-drawer'),true);
 const footer=document.querySelector('.footer-links');if(footer)ensureOrderedLinks(footer);
}
function mobileMenu(){
 const btn=document.querySelector('[data-site-menu]'),drawer=document.querySelector('[data-site-drawer]');if(!btn||!drawer)return;
 btn.addEventListener('click',()=>drawer.classList.toggle('open'));
 drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>drawer.classList.remove('open')));
 document.addEventListener('click',e=>{if(drawer.classList.contains('open')&&!drawer.contains(e.target)&&e.target!==btn)drawer.classList.remove('open')});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')drawer.classList.remove('open')});
}
function markActive(){
 const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
 document.querySelectorAll('.site-links a,.mobile-drawer a,.footer-links a').forEach(a=>{const href=(a.getAttribute('href')||'').split('?')[0].replace('./','').toLowerCase();const active=(page==='index.html'&&(!href||href==='index.html'))||href===page;a.classList.toggle('active',active)});
}
function sameSitePage(a){
 if(!a?.href||a.target==='_blank'||a.hasAttribute('download'))return false;
 let u;try{u=new URL(a.href,location.href)}catch(_){return false}
 if(u.origin!==location.origin)return false;
 if(u.pathname===location.pathname&&u.search===location.search&&u.hash)return false;
 return /(?:\/|\.html)$/.test(u.pathname)||u.pathname===location.pathname;
}
function prefetchLinks(){
 const seen=new Set();
 const prefetch=a=>{if(!sameSitePage(a))return;const u=new URL(a.href,location.href);u.hash='';const href=u.href;if(seen.has(href)||href===location.href.split('#')[0])return;seen.add(href);const l=document.createElement('link');l.rel='prefetch';l.href=href;l.as='document';document.head.appendChild(l)};
 document.addEventListener('pointerover',e=>{const a=e.target.closest?.('a[href]');if(a)prefetch(a)},{passive:true});
 document.addEventListener('touchstart',e=>{const a=e.target.closest?.('a[href]');if(a)prefetch(a)},{passive:true});
}
function smoothNavigation(){
 const nativeVT=('startViewTransition'in document)&&!!CSS?.supports?.('view-transition-name: root');
 document.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const a=e.target.closest?.('a[href]');if(!sameSitePage(a))return;
  if(reduced()||nativeVT)return;
  e.preventDefault();
  if(document.documentElement.classList.contains('fg-page-leaving'))return;
  document.documentElement.classList.add('fg-page-leaving');
  setTimeout(()=>location.assign(a.href),175);
 },true);
}
function revealContent(){
 const targets=[...document.querySelectorAll('main .info-card,main .step,main .threshold,main .timeline-item,main .visual-card,main .dark-item,main .metric,main .cta-box,main .problem-stat,main .impact-box,main .source-item,main [class*="media-card"],main .problem-media,#fgMultiPageExplore .fgmp-head,#fgMultiPageExplore .fgmp-card,#fgWebsiteHome .wh-card,#fgWebsiteHome .wh-step,#fgWebsiteHome .wh-panel,#fgWebsiteHome .wh-copy,#fgWebsiteHome .wh-sos,#fgWebsiteHome .wh-about')];
 if(!targets.length)return;
 if(reduced()||!('IntersectionObserver'in window)){targets.forEach(x=>x.classList.add('fg-visible'));return}
 targets.forEach((el,i)=>{el.classList.add('fg-reveal');el.style.setProperty('--fg-delay',Math.min((i%6)*48,240)+'ms')});
 const io=new IntersectionObserver(entries=>{entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add('fg-visible');io.unobserve(en.target)}})},{rootMargin:'0px 0px -7% 0px',threshold:.08});
 targets.forEach(el=>io.observe(el));
}
function installCinematicDepth(){
 const h=document.documentElement;h.dataset.fgCinematic='1';
 if(!document.getElementById('fg48ScrollProgress')){
  const p=document.createElement('div');p.id='fg48ScrollProgress';p.setAttribute('aria-hidden','true');document.body.appendChild(p);
 }
 const progress=document.getElementById('fg48ScrollProgress');
 let scrollRaf=0;
 const paintProgress=()=>{scrollRaf=0;const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);const v=Math.min(1,Math.max(0,scrollY/max));progress.style.transform=`scaleX(${v})`};
 const onScroll=()=>{if(!scrollRaf)scrollRaf=requestAnimationFrame(paintProgress)};
 addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll,{passive:true});paintProgress();
 if(reduced()||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
 const selectors=['.visual','.wh-window','.email-preview','.ev-map','.risk-panel','.sos-card','.feature-tile.accent','[class*="media-feature"]'];
 const targets=[...new Set(selectors.flatMap(s=>[...document.querySelectorAll(s)]))];
 targets.forEach(el=>{
  el.classList.add('fg-depth-target');
  let raf=0,last=null;
  const draw=()=>{raf=0;if(!last)return;const r=el.getBoundingClientRect();if(!r.width||!r.height)return;const x=Math.min(1,Math.max(0,(last.clientX-r.left)/r.width));const y=Math.min(1,Math.max(0,(last.clientY-r.top)/r.height));const ry=(x-.5)*7.2;const rx=(.5-y)*6.0;el.style.setProperty('--fg48-ry',ry.toFixed(2)+'deg');el.style.setProperty('--fg48-rx',rx.toFixed(2)+'deg');el.style.setProperty('--fg48-mx',(x*100).toFixed(1)+'%');el.style.setProperty('--fg48-my',(y*100).toFixed(1)+'%')};
  el.addEventListener('pointerenter',()=>el.classList.add('fg-depth-live'),{passive:true});
  el.addEventListener('pointermove',e=>{last=e;if(!raf)raf=requestAnimationFrame(draw)},{passive:true});
  el.addEventListener('pointerleave',()=>{last=null;el.classList.remove('fg-depth-live');el.style.setProperty('--fg48-rx','0deg');el.style.setProperty('--fg48-ry','0deg');el.style.setProperty('--fg48-mx','50%');el.style.setProperty('--fg48-my','50%')},{passive:true});
 });
}
function pageEntrance(){
 if(reduced())return;
 const h=document.documentElement;h.classList.add('fg-js-motion','fg-enter');
 requestAnimationFrame(()=>requestAnimationFrame(()=>h.classList.remove('fg-enter')));
 window.addEventListener('pageshow',()=>h.classList.remove('fg-page-leaving'));
}
function start(){installAtelierTheme();installCinematicTheme();installEditorialTheme();installMotionStyles();rewriteHomeNav();normalizeSiteNav();mobileMenu();markActive();prefetchLinks();smoothNavigation();revealContent();installCinematicDepth();pageEntrance()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();