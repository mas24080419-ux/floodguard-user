const AUDIT={ev_records:552,unique_ev_coordinates:543,candidate_pairs:85,candidate_stations:77,priority_station_counts:{"NONE":475,"LOW":22,"MEDIUM":34,"HIGH":21}};
const map=L.map('map',{zoomControl:false,minZoom:8,preferCanvas:true}).setView([10.78,106.72],11); L.control.zoom({position:'bottomright'}).addTo(map);
const baseStreet=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'});
const baseSat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri'});
const baseSatLabels=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'&copy; Esri'});
baseStreet.addTo(map);
function clusterGroup(){return L.markerClusterGroup({chunkedLoading:true,maxClusterRadius:42,iconCreateFunction:c=>L.divIcon({html:`<div class="cluster">${c.getChildCount()}</div>`,className:'',iconSize:[44,44]})})}
const evBase=clusterGroup(), evLow=clusterGroup(), evMed=clusterGroup(), evHigh=clusterGroup();
const rainAutoLayer=L.layerGroup(), rainRegLayer=L.layerGroup(), rainMasterLayer=L.layerGroup(), coreLayer=L.layerGroup(), streetLayer=L.layerGroup();
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function badge(t,cls=''){return `<span class="badge ${cls}">${esc(t)}</span>`}
function viPriority(v){return v==='HIGH'?'CAO':v==='MEDIUM'?'TRUNG BÌNH':v==='LOW'?'THẤP':v==='NONE'?'KHÔNG CÓ':v}
function btn(url,label='Nguồn'){return url?`<a class="gbtn" target="_blank" rel="noopener" href="${url}">${esc(label)} ↗</a>`:''}
function evIcon(p){let cls='';if(p==='LOW')cls='cand-low';else if(p==='MEDIUM')cls='cand-med';else if(p==='HIGH')cls='cand-high';return L.divIcon({className:'',html:`<div class="ev-icon ${cls}"></div>`,iconSize:[22,22],iconAnchor:[11,11]})}
const streetIcon=L.divIcon({className:'',html:'<div class="street-icon"></div>',iconSize:[14,14],iconAnchor:[7,7]}); const coreIcon=L.divIcon({className:'',html:'<div class="core-icon"></div>',iconSize:[24,24],iconAnchor:[12,12]}); const rainIcon=L.divIcon({className:'',html:'<div class="rain-icon"></div>',iconSize:[20,20],iconAnchor:[10,17]}); const rain2Icon=L.divIcon({className:'',html:'<div class="rain2-icon"></div>',iconSize:[20,20],iconAnchor:[10,3]});
const SEARCH=[];
