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
let moveInDate    = '';
let itemOrder     = [];
let editingId     = null;
let unsub         = null;
let selectedPayer = null;
let paidModalData        = null;
let breakdownMonthOffset = 0; // 0=今月, -1=先月, +1=来月
let forecastOffset       = 0; // 0=来月スタート、負=過去方向にシフト
let currentView          = 'next'; // 'next'=来月必要なお金, 'avg'=毎月の平均

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
const editCustomGroup  = document.getElementById('edit-custom-freq-group');
const addAmortizeGroup  = document.getElementById('add-amortize-group');
const fAmortizeMonths   = document.getElementById('f-amortize-months');
const editAmortizeGroup = document.getElementById('edit-amortize-group');
const eAmortizeMonths   = document.getElementById('e-amortize-months');
const payersList      = document.getElementById('payers-list');
const addPayerBtn     = document.getElementById('add-payer-btn');
const fChangeYear     = document.getElementById('f-change-year');
const fChangeAmount   = document.getElementById('f-change-amount');
const eChangeYear     = document.getElementById('e-change-year');
const eChangeAmount   = document.getElementById('e-change-amount');

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
  globalSplits  = equalSplits();
  selectedPayer = null;
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
      const idx = parseInt(btn.dataset.index);
      if (selectedPayer === payers[idx].name) selectedPayer = null;
      payers.splice(idx, 1);
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

function renderPayerFilter() {
  const el = document.getElementById('payer-filter');
  if (!el) return;
  if (payers.length <= 1) {
    el.style.display = 'none';
    selectedPayer = null;
    return;
  }
  el.style.display = 'flex';
  el.innerHTML = [
    `<button class="pf-btn${!selectedPayer ? ' pf-active pf-all' : ''}" data-payer="">全員</button>`,
    ...payers.map(p => {
      const active = selectedPayer === p.name;
      return `<button class="pf-btn${active ? ' pf-active' : ''}" data-payer="${esc(p.name)}"
                      style="${active ? `background:${p.color};border-color:${p.color};` : ''}">
                <span class="pf-dot" style="background:${p.color}"></span>${esc(p.name)}
              </button>`;
    }),
  ].join('');
  el.querySelectorAll('.pf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedPayer = btn.dataset.payer || null;
      render();
    });
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

async function markPaid(id, date, payerName, amount) {
  const p = payments.find(x => x.id === id);
  if (!p) return;
  const history = (p.paidHistory || []).filter(r => !(r.date === date && r.paidBy === payerName));
  history.push({ date, paidBy: payerName, amount: Math.round(amount) });
  await updatePayment(id, { paidHistory: history });
}

async function unmarkPaid(id, date, payerName) {
  const p = payments.find(x => x.id === id);
  if (!p) return;
  const history = (p.paidHistory || []).filter(r => !(r.date === date && r.paidBy === payerName));
  await updatePayment(id, { paidHistory: history });
}

// ===== Helpers =====
function effectiveNextDate(nextDateStr, freqMonths, startDate) {
  if (freqMonths === 0) return new Date(nextDateStr + 'T00:00:00');
  let d = new Date(nextDateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const threshold = startDate ? new Date(Math.max(now, new Date(startDate + 'T00:00:00'))) : now;
  while (d < threshold) d = new Date(d.getFullYear(), d.getMonth() + freqMonths, d.getDate());
  return d;
}

function fmtStartBadge(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth() + 1}月〜`;
}

function isInNextMonth(date) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  return date >= start && date <= end;
}

// 来月に支払いがある場合にその日付を返す（来月起点でループするため棒グラフと一致）
function occurrenceInNextMonth(nextDateStr, freqMonths, startDate) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const d0    = new Date(nextDateStr + 'T00:00:00');
  if (freqMonths === 0) return (d0 >= start && d0 <= end) ? d0 : null;
  let d = new Date(d0);
  if (startDate) {
    const sd = new Date(startDate + 'T00:00:00');
    while (d < sd) d = new Date(d.getFullYear(), d.getMonth() + freqMonths, d.getDate());
  }
  while (d < start) d = new Date(d.getFullYear(), d.getMonth() + freqMonths, d.getDate());
  return (d >= start && d <= end) ? d : null;
}

function fmtDate(d) {
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}
function fmtYen(n)  { return '¥' + Math.round(n).toLocaleString('ja-JP'); }
function esc(str)   { return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function freqLabel(months) {
  const map = { 0:'一回のみ', 1:'毎月', 2:'2ヶ月ごと', 3:'3ヶ月ごと', 6:'半年ごと', 12:'年1回', 24:'2年ごと', 36:'3年ごと' };
  return map[months] ?? `${months}ヶ月ごと`;
}

// 月額計算の除数：定期は freq、一回のみで月割ありは amortizeMonths、それ以外は 0（含めない）
function monthlyDiv(p) {
  const freq = p.frequencyMonths ?? 1;
  if (freq > 0) return freq;
  return (p.amortizeMonths > 0) ? p.amortizeMonths : 0;
}

function normalizedAmountChanges(p) {
  return (p.amountChanges || [])
    .map(c => ({
      startYear: parseInt(c.startYear, 10),
      amount: Number(c.amount),
    }))
    .filter(c => Number.isFinite(c.startYear) && c.startYear >= 2 && Number.isFinite(c.amount) && c.amount >= 0)
    .sort((a, b) => a.startYear - b.startYear);
}

function baseDateForAmount(p) {
  return new Date((p.startDate || p.nextPaymentDate) + 'T00:00:00');
}

function yearIndexForDate(p, date) {
  const base = baseDateForAmount(p);
  const d = new Date(date);
  let years = d.getFullYear() - base.getFullYear();
  const anniv = new Date(d.getFullYear(), base.getMonth(), base.getDate());
  if (d < anniv) years--;
  return Math.max(1, years + 1);
}

function amountForDate(p, date) {
  const yearIndex = yearIndexForDate(p, date);
  return normalizedAmountChanges(p).reduce(
    (amount, c) => yearIndex >= c.startYear ? c.amount : amount,
    Number(p.amount) || 0
  );
}

function effectiveNextPayableDate(p) {
  const freq = p.frequencyMonths ?? 1;
  let d = effectiveNextDate(p.nextPaymentDate, freq, p.startDate);
  if (freq === 0) return amountForDate(p, d) > 0 ? d : null;
  for (let i = 0; i < 600 && amountForDate(p, d) <= 0; i++) {
    d = new Date(d.getFullYear(), d.getMonth() + freq, d.getDate());
  }
  return amountForDate(p, d) > 0 ? d : null;
}

function amountForAverage(p) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (p.startDate) {
    const sd = new Date(p.startDate + 'T00:00:00');
    if (sd > now) return 0;
  }
  return amountForDate(p, now);
}

function amountChangeLabel(p) {
  return normalizedAmountChanges(p)
    .map(c => `${c.startYear}年目から${fmtYen(c.amount)}`)
    .join(' / ');
}

function readAmountChanges(yearInput, amountInput) {
  const rawYear = yearInput?.value.trim() || '';
  const rawAmount = amountInput?.value.trim() || '';
  if (!rawYear && !rawAmount) return [];
  const startYear = parseInt(rawYear, 10);
  const amount = Number(rawAmount);
  if (!Number.isFinite(startYear) || startYear < 2 || !Number.isFinite(amount) || amount < 0) {
    throw new Error('amount-change');
  }
  return [{ startYear, amount }];
}

const CAT_COLORS = {
  '賃貸':'#2563eb', 'インフラ':'#0891b2', 'サブスク':'#7c3aed', '保険':'#ea580c', 'その他':'#64748b'
};
const CAT_ORDER = ['賃貸', 'インフラ', 'サブスク', '保険', 'その他'];

// ===== Forecast chart =====
function fmtYenCompact(n) {
  if (n >= 10000) {
    const m = n / 10000;
    return `¥${Number.isInteger(m) ? m : m.toFixed(1)}万`;
  }
  return fmtYen(n);
}

function renderForecastChart(payerFilter) {
  const panel = document.getElementById('forecast-panel');
  if (!panel) return;
  if (payments.length === 0) {
    panel.innerHTML = '<p class="empty-msg">項目を追加するとグラフが表示されます</p>';
    return;
  }

  const MONTHS    = 24;
  const MIN_OFF   = -60;
  const now       = new Date();
  const data      = [];
  const startIdx  = forecastOffset + 1; // forecastOffset=0 → i=1(来月)〜24

  for (let i = startIdx; i < startIdx + MONTHS; i++) {
    const d0     = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const mStart = d0;
    const mEnd   = new Date(d0.getFullYear(), d0.getMonth() + 1, 0);
    const catAmts = {};
    let total = 0;

    payments.forEach(p => {
      const freq = p.frequencyMonths ?? 1;
      let d = new Date(p.nextPaymentDate + 'T00:00:00');
      if (freq === 0) {
        if (d < mStart || d > mEnd) return;
      } else {
        if (p.startDate) {
          const sd = new Date(p.startDate + 'T00:00:00');
          while (d < sd) d = new Date(d.getFullYear(), d.getMonth() + freq, d.getDate());
        }
        while (d > mEnd)   d = new Date(d.getFullYear(), d.getMonth() - freq, d.getDate());
        while (d < mStart) d = new Date(d.getFullYear(), d.getMonth() + freq, d.getDate());
        if (d < mStart || d > mEnd) return;
      }
      const baseAmt = amountForDate(p, d);
      const cat = CAT_ORDER.includes(p.category) ? p.category : CAT_ORDER[CAT_ORDER.length - 1];
      let amt;
      if (payerFilter) {
        if (p.payerOverride) {
          amt = p.payerOverride === payerFilter ? baseAmt : 0;
        } else {
          const s = globalSplits.find(gs => gs.name === payerFilter);
          amt = s ? computeShare(baseAmt, s) : 0;
        }
      } else {
        amt = baseAmt;
      }
      if (amt > 0) {
        catAmts[cat] = (catAmts[cat] || 0) + amt;
        total += amt;
      }
    });

    data.push({
      year: d0.getFullYear(), month: d0.getMonth() + 1,
      showYear: d0.getMonth() === 0 || i === startIdx,
      total, catAmts,
      isNext:    i === 1,
      isCurrent: i === 0,
      isPast:    i <  0,
    });
  }

  const max   = Math.max(...data.map(d => d.total), 1);
  const BAR_H = 120;

  const bars = data.map(d => {
    const totalH = d.total > 0 ? Math.max(4, Math.round(d.total / max * BAR_H)) : 0;
    const segments = CAT_ORDER
      .filter(cat => d.catAmts[cat] > 0)
      .map(cat => {
        const h = Math.max(2, Math.round(d.catAmts[cat] / d.total * totalH));
        return `<div class="forecast-seg" style="height:${h}px;background:${CAT_COLORS[cat]}"></div>`;
      }).join('');

    const cls = d.isNext    ? ' forecast-col-next'
              : d.isCurrent ? ' forecast-col-current'
              : d.isPast    ? ' forecast-col-past'
              : '';
    return `
      <div class="forecast-col${cls}">
        <div class="forecast-amount">${d.total > 0 ? fmtYenCompact(d.total) : ''}</div>
        <div class="forecast-bar-wrap">
          <div class="forecast-bar" style="height:${totalH}px">${segments}</div>
        </div>
        <div class="forecast-baseline"></div>
        <div class="forecast-month">${d.month}月</div>
        <div class="forecast-year">${d.showYear ? d.year : ''}</div>
      </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="forecast-header">
      <div class="forecast-nav">
        <button class="forecast-nav-btn" id="forecast-prev" ${forecastOffset <= MIN_OFF ? 'disabled' : ''}>◀ 前へ</button>
        <span class="forecast-title">月別支払い（24ヶ月）</span>
        <button class="forecast-nav-btn" id="forecast-next" ${forecastOffset >= 0 ? 'disabled' : ''}>次へ ▶</button>
      </div>
      <div class="forecast-legend">
        ${CAT_ORDER.map(cat => `
          <span class="forecast-leg-item">
            <span class="forecast-leg-dot" style="background:${CAT_COLORS[cat]}"></span>${cat}
          </span>`).join('')}
      </div>
    </div>
    <div class="forecast-scroll">
      <div class="forecast-chart">${bars}</div>
    </div>`;

  panel.querySelector('#forecast-prev').addEventListener('click', () => {
    if (forecastOffset > MIN_OFF) { forecastOffset -= 6; renderForecastChart(selectedPayer); }
  });
  panel.querySelector('#forecast-next').addEventListener('click', () => {
    if (forecastOffset < 0) { forecastOffset += 6; renderForecastChart(selectedPayer); }
  });
}

// ===== View tabs =====
function setView(view) {
  currentView = view;
  document.getElementById('view-next').style.display = view === 'next' ? '' : 'none';
  document.getElementById('view-avg').style.display  = view === 'avg'  ? '' : 'none';
  document.querySelectorAll('.view-tab').forEach(btn => {
    btn.classList.toggle('view-tab-active', btn.dataset.view === view);
  });
}

document.querySelectorAll('.view-tab').forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.view));
});

// ===== Occurrence helpers =====
function getOccurrencesAroundNow(nextDateStr, freqMonths, pastCount = 3, futureCount = 3) {
  if (freqMonths === 0) return [new Date(nextDateStr + 'T00:00:00')];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let cursor = new Date(nextDateStr + 'T00:00:00');
  while (cursor < now) cursor = new Date(cursor.getFullYear(), cursor.getMonth() + freqMonths, cursor.getDate());
  // go back pastCount steps
  let start = new Date(cursor);
  for (let i = 0; i < pastCount; i++) start = new Date(start.getFullYear(), start.getMonth() - freqMonths, start.getDate());
  const results = [];
  let d = new Date(start);
  for (let i = 0; i < pastCount + futureCount; i++) {
    results.push(new Date(d));
    d = new Date(d.getFullYear(), d.getMonth() + freqMonths, d.getDate());
  }
  return results;
}

// ===== Paid modal =====
function openPaidModal(id, options = {}) {
  const p = payments.find(x => x.id === id);
  if (!p) return;
  paidModalData = { id };

  const freq        = p.frequencyMonths ?? 1;
  const occurrencesRaw = getOccurrencesAroundNow(p.nextPaymentDate, freq);
  const occurrences = occurrencesRaw.filter(d => amountForDate(p, d) > 0);
  if (occurrences.length === 0) {
    alert('記録できる支払い予定がありません');
    return;
  }

  const dateSel = document.getElementById('pm-date');
  dateSel.innerHTML = occurrences.map(d => {
    const dateStr = toDateInputVal(d);
    const label   = freq === 1
      ? `${d.getFullYear()}年${d.getMonth()+1}月分（${fmtDate(d)}）`
      : fmtDate(d);
    return `<option value="${dateStr}">${label}</option>`;
  }).join('');

  const targetDate = options.date && occurrences.some(d => toDateInputVal(d) === options.date)
    ? options.date
    : toDateInputVal(occurrences.find(d => {
        const now = new Date(); now.setHours(0,0,0,0);
        return d >= now;
      }) || occurrences[occurrences.length - 1]);
  dateSel.value = targetDate;
  const targetAmount = amountForDate(p, new Date(targetDate + 'T00:00:00'));

  document.getElementById('paid-modal-title').textContent = `支払いを記録：${p.name}`;
  document.getElementById('paid-modal-desc').textContent  = `${freqLabel(freq)}  合計 ${fmtYen(targetAmount)}`;

  const payerSel = document.getElementById('pm-payer');
  payerSel.innerHTML = payers.map(pay => `<option value="${esc(pay.name)}">${esc(pay.name)}</option>`).join('');
  if (options.payerName && payers.find(pay => pay.name === options.payerName)) payerSel.value = options.payerName;

  document.getElementById('pm-amount').value = Math.round(
    options.amount !== undefined ? options.amount : targetAmount
  );
  dateSel.onchange = () => {
    const amt = amountForDate(p, new Date(dateSel.value + 'T00:00:00'));
    document.getElementById('paid-modal-desc').textContent = `${freqLabel(freq)}  合計 ${fmtYen(amt)}`;
    document.getElementById('pm-amount').value = Math.round(amt);
  };
  document.getElementById('paid-modal').style.display = 'flex';
}

function closePaidModal() {
  document.getElementById('paid-modal').style.display = 'none';
  paidModalData = null;
}

document.getElementById('paid-modal-close-btn').addEventListener('click', closePaidModal);
document.getElementById('paid-modal-cancel-btn').addEventListener('click', closePaidModal);
document.getElementById('paid-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('paid-modal')) closePaidModal();
});

document.getElementById('paid-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!paidModalData) return;
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  try {
    const date      = document.getElementById('pm-date').value;
    const payerName = document.getElementById('pm-payer').value;
    const amount    = parseFloat(document.getElementById('pm-amount').value);
    await markPaid(paidModalData.id, date, payerName, amount);
    closePaidModal();
  } catch { alert('保存に失敗しました'); }
  btn.disabled = false;
});

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
function renderPieChart(payerFilter) {
  const catTotals = {};
  payments.forEach(p => {
    const div = monthlyDiv(p);
    if (div === 0) return; // 月額に含めない
    const avgAmount = amountForAverage(p);
    if (avgAmount === 0) return;
    const cat = p.category || 'その他';
    let amt;
    if (payerFilter) {
      if (p.payerOverride) {
        amt = p.payerOverride === payerFilter ? avgAmount / div : 0;
      } else {
        const s = globalSplits.find(gs => gs.name === payerFilter);
        amt = s ? computeShare(avgAmount, s) / div : 0;
      }
    } else {
      amt = avgAmount / div;
    }
    if (amt > 0) catTotals[cat] = (catTotals[cat] || 0) + amt;
  });

  const total = Object.values(catTotals).reduce((a, b) => a + b, 0);
  const chartCard = document.getElementById('chart-card');
  if (total === 0) { chartCard.style.display = 'none'; return; }
  chartCard.style.display = '';

  const hdr = document.getElementById('chart-card-header');
  if (hdr) {
    const label = payerFilter ? `カテゴリ別 月額内訳（${payerFilter}）` : 'カテゴリ別 月額内訳';
    hdr.innerHTML = `${esc(label)}<span class="chart-subtitle">特定の月ではなく、毎月かかる平均額（年払い・分割は月割り換算）</span>`;
  }

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

// ===== Personal bar chart =====
function renderPersonalBarChart(payerName) {
  const card = document.getElementById('personal-chart-card');
  if (!card) return;
  if (!payerName) { card.style.display = 'none'; return; }

  const items = payments.map(p => {
    const div = monthlyDiv(p);
    if (div === 0) return null; // 月額に含めない
    const avgAmount = amountForAverage(p);
    if (avgAmount === 0) return null;
    let monthlyAmt;
    if (p.payerOverride) {
      monthlyAmt = p.payerOverride === payerName ? avgAmount / div : 0;
    } else {
      const s = globalSplits.find(gs => gs.name === payerName);
      monthlyAmt = s ? computeShare(avgAmount, s) / div : 0;
    }
    return { ...p, monthlyAmt };
  }).filter(Boolean).filter(p => p.monthlyAmt > 0).sort((a, b) => b.monthlyAmt - a.monthlyAmt);

  if (items.length === 0) { card.style.display = 'none'; return; }
  card.style.display = '';

  const color = payers.find(p => p.name === payerName)?.color || '#3b82f6';
  const max   = items[0].monthlyAmt;

  card.innerHTML = `
    <div class="chart-header">${esc(payerName)}の支払い内訳<span class="chart-subtitle">特定の月ではなく、毎月かかる平均額（年払い・分割は月割り換算）</span></div>
    <div class="personal-bar-list">
      ${items.map(p => {
        const pct = Math.max(3, Math.round(p.monthlyAmt / max * 100));
        return `
          <div class="pb-row">
            <div class="pb-meta">
              <span class="pb-name">${esc(p.name)}</span>
              <span class="pb-cat" style="background:${CAT_COLORS[p.category]||'#64748b'}">${esc(p.category)}</span>
            </div>
            <div class="pb-bar-wrap">
              <div class="pb-bar" style="width:${pct}%;background:${color}"></div>
            </div>
            <span class="pb-amt">${fmtYen(p.monthlyAmt)}<span class="pb-unit">/月</span></span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ===== 各項目の月額換算リスト（平均タブ） =====
function renderAvgItems(payerFilter) {
  const section = document.getElementById('avg-items-section');
  const body    = document.getElementById('avg-items-body');
  if (!section || !body) return;

  // 月額に寄与する項目（div>0）のみ、選択者の負担額で算出
  const items = payments.map(p => {
    const div = monthlyDiv(p);
    if (div === 0) return null;
    const avgAmount = amountForAverage(p);
    if (avgAmount === 0) return null;
    let monthlyAmt, fullAmt;
    if (payerFilter) {
      if (p.payerOverride) {
        if (p.payerOverride !== payerFilter) return null;
        fullAmt = avgAmount;
      } else {
        const s = globalSplits.find(gs => gs.name === payerFilter);
        if (!s || splitPct(s) === 0) return null;
        fullAmt = computeShare(avgAmount, s);
      }
    } else {
      fullAmt = avgAmount;
    }
    monthlyAmt = fullAmt / div;
    return { ...p, fullAmt, monthlyAmt, div };
  }).filter(Boolean).filter(p => p.monthlyAmt > 0)
    .sort((a, b) => b.monthlyAmt - a.monthlyAmt);

  if (items.length === 0) { section.style.display = 'none'; return; }
  section.style.display = '';

  const total = items.reduce((s, p) => s + p.monthlyAmt, 0);

  const rows = items.map(p => {
    const freq    = p.frequencyMonths ?? 1;
    // 月払い以外は「元の金額 ÷ 期間」の換算式を表示
    const conv = p.div > 1
      ? `<span class="ai-conv">${fmtYen(p.fullAmt)} ÷ ${p.div}ヶ月</span>`
      : '';
    const change = amountChangeLabel(p);
    return `
      <div class="ai-row">
        <span class="cat-badge ai-cat" style="background:${CAT_COLORS[p.category]||'#64748b'}">${esc(p.category)}</span>
        <div class="ai-main">
          <span class="ai-name">${esc(p.name)}</span>
          <span class="ai-freq">${freqLabel(freq)}${conv}${change ? `<span class="ai-conv">${esc(change)}</span>` : ''}</span>
        </div>
        <span class="ai-amt">${fmtYen(p.monthlyAmt)}<span class="ai-unit">/月</span></span>
      </div>`;
  }).join('');

  body.innerHTML = `
    <div class="ai-list">${rows}</div>
    <div class="ai-footer">
      <span class="ai-footer-label">${payerFilter ? `${esc(payerFilter)}の月額換算 合計` : '月額換算 合計'}</span>
      <span class="ai-footer-total">${fmtYen(total)}<span class="ai-unit">/月</span></span>
    </div>`;
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
    const freq = p.frequencyMonths ?? 1;
    const div  = monthlyDiv(p);
    const avgAmount = amountForAverage(p);
    if (div > 0) totalMonthly += avgAmount / div;

    const nextMonthEff = occurrenceInNextMonth(p.nextPaymentDate, freq, p.startDate);
    const nextAmount   = nextMonthEff ? amountForDate(p, nextMonthEff) : 0;
    const dueNext      = nextMonthEff !== null && nextAmount > 0;
    if (dueNext) { totalNextMonth += nextAmount; nextItems.push({ ...p, eff: nextMonthEff, dueAmount: nextAmount }); }

    if (p.payerOverride && perPayer[p.payerOverride]) {
      if (div > 0) perPayer[p.payerOverride].monthly += avgAmount / div;
      if (dueNext) perPayer[p.payerOverride].nextMonth += nextAmount;
    } else {
      globalSplits.forEach(s => {
        if (!perPayer[s.name]) return;
        if (div > 0) perPayer[s.name].monthly += computeShare(avgAmount, s) / div;
        if (dueNext) perPayer[s.name].nextMonth += computeShare(nextAmount, s);
      });
    }
  });

  // サマリー
  renderPayerFilter();
  const displayMonthly   = selectedPayer ? (perPayer[selectedPayer]?.monthly   ?? 0) : totalMonthly;
  const displayNextMonth = selectedPayer ? (perPayer[selectedPayer]?.nextMonth ?? 0) : totalNextMonth;

  document.getElementById('monthly-total').textContent    = fmtYen(displayMonthly);
  document.getElementById('next-month-total').textContent = fmtYen(displayNextMonth);
  document.getElementById('next-month-label').textContent = selectedPayer ? `${nextMLabel} / ${selectedPayer}` : nextMLabel;
  document.getElementById('next-month-badge').textContent = nextMLabel;
  const monthlyNote = document.getElementById('monthly-note');
  if (monthlyNote) monthlyNote.textContent = selectedPayer ? `${selectedPayer}の負担分・年払い等を月割り換算` : '年払い等を月割り換算';

  // 支払い者別内訳テーブル（個人ビュー時は非表示）
  const showBreakdown = payers.length > 1 && !selectedPayer;
  const nextBdCard = document.getElementById('next-breakdown-card');
  const avgBdCard  = document.getElementById('avg-breakdown-card');
  if (showBreakdown) {
    nextBdCard.style.display = '';
    avgBdCard.style.display  = '';
    document.getElementById('next-breakdown-body').innerHTML = payers.map(p => `
      <tr>
        <td class="bd-name"><span class="payer-dot" style="background:${p.color}"></span>${esc(p.name)}</td>
        <td class="bd-val">${fmtYen(perPayer[p.name]?.nextMonth ?? 0)}</td>
      </tr>
    `).join('');
    document.getElementById('avg-breakdown-body').innerHTML = payers.map(p => `
      <tr>
        <td class="bd-name"><span class="payer-dot" style="background:${p.color}"></span>${esc(p.name)}</td>
        <td class="bd-val">${fmtYen(perPayer[p.name]?.monthly ?? 0)}</td>
      </tr>
    `).join('');
  } else {
    nextBdCard.style.display = 'none';
    avgBdCard.style.display  = 'none';
  }

  // 来月リスト
  const nml = document.getElementById('next-month-list');
  const displayNextItems = selectedPayer
    ? nextItems.filter(p => {
        if (p.payerOverride) return p.payerOverride === selectedPayer;
        const s = globalSplits.find(gs => gs.name === selectedPayer);
        return s && s.numer > 0;
      })
    : nextItems;

  if (displayNextItems.length === 0) {
    nml.innerHTML = '<p class="empty-msg">来月の支払い予定はありません</p>';
  } else {
    nml.innerHTML = displayNextItems.map(p => {
      const dueAmount = p.dueAmount ?? amountForDate(p, p.eff);
      let displayAmt = dueAmount;
      let splitHint  = '';
      if (selectedPayer) {
        if (p.payerOverride) {
          displayAmt = dueAmount;
        } else {
          const s = globalSplits.find(gs => gs.name === selectedPayer);
          displayAmt = s ? computeShare(dueAmount, s) : dueAmount;
        }
      } else if (payers.length > 1) {
        splitHint = p.payerOverride
          ? `<span class="split-chip">
               <span class="chip-dot" style="background:${payerColor(p.payerOverride)}"></span>
               ${esc(p.payerOverride)}が支払い
             </span>`
          : globalSplits.filter(s => splitPct(s) > 0).map(s =>
              `<span class="split-chip">
                 <span class="chip-dot" style="background:${payerColor(s.name)}"></span>
                 ${esc(s.name)} ${fmtYen(computeShare(dueAmount, s))}
               </span>`
            ).join('');
      }

      return `
        <div class="next-item" style="border-left: 4px solid ${CAT_COLORS[p.category]||'#64748b'}">
          <span class="cat-badge" style="background:${CAT_COLORS[p.category]||'#64748b'}">${esc(p.category)}</span>
          <div class="next-item-body">
            <span class="next-item-name">${esc(p.name)}</span>
            ${splitHint ? `<span class="next-item-split">${splitHint}</span>` : ''}
          </div>
          <span class="next-item-amount">${fmtYen(displayAmt)}</span>
          <span class="next-item-date">${fmtDate(p.eff)}</span>
        </div>
      `;
    }).join('');
  }

  // 円グラフ
  renderPieChart(selectedPayer);

  // 個人バーチャート
  renderPersonalBarChart(selectedPayer);

  // 各項目の月額換算リスト
  renderAvgItems(selectedPayer);

  // 月別予測グラフ（来月タブで常時表示）
  renderForecastChart(selectedPayer);

  // 月別内訳・支払い実績・精算
  renderMonthlyBreakdown();
  renderPaidSummary();
  renderSettlement();

  // 件数
  document.getElementById('item-count').textContent = payments.length ? `${payments.length}件` : '';

  // 頻度別サマリー
  const freqSummaryEl = document.getElementById('freq-summary');
  if (freqSummaryEl) {
    const groups = {};
    payments.forEach(p => {
      const freq = p.frequencyMonths ?? 1;
      if (!groups[freq]) groups[freq] = { count: 0, monthly: 0, total: 0 };
      groups[freq].count++;
      const avgAmount = amountForAverage(p);
      groups[freq].total += avgAmount;
      const div = monthlyDiv(p);
      if (div > 0) groups[freq].monthly += avgAmount / div;
    });
    freqSummaryEl.innerHTML = Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([freq, g]) => {
        const fNum = Number(freq);
        const amtHtml = fNum > 0
          ? `<span class="freq-chip-amount">${fmtYen(g.monthly)}/月</span>`
          : g.monthly > 0
            ? `<span class="freq-chip-amount">${fmtYen(g.monthly)}/月</span>`
            : `<span class="freq-chip-amount" style="color:var(--muted)">${fmtYen(g.total)} 合計</span>`;
        return `
          <div class="freq-chip">
            <span class="freq-chip-label">${freqLabel(fNum)}</span>
            <span class="freq-chip-count">${g.count}件</span>
            ${amtHtml}
          </div>`;
      }).join('');
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
      const freq    = p.frequencyMonths ?? 1;
      const div     = monthlyDiv(p);
      const eff     = effectiveNextPayableDate(p) || effectiveNextDate(p.nextPaymentDate, freq, p.startDate);
      const nextMonthEff = occurrenceInNextMonth(p.nextPaymentDate, freq, p.startDate);
      const dueNext = nextMonthEff !== null && amountForDate(p, nextMonthEff) > 0;
      const avgAmount = amountForAverage(p);
      const effAmount = amountForDate(p, eff);
      const changeLabel = amountChangeLabel(p);
      const today0  = new Date(); today0.setHours(0, 0, 0, 0);
      const isFutureStart = p.startDate && new Date(p.startDate + 'T00:00:00') > today0;
      const splitText = payers.length > 1
        ? p.payerOverride
          ? `<span class="split-chip">
               <span class="chip-dot" style="background:${payerColor(p.payerOverride)}"></span>
               ${esc(p.payerOverride)}のみ${div > 0 ? ` (${fmtYen(avgAmount / div)}/月)` : ''}
             </span>`
          : globalSplits.filter(s => splitPct(s) > 0).map(s => {
              const pct        = splitPct(s);
              const monthlyAmt = div > 0 ? Math.round(computeShare(avgAmount, s) / div) : null;
              return `<span class="split-chip">
                <span class="chip-dot" style="background:${payerColor(s.name)}"></span>
                ${esc(s.name)} ${pct}%${monthlyAmt !== null ? ` (${fmtYen(monthlyAmt)}/月)` : ''}
              </span>`;
            }).join('')
        : '';
      return `
        <div class="payment-item ${dueNext ? 'due-next' : ''}"
             style="border-left:4px solid ${CAT_COLORS[p.category]||'#64748b'}"
             draggable="true" data-id="${p.id}" data-category="${esc(p.category)}">
          <div class="payment-item-top">
            <span class="drag-handle" title="ドラッグして並び替え">⠿</span>
            <span class="payment-name">${esc(p.name)}${dueNext ? '<span class="due-badge">来月</span>' : ''}${isFutureStart ? `<span class="future-badge">${fmtStartBadge(p.startDate)}</span>` : ''}</span>
            <div class="payment-actions">
              <button class="pay-btn"  data-id="${p.id}">支払い</button>
              <button class="edit-btn" data-id="${p.id}">編集</button>
              <button class="del-btn"  data-id="${p.id}">削除</button>
            </div>
          </div>
          <div class="payment-item-detail">
            <span><span class="detail-label">金額</span>${fmtYen(p.amount)}</span>
            ${changeLabel ? `<span><span class="detail-label">変更</span>${esc(changeLabel)}</span>` : ''}
            <span><span class="detail-label">頻度</span>${freqLabel(freq)}</span>
            ${div > 0 && avgAmount > 0 ? `<span><span class="detail-label">月額換算</span>${fmtYen(avgAmount / div)}${freq === 0 ? `（${p.amortizeMonths}ヶ月）` : ''}</span>` : ''}
            <span><span class="detail-label">支払日</span>${fmtDate(eff)}（${fmtYen(effAmount)}）</span>
            ${splitText ? `<span class="split-detail-text"><span class="detail-label">分担</span>${splitText}</span>` : ''}
            ${p.note ? `<span><span class="detail-label">メモ</span>${esc(p.note)}</span>` : ''}
            ${(p.paidHistory || []).length > 0
              ? `<span><span class="detail-label">支払済</span><span class="paid-count-badge">${(p.paidHistory).length}件</span></span>`
              : ''}
          </div>
        </div>
      `;
    }).join('');
  });

  list.innerHTML = html;

  list.querySelectorAll('.pay-btn').forEach(btn => btn.addEventListener('click', () => openPaidModal(btn.dataset.id)));
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
function setupFreqToggle(sel, customGrp, amortizeGrp, amortizeInp) {
  sel.addEventListener('change', () => {
    customGrp.style.display   = sel.value === 'custom' ? 'block' : 'none';
    amortizeGrp.style.display = sel.value === '0' ? '' : 'none';
    if (sel.value !== '0' && amortizeInp) amortizeInp.value = '';
  });
}
setupFreqToggle(fFreq, addCustomGroup, addAmortizeGroup, fAmortizeMonths);
setupFreqToggle(eFreq, editCustomGroup, editAmortizeGroup, eAmortizeMonths);

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
      amountChanges:   readAmountChanges(fChangeYear, fChangeAmount),
      frequencyMonths: getFreqMonths(fFreq, fFreqCustom),
      amortizeMonths:  fFreq.value === '0' ? (parseInt(fAmortizeMonths.value) || 0) : 0,
      nextPaymentDate: document.getElementById('f-next-date').value,
      startDate:       document.getElementById('f-start-date').value || '',
      category:        document.getElementById('f-category').value,
      payerOverride:   document.getElementById('f-payer-override').value,
      note:            document.getElementById('f-note').value.trim(),
    });
    addForm.reset();
    fFreq.value = '1';
    addCustomGroup.style.display = 'none';
    addAmortizeGroup.style.display = 'none';
  } catch (err) {
    alert(err.message === 'amount-change' ? '金額変更の年目と金額を入力してください' : '追加に失敗しました');
  }
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
  document.getElementById('e-start-date').value     = p.startDate || '';
  document.getElementById('e-category').value       = p.category || 'その他';
  document.getElementById('e-payer-override').value = p.payerOverride || '';
  document.getElementById('e-note').value           = p.note || '';
  const amountChange = normalizedAmountChanges(p)[0];
  eChangeYear.value   = amountChange ? amountChange.startYear : '';
  eChangeAmount.value = amountChange ? amountChange.amount : '';

  const freq = p.frequencyMonths ?? 1;
  if ([0,1,2,3,6,12,24,36].includes(freq)) {
    eFreq.value = String(freq); editCustomGroup.style.display = 'none';
  } else {
    eFreq.value = 'custom'; eFreqCustom.value = freq; editCustomGroup.style.display = 'block';
  }
  editAmortizeGroup.style.display = (freq === 0) ? '' : 'none';
  eAmortizeMonths.value = (freq === 0 && p.amortizeMonths > 0) ? p.amortizeMonths : '';

  editModal.style.display = 'flex';
}

function closeModal() { editModal.style.display = 'none'; editingId = null; }
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
editModal.addEventListener('click', e => { if (e.target === editModal) closeModal(); });

// ===== Settlement =====
function calculateSettlement() {
  const balance = {};
  payers.forEach(p => { balance[p.name] = 0; });

  payments.forEach(p => {
    (p.paidHistory || []).forEach(r => {
      if (balance[r.paidBy] === undefined) return;
      balance[r.paidBy] += r.amount;

      if (p.payerOverride) {
        if (balance[p.payerOverride] !== undefined) balance[p.payerOverride] -= r.amount;
      } else {
        let remaining = r.amount;
        globalSplits.forEach((s, i) => {
          if (balance[s.name] === undefined) return;
          const share = (i === globalSplits.length - 1)
            ? remaining
            : Math.round(r.amount * s.numer / s.denom);
          balance[s.name] -= share;
          remaining -= share;
        });
      }
    });
  });
  return balance;
}

function minimizeTransactions(balance) {
  const creditors = Object.entries(balance).filter(([,v]) => v > 0.5)
    .map(([person, amount]) => ({ person, amount })).sort((a,b) => b.amount - a.amount);
  const debtors   = Object.entries(balance).filter(([,v]) => v < -0.5)
    .map(([person, amount]) => ({ person, amount: -amount })).sort((a,b) => b.amount - a.amount);

  const txs = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const transfer = Math.min(creditors[i].amount, debtors[j].amount);
    if (transfer > 0.5) txs.push({ from: debtors[j].person, to: creditors[i].person, amount: Math.round(transfer) });
    creditors[i].amount -= transfer;
    debtors[j].amount   -= transfer;
    if (creditors[i].amount < 0.5) i++;
    if (debtors[j].amount   < 0.5) j++;
  }
  return txs;
}

function renderSettlement() {
  const section = document.getElementById('settlement-section');
  const body    = document.getElementById('settlement-body');
  if (!section || !body) return;
  if (payers.length <= 1 || !payments.some(p => (p.paidHistory || []).length > 0)) {
    section.style.display = 'none'; return;
  }
  section.style.display = '';

  const balance = calculateSettlement();
  const txs     = minimizeTransactions(balance);

  const balanceRows = payers.map(p => {
    const net = Math.round(balance[p.name] || 0);
    const cls = net > 0 ? 'settle-pos' : net < 0 ? 'settle-neg' : 'settle-zero';
    const lbl = net > 0 ? '受取' : net < 0 ? '支払' : '±0';
    return `
      <div class="settle-balance-row">
        <span class="settle-name"><span class="payer-dot" style="background:${p.color}"></span>${esc(p.name)}</span>
        <span class="settle-label ${cls}">${lbl}</span>
        <span class="settle-amount ${cls}">${net >= 0 ? '+' : ''}${fmtYen(net)}</span>
      </div>`;
  }).join('');

  const txRows = txs.length
    ? txs.map(t => `
      <div class="settle-tx-row">
        <span class="settle-tx-from"><span class="payer-dot" style="background:${payerColor(t.from)}"></span>${esc(t.from)}</span>
        <span class="settle-tx-arrow">→</span>
        <span class="settle-tx-to"><span class="payer-dot" style="background:${payerColor(t.to)}"></span>${esc(t.to)}</span>
        <span class="settle-tx-amount">${fmtYen(t.amount)}</span>
      </div>`).join('')
    : '<p class="empty-msg" style="padding:12px 16px 16px;">精算なし（バランスが取れています）</p>';

  body.innerHTML = `
    <div class="settle-balance">
      <div class="settle-block-title">残高</div>
      ${balanceRows}
    </div>
    <div class="settle-transactions">
      <div class="settle-block-title">振り込み</div>
      ${txRows}
    </div>`;
}

// ===== Monthly breakdown =====
function renderMonthlyBreakdown() {
  const section = document.getElementById('monthly-breakdown-section');
  const el      = document.getElementById('monthly-breakdown-body');
  if (!section || !el) return;
  if (payments.length === 0) { section.style.display = 'none'; return; }
  section.style.display = '';

  const MIN_OFF = -12, MAX_OFF = 3;
  const now    = new Date();
  const mStart = new Date(now.getFullYear(), now.getMonth() + breakdownMonthOffset, 1);
  const mEnd   = new Date(mStart.getFullYear(), mStart.getMonth() + 1, 0);
  const isThis = breakdownMonthOffset === 0;
  const isNext = breakdownMonthOffset === 1;
  const y = mStart.getFullYear(), m = mStart.getMonth() + 1;
  const badge = isNext ? '来月' : isThis ? '今月' : '';

  // 該当月の支払い項目を集める
  const dueItems = [];
  payments.forEach(p => {
    const freq = p.frequencyMonths ?? 1;
    const d0   = new Date(p.nextPaymentDate + 'T00:00:00');
    if (freq === 0) {
      if (d0 >= mStart && d0 <= mEnd && amountForDate(p, d0) > 0) dueItems.push({ p, date: new Date(d0) });
      return;
    }
    let d = new Date(d0);
    if (p.startDate) {
      const sd = new Date(p.startDate + 'T00:00:00');
      while (d < sd) d = new Date(d.getFullYear(), d.getMonth() + freq, d.getDate());
    }
    while (d < mStart) d = new Date(d.getFullYear(), d.getMonth() + freq, d.getDate());
    if (d >= mStart && d <= mEnd && amountForDate(p, d) > 0) dueItems.push({ p, date: new Date(d) });
  });
  dueItems.sort((a, b) => CAT_ORDER.indexOf(a.p.category) - CAT_ORDER.indexOf(b.p.category));

  const total     = dueItems.reduce((s, x) => s + amountForDate(x.p, x.date), 0);
  const paidCount = dueItems.filter(x => {
    const ds = toDateInputVal(x.date);
    return (x.p.paidHistory || []).some(r => r.date === ds);
  }).length;
  const allPaid = dueItems.length > 0 && paidCount === dueItems.length;

  // ナビゲーション
  const navHtml = `
    <div class="mb-nav${allPaid ? ' mb-nav-paid' : ''}">
      <button class="mb-nav-btn" id="mb-prev" ${breakdownMonthOffset <= MIN_OFF ? 'disabled' : ''}>◀</button>
      <span class="mb-nav-title">
        ${y}年${m}月${badge ? `<span class="mb-badge">${badge}</span>` : ''}
      </span>
      <button class="mb-nav-btn" id="mb-next" ${breakdownMonthOffset >= MAX_OFF ? 'disabled' : ''}>▶</button>
    </div>`;

  // 内訳
  let bodyHtml;
  if (dueItems.length === 0) {
    bodyHtml = '<p class="empty-msg">この月の支払い予定はありません</p>';
  } else {
    const rows = dueItems.map(({ p, date }) => {
      const ds     = toDateInputVal(date);
      const dueAmount = amountForDate(p, date);
      const recs   = (p.paidHistory || []).filter(r => r.date === ds);
      const isPaid = recs.length > 0;
      const isPast = date < now;

      const statusHtml = isPaid
        ? recs.map(r => `
            <span class="mb-chip mb-chip-paid">
              <span class="payer-dot" style="background:${payerColor(r.paidBy)}"></span>
              ${esc(r.paidBy)} ${fmtYen(r.amount)}
            </span>`).join('')
        : `<button class="mb-chip mb-chip-unpaid${isPast ? ' mb-chip-overdue' : ''}"
               data-id="${p.id}" data-date="${ds}">未払い</button>`;

      return `
        <div class="mb-item">
          <span class="cat-badge mb-cat" style="background:${CAT_COLORS[p.category]||'#64748b'}">${esc(p.category)}</span>
          <span class="mb-name">${esc(p.name)}</span>
          <span class="mb-date">${fmtDate(date)}</span>
          <span class="mb-amount">${fmtYen(dueAmount)}</span>
          <span class="mb-status">${statusHtml}</span>
        </div>`;
    }).join('');

    bodyHtml = `
      <div class="mb-items">${rows}</div>
      <div class="mb-footer${allPaid ? ' mb-footer-paid' : ''}">
        <span class="mb-footer-progress">${paidCount}/${dueItems.length}件 支払済</span>
        <span class="mb-footer-total">${fmtYen(total)}</span>
      </div>`;
  }

  el.innerHTML = navHtml + bodyHtml;

  document.getElementById('mb-prev')?.addEventListener('click', () => {
    if (breakdownMonthOffset > MIN_OFF) { breakdownMonthOffset--; renderMonthlyBreakdown(); }
  });
  document.getElementById('mb-next')?.addEventListener('click', () => {
    if (breakdownMonthOffset < MAX_OFF) { breakdownMonthOffset++; renderMonthlyBreakdown(); }
  });
  el.querySelectorAll('.mb-chip-unpaid').forEach(btn => {
    btn.addEventListener('click', () => openPaidModal(btn.dataset.id, { date: btn.dataset.date }));
  });
}

// ===== Paid summary =====
function renderPaidSummary() {
  const section = document.getElementById('paid-summary-section');
  const body    = document.getElementById('paid-summary-body');
  if (!section || !body) return;

  const totals     = {};
  const allRecords = [];

  payments.forEach(p => {
    (p.paidHistory || []).forEach(r => {
      if (!totals[r.paidBy]) totals[r.paidBy] = { total: 0, count: 0 };
      totals[r.paidBy].total += r.amount;
      totals[r.paidBy].count++;
      allRecords.push({ ...r, itemName: p.name });
    });
  });

  const grandTotal = Object.values(totals).reduce((s, t) => s + t.total, 0);
  if (grandTotal === 0) { section.style.display = 'none'; return; }
  section.style.display = '';

  const summaryRows = payers.map(p => {
    const t = totals[p.name];
    if (!t || t.total === 0) return '';
    return `
      <div class="ps-row">
        <span class="ps-name"><span class="payer-dot" style="background:${p.color}"></span>${esc(p.name)}</span>
        <span class="ps-count">${t.count}件</span>
        <span class="ps-amount">${fmtYen(t.total)}</span>
      </div>`;
  }).join('');

  allRecords.sort((a, b) => b.date.localeCompare(a.date));

  const historyRows = allRecords.slice(0, 30).map(r => {
    const d = new Date(r.date + 'T00:00:00');
    return `
      <div class="ps-hist-row">
        <span class="ps-hist-date">${fmtDate(d)}</span>
        <span class="ps-hist-name">${esc(r.itemName)}</span>
        <span class="ps-hist-payer">
          <span class="payer-dot" style="background:${payerColor(r.paidBy)}"></span>${esc(r.paidBy)}
        </span>
        <span class="ps-hist-amount">${fmtYen(r.amount)}</span>
      </div>`;
  }).join('');

  body.innerHTML = `
    <div class="ps-totals">
      ${summaryRows}
      <div class="ps-row ps-grand-total">
        <span class="ps-name">合計</span>
        <span class="ps-count">${allRecords.length}件</span>
        <span class="ps-amount">${fmtYen(grandTotal)}</span>
      </div>
    </div>
    ${historyRows ? `
      <div class="ps-history">
        <div class="ps-history-header">支払い履歴</div>
        ${historyRows}
      </div>` : ''}
  `;
}

editForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!editingId) return;
  const btn = editForm.querySelector('.add-btn');
  btn.disabled = true;
  try {
    await updatePayment(editingId, {
      name:            document.getElementById('e-name').value.trim(),
      amount:          parseFloat(document.getElementById('e-amount').value),
      amountChanges:   readAmountChanges(eChangeYear, eChangeAmount),
      frequencyMonths: getFreqMonths(eFreq, eFreqCustom),
      amortizeMonths:  eFreq.value === '0' ? (parseInt(eAmortizeMonths.value) || 0) : 0,
      nextPaymentDate: document.getElementById('e-next-date').value,
      startDate:       document.getElementById('e-start-date').value || '',
      category:        document.getElementById('e-category').value,
      payerOverride:   document.getElementById('e-payer-override').value,
      note:            document.getElementById('e-note').value.trim(),
    });
    closeModal();
  } catch (err) {
    alert(err.message === 'amount-change' ? '金額変更の年目と金額を入力してください' : '保存に失敗しました');
  }
  btn.disabled = false;
});
