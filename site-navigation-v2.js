(()=>{
'use strict';
if(window.__FG_SITE_NAV_V51__)return;window.__FG_SITE_NAV_V51__=true;

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
 document.documentElement.dataset.fgEditorial='1';
 document.documentElement.dataset.fgLifestyle='1';
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

function buildHomepageExplore(root){
 if(document.getElementById('fgMultiPageExplore'))return;
 ['features','how','watchlist','ev','rescue','about'].forEach(id=>{const el=root.querySelector('#'+id);if(el)el.style.display='none'});
 if(!document.getElementById('fgMultiPageHomeStyle')){
  const st=document.createElement('style');st.id='fgMultiPageHomeStyle';st.textContent=`
  #fgMultiPageExplore{padding:70px 0 76px;background:#fff;border-top:1px solid #e0e9f3;border-bottom:1px solid #e0e9f3}
  #fgMultiPageExplore .fgmp-head{max-width:760px;margin-bottom:27px}#fgMultiPageExplore .fgmp-head span{font-size:11px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#2d6fc8}#fgMultiPageExplore .fgmp-head h2{font-size:clamp(30px,4vw,46px);line-height:1.08;letter-spacing:-.04em;margin:8px 0 10px;color:#102a43}#fgMultiPageExplore .fgmp-head p{margin:0;color:#6b7f93;font-size:14px;line-height:1.7}
  #fgMultiPageExplore .fgmp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}#fgMultiPageExplore .fgmp-card{display:block;text-decoration:none;color:#17304f;border:1px solid #dfe9f3;border-radius:20px;padding:20px;background:#f9fbfe;min-height:155px}#fgMultiPageExplore .fgmp-card.problem{background:linear-gradient(145deg,#f6faff,#edf5ff);border-color:#cfe0f3}#fgMultiPageExplore .fgmp-icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#eaf3ff;margin-bottom:14px;font-size:18px}#fgMultiPageExplore .fgmp-card b{display:block;font-size:16px;margin-bottom:6px}#fgMultiPageExplore .fgmp-card small{display:block;color:#718399;font-size:11px;line-height:1.55}#fgMultiPageExplore .fgmp-card em{display:block;margin-top:12px;color:#2d6fc8;font-size:10px;font-style:normal;font-weight:900}
  @media(max-width:860px){#fgMultiPageExplore .fgmp-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){#fgMultiPageExplore{padding:48px 0}#fgMultiPageExplore .fgmp-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(st);
 }
 const section=document.createElement('section');section.id='fgMultiPageExplore';section.innerHTML=`<div class="wh-shell"><div class="fgmp-head"><span>Khám phá FloodGuard</span><h2>Từ nguy cơ ngập đến quyết định di chuyển rõ ràng hơn</h2><p>Đi từ bối cảnh ngập đô thị đến công cụ dự báo, cảnh báo và cứu hộ mà không làm người dùng bị quá tải bởi thuật ngữ kỹ thuật.</p></div><div class="fgmp-grid"><a class="fgmp-card problem" href="./problem.html"><span class="fgmp-icon">🌧</span><b>Vấn đề ngập đô thị</b><small>Thực trạng TP.HCM, nguyên nhân và tác động tới giao thông.</small><em>Xem vấn đề →</em></a><a class="fgmp-card" href="./features.html"><span class="fgmp-icon">🧩</span><b>Tính năng</b><small>Bản đồ, dự báo, tuyến đường, Watchlist và SOS trong cùng hệ thống.</small><em>Xem tính năng →</em></a><a class="fgmp-card" href="./how-it-works.html"><span class="fgmp-icon">⚙️</span><b>Cách hoạt động</b><small>Từ dữ liệu mưa và lịch sử ngập đến thông tin rủi ro trên tuyến.</small><em>Xem quy trình →</em></a><a class="fgmp-card" href="./alerts.html"><span class="fgmp-icon">🔔</span><b>Cảnh báo</b><small>Watchlist cá nhân và email khi điều kiện đạt ngưỡng cảnh báo.</small><em>Xem cảnh báo →</em></a><a class="fgmp-card" href="./rescue.html"><span class="fgmp-icon">🆘</span><b>Cứu hộ</b><small>Gửi SOS, chia sẻ vị trí và theo dõi trạng thái hỗ trợ.</small><em>Xem cứu hộ →</em></a><a class="fgmp-card" href="./about.html"><span class="fgmp-icon">FG</span><b>Giới thiệu</b><small>Mục tiêu, phạm vi và nguyên tắc phát triển FloodGuard HCMC.</small><em>Về FloodGuard →</em></a></div></div>`;
 const footer=root.querySelector('.wh-footer');if(footer)footer.before(section);else root.appendChild(section);
}

function setupHeroSlider(root){
 const hero=root?.querySelector('.wh-hero');if(!hero||hero.dataset.fg51Ready==='1')return;
 hero.dataset.fg51Ready='1';
 const copy=hero.children[0];if(!copy)return;copy.classList.add('fg51-hero-copy');
 const slides=[
  {
   label:'Flood Intelligence',
   title:'Biết tuyến đường nào cần chú ý trước khi bạn di chuyển.',
   body:'FloodGuard kết hợp dữ liệu mưa, bằng chứng ngập lịch sử và bản đồ để giúp bạn kiểm tra rủi ro theo đúng khu vực đang quan tâm.',
   cta:'Mở FloodGuard',href:'./?login=1',secondary:'Xem vấn đề ngập',secondaryHref:'./problem.html',
   image:'https://commons.wikimedia.org/wiki/Special:FilePath/Street_flood_in_Saigon_(10728572006).jpg?width=2000'
  },
  {
   label:'Rainfall Scenarios',
   title:'Thử kịch bản mưa và xem mức ngập ước tính theo dữ liệu hiện có.',
   body:'Thay đổi lượng mưa đầu vào, xem kết quả dự báo và giữ rõ ranh giới giữa dữ liệu quan sát, lịch sử và dự báo mô hình.',
   cta:'Thử dự báo',href:'./?login=1',secondary:'Cách hệ thống hoạt động',secondaryHref:'./how-it-works.html',
   image:'https://commons.wikimedia.org/wiki/Special:FilePath/Street_flood_in_Saigon_(10728890034).jpg?width=2000'
  },
  {
   label:'Route Awareness',
   title:'Đánh giá hành trình trong bối cảnh ngập, không chỉ nhìn thời gian di chuyển.',
   body:'FloodGuard giúp nhận biết các đoạn cần chú ý trên lộ trình và hỗ trợ so sánh phương án di chuyển khi điều kiện mưa thay đổi.',
   cta:'Kiểm tra tuyến đường',href:'./?login=1',secondary:'Xem tính năng',secondaryHref:'./features.html',
   image:'https://commons.wikimedia.org/wiki/Special:FilePath/Street_flood_in_Saigon_(10729260963).jpg?width=2000'
  },
  {
   label:'SOS Rescue',
   title:'Khi cần hỗ trợ, chuyển nhanh sang luồng cứu hộ FloodGuard.',
   body:'Module SOS giúp gửi yêu cầu cứu hộ, chia sẻ vị trí và theo dõi trạng thái xử lý trong cùng hệ thống.',
   cta:'Mở cứu hộ',href:'./rescue.html',secondary:'Về FloodGuard',secondaryHref:'./about.html',
   image:'https://commons.wikimedia.org/wiki/Special:FilePath/Street_flood_in_Saigon_(10728572006).jpg?width=2000'
  }
 ];
 const media=document.createElement('div');media.className='fg51-hero-media';media.setAttribute('aria-hidden','true');
 media.innerHTML=slides.map((s,i)=>`<div class="fg51-slide${i===0?' is-active':''}" style="background-image:url('${s.image}')"></div>`).join('');hero.prepend(media);
 const controls=document.createElement('div');controls.className='fg51-controls';controls.setAttribute('aria-label','Điều khiển slide');controls.innerHTML=`<div class="fg51-dots">${slides.map((_,i)=>`<button class="fg51-dot${i===0?' is-active':''}" type="button" aria-label="Slide ${i+1}"></button>`).join('')}</div><button class="fg51-next" type="button" aria-label="Slide tiếp theo">›</button>`;hero.appendChild(controls);
 const credit=document.createElement('div');credit.className='fg51-credit';credit.textContent='Ảnh nền: tư liệu TP.HCM (2013) · Wikimedia Commons · CC BY 2.0';hero.appendChild(credit);
 let index=0,timer=null,paused=false;
 const paint=(next,instant=false)=>{
  index=(next+slides.length)%slides.length;const s=slides[index];
  const apply=()=>{
   copy.innerHTML=`<span class="wh-eyebrow">${s.label}</span><h1>${s.title}</h1><p>${s.body}</p><div class="wh-hero-actions"><a class="wh-btn primary" href="${s.href}">${s.cta} →</a><a class="wh-btn" href="${s.secondaryHref}">${s.secondary}</a></div>`;
   media.querySelectorAll('.fg51-slide').forEach((el,i)=>el.classList.toggle('is-active',i===index));
   controls.querySelectorAll('.fg51-dot').forEach((el,i)=>el.classList.toggle('is-active',i===index));
  };
  if(instant||reduced()){apply();return}
  copy.classList.add('is-changing');setTimeout(()=>{apply();requestAnimationFrame(()=>copy.classList.remove('is-changing'))},220);
 };
 const restart=()=>{if(reduced()||paused)return;if(timer)clearInterval(timer);timer=setInterval(()=>paint(index+1),6500)};
 controls.querySelectorAll('.fg51-dot').forEach((b,i)=>b.addEventListener('click',()=>{paint(i);restart()}));
 controls.querySelector('.fg51-next')?.addEventListener('click',()=>{paint(index+1);restart()});
 hero.addEventListener('mouseenter',()=>{paused=true;if(timer)clearInterval(timer)});
 hero.addEventListener('mouseleave',()=>{paused=false;restart()});
 hero.addEventListener('focusin',()=>{paused=true;if(timer)clearInterval(timer)});
 hero.addEventListener('focusout',()=>{paused=false;restart()});
 paint(0,true);restart();
}

function rewriteHomeNav(){
 const root=document.getElementById('fgWebsiteHome');if(!root)return;
 purgeHiddenLinks(root);ensureOrderedLinks(root.querySelector('.wh-links'));
 const foot=root.querySelector('.wh-foot-links');if(foot)ensureOrderedLinks(foot);
 buildHomepageExplore(root);setupHeroSlider(root);purgeHiddenLinks(root);
 const params=new URLSearchParams(location.search);
 if(params.get('login')==='1'||location.hash==='#login'){root.classList.add('hidden');document.getElementById('authScreen')?.classList.remove('hidden');document.body.style.overflow='hidden'}
}
function normalizeSiteNav(){
 purgeHiddenLinks(document);ensureOrderedLinks(document.querySelector('.site-links'));ensureOrderedLinks(document.querySelector('.mobile-drawer'),true);const footer=document.querySelector('.footer-links');if(footer)ensureOrderedLinks(footer);purgeHiddenLinks(document)
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
function installMotionStyles(){
 if(document.getElementById('fg51Motion'))return;const s=document.createElement('style');s.id='fg51Motion';s.textContent=`
 .mobile-drawer{transition:opacity .24s ease,transform .28s cubic-bezier(.16,1,.3,1),visibility .24s}.site-btn,.wh-btn,.fgmp-card{transition:transform .24s cubic-bezier(.16,1,.3,1),box-shadow .24s ease,background .24s ease}
 @media(max-width:980px){.mobile-drawer{display:grid!important;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-8px)}.mobile-drawer.open{opacity:1;visibility:visible;pointer-events:auto;transform:none}}
 @media(prefers-reduced-motion:reduce){.mobile-drawer,.site-btn,.wh-btn,.fgmp-card{transition:none!important}}
 `;document.head.appendChild(s)
}
function pageEntrance(){if(reduced())return;document.documentElement.animate?.([{opacity:.55},{opacity:1}],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'})}
function start(){installThemes();installMotionStyles();rewriteHomeNav();normalizeSiteNav();mobileMenu();markActive();pageEntrance()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();