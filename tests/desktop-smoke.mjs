// FloodGuard desktop regression: homepage + login + watchlist responsiveness
import fs from 'node:fs';
import { chromium } from 'playwright';

const APP_URL = process.env.APP_URL || 'https://floodguard-user.onrender.com';
const local = process.env.LOCAL_URL || '';
const target = local || APP_URL;

function staticAudit(){
  const core=fs.readFileSync('app-core.html','utf8');
  const watch=fs.readFileSync('watchlist-email-v40.js','utf8');
  const report={
    appCoreBytes:Buffer.byteLength(core),
    mutationObservers:(core.match(/MutationObserver/g)||[]).length,
    setIntervals:(core.match(/setInterval\s*\(/g)||[]).length,
    requestAnimationFrames:(core.match(/requestAnimationFrame\s*\(/g)||[]).length,
    watchlistWholeDocumentObservers:(watch.match(/observe\(document\.documentElement/g)||[]).length,
    watchlistDisconnects:(watch.match(/\.disconnect\(\)/g)||[]).length,
    legacyRunawayPattern:/new MutationObserver\(\(\)=>mount\(\)\).*observe\(document\.documentElement/s.test(watch)
  };
  console.log('STATIC_AUDIT',JSON.stringify(report));
  if(report.legacyRunawayPattern) throw new Error('Runaway Watchlist observer pattern detected');
  if(report.watchlistWholeDocumentObservers>0 && report.watchlistDisconnects===0) throw new Error('Whole-document observer has no disconnect');
  return report;
}

async function eventLoopProbe(page,label){
  const result=await page.evaluate(async()=>{
    const start=performance.now();
    const delays=[];
    let last=start;
    for(let i=0;i<40;i++){
      await new Promise(r=>setTimeout(r,25));
      const now=performance.now();
      delays.push(now-last-25);
      last=now;
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

  // Explicitly exercise the Watchlist module even when the production service worker is not controlling this test tab.
  await page.addScriptTag({url:target+'/watchlist-email-v40.js?v=40-test'});
  await page.waitForTimeout(3500);
  const watchCount=await page.locator('#fg40Watch').count();
  console.log('WATCHLIST_MOUNT_COUNT',watchCount);
  if(watchCount>1) throw new Error('Watchlist mounted more than once');
  await eventLoopProbe(page,'WATCHLIST');

  // Generate benign DOM changes. The old bug would repeatedly re-render and stall here.
  const mutationResult=await page.evaluate(async()=>{
    const host=document.createElement('div');host.id='fg-smoke-mutations';document.body.appendChild(host);
    const t0=performance.now();
    for(let i=0;i<500;i++){
      const x=document.createElement('span');x.textContent=String(i);host.appendChild(x);if(host.childNodes.length>20)host.firstChild.remove();
    }
    await new Promise(r=>setTimeout(r,250));
    const count=document.querySelectorAll('#fg40Watch').length;
    host.remove();
    return {duration:performance.now()-t0,watchCount:count};
  });
  console.log('DOM_MUTATION_STRESS',JSON.stringify(mutationResult));
  if(mutationResult.duration>2500 || mutationResult.watchCount>1) throw new Error('DOM mutation stress indicates UI loop');
  await eventLoopProbe(page,'AFTER_STRESS');

  // Public homepage + login should remain responsive on desktop.
  const shell=await context.newPage();
  const shellErrors=[];shell.on('pageerror',e=>shellErrors.push(String(e.message||e)));
  const shellResponse=await shell.goto(target+'/',{waitUntil:'domcontentloaded',timeout:90000});
  console.log('INDEX_HTTP',shellResponse?.status());
  if(!shellResponse || shellResponse.status()>=400) throw new Error('index HTTP failure');
  await shell.waitForTimeout(1500);
  const homepageVisible=await shell.locator('#fgWebsiteHome').isVisible().catch(()=>false);
  console.log('HOMEPAGE_VISIBLE',homepageVisible);
  if(!homepageVisible) throw new Error('Public website homepage is not visible');
  const homeTitle=await shell.locator('#fgWebsiteHome h1').innerText().catch(()=> '');
  if(!/nguy cơ ngập/i.test(homeTitle)) throw new Error('Homepage hero content missing');
  await eventLoopProbe(shell,'HOMEPAGE');
  await shell.locator('[data-fg-home-login]').first().click();
  await shell.waitForTimeout(250);
  const loginVisible=await shell.locator('#loginEmail').isVisible().catch(()=>false);
  console.log('LOGIN_VISIBLE',loginVisible);
  if(!loginVisible) throw new Error('Desktop login form is not visible after entering app');
  await shell.locator('#loginEmail').fill('smoke.test@example.com');
  const filled=await shell.locator('#loginEmail').inputValue();
  if(filled!=='smoke.test@example.com') throw new Error('Login input is not responsive');
  await eventLoopProbe(shell,'LOGIN');

  const seriousErrors=[...pageErrors,...shellErrors].filter(x=>!/(ResizeObserver loop|Failed to fetch|NetworkError|Load failed)/i.test(x));
  console.log('PAGE_ERRORS',JSON.stringify(seriousErrors.slice(0,20)));
  if(seriousErrors.length) throw new Error('Unexpected page errors: '+seriousErrors.slice(0,5).join(' | '));

  await browser.close();
  console.log('DESKTOP_SMOKE_OK');
}

run().catch(err=>{console.error('DESKTOP_SMOKE_FAILED',err);process.exit(1)});
