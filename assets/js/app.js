let me = null, SET = {}, CUST = [], TX = [], JD = [], REM = [], CAL = false, INVNAME = 'invoice';
const form = f => Object.fromEntries(new FormData(f));
const wrap = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, 1); } };
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const tdy = () => ymd(new Date());
const addD = (s, n) => { const [y, m, d] = s.split('-').map(Number); return ymd(new Date(y, m - 1, d + n)); };
const addM = (s, n) => { const [y, m, d] = s.split('-').map(Number), last = new Date(y, m + n, 0).getDate(); return ymd(new Date(y, m - 1 + n, Math.min(d, last))); };
const fmtTgl = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); };
const ICON = {
  dash: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  plg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  trx: '<path d="M4 2v20l3-2 2 2 3-2 3 2 2-2 3 2V2z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  jdw: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  rem: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  lap: '<path d="M3 3v18h18"/><path d="M7 15l4-5 4 3 5-7"/>',
  set: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
};
document.querySelectorAll('#side button').forEach(b => b.querySelector('i').innerHTML = '<svg viewBox="0 0 24 24">' + ICON[b.dataset.t || 'out'] + '</svg>');
function applyBrand() { $('#brand').textContent = SET.nama_usaha || 'Teknisi Muda'; document.title = (SET.nama_usaha || 'Teknisi Muda'); }
function show(t) {
  document.querySelectorAll('main>section').forEach(s => s.hidden = s.id !== t);
  document.querySelectorAll('#side nav button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  $('#pgTitle').textContent = $('#side nav button[data-t=' + t + '] span').textContent;
  document.body.classList.remove('nav-open'); LOAD[t]();
}
const LOAD = {};
/* ---------- Dashboard ---------- */
LOAD.dash = wrap(async () => {
  const d = await api('getDashboard');
  const L = [['Pelanggan', d.pelanggan], ['Pencucian', d.pencucian], ['Jadwal hari ini', d.jadwalHariIni], ['Jadwal mendatang', d.jadwalMendatang], ['Pengingat H-2', d.pengingatH2], ['Pengingat terkonfirmasi', d.pengingatTerkirim], ['Pengingat belum diproses', d.pengingatBelum], ['Pendapatan hari ini', rp(d.pendapatanHariIni)], ['Pendapatan bulan ini', rp(d.pendapatanBulanIni)], ['Belum lunas', d.belumLunas]];
  $('#dash').innerHTML = '<div class="stats" style="margin-top:10px">' + L.map(x => `<div class="stat">${esc(x[0])}<b>${esc(x[1])}</b></div>`).join('') + '</div>';
});
/* ---------- Pelanggan + pencucian (satu kali input) ---------- */
function resetForm(title) {
  const f = $('#fPlg'); f.reset(); f.elements.id.value = ''; f.elements.tanggal.value = tdy();
  const iv = String(SET.interval_default || 4); f.elements.interval.value = ['3', '4', '5', '6'].includes(iv) ? iv : 'custom'; $('#intCustom').value = iv;
  $('#fTitle').textContent = title || 'Tambah pelanggan baru'; calc();
}
function calc() {
  const f = form($('#fPlg')), on = $('#chkCatat').checked, cu = f.interval === 'custom';
  $('#fxTrx').hidden = !on; $('#lblCustom').hidden = !cu;
  $('#total').textContent = 'Total: ' + rp(Math.max(0, f.unit * f.harga - (f.diskon || 0)));
  const n = Math.floor(Number(cu ? $('#intCustom').value : f.interval));
  $('#prev').textContent = (on && f.tanggal && n >= 1 && n <= 60) ? 'Jadwal berikutnya: ' + addM(f.tanggal, n) + ' · pengingat H-2: ' + addD(addM(f.tanggal, n), -2) : '';
}
$('#fPlg').oninput = calc;
$('#btnBatal').onclick = () => resetForm();
LOAD.plg = wrap(async () => {
  CUST = await api('getCustomers', { q: $('#qPlg').value });
  $('#tPlg').innerHTML = '<tr><th>ID</th><th>Nama</th><th>WhatsApp</th><th>Alamat</th><th>Izin WA</th><th></th></tr>' + CUST.map(c => `<tr><td>${esc(c.id)}</td><td>${esc(c.nama)}</td><td>${esc(c.whatsapp)}</td><td>${esc(c.alamat)}</td><td>${c.persetujuan_wa === 'YA' ? 'Ya' : 'Tidak'}</td><td><button class="btn sm" data-edc="${esc(c.id)}">Edit</button> <button class="btn wa sm" data-nw="${esc(c.id)}">Pencucian baru</button> <button class="btn lt sm" data-riw="${esc(c.id)}">Riwayat</button> ${me.role === 'ADMIN' ? `<button class="btn ghost sm" data-del="${esc(c.id)}">Nonaktifkan</button>` : ''}</td></tr>`).join('');
});
$('#qPlg').oninput = () => LOAD.plg();
function fillCust(id, catat, title) {
  const c = CUST.filter(x => x.id === id)[0], f = $('#fPlg'); resetForm(title + c.nama);
  ['id', 'nama', 'whatsapp', 'alamat', 'catatan'].forEach(k => f.elements[k].value = c[k] || '');
  f.elements.persetujuan_wa.checked = c.persetujuan_wa === 'YA'; $('#chkCatat').checked = catat; calc(); f.scrollIntoView({ behavior: 'smooth' });
}
$('#fPlg').onsubmit = wrap(async e => {
  e.preventDefault(); const f = form(e.target); if (f.interval === 'custom') f.interval = $('#intCustom').value;
  const r = await api('saveCustomerTx', f); resetForm(); toast(r.transaksi ? 'Pelanggan, transaksi & jadwal tersimpan' : 'Pelanggan tersimpan'); LOAD.plg();
});
/* ---------- Transaksi (pembayaran + invoice) ---------- */
function trxRender() {
  const s = $('#trxS').value, a = $('#trxA').value, b = $('#trxB').value, q = $('#trxQ').value.toLowerCase();
  const r = TX.filter(x => (!s || x.status_bayar === s) && (!a || x.tanggal >= a) && (!b || x.tanggal <= b) && (!q || x.nama.toLowerCase().includes(q)));
  const sum = f => r.filter(f).reduce((n, x) => n + Number(x.total), 0);
  $('#trxTot').textContent = 'Pemasukan (lunas): ' + rp(sum(x => x.status_bayar === 'LUNAS')) + ' · Belum lunas: ' + rp(sum(x => x.status_bayar !== 'LUNAS'));
  $('#tTrx').innerHTML = '<tr><th>No</th><th>Tanggal</th><th>Pelanggan</th><th>Unit</th><th>Total</th><th>Metode</th><th>Status</th><th></th></tr>' + r.map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.tanggal)}</td><td>${esc(x.nama)}</td><td>${esc(x.unit)}</td><td>${rp(x.total)}</td><td>${esc(x.metode)}</td><td>${esc(x.status_bayar)}</td><td>${x.status_bayar !== 'LUNAS' ? `<button class="btn sm" data-lunas="${esc(x.id)}">Tandai lunas</button> ` : ''}<button class="btn lt sm" data-inv="${esc(x.id)}">Invoice</button></td></tr>`).join('');
}
LOAD.trx = wrap(async () => { TX = await api('getTransactions', {}); trxRender(); });
$('#fTrx').oninput = trxRender;
const invoiceHtml = (x, S) => {
  const sub = Number(x.unit) * Number(x.harga), ok = x.status_bayar === 'LUNAS';
  return `<div class="inv-head"><div class="inv-brand"><img src="assets/img/logo-full.png" alt="${esc(S.nama_usaha)}" style="width:250px;height:auto"></div><div class="inv-title"><h1>INVOICE</h1><div>No: <b>INV/${esc(x.id)}</b></div><div>Tanggal: <b>${esc(fmtTgl(x.tanggal))}</b></div></div></div><div class="inv-co"><b>${esc(S.nama_usaha)}</b>${S.alamat_usaha ? ' · ' + esc(S.alamat_usaha) : ''}${S.telp_usaha ? ' · Telp/WA: ' + esc(S.telp_usaha) : ''}</div>
<div class="inv-mid"><div><small>DITAGIHKAN KEPADA</small><b>${esc(x.nama)}</b><br>${esc(x.alamat)}<br>WhatsApp: ${esc(x.whatsapp)}</div><div class="stamp ${ok ? 'ok' : 'no'}">${esc(x.status_bayar)}</div></div>
<table class="inv-tbl"><tr><th style="text-align:left">Deskripsi</th><th>Qty</th><th>Harga</th><th>Jumlah</th></tr><tr><td>Jasa pencucian AC${x.teknisi ? '<br><small>Teknisi: ' + esc(x.teknisi) + '</small>' : ''}${x.catatan ? '<br><small>' + esc(x.catatan) + '</small>' : ''}</td><td>${esc(x.unit)} unit</td><td>${rp(x.harga)}</td><td>${rp(sub)}</td></tr></table>
<div class="inv-sum"><div>Subtotal <b>${rp(sub)}</b></div><div>Diskon <b>- ${rp(x.diskon)}</b></div><div class="grand">Total <b>${rp(x.total)}</b></div></div>
<div class="inv-foot"><b>Metode pembayaran:</b> ${esc(x.metode)}${S.info_bayar ? '<br>' + esc(S.info_bayar) : ''}<br><br>Terima kasih atas kepercayaan Anda kepada ${esc(S.nama_usaha)}.</div>`;
};
const openInvoice = wrap(async id => {
  const x = TX.filter(t => t.id === id)[0], S = await api('getSettings'); // nama usaha selalu terbaru
  INVNAME = 'Invoice-' + x.id; $('#invoice').innerHTML = invoiceHtml(x, S); $('#invModal').hidden = false;
});
const invCanvas = async () => { if (!window.html2canvas) throw new Error('Pustaka PDF/JPG belum termuat, periksa koneksi internet'); return html2canvas($('#invoice'), { scale: 2, backgroundColor: '#ffffff', useCORS: true }); };
$('#invClose').onclick = () => $('#invModal').hidden = true;
$('#invPrint').onclick = () => { document.body.classList.add('print-inv'); window.print(); setTimeout(() => document.body.classList.remove('print-inv'), 500); };
$('#invJpg').onclick = wrap(async () => { const c = await invCanvas(), a = document.createElement('a'); a.href = c.toDataURL('image/jpeg', 0.95); a.download = INVNAME + '.jpg'; a.click(); });
$('#invPdf').onclick = wrap(async () => {
  const c = await invCanvas(); if (!window.jspdf) throw new Error('Pustaka PDF belum termuat');
  const pdf = new jspdf.jsPDF('p', 'mm', 'a4'); let w = 210, h = c.height * w / c.width; if (h > 297) { w = w * 297 / h; h = 297; }
  pdf.addImage(c.toDataURL('image/jpeg', 0.95), 'JPEG', (210 - w) / 2, 0, w, h); pdf.save(INVNAME + '.pdf');
});
/* ---------- Jadwal ---------- */
function renderJdw() {
  const q = $('#jQ').value.toLowerCase(), st = $('#jS').value, m = $('#jM').value, t = tdy();
  const r = JD.filter(j => (!q || (j.nama || '').toLowerCase().includes(q)) && (!st || j.status === st) && (!m || j.tgl_jadwal.startsWith(m)));
  const cls = j => j.status === 'SELESAI' ? 'r-done' : j.tgl_jadwal < t ? 'r-late' : j.tgl_jadwal === t ? 'r-today' : j.tgl_jadwal <= addD(t, 2) ? 'r-h2' : '';
  $('#tJdw').parentElement.hidden = CAL; $('#cal').hidden = !CAL; $('#jMode').textContent = CAL ? 'Tampilan tabel' : 'Tampilan kalender';
  $('#tJdw').innerHTML = '<tr><th>Tanggal</th><th>Pelanggan</th><th>Status</th><th></th></tr>' + r.map(j => `<tr class="${cls(j)}"><td>${esc(j.tgl_jadwal)}</td><td>${esc(j.nama)}</td><td>${esc(j.status)}</td><td><a class="btn wa sm" target="_blank" rel="noopener" href="https://wa.me/${esc(j.whatsapp)}">WA</a> ${me.role === 'ADMIN' ? `<button class="btn sm" data-edt="${esc(j.id)}" data-d="${esc(j.tgl_jadwal)}">Ubah tanggal</button>` : ''}</td></tr>`).join('');
  if (CAL) {
    const mm = m || t.slice(0, 7), [y, mo] = mm.split('-').map(Number), first = new Date(y, mo - 1, 1).getDay(), n = new Date(y, mo, 0).getDate();
    let h = '<div class="cal">' + ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => `<b>${d}</b>`).join('') + '<i></i>'.repeat(first);
    for (let d = 1; d <= n; d++) { const ds = mm + '-' + pad(d); h += `<div class="day ${ds === t ? 'today' : ''}"><span>${d}</span>${r.filter(j => j.tgl_jadwal === ds).map(j => `<em class="${cls(j)}">${esc(j.nama)}</em>`).join('')}</div>`; }
    $('#cal').innerHTML = h + '</div>';
  }
}
LOAD.jdw = wrap(async () => { JD = await api('getSchedules', {}); renderJdw(); });
$('#fJ').oninput = renderJdw;
$('#jMode').onclick = () => { CAL = !CAL; if (CAL && !$('#jM').value) $('#jM').value = tdy().slice(0, 7); renderJdw(); };
/* ---------- Pengingat: semua pelanggan + kirim WhatsApp ---------- */
function renderRem() {
  const q = $('#qRem').value.toLowerCase(), t = tdy();
  const r = REM.filter(x => !q || x.nama.toLowerCase().includes(q) || x.whatsapp.includes(q));
  $('#tRem').innerHTML = '<tr><th>Pelanggan</th><th>Alamat</th><th>WhatsApp</th><th>Cuci terakhir</th><th>Jadwal berikutnya</th><th>Status pengingat</th><th>Aksi</th></tr>' + r.map(x => {
    const dl = x.tgl_jadwal ? Math.round((new Date(x.tgl_jadwal) - new Date(t)) / 864e5) : null;
    const jd = x.tgl_jadwal ? esc(x.tgl_jadwal) + ' <small>(' + (dl < 0 ? 'terlambat ' + (-dl) + ' hari' : dl === 0 ? 'hari ini' : 'H-' + dl) + ')</small>' : '-';
    const at = `data-n="${esc(x.whatsapp)}" data-m="${esc(x.pesan)}" data-j="${esc(x.id_jadwal)}" data-id="${esc(x.id_pengingat)}"`;
    return `<tr class="${dl === null ? '' : dl < 0 ? 'r-late' : dl <= 2 ? 'r-h2' : ''}"><td><b>${esc(x.nama)}</b></td><td>${esc(x.alamat)}</td><td>${esc(x.whatsapp)}</td><td>${esc(x.tgl_terakhir || '-')}</td><td>${jd}</td><td>${esc(x.status || '-')}</td><td><button class="btn wa sm" data-a="wa" ${at}>KIRIM WHATSAPP</button> <button class="btn lt sm" data-a="cp" ${at}>Salin</button>${x.id_jadwal ? ` <button class="btn sm" data-a="ok" ${at}>Sudah dihubungi</button>` : ''}</td></tr>`;
  }).join('');
}
LOAD.rem = wrap(async () => { if (me.role !== 'ADMIN') { $('#tRem').innerHTML = '<tr><td>Hanya ADMIN.</td></tr>'; return; } REM = await api('getReminders', {}); renderRem(); });
$('#qRem').oninput = renderRem;
$('#btnCek').onclick = wrap(async () => { const r = await api('runReminderCheck'); toast('Pengingat baru: ' + r.dibuat); LOAD.rem(); });
/* ---------- Laporan ---------- */
LOAD.lap = async () => { if (!$('#lapT').value) $('#lapT').value = tdy(); };
const lapQ = () => ({ jenis: $('#lapJ').value, tanggal: $('#lapT').value });
$('#btnLap').onclick = wrap(async () => {
  const r = await api('getReports', lapQ());
  const L = [['Periode', r.dari + ' s/d ' + r.sampai], ['Pendapatan (lunas)', rp(r.pendapatan)], ['Belum lunas', rp(r.tagihan)], ['Jumlah pencucian', r.jumlahPencucian], ['Unit AC', r.unit], ['Pelanggan aktif', r.pelangganAktif]];
  $('#lapOut').innerHTML = '<div class="stats card">' + L.map(x => `<div class="stat">${esc(x[0])}<b>${esc(x[1])}</b></div>`).join('') + '</div>' +
    '<div class="card"><b>Pelanggan yang belum mencuci kembali (jadwal terlewat)</b></div><div class="wrap"><table><tr><th>Pelanggan</th><th>WhatsApp</th><th>Jadwal</th></tr>' + r.belumMencuci.map(x => `<tr><td>${esc(x.nama)}</td><td>${esc(x.whatsapp)}</td><td>${esc(x.tgl_jadwal)}</td></tr>`).join('') + '</table></div>' +
    '<div class="wrap"><table><tr><th>Tanggal</th><th>Pelanggan</th><th>Unit</th><th>Total</th><th>Status</th></tr>' + r.rows.map(x => `<tr><td>${esc(x.tanggal)}</td><td>${esc(x.nama)}</td><td>${esc(x.unit)}</td><td>${rp(x.total)}</td><td>${esc(x.status_bayar)}</td></tr>`).join('') + '</table></div>';
});
$('#btnCsv').onclick = wrap(async () => { const r = await api('exportReport', lapQ()), a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + r.csv], { type: 'text/csv' })); a.download = r.nama; a.click(); URL.revokeObjectURL(a.href); });
$('#btnPrint').onclick = () => window.print();
/* ---------- Pengaturan ---------- */
const SETK = ['nama_usaha', 'alamat_usaha', 'telp_usaha', 'info_bayar', 'interval_default', 'template_pesan', 'wa_api_aktif', 'wa_template', 'wa_lang'];
LOAD.set = wrap(async () => {
  $('#adm').hidden = me.role !== 'ADMIN'; if (me.role !== 'ADMIN') return;
  const [s, us] = await Promise.all([api('getSettings'), api('getUsers')]), f = $('#fSet');
  SETK.forEach(k => f.elements[k].value = s[k] || (k === 'wa_api_aktif' ? 'TIDAK' : ''));
  $('#waInfo').textContent = s.wa_kredensial ? 'Kredensial WhatsApp API terdeteksi.' : 'Kredensial WA_TOKEN dan WA_PHONE_ID diisi di Script Properties Apps Script (bukan di sini).';
  $('#tUsr').innerHTML = '<tr><th>Username</th><th>Nama</th><th>Role</th><th>Aktif</th><th></th></tr>' + us.map(x => `<tr><td>${esc(x.username)}</td><td>${esc(x.nama)}</td><td>${esc(x.role)}</td><td>${esc(x.aktif)}</td><td><button class="btn sm" data-ut="${esc(x.id)}" data-ak="${esc(x.aktif)}">${x.aktif === 'YA' ? 'Nonaktifkan' : 'Aktifkan'}</button> <button class="btn lt sm" data-upw="${esc(x.id)}">Reset password</button></td></tr>`).join('');
});
$('#fSet').onsubmit = wrap(async e => { e.preventDefault(); await api('saveSettings', form(e.target)); SET = await api('getSettings'); applyBrand(); toast('Pengaturan tersimpan'); });
$('#fUsr').onsubmit = wrap(async e => { e.preventDefault(); await api('saveUser', form(e.target)); e.target.reset(); toast('Akun ditambahkan'); LOAD.set(); });
$('#fPw').onsubmit = wrap(async e => { e.preventDefault(); await api('changePassword', form(e.target)); e.target.reset(); toast('Password diganti'); });
/* ---------- Klik global ---------- */
document.addEventListener('click', wrap(async e => {
  if (e.target.id === 'scrim') return document.body.classList.remove('nav-open');
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  if (d.t) show(d.t);
  if (d.edc) fillCust(d.edc, false, 'Edit pelanggan: ');
  if (d.nw) fillCust(d.nw, true, 'Pencucian baru untuk: ');
  if (d.del && confirm('Nonaktifkan pelanggan ini?')) { await api('deleteCustomer', { id: d.del }); toast('Dinonaktifkan'); LOAD.plg(); }
  if (d.riw) { const t = await api('getTransactions', { id_pelanggan: d.riw }); $('#riw').innerHTML = '<div class="card"><b>Riwayat pencucian</b></div><div class="wrap"><table><tr><th>Tanggal</th><th>Unit</th><th>Total</th><th>Status</th><th>Teknisi</th></tr>' + (t.map(x => `<tr><td>${esc(x.tanggal)}</td><td>${esc(x.unit)}</td><td>${rp(x.total)}</td><td>${esc(x.status_bayar)}</td><td>${esc(x.teknisi)}</td></tr>`).join('') || '<tr><td colspan="5">Belum ada transaksi</td></tr>') + '</table></div>'; $('#riw').scrollIntoView({ behavior: 'smooth' }); }
  if (d.lunas) { await api('updateTransaction', { id: d.lunas, status_bayar: 'LUNAS' }); toast('Ditandai lunas'); LOAD.trx(); }
  if (d.inv) openInvoice(d.inv);
  if (d.edt) { const v = prompt('Tanggal jadwal baru (YYYY-MM-DD)', d.d); if (v) { await api('updateSchedule', { id: d.edt, tgl_jadwal: v }); toast('Jadwal diperbarui'); LOAD.jdw(); } }
  if (d.a === 'wa') { window.open('https://wa.me/' + d.n + '?text=' + encodeURIComponent(d.m), '_blank'); if (d.j) await api('updateReminderStatus', { id: d.id, id_jadwal: d.j, status: 'DIBUKA DI WHATSAPP' }); LOAD.rem(); }
  if (d.a === 'cp') { await navigator.clipboard.writeText(d.m); toast('Pesan disalin'); }
  if (d.a === 'ok') { await api('updateReminderStatus', { id: d.id, id_jadwal: d.j, status: 'SUDAH DIKONFIRMASI ADMIN' }); toast('Tercatat'); LOAD.rem(); }
  if (d.ut) { await api('updateUser', { id: d.ut, aktif: d.ak === 'YA' ? 'TIDAK' : 'YA' }); LOAD.set(); }
  if (d.upw) { const v = prompt('Password baru (min 8 karakter)'); if (v) { await api('updateUser', { id: d.upw, password: v }); toast('Password diganti'); } }
}));
$('#burger').onclick = () => document.body.classList.toggle('nav-open');
/* ---------- Login / sesi ---------- */
$('#tgPw').onclick = () => { const i = $('#p'), h = i.type === 'password'; i.type = h ? 'text' : 'password'; $('#tgPw').textContent = h ? 'Sembunyi' : 'Lihat'; };
$('#fLogin').onsubmit = async e => {
  e.preventDefault(); const b = $('#btnLogin'), er = $('#lerr'); er.hidden = true; b.disabled = true; b.textContent = 'Memproses...';
  try { const r = await api('login', { username: $('#u').value.trim(), password: $('#p').value }); localStorage.setItem('acc_token', r.token); start(r.user); }
  catch (x) { er.textContent = /fetch|Failed|NetworkError|JSON/i.test(x.message) ? 'Tidak dapat terhubung ke server. Periksa API_URL di config.js dan deployment Apps Script.' : x.message; er.hidden = false; }
  finally { b.disabled = false; b.textContent = 'Masuk'; }
};
$('#btnOut').onclick = wrap(async () => { await api('logout'); localStorage.removeItem('acc_token'); location.reload(); });
function start(u) {
  me = u; $('#login').hidden = true; $('#app').hidden = false; $('#who').textContent = u.nama + ' (' + u.role + ')';
  document.querySelectorAll('[data-t=rem],[data-t=lap]').forEach(b => b.hidden = u.role !== 'ADMIN');
  resetForm(); api('getSettings').then(s => { SET = s; applyBrand(); resetForm(); }).catch(() => { });
  show('dash');
}
if (localStorage.getItem('acc_token')) api('validateSession').then(start).catch(() => localStorage.removeItem('acc_token'));
