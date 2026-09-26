from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

if 'password-otp-v3' in s:
    print('Password OTP v3 already installed')
    raise SystemExit(0)

css = r'''
/* password-otp-v3 */
.otp-input{width:100%!important;text-align:center;font-size:26px!important;font-weight:850!important;letter-spacing:10px!important;padding-left:22px!important;font-variant-numeric:tabular-nums}
.otp-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:10px;color:#708098}.otp-email{font-weight:800;color:#315f9d;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.otp-resend{border:0;background:transparent;color:#356fbe;font-weight:800;cursor:pointer;padding:4px 0}.otp-resend:disabled{color:#9aa7b8;cursor:not-allowed}
'''
s = s.replace('</style>', css + '\n</style>', 1)

new_overlay = r'''  <div class="recovery-overlay hidden" id="recoveryOverlay" role="dialog" aria-modal="true" aria-labelledby="recoveryTitle">
    <div class="recovery-box">
      <div class="recovery-head">
        <div><h3 id="recoveryTitle">Khôi phục mật khẩu</h3><p id="recoverySubtitle">Xác minh tài khoản bằng mã OTP 6 số.</p></div>
        <button class="recovery-close" id="recoveryClose" type="button" aria-label="Đóng">×</button>
      </div>

      <form class="recovery-step" id="recoveryEmailForm">
        <div class="recovery-note">Nhập email đã đăng ký. FloodGuard sẽ gửi một mã OTP gồm 6 chữ số tới email này.</div>
        <div class="field"><label for="recoveryEmail">Email tài khoản</label><input id="recoveryEmail" type="email" inputmode="email" autocomplete="email" placeholder="tenban@gmail.com" required></div>
        <button class="primary" id="sendRecoveryBtn" type="submit">Gửi mã OTP</button>
      </form>

      <form class="recovery-step hidden" id="recoveryOtpForm">
        <div class="recovery-note">Nhập mã OTP 6 số vừa được gửi tới email của bạn. Mã có hiệu lực trong 10 phút.</div>
        <div class="otp-meta"><span id="otpEmailLabel" class="otp-email"></span><button class="otp-resend" id="resendOtpBtn" type="button">Gửi lại mã</button></div>
        <div class="field"><label for="recoveryOtp">Mã OTP</label><input class="otp-input" id="recoveryOtp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="••••••" required></div>
        <button class="primary" id="verifyOtpBtn" type="submit">Xác minh OTP</button>
      </form>

      <form class="recovery-step hidden" id="recoveryResetForm">
        <div class="recovery-note">OTP đã được xác minh. Hãy tạo mật khẩu mới cho tài khoản FloodGuard.</div>
        <div class="field"><label for="newRecoveryPassword">Mật khẩu mới</label><div class="input-wrap"><input class="password-input" id="newRecoveryPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" placeholder="Tối thiểu 8 ký tự" required><button class="password-toggle" type="button" data-recovery-toggle="newRecoveryPassword">Hiện</button></div></div>
        <div class="field"><label for="confirmRecoveryPassword">Xác nhận mật khẩu mới</label><div class="input-wrap"><input class="password-input" id="confirmRecoveryPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" placeholder="Nhập lại mật khẩu" required><button class="password-toggle" type="button" data-recovery-toggle="confirmRecoveryPassword">Hiện</button></div></div>
        <button class="primary" id="saveRecoveryBtn" type="submit">Đổi mật khẩu</button>
      </form>

      <div class="recovery-msg" id="recoveryMessage" role="status" aria-live="polite"></div>
    </div>
  </div>
'''

pattern = re.compile(r'  <div class="recovery-overlay hidden" id="recoveryOverlay".*?\n  </div>\n</section>\n<section class="appview hidden" id="appView">', re.S)
match = pattern.search(s)
if not match:
    raise SystemExit('Recovery overlay anchor not found')
s = pattern.sub(new_overlay + '</section>\n<section class="appview hidden" id="appView">', s, count=1)

old_state = "let sb=null,busy=false,recoveryMode=(location.hash.includes('type=recovery')||new URLSearchParams(location.search).get('type')==='recovery');"
new_state = "let sb=null,busy=false,recoveryEmailValue='',recoveryToken='',recoveryTimer=null;"
if old_state not in s:
    raise SystemExit('Recovery state anchor not found')
s = s.replace(old_state, new_state, 1)

helpers_pattern = re.compile(r"function setRecoveryMessage\(text='',kind=''\).*?function closeRecovery\(\).*?\nfunction setMessage", re.S)
new_helpers = r'''function setRecoveryMessage(text='',kind=''){const el=$('recoveryMessage');if(!el)return;el.textContent=text;el.className='recovery-msg'+(kind?' '+kind:'')}
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
function setMessage'''
if not helpers_pattern.search(s):
    raise SystemExit('Recovery helper block not found')
s = helpers_pattern.sub(new_helpers, s, count=1)

old_listener = "sb.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'){recoveryMode=true;showLogin();openRecovery('reset');return}if(event==='SIGNED_OUT'){recoveryMode=false;showLogin()}if(session&&!recoveryMode&&(event==='SIGNED_IN'||event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED'))showApp()});"
new_listener = "sb.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')showLogin();if(session&&(event==='SIGNED_IN'||event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED'))showApp()});"
if old_listener not in s:
    raise SystemExit('Auth listener anchor not found')
s = s.replace(old_listener, new_listener, 1)

old_session = "if(recoveryMode){showLogin();openRecovery('reset');setStatus('Đang khôi phục mật khẩu',true)}else if(data.session){showApp()}else{showLogin();setStatus('Sẵn sàng đăng nhập',true)}"
new_session = "if(data.session){showApp()}else{showLogin();setStatus('Sẵn sàng đăng nhập',true)}"
if old_session not in s:
    raise SystemExit('Init session anchor not found')
s = s.replace(old_session, new_session, 1)

handlers_pattern = re.compile(r"\$\('forgotPassword'\)\.onclick=.*?\$\('recoveryResetForm'\)\.addEventListener\('submit'.*?\}\);\nwindow\.addEventListener\('message'", re.S)
new_handlers = r'''$('forgotPassword').onclick=()=>{if(!sb||busy)return setMessage('Hệ thống tài khoản chưa sẵn sàng.','error');recoveryEmailValue='';recoveryToken='';openRecovery('email')};
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
window.addEventListener('message' '''
if not handlers_pattern.search(s):
    raise SystemExit('Recovery handlers block not found')
s = handlers_pattern.sub(new_handlers, s, count=1)

p.write_text(s, encoding='utf-8')
print('Installed password OTP v3 flow')
