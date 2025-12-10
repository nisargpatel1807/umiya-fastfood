/* script.js - final ready-to-paste */

/* CONFIG */
const INIT_SHOW_MOBILE = 6;

/* state */
let menuData = [];
let filtered = [];
let currentMenuItems = [];

/* helpers */
function escapeHtml(text){
  return String(text || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function showMenuError(message){
  const grid = document.getElementById('menuGrid');
  if(grid){
    grid.innerHTML = `<div style="padding:14px;border-radius:10px;background:rgba(255,255,255,0.05);color:var(--muted);text-align:center">${escapeHtml(message)}</div>`;
  }
}

/* wrap grid if not present (menu-fade) - safe */
function ensureWrapper(){
  const grid = document.getElementById('menuGrid');
  if(!grid) return;
  const parent = grid.parentElement;
  if(parent && parent.classList.contains('menu-grid-wrapper')) return;
  // create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'menu-grid-wrapper';
  grid.parentNode.insertBefore(wrapper, grid);
  wrapper.appendChild(grid);
  const fade = document.createElement('div');
  fade.className = 'menu-fade';
  wrapper.appendChild(fade);
}

/* load menu.json */
async function loadMenu(){
  try{
    const res = await fetch('menu.json', {cache: "no-store"});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error("menu.json must be an array");
    menuData = data.map((it, idx) => ({
      id: it.id ?? (idx+1),
      name: it.name ?? "",
      desc: it.desc ?? it.description ?? "",
      price: it.price ?? 0,
      category: it.category ?? "Others",
      image: it.image ?? it.img ?? "images/placeholder.png",
      ingredients: it.ingredients ?? []
    }));
    filtered = menuData.slice();
    buildCategories();
    renderMenu(filtered);
    updateShowingCounter();
    animateMenuIn();
  } catch(err){
    console.error("LOAD ERROR:", err);
    showMenuError("Failed to load menu.json — run site with Live Server or check file path.");
    buildCategories();
  }
}

/* build categories */
function buildCategories(){
  const ul = document.getElementById('categories');
  if(!ul) return;
  const set = new Set(menuData.map(i => i.category || "Others"));
  const cats = ["All", ...Array.from(set)];
  ul.innerHTML = "";
  cats.forEach((c, idx) => {
    const li = document.createElement('li');
    li.textContent = c;
    if(idx === 0) li.classList.add('active');
    li.addEventListener('click', () => {
      document.querySelectorAll('#categories li').forEach(x => x.classList.remove('active'));
      li.classList.add('active');
      filtered = (c === "All") ? menuData.slice() : menuData.filter(it => it.category === c);
      renderMenu(filtered);
      updateShowingCounter();
      animateMenuIn();
      // small scroll to menu top
      const menuTop = document.querySelector('.menu-section')?.offsetTop || 0;
      window.scrollTo({ top: menuTop, behavior: 'smooth' });
    });
    ul.appendChild(li);
  });
}

/* render menu (cards) */
function renderMenu(list){
  currentMenuItems = list || [];
  const grid = document.getElementById('menuGrid');
  if(!grid) return;
  grid.innerHTML = "";
  if(!list || list.length === 0){
    showMenuError("No items found.");
    return;
  }
  list.forEach((it, idx) => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.dataset.index = idx;
    const safeImg = escapeHtml(it.image || 'images/placeholder.png');
    const safeName = escapeHtml(it.name || '');
    const safeDesc = escapeHtml(it.desc || '');
    const safeCat = escapeHtml(it.category || '');
    const safePrice = Number(it.price || 0).toFixed(0);
    card.innerHTML = `
      <a href="details.html?id=${encodeURIComponent(it.id)}" class="card-link" style="text-decoration:none;color:inherit;display:block;height:100%">
        <div class="img-wrap"><img loading="lazy" src="${safeImg}" alt="${safeName}"></div>
        <div class="menu-info">
          <div class="menu-name">${safeName}</div>
          <div class="menu-desc">${safeDesc}</div>
          <div class="menu-bottom">
            <div class="meta-row"><span class="meta-cat">${safeCat}</span></div>
            <div class="menu-price">₹${safePrice}</div>
          </div>
        </div>
      </a>
    `;
    grid.appendChild(card);
  });

  // vanilla-tilt if available
  try {
    if(window.VanillaTilt) VanillaTilt.init(document.querySelectorAll('.menu-card'), { max: 8, speed: 350, glare:false });
  } catch(e){}
  applyMobileLimit();
  animateMenuIn();
  updateShowingCounter();
}

/* SEARCH */
function setupSearch(){
  const btn = document.getElementById('searchBtn');
  const input = document.getElementById('searchInput');
  if(btn){
    btn.addEventListener('click', ()=> {
      const q = (input?.value || '').trim().toLowerCase();
      if(!q){ renderMenu(menuData); return; }
      const res = menuData.filter(i => (i.name + ' ' + (i.desc||'') + ' ' + (i.category||'')).toLowerCase().includes(q));
      renderMenu(res);
    });
  }
  if(input){
    input.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){ e.preventDefault(); btn?.click(); }
    });
  }
}

/* GSAP animate (safe) */
function animateMenuIn(){
  try {
    if(window.gsap){
      gsap.killTweensOf(".menu-card");
      gsap.fromTo(".menu-card", {y:24, opacity:0, scale:0.98}, { y:0, opacity:1, scale:1, stagger:0.06, duration:0.6, ease:"power3.out", overwrite:true });
    }
  } catch(e){}
}

/* MOBILE LIMIT logic */
function applyMobileLimit(){
  const grid = document.getElementById('menuGrid');
  if(!grid) return;
  const wrapper = grid.parentElement;
  const cards = Array.from(grid.querySelectorAll('.menu-card'));
  const isMobile = window.matchMedia("(max-width:900px)").matches;
  const loadBtn = document.getElementById('loadMoreBtn');

  if(isMobile){
    cards.forEach((c,i) => { c.style.display = (i < INIT_SHOW_MOBILE) ? 'block' : 'none'; });
    if(wrapper) wrapper.classList.add('menu-collapsed');
    if(loadBtn){
      loadBtn.style.display = 'inline-block';
      loadBtn.textContent = 'Load more items';
      loadBtn.setAttribute('aria-expanded','false');
    }
  } else {
    cards.forEach(c => c.style.display = 'block');
    if(wrapper) wrapper.classList.remove('menu-collapsed');
    if(loadBtn) loadBtn.style.display = 'none';
  }
  updateShowingCounter();
}

/* loadMore toggle */
function setupLoadMore(){
  const btn = document.getElementById('loadMoreBtn');
  if(!btn) return;
  btn.addEventListener('click', function(){
    const grid = document.getElementById('menuGrid');
    if(!grid) return;
    const cards = Array.from(grid.querySelectorAll('.menu-card'));
    const wrapper = grid.parentElement;
    const expanded = btn.getAttribute('aria-expanded') === 'true';

    if(!expanded){
      cards.forEach(c => c.style.display = 'block');
      if(wrapper) wrapper.classList.remove('menu-collapsed');
      btn.textContent = 'Show less';
      btn.setAttribute('aria-expanded','true');
      setTimeout(()=> window.scrollBy({top:120, behavior:'smooth'}), 80);
    } else {
      cards.forEach((c,i) => { c.style.display = (i < INIT_SHOW_MOBILE) ? 'block' : 'none'; });
      if(wrapper) wrapper.classList.add('menu-collapsed');
      btn.textContent = 'Load more items';
      btn.setAttribute('aria-expanded','false');
      const menuTop = document.querySelector('.menu-section')?.offsetTop || 0;
      window.scrollTo({ top: menuTop - 80, behavior: 'smooth' });
    }
    updateShowingCounter();
  });
}

/* showing counter update */
function updateShowingCounter(){
  const counter = document.getElementById('showingCounter');
  if(!counter) return;
  const total = currentMenuItems.length || (menuData.length || 0);
  const isMobile = window.matchMedia("(max-width:900px)").matches;
  const showing = (isMobile && (document.getElementById('loadMoreBtn')?.getAttribute('aria-expanded') !== 'true')) ? Math.min(INIT_SHOW_MOBILE, total) : total;
  counter.textContent = total ? `Showing ${showing} of ${total}` : '';
}

/* jump Contact */
function setupJumpContact(){
  const btn = document.getElementById('jumpContact');
  if(!btn) return;
  btn.addEventListener('click', ()=> {
    const el = document.querySelector('#contactForm') || document.querySelector('.contact-section');
    if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
  });
}

/* nav link smooth scroll */
function setupNavLinks(){
  document.querySelectorAll('.nav-link').forEach(a=>{
    a.addEventListener('click', (ev)=>{
      ev.preventDefault();
      const sel = a.getAttribute('href');
      const el = document.querySelector(sel);
      if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
}

/* contact form UX (Formspree fallback) */
function setupContactForm(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  form.addEventListener('submit', function(ev){
    const btn = form.querySelector('.btn-send');
    if(btn){ btn.disabled = true; btn.textContent = 'Sending...'; }
    setTimeout(()=>{ if(btn){ btn.textContent = 'Message Sent'; btn.style.background = 'linear-gradient(90deg,#2ecc71,#27ae60)'; } }, 1800);
  });
}

/* resize handler */
window.addEventListener('resize', ()=> {
  const loadBtn = document.getElementById('loadMoreBtn');
  if(window.matchMedia("(max-width:900px)").matches){
    if(loadBtn) loadBtn.style.display = 'inline-block';
  } else {
    if(loadBtn) loadBtn.style.display = 'none';
  }
  applyMobileLimit();
});

/* INIT */
document.addEventListener('DOMContentLoaded', ()=>{
  ensureWrapper();
  setupSearch();
  setupLoadMore();
  setupJumpContact();
  setupNavLinks();
  setupContactForm();
  loadMenu();
});
