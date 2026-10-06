(()=>{
 'use strict';
 const API='https://floodguard-rescue-backend.onrender.com',$=id=>document.getElementById(id);let sb;
 function gate(message,label='Về FloodGuard để đăng nhập',action=()=>location.href='/'){
  $('login').classList.remove('hidden');$('loginText').textContent=message;$('loginAction').textContent=label;$('loginAction').disabled=false;$('loginAction').onclick=action;
 }
 async function headers(){const {data,error}=await sb.auth.getSession();if(error||!data.session?.access_token)throw Error('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.');return {Authorization:'Bearer '+data.session.access_token}}
 async function init(){
  $('loginAction').disabled=true;
  try{
   const r=await fetch(API+'/api/public-config',{cache:'no-store'}),d=await r.json();
   if(!r.ok||!d.supabase?.url||!d.supabase?.anon_key||!window.supabase?.createClient)throw Error('Chưa kết nối được hệ thống đăng nhập.');
   sb=window.supabase.createClient(d.supabase.url,d.supabase.anon_key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
   const {data,error}=await sb.auth.getSession();if(error)throw error;
   if(!data.session)return gate('Bạn cần đăng nhập bằng tài khoản admin để xem và duyệt ảnh báo cáo.');
   const ar=await fetch(API+'/api/account/admin-status',{headers:await headers(),cache:'no-store'}),ad=await ar.json();
   if(!ar.ok)throw Error(ad.message||ad.error||'Không kiểm tra được quyền quản trị.');
   if(!ad.is_admin)return gate('Tài khoản này không có quyền quản trị.','Về FloodGuard');
   if(!window.FGAdminReportPhotos)throw Error('Không tải được giao diện kho ảnh.');
   await window.FGAdminReportPhotos.load(headers);$('login').classList.add('hidden');
   sb.auth.onAuthStateChange((event,session)=>{if(!session)location.reload()});
  }catch(e){gate(e.message,'Thử lại',()=>location.reload())}
 }
 $('logout').onclick=async()=>{try{await sb?.auth.signOut()}finally{location.href='/'}};
 if('serviceWorker'in navigator)navigator.serviceWorker.getRegistration().then(r=>r?.update()).catch(()=>{});
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
