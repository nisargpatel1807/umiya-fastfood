/* script.js - final: load menu.json, render categories & grid, mobile limited viewport (no load more) */

let menuData = [];

/* small helper */
function escapeHtml(text){
  return String(text || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* show error */
function showMenuError(message){
  const grid = document.getElementById('menuGrid');
  if(!grid) return;
  grid.innerHTML = `<div style="padding:14px;border-radius:10px;background:rgba(255,255,255,0.03);color:var(--muted);text-align:center">${escapeHtml(message)}</div>`;
}

/* load menu.json */
async function loadMenu(){
  try{
    const res = await fetch('menu.json', {cache:"no-store"});
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error('menu.json must be an array');
    menuData = data.map((it, idx) => ({
      id: it.id ?? (idx+1),
      name: it.name ?? '',
      desc: it.desc ?? it.description ?? '',
      price: it.price ?? 0,
      category: it.category ?? 'Others',
      image: it.image ?? it.img ?? 'images/placeholder.png',
      ingredients: it.ingredients ?? it.ing ?? []
    }));
    buildCategories();
    renderMenu(menuData);
    // small UX: if user is on mobile, show fade; otherwise hide
    onResizeAdjust();
  }catch(err){
    console.error('LOAD ERROR:', err);
    showMenuError('Failed to load menu.json — run site with Live Server or check file path.');
    buildCategories([]);
  }
}

/* build categories */
function buildCategories(){
  const ul = document.getElementById('categories');
  if(!ul) return;
  const set = new Set(menuData.map(i => i.category || 'Others'));
  const cats = ['All', ...Array.from(set)];
  ul.innerHTML = '';
  cats.forEach((c, idx) => {
    const li = document.createElement('li');
    li.textContent = c;
    if(idx === 0) li.classList.add('active');
    li.addEventListener('click', () => {
      document.querySelectorAll('#categories li').forEach(x=>x.classList.remove('active'));
      li.classList.add('active');
      const list = c === 'All' ? menuData : menuData.filter(i => i.category === c);
      renderMenu(list);
      // scroll to menu top (nice)
      const menuTop = document.querySelector('.menu-section')?.offsetTop || 0;
      window.scrollTo({ top: menuTop - 10, behavior: 'smooth' });
    });
    ul.appendChild(li);
  });
}

/* render menu */
function renderMenu(list){
  const grid = document.getElementById('menuGrid');
  if(!grid) return;
  grid.innerHTML = '';
  if(!list || list.length === 0){
    showMenuError('No items found.');
    return;
  }
  list.forEach(it => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.innerHTML = `
      <a href="details.html?id=${encodeURIComponent(it.id)}" class="card-link" style="text-decoration:none;color:inherit;display:block;height:100%">
        <div class="img-wrap"><img loading="lazy" src="${escapeHtml(it.image)}" alt="${escapeHtml(it.name)}"></div>
        <div class="menu-info">
          <div class="menu-name">${escapeHtml(it.name)}</div>
          <div class="menu-desc">${escapeHtml(it.desc)}</div>
          <div class="menu-bottom">
            <div class="meta-row"><span class="meta-cat">${escapeHtml(it.category)}</span></div>
            <div class="menu-price">₹${Number(it.price||0).toFixed(0)}</div>
          </div>
        </div>
      </a>
    `;
    grid.appendChild(card);
  });

  // optional tilt (if library loaded)
  try{ if(window.VanillaTilt) VanillaTilt.init(document.querySelectorAll('.menu-card'), {max:8, speed:350, glare:false}); }catch(e){}

  // animation if gsap loaded
  try{
    if(window.gsap){
      gsap.fromTo('.menu-card', {y:18, opacity:0}, {y:0, opacity:1, stagger:0.06, duration:0.6, ease:'power3.out'});
    }
  }catch(e){}
}

/* search */
function setupSearch(){
  const btn = document.getElementById('searchBtn');
  const input = document.getElementById('searchInput');
  if(btn){
    btn.addEventListener('click', ()=>{
      const q = (input.value || '').trim().toLowerCase();
      if(!q) { renderMenu(menuData); return; }
      const res = menuData.filter(i => (i.name + ' ' + (i.desc||'') + ' ' + (i.category||'')).toLowerCase().includes(q));
      renderMenu(res);
    });
  }
  if(input){
    input.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){ e.preventDefault(); btn.click(); }
    });
  }
}

/* smooth nav links */
function setupNavLinks(){
  document.querySelectorAll('.nav-link').forEach(a=>{
    a.addEventListener('click', (ev)=>{
      ev.preventDefault();
      const sel = a.getAttribute('href');
      const el = document.querySelector(sel);
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
}

/* contact form UX */
function setupContactForm(){
  const contactForm = document.getElementById('contactForm');
  if(!contactForm) return;
  contactForm.addEventListener('submit', function(ev){
    const btn = contactForm.querySelector('.btn-send');
    if(btn){ btn.disabled = true; btn.textContent = 'Sending...'; }
    setTimeout(()=>{ if(btn){ btn.textContent = 'Message Sent'; btn.style.background = 'linear-gradient(90deg,#2ecc71,#27ae60)'; } }, 1500);
  });
}

/* jump to contact */
document.addEventListener('DOMContentLoaded', ()=>{
  const jc = document.getElementById('jumpContact');
  if(jc){
    jc.addEventListener('click', ()=>{
      const el = document.getElementById('contact');
      if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
    });
  }
});

/* show/hide elements on resize and adjust fade visibility */
function onResizeAdjust(){
  const fade = document.querySelector('.menu-fade');
  const grid = document.getElementById('menuGrid');
  if(!grid || !fade) return;
  if(window.matchMedia('(max-width:900px)').matches){
    // mobile: show fade
    fade.style.display = 'block';
  } else {
    fade.style.display = 'none';
  }
}

/* init */
window.addEventListener('resize', onResizeAdjust);
document.addEventListener('DOMContentLoaded', ()=>{
  setupSearch();
  setupNavLinks();
  setupContactForm();
  loadMenu();
  onResizeAdjust();
});
