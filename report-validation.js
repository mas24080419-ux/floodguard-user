(()=>{
 'use strict';
 function validate(d){
  if(!d.authenticated)return {message:'Phiên đăng nhập chưa sẵn sàng. Hãy đăng nhập lại FloodGuard.',field:null};
  if(d.photoProcessing)return {message:'Ảnh đang được xử lý. Vui lòng chờ.',field:'cgPhoto'};
  if(d.photoError)return {message:d.photoError+' Chọn ảnh khác hoặc bấm Bỏ ảnh đã chọn.',field:'cgPhoto'};
  if(!d.chosen)return {message:'Bạn chưa chọn vị trí báo cáo. Bấm Dùng vị trí hiện tại hoặc Chọn trên bản đồ ở đầu biểu mẫu.',field:'cgChooseMap'};
  const {lat,lon}=d.chosen;
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<10.2||lat>11.4||lon<106.2||lon>107.2)return {message:'Báo cáo hiện hỗ trợ khu vực TP.HCM. Vị trí bạn chọn nằm ngoài khu vực này; hãy chọn đúng địa điểm tại TP.HCM trên bản đồ.',field:'cgChooseMap'};
  if(String(d.place||'').trim().length<3)return {message:'Nhập tên đường hoặc địa điểm báo cáo, tối thiểu 3 ký tự.',field:'cgPlace'};
  if(String(d.place||'').trim().length>120)return {message:'Tên địa điểm tối đa 120 ký tự.',field:'cgPlace'};
  if(String(d.description||'').trim().length>500)return {message:'Mô tả tối đa 500 ký tự.',field:'cgDescription'};
  if(!['shallow','deep','blocked','unknown'].includes(d.severity))return {message:'Chọn tình trạng ngập quan sát được.',field:'cgSeverity'};
  if(!d.consent)return {message:'Tích đồng ý chia sẻ báo cáo trước khi gửi.',field:'cgConsent'};
  return null;
 }
 window.FGReportValidation={validate};
})();
