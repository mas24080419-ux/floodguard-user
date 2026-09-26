// FloodGuard desktop regression: Editorial Story v49 + Cinematic Depth v48 + problem media + login + watchlist responsiveness
import fs from 'node:fs';
import { chromium } from 'playwright';

const APP_URL=process.env.APP_URL||'https://floodguard-user.onrender.com';
const target=process.env.LOCAL_URL||APP_URL;
const norm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');

function staticAudit(){
  const core=fs.readFileSync('app-core.html','utf8');
  const watch=fs.readFileSync('watchlist-email-v40.js','utf8');
  const nav=fs.readFileSync('site-navigation-v2.js','utf8');
  const bridge=fs.readFileSync('site-pages.css','utf8');
  const atelier=fs.readFileSync('site-atelier-v47.css','utf8');
  const cinematic=fs.readFileSync('site-cinematic-v48.css','utf8');
  const editorial=fs.readFileSync('site-editorial-v49.css','utf8');
  const problem=fs.readFileSync('problem.html','utf8');
  const all=bridge+'\n'+atelier+'\n'+cinematic+'\n'+editorial;
  const report={
    mutationObservers:(core.match(/MutationObserver/g)||[]).length,
    watchObserver:(watch.match(/observe\(document\.documentElement/g)||[]).length,
    watchDisconnect:(watch.match(/\.disconnect\(\)/g)||[]).length,
    runaway:/new MutationObserver\(\(\)=>mount\(\)\).*observe\(document\.documentElement/s.test(watch),
    motion:/FG_SITE_NAV_V6/.test(nav)&&/IntersectionObserver/.test(nav)&&/view-transition/.test(nav),
    noPolling:(nav.match(/setInterval\s*\(/g)||[]).length===0,
    depth:/installCinematicDepth/.test(nav)&&/requestAnimationFrame/.test(nav),
    editorialLoader:/installEditorialTheme/.test(nav)&&/site-editorial-v49\.css/.test(nav),
    media:/(youtube|iframe)/i.test(problem)&&((problem.match(/<img\b/gi)||[]).length>=3),
    editorialCss:/FloodGuard Editorial Story v49/.test(editorial)&&/fg49section/.test(editorial)&&/repeat\(12/.test(editorial),
    hierarchy:bridge.includes('site-atelier-v47.css')&&bridge.includes('site-editorial-v49.css'),
    layouts:['feature-bento','flow-roadmap','alert-console','ev-console','rescue-console','about-story'].every(x=>all.includes('.'+x))
  };
  console.log('STATIC_AUDIT',JSON.stringify(report));
  if(report.runaway)throw new Error('Runaway Watchlist observer detected');
  if(report.watchObserver>0&&report.watchDisconnect===0)throw new Error('Watchlist observer has no disconnect');
  for(const k of ['motion','noPolling','depth','editorialLoader','media','editorialCss','hierarchy','layouts'])if(!report[k])throw new Error('Static audit failed: '+k);
}

async function eventLoopProbe(page,label){
  const r=await page.evaluate(async()=>{const a=[];let t=performance.now();for(let i=0;i<40;i++){await new Promise(x=>setTimeout(x,25));const n=performance.now();a.push(n-t-25);t=n}a.sort((x,y)=>x-y);return{p95:a[Math.floor(a.length*.95)]||0,max:Math.max(...a)}});
  console.log('EVENT_LOOP_'+label,JSON.stringify(r));
  if(r.p95>250||r.max>1200)throw new Error(label+' main thread unresponsive');
}

async function run(){
  staticAudit();
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});

  const app=await context.newPage();
  let res=await app.goto(target+'/app-core.html',{waitUntil:'domcontentloaded',timeout:90000});
  if(!res||res.status()>=400)throw new Error('app-core HTTP failure');
  await app.waitForTimeout(2600);await eventLoopProbe(app,'APP');
  await app.addScriptTag({url:target+'/watchlist-email-v40.js?v=40-test'});await app.waitForTimeout(1800);
  const stress=await app.evaluate(async()=>{const h=document.createElement('div');document.body.appendChild(h);const t=performance.now();for(let i=0;i<500;i++){const x=document.createElement('i');h.appendChild(x);if(h.childNodes.length>20)h.firstChild.remove()}await new Promise(r=>setTimeout(r,250));const c=document.querySelectorAll('#fg40Watch').length;h.remove();return{ms:performance.now()-t,c}});
  console.log('DOM_STRESS',JSON.stringify(stress));if(stress.ms>2500||stress.c>1)throw new Error('DOM stress indicates UI loop');

  const home=await context.newPage();const homeErrors=[];home.on('pageerror',e=>homeErrors.push(String(e.message||e)));
  res=await home.goto(target+'/',{waitUntil:'domcontentloaded',timeout:90000});if(!res||res.status()>=400)throw new Error('homepage HTTP failure');
  await home.waitForTimeout(1500);
  if(!await home.locator('#fgWebsiteHome').isVisible().catch(()=>false))throw new Error('homepage hidden');
  for(const file of ['site-atelier-v47.css','site-cinematic-v48.css','site-editorial-v49.css'])if(await home.locator(`link[href*="${file}"]`).count()<1)throw new Error(file+' missing on homepage');
  if((await home.locator('html').getAttribute('data-fg-cinematic'))!=='1'||(await home.locator('html').getAttribute('data-fg-editorial'))!=='1')throw new Error('Visual modes not enabled');
  if(await home.locator('#fg48ScrollProgress').count()!==1)throw new Error('Scroll progress missing');
  const labels=await home.locator('#fgWebsiteHome .wh-links a').allTextContents();if(norm(labels[0])!=='vấn đề')throw new Error('Problem not first in nav');
  if(await home.locator('#fgMultiPageExplore .fgmp-card').count()<7)throw new Error('Editorial showcase incomplete');
  const first=home.locator('#fgMultiPageExplore .fgmp-card').first();
  const radius=await first.evaluate(el=>getComputedStyle(el).borderRadius);if(!['7px','8px'].includes(radius))throw new Error('v49 showcase styling missing: '+radius);
  const depth=home.locator('.wh-window.fg-depth-target').first();if(await depth.count()<1)throw new Error('Homepage 3D target missing');
  await depth.dispatchEvent('pointerenter');await home.waitForTimeout(40);if(!await depth.evaluate(el=>el.classList.contains('fg-depth-live')))throw new Error('3D listener not bound');await depth.dispatchEvent('pointerleave');
  await eventLoopProbe(home,'HOMEPAGE_EDITORIAL');

  const layouts=[['problem.html','.problem-stats'],['features.html','.feature-bento'],['how-it-works.html','.flow-roadmap'],['alerts.html','.alert-console'],['ev.html','.ev-console'],['rescue.html','.rescue-console'],['about.html','.about-story']];
  for(const [path,selector] of layouts){
    const p=await context.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.message||e)));
    const rr=await p.goto(target+'/'+path,{waitUntil:'domcontentloaded',timeout:90000});if(!rr||rr.status()>=400)throw new Error(path+' HTTP failure');
    await p.waitForTimeout(850);
    if(!await p.locator(selector).first().isVisible().catch(()=>false))throw new Error(path+' layout missing');
    if(await p.locator('link[href*="site-editorial-v49.css"]').count()<1)throw new Error(path+' v49 CSS missing');
    if((await p.locator('html').getAttribute('data-fg-editorial'))!=='1')throw new Error(path+' editorial mode disabled');
    if((await p.locator('.site-links a').first().innerText()).trim().toLowerCase()!=='vấn đề')throw new Error(path+' nav order broken');
    const serious=errs.filter(x=>!/(ResizeObserver loop|Failed to fetch|NetworkError|Load failed)/i.test(x));if(serious.length)throw new Error(path+' JS errors: '+serious.join(' | '));
    await eventLoopProbe(p,path.replace(/\W/g,'_').toUpperCase());await p.close();
  }

  const login=await context.newPage();
  res=await login.goto(target+'/?login=1',{waitUntil:'domcontentloaded',timeout:90000});if(!res||res.status()>=400)throw new Error('login HTTP failure');
  await login.waitForTimeout(650);if(!await login.locator('#loginEmail').isVisible().catch(()=>false))throw new Error('login hidden');
  await login.locator('#loginEmail').fill('smoke.test@example.com');if(await login.locator('#loginEmail').inputValue()!=='smoke.test@example.com')throw new Error('login input unresponsive');
  await eventLoopProbe(login,'LOGIN');

  const serious=homeErrors.filter(x=>!/(ResizeObserver loop|Failed to fetch|NetworkError|Load failed)/i.test(x));if(serious.length)throw new Error('Homepage errors: '+serious.join(' | '));
  await browser.close();console.log('EDITORIAL_V49_DESKTOP_OK');
}
run().catch(e=>{console.error('DESKTOP_SMOKE_FAILED',e);process.exit(1)});