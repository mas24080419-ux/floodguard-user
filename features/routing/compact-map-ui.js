/* Move existing controls, retaining their state and handlers; never recreate the map. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),app=$('fg3App'),panel=$('fg3RoutePanel'),form=panel?.querySelector('.fg3-route-form');
 if(!app||!form||$('fgCompactSearch'))return;
 const mobile=matchMedia('(max-width:700px), (max-width:950px) and (max-height:500px)'),root=document.documentElement;
 const icon='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>';
 function button(id,text,target){const b=document.createElement('button');b.id=id;b.type='button';b.textContent=text;b.onclick=()=>$(target)?.click();return b;}
 const search=button('fgCompactSearch','','fg3RouteBtn');search.innerHTML=icon+'<span></span>';document.querySelector('.fg3-header').prepend(search);
 const chips=document.createElement('nav');chips.id='fgCompactChips';chips.setAttribute('aria-label','Chức năng bản đồ');
 for(const [id,label,target] of [['fgCompactDirections','Tìm đường','fg3RouteBtn'],['fgCompactStations','Trạm sạc','fg3EVBtn'],['fgCompactConditions','Tình trạng','fg10LiveBtn'],['fgCompactReport','Báo ngập','fgCommunityBtn']])chips.append(button(id,label,target));app.append(chips);
 const options=document.createElement('details');options.id='fgCompactOptions';const summary=document.createElement('summary');options.append(summary);form.insertBefore(options,$('fg3RouteRun'));
 const moves=[];
 function move(e){if(!e)return;const anchor=document.createComment('compact-ui-original-position');e.before(anchor);moves.push({e,anchor});options.append(e);}
 const toggle=button('fgCompactSheetToggle','','fg3RouteBtn');panel.prepend(toggle);
 const sos=button('fgCompactSOS','SOS','fg16SOSFab');panel.querySelector('.fg3-route-head').insertBefore(sos,$('fg3RouteClose'));
 let dragY=null,dragged=false;
 toggle.addEventListener('pointerdown',e=>{dragY=e.clientY;dragged=false;toggle.setPointerCapture(e.pointerId);});
 toggle.addEventListener('pointerup',e=>{if(dragY!==null&&Math.abs(e.clientY-dragY)>25){dragged=true;setExpanded(e.clientY<dragY);}dragY=null;});
 toggle.addEventListener('pointercancel',()=>{dragY=null;});
 toggle.onclick=()=>{if(!dragged)setExpanded(!panel.classList.contains('fg-sheet-expanded'));dragged=false;};
 function setExpanded(on){panel.classList.toggle('fg-sheet-expanded',on);toggle.setAttribute('aria-expanded',String(on));labels();}
 function labels(){const en=root.lang==='en';search.querySelector('span').textContent=en?'Where would you like to go?':'Bạn muốn đi đâu?';search.setAttribute('aria-label',en?'Search for a route':'Tìm đường đi');
  const rain=$('fg3RouteRain')?.value||'—';summary.textContent=(en?'Options · rain scenario ':'Tùy chọn · kịch bản mưa ')+rain+' mm';
  toggle.setAttribute('aria-label',panel.classList.contains('fg-sheet-expanded')?(en?'Collapse route panel':'Thu gọn bảng tìm đường'):(en?'Expand route panel':'Mở rộng bảng tìm đường'));
  toggle.setAttribute('aria-expanded',String(panel.classList.contains('fg-sheet-expanded')));toggle.setAttribute('aria-controls','fg3RoutePanel');
  for(const [id,vi,english] of [['fgCompactDirections','Tìm đường','Directions'],['fgCompactStations','Trạm sạc','Charging'],['fgCompactConditions','Tình trạng','Conditions'],['fgCompactReport','Báo ngập','Report flood']])$(id).textContent=en?english:vi;
  chips.setAttribute('aria-label',en?'Map features':'Chức năng bản đồ');sos.setAttribute('aria-label',en?'Open SOS / rescue':'Mở SOS / cứu hộ');
  if(mobile.matches){$('fg3RouteFrom').setAttribute('aria-label',en?'Starting point':'Điểm đi');$('fg3RouteTo').setAttribute('aria-label',en?'Destination':'Điểm đến');}
 }
 function apply(){root.classList.toggle('fg-compact-app',mobile.matches);
  if(mobile.matches&&!moves.length){
   move(form.querySelector('.fg62-pref'));move($('fg3RouteRain')?.closest('.fg3-route-field'));
   move(panel.querySelector('.fg-journey-overview'));move(panel.querySelector('.fg-journey-actions'));move($('fg51Recent'));move(panel.querySelector('.fg3-route-legend'));
   move($('fg90ActiveTrip')?.querySelector('.fg12-trip-actions'));
   for(const [id,name] of [['fg3RouteFrom','Điểm đi'],['fg3RouteTo','Điểm đến']])if(!$(id).hasAttribute('aria-label'))$(id).setAttribute('aria-label',name);
  }else if(!mobile.matches){for(const {e,anchor} of moves){anchor.replaceWith(e);}moves.length=0;setExpanded(false);}
  sync();labels();
 }
 function sync(){const open=panel.classList.contains('show');root.classList.toggle('fg-compact-route-open',open);search.setAttribute('aria-expanded',String(open));search.setAttribute('aria-controls','fg3RoutePanel');}
 new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['class']});
 new MutationObserver(labels).observe(root,{attributes:true,attributeFilter:['lang']});
 $('fg3RouteRain')?.addEventListener('input',labels);$('fg3RouteRain')?.addEventListener('change',labels);
 form.addEventListener('click',e=>{if(e.target.closest('[data-route-rain]'))queueMicrotask(labels);});
 const layers=$('fg3Layers'),layerButton=$('fg3LayerBtn'),layerClose=document.createElement('button');
 layerButton.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26"><path d="m3 11 9 6 9-6-3-2-6 4-6-4z" fill="currentColor"/><path d="m3 16 9 6 9-6-2-1.4-7 4.7-7-4.7z" fill="currentColor"/><circle cx="17.5" cy="5" r="3" fill="currentColor"/><path d="m3 6 8-5v4L7 8.5z" fill="currentColor"/></svg>';
 layerClose.id='fgCompactLayersClose';layerClose.type='button';layerClose.textContent='×';layers.prepend(layerClose);
 const layerNames=[['Trạm sạc','Charging stations'],['Trạm đo mưa','Rain gauges'],['Tuyến ngập chính','Main flood locations'],['Tuyến ngập khác','Other flood locations']];
 function layerLabels(){const en=root.lang==='en';layerButton.setAttribute('aria-label',en?'Map layers':'Lớp bản đồ');layerButton.setAttribute('aria-controls','fg3Layers');layerClose.setAttribute('aria-label',en?'Close map layers':'Đóng lớp bản đồ');layers.querySelector('.fg3-eyebrow').textContent=en?'Map layers':'Lớp bản đồ';layers.querySelectorAll('.fg3-layerrow').forEach((row,i)=>{row.querySelector('span').textContent=layerNames[i][en?1:0];row.querySelector('input').setAttribute('aria-label',layerNames[i][en?1:0]);});}
 function closeLayers(){layers.classList.remove('show');layerButton.focus();}
 layerClose.onclick=closeLayers;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&layers.classList.contains('show'))closeLayers();});
 new MutationObserver(()=>layerButton.setAttribute('aria-expanded',String(layers.classList.contains('show')))).observe(layers,{attributes:true,attributeFilter:['class']});
 new MutationObserver(layerLabels).observe(root,{attributes:true,attributeFilter:['lang']});layerLabels();
 mobile.addEventListener('change',apply);apply();
})();
