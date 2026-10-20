/* Weather presentation. Reuse location handlers, forecast data and map instance. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),panel=$('fg10Panel'),scroll=$('fg10Scroll');
 if(!panel||!scroll||$('fgWeatherLocationSource'))return;
 panel.classList.add('fg-weather-screen');
 const en=()=>document.documentElement.lang==='en',tr=(vi,english)=>en()?english:vi;
 const number=v=>v===null||v===undefined||v===''||typeof v==='boolean'||!Number.isFinite(Number(v))?null:Number(v);
 const fmt=v=>number(v)===null?'—':new Intl.NumberFormat(en()?'en-US':'vi-VN',{maximumFractionDigits:1}).format(Number(v));
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const time=t=>typeof t==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(t)?t.slice(11,16):'—';
 const svg=(path,extra='')=>'<svg viewBox="0 0 40 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" '+extra+'>'+path+'</svg>';
 const drop='<path d="M20 4S10 16 10 23a10 10 0 0 0 20 0C30 16 20 4 20 4Z"/>';
 const wind='<path d="M5 12h20a5 5 0 1 0-5-5M5 19h26a5 5 0 1 1-5 5M5 26h10a5 5 0 1 1-5 5"/>';
 const clock='<circle cx="20" cy="18" r="13"/><path d="M20 10v8l5 3"/>';
 function weatherIcon(code,rain){
  const c=number(code);if(c===null)return '<span aria-hidden="true">—</span>';
  const cloud='<path d="M10 24a8 8 0 1 1 3-15 10 10 0 0 1 19 4 6 6 0 0 1-1 12H10Z" fill="currentColor" stroke="none"/>';
  if([95,96,99].includes(c))return svg(cloud+'<path d="m22 26-5 6h6l-2 3" stroke="#a4d9ff" stroke-width="2"/>');
  if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(c)||number(rain)>0.2)return svg(cloud+'<path d="m14 29-2 3m9-3-2 3m9-3-2 3" stroke="#7bc3ff" stroke-width="2.4"/>');
  if([45,48].includes(c))return svg(cloud+'<path d="M9 29h24m-21 5h18"/>');
  if([71,73,75,77,85,86].includes(c))return svg(cloud+'<path d="M13 31h.01m8-2h.01m7 4h.01" stroke-width="3"/>');
  if([1,2,3].includes(c))return svg(cloud);
  if(c===0)return svg('<circle cx="20" cy="18" r="7" fill="#ffe0a0" stroke="none"/><path d="M20 3v4m0 22v4M5 18h4m22 0h4M9 7l3 3m16 16 3 3M9 29l3-3M28 10l3-3" stroke="#ffe0a0"/>');
  return '<span aria-hidden="true">—</span>';
 }
 const head=panel.querySelector('.fg10-head'),sourceLabel=document.createElement('label');sourceLabel.className='fg-weather-location';
 sourceLabel.innerHTML='<select id="fgWeatherLocationSource" aria-label="Nguồn vị trí"><option value="auto">Tự chọn</option><option value="device">Vị trí của tôi</option><option value="map">Khu vực đang xem</option></select>';
 head.insertBefore(sourceLabel,$('fg10Close'));
 const select=$('fgWeatherLocationSource'),modes={auto:'fg10UseAuto',device:'fg10UseDevice',map:'fg10UseMap'};
 function syncLocation(){select.value=Object.keys(modes).find(key=>$(modes[key])?.classList.contains('active'))||'auto';}
 select.onchange=()=>{$(modes[select.value])?.click();syncLocation();};
 for(const id of Object.values(modes))if($(id))new MutationObserver(syncLocation).observe($(id),{attributes:true,attributeFilter:['class']});
 syncLocation();
 const hourlySection=$('fg10Hourly').closest('.fg10-section');hourlySection.classList.add('fg-weather-hourly-section');
 const hourlyTitle=hourlySection.querySelector('.fg10-section-title b');if(hourlyTitle)hourlyTitle.innerHTML=svg(clock)+'<span>Dự báo theo giờ</span>';
 const chart=document.createElement('section');chart.id='fgWeatherRainChart';chart.className='fg-weather-rain-card';chart.setAttribute('aria-labelledby','fgWeatherRainTitle');
 chart.innerHTML='<div class="fg-weather-section-heading">'+svg(drop)+'<span id="fgWeatherRainTitle"></span></div><div class="fg-weather-rain-top"><strong id="fgWeatherRainTotal">—</strong><small id="fgWeatherRainPeriod"></small></div><div id="fgWeatherRainBars"></div><p id="fgWeatherRainNote"></p>';
 hourlySection.after(chart);
 const cards=$('fg10Now')?.closest('.fg10-kpis'),cardDefs=[
  ['fg10Now','Mưa hiện tại','Current rain','Lớn nhất tại các điểm theo dõi','Highest at monitored points',drop],
  ['fg10Wind','Gió hiện tại','Current wind','Tốc độ gió tại điểm hiển thị','Wind speed at the displayed point',wind],
  ['fg10Humidity','Độ ẩm','Humidity','Độ ẩm tương đối','Relative humidity',drop],
  ['fg10Prob','Khả năng có mưa','Rain probability','Cao nhất trong 6 giờ tới','Highest in the next 6 hours',drop],
  ['fg10Six','Mưa 6 giờ · các điểm theo dõi','6-hour rain · monitored points','Giá trị lớn nhất trong các điểm','Highest across monitored points',drop],
  ['fg10Temp','Nhiệt độ hiện tại','Current temperature','Tại điểm đang hiển thị','At the displayed point',clock]
 ];
 for(const [id,,,,,path] of cardDefs){const value=$(id),card=value?.closest('.fg10-kpi');if(!card)continue;const label=card.querySelector('span');if(!label)continue;const heading=document.createElement('div');heading.className='fg-weather-metric-heading';heading.innerHTML=svg(path);heading.append(label);value.before(heading);const note=document.createElement('small');note.className='fg-weather-metric-note';card.append(note);cards.append(card);}
 const footer=document.createElement('footer');footer.className='fg-weather-footer';if($('fg10Updated'))footer.append($('fg10Updated'));const refreshNote=document.createElement('p');footer.append(refreshNote);scroll.append(footer);
 let latest=null,latestHourly=null;
 function renderHourly(row){
  latestHourly=row;const host=$('fg10Hourly');
  if(!row||row.error||!Array.isArray(row.hourly?.time)||!row.hourly.time.length){host.innerHTML='<p class="fg-weather-empty">'+tr('Chưa có dự báo theo giờ.','Hourly forecast unavailable.')+'</p>';return;}
  const h=row.hourly;
  host.innerHTML=h.time.slice(0,6).map((t,i)=>{const temp=number(h.temperature?.[i]),p=number(h.probability?.[i]),rain=number(h.precipitation?.[i]);return '<div class="fg10-hour"><div class="t">'+escape(time(t))+'</div><div class="ico">'+weatherIcon(h.code?.[i],rain)+'</div><div class="fg-hour-temp">'+(temp===null?'—':Math.round(temp)+'°')+'</div><div class="p">'+(p===null?'—':fmt(p)+'%')+'</div><div class="mm">'+(rain===null?'—':fmt(rain)+' mm')+'</div></div>';}).join('');
 }
 function drawRain(state){
  const row=(state?.rows||[]).find(r=>r&&!r.error),h=row?.hourly,times=Array.isArray(h?.time)?h.time.slice(0,6):[];
  const values=times.map((_,i)=>{const n=number(h?.precipitation?.[i]);return n!==null&&n>=0?n:null;});
  const complete=values.length===6&&values.every(v=>v!==null),zero=complete&&values.every(v=>v===0),known=values.some(v=>v!==null);
  chart.dataset.state=complete?(zero?'zero':'ready'):known?'partial':'unknown';
  $('fgWeatherRainTotal').textContent=complete?fmt(values.reduce((a,b)=>a+b,0))+' mm':'—';
  $('fgWeatherRainPeriod').textContent=tr('Tổng trong 6 giờ tới','Total over the next 6 hours');
  const bars=$('fgWeatherRainBars');bars.replaceChildren();
  if(times.length){const max=Math.max(1,...values.filter(v=>v!==null)),plot=document.createElement('div');plot.className='fg-weather-rain-plot';plot.setAttribute('role','img');plot.setAttribute('aria-label',times.map((t,i)=>time(t)+': '+(values[i]===null?tr('Chưa có dữ liệu','No data'):fmt(values[i])+' mm')).join('; '));
   times.forEach((t,i)=>{const cell=document.createElement('div');cell.className='fg-weather-rain-cell';cell.setAttribute('aria-hidden','true');const value=document.createElement('b');value.textContent=fmt(values[i]);const track=document.createElement('div');track.className='fg-weather-rain-track';const bar=document.createElement('i');bar.style.height=(values[i]===null?0:values[i]/max*44)+'px';track.append(bar);const label=document.createElement('small');label.textContent=time(t);cell.append(value,track,label);plot.append(cell);});bars.append(plot);}
  $('fgWeatherRainNote').textContent=!known?tr('Chưa có dữ liệu dự báo mưa.','Rain forecast unavailable.'):!complete?tr('Chưa đủ dữ liệu cho 6 giờ dự báo.','Incomplete data for the 6-hour forecast.'):zero?tr('Không có mưa dự báo trong 6 giờ này.','No rain forecast during these 6 hours.'):(state.rows.filter(r=>r&&!r.error).length>1?tr('Biểu đồ tại: ','Chart for: ')+String(row.label||''): '');
 }
 function metrics(state){
  const rows=(state?.rows||[]).filter(r=>r&&!r.error),row=rows[0];
  for(const [id,value,suffix] of [['fg10Now',state?.now,''],['fg10Wind',row?.wind,''],['fg10Humidity',row?.humidity,'%'],['fg10Prob',state?.prob,'%'],['fg10Six',state?.scenario,''],['fg10Temp',row?.temp,'°C']])$(id).textContent=number(value)===null?'—':fmt(value)+suffix;
  // Legacy aggregate values may contain a partial sum. Do not display it as a complete forecast.
  for(const [id,field] of [['fg10Six','precipitation'],['fg10Prob','probability']])if(rows.some(r=>r.hourly?.time?.length!==6||r.hourly?.[field]?.length!==6||r.hourly[field].some(v=>number(v)===null)))$(id).textContent='—';
 }
 function update(state){latest=state;const row=(state?.rows||[]).find(r=>r&&!r.error);renderHourly(row);drawRain(state);metrics(state);}
 function labels(){
  select.setAttribute('aria-label',tr('Nguồn vị trí','Location source'));
  const names=[['Tự chọn','Automatic'],['Vị trí của tôi','My location'],['Khu vực đang xem','Current map area']];[...select.options].forEach((o,i)=>o.textContent=tr(...names[i]));
  if(hourlyTitle)hourlyTitle.querySelector('span').textContent=tr('Dự báo theo giờ','Hourly forecast');
  hourlySection.querySelector('.fg10-section-title>span').textContent=tr('6 giờ tới','Next 6 hours');
  $('fgWeatherRainTitle').textContent=tr('Lượng mưa dự báo','Forecast rainfall');
  for(const [id,vi,english,noteVi,noteEn] of cardDefs){const card=$(id)?.closest('.fg10-kpi');if(!card)continue;card.querySelector('.fg-weather-metric-heading span').textContent=tr(vi,english);card.querySelector('.fg-weather-metric-note').textContent=tr(noteVi,noteEn);}
  refreshNote.textContent=tr('Tự làm mới mỗi 5 phút','Refreshes every 5 minutes');
  renderHourly(latestHourly);drawRain(latest);metrics(latest);
 }
 window.FGWeatherView={renderHourly,update};
 document.addEventListener('fg10:weather',e=>update(e.detail));window.addEventListener('fg:languagechange',labels);
 if(window.FG10_LIVE_STATE)update(window.FG10_LIVE_STATE);labels();
})();
