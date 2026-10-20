
(()=>{
  const home=document.getElementById('fgWebsiteHome');
  if(!home)return;
  function enterApp(){window.FGViewingHomepage=false;home.classList.add('hidden');document.documentElement.style.scrollBehavior='';try{history.replaceState(null,'',location.pathname+'#app')}catch(_){}}
  window.FGOpenFloodGuard=enterApp;
  document.querySelectorAll('[data-fg-home-login],[data-fg-home-app]').forEach(b=>b.addEventListener('click',enterApp));
  home.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');if(!id||id==='#')return;const t=home.querySelector(id);if(t){e.preventDefault();t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}}));
  const q=new URLSearchParams(location.search);
  if(q.get('home')==='1'){window.FGViewingHomepage=true;home.classList.remove('hidden')}
  if(q.get('login')==='1'||q.get('app')==='1'||q.get('rescue_invite')||q.get('rescue_email')||location.hash==='#app'||location.hash==='#login')enterApp();
})();
