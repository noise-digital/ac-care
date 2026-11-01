const $ = s => document.querySelector(s);
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
function toast(m, err) { const t = $('#toast'); t.textContent = m; t.className = err ? 'err' : ''; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 3000); }
async function api(action, payload) {
  document.body.style.cursor = 'progress';
  try {
    const r = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action, payload: payload || {}, token: localStorage.getItem('acc_token') }) }); // text/plain: tanpa preflight CORS
    const j = await r.json();
    if (!j.ok) { if (j.code === 'SESSION') { localStorage.removeItem('acc_token'); location.reload(); } throw new Error(j.error); }
    return j.data;
  } finally { document.body.style.cursor = ''; }
}
