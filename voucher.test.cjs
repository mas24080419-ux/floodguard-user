const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/voucher.js','utf8');
async function run(search,{session=true,expired=false,status=200}={}){const nodes=new Map(),calls=[];let copied;const document={getElementById(id){if(!nodes.has(id))nodes.set(id,{hidden:true,textContent:''});return nodes.get(id)}};
 const voucher={id:'22222222-2222-4222-8222-222222222222',sku:'trial-100',title:'Voucher cộng đồng',demo_value_vnd:100000,validity_days:30,cost:100,code:'FG-TEST-OWN',expires_at:expired?'2020-01-01':'2999-01-01'};
 const fetch=async(url,opts)=>{calls.push({url,opts});return{ok:status===200||!url.includes('/voucher/'),status,json:async()=>url.includes('public-config')?{supabase:{url:'https://test.invalid',anon_key:'anon'}}:url.includes('/voucher/')?(status===200?{voucher}:{message:'Không tìm thấy voucher trong tài khoản của bạn.'}):{vouchers:[voucher]}}};
 const window={location:{search},supabase:{createClient:()=>({auth:{getSession:async()=>({data:{session:session?{access_token:'mock-token'}:null}})}})}};
 vm.runInNewContext(source,{window,document,fetch,URLSearchParams,AbortController,setTimeout,clearTimeout,navigator:{clipboard:{writeText:async s=>{copied=s}}}});await new Promise(r=>setTimeout(r,10));return{nodes,calls,get copied(){return copied}};
}
(async()=>{
 const preview=await run('?demo=trial-100');assert.match(preview.nodes.get('giftOrder').textContent,/Chưa đổi voucher, chưa trừ điểm/);assert.equal(preview.calls.length,1);assert.match(preview.nodes.get('giftValue').textContent,/100/);assert.equal(preview.nodes.get('giftCode').textContent,'FG-DEMO-XEM-TRUOC');
 const own=await run('?id=22222222-2222-4222-8222-222222222222');assert.equal(own.nodes.get('giftCode').textContent,'FG-TEST-OWN');assert.equal(own.calls[1].opts.headers.Authorization,'Bearer mock-token');assert.ok(!own.calls[1].url.includes('mock-token'));await own.nodes.get('giftCopy').onclick();assert.equal(own.copied,'FG-TEST-OWN');
 const noLogin=await run('?id=22222222-2222-4222-8222-222222222222',{session:false});assert.equal(noLogin.nodes.get('giftLogin').hidden,false);assert.equal(noLogin.calls.length,1);
 const invalid=await run('?id=not-a-uuid');assert.equal(invalid.calls.length,0);assert.match(invalid.nodes.get('giftMessage').textContent,/không hợp lệ/);
 const foreign=await run('?id=22222222-2222-4222-8222-222222222222',{status:404});assert.match(foreign.nodes.get('giftMessage').textContent,/Không tìm thấy/);assert.ok(!foreign.nodes.has('giftCode'));
 const expired=await run('?id=22222222-2222-4222-8222-222222222222',{expired:true});assert.match(expired.nodes.get('giftStatus').textContent,/hết hạn/);
 console.log('Passed: no-charge preview, private voucher auth, no token in URL, copy, invalid ID, login/ownership errors and expiry.');
})().catch(e=>{console.error(e);process.exitCode=1});
