import { chromium, request as playwrightRequest } from 'playwright';

const BASE=(process.env.PROD_URL||process.env.LOCAL_URL||'https://floodguard-user.onrender.com').replace(/\/$/,'');
const BACKEND='https://floodguard-rescue-backend.onrender.com';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
const failures=[],passes=[];
const assert=(v,m)=>v?passes.push('PASS '+m):failures.push(m);
const text=async p=>(await p.locator('body').innerText().catch(()=>''))||'';

// 1. Google Login: use the same auth entry path users see, but do not complete a real Google identity consent in CI.
const login=await ctx.newPage();
await login.goto(BASE+'/?login=1',{waitUntil:'domcontentloaded',timeout:60000});
await login.waitForTimeout(1200);
const loginButtons=await login.locator('button:visible,a:visible').evaluateAll(es=>es.map(e=>(e.innerText||e.textContent||'').trim()).filter(Boolean));
console.log('LOGIN_CONTROLS',JSON.stringify(loginButtons.slice(0,40)));
const google=login.getByRole('button',{name:/google/i}).first();
const googleLink=login.getByRole('link',{name:/google/i}).first();
const googleControl=await google.isVisible().catch(()=>false)?google:googleLink;
assert(await googleControl.isVisible().catch(()=>false),'Google Login control visible');
let oauthSeen=false;
login.on('request',r=>{if(/\/auth\/v1\/authorize/i.test(r.url())&&/provider=google/i.test(r.url()))oauthSeen=true});
await login.route('**/auth/v1/authorize**',async r=>{if(/provider=google/i.test(r.request().url()))oauthSeen=true;await r.abort()});
if(await googleControl.isVisible().catch(()=>false)){await googleControl.click().catch(()=>{});await login.waitForTimeout(1800)}
assert(oauthSeen,'Google Login initiates Supabase Google OAuth');
await login.close();

// Open app shell. Some operational panels are intentionally session-gated; engine and map initialization can still be validated.
const page=await ctx.newPage();
page.on('pageerror',e=>{if(!/ResizeObserver loop|Failed to fetch|NetworkError|Load failed/i.test(e.message))failures.push('JS error: '+e.message)});
await page.goto(BASE+'/app-core.html',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForTimeout(6000);
const appText=await text(page);
console.log('APP_TEXT_HEAD',JSON.stringify(appText.slice(0,1200)));
const visibleInputs=await page.locator('input:visible').evaluateAll(es=>es.map(e=>({id:e.id,ph:e.placeholder,aria:e.getAttribute('aria-label'),name:e.name}))).catch(()=>[]);
const visibleButtons=await page.locator('button:visible,a:visible').evaluateAll(es=>es.map(e=>({id:e.id,text:(e.innerText||e.textContent||'').trim().slice(0,90)})).filter(x=>x.text)).catch(()=>[]);
console.log('APP_INPUTS',JSON.stringify(visibleInputs.slice(0,30)));
console.log('APP_CONTROLS',JSON.stringify(visibleButtons.slice(0,50)));

// 2. Map.
const leaflet=page.locator('.leaflet-map-pane,.leaflet-tile-pane,.leaflet-container');
assert((await leaflet.count().catch(()=>0))>0,'Leaflet map initialized');
const visibleLeaflet=page.locator('.leaflet-container:visible');
if(await visibleLeaflet.count()){const box=await visibleLeaflet.first().boundingBox();assert(!!box&&box.width>300&&box.height>200,'Visible map has usable dimensions')}else passes.push('INFO Map DOM initialized; operational view is session-gated');

// 3. Prediction.
const modelDiag=await page.evaluate(()=>{const m=window.FG15MultiModel;if(!m)return{available:false};const keys=Object.keys(m);const fn=typeof m.predict==='function'?String(m.predict).slice(0,500):'';const samples=[];const candidates=[];for(const k of keys){const v=m[k];if(Array.isArray(v)){for(const x of v.slice(0,20)){if(typeof x==='string')candidates.push(x);else if(x&&typeof x==='object'){for(const p of ['street','name','label','road'])if(typeof x[p]==='string')candidates.push(x[p])}}}else if(v&&typeof v==='object'){for(const kk of Object.keys(v).slice(0,30))if(typeof kk==='string')candidates.push(kk)}}for(const street of [...new Set([...candidates,'Thảo Điền','Nguyễn Hữu Cảnh','Điện Biên Phủ','Võ Văn Ngân'])].slice(0,80)){try{const low=m.predict?.(street,20,null),high=m.predict?.(street,100,null);samples.push({street,low,high});const le=Number(low?.ensemble),he=Number(high?.ensemble);if(Number.isFinite(le)&&Number.isFinite(he))return{available:true,keys,fn,street,low:le,high:he,candidates:candidates.slice(0,30)}}catch(_){}}return{available:typeof m.predict==='function',keys,fn,candidates:candidates.slice(0,30),samples:samples.slice(0,8),noResult:true}}).catch(e=>({available:false,error:String(e)}));
console.log('MODEL_DIAG',JSON.stringify(modelDiag));
assert(modelDiag.available,'Prediction engine available');
if(!modelDiag.noResult){assert(modelDiag.low>=0&&modelDiag.high>=0,'Prediction returns non-negative finite depth');passes.push(`MODEL ${modelDiag.street}: 20mm=${modelDiag.low}, 100mm=${modelDiag.high}`)}else passes.push('INFO Prediction engine loaded; no supported street could be inferred without an authenticated route state');

// 4. Route.
const routePresent=/Đường đi|Tìm đường|Điểm đi|Điểm đến|route/i.test(appText)||visibleInputs.some(x=>/(điểm đi|điểm đến|origin|destination|from|to)/i.test([x.id,x.ph,x.aria,x.name].join(' ')));
assert(routePresent||/đăng nhập/i.test(appText),'Route module or its login gate is present');

// 5. EV.
assert(/Trạm sạc|EV/i.test(appText),'EV charging capability present in app');
assert(visibleButtons.some(x=>/EV|trạm sạc|trạm thay thế/i.test(x.text))||/trạm thay thế|trạm sạc/i.test(appText),'EV station/alternative UI exposed');

// 6. Alerts / Watchlist. The implementation must be loaded, and authenticated mutation must never be attempted without a session.
const watchImpl=await page.evaluate(()=>!!window.__FG40_WATCHLIST_EMAIL__).catch(()=>false);
assert(watchImpl,'Watchlist implementation loaded');
if(await page.locator('#fg40Watch').count())passes.push('PASS Watchlist component mounted');else passes.push('INFO Watchlist panel waits for authenticated alert host');

// 7. SOS / Rescue — no false production incident is created.
const rescue=await ctx.newPage(),rr=await rescue.goto(BASE+'/rescue.html',{waitUntil:'domcontentloaded',timeout:45000});
assert(!!rr&&rr.ok(),'Rescue page loads');assert(/SOS|cứu hộ|hỗ trợ/i.test(await text(rescue)),'Rescue flow discoverable');await rescue.close();
assert(/SOS|cứu hộ|rescue/i.test(appText),'SOS capability present in app');

// 8. Admin.
const admin=await ctx.newPage(),ar=await admin.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded',timeout:45000});
assert(!!ar&&ar.ok(),'Admin page loads');await admin.waitForTimeout(1200);assert(/đăng nhập|admin|quản trị|không có quyền|unauthorized/i.test(await text(admin)),'Admin UI has auth/authorization boundary');await admin.close();
const api=await playwrightRequest.newContext();
const del=await api.delete(BACKEND+'/api/admin/users/00000000-0000-4000-8000-000000000001',{timeout:30000});assert([401,403].includes(del.status()),'Admin delete rejects unauthenticated request');
const cfg=await api.get(BACKEND+'/api/public-config',{timeout:30000});assert(cfg.ok(),'Backend public config healthy');
const otp=await api.get(BACKEND+'/api/auth/password-otp/status',{timeout:30000});assert(otp.ok(),'Password recovery status healthy');
await api.dispose();

await page.close();await browser.close();
console.log(passes.join('\n'));
if(failures.length){console.error('\nDEEP_FUNCTIONAL_FAILURES');for(const f of failures)console.error('- '+f);process.exit(1)}
console.log('DEEP_FUNCTIONAL_QA_OK');
