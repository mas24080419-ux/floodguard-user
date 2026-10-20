
(function(){
 const $=id=>document.getElementById(id);
 function syncRain(v,source){v=Math.max(0,Number(v)||0);if(source!=='analysis'&&$('fg3Rain'))$('fg3Rain').value=v;if(source!=='ev'&&$('fg4EvRain')){$('fg4EvRain').value=v;$('fg4EvRain').dispatchEvent(new Event('input',{bubbles:true}))}if(source!=='route'&&$('fg3RouteRain'))$('fg3RouteRain').value=v;if($('fg3RainKpi'))$('fg3RainKpi').textContent=`${Math.round(v*10)/10} mm`}
 $('fg3Rain')?.addEventListener('change',e=>syncRain(e.target.value,'analysis'));
 $('fg4EvRainApply')?.addEventListener('click',()=>syncRain($('fg4EvRain')?.value,'ev'));
 document.querySelectorAll('[data-ev-rain]').forEach(b=>b.addEventListener('click',()=>syncRain(b.dataset.evRain,'ev')));
 document.addEventListener('fg70:route',e=>{const v=e.detail?.rain;if(Number.isFinite(Number(v)))syncRain(v,'route')});
 window.FG15SyncRain=syncRain;
})();
