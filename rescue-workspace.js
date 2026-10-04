/* Presentation controls only. Existing auth, selection and API handlers remain authoritative. */
(function(){
 'use strict';
 const list=document.getElementById('cases');
 const detail=document.querySelector('.detailBody');
 if(!list||!detail)return;
 const workspace=list.closest('.work,.grid');
 if(!workspace)return;
 workspace.classList.add('fg-rescue-workspace');
 workspace.dataset.rescueTab='info';
 const panel=detail.closest('.panel');
 const back=document.createElement('button');
 back.type='button';back.className='fg-rescue-back';back.textContent='← Danh sách yêu cầu';
 panel.prepend(back);
 const tabs=document.createElement('div');
 tabs.className='fg-rescue-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Chi tiết SOS');
 tabs.innerHTML='<button type="button" role="tab" id="fgRescueInfoTab" aria-controls="info" aria-selected="true">Thông tin</button><button type="button" role="tab" id="fgRescueChatTab" aria-controls="fgRescueChat" aria-selected="false" tabindex="-1">Trao đổi</button>';
 panel.querySelector('.detailHead').after(tabs);
 const chat=detail.querySelector('.chat');chat.id='fgRescueChat';
 const heading=document.createElement('h3');heading.className='fg-rescue-chat-title';heading.textContent='Trao đổi cứu hộ';chat.prepend(heading);
 function selectTab(tab){
  workspace.dataset.rescueTab=tab;
  const buttons=tabs.querySelectorAll('button');
  buttons.forEach((b,i)=>{const selected=(i===0)===(tab==='info');b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
  if(tab==='info')window.dispatchEvent(new Event('resize'));
 }
 tabs.addEventListener('click',e=>{const b=e.target.closest('button');if(b)selectTab(b.id==='fgRescueInfoTab'?'info':'chat');});
 tabs.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tab=e.key==='Home'?'info':e.key==='End'?'chat':workspace.dataset.rescueTab==='info'?'chat':'info';selectTab(tab);tabs.querySelector(tab==='info'?'#fgRescueInfoTab':'#fgRescueChatTab').focus();}});
 list.addEventListener('click',e=>{if(!e.target.closest('.case[data-id]'))return;workspace.classList.add('fg-rescue-selected');selectTab('info');if(matchMedia('(max-width:700px)').matches){panel.scrollIntoView({block:'start',behavior:'auto'});back.focus({preventScroll:true});}},true);
 back.addEventListener('click',()=>{workspace.classList.remove('fg-rescue-selected');const selected=list.querySelector('.case.active');if(selected)selected.focus();});
})();
