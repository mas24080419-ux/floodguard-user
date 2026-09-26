// FloodGuard desktop regression — v50 public EV page hidden, EV app functionality preserved.
import fs from 'node:fs';
import { chromium } from 'playwright';

const target=process.env.LOCAL_URL||process.env.APP_URL||'https://floodguard-user.onrender.com';
const norm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');

function staticAudit(){
  const hide=fs.readFileSync('site-hide-ev-v50.css','utf8');
  const pages=fs.readFileSync('site-pages.css','utf8');
  const ev=fs.readFileSync('ev.html','utf8');
  const sw=fs.readFileSync('sw.js','utf8');
  const app=fs.readFileSync('app-core.html','utf8');
  if(!/ev\.html/.test(hide)||!pages.includes('site-hide-ev-v50.css'))throw new Error('EV hide stylesheet is not wired');
  if(!/location\.replace\(['"]\.\/features\.html/.test(ev))throw new Error('Public EV page does not redirect');
  if(!/floodguard-user-v50-hide-public-ev/.test(sw)||!sw.includes('site-hide-ev-v50.css'))throw new Error('v50 service worker not wired');
  if(!/Trạm sạc|EV/i.test(app))throw new Error('Authenticated app EV functionality appears to be missing');
  console.log('STATIC_V50_OK');
}

async function probe(page,label){
  const r=await page.evaluate(async()=>{const a=[];let t=performance.now();for(let i=0;i<30;i++){await new Promise(x=>setTimeout(x,20));const n=performance.now();a.push(n-t-20);t=n}a.sort((x,y)=>x-y);return{p95:a[Math.floor(a.length*.95)]||0,max:Math.max(...a)}});
  console.log('EVENT_LOOP_'+label,JSON.stringify(r));
  if(r.p95>250||r.max>1200)throw new Error(label+' main thread unresponsive');
}

async function run(){
  staticAudit();
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});

  const home=await context.newPage();
  let r=await home.goto(target+'/',{waitUntil:'domcontentloaded',timeout:90000});
  if(!r||r.status()>=400)throw new Error('Homepage HTTP failure');
  await home.waitForTimeout(1200);
  if(!await home.locator('#fgWebsiteHome').isVisible().catch(()=>false))throw new Error('Homepage hidden');
  const visibleEvLinks=await home.locator('a[href$="ev.html"]:visible').count();
  if(visibleEvLinks!==0)throw new Error('Public EV link still visible on homepage');
  const navText=norm((await home.locator('#fgWebsiteHome .wh-links').innerText().catch(()=>'')));
  if(navText.includes('trạm sạc ev'))throw new Error('EV page still visible in homepage navigation');
  await probe(home,'HOME');

  const pages=['problem.html','features.html','how-it-works.html','alerts.html','rescue.html','about.html'];
  for(const path of pages){
    const p=await context.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.message||e)));
    const rr=await p.goto(target+'/'+path,{waitUntil:'domcontentloaded',timeout:90000});
    if(!rr||rr.status()>=400)throw new Error(path+' HTTP failure');
    await p.waitForTimeout(700);
    if(await p.locator('a[href$="ev.html"]:visible').count()!==0)throw new Error(path+' still exposes EV page link');
    const serious=errs.filter(x=>!/(ResizeObserver loop|Failed to fetch|NetworkError|Load failed)/i.test(x));
    if(serious.length)throw new Error(path+' JS errors: '+serious.join(' | '));
    await probe(p,path.replace(/\W/g,'_').toUpperCase());
    await p.close();
  }

  const ev=await context.newPage();
  await ev.goto(target+'/ev.html',{waitUntil:'domcontentloaded',timeout:90000});
  await ev.waitForURL(/features\.html$/,{timeout:5000});
  if(!/features\.html$/.test(ev.url()))throw new Error('EV public page did not redirect to Features');

  const app=await context.newPage();
  r=await app.goto(target+'/app-core.html',{waitUntil:'domcontentloaded',timeout:90000});
  if(!r||r.status()>=400)throw new Error('app-core HTTP failure');
  await app.waitForTimeout(1800);await probe(app,'APP');

  const login=await context.newPage();
  r=await login.goto(target+'/?login=1',{waitUntil:'domcontentloaded',timeout:90000});
  if(!r||r.status()>=400)throw new Error('Login HTTP failure');
  await login.waitForTimeout(500);
  if(!await login.locator('#loginEmail').isVisible().catch(()=>false))throw new Error('Login form hidden');
  await login.locator('#loginEmail').fill('smoke.test@example.com');
  if(await login.locator('#loginEmail').inputValue()!=='smoke.test@example.com')throw new Error('Login unresponsive');

  await browser.close();
  console.log('PUBLIC_EV_HIDDEN_V50_OK');
}
run().catch(e=>{console.error('DESKTOP_SMOKE_FAILED',e);process.exit(1)});
