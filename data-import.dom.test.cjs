'use strict';
// Optional UI regression: npm install --no-save jsdom@26.1.0
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const V=require('./import-validation');
const wait=async(fn)=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}throw Error('UI condition timed out')};
test('XLSX workbook preserves numeric zero and rejects formula cells',{skip:!process.env.FG_XLSX_SCRIPT},async()=>{
const dom=new JSDOM(fs.readFileSync(__dirname+'/data-import.html','utf8'),{url:'https://fixture.example/data-import.html',runScripts:'outside-only'}),w=dom.window;
w.TextDecoder=TextDecoder;w.AbortSignal=AbortSignal;w.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:'fixture'}}})}})};w.fetch=async url=>({ok:true,status:200,json:async()=>String(url).includes('public-config')?{supabase:{url:'https://fixture.supabase.co',anon_key:'fixture'}}:String(url).includes('admin-status')?{is_admin:true}:String(url).includes('/public/')?{rows:[],next_offset:null}:{batches:[]}});
w.eval(fs.readFileSync(process.env.FG_XLSX_SCRIPT,'utf8'));for(const f of ['import-validation.js','csv-utils.js','data-import.js'])w.eval(fs.readFileSync(__dirname+'/'+f,'utf8'));const $=id=>w.document.getElementById(id);await wait(()=>$('adminTools').hidden===false);
const wb=w.XLSX.utils.book_new(),ws=w.XLSX.utils.aoa_to_sheet([['street','date','depth_cm','data_kind','source_url'],['Excel fixture','2025-01-01',0,'real','https://example.org/xlsx-fixture']]);w.XLSX.utils.book_append_sheet(wb,ws,'Data');
async function select(){const buffer=w.XLSX.write(wb,{type:'array',bookType:'xlsx'});Object.defineProperty($('file'),'files',{value:[{name:'fixture.xlsx',size:buffer.byteLength,arrayBuffer:async()=>buffer}],configurable:true});await $('file').onchange()}
await select();assert.equal($('preview').disabled,false);assert.equal($('sheet').options.length,1);ws.C2={t:'n',v:0,f:'1-1'};await select();assert.match($('importState').textContent,/Không nhận ô công thức/);assert.equal($('preview').disabled,true);dom.window.close();
});
test('admin CSV preview, pending save, review, publication and read-only visitor',async()=>{
const html=fs.readFileSync(__dirname+'/data-import.html','utf8');
async function setup(isAdmin){const dom=new JSDOM(html,{url:'https://fixture.example/data-import.html',runScripts:'outside-only'}),w=dom.window;let saved=false,published=false;const observation={street:'TEST <img src=x onerror=alert(1)>',date:'2025-05-10',source_url:'https://example.org/ui-fixture',data_kind:'real',rain_mm:100,rain_duration_h:6,depth_cm:20};
w.TextDecoder=TextDecoder;w.AbortSignal=AbortSignal;w.HTMLElement.prototype.scrollIntoView=function(){};w.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:isAdmin?{access_token:'fixture'}:null}})}})};
w.fetch=async(url,opts={})=>{const path=new URL(url).pathname,b=opts.body?JSON.parse(opts.body):null;let d;
if(path==='/api/public-config')d={supabase:{url:'https://fixture.supabase.co',anon_key:'fixture'}};
else if(path==='/api/account/admin-status')d={is_admin:isAdmin};
else if(path==='/api/public/datasets')d={rows:published?[{payload:observation}]:[],next_offset:null};
else if(path==='/api/admin/datasets')d={batches:saved?[{id:'00000000-0000-4000-8000-000000000001',filename:'fixture.csv',status:published?'published':'pending',inserted_rows:1,created_at:'2025-05-10T00:00:00Z'}]:[]};
else if(path.endsWith('/preview')){const c=V.validate(b.rows);d={...c,normalized_rows:c.rows.length}}
else if(path.endsWith('/import')){assert.equal(V.validate(b.rows).valid,true);saved=true;d={batch:{inserted_rows:1,skipped_rows:0}}}
else if(path.endsWith('/rows'))d={rows:[{payload:observation}],next_offset:null};
else if(path.endsWith('/review')){published=true;d={ok:true}}
else throw Error('Unexpected URL '+url);return {ok:true,status:200,json:async()=>d}};
for(const file of ['import-validation.js','csv-utils.js','data-import.js'])w.eval(fs.readFileSync(__dirname+'/'+file,'utf8'));return {dom,w,observation}}
const {dom,w,observation}=await setup(true),$=id=>w.document.getElementById(id);await wait(()=>$('adminTools').hidden===false);
const csv=V.validate([observation]).rows;const text=w.FGCsv.encode(csv,['street','date','source_url','data_kind','rain_mm','rain_duration_h','depth_cm']);const buf=Buffer.from(text);Object.defineProperty($('file'),'files',{value:[{name:'fixture.csv',size:buf.length,arrayBuffer:async()=>buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)}],configurable:true});await $('file').onchange();assert.equal($('preview').disabled,false);await $('preview').onclick();assert.equal($('save').disabled,false);assert.equal($('previewTable').querySelector('img'),null);await $('save').onclick();assert.match($('importState').textContent,/Đã lưu chờ duyệt/);assert.equal($('save').disabled,true);await $('batches').querySelector('button').onclick();$('reviewNote').value='Đối chiếu nguồn fixture trong môi trường kiểm thử';await $('publish').onclick();assert.match($('publicState').textContent,/1 bản ghi/);assert.equal($('publicTable').querySelector('img'),null);dom.window.close();
const visitor=await setup(false);await wait(()=>visitor.w.document.getElementById('authState').textContent.includes('Để nhập file'));assert.equal(visitor.w.document.getElementById('adminTools').hidden,true);visitor.dom.window.close();
});
