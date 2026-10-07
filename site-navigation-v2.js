(()=>{
'use strict';
if(window.__FG_SITE_NAV_V61__)return;window.__FG_SITE_NAV_V61__=true;

const ROUTES={
 'trang chủ':'./',
 'vấn đề':'./problem.html',
 'tính năng':'./features.html',
 'cách hoạt động':'./how-it-works.html',
 'cảnh báo':'./alerts.html',
 'cứu hộ':'./rescue.html',
 'giới thiệu':'./about.html'
};
const ORDER=['Vấn đề','Tính năng','Cách hoạt động','Cảnh báo','Cứu hộ','Giới thiệu'];
const HIDDEN_KEYS=new Set(['trạm sạc ev']);
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const norm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
const linkKey=a=>norm(a?.textContent).replace(/→/g,'').trim();

function installStylesheet(href,key){
 if(document.querySelector(`link[data-fg-style="${key}"]`)||[...document.styleSheets].some(s=>String(s.href||'').includes(href.split('?')[0])))return;
 const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.fgStyle=key;document.head.appendChild(l);
}
function installThemes(){
 installStylesheet('./site-atelier-v47.css?v=47','atelier');
 installStylesheet('./site-editorial-v49.css?v=49','editorial');
 installStylesheet('./site-hide-ev-v50.css?v=50','hide-ev');
 installStylesheet('./site-travel-v51.css?v=51','travel-v51');
 installStylesheet('./site-mona-v52.css?v=52','mona-v52');
 installStylesheet('./site-motion-v53.css?v=53','motion-v53');
 installStylesheet('./site-motion-v54.css?v=55','motion-v55');
 installStylesheet('./site-motion-v56.css?v=56','motion-v56');
 installStylesheet('./site-mona-v57.css?v=58','mona-v57');
 installStylesheet('./site-action-v59.css?v=61','action-v61');
 installStylesheet('./site-step-v62.css?v=62','step-v62');
 installStylesheet('./home-design-v66.css?v=66','home-v66');
 installStylesheet('./mobile-design-v67.css?v=67','mobile-v67');
 const mobileStyle=document.querySelector('link[href*="mobile-design-v67.css"]');if(mobileStyle)document.head.appendChild(mobileStyle);
 document.documentElement.dataset.fgEditorial='1';
 document.documentElement.dataset.fgLifestyle='1';
 document.documentElement.dataset.fgMona='1';
}
function isHiddenLink(a){
 const k=linkKey(a),href=String(a?.getAttribute?.('href')||'').split('?')[0].toLowerCase();
 return HIDDEN_KEYS.has(k)||/(^|\/)ev\.html$/.test(href.replace(/^\.\//,''));
}
function purgeHiddenLinks(scope=document){scope.querySelectorAll?.('a[href],a').forEach(a=>{if(isHiddenLink(a))a.remove()})}
function ensureOrderedLinks(container,home=false){
 if(!container)return;
 [...container.querySelectorAll('a')].forEach(a=>{if(isHiddenLink(a))a.remove()});
 const existing=[...container.querySelectorAll('a')],map=new Map(existing.map(a=>[linkKey(a),a])),frag=document.createDocumentFragment();
 if(home){let h=map.get('trang chủ');if(!h){h=document.createElement('a');h.textContent='Trang chủ'}h.href='./';frag.appendChild(h)}
 ORDER.forEach(label=>{const key=norm(label);let a=map.get(key);if(!a){a=document.createElement('a');a.textContent=label}a.href=ROUTES[key];frag.appendChild(a)});
 existing.forEach(a=>{const k=linkKey(a);if(!ROUTES[k]&&k!=='trang chủ'&&!HIDDEN_KEYS.has(k)&&!isHiddenLink(a))frag.appendChild(a)});
 container.replaceChildren(frag);
}
function addUtilityBar(root){
 if(document.querySelector('.fg52-topbar'))return;
 const bar=document.createElement('div');bar.className='fg52-topbar';
 bar.innerHTML='<div class="fg52-topbar-inner"><span>🌧 FloodGuard HCMC · Dữ liệu ngập & hỗ trợ hành trình</span><span><a href="./alerts.html#live">Mưa trực tiếp</a> &nbsp;·&nbsp; <a href="./live.html">Mưa trực tiếp</a> &nbsp;·&nbsp; <a href="./data.html">Dữ liệu</a> &nbsp;·&nbsp; <a href="./contact.html">Liên hệ</a></span></div>';
 const nav=root?.querySelector?.('.wh-nav');
 if(root&&nav)root.insertBefore(bar,nav);else{const siteNav=document.querySelector('.site-nav');if(siteNav)siteNav.before(bar)}
}
function restoreHomepageSections(root){
 ['features','how','watchlist','ev','rescue','about'].forEach(id=>{const el=root.querySelector('#'+id);if(el)el.style.removeProperty('display')});
 document.getElementById('fgMultiPageExplore')?.remove();
}
function insertQuickBar(root){
 if(!root||root.querySelector('.fg57-quickbar-wrap'))return;
 const hero=root.querySelector('.wh-hero');if(!hero)return;
 const wrap=document.createElement('div');wrap.className='fg57-quickbar-wrap';
 wrap.innerHTML=`<div class="fg57-quickbar" aria-label="Truy cập nhanh FloodGuard">
   <a class="fg57-quickitem" href="./?login=1"><span class="fg57-quickicon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15m6-12v15"/></svg></span><span><small>Kiểm tra khu vực</small><b>Mở bản đồ ngập</b><span>Xem rủi ro theo vị trí và tuyến đường.</span></span></a>
   <a class="fg57-quickitem" href="./?login=1"><span class="fg57-quickicon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15a4 4 0 0 1 0-8 6 6 0 0 1 11-2 5 5 0 1 1 4 10"/><path d="m7 18-1 3m6-3-1 3m6-3-1 3"/></svg></span><span><small>Kịch bản lượng mưa</small><b>Thử dự báo ngập</b><span>Ước tính mức ngập theo dữ liệu hiện có.</span></span></a>
   <a class="fg57-quickitem" href="./how-it-works.html"><span class="fg57-quickicon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h10M4 10h7M4 15h5m6-1 5 3-5 3v-6Z"/></svg></span><span><small>Hành trình</small><b>Hướng dẫn sử dụng</b><span>Ba bước để bắt đầu kiểm tra tuyến.</span></span></a>
  </div>`;
 hero.insertAdjacentElement('afterend',wrap);
}
function setupHeroSlider(root){
 const hero=root?.querySelector('.wh-hero');if(!hero||hero.dataset.fg59Ready==='1')return;
 hero.dataset.fg59Ready='1';
 const copy=hero.children[0];if(!copy)return;copy.classList.add('fg51-hero-copy');
 const imgWidth=innerWidth<=720?1000:(innerWidth<=1024?1200:1600);
 const photo=n=>`https://commons.wikimedia.org/wiki/Special:FilePath/${n}.jpg?width=${imgWidth}`;
 const slides=[
  {label:'FloodGuard HCMC',title:'Kiểm tra nguy cơ ngập trên hành trình của bạn.',body:'Kiểm tra khu vực, xem dữ liệu liên quan và đánh giá rủi ro trước khi bắt đầu hành trình.',cta:'Mở bản đồ',href:'./?login=1',secondary:'Cách sử dụng',secondaryHref:'./how-it-works.html',image:photo('Street_flood_in_Saigon_(10728572006)')},
  {label:'Dự báo ngập',title:'Thử kịch bản mưa trước khi bạn lên đường.',body:'Thay đổi lượng mưa đầu vào để xem mức ngập ước tính và mức rủi ro theo dữ liệu hiện có.',cta:'Thử dự báo',href:'./?login=1',secondary:'Cách hoạt động',secondaryHref:'./how-it-works.html',image:photo('Street_flood_in_Saigon_(10728890034)')},
  {label:'Đường đi',title:'Nhìn rủi ro trên cả hành trình, không chỉ một điểm.',body:'FloodGuard hỗ trợ nhận biết đoạn cần chú ý và so sánh phương án di chuyển khi điều kiện mưa thay đổi.',cta:'Kiểm tra tuyến đường',href:'./?login=1',secondary:'Xem tính năng',secondaryHref:'./features.html',image:photo('Street_flood_in_Saigon_(10729260963)')}
 ];

 const media=document.createElement('div');media.className='fg51-hero-media';media.setAttribute('aria-hidden','true');
 media.innerHTML=slides.map((s,i)=>`<div class="fg51-slide${i===0?' is-active':''}"><img ${i===0?`src="${s.image}" fetchpriority="high"`:`data-src="${s.image}"`} alt="" decoding="async" draggable="false"></div>`).join('');
 hero.prepend(media);

 const controls=document.createElement('div');controls.className='fg51-controls';controls.setAttribute('aria-label','Điều khiển banner');
 controls.innerHTML=`<button class="fg51-prev" type="button" aria-label="Banner trước">‹</button><div class="fg51-dots">${slides.map((_,i)=>`<button class="fg51-dot${i===0?' is-active':''}" type="button" aria-label="Banner ${i+1}"${i===0?' aria-current="true"':''}></button>`).join('')}</div><button class="fg51-next" type="button" aria-label="Banner tiếp theo">›</button>`;
 hero.appendChild(controls);
 const progress=document.createElement('div');progress.className='fg57-progress';progress.innerHTML='<i></i>';hero.appendChild(progress);
 const credit=document.createElement('div');credit.className='fg51-credit';credit.textContent='Ảnh tư liệu TP.HCM · Wikimedia Commons · CC BY 2.0';hero.appendChild(credit);

 const slideEls=[...media.querySelectorAll('.fg51-slide')];
 const dotEls=[...controls.querySelectorAll('.fg51-dot')];
 const decoded=new Set();
 const decodeSlide=async i=>{
  if(decoded.has(i))return;
  const img=slideEls[i]?.querySelector('img');if(!img)return;
  if(!img.getAttribute('src'))img.src=img.dataset.src||slides[i].image;
  try{
   if(img.decode)await img.decode();
   else if(!img.complete)await new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true})});
  }catch(_){ }
  decoded.add(i);
 };

 decodeSlide(0);
 const warm=async()=>{for(let i=1;i<slides.length;i++)await decodeSlide(i)};
 if('requestIdleCallback'in window)requestIdleCallback(()=>warm(),{timeout:1600});else setTimeout(()=>warm(),350);

 let index=0,timer=null,transitioning=false,pendingIndex=null;
 const renderCopy=s=>{copy.innerHTML=`<span class="wh-eyebrow">${s.label}</span><h1>${s.title}</h1><p>${s.body}</p><div class="wh-hero-actions"><a class="wh-btn primary" href="${s.href}">${s.cta}</a><a class="wh-btn" href="${s.secondaryHref}">${s.secondary}</a></div>`};
 const activateVisual=next=>{
  slideEls.forEach((el,i)=>el.classList.toggle('is-active',i===next));
  dotEls.forEach((el,i)=>{el.classList.toggle('is-active',i===next);if(i===next)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current')});
 };
 const restartProgress=()=>{
  if(reduced())return;
  progress.classList.remove('is-running');void progress.offsetWidth;progress.classList.add('is-running');
 };
 const finishTransition=()=>{
  transitioning=false;
  if(pendingIndex!==null){const queued=pendingIndex;pendingIndex=null;paint(queued)}
 };
 const paint=async(next,instant=false)=>{
  const target=(next+slides.length)%slides.length;
  if(transitioning&&!instant){pendingIndex=target;return}
  if(target===index&&!instant)return;
  if(!instant){transitioning=true;await decodeSlide(target)}
  index=target;const s=slides[index];
  if(instant||reduced()){
   activateVisual(index);renderCopy(s);copy.classList.remove('is-changing');transitioning=false;restartProgress();return;
  }
  copy.classList.add('is-changing');
  requestAnimationFrame(()=>requestAnimationFrame(()=>activateVisual(index)));
  setTimeout(()=>{
   renderCopy(s);
   requestAnimationFrame(()=>requestAnimationFrame(()=>copy.classList.remove('is-changing')));
  },240);
  setTimeout(finishTransition,1050);
  restartProgress();
 };
 const restart=()=>{
  if(timer)clearInterval(timer);
  progress.classList.remove('is-running');
  /* Keep the headline stable; banners remain manually selectable. */
 };
 dotEls.forEach((b,i)=>b.addEventListener('click',()=>{paint(i);restart()}));
 controls.querySelector('.fg51-prev')?.addEventListener('click',()=>{paint(index-1);restart()});
 controls.querySelector('.fg51-next')?.addEventListener('click',()=>{paint(index+1);restart()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(timer)clearInterval(timer);progress.classList.remove('is-running')}else restart()});
 paint(0,true);restart();
}
function rewriteHome(){
 const root=document.getElementById('fgWebsiteHome');if(!root)return;
 addUtilityBar(root);restoreHomepageSections(root);purgeHiddenLinks(root);ensureOrderedLinks(root.querySelector('.wh-links'));
 const foot=root.querySelector('.wh-foot-links');if(foot)ensureOrderedLinks(foot);
 setupHeroSlider(root);insertQuickBar(root);purgeHiddenLinks(root);
}
function normalizeSiteNav(){
 addUtilityBar(null);purgeHiddenLinks(document);ensureOrderedLinks(document.querySelector('.site-links'));document.querySelectorAll('.site-links a').forEach(a=>{if(!ROUTES[linkKey(a)])a.remove()});ensureOrderedLinks(document.querySelector('.mobile-drawer'),true);const footer=document.querySelector('.footer-links');if(footer)ensureOrderedLinks(footer);purgeHiddenLinks(document)
}
function homepageMenu(){
 const root=document.getElementById('fgWebsiteHome'),nav=root?.querySelector('.wh-nav-in');if(!nav||nav.querySelector('[data-site-menu]'))return;
 const button=document.createElement('button');button.className='fg-mobile-menu';button.type='button';button.setAttribute('data-site-menu','');button.setAttribute('aria-label','Mở menu điều hướng');button.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
 const drawer=document.createElement('nav');drawer.className='mobile-drawer fg-home-drawer';drawer.setAttribute('data-site-drawer','');drawer.setAttribute('aria-label','Điều hướng trang chủ');ensureOrderedLinks(drawer,true);nav.appendChild(button);root.querySelector('.wh-nav').appendChild(drawer);
}
function mobileMenu(){
 const btn=document.querySelector('[data-site-menu]'),drawer=document.querySelector('[data-site-drawer]');if(!btn||!drawer)return;
 drawer.id=drawer.id||'fgMobileMenu';btn.setAttribute('aria-controls',drawer.id);btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Mở menu điều hướng');btn.type='button';drawer.inert=true;
 function setOpen(open){drawer.classList.toggle('open',open);drawer.inert=!open;btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'Đóng menu điều hướng':'Mở menu điều hướng')}
 btn.addEventListener('click',()=>setOpen(!drawer.classList.contains('open')));
 drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setOpen(false)));
 document.addEventListener('click',e=>{if(drawer.classList.contains('open')&&!drawer.contains(e.target)&&!btn.contains(e.target))setOpen(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer.classList.contains('open')){setOpen(false);btn.focus()}});
 matchMedia(document.querySelector('.site-nav')?'(min-width: 1001px)':'(min-width: 721px)').addEventListener('change',e=>{if(e.matches)setOpen(false)});
}
function markActive(){
 const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
 document.querySelectorAll('.site-links a,.mobile-drawer a,.footer-links a').forEach(a=>{const href=(a.getAttribute('href')||'').split('?')[0].replace('./','').toLowerCase();const active=(page==='index.html'&&(!href||href==='index.html'))||href===page;a.classList.toggle('active',active)});
}
function reveal(){
 const targets=[...document.querySelectorAll('.wh-card,.wh-step,.wh-panel,.wh-copy,.wh-sos,.wh-about,.info-card,.problem-stat,.cause-card,.impact-box,.station-card,.principle-card,.source-item')];
 if(reduced()||!('IntersectionObserver'in window)){targets.forEach(x=>x.classList.add('fg52-visible'));return}
 const st=document.createElement('style');st.textContent='.fg52-reveal{opacity:0;transform:translate3d(0,12px,0);transition:opacity .54s ease-out,transform .62s cubic-bezier(.16,1,.3,1)}.fg52-reveal.fg52-visible{opacity:1;transform:none}@media(prefers-reduced-motion:reduce){.fg52-reveal{opacity:1!important;transform:none!important;transition:none!important}}';document.head.appendChild(st);
 targets.forEach(x=>x.classList.add('fg52-reveal'));
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('fg52-visible');io.unobserve(e.target)}}),{threshold:.06,rootMargin:'0px 0px -2%'});targets.forEach(x=>io.observe(x));
}
function addFooterResources(){document.querySelectorAll('.wh-foot-links,.footer-links').forEach(foot=>{[['Mưa trực tiếp','./alerts.html#live'],['Dữ liệu','./data.html'],['Hướng dẫn','./how-it-works.html'],['Liên hệ','./contact.html']].forEach(([label,href])=>{if(!foot.querySelector(`a[href="${href}"]`)){const a=document.createElement('a');a.textContent=label;a.href=href;foot.appendChild(a)}})});document.querySelectorAll('.site-actions .primary').forEach(a=>a.textContent='Mở bản đồ →')}
function start(){installThemes();rewriteHome();normalizeSiteNav();homepageMenu();mobileMenu();markActive();addFooterResources();reveal()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();