(()=>{
 'use strict';
 const states=new WeakMap();
 function state(map){let s=states.get(map);if(!s){s={frame:0};states.set(map,s);const node=map.getContainer();const interrupt=()=>cancel(map);node.addEventListener('pointerdown',interrupt,{passive:true});node.addEventListener('wheel',interrupt,{passive:true});}return s}
 function cancel(map){const s=states.get(map);if(s?.frame){cancelAnimationFrame(s.frame);s.frame=0;}map.stop();}
 function focus(map,bounds,panel){if(!bounds?.isValid())return;const s=state(map);cancel(map);s.frame=requestAnimationFrame(()=>{s.frame=0;map.invalidateSize({pan:false});const node=map.getContainer(),mobile=window.innerWidth<=700||document.body.classList.contains('fg-mobile-production');const panelWidth=!mobile&&panel?.classList.contains('show')?panel.getBoundingClientRect().width:0;const options={paddingTopLeft:[Math.min(64,node.clientWidth*.1),Math.min(100,node.clientHeight*.18)],paddingBottomRight:[Math.min(panelWidth+40,node.clientWidth*.45),Math.min(mobile?120:70,node.clientHeight*.22)],maxZoom:16};if(matchMedia('(prefers-reduced-motion: reduce)').matches){map.fitBounds(bounds,{...options,animate:false});return;}try{map.flyToBounds(bounds,{...options,duration:1.2,animate:true});}catch{map.fitBounds(bounds,{...options,animate:false});}});}
 window.FGRouteMotion={focus,cancel};
})();
