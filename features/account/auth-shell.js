
(()=>{
'use strict';
const API='https://floodguard-rescue-backend.onrender.com';
const $=id=>document.getElementById(id);
const ENTRY_PARAMS=new URLSearchParams(location.search);
let RESCUE_INVITE=ENTRY_PARAMS.get('rescue_invite')||'';
let RESCUE_EMAIL=(ENTRY_PARAMS.get('rescue_email')||'').trim().toLowerCase();
let sb=null,busy=false,recoveryEmailValue='',recoveryToken='',recoveryTimer=null,currentAppMode='',currentAppUserId='',accountModeTimer=null;
const ui={auth:$('authScreen'),app:$('appView'),frame:$('appFrame'),message:$('message'),statusText:$('statusText'),statusDot:$('statusDot'),loginBtn:$('loginBtn'),signupBtn:$('signupBtn'),googleBtn:$('googleBtn')};
function setRecoveryMessage(text='',kind=''){const el=$('recoveryMessage');if(!el)return;el.textContent=text;el.className='recovery-msg'+(kind?' '+kind:'')}
function setRecoveryStep(step='email'){
  const emailForm=$('recoveryEmailForm'),otpForm=$('recoveryOtpForm'),resetForm=$('recoveryResetForm');
  emailForm.classList.toggle('hidden',step!=='email');otpForm.classList.toggle('hidden',step!=='otp');resetForm.classList.toggle('hidden',step!=='reset');
  if(step==='email'){$('recoveryTitle').textContent='Khôi phục mật khẩu';$('recoverySubtitle').textContent='Xác minh tài khoản bằng mã OTP 6 số.'}
  if(step==='otp'){$('recoveryTitle').textContent='Nhập mã OTP';$('recoverySubtitle').textContent='Kiểm tra email và nhập mã xác minh 6 số.';$('otpEmailLabel').textContent=recoveryEmailValue;setTimeout(()=>$('recoveryOtp').focus(),50)}
  if(step==='reset'){$('recoveryTitle').textContent='Tạo mật khẩu mới';$('recoverySubtitle').textContent='OTP đã được xác minh thành công.';setTimeout(()=>$('newRecoveryPassword').focus(),50)}
}
function openRecovery(step='email'){
  $('recoveryOverlay').classList.remove('hidden');setRecoveryMessage();
  if(step==='email'){$('recoveryEmail').value=$('loginEmail').value.trim();setTimeout(()=>$('recoveryEmail').focus(),50)}
  setRecoveryStep(step);
}
function closeRecovery(){
  $('recoveryOverlay')?.classList.add('hidden');setRecoveryMessage();recoveryToken='';
  if(recoveryTimer){clearInterval(recoveryTimer);recoveryTimer=null}
  if($('recoveryOtp'))$('recoveryOtp').value='';
}
function startResendTimer(seconds=60){
  if(recoveryTimer)clearInterval(recoveryTimer);let left=Number(seconds)||60;const btn=$('resendOtpBtn');
  const tick=()=>{if(left<=0){btn.disabled=false;btn.textContent='Gửi lại mã';clearInterval(recoveryTimer);recoveryTimer=null;return}btn.disabled=true;btn.textContent='Gửi lại sau '+left+'s';left-=1};
  tick();recoveryTimer=setInterval(tick,1000);
}
async function otpApi(path,payload){
  const r=await fetch(API+'/api/auth/password-otp/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload||{})});
  const d=await r.json().catch(()=>({}));if(!r.ok){const err=new Error(d.message||'Không thể xử lý yêu cầu OTP.');err.data=d;err.status=r.status;throw err}return d;
}
function setMessage(text='',kind=''){ui.message.textContent=text;ui.message.className='msg'+(kind?' '+kind:'')}
function setStatus(text,ok=false){ui.statusText.textContent=text;ui.statusDot.classList.toggle('ok',!!ok)}
function setBusy(on,label){busy=on;[ui.loginBtn,ui.signupBtn,ui.googleBtn].forEach(b=>b.disabled=on);if(label&&on)ui.loginBtn.innerHTML='<span class="spinner"></span>'+label;else ui.loginBtn.textContent='Đăng nhập'}
function friendlyError(error){const m=String(error?.message||error||'').toLowerCase();if(m.includes('invalid login credentials'))return 'Sai email hoặc mật khẩu. Vui lòng kiểm tra lại.';if(m.includes('email not confirmed'))return 'Email chưa được xác minh. Hãy kiểm tra hộp thư của bạn.';if(m.includes('user already registered'))return 'Email này đã được đăng ký.';if(m.includes('provider')&&(m.includes('disabled')||m.includes('not enabled')||m.includes('unsupported')))return 'Đăng nhập Google chưa được bật trong Supabase. Cần bật Google Provider một lần trong cấu hình dự án.';if(m.includes('network')||m.includes('fetch'))return 'Không thể kết nối máy chủ tài khoản. Hãy kiểm tra mạng và thử lại.';return error?.message||'Đã xảy ra lỗi. Vui lòng thử lại.'}
async function accountContext(session){
  if(!session?.access_token)throw new Error('missing_session');
  const r=await fetch(
    API+'/api/account/context',
    {
      headers:{
        Authorization:
          'Bearer '+
          session.access_token
      },
      cache:'no-store'
    }
  );
  const d=await r.json().catch(()=>({}));
  if(!r.ok){
    const e=new Error(d.error||('HTTP '+r.status));
    e.status=r.status;
    throw e;
  }
  return d;
}

function rescueModuleUrl(){
  const u=
    new URL(
      './rescue-team.html',
      location.href
    );
  u.searchParams.set(
    'embedded',
    '1'
  );
  if(RESCUE_INVITE){
    u.searchParams.set(
      'invite',
      RESCUE_INVITE
    );
  }
  if(RESCUE_EMAIL){
    u.searchParams.set(
      'email',
      RESCUE_EMAIL
    );
  }
  return u.pathname+u.search;
}

function cleanRescueInviteFromAddress(){
  if(!RESCUE_INVITE&&!RESCUE_EMAIL)return;
  try{
    history.replaceState(
      null,
      '',
      location.pathname+'#app'
    );
  }catch(_){}
  RESCUE_INVITE='';
  RESCUE_EMAIL='';
}

async function showApp(session=null){
  setMessage();
  const s=
    session||
    (await sb?.auth.getSession())
      ?.data?.session||
    null;

  if(!s){
    return showLogin();
  }

  setStatus('Đang xác định quyền tài khoản…',true);
  let ctx;
  try{
    ctx=await accountContext(s);
    currentAppUserId=s.user.id;
  }catch(e){
    if(currentAppMode&&currentAppUserId===s.user?.id&&!ui.app.classList.contains('hidden')&&(!e.status||e.status===429||e.status>=500)){
      setStatus('Kết nối tài khoản tạm gián đoạn; sẽ kiểm tra lại.');
      return;
    }
    ui.auth.classList.remove('hidden');
    ui.app.classList.add('hidden');
    document.getElementById('fgWebsiteHome')?.classList.add('hidden');
    finishOAuthLoading();
    setStatus('Chưa xác định được quyền tài khoản');
    setMessage('Không thể kiểm tra vai trò tài khoản. Hãy thử lại sau vài giây.','error');
    throw e;
  }

  const rescueMode=
    !!RESCUE_INVITE||
    !!ctx?.rescue?.enabled;

  const nextMode=
    rescueMode
    ?'rescue'
    :'user';

  const nextSrc=
    rescueMode
    ?rescueModuleUrl()
    :'./app-core.html';

  // Open the application once Supabase has restored the session and roles.
  // Wait until here so homepage navigation cannot remove OAuth callback data early.
  if(!window.FGViewingHomepage)window.FGOpenFloodGuard?.();
  ui.auth.classList.add('hidden');
  ui.app.classList.remove('hidden');

  if(
    currentAppMode!==nextMode||
    !ui.frame.getAttribute('src')
  ){
    currentAppMode=
      nextMode;
    ui.frame.setAttribute(
      'src',
      nextSrc
    );
  }

  if(rescueMode){
    cleanRescueInviteFromAddress();
  }
}

function finishOAuthLoading(){document.documentElement.classList.remove('fg-auth-return')}
ui.frame.addEventListener('load',()=>{if(ui.frame.getAttribute('src'))finishOAuthLoading()});

function showLogin(){
  if(document.documentElement.classList.contains('fg-auth-return'))document.getElementById('fgWebsiteHome')?.classList.add('hidden');
  finishOAuthLoading();
  currentAppMode='';
  currentAppUserId='';
  ui.app.classList.add('hidden');
  ui.auth.classList.remove('hidden');
  if(ui.frame.getAttribute('src')){
    ui.frame.removeAttribute('src');
  }
  if(RESCUE_EMAIL){
    if($('loginEmail'))$('loginEmail').value=RESCUE_EMAIL;
    if($('signupEmail'))$('signupEmail').value=RESCUE_EMAIL;
    setMessage(
      'Email này đã được mời tham gia đội cứu hộ. Hãy đăng nhập hoặc đăng ký bằng đúng email để tiếp tục.',
      'ok'
    );
  }
  setStatus(
    sb
      ?'Sẵn sàng đăng nhập'
      :'Đang kết nối hệ thống tài khoản…',
    !!sb
  );
}

async function refreshAccountMode(){
  if(!sb)return;
  try{
    const s=
      (await sb.auth.getSession())
      .data.session;
    if(s)await showApp(s);
  }catch(_){}
}

async function init(){
  try{
    if(!window.supabase?.createClient){
      throw new Error(
        'Không tải được Supabase SDK'
      );
    }

    const r=
      await fetch(
        API+'/api/public-config',
        {cache:'no-store'}
      );

    const d=
      await r.json()
      .catch(()=>({}));

    if(
      !r.ok||
      !d.supabase?.url||
      !d.supabase?.anon_key
    ){
      throw new Error(
        'Backend/Supabase chưa sẵn sàng'
      );
    }

    sb=
      window.supabase
      .createClient(
        d.supabase.url,
        d.supabase.anon_key,
        {
          auth:{
            persistSession:true,
            autoRefreshToken:true,
            detectSessionInUrl:true
          }
        }
      );

    sb.auth.onAuthStateChange(
      (event,session)=>{
        if(event==='SIGNED_OUT'){
          showLogin();
        }

        if(
          session&&
          (
            event==='SIGNED_IN'||
            event==='INITIAL_SESSION'||
            event==='TOKEN_REFRESHED'
          )
        ){
          showApp(session)
          .catch(()=>{});
        }
      }
    );

    const {data,error}=
      await sb.auth.getSession();

    if(error)throw error;

    if(data.session){
      await showApp(
        data.session
      );
    }else{
      showLogin();
      setStatus(
        'Sẵn sàng đăng nhập',
        true
      );
    }

    if(accountModeTimer){
      clearInterval(
        accountModeTimer
      );
    }

    accountModeTimer=
      setInterval(
        refreshAccountMode,
        30000
      );

  }catch(e){
    if(document.documentElement.classList.contains('fg-auth-return'))document.getElementById('fgWebsiteHome')?.classList.add('hidden');
    finishOAuthLoading();
    setStatus(
      'Không kết nối được hệ thống tài khoản'
    );
    setMessage(
      friendlyError(e),
      'error'
    );
  }
}
function switchTab(tab){const login=tab==='login';$('loginTab').classList.toggle('active',login);$('signupTab').classList.toggle('active',!login);$('loginForm').classList.toggle('hidden',!login);$('signupForm').classList.toggle('hidden',login);setMessage()}
$('loginTab').onclick=()=>switchTab('login');$('signupTab').onclick=()=>switchTab('signup');
document.querySelectorAll('[data-toggle]').forEach(btn=>btn.onclick=()=>{const input=$(btn.dataset.toggle);const show=input.type==='password';input.type=show?'text':'password';btn.textContent=show?'Ẩn':'Hiện'});
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();if(!sb||busy)return;const email=$('loginEmail').value.trim(),password=$('loginPassword').value;if(!email||!password)return setMessage('Vui lòng nhập đầy đủ email và mật khẩu.','error');setBusy(true,'Đang xác thực…');setMessage();try{const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;if(!data.session)throw new Error('Không tạo được phiên đăng nhập');await showApp(data.session)}catch(err){setMessage(friendlyError(err),'error')}finally{setBusy(false)}});
$('signupForm').addEventListener('submit',async e=>{e.preventDefault();if(!sb||busy)return;const full_name=$('signupName').value.trim(),email=$('signupEmail').value.trim(),password=$('signupPassword').value;if(!full_name||!email||password.length<6)return setMessage('Hãy nhập họ tên, email và mật khẩu tối thiểu 6 ký tự.','error');busy=true;ui.signupBtn.disabled=ui.googleBtn.disabled=true;ui.signupBtn.innerHTML='<span class="spinner"></span>Đang tạo tài khoản…';setMessage();try{const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name}}});if(error)throw error;if(data.session){await showApp(data.session)}else{switchTab('login');$('loginEmail').value=email;setMessage('Đã tạo tài khoản. Hãy kiểm tra email để xác minh trước khi đăng nhập.','ok')}}catch(err){setMessage(friendlyError(err),'error')}finally{busy=false;ui.signupBtn.disabled=ui.googleBtn.disabled=false;ui.signupBtn.textContent='Tạo tài khoản'}});
ui.googleBtn.onclick=async()=>{if(!sb||busy)return;busy=true;ui.googleBtn.disabled=ui.loginBtn.disabled=ui.signupBtn.disabled=true;setMessage();setStatus('Đang chuyển tới Google…',true);try{const redirectUrl=new URL(location.pathname,location.origin);if(RESCUE_INVITE)redirectUrl.searchParams.set('rescue_invite',RESCUE_INVITE);if(RESCUE_EMAIL)redirectUrl.searchParams.set('rescue_email',RESCUE_EMAIL);const redirectTo=redirectUrl.href;const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo,queryParams:{access_type:'offline',prompt:'select_account'}}});if(error)throw error}catch(err){busy=false;ui.googleBtn.disabled=ui.loginBtn.disabled=ui.signupBtn.disabled=false;setStatus('Sẵn sàng đăng nhập',true);setMessage(friendlyError(err),'error')}};
$('forgotPassword').onclick=()=>{if(!sb||busy)return setMessage('Hệ thống tài khoản chưa sẵn sàng.','error');recoveryEmailValue='';recoveryToken='';openRecovery('email')};
$('recoveryClose').onclick=closeRecovery;
$('recoveryOverlay').addEventListener('click',e=>{if(e.target===$('recoveryOverlay'))closeRecovery()});
document.querySelectorAll('[data-recovery-toggle]').forEach(btn=>btn.onclick=()=>{const input=$(btn.dataset.recoveryToggle);const show=input.type==='password';input.type=show?'text':'password';btn.textContent=show?'Ẩn':'Hiện'});
$('recoveryOtp').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,6)});

async function sendOtpForRecovery(isResend=false){
  const email=(isResend?recoveryEmailValue:$('recoveryEmail').value.trim()).toLowerCase();
  if(!email)return setRecoveryMessage('Vui lòng nhập email đã đăng ký.','error');
  const btn=isResend?$('resendOtpBtn'):$('sendRecoveryBtn');busy=true;btn.disabled=true;if(!isResend)btn.innerHTML='<span class="spinner"></span>Đang gửi…';setRecoveryMessage();
  try{
    const d=await otpApi('request',{email});recoveryEmailValue=email;$('loginEmail').value=email;$('recoveryOtp').value='';setRecoveryStep('otp');startResendTimer(d.resend_seconds||60);setRecoveryMessage(d.message||'Nếu email đã đăng ký, mã OTP đã được gửi.','ok');
  }catch(err){if(err.data?.retry_after_seconds){startResendTimer(err.data.retry_after_seconds)}setRecoveryMessage(err.message,'error')}
  finally{busy=false;if(!isResend){btn.disabled=false;btn.textContent='Gửi mã OTP'}}
}
$('recoveryEmailForm').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;await sendOtpForRecovery(false)});
$('resendOtpBtn').onclick=async()=>{if(busy||$('resendOtpBtn').disabled)return;await sendOtpForRecovery(true)};

$('recoveryOtpForm').addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;const code=$('recoveryOtp').value.replace(/\D/g,'');if(code.length!==6)return setRecoveryMessage('Mã OTP phải gồm đúng 6 chữ số.','error');
  const btn=$('verifyOtpBtn');busy=true;btn.disabled=true;btn.innerHTML='<span class="spinner"></span>Đang xác minh…';setRecoveryMessage();
  try{const d=await otpApi('verify',{email:recoveryEmailValue,code});recoveryToken=d.recovery_token||'';if(!recoveryToken)throw new Error('Không tạo được phiên khôi phục mật khẩu.');setRecoveryStep('reset');setRecoveryMessage('Xác minh OTP thành công. Hãy tạo mật khẩu mới.','ok')}
  catch(err){setRecoveryMessage(err.message,'error')}
  finally{busy=false;btn.disabled=false;btn.textContent='Xác minh OTP'}
});

$('recoveryResetForm').addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;const p1=$('newRecoveryPassword').value,p2=$('confirmRecoveryPassword').value;if(p1.length<8)return setRecoveryMessage('Mật khẩu mới phải có ít nhất 8 ký tự.','error');if(p1!==p2)return setRecoveryMessage('Hai mật khẩu chưa khớp.','error');if(!recoveryToken)return setRecoveryMessage('Phiên xác minh không hợp lệ. Hãy yêu cầu mã OTP mới.','error');
  const btn=$('saveRecoveryBtn');busy=true;btn.disabled=true;btn.innerHTML='<span class="spinner"></span>Đang cập nhật…';setRecoveryMessage();
  try{const d=await otpApi('reset',{recovery_token:recoveryToken,password:p1});recoveryToken='';$('newRecoveryPassword').value='';$('confirmRecoveryPassword').value='';closeRecovery();showLogin();setStatus('Sẵn sàng đăng nhập',true);setMessage(d.message||'Đổi mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.','ok')}
  catch(err){if(err.data?.error==='recovery_expired'){recoveryToken='';setRecoveryStep('email')}setRecoveryMessage(err.message,'error')}
  finally{busy=false;btn.disabled=false;btn.textContent='Đổi mật khẩu'}
});
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data==='floodguard:signed-out'||e.data==='floodguard:need-login')showLogin();if(e.data==='floodguard:account-updated')refreshAccountMode()});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
