'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FGCsv=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function parse(text){
  text=String(text).replace(/^\ufeff/,'');let quoted=false,counts={',':0,';':0,'\t':0};
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){i++;continue}quoted=!quoted}else if(!quoted){if(c==='\n'||c==='\r')break;if(c in counts)counts[c]++}}
  const sep=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
  let cells=[],row=[],value='',quote=false,closed=false,start=true;
  function cell(){row.push(value);value='';closed=false;start=true}
  function line(){cell();if(row.some(x=>x.trim()!==''))cells.push(row);row=[];if(cells.length>5001)throw Error('CSV vượt 5.000 dòng dữ liệu.')}
  for(let i=0;i<text.length;i++){const c=text[i];if(quote){if(c==='"'){if(text[i+1]==='"'){value+='"';i++}else{quote=false;closed=true}}else value+=c;continue}
   if(c==='"'){if(!start)throw Error('Dấu nháy CSV không hợp lệ.');quote=true;start=false}
   else if(c===sep)cell();else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;line()}else{if(closed)throw Error('Ký tự thừa sau ô CSV có dấu nháy.');value+=c;start=false}}
  if(quote)throw Error('CSV chưa đóng dấu nháy.');if(value!==''||row.length)line();if(cells.length<2)throw Error('CSV chưa có dữ liệu.');
  const headers=cells.shift().map(s=>s.trim());if(headers.some(s=>!s)||new Set(headers.map(s=>s.toLowerCase())).size!==headers.length)throw Error('Tên cột trống hoặc trùng.');
  return cells.map((r,i)=>{if(r.length!==headers.length)throw Error('Số cột không khớp tại dòng dữ liệu '+(i+2));return Object.fromEntries(headers.map((h,j)=>[h,r[j]]))});
 }
 function encode(rows,headers){const cell=v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s)&&typeof v!=='number')s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};return '\ufeff'+[headers,...rows.map(r=>headers.map(h=>r[h]))].map(r=>r.map(cell).join(',')).join('\r\n')}
 return {parse,encode};
});
