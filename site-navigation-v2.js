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
function rewriteHomeNav(){
 const root=document.getElementById('fgWebsiteHome');
 if(!root)return;
 root.querySelectorAll('a').forEach(a=>{
   const key=norm(a.textContent).replace(/→/g,'').trim();
   if(ROUTES[key])a.setAttribute('href',ROUTES[key]);
 });
 // Header buttons still use the existing in-page login handler. Add explicit URLs as fallback.
 root.querySelectorAll('[data-fg-home-login]').forEach(a=>{
   if(a.tagName==='A')a.setAttribute('href','./?login=1');
 });
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
