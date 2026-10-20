
(function(){
 const h=document.querySelector('.fg3-brand h1');if(!h)return;const badge=document.createElement('span');badge.className='fg80-netbadge';badge.innerHTML='<i></i><span>Online</span>';h.appendChild(badge);
 function sync(){const on=navigator.onLine;badge.classList.toggle('off',!on);badge.querySelector('span').textContent=on?'Online':'Offline';if(!on)window.fg51Toast?.('Đang offline: tìm địa điểm và định tuyến trực tuyến có thể không hoạt động')}
 addEventListener('online',sync);addEventListener('offline',sync);sync();
})();
