const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.setContent('<meta name="viewport" content="width=device-width, initial-scale=1"><body class="cg-page-body"><main data-community-page></main></body>');
 await page.addStyleTag({content:fs.readFileSync(__dirname+'/community.css','utf8')});
 await page.evaluate(()=>{
  window.confirm=()=>true;window.posts=[];let balance=65;let owned=[];
  Object.defineProperty(window.crypto,'randomUUID',{value:()=> '11111111-1111-4111-8111-111111111111'});
  window.FGCommunityAPI=async(path,options={})=>{
   if(path.endsWith('/me'))return {authenticated:true,admin:true,points:balance,earned:60,badge:'Người đóng góp',tiers:[{threshold:30,name:'Người đóng góp',bonus:5,achieved:true,claimed:true},{threshold:100,name:'Người đồng hành',bonus:15,achieved:false,claimed:false}],history:[]};
   if(path.endsWith('/rewards'))return {vouchers:[{sku:'trial-50',title:'Voucher trải nghiệm',description:'Thử nghiệm',cost:50,validity_days:30,demo:true},{sku:'trial-100',title:'Voucher cộng đồng',description:'Thử nghiệm',cost:100,validity_days:30,demo:true}],redemptions:owned};
   if(path.endsWith('/redeem')){window.posts.push(JSON.parse(options.body));await new Promise(r=>setTimeout(r,100));balance-=50;owned=[{title:'Voucher trải nghiệm',code:'FG-TEST-EXAMPLE',cost:50,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+86400000).toISOString()}];return{message:'Đã đổi voucher thử nghiệm.',voucher:owned[0]}};
   return {reports:[]};
  };
 });
 await page.addScriptTag({content:fs.readFileSync(__dirname+'/community.js','utf8')});
 await page.waitForFunction(()=>document.querySelector('#cgPoints').textContent==='65');
 assert.equal(await page.locator('[data-mode="review"], [data-review], #cgReviewTab').count(),0);
 await page.locator('[data-mode="rewards"]').click();await page.waitForSelector('[data-redeem="trial-50"]');
 assert.equal(await page.locator('[data-redeem="trial-50"]').isDisabled(),false);assert.equal(await page.locator('[data-redeem="trial-100"]').isDisabled(),true);
 await page.locator('[data-redeem="trial-50"]').click();await page.waitForFunction(()=>document.querySelector('#cgPoints').textContent==='15');
 assert.equal(await page.evaluate(()=>window.posts.length),1);assert.equal(await page.locator('[data-redeem="trial-50"]').isDisabled(),true);
 assert.match(await page.locator('#cgMyVouchers').textContent(),/FG-TEST-EXAMPLE/);assert.equal(await page.locator('#cgBadge').textContent(),'Người đóng góp');assert.match(await page.locator('#cgRewardStatus').textContent(),/thử nghiệm/);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);assert.equal(overflow,false);
 console.log('Passed: no user-side review even for admin, mobile layout, voucher thresholds, deduction feedback, owned code and retained badge.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
