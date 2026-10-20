(()=>{'use strict';
 const phone=/iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent)||(matchMedia('(pointer:coarse)').matches&&matchMedia('(max-width:950px)').matches);
 const mobile=location.pathname.startsWith('/mobile/');
 if(phone&&!mobile&&/^\/(?:index\.html|app-core\.html)?$/.test(location.pathname))location.replace('/mobile'+(location.pathname==='/'?'/':location.pathname)+location.search+location.hash);
 else if(!phone&&mobile)location.replace(location.pathname.slice(7)+location.search+location.hash);
})();
