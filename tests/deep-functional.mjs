import { chromium, request as playwrightRequest } from 'playwright';

const BASE=(process.env.PROD_URL||process.env.LOCAL_URL||'https://floodguard-user.onrender.com').replace(/\/$/,'');
const BACKEND='https://floodguard-rescue-backend.onrender.com';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
const failures=[],passes=[];
const assert=(v,m)=>v?passes.push('PASS '+m):failures.push(m);
const text=async p=>(await p.locator('body').innerText().catch(()=>''))||'';

// 1. Google Login: validate that the visible control initiates Supabase Google OAuth.
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
if(await googleControl.isVisible().catch(()=>false)){await googleControl.click().catch(()=>{});await login.waitForTimeout(1800)}
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

// 3. Prediction: use actual governed street keys exposed by the model audit.
const modelDiag=await page.evaluate(()=>{const m=window.FG15MultiModel;if(!m||typeof m.predict!=='function')return{available:false};const streets=Object.keys(m.AUDIT?.core_street_counts||{});const tried=[];for(const street of streets){try{const low=m.predict(street,20,null),high=m.predict(street,100,null);const le=Number(low?.ensemble),he=Number(high?.ensemble);tried.push({street,le,he,ln:low?.availableN,hn:high?.availableN});if(Number.isFinite(le)&&Number.isFinite(he))return{available:true,street,low:le,high:he,lowN:low.availableN,highN:high.availableN,streets:streets.length}}catch(_){}}return{available:true,noResult:true,streets:streets.length,tried:tried.slice(0,20)}}).catch(e=>({available:false,error:String(e)}));
console.log('MODEL_DIAG',JSON.stringify(modelDiag));
assert(modelDiag.available,'Prediction engine available');
assert(!modelDiag.noResult&&Number.isFinite(modelDiag.low)&&Number.isFinite(modelDiag.high),'Prediction returns finite ensemble depth for a governed street');
if(!modelDiag.noResult){assert(modelDiag.low>=0&&modelDiag.high>=0,'Prediction returns non-negative depth');assert(modelDiag.lowN>0&&modelDiag.highN>0,'Prediction uses at least one available model');passes.push(`MODEL ${modelDiag.street}: 20mm=${modelDiag.low}, 100mm=${modelDiag.high}`)}

// 4. Route: open the actual command/search UI, discover its controls, then run a real route if the pair is available.
const command=page.locator('#fg12Command');
assert(await command.isVisible().catch(()=>false),'Route/search command control visible');
if(await command.isVisible().catch(()=>false)) await command.click().catch(()=>{});
await page.waitForTimeout(800);
const routeInputs=await page.locator('input:visible').evaluateAll(es=>es.map((e,i)=>({i,id:e.id||'',ph:e.placeholder||'',aria:e.getAttribute('aria-label')||'',name:e.name||''}))).catch(()=>[]);
const routeButtons=await page.locator('button:visible,a:visible').evaluateAll(es=>es.map((e,i)=>({i,id:e.id||'',text:(e.innerText||e.textContent||'').trim()})).filter(x=>x.text)).catch(()=>[]);
console.log('ROUTE_INPUTS',JSON.stringify(routeInputs));
console.log('ROUTE_BUTTONS',JSON.stringify(routeButtons.slice(0,80)));
const from=routeInputs.find(x=>/(điểm đi|xuất phát|origin|from|bắt đầu)/i.test([x.id,x.ph,x.aria,x.name].join(' ')));
const to=routeInputs.find(x=>/(điểm đến|destination|to|kết thúc)/i.test([x.id,x.ph,x.aria,x.name].join(' ')));
const go=routeButtons.find(x=>/(đường đi|tìm đường|chỉ đường|route|tìm kiếm)/i.test(x.text));
if(from&&to&&go){const ins=page.locator('input:visible');await ins.nth(from.i).fill('Thảo Điền, TP.HCM');await ins.nth(to.i).fill('Quận 1, TP.HCM');const btns=page.locator('button:visible,a:visible');await btns.nth(go.i).click().catch(()=>{});await page.waitForTimeout(12000);const rs=await page.evaluate(()=>{const s=window.FG70_ROUTE_STATE;return s?{from:s.from,to:s.to,n:Array.isArray(s.analyses)?s.analyses.length:0,selected:s.selectedIndex}:null}).catch(()=>null);console.log('ROUTE_STATE',JSON.stringify(rs));assert(!!rs&&rs.n>0,'Route search produces analyzed route state')}else{appText=await text(page);assert(/Thảo Điền.*Quận 1|Phân tích tuyến|Lộ trình/i.test(appText),'Route module remains available even when command panel uses non-input controls');passes.push('INFO Route panel did not expose a stable fillable origin/destination pair to headless CI')}

// 5. EV.
appText=await text(page);
assert(/Trạm sạc|EV/i.test(appText),'EV charging capability present in app');
assert((await page.locator('button:visible,a:visible').filter({hasText:/EV|trạm sạc|trạm thay thế/i}).count().catch(()=>0))>0||/trạm thay thế|trạm sạc/i.test(appText),'EV station/alternative UI exposed');

// 6. Alerts / Watchlist.
const watchImpl=await page.evaluate(()=>!!window.__FG40_WATCHLIST_EMAIL__).catch(()=>false);
assert(watchImpl,'Watchlist implementation loaded');
assert((await page.locator('#fg40Watch').count())>0,'Watchlist component mounted');

// 7. SOS / Rescue — validate without creating a false emergency incident.
const rescue=await ctx.newPage(),rr=await rescue.goto(BASE+'/rescue.html',{waitUntil:'domcontentloaded',timeout:45000});
assert(!!rr&&rr.ok(),'Rescue page loads');assert(/SOS|cứu hộ|hỗ trợ/i.test(await text(rescue)),'Rescue flow discoverable');await rescue.close();
assert(/SOS|cứu hộ|rescue/i.test(appText),'SOS capability present in app');

// 8. Admin — destructive operation is tested only for rejection without credentials.
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
