import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  doc, deleteDoc, updateDoc, query, orderBy,
  getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBC0X3taGcEclIO8g7Lg7odIdTwaA6gnGY",
  authDomain: "wakuda-tools.firebaseapp.com",
  projectId: "wakuda-tools",
  storageBucket: "wakuda-tools.firebasestorage.app",
  messagingSenderId: "812175144918",
  appId: "1:812175144918:web:e93ea5bec2fcad8810d677"
};

const app      = initializeApp(firebaseConfig);
const db       = getFirestore(app);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

const DEFAULT_COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b'];

// ===== State =====
let currentUser  = null;
let payments     = [];
let payers       = [
  { name: '自分',       color: DEFAULT_COLORS[0] },
  { name: 'パートナー', color: DEFAULT_COLORS[1] },
];
let globalSplits = [
  { name: '自分',       numer: 50, denom: 100 },
  { name: 'パートナー', numer: 50, denom: 100 },
];
let moveInDate = '';
let itemOrder  = [];
let editingId  = null;
let unsub      = null;

// ===== DOM refs =====
const loginBtn        = document.getElementById('login-btn');
const logoutBtn       = document.getElementById('logout-btn');
const userInfo        = document.getElementById('user-info');
const userAvatar      = document.getElementById('user-avatar');
const userNameEl      = document.getElementById('user-name');
const loginScreen     = document.getElementById('login-screen');
const mainContent     = document.getElementById('main-content');
const loginBtnMain    = document.getElementById('login-btn-main');
const addForm         = document.getElementById('add-form');
const editForm        = document.getElementById('edit-form');
const editModal       = document.getElementById('edit-modal');
const modalClose      = document.getElementById('modal-close');
const modalCancel     = document.getElementById('modal-cancel');
const fFreq           = document.getElementById('f-freq');
const fFreqCustom     = document.getElementById('f-freq-custom');
const addCustomGroup  = document.getElementById('add-custom-freq-group');
const eFreq           = document.getElementById('e-freq');
const eFreqCustom     = document.getElementById('e-freq-custom');
const editCustomGroup = document.getElementById('edit-custom-freq-group');
const payersList      = document.getElementById('payers-list');
const addPayerBtn     = document.getElementById('add-payer-btn');

// ===== Auth =====
function login() {
  signInWithPopup(auth, provider).catch(err => {
    if (err.code !== 'auth/popup-closed-by-user') alert('ログインに失敗しました');
  });
}
loginBtn.addEventListener('click', login);
loginBtnMain.addEventListener('click', login);
logoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async user => {
  currentUser = user;
  if (user) {
    loginBtn.style.display    = 'none';
    userInfo.style.display    = 'flex';
    userAvatar.src            = user.photoURL || '';
    userNameEl.textContent    = user.displayName || user.email;
    loginScreen.style.display = 'none';
    mainContent.style.display = 'block';
    await loadSettings(user.uid);
    subscribePayments(user.uid);
  } else {
    loginBtn.style.display    = 'inline-flex';
    userInfo.style.display    = 'none';
    loginScreen.style.display = 'flex';
    mainContent.style.display = 'none';
    if (unsub) { unsub(); unsub = null; }
    payments = [];
    resetDefaults();
  }
});

function resetDefaults() {
  payers = [
    { name: '自分',       color: DEFAULT_COLORS[0] },
    { name: 'パートナー', color: DEFAULT_COLORS[1] },
  ];
  globalSplits = equalSplits();
}

// ===== Settings (payers + globalSplits) =====

function equalSplits() {
  const n = payers.length;
  const share = Math.round(100 / n);
  return payers.map((p, i) => ({
    name:  p.name,
    numer: i === n - 1 ? 100 - share * (n - 1) : share,
    denom: 100,
  }));
}

async function loadSettings(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const d = snap.data();
      if (Array.isArray(d.payers) && d.payers.length > 0) {
        payers = d.payers.map((p, i) =>
          typeof p === 'string' ? { name: p, color: DEFAULT_COLORS[i] || '#64748b' } : p
        );
      }
      if (Array.isArray(d.globalSplits) && d.globalSplits.length > 0) {
        globalSplits = d.globalSplits;
      } else {
        globalSplits = equalSplits();
      }
      moveInDate = d.moveInDate || '';
      itemOrder  = Array.isArray(d.itemOrder) ? d.itemOrder : [];
    }
  } catch { /* ルール未設定時はデフォルト */ }
  renderPayerSettings();
  renderGlobalSplits();
  renderMoveInSetting();
  renderDateShortcuts('f-next-date');
  renderDateShortcuts('e-next-date');
}

async function saveSettings() {
  try {
    await setDoc(doc(db, 'users', currentUser.uid), { payers, globalSplits, moveInDate, itemOrder }, { merge: true });
  } catch { alert('設定の保存に失敗しました。Firestoreのルールを確認してください。'); }
}

// ===== Payer settings =====
function renderPayerSettings() {
  payersList.innerHTML = payers.map((p, i) => `
    <div class="payer-item">
      <input type="color" class="payer-color-input" value="${p.color}" data-index="${i}" title="色を変更">
      <input type="text"  class="payer-name-input"  value="${esc(p.name)}" data-index="${i}" maxlength="20" placeholder="名前">
      ${payers.length > 1
        ? `<button type="button" class="payer-del-btn" data-index="${i}" title="削除">×</button>`
        : ''}
    </div>
  `).join('');

  payersList.querySelectorAll('.payer-color-input').forEach(input => {
    input.addEventListener('input',  () => {
      payers[parseInt(input.dataset.index)].color = input.value;
      renderGlobalSplits();
      render();
    });
    input.addEventListener('change', () => saveSettings());
  });

  payersList.querySelectorAll('.payer-name-input').forEach(input => {
    input.addEventListener('change', () => {
      const idx     = parseInt(input.dataset.index);
      const val     = input.value.trim();
      if (!val) { input.value = payers[idx].name; return; }
      const oldName = payers[idx].name;
      payers[idx].name = val;
      const gs = globalSplits.find(s => s.name === oldName);
      if (gs) gs.name = val;
      saveSettings();
      renderGlobalSplits();
      render();
    });
  });

  payersList.querySelectorAll('.payer-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      payers.splice(parseInt(btn.dataset.index), 1);
      globalSplits = equalSplits();
      saveSettings();
      renderPayerSettings();
      renderGlobalSplits();
      render();
    });
  });

  addPayerBtn.style.display = payers.length >= 4 ? 'none' : 'inline-flex';
  updatePayerOverrideSelects();
}

function updatePayerOverrideSelects() {
  const show = payers.length >= 2;
  [
    { grp: 'add-payer-override-group', sel: 'f-payer-override' },
    { grp: 'edit-payer-override-group', sel: 'e-payer-override' },
  ].forEach(({ grp, sel }) => {
    const grpEl = document.getElementById(grp);
    const selEl = document.getElementById(sel);
    if (!grpEl || !selEl) return;
    grpEl.style.display = show ? '' : 'none';
    const cur = selEl.value;
    selEl.innerHTML = '<option value="">両方（設定通り）</option>' +
      payers.map(p => `<option value="${esc(p.name)}">${esc(p.name)}のみ</option>`).join('');
    if (cur && payers.find(p => p.name === cur)) selEl.value = cur;
  });
}

addPayerBtn.addEventListener('click', () => {
  if (payers.length >= 4) return;
  payers.push({ name: `メンバー${payers.length + 1}`, color: DEFAULT_COLORS[payers.length] || '#64748b' });
  globalSplits = equalSplits();
  saveSettings();
  renderPayerSettings();
  renderGlobalSplits();
  render();
});

// ===== Global split UI =====
function renderGlobalSplits() {
  const container = document.getElementById('global-split-container');
  if (!container) return;

  if (payers.length <= 1) { container.innerHTML = ''; return; }

  const getPct = name => {
    const s = globalSplits.find(s => s.name === name);
    return s ? Math.round(s.numer / s.denom * 100) : Math.round(100 / payers.length);
  };

  container.innerHTML = `
    <div class="gs-section">
      <div class="gs-title">全体の分担割合</div>
      <div class="split-presets">
        <button type="button" class="split-preset" id="gs-equal">均等</button>
        ${payers.map(p => `
          <button type="button" class="split-preset gs-sole" data-payer="${esc(p.name)}">
            <span class="preset-dot" style="background:${p.color}"></span>${esc(p.name)}のみ
          </button>
        `).join('')}
      </div>
      <div class="split-rows">
        ${payers.map(p => `
          <div class="split-row">
            <span class="split-color-dot" style="background:${p.color}"></span>
            <span class="split-name">${esc(p.name)}</span>
            <input type="number" class="split-input gs-input" data-payer="${esc(p.name)}"
              min="0" max="100" step="1" value="${getPct(p.name)}">
            <span class="split-unit">%</span>
          </div>
        `).join('')}
      </div>
      <div class="split-footer">
        <span class="split-total-line">
          合計: <span class="gs-total-num">0</span>%
          <span class="gs-valid-icon"></span>
        </span>
      </div>
    </div>
  `;

  container.querySelector('#gs-equal').addEventListener('click', () => {
    const inputs = container.querySelectorAll('.gs-input');
    const n = inputs.length, share = Math.round(100 / n);
    inputs.forEach((inp, i) => { inp.value = i === n - 1 ? 100 - share * (n - 1) : share; });
    gsRefresh(container);
    commitGlobalSplits(container);
  });

  container.querySelectorAll('.gs-sole').forEach(btn => {
    btn.addEventListener('click', () => {
      const sole = btn.dataset.payer;
      container.querySelectorAll('.gs-input').forEach(inp => {
        inp.value = inp.dataset.payer === sole ? 100 : 0;
      });
      gsRefresh(container);
      commitGlobalSplits(container);
    });
  });

  container.querySelectorAll('.gs-input').forEach(inp => {
    inp.addEventListener('input', () => {
      if (payers.length === 2) {
        const other = Array.from(container.querySelectorAll('.gs-input')).find(i => i !== inp);
        if (other) other.value = Math.max(0, 100 - (parseFloat(inp.value) || 0));
      }
      gsRefresh(container);
    });
    inp.addEventListener('change', () => commitGlobalSplits(container));
  });

  gsRefresh(container);
}

function gsRefresh(container) {
  const inputs = container.querySelectorAll('.gs-input');
  const sum    = Array.from(inputs).reduce((s, i) => s + (parseFloat(i.value) || 0), 0);
  const numEl  = container.querySelector('.gs-total-num');
  const icon   = container.querySelector('.gs-valid-icon');
  if (numEl) numEl.textContent = Math.round(sum * 10) / 10;
  if (icon) {
    const ok = Math.abs(sum - 100) < 0.6;
    icon.textContent = ok ? '✓' : '✗';
    icon.className   = ok ? 'gs-valid-icon ok' : 'gs-valid-icon ng';
  }
}

function commitGlobalSplits(container) {
  const inputs = Array.from(container.querySelectorAll('.gs-input'));
  globalSplits = payers.map(p => {
    const inp = inputs.find(i => i.dataset.payer === p.name);
    return { name: p.name, numer: Math.round(parseFloat(inp?.value) || 0), denom: 100 };
  });
  if (globalSplits.length >= 2) {
    const sumOthers = globalSplits.slice(0, -1).reduce((s, x) => s + x.numer, 0);
    globalSplits[globalSplits.length - 1].numer = 100 - sumOthers;
  }
  saveSettings();
  render();
}

// ===== Split helpers =====
function computeShare(totalAmount, split) {
  if (split?.numer !== undefined && split.denom > 0) {
    return Math.round(totalAmount * split.numer / split.denom);
  }
  return Math.round(totalAmount * (split?.ratio || 0) / 100);
}

function splitPct(split) {
  if (split?.numer !== undefined && split.denom > 0) return Math.round(split.numer / split.denom * 100);
  return Math.round(split?.ratio || 0);
}

function payerColor(name) { return payers.find(p => p.name === name)?.color || '#64748b'; }

// ===== Firestore =====
function colRef(uid) { return collection(db, 'users', uid, 'payments'); }

function subscribePayments(uid) {
  if (unsub) unsub();
  const q = query(colRef(uid), orderBy('createdAt', 'asc'));
  unsub = onSnapshot(q, snap => {
    payments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  }, err => {
    if (err.code === 'permission-denied') alert('Firestoreのセキュリティルールを更新してください。');
  });
}

async function addPayment(data)        { await addDoc(colRef(currentUser.uid), { ...data, createdAt: Date.now() }); }
async function deletePayment(id)       { await deleteDoc(doc(db, 'users', currentUser.uid, 'payments', id)); }
async function updatePayment(id, data) { await updateDoc(doc(db, 'users', currentUser.uid, 'payments', id), data); }

// ===== Helpers =====
function effectiveNextDate(nextDateStr, freqMonths) {
  let d = new Date(nextDateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  while (d < now) d = new Date(d.getFullYear(), d.getMonth() + freqMonths, d.getDate());
  return d;
}

function isInNextMonth(date) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  return date >= start && date <= end;
}

function fmtDate(d) {
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}
function fmtYen(n)  { return '¥' + Math.round(n).toLocaleString('ja-JP'); }
function esc(str)   { return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function freqLabel(months) {
  const map = { 1:'毎月', 2:'2ヶ月ごと', 3:'3ヶ月ごと', 6:'半年ごと', 12:'年1回', 24:'2年ごと', 36:'3年ごと' };
  return map[months] ?? `${months}ヶ月ごと`;
}

const CAT_COLORS = {
  '賃貸':'#2563eb', 'インフラ':'#0891b2', 'サブスク':'#7c3aed', '保険':'#ea580c', 'その他':'#64748b'
};
const CAT_ORDER = ['賃貸', 'インフラ', 'サブスク', '保険', 'その他'];

// ===== Sorting & reordering =====
function catIndex(cat) {
  const i = CAT_ORDER.indexOf(cat);
  return i === -1 ? CAT_ORDER.length : i;
}

function sortedPayments() {
  return [...payments].sort((a, b) => {
    const cd = catIndex(a.category) - catIndex(b.category);
    if (cd !== 0) return cd;
    const ai = itemOrder.indexOf(a.id);
    const bi = itemOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return (a.createdAt || 0) - (b.createdAt || 0);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function reorderItem(draggedId, targetId, pos) {
  const sorted  = sortedPayments();
  const dragged = sorted.find(p => p.id === draggedId);
  const target  = sorted.find(p => p.id === targetId);
  if (!dragged || !target || dragged.category !== target.category) return;

  const cat      = dragged.category;
  const catItems = sorted.filter(p => p.category === cat);
  catItems.splice(catItems.findIndex(p => p.id === draggedId), 1);
  let tgtIdx = catItems.findIndex(p => p.id === targetId);
  if (pos === 'after') tgtIdx++;
  catItems.splice(tgtIdx, 0, dragged);

  const newOrder = [];
  CAT_ORDER.forEach(c => {
    (c === cat ? catItems : sorted.filter(p => p.category === c)).forEach(p => newOrder.push(p.id));
  });
  sorted.filter(p => !CAT_ORDER.includes(p.category)).forEach(p => newOrder.push(p.id));
  itemOrder = newOrder;
  saveSettings();
  render();
}

// ===== Move-in date =====
function renderMoveInSetting() {
  const container = document.getElementById('movein-container');
  if (!container) return;
  container.innerHTML = `
    <div class="movein-setting">
      <span class="movein-label">引越し日</span>
      <input type="date" id="movein-date-input" class="movein-date-input"${moveInDate ? ` value="${moveInDate}"` : ''}>
      <span class="movein-hint">日付入力のショートカットとして使います</span>
    </div>
  `;
  document.getElementById('movein-date-input').addEventListener('change', async e => {
    moveInDate = e.target.value;
    await saveSettings();
    renderDateShortcuts('f-next-date');
    renderDateShortcuts('e-next-date');
  });
}

function toDateInputVal(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function renderDateShortcuts(inputId) {
  const container = document.getElementById(inputId + '-shortcuts');
  if (!container) return;
  if (!moveInDate) { container.innerHTML = ''; return; }

  const base = new Date(moveInDate + 'T00:00:00');

  container.innerHTML = `
    <button type="button" class="date-shortcut" data-date="${toDateInputVal(base)}">引越し日</button>
    <div class="shortcut-year-wrap">
      <span class="shortcut-sep">＋</span>
      <input type="number" class="shortcut-year-input" min="0" max="30" value="0">
      <span class="shortcut-sep">年後</span>
      <button type="button" class="date-shortcut-apply">設定</button>
    </div>
  `;

  container.querySelector('[data-date]').addEventListener('click', e => {
    document.getElementById(inputId).value = e.currentTarget.dataset.date;
  });

  const yearInput = container.querySelector('.shortcut-year-input');
  container.querySelector('.date-shortcut-apply').addEventListener('click', () => {
    const d = new Date(base);
    d.setFullYear(d.getFullYear() + (parseInt(yearInput.value, 10) || 0));
    document.getElementById(inputId).value = toDateInputVal(d);
  });
}

// ===== Pie chart =====
function renderPieChart() {
  const catTotals = {};
  payments.forEach(p => {
    const cat = p.category || 'その他';
    catTotals[cat] = (catTotals[cat] || 0) + p.amount / (p.frequencyMonths || 1);
  });

  const total = Object.values(catTotals).reduce((a, b) => a + b, 0);
  const chartCard = document.getElementById('chart-card');
  if (total === 0) { chartCard.style.display = 'none'; return; }
  chartCard.style.display = '';

  const cx = 100, cy = 100, R = 82, r = 52;
  let angle = -Math.PI / 2;

  const slices = Object.entries(catTotals)
    .filter(([, amt]) => amt > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => {
      const fraction = amt / total;
      const start = angle;
      angle += fraction * 2 * Math.PI;
      return { cat, amt, fraction, start, end: angle };
    });

  const svgEl = document.getElementById('pie-chart');
  svgEl.innerHTML = slices.map(s => {
    const color = CAT_COLORS[s.cat] || '#64748b';
    if (s.fraction >= 0.9999) {
      return `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="${color}" stroke-width="${R - r}"/>`;
    }
    const x1 = cx + R * Math.cos(s.start), y1 = cy + R * Math.sin(s.start);
    const x2 = cx + R * Math.cos(s.end),   y2 = cy + R * Math.sin(s.end);
    const x3 = cx + r * Math.cos(s.end),   y3 = cy + r * Math.sin(s.end);
    const x4 = cx + r * Math.cos(s.start), y4 = cy + r * Math.sin(s.start);
    const large = s.fraction > 0.5 ? 1 : 0;
    return `<path d="M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large},0 ${x4},${y4} Z" fill="${color}" stroke="#f5f7fa" stroke-width="2"/>`;
  }).join('');

  document.getElementById('chart-legend').innerHTML = slices.map(s => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${CAT_COLORS[s.cat] || '#64748b'}"></span>
      <span class="legend-cat">${esc(s.cat)}</span>
      <span class="legend-pct">${Math.round(s.fraction * 100)}%</span>
      <span class="legend-amt">${fmtYen(s.amt)}/月</span>
    </div>
  `).join('');
}

// ===== Render =====
function render() {
  const now        = new Date();
  const nextM      = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMLabel = `${nextM.getFullYear()}年${nextM.getMonth() + 1}月`;

  let totalMonthly = 0, totalNextMonth = 0;
  const nextItems  = [];
  const perPayer   = {};
  payers.forEach(p => { perPayer[p.name] = { monthly: 0, nextMonth: 0, color: p.color }; });

  payments.forEach(p => {
    const freq    = p.frequencyMonths || 1;
    totalMonthly += p.amount / freq;

    const eff     = effectiveNextDate(p.nextPaymentDate, freq);
    const dueNext = isInNextMonth(eff);
    if (dueNext) { totalNextMonth += p.amount; nextItems.push({ ...p, eff }); }

    if (p.payerOverride && perPayer[p.payerOverride]) {
      perPayer[p.payerOverride].monthly += p.amount / freq;
      if (dueNext) perPayer[p.payerOverride].nextMonth += p.amount;
    } else {
      globalSplits.forEach(s => {
        if (!perPayer[s.name]) return;
        perPayer[s.name].monthly += computeShare(p.amount, s) / freq;
        if (dueNext) perPayer[s.name].nextMonth += computeShare(p.amount, s);
      });
    }
  });

  // サマリー
  document.getElementById('monthly-total').textContent    = fmtYen(totalMonthly);
  document.getElementById('next-month-total').textContent = fmtYen(totalNextMonth);
  document.getElementById('next-month-label').textContent = nextMLabel;
  document.getElementById('next-month-badge').textContent = nextMLabel;

  // 内訳テーブル
  const bdCard = document.getElementById('breakdown-card');
  if (payers.length > 1) {
    bdCard.style.display = '';
    document.getElementById('breakdown-body').innerHTML = payers.map(p => `
      <tr>
        <td class="bd-name"><span class="payer-dot" style="background:${p.color}"></span>${esc(p.name)}</td>
        <td class="bd-val">${fmtYen(perPayer[p.name]?.monthly   ?? 0)}</td>
        <td class="bd-val">${fmtYen(perPayer[p.name]?.nextMonth ?? 0)}</td>
      </tr>
    `).join('');
  } else {
    bdCard.style.display = 'none';
  }

  // 来月リスト
  const nml = document.getElementById('next-month-list');
  if (nextItems.length === 0) {
    nml.innerHTML = '<p class="empty-msg">来月の支払い予定はありません</p>';
  } else {
    nml.innerHTML = nextItems.map(p => {
      const splitHint = payers.length > 1
        ? p.payerOverride
          ? `<span class="split-chip">
               <span class="chip-dot" style="background:${payerColor(p.payerOverride)}"></span>
               ${esc(p.payerOverride)}が支払い
             </span>`
          : globalSplits.filter(s => splitPct(s) > 0).map(s =>
              `<span class="split-chip">
                 <span class="chip-dot" style="background:${payerColor(s.name)}"></span>
                 ${esc(s.name)} ${fmtYen(computeShare(p.amount, s))}
               </span>`
            ).join('')
        : '';
      return `
        <div class="next-item" style="border-left: 4px solid ${CAT_COLORS[p.category]||'#64748b'}">
          <span class="cat-badge" style="background:${CAT_COLORS[p.category]||'#64748b'}">${esc(p.category)}</span>
          <div class="next-item-body">
            <span class="next-item-name">${esc(p.name)}</span>
            ${splitHint ? `<span class="next-item-split">${splitHint}</span>` : ''}
          </div>
          <span class="next-item-amount">${fmtYen(p.amount)}</span>
          <span class="next-item-date">${fmtDate(p.eff)}</span>
        </div>
      `;
    }).join('');
  }

  // 円グラフ
  renderPieChart();

  // 件数
  document.getElementById('item-count').textContent = payments.length ? `${payments.length}件` : '';

  // 頻度別サマリー
  const freqSummaryEl = document.getElementById('freq-summary');
  if (freqSummaryEl) {
    const groups = {};
    payments.forEach(p => {
      const freq = p.frequencyMonths || 1;
      if (!groups[freq]) groups[freq] = { count: 0, monthly: 0 };
      groups[freq].count++;
      groups[freq].monthly += p.amount / freq;
    });
    freqSummaryEl.innerHTML = Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([freq, g]) => `
        <div class="freq-chip">
          <span class="freq-chip-label">${freqLabel(Number(freq))}</span>
          <span class="freq-chip-count">${g.count}件</span>
          <span class="freq-chip-amount">${fmtYen(g.monthly)}/月</span>
        </div>
      `).join('');
  }

  // 全項目リスト
  const list = document.getElementById('payments-list');
  if (payments.length === 0) {
    list.innerHTML = '<p class="empty-msg">まだ項目がありません。上のフォームから追加してください。</p>';
    return;
  }

  const sorted = sortedPayments();
  const byCategory = {};
  CAT_ORDER.forEach(c => { byCategory[c] = []; });
  sorted.forEach(p => {
    const cat = CAT_ORDER.includes(p.category) ? p.category : 'その他';
    byCategory[cat].push(p);
  });

  let html = '';
  CAT_ORDER.forEach(cat => {
    const items = byCategory[cat];
    if (items.length === 0) return;
    html += `<div class="cat-group-header">
      <span class="cat-group-dot" style="background:${CAT_COLORS[cat]||'#64748b'}"></span>
      <span class="cat-group-name">${cat}</span>
      <span class="cat-group-count">${items.length}件</span>
    </div>`;
    html += items.map(p => {
      const freq    = p.frequencyMonths || 1;
      const eff     = effectiveNextDate(p.nextPaymentDate, freq);
      const dueNext = isInNextMonth(eff);
      const splitText = payers.length > 1
        ? p.payerOverride
          ? `<span class="split-chip">
               <span class="chip-dot" style="background:${payerColor(p.payerOverride)}"></span>
               ${esc(p.payerOverride)}のみ (${fmtYen(p.amount / freq)}/月)
             </span>`
          : globalSplits.filter(s => splitPct(s) > 0).map(s => {
              const pct        = splitPct(s);
              const monthlyAmt = Math.round(computeShare(p.amount, s) / freq);
              return `<span class="split-chip">
                <span class="chip-dot" style="background:${payerColor(s.name)}"></span>
                ${esc(s.name)} ${pct}% (${fmtYen(monthlyAmt)}/月)
              </span>`;
            }).join('')
        : '';
      return `
        <div class="payment-item ${dueNext ? 'due-next' : ''}"
             style="border-left:4px solid ${CAT_COLORS[p.category]||'#64748b'}"
             draggable="true" data-id="${p.id}" data-category="${esc(p.category)}">
          <div class="payment-item-top">
            <span class="drag-handle" title="ドラッグして並び替え">⠿</span>
            <span class="payment-name">${esc(p.name)}${dueNext ? '<span class="due-badge">来月</span>' : ''}</span>
            <div class="payment-actions">
              <button class="edit-btn" data-id="${p.id}">編集</button>
              <button class="del-btn"  data-id="${p.id}">削除</button>
            </div>
          </div>
          <div class="payment-item-detail">
            <span><span class="detail-label">金額</span>${fmtYen(p.amount)}</span>
            <span><span class="detail-label">頻度</span>${freqLabel(freq)}</span>
            <span><span class="detail-label">月額換算</span>${fmtYen(p.amount / freq)}</span>
            <span><span class="detail-label">次回</span>${fmtDate(eff)}</span>
            ${splitText ? `<span class="split-detail-text"><span class="detail-label">分担</span>${splitText}</span>` : ''}
            ${p.note ? `<span><span class="detail-label">メモ</span>${esc(p.note)}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  });

  list.innerHTML = html;

  list.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.id)));
  list.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = payments.find(p => p.id === btn.dataset.id)?.name;
      if (confirm(`「${name}」を削除しますか？`)) deletePayment(btn.dataset.id);
    });
  });
}

// ===== Drag & drop =====
let dragId = null, dragCategory = null;

function clearDragIndicators() {
  document.querySelectorAll('.drag-over-before, .drag-over-after, .payment-item.dragging')
    .forEach(el => el.classList.remove('drag-over-before', 'drag-over-after', 'dragging'));
}

function setupDragDrop() {
  const list = document.getElementById('payments-list');

  list.addEventListener('dragstart', e => {
    const item = e.target.closest('.payment-item[draggable]');
    if (!item) return;
    dragId = item.dataset.id;
    dragCategory = item.dataset.category;
    setTimeout(() => item.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
  });

  list.addEventListener('dragover', e => {
    e.preventDefault();
    const item = e.target.closest('.payment-item[draggable]');
    if (!item || item.dataset.id === dragId || item.dataset.category !== dragCategory) return;
    clearDragIndicators();
    const rect = item.getBoundingClientRect();
    const pos  = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    item.classList.add(pos === 'before' ? 'drag-over-before' : 'drag-over-after');
    item.dataset.dragPos = pos;
  });

  list.addEventListener('dragleave', e => {
    const item = e.target.closest('.payment-item[draggable]');
    if (item && !item.contains(e.relatedTarget))
      item.classList.remove('drag-over-before', 'drag-over-after');
  });

  list.addEventListener('drop', e => {
    e.preventDefault();
    const item = e.target.closest('.payment-item[draggable]');
    if (!item || !dragId || item.dataset.id === dragId || item.dataset.category !== dragCategory) {
      clearDragIndicators(); return;
    }
    reorderItem(dragId, item.dataset.id, item.dataset.dragPos || 'before');
    clearDragIndicators();
  });

  list.addEventListener('dragend', () => { clearDragIndicators(); dragId = null; dragCategory = null; });
}

setupDragDrop();

// ===== Frequency select =====
function setupFreqToggle(sel, grp) {
  sel.addEventListener('change', () => { grp.style.display = sel.value === 'custom' ? 'block' : 'none'; });
}
setupFreqToggle(fFreq, addCustomGroup);
setupFreqToggle(eFreq, editCustomGroup);

function getFreqMonths(sel, inp) {
  return sel.value === 'custom' ? (parseInt(inp.value) || 1) : parseInt(sel.value);
}

// ===== Add form =====
addForm.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = addForm.querySelector('.add-btn');
  btn.disabled = true;
  try {
    await addPayment({
      name:            document.getElementById('f-name').value.trim(),
      amount:          parseFloat(document.getElementById('f-amount').value),
      frequencyMonths: getFreqMonths(fFreq, fFreqCustom),
      nextPaymentDate: document.getElementById('f-next-date').value,
      category:        document.getElementById('f-category').value,
      payerOverride:   document.getElementById('f-payer-override').value,
      note:            document.getElementById('f-note').value.trim(),
    });
    addForm.reset();
    fFreq.value = '1';
    addCustomGroup.style.display = 'none';
  } catch { alert('追加に失敗しました'); }
  btn.disabled = false;
});

// ===== Edit modal =====
function openEditModal(id) {
  const p = payments.find(x => x.id === id);
  if (!p) return;
  editingId = id;

  document.getElementById('e-name').value      = p.name;
  document.getElementById('e-amount').value    = p.amount;
  document.getElementById('e-next-date').value = p.nextPaymentDate;
  document.getElementById('e-category').value       = p.category || 'その他';
  document.getElementById('e-payer-override').value = p.payerOverride || '';
  document.getElementById('e-note').value           = p.note || '';

  const freq = p.frequencyMonths || 1;
  if ([1,2,3,6,12,24,36].includes(freq)) {
    eFreq.value = String(freq); editCustomGroup.style.display = 'none';
  } else {
    eFreq.value = 'custom'; eFreqCustom.value = freq; editCustomGroup.style.display = 'block';
  }

  editModal.style.display = 'flex';
}

function closeModal() { editModal.style.display = 'none'; editingId = null; }
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
editModal.addEventListener('click', e => { if (e.target === editModal) closeModal(); });

editForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!editingId) return;
  const btn = editForm.querySelector('.add-btn');
  btn.disabled = true;
  try {
    await updatePayment(editingId, {
      name:            document.getElementById('e-name').value.trim(),
      amount:          parseFloat(document.getElementById('e-amount').value),
      frequencyMonths: getFreqMonths(eFreq, eFreqCustom),
      nextPaymentDate: document.getElementById('e-next-date').value,
      category:        document.getElementById('e-category').value,
      payerOverride:   document.getElementById('e-payer-override').value,
      note:            document.getElementById('e-note').value.trim(),
    });
    closeModal();
  } catch { alert('保存に失敗しました'); }
  btn.disabled = false;
});
