
(function(){
 const $=id=>document.getElementById(id); if($('fg10LiveBtn'))return;
 const nav=document.querySelector('.fg3-nav'),routeBtn=$('fg3RouteBtn');
 const liveBtn=document.createElement('button');liveBtn.className='fg3-btn';liveBtn.id='fg10LiveBtn';liveBtn.innerHTML='⛈ Thời tiết';liveBtn.title='Thời tiết hiện tại và dự báo ngắn hạn tự động cập nhật';
 if(nav){if(routeBtn?.nextSibling)nav.insertBefore(liveBtn,routeBtn.nextSibling);else nav.appendChild(liveBtn)}
 const panel=document.createElement('section');panel.className='fg10-panel';panel.id='fg10Panel';panel.setAttribute('aria-label','Thời tiết');panel.innerHTML=`
   <div class="fg10-head"><div><div class="eyebrow">THỜI TIẾT</div><h2>Thời tiết</h2><p>Thông tin hiện tại và dự báo 6 giờ tới tại khu vực hoặc tuyến bạn đang xem.</p></div><button class="fg10-close" id="fg10Close">×</button></div>
   <div class="fg10-scroll" id="fg10Scroll">
     <div class="fg10-locbar"><button class="fg10-locbtn active" id="fg10UseAuto">⌖ Tự chọn</button><button class="fg10-locbtn" id="fg10UseDevice">◎ Vị trí của tôi</button><button class="fg10-locbtn" id="fg10UseMap">▦ Khu vực đang xem</button><span class="fg10-locmeta" id="fg10LocationMeta">Đang xác định khu vực…</span></div>
     <div class="fg10-status" id="fg10Status">Đang tải thời tiết…</div>
     <div class="fg10-kpis"><div class="fg10-kpi sky"><b id="fg10Now">—</b><span>Lượng mưa hiện tại lớn nhất tại điểm theo dõi (mm)</span></div><div class="fg10-kpi"><b id="fg10Six">—</b><span>Tích lũy dự báo 6 giờ (mm)</span></div><div class="fg10-kpi amber"><b id="fg10Prob">—</b><span>Xác suất mưa cao nhất 6 giờ tới</span></div><div class="fg10-kpi green"><b id="fg10Temp">—</b><span>Nhiệt độ hiện tại</span></div><div class="fg10-kpi violet"><b id="fg10Humidity">—</b><span>Độ ẩm tương đối</span></div><div class="fg10-kpi"><b id="fg10Wind">—</b><span>Gió hiện tại (km/h)</span></div></div>
     <div class="fg10-section"><div class="fg10-section-title"><b>Thời tiết khu vực</b><span id="fg10Updated">Chưa cập nhật</span></div><div class="fg10-weather-grid" id="fg10WeatherGrid"><div class="fg10-weather-card"><div class="place">Thời tiết</div><div class="rain">—</div><div class="meta">Đang chờ dữ liệu</div></div></div></div>
     <div class="fg10-section"><div class="fg10-section-title"><b>6 giờ tới</b><span>mưa / xác suất</span></div><div class="fg10-hourly" id="fg10Hourly"><div class="fg10-hour"><div class="t">—</div><div class="ico">☁️</div><div class="mm">—</div><div class="p">—</div></div></div></div>
     <div class="fg10-source">Nguồn: Open-Meteo · Dự báo thời tiết, không phải số đo ngập tại mặt đường.</div>
   </div>`;
 $('fg3App')?.appendChild(panel);
 const hero=document.createElement('div');hero.className='fg-weather-hero';hero.innerHTML='<p id="fgWeatherPlace">Khu vực đang xem</p><div id="fgWeatherIcon" aria-hidden="true">☁️</div><strong id="fgWeatherDegrees">—</strong><p id="fgWeatherSummary" role="status">Đang tải thời tiết…</p><small>Nhiệt độ hiện tại · °C</small>';
 const scroll=$('fg10Scroll'),kpis=panel.querySelector('.fg10-kpis');scroll.insertBefore(hero,kpis);scroll.insertBefore($('fg10Hourly').closest('.fg10-section'),kpis);

 let lastResult=null,requestId=0,locationIntent=0,timer=null,locationMode='auto',devicePoint=null,mapDebounce=null;
 const AUTO_MS=5*60*1000;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function status(html,type=''){const e=$('fg10Status');if(!e)return;e.className='fg10-status'+(type?' '+type:'');e.innerHTML=html}
 function setLocButtons(){['fg10UseAuto','fg10UseDevice','fg10UseMap'].forEach(id=>$(id)?.classList.remove('active'));$(locationMode==='device'?'fg10UseDevice':locationMode==='map'?'fg10UseMap':'fg10UseAuto')?.classList.add('active')}
 function closeOtherPanels(){if($('fg3RoutePanel')?.classList.contains('show'))$('fg3RouteClose')?.click();document.querySelectorAll('.fg3-drawer.show,.fg3-overview.show,.fg3-stationpanel.show,.fg4-evpanel.show,.fg70-panel.show').forEach(x=>x.classList.remove('show'))}
 function open(){closeOtherPanels();panel.classList.add('show');liveBtn.classList.add('primary','live-on');if(!lastResult||Date.now()-lastResult.at>90*1000)refresh(false)}
 function close(){panel.classList.remove('show');liveBtn.classList.remove('primary')}
 liveBtn.onclick=()=>panel.classList.contains('show')?close():open();$('fg10Close').onclick=close;
 ['fg3RouteBtn','fg3AnalyzeBtn','fg3EVBtn','fg3StationBtn','fg70DecisionBtn'].forEach(id=>$(id)?.addEventListener('click',close));
 function routeState(){return window.FG70_ROUTE_STATE||null}
 function chosenAnalysis(s){return s?.analyses?.find(a=>Number(a.index)===Number(s.selectedIndex))||s?.analyses?.[0]||null}
 function routeCoords(s){const a=chosenAnalysis(s);return a?.route?.geometry?.coordinates||a?.geometry?.coordinates||[]}
 function routePoints(s){
   const pts=[];if(s?.start&&Number.isFinite(Number(s.start.lat)))pts.push({kind:'start',label:s.from||s.start.label||'Điểm đi',lat:Number(s.start.lat),lon:Number(s.start.lon)});
   const coords=routeCoords(s);if(coords.length>2){const c=coords[Math.floor(coords.length/2)];if(c&&Number.isFinite(Number(c[1])))pts.push({kind:'mid',label:'Giữa lộ trình',lat:Number(c[1]),lon:Number(c[0])})}
   if(s?.end&&Number.isFinite(Number(s.end.lat)))pts.push({kind:'end',label:s.to||s.end.label||'Điểm đến',lat:Number(s.end.lat),lon:Number(s.end.lon)});
   const seen=new Set();return pts.filter(p=>{const k=p.lat.toFixed(4)+','+p.lon.toFixed(4);if(seen.has(k))return false;seen.add(k);return true})
 }
 function mapPoint(){try{const c=map.getCenter();return {kind:'map',label:'Khu vực đang xem',lat:Number(c.lat),lon:Number(c.lng)}}catch(e){return {kind:'map',label:'TP.HCM',lat:10.78,lon:106.72}}}
 function contextPoints(){
   const s=routeState(),rp=routePoints(s);
   if(locationMode==='device'&&devicePoint)return {mode:'device',pts:[devicePoint],state:s};
   if(locationMode==='map')return {mode:'map',pts:[mapPoint()],state:s};
   if(rp.length)return {mode:'route',pts:rp,state:s};
   if(devicePoint)return {mode:'device',pts:[devicePoint],state:s};
   return {mode:'map',pts:[mapPoint()],state:s};
 }
 async function fetchJson(url,ms=10000){const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),ms);try{const r=await fetch(url,{signal:ctl.signal,headers:{Accept:'application/json'}});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
 function codeText(c){if(c==null)return 'Chưa có thông tin thời tiết';c=Number(c);if(c===0)return 'Trời quang';if([1,2,3].includes(c))return 'Có mây';if([45,48].includes(c))return 'Sương mù';if([51,53,55,56,57].includes(c))return 'Mưa phùn';if([61,63,65,66,67,80,81,82].includes(c))return 'Mưa';if([95,96,99].includes(c))return 'Dông';return 'Thời tiết biến đổi'}
 function weatherIcon(c,p=0){if(c==null)return '—';c=Number(c);if([95,96,99].includes(c))return '⛈️';if([61,63,65,66,67,80,81,82,51,53,55,56,57].includes(c)||Number(p)>0.2)return '🌧️';if([1,2,3,45,48].includes(c))return '☁️';return '☀️'}
 function hourlyValue(v){return v==null||v===''||typeof v==='boolean'||!Number.isFinite(Number(v))?null:Number(v)}
 async function weather(p){
   const url=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(p.lat)}&longitude=${encodeURIComponent(p.lon)}&current=temperature_2m,relative_humidity_2m,precipitation,rain,showers,weather_code,wind_speed_10m,wind_gusts_10m&hourly=precipitation,precipitation_probability,rain,weather_code,temperature_2m&forecast_days=2&timezone=Asia%2FBangkok`;
   const j=await fetchJson(url),times=j.hourly?.time||[],prec=j.hourly?.precipitation||[],prob=j.hourly?.precipitation_probability||[],codes=j.hourly?.weather_code||[];let idx=times.findIndex(t=>t>=String(j.current?.time||''));if(idx<0)idx=0;
   const hourly={time:times.slice(idx,idx+6),precipitation:prec.slice(idx,idx+6).map(hourlyValue),probability:prob.slice(idx,idx+6).map(hourlyValue),code:codes.slice(idx,idx+6).map(hourlyValue),temperature:(j.hourly?.temperature_2m||[]).slice(idx,idx+6).map(hourlyValue)};
   const complete=values=>hourly.time.length===6&&values.length===6&&values.every(v=>v!==null);
   const six=complete(hourly.precipitation)?Math.round(hourly.precipitation.reduce((a,b)=>a+b,0)*10)/10:null,probability=complete(hourly.probability)?Math.max(...hourly.probability):null;
   return {...p,current:hourlyValue(j.current?.precipitation),rain:hourlyValue(j.current?.rain),showers:hourlyValue(j.current?.showers),temp:hourlyValue(j.current?.temperature_2m),humidity:hourlyValue(j.current?.relative_humidity_2m),wind:hourlyValue(j.current?.wind_speed_10m),gust:hourlyValue(j.current?.wind_gusts_10m),code:hourlyValue(j.current?.weather_code),six,prob:probability,time:j.current?.time||'',hourly};
 }
 function fmtFetchTime(){return new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())}
 function shortTime(t){try{return new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit'}).format(new Date(t))}catch(e){return String(t||'').slice(11,16)}}
 function renderCards(rows){
   $('fg10WeatherGrid').innerHTML=rows.map(x=>x.error?`<div class="fg10-weather-card error"><div class="place">${esc(x.label)}</div><div class="rain">Không tải được</div><div class="meta">${esc(x.error)}</div></div>`:`<div class="fg10-weather-card"><div class="place" title="${esc(x.label)}">${esc(x.label)}</div><div class="rain">${weatherIcon(x.code,x.current)} ${(x.current===null?'—':x.current.toFixed(1))} mm</div><div class="meta"><b>${codeText(x.code)}</b><br>6h: <b>${(x.six===null?'—':x.six.toFixed(1))} mm</b> · Xác suất: <b>${x.prob===null?'—':x.prob+'%'}</b><br>${Number.isFinite(x.temp)?x.temp.toFixed(1)+'°C':'—'} · Ẩm ${Number.isFinite(x.humidity)?Math.round(x.humidity)+'%':'—'} · Gió ${Number.isFinite(x.wind)?x.wind.toFixed(1)+' km/h':'—'}</div></div>`).join('')||'<div class="fg10-weather-card"><div class="place">Thời tiết</div><div class="rain">—</div><div class="meta">Chưa có dữ liệu</div></div>'
 }
 function renderHourly(row){
   if(window.FGWeatherView)return window.FGWeatherView.renderHourly(row);
   if(!row||row.error||!row.hourly){$('fg10Hourly').innerHTML='<div class="fg10-hour"><div class="t">—</div><div class="ico">☁️</div><div class="mm">—</div><div class="p">—</div></div>';return}
   $('fg10Hourly').innerHTML=row.hourly.time.map((t,i)=>`<div class="fg10-hour"><div class="t">${shortTime(t)}</div><div class="ico">${weatherIcon(row.hourly.code[i],row.hourly.precipitation[i])}</div><div class="fg-hour-temp">${Number.isFinite(row.hourly.temperature?.[i])?Math.round(row.hourly.temperature[i])+'°':'—'}</div><div class="mm">${(row.hourly.precipitation[i]==null?'—':row.hourly.precipitation[i].toFixed(1))} mm</div><div class="p">${row.hourly.probability[i]==null?'—':Math.round(row.hourly.probability[i])+'%'}</div></div>`).join('')
 }
 function render(rows,ctx){
   const good=rows.filter(x=>!x.error);const weatherRef=good[0];$('fgWeatherPlace').textContent=weatherRef?.label||ctx.pts[0]?.label||'Khu vực đang xem';$('fgWeatherDegrees').textContent=Number.isFinite(weatherRef?.temp)?Math.round(weatherRef.temp)+'°':'—';$('fgWeatherSummary').textContent=weatherRef&&Number.isFinite(weatherRef.code)?codeText(weatherRef.code):'Chưa có thông tin thời tiết';$('fgWeatherIcon').textContent=weatherRef&&Number.isFinite(weatherRef.code)?weatherIcon(weatherRef.code,weatherRef.current):'☁️';if(!good.length){invalidateWeather();['fg10Now','fg10Six','fg10Prob','fg10Temp','fg10Humidity','fg10Wind'].forEach(id=>$(id).textContent='—');renderCards(rows);renderHourly(null);window.FGWeatherView?.update({rows:[],context:ctx.mode});status('Chưa tải được dữ liệu thời tiết. Hệ thống sẽ tự thử lại.','error');return}
   const maximum=field=>rows.every(x=>!x.error&&Number.isFinite(x[field]))?Math.max(...rows.map(x=>x[field])):null;const now=maximum('current'),six=maximum('six'),prob=maximum('prob'),ref=good[0];$('fg10Now').textContent=(now===null?'—':now.toFixed(1));$('fg10Six').textContent=six===null?'—':six.toFixed(1);$('fg10Prob').textContent=prob===null?'—':prob+'%';$('fg10Temp').textContent=Number.isFinite(ref.temp)?ref.temp.toFixed(1)+'°C':'—';$('fg10Humidity').textContent=Number.isFinite(ref.humidity)?Math.round(ref.humidity)+'%':'—';$('fg10Wind').textContent=Number.isFinite(ref.wind)?ref.wind.toFixed(1):'—';$('fg10Updated').textContent='Lấy lúc '+fmtFetchTime();renderCards(rows);renderHourly(ref);
   lastResult={at:Date.now(),rows,scenario:six,now,prob,context:ctx.mode};status(`Thời tiết đã cập nhật cho <b>${good.length}</b> điểm. Tự làm mới sau mỗi 5 phút.`,'ok');window.FG10_LIVE_STATE=lastResult;const published=lastResult;setTimeout(()=>{if(window.FG10_LIVE_STATE===published)document.dispatchEvent(new CustomEvent('fg10:weather',{detail:published}))},0)
 }
 function invalidateWeather(){lastResult=null;window.FG10_LIVE_STATE=null;document.dispatchEvent(new CustomEvent('fg10:weather',{detail:null}));}
 async function refresh(quiet=false){
   const id=++requestId;invalidateWeather();if(!navigator.onLine){status('Đang offline. Thời tiết sẽ tự cập nhật lại khi có Internet.','error');return}
   const ctx=contextPoints();$('fg10LocationMeta').textContent=ctx.mode==='route'?'Theo Active Trip':ctx.mode==='device'?'Theo vị trí thiết bị':`Khu vực đang xem · ${ctx.pts[0].lat.toFixed(4)}, ${ctx.pts[0].lon.toFixed(4)}`;
   if(!quiet)status('Đang lấy thời tiết từ Open-Meteo…');try{const rows=await Promise.all(ctx.pts.map(async p=>{try{return await weather(p)}catch(e){return {...p,error:e.name==='AbortError'?'Hết thời gian chờ':'Không kết nối được nguồn weather'}}}));if(id===requestId)render(rows,ctx)}catch(e){if(id===requestId){invalidateWeather();status('Không thể cập nhật weather live. Hãy kiểm tra Internet hoặc thử lại sau.','error')}}
 }
 function startTimer(){if(timer)clearInterval(timer);timer=setInterval(()=>{if(navigator.onLine&&!document.hidden)refresh(true)},AUTO_MS)}
 $('fg10UseAuto').onclick=()=>{++locationIntent;locationMode='auto';setLocButtons();refresh(false)};$('fg10UseMap').onclick=()=>{++locationIntent;locationMode='map';setLocButtons();refresh(false)};
 $('fg10UseDevice').onclick=()=>{const intent=++locationIntent;if(!navigator.geolocation){status('Thiết bị/trình duyệt không hỗ trợ GPS. Live vẫn có thể dùng Khu vực đang xem.','warn');return}status('Đang lấy vị trí thiết bị…');navigator.geolocation.getCurrentPosition(pos=>{if(intent!==locationIntent)return;devicePoint={kind:'device',label:'Vị trí của tôi',lat:Number(pos.coords.latitude),lon:Number(pos.coords.longitude)};locationMode='device';setLocButtons();try{map.setView([devicePoint.lat,devicePoint.lon],Math.max(map.getZoom(),14))}catch(e){}refresh(false)},err=>{if(intent!==locationIntent)return;status('Không lấy được vị trí thiết bị. Bạn vẫn có thể dùng Khu vực đang xem hoặc Active Trip.','warn')},{enableHighAccuracy:true,timeout:10000,maximumAge:60000})};
 document.addEventListener('fg70:route',()=>{++requestId;invalidateWeather();if(panel.classList.contains('show'))setTimeout(()=>refresh(true),350)});addEventListener('online',()=>{panel.classList.remove('fg10-offline');if(!document.hidden)refresh(true)});addEventListener('offline',()=>{++requestId;invalidateWeather();panel.classList.add('fg10-offline');status('Đang offline. Thời tiết tạm dừng và sẽ tự nối lại khi có mạng.','error')});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&(!lastResult||Date.now()-lastResult.at>2*60*1000))refresh(true)});
 try{map.on('moveend',()=>{if(locationMode!=='map'||!panel.classList.contains('show'))return;clearTimeout(mapDebounce);mapDebounce=setTimeout(()=>refresh(true),1200)})}catch(e){}
 const hb=$('fg10HeaderBadge');if(hb){hb.title='Weather trực tuyến tự cập nhật; dữ liệu ngập vẫn là model/lịch sử, không phải cảm biến mặt đường.';hb.innerHTML='<i></i>Thời tiết'}
 startTimer();window.FG10_REFRESH=refresh;if(!document.hidden)refresh(true);
})();
