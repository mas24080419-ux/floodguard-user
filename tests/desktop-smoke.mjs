// FloodGuard desktop regression: problem-first story + multi-page motion + login + watchlist responsiveness
import fs from 'node:fs';
import { chromium } from 'playwright';

const APP_URL = process.env.APP_URL || 'https://floodguard-user.onrender.com';
const local = process.env.LOCAL_URL || '';
const target = local || APP_URL;

function staticAudit(){
  const core=fs.readFileSync('app-core.html','utf8');
  const watch=fs.readFileSync('watchlist-email-v40.js','utf8');
  const nav=fs.readFileSync('site-navigation-v2.js','utf8');
  const problem=fs.readFileSync('problem.html','utf8');
  const report={
    appCoreBytes:Buffer.byteLength(core),
    mutationObservers:(core.match(/MutationObserver/g)||[]).length,
    setIntervals:(core.match(/setInterval\s*\(/g)||[]).length,
    requestAnimationFrames:(core.match(/requestAnimationFrame\s*\(/g)||[]).length,
    watchlistWholeDocumentObservers:(watch.match(/observe\(document\.documentElement/g)||[]).length,
    watchlistDisconnects:(watch.match(/\.disconnect\(\)/g)||[]).length,
    legacyRunawayPattern:/new MutationObserver\(\(\)=>mount\(\)\).*observe\(document\.documentElement/s.test(watch),
    hasSmoothMotion:/FG_SITE_NAV_V4/.test(nav)&&/view-transition/.test(nav)&&/IntersectionObserver/.test(nav),
    motionIntervals:(nav.match(/setInterval\s*\(/g)||[]).length,
    problemHasSources:/23\/09\/2026/.test(problem)&&/World Bank/.test(problem)&&/Nguyên nhân/.test(problem)
  };
  console.log('STATIC_AUDIT',JSON.stringify(report));
  if(report.legacyRunawayPattern) throw new Error('Runaway Watchlist observer pattern detected');
  if(report.watchlistWholeDocumentObservers>0 && report.watchlistDisconnects===0) throw new Error('Whole-document observer has no disconnect');
  if(!report.hasSmoothMotion) throw new Error('Smooth multi-page motion module missing');
  if(report.motionIntervals>0) throw new Error('Navigation animation must not use polling intervals');
  if(!report.problemHasSources) throw new Error('Problem page is missing dated evidence/sources');
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
  if(!await shell.locator('#fgWebsiteHome').isVisible().catch(()=>false)) throw new Error('Public website homepage is not visible');
  const motionStyle=await shell.locator('#fgSmoothMotionV4').count();
  if(motionStyle!==1) throw new Error('Smooth transition style did not mount exactly once');
  if(!await shell.locator('#fgMultiPageExplore').isVisible().catch(()=>false)) throw new Error('Homepage multi-page directory is not visible');
  if(await shell.locator('#fgWebsiteHome #ev').isVisible().catch(()=>false)) throw new Error('Homepage still exposes long-scroll EV section');
  const headerLabels=await shell.locator('#fgWebsiteHome .wh-links a').allTextContents();
  console.log('HOME_NAV_LABELS',JSON.stringify(headerLabels));
  if(norm(headerLabels[0])!=='vấn đề') throw new Error('Problem page is not first in homepage navigation');
  const problemHref=await shell.locator('#fgWebsiteHome .wh-links a').filter({hasText:'Vấn đề'}).first().getAttribute('href').catch(()=>null);
  if(!problemHref?.includes('problem.html')) throw new Error('Homepage problem navigation missing');
  const firstCardText=(await shell.locator('#fgMultiPageExplore .fgmp-card').first().innerText()).toLowerCase();
  if(!firstCardText.includes('vấn đề ngập')) throw new Error('Problem is not the first homepage story card');
  const firstReveal=shell.locator('#fgMultiPageExplore .fgmp-card').first();
  await firstReveal.scrollIntoViewIfNeeded();await shell.waitForTimeout(750);
  if(!await firstReveal.evaluate(el=>el.classList.contains('fg-visible')).catch(()=>false)) throw new Error('Homepage reveal animation did not settle');
  await eventLoopProbe(shell,'HOMEPAGE_MOTION');

  const navProbe=await context.newPage();
  const navErrors=[];navProbe.on('pageerror',e=>navErrors.push(String(e.message||e)));
  await navProbe.goto(target+'/',{waitUntil:'domcontentloaded',timeout:90000});await navProbe.waitForTimeout(700);
  let t0=Date.now();
  await Promise.all([
    navProbe.waitForURL(/problem\.html$/, {timeout:10000}),
    navProbe.locator('#fgWebsiteHome .wh-links a').filter({hasText:'Vấn đề'}).first().click()
  ]);
  const homeToProblemMs=Date.now()-t0;
  console.log('NAV_HOME_TO_PROBLEM_MS',homeToProblemMs);
  if(homeToProblemMs>3000) throw new Error('Homepage to problem transition is too slow');
  await navProbe.waitForTimeout(500);
  if(await navProbe.locator('#fgSmoothMotionV4').count()!==1) throw new Error('Motion module missing after problem navigation');
  const problemH1=await navProbe.locator('h1').first().innerText();
  if(!/Ngập không chỉ/i.test(problemH1)) throw new Error('Problem page hero missing');
  if(await navProbe.locator('.problem-stat').count()<3) throw new Error('Problem page reality statistics missing');
  if(await navProbe.locator('.cause-card').count()<8) throw new Error('Problem causes section incomplete');
  await eventLoopProbe(navProbe,'PROBLEM_MOTION');
  t0=Date.now();
  await Promise.all([
    navProbe.waitForURL(/features\.html$/, {timeout:10000}),
    navProbe.locator('.site-links a').filter({hasText:'Tính năng'}).first().click()
  ]);
  const problemToFeaturesMs=Date.now()-t0;
  console.log('NAV_PROBLEM_TO_FEATURES_MS',problemToFeaturesMs);
  if(problemToFeaturesMs>3000) throw new Error('Problem to features transition is too slow');
  if(navErrors.length) throw new Error('Multi-page navigation emitted JS errors: '+navErrors.join(' | '));
  await navProbe.close();

  const pages=[
    ['problem.html','Vấn đề'],['features.html','Tính năng'],['how-it-works.html','Cách hoạt động'],['alerts.html','Cảnh báo'],['ev.html','Trạm sạc EV'],['rescue.html','Cứu hộ'],['about.html','Giới thiệu']
  ];
  for(const [path,label] of pages){
    const p=await context.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.message||e)));
    const r=await p.goto(target+'/'+path,{waitUntil:'domcontentloaded',timeout:90000});
    if(!r||r.status()>=400) throw new Error(`${path} HTTP failure`);
    await p.waitForTimeout(450);
    if(!(await p.locator('h1').first().innerText().catch(()=>'' )).trim()) throw new Error(`${path} missing H1`);
    if(!await p.locator('.site-brand').first().isVisible().catch(()=>false)) throw new Error(`${path} missing site header`);
    if(await p.locator('#fgSmoothMotionV4').count()!==1) throw new Error(`${path} missing smooth motion module`);
    const firstNav=(await p.locator('.site-links a').first().innerText().catch(()=>'' )).trim().toLowerCase();
    if(firstNav!=='vấn đề') throw new Error(`${path} does not keep problem first in navigation`);
    const appHref=await p.locator('a.site-btn.primary').first().getAttribute('href').catch(()=>null);
    if(!appHref || !appHref.includes('?login=1')) throw new Error(`${path} does not link into FloodGuard login`);
    const serious=errs.filter(x=>!/(ResizeObserver loop|Failed to fetch|NetworkError|Load failed)/i.test(x));
    if(serious.length) throw new Error(`${path} page errors: ${serious.join(' | ')}`);
    console.log('SITE_PAGE_OK',label);
    await p.close();
  }

  const loginPage=await context.newPage();
  const loginErrors=[];loginPage.on('pageerror',e=>loginErrors.push(String(e.message||e)));
  const loginResponse=await loginPage.goto(target+'/?login=1',{waitUntil:'domcontentloaded',timeout:90000});
  if(!loginResponse || loginResponse.status()>=400) throw new Error('login route HTTP failure');
  await loginPage.waitForTimeout(500);
  if(!await loginPage.locator('#loginEmail').isVisible().catch(()=>false)) throw new Error('Desktop login form is not visible from ?login=1');
  await loginPage.locator('#loginEmail').fill('smoke.test@example.com');
  if(await loginPage.locator('#loginEmail').inputValue()!=='smoke.test@example.com') throw new Error('Login input is not responsive');
  await eventLoopProbe(loginPage,'LOGIN');

  const seriousErrors=[...pageErrors,...shellErrors,...loginErrors].filter(x=>!/(ResizeObserver loop|Failed to fetch|NetworkError|Load failed)/i.test(x));
  console.log('PAGE_ERRORS',JSON.stringify(seriousErrors.slice(0,20)));
  if(seriousErrors.length) throw new Error('Unexpected page errors: '+seriousErrors.slice(0,5).join(' | '));
  await browser.close();
  console.log('PROBLEM_FIRST_MULTIPAGE_OK');
}
function norm(s){return String(s||'').trim().toLowerCase().replace(/\s+/g,' ')}
run().catch(err=>{console.error('DESKTOP_SMOKE_FAILED',err);process.exit(1)});
