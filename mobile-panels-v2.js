/* Approved visual grouping only: reuse existing controls and their event handlers. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),app=$('fg3App');if(!app||app.classList.contains('fg-panels-v2'))return;
 app.classList.add('fg-panels-v2');
 const svg=path=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
 const paths={route:'<circle cx="5" cy="5" r="2"/><path d="M7 5h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h10"/>',car:'<path d="m5 7 2-3h10l2 3v11H5V7Zm0 3h14M8 18v2m8-2v2M8 14h.01m8 0h.01"/>',motorbike:'<circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="m5 17 5-9 5 9H5m9-13h3l2 13M8 8h5"/>',walk:'<circle cx="14" cy="4" r="2"/><path d="m10 12 3-5 4 4 3 1m-7-5-4 3-3 1m4 1 3 4-1 6m-2-10-3 9"/>'};
 for(const id of ['fg10Close','fg3Close','fg14MoreClose','fg4EvClose','fg3RouteClose']){const b=$(id);if(b){b.classList.add('fg-v2-close');b.setAttribute('aria-label','Đóng');}}
 for(const id of ['fg3Run','fg3RouteRun'])$(id)?.classList.add('fg-v2-primary');
 const heading=$('fg3Drawer')?.querySelector('h2');if(heading)heading.textContent='Phân tích ngập';
 if(heading){const p=document.createElement('p');p.className='fg-v2-subtitle';p.textContent='Ước lượng theo tuyến và điều kiện dự kiến';heading.after(p);}
 const street=$('fg3StreetInput')?.closest('.fg-street-picker');if(street){
  const i=document.createElement('span');i.className='fg-v2-road-icon';i.setAttribute('aria-hidden','true');i.innerHTML=svg(paths.route);street.prepend(i);
  $('fg3StreetInput').spellcheck=false;
  const suggestions=$('fg3StreetInputSuggest'),mobile=matchMedia('(max-width:700px)');
  if(suggestions){
   // Keep the existing suggestion node/handlers; mobile results occupy their own space.
   const place=()=>{if(mobile.matches)street.after(suggestions);else street.append(suggestions)};
   place();mobile.addEventListener('change',place);
  }
 }
 // Keep all labels and the original input IDs; group existing rain/tide fields.
 const inputs=$('fg3Drawer')?.querySelector('.fg15-inputgrid');if(inputs){const p=document.createElement('p');p.className='fg-v2-condition-title';p.textContent='Điều kiện dự kiến';inputs.before(p);}
 for(const id of ['fg3StreetInput','fg3Rain','fg15Tide','fg3RouteFrom','fg3RouteTo','fg3RouteRain']){const input=$(id),label=input?.closest('.fg3-field,.fg3-route-field')?.querySelector('label');if(label)label.htmlFor=id;}
 const grid=document.querySelector('#fg14MoreSheet .fg14-more-grid');
 if(grid){
  const primary=document.createElement('div'),account=document.createElement('div');primary.className=account.className='fg-v2-menu-group';grid.prepend(primary,account);
  function group(){
   const groups=[[primary,[grid.querySelector('[data-target="fg16RescueBtn"]'),grid.querySelector('[data-target="fg3EVBtn"]'),grid.querySelector('[data-community-entry]')]],[account,[$('fg31MobileAccount'),$('fgLanguageMore'),$('fg35MobileAdmin')]]];
   for(const [host,items] of groups){const buttons=items.filter(b=>b&&grid.contains(b));buttons.forEach((b,i)=>{if(host.children[i]!==b)host.insertBefore(b,host.children[i]||null);});}
  }
  group();new MutationObserver(group).observe(grid,{childList:true,subtree:true});
  const title=document.querySelector('#fg14MoreSheet .fg14-more-head b');if(title)title.textContent='Thêm';
 }
 const ev=$('fg4EvPanel');if(ev){ev.querySelector('h2').textContent='Trạm sạc EV';$('fg4EvSearch').textContent='Tìm';$('fg4EvLocation').placeholder='Nhập địa chỉ hoặc khu vực';$('fg4EvLocation').setAttribute('aria-label','Tìm theo địa chỉ');}
 const routeTitle=$('fg3RoutePanel')?.querySelector('h2');if(routeTitle)routeTitle.textContent='Đường đi';
 for(const [id,label] of [['fg10UseAuto','Tự chọn'],['fg10UseDevice','Vị trí của tôi'],['fg10UseMap','Khu vực đang xem'],['fg4UseMyLocation','Vị trí của tôi'],['fg4UseMapCenter','Tâm bản đồ']])if($(id))$(id).textContent=label;
 const endpoints=$('fg3RouteFrom')?.closest('.fg3-route-field')?.parentElement;if(endpoints)endpoints.classList.add('fg-v2-endpoints');
 document.querySelectorAll('#fg3RouteModebar button').forEach(b=>{const mode=b.dataset.routeMode,label={car:'Ô tô',motorbike:'Xe máy',walk:'Đi bộ'}[mode];if(!label)return;b.innerHTML=svg(paths[mode])+ '<span>'+label+'</span>';});
 // Decorative glyphs follow the existing weather conditions; forecasts are unchanged.
 const cloud='<path d="M6 17a5 5 0 1 1 2-10 6 6 0 0 1 11 3 4 4 0 0 1-2 8H6Z"/>';
 const weatherPaths={'☁️':cloud,'🌧️':cloud+'<path d="m8 21 1-2m5 3 1-2"/>','🌦️':cloud+'<path d="m8 21 1-2m5 3 1-2M5 3V1M1 5h2"/>','⛈️':cloud+'<path d="m13 18-3 4h4l-1 2"/>','☀️':'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>','🌫️':cloud+'<path d="M4 21h16M6 24h12"/>','❄️':'<path d="M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3"/>'};
 function weatherIcons(){for(const el of document.querySelectorAll('#fgWeatherIcon,#fg10Hourly .ico')){const raw=el.textContent.trim(),p=weatherPaths[raw];if(!p)continue;el.innerHTML=svg(p);}}
 weatherIcons();const weather=$('fg10Panel');if(weather)new MutationObserver(weatherIcons).observe(weather,{childList:true,subtree:true,characterData:true});
})();
