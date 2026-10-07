const CACHE='floodguard-user-v74-reliability';
const CORE=['./floodguard-design-system.css','./mobile-design-v67.css','./home-design-v66.css','./admin-design.css','./rescue-workspace.css','./rescue-workspace.js','./','./index.html','./app-core.html','./watchlist-email-v40.js','./site-pages.css','./site-luxe.css','./site-atelier-v47.css','./site-cinematic-v48.css','./site-editorial-v49.css','./site-hide-ev-v50.css','./site-navigation-v2.js','./problem.html','./features.html','./how-it-works.html','./alerts.html','./ev.html','./rescue.html','./about.html','./admin.html','./admin-report-photos.html','./accounts.html','./rescue-team.html','./rescue-teams.html','./sos-admin.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('floodguard-user-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
function navKey(u){
  const p=u.pathname;
  if(p.endsWith('/app-core.html'))return './app-core.html';
  if(p.endsWith('/admin-report-photos.html'))return './admin-report-photos.html';
  if(p.endsWith('/admin.html'))return './admin.html';
  if(p.endsWith('/accounts.html'))return './accounts.html';
  if(p.endsWith('/rescue-team.html'))return './rescue-team.html';
  if(p.endsWith('/rescue-teams.html'))return './rescue-teams.html';
  if(p.endsWith('/sos-admin.html'))return './sos-admin.html';
  if(p.endsWith('/problem.html'))return './problem.html';
  if(p.endsWith('/features.html'))return './features.html';
  if(p.endsWith('/how-it-works.html'))return './how-it-works.html';
  if(p.endsWith('/alerts.html'))return './alerts.html';
  if(p.endsWith('/ev.html'))return './ev.html';
  if(p.endsWith('/rescue.html'))return './rescue.html';
  if(p.endsWith('/about.html'))return './about.html';
  for(const page of ['contact','faq','community','voucher','model-evaluation','data','design-system'])if(p.endsWith('/'+page+'.html'))return './'+page+'.html';
  if(p==='/'||p.endsWith('/index.html'))return './index.html';
  return '.'+p;
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
  const hideEv='<link rel="stylesheet" href="./site-hide-ev-v50.css?v=50">';
  let body=html;
  if(!body.includes('site-atelier-v47.css'))body=body.includes('</head>')?body.replace('</head>',atelier+'</head>'):atelier+body;
  if(!body.includes('site-cinematic-v48.css'))body=body.includes('</head>')?body.replace('</head>',cinematic+'</head>'):cinematic+body;
  if(!body.includes('site-editorial-v49.css'))body=body.includes('</head>')?body.replace('</head>',editorial+'</head>'):editorial+body;
  if(!body.includes('site-hide-ev-v50.css'))body=body.includes('</head>')?body.replace('</head>',hideEv+'</head>'):hideEv+body;
  return htmlResponse(r,body);
}
function remember(e,key,r){
  if(!r.ok)return;
  const copy=r.clone();
  e.waitUntil(caches.open(CACHE).then(c=>c.put(key,copy)).catch(()=>{}));
}
function offline(){return new Response('Không có kết nối. Hãy kết nối mạng và tải lại trang.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  if(u.pathname.startsWith('/api/')||e.request.headers?.has('Authorization'))return;
  if(u.pathname.endsWith('/site-editor.html')||u.pathname.includes('/editor-preview/')){e.respondWith(fetch(e.request,{cache:'no-store'}));return;}
  if(e.request.mode==='navigate'){
    const key=navKey(u);
    e.respondWith((async()=>{
      let r;
      try{
        r=await fetch(e.request,{cache:'no-store'});
        if(r.status>=500){const hit=await caches.match(key);if(hit)r=hit;}
        remember(e,key,r);
      }catch{r=await caches.match(key);}
      if(!r)return offline();
      if(!r.ok)return r;
      if(key==='./app-core.html')return injectWatchlist(r);
      if(key==='./index.html')return injectHomepageTheme(r);
      return r;
    })());return;
  }
  // Refresh scripts, styles and catalogs; never cache arbitrary/API responses.
  if(!/\.(?:js|css|json|webmanifest|png|jpg|jpeg|svg|woff2?)$/i.test(u.pathname))return;
  const key=u.origin+u.pathname;
  e.respondWith((async()=>{
    try{
      const r=await fetch(e.request,{cache:'no-store'});
      if(r.status>=500){const hit=await caches.match(key);if(hit)return hit;}
      remember(e,key,r);return r;
    }catch{return (await caches.match(key))||offline();}
  })());
});
