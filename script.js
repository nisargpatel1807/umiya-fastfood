/* CLEAN & FINAL SCRIPT — only one loadMenu(), works with your menu.json format */

let menuData = [];
let filtered = [];

/* Escape HTML helper */
function escapeHtml(text){
  return String(text || '').replace(/[&<>"']/g, m => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[m]));
}

/* Show error inside menu grid */
function showMenuError(message){
  const grid = document.getElementById('menuGrid');
  if(grid){
    grid.innerHTML = `
      <div style="
        padding:14px;
        border-radius:10px;
        background:rgba(255,255,255,0.05);
        color:var(--muted);
        text-align:center;">
        ${escapeHtml(message)}
      </div>`;
  }
}

/* MAIN MENU LOADER */
async function loadMenu(){
  try{
    const res = await fetch('menu.json', {cache:"no-store"});
    if(!res.ok) throw new Error("File not found");

    const data = await res.json();

    // expecting array
    if(!Array.isArray(data)) throw new Error("JSON format invalid");

    menuData = data.map((it, idx) => ({
      id: it.id ?? (idx+1),
      name: it.name ?? "",
      desc: it.desc ?? "",
      price: it.price ?? 0,
      category: it.category ?? "Others",
      image: it.image ?? "images/placeholder.png",
      ingredients: it.ingredients ?? []
    }));

    filtered = menuData.slice();

    buildCategories();
    renderMenu(filtered);
    animateMenuIn();

  }catch(err){
    console.error("LOAD ERROR:", err);
    showMenuError("Failed to load menu.json — run site with Live Server.");
    buildCategories([]);
  }
}

/* BUILD CATEGORY TABS */
function buildCategories(){
  const ul = document.getElementById('categories');
  if(!ul) return;

  const catSet = new Set(menuData.map(i => i.category || "Others"));
  const catList = ["All", ...catSet];

  ul.innerHTML = "";

  catList.forEach((c, index)=>{
    const li = document.createElement("li");
    li.textContent = c;
    if(index === 0) li.classList.add("active");

    li.onclick = () => {
      document.querySelectorAll("#categories li").forEach(x=>x.classList.remove("active"));
      li.classList.add("active");

      filtered = (c === "All") ? menuData : menuData.filter(i => i.category === c);
      renderMenu(filtered);
      animateMenuIn();
    };

    ul.appendChild(li);
  });
}

/* RENDER MENU CARDS */
function renderMenu(list){
  const grid = document.getElementById("menuGrid");
  if(!grid) return;

  grid.innerHTML = "";

  if(list.length === 0){
    showMenuError("No items found.");
    return;
  }

  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "menu-card";

    card.innerHTML = `
      <a href="details.html?id=${encodeURIComponent(item.id)}" class="card-link">
        <div class="img-wrap"><img src="${item.image}" loading="lazy"></div>

        <div class="menu-info">
          <div class="menu-name">${escapeHtml(item.name)}</div>
          <div class="menu-desc">${escapeHtml(item.desc)}</div>

          <div class="menu-bottom">
            <span class="meta-cat">${escapeHtml(item.category)}</span>
            <span class="menu-price">₹${item.price}</span>
          </div>
        </div>
      </a>
    `;

    grid.appendChild(card);
  });

  try{
    if(window.VanillaTilt){
      VanillaTilt.init(document.querySelectorAll(".menu-card"), {max:8, speed:350});
    }
  }catch(e){}
}

/* SEARCH */
function setupSearch(){
  const btn = document.getElementById("searchBtn");
  const input = document.getElementById("searchInput");

  if(btn){
    btn.onclick = () => {
      const q = input.value.trim().toLowerCase();
      if(!q){ renderMenu(menuData); return; }

      const result = menuData.filter(i =>
        (i.name+" "+i.desc+" "+i.category).toLowerCase().includes(q)
      );
      renderMenu(result);
    };
  }

  if(input){
    input.onkeydown = (e)=>{
      if(e.key === "Enter"){
        e.preventDefault();
        btn.click();
      }
    };
  }
}

/* ANIMATION */
function animateMenuIn(){
  try{
    if(window.gsap){
      gsap.fromTo(".menu-card",
        {y:20, opacity:0},
        {y:0, opacity:1, stagger:0.06, duration:0.6, ease:"power3.out"}
      );
    }
  }catch(err){}
}

/* INIT */
document.addEventListener("DOMContentLoaded", ()=>{
  setupSearch();
  loadMenu();
});
