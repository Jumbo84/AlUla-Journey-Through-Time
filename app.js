/* AlUla — Journey Through Time | Web (PWA) version */

const AL_CENTER = { lat: 26.6089, lng: 37.9216 };
const CAT_COLORS = { heritage:'#D8A24A', experiences:'#7BA877', hotels:'#5E93BC', dining:'#D87A4C', cafe:'#C58B5A' };
const FILTERS = [
  {id:'all', en:'All', ar:'الكل'},
  {id:'heritage', en:'Heritage', ar:'تراث'},
  {id:'experiences', en:'Events', ar:'تجارب'},
  {id:'dining', en:'Dining', ar:'مطاعم'},
  {id:'hotels', en:'Hotels', ar:'فنادق'},
  {id:'cafe', en:'Cafes', ar:'مقاهي'},
];

const STR = {
  en:{ sites:s=>`${s} sites`, hint:'Point your camera at a landmark to explore its story',
    enable:'Enable camera & compass', directions:'Directions', save:'Save', saved:'Saved', share:'Share',
    listen:'Listen', book:'Book', tip:'Tip', demo:"You're far from AlUla — showing demo view from AlUla center",
    noSaved:'No saved places yet. Tap the heart on any place to save it.', services:'Services' },
  ar:{ sites:s=>`${s} مواقع`, hint:'وجّه الكاميرا نحو أحد المعالم لاكتشاف قصته',
    enable:'تفعيل الكاميرا والبوصلة', directions:'الاتجاهات', save:'حفظ', saved:'محفوظ', share:'مشاركة',
    listen:'استماع', book:'حجز', tip:'نصيحة', demo:'أنت بعيد عن العلا — عرض تجريبي من وسط العلا',
    noSaved:'لا مواقع محفوظة بعد. اضغط القلب على أي مكان لحفظه.', services:'الخدمات' }
};

let DATA = { places:[], services:[] };
let state = { lang:'en', filter:'all', tab:'explore', heading:0, pitch:0, userPos:null, demo:false,
  saved:JSON.parse(localStorage.getItem('alula_saved')||'[]'), map:null, mapMarkers:[], arStream:null, camStream:null,
  camFacing:'environment', camFilter:'none' };

const TABS = [
  {id:'ar', en:'AR View', ar:'الواقع', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><circle cx="12" cy="12" r="3"/></svg>'},
  {id:'explore', en:'Explore', ar:'استكشف', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M16 8l-2 6-6 2 2-6z"/></svg>'},
  {id:'map', en:'Map', ar:'الخريطة', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/></svg>'},
  {id:'camera', en:'Camera', ar:'الكاميرا', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h3l2-3h8l2 3h3v13H3z"/><circle cx="12" cy="13" r="4"/></svg>'},
  {id:'services', en:'Services', ar:'الخدمات', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>'},
  {id:'saved', en:'Saved', ar:'المحفوظ', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>'},
];

const $ = s => document.querySelector(s);
const t = k => STR[state.lang][k];

/* ---------- Init ---------- */
async function init(){
  try{
    const res = await fetch('places.json');
    DATA = await res.json();
  }catch(e){ console.warn('data load failed', e); }
  buildTabs(); buildFilters(); renderExplore(); renderServices(); renderSaved();
  setTimeout(hideSplash, 2600);
  initSensors();
}

function hideSplash(){ const s=$('#splash'); if(s) s.classList.add('hide'); }

/* ---------- Language ---------- */
$('#langBtn').onclick = ()=>{
  state.lang = state.lang==='en' ? 'ar' : 'en';
  $('#langBtn').textContent = state.lang==='en' ? 'EN' : 'ع';
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang==='ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('rtl', state.lang==='ar');
  buildTabs(); buildFilters(); renderExplore(); renderServices(); renderSaved(); updateChips();
};

/* ---------- Tabs ---------- */
function buildTabs(){
  $('#tabbar').innerHTML = TABS.map(tb=>`
    <button class="tab ${state.tab===tb.id?'active':''}" data-tab="${tb.id}">
      ${tb.icon}<span>${tb[state.lang]}</span></button>`).join('');
  document.querySelectorAll('.tab').forEach(b=> b.onclick = ()=> switchTab(b.dataset.tab));
}

function switchTab(id){
  state.tab = id; buildTabs();
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  $('#view-'+id).classList.remove('hidden');
  // header visible only on explore/saved
  const showHeader = (id==='ar'||id==='explore');
  $('#topbar').style.display = (id==='ar')?'flex':(id==='explore'?'flex':'none');
  $('#filters').style.display = (id==='explore')?'flex':'none';
  // stop camera streams when leaving
  if(id!=='ar') stopStream('arStream');
  if(id!=='camera') stopStream('camStream');
  if(id==='ar') startAR();
  if(id==='map') initMap();
  if(id==='camera') startCamera();
}

/* ---------- Filters ---------- */
function buildFilters(){
  $('#filters').innerHTML = FILTERS.map(f=>`
    <button class="filter ${state.filter===f.id?'active':''}" data-f="${f.id}">${f[state.lang]}</button>`).join('');
  document.querySelectorAll('.filter').forEach(b=> b.onclick = ()=>{
    state.filter=b.dataset.f; buildFilters(); renderExplore(); renderAR();
  });
}

function filteredPlaces(){
  if(state.filter==='all') return DATA.places;
  if(state.filter==='cafe') return DATA.places.filter(p=>p.category==='cafe');
  return DATA.places.filter(p=>p.category===state.filter);
}

/* ---------- Explore ---------- */
function nm(p){ return state.lang==='ar' ? p.name_ar : p.name_en; }
function desc(p){ return state.lang==='ar' ? p.desc_ar : p.desc_en; }
function tipTxt(p){ return state.lang==='ar' ? p.tip_ar : p.tip_en; }

function placePhoto(p){
  // real photo with graceful fallback to gradient
  return `<div class="photo" style="background:linear-gradient(135deg,#E8D5B5,${CAT_COLORS[p.category]||'#C9A876'}33)">
    <img src="${p.id}.jpg" alt="${nm(p)}" loading="lazy"
      onerror="this.style.display='none'">
    <span class="badge">${state.lang==='ar'?catAr(p.category):p.category}</span>
    ${p.rating?`<span class="rating">★ ${p.rating}</span>`:''}
  </div>`;
}
function catAr(c){return {heritage:'تراث',experiences:'تجارب',hotels:'فنادق',dining:'مطاعم',cafe:'مقاهي'}[c]||c;}

function distanceTo(p){
  const o = state.demo ? AL_CENTER : (state.userPos||AL_CENTER);
  return haversine(o.lat,o.lng,p.lat,p.lng);
}
function distLabel(p){
  const d = distanceTo(p);
  return d<1 ? `${Math.round(d*1000)} m` : `${d.toFixed(1)} km`;
}

function renderExplore(){
  const list = filteredPlaces();
  $('#exploreList').innerHTML = list.map(p=>`
    <div class="card" data-id="${p.id}">
      ${placePhoto(p)}
      <div class="body">
        <h3>${nm(p)}</h3>
        <div class="meta">${distLabel(p)} · ${p.duration||''} ${p.price?'· '+(p.price+' SAR'):'· Free'}</div>
        <p>${(desc(p)||'').slice(0,110)}…</p>
        <div class="actions">
          <button class="btn primary" data-act="detail">${t('listen')==='Listen'?'Details':'تفاصيل'}</button>
          <button class="btn ghost" data-act="dir">${t('directions')}</button>
          <button class="btn ghost" data-act="save">${state.saved.includes(p.id)?'♥':'♡'}</button>
        </div>
      </div>
    </div>`).join('');
  bindCards('#exploreList');
}

function bindCards(scope){
  document.querySelectorAll(scope+' .card').forEach(card=>{
    const id = card.dataset.id;
    const p = DATA.places.find(x=>x.id===id);
    card.querySelectorAll('[data-act]').forEach(btn=>{
      btn.onclick = (e)=>{ e.stopPropagation();
        const a=btn.dataset.act;
        if(a==='detail') openSheet(p);
        if(a==='dir') window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,'_blank');
        if(a==='save') toggleSave(p.id);
      };
    });
    card.onclick = ()=> openSheet(p);
  });
}

/* ---------- Detail sheet ---------- */
function openSheet(p){
  $('#sheetInner').innerHTML = `
    <div class="sheet-photo" style="background:linear-gradient(135deg,#E8D5B5,${CAT_COLORS[p.category]||'#C9A876'})">
      <img src="${p.id}.jpg" alt="${nm(p)}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">
      <button class="sheet-close" onclick="closeSheet()">✕</button>
    </div>
    <div class="sheet-body">
      <h2>${nm(p)}</h2>
      <div class="meta">${distLabel(p)} · ${p.duration||''} ${p.price?'· '+p.price+' SAR':'· Free'} ${p.rating?'· ★ '+p.rating:''}</div>
      <p>${desc(p)||''}</p>
      ${tipTxt(p)?`<div class="tip"><b>${t('tip')}:</b> ${tipTxt(p)}</div>`:''}
      <div class="actions">
        <button class="btn primary" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}','_blank')">${t('directions')}</button>
        <button class="btn ghost" onclick="speak('${(nm(p)||'').replace(/'/g,'')}','${(desc(p)||'').replace(/'/g,'').slice(0,200)}')">🔊 ${t('listen')}</button>
        <button class="btn ghost" onclick="toggleSave('${p.id}');closeSheet()">${state.saved.includes(p.id)?'♥ '+t('saved'):'♡ '+t('save')}</button>
        ${p.official?`<button class="btn ghost" onclick="window.open('${p.official}','_blank')">${t('book')}</button>`:''}
      </div>
    </div>`;
  $('#sheet').classList.add('show');
}
function closeSheet(){ $('#sheet').classList.remove('show'); }
$('#sheet').onclick = e=>{ if(e.target.id==='sheet') closeSheet(); };

function speak(name, text){
  try{ const u=new SpeechSynthesisUtterance(name+'. '+text);
    u.lang = state.lang==='ar'?'ar-SA':'en-US'; speechSynthesis.speak(u);
  }catch(e){}
}

/* ---------- Save ---------- */
function toggleSave(id){
  const i = state.saved.indexOf(id);
  if(i>=0) state.saved.splice(i,1); else state.saved.push(id);
  localStorage.setItem('alula_saved', JSON.stringify(state.saved));
  renderExplore(); renderSaved();
}
function renderSaved(){
  const list = DATA.places.filter(p=>state.saved.includes(p.id));
  if(!list.length){ $('#savedList').innerHTML = `<p style="text-align:center;color:var(--muted);padding:40px 20px">${t('noSaved')}</p>`; return; }
  $('#savedList').innerHTML = list.map(p=>`
    <div class="card" data-id="${p.id}">${placePhoto(p)}
      <div class="body"><h3>${nm(p)}</h3>
      <div class="meta">${distLabel(p)} · ${p.duration||''}</div>
      <p>${(desc(p)||'').slice(0,100)}…</p>
      <div class="actions"><button class="btn primary" data-act="detail">Details</button>
      <button class="btn ghost" data-act="save">♥</button></div></div></div>`).join('');
  bindCards('#savedList');
}

/* ---------- Services ---------- */
function renderServices(){
  const cats = {};
  (DATA.services||[]).forEach(s=>{ (cats[s.cat]=cats[s.cat]||[]).push(s); });
  let html='';
  Object.keys(cats).forEach(cat=>{
    cats[cat].forEach(s=>{
      const icon = svcIcon(s.cat);
      const accent = s.accent||'#5E93BC';
      // Try a logo file at {id}.png (root). If it loads, show it (white bg);
      // if it 404s, onerror swaps back to the coloured icon tile automatically.
      const logoSrc = `${s.id}.png`;
      html += `<a class="svc" href="${s.url}" target="_blank" rel="noopener">
        <div class="ic logo-ic" style="background:${accent}">
          <img src="${logoSrc}" alt="${s.name}" loading="lazy"
               onload="this.parentElement.classList.add('has-logo')"
               onerror="this.remove(); this.parentElement.innerHTML='${icon}'">
        </div>
        <div class="nm">${state.lang==='ar'?(s.name_ar||s.name):s.name}</div>
        <div class="nt">${state.lang==='ar'?(s.note_ar||''):(s.note_en||'')}</div></a>`;
    });
  });
  $('#svcGrid').innerHTML = html;
}
function svcIcon(cat){
  const m={tickets:'🎟️',food:'🍽️',ride:'🚗',taxi:'🚕',hotels:'🏨',currency:'💱',emergency:'🆘',
    gov:'🏛️',social:'💬',translate:'🌐',esim:'📶',navigation:'🗺️'};
  return m[cat]||'•';
}

/* ---------- Sensors / compass / tilt ---------- */
function initSensors(){
  // request geolocation (silent)
  if(navigator.geolocation){
    navigator.geolocation.watchPosition(pos=>{
      state.userPos = { lat:pos.coords.latitude, lng:pos.coords.longitude };
      const d = haversine(state.userPos.lat,state.userPos.lng,AL_CENTER.lat,AL_CENTER.lng);
      state.demo = d>50; // far from AlUla -> demo mode
      updateChips(); renderAR();
    }, ()=>{ state.demo=true; updateChips(); }, {enableHighAccuracy:true});
  } else { state.demo=true; }
}

function handleOrientation(e){
  // alpha: compass heading; beta: front-back tilt (pitch)
  let heading = e.webkitCompassHeading != null ? e.webkitCompassHeading : (360 - (e.alpha||0));
  state.heading = heading||0;
  state.pitch = e.beta||0;
  updateChips(); renderAR();
}
function updateChips(){
  $('#compassChip').textContent = 'N ' + Math.round(state.heading) + '°';
  $('#tiltChip').textContent = '↑ ' + Math.round(state.pitch) + '°';
  const visible = arVisiblePlaces().length;
  $('#sitesChip').textContent = t('sites')(visible);
}

/* ---------- AR ---------- */
function arVisiblePlaces(){ return filteredPlaces(); } // show all; distance shown on marker

$('#arEnable').onclick = enableAR;
$('#arOverlay').addEventListener('click', e=>{
  const m = e.target.closest('.ar-marker'); if(!m) return;
  const p = placeById(m.dataset.id); if(p) openSheet(p);
});
async function enableAR(){
  // iOS permission for motion
  try{
    if(typeof DeviceOrientationEvent!=='undefined' && DeviceOrientationEvent.requestPermission){
      const p = await DeviceOrientationEvent.requestPermission();
      if(p==='granted') window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  }catch(e){}
  startAR();
}

async function startAR(){
  $('#arBanner').classList.toggle('hidden', !state.demo);
  if(state.demo) $('#arBanner').textContent = t('demo');
  $('#arHint').textContent = t('hint');
  $('#arEnable').textContent = t('enable');
  try{
    if(!state.arStream){
      state.arStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
    }
    $('#arVideo').srcObject = state.arStream;
    $('#arEnable').style.display='none';
  }catch(e){
    $('#arEnable').style.display='block'; // keep button to retry
  }
  renderAR();
}

function bearing(lat1,lng1,lat2,lng2){
  const toR=d=>d*Math.PI/180, toD=r=>r*180/Math.PI;
  const dLng=toR(lng2-lng1);
  const y=Math.sin(dLng)*Math.cos(toR(lat2));
  const x=Math.cos(toR(lat1))*Math.sin(toR(lat2))-Math.sin(toR(lat1))*Math.cos(toR(lat2))*Math.cos(dLng);
  return (toD(Math.atan2(y,x))+360)%360;
}
function haversine(lat1,lng1,lat2,lng2){
  const R=6371,toR=d=>d*Math.PI/180;
  const dLat=toR(lat2-lat1),dLng=toR(lng2-lng1);
  const a=Math.sin(dLat/2)**2+Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function renderAR(){
  const ov=$('#arOverlay'); if(!ov) return;
  const origin = state.demo ? AL_CENTER : (state.userPos||AL_CENTER);
  const W=window.innerWidth, H=window.innerHeight, FOV=60;
  let html=''; let aim=null, aimAbs=12; // landmark nearest the centre (within 12°) = the one you're pointing at
  arVisiblePlaces().forEach(p=>{
    const b=bearing(origin.lat,origin.lng,p.lat,p.lng);
    let diff=((b-state.heading+540)%360)-180; // -180..180
    if(Math.abs(diff)>FOV/2) return; // outside view
    const x = W/2 + (diff/(FOV/2))*(W/2);
    // vertical: use pitch so holding upright shows markers; nearer = lower
    const d=haversine(origin.lat,origin.lng,p.lat,p.lng);
    const vy = H*0.42 + Math.min(d,40)*1.2 - (state.pitch-45)*2;
    const y = Math.max(70, Math.min(H-200, vy));
    const c=CAT_COLORS[p.category]||'#D8A24A';
    if(Math.abs(diff) < aimAbs){ aimAbs=Math.abs(diff); aim=p; }
    html+=`<div class="ar-marker" data-id="${p.id}" style="left:${x}px;top:${y}px">
      <span class="dot" style="background:${c}"></span><span class="nm">${nm(p)}</span>
      <div class="ds">${distLabel(p)}</div></div>`;
  });
  ov.innerHTML=html;
  if(aim) ov.querySelector(`.ar-marker[data-id="${aim.id}"]`)?.classList.add('aim');
  renderArCard(aim);
  if($('#arHint')) $('#arHint').textContent = t('hint');
  updateChips();
}

// Bottom AR card for the landmark currently centred in view
function renderArCard(p){
  const card=$('#arCard'); if(!card) return;
  if(!p){ card.classList.add('hidden'); state.arAim=null; return; }
  state.arAim=p.id;
  card.classList.remove('hidden');
  card.innerHTML=`
    <div class="thumb"><img src="${p.id}.jpg" alt="" onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,#E8D5B5,${CAT_COLORS[p.category]||'#C9A876'})'"></div>
    <div class="info">
      <h4>${nm(p)}</h4>
      <div class="m">${state.lang==='ar'?catAr(p.category):p.category} · ${distLabel(p)}</div>
      <p>${(desc(p)||'').slice(0,120)}</p>
    </div>
    <div class="acts">
      <button class="go" onclick="openArAim()" aria-label="details">›</button>
      <button onclick="speakAim()" aria-label="listen">🔊</button>
    </div>`;
}
function placeById(id){ return (DATA.places||[]).find(p=>p.id===id); }
function openArAim(){ const p=placeById(state.arAim); if(p) openSheet(p); }
function speakAim(){ const p=placeById(state.arAim); if(p) speak(nm(p), desc(p)||''); }

/* ---------- Map ---------- */
function initMap(){
  if(state.map){ setTimeout(()=>state.map.invalidateSize(),100); return; }
  state.map = L.map('map',{zoomControl:true}).setView([AL_CENTER.lat,AL_CENTER.lng],11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(state.map);
  DATA.places.forEach(p=>{
    const c=CAT_COLORS[p.category]||'#D8A24A';
    const icon=L.divIcon({className:'',html:`<div style="background:${c};width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,iconSize:[16,16]});
    L.marker([p.lat,p.lng],{icon}).addTo(state.map)
      .bindPopup(`<b>${nm(p)}</b><br>${p.duration||''} ${p.price?'· '+p.price+' SAR':''}`);
  });
  setTimeout(()=>state.map.invalidateSize(),200);
}

/* ---------- Camera ---------- */
const CAM_FILTERS=[
  {id:'none',en:'Original',ar:'أصلي',css:'none'},
  {id:'golden',en:'Golden Hour',ar:'ذهبي',css:'saturate(1.4) sepia(.25) brightness(1.05)'},
  {id:'desert',en:'Desert',ar:'صحراء',css:'contrast(1.1) sepia(.4) saturate(1.2)'},
  {id:'bw',en:'B&W',ar:'أبيض وأسود',css:'grayscale(1) contrast(1.1)'},
  {id:'vivid',en:'Vivid',ar:'حيوي',css:'saturate(1.7) contrast(1.15)'},
];
function buildCamFilters(){
  $('#camFilters').innerHTML = CAM_FILTERS.map(f=>`
    <button class="cam-filter ${state.camFilter===f.id?'active':''}" data-cf="${f.id}">${f[state.lang]}</button>`).join('');
  document.querySelectorAll('.cam-filter').forEach(b=> b.onclick=()=>{
    state.camFilter=b.dataset.cf; const css=CAM_FILTERS.find(x=>x.id===b.dataset.cf).css;
    $('#camVideo').style.filter=css; buildCamFilters();
  });
}
async function startCamera(){
  buildCamFilters();
  try{
    if(state.camStream) stopStream('camStream');
    state.camStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:state.camFacing},audio:false});
    $('#camVideo').srcObject=state.camStream;
    $('#camVideo').style.filter = CAM_FILTERS.find(x=>x.id===state.camFilter).css;
  }catch(e){}
}
$('#camFlip').onclick = ()=>{ state.camFacing = state.camFacing==='environment'?'user':'environment'; startCamera(); };
$('#camShutter').onclick = capturePhoto;
$('#camShare').onclick = ()=> capturePhoto(true);

function capturePhoto(share){
  const v=$('#camVideo'), cv=$('#camCanvas');
  cv.width=v.videoWidth||1080; cv.height=v.videoHeight||1440;
  const ctx=cv.getContext('2d');
  ctx.filter = CAM_FILTERS.find(x=>x.id===state.camFilter).css;
  ctx.drawImage(v,0,0,cv.width,cv.height);
  // watermark
  ctx.filter='none'; ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font=`${Math.round(cv.width/28)}px sans-serif`;
  ctx.fillText('AlUla · Journey Through Time', 24, cv.height-30);
  cv.toBlob(async blob=>{
    const file=new File([blob],'alula.jpg',{type:'image/jpeg'});
    if(share && navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
      try{ await navigator.share({files:[file],title:'AlUla',text:'AlUla — Journey Through Time'}); }catch(e){}
    } else {
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='alula.jpg'; a.click();
    }
  },'image/jpeg',0.92);
}

/* ---------- utils ---------- */
function stopStream(key){ if(state[key]){ state[key].getTracks().forEach(t=>t.stop()); state[key]=null; } }

init();
