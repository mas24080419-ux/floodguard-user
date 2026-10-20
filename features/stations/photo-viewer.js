
(function(){
 const box=document.getElementById('fg47Lightbox'),img=document.getElementById('fg47LightboxImg'),cap=document.getElementById('fg47LightboxCaption'),close=document.getElementById('fg47LightboxClose');
 function hide(){box.classList.remove('show');box.setAttribute('aria-hidden','true');img.removeAttribute('src')}
 document.addEventListener('click',function(ev){const t=ev.target.closest&&ev.target.closest('.fg47-photo-open');if(!t)return;ev.preventDefault();ev.stopPropagation();img.src=t.dataset.photo;img.alt=t.dataset.real==='1'?'Ảnh thực địa trạm sạc EV':'Ảnh minh họa trạm sạc EV';cap.textContent=t.dataset.caption||'Ảnh trạm sạc';box.classList.add('show');box.setAttribute('aria-hidden','false')});
 close.onclick=hide;box.addEventListener('click',e=>{if(e.target===box)hide()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&box.classList.contains('show'))hide()});
})();
