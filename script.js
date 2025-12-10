/* script.js - final ready-to-paste version for your HTML */

/* CONFIG */
const INIT_SHOW_MOBILE = 4; // mobile shows first 4 items (change to 6 if you prefer)

/* state */
let menuData = [];
let filtered = [];
let currentMenuItems = [];

/* helper */
function escapeHtml(text){
  return String(text || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function showMenuError(message){
  const grid = document.getElementById('menuGrid');
  if(grid) grid.innerHTML = `<div style="padding:14px;border-radius:10px;background:rgba(255,255,255,0.02);color:var(--muted);text-align:center">${escapeHtml(message)}</div>`;
}

/* MENU LOADER */
async function loadMenu(){
  try{
    const res = await fetch('menu.json', {cache: "no-store"});
    if(!res.ok) throw new Error('Failed fetch');
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error('Invalid JSON');
    menuData = data.map((it,idx) => ({
      id: it.id ?? (idx+1),
      name: it.name ?? '',
      desc: it.desc ?? it.description ?? '',
      price: it.price ?? 0,
      category: it.category ?? 'Others',
      image: it.image ?? it.img ?? 'images/placeholder.png',
      ingredients: it.ingredients ?? it.ing ?? []
    }));
    filtered = menuData.slice();
    buildCategories();
    renderMenu(filtered);
    animateMenuIn();
  }catch(err){
    console.error('LOAD ERROR:', err);
    showMenuError('Failed to load menu.json — run site with Live Server.');
    buildCategories();
  }
}

/* CATEGORIES */
function buildCategories(){
  const ul = document.getElementById('categories');
  if(!ul) return;
  const set = new Set((menuData||[]).map(i=>i.category||'Others'));
  const cats = ['All', ...Array.from(set)];
  ul.innerHTML = '';
  cats.forEach((c, i) => {
    const li = document.createElement('li');
    li.textContent = c;
    if(i===0) li.classList.add('active');
    li.onclick = () => {
      document.querySelectorAll('#categories li').forEach(x=>x.classList.remove('active'));
      li.classList.add('active');
      filtered = (c === 'All') ? menuData.slice() : menuData.filter(it => it.category === c);
      renderMenu(filtered);
      animateMenuIn();
      // scroll to menu area (slightly below header)
      const top = document.querySelector('.menu-section')?.offsetTop || 0;
      window.scrollTo({ top: Math.max(top - 70, 0), behavior: 'smooth' });
    };
    ul.appendChild(li);
  });
}

/* RENDER MENU */
function renderMenu(items){
  currentMenuItems = items || [];
  const grid = document.getElementById('menuGrid');
  if(!grid) return;
  grid.innerHTML = '';
  if(!items || items.length === 0){
    showMenuError('No items found.');
    return;
  }
  items.forEach((it, idx) => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.dataset.index = idx;
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

  // apply mobile limit display
  applyMobileLimit();

  // init tilt if available
  try{ if(window.VanillaTilt) VanillaTilt.init(document.querySelectorAll('.menu-card'), {max:8, speed:350, glare:false}); }catch(e){}
  animateMenuIn();
}

/* SEARCH SETUP */
function setupSearch(){
  const btn = document.getElementById('searchBtn');
  const input = document.getElementById('searchInput');
  if(btn){
    btn.onclick = () => {
      const q = (input?.value||'').trim().toLowerCase();
      if(!q){ renderMenu(menuData); return; }
      const res = menuData.filter(i => (i.name + ' ' + i.desc + ' ' + i.category).toLowerCase().includes(q));
      renderMenu(res);
    };
  }
  if(input){
    input.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); btn?.click(); }});
  }
}

/* ANIMATION */
function animateMenuIn(){
  try{
    if(window.gsap){
      gsap.killTweensOf('.menu-card');
      gsap.fromTo('.menu-card', {y:18, opacity:0}, {y:0, opacity:1, stagger:0.06, duration:0.55, ease:'power3.out'});
    }
  }catch(e){}
}

/* MOBILE LIMIT (show only first N items on mobile) */
function applyMobileLimit(){
  const isMobile = window.matchMedia('(max-width:900px)').matches;
  const grid = document.getElementById('menuGrid');
  if(!grid) return;
  const cards = Array.from(grid.querySelectorAll('.menu-card'));
  if(isMobile){
    cards.forEach((c, idx) => { c.style.display = (idx < INIT_SHOW_MOBILE) ? 'block' : 'none'; });
    grid.parentElement?.classList?.add('menu-collapsed');
    // show mobile fade (if present)
    const fade = grid.parentElement.querySelector('.menu-fade');
    if(fade) fade.style.display = 'block';
    // hide load more controls (we removed)
    const btn = document.getElementById('loadMoreBtn'); if(btn) btn.style.display = 'none';
  } else {
    cards.forEach(c => { c.style.display = 'block'; });
    grid.parentElement?.classList?.remove('menu-collapsed');
    const fade = grid.parentElement.querySelector('.menu-fade'); if(fade) fade.style.display = 'none';
    const btn = document.getElementById('loadMoreBtn'); if(btn) btn.style.display = 'none';
  }
}

/* JUMP TO CONTACT (button) */
document.addEventListener('DOMContentLoaded', () => {
  const jump = document.getElementById('jumpContact');
  if(jump){
    jump.addEventListener('click', () => {
      const el = document.querySelector('#contact') || document.querySelector('.contact-section');
      if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
    });
  }

  // setup search + load menu
  setupSearch();
  loadMenu();
});

/* responsive updates */
window.addEventListener('resize', () => {
  // re-apply mobile limit
  applyMobileLimit();
});
