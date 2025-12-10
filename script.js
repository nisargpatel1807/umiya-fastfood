/* script.js - final: load menu.json + categories + mobile fixed-height menu area */

/* config */
const INIT_SHOW_MOBILE = 6; // not used to hide cards now; kept for reference

let menuData = [];
let filtered = [];

/* helper */
function escapeHtml(text){
  return String(text || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function showMenuError(message){
  const grid = document.getElementById('menuGrid');
  if(grid){
    grid.innerHTML = `<div style="padding:14px;border-radius:10px;background:rgba(255,255,255,0.03);color:var(--muted);text-align:center">${escapeHtml(message)}</div>`;
  }
}

/* load menu.json */
async function loadMenu(){
  try{
    const res = await fetch('menu.json', {cache:"no-store"});
    if(!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error("Invalid JSON array");
    menuData = data.map((it,idx)=>({
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
    setMobileGridHeight(); // important to compute the mobile area
  }catch(err){
    console.error("LOAD ERROR:", err);
    showMenuError("Failed to load menu.json — please run site with Live Server or check file path.");
    buildCategories(); // at least show categories area empty
  }
}

/* categories */
function buildCategories(){
  const ul = document.getElementById('categories');
  if(!ul) return;
  const set = new Set((menuData||[]).map(i=>i.category || 'Others'));
  const cats = ['All', ...Array.from(set)];
  ul.innerHTML = '';
  cats.forEach((c, idx)=>{
    const li = document.createElement('li');
    li.textContent = c;
    if(idx === 0) li.classList.add('active');
    li.addEventListener('click', ()=>{
      document.querySelectorAll('#categories li').forEach(x=>x.classList.remove('active'));
      li.classList.add('active');
      filtered = (c === 'All') ? menuData.slice() : menuData.filter(it => it.category === c);
      renderMenu(filtered);
      animateMenuIn();
      // scroll menu top to be visible
      const menuTop = document.querySelector('.menu-section')?.offsetTop || 0;
      window.scrollTo({ top: menuTop, behavior: 'smooth' });
    });
    ul.appendChild(li);
  });
}

/* render menu */
function renderMenu(items){
  const grid = document.getElementById('menuGrid');
  if(!grid) return;
  grid.innerHTML = '';
  if(!items || items.length === 0){
    showMenuError('No items found.');
    return;
  }
  items.forEach(it=>{
    const card = document.createElement('div');
    card.className = 'menu-card';
    const safeImg = escapeHtml(it.image || 'images/placeholder.png');
    card.innerHTML = `
      <a href="details.html?id=${encodeURIComponent(it.id)}" class="card-link" style="text-decoration:none;color:inherit;display:block;height:100%">
        <div class="img-wrap"><img loading="lazy" src="${safeImg}" alt="${escapeHtml(it.name)}"></div>
        <div class="menu-info">
          <div class="menu-name">${escapeHtml(it.name)}</div>
          <div class="menu-desc">${escapeHtml(it.desc || '')}</div>
          <div class="menu-bottom">
            <div class="meta-row"><span class="meta-cat">${escapeHtml(it.category || '')}</span></div>
            <div class="menu-price">₹${Number(it.price||0).toFixed(0)}</div>
          </div>
        </div>
      </a>
    `;
    grid.appendChild(card);
  });

  // init tilt if available
  try{ if(window.VanillaTilt) VanillaTilt.init(document.querySelectorAll('.menu-card'), {max:8, speed:350, glare:false}); }catch(e){}
  applyMobileLimit();
}

/* search */
function setupSearch(){
  const btn = document.getElementById('searchBtn');
  const input = document.getElementById('searchInput');
  if(btn){
    btn.addEventListener('click', ()=>{
      const q = (input?.value||'').trim().toLowerCase();
      if(!q){ renderMenu(menuData); return; }
      const res = menuData.filter(i => (i.name + ' ' + i.desc + ' ' + i.category).toLowerCase().includes(q));
      renderMenu(res);
    });
  }
  if(input){
    input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); btn.click(); } });
  }
}

/* animations (if gsap loaded) */
function animateMenuIn(){
  try{
    if(window.gsap) {
      gsap.killTweensOf(".menu-card");
      gsap.fromTo(".menu-card",{y:24,opacity:0,scale:0.98},{y:0,opacity:1,scale:1,stagger:0.06,duration:0.6,ease:"power3.out"});
    }
  }catch(e){}
}

/* MOBILE: set menu-grid max-height dynamically so contact is visible quickly
   Strategy: compute available height (viewport - header - search - some reserve)
   and set .menu-grid max-height accordingly. This keeps menu scroller inside itself.
*/
function setMobileGridHeight(){
  const grid = document.querySelector('.menu-grid');
  if(!grid) return;
  const isMobile = window.matchMedia("(max-width:900px)").matches;
  if(!isMobile){
    grid.style.maxHeight = '640px';
    return;
  }
  const vh = window.innerHeight;
  const header = document.querySelector('.hero')?.offsetHeight || 0;
  const search = document.querySelector('.search-row')?.offsetHeight || 0;
  const cats = document.querySelector('.side-cats')?.offsetHeight || 0;
  // reserve some space so contact card is reachable quickly (adjustable)
  const reserve = 220; // px - allows quick message card visible below
  // available = viewport - header - search - reserve margin
  let available = Math.max(200, vh - header - search - reserve);
  // clamp to reasonable max
  if(available > 760) available = 760;
  grid.style.maxHeight = available + 'px';
}

/* applyMobileLimit will show/hide fade and manage button visibility (we removed load more)
   Now throttle to compute height */
function applyMobileLimit(){
  setMobileGridHeight();
  // show fade only on mobile (CSS handles .menu-fade display)
}

/* smooth nav-links */
function setupNavLinks(){
  document.querySelectorAll('.nav-link').forEach(a=>{
    a.addEventListener('click', (ev)=>{
      ev.preventDefault();
      const sel = a.getAttribute('href');
      const el = document.querySelector(sel);
      if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
    });
  });
}

/* contact quick jump */
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('jumpContact')?.addEventListener('click', ()=>{
    const el = document.querySelector('#contactForm') || document.querySelector('.contact-section');
    if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
  });
});

/* init */
window.addEventListener('resize', function(){ setMobileGridHeight(); });
document.addEventListener('DOMContentLoaded', function(){
  setupSearch();
  setupNavLinks();
  loadMenu();
  // ensure wrapper fade created on load (already exists in HTML)
  setTimeout(()=> setMobileGridHeight(), 120);
});
