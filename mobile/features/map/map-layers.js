function fg47PhotoMeta(e){
  const id=String((e&&e.id)||'');
  if(FG47_REAL_PHOTOS[id]) return FG47_REAL_PHOTOS[id];
  let n=0; for(let i=0;i<id.length;i++) n=(n*31+id.charCodeAt(i))>>>0;
  const src=FG47_EV_ILLUSTRATIONS[n%FG47_EV_ILLUSTRATIONS.length];
  const name=String((e&&e.name)||'Trạm sạc EV');
  return {src,badge:'Ảnh minh họa · chưa xác minh tại trạm',caption:`Ảnh minh họa cho ${name}`,note:'Ảnh phía trên chỉ dùng để mô tả loại hình trạm sạc. Đây không phải ảnh thực địa đã xác minh của trạm này.',real:false};
}
function fg47Attr(s){return String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function fg47PhotoNoteHtml(e){const meta=fg47PhotoMeta(e); return `<div class="fg47-photo-note">${fg47Attr(meta.note)}</div>`;}
function fg47PhotoBlock(e,compact=false){
  const meta=fg47PhotoMeta(e), src=meta.src;
  const badge=fg47Attr(meta.badge), caption=fg47Attr(meta.caption), alt=meta.real?'Ảnh thực địa trạm sạc EV':'Ảnh minh họa trạm sạc EV';
  if(compact) return `<div class="fg47-evthumb fg47-photo-open" data-photo="${src}" data-caption="${caption}" data-real="${meta.real?'1':'0'}"><img src="${src}" alt="${alt}" loading="lazy"></div>`;
  return `<div class="fg47-evphoto fg47-photo-open" data-photo="${src}" data-caption="${caption}" data-real="${meta.real?'1':'0'}"><img src="${src}" alt="${alt}" loading="lazy"><span class="fg47-evphoto-badge">${badge}</span></div>`;
}


EV.forEach(e=>{
 let chtml='';
 if(e.candidate_pairs && e.candidate_pairs.length){
   const cls=e.screening_priority==='HIGH'?'b-high':e.screening_priority==='MEDIUM'?'b-med':'b-low';
   chtml=`<div class="divider"></div>${badge('CHỈ SÀNG LỌC','b-gray')}${badge('Mức ưu tiên kiểm tra: '+viPriority(e.screening_priority),cls)}<div class="p-sub"><b>Các tuyến ghép ứng viên:</b></div>`+e.candidate_pairs.map(p=>`<div class="p-sub">• <b>${esc(p.street)}</b> · ${esc(p.match_status)} · số dòng bằng chứng: ${p.evidence_rows}<br>${btn(p.flood_url,'Bằng chứng ngập')}</div>`).join('')+`<div class="p-sub"><b>Trạng thái kết luận:</b> CHƯA XÁC MINH. Ghép ứng viên không chứng minh trạm bị ngập, đóng cửa, mất khả năng tiếp cận hoặc trạng thái hoạt động trong lịch sử.</div>`;
 }
 const popup=`<div class="p-title">⚡ ${esc(e.name)}</div>${fg47PhotoBlock(e)}<div class="p-sub"><b>${esc(e.id)}</b> · bản ghi trong danh mục EV đã cung cấp</div>${badge((e.power??'–')+' kW tối đa','b-green')}${badge((e.ports??'–')+' cổng được ghi nhận','b-green')}${badge((e.fast_ports??'–')+' cổng ≥60 kW','b-green')}<div class="p-sub">${esc(e.address)}</div><div class="p-sub"><b>Tệp nguồn:</b> ${esc(e.source_file)}<br><b>Trạng thái hoạt động:</b> chưa được xác minh độc lập cho các sự kiện ngập lịch sử.</div>${fg47PhotoNoteHtml(e)}${chtml}${btn(e.gmap,'Google Maps')}`;
 const m=L.marker([e.lat,e.lon],{icon:evIcon(e.screening_priority),title:e.name}).bindPopup(popup);
 if(e.screening_priority==='HIGH')evHigh.addLayer(m); else if(e.screening_priority==='MEDIUM')evMed.addLayer(m); else if(e.screening_priority==='LOW')evLow.addLayer(m); else evBase.addLayer(m);
 SEARCH.push({name:e.name,type:e.screening_priority==='NONE'?'Danh mục EV':'Ứng viên EV · '+e.screening_priority,lat:e.lat,lon:e.lon,popup});
});
RAIN_AUTO.forEach(r=>{const popup=`<div class="p-title">🌧 ${esc(r.name)}</div>${badge('TRẠM MƯA TỰ ĐỘNG CHÍNH THỨC','b-low')}<div class="p-sub"><b>Khu vực:</b> ${esc(r.area)}<br><b>Tọa độ:</b> ${r.lat}, ${r.lon}<br><b>Nguồn:</b> ${esc(r.source_table)}</div>${btn(r.source_url,'Báo cáo chính thức')}${btn(`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lon}`,'Google Maps')}`; L.marker([r.lat,r.lon],{icon:rainIcon,title:r.name}).bindPopup(popup).addTo(rainAutoLayer); SEARCH.push({name:r.name,type:'Trạm mưa tự động · Bảng 3.42',lat:r.lat,lon:r.lon,popup})});
RAIN_REG.forEach(r=>{const popup=`<div class="p-title">🌦 ${esc(r.name)}</div>${badge('TRẠM MƯA KHU VỰC CHÍNH THỨC','b-low')}<div class="p-sub"><b>Tọa độ:</b> ${r.lat}, ${r.lon}<br><b>Nguồn:</b> ${esc(r.source_table)}<br>${esc(r.caution)}</div>${btn(r.source_url,'Báo cáo chính thức')}${btn(`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lon}`,'Google Maps')}`; L.marker([r.lat,r.lon],{icon:rain2Icon,title:r.name}).bindPopup(popup).addTo(rainRegLayer); SEARCH.push({name:r.name,type:'Trạm mưa khu vực · Bảng 3.8',lat:r.lat,lon:r.lon,popup})});

const rainMasterIcon=L.divIcon({className:'',html:'<div class="rain-master-icon"></div>',iconSize:[18,18],iconAnchor:[9,9]});
RAIN_STATIONS_IMPORT.forEach(r=>{
 const popup=`<div class="p-title">🌧 ${esc(r.name)}</div>${badge('TRẠM MƯA · RAINFALL MASTER','b-low')}<div class="p-sub"><b>Vị trí công bố:</b> ${esc(r.location||'—')}<br><b>Tọa độ:</b> ${r.lat}, ${r.lon}<br><b>Lưu ý:</b> ${esc(r.note||'Chỉ là tọa độ trạm mưa; không phải cảm biến ngập.')}</div>${btn(r.url,'Nguồn tọa độ')}${btn(`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lon}`,'Google Maps')}`;
 L.marker([r.lat,r.lon],{icon:rainMasterIcon,title:r.name}).bindPopup(popup).addTo(rainMasterLayer);
 SEARCH.push({name:r.name,type:'Trạm mưa · Rainfall Master Excel',lat:r.lat,lon:r.lon,popup});
});
rainMasterLayer.addTo(map);
STREETS.forEach(s=>{let extra=''; if(s.core && s.core_meta){extra=`${badge('TUYẾN TRỌNG TÂM','b-purple')}${badge((s.core_meta.total||0)+' dòng bằng chứng','b-purple')}<div class="p-sub"><b>Cơ sở tọa độ:</b> ${esc(s.core_meta.basis)}<br><b>Mức sẵn sàng:</b> ${esc(s.core_meta.readiness)}<br>${esc(s.core_meta.caution)}</div>`} const popup=`<div class="p-title">🌊 ${esc(s.name)}</div>${extra}${badge('ĐIỂM ĐẠI DIỆN','b-high')}<div class="p-sub"><b>Mã bản đồ:</b> ${esc(s.id)}<br><b>Tọa độ:</b> ${s.lat}, ${s.lon}<br><b>Trạng thái tọa độ:</b> ${esc(s.status)}<br><b>Lưu ý toàn vẹn:</b> điểm đánh dấu này không phải vị trí chính xác của cảm biến đo độ ngập.</div>${btn(s.source_url,'Bằng chứng ngập')}${btn(`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`,'Google Maps')}`; const layer=s.core?coreLayer:streetLayer; L.marker([s.lat,s.lon],{icon:s.core?coreIcon:streetIcon,title:s.name}).bindPopup(popup).addTo(layer); SEARCH.push({name:s.name,type:s.core?'Tuyến ngập trọng tâm · điểm đại diện':'Tuyến ngập · điểm đại diện',lat:s.lat,lon:s.lon,popup})});
function setLayer(id,layer){const on=document.getElementById(id).checked;if(on)map.addLayer(layer);else map.removeLayer(layer)} function sync(){setLayer('evBaseT',evBase);setLayer('evLowT',evLow);setLayer('evMedT',evMed);setLayer('evHighT',evHigh);setLayer('rainAutoT',rainAutoLayer);setLayer('rainRegT',rainRegLayer);setLayer('coreT',coreLayer);setLayer('streetT',streetLayer)}
['evBaseT','evLowT','evMedT','evHighT','rainAutoT','rainRegT','coreT','streetT'].forEach(id=>document.getElementById(id).onchange=sync); sync();
const fitCoords=[...EV.map(x=>[x.lat,x.lon]),...RAIN_AUTO.map(x=>[x.lat,x.lon]),...STREETS.map(x=>[x.lat,x.lon])]; const bounds=L.latLngBounds(fitCoords); map.fitBounds(bounds,{padding:[45,45]}); document.getElementById('homeBtn').onclick=()=>map.fitBounds(bounds,{padding:[45,45]});
let sat=false;document.getElementById('baseBtn').onclick=()=>{sat=!sat;if(sat){map.removeLayer(baseStreet);baseSat.addTo(map);baseSatLabels.addTo(map)}else{map.removeLayer(baseSat);map.removeLayer(baseSatLabels);baseStreet.addTo(map)}};
const menuBtn=document.getElementById('menuBtn'),menuPanel=document.getElementById('menuPanel'),menuClose=document.getElementById('menuClose');
function setMenu(open){menuPanel.classList.toggle('open',open);menuPanel.setAttribute('aria-hidden',String(!open));menuBtn.setAttribute('aria-expanded',String(open));menuBtn.classList.toggle('active',open)}
menuBtn.onclick=(e)=>{e.stopPropagation();setMenu(!menuPanel.classList.contains('open'))};menuClose.onclick=()=>setMenu(false);menuPanel.onclick=e=>e.stopPropagation();document.addEventListener('click',()=>setMenu(false));document.addEventListener('keydown',e=>{if(e.key==='Escape'){setMenu(false);setForecast(false)}});
L.control.scale({metric:true,imperial:false,position:'bottomleft'}).addTo(map);
const legend=L.control({position:'bottomright'});legend.onAdd=()=>{const d=L.DomUtil.create('div','legend');d.innerHTML=`<div class="legend-head" role="button" tabindex="0" aria-expanded="false"><span>Chú giải bằng chứng</span><span class="legend-chevron">⌃</span></div><div class="legend-body"><div class="legend-row"><span class="dot" style="background:#22a06b"></span>Danh mục EV</div><div class="legend-row"><span class="dot" style="background:#3b82f6"></span>Ứng viên THẤP</div><div class="legend-row"><span class="dot" style="background:#f59e0b"></span>Ứng viên TRUNG BÌNH</div><div class="legend-row"><span class="dot" style="background:#ef4444"></span>Ứng viên CAO</div><div class="legend-row"><span class="tri"></span>Trạm tự động · Bảng 3.42</div><div class="legend-row"><span class="tri2"></span>Trạm khu vực · Bảng 3.8</div><div class="legend-row"><span class="ring"></span>Điểm đại diện tuyến trọng tâm</div><div class="legend-row"><span class="dot" style="background:#fb7185"></span>Điểm ngập đại diện khác</div><div class="legend-note">Màu ứng viên thể hiện mức ưu tiên kiểm tra, không phải xác suất ngập đã đo.</div></div>`;L.DomEvent.disableClickPropagation(d);const h=d.querySelector('.legend-head');const toggle=()=>{const open=d.classList.toggle('open');h.setAttribute('aria-expanded',String(open))};h.addEventListener('click',toggle);h.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});return d};legend.addTo(map);

// ===== Source-aware flood forecast + EV accessibility impact screening =====
const forecastBtn=document.getElementById('forecastBtn'),forecastPanel=document.getElementById('forecastPanel'),forecastClose=document.getElementById('forecastClose');
const fcStreet=document.getElementById('fcStreet'),fcRain=document.getElementById('fcRain');
const impactLayer=L.layerGroup().addTo(map);let lastImpactCoords=[];
function setForecast(open){forecastPanel.classList.toggle('open',open);forecastPanel.setAttribute('aria-hidden',String(!open));forecastBtn.setAttribute('aria-expanded',String(open));forecastBtn.classList.toggle('active',open);if(open){setMenu(false);runAnalysis()}}
forecastBtn.onclick=e=>{e.stopPropagation();setForecast(!forecastPanel.classList.contains('open'))};forecastClose.onclick=()=>setForecast(false);forecastPanel.onclick=e=>e.stopPropagation();
document.getElementById('fcRun').onclick=runAnalysis;fcStreet.onchange=runAnalysis;fcRain.onchange=runAnalysis;
document.querySelectorAll('.fc-tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.fc-tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.fc-pane').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.pane).classList.add('active')});
function fmt1(v){return Number.isFinite(v)?(Math.round(v*10)/10).toFixed(1):'—'}
function quantile(arr,q){const a=[...arr].sort((x,y)=>x-y);if(!a.length)return NaN;const p=(a.length-1)*q,l=Math.floor(p),h=Math.ceil(p);return l===h?a[l]:a[l]+(a[h]-a[l])*(p-l)}
function evidenceWeight(g){return g==='A'?1:g==='B'?.8:g==='C'?.55:.45}
function hav(a,b,c,d){const R=6371,toR=x=>x*Math.PI/180;const p1=toR(a),p2=toR(c),dp=toR(c-a),dl=toR(d-b);const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
function catalog(st){return STREET_CATALOG.find(x=>x.name===st)||{name:st,tier:'OCCURRENCE_ONLY',quant_events:0,occurrence_rows:0,direct_events:0,nearby_events:0,context_events:0,recurrence_2026:false,sources:[]}}
function signal(rain,rows){if(rows.length<2)return {label:'BẰNG CHỨNG ĐỊNH LƯỢNG HẠN CHẾ',score:1,note:'Chỉ có một sự kiện định lượng Tuyến × Ngày; ứng dụng chỉ hiển thị giá trị tham chiếu, không khớp mô hình từ nhiều sự kiện.'};const a=rows.map(x=>x.rain),mn=Math.min(...a),mx=Math.max(...a),q1=quantile(a,.25),q3=quantile(a,.75);if(rain<mn)return {label:'THẤP HƠN KHOẢNG MƯA CỦA CÁC SỰ KIỆN NGẬP LỊCH SỬ',score:1,note:`${fmt1(rain)} mm thấp hơn lượng mưa thấp nhất trong mẫu sự kiện ngập định lượng của tuyến (${fmt1(mn)} mm). Điều này không chứng minh tuyến đường an toàn.`};if(rain>mx)return {label:'VƯỢT KHOẢNG LỊCH SỬ / CỰC ĐOAN',score:3,note:`${fmt1(rain)} mm vượt khoảng lượng mưa quan sát trong các sự kiện ngập của tuyến (${fmt1(mn)}–${fmt1(mx)} mm); mọi ước lượng độ ngập đều mang tính ngoại suy.`};if(rain>=q3)return {label:'TÍN HIỆU NGẬP LỊCH SỬ RẤT MẠNH',score:3,note:'Lượng mưa đầu vào nằm trong 25% giá trị cao nhất của các mức mưa lịch sử gắn với ngập đã ghi nhận trên tuyến này.'};if(rain>=q1)return {label:'TIỀN LỆ NGẬP LỊCH SỬ MẠNH',score:2,note:'Lượng mưa đầu vào nằm trong khoảng lịch sử trung tâm từng gắn với ngập trên tuyến này.'};return {label:'CÓ TIỀN LỆ NGẬP LỊCH SỬ',score:2,note:'Lượng mưa đầu vào gần mức thấp của các giá trị mưa nhưng vẫn từng trùng với các sự kiện ngập được ghi nhận trên tuyến này.'}}
function analogue(rain,rows){if(!rows.length)return null;const nearest=[...rows].sort((a,b)=>Math.abs(a.rain-rain)-Math.abs(b.rain-rain)).slice(0,Math.min(3,rows.length));let sw=0,sd=0;nearest.forEach(x=>{const w=evidenceWeight(x.rain_grade)/(Math.abs(x.rain-rain)+10);sw+=w;sd+=w*x.depth});return {depth:sd/sw,nearest,min:Math.min(...nearest.map(x=>x.depth_min)),max:Math.max(...nearest.map(x=>x.depth_max))}}
function scenarioValidity(rain,rows){
 if(!rows.length)return {valid:false,code:'NO_DATA',label:'CHƯA ĐỦ DỮ LIỆU',note:'Tuyến này chưa có cặp lượng mưa–độ ngập định lượng để xây dựng dự báo.'};
 const rains=rows.map(x=>Number(x.rain)).filter(Number.isFinite),mn=Math.min(...rains),mx=Math.max(...rains);
 if(rows.length<2)return {valid:false,code:'ONE_EVENT',min:mn,max:mx,label:'CHƯA ĐỦ DỮ LIỆU ĐỂ DỰ BÁO',note:`Hiện chỉ có 1 sự kiện định lượng (${fmt1(mn)} mm). Một điểm dữ liệu không đủ để suy ra quan hệ giữa lượng mưa và độ ngập. Giá trị độ ngập lịch sử chỉ được hiển thị để tham khảo, không dùng làm dự báo.`};
 if(rain<mn||rain>mx)return {valid:false,code:'OUT_OF_RANGE',min:mn,max:mx,label:'NGOÀI PHẠM VI DỮ LIỆU LỊCH SỬ',note:`Lượng mưa ${fmt1(rain)} mm nằm ngoài khoảng đã quan sát ${fmt1(mn)}–${fmt1(mx)} mm. Hệ thống không xuất dự báo độ ngập định lượng để tránh ngoại suy không đáng tin cậy.`};
 return {valid:true,code:'VALID',min:mn,max:mx,label:'TRONG PHẠM VI DỮ LIỆU',note:`Lượng mưa nằm trong khoảng lịch sử ${fmt1(mn)}–${fmt1(mx)} mm và có ít nhất 2 sự kiện định lượng để so sánh.`};
}
function gradeBadge(g){const cls=g==='A'?'st-a':g==='B'?'st-b':'st-c';const label=g==='A'?'A · mưa trực tiếp tại tuyến':g==='B'?'B · trạm gần/cùng khu vực':g==='C-IMG'?'C · bảng ảnh chính thức/bối cảnh sự kiện':'C · bối cảnh sự kiện/trạm';return `<span class="fc-status ${cls}">${label}</span>`}
function drawChart(rows,rain,pred,isValid=true){
 const el=document.getElementById('fcChart');
 if(!rows.length){el.innerHTML='<div class="fc-note">Không có sự kiện mưa–độ ngập định lượng cho tuyến này.</div>';return}
 const nearest=[...rows].sort((a,b)=>Math.abs(a.rain-rain)-Math.abs(b.rain-rain)).slice(0,Math.min(3,rows.length));
 const nearestKey=new Set(nearest.map(x=>[x.date,x.rain,x.depth].join('|')));
 const W=760,H=320,p={l:58,r:20,t:24,b:48};
 const includeScenario=isValid&&Number.isFinite(rain);
 const xs=rows.map(x=>Number(x.rain)).concat(includeScenario?[rain]:[]).filter(Number.isFinite);
 const ys=rows.map(x=>Number(x.depth)).concat(Number.isFinite(pred)?[pred]:[]).filter(Number.isFinite);
 let xmin=Math.max(0,Math.floor((Math.min(...xs)-10)/10)*10),xmax=Math.ceil((Math.max(...xs)+10)/10)*10;
 if(xmax<=xmin)xmax=xmin+20;
 let ymax=Math.ceil((Math.max(10,...ys)+8)/5)*5;
 const X=x=>p.l+(x-xmin)/(xmax-xmin)*(W-p.l-p.r);
 const Y=y=>H-p.b-y/ymax*(H-p.t-p.b);
 const colorForGrade=g=>g==='A'?'#19a974':g==='B'?'#1677ff':'#e59b15';
 const labelForGrade=g=>g==='A'?'A · mưa trực tiếp tại tuyến':g==='B'?'B · trạm gần/cùng khu vực':'C · bối cảnh sự kiện';
 let grid='';
 for(let i=0;i<=5;i++){
   const xv=xmin+(xmax-xmin)*i/5;
   const x=X(xv);
   grid+=`<line x1="${x}" y1="${p.t}" x2="${x}" y2="${H-p.b}" stroke="#edf2f7"/><text x="${x}" y="${H-p.b+17}" text-anchor="middle" font-size="9" fill="#8294a6">${Math.round(xv)}</text>`;
 }
 for(let i=0;i<=5;i++){
   const yv=ymax*i/5;
   const y=Y(yv);
   grid+=`<line x1="${p.l}" y1="${y}" x2="${W-p.r}" y2="${y}" stroke="#edf2f7"/><text x="${p.l-8}" y="${y+3}" text-anchor="end" font-size="9" fill="#8294a6">${Math.round(yv)}</text>`;
 }
 let trend='';
 let trendNote='';
 if(rows.length>=2){
   const n=rows.length;
   const sx=rows.reduce((a,x)=>a+x.rain,0), sy=rows.reduce((a,x)=>a+x.depth,0), sxy=rows.reduce((a,x)=>a+x.rain*x.depth,0), sxx=rows.reduce((a,x)=>a+x.rain*x.rain,0);
   const den=n*sxx-sx*sx;
   if(Math.abs(den)>1e-9){
     const m=(n*sxy-sx*sy)/den, b=(sy-m*sx)/n;
     const y1=Math.max(0,Math.min(ymax,m*xmin+b)), y2=Math.max(0,Math.min(ymax,m*xmax+b));
     trend=`<line x1="${X(xmin)}" y1="${Y(y1)}" x2="${X(xmax)}" y2="${Y(y2)}" stroke="#8b5cf6" stroke-width="2.2" stroke-dasharray="7 6" opacity=".95"/>`;
     trendNote='Đường nét tím là đường xu hướng trực quan của các sự kiện lịch sử, giúp người dùng nhìn nhanh quan hệ mưa–ngập; đây không phải mô hình dự báo độc lập.';
   }
 }
 const bandHalf=Math.max(4,(xmax-xmin)*0.04);
 const scenarioBand=includeScenario?`<rect x="${X(Math.max(xmin,rain-bandHalf))}" y="${p.t}" width="${Math.max(8,X(Math.min(xmax,rain+bandHalf))-X(Math.max(xmin,rain-bandHalf)))}" height="${H-p.t-p.b}" rx="10" fill="#fee2e2" opacity=".65"/>`:'';
 const points=rows.map((x,idx)=>{
   const key=[x.date,x.rain,x.depth].join('|');
   const hi=nearestKey.has(key);
   const cx=X(x.rain), cy=Y(x.depth), c=colorForGrade(x.rain_grade);
   const label=hi?`<text x="${cx}" y="${cy-12}" text-anchor="middle" font-size="8.5" font-weight="800" fill="#0f172a">${nearest.findIndex(n=>[n.date,n.rain,n.depth].join('|')===key)+1}</text>`:'';
   return `<g><circle cx="${cx}" cy="${cy}" r="${hi?8:5}" fill="${c}" fill-opacity="${hi?.95:.82}" stroke="${hi?'#ffffff':'rgba(255,255,255,.72)'}" stroke-width="${hi?3:1.4}"/><circle cx="${cx}" cy="${cy}" r="${hi?12:0}" fill="none" stroke="${hi?c:'transparent'}" stroke-width="${hi?1.6:0}" opacity=".35"/>${label}<title>${x.date}: ${fmt1(x.rain)} mm · ${fmt1(x.depth)} cm · ${labelForGrade(x.rain_grade)} · ${x.rain_scope}</title></g>`;
 }).join('');
 let target='';
 if(includeScenario&&Number.isFinite(pred)){
   const cx=X(rain), cy=Y(pred);
   const boxW=168, boxH=44;
   let bx=Math.min(W-p.r-boxW-4,cx+14);
   if(cx>W-200) bx=Math.max(p.l+6,cx-boxW-18);
   let by=Math.max(p.t+4,cy-54);
   if(cy<p.t+48) by=cy+14;
   target=`
    <line x1="${cx}" y1="${p.t}" x2="${cx}" y2="${H-p.b}" stroke="#e5484d" stroke-dasharray="5 5" stroke-width="2"/>
    <line x1="${p.l}" y1="${cy}" x2="${W-p.r}" y2="${cy}" stroke="#f59e0b" stroke-dasharray="4 4" stroke-width="1.6" opacity=".85"/>
    <circle cx="${cx}" cy="${cy}" r="11" fill="rgba(229,72,77,.18)"/>
    <circle cx="${cx}" cy="${cy}" r="7.5" fill="#e5484d" stroke="#fff" stroke-width="3"/>
    <rect x="${bx}" y="${by}" width="${boxW}" height="${boxH}" rx="10" fill="#ffffff" stroke="#fecaca"/>
    <text x="${bx+10}" y="${by+16}" font-size="9" fill="#7f1d1d" font-weight="800">KỊCH BẢN ĐANG PHÂN TÍCH</text>
    <text x="${bx+10}" y="${by+31}" font-size="11" fill="#0f172a" font-weight="800">${fmt1(rain)} mm  →  khoảng ${fmt1(pred)} cm</text>
   `;
 }
 const summaryCards=`
   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;">
     <div style="padding:9px 10px;border:1px solid #e2e8f0;border-radius:12px;background:#fbfdff"><div style="font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:#7b8ea1;font-weight:800">Sự kiện lịch sử</div><div style="font-size:18px;font-weight:900;color:#17324d;margin-top:3px">${rows.length}</div><div style="font-size:9px;color:#64748b">cặp mưa–độ ngập định lượng</div></div>
     <div style="padding:9px 10px;border:1px solid #e2e8f0;border-radius:12px;background:#fbfdff"><div style="font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:#7b8ea1;font-weight:800">Khoảng lượng mưa</div><div style="font-size:18px;font-weight:900;color:#17324d;margin-top:3px">${fmt1(Math.min(...rows.map(x=>x.rain)))}–${fmt1(Math.max(...rows.map(x=>x.rain)))} mm</div><div style="font-size:9px;color:#64748b">từ các sự kiện đã ghi nhận</div></div>
     <div style="padding:9px 10px;border:1px solid #e2e8f0;border-radius:12px;background:#fbfdff"><div style="font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:#7b8ea1;font-weight:800">Độ ngập đại diện</div><div style="font-size:18px;font-weight:900;color:#17324d;margin-top:3px">${fmt1(Math.min(...rows.map(x=>x.depth)))}–${fmt1(Math.max(...rows.map(x=>x.depth)))} cm</div><div style="font-size:9px;color:#64748b">mức ngập quan sát/đại diện sự kiện</div></div>
   </div>`;
 const nearestBadges=nearest.map((x,i)=>`<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border-radius:999px;background:#f8fafc;border:1px solid #e2e8f0;font-size:9px;color:#475569"><span style="width:16px;height:16px;border-radius:50%;display:grid;place-items:center;background:#0f172a;color:#fff;font-size:8px;font-weight:800">${i+1}</span><b>${x.date}</b> · ${fmt1(x.rain)} mm · ${fmt1(x.depth)} cm</span>`).join('');
 el.innerHTML=`
  <div style="display:grid;gap:10px">
    ${summaryCards}
    <div style="border:1px solid #e2e8f0;border-radius:16px;background:linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);padding:10px 10px 6px;box-shadow:0 6px 18px rgba(15,23,42,.05)">
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:320px;display:block">
        <defs>
          <linearGradient id="fcBgGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#f8fbff"/></linearGradient>
        </defs>
        <rect x="${p.l}" y="${p.t}" width="${W-p.l-p.r}" height="${H-p.t-p.b}" rx="14" fill="url(#fcBgGrad)" stroke="#e2e8f0"/>
        ${grid}
        ${scenarioBand}
        ${trend}
        <line x1="${p.l}" y1="${H-p.b}" x2="${W-p.r}" y2="${H-p.b}" stroke="#94a3b8" stroke-width="1.4"/>
        <line x1="${p.l}" y1="${p.t}" x2="${p.l}" y2="${H-p.b}" stroke="#94a3b8" stroke-width="1.4"/>
        ${points}
        ${target}
        <text x="${(p.l+W-p.r)/2}" y="${H-10}" text-anchor="middle" font-size="10" fill="#64748b" font-weight="700">Lượng mưa (mm)</text>
        <text x="15" y="${H/2}" transform="rotate(-90 15 ${H/2})" text-anchor="middle" font-size="10" fill="#64748b" font-weight="700">Độ ngập quan sát / đại diện sự kiện (cm)</text>
      </svg>
    </div>
    <div style="display:grid;gap:8px">
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
        <span style="display:inline-flex;align-items:center;gap:6px;font-size:9px;color:#475569"><span style="width:12px;height:12px;border-radius:50%;background:#19a974"></span>A · mưa trực tiếp tại tuyến</span>
        <span style="display:inline-flex;align-items:center;gap:6px;font-size:9px;color:#475569"><span style="width:12px;height:12px;border-radius:50%;background:#1677ff"></span>B · trạm gần / cùng khu vực</span>
        <span style="display:inline-flex;align-items:center;gap:6px;font-size:9px;color:#475569"><span style="width:12px;height:12px;border-radius:50%;background:#e59b15"></span>C · bối cảnh sự kiện</span>
        <span style="display:inline-flex;align-items:center;gap:6px;font-size:9px;color:#475569"><span style="width:18px;height:2px;background:#8b5cf6;display:inline-block"></span>Xu hướng trực quan</span>
        <span style="display:inline-flex;align-items:center;gap:6px;font-size:9px;color:#475569"><span style="width:12px;height:12px;border-radius:50%;border:2px solid #e5484d;background:#fff"></span>Kịch bản đang nhập</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:7px">${nearestBadges}</div>
      <div style="font-size:8.8px;line-height:1.55;color:#64748b;padding:8px 10px;border:1px dashed #dbe3ec;border-radius:12px;background:#fcfdff"><b style="color:#334155">Cách đọc biểu đồ:</b> mỗi chấm là một sự kiện lịch sử có cặp lượng mưa–độ ngập định lượng. ${includeScenario?'Vùng đỏ nhạt đánh dấu lượng mưa đang xét, vòng tròn đỏ là <b>mức ngập dự báo tham chiếu</b> từ dữ liệu lịch sử.':'Kịch bản hiện tại không được vẽ thành điểm dự báo vì chưa đủ cơ sở định lượng hoặc nằm ngoài phạm vi dữ liệu.'} Các số <b>1–3</b> là các sự kiện lịch sử gần nhất để người dùng đối chiếu. ${trendNote}</div>
    </div>
  </div>`;
}
function candidateStationsFor(street){return EV.filter(e=>(e.candidate_pairs||[]).some(p=>p.street===street))}
function altFor(station,street,rain){const affected=new Set(candidateStationsFor(street).map(x=>x.id));return EV.filter(e=>e.id!==station.id&&!affected.has(e.id)&&e.candidate_pairs?.length&&e.candidate_pairs.every(p=>{const m=window.FG15MultiModel?.predict(p.street,rain,null);if(!m||m.inside!==true||!(m.dataN>=2)||!Number.isFinite(m.ensemble))return false;return (m.ensemble>=40?3:m.ensemble>=20?2:1)+({HIGH:3,MEDIUM:2,LOW:1,NONE:0}[p.priority||'LOW']||0)<3})).map(e=>({...e,dist:hav(station.lat,station.lon,e.lat,e.lon)})).filter(e=>e.dist>.03).sort((a,b)=>a.dist-b.dist||((b.fast_ports||0)-(a.fast_ports||0))||((b.power||0)-(a.power||0))).slice(0,3)}
function impactLevel(hazardScore,p){const s=hazardScore+({HIGH:3,MEDIUM:2,LOW:1,NONE:0}[p]||0);return s>=5?'HIGH':s>=3?'MEDIUM':'LOW'}
function runAnalysis(){
 const street=fcStreet.value,rain=Math.max(0,Number(fcRain.value)||0),cat=catalog(street),rows=FORECAST_EVENTS.filter(x=>x.street===street),validity=scenarioValidity(rain,rows);
 const sig=validity.valid?signal(rain,rows):{label:validity.label,score:0,note:validity.note};
 const an=validity.valid?analogue(rain,rows):null;
 document.getElementById('fcQuality').textContent=cat.tier==='FORECAST_READY'?'MẪU LỊCH SỬ ĐỦ DỮ LIỆU PHÂN TÍCH':cat.tier==='LIMITED_NUMERIC'?'MẪU ĐỊNH LƯỢNG HẠN CHẾ':'CHỈ CÓ BẰNG CHỨNG TỪNG NGẬP';
 document.getElementById('fcQuality').style.color=cat.tier==='FORECAST_READY'?'#176a43':cat.tier==='LIMITED_NUMERIC'?'#9a5c00':'#64748b';
 document.getElementById('fcQualityNote').innerHTML=`${cat.quant_events} sự kiện định lượng Tuyến × Ngày; ${cat.occurrence_rows} dòng bằng chứng có nguồn. ${cat.recurrence_2026?'<b>Đồng thời có trong danh mục tuyến/đoạn đường ngập do mưa chính thức năm 2026.</b>':''}`;
 document.getElementById('fcSignal').textContent=sig.label;
 document.getElementById('fcSignal').className='fc-big '+(validity.valid?(sig.score>=3?'impact-high':sig.score==2?'impact-med':'impact-low'):'impact-none');
 document.getElementById('fcSignalNote').textContent=sig.note;
 if(an){
   document.getElementById('fcDepth').textContent=`${fmt1(an.depth)} cm`;
   document.getElementById('fcDepthNote').textContent=`Ước lượng tương đồng có xét nguồn từ tối đa 3 sự kiện thực gần nhất; khoảng giá trị nguồn lân cận ${fmt1(an.min)}–${fmt1(an.max)} cm. Đây là dự báo tham chiếu từ lịch sử, không phải độ ngập tương lai đã quan sát.`;
 }else{
   document.getElementById('fcDepth').textContent='Không thể dự báo';
   document.getElementById('fcDepthNote').textContent=validity.note;
 }
 const affected=candidateStationsFor(street);
 if(validity.valid){
   const high=affected.filter(s=>{const pair=(s.candidate_pairs||[]).find(p=>p.street===street);return impactLevel(sig.score,pair?pair.priority:s.screening_priority)==='HIGH'});
   document.getElementById('fcHighRiskEV').textContent=high.length;
   document.getElementById('fcHighRiskEV').className='fc-big '+(high.length?'impact-high':'impact-low');
   document.getElementById('fcHighRiskEVNote').textContent=high.length?`${high.length} trạm có mức rủi ro CAO trong kịch bản ${fmt1(rain)} mm theo mô hình sàng lọc.`:'Không có trạm nào đạt mức rủi ro CAO trong kịch bản hiện tại.';
 }else{
   document.getElementById('fcHighRiskEV').textContent='—';
   document.getElementById('fcHighRiskEV').className='fc-big impact-none';
   document.getElementById('fcHighRiskEVNote').textContent='Chưa xác định rủi ro trạm theo kịch bản vì dự báo ngập không hợp lệ/không đủ dữ liệu.';
 }
 document.getElementById('fcN').textContent=rows.length;
 document.getElementById('fcRainRange').textContent=rows.length?`${fmt1(Math.min(...rows.map(x=>x.rain)))}–${fmt1(Math.max(...rows.map(x=>x.rain)))} mm`:'—';
 document.getElementById('fcDepthRange').textContent=rows.length?`${fmt1(Math.min(...rows.map(x=>x.depth_min)))}–${fmt1(Math.max(...rows.map(x=>x.depth_max)))} cm`:'—';
 document.getElementById('fcDirect').textContent=`${cat.direct_events+cat.nearby_events} / ${cat.quant_events}`;
 const hist=an?an.nearest:[...rows].sort((a,b)=>Math.abs(a.rain-rain)-Math.abs(b.rain-rain)).slice(0,3);
 document.getElementById('fcHistory').innerHTML=hist.length?hist.map(x=>`<tr><td>${esc(x.date)}</td><td><b>${fmt1(x.rain)} mm</b></td><td>${gradeBadge(x.rain_grade)}<div class="source-basis">${esc(x.rain_scope)}${x.rain_station?' · '+esc(x.rain_station):''}</div></td><td><b>${fmt1(x.depth)} cm</b><div class="source-basis">khoảng nguồn ${fmt1(x.depth_min)}–${fmt1(x.depth_max)} cm · ${x.depth_observations} dòng</div></td><td>${esc(x.cause||'—')}</td><td><a class="fc-link" target="_blank" rel="noopener" href="${x.source_url}">Nguồn ↗</a></td></tr>`).join(''):`<tr><td colspan="6">Không có sự kiện mưa–độ ngập định lượng. ${cat.sources.slice(0,2).map((u,i)=>`<a class="fc-link" target="_blank" rel="noopener" href="${u}">Nguồn bằng chứng sự kiện ${i+1} ↗</a>`).join(' · ')}</td></tr>`;
 drawChart(rows,rain,an?an.depth:NaN,validity.valid);
 renderEVImpact(street,sig,an,validity);
}
function renderEVImpact(street,sig,an,validity={valid:true}){
 impactLayer.clearLayers();lastImpactCoords=[];
 const affected=candidateStationsFor(street);
 document.getElementById('evAffectedN').textContent=affected.length;
 if(!validity.valid){
   document.getElementById('evAffectedNote').textContent=affected.length?`Có ${affected.length} trạm liên kết ứng viên với ${street}, nhưng chưa thể xếp rủi ro theo lượng mưa hiện tại vì ${validity.code==='ONE_EVENT'?'tuyến chỉ có 1 sự kiện định lượng':'kịch bản nằm ngoài phạm vi dữ liệu lịch sử'}.`:'Không có trạm nào trong bộ 552 bản ghi có ghép trực tiếp với tuyến này.';
   document.getElementById('evAffectedTable').innerHTML=affected.length?affected.map(s=>`<tr><td><span class="ev-station">${esc(s.name)}</span><div class="source-basis">${esc(s.id)} · ${esc(s.address)}</div></td><td>${viPriority(s.screening_priority)}</td><td><b class="impact-none">CHƯA XÁC ĐỊNH</b></td><td><span class="fc-status st-c">Thiếu cơ sở dự báo</span></td><td><a class="fc-link" target="_blank" rel="noopener" href="${s.gmap}">Bản đồ trạm ↗</a></td></tr>`).join(''):'<tr><td colspan="5">Không tìm thấy ghép trực tiếp giữa trạm sạc và tuyến đã chọn.</td></tr>';
   document.getElementById('evMaxImpact').textContent='CHƯA XÁC ĐỊNH';
   document.getElementById('evMaxImpact').className='fc-big impact-none';
   document.getElementById('evAccessStatus').textContent='Không xếp hạng rủi ro trạm khi dự báo ngập chưa đủ cơ sở.';
   document.getElementById('evAlternatives').innerHTML='<div class="fc-note">Chưa đề xuất trạm thay thế vì chưa xác định được trạm rủi ro cao một cách hợp lệ.</div>';
   return;
 }
 document.getElementById('evAffectedNote').textContent=affected.length?`Có ${affected.length} trạm được liên kết ứng viên với ${street} trong bộ dữ liệu. Mức rủi ro dưới đây thay đổi theo lượng mưa đầu vào và tín hiệu ngập lịch sử của tuyến.`:'Không có trạm nào trong bộ 552 bản ghi có ghép trực tiếp với tuyến này.';
 let maxRank=0;const rows=[];const altBlocks=[];const altUsed=new Set();const highRisk=[];
 affected.forEach(s=>{const pair=(s.candidate_pairs||[]).find(p=>p.street===street);const impact=impactLevel(sig.score,pair?pair.priority:s.screening_priority),rank={LOW:1,MEDIUM:2,HIGH:3}[impact];maxRank=Math.max(maxRank,rank);if(impact==='HIGH')highRisk.push(s);rows.push(`<tr><td><span class="ev-station">${esc(s.name)}</span><div class="source-basis">${esc(s.id)} · ${esc(s.address)}</div></td><td>${viPriority(pair?pair.priority:s.screening_priority)}</td><td><b class="${impact==='HIGH'?'impact-high':impact==='MEDIUM'?'impact-med':'impact-low'}">${viPriority(impact)}</b></td><td>${impact==='HIGH'?'<span class="fc-status st-red">Ưu tiên đổi sang trạm thay thế</span><div class="source-basis">rủi ro theo kịch bản lịch sử, chưa phải trạng thái thời gian thực</div>':impact==='MEDIUM'?'<span class="fc-status st-c">Cần theo dõi</span>':'<span class="fc-status st-a">Rủi ro thấp hơn trong kịch bản</span>'}</td><td>${pair&&pair.flood_url?`<a class="fc-link" target="_blank" rel="noopener" href="${pair.flood_url}">Bằng chứng ngập ↗</a>`:''}<br><a class="fc-link" target="_blank" rel="noopener" href="${s.gmap}">Bản đồ trạm ↗</a></td></tr>`);const markerClass=impact==='HIGH'?'impact-aff':'impact-alt';L.marker([s.lat,s.lon],{icon:L.divIcon({className:'',html:`<div class="${markerClass}"></div>`,iconSize:[26,26],iconAnchor:[13,13]})}).bindPopup(`<div class="p-title">${impact==='HIGH'?'⚠':'⚡'} ${esc(s.name)}</div><div class="p-sub">Rủi ro theo kịch bản tại <b>${esc(street)}</b>: <b>${viPriority(impact)}</b>.<br>Đây là sàng lọc từ dữ liệu lịch sử, không phải trạng thái ngập/vận hành thời gian thực.</div>`).addTo(impactLayer);lastImpactCoords.push([s.lat,s.lon])});
 highRisk.forEach(s=>{const alts=altFor(s,street,Number(fcRain.value));if(alts.length){altBlocks.push(`<div class="alt-item"><b>Thay cho ${esc(s.name)}</b>${alts.map(a=>`<div class="p-sub" style="margin:4px 0">↳ <b>${esc(a.name)}</b> · ${fmt1(a.dist)} km đường thẳng · ${a.power??'—'} kW · ${a.ports??'—'} cổng · <a class="fc-link" target="_blank" rel="noopener" href="${a.gmap}">Bản đồ ↗</a></div>`).join('')}</div>`);alts.forEach(a=>{if(altUsed.has(a.id))return;altUsed.add(a.id);L.marker([a.lat,a.lon],{icon:L.divIcon({className:'',html:'<div class="impact-alt"></div>',iconSize:[24,24],iconAnchor:[12,12]})}).bindPopup(`<div class="p-title">✓ Trạm thay thế: ${esc(a.name)}</div><div class="p-sub">${fmt1(hav(s.lat,s.lon,a.lat,a.lon))} km đường thẳng từ trạm rủi ro. Trạng thái hoạt động thời gian thực cần được kiểm tra trước khi sử dụng.</div>`).addTo(impactLayer);lastImpactCoords.push([a.lat,a.lon])})}});
 document.getElementById('evAffectedTable').innerHTML=rows.length?rows.join(''):'<tr><td colspan="5">Không tìm thấy ghép trực tiếp giữa trạm sạc và tuyến đã chọn.</td></tr>';
 const ml=maxRank===3?'CAO':maxRank===2?'TRUNG BÌNH':maxRank===1?'THẤP':'CHƯA XÁC ĐỊNH';
 document.getElementById('evMaxImpact').textContent=ml;document.getElementById('evMaxImpact').className='fc-big '+(maxRank===3?'impact-high':maxRank===2?'impact-med':maxRank===1?'impact-low':'impact-none');
 document.getElementById('evAccessStatus').textContent=highRisk.length?`${highRisk.length} trạm đạt mức rủi ro CAO trong kịch bản hiện tại. Xem phương án thay thế bên dưới.`:affected.length?'Có trạm liên kết với tuyến nhưng chưa trạm nào đạt mức rủi ro CAO trong kịch bản hiện tại.':'Không có ghép trực tiếp trạm–tuyến trong dữ liệu hiện tại.';
 document.getElementById('evAlternatives').innerHTML=altBlocks.length?altBlocks.join(''):'<div class="fc-note">Chưa có trạm thay thế đủ bằng chứng để khuyến nghị trong kịch bản hiện tại.</div>';
}
document.getElementById('focusImpactBtn').onclick=()=>{if(lastImpactCoords.length)map.fitBounds(L.latLngBounds(lastImpactCoords),{padding:[70,70],maxZoom:14})};document.getElementById('clearImpactBtn').onclick=()=>{impactLayer.clearLayers();lastImpactCoords=[]};
runAnalysis();

const input=document.getElementById('search'),results=document.getElementById('results');input.oninput=()=>{const q=input.value.trim().toLowerCase();results.innerHTML='';if(!q)return;SEARCH.filter(x=>x.name.toLowerCase().includes(q)||x.type.toLowerCase().includes(q)).slice(0,15).forEach(x=>{const div=document.createElement('div');div.className='result';div.innerHTML=`<b>${esc(x.name)}</b><span>${esc(x.type)}</span>`;div.onclick=()=>{map.setView([x.lat,x.lon],16);L.popup().setLatLng([x.lat,x.lon]).setContent(x.popup).openOn(map)};results.appendChild(div)})};
