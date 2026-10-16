'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FGImportValidation=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const MAX_ROWS=5000;
 const aliases={street:['street','tuyen duong','tuyen duong lien ket','duong'],segment_id:['segment_id','ma doan duong'],date:['date','ngay','ngay su kien','ngay ngap'],time:['time','gio','thoi gian'],event_id:['event_id','ma su kien'],rain_mm:['rain_mm','rain','luong mua (mm)','luong mua'],rain_duration_h:['rain_duration_h','thoi doan mua (gio)'],depth_cm:['depth_cm','depth','do ngap chinh xac (cm)','do sau ngap (cm)'],depth_min_cm:['depth_min_cm','depth_min','do ngap min (cm)'],depth_max_cm:['depth_max_cm','depth_max','do ngap max (cm)'],tide_m:['tide_m','tide','muc trieu chinh xac (m)'],lat:['lat','latitude','vi do'],lon:['lon','longitude','kinh do'],source_url:['source_url','url nguon','url','nguon url'],data_kind:['data_kind','loai du lieu'],flooded:['flooded','co ngap'],note:['note','ghi chu']};
 function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').trim().toLowerCase().replace(/\s+/g,' ')}
 const lookup=new Map(Object.entries(aliases).flatMap(([k,vs])=>vs.map(v=>[norm(v),k])));
 function blank(v){return v==null||String(v).trim()===''}
 function numeric(v){if(blank(v))return null;if(typeof v==='number')return Number.isFinite(v)?v:NaN;const s=String(v).trim();if(!/^[+-]?\d+(?:[.,]\d+)?$/.test(s))return NaN;return Number(s.replace(',','.'))}
 function date(v){if(typeof v!=='string')return null;let s=v.trim(),m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(m)s=m[3]+'-'+m[2]+'-'+m[1];if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s?s:null}
 function source(v){try{const u=new URL(String(v).trim());return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&u.hostname.includes('.')?u.href:null}catch{return null}}
 function fingerprint(r){return JSON.stringify(['street','segment_id','date','time','event_id','rain_mm','rain_duration_h','depth_cm','depth_min_cm','depth_max_cm','tide_m','lat','lon','source_url','data_kind','flooded'].map(k=>k==='street'?norm(r[k]):r[k]??null))}
 function validate(input,now=new Date()){
  const errors=[],warnings=[],rows=[],seen=new Set(),events=new Map();let duplicates=0;
  if(!Array.isArray(input)||!input.length||input.length>MAX_ROWS)return {valid:false,errors:[{row:0,message:'File phải có 1–5000 dòng dữ liệu.'}],warnings,rows,duplicates};
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  input.forEach((raw,index)=>{const line=index+2,before=errors.length,r={};const err=m=>errors.push({row:line,message:m});const warn=m=>warnings.push({row:line,message:m});
   if(!raw||typeof raw!=='object'||Array.isArray(raw)){err('Dòng không hợp lệ.');return}
   const mapped={};for(const [key,v] of Object.entries(raw)){const k=lookup.get(norm(key));if(k){if(Object.prototype.hasOwnProperty.call(mapped,k))err('Trùng cột ánh xạ: '+k);else mapped[k]=v}}
   for(const [k,max] of Object.entries({street:160,segment_id:160,time:80,event_id:160,note:2000})){r[k]=String(mapped[k]??'').normalize('NFC').trim();if(r[k].length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(r[k]))err('Nội dung quá dài hoặc có ký tự không hợp lệ: '+k)}
   if(!r.street)err('Thiếu tên đường (street).');r.date=date(mapped.date);if(!r.date)err('Ngày phải là YYYY-MM-DD hoặc DD/MM/YYYY và có thật.');
   const kind=norm(mapped.data_kind);r.data_kind=({real:'real','thuc te':'real',simulated:'simulated','mo phong':'simulated'})[kind];if(!r.data_kind)err('data_kind phải là real (thực tế) hoặc simulated (mô phỏng).');
   if(r.data_kind==='real'&&r.date&&r.date>today)err('Quan sát thực tế không được nằm trong tương lai.');
   r.source_url=source(mapped.source_url);if(!r.source_url||r.source_url.length>2000)err('Cần một URL nguồn http/https hợp lệ cho mỗi dòng; mô phỏng phải có nguồn phương pháp/kịch bản.');
   for(const [k,min,max] of [['rain_mm',0,3000],['rain_duration_h',0.01,744],['depth_cm',0,1000],['depth_min_cm',0,1000],['depth_max_cm',0,1000],['tide_m',-10,15],['lat',-90,90],['lon',-180,180]]){r[k]=numeric(mapped[k]);if(r[k]!==null&&(!Number.isFinite(r[k])||r[k]<min||r[k]>max))err(k+' không hợp lệ; giới hạn '+min+'–'+max+'.')}
   if((r.lat===null)!==(r.lon===null))err('Tọa độ phải có đủ lat và lon.');
   if(r.depth_min_cm!==null&&r.depth_max_cm!==null&&r.depth_min_cm>r.depth_max_cm)err('Độ ngập min lớn hơn max.');
   if(r.depth_cm!==null&&((r.depth_min_cm!==null&&r.depth_cm<r.depth_min_cm)||(r.depth_max_cm!==null&&r.depth_cm>r.depth_max_cm)))err('Độ ngập chính xác nằm ngoài khoảng min–max.');
   const f=norm(mapped.flooded);r.flooded=blank(mapped.flooded)?null:({1:true,0:false,true:true,false:false,co:true,khong:false})[f];if(r.flooded===undefined)err('flooded chỉ nhận 1/0, true/false, có/không.');
   if(r.flooded===false&&((r.depth_cm??0)>0||(r.depth_min_cm??0)>0||(r.depth_max_cm??0)>0))err('Nhãn không ngập mâu thuẫn với độ sâu dương.');if(r.flooded===true&&r.depth_cm===0)err('Nhãn ngập mâu thuẫn với độ sâu chính xác bằng 0.');
   if(r.rain_mm===null&&r.depth_cm===null&&r.depth_min_cm===null&&r.depth_max_cm===null&&r.flooded===null)err('Cần ít nhất lượng mưa, độ ngập hoặc nhãn ngập.');
   if(r.rain_mm!==null&&r.rain_duration_h===null)warn('Chưa rõ thời đoạn mưa; chỉ lưu tham khảo, chưa đủ điều kiện ghép biến mưa cho mô hình.');
   if(r.lat===null)warn('Chưa có tọa độ; chưa thể gắn chính xác lên bản đồ.');if(r.depth_cm===null)warn('Không có độ sâu chính xác; không tự điền từ mô tả hoặc khoảng.');
   if(errors.length>before)return;const fp=fingerprint(r);if(seen.has(fp)){duplicates++;return}seen.add(fp);
   const key=JSON.stringify([norm(r.street),r.segment_id,r.date,r.event_id,r.time,r.data_kind]);const prev=events.get(key);if(prev&&fingerprint(prev)!==fp)warn('Cùng đường/sự kiện/thời điểm có thông tin khác; cần đối chiếu nguồn trước khi duyệt.');events.set(key,r);rows.push(r);
  });
  return {valid:errors.length===0,errors,warnings,rows,duplicates,total:input.length};
 }
 return {MAX_ROWS,validate,fingerprint,norm};
});
