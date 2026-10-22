(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.FGRBFBasemap=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const PROVIDERS=[
{id:'osm',name:'Đường phố · OpenStreetMap',url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'},
{id:'esri',name:'Đường phố · Esri',url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',attribution:'Tiles © Esri — Sources: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), TomTom, OpenStreetMap contributors, GIS User Community'},
{id:'satellite',name:'Ảnh vệ tinh · Esri',url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',attribution:'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, GIS User Community'}
];
function attach(map,data,ui,options={}){
 const L=options.L||root.L,schedule=options.setTimeout||root.setTimeout,cancel=options.clearTimeout||root.clearTimeout;let layer,local,timer,version=0,attempted=new Set(),destroyed=false,active=null;
 function message(text,state){ui.status.textContent=text;ui.status.dataset.state=state;}
 function stopTimer(){if(timer!==undefined){cancel(timer);timer=undefined;}}
 function localRoads(){if(local)return;local=L.layerGroup();for(const r of data.roads){if(r.coordinates.length<2)continue;const line=L.polyline(r.coordinates.map(p=>[p[1],p[0]]),{color:'#8e9dab',weight:1.5,opacity:.7});if(typeof document!=='undefined'){const label=document.createElement('span');label.textContent=r.name+' · hình học OpenStreetMap';line.bindTooltip?.(label);}line.addTo(local);}local.addTo(map);map.attributionControl?.addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · mạng đường cục bộ');}
 function exhausted(){++version;stopTimer();if(layer){map.removeLayer(layer);layer=null;}active='local';ui.select.value='local';localRoads();message('Không tải được các bản đồ nền trực tuyến. Đang hiển thị mạng đường cục bộ từ dữ liệu OpenStreetMap; lớp ô và tra cứu vẫn hoạt động. Bấm “Xem toàn phạm vi” để về vùng nghiên cứu.','local');}
 function failed(token){if(destroyed||token!==version)return;const next=PROVIDERS.find(p=>!attempted.has(p.id));if(next)switchTo(next.id,false,true);else exhausted();}
 function switchTo(id,reset=false,automatic=false){if(destroyed)return;if(reset)attempted=new Set();stopTimer();++version;const token=version;if(layer){map.removeLayer(layer);layer=null;}if(id==='local'){exhausted();return;}const p=PROVIDERS.find(p=>p.id===id);if(!p)return;if(local){map.removeLayer(local);local=null;map.attributionControl?.removeAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · mạng đường cục bộ');}active=p.id;attempted.add(p.id);ui.select.value=p.id;message((automatic?'Nguồn trước tải lỗi. Đang chuyển sang ':'Đang tải ')+p.name+'…','loading');let loaded=0,errors=0;layer=L.tileLayer(p.url,{maxZoom:19,attribution:p.attribution,updateWhenIdle:true,keepBuffer:2});
 layer.on('loading',()=>{if(token!==version)return;loaded=0;errors=0;stopTimer();timer=schedule(()=>{if(!loaded)failed(token);},7000);});
 layer.on('tileload',()=>{if(token!==version)return;loaded++;errors=0;stopTimer();message(p.name+' · các ô tô màu là kết quả mô hình; bản đồ nền không thay đổi dự đoán.','ready');});
 layer.on('tileerror',()=>{if(token!==version)return;if(++errors>=3)failed(token);});
 layer.on('load',()=>{if(token!==version)return;if(!loaded)failed(token);else if(errors){message(p.name+' tải thiếu một số ô nền. Có thể đổi nguồn hoặc bấm “Tải lại nền”.','partial');}});
 layer.addTo(map);if(token===version&&!loaded&&timer===undefined)timer=schedule(()=>{if(!loaded)failed(token);},7000);
 }
 function change(){switchTo(ui.select.value,true);}
 function retry(){switchTo(active==='local'?'osm':active||'osm',true);}
 ui.select.addEventListener('change',change);ui.retry.addEventListener('click',retry);switchTo('osm',true);
 return{retry,select:id=>switchTo(id,true),destroy(){destroyed=true;++version;stopTimer();if(layer)map.removeLayer(layer);if(local)map.removeLayer(local);ui.select.removeEventListener('change',change);ui.retry.removeEventListener('click',retry);}};
}
return{PROVIDERS,attach};
});
