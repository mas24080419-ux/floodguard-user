/* FloodGuard Watchlist -> flood-risk monitor -> automatic email alerts. */
(()=>{
'use strict';
if(window.__FG39_WATCHLIST_EMAIL__) return;
window.__FG39_WATCHLIST_EMAIL__=true;

const API='https://floodguard-rescue-backend.onrender.com';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sb=null;
let latestRoute=window.FG70_ROUTE_STATE||null;
let state=null;
let busy=false;

function css(){
 if($('fg39WatchStyle')) return;
 const s=document.createElement('style');
 s.id='fg39WatchStyle';
 s.textContent=`
 .fg39-watch-flow{margin:10px 0;border:1px solid #dbe8f5;border-radius:14px;background:linear-gradient(180deg,#f8fbff,#fff);padding:11px;box-shadow:0 7px 20px rgba(30,64,175,.06)}
 .fg39-watch-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.fg39-watch-head b{font-size:11px;color:#183b68}.fg39-watch-head span{display:block;margin-top:3px;font-size:9px;line-height:1.45;color:#6b7f96}
 .fg39-watch-route{margin-top:9px;padding:8px 9px;border:1px solid #e4edf7;border-radius:10px;background:#fff;font-size:9.5px;line-height:1.45;color:#536b85}.fg39-watch-route strong{color:#173e6f}
 .fg39-watch-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.fg39-watch-btn{border:1px solid #cbdcf0;border-radius:10px;background:#fff;color:#365f91;padding:8px 10px;font-size:9px;font-weight:800;cursor:pointer}.fg39-watch-btn.primary{background:#246fd2;color:#fff;border-color:#246fd2}.fg39-watch-btn:disabled{opacity:.55;cursor:not-allowed}
 .fg39-watch-state{min-height:15px;margin-top:7px;font-size:9px;line-height:1.45;color:#6b7f96}.fg39-watch-state.ok{color:#0a7b55}.fg39-watch-state.err{color:#b42318}
 .fg39-watch-list{display:grid;gap:6px;margin-top:8px}.fg39-watch-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 8px;border:1px solid #e4edf7;border-radius:10px;background:#fff}.fg39-watch-item b{display:block;font-size:9.5px;color:#253e5e;line-height:1.35}.fg39-watch-item small{display:block;margin-top:2px;color:#788ba1;font-size:8px}.fg39-watch-remove{border:0;background:#fff0f0;color:#a62828;border-radius:8px;padding:6px 7px;font-size:8px;font-weight:800;cursor:pointer;white-space:nowrap}
 `;
 document.head.appendChild(s);
}

async function ensureClient(){
 if(sb) return sb;
 if(!window.supabase?.createClient) throw new Error('Supabase chưa sẵn sàng.');
 const r=await fetch(API+'/api/public-config',{cache:'no-store'});
 const d=await r.json().catch(()=>({}));
 if(!r.ok||!d.supabase?.url||!d.supabase?.anon_key) throw new Error('Không lấy được cấu hình tài khoản.');
 sb=window.supabase.createClient(d.supabase.url,d.supabase.anon_key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 return sb;
}

async function api(path,opt={}){
 const c=await ensureClient();
 const {data}=await c.auth.getSession();
 const token=data?.session?.access_token;
 if(!token) throw new Error('Hãy đăng nhập FloodGuard trước.');
 const headers=Object.assign({'Content-Type':'application/json',Authorization:'Bearer '+token},opt.headers||{});
 const r=await fetch(API+path,{...opt,headers,cache:'no-store'});
 const d=await r.json().catch(()=>({}));
 if(!r.ok) throw new Error(d.message||d.detail||d.error||('HTTP '+r.status));
 return d;
}

function profileForStreets(streets){
 const ss=[...new Set((streets||[]).filter(Boolean))].slice(0,10);
 const rains=[20,40,60,80,100,120,150,200], out=[];
 for(const rain of rains){
  let max=null;
  for(const st of ss){
   try{
    const mm=window.FG15MultiModel?.predict(st,rain,null);
    if(mm&&Number.isFinite(mm.ensemble)) max=max===null?Number(mm.ensemble):Math.max(max,Number(mm.ensemble));
   }catch(_){ }
  }
  if(max!==null) out.push({rain,depth:max});
 }
 return out;
}

function routeTarget(s){
 if(!s?.analyses?.length) return null;
 const a=s.analyses.find(x=>x.index===s.selectedIndex)||s.analyses[0];
 const streets=(a.unique||[]).map(x=>x.street).filter(Boolean).filter(x=>!String(x).includes(';')).slice(0,10);
 const cs=a.route?.geometry?.coordinates||[];
 const mid=cs.length?cs[Math.floor(cs.length/2)]:null;
 const points=[];
 if(s.start) points.push({lat:Number(s.start.lat),lon:Number(s.start.lon)});
 if(mid) points.push({lat:Number(mid[1]),lon:Number(mid[0])});
 if(s.end) points.push({lat:Number(s.end.lat),lon:Number(s.end.lon)});
 const label=`${s.from||'Điểm đi'} → ${s.to||'Điểm đến'}`;
 const key='route:'+label.toLowerCase().replace(/\s+/g,' ').slice(0,150);
 return {
  kind:'route', key, label,
  lat:mid?Number(mid[1]):Number(s.start?.lat),
  lon:mid?Number(mid[0]):Number(s.start?.lon),
  points, streets,
  profile:profileForStreets(streets),
  meta:{from:s.from||'',to:s.to||'',travel_mode:s.travelMode||'',exposure_km:Number(a.exposureKm)||0}
 };
}

function watchAsTarget(w){
 return {
  kind:w.kind||'route',key:w.key,label:w.label,address:w.address||'',
  lat:Number(w.lat),lon:Number(w.lon),points:Array.isArray(w.points)?w.points:[],
  streets:Array.isArray(w.streets)?w.streets:[],profile:Array.isArray(w.profile)?w.profile:[],meta:w.meta||{}
 };
}

function currentRouteText(){
 const t=routeTarget(latestRoute||window.FG70_ROUTE_STATE);
 if(!t) return 'Chưa có lộ trình đang chọn. Hãy tìm đường trước rồi thêm vào Watchlist.';
 const roads=t.streets.length?` · ${t.streets.length} tuyến đường được giám sát`:'';
 return `<strong>${esc(t.label)}</strong>${roads}`;
}

function setMsg(msg,cls=''){
 const e=$('fg39WatchState');
 if(!e) return;
 e.textContent=msg||'';
 e.className='fg39-watch-state'+(cls?' '+cls:'');
}

function render(){
 const route=$('fg39WatchRoute');
 const add=$('fg39WatchAdd');
 if(route) route.innerHTML=currentRouteText();
 const target=routeTarget(latestRoute||window.FG70_ROUTE_STATE);
 if(add) add.disabled=busy||!target;
 const box=$('fg39WatchList');
 if(!box) return;
 const ws=(state?.watches||[]).filter(w=>w.enabled!==false);
 box.innerHTML=ws.length?ws.map((w,i)=>`<div class="fg39-watch-item"><div><b>🛣 ${esc(w.label||w.key||'Tuyến theo dõi')}</b><small>Email tự động khi nguy cơ ngập đạt ngưỡng cảnh báo</small></div><button class="fg39-watch-remove" data-fg39-remove="${i}">Bỏ theo dõi</button></div>`).join(''):'<div class="fg39-watch-state">Chưa có tuyến nào trong Watchlist.</div>';
 box.querySelectorAll('[data-fg39-remove]').forEach(btn=>btn.onclick=()=>removeWatch(ws[Number(btn.dataset.fg39Remove)]));
}

async function refresh(){
 try{state=await api('/api/account/state');render();return state}catch(e){setMsg(e.message,'err');}
}

async function addCurrent(){
 if(busy) return;
 const target=routeTarget(latestRoute||window.FG70_ROUTE_STATE);
 if(!target){setMsg('Hãy tìm và chọn một lộ trình trước.','err');return;}
 busy=true;render();setMsg('Đang thêm vào Watchlist và bật email cảnh báo…');
 try{
  await api('/api/account/preferences',{method:'POST',body:JSON.stringify({personalization_enabled:true,email_alerts:true})});
  await api('/api/account/watch',{method:'POST',body:JSON.stringify({target,enabled:true})});
  await refresh();
  setMsg('Đã thêm Watchlist. FloodGuard sẽ tự theo dõi và gửi email khi phát hiện nguy cơ ngập.','ok');
 }catch(e){setMsg('Không thêm được Watchlist: '+e.message,'err');}
 finally{busy=false;render();}
}

async function removeWatch(w){
 if(!w||busy) return;
 busy=true;render();setMsg('Đang bỏ theo dõi…');
 try{
  await api('/api/account/watch',{method:'POST',body:JSON.stringify({target:watchAsTarget(w),enabled:false})});
  await refresh();setMsg('Đã bỏ tuyến khỏi Watchlist.','ok');
 }catch(e){setMsg('Không bỏ theo dõi được: '+e.message,'err');}
 finally{busy=false;render();}
}

function mount(){
 css();
 if($('fg39WatchFlow')){render();return true;}
 const host=document.querySelector('#fg13AlertPanel .fg13-alert-body')||document.querySelector('#fg13AlertPanel');
 if(!host) return false;
 const wrap=document.createElement('section');
 wrap.id='fg39WatchFlow';
 wrap.className='fg39-watch-flow';
 wrap.innerHTML=`<div class="fg39-watch-head"><div><b>⭐ Watchlist tuyến đường</b><span>Thêm một lần → FloodGuard tự theo dõi → có nguy cơ ngập → tự gửi email về tài khoản đăng nhập.</span></div></div><div class="fg39-watch-route" id="fg39WatchRoute"></div><div class="fg39-watch-actions"><button class="fg39-watch-btn primary" id="fg39WatchAdd">＋ Thêm lộ trình hiện tại vào Watchlist</button><button class="fg39-watch-btn" id="fg39WatchRefresh">↻ Làm mới</button></div><div class="fg39-watch-state" id="fg39WatchState"></div><div class="fg39-watch-list" id="fg39WatchList"></div>`;
 const email=document.getElementById('fg18EmailBox');
 if(email?.parentNode===host) host.insertBefore(wrap,email);
 else host.prepend(wrap);
 $('fg39WatchAdd').onclick=addCurrent;
 $('fg39WatchRefresh').onclick=refresh;
 render();
 refresh();
 return true;
}

document.addEventListener('fg70:route',e=>{latestRoute=e.detail||null;mount();render();});
const mo=new MutationObserver(()=>mount());
mo.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
setTimeout(mount,1200);
setTimeout(()=>{latestRoute=window.FG70_ROUTE_STATE||latestRoute;mount();render();},3000);
})();
