(()=>{
'use strict';
const API='https://floodguard-rescue-backend.onrender.com';
const DEFAULT={lat:10.7769,lon:106.7009,label:'Trung tâm TP.HCM'};
const $=id=>document.getElementById(id);
let map,marker,radarLayer,requestController;

function fmt(value,digits=1,suffix=''){
 if(value===null||value===undefined||value==='')return '—';
 const n=Number(value);return Number.isFinite(n)?n.toFixed(digits).replace(/\.0$/,'')+suffix:'—';
}
function timeLabel(value){
 if(!value)return '—';
 const d=new Date(value);if(Number.isNaN(d.getTime()))return String(value).slice(11,16)||'—';
 return new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Ho_Chi_Minh'}).format(d);
}
function setLoading(on,text='Đang tải dữ liệu trực tiếp…'){
 const el=$('liveLoading');if(!el)return;el.hidden=!on;el.textContent=text;
}

function n(value,fallback=0){const x=Number(value);return Number.isFinite(x)?x:fallback}
function sum(values,count){return (Array.isArray(values)?values.slice(0,count):[]).reduce((a,v)=>a+Math.max(0,n(v)),0)}
function clientScreening(currentMm,next6hMm,next24hMm,max1hMm,elevationM){
 let score=0;const factors=[];
 if(currentMm>=20){score+=30;factors.push('Mưa hiện tại rất lớn')}else if(currentMm>=10){score+=22;factors.push('Mưa hiện tại lớn')}else if(currentMm>=5){score+=12;factors.push('Đang có mưa đáng kể')}else if(currentMm>0){score+=5;factors.push('Đang có mưa')}
 if(next6hMm>=50){score+=35;factors.push('Tổng mưa 6 giờ dự báo rất cao')}else if(next6hMm>=30){score+=26;factors.push('Tổng mưa 6 giờ dự báo cao')}else if(next6hMm>=15){score+=15;factors.push('Tổng mưa 6 giờ đáng chú ý')}else if(next6hMm>=5){score+=7;factors.push('Có mưa trong 6 giờ tới')}
 if(next24hMm>=100){score+=20;factors.push('Tổng mưa 24 giờ rất cao')}else if(next24hMm>=60){score+=14;factors.push('Tổng mưa 24 giờ cao')}else if(next24hMm>=30){score+=8;factors.push('Tổng mưa 24 giờ đáng chú ý')}
 if(max1hMm>=20){score+=15;factors.push('Có giờ mưa cường độ rất lớn')}else if(max1hMm>=10){score+=9;factors.push('Có giờ mưa cường độ lớn')}
 if(Number.isFinite(Number(elevationM))){const e=Number(elevationM);if(e<=1){score+=18;factors.push('Cao độ rất thấp')}else if(e<=3){score+=12;factors.push('Cao độ thấp')}else if(e<=5){score+=7;factors.push('Cao độ tương đối thấp')}}
 score=Math.min(100,Math.max(0,Math.round(score)));let level='very-low',label='Rất thấp';
 if(score>=80){level='extreme';label='Rất cao'}else if(score>=60){level='high';label='Cao'}else if(score>=40){level='moderate';label='Trung bình'}else if(score>=20){level='low';label='Thấp'}
 return {score,level,label,factors:factors.slice(0,5),basis:'precipitation-and-elevation-only',official_warning:false,disclaimer:'Chỉ số sàng lọc chỉ dùng mưa dự báo và cao độ. Chưa bao gồm triều, thoát nước, độ sâu ngập quan trắc hoặc cảnh báo chính thức.'};
}
async function directWeather(lat,lon,signal){
 const u=new URL('https://api.open-meteo.com/v1/forecast');
 u.searchParams.set('latitude',lat);u.searchParams.set('longitude',lon);
 u.searchParams.set('current','temperature_2m,relative_humidity_2m,precipitation,rain,showers,weather_code');
 u.searchParams.set('hourly','precipitation,rain,showers,precipitation_probability,weather_code');
 u.searchParams.set('forecast_hours','24');u.searchParams.set('timezone','Asia/Ho_Chi_Minh');
 const r=await fetch(u,{cache:'no-store',signal});if(!r.ok)throw new Error('Open-Meteo HTTP '+r.status);
 return r.json();
}
function applyDirectWeather(base,weather,lat,lon){
 const h=weather?.hourly||{},p=Array.isArray(h.precipitation)?h.precipitation:[],rain=Array.isArray(h.rain)?h.rain:[],showers=Array.isArray(h.showers)?h.showers:[];
 const currentMm=Math.max(0,n(weather?.current?.precipitation)),next3=sum(p,3),next6=sum(p,6),next24=sum(p,24),max1=p.length?Math.max(...p.map(v=>Math.max(0,n(v)))):0;
 const elevation=base?.location?.elevation_m;
 base.location=base.location||{latitude:Number(lat),longitude:Number(lon),elevation_m:null,elevation_source:'unavailable'};
 base.current={observed_at:weather?.current?.time||null,temperature_c:n(weather?.current?.temperature_2m,null),humidity_percent:n(weather?.current?.relative_humidity_2m,null),precipitation_mm:currentMm,rain_mm:n(weather?.current?.rain,null),showers_mm:n(weather?.current?.showers,null),weather_code:Number.isFinite(Number(weather?.current?.weather_code))?Number(weather.current.weather_code):null};
 base.forecast={next_3h_mm:next3,next_6h_mm:next6,next_24h_mm:next24,max_1h_mm:max1,timeline:(Array.isArray(h.time)?h.time:[]).slice(0,24).map((time,i)=>({time,precipitation_mm:n(p[i]),rain_mm:n(rain[i]),showers_mm:n(showers[i]),precipitation_probability:Number.isFinite(Number(h.precipitation_probability?.[i]))?Number(h.precipitation_probability[i]):null,weather_code:Number.isFinite(Number(h.weather_code?.[i]))?Number(h.weather_code[i]):null}))};
 base.screening=clientScreening(currentMm,next6,next24,max1,elevation);
 base.provider_status=Object.assign({},base.provider_status,{weather:'browser-direct'});
 base.generated_at=new Date().toISOString();return base;
}
function setError(message){
 $('liveSubtitle').textContent=message||'Không thể tải dữ liệu trực tiếp.';
 $('riskBadge').textContent='Chưa có dữ liệu';$('riskBadge').dataset.level='very-low';
}
function renderTimeline(rows){
 const root=$('liveHours');root.replaceChildren();
 const data=(Array.isArray(rows)?rows:[]).slice(0,8);
 const max=Math.max(1,...data.map(x=>Number(x.precipitation_mm)||0));
 data.forEach(row=>{
  const mm=Math.max(0,Number(row.precipitation_mm)||0);
  const item=document.createElement('div');item.className='live-hour';
  const pct=Math.max(3,Math.round(mm/max*100));
  item.innerHTML='<div class="live-barbox"><i class="live-bar" style="height:'+pct+'%"></i></div><b>'+timeLabel(row.time)+'</b><small>'+fmt(mm,1,' mm')+'</small>';
  root.appendChild(item);
 });
 if(!data.length){root.innerHTML='<p>Chưa có dữ liệu theo giờ.</p>'}
}
function renderRadar(radar){
 if(radarLayer){map.removeLayer(radarLayer);radarLayer=null}
 if(!radar?.available||!radar.tile_url_template){
  $('radarStatus').textContent='Radar chưa sẵn sàng';
  return;
 }
 radarLayer=L.tileLayer(radar.tile_url_template,{
  opacity:.56,
  maxNativeZoom:Number(radar.max_native_zoom)||7,
  maxZoom:18,
  attribution:'Radar: <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>'
 }).addTo(map);
 $('radarStatus').textContent='Radar gần nhất · '+timeLabel(radar.observed_at);
}
function render(data){
 const s=data.screening||{},score=s.score===null||s.score===undefined?null:Number(s.score);
 $('riskBadge').textContent=s.label||'Chưa rõ';$('riskBadge').dataset.level=s.level||'very-low';
 $('riskScore').textContent=Number.isFinite(score)?String(Math.round(score)):'—';
 $('riskMeter').style.width=Number.isFinite(score)?Math.max(0,Math.min(100,score))+'%':'0%';
 $('currentRain').textContent=fmt(data.current?.precipitation_mm,1,' mm');
 $('rain6h').textContent=fmt(data.forecast?.next_6h_mm,1,' mm');
 $('rain24h').textContent=fmt(data.forecast?.next_24h_mm,1,' mm');
 $('max1h').textContent=fmt(data.forecast?.max_1h_mm,1,' mm');
 $('elevation').textContent=fmt(data.location?.elevation_m,1,' m');
 $('temperature').textContent=fmt(data.current?.temperature_c,1,' °C');
 $('humidity').textContent=fmt(data.current?.humidity_percent,0,'%');
 $('updatedAt').textContent='Cập nhật '+timeLabel(data.generated_at);
 $('liveSubtitle').textContent='Điểm đang xem: '+Number(data.location.latitude).toFixed(5)+', '+Number(data.location.longitude).toFixed(5);
 $('elevationSource').textContent=data.location?.elevation_source||'DEM';
 const factors=$('riskFactors');factors.replaceChildren();
 const list=Array.isArray(s.factors)&&s.factors.length?s.factors:['Chưa có yếu tố mưa/cao độ nổi bật theo ngưỡng sàng lọc.'];
 list.forEach(t=>{const div=document.createElement('div');div.className='live-factor';div.textContent=t;factors.appendChild(div)});
 $('screeningDisclaimer').textContent=s.disclaimer||'Chỉ số này không phải cảnh báo chính thức.';
 renderTimeline(data.forecast?.timeline);
 renderRadar(data.radar);
}
async function load(lat,lon,{pan=true}={}){
 if(requestController)requestController.abort();
 requestController=new AbortController();
 setLoading(true);
 try{
  const u=new URL(API+'/api/environment/context');u.searchParams.set('lat',lat);u.searchParams.set('lon',lon);
  const backendPromise=fetch(u,{cache:'no-store',signal:requestController.signal}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||'Backend FloodGuard chưa phản hồi.');return d});
  const weatherPromise=directWeather(lat,lon,requestController.signal);
  const [backendResult,weatherResult]=await Promise.allSettled([backendPromise,weatherPromise]);
  if(backendResult.status!=='fulfilled'&&weatherResult.status!=='fulfilled')throw new Error('Không thể tải dữ liệu trực tiếp.');
  let d=backendResult.status==='fulfilled'?backendResult.value:{ok:true,location:{latitude:Number(lat),longitude:Number(lon),elevation_m:null,elevation_source:'unavailable'},radar:{available:false},provider_status:{backend:'unavailable'},screening:{score:null,label:'Đang chờ dữ liệu',level:'unknown',factors:[]},generated_at:new Date().toISOString()};
  if(weatherResult.status==='fulfilled')d=applyDirectWeather(d,weatherResult.value,lat,lon);
  const ll=[Number(d.location?.latitude??lat),Number(d.location?.longitude??lon)];
  if(!marker)marker=L.marker(ll,{draggable:true}).addTo(map);
  else marker.setLatLng(ll);
  marker.bindPopup('<b>Điểm kiểm tra</b><br>'+ll[0].toFixed(5)+', '+ll[1].toFixed(5));
  if(pan)map.panTo(ll);
  render(d);
 }catch(e){
  if(e?.name!=='AbortError')setError(e.message);
 }finally{
  if(!requestController?.signal.aborted)setLoading(false);
 }
}
function useLocation(){
 if(!navigator.geolocation){setError('Trình duyệt này không hỗ trợ định vị.');return}
 const btn=$('locateBtn');btn.disabled=true;btn.textContent='Đang định vị…';
 navigator.geolocation.getCurrentPosition(
  p=>{btn.disabled=false;btn.textContent='Vị trí của tôi';const lat=p.coords.latitude,lon=p.coords.longitude;map.setView([lat,lon],13);load(lat,lon)},
  ()=>{btn.disabled=false;btn.textContent='Vị trí của tôi';setError('Không lấy được vị trí. Bạn có thể bấm trực tiếp lên bản đồ.')},
  {enableHighAccuracy:false,timeout:10000,maximumAge:120000}
 );
}
function start(){
 if(typeof L==='undefined'){setError('Không tải được thư viện bản đồ.');return}
 map=L.map('liveMap',{zoomControl:true,minZoom:7,maxZoom:18}).setView([DEFAULT.lat,DEFAULT.lon],12);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19,
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
 }).addTo(map);
 map.on('click',e=>load(e.latlng.lat,e.latlng.lng,{pan:false}));
 $('locateBtn').addEventListener('click',useLocation);
 $('resetBtn').addEventListener('click',()=>{map.setView([DEFAULT.lat,DEFAULT.lon],12);load(DEFAULT.lat,DEFAULT.lon)});
 load(DEFAULT.lat,DEFAULT.lon,{pan:false});
 setInterval(()=>{const c=marker?.getLatLng()||map.getCenter();load(c.lat,c.lng,{pan:false})},5*60*1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();