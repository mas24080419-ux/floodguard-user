(()=>{
'use strict';
const API='https://floodguard-rescue-backend.onrender.com';
const DEFAULT={lat:10.7769,lon:106.7009,label:'Trung tâm TP.HCM'};
const $=id=>document.getElementById(id);
let map,marker,radarLayer,requestController;

function fmt(value,digits=1,suffix=''){
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
 const s=data.screening||{};
 $('riskBadge').textContent=s.label||'Chưa rõ';$('riskBadge').dataset.level=s.level||'very-low';
 $('riskScore').textContent=Number.isFinite(Number(s.score))?String(Math.round(Number(s.score))):'—';
 $('riskMeter').style.width=Math.max(0,Math.min(100,Number(s.score)||0))+'%';
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
  const r=await fetch(u,{cache:'no-store',signal:requestController.signal});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.message||'Không thể tải dữ liệu trực tiếp.');
  const ll=[Number(d.location.latitude),Number(d.location.longitude)];
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