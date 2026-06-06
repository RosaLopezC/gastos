/* ── CONFIG & CATEGORIES ─────────────────────────────── */
const CATS = [
  { name:'Alimentación', icon:'🍔', color:'#2d6a4f', bg:'#d8f3dc' },
  { name:'Transporte',   icon:'🚗', color:'#1565c0', bg:'#e3f2fd' },
  { name:'Vivienda',     icon:'🏠', color:'#6a1b9a', bg:'#f3e5f5' },
  { name:'Salud',        icon:'💊', color:'#c62828', bg:'#fce4ec' },
  { name:'Educación',    icon:'📚', color:'#00695c', bg:'#e0f2f1' },
  { name:'Entretenimiento', icon:'🎬', color:'#e65100', bg:'#fff3e0' },
  { name:'Ropa',         icon:'👕', color:'#ad1457', bg:'#fce4ec' },
  { name:'Servicios',    icon:'💡', color:'#1565c0', bg:'#e8f4f8' },
  { name:'Ahorro',       icon:'🏦', color:'#2e7d32', bg:'#e8f5e9' },
  { name:'Otros',        icon:'📦', color:'#5d4037', bg:'#efebe9' },
];

let gastos = JSON.parse(localStorage.getItem('gp_gastos') || '[]');
let config = JSON.parse(localStorage.getItem('gp_config') || '{"scriptUrl":"","budget":2000}');
let selectedMonth = new Date().toISOString().slice(0,7);
let selectedCat = 'Todos';
let selCatForm = CATS[0].name;
let charts = {};

/* ── INIT ─────────────────────────────────────────────── */
function init() {
  setTodayDate();
  buildCatGrid();
  buildFilterPills();
  populateMonthSelect();
  checkConfigNotice();
  renderDashboard();
  renderHistorial();
  if (config.scriptUrl) syncFromSheet();
}

function setTodayDate() {
  const d = new Date();
  document.getElementById('fDate').value = d.toISOString().slice(0,10);
}

/* ── MONTH SELECT ─────────────────────────────────────── */
function populateMonthSelect() {
  const months = [...new Set(gastos.map(g => g.date.slice(0,7)))];
  const cur = new Date().toISOString().slice(0,7);
  if (!months.includes(cur)) months.unshift(cur);
  months.sort().reverse();
  const sel = document.getElementById('monthSelect');
  sel.innerHTML = months.map(m => `<option value="${m}" ${m===selectedMonth?'selected':''}>${fmtMonth(m)}</option>`).join('');
}

function onMonthChange(val) {
  selectedMonth = val;
  renderDashboard();
  renderHistorial();
}

/* ── CATEGORY GRID (form) ─────────────────────────────── */
function buildCatGrid() {
  const grid = document.getElementById('catGrid');
  grid.innerHTML = CATS.map((c,i) => `
    <button class="cat-btn ${i===0?'selected':''}"
      data-cat="${c.name}"
      style="${i===0?`border-color:${c.color};background:${c.bg}`:''}"
      onclick="selectCat(this,'${c.name}','${c.color}','${c.bg}')">
      <span class="cat-btn-icon">${c.icon}</span>
      <span class="cat-btn-name">${c.name}</span>
    </button>`).join('');
}

function selectCat(el, name, color, bg) {
  selCatForm = name;
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.remove('selected');
    b.style.borderColor = '';
    b.style.background = '';
  });
  el.classList.add('selected');
  el.style.borderColor = color;
  el.style.background = bg;
}

/* ── FILTER PILLS (historial) ─────────────────────────── */
function buildFilterPills() {
  const row = document.getElementById('filterCats');
  row.innerHTML = `<button class="filter-pill active" data-cat="Todos" onclick="setFilterCat(this,'Todos')">Todos</button>` +
    CATS.map(c => `<button class="filter-pill" data-cat="${c.name}" onclick="setFilterCat(this,'${c.name}')">${c.icon} ${c.name}</button>`).join('');
}

function setFilterCat(el, cat) {
  selectedCat = cat;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  renderHistorial();
}

/* ── TYPE SELECT ──────────────────────────────────────── */
function selectType(el) {
  document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

/* ── SWITCH TAB ───────────────────────────────────────── */
function switchTab(el) {
  const page = el.dataset.page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab, .bnav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll(`[data-page="${page}"]`).forEach(b => b.classList.add('active'));
  if (page === 'dashboard') renderDashboard();
  if (page === 'historial') renderHistorial();
}

/* ── SAVE GASTO ───────────────────────────────────────── */
async function saveGasto() {
  const amount = parseFloat(document.getElementById('fAmount').value);
  const desc   = document.getElementById('fDesc').value.trim();
  const date   = document.getElementById('fDate').value;
  const method = document.getElementById('fMethod').value;
  const notes  = document.getElementById('fNotes').value.trim();
  const tipo   = document.querySelector('.type-pill.active').dataset.type;

  if (!amount || amount <= 0) return showStatus('Ingresa un monto válido.', 'err');
  if (!desc) return showStatus('Describe el gasto.', 'err');
  if (!date) return showStatus('Selecciona la fecha.', 'err');

  const g = {
    id: Date.now().toString(),
    date, amount, desc,
    category: selCatForm, tipo, method, notes
  };

  // Save locally first
  gastos.push(g);
  saveLocal();

  // Update UI
  showStatus('✓ Guardado localmente', 'ok');
  resetForm();
  populateMonthSelect();
  selectedMonth = date.slice(0,7);
  document.getElementById('monthSelect').value = selectedMonth;

  // Sync to Google Sheets if configured
  if (config.scriptUrl) {
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    document.getElementById('submitLabel').textContent = 'Sincronizando...';
    try {
      await sendToSheet(g);
      showStatus('✓ Guardado y sincronizado con Google Sheets ✓', 'ok');
    } catch(e) {
      showStatus('Guardado local. Sin conexión a Sheet.', 'err');
    }
    btn.disabled = false;
    document.getElementById('submitLabel').textContent = 'Guardar gasto';
  }

  renderDashboard();
  renderHistorial();
}

function resetForm() {
  document.getElementById('fAmount').value = '';
  document.getElementById('fDesc').value = '';
  document.getElementById('fNotes').value = '';
  setTodayDate();
  document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-type="Necesidad"]').classList.add('active');
  // Reset cat grid to first
  const first = document.querySelector('.cat-btn');
  if (first) selectCat(first, CATS[0].name, CATS[0].color, CATS[0].bg);
}

function showStatus(msg, type) {
  const el = document.getElementById('saveStatus');
  el.textContent = msg;
  el.className = 'save-status ' + type;
  setTimeout(() => { el.textContent = ''; el.className = 'save-status'; }, 4000);
}

/* ── DELETE ───────────────────────────────────────────── */
function deleteGasto(id) {
  if (!confirm('¿Eliminar este gasto?')) return;
  gastos = gastos.filter(g => g.id !== id);
  saveLocal();
  populateMonthSelect();
  renderDashboard();
  renderHistorial();
}

/* ── LOCAL STORAGE ────────────────────────────────────── */
function saveLocal() {
  localStorage.setItem('gp_gastos', JSON.stringify(gastos));
}

/* ── GOOGLE SHEETS SYNC ───────────────────────────────── */
async function sendToSheet(g) {
  const params = new URLSearchParams({
    action: 'add', id: g.id, date: g.date, desc: g.desc,
    category: g.category, amount: g.amount,
    tipo: g.tipo||'', method: g.method||'', notes: g.notes||''
  });
  const res = await fetch(`${config.scriptUrl}?${params}`);
  if (!res.ok) throw new Error('Sheet error');
  return res.json();
}

async function syncFromSheet() {
  try {
    const res = await fetch(`${config.scriptUrl}?action=get`);
    const data = await res.json();
    if (data.rows && data.rows.length) {
      // Merge: sheet is source of truth, keep local ones not yet in sheet
      const sheetIds = new Set(data.rows.map(r => r.id));
      const localOnly = gastos.filter(g => !sheetIds.has(g.id));
      gastos = [...data.rows, ...localOnly];
      saveLocal();
      populateMonthSelect();
      renderDashboard();
      renderHistorial();
    }
  } catch(e) {
    console.log('Sheet sync failed, using local data.');
  }
}

/* ── CONFIG ───────────────────────────────────────────── */
function openConfig() {
  document.getElementById('configModal').classList.add('open');
  document.getElementById('configUrl').value = config.scriptUrl || '';
  document.getElementById('configBudget').value = config.budget || 2000;
}
function closeConfig() { document.getElementById('configModal').classList.remove('open'); }
function closeConfigOutside(e) { if (e.target.id === 'configModal') closeConfig(); }

function saveConfig() {
  config.scriptUrl = document.getElementById('configUrl').value.trim();
  config.budget    = parseFloat(document.getElementById('configBudget').value) || 2000;
  localStorage.setItem('gp_config', JSON.stringify(config));
  closeConfig();
  checkConfigNotice();
  if (config.scriptUrl) syncFromSheet();
}

function checkConfigNotice() {
  const el = document.getElementById('configNotice');
  if (config.scriptUrl) el.classList.add('hidden');
  else el.classList.remove('hidden');
}

/* ── HELPERS ──────────────────────────────────────────── */
function catInfo(name) { return CATS.find(c => c.name === name) || CATS[CATS.length-1]; }
function fmt(n) {
  return 'S/ ' + parseFloat(n||0).toLocaleString('es-PE', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function fmtMonth(ym) {
  const [y,m] = ym.split('-');
  const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return names[parseInt(m)-1] + ' ' + y;
}
function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-PE', { day:'2-digit', month:'short' });
}
function gastosByMonth(ym) { return gastos.filter(g => g.date.startsWith(ym)); }

/* ── DASHBOARD ────────────────────────────────────────── */
function renderDashboard() {
  const data = gastosByMonth(selectedMonth);
  const total = data.reduce((s,g) => s+parseFloat(g.amount), 0);
  const budget = config.budget || 2000;
  const avail = budget - total;
  const pct = budget ? Math.min(total/budget, 1) : 0;

  // Hero
  document.getElementById('heroMonth').textContent = fmtMonth(selectedMonth);
  document.getElementById('heroAmount').textContent = fmt(total);
  document.getElementById('metaPresup').textContent = 'Presupuesto ' + fmt(budget);
  document.getElementById('metaDisp').textContent = (avail >= 0 ? 'Disponible ' : 'Excedido ') + fmt(Math.abs(avail));
  const dot = document.getElementById('metaDot');
  dot.style.background = avail >= 0 ? '#b7e4c7' : '#ffb3b3';
  document.getElementById('heroBar').style.width = (pct*100).toFixed(1) + '%';
  document.getElementById('heroBar').style.background = pct > .9 ? '#ffb3b3' : '#fff';

  // KPIs
  document.getElementById('kpiTx').textContent = data.length;
  document.getElementById('kpiDaily').textContent = fmt(total/30);
  const catTotals = {};
  CATS.forEach(c => catTotals[c.name] = 0);
  data.forEach(g => { if (catTotals[g.category] !== undefined) catTotals[g.category] += parseFloat(g.amount); });
  const topCat = Object.entries(catTotals).sort((a,b) => b[1]-a[1])[0];
  document.getElementById('kpiTopCat').textContent = topCat && topCat[1] > 0 ? topCat[0] : '—';
  const savingData = gastosByMonth(selectedMonth).filter(g => g.category === 'Ahorro');
  const savingAmt = savingData.reduce((s,g) => s+parseFloat(g.amount), 0);
  document.getElementById('kpiSaving').textContent = budget ? Math.round(savingAmt/budget*100)+'%' : '0%';

  // Month total label
  document.getElementById('monthTotal').textContent = fmtMonth(selectedMonth);

  // Category breakdown
  const cbEl = document.getElementById('catBreakdown');
  const catsWithData = CATS.map(c => ({ ...c, total: catTotals[c.name], count: data.filter(g=>g.category===c.name).length }))
    .filter(c => c.total > 0).sort((a,b) => b.total-a.total);
  if (!catsWithData.length) {
    cbEl.innerHTML = '<div style="color:var(--text3);font-size:14px;padding:16px 0">Sin gastos este mes.</div>';
  } else {
    const max = catsWithData[0].total;
    cbEl.innerHTML = catsWithData.map(c => `
      <div class="cb-item">
        <div class="cb-row">
          <div class="cb-left">
            <div class="cb-icon" style="background:${c.bg}">${c.icon}</div>
            <div><div class="cb-name">${c.name}</div><div class="cb-count">${c.count} transacción${c.count!==1?'es':''}</div></div>
          </div>
          <div class="cb-right">
            <div class="cb-amount" style="color:${c.color}">${fmt(c.total)}</div>
            <div class="cb-pct">${total?Math.round(c.total/total*100):0}% del total</div>
          </div>
        </div>
        <div class="cb-bar"><div class="cb-fill" style="width:${max?c.total/max*100:0}%;background:${c.color}"></div></div>
      </div>`).join('');
  }

  renderCharts(data, catTotals);

  // Recent (last 5)
  const recent = [...data].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
  document.getElementById('recentList').innerHTML = renderTxItems(recent, false);
}

/* ── CHARTS ───────────────────────────────────────────── */
function renderCharts(data, catTotals) {
  const catsWithData = CATS.filter(c => catTotals[c.name] > 0);

  // Donut
  if (charts.donut) charts.donut.destroy();
  if (catsWithData.length) {
    const ctx = document.getElementById('chartDonut').getContext('2d');
    charts.donut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: catsWithData.map(c => c.icon + ' ' + c.name),
        datasets: [{ data: catsWithData.map(c => catTotals[c.name]), backgroundColor: catsWithData.map(c => c.color), borderWidth: 0, hoverOffset: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        plugins: {
          legend: { position:'right', labels:{ color:'#6b6560', font:{family:'Plus Jakarta Sans',size:11}, boxWidth:10, padding:10 }},
          tooltip: { callbacks: { label: c => ' ' + fmt(c.raw) }}
        }
      }
    });
  }

  // Line (monthly trend)
  const allMonths = [...new Set(gastos.map(g => g.date.slice(0,7)))].sort().slice(-6);
  if (charts.line) charts.line.destroy();
  if (allMonths.length) {
    const ctx2 = document.getElementById('chartLine').getContext('2d');
    const totals = allMonths.map(m => gastosByMonth(m).reduce((s,g) => s+parseFloat(g.amount), 0));
    charts.line = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: allMonths.map(m => { const [y,mo]=m.split('-'); return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(mo)-1]; }),
        datasets: [{
          label: 'Gasto total',
          data: totals,
          borderColor: '#2d6a4f', backgroundColor: 'rgba(45,106,79,.1)',
          borderWidth: 2.5, pointBackgroundColor: '#2d6a4f', pointRadius: 5,
          tension: .4, fill: true
        }, {
          label: 'Presupuesto',
          data: allMonths.map(() => config.budget || 2000),
          borderColor: '#e9c46a', borderDash: [5,4], borderWidth: 1.5,
          backgroundColor: 'transparent', pointRadius: 0, tension: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color:'#6b6560', font:{family:'Plus Jakarta Sans',size:11}, boxWidth:10 }},
          tooltip: { callbacks: { label: c => ' ' + fmt(c.raw) }}
        },
        scales: {
          x: { ticks:{ color:'#a09990', font:{size:11} }, grid:{ color:'rgba(0,0,0,.05)' }},
          y: { ticks:{ color:'#a09990', font:{size:11}, callback: v => 'S/ '+v.toLocaleString() }, grid:{ color:'rgba(0,0,0,.05)' }}
        }
      }
    });
  }
}

/* ── HISTORIAL ────────────────────────────────────────── */
function renderHistorial() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  let data = gastosByMonth(selectedMonth)
    .filter(g => selectedCat === 'Todos' || g.category === selectedCat)
    .filter(g => !search || g.desc.toLowerCase().includes(search) || g.category.toLowerCase().includes(search))
    .sort((a,b) => b.date.localeCompare(a.date));

  const listEl = document.getElementById('histList');
  const emptyEl = document.getElementById('histEmpty');

  if (!data.length) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  // Group by date
  const byDate = {};
  data.forEach(g => { if (!byDate[g.date]) byDate[g.date] = []; byDate[g.date].push(g); });
  listEl.innerHTML = Object.entries(byDate).map(([date, items]) => `
    <div class="date-group-label">${new Date(date+'T12:00:00').toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'})}</div>
    ${renderTxItems(items, true)}`).join('');
}

function renderTxItems(items, showDel) {
  return items.map(g => {
    const ci = catInfo(g.category);
    const tipoColor = g.tipo==='Inversión'?'#2e7d32':g.tipo==='Necesidad'?'#c62828':'#e65100';
    const tipoBg   = g.tipo==='Inversión'?'#e8f5e9':g.tipo==='Necesidad'?'#fce4ec':'#fff3e0';
    return `
    <div class="tx-item">
      <div class="tx-icon" style="background:${ci.bg}">${ci.icon}</div>
      <div class="tx-body">
        <div class="tx-desc">${g.desc}</div>
        <div class="tx-meta">
          <span class="tx-tag" style="background:${ci.bg};color:${ci.color}">${ci.name}</span>
          <span class="tx-tag" style="background:${tipoBg};color:${tipoColor}">${g.tipo}</span>
          ${g.method ? `<span style="color:var(--text3)">${g.method}</span>` : ''}
          ${g.notes  ? `<span style="color:var(--text3)">· ${g.notes}</span>` : ''}
        </div>
      </div>
      <div class="tx-right">
        <div class="tx-amount" style="color:${ci.color}">${fmt(g.amount)}</div>
        <div class="tx-date">${fmtDate(g.date)}</div>
      </div>
      ${showDel ? `<button class="tx-del" onclick="deleteGasto('${g.id}')" title="Eliminar">✕</button>` : ''}
    </div>`;
  }).join('');
}


init();