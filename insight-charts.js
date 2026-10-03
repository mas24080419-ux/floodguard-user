/* Shared interactive charts. Missing measurements remain gaps, never zeroes. */
(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 const format=v=>finite(v)?new Intl.NumberFormat('vi-VN',{maximumFractionDigits:1}).format(v):'Chưa có dữ liệu';
 const safeURL=v=>/^https?:\/\//i.test(String(v||''))?String(v):'';
 function chart({rows,series,title,note='',xLabel='',numericX=false,width:requestedWidth=760}){
  const good=rows.some(r=>series.some(s=>finite(r[s.key])));
  if(!good)return '<div class="fg-empty">Chưa có dữ liệu hợp lệ để vẽ '+esc(title.toLowerCase())+'.</div>';
  const W=Math.max(320,Math.min(1000,requestedWidth||760)),H=300,L=48,R=W-48,T=38,B=242,width=R-L,height=B-T;
  const scale={};for(const axis of ['left','right']){const values=series.filter(s=>(s.axis||'left')===axis).flatMap(s=>rows.map(r=>r[s.key]).filter(finite));const peak=Math.max(1,...values);const raw=peak/4;const power=Math.pow(10,Math.floor(Math.log10(raw)));const step=[1,2,2.5,5,10].map(v=>v*power).find(v=>v>=raw)||10*power;scale[axis]=step*4;}
  const rawX=rows.map(r=>r.x),xs=numericX&&rawX.every(finite)?rawX:null;
  const xmin=xs?Math.min(...xs):0,xmax=xs?Math.max(...xs):Math.max(1,rows.length-1);
  const x=i=>rows.length===1?(L+R)/2:L+((xs?xs[i]:i)-xmin)/Math.max(1,xmax-xmin)*width;
  const y=(v,axis)=>B-v/scale[axis||'left']*height;
  const barSeries=series.filter(s=>s.type==='bar'),barWidth=Math.min(36,width/Math.max(1,rows.length)*.55/Math.max(1,barSeries.length));
  let svg='<svg class="fg-chart-svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title><desc>'+esc(note)+'</desc>';
  for(let n=0;n<=4;n++){const yy=B-n/4*height;svg+='<line x1="'+L+'" x2="'+R+'" y1="'+yy+'" y2="'+yy+'" class="fg-chart-grid"/><text x="'+(L-9)+'" y="'+(yy+5)+'" text-anchor="end" class="fg-chart-axis">'+format(scale.left*n/4)+'</text>';if(series.some(s=>s.axis==='right'))svg+='<text x="'+(R+9)+'" y="'+(yy+5)+'" class="fg-chart-axis">'+format(scale.right*n/4)+'</text>';}
  const unit=axis=>[...new Set(series.filter(s=>(s.axis||'left')===axis).map(s=>s.unit))].join(' / ');
  svg+='<text x="'+L+'" y="21" class="fg-chart-axis">'+esc(unit('left'))+'</text><text x="'+R+'" y="21" text-anchor="end" class="fg-chart-axis">'+esc(unit('right'))+'</text>';
  barSeries.forEach((s,j)=>rows.forEach((r,i)=>{if(!finite(r[s.key]))return;const xx=x(i)-barWidth*barSeries.length/2+j*barWidth,yy=y(r[s.key],s.axis);svg+='<rect x="'+xx+'" y="'+yy+'" width="'+Math.max(1,barWidth-2)+'" height="'+Math.max(0,B-yy)+'" rx="1.5" fill="'+s.color+'" opacity=".78"><title>'+esc(r.label+': '+s.label+' '+format(r[s.key])+' '+s.unit)+'</title></rect>';}));
  series.filter(s=>s.type!=='bar').forEach(s=>{let path='',open=false;rows.forEach((r,i)=>{if(!finite(r[s.key])){open=false;return;}path+=(open?' L ':' M ')+x(i)+' '+y(r[s.key],s.axis);open=true;});svg+='<path d="'+path+'" fill="none" stroke="'+s.color+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';rows.forEach((r,i)=>{if(finite(r[s.key]))svg+='<circle cx="'+x(i)+'" cy="'+y(r[s.key],s.axis)+'" r="3.5" fill="'+s.color+'"><title>'+esc(r.label+': '+s.label+' '+format(r[s.key])+' '+s.unit)+'</title></circle>';});});
  const tickStep=Math.max(1,Math.ceil(rows.length/(W<450?3:5)));rows.forEach((r,i)=>{if(i%tickStep!==0&&i!==rows.length-1)return;const label=String(r.tick||r.label||'');svg+='<text x="'+x(i)+'" y="265" text-anchor="'+(i===0?'start':i===rows.length-1?'end':'middle')+'" class="fg-chart-axis">'+esc(label.length>14?label.slice(0,12)+'…':label)+'</text>';});
  svg+='<text x="'+R+'" y="290" text-anchor="end" class="fg-chart-axis">'+esc(xLabel)+'</text><g class="fg-chart-cursor" visibility="hidden"><line x1="0" x2="0" y1="'+T+'" y2="'+B+'"/><circle r="6"/></g></svg>';
  const encoded=encodeURIComponent(JSON.stringify({rows,series,x:rows.map((_,i)=>x(i)),yScales:scale,W,L,R,T,B}));
  return '<figure class="fg-chart" data-chart="'+encoded+'"><figcaption>'+esc(title)+'</figcaption><div class="fg-chart-legend">'+series.map(s=>'<span><i style="background:'+s.color+'"></i>'+esc(s.label)+(s.axis==='right'?' · trục phải':' · trục trái')+'</span>').join('')+'</div>'+svg+'<div class="fg-chart-controls"><button type="button" data-chart-step="-1" aria-label="Điểm dữ liệu trước">‹</button><span>Chạm hoặc rê chuột để xem số liệu</span><button type="button" data-chart-step="1" aria-label="Điểm dữ liệu tiếp theo">›</button></div><div class="fg-chart-readout" aria-live="polite"></div>'+(note?'<p class="fg-chart-note">'+esc(note)+'</p>':'')+'</figure>';
 }
 function mount(root){root.querySelectorAll('.fg-chart[data-chart]').forEach(el=>{if(el.dataset.bound)return;el.dataset.bound='1';const d=JSON.parse(decodeURIComponent(el.dataset.chart)),svg=el.querySelector('svg'),cursor=svg.querySelector('.fg-chart-cursor'),readout=el.querySelector('.fg-chart-readout');let selected=d.rows.length-1;
  function show(i){selected=Math.max(0,Math.min(d.rows.length-1,i));const r=d.rows[selected],s=d.series.find(s=>finite(r[s.key]));cursor.setAttribute('visibility','visible');const line=cursor.querySelector('line');line.setAttribute('x1',d.x[selected]);line.setAttribute('x2',d.x[selected]);const dot=cursor.querySelector('circle');dot.setAttribute('visibility',s?'visible':'hidden');if(s){dot.setAttribute('cx',d.x[selected]);dot.setAttribute('cy',d.B-r[s.key]/d.yScales[s.axis||'left']*(d.B-d.T));dot.setAttribute('fill',s.color);}
   const source=safeURL(String(r.source_url||'').split(' | ')[0]);readout.innerHTML='<b>'+esc(r.label)+'</b><div>'+d.series.map(s=>'<span><i style="background:'+s.color+'"></i>'+esc(s.label)+': <strong>'+format(r[s.key])+'</strong> '+(finite(r[s.key])?esc(s.unit):'')+'</span>').join('')+'</div>'+(source?'<a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">Nguồn ghi nhận ↗</a>':'')+(r.detail?'<small>'+esc(r.detail)+'</small>':'');
  }
  function inspect(e){const rect=svg.getBoundingClientRect(),xx=(e.clientX-rect.left)/rect.width*d.W;let nearest=0;d.x.forEach((v,i)=>{if(Math.abs(v-xx)<Math.abs(d.x[nearest]-xx))nearest=i;});show(nearest);}
  svg.addEventListener('pointermove',inspect);svg.addEventListener('pointerdown',inspect);el.querySelectorAll('[data-chart-step]').forEach(b=>b.onclick=()=>show(selected+Number(b.dataset.chartStep)));show(selected);
 });}
 window.FGInsightCharts={chart,mount};
})();
