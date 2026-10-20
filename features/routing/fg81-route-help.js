
(function(){
  function init(){
    const a=document.getElementById('fg3PickFrom'),b=document.getElementById('fg3PickTo'),run=document.getElementById('fg3RouteRun'),rain=document.getElementById('fg3RouteRain');
    if(a){a.title='Chọn điểm đi trực tiếp trên bản đồ';a.setAttribute('aria-label',a.title)}
    if(b){b.title='Chọn điểm đến trực tiếp trên bản đồ';b.setAttribute('aria-label',b.title)}
    if(run){run.title='Tìm đường. Nếu máy chủ chính không phản hồi, FloodGuard sẽ tự thử máy chủ dự phòng.'}
    const host=document.getElementById('fg3RouteStatus');if(host&&!document.getElementById('fg81NetHelp')){const d=document.createElement('div');d.id='fg81NetHelp';d.className='fg81-nethelp';d.innerHTML='<b>Chế độ mạng linh hoạt:</b> tìm địa điểm có 3 nguồn trực tuyến + dữ liệu cục bộ; ô tô/xe máy có máy chủ định tuyến dự phòng. Nếu tìm địa điểm vẫn lỗi, bấm nút ◈ bên phải ô nhập để chọn trực tiếp trên bản đồ.';host.insertAdjacentElement('afterend',d)}
    if(rain){rain.addEventListener('change',()=>{const v=Number(rain.value);if(v>1000&&window.fg51Toast)window.fg51Toast('Lượng mưa đang lớn hơn 1.000 mm. Hãy kiểm tra lại đơn vị/kịch bản.')})}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
