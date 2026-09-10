(function(){
  const D = window.NYC_DATA;
  const S = window.TripStore;
  const $ = (sel, root=document)=>root.querySelector(sel);
  const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));

  const page = document.body.dataset.page || 'home';
  const fmtTime = t => t || 'TBD';
  const typeIcon = t => ({drive:'🚗', food:'🍴', place:'📍'}[t] || '📍');
  const travelIcon = t => ({walk:'🚶', transit:'🚇', drive:'🚗', ferry:'⛴️'}[t] || '➡️');
  const ticketText = s => s==='required' ? '🎟 Ticket' : s==='booked' ? '✓ Booked' : '';
  const mapUrl = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  const minutesLabel = (ts)=> {
    if(!ts) return '';
    const m = Math.round((Date.now()-ts)/60000);
    if(m < 1) return 'Updated just now';
    if(m < 60) return `Updated ${m} min ago`;
    const h = Math.round(m/60); return `Updated ${h} hr${h===1?'':'s'} ago`;
  };

  function nav(){
    const mobile = [
      ['index.html','home','⌂','Home'],['itinerary.html','itinerary','◷','Itinerary'],['food.html','food','♨','Food'],['drive.html','drive','➜','Drive'],['more.html','more','•••','More']
    ];
    const desktop = [
      ['index.html','home','Home'],['itinerary.html','itinerary','Itinerary'],['food.html','food','Food'],['drive.html','drive','Drive'],['weather.html','weather','Weather'],['links.html','links','Links'],['lists.html','lists','Lists']
    ];
    const header = `
      <header class="site-header">
        <a class="brand" href="index.html" aria-label="NYC 2026 home"><span class="brand-mark">NYC</span><span><b>NYC 2026</b><small>Toronto → New York City</small></span></a>
        <nav class="desktop-nav">${desktop.map(([href,id,label])=>`<a href="${href}" class="${page===id?'active':''}">${label}</a>`).join('')}</nav>
      </header>`;
    const bottom = `<nav class="bottom-nav" aria-label="Main navigation">${mobile.map(([href,id,icon,label])=>`<a href="${href}" class="${page===id?'active':''}"><span>${icon}</span><small>${label}</small></a>`).join('')}</nav>`;
    document.body.insertAdjacentHTML('afterbegin', header);
    document.body.insertAdjacentHTML('beforeend', bottom);
  }

  function setTopTheme(){
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.content = matchMedia('(prefers-color-scheme: dark)').matches ? '#0b1220' : '#f4efe6';
  }

  function isoDateInTripTZ(date=new Date()){
    const parts = new Intl.DateTimeFormat('en-US',{timeZone:D.trip.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const obj = Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    return `${obj.year}-${obj.month}-${obj.day}`;
  }

  function tripDayForNow(){
    const today = isoDateInTripTZ(new Date());
    if(D.days.some(d=>d.key===today)) return today;
    if(today < D.trip.startDate) return D.trip.startDate;
    return D.trip.endDate;
  }

  function countdownText(){
    const now = new Date();
    const start = new Date('2026-09-12T09:00:00-04:00');
    const end = new Date('2026-09-16T02:00:00-04:00');
    if(now < start){
      const diff = Math.ceil((start-now)/86400000);
      return diff <= 1 ? 'Tomorrow: NYC begins' : `${diff} days until NYC`;
    }
    if(now <= end){
      const today = isoDateInTripTZ(now);
      const idx = D.days.findIndex(d=>d.key===today);
      if(today==='2026-09-16') return 'Heading home · final stretch';
      return idx>=0 ? `Day ${idx+1} of 4 · ${D.days[idx].label}` : 'NYC 2026';
    }
    return 'NYC 2026 · trip complete';
  }

  function allStopsForDay(date){
    const base = (D.itinerary[date] || []).map(x=>({...x, custom:false}));
    const custom = S.customStops().filter(x=>x.day===date).map(x=>({...x, custom:true}));
    return [...base, ...custom];
  }

  function progress(date){
    const stops = allStopsForDay(date).filter(x=>!x.routeMarker);
    const done = stops.filter(x=>S.status(x.id)==='done').length;
    return {done,total:stops.length,pct:stops.length?Math.round(done/stops.length*100):0};
  }

  function nextStop(date){
    return allStopsForDay(date).find(x=>!x.routeMarker && S.status(x.id)!=='done') || null;
  }

  function weatherMini(w){
    if(!w) return `<span class="weather-mini muted">Forecast closer to trip</span>`;
    return `<span class="weather-mini">${w.icon} ${w.temp}° · Rain ${w.rain ?? '—'}%</span>`;
  }

  function ticketBadge(status){
    if(status==='required') return `<span class="badge badge-ticket">🎟 Ticket</span>`;
    if(status==='booked') return `<span class="badge badge-booked">✓ Booked</span>`;
    return '';
  }

  function statusButton(item){
    const done = S.status(item.id)==='done';
    return `<button class="status-toggle ${done?'done':''}" data-status-id="${item.id}" aria-pressed="${done}">${done?'✓ Done':'○ Pending'}</button>`;
  }

  function selectedRestaurantName(mealId){
    const sel = S.selectedRestaurant(mealId);
    const all = [...D.curatedRestaurants, ...S.customRestaurants()];
    const r = all.find(x=>x.id===sel);
    return r?.name || null;
  }

  function detailRows(item){
    const d = item.details || {};
    let html = '';
    if(d.about) html += `<section class="detail-block"><h4>About</h4><p>${d.about}</p></section>`;
    if(d.history) html += `<section class="detail-block"><h4>History</h4><p>${d.history}</p></section>`;
    if(d.whatToSee?.length) html += `<section class="detail-block"><h4>What to see</h4><ul>${d.whatToSee.map(x=>`<li>${x}</li>`).join('')}</ul></section>`;
    if(d.tips?.length) html += `<section class="detail-block"><h4>Visit tips</h4><ul>${d.tips.map(x=>`<li>${x}</li>`).join('')}</ul></section>`;
    const links = item.links || {};
    const linkBtns = [];
    if(links.official) linkBtns.push(`<a class="chip-link" href="${links.official}" target="_blank" rel="noopener">Official website ↗</a>`);
    if(links.history) linkBtns.push(`<a class="chip-link" href="${links.history}" target="_blank" rel="noopener">History ↗</a>`);
    if(item.mapQuery) linkBtns.push(`<a class="chip-link" href="${mapUrl(item.mapQuery)}" target="_blank" rel="noopener">Directions ↗</a>`);
    if(linkBtns.length) html += `<section class="detail-block"><h4>Useful links</h4><div class="chip-row">${linkBtns.join('')}</div></section>`;
    if(item.mealSlot){
      const name = selectedRestaurantName(item.mealSlot);
      html += `<section class="detail-block"><h4>Restaurant</h4><p>${name ? `<b>${name}</b> is selected for this meal.` : 'No restaurant selected yet.'}</p><a class="text-link" href="food.html#${item.mealSlot}">View meal options →</a></section>`;
    }
    html += `<section class="detail-block"><h4>Notes</h4><textarea class="note-field" data-note-id="${item.id}" placeholder="Add your note…">${escapeHtml(S.note(item.id))}</textarea><small class="save-note">Saved locally on this device.</small></section>`;
    return html;
  }

  function escapeHtml(s=''){
    return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function renderTimelineCard(item, weatherData, date){
    const hourly = /^\d{2}:\d{2}$/.test(item.time||'') ? TripWeather.hourlyFor(weatherData,date,item.time) : null;
    const selected = item.mealSlot ? selectedRestaurantName(item.mealSlot) : null;
    const subtitle = selected ? `<b>${escapeHtml(selected)}</b> · ${escapeHtml(item.subtitle||'')}` : escapeHtml(item.subtitle||'');
    const klass = `${item.routeMarker?'route-marker':''} ${S.status(item.id)==='done'?'is-done':''}`;
    return `<article class="timeline-item ${klass}" id="${item.id}">
      <div class="timeline-time">${fmtTime(item.time)}</div>
      <div class="timeline-line"><span class="timeline-dot">${typeIcon(item.type)}</span></div>
      <div class="trip-card">
        <div class="card-topline"><div class="card-badges">${ticketBadge(item.ticketStatus)}${item.custom?'<span class="badge">Added by you</span>':''}</div>${!item.routeMarker?statusButton(item):'<span class="badge badge-route">Route marker</span>'}</div>
        <h3>${escapeHtml(item.title)}</h3>
        ${subtitle?`<p class="card-subtitle">${subtitle}</p>`:''}
        <div class="meta-row">
          ${item.duration && item.duration!=='—'?`<span>⏱ ${escapeHtml(item.duration)}</span>`:''}
          ${weatherMini(hourly)}
        </div>
        <div class="card-actions">
          ${item.mapQuery?`<a class="btn btn-secondary" href="${mapUrl(item.mapQuery)}" target="_blank" rel="noopener">Navigate</a>`:''}
          <button class="btn btn-ghost detail-toggle" aria-expanded="false">More info</button>
          ${item.custom?`<button class="btn btn-danger-outline delete-stop" data-delete-stop="${item.id}">Delete</button>`:''}
        </div>
        <div class="card-details" hidden>${detailRows(item)}</div>
      </div>
      ${item.travelToNext && item.travelToNext!=='—'?`<div class="travel-connector"><span>${travelIcon(item.travelMode)} ${escapeHtml(item.travelToNext)} to next</span></div>`:''}
    </article>`;
  }

  function bindSharedInteractions(root=document){
    $$('.status-toggle',root).forEach(btn=>btn.addEventListener('click',()=>{
      const id=btn.dataset.statusId;
      S.setStatus(id, S.status(id)==='done'?'pending':'done');
      if(page==='itinerary') renderItinerary(); else location.reload();
    }));
    $$('.detail-toggle',root).forEach(btn=>btn.addEventListener('click',()=>{
      const details=btn.closest('.trip-card').querySelector('.card-details');
      const open=details.hidden;
      details.hidden=!open; btn.setAttribute('aria-expanded',String(open)); btn.textContent=open?'Hide info':'More info';
    }));
    $$('.note-field',root).forEach(area=>{
      let timer;
      area.addEventListener('input',()=>{
        clearTimeout(timer); timer=setTimeout(()=>S.setNote(area.dataset.noteId,area.value),250);
      });
      area.addEventListener('blur',()=>S.setNote(area.dataset.noteId,area.value));
    });
  }

  async function renderHome(){
    const date = tripDayForNow();
    const day = D.days.find(d=>d.key===date) || D.days[0];
    const p=progress(date), next=nextStop(date);
    let weather = null, weatherMeta='';
    try { const res=await TripWeather.fetchForecast(); weather=TripWeather.dailyFor(res.data,date); weatherMeta = minutesLabel(res.ts)+(res.cached?' · cached':''); } catch {}
    $('#app').innerHTML = `
      <section class="hero">
        <div class="hero-skyline" aria-hidden="true"></div>
        <div class="hero-content"><p class="eyebrow">Private city trip</p><h1>NYC 2026</h1><p>Toronto → New York City</p><strong>September 12–15, 2026</strong><div class="countdown-pill">${countdownText()}</div></div>
      </section>
      <section class="dashboard-grid">
        <article class="dash-card accent-card"><span class="dash-kicker">Next up</span>${next?`<div class="next-icon">${typeIcon(next.type)}</div><h2>${escapeHtml(next.title)}</h2><p>${fmtTime(next.time)} · ${escapeHtml(day.short)}</p><a href="itinerary.html?day=${date}#${next.id}" class="text-link">Open itinerary →</a>`:`<h2>All done for this day</h2>`}</article>
        <article class="dash-card"><span class="dash-kicker">Weather</span>${weather?`<div class="weather-big"><span>${weather.icon}</span><b>${weather.max}°</b></div><h3>${weather.label}</h3><p>${weather.min}° low · Rain ${weather.rain ?? '—'}%</p><small>${weatherMeta}</small>`:`<h2>Forecast coming closer to the trip</h2><p>Live NYC weather appears automatically when the dates are within the forecast window.</p>`}<a href="weather.html" class="text-link">Full forecast →</a></article>
        <article class="dash-card"><span class="dash-kicker">Today's progress</span><div class="progress-number">${p.done}<small> / ${p.total}</small></div><div class="progress-track"><span style="width:${p.pct}%"></span></div><p>${p.pct}% complete</p></article>
      </section>
      <section class="section-head"><div><p class="eyebrow">${day.label}</p><h2>Today's plan</h2></div><a href="itinerary.html?day=${date}" class="btn btn-secondary">Open full day</a></section>
      <div class="compact-plan">${allStopsForDay(date).filter(x=>!x.routeMarker).slice(0,8).map(x=>`<a href="itinerary.html?day=${date}#${x.id}" class="compact-row ${S.status(x.id)==='done'?'done':''}"><span>${S.status(x.id)==='done'?'✓':'○'}</span><time>${fmtTime(x.time)}</time><b>${escapeHtml(x.title)}</b></a>`).join('')}</div>
      <section class="quick-grid">
        <a class="quick-tile" href="itinerary.html"><span>◷</span><b>Itinerary</b><small>Five date tabs</small></a>
        <a class="quick-tile" href="food.html"><span>♨</span><b>Food</b><small>Meal-by-meal choices</small></a>
        <a class="quick-tile" href="drive.html"><span>➜</span><b>Drive</b><small>Toronto ↔ NYC</small></a>
        <a class="quick-tile" href="weather.html"><span>☀</span><b>Weather</b><small>NYC forecast</small></a>
      </section>`;
  }

  let activeDay = new URLSearchParams(location.search).get('day') || S.get('active_day', tripDayForNow());
  if(!D.days.some(d=>d.key===activeDay)) activeDay=D.days[0].key;

  async function renderItinerary(){
    S.set('active_day',activeDay);
    let weatherData=null;
    try { weatherData=(await TripWeather.fetchForecast()).data; } catch {}
    const day=D.days.find(d=>d.key===activeDay), p=progress(activeDay);
    $('#app').innerHTML = `
      <section class="page-hero compact"><p class="eyebrow">Master itinerary</p><h1>${day.title}</h1><p>${day.label}</p></section>
      <div class="day-tabs" role="tablist">${D.days.map(d=>`<button class="day-tab ${d.key===activeDay?'active':''}" data-day="${d.key}">${d.short}</button>`).join('')}</div>
      <section class="day-summary"><div><b>${p.done} of ${p.total}</b><span> activities complete</span></div><div class="progress-track"><span style="width:${p.pct}%"></span></div><button class="btn btn-secondary" id="add-stop">+ Add stop</button></section>
      <section class="timeline">${allStopsForDay(activeDay).map(item=>renderTimelineCard(item,weatherData,activeDay)).join('')}</section>`;
    $$('.day-tab').forEach(b=>b.addEventListener('click',()=>{activeDay=b.dataset.day; history.replaceState(null,'',`?day=${activeDay}`); renderItinerary();}));
    $('#add-stop').addEventListener('click',()=>openStopDialog(activeDay));
    $$('.delete-stop').forEach(b=>b.addEventListener('click',()=>{
      if(!confirm('Delete this locally added stop?')) return;
      S.setCustomStops(S.customStops().filter(x=>x.id!==b.dataset.deleteStop)); renderItinerary();
    }));
    bindSharedInteractions();
    if(location.hash){ const target=document.getElementById(location.hash.slice(1)); if(target) setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'center'}),100); }
  }

  function openStopDialog(day){
    openDialog('Add itinerary stop', `
      <label>Type<select id="new-stop-type"><option value="place">Place / activity</option><option value="food">Food</option><option value="drive">Driving stop</option></select></label>
      <label>Time<input id="new-stop-time" placeholder="e.g. 14:30 or TBD"></label>
      <label>Name<input id="new-stop-title" required placeholder="Stop name"></label>
      <label>Subtitle<input id="new-stop-subtitle" placeholder="Optional"></label>
      <label>Map search<input id="new-stop-map" placeholder="Place or address"></label>
      <button id="save-stop" class="btn btn-primary btn-block">Add stop</button>`, ()=>{
        $('#save-stop').addEventListener('click',()=>{
          const title=$('#new-stop-title').value.trim(); if(!title) return;
          const arr=S.customStops();
          arr.push({id:`custom-${Date.now()}`,day,time:$('#new-stop-time').value.trim()||'TBD',type:$('#new-stop-type').value,title,subtitle:$('#new-stop-subtitle').value.trim(),duration:'TBD',travelToNext:'—',travelMode:'walk',ticketStatus:'none',mapQuery:$('#new-stop-map').value.trim(),details:{about:'Added locally on this device.'}});
          S.setCustomStops(arr); closeDialog(); renderItinerary();
        });
      });
  }

  function allRestaurants(){ return [...D.curatedRestaurants, ...S.customRestaurants()]; }
  function mealOptions(meal){ return allRestaurants().filter(r=>!r.mealIds || r.mealIds.includes(meal.id)); }
  function renderFood(){
    const groups=D.days.slice(0,4).map(day=>{
      const meals=D.meals.filter(m=>m.day===day.key); if(!meals.length) return '';
      return `<section class="food-day"><div class="section-head"><div><p class="eyebrow">${day.short}</p><h2>${day.title}</h2></div></div>${meals.map(renderMeal).join('')}</section>`;
    }).join('');
    $('#app').innerHTML=`<section class="page-hero compact"><p class="eyebrow">Itinerary-wise dining</p><h1>Food</h1><p>Select a restaurant for each meal. Your choice appears automatically in the itinerary on this device.</p></section>${groups}<section class="section-head"><div><p class="eyebrow">Local additions</p><h2>Your restaurants</h2></div><button id="add-restaurant" class="btn btn-primary">+ Add restaurant</button></section><div id="custom-restaurants">${renderCustomRestaurantList()}</div>`;
    $('#add-restaurant').addEventListener('click', openRestaurantDialog);
    bindFood();
    if(location.hash){ const target=document.getElementById(location.hash.slice(1)); if(target) setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'center'}),100); }
  }

  function renderMeal(meal){
    if(meal.fixed){
      return `<article class="meal-card" id="${meal.id}"><div><span class="badge badge-booked">${meal.fixedName==='Bungalow'?'✓ Booked':'Fixed'}</span><h3>${meal.label}</h3><p>${meal.area}</p></div><div class="selected-meal"><strong>${meal.fixedName}</strong>${meal.fixedUrl?`<a href="${meal.fixedUrl}" target="_blank" rel="noopener">Website ↗</a>`:''}</div></article>`;
    }
    const options=mealOptions(meal), selected=S.selectedRestaurant(meal.id);
    return `<article class="meal-card" id="${meal.id}"><div class="meal-head"><div><span class="badge">${meal.area}</span><h3>${meal.label}</h3></div><span class="selection-state">${selected?'Selected':'Not selected'}</span></div><div class="restaurant-options">${options.length?options.map(r=>`<label class="restaurant-option ${selected===r.id?'selected':''}"><input type="radio" name="${meal.id}" value="${r.id}" ${selected===r.id?'checked':''}><span><b>${escapeHtml(r.name)}</b><small>${escapeHtml(r.cuisine||'')} ${r.area?'· '+escapeHtml(r.area):''}</small></span><span class="option-links">${r.url?`<a href="${r.url}" target="_blank" rel="noopener">Site</a>`:''}${r.mapQuery?`<a href="${mapUrl(r.mapQuery)}" target="_blank" rel="noopener">Maps</a>`:''}</span></label>`).join(''):`<div class="empty-state"><b>No curated options yet.</b><p>We'll add restaurant choices in the next content-refinement step. You can also add one locally now.</p></div>`}</div>${selected?`<button class="text-button clear-meal" data-meal="${meal.id}">Clear selection</button>`:''}</article>`;
  }

  function renderCustomRestaurantList(){
    const arr=S.customRestaurants();
    if(!arr.length) return `<div class="empty-state wide"><b>No local restaurants added yet.</b><p>Curated restaurant choices will be added later.</p></div>`;
    return `<div class="restaurant-library">${arr.map(r=>`<article><div><b>${escapeHtml(r.name)}</b><small>${escapeHtml(r.cuisine||'')} ${r.area?'· '+escapeHtml(r.area):''}</small></div><button class="text-button delete-restaurant" data-id="${r.id}">Delete</button></article>`).join('')}</div>`;
  }

  function bindFood(){
    $$('input[type=radio][name^="sep"]').forEach(r=>r.addEventListener('change',()=>{S.setSelectedRestaurant(r.name,r.value);renderFood();}));
    $$('.clear-meal').forEach(b=>b.addEventListener('click',()=>{S.setSelectedRestaurant(b.dataset.meal,null);renderFood();}));
    $$('.delete-restaurant').forEach(b=>b.addEventListener('click',()=>{S.setCustomRestaurants(S.customRestaurants().filter(r=>r.id!==b.dataset.id));renderFood();}));
  }

  function openRestaurantDialog(){
    const mealChecks=D.meals.filter(m=>!m.fixed).map(m=>`<label class="check-row"><input type="checkbox" name="meal-assign" value="${m.id}"><span>${D.days.find(d=>d.key===m.day)?.short} · ${m.label}</span></label>`).join('');
    openDialog('Add restaurant', `<label>Name<input id="rest-name" required></label><label>Cuisine<input id="rest-cuisine" placeholder="e.g. Italian"></label><label>Area<input id="rest-area" placeholder="e.g. Financial District"></label><label>Website<input id="rest-url" type="url" placeholder="https://"></label><label>Google Maps search<input id="rest-map" placeholder="Restaurant name + NYC"></label><fieldset><legend>Show for these meals</legend>${mealChecks}</fieldset><button id="save-rest" class="btn btn-primary btn-block">Save restaurant</button>`,()=>{
      $('#save-rest').addEventListener('click',()=>{
        const name=$('#rest-name').value.trim(); if(!name) return;
        const mealIds=$$('input[name="meal-assign"]:checked').map(x=>x.value);
        const arr=S.customRestaurants(); arr.push({id:`rest-${Date.now()}`,name,cuisine:$('#rest-cuisine').value.trim(),area:$('#rest-area').value.trim(),url:$('#rest-url').value.trim(),mapQuery:$('#rest-map').value.trim(),mealIds}); S.setCustomRestaurants(arr); closeDialog(); renderFood();
      });
    });
  }

  function renderDrive(){
    $('#app').innerHTML=`<section class="page-hero compact"><p class="eyebrow">Road trip</p><h1>Drive</h1><p>Toronto ↔ NYC route, breaks, parking and the overnight return.</p></section><div class="seg-tabs"><button class="seg active" data-drive="toNYC">To NYC</button><button class="seg" data-drive="parking">Parking</button><button class="seg" data-drive="return">Return</button></div><div id="drive-content"></div>`;
    const draw=key=>{ $$('.seg').forEach(x=>x.classList.toggle('active',x.dataset.drive===key)); const data=D.drive[key]; $('#drive-content').innerHTML=`<div class="route-stack">${data.map((x,i)=>`<article class="route-card"><span class="route-num">${i+1}</span><div><h3>${x.title}</h3><p>${x.note}</p></div></article>`).join('')}</div>${key==='toNYC'?`<a class="btn btn-primary map-wide" href="${mapUrl('Toronto ON to New York NY')}" target="_blank" rel="noopener">Open route in Google Maps</a>`:''}`;};
    $$('.seg').forEach(b=>b.addEventListener('click',()=>draw(b.dataset.drive))); draw('toNYC');
  }

  async function renderWeather(){
    $('#app').innerHTML=`<section class="page-hero compact"><p class="eyebrow">Live + cached</p><h1>NYC Weather</h1><p>Forecast data is fetched from Open-Meteo and cached locally for offline viewing.</p></section><div id="weather-content" class="weather-page"><div class="loading-card">Loading forecast…</div></div>`;
    try{
      const res=await TripWeather.fetchForecast();
      const cards=D.days.slice(0,4).map(day=>{
        const w=TripWeather.dailyFor(res.data,day.key);
        if(!w) return `<article class="forecast-card"><span>${day.short}</span><h3>Forecast not available yet</h3><p>It will appear automatically when the trip falls inside the provider's forecast window.</p></article>`;
        const hours=['09:00','12:00','15:00','18:00','21:00'].map(t=>{const h=TripWeather.hourlyFor(res.data,day.key,t); return h?`<div><time>${t}</time><span>${h.icon}</span><b>${h.temp}°</b><small>${h.rain}% rain</small></div>`:''}).join('');
        return `<article class="forecast-card"><div class="forecast-main"><div><span>${day.short}</span><h3>${w.label}</h3><p>${w.min}° low · Rain ${w.rain}%</p></div><div class="weather-big"><span>${w.icon}</span><b>${w.max}°</b></div></div><div class="hour-strip">${hours}</div></article>`;
      }).join('');
      $('#weather-content').innerHTML=`<div class="weather-meta"><span>${res.cached?'Cached forecast':'Live forecast'}</span><small>${minutesLabel(res.ts)}</small><button id="refresh-weather" class="btn btn-secondary">Refresh</button></div>${cards}`;
      $('#refresh-weather').addEventListener('click',async()=>{await TripWeather.fetchForecast(true);renderWeather();});
    }catch{
      $('#weather-content').innerHTML=`<div class="empty-state wide"><b>Weather unavailable.</b><p>No live connection and no cached forecast exists on this device yet.</p><button class="btn btn-secondary" onclick="location.reload()">Try again</button></div>`;
    }
  }

  function renderLinks(){
    const custom=S.get('custom_links',[]), all=[...D.links,...custom];
    const cats=[...new Set(all.map(x=>x.category))];
    $('#app').innerHTML=`<section class="page-hero compact"><p class="eyebrow">Quick access</p><h1>Important Links</h1><p>Reusable trip resources. Attraction-specific links also live inside itinerary cards.</p></section>${cats.map(cat=>`<section class="link-group"><h2>${escapeHtml(cat)}</h2><div class="link-grid">${all.filter(x=>x.category===cat).map(x=>`<a class="link-card" href="${x.url}" target="_blank" rel="noopener"><span>↗</span><b>${escapeHtml(x.title)}</b><small>${escapeHtml(cat)}</small></a>`).join('')}</div></section>`).join('')}<button id="add-link" class="fab">+ Add link</button>`;
    $('#add-link').addEventListener('click',()=>openDialog('Add link',`<label>Title<input id="link-title"></label><label>URL<input id="link-url" type="url" placeholder="https://"></label><label>Category<input id="link-cat" value="Other"></label><button id="save-link" class="btn btn-primary btn-block">Save link</button>`,()=>{$('#save-link').addEventListener('click',()=>{const title=$('#link-title').value.trim(),url=$('#link-url').value.trim(); if(!title||!url)return;const arr=S.get('custom_links',[]);arr.push({title,url,category:$('#link-cat').value.trim()||'Other'});S.set('custom_links',arr);closeDialog();renderLinks();});}));
  }

  function renderLists(){
    const state=S.listState();
    $('#app').innerHTML=`<section class="page-hero compact"><p class="eyebrow">Offline checklist</p><h1>${escapeHtml(state.name)}</h1><p>Everything on this page is stored only on this device.</p></section><section class="list-toolbar"><button id="rename-list" class="btn btn-secondary">Rename</button><button id="clear-checked" class="btn btn-ghost">Clear checked</button></section><form id="add-list-item" class="add-row"><input id="list-new" placeholder="Add an item…" autocomplete="off"><button class="btn btn-primary">Add</button></form><div class="checklist">${state.items.length?state.items.map((x,i)=>`<label class="checklist-row ${x.done?'done':''}"><input type="checkbox" data-list-index="${i}" ${x.done?'checked':''}><span>${escapeHtml(x.text)}</span><button type="button" class="delete-list" data-delete-list="${i}">×</button></label>`).join(''):`<div class="empty-state wide"><b>Your checklist is empty.</b><p>Add packing, car, shopping or pre-trip items above.</p></div>`}</div>`;
    $('#add-list-item').addEventListener('submit',e=>{e.preventDefault();const v=$('#list-new').value.trim();if(!v)return;const st=S.listState();st.items.push({text:v,done:false});S.setListState(st);renderLists();});
    $$('[data-list-index]').forEach(x=>x.addEventListener('change',()=>{const st=S.listState();st.items[+x.dataset.listIndex].done=x.checked;S.setListState(st);renderLists();}));
    $$('[data-delete-list]').forEach(x=>x.addEventListener('click',()=>{const st=S.listState();st.items.splice(+x.dataset.deleteList,1);S.setListState(st);renderLists();}));
    $('#clear-checked').addEventListener('click',()=>{const st=S.listState();st.items=st.items.filter(x=>!x.done);S.setListState(st);renderLists();});
    $('#rename-list').addEventListener('click',()=>{const name=prompt('List name',S.listState().name);if(name?.trim()){const st=S.listState();st.name=name.trim();S.setListState(st);renderLists();}});
  }

  function renderMore(){
    $('#app').innerHTML=`<section class="page-hero compact"><p class="eyebrow">More</p><h1>Trip tools</h1><p>Weather, useful links, lists and local-device settings.</p></section><div class="more-grid"><a class="more-card" href="weather.html"><span>☀</span><div><b>Weather</b><small>Live + cached NYC forecast</small></div><i>›</i></a><a class="more-card" href="links.html"><span>↗</span><div><b>Links</b><small>Attractions, transport and maps</small></div><i>›</i></a><a class="more-card" href="lists.html"><span>✓</span><div><b>Lists</b><small>Your offline trip checklist</small></div><i>›</i></a><a class="more-card" href="settings.html"><span>⚙</span><div><b>Settings</b><small>Local data and device access</small></div><i>›</i></a></div>`;
  }

  function renderSettings(){
    $('#app').innerHTML=`<section class="page-hero compact"><p class="eyebrow">This device</p><h1>Settings</h1><p>Authentication and dynamic trip data are stored locally in this browser.</p></section><div class="settings-stack"><article class="settings-card"><div><h3>Forget this device</h3><p>Locks the app and requires the trip password next time.</p></div><button id="forget-device" class="btn btn-danger-outline">Forget device</button></article><article class="settings-card"><div><h3>Export local changes</h3><p>Downloads notes, selections, checklist items and locally added content as JSON.</p></div><button id="export-data" class="btn btn-secondary">Export</button></article><article class="settings-card"><div><h3>Import local changes</h3><p>Import a JSON export from another device if you want to copy local state manually.</p></div><label class="btn btn-secondary file-btn">Import<input id="import-data" type="file" accept="application/json" hidden></label></article><article class="settings-card danger-zone"><div><h3>Reset dynamic data</h3><p>Clears notes, statuses, restaurant selections, custom items, lists and weather cache. The device stays unlocked.</p></div><button id="reset-data" class="btn btn-danger-outline">Reset data</button></article><article class="settings-card"><div><h3>Static-site password</h3><p>This V1 uses a client-side password gate. It is a privacy barrier, not true server-side access control.</p></div><span class="badge">V1</span></article></div>`;
    $('#forget-device').addEventListener('click',()=>{if(confirm('Forget this device and lock the app?'))TripAuth.forget();});
    $('#reset-data').addEventListener('click',()=>{if(confirm('Clear all dynamic data stored on this device?')){S.resetDynamic();location.reload();}});
    $('#export-data').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(S.export(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nyc-2026-local-data.json';a.click();URL.revokeObjectURL(a.href);});
    $('#import-data').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{S.import(JSON.parse(await f.text()));alert('Local data imported.');location.reload();}catch{alert('Could not import this file.');}});
  }

  function openDialog(title, body, after){
    const d=document.createElement('dialog');d.id='app-dialog';d.innerHTML=`<div class="dialog-head"><h2>${title}</h2><button class="dialog-close" aria-label="Close">×</button></div><div class="dialog-body">${body}</div>`;document.body.appendChild(d);d.querySelector('.dialog-close').addEventListener('click',closeDialog);d.addEventListener('click',e=>{if(e.target===d)closeDialog();});d.showModal();after?.();
  }
  function closeDialog(){const d=$('#app-dialog');if(d){d.close();d.remove();}}
  window.closeDialog=closeDialog;

  function registerSW(){ if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{}); }

  document.addEventListener('DOMContentLoaded',()=>{
    nav();setTopTheme();matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',setTopTheme);registerSW();
    ({home:renderHome,itinerary:renderItinerary,food:renderFood,drive:renderDrive,weather:renderWeather,links:renderLinks,lists:renderLists,more:renderMore,settings:renderSettings}[page]||renderHome)();
  });
})();
