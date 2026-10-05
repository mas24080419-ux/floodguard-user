const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const nodes=new Map();
class Element{
 constructor(){this.value='';this.children=[];this.events={};this.disabled=false;this.textContent='';}
 set innerHTML(v){this.html=v;for(const match of v.matchAll(/id="([^"]+)"/g))if(!nodes.has(match[1]))nodes.set(match[1],new Element())}
 set src(v){this.image=v;queueMicrotask(()=>this.onload?.())}
 appendChild(e){this.children.push(e);if(e.id)nodes.set(e.id,e)} insertBefore(e){this.appendChild(e)} replaceChildren(){this.children=[]}
 querySelector(){return this.button||(this.button=new Element())} addEventListener(k,fn){this.events[k]=fn}
 showModal(){this.open=true} close(){this.open=false;this.events.close?.()} removeAttribute(){} focus(){this.focused=true}
}
const main=new Element(),nav=new Element(),body=new Element();
const document={readyState:'complete',body,createElement:()=>new Element(),getElementById:id=>nodes.get(id),querySelector:s=>s==='main.main'?main:nav};
let calls=[],status='pending',points=0;
const report=()=>({id:'report-id',place:'Test road',created_at:new Date().toISOString(),lat:10.78,lon:106.69,status:'expired',original_status:status,report_points:points,mine:false});
const fetch=async(url,opts)=>{calls.push({url,opts});let data;if(url.includes('/archive?'))data={reports:[report()],next_offset:null};else if(url.includes('/photo/'))data={photo:'data:image/jpeg;base64,YQ=='};else{const b=JSON.parse(opts.body);status=b.action;points=status==='verified'?10:0;data={status,report_points:points,message:status==='verified'?'Đã cộng 10 điểm':'Không cộng điểm'}}return{ok:true,json:async()=>data}};
const context={document,window:{},fetch,URLSearchParams,AbortController,matchMedia:()=>({matches:true}),queueMicrotask,console};
vm.runInNewContext(fs.readFileSync(__dirname+'/admin-report-photos.js','utf8'),context);
const $=id=>nodes.get(id);
(async()=>{
 await context.window.FGAdminReportPhotos.load(async()=>({Authorization:'Bearer mock'}));
 const open=()=>{$('fgPhotoGrid').children[0].querySelector('button').onclick()};
 open();assert.equal($('fgPhotoApprove').disabled,true);await Promise.resolve();assert.equal($('fgPhotoApprove').disabled,false);
 await $('fgPhotoReject').onclick();assert.ok($('fgPhotoReviewNote').focused);assert.equal(calls.filter(c=>c.url.endsWith('/review')).length,0);
 const first=$('fgPhotoApprove').onclick();const second=$('fgPhotoApprove').onclick();assert.equal($('fgPhotoApprove').disabled,true);await Promise.all([first,second]);
 const posts=calls.filter(c=>c.url.endsWith('/review'));assert.equal(posts.length,1);assert.equal(JSON.parse(posts[0].opts.body).action,'verified');assert.equal(posts[0].opts.headers.Authorization,'Bearer mock');assert.ok(!('points'in JSON.parse(posts[0].opts.body)));assert.equal($('fgPhotoApprove').hidden,true);assert.match($('fgPhotoReviewStatus').textContent,/10 điểm/);
 $('fgPhotoClose').onclick();status='pending';points=0;await $('fgPhotoRefresh').onclick();open();await Promise.resolve();$('fgPhotoReviewNote').value='Ảnh không thể hiện ngập';await $('fgPhotoReject').onclick();assert.equal(status,'rejected');assert.equal(points,0);
 console.log('Passed: archived photo review, image readiness, rejection reason, auth headers, busy/double-click prevention and actual reward feedback.');
})().catch(e=>{console.error(e);process.exitCode=1});
