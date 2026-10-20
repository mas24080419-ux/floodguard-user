
(function(){
 if(window.FG138_PREMIUM_READY)return;window.FG138_PREMIUM_READY=true;
 const icons={
  fg3RouteBtn:'<svg viewBox="0 0 24 24"><path d="M6 19c-1.7 0-3-1.3-3-3s1.3-3 3-3h12a3 3 0 1 0 0-6H9"/><circle cx="6" cy="16" r="2"/><circle cx="9" cy="7" r="2"/></svg>',
  fg10LiveBtn:'<svg viewBox="0 0 24 24"><path d="M7 16.5a4.5 4.5 0 1 1 1.4-8.8A5.5 5.5 0 0 1 19 10a3.5 3.5 0 0 1-1 6.8"/><path d="m9 19-1 2m5-2-1 2m5-2-1 2"/></svg>',
  fg3AnalyzeBtn:'<svg viewBox="0 0 24 24"><path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/><path d="m3 7 6-3 6 5 5-5"/></svg>',
  fg3EVBtn:'<svg viewBox="0 0 24 24"><path d="M7 3h8v9H7z"/><path d="M9 6h4M9 9h4M15 5h2a2 2 0 0 1 2 2v8a2 2 0 0 0 2 2"/><path d="M9 12v6m4-6v6M5 21h12"/></svg>',
  fg3StationBtn:'<svg viewBox="0 0 24 24"><path d="M12 3v3m-5.5-.5 2.2 2.2M17.5 5.5l-2.2 2.2"/><path d="M8 14a4 4 0 0 1 8 0v5H8z"/><path d="M5 21h14"/><path d="M12 10v5"/></svg>',
  fg70DecisionBtn:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><path d="M17 14v6m-3-3h6"/></svg>'
 };
 const mobileIcons={
 fg3RouteBtn:'<svg viewBox="0 0 24 24"><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h5"/></svg>',
 fg10LiveBtn:'<svg viewBox="0 0 24 24"><path d="M7 16a5 5 0 1 1 1-10 6 6 0 0 1 11 3 4 4 0 0 1-1 8H7Z"/><path d="m8 20 1-2m5 3 1-2"/></svg>',
 fg3AnalyzeBtn:'<svg viewBox="0 0 24 24"><path d="M4 3v17h17M8 16v-4m5 4V8m5 8v-6M6 8l5-4 5 3 5-5"/></svg>'
 };
 const labels={fg3RouteBtn:'Lộ trình',fg10LiveBtn:'Thời tiết',fg3AnalyzeBtn:'Phân tích',fg3EVBtn:'Trạm sạc',fg3StationBtn:'Trạm đo',fg70DecisionBtn:'Trung tâm'};
 function apply(){
   Object.entries(icons).forEach(([id,svg])=>{const b=document.getElementById(id);const ico=b?.querySelector('.fg14-nav-ico');if(ico)ico.innerHTML=svg});
   document.querySelectorAll('.fg136-mini').forEach(m=>{const id=m.dataset.target;if(icons[id])m.innerHTML=icons[id];m.dataset.fg138Label=labels[id]||m.title||''});
   document.querySelectorAll('#fg12MobileNav button').forEach(b=>{const svg=mobileIcons[b.dataset.target]||icons[b.dataset.target]||(b.hasAttribute('data-fg14-more')?'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/></svg>':null);if(!svg)return;for(const node of [...b.childNodes])if(node.nodeType===3)node.remove();let icon=b.querySelector('.fg-mobile-nav-icon');if(!icon){icon=document.createElement('span');icon.className='fg-mobile-nav-icon';icon.setAttribute('aria-hidden','true');b.prepend(icon);}icon.innerHTML=svg;});
   const version=document.querySelector('.fg12-version');if(version)version.textContent='13.8';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0));else setTimeout(apply,0);
 setTimeout(apply,180);
})();
