// FloodGuard desktop regression: Cinematic Depth v48 + diverse layouts + problem media + login + watchlist responsiveness
import fs from 'node:fs';
import { chromium } from 'playwright';

const APP_URL=process.env.APP_URL||'https://floodguard-user.onrender.com';
const target=process.env.LOCAL_URL||APP_URL;
const norm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');

function staticAudit(){
  const core=fs.readFileSync('app-core.html','utf8');
  const watch=fs.readFileSync('watchlist-email-v40.js','utf8');
  const nav=fs.readFileSync('site-navigation-v2.js','utf8');
  const bridgeCss=fs.readFileSync('site-pages.css','utf8');
  const luxeCss=fs.readFileSync('site-luxe.css','utf8');
  const atelierCss=fs.readFileSync('site-atelier-v47.css','utf8');
  const cinematicCss=fs.readFileSync('site-cinematic-v48.css','utf8');
  const css=bridgeCss+'\n'+luxeCss+'\n'+atelierCss+'\n'+cinematicCss;
  const problem=fs.readFileSync('problem.html','utf8');
  const report={
    mutationObservers:(core.match(/MutationObserver/g)||[]).length,
    setIntervals:(core.match(/setInterval\s*\(/g)||[]).length,
    watchlistWholeDocumentObservers:(watch.match(/observe\(document\.documentElement/g)||[]).length,
    watchlistDisconnects:(watch.match(/\.disconnect\(\)/g)||[]).length,
    legacyRunawayPattern:/new MutationObserver\(\(\)=>mount\(\)\).*observe\(document\.documentElement/s.test(watch),
    hasSmoothMotion:/FG_SITE_NAV_V5/.test(nav)&&/view-transition/.test(nav)&&/IntersectionObserver/.test(nav),
    motionIntervals:(nav.match(/setInterval\s*\(/g)||[]).length,
    depthUsesRAF:/installCinematicDepth/.test(nav)&&/requestAnimationFrame/.test(nav),
    problemHasSources:/2026/.test(problem)&&/Nguồn/.test(problem)&&/Nguyên nhân/.test(problem),
    problemHasMedia:/(youtube|youtu\.be|iframe)/i.test(problem)&&((problem.match(/<img\b/gi)||[]).length>=3),
    premiumCss:/FloodGuard Atelier UI v47/.test(atelierCss)&&bridgeCss.includes('site-atelier-v47.css')&&atelierCss.includes('site-luxe.css'),
    cinematicCss:/FloodGuard Cinematic Depth v48/.test(cinematicCss)&&/fg48Aurora/.test(cinematicCss)&&/fg-depth-target/.test(cinematicCss)&&/fg48ScrollProgress/.test(cinematicCss),
    diverseCss:['feature-bento','flow-roadmap','alert-console','ev-console','rescue-console','about-story'].every(x=>css.includes('.'+x))
  };
  console.log('STATIC_AUDIT',JSON.stringify(report));
  if(report.legacyRunawayPattern)throw new Error('Runaway Watchlist observer pattern detected');
  if(report.watchlistWholeDocumentObservers>0&&report.watchlistDisconnects===0)throw new Error('Whole-document observer has no disconnect');
  if(!report.hasSmoothMotion)throw new Error('Smooth multi-page motion module missing');
  if(report.motionIntervals>0)throw new Error('Navigation/depth animation must not use polling intervals');
  if(!report.depthUsesRAF)throw new Error('Cinematic depth must use event-driven requestAnimationFrame');
  if(!report.problemHasSources)throw new Error('Problem page is missing dated evidence/sources');
  if(!report.problemHasMedia)throw new Error('Problem page is missing flood video/photo evidence');
  if(!report.premiumCss)throw new Error('Atelier v47 design system is not wired correctly');
  if(!report.cinematicCss)throw new Error('Cinematic Depth v48 design system is incomplete');
  if(!report.diverseCss)throw new Error('Distinct page layout system is incomplete');
}

async function eventLoopProbe(page,label){
  const result=await page.evaluate(async()=>{const d=[];let last=performance.now();for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,25));const now=performance.now();d.push(now-last-25);last=now}d.sort((a,b)=>a-b);return{p95:d[Math.floor(d.length*.95)]||0,max:Math.max(...d)}});
  console.log('EVENT_LOOP_'+label,JSON.stringify(result));
  if(result.p95>250||result.max>1200)throw new Error(label+' main thread unresponsive');
}

async function run(){
  staticAudit();
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});

  const app=await context.newPage();
  const appErrors=[];app.on('pageerror',e=>appErrors.push(String(e.message||e)));
  let r=await app.goto(target+'/app-core.html',{waitUntil:'domcontentloaded',timeout:90000});
  if(!r||r.status()>=400)throw new Error('app-core HTTP failure');
  await app.waitForTimeout(3000);await eventLoopProbe(app,'APP_BASE');
  await app.addScriptTag({url:target+'/watchlist-email-v40.js?v=40-test'});await app.waitForTimeout(2500);
  if(await app.locator('#fg40Watch').count()>1)throw new Error('Watchlist mounted more than once');
  const stress=await app.evaluate(async()=>{const h=document.createElement('div');document.body.appendChild(h);const t=performance.now();for(let i=0;i<500;i++){const x=document.createElement('span');h.appendChild(x);if(h.childNodes.length>20)h.firstChild.remove()}await new Promise(r=>setTimeout(r,250));const c=document.querySelectorAll('#fg40Watch').length;h.remove();return{ms:performance.now()-t,c}});
  console.log('DOM_STRESS',JSON.stringify(stress));if(stress.ms>2500||stress.c>1)throw new Error('DOM stress indicates UI loop');

  const home=await context.newPage();const homeErrors=[];home.on('pageerror',e=>homeErrors.push(String(e.message||e)));
  r=await home.goto(target+'/',{waitUntil:'domcontentloaded',timeout:90000});if(!r||r.status()>=400)throw new Error('homepage HTTP failure');
  await home.waitForTimeout(1400);
  if(!await home.locator('#fgWebsiteHome').isVisible().catch(()=>false))throw new Error('homepage hidden');
  if(await home.locator('#fgSmoothMotionV4').count()!==1)throw new Error('motion module missing on homepage');
  if(await home.locator('link[href*="site-atelier-v47.css"]').count()<1)throw new Error('Atelier stylesheet missing on homepage');
  if(await home.locator('link[href*="site-cinematic-v48.css"]').count()<1)throw new Error('Cinematic stylesheet missing on homepage');
  if((await home.locator('html').getAttribute('data-fg-cinematic'))!=='1')throw new Error('Cinematic mode not enabled on homepage');
  if(await home.locator('#fg48ScrollProgress').count()!==1)throw new Error('Scroll progress layer missing');
  const labels=await home.locator('#fgWebsiteHome .wh-links a').allTextContents();if(norm(labels[0])!=='vấn đề')throw new Error('Problem not first in navigation');
  const depthTarget=home.locator('.fg-depth-target').first();
  if(await depthTarget.count()<1)throw new Error('No 3D depth target on homepage');
  const box=await depthTarget.boundingBox();if(box){await home.mouse.move(box.x+box.width*.75,box.y+box.height*.35);await home.waitForTimeout(120);if(!await depthTarget.evaluate(el=>el.classList.contains('fg-depth-live')))throw new Error('3D pointer interaction did not activate');await home.mouse.move(5,5)}
  await eventLoopProbe(home,'HOMEPAGE_CINEMATIC');

  const layouts=[
    ['problem.html','.problem-stats','Vấn đề'],
    ['features.html','.feature-bento','Tính năng'],
    ['how-it-works.html','.flow-roadmap','Cách hoạt động'],
    ['alerts.html','.alert-console','Cảnh báo'],
    ['ev.html','.ev-console','Trạm sạc EV'],
    ['rescue.html','.rescue-console','Cứu hộ'],
    ['about.html','.about-story','Giới thiệu']
  ];
  for(const [path,selector,label] of layouts){
    const p=await context.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.message||e)));
    const res=await p.goto(target+'/'+path,{waitUntil:'domcontentloaded',timeout:90000});
    if(!res||res.status()>=400)throw new Error(path+' HTTP failure');
    await p.waitForTimeout(850);
    if(!await p.locator(selector).first().isVisible().catch(()=>false))throw new Error(path+' unique layout missing: '+selector);
    if(!(await p.locator('h1').first().innerText().catch(()=>'' )).trim())throw new Error(path+' missing H1');
    if((await p.locator('.site-links a').first().innerText()).trim().toLowerCase()!=='vấn đề')throw new Error(path+' nav order broken');
    if(await p.locator('#fgSmoothMotionV4').count()!==1)throw new Error(path+' motion module missing');
    if(await p.locator('link[href*="site-cinematic-v48.css"]').count()<1)throw new Error(path+' cinematic stylesheet missing');
    if((await p.locator('html').getAttribute('data-fg-cinematic'))!=='1')throw new Error(path+' cinematic mode disabled');
    const href=await p.locator('a.site-btn.primary').first().getAttribute('href').catch(()=>null);if(!href?.includes('?login=1'))throw new Error(path+' login CTA broken');
    const serious=errs.filter(x=>!/(ResizeObserver loop|Failed to fetch|NetworkError|Load failed)/i.test(x));if(serious.length)throw new Error(path+' page errors: '+serious.join(' | '));
    await eventLoopProbe(p,label.replace(/\s/g,'_').toUpperCase());
    console.log('UNIQUE_LAYOUT_OK',label,selector);
    await p.close();
  }

  const nav=await context.newPage();
  await nav.goto(target+'/',{waitUntil:'domcontentloaded',timeout:90000});await nav.waitForTimeout(700);
  const t0=Date.now();await Promise.all([nav.waitForURL(/problem\.html$/,{timeout:10000}),nav.locator('#fgWebsiteHome .wh-links a').filter({hasText:'Vấn đề'}).first().click()]);
  if(Date.now()-t0>3000)throw new Error('Homepage to problem transition too slow');
  const t1=Date.now();await Promise.all([nav.waitForURL(/features\.html$/,{timeout:10000}),nav.locator('.site-links a').filter({hasText:'Tính năng'}).first().click()]);
  if(Date.now()-t1>3000)throw new Error('Problem to features transition too slow');
  await nav.close();

  const login=await context.newPage();
  r=await login.goto(target+'/?login=1',{waitUntil:'domcontentloaded',timeout:90000});if(!r||r.status()>=400)throw new Error('login HTTP failure');
  await login.waitForTimeout(600);if(!await login.locator('#loginEmail').isVisible().catch(()=>false))throw new Error('login form hidden');
  await login.locator('#loginEmail').fill('smoke.test@example.com');if(await login.locator('#loginEmail').inputValue()!=='smoke.test@example.com')throw new Error('login input not responsive');
  await eventLoopProbe(login,'LOGIN');

  const serious=[...appErrors,...homeErrors].filter(x=>!/(ResizeObserver loop|Failed to fetch|NetworkError|Load failed)/i.test(x));if(serious.length)throw new Error('Unexpected errors: '+serious.join(' | '));
  await browser.close();console.log('CINEMATIC_V48_DESKTOP_OK');
}
run().catch(err=>{console.error('DESKTOP_SMOKE_FAILED',err);process.exit(1)});