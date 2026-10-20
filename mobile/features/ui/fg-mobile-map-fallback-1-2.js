
(function(){
  if(window.FG_MOBILE_MAP_FIX_12)return;window.FG_MOBILE_MAP_FIX_12=true;
  const mobile=()=>matchMedia('(max-width:700px)').matches;
  if(!mobile())return;
  const providers=[
    {name:'OSM Humanitarian',url:'https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'},
    {name:'OpenStreetMap',url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'},
    {name:'OSM DE',url:'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png'}
  ];
  let index=0,errors=0,loads=0,retryTimer;
  function useProvider(i,reason){
    if(!baseStreet||typeof baseStreet.setUrl!=='function')return;
    index=Math.max(0,Math.min(i,providers.length-1));errors=0;loads=0;clearTimeout(retryTimer);
    retryTimer=setTimeout(()=>{if(loads===0&&index<providers.length-1)useProvider(index+1,'startup-timeout')},4500);
    baseStreet.setUrl(providers[index].url);
    try{map.invalidateSize({pan:false,animate:false})}catch(_){ }
    document.documentElement.dataset.fgMobileMapProvider=providers[index].name;
    console.info('[FloodGuard] Mobile basemap:',providers[index].name,reason||'');
  }
  baseStreet.on('tileload',()=>{loads++});
  baseStreet.on('tileerror',()=>{
    errors++;
    if(errors>=4 && index<providers.length-1)useProvider(index+1,'tile-errors');
  });
  useProvider(0,'mobile-default');
  // When returning from Messenger/Safari background, force Leaflet to repaint tiles.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){setTimeout(()=>{try{map.invalidateSize({pan:false});baseStreet.redraw()}catch(_){ }},180)}});
})();
