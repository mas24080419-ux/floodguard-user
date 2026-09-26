// FloodGuard desktop regression: homepage + multi-page motion + login + watchlist responsiveness
import fs from 'node:fs';
import { chromium } from 'playwright';

const APP_URL = process.env.APP_URL || 'https://floodguard-user.onrender.com';
const local = process.env.LOCAL_URL || '';
const target = local || APP_URL;

function staticAudit(){
  const core=fs.readFileSync('app-core.html','utf8');
  const watch=fs.readFileSync('watchlist-email-v40.js','utf8');
  const nav=fs.readFileSync('site-navigation-v2.js','utf8');
  const report={
    appCoreBytes:Buffer.byteLength(core),
    mutationObservers:(core.match(/MutationObserver/g)||[]).length,
    setIntervals:(core.match(/setInterval\s*\(/g)||[]).length,
    requestAnimationFrames:(core.match(/requestAnimationFrame\s*\(/g)||[]).length,
    watchlistWholeDocumentObservers:(watch.match(/observe\(document\.documentElement/g)||[]).length,
    watchlistDisconnects:(watch.match(/\.disconnect\(\)/g)||[]).length,
    legacyRunawayPattern:/new MutationObserver\(\(\)=>mount\(\)\).*observe\(document\.documentElement/s.test(watch),
    hasSmoothMotion:/FG_SITE_NAV_V3/.test(nav)&&/view-transition/.test(nav)&&/IntersectionObserver/.test(nav),
    motionIntervals:(nav.match(/setInterval\s*\(/g)||[]).length
  };
  console.log('STATIC_AUDIT',JSON.stringify(report));
  if(report.legacyRunawayPattern) throw new Error('Runaway Watchlist observer pattern detected');
  if(report.watchlistWholeDocumentObservers>0 && report.watchlistDisconnects===0) throw new Error('Whole-document observer has no disconnect');
  if(!report.hasSmoothMotion) throw new Error('Smooth multi-page motion module missing');
  if(report.motionIntervals>0) throw new Error('Navigation animation must not use polling intervals');
  return report;
}

async function eventLoopProbe(page,label){
  const result=await page.evaluate(async()=>{
    const start=performance.now();const delays=[];let last=start;
    for(let i=0;i<40;i++){
      await new Promise(r=>setTimeout(r,25));
      const now=performance.now();delays.push(now-last-25);last=now;
    }
    delays.sort((a,b)=>a-b);
    const p95=delays[Math.floor(delays.length*.95)]||0;
    return {elapsed:performance.now()-start,p95,max:Math.max(...delays)};
  });
  console.log(`EVENT_LOOP_${label}`,JSON.stringify(result));
  if(result.p95>250 || result.max>1200) throw new Error(`${label} main thread is unresponsive: ${JSON.stringify(result)}`);
}

async function run(){
  staticAudit();
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
  page.on('console',m=>{if(m.type()==='error') console.log('CONSOLE_ERROR',m.text())});

  const start=Date.now();
  const response=await page.goto(target+'/app-core.html',{waitUntil:'domcontentloaded',timeout:90000});
  console.log('APP_CORE_HTTP',response?.status(),'LOAD_MS',Date.now()-start);
  if(!response || response.status()>=400) throw new Error('app-core HTTP failure');
  await page.waitForTimeout(3500);
  await eventLoopProbe(page,'BASE');

  await page.addScriptTag({url:target+'/watchlist-email-v40.js?v=40-test'});
  await page.waitForTimeout(3500);
  const watchCount=await page.locator('#fg40Watch').count();
  console.log('WATCHLIST_MOUNT_COUNT',watchCount);
  if(watchCount>1) throw new Error('Watchlist mounted more than once');
  await eventLoopProbe(page,'WATCHLIST');

  const mutationResult=await page.evaluate(async()=>{
    const host=document.createElement('div');host.id='fg-smoke-mutations';document.body.appendChild(host);
    const t0=performance.now();
    for(let i=0;i<500;i++){const x=document.createElement('span');x.textContent=String(i);host.appendChild(x);if(host.childNodes.length>20)host.firstChild.remove();}
    await new Promise(r=>setTimeout(r,250));
    const count=document.querySelectorAll('#fg40Watch').length;host.remove();
    return {duration:performance.now()-t0,watchCount:count};
  });
  console.log('DOM_MUTATION_STRESS',JSON.stringify(mutationResult));
  if(mutationResult.duration>2500 || mutationResult.watchCount>1) throw new Error('DOM mutation stress indicates UI loop');
  await eventLoopProbe(page,'AFTER_STRESS');

  const shell=await context.newPage();
  const shellErrors=[];shell.on('pageerror',e=>shellErrors.push(String(e.message||e)));
  const shellResponse=await shell.goto(target+'/',{waitUntil:'domcontentloaded',timeout:90000});
  console.log('INDEX_HTTP',shellResponse?.status());
  if(!shellResponse || shellResponse.status()>=400) throw new Error('index HTTP failure');
  await shell.waitForTimeout(1200);
  const homepageVisible=await shell.locator('#fgWebsiteHome').isVisible().catch(()=>false);
  console.log('HOMEPAGE_VISIBLE',homepageVisible);
  if(!homepageVisible) throw new Error('Public website homepage is not visible');
  const homeTitle=await shell.locator('#fgWebsiteHome h1').innerText().catch(()=> '');
  if(!/nguy cơ ngập/i.test(homeTitle)) throw new Error('Homepage hero content missing');
  const motionStyle=await shell.locator('#fgSmoothMotionV3').count();
  console.log('SMOOTH_MOTION_STYLE',motionStyle);
  if(motionStyle!==1) throw new Error('Smooth transition style did not mount exactly once');
  const exploreVisible=await shell.locator('#fgMultiPageExplore').isVisible().catch(()=>false);
  console.log('MULTIPAGE_EXPLORE_VISIBLE',exploreVisible);
  if(!exploreVisible) throw new Error('Homepage multi-page directory is not visible');
  const legacyEvVisible=await shell.locator('#fgWebsiteHome #ev').isVisible().catch(()=>false);
  console.log('LEGACY_EV_SECTION_VISIBLE',legacyEvVisible);
  if(legacyEvVisible) throw new Error('Homepage still exposes long-scroll EV section');
  const featureHref=await shell.locator('#fgWebsiteHome .wh-links a').filter({hasText:'Tính năng'}).first().getAttribute('href').catch(()=>null);
  console.log('HOME_FEATURE_HREF',featureHref);
  if(!featureHref || !featureHref.includes('features.html')) throw new Error('Homepage navigation still points to an in-page anchor');
  const revealTargets=await shell.locator('#fgMultiPageExplore .fgmp-card.fg-reveal').count().catch(()=>0);
  console.log('HOME_REVEAL_TARGETS',revealTargets);
  if(revealTargets<1) throw new Error('Homepage reveal animation targets were not initialized');
  const firstReveal=shell.locator('#fgMultiPageExplore .fgmp-card').first();
  await firstReveal.scrollIntoViewIfNeeded();
  await shell.waitForTimeout(750);
  const revealVisible=await firstReveal.evaluate(el=>el.classList.contains('fg-visible')).catch(()=>false);
  console.log('HOME_REVEAL_VISIBLE_AFTER_SCROLL',revealVisible);
  if(!revealVisible) throw new Error('Homepage reveal animation did not settle after entering viewport');
  await eventLoopProbe(shell,'HOMEPAGE_MOTION');

  const navProbe=await context.newPage();
  const navErrors=[];navProbe.on('pageerror',e=>navErrors.push(String(e.message||e)));
  await navProbe.goto(target+'/',{waitUntil:'domcontentloaded',timeout:90000});
  await navProbe.waitForTimeout(700);
  let t0=Date.now();
  await Promise.all([
    navProbe.waitForURL(/features\.html$/, {timeout:10000}),
    navProbe.locator('#fgWebsiteHome .wh-links a').filter({hasText:'Tính năng'}).first().click()
  ]);
  const homeToFeaturesMs=Date.now()-t0;
  console.log('NAV_HOME_TO_FEATURES_MS',homeToFeaturesMs);
  if(homeToFeaturesMs>3000) throw new Error('Homepage to features transition is too slow');
  await navProbe.waitForTimeout(500);
  if(await navProbe.locator('#fgSmoothMotionV3').count()!==1) throw new Error('Motion module missing after page navigation');
  await eventLoopProbe(navProbe,'FEATURES_MOTION');
  t0=Date.now();
  await Promise.all([
    navProbe.waitForURL(/alerts\.html$/, {timeout:10000}),
    navProbe.locator('.site-links a').filter({hasText:'Cảnh báo'}).first().click()
  ]);
  const featuresToAlertsMs=Date.now()-t0;
  console.log('NAV_FEATURES_TO_ALERTS_MS',featuresToAlertsMs);
  if(featuresToAlertsMs>3000) throw new Error('Features to alerts transition is too slow');
  if(navErrors.length) throw new Error('Multi-page navigation emitted JS errors: '+navErrors.join(' | '));
  console.log('REAL_SMOOTH_NAVIGATION_OK',navProbe.url());
  await navProbe.close();

  const pages=[
    ['features.html','Tính năng'],
    ['how-it-works.html','Cách hoạt động'],
    ['alerts.html','Cảnh báo'],
    ['ev.html','Trạm sạc EV'],
    ['rescue.html','Cứu hộ'],
    ['about.html','Giới thiệu']
  ];
  for(const [path,label] of pages){
    const p=await context.newPage();
    const errs=[];p.on('pageerror',e=>errs.push(String(e.message||e)));
    const r=await p.goto(target+'/'+path,{waitUntil:'domcontentloaded',timeout:90000});
    console.log('SITE_PAGE',path,'HTTP',r?.status());
    if(!r||r.status()>=400) throw new Error(`${path} HTTP failure`);
    await p.waitForTimeout(450);
    const h1=(await p.locator('h1').first().innerText().catch(()=>'' )).trim();
    if(!h1) throw new Error(`${path} missing H1`);
    const brand=await p.locator('.site-brand').first().isVisible().catch(()=>false);
    if(!brand) throw new Error(`${path} missing site header`);
    const motion=await p.locator('#fgSmoothMotionV3').count();
    if(motion!==1) throw new Error(`${path} missing smooth motion module`);
    const appHref=await p.locator('a.site-btn.primary').first().getAttribute('href').catch(()=>null);
    if(!appHref || !appHref.includes('?login=1')) throw new Error(`${path} does not link into FloodGuard login`);
    const serious=errs.filter(x=>!/(ResizeObserver loop|Failed to fetch|NetworkError|Load failed)/i.test(x));
    if(serious.length) throw new Error(`${path} page errors: ${serious.join(' | ')}`);
    console.log('SITE_PAGE_OK',label,h1.slice(0,80));
    await p.close();
  }

  const loginPage=await context.newPage();
  const loginErrors=[];loginPage.on('pageerror',e=>loginErrors.push(String(e.message||e)));
  const loginResponse=await loginPage.goto(target+'/?login=1',{waitUntil:'domcontentloaded',timeout:90000});
  if(!loginResponse || loginResponse.status()>=400) throw new Error('login route HTTP failure');
  await loginPage.waitForTimeout(500);
  const loginVisible=await loginPage.locator('#loginEmail').isVisible().catch(()=>false);
  console.log('LOGIN_VISIBLE',loginVisible);
  if(!loginVisible) throw new Error('Desktop login form is not visible from ?login=1');
  await loginPage.locator('#loginEmail').fill('smoke.test@example.com');
  const filled=await loginPage.locator('#loginEmail').inputValue();
  if(filled!=='smoke.test@example.com') throw new Error('Login input is not responsive');
  await eventLoopProbe(loginPage,'LOGIN');

  const seriousErrors=[...pageErrors,...shellErrors,...loginErrors].filter(x=>!/(ResizeObserver loop|Failed to fetch|NetworkError|Load failed)/i.test(x));
  console.log('PAGE_ERRORS',JSON.stringify(seriousErrors.slice(0,20)));
  if(seriousErrors.length) throw new Error('Unexpected page errors: '+seriousErrors.slice(0,5).join(' | '));

  await browser.close();
  console.log('SMOOTH_MULTIPAGE_DESKTOP_OK');
}

run().catch(err=>{console.error('DESKTOP_SMOKE_FAILED',err);process.exit(1)});
