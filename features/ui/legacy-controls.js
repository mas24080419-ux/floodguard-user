
(function(){
  const commandPanel=document.getElementById('commandPanel');
  const commandBtn=document.getElementById('commandBtn');
  const commandClose=document.getElementById('commandClose');
  const ccTitle=document.getElementById('ccTitle');
  const titleMap={ccOverview:'Tổng quan hỗ trợ quyết định',ccStreet:'Phân tích tuyến đường',ccImpact:'Tác động theo đối tượng',ccMethod:'Phương pháp & toàn vẹn dữ liệu'};
  function openCommand(pane='ccOverview'){
    commandPanel.classList.add('open'); commandPanel.setAttribute('aria-hidden','false');
    document.querySelectorAll('.cc-pane').forEach(x=>x.classList.toggle('active',x.id===pane));
    document.querySelectorAll('.cc-nav button').forEach(x=>x.classList.toggle('active',x.dataset.cc===pane));
    ccTitle.textContent=titleMap[pane]||'FloodGuard HCMC';
    if(pane==='ccStreet') renderStreetProfile();
  }
  function closeCommand(){commandPanel.classList.remove('open');commandPanel.setAttribute('aria-hidden','true')}
  commandBtn.onclick=()=>openCommand('ccOverview'); commandClose.onclick=closeCommand;
  document.querySelectorAll('.cc-nav button').forEach(b=>b.onclick=()=>openCommand(b.dataset.cc));
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeCommand()});

  const ready=STREET_CATALOG.filter(x=>x.tier==='FORECAST_READY');
  const limited=STREET_CATALOG.filter(x=>x.tier==='LIMITED_NUMERIC');
  const occurrence=STREET_CATALOG.filter(x=>x.tier==='OCCURRENCE_ONLY');
  const quant=STREET_CATALOG.filter(x=>x.quant_events>0);
  const totalPorts=EV.reduce((a,x)=>a+(Number(x.ports)||0),0);
  const fastPorts=EV.reduce((a,x)=>a+(Number(x.fast_ports)||0),0);
  const linked=EV.filter(x=>(x.candidate_pairs||[]).length>0).length;
  const high=EV.filter(x=>x.screening_priority==='HIGH').length;
  const setText=(id,v)=>{const e=document.getElementById(id); if(e)e.textContent=v};
  setText('ccEvN',EV.length);setText('ccStreetN',STREET_CATALOG.length);setText('ccQuantN',quant.length);setText('ccReadyN',ready.length);setText('ccPairsN',AUDIT.candidate_pairs);setText('ccRecN',CURRENT_RECURRENCE_2026.length);
  setText('ccReadyText',`${ready.length} / ${STREET_CATALOG.length}`);setText('ccLimitedText',`${limited.length} tuyến`);setText('ccOccText',`${occurrence.length} tuyến`);document.getElementById('ccReadyBar').style.width=`${Math.round(ready.length/STREET_CATALOG.length*100)}%`;
  setText('ccPorts',totalPorts.toLocaleString());setText('ccFastPorts',fastPorts.toLocaleString());setText('ccCandStations',linked);setText('ccHighStations',high);

  const byStreet=new Map();
  FORECAST_EVENTS.forEach(e=>{if(!byStreet.has(e.street))byStreet.set(e.street,[]);byStreet.get(e.street).push(e)});
  const top=[...byStreet.entries()].map(([street,rows])=>({street,rows,n:rows.length,maxDepth:Math.max(...rows.map(x=>Number(x.depth)||0)),maxRain:Math.max(...rows.map(x=>Number(x.rain)||0)),first:rows.map(x=>x.date).sort()[0],last:rows.map(x=>x.date).sort().slice(-1)[0],ev:candidateStationsFor(street).length})).sort((a,b)=>b.n-a.n||b.maxDepth-a.maxDepth).slice(0,12);
  document.getElementById('ccTopStreetTable').innerHTML=top.map(x=>`<tr><td><b>${esc(x.street)}</b></td><td>${x.n}</td><td>${fmt1(x.maxDepth)} cm</td><td>${fmt1(x.maxRain)} mm</td><td>${esc(x.first)} → ${esc(x.last)}</td><td>${x.ev}</td><td><button class="qs-btn cc-go-street" data-street="${esc(x.street)}">Xem chi tiết</button></td></tr>`).join('');
  document.getElementById('ccTopStreetTable').onclick=e=>{const b=e.target.closest('.cc-go-street');if(!b)return;ccStreetSelect.value=b.dataset.street;openCommand('ccStreet')};

  const ccStreetSelect=document.getElementById('ccStreetSelect'), ccRainInput=document.getElementById('ccRainInput');
  ccStreetSelect.innerHTML=STREET_CATALOG.slice().sort((a,b)=>a.name.localeCompare(b.name,'vi')).map(x=>`<option value="${esc(x.name)}">${esc(x.name)} · ${x.tier==='FORECAST_READY'?'đủ dữ liệu phân tích':x.tier==='LIMITED_NUMERIC'?'định lượng hạn chế':'chỉ có bằng chứng từng ngập'}</option>`).join('');
  if(ccStreetSelect.querySelector('option[value="Quốc Hương"]')) ccStreetSelect.value='Quốc Hương';
  function row(label,value){return `<div class="cc-row"><span>${label}</span><b>${value}</b></div>`}
  function renderStreetProfile(){
    const street=ccStreetSelect.value,cat=STREET_CATALOG.find(x=>x.name===street)||{quant_events:0,occurrence_rows:0,sources:[],tier:'OCCURRENCE_ONLY'};const rows=byStreet.get(street)||[];const cand=candidateStationsFor(street);
    const tier=cat.tier==='FORECAST_READY'?'<span class="cc-tag good">Mẫu lịch sử đủ dữ liệu phân tích</span>':cat.tier==='LIMITED_NUMERIC'?'<span class="cc-tag warn">Mẫu định lượng hạn chế</span>':'<span class="cc-tag info">Chỉ có bằng chứng từng ngập</span>';
    document.getElementById('ccStreetProfile').innerHTML=tier+row('Sự kiện định lượng Tuyến × Ngày',cat.quant_events||0)+row('Dòng bằng chứng có nguồn',cat.occurrence_rows||0)+row('Khoảng thời gian dữ liệu',`${cat.first_date||'—'} → ${cat.last_date||'—'}`)+row('Có trong danh mục/bối cảnh chính thức 2026',cat.recurrence_2026?'Có':'Không')+row('Trạm EV liên kết ứng viên',cand.length)+`<div class="cc-source">${cat.sources?.length?`Số liên kết nguồn có sẵn: ${cat.sources.length}`:'Không có URL nguồn trong dòng danh mục này.'}</div>`;
    if(rows.length){const depths=rows.map(x=>Number(x.depth)).filter(Number.isFinite), rains=rows.map(x=>Number(x.rain)).filter(Number.isFinite), tides=rows.map(x=>Number(x.tide)).filter(Number.isFinite).sort((a,b)=>a-b);const median=a=>{const b=[...a].sort((x,y)=>x-y),m=Math.floor(b.length/2);return b.length? (b.length%2?b[m]:(b[m-1]+b[m])/2):NaN};document.getElementById('ccStreetRanges').innerHTML=row('Khoảng độ ngập quan sát',`${fmt1(Math.min(...depths))}–${fmt1(Math.max(...depths))} cm`)+row('Trung vị độ ngập đại diện sự kiện',`${fmt1(median(depths))} cm`)+row('Khoảng lượng mưa',`${fmt1(Math.min(...rains))}–${fmt1(Math.max(...rains))} mm`)+row('Khoảng thủy triều',tides.length?`${fmt1(tides[0])}–${fmt1(tides[tides.length-1])} m`:'Không có số liệu triều định lượng trong các sự kiện hiện tại')+row('Liên kết ứng viên EV',cand.length);
    } else document.getElementById('ccStreetRanges').innerHTML='<div class="cc-empty">Không có cặp lượng mưa–độ ngập định lượng cho tuyến này trong bộ dữ liệu đã xác thực hiện tại. FloodGuard sẽ không tự tạo khoảng giá trị.</div>';
    document.getElementById('ccTimeline').innerHTML=rows.length?rows.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(x=>`<tr><td>${esc(x.date)}</td><td>${fmt1(x.rain)} mm<div class="source-basis">${esc(x.rain_scope||'')}</div></td><td>${fmt1(x.depth)} cm<div class="source-basis">${fmt1(x.depth_min)}–${fmt1(x.depth_max)} cm khoảng nguồn</div></td><td>${Number.isFinite(Number(x.tide))?fmt1(x.tide)+' m':'—'}</td><td>${esc(x.cause||'—')}</td><td><a class="fc-link" target="_blank" rel="noopener" href="${x.source_url}">Nguồn ↗</a></td></tr>`).join(''):'<tr><td colspan="6">Có bằng chứng từng xảy ra ngập, nhưng chưa có sự kiện mưa–độ ngập định lượng trong bộ dữ liệu đã xác thực hiện tại.</td></tr>';
  }
  ccStreetSelect.onchange=renderStreetProfile; renderStreetProfile();
  document.querySelectorAll('#ccStreet .qs-btn[data-rain]').forEach(b=>b.onclick=()=>{ccRainInput.value=b.dataset.rain});
  document.querySelectorAll('.fc-preset').forEach(b=>b.onclick=()=>{fcRain.value=b.dataset.rain;runAnalysis()});
  function openForecastFromCommand(){const street=ccStreetSelect.value;fcStreet.value=street;fcRain.value=ccRainInput.value||100;closeCommand();forecastPanel.classList.add('open');forecastPanel.setAttribute('aria-hidden','false');forecastBtn.classList.add('active');forecastBtn.setAttribute('aria-expanded','true');runAnalysis()}
  document.getElementById('ccAnalyzeStreet').onclick=openForecastFromCommand;document.getElementById('ccOpenForecast').onclick=()=>{closeCommand();forecastBtn.click()};
  document.getElementById('ccFocusEV').onclick=()=>{closeCommand();map.setView([10.78,106.72],10);if(!map.hasLayer(evBase))map.addLayer(evBase);if(!map.hasLayer(evLow))map.addLayer(evLow);if(!map.hasLayer(evMed))map.addLayer(evMed);if(!map.hasLayer(evHigh))map.addLayer(evHigh)};
})();
