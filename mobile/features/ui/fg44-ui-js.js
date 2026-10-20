
(function(){
  const side=document.querySelector('.fg3-side');
  const btn=document.getElementById('fg44Collapse');
  if(!side||!btn)return;
  btn.addEventListener('click',()=>{
    const collapsed=side.classList.toggle('fg44-collapsed');
    btn.setAttribute('aria-label',collapsed?'Mở rộng bảng thông tin':'Thu gọn bảng thông tin');
    btn.title=collapsed?'Mở rộng bảng thông tin':'Thu gọn bảng thông tin';
    try{localStorage.setItem('fg44SidebarCollapsed',collapsed?'1':'0')}catch(e){}
  });
  try{if(localStorage.getItem('fg44SidebarCollapsed')==='1')side.classList.add('fg44-collapsed')}catch(e){}
})();
