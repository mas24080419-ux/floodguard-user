(()=>{
'use strict';
if(window.__FG_SITE_NAV_V2__)return;window.__FG_SITE_NAV_V2__=true;
const ROUTES={
 'trang chủ':'./',
 'tính năng':'./features.html',
 'cách hoạt động':'./how-it-works.html',
 'cảnh báo':'./alerts.html',
 'trạm sạc ev':'./ev.html',
 'cứu hộ':'./rescue.html',
 'giới thiệu':'./about.html'
};
function norm(s){return String(s||'').trim().toLowerCase().replace(/\s+/g,' ')}
function replaceLink(a,href){
 const clone=a.cloneNode(true);
 clone.setAttribute('href',href);
 a.replaceWith(clone);
 return clone;
}
function buildHomepageExplore(root){
 if(document.getElementById('fgMultiPageExplore'))return;
 ['features','how','watchlist','ev','rescue','about'].forEach(id=>{const el=root.querySelector('#'+id);if(el)el.style.display='none'});
 if(!document.getElementById('fgMultiPageHomeStyle')){
  const st=document.createElement('style');st.id='fgMultiPageHomeStyle';st.textContent=`
  #fgMultiPageExplore{padding:70px 0 76px;background:#fff;border-top:1px solid #e0e9f3;border-bottom:1px solid #e0e9f3}
  #fgMultiPageExplore .fgmp-head{max-width:720px;margin-bottom:27px}#fgMultiPageExplore .fgmp-head span{font-size:11px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#2d6fc8}#fgMultiPageExplore .fgmp-head h2{font-size:clamp(30px,4vw,46px);line-height:1.08;letter-spacing:-.04em;margin:8px 0 10px;color:#102a43}#fgMultiPageExplore .fgmp-head p{margin:0;color:#6b7f93;font-size:14px;line-height:1.7}
  #fgMultiPageExplore .fgmp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}#fgMultiPageExplore .fgmp-card{display:block;text-decoration:none;color:#17304f;border:1px solid #dfe9f3;border-radius:20px;padding:20px;background:#f9fbfe;transition:.18s;min-height:155px}#fgMultiPageExplore .fgmp-card:hover{transform:translateY(-3px);background:#fff;box-shadow:0 16px 34px rgba(26,64,108,.09);border-color:#cddced}#fgMultiPageExplore .fgmp-icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#eaf3ff;margin-bottom:14px;font-size:18px}#fgMultiPageExplore .fgmp-card b{display:block;font-size:16px;margin-bottom:6px}#fgMultiPageExplore .fgmp-card small{display:block;color:#718399;font-size:11px;line-height:1.55}#fgMultiPageExplore .fgmp-card em{display:block;margin-top:12px;color:#2d6fc8;font-size:10px;font-style:normal;font-weight:900}
  @media(max-width:860px){#fgMultiPageExplore .fgmp-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){#fgMultiPageExplore{padding:48px 0}#fgMultiPageExplore .fgmp-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(st);
 }
 const section=document.createElement('section');section.id='fgMultiPageExplore';section.innerHTML=`<div class="wh-shell"><div class="fgmp-head"><span>Khám phá FloodGuard</span><h2>Mỗi chức năng có một trang riêng</h2><p>Chọn nội dung bạn muốn xem. Trang chủ không còn cuộn qua toàn bộ các phần chi tiết.</p></div><div class="fgmp-grid"><a class="fgmp-card" href="./features.html"><span class="fgmp-icon">🧩</span><b>Tính năng</b><small>Dự báo ngập, tìm đường, Watchlist, EV và SOS trong cùng nền tảng.</small><em>Mở trang →</em></a><a class="fgmp-card" href="./how-it-works.html"><span class="fgmp-icon">⚙️</span><b>Cách hoạt động</b><small>Từ dữ liệu mưa và lịch sử ngập đến mức rủi ro trên tuyến đường.</small><em>Mở trang →</em></a><a class="fgmp-card" href="./alerts.html"><span class="fgmp-icon">🔔</span><b>Cảnh báo</b><small>Watchlist, ngưỡng MEDIUM/HIGH và email cảnh báo tự động.</small><em>Mở trang →</em></a><a class="fgmp-card" href="./ev.html"><span class="fgmp-icon">⚡</span><b>Trạm sạc EV</b><small>Khả năng tiếp cận trạm sạc trong bối cảnh mưa và ngập.</small><em>Mở trang →</em></a><a class="fgmp-card" href="./rescue.html"><span class="fgmp-icon">🆘</span><b>Cứu hộ</b><small>Gửi SOS, chia sẻ vị trí, theo dõi trạng thái và trao đổi hỗ trợ.</small><em>Mở trang →</em></a><a class="fgmp-card" href="./about.html"><span class="fgmp-icon">FG</span><b>Giới thiệu</b><small>Phạm vi, mục tiêu và nguyên tắc phát triển FloodGuard HCMC.</small><em>Mở trang →</em></a></div></div>`;
 const footer=root.querySelector('.wh-footer');
 if(footer)footer.before(section);else root.appendChild(section);
}
function rewriteHomeNav(){
 const root=document.getElementById('fgWebsiteHome');
 if(!root)return;
 root.querySelectorAll('.wh-links a,.wh-foot-links a').forEach(a=>{
   const key=norm(a.textContent).replace(/→/g,'').trim();
   if(ROUTES[key])replaceLink(a,ROUTES[key]);
 });
 buildHomepageExplore(root);
 const params=new URLSearchParams(location.search);
 if(params.get('login')==='1'||location.hash==='#login'){
   root.classList.add('hidden');
   document.getElementById('authScreen')?.classList.remove('hidden');
   document.body.style.overflow='hidden';
 }
}
function mobileMenu(){
 const btn=document.querySelector('[data-site-menu]');
 const drawer=document.querySelector('[data-site-drawer]');
 if(!btn||!drawer)return;
 btn.addEventListener('click',()=>drawer.classList.toggle('open'));
 drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>drawer.classList.remove('open')));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')drawer.classList.remove('open')});
}
function markActive(){
 const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
 document.querySelectorAll('.site-links a,.mobile-drawer a,.footer-links a').forEach(a=>{
   const href=(a.getAttribute('href')||'').split('?')[0].replace('./','').toLowerCase();
   const active=(page==='index.html'&&(!href||href==='index.html'))||href===page;
   a.classList.toggle('active',active);
 });
}
function start(){rewriteHomeNav();mobileMenu();markActive()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
