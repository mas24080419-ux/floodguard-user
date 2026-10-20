(()=>{'use strict';
// Only public configuration is cached; account data and permission checks remain live.
const key='fg-admin-public-config-v1',ttl=300000;let pending;
window.FGAdminPublicConfig=async function(api){
 const url=api+'/api/public-config';
 try{const c=JSON.parse(sessionStorage.getItem(key)||'null');if(c?.url===url&&Date.now()-c.at>=0&&Date.now()-c.at<ttl&&c.data?.supabase?.url&&c.data?.supabase?.anon_key)return {ok:true,json:async()=>c.data};}catch{}
 if(!pending)pending=fetch(url,{cache:'no-store'}).then(async r=>{const data=await r.json();if(r.ok&&data?.supabase?.url&&data?.supabase?.anon_key){try{sessionStorage.setItem(key,JSON.stringify({url,at:Date.now(),data:{supabase:{url:data.supabase.url,anon_key:data.supabase.anon_key}}}));}catch{}}return {ok:r.ok,json:async()=>data};}).finally(()=>{pending=null});
 return pending;
};
})();
