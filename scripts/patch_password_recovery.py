from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
marker = 'password-recovery-v2'
if marker in s:
    print('Password recovery v2 already installed')
    raise SystemExit(0)

css = r'''
/* password-recovery-v2 */
.recovery-overlay{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:18px;background:rgba(5,20,43,.58);backdrop-filter:blur(9px)}
.recovery-box{width:min(430px,100%);background:#fff;border:1px solid rgba(255,255,255,.85);border-radius:24px;box-shadow:0 24px 70px rgba(0,20,55,.34);padding:24px;color:#172b47}
.recovery-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px}.recovery-head h3{margin:0;font-size:20px}.recovery-head p{margin:6px 0 0;color:#718098;font-size:11px;line-height:1.55}.recovery-close{border:0;background:#eef3f9;border-radius:10px;width:34px;height:34px;cursor:pointer;color:#50637d;font-size:18px}.recovery-step{display:grid;gap:12px}.recovery-note{padding:11px 12px;border-radius:13px;background:#f1f6ff;color:#49617f;font-size:10px;line-height:1.55;border:1px solid #e0e9f5}.recovery-actions{display:flex;gap:9px}.recovery-actions .primary{flex:1}.secondary{border:1px solid #dce5ef;background:#fff;border-radius:14px;padding:12px 14px;color:#536880;font-weight:800;cursor:pointer}.recovery-msg{min-height:16px;font-size:10px;line-height:1.5}.recovery-msg.error{color:var(--danger)}.recovery-msg.ok{color:var(--ok)}
'''
s = s.replace('</style>', css + '\n</style>', 1)

html = r'''
  <div class="recovery-overlay hidden" id="recoveryOverlay" role="dialog" aria-modal="true" aria-labelledby="recoveryTitle">
    <div class="recovery-box">
      <div class="recovery-head">
        <div><h3 id="recoveryTitle">Xác minh tài khoản</h3><p id="recoverySubtitle">Xác minh email trước khi đặt lại mật khẩu.</p></div>
        <button class="recovery-close" id="recoveryClose" type="button" aria-label="Đóng">×</button>
      </div>
      <form class="recovery-step" id="recoveryEmailForm">
        <div class="recovery-note">FloodGuard sẽ gửi một liên kết xác minh tới email đã đăng ký. Chỉ người có quyền truy cập hộp thư đó mới có thể tiếp tục đổi mật khẩu.</div>
        <div class="field"><label for="recoveryEmail">Email tài khoản</label><input id="recoveryEmail" type="email" inputmode="email" autocomplete="email" placeholder="tenban@gmail.com" required></div>
        <button class="primary" id="sendRecoveryBtn" type="submit">Gửi liên kết xác minh</button>
      </form>
      <form class="recovery-step hidden" id="recoveryResetForm">
        <div class="recovery-note">Email đã được xác minh qua liên kết khôi phục. Hãy tạo mật khẩu mới cho tài khoản.</div>
        <div class="field"><label for="newRecoveryPassword">Mật khẩu mới</label><div class="input-wrap"><input class="password-input" id="newRecoveryPassword" type="password" autocomplete="new-password" minlength="8" placeholder="Tối thiểu 8 ký tự" required><button class="password-toggle" type="button" data-recovery-toggle="newRecoveryPassword">Hiện</button></div></div>
        <div class="field"><label for="confirmRecoveryPassword">Xác nhận mật khẩu mới</label><div class="input-wrap"><input class="password-input" id="confirmRecoveryPassword" type="password" autocomplete="new-password" minlength="8" placeholder="Nhập lại mật khẩu" required><button class="password-toggle" type="button" data-recovery-toggle="confirmRecoveryPassword">Hiện</button></div></div>
        <button class="primary" id="saveRecoveryBtn" type="submit">Đổi mật khẩu</button>
      </form>
      <div class="recovery-msg" id="recoveryMessage" role="status" aria-live="polite"></div>
    </div>
  </div>
'''
anchor = '</section>\n<section class="appview hidden" id="appView">'
if anchor not in s:
    raise SystemExit('Auth section anchor not found')
s = s.replace(anchor, html + '</section>\n<section class="appview hidden" id="appView">', 1)

old = "let sb=null,busy=false;"
new = "let sb=null,busy=false,recoveryMode=(location.hash.includes('type=recovery')||new URLSearchParams(location.search).get('type')==='recovery');"
if old not in s:
    raise SystemExit('State anchor not found')
s = s.replace(old, new, 1)

anchor2 = "function setMessage(text='',kind=''){ui.message.textContent=text;ui.message.className='msg'+(kind?' '+kind:'')}"
helpers = r'''function setRecoveryMessage(text='',kind=''){const el=$('recoveryMessage');if(!el)return;el.textContent=text;el.className='recovery-msg'+(kind?' '+kind:'')}
function openRecovery(step='email'){
  const overlay=$('recoveryOverlay'),emailForm=$('recoveryEmailForm'),resetForm=$('recoveryResetForm');
  if(!overlay)return;
  overlay.classList.remove('hidden');setRecoveryMessage();
  const reset=step==='reset';emailForm.classList.toggle('hidden',reset);resetForm.classList.toggle('hidden',!reset);
  $('recoveryTitle').textContent=reset?'Tạo mật khẩu mới':'Xác minh tài khoản';
  $('recoverySubtitle').textContent=reset?'Hoàn tất khôi phục tài khoản FloodGuard.':'Xác minh email trước khi đặt lại mật khẩu.';
  if(!reset){$('recoveryEmail').value=$('loginEmail').value.trim();setTimeout(()=>$('recoveryEmail').focus(),50)}
  else setTimeout(()=>$('newRecoveryPassword').focus(),50);
}
function closeRecovery(){if(recoveryMode)return;$('recoveryOverlay')?.classList.add('hidden');setRecoveryMessage()}
'''
if anchor2 not in s:
    raise SystemExit('Message function anchor not found')
s = s.replace(anchor2, helpers + anchor2, 1)

old_listener = "sb.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')showLogin();if(session&&(event==='SIGNED_IN'||event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED'))showApp()});"
new_listener = "sb.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'){recoveryMode=true;showLogin();openRecovery('reset');return}if(event==='SIGNED_OUT'){recoveryMode=false;showLogin()}if(session&&!recoveryMode&&(event==='SIGNED_IN'||event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED'))showApp()});"
if old_listener not in s:
    raise SystemExit('Auth listener anchor not found')
s = s.replace(old_listener, new_listener, 1)

old_session = "if(data.session){showApp()}else{showLogin();setStatus('Sẵn sàng đăng nhập',true)}"
new_session = "if(recoveryMode){showLogin();openRecovery('reset');setStatus('Đang khôi phục mật khẩu',true)}else if(data.session){showApp()}else{showLogin();setStatus('Sẵn sàng đăng nhập',true)}"
if old_session not in s:
    raise SystemExit('Session anchor not found')
s = s.replace(old_session, new_session, 1)

old_forgot = "$('forgotPassword').onclick=async()=>{if(!sb||busy)return;const email=$('loginEmail').value.trim();if(!email)return setMessage('Nhập email của bạn trước, sau đó bấm “Quên mật khẩu?”.','error');try{const redirectTo=new URL('./',location.href).href;const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;setMessage('Đã gửi hướng dẫn đặt lại mật khẩu tới email của bạn.','ok')}catch(err){setMessage(friendlyError(err),'error')}};"
new_forgot = r'''$('forgotPassword').onclick=()=>{if(!sb||busy)return setMessage('Hệ thống tài khoản chưa sẵn sàng.','error');openRecovery('email')};
$('recoveryClose').onclick=closeRecovery;
$('recoveryOverlay').addEventListener('click',e=>{if(e.target===$('recoveryOverlay'))closeRecovery()});
document.querySelectorAll('[data-recovery-toggle]').forEach(btn=>btn.onclick=()=>{const input=$(btn.dataset.recoveryToggle);const show=input.type==='password';input.type=show?'text':'password';btn.textContent=show?'Ẩn':'Hiện'});
$('recoveryEmailForm').addEventListener('submit',async e=>{e.preventDefault();if(!sb||busy)return;const email=$('recoveryEmail').value.trim();if(!email)return setRecoveryMessage('Vui lòng nhập email đã đăng ký.','error');const btn=$('sendRecoveryBtn');busy=true;btn.disabled=true;btn.innerHTML='<span class="spinner"></span>Đang gửi…';setRecoveryMessage();try{const redirectTo=new URL('./',location.href).href;const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;$('loginEmail').value=email;setRecoveryMessage('Đã gửi liên kết xác minh. Hãy mở email của bạn và bấm liên kết để tiếp tục đổi mật khẩu.','ok')}catch(err){setRecoveryMessage(friendlyError(err),'error')}finally{busy=false;btn.disabled=false;btn.textContent='Gửi lại liên kết xác minh'}});
$('recoveryResetForm').addEventListener('submit',async e=>{e.preventDefault();if(!sb||busy)return;const p1=$('newRecoveryPassword').value,p2=$('confirmRecoveryPassword').value;if(p1.length<8)return setRecoveryMessage('Mật khẩu mới phải có ít nhất 8 ký tự.','error');if(p1!==p2)return setRecoveryMessage('Hai mật khẩu chưa khớp.','error');const btn=$('saveRecoveryBtn');busy=true;btn.disabled=true;btn.innerHTML='<span class="spinner"></span>Đang cập nhật…';setRecoveryMessage();try{const {error}=await sb.auth.updateUser({password:p1});if(error)throw error;recoveryMode=false;await sb.auth.signOut({scope:'local'}).catch(()=>{});history.replaceState({},document.title,location.pathname);$('recoveryOverlay').classList.add('hidden');$('newRecoveryPassword').value='';$('confirmRecoveryPassword').value='';showLogin();setStatus('Sẵn sàng đăng nhập',true);setMessage('Đổi mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.','ok')}catch(err){setRecoveryMessage(friendlyError(err),'error')}finally{busy=false;btn.disabled=false;btn.textContent='Đổi mật khẩu'}});'''
if old_forgot not in s:
    raise SystemExit('Forgot-password handler anchor not found')
s = s.replace(old_forgot, new_forgot, 1)

p.write_text(s, encoding='utf-8')
print('Installed secure password recovery flow')
