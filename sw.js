const CACHE='floodguard-user-v49-editorial-story';
const CORE=['./','./index.html','./app-core.html','./watchlist-email-v40.js','./site-pages.css','./site-luxe.css','./site-atelier-v47.css','./site-cinematic-v48.css','./site-editorial-v49.css','./site-navigation-v2.js','./problem.html','./features.html','./how-it-works.html','./alerts.html','./ev.html','./rescue.html','./about.html','./admin.html','./accounts.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
function navKey(u){
  const p=u.pathname;
  if(p.endsWith('/app-core.html'))return './app-core.html';
  if(p.endsWith('/admin.html'))return './admin.html';
  if(p.endsWith('/accounts.html'))return './accounts.html';
  if(p.endsWith('/problem.html'))return './problem.html';
  if(p.endsWith('/features.html'))return './features.html';
  if(p.endsWith('/how-it-works.html'))return './how-it-works.html';
  if(p.endsWith('/alerts.html'))return './alerts.html';
  if(p.endsWith('/ev.html'))return './ev.html';
  if(p.endsWith('/rescue.html'))return './rescue.html';
  if(p.endsWith('/about.html'))return './about.html';
  return './index.html';
}
function htmlResponse(r,body){
  const h=new Headers(r.headers);h.set('Content-Type','text/html; charset=utf-8');h.set('Cache-Control','no-store');h.delete('Content-Length');
  return new Response(body,{status:r.status,statusText:r.statusText,headers:h});
}
async function injectWatchlist(r){
  if(!r)return r;
  const html=await r.text();
  const tag='<script src="./watchlist-email-v40.js?v=40"></script>';
  const body=html.includes('watchlist-email-v40.js')?html:(html.includes('</body>')?html.replace('</body>',tag+'</body>'):html+tag);
  return htmlResponse(r,body);
}
async function injectHomepageTheme(r){
  if(!r)return r;
  const html=await r.text();
  const atelier='<link rel="stylesheet" href="./site-atelier-v47.css?v=47">';
  const cinematic='<link rel="stylesheet" href="./site-cinematic-v48.css?v=48">';
  const editorial='<link rel="stylesheet" href="./site-editorial-v49.css?v=49">';
  let body=html;
  if(!body.includes('site-atelier-v47.css'))body=body.includes('</head>')?body.replace('</head>',atelier+'</head>'):atelier+body;
  if(!body.includes('site-cinematic-v48.css'))body=body.includes('</head>')?body.replace('</head>',cinematic+'</head>'):cinematic+body;
  if(!body.includes('site-editorial-v49.css'))body=body.includes('</head>')?body.replace('</head>',editorial+'</head>'):editorial+body;
  return htmlResponse(r,body);
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
    if(key==='./index.html'){
      e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const x=r.clone();caches.open(CACHE).then(c=>c.put(key,x))}return injectHomepageTheme(r)}).catch(()=>caches.match(key).then(injectHomepageTheme)));
      return;
    }
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const x=r.clone();caches.open(CACHE).then(c=>c.put(key,x))}return r}).catch(()=>caches.match(key).then(r=>r||caches.match('./index.html'))));
    return;
  }
  if(u.origin===location.origin){
    const freshAsset=u.pathname.endsWith('/site-navigation-v2.js')||u.pathname.endsWith('/site-pages.css')||u.pathname.endsWith('/site-luxe.css')||u.pathname.endsWith('/site-atelier-v47.css')||u.pathname.endsWith('/site-cinematic-v48.css')||u.pathname.endsWith('/site-editorial-v49.css');
    if(freshAsset){
      e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x))}return r}).catch(()=>caches.match(e.request)));
      return;
    }
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x))}return r})));
  }
});
