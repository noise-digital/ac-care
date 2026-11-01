let me = null;
const form = f => Object.fromEntries(new FormData(f));
const wrap = (fn) => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, 1); } };
function show(t) { document.querySelectorAll('main>section').forEach(s => s.hidden = s.id !== t); document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); LOAD[t](); }
const LOAD = {
  dash: wrap(async () => { const d = await api('getDashboard'); const L = [['Pelanggan', d.pelanggan], ['Pencucian', d.pencucian], ['Jadwal hari ini', d.jadwalHariIni], ['Jadwal mendatang', d.jadwalMendatang], ['Pengingat H-2', d.pengingatH2], ['Pengingat terkonfirmasi', d.pengingatTerkirim], ['Pengingat belum diproses', d.pengingatBelum], ['Pendapatan hari ini', rp(d.pendapatanHariIni)], ['Pendapatan bulan ini', rp(d.pendapatanBulanIni)], ['Belum lunas', d.belumLunas]];
    $('#dash').innerHTML = '<div class="stats card">' + L.map(x => `<div class="stat">${esc(x[0])}<b>${esc(x[1])}</b></div>`).join('') + '</div>'; }),
  plg: wrap(async () => { const r = await api('getCustomers', { q: $('#qPlg').value });
    $('#tPlg').innerHTML = '<tr><th>ID</th><th>Nama</th><th>WhatsApp</th><th>Alamat</th><th></th></tr>' + r.map(c => `<tr><td>${esc(c.id)}</td><td>${esc(c.nama)}</td><td>${esc(c.whatsapp)}</td><td>${esc(c.alamat)}</td><td>${me.role === 'ADMIN' ? `<button class="btn sm" data-del="${esc(c.id)}">Nonaktifkan</button>` : ''}</td></tr>`).join(''); }),
  trx: wrap(async () => { const [c, t] = await Promise.all([api('getCustomers', {}), api('getTransactions', {})]);
    $('#selPlg').innerHTML = '<option value="">- Pilih pelanggan -</option>' + c.map(x => `<option value="${esc(x.id)}">${esc(x.nama)} (${esc(x.whatsapp)})</option>`).join('');
    $('#tTrx').innerHTML = '<tr><th>Tanggal</th><th>Pelanggan</th><th>Unit</th><th>Total</th><th>Bayar</th></tr>' + t.map(x => `<tr><td>${esc(x.tanggal)}</td><td>${esc(x.nama)}</td><td>${esc(x.unit)}</td><td>${rp(x.total)}</td><td>${esc(x.status_bayar)}</td></tr>`).join(''); }),
  jdw: wrap(async () => { const r = await api('getSchedules', {});
    $('#tJdw').innerHTML = '<tr><th>Tanggal</th><th>Pelanggan</th><th>Status</th></tr>' + r.map(j => `<tr><td>${esc(j.tgl_jadwal)}</td><td>${esc(j.nama)}</td><td>${esc(j.status)}</td></tr>`).join(''); }),
  rem: wrap(async () => { if (me.role !== 'ADMIN') { $('#lRem').innerHTML = '<p class="card">Hanya ADMIN.</p>'; return; }
    const r = await api('getReminders', {});
    $('#lRem').innerHTML = r.map(x => `<div class="card"><b>${esc(x.nama)}</b> · jadwal ${esc(x.tgl_jadwal)} · <i>${esc(x.status)}</i><p>${esc(x.pesan)}</p><div class="rem">
      <button class="btn wa sm" data-a="wa" data-id="${esc(x.id)}" data-n="${esc(x.whatsapp)}" data-m="${esc(x.pesan)}">KIRIM WHATSAPP</button>
      <button class="btn lt sm" data-a="cp" data-m="${esc(x.pesan)}">SALIN PESAN</button>
      <button class="btn sm" data-a="ok" data-id="${esc(x.id)}">TANDAI SUDAH DIHUBUNGI</button></div></div>`).join('') || '<p class="card">Belum ada pengingat.</p>'; })
};
document.addEventListener('click', wrap(async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.t) show(b.dataset.t);
  if (b.dataset.del && confirm('Nonaktifkan pelanggan ini?')) { await api('deleteCustomer', { id: b.dataset.del }); toast('Dinonaktifkan'); LOAD.plg(); }
  if (b.dataset.a === 'wa') { window.open('https://wa.me/' + b.dataset.n + '?text=' + encodeURIComponent(b.dataset.m), '_blank'); await api('updateReminderStatus', { id: b.dataset.id, status: 'DIBUKA DI WHATSAPP' }); LOAD.rem(); }
  if (b.dataset.a === 'cp') { await navigator.clipboard.writeText(b.dataset.m); toast('Pesan disalin'); }
  if (b.dataset.a === 'ok') { await api('updateReminderStatus', { id: b.dataset.id, status: 'SUDAH DIKONFIRMASI ADMIN' }); toast('Tercatat'); LOAD.rem(); }
}));
$('#fPlg').onsubmit = wrap(async e => { e.preventDefault(); await api('saveCustomer', form(e.target)); e.target.reset(); toast('Pelanggan tersimpan'); LOAD.plg(); });
$('#fTrx').onsubmit = wrap(async e => { e.preventDefault(); const f = form(e.target); if (f.interval === 'custom') f.interval = $('#intCustom').value; await api('saveTransaction', f); e.target.reset(); toast('Transaksi & jadwal tersimpan'); LOAD.trx(); });
function addM(s, n) { const [y, m, d] = s.split('-').map(Number), last = new Date(y, m + n, 0).getDate(), t = new Date(y, m - 1 + n, Math.min(d, last)); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
function addD(s, n) { const [y, m, d] = s.split('-').map(Number), t = new Date(y, m - 1, d + n); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
$('#fTrx').oninput = () => { const f = form($('#fTrx')); $('#total').textContent = 'Total: ' + rp(Math.max(0, f.unit * f.harga - (f.diskon || 0)));
  const cu = f.interval === 'custom'; $('#intCustom').hidden = !cu; const n = Math.floor(Number(cu ? $('#intCustom').value : f.interval));
  $('#prev').textContent = (f.tanggal && n >= 1 && n <= 60) ? 'Jadwal berikutnya: ' + addM(f.tanggal, n) + ' · pengingat H-2: ' + addD(addM(f.tanggal, n), -2) : ''; };
$('#qPlg').oninput = () => LOAD.plg();
$('#btnCek').onclick = wrap(async () => { const r = await api('runReminderCheck'); toast('Pengingat baru: ' + r.dibuat); LOAD.rem(); });
$('#tgPw').onclick = () => { const i = $('#p'), h = i.type === 'password'; i.type = h ? 'text' : 'password'; $('#tgPw').textContent = h ? 'Sembunyi' : 'Lihat'; };
$('#fLogin').onsubmit = async e => {
  e.preventDefault(); const b = $('#btnLogin'), er = $('#lerr'); er.hidden = true; b.disabled = true; b.textContent = 'Memproses…';
  try { const r = await api('login', { username: $('#u').value.trim(), password: $('#p').value }); localStorage.setItem('acc_token', r.token); start(r.user); }
  catch (x) { er.textContent = /fetch|Failed|NetworkError|JSON/i.test(x.message) ? 'Tidak dapat terhubung ke server. Periksa API_URL di config.js dan deployment Apps Script.' : x.message; er.hidden = false; }
  finally { b.disabled = false; b.textContent = 'Masuk'; }
};
$('#btnOut').onclick = wrap(async () => { await api('logout'); localStorage.removeItem('acc_token'); location.reload(); });
function start(u) { me = u; $('#login').hidden = true; $('#app').hidden = false; $('#who').textContent = u.nama + ' (' + u.role + ')'; document.querySelectorAll('[data-t=rem],[data-t=lap]').forEach(b => b.hidden = u.role !== 'ADMIN'); show('dash'); }
if (localStorage.getItem('acc_token')) api('validateSession').then(start).catch(() => localStorage.removeItem('acc_token'));

/* ===== Tahap 2 ===== */
const tdy = () => new Date().toLocaleDateString('sv-SE');
let TX = [];
function payRender() {
  const s = $('#payS').value, a = $('#payA').value, b = $('#payB').value, q = $('#payQ').value.toLowerCase();
  const r = TX.filter(x => (!s || x.status_bayar === s) && (!a || x.tanggal >= a) && (!b || x.tanggal <= b) && (!q || x.nama.toLowerCase().includes(q)));
  const sum = f => r.filter(f).reduce((n, x) => n + Number(x.total), 0);
  $('#payTot').textContent = 'Pemasukan (lunas): ' + rp(sum(x => x.status_bayar === 'LUNAS')) + ' · Belum lunas: ' + rp(sum(x => x.status_bayar !== 'LUNAS'));
  $('#tPay').innerHTML = '<tr><th>Tanggal</th><th>Pelanggan</th><th>Total</th><th>Metode</th><th>Status</th><th></th></tr>' + r.map(x => `<tr><td>${esc(x.tanggal)}</td><td>${esc(x.nama)}</td><td>${rp(x.total)}</td><td>${esc(x.metode)}</td><td>${esc(x.status_bayar)}</td><td>${x.status_bayar !== 'LUNAS' ? `<button class="btn sm" data-lunas="${esc(x.id)}">Tandai lunas</button> ` : ''}<button class="btn lt sm" data-print="${esc(x.id)}">Cetak bukti</button></td></tr>`).join('');
}
LOAD.pay = wrap(async () => { TX = await api('getTransactions', {}); payRender(); });
$('#fPay').oninput = payRender;
function receipt(x) {
  const w = window.open('', '_blank'); if (!w) return toast('Izinkan pop-up untuk mencetak', 1);
  w.document.write('<title>Bukti ' + esc(x.id) + '</title><body style="font-family:sans-serif;max-width:360px;margin:auto"><h3>BUKTI TRANSAKSI</h3>' + [['No', x.id], ['Tanggal', x.tanggal], ['Pelanggan', x.nama], ['Unit AC', x.unit], ['Harga/unit', rp(x.harga)], ['Diskon', rp(x.diskon)], ['Total', rp(x.total)], ['Status', x.status_bayar], ['Metode', x.metode], ['Teknisi', x.teknisi]].map(r => '<p>' + esc(r[0]) + ': <b>' + esc(r[1]) + '</b></p>').join('') + '<script>print()<\/script>');
  w.document.close();
}
LOAD.lap = async () => { if (!$('#lapT').value) $('#lapT').value = tdy(); };
const lapQ = () => ({ jenis: $('#lapJ').value, tanggal: $('#lapT').value });
$('#btnLap').onclick = wrap(async () => {
  const r = await api('getReports', lapQ());
  const L = [['Periode', r.dari + ' s/d ' + r.sampai], ['Pendapatan (lunas)', rp(r.pendapatan)], ['Belum lunas', rp(r.tagihan)], ['Jumlah pencucian', r.jumlahPencucian], ['Unit AC', r.unit], ['Pelanggan aktif', r.pelangganAktif]];
  $('#lapOut').innerHTML = '<div class="stats card">' + L.map(x => `<div class="stat">${esc(x[0])}<b>${esc(x[1])}</b></div>`).join('') + '</div>' +
    '<div class="card"><b>Pelanggan yang belum mencuci kembali (jadwal terlewat)</b></div><div class="wrap"><table><tr><th>Pelanggan</th><th>WhatsApp</th><th>Jadwal</th></tr>' + r.belumMencuci.map(x => `<tr><td>${esc(x.nama)}</td><td>${esc(x.whatsapp)}</td><td>${esc(x.tgl_jadwal)}</td></tr>`).join('') + '</table></div>' +
    '<div class="wrap"><table><tr><th>Tanggal</th><th>Pelanggan</th><th>Unit</th><th>Total</th><th>Status</th></tr>' + r.rows.map(x => `<tr><td>${esc(x.tanggal)}</td><td>${esc(x.nama)}</td><td>${esc(x.unit)}</td><td>${rp(x.total)}</td><td>${esc(x.status_bayar)}</td></tr>`).join('') + '</table></div>';
});
$('#btnCsv').onclick = wrap(async () => {
  const r = await api('exportReport', lapQ()), a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + r.csv], { type: 'text/csv' })); a.download = r.nama; a.click(); URL.revokeObjectURL(a.href);
});
$('#btnPrint').onclick = () => window.print();
LOAD.jdw = wrap(async () => {
  const r = await api('getSchedules', {}), t = tdy();
  $('#tJdw').innerHTML = '<tr><th>Tanggal</th><th>Pelanggan</th><th>Status</th><th></th></tr>' + r.map(j => {
    const c = j.status === 'SELESAI' ? 'r-done' : j.tgl_jadwal < t ? 'r-late' : j.tgl_jadwal === t ? 'r-today' : j.tgl_jadwal <= addD(t, 2) ? 'r-h2' : '';
    return `<tr class="${c}"><td>${esc(j.tgl_jadwal)}</td><td>${esc(j.nama)}</td><td>${esc(j.status)}</td><td><a class="btn wa sm" target="_blank" rel="noopener" href="https://wa.me/${esc(j.whatsapp)}">WA</a> ${me.role === 'ADMIN' ? `<button class="btn sm" data-edt="${esc(j.id)}" data-d="${esc(j.tgl_jadwal)}">Ubah tanggal</button>` : ''}</td></tr>`;
  }).join('');
});
document.addEventListener('click', wrap(async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.lunas) { await api('updateTransaction', { id: b.dataset.lunas, status_bayar: 'LUNAS' }); toast('Ditandai lunas'); LOAD.pay(); }
  if (b.dataset.print) receipt(TX.filter(x => x.id === b.dataset.print)[0]);
  if (b.dataset.edt) { const v = prompt('Tanggal jadwal baru (YYYY-MM-DD)', b.dataset.d); if (v) { await api('updateSchedule', { id: b.dataset.edt, tgl_jadwal: v }); toast('Jadwal diperbarui'); LOAD.jdw(); } }
}));

/* ===== Tahap 3 ===== */
let CUST = [], JD = [], CAL = false;
LOAD.plg = wrap(async () => {
  CUST = await api('getCustomers', { q: $('#qPlg').value });
  $('#tPlg').innerHTML = '<tr><th>ID</th><th>Nama</th><th>WhatsApp</th><th>Alamat</th><th>Izin WA</th><th></th></tr>' + CUST.map(c => `<tr><td>${esc(c.id)}</td><td>${esc(c.nama)}</td><td>${esc(c.whatsapp)}</td><td>${esc(c.alamat)}</td><td>${c.persetujuan_wa === 'YA' ? 'Ya' : 'Tidak'}</td><td><button class="btn sm" data-edc="${esc(c.id)}">Edit</button> <button class="btn lt sm" data-riw="${esc(c.id)}">Riwayat</button> ${me.role === 'ADMIN' ? `<button class="btn sm" data-del="${esc(c.id)}">Nonaktifkan</button>` : ''}</td></tr>`).join('');
});
$('#fPlg').onsubmit = wrap(async e => {
  e.preventDefault(); const f = form(e.target);
  await api(f.id ? 'updateCustomer' : 'saveCustomer', f); e.target.reset(); toast('Pelanggan tersimpan'); LOAD.plg();
});
function renderJdw() {
  const q = $('#jQ').value.toLowerCase(), st = $('#jS').value, m = $('#jM').value, t = tdy();
  const r = JD.filter(j => (!q || (j.nama || '').toLowerCase().includes(q)) && (!st || j.status === st) && (!CAL && m ? j.tgl_jadwal.startsWith(m) : true));
  const cls = j => j.status === 'SELESAI' ? 'r-done' : j.tgl_jadwal < t ? 'r-late' : j.tgl_jadwal === t ? 'r-today' : j.tgl_jadwal <= addD(t, 2) ? 'r-h2' : '';
  $('#tJdw').parentElement.hidden = CAL; $('#cal').hidden = !CAL; $('#jMode').textContent = CAL ? 'Tampilan tabel' : 'Tampilan kalender';
  $('#tJdw').innerHTML = '<tr><th>Tanggal</th><th>Pelanggan</th><th>Status</th><th></th></tr>' + r.map(j => `<tr class="${cls(j)}"><td>${esc(j.tgl_jadwal)}</td><td>${esc(j.nama)}</td><td>${esc(j.status)}</td><td><a class="btn wa sm" target="_blank" rel="noopener" href="https://wa.me/${esc(j.whatsapp)}">WA</a> ${me.role === 'ADMIN' ? `<button class="btn sm" data-edt="${esc(j.id)}" data-d="${esc(j.tgl_jadwal)}">Ubah tanggal</button>` : ''}</td></tr>`).join('');
  if (CAL) {
    const mm = m || t.slice(0, 7), [y, mo] = mm.split('-').map(Number), first = new Date(y, mo - 1, 1).getDay(), n = new Date(y, mo, 0).getDate();
    let h = '<div class="cal">' + ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => `<b>${d}</b>`).join('') + '<i></i>'.repeat(first);
    for (let d = 1; d <= n; d++) { const ds = mm + '-' + String(d).padStart(2, '0'); h += `<div class="day ${ds === t ? 'today' : ''}"><span>${d}</span>${r.filter(j => j.tgl_jadwal === ds).map(j => `<em class="${cls(j)}">${esc(j.nama)}</em>`).join('')}</div>`; }
    $('#cal').innerHTML = h + '</div>';
  }
}
LOAD.jdw = wrap(async () => { JD = await api('getSchedules', {}); renderJdw(); });
$('#fJ').oninput = renderJdw;
$('#jMode').onclick = () => { CAL = !CAL; if (CAL && !$('#jM').value) $('#jM').value = tdy().slice(0, 7); renderJdw(); };
LOAD.set = wrap(async () => {
  $('#adm').hidden = me.role !== 'ADMIN'; if (me.role !== 'ADMIN') return;
  const [s, us] = await Promise.all([api('getSettings'), api('getUsers')]), f = $('#fSet');
  ['nama_usaha', 'interval_default', 'template_pesan', 'wa_api_aktif', 'wa_template', 'wa_lang'].forEach(k => f.elements[k].value = s[k] || (k === 'wa_api_aktif' ? 'TIDAK' : ''));
  $('#waInfo').textContent = s.wa_kredensial ? 'Kredensial WhatsApp API terdeteksi.' : 'Kredensial WA_TOKEN dan WA_PHONE_ID diisi di Script Properties Apps Script (bukan di sini).';
  $('#tUsr').innerHTML = '<tr><th>Username</th><th>Nama</th><th>Role</th><th>Aktif</th><th></th></tr>' + us.map(x => `<tr><td>${esc(x.username)}</td><td>${esc(x.nama)}</td><td>${esc(x.role)}</td><td>${esc(x.aktif)}</td><td><button class="btn sm" data-ut="${esc(x.id)}" data-ak="${esc(x.aktif)}">${x.aktif === 'YA' ? 'Nonaktifkan' : 'Aktifkan'}</button> <button class="btn lt sm" data-upw="${esc(x.id)}">Reset password</button></td></tr>`).join('');
});
$('#fSet').onsubmit = wrap(async e => { e.preventDefault(); await api('saveSettings', form(e.target)); toast('Pengaturan tersimpan'); });
$('#fUsr').onsubmit = wrap(async e => { e.preventDefault(); await api('saveUser', form(e.target)); e.target.reset(); toast('Akun ditambahkan'); LOAD.set(); });
$('#fPw').onsubmit = wrap(async e => { e.preventDefault(); await api('changePassword', form(e.target)); e.target.reset(); toast('Password diganti'); });
document.addEventListener('click', wrap(async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.edc) { const c = CUST.filter(x => x.id === b.dataset.edc)[0], f = $('#fPlg'); ['id', 'nama', 'whatsapp', 'alamat', 'catatan'].forEach(k => f.elements[k].value = c[k] || ''); f.elements.persetujuan_wa.checked = c.persetujuan_wa === 'YA'; f.scrollIntoView(); toast('Ubah data lalu tekan Simpan Pelanggan'); }
  if (b.dataset.riw) { const t = await api('getTransactions', { id_pelanggan: b.dataset.riw }); $('#riw').innerHTML = '<div class="card"><b>Riwayat pencucian</b></div><div class="wrap"><table><tr><th>Tanggal</th><th>Unit</th><th>Total</th><th>Status</th><th>Teknisi</th></tr>' + (t.map(x => `<tr><td>${esc(x.tanggal)}</td><td>${esc(x.unit)}</td><td>${rp(x.total)}</td><td>${esc(x.status_bayar)}</td><td>${esc(x.teknisi)}</td></tr>`).join('') || '<tr><td colspan="5">Belum ada transaksi</td></tr>') + '</table></div>'; $('#riw').scrollIntoView(); }
  if (b.dataset.ut) { await api('updateUser', { id: b.dataset.ut, aktif: b.dataset.ak === 'YA' ? 'TIDAK' : 'YA' }); LOAD.set(); }
  if (b.dataset.upw) { const v = prompt('Password baru (min 8 karakter)'); if (v) { await api('updateUser', { id: b.dataset.upw, password: v }); toast('Password diganti'); } }
}));
