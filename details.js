// details.js - reads ?id= and shows full details from menu.json
(async function(){
  function qParam(name){
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }
  const id = qParam('id');
  const container = document.getElementById('detailsCard');

  if(!id){
    container.innerHTML = `<div style="padding:20px;background:#fff;border-radius:10px;color:#111">No item selected. <a href="index.html">Back to menu</a></div>`;
    return;
  }

  try{
    const res = await fetch('menu.json');
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items || []);
    const item = items.find(it => String(it.id) === String(id));
    if(!item){
      container.innerHTML = `<div style="padding:20px;background:#fff;border-radius:10px;color:#111">Item not found. <a href="index.html">Back to menu</a></div>`;
      return;
    }

    // render detail
    container.innerHTML = `
      <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start">
        <img src="${item.image}" alt="${escapeHtml(item.name)}" style="width:420px;max-width:100%;border-radius:12px;object-fit:cover">
        <div class="details-body">
          <h2>${escapeHtml(item.name)}</h2>
          <div style="color:#666;margin-top:6px">${escapeHtml(item.category)} • ₹${Number(item.price||0).toFixed(0)}</div>
          <p style="margin-top:12px;color:#333">${escapeHtml(item.desc || '')}</p>

          <div style="margin-top:14px">
            <strong>Ingredients</strong>
            <ul class="ingredients-list">
              ${ (item.ingredients && item.ingredients.length) ? item.ingredients.map(ing => `<li>${escapeHtml(ing)}</li>`).join('') : '<li>Not listed</li>' }
            </ul>
          </div>

          <div style="margin-top:18px">
            <strong>More info</strong>
            <p style="color:#666;margin-top:6px">${escapeHtml(item.more || '')}</p>
          </div>

          <div style="margin-top:18px">
            <a href="index.html" class="btn-send" style="text-decoration:none;display:inline-block;padding:10px 14px;border-radius:8px;background:linear-gradient(90deg,#FF5A4A,#FF9F1C);color:#111;font-weight:800">Back to Menu</a>
          </div>
        </div>
      </div>
    `;
  } catch(err){
    container.innerHTML = `<div style="padding:20px;background:#fff;border-radius:10px;color:#111">Failed to load item data. Try again later.</div>`;
    console.error(err);
  }

  function escapeHtml(text){ return String(text || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
})();
