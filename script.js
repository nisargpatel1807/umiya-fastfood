/* script.js - simplified: load menu.json, build categories, render grid (grid scrolls internally) */

let menuData = [];

/* safe escape */
function escapeHtml(text){
  return String(text || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* show error in grid */
function showMenuError(msg){
  const grid = document.getElementById('menuGrid');
  if(!grid) return;
  grid.innerHTML = `<div style="padding:14px;border-radius:10px;background:rgba(255,255,255,0.03);color:var(--muted);text-align:center">${escapeHtml(msg)}</div>`;
}

/* load menu.json */
async function loadMenu(){
  try{
    const res = await fetch('menu.json', {cache:'no-store'});
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error('menu.json format must be an array');
    menuData = data.map((it, idx) => ({
      id: it.id ?? (idx+1),
      name: it.name ?? 'Unnamed',
      desc: it.desc ?? it.description ?? '',
      price: it.price ?? 0,
      category: it.category ?? 'Others',
      image: it.image ?? it.img ?? 'images/placeholder.png',
      ingredients: it.ingredients ?? it.ing ?? []
    }));
    buildCategories();
    renderMenu(menuData);
  } catch(err){
    console.error('LOAD ERROR:', err);
    showMenuError('Failed to load menu.json — make sure file exists in repo root and is valid JSON.');
    buildCategories(); // still build empty categories
  }
}

/* build categories list */
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
      const filtered = c === 'All' ? menuData : menuData.filter(it => it.category === c);
      renderMenu(filtered);
      // scroll internal grid to top so user sees first items
      const grid = document.getElementById('menuGrid');
      if(grid) grid.scrollTop = 0;
    });
    ul.appendChild(li);
  });
}

/* render menu grid */
function renderMenu(list){
  const grid = document.getElementById('menuGrid');
  if(!grid) return;
  grid.innerHTML = '';
  if(!list || !list.length){
    showMenuError('No items found.');
    return;
  }
  list.forEach(it => {
    const a = document.createElement('a');
    a.className = 'card-link';
    a.href = `details.html?id=${encodeURIComponent(it.id)}`;
    a.style.textDecoration = 'none';
    a.style.color = 'inherit';

    const card = document.createElement('div');
    card.className = 'menu-card';

    card.innerHTML = `
      <div class="img-wrap"><img loading="lazy" src="${escapeHtml(it.image)}" alt="${escapeHtml(it.name)}"></div>
      <div class="menu-info">
        <div class="menu-name">${escapeHtml(it.name)}</div>
        <div class="menu-desc">${escapeHtml(it.desc)}</div>
        <div class="menu-bottom">
          <div class="meta-row"><span class="meta-cat">${escapeHtml(it.category)}</span></div>
          <div class="menu-price">₹${Number(it.price||0).toFixed(0)}</div>
        </div>
      </div>
    `;

    a.appendChild(card);
    grid.appendChild(a);
  });

  // optional: init tilt if loaded
  try{
    if(window.VanillaTilt){
      VanillaTilt.init(document.querySelectorAll('.menu-card'), {max:8, speed:350, glare:false});
    }
  }catch(e){}
}

/* search setup */
function setupSearch(){
  const btn = document.getElementById('searchBtn');
  const input = document.getElementById('searchInput');
  if(btn){
    btn.addEventListener('click', () => {
      const q = (input?.value || '').trim().toLowerCase();
      if(!q) { renderMenu(menuData); return; }
      const res = menuData.filter(i => (i.name + ' ' + (i.desc||'') + ' ' + (i.category||'')).toLowerCase().includes(q));
      renderMenu(res);
      const grid = document.getElementById('menuGrid'); if(grid) grid.scrollTop = 0;
    });
  }
  if(input){
    input.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){ e.preventDefault(); btn?.click(); }
    });
  }
}

/* contact jump */
function setupQuickJump(){
  const jump = document.getElementById('jumpContact');
  if(jump){
    jump.addEventListener('click', ()=> {
      const el = document.getElementById('contact');
      if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
    });
  }
}

/* init */
document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  setupQuickJump();
  loadMenu();
});
