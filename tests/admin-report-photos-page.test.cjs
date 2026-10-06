const {JSDOM}=require('../editor-tools/node_modules/jsdom'),fs=require('fs'),assert=require('node:assert/strict'),path=require('path');const root=path.resolve(__dirname,'..');
(async()=>{
 const overview=fs.readFileSync(root+'/admin.html','utf8');assert.ok(!overview.includes('src="./admin-report-photos.js'));assert.ok(!overview.includes('FGAdminReportPhotos'));assert.ok(overview.includes("location.href='admin-report-photos.html'"));
 for(const role of ['guest','user','admin']){
  const d=new JSDOM(fs.readFileSync(root+'/admin-report-photos.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://fg.test/admin-report-photos.html',runScripts:'outside-only'}),w=d.window;let calls=[],loaded=0;
  w.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:role==='guest'?null:{access_token:'mock'}}}),onAuthStateChange:()=>{},signOut:async()=>{}}})};
  w.fetch=async(u,o)=>{calls.push({u,o});return {ok:true,json:async()=>u.includes('public-config')?{supabase:{url:'https://mock',anon_key:'mock'}}:{is_admin:role==='admin'}}};
  w.FGAdminReportPhotos={load:async provider=>{assert.equal((await provider()).Authorization,'Bearer mock');loaded++}};
  w.eval(fs.readFileSync(root+'/admin-report-photos-page.js','utf8'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await new Promise(r=>setTimeout(r,20));
  assert.equal(loaded,role==='admin'?1:0);assert.equal(w.document.getElementById('login').classList.contains('hidden'),role==='admin');assert.ok(!calls.some(c=>c.u.includes('/api/admin/overview')));d.window.close();
 }
 console.log('PASS: overview separated; guest/non-admin blocked; admin auth headers retained; dedicated page avoids overview queries');
})().catch(e=>{console.error(e);process.exit(1)});
