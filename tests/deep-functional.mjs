import { chromium, request as playwrightRequest } from 'playwright';

const BASE=(process.env.PROD_URL||process.env.LOCAL_URL||'https://floodguard-user.onrender.com').replace(/\/$/,'');
const BACKEND='https://floodguard-rescue-backend.onrender.com';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await ctx.newPage();
const failures=[],passes=[];
const assert=(v,m)=>v?passes.push('PASS '+m):failures.push(m);
const text=async p=>(await p.locator('body').innerText().catch(()=>''))||'';
page.on('pageerror',e=>failures.push('JS error: '+e.message));

// 1. Google Login: verify the button really initiates Supabase Google OAuth.
await page.goto(BASE+'/?login=1',{waitUntil:'domcontentloaded',timeout:45000});
const google=page.locator('.google-btn').first();
assert(await google.isVisible().catch(()=>false),'Google Login button visible');
let oauthSeen=false;
page.on('request',r=>{if(/\/auth\/v1\/authorize/i.test(r.url())&&/provider=google/i.test(r.url()))oauthSeen=true});
await page.route('**/auth/v1/authorize**',async r=>{if(/provider=google/i.test(r.request().url()))oauthSeen=true;await r.abort()});
if(await google.isVisible().catch(()=>false)){await google.click().catch(()=>{});await page.waitForTimeout(1800)}
assert(oauthSeen,'Google Login initiates Supabase Google OAuth');
await page.unroute('**/auth/v1/authorize**').catch(()=>{});

// 2. Map.
await page.goto(BASE+'/app-core.html',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForTimeout(5000);
const map=page.locator('.map').first(),box=await map.boundingBox().catch(()=>null);
assert(await map.isVisible().catch(()=>false),'Map container visible');
assert(!!box&&box.width>400&&box.height>250,'Map has usable dimensions');
assert((await page.locator('.leaflet-map-pane,.leaflet-tile-pane,.leaflet-container').count().catch(()=>0))>0,'Leaflet map initialized');

// 3. Prediction: call the real in-browser prediction engine.
const model=await page.evaluate(()=>{const m=window.FG15MultiModel;if(!m||typeof m.predict!=='function')return{available:false};for(const street of ['Thảo Điền','Nguyễn Hữu Cảnh','Điện Biên Phủ','Võ Văn Ngân']){try{const low=m.predict(street,20,null),high=m.predict(street,100,null);if(low&&high&&Number.isFinite(Number(low.ensemble))&&Number.isFinite(Number(high.ensemble)))return{available:true,street,low:Number(low.ensemble),high:Number(high.ensemble)}}catch(_){}}return{available:true,noResult:true}}).catch(()=>({available:false}));
assert(model.available,'Prediction engine available');
assert(!model.noResult&&Number.isFinite(model.low)&&Number.isFinite(model.high),'Prediction returns finite result');
if(!model.noResult){assert(model.low>=0&&model.high>=0,'Prediction depth is non-negative');passes.push(`MODEL ${model.street}: 20mm=${model.low}, 100mm=${model.high}`)}

// 4. Route: exercise UI when route controls are discoverable.
const inputs=page.locator('input:visible');
const meta=await inputs.evaluateAll(es=>es.map((e,i)=>({i,s:[e.placeholder,e.getAttribute('aria-label'),e.id,e.name].filter(Boolean).join(' ')}))).catch(()=>[]);
const a=meta.find(x=>/(điểm đi|xuất phát|origin|from)/i.test(x.s)),b=meta.find(x=>/(điểm đến|destination|to)/i.test(x.s));
const routeBtn=page.getByRole('button',{name:/Đường đi|Tìm đường|Route/i}).first();
const routeUi=!!a&&!!b&&await routeBtn.isVisible().catch(()=>false);
assert(routeUi||/Đường đi|Tìm đường|Điểm đi|Điểm đến/i.test(await text(page)),'Route module UI present');
if(routeUi){await inputs.nth(a.i).fill('Thảo Điền, TP.HCM');await inputs.nth(b.i).fill('Quận 1, TP.HCM');await routeBtn.click().catch(()=>{});await page.waitForTimeout(12000);const s=await page.evaluate(()=>window.FG70_ROUTE_STATE?{n:Array.isArray(window.FG70_ROUTE_STATE.analyses)?window.FG70_ROUTE_STATE.analyses.length:0}:null).catch(()=>null);assert(!!s&&s.n>0,'Route search produces analyzed route state')}

// 5. EV.
const appText=await text(page);
assert(/Trạm sạc|EV/i.test(appText),'EV charging capability present in app');
assert((await page.locator('button:visible,a:visible').filter({hasText:/EV|trạm sạc|trạm thay thế/i}).count().catch(()=>0))>0||/trạm thay thế|trạm sạc/i.test(appText),'EV station/alternative UI exposed');

// 6. Alerts / Watchlist: verify mount and safe auth boundary without mutating production data.
await page.waitForTimeout(1800);
assert((await page.locator('#fg40Watch').count())>0,'Watchlist component mounts');
const add=page.locator('#fg40Add');
if(await add.count()){await page.evaluate(()=>{window.FG70_ROUTE_STATE={from:'QA A',to:'QA B',travelMode:'car',start:{lat:10.78,lon:106.70},end:{lat:10.79,lon:106.71},selectedIndex:0,analyses:[{index:0,exposureKm:0,unique:[{street:'Thảo Điền'}],route:{geometry:{coordinates:[[106.70,10.78],[106.71,10.79]]}}}]};document.dispatchEvent(new CustomEvent('fg70:route',{detail:window.FG70_ROUTE_STATE}))});await page.waitForTimeout(400);await add.click().catch(()=>{});await page.waitForTimeout(1000);assert(/đăng nhập|login/i.test(await page.locator('#fg40State').innerText().catch(()=>'')),'Watchlist blocks unauthenticated write clearly')}

// 7. SOS / Rescue: do not create a false emergency in production.
const rescue=await ctx.newPage(),rr=await rescue.goto(BASE+'/rescue.html',{waitUntil:'domcontentloaded',timeout:45000});
assert(!!rr&&rr.ok(),'Rescue page loads');assert(/SOS|cứu hộ|hỗ trợ/i.test(await text(rescue)),'Rescue flow discoverable');await rescue.close();
assert(/SOS|cứu hộ|rescue/i.test(await text(page)),'SOS capability present in app');

// 8. Admin: UI and destructive endpoint must enforce auth.
const admin=await ctx.newPage(),ar=await admin.goto(BASE+'/admin.html',{waitUntil:'domcontentloaded',timeout:45000});
assert(!!ar&&ar.ok(),'Admin page loads');await admin.waitForTimeout(1200);assert(/đăng nhập|admin|quản trị|không có quyền|unauthorized/i.test(await text(admin)),'Admin UI has auth/authorization boundary');await admin.close();
const api=await playwrightRequest.newContext();
const del=await api.delete(BACKEND+'/api/admin/users/00000000-0000-4000-8000-000000000001',{timeout:30000});assert([401,403].includes(del.status()),'Admin delete rejects unauthenticated request');
const cfg=await api.get(BACKEND+'/api/public-config',{timeout:30000});assert(cfg.ok(),'Backend public config healthy');
const otp=await api.get(BACKEND+'/api/auth/password-otp/status',{timeout:30000});assert(otp.ok(),'Password recovery status healthy');
await api.dispose();

await browser.close();
console.log(passes.join('\n'));
if(failures.length){console.error('\nDEEP_FUNCTIONAL_FAILURES');for(const f of failures)console.error('- '+f);process.exit(1)}
console.log('DEEP_FUNCTIONAL_QA_OK');
