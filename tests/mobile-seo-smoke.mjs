import fs from 'node:fs';
import { chromium } from 'playwright';

const target=process.env.LOCAL_URL||process.env.APP_URL||'https://floodguard-user.onrender.com';

function staticAudit(){
  const robots=fs.readFileSync('robots.txt','utf8');
  const sitemap=fs.readFileSync('sitemap.xml','utf8');
  if(!robots.includes('Disallow: /admin.html')||!robots.includes('Disallow: /accounts.html')) throw new Error('Private pages are not excluded from robots.txt');
  for(const page of ['data.html','faq.html','contact.html']){
    if(!sitemap.includes('/'+page)) throw new Error('sitemap.xml missing '+page);
    const html=fs.readFileSync(page,'utf8');
    if(!/<meta\s+name="description"/i.test(html)) throw new Error(page+' missing meta description');
    if(!/<link\s+rel="canonical"/i.test(html)) throw new Error(page+' missing canonical');
    if((html.match(/<h1\b/gi)||[]).length!==1) throw new Error(page+' must have exactly one H1');
  }
  console.log('STATIC_SEO_OK');
}

async function checkPage(page,path){
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||e)));
  const r=await page.goto(target+'/'+path,{waitUntil:'domcontentloaded',timeout:90000});
  if(!r||r.status()>=400) throw new Error(path+' HTTP failure');
  await page.waitForTimeout(300);
  const metrics=await page.evaluate(()=>({
    sw:document.documentElement.scrollWidth,
    cw:document.documentElement.clientWidth,
    h1:document.querySelectorAll('h1').length,
    title:document.title.trim()
  }));
  if(metrics.sw>metrics.cw+3) throw new Error(path+' horizontal overflow '+metrics.sw+'>'+metrics.cw);
  if(metrics.h1!==1) throw new Error(path+' expected exactly one H1, got '+metrics.h1);
  if(!metrics.title) throw new Error(path+' missing title');
  const serious=errors.filter(x=>!/(ResizeObserver loop|Failed to fetch|NetworkError|Load failed)/i.test(x));
  if(serious.length) throw new Error(path+' JS errors: '+serious.join(' | '));
}

async function run(){
  staticAudit();
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  for(const path of ['problem.html','features.html','how-it-works.html','alerts.html','rescue.html','about.html','data.html','faq.html','contact.html']){
    const p=await context.newPage();
    await checkPage(p,path);
    await p.close();
  }
  const login=await context.newPage();
  let r=await login.goto(target+'/?login=1',{waitUntil:'domcontentloaded',timeout:90000});
  if(!r||r.status()>=400) throw new Error('Login HTTP failure');
  await login.waitForTimeout(500);
  const email=login.locator('#loginEmail');
  if(!await email.isVisible().catch(()=>false)) throw new Error('Mobile login form hidden');
  await email.fill('mobile.test@example.com');
  if(await email.inputValue()!=='mobile.test@example.com') throw new Error('Mobile login input unresponsive');
  const overflow=await login.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+3);
  if(overflow) throw new Error('Mobile login has horizontal overflow');
  await browser.close();
  console.log('MOBILE_SEO_SMOKE_OK');
}

run().catch(e=>{console.error('MOBILE_SEO_SMOKE_FAILED',e);process.exit(1)});
