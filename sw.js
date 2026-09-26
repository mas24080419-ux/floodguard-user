const CACHE='floodguard-user-v39-watchlist-email';
const CORE=['./','./index.html','./app-core.html','./watchlist-email.js','./admin.html','./accounts.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
function navKey(u){if(u.pathname.endsWith('/app-core.html'))return './app-core.html';if(u.pathname.endsWith('/admin.html'))return './admin.html';if(u.pathname.endsWith('/accounts.html'))return './accounts.html';return './index.html'}
async function injectWatchlist(r){
  if(!r)return r;
  const html=await r.text();
  const tag='<script src="./watchlist-email.js?v=39"></script>';
  const body=html.includes('watchlist-email.js')?html:(html.includes('</body>')?html.replace('</body>',tag+'</body>'):html+tag);
  const h=new Headers(r.headers);h.set('Content-Type','text/html; charset=utf-8');h.set('Cache-Control','no-store');h.delete('Content-Length');
  return new Response(body,{status:r.status,statusText:r.statusText,headers:h});
}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(e.request.mode==='navigate'){
    const key=navKey(u);
    if(key==='./app-core.html'){
      e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const x=r.clone();caches.open(CACHE).then(c=>c.put(key,x));return injectWatchlist(r)}).catch(()=>caches.match(key).then(injectWatchlist)));
      return;
    }
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const x=r.clone();caches.open(CACHE).then(c=>c.put(key,x));return r}).catch(()=>caches.match(key)));
    return;
  }
  if(u.origin===location.origin){
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x))}return r})));
  }
});
