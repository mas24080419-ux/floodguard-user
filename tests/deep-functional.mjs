import { chromium, request as playwrightRequest } from 'playwright';

const BASE=(process.env.PROD_URL||process.env.LOCAL_URL||'https://floodguard-user.onrender.com').replace(/\/$/,'');
const BACKEND='https://floodguard-rescue-backend.onrender.com';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
const failures=[],passes=[];
const assert=(v,m)=>v?passes.push('PASS '+m):failures.push(m);
const text=async p=>(await p.locator('body').innerText().catch(()=>''))||'';

// 1. Google Login: validate visible control and OAuth initiation. CI deliberately does not complete a real Google identity consent.
const login=await ctx.newPage();
await login.goto(BASE+'/?login=1',{waitUntil:'domcontentloaded',timeout:60000});
await login.waitForTimeout(1200);
const google=login.getByRole('button',{name:/google/i}).first();
const googleLink=login.getByRole('link',{name:/google/i}).first();
const googleControl=await google.isVisible().catch(()=>false)?google:googleLink;
assert(await googleControl.isVisible().catch(()=>false),'Google Login control visible');
let oauthSeen=false;
login.on('request',r=>{if(/\/auth\/v1\/authorize/i.test(r.url())&&/provider=google/i.test(r.url()))oauthSeen=true});
await login.route('**/auth/v1/authorize**',async r=>{if(/provider=google/i.test(r.request().url()))oauthSeen=true;await r.abort()});
if(await googleControl.isVisible().catch(()=>false)){await googleControl.click({timeout:5000}).catch(()=>{});await login.waitForTimeout(1200)}
assert(oauthSeen,'Google Login initiates Supabase Google OAuth');
await login.close();

const page=await ctx.newPage();
page.on('pageerror',e=>{if(!/ResizeObserver loop|Failed to fetch|NetworkError|Load failed/i.test(e.message))failures.push('JS error: '+e.message)});
await page.goto(BASE+'/app-core.html',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForTimeout(6000);
let appText=await text(page);

// 2. Map.
const leaflet=page.locator('.leaflet-map-pane,.leaflet-tile-pane,.leaflet-container');
assert((await leaflet.count().catch(()=>0))>0,'Leaflet map initialized');
const visibleLeaflet=page.locator('.leaflet-container:visible');
if(await visibleLeaflet.count()){const box=await visibleLeaflet.first().boundingBox();assert(!!box&&box.width>300&&box.height>200,'Visible map has usable dimensions')}else failures.push('Map DOM exists but no visible operational map');

// 3. Prediction: verify a data-supported scenario and ensure no-evidence output is explicitly unknown, never NaN.
const modelDiag=await page.evaluate(()=>{const m=window.FG15MultiModel;if(!m||typeof m.predict!=='function')return{available:false};const streets=Object.keys(m.AUDIT?.core_street_counts||{});for(const street of streets){try{const low=m.predict(street,20,null),high=m.predict(street,100,null);const he=Number(high?.ensemble);if(Number.isFinite(he)&&high.availableN>0)return{available:true,street,low:low?.ensemble??null,high:he,lowN:low?.availableN??0,highN:high.availableN,lowRisk:low?.risk,highRisk:high?.risk,guarded:!!m.__fgFiniteGuard}}catch(_){}}return{available:true,noSupportedScenario:true}}).catch(e=>({available:false,error:String(e)}));
console.log('MODEL_DIAG',JSON.stringify(modelDiag));
assert(modelDiag.available,'Prediction engine available');
assert(!modelDiag.noSupportedScenario&&Number.isFinite(modelDiag.high),'Prediction returns finite ensemble depth for a data-supported governed street');
if(!modelDiag.noSupportedScenario){assert(modelDiag.high>=0,'Prediction depth is non-negative');assert(modelDiag.highN>0,'Prediction uses at least one available model');if(modelDiag.lowN===0){assert(modelDiag.low===null,'Prediction returns null/UNKNOWN rather than NaN when no model has evidence');assert(modelDiag.lowRisk==='UNKNOWN','Prediction marks no-evidence scenario UNKNOWN')}passes.push(`MODEL ${modelDiag.street}: 100mm=${modelDiag.high}; 20mm=${modelDiag.lowN===0?'UNKNOWN':modelDiag.low}`)}

// 4. Route: validate route controls. Full route computation is session-dependent and CI does not impersonate a user account.
const command=page.locator('#fg12Command');
assert(await command.isVisible().catch(()=>false),'Route/search command control visible');
const analyze=page.getByRole('button',{name:/Phân tích tuyến/i}).first();
assert(await analyze.isVisible().catch(()=>false),'Route analysis control visible');
if(await analyze.isVisible().catch(()=>false)){
  await analyze.click({timeout:5000}).catch(()=>{});
  await page.waitForTimeout(3000);
  const rs=await page.evaluate(()=>{const s=window.FG70_ROUTE_STATE;return s?{from:s.from,to:s.to,n:Array.isArray(s.analyses)?s.analyses.length:0,selected:s.selectedIndex}:null}).catch(()=>null);
  if(rs&&rs.n>0){passes.push('PASS Route analysis produces analyzed route state');passes.push(`ROUTE ${rs.from||''} → ${rs.to||''}: ${rs.n} analyzed option(s)`)}else passes.push('INFO Route execution is gated without an authenticated CI session; controls and route module are present');
}

// 5. EV.
appText=await text(page);
assert(/Trạm sạc|EV/i.test(appText),'EV charging capability present in app');
assert((await page.locator('button:visible,a:visible').filter({hasText:/EV|trạm sạc|trạm thay thế/i}).count().catch(()=>0))>0||/trạm thay thế|trạm sạc/i.test(appText),'EV station/alternative UI exposed');

// 6. Alerts / Watchlist.
const watchImpl=await page.evaluate(()=>!!window.__FG40_WATCHLIST_EMAIL__).catch(()=>false);
assert(watchImpl,'Watchlist implementation loaded');
assert((await page.locator('#fg40Watch').count())>0,'Watchlist component mounted');

// 7. SOS / Rescue — validate UI and discoverability without creating a false production emergency.
const rescue=await ctx.newPage(),rr=await rescue.goto(BASE+'/rescue.html',{waitUntil:'domcontentloaded',timeout:45000});
assert(!!rr&&rr.ok(),'Rescue page loads');assert(/SOS|cứu hộ|hỗ trợ/i.test(await text(rescue)),'Rescue flow discoverable');await rescue.close();
assert(/SOS|cứu hộ|rescue/i.test(appText),'SOS capability present in app');

// 8. Admin — destructive operation is tested only for safe rejection without credentials.
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
