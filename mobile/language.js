/* Shared local presentation adapter for the existing classic-script UI. */
(()=>{'use strict';
 if(window.FGLanguage)return;
 const key='fg_language_v1',catalog=window.FGLanguageCatalog||{},root=document.documentElement;
 const valid=v=>v==='en'||v==='vi';let lang='vi',saved=true,opener=null,historyEntry=false;
 try{const v=localStorage.getItem(key);if(valid(v))lang=v;}catch{saved=false;}
 root.lang=lang;
 const originals=new WeakMap(),attributes=new WeakMap(),reverse=new Map(),folded=new Map();
 Object.entries(catalog).forEach(([vi,en])=>{if(!reverse.has(en))reverse.set(en,vi);});
 Object.entries(catalog).forEach(([vi,en])=>folded.set(vi.toLocaleLowerCase('vi'),en));
 const protectedContent='script,style,noscript,textarea,pre,code,svg,[contenteditable],.leaflet-pane,.fg16-msg,[translate="no"],[data-no-translate],#fgDestName,#fgDestAddress,#fg3RoadName,#fg31UserName,#fg31UserEmail,#fg16Messages,.message-text,.chat-message';
 // These templates contain only product counts; place names and free text are not translated.
 const templates=[
  [/^(\d[\d.,]*) tài khoản · (\d[\d.,]*) lượt ghi nhận$/, '$1 accounts · $2 recorded events'],
  [/^(\d[\d.,]*) tuyến · (\d[\d.,]*) trạm$/, '$1 routes · $2 stations'],
  [/^(\d[\d.,]*) tài khoản mới$/, '$1 new accounts'],
  [/^(\d[\d.,]*) phút$/, '$1 min'],[/^(\d[\d.,]*) giờ$/, '$1 h'],
  [/^(\d[\d.,]*) ngày$/, '$1 days'],
  [/^Lấy lúc ([\d:]+)$/, 'Updated at $1'],
  [/^Khu vực đang xem · ([-\d., ]+)$/, 'Current map area · $1'],
  [/^Thời tiết đã cập nhật cho (\d+) điểm\. Tự làm mới sau mỗi (\d+) phút\.$/, 'Weather updated for $1 point(s). Refreshes every $2 minutes.'],
  [/^Phương tiện: (?:🚗 )?Ô tô$/, 'Vehicle: 🚗 Car'],
  [/^Phương tiện: (?:🛵 )?Xe máy$/, 'Vehicle: 🛵 Motorbike'],
  [/^Phương tiện: (?:🚶 )?Đi bộ$/, 'Vehicle: 🚶 Walking'],
  [/^(.+°C) · Ẩm ([\d%—]+) · Gió ([\d.]+ km\/h|—)$/, '$1 · Humidity $2 · Wind $3'],
  [/^· Xác suất:$/, '· Probability:']
  ,[/^Nhập địa chỉ để tìm trạm sạc · kịch bản mưa ([\d.,]+) mm$/, 'Enter an address to find stations · rainfall scenario $1 mm']
 ];
 function translate(text){
  const vehicle=text.match(/^(?:Phương tiện|Vehicle):\s*(🚗|🛵|🚶)?\s*(Ô tô|Car|Xe máy|Motorbike|Đi bộ|Walking)$/u);
  if(vehicle){const modes={'Ô tô':['Ô tô','Car'],Car:['Ô tô','Car'],'Xe máy':['Xe máy','Motorbike'],Motorbike:['Xe máy','Motorbike'],'Đi bộ':['Đi bộ','Walking'],Walking:['Đi bộ','Walking']};return (lang==='en'?'Vehicle: ':'Phương tiện: ')+(vehicle[1]?vehicle[1]+' ':'')+modes[vehicle[2]][lang==='en'?1:0];}
  if(lang==='vi')return text;
  if(Object.hasOwn(catalog,text))return catalog[text];
  const decorated=text.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
  if(decorated){const translated=folded.get(decorated[2].toLocaleLowerCase('vi'));if(translated)return decorated[1]+translated+decorated[3];}
  for(const [re,replacement] of templates)if(re.test(text))return text.replace(re,replacement);
  return text;
 }
 function source(current,record){return record&&current===record.output?record.source:current;}
 function text(node){
  const parent=node.parentElement;if(!parent||parent.closest(protectedContent))return;
  // An option without value derives its submitted value from its text. Keep that value stable.
  const option=parent.closest('option');if(option&&!option.hasAttribute('value'))option.setAttribute('value',option.textContent);
  const current=node.nodeValue,record=originals.get(node);let raw=source(current,record);
  const trimmed=raw.trim(),canonical=reverse.get(trimmed);
  if(canonical&&canonical!==trimmed)raw=raw.replace(trimmed,canonical);
  const output=raw.replace(raw.trim(),translate(raw.trim()));
  originals.set(node,{source:raw,output});if(current!==output)node.nodeValue=output;
 }
 function element(el){
  if(el.closest(protectedContent))return;
  let records=attributes.get(el);if(!records){records={};attributes.set(el,records);}
  for(const name of ['placeholder','aria-label','title']){
   if(!el.hasAttribute(name))continue;const current=el.getAttribute(name),record=records[name];let raw=source(current,record);
   if(reverse.has(raw))raw=reverse.get(raw);
   const output=translate(raw);records[name]={source:raw,output};if(current!==output)el.setAttribute(name,output);
  }
 }
 function visit(node){
  if(node.nodeType===3){text(node);return;}
  if(node.nodeType!==1||node.closest(protectedContent))return;
  element(node);const walker=document.createTreeWalker(node,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeType===1&&n.matches(protectedContent)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  while(walker.nextNode()){const n=walker.currentNode;n.nodeType===3?text(n):element(n);}
 }
 let observer,queued=new Set(),scheduled=false;
 function observe(){observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});}
 function flush(){
  scheduled=false;observer.disconnect();
  mount();for(const node of queued)if(node.isConnected)visit(node);queued.clear();observe();
 }
 function queue(node){queued.add(node);if(!scheduled){scheduled=true;requestAnimationFrame(flush);}}
 function apply(next,persist=true){
  if(!valid(next))return;lang=next;root.lang=next;
  if(persist){try{localStorage.setItem(key,next);saved=true;}catch{saved=false;}}
  if(observer){observer.disconnect();visit(document.body);refreshPicker();observe();}
  window.dispatchEvent(new CustomEvent('fg:languagechange',{detail:{language:next}}));
 }
 const globe='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg>';
 let dialog;
 function refreshPicker(){
  if(!dialog)return;
  dialog.querySelector('h2').textContent=lang==='en'?'Language':'Ngôn ngữ';
  dialog.querySelector('.fg-language-description').textContent=lang==='en'?'Choose your FloodGuard display language':'Chọn ngôn ngữ hiển thị của FloodGuard';
  dialog.querySelector('[data-language-close]').setAttribute('aria-label',lang==='en'?'Close':'Đóng');
  dialog.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.language===lang)));
  document.querySelectorAll('[data-language-current]').forEach(e=>{e.textContent=lang==='en'?'English':'Tiếng Việt';});
  document.getElementById('fgLanguageLogin')?.setAttribute('aria-label',lang==='en'?'Language: English':'Ngôn ngữ: Tiếng Việt');
  const note=dialog.querySelector('[role=status]');note.textContent=saved?'':lang==='en'?'This device could not save your choice. It applies to this page only.':'Thiết bị không lưu được lựa chọn. Ngôn ngữ chỉ áp dụng trên trang này.';
 }
 function finishClose(){if(!dialog.open)return;dialog.close();const target=opener?.isConnected&&opener.getClientRects().length?opener:document.querySelector('#fg12MobileNav button[data-fg14-more],#fgAdminMobileNav button[data-view=more],#fgLanguageLogin');target?.focus();}
 function close(){if(historyEntry){historyEntry=false;history.back();}else finishClose();}
 function open(button){
  opener=button;document.getElementById('fg14MoreClose')?.click();document.getElementById('fgAdminMobileMenu')?.close();
  refreshPicker();if(dialog.open)return;dialog.showModal();
  try{history.pushState({...history.state,fgLanguagePicker:true},'');historyEntry=true;}catch{historyEntry=false;}
  dialog.querySelector('[aria-checked=true]')?.focus();
 }
 function createButton(id,classes){
  const b=document.createElement('button');b.type='button';b.id=id;b.className=classes;b.innerHTML='<strong>'+globe+'</strong><div><b>Ngôn ngữ</b><span data-language-current></span></div>';b.onclick=()=>open(b);return b;
 }
 function mount(){
  const more=document.querySelector('#fg14MoreSheet .fg14-more-grid');
  if(more&&!document.getElementById('fgLanguageMore'))more.append(createButton('fgLanguageMore','fg14-more-item'));
  const admin=document.querySelector('#fgAdminMobileMenu .fg-admin-menu-items');
  if(admin&&!document.getElementById('fgLanguageAdmin'))admin.append(createButton('fgLanguageAdmin','fg-language-entry'));
  const login=document.querySelector('.fg31-auth-card,.loginCard,main[aria-labelledby=authTitle]');
  if(login&&!document.getElementById('fgLanguageLogin')){const bar=document.createElement('div');bar.className='fg-language-authbar';bar.append(createButton('fgLanguageLogin','fg-language-entry fg-language-login'));login.before(bar);}
  const nav=document.querySelector('.fg3-nav');
  if(nav&&!document.getElementById('fgLanguageDesktop'))nav.append(createButton('fgLanguageDesktop','fg-language-entry'));
  refreshPicker();
 }
 function init(){
  dialog=document.createElement('dialog');dialog.id='fgLanguagePicker';dialog.setAttribute('aria-labelledby','fgLanguageTitle');dialog.setAttribute('translate','no');
  dialog.innerHTML='<div class="fg-language-handle" aria-hidden="true"></div><button type="button" data-language-close aria-label="Đóng">×</button><h2 id="fgLanguageTitle">Ngôn ngữ</h2><p class="fg-language-description"></p><div role="radiogroup" aria-labelledby="fgLanguageTitle"><button type="button" role="radio" data-language="vi" aria-checked="true"><span class="fg-language-code">VI</span><span><b>Tiếng Việt</b><small>Vietnamese</small></span><i aria-hidden="true"></i></button><button type="button" role="radio" data-language="en" aria-checked="false"><span class="fg-language-code">EN</span><span><b>English</b><small>Tiếng Anh</small></span><i aria-hidden="true"></i></button></div><p role="status"></p>';
  document.body.append(dialog);
  dialog.querySelector('[data-language-close]').onclick=close;
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))close();});
  dialog.querySelectorAll('[data-language]').forEach(b=>{b.onclick=()=>{apply(b.dataset.language);if(saved)close();};b.onkeydown=e=>{if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=b.dataset.language==='vi'?'en':'vi';dialog.querySelector('[data-language='+next+']').focus();apply(next);}};});
  window.addEventListener('popstate',()=>{historyEntry=false;finishClose();});
  observer=new MutationObserver(records=>{for(const r of records){if(r.type==='childList'){for(const n of r.addedNodes)queue(n);}else queue(r.target);}});
  mount();visit(document.body);observe();
  window.addEventListener('storage',e=>{if(e.key===key)apply(valid(e.newValue)?e.newValue:'vi',false);});
 }
 window.FGLanguage={get:()=>lang,set:next=>apply(next),t:translate,open:()=>open(document.activeElement)};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
