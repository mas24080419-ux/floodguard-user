
(function(){
 const nav=document.querySelector('.fg3-nav');
 if(!nav||window.FG136_GPU_DOCK_READY)return;window.FG136_GPU_DOCK_READY=true;window.FG137_DOCK=true;
 const defs=[
   ['fg3RouteBtn','🛣','Lộ trình'],['fg10LiveBtn','⛈','Thời tiết'],['fg3AnalyzeBtn','☔','Phân tích'],
   ['fg3EVBtn','⚡','Trạm sạc'],['fg70DecisionBtn','◈','Trung tâm']
 ];
 const shell=document.createElement('i');shell.className='fg136-shell';shell.setAttribute('aria-hidden','true');nav.prepend(shell);
 const strip=document.createElement('div');strip.className='fg136-compact-strip';strip.setAttribute('aria-label','Điều hướng nhanh');
 defs.forEach(([id,ico,label])=>{
   const m=document.createElement('button');m.type='button';m.className='fg136-mini';m.dataset.target=id;m.innerHTML=ico;m.title=label;m.setAttribute('aria-label',label);strip.appendChild(m);
 });
 nav.appendChild(strip);
 let leaveTimer=0, measureTimer=0;
 function originals(){return defs.map(([id])=>document.getElementById(id)).filter(Boolean)}
 function measure(){
   if(innerWidth<=700)return;
   clearTimeout(measureTimer);measureTimer=setTimeout(()=>{
     const was=nav.classList.contains('fg14-compact');
     // Open width is stable because compact mode no longer changes layout dimensions.
     const open=Math.max(1,nav.getBoundingClientRect().width);
     const cs=getComputedStyle(strip), gap=parseFloat(cs.gap)||2;
     const compact=34*strip.children.length+gap*Math.max(0,strip.children.length-1)+6;
     const scale=Math.max(.34,Math.min(.92,compact/open));
     nav.style.setProperty('--fg136-compact-scale',String(scale));
     if(was)nav.classList.add('fg14-compact');
   },40);
 }
 function sync(){
   const active=originals().find(b=>b.classList.contains('active')||b.classList.contains('primary'))?.id||'';
   strip.querySelectorAll('.fg136-mini').forEach(b=>b.classList.toggle('active',b.dataset.target===active));
 }
 function expand(){clearTimeout(leaveTimer);nav.classList.remove('fg14-compact')}
 function collapseLater(ms=80){
   clearTimeout(leaveTimer);leaveTimer=setTimeout(()=>{
     if(innerWidth<=900||nav.matches(':focus-within')||strip.matches(':hover')||originals().some(b=>b.matches(':hover')))return;
     nav.classList.add('fg14-compact');
   },ms);
 }
 strip.addEventListener('click',e=>{const b=e.target.closest('.fg136-mini');if(!b)return;document.getElementById(b.dataset.target)?.click();expand();collapseLater(260)});
 strip.addEventListener('mouseenter',expand);strip.addEventListener('mouseleave',()=>collapseLater(80));
 shell.addEventListener('mouseenter',expand);shell.addEventListener('mouseleave',()=>collapseLater(80));
 originals().forEach(b=>{b.addEventListener('mouseenter',expand);b.addEventListener('mouseleave',()=>collapseLater(80));b.addEventListener('click',()=>{sync();collapseLater(320)})});
 const mo=new MutationObserver(sync);originals().forEach(b=>mo.observe(b,{attributes:true,attributeFilter:['class']}));
 document.getElementById('map')?.addEventListener('pointerdown',()=>collapseLater(0),{passive:true});
 window.addEventListener('resize',measure,{passive:true});
 if(document.fonts?.ready)document.fonts.ready.then(measure);
 setTimeout(()=>{measure();sync()},100);setTimeout(measure,500);
})();
