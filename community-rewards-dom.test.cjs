const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nodes=new Map();
class Element{
 constructor(){this.dataset={};this.hidden=false;this.value='';this.events={};this.classList={toggle(){}};this.buttons=[];}
 set innerHTML(v){this.html=v;for(const m of v.matchAll(/id="([^"]+)"/g))if(!nodes.has(m[1]))nodes.set(m[1],new Element());this.buttons=Array.from(v.matchAll(/data-redeem="([^"]+)" data-cost="(\d+)"([^>]*)/g),m=>Object.assign(new Element(),{dataset:{redeem:m[1],cost:m[2]},disabled:m[3].includes('disabled')}));}
 querySelector(s){return nodes.get(s.slice(1))} querySelectorAll(s){return s==='[data-redeem]'?nodes.get('cgVoucherCatalog')?.buttons||[]:[]}
 showModal(){this.open=true} close(){this.open=false} appendChild(e){(this.children||(this.children=[])).push(e)} addEventListener(k,fn){this.events[k]=fn} closest(){return this} hasAttribute(){return false} setAttribute(){} removeAttribute(){} scrollIntoView(){} focus(){}
}
const main=new Element(),storage=new Map();let points=65,owned=[],posts=[];
const body=new Element();const document={body,createElement:()=>new Element(),querySelector:s=>s==='[data-community-page]'?main:null};
const window={confirm:()=>true,crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},FGCommunityAPI:async(path,opts={})=>{
 if(path.endsWith('/me'))return{authenticated:true,admin:true,points,earned:60,badge:'Người đóng góp',tiers:[{threshold:30,name:'Người đóng góp',bonus:5,achieved:true,claimed:true},{threshold:100,name:'Người đồng hành',bonus:15,achieved:false,claimed:false}],history:[]};
 if(path.endsWith('/rewards'))return{vouchers:[{sku:'trial-50',cost:50,title:'Voucher trải nghiệm',description:'Thử nghiệm',validity_days:30},{sku:'trial-100',cost:100,title:'Voucher cộng đồng',description:'Thử nghiệm',validity_days:30}],redemptions:owned};
 if(path.includes('/voucher/'))return{voucher:owned[0]};if(path.endsWith('/redeem')){posts.push(JSON.parse(opts.body));await new Promise(r=>setTimeout(r,10));points-=50;owned=[{id:'22222222-2222-4222-8222-222222222222',demo_value_vnd:50000,title:'Voucher trải nghiệm',cost:50,code:'FG-TEST-EXAMPLE',created_at:new Date().toISOString(),expires_at:new Date(Date.now()+86400000).toISOString()}];return{message:'Đã đổi voucher thử nghiệm.',voucher:owned[0]}}return{reports:[]};
}};
const context={document,window,URLSearchParams,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout,clearTimeout,console};
vm.runInNewContext(fs.readFileSync(__dirname+'/community.js','utf8'),context);
const click=b=>main.events.click({target:b});const flush=()=>new Promise(r=>setTimeout(r,15));
(async()=>{
 await flush();assert.equal(nodes.get('cgPoints').textContent,65);assert.ok(!/cgReviewTab|data-mode="review"|data-review=/.test(main.html));
 const tab=new Element();tab.dataset.mode='rewards';await click(tab);
 let buttons=nodes.get('cgVoucherCatalog').buttons;assert.equal(buttons[0].disabled,false);assert.equal(buttons[1].disabled,true);
 const first=click(buttons[0]);const second=click(buttons[0]);await Promise.all([first,second]);assert.equal(posts.length,1);assert.equal(posts[0].sku,'trial-50');assert.equal(points,15);assert.equal(nodes.get('cgBadge').textContent,'Người đóng góp');assert.match(nodes.get('cgMyVouchers').html,/data-order=/);assert.match(nodes.get('cgRewardStatus').textContent,/thử nghiệm/);assert.equal(nodes.get('cgVoucherCatalog').buttons[0].disabled,true);assert.equal(storage.size,0);assert.match(nodes.get('cgBadgeTiers').html,/Đã nhận thưởng/);
 const order=new Element();order.dataset.order='22222222-2222-4222-8222-222222222222';await click(order);assert.equal(body.children[0].open,true);assert.match(body.children[0].html,/voucher.html\?id=22222222/);assert.match(body.children[0].html,/URL quy đổi/);assert.match(body.children[0].html,/chưa có giá trị thực tế/);
 console.log('Passed: no user review even for admin, tier status, voucher eligibility, double-click prevention, wallet feedback, owned code and retained badge.');
})().catch(e=>{console.error(e);process.exitCode=1});
