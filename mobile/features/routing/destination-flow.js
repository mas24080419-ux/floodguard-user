/* Search → place → directions. Reuse the existing geocoder, endpoint state and route engine. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),root=document.documentElement,app=$('fg3App'),panel=$('fg3RoutePanel'),search=$('fgCompactSearch');
 if(!app||!search||$('fgDestSearch'))return;
 root.classList.add('fg-destination-flow');
 const tr=(vi,en)=>root.lang==='en'?en:vi;
 const searchView=document.createElement('section');searchView.id='fgDestSearch';searchView.hidden=true;searchView.setAttribute('aria-label','Tìm địa điểm');
 searchView.innerHTML='<form class="fg-dest-searchbar" role="search"><button type="button" id="fgDestBack">‹</button><input id="fgDestQuery" type="search" autocomplete="off"><button type="submit" id="fgDestSubmit">⌕</button></form><div class="fg-dest-searchbody"><h2 id="fgDestHeading"></h2><p id="fgDestStatus" role="status" aria-live="polite"></p><ul id="fgDestList"></ul></div>';
 const place=document.createElement('section');place.id='fgDestPlace';place.hidden=true;
 place.innerHTML='<div class="fg-dest-placehead"><h2 id="fgDestName"></h2><button id="fgDestClose" type="button">×</button></div><p id="fgDestAddress"></p><small id="fgDestSource"></small><button id="fgDestDirections" type="button"></button>';
 const top=document.createElement('div');top.id='fgDestEndpoints';top.hidden=true;
 const note=document.createElement('p');note.id='fgDestOriginNote';note.setAttribute('role','status');panel.querySelector('.fg3-route-scroll').prepend(note);
 app.append(searchView,place,top);
 const endpoints=$('fg3RouteFrom').closest('.fg3-route-form').firstElementChild,anchor=document.createComment('route-endpoints-position');endpoints.before(anchor);
 const modes=$('fg3RouteModebar'),modeAnchor=document.createComment('route-modes-position'),modeDock=document.createElement('div');modes.before(modeAnchor);modeDock.id='fgDestModes';panel.querySelector('.fg3-route-head').after(modeDock);
 const originalSearch=search.onclick,initialTitle=panel.querySelector('h2').textContent;
 let selected=null,recent=[],stage='map',returnStage='map',generation=0,timer=null,pending=null,originVersion=0,locationGeneration=0,originEdited=false;
 const recentKey='fg_recent_places_v1';
 function readRecent(){try{const data=JSON.parse(localStorage.getItem(recentKey)||'[]');return Array.isArray(data)?data.filter(x=>x&&typeof x.label==='string'&&x.label.trim()&&typeof x.lat==='number'&&Number.isFinite(x.lat)&&Math.abs(x.lat)<=90&&typeof x.lon==='number'&&Number.isFinite(x.lon)&&Math.abs(x.lon)<=180).slice(0,20):[];}catch{return [];}}
 function saveRecent(){try{localStorage.setItem(recentKey,JSON.stringify(recent));}catch{}}
 const clearRecent=document.createElement('button');clearRecent.type='button';clearRecent.id='fgDestClearRecent';clearRecent.textContent='Xóa lịch sử';clearRecent.onclick=()=>{recent=[];try{localStorage.removeItem(recentKey)}catch{}showRecent();};$('fgDestHeading').after(clearRecent);
 const compact=()=>root.classList.contains('fg-compact-app');
 function resultsMode(on){root.classList.toggle('fg-dest-results',on);if(on)modeDock.append(modes);else if(modeDock.contains(modes))modeAnchor.after(modes);}
 function restoreEndpoints(){if(top.contains(endpoints))anchor.after(endpoints);top.hidden=true;}
 function setStage(next){stage=next;root.dataset.fgDestinationStage=next;searchView.hidden=next!=='search';place.hidden=next!=='place';
  const directions=compact()&&next==='directions';if(directions){top.append(endpoints);top.hidden=false;}else restoreEndpoints();
  root.classList.toggle('fg-dest-directions',directions);root.classList.toggle('fg-dest-searching',compact()&&next==='search');
  if(next!=='directions')resultsMode(false);
  search.querySelector('span').textContent=next==='place'&&selected?selected.label.split(',')[0]:tr('Bạn muốn đi đâu?','Where would you like to go?');
  search.setAttribute('aria-expanded',String(next==='search'));search.setAttribute('aria-controls','fgDestSearch');
 }
 function stopSearch(){clearTimeout(timer);generation++;pending=null;}
 function closeSearch(){stopSearch();setStage(returnStage);if(returnStage==='directions'){if(!panel.classList.contains('show'))$('fg3RouteBtn').click();window.FG70RouteSnapshot?.();}else search.focus();}
 function render(rows){clearRecent.hidden=true;const list=$('fgDestList');list.classList.remove('fg-recent-list');list.replaceChildren();
  for(const row of rows){const li=document.createElement('li'),b=document.createElement('button'),title=document.createElement('b'),sub=document.createElement('span');b.type='button';
   const parts=String(row.display_name||row.label||'').split(',');title.textContent=parts.shift();sub.textContent=parts.join(',').trim()||String(row._provider||'');b.append(title,sub);b.onclick=()=>selectPlace(row);li.append(b);list.append(li);
  }
 }
 function showRecent(){recent=readRecent();render(recent);$('fgDestList').classList.add('fg-recent-list');clearRecent.hidden=!recent.length;$('fgDestHeading').textContent=tr('Gần đây','Recent');$('fgDestStatus').textContent=recent.length?'':tr('Tìm tên đường, địa chỉ hoặc địa điểm tại TP.HCM. Chưa có tìm kiếm gần đây.','Search for a street, address or place in HCMC. No recent searches.');}
 function openSearch(){if(!compact())return originalSearch?.();returnStage=stage==='search'?returnStage:stage;
  for(const [id,close] of [['fg3RoutePanel','fg3RouteClose'],['fg3Drawer','fg3Close'],['fg10Panel','fg10Close'],['fg4EvPanel','fg4EvClose'],['fg70Panel','fg70Close'],['fg3StationPanel','fg3StationClose']]){const p=$(id);if(p?.classList.contains('show')||p?.classList.contains('open'))$(close)?.click();}
  setStage('search');$('fgDestQuery').value='';showRecent();$('fgDestQuery').focus();
 }
 search.onclick=openSearch;
 async function find(q,seq){if(pending?.q===q&&pending.seq===seq)return;pending={q,seq};$('fgDestHeading').textContent=tr('Kết quả tìm kiếm','Search results');$('fgDestStatus').textContent=tr('Đang tìm địa điểm…','Searching…');render([]);
  try{const rows=await window.FG81_NET.searchPlaces(q);if(seq!==generation||stage!=='search')return;
   const numeric=v=>typeof v==='number'||(typeof v==='string'&&v.trim()!=='');
   const valid=(Array.isArray(rows)?rows:[]).filter(r=>numeric(r.lat)&&numeric(r.lon)&&Number.isFinite(Number(r.lat))&&Number.isFinite(Number(r.lon))&&Math.abs(Number(r.lat))<=90&&Math.abs(Number(r.lon))<=180&&String(r.display_name||r.label||'').trim());
   render(valid);$('fgDestStatus').textContent=valid.length?'':tr('Không tìm thấy địa điểm phù hợp. Thử tên đường hoặc địa chỉ cụ thể hơn.','No places found. Try a more specific address.');
  }catch(e){if(seq===generation&&stage==='search')$('fgDestStatus').textContent=tr('Chưa tìm được địa điểm: ','Place search unavailable: ')+(e.message||'');}
  finally{if(pending?.seq===seq&&pending.q===q)pending=null;}
 }
 $('fgDestQuery').addEventListener('input',()=>{stopSearch();const q=$('fgDestQuery').value.trim(),seq=generation;if(q.length<3){showRecent();return;}timer=setTimeout(()=>find(q,seq),450);});
 searchView.querySelector('form').onsubmit=e=>{e.preventDefault();clearTimeout(timer);const q=$('fgDestQuery').value.trim();if(q.length>=3)find(q,generation);};
 $('fgDestBack').onclick=closeSearch;$('fgDestQuery').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeSearch();}});
 function selectPlace(row){const point={lat:Number(row.lat),lon:Number(row.lon),label:String(row.display_name||row.label||'')};
  if(!window.FG70SetEndpoint?.('to',point))return;stopSearch();locationGeneration++;selected={...row,...point};
  recent=[{lat:point.lat,lon:point.lon,label:point.label,_provider:String(row._provider||''),_fallback:!!row._fallback},...readRecent().filter(x=>x.lat!==point.lat||x.lon!==point.lon)].slice(0,20);saveRecent();
  const parts=point.label.split(',');$('fgDestName').textContent=parts.shift();$('fgDestAddress').textContent=parts.join(',').trim();
  $('fgDestSource').textContent=(row._fallback?tr('Vị trí tham chiếu · ','Reference location · '):tr('Nguồn địa điểm · ','Place source · '))+(row._provider||tr('Dịch vụ tìm kiếm hiện có','Existing search service'));
  setStage('place');try{map.flyTo([point.lat,point.lon],16,{duration:.4});}catch{}$('fgDestQuery').blur();
 }
 $('fgDestClose').onclick=()=>{locationGeneration++;setStage('map');};
 function openDirections(){const snapshot=window.FG70RouteSnapshot?.();setStage('directions');if(!panel.classList.contains('show'))$('fg3RouteBtn').click();return snapshot;}
 $('fgDestDirections').onclick=()=>{if(!selected)return;const snapshot=openDirections();
  if(snapshot?.start||(originEdited&&$('fg3RouteFrom').value.trim())){$('fg3RouteRun').click();return;}
  $('fg3RouteFrom').value='';$('fg3RouteFrom').dispatchEvent(new Event('input',{bubbles:true}));
  const version=originVersion,ticket=++locationGeneration;note.textContent=tr('Đang lấy vị trí của bạn… Bạn cũng có thể nhập điểm đi.','Finding your location… You can also enter a starting point.');
  const current=()=>ticket===locationGeneration&&version===originVersion&&stage==='directions'&&panel.classList.contains('show');
  const failed=()=>{if(current()){note.textContent=tr('Hãy nhập điểm đi hoặc cho phép truy cập vị trí.','Enter a starting point or allow location access.');$('fg3RouteFrom').focus();}};
  if(!navigator.geolocation){failed();return;}
  navigator.geolocation.getCurrentPosition(pos=>{if(!current())return;
   if(!window.FG70SetEndpoint('from',{lat:pos.coords.latitude,lon:pos.coords.longitude,label:tr('Vị trí của bạn','Your location')})){failed();return;}
   note.textContent='';$('fg3RouteRun').click();
  },failed,{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
 };
 for(const id of ['fg3RouteFrom','fg3RouteTo'])$(id).addEventListener('input',e=>{originVersion++;if(id==='fg3RouteFrom'&&e.isTrusted)originEdited=true;resultsMode(false);note.textContent='';});
 document.addEventListener('fg70:route',e=>{if(!compact()||stage!=='directions')return;const has=!!e.detail?.analyses?.length;resultsMode(has);
  if(has){panel.querySelector('h2').textContent=({car:tr('Ô tô','Car'),motorbike:tr('Xe máy','Motorbike'),walk:tr('Đi bộ','Walking')})[e.detail.travelMode]||tr('Lộ trình','Routes');panel.classList.remove('fg-sheet-expanded');
   const source=$('fg3RouteResults').querySelector('.fg-routing-source');if(source&&!source.closest('.fg-dest-source')){const d=document.createElement('details'),s=document.createElement('summary');d.className='fg-dest-source';s.textContent=tr('Nguồn tuyến & giới hạn','Route source & limitations');d.append(s);source.before(d);d.append(source);$('fg3RouteResults').append(d);}
  }
 });
 const weatherPanel=$('fg10Panel');if(weatherPanel)new MutationObserver(()=>{if(weatherPanel.classList.contains('show')&&stage!=='map'){stopSearch();locationGeneration++;setStage('map');}}).observe(weatherPanel,{attributes:true,attributeFilter:['class']});
 let wasCompact=compact();new MutationObserver(()=>{if(compact()===wasCompact)return;wasCompact=compact();if(!wasCompact){stopSearch();locationGeneration++;setStage('map');panel.querySelector('h2').textContent=initialTitle;}}).observe(root,{attributes:true,attributeFilter:['class']});
 new MutationObserver(()=>{if(!panel.classList.contains('show')&&stage==='directions'){locationGeneration++;setStage('map');}}).observe(panel,{attributes:true,attributeFilter:['class']});
 function labels(){$('fgDestQuery').placeholder=tr('Tìm kiếm ở đây','Search here');$('fgDestQuery').setAttribute('aria-label',tr('Tên đường, địa chỉ hoặc địa điểm','Street, address or place'));$('fgDestBack').setAttribute('aria-label',tr('Quay lại','Back'));$('fgDestSubmit').setAttribute('aria-label',tr('Tìm kiếm','Search'));$('fgDestClose').setAttribute('aria-label',tr('Đóng địa điểm','Close place'));$('fgDestDirections').textContent=tr('↱ Đường đi','↱ Directions');searchView.setAttribute('aria-label',tr('Tìm địa điểm','Search places'));}
 document.addEventListener('click',e=>{if(e.target.closest('#fg31Logout,#fg31MobileLogout')){recent=[];try{localStorage.removeItem(recentKey)}catch{}}});
 new MutationObserver(labels).observe(root,{attributes:true,attributeFilter:['lang']});labels();
 const auth=$('fg31Auth');if(auth)new MutationObserver(()=>{if(auth.classList.contains('show')){try{localStorage.removeItem(recentKey)}catch{}recent=[];selected=null;stopSearch();locationGeneration++;setStage('map');}}).observe(auth,{attributes:true,attributeFilter:['class']});
})();
