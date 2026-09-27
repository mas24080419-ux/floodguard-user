(()=>{
'use strict';
if(window.__FG_SITE_NAV_V56__)return;window.__FG_SITE_NAV_V56__=true;

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
 bar.innerHTML='<div class="fg52-topbar-inner"><span>🌧 FloodGuard HCMC · Dữ liệu ngập & hỗ trợ hành trình</span><span><a href="./data.html">Dữ liệu</a> &nbsp;·&nbsp; <a href="./contact.html">Liên hệ</a></span></div>';
 const nav=root?.querySelector?.('.wh-nav');
 if(root&&nav)root.insertBefore(bar,nav);else{const siteNav=document.querySelector('.site-nav');if(siteNav)siteNav.before(bar)}
}
function restoreHomepageSections(root){
 ['features','how','watchlist','ev','rescue','about'].forEach(id=>{const el=root.querySelector('#'+id);if(el)el.style.removeProperty('display')});
 document.getElementById('fgMultiPageExplore')?.remove();
}
function setupHeroSlider(root){
 const hero=root?.querySelector('.wh-hero');if(!hero||hero.dataset.fg56Ready==='1')return;
 hero.dataset.fg56Ready='1';
 const copy=hero.children[0];if(!copy)return;copy.classList.add('fg51-hero-copy');
 const imgWidth=innerWidth<=720?1000:(innerWidth<=1024?1200:1600);
 const photo=n=>`https://commons.wikimedia.org/wiki/Special:FilePath/${n}.jpg?width=${imgWidth}`;
 const slides=[
  {label:'FloodGuard HCMC',title:'Chủ động trước nguy cơ ngập đô thị.',body:'Kiểm tra khu vực, xem dự báo và đánh giá tuyến đường trước khi bắt đầu hành trình.',cta:'Dùng FloodGuard',href:'./?login=1',secondary:'Xem vấn đề ngập',secondaryHref:'./problem.html',image:photo('Street_flood_in_Saigon_(10728572006)')},
  {label:'Dự báo ngập',title:'Thử kịch bản mưa trước khi bạn lên đường.',body:'Thay đổi lượng mưa đầu vào để xem mức ngập ước tính và mức rủi ro theo dữ liệu hiện có.',cta:'Thử dự báo',href:'./?login=1',secondary:'Cách hoạt động',secondaryHref:'./how-it-works.html',image:photo('Street_flood_in_Saigon_(10728890034)')},
  {label:'Đường đi',title:'Nhìn rủi ro trên cả hành trình, không chỉ một điểm.',body:'FloodGuard hỗ trợ nhận biết đoạn cần chú ý và so sánh phương án di chuyển khi điều kiện mưa thay đổi.',cta:'Kiểm tra tuyến đường',href:'./?login=1',secondary:'Xem tính năng',secondaryHref:'./features.html',image:photo('Street_flood_in_Saigon_(10729260963)')},
  {label:'SOS Rescue',title:'Khi cần hỗ trợ, chuyển nhanh sang cứu hộ.',body:'Gửi yêu cầu SOS, chia sẻ thông tin vị trí và theo dõi trạng thái xử lý trong cùng hệ thống.',cta:'Mở cứu hộ',href:'./rescue.html',secondary:'Giới thiệu',secondaryHref:'./about.html',image:photo('Street_flood_in_Saigon_(10728572006)')}
 ];

 const media=document.createElement('div');media.className='fg51-hero-media';media.setAttribute('aria-hidden','true');
 media.innerHTML=slides.map((s,i)=>`<div class="fg51-slide${i===0?' is-active':''}"><img ${i===0?`src="${s.image}" fetchpriority="high"`:`data-src="${s.image}"`} alt="" decoding="async" draggable="false"></div>`).join('');
 hero.prepend(media);

 const controls=document.createElement('div');controls.className='fg51-controls';controls.setAttribute('aria-label','Điều khiển banner');
 controls.innerHTML=`<div class="fg51-dots">${slides.map((_,i)=>`<button class="fg51-dot${i===0?' is-active':''}" type="button" aria-label="Banner ${i+1}"></button>`).join('')}</div><button class="fg51-next" type="button" aria-label="Banner tiếp theo">›</button>`;
 hero.appendChild(controls);
 const credit=document.createElement('div');credit.className='fg51-credit';credit.textContent='Ảnh tư liệu TP.HCM · Wikimedia Commons · CC BY 2.0';hero.appendChild(credit);

 const slideEls=[...media.querySelectorAll('.fg51-slide')];
 const decoded=new Set();
 const decodeSlide=async i=>{
  if(decoded.has(i))return;
  const img=slideEls[i]?.querySelector('img');if(!img)return;
  if(!img.getAttribute('src'))img.src=img.dataset.src||slides[i].image;
  try{
   if(img.decode)await img.decode();
   else if(!img.complete)await new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true})});
  }catch(_){/* Keep the loaded image even if decode() rejects. */}
  decoded.add(i);
 };

 /* Decode the first frame immediately and warm later frames one by one when idle. */
 decodeSlide(0);
 const warm=async()=>{for(let i=1;i<slides.length;i++)await decodeSlide(i)};
 if('requestIdleCallback'in window)requestIdleCallback(()=>warm(),{timeout:2500});else setTimeout(()=>warm(),650);

 let index=0,timer=null,paused=false,transitioning=false,pendingIndex=null;
 const renderCopy=s=>{copy.innerHTML=`<span class="wh-eyebrow">${s.label}</span><h1>${s.title}</h1><p>${s.body}</p><div class="wh-hero-actions"><a class="wh-btn primary" href="${s.href}">${s.cta}</a><a class="wh-btn" href="${s.secondaryHref}">${s.secondary}</a></div>`};
 const activateVisual=next=>{
  slideEls.forEach((el,i)=>el.classList.toggle('is-active',i===next));
  controls.querySelectorAll('.fg51-dot').forEach((el,i)=>el.classList.toggle('is-active',i===next));
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
   activateVisual(index);renderCopy(s);copy.classList.remove('is-changing');transitioning=false;return;
  }

  copy.classList.add('is-changing');
  /* Crossfade starts only after the incoming image is decoded. */
  requestAnimationFrame(()=>requestAnimationFrame(()=>activateVisual(index)));
  setTimeout(()=>{
   renderCopy(s);
   requestAnimationFrame(()=>requestAnimationFrame(()=>copy.classList.remove('is-changing')));
  },260);
  setTimeout(finishTransition,1500);
 };
 const restart=()=>{if(reduced()||paused)return;if(timer)clearInterval(timer);timer=setInterval(()=>paint(index+1),7200)};
 controls.querySelectorAll('.fg51-dot').forEach((b,i)=>b.addEventListener('click',()=>{paint(i);restart()}));
 controls.querySelector('.fg51-next')?.addEventListener('click',()=>{paint(index+1);restart()});
 hero.addEventListener('mouseenter',()=>{paused=true;if(timer)clearInterval(timer)});
 hero.addEventListener('mouseleave',()=>{paused=false;restart()});
 hero.addEventListener('focusin',()=>{paused=true;if(timer)clearInterval(timer)});
 hero.addEventListener('focusout',()=>{paused=false;restart()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(timer)clearInterval(timer)}else restart()});
 paint(0,true);restart();
}
function rewriteHome(){
 const root=document.getElementById('fgWebsiteHome');if(!root)return;
 addUtilityBar(root);restoreHomepageSections(root);purgeHiddenLinks(root);ensureOrderedLinks(root.querySelector('.wh-links'));
 const foot=root.querySelector('.wh-foot-links');if(foot)ensureOrderedLinks(foot);
 setupHeroSlider(root);purgeHiddenLinks(root);
}
function normalizeSiteNav(){
 addUtilityBar(null);purgeHiddenLinks(document);ensureOrderedLinks(document.querySelector('.site-links'));ensureOrderedLinks(document.querySelector('.mobile-drawer'),true);const footer=document.querySelector('.footer-links');if(footer)ensureOrderedLinks(footer);purgeHiddenLinks(document)
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
function reveal(){
 const targets=[...document.querySelectorAll('.wh-card,.wh-step,.wh-panel,.wh-copy,.wh-sos,.wh-about,.info-card,.problem-stat,.cause-card,.impact-box,.station-card,.principle-card,.source-item')];
 if(reduced()||!('IntersectionObserver'in window)){targets.forEach(x=>x.classList.add('fg52-visible'));return}
 const st=document.createElement('style');st.textContent='.fg52-reveal{opacity:0;transform:translate3d(0,12px,0);transition:opacity .54s ease-out,transform .62s cubic-bezier(.16,1,.3,1)}.fg52-reveal.fg52-visible{opacity:1;transform:none}@media(prefers-reduced-motion:reduce){.fg52-reveal{opacity:1!important;transform:none!important;transition:none!important}}';document.head.appendChild(st);
 targets.forEach(x=>x.classList.add('fg52-reveal'));
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('fg52-visible');io.unobserve(e.target)}}),{threshold:.06,rootMargin:'0px 0px -2%'});targets.forEach(x=>io.observe(x));
}
function start(){installThemes();rewriteHome();normalizeSiteNav();mobileMenu();markActive();reveal()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();