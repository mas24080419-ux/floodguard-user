(()=>{
 'use strict';
 async function decode(file){
  if(typeof createImageBitmap==='function'){try{return await createImageBitmap(file);}catch{}}
  const url=URL.createObjectURL(file),image=new Image();
  try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Không đọc được ảnh này. Nếu là HEIC/HEIF, hãy xuất hoặc chọn bản JPG/PNG.'));image.src=url;});return image;}finally{URL.revokeObjectURL(url);}
 }
 async function compress(file){
  if(!file)return null;
  if(file.size>25*1024*1024)throw Error('Ảnh cần nhỏ hơn 25 MB.');
  if(file.type&&!file.type.startsWith('image/'))throw Error('Hãy chọn một tệp ảnh.');
  const image=await decode(file);
  try{const width=image.width||image.naturalWidth,height=image.height||image.naturalHeight;if(!width||!height)throw Error('Ảnh không có kích thước hợp lệ.');
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('Thiết bị chưa đọc được ảnh. Hãy thử trình duyệt khác.');
   for(const edge of [960,720,480]){const scale=Math.min(1,edge/Math.max(width,height));canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);for(const quality of [.8,.6,.4]){const value=canvas.toDataURL('image/jpeg',quality);if(value.startsWith('data:image/jpeg;base64,')&&value.length<=180000)return value;}}
   throw Error('Chưa giảm được kích thước ảnh. Hãy chọn một ảnh khác.');
  }finally{image.close?.();}
 }
 window.FGReportPhoto={compress};
})();
