
(function(){
  if(window.FG_MOBILE_PROD_1)return; window.FG_MOBILE_PROD_1=true;
  const root=document.documentElement;
  const sync=()=>{root.style.setProperty('--fgm-vh',(window.visualViewport?.height||innerHeight)+'px');document.body.classList.toggle('fg-mobile-production',matchMedia('(max-width:700px)').matches)};
  sync(); addEventListener('resize',sync,{passive:true}); window.visualViewport?.addEventListener('resize',sync,{passive:true});
})();
