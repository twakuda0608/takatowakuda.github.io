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
let currentUser = null;
let payments    = [];
let payers      = [
  { name: '自分',       color: DEFAULT_COLORS[0] },
  { name: 'パートナー', color: DEFAULT_COLORS[1] }
];
let editingId = null;
let unsub     = null;

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
    await loadPayers(user.uid);
    subscribePayments(user.uid);
  } else {
    loginBtn.style.display    = 'inline-flex';
    userInfo.style.display    = 'none';
    loginScreen.style.display = 'flex';
    mainContent.style.display = 'none';
    if (unsub) { unsub(); unsub = null; }
    payments = [];
    payers   = [
      { name: '自分',       color: DEFAULT_COLORS[0] },
      { name: 'パートナー', color: DEFAULT_COLORS[1] }
    ];
  }
});

// ===== Payers =====
async function loadPayers(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists() && Array.isArray(snap.data().payers) && snap.data().payers.length > 0) {
      payers = snap.data().payers.map((p, i) =>
        typeof p === 'string' ? { name: p, color: DEFAULT_COLORS[i] || '#64748b' } : p
      );
    }
  } catch { /* ルール未設定時はデフォルト */ }
  renderPayerSettings();
  buildSplitContainer('add-split-container', null);
}

async function savePayers() {
  try {
    await setDoc(doc(db, 'users', currentUser.uid), { payers }, { merge: true });
  } catch { alert('支払い者の保存に失敗しました。'); }
}

function renderPayerSettings() {
  payersList.innerHTML = payers.map((p, i) => `
    <div class="payer-item">
      <input type="color" class="payer-color-input" value="${p.color}" data-index="${i}" title="色を変更">
      <input type="text" class="payer-name-input" value="${esc(p.name)}" data-index="${i}" maxlength="20" placeholder="名前">
      ${payers.length > 1
        ? `<button type="button" class="payer-del-btn" data-index="${i}" title="削除">×</button>`
        : ''}
    </div>
  `).join('');

  payersList.querySelectorAll('.payer-color-input').forEach(input => {
    input.addEventListener('input', () => {
      payers[parseInt(input.dataset.index)].color = input.value;
      buildSplitContainer('add-split-container', null);
      render();
    });
    input.addEventListener('change', () => savePayers());
  });

  payersList.querySelectorAll('.payer-name-input').forEach(input => {
    input.addEventListener('change', () => {
      const val = input.value.trim();
      if (!val) { input.value = payers[parseInt(input.dataset.index)].name; return; }
      payers[parseInt(input.dataset.index)].name = val;
      savePayers();
      buildSplitContainer('add-split-container', null);
      render();
    });
  });

  payersList.querySelectorAll('.payer-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      payers.splice(parseInt(btn.dataset.index), 1);
      savePayers();
      renderPayerSettings();
      buildSplitContainer('add-split-container', null);
      render();
    });
  });

  addPayerBtn.style.display = payers.length >= 4 ? 'none' : 'inline-flex';
}

addPayerBtn.addEventListener('click', () => {
  if (payers.length >= 4) return;
  payers.push({ name: `メンバー${payers.length + 1}`, color: DEFAULT_COLORS[payers.length] || '#64748b' });
  savePayers();
  renderPayerSettings();
  buildSplitContainer('add-split-container', null);
  render();
});

// ===== Split inputs =====
// splits は { name, numer, denom } で保存。
// 割合モード: denom=100, numer=入力した%値
// 金額モード: denom=合計金額, numer=入力した円
// → computeShare(total, split) = Math.round(total * numer / denom) で必ず整数

function computeShare(totalAmount, split) {
  if (split?.numer !== undefined && split.denom > 0) {
    return Math.round(totalAmount * split.numer / split.denom);
  }
  // 旧フォーマット (ratio %) の後方互換
  return Math.round(totalAmount * (split?.ratio || 0) / 100);
}

function splitPct(split) {
  if (split?.numer !== undefined && split.denom > 0) {
    return Math.round(split.numer / split.denom * 100);
  }
  return Math.round(split?.ratio || 0);
}

function buildSplitContainer(containerId, existingSplits) {
  const container = document.getElementById(containerId);
  if (!container || payers.length <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  const amtId    = containerId === 'add-split-container' ? 'f-amount' : 'e-amount';
  const getTotal = () => Math.round(parseFloat(document.getElementById(amtId)?.value) || 0);

  // 既存splits から初期%値を取得
  const initPct = name => {
    if (existingSplits) {
      const s = existingSplits.find(s => s.name === name);
      if (s?.numer !== undefined && s.denom > 0) return s.numer / s.denom * 100;
      if (s?.ratio !== undefined) return s.ratio;
    }
    return 100 / payers.length;
  };

  container.dataset.mode = 'percent';

  function draw(overrideVals) {
    const mode  = container.dataset.mode;
    const total = getTotal();
    const vals  = payers.map((p, i) =>
      overrideVals?.[i] ??
      (mode === 'percent' ? Math.round(initPct(p.name)) : Math.round(total * initPct(p.name) / 100))
    );

    container.innerHTML = `
      <label class="split-label">支払い分担</label>
      <div class="split-mode-toggle">
        <button type="button" class="mode-btn ${mode === 'percent' ? 'active' : ''}" data-mode="percent">割合</button>
        <button type="button" class="mode-btn ${mode === 'amount'  ? 'active' : ''}" data-mode="amount">金額</button>
      </div>
      <div class="split-presets">
        <button type="button" class="split-preset" data-action="equal">均等</button>
        ${payers.map(p => `
          <button type="button" class="split-preset" data-action="sole" data-payer="${esc(p.name)}">
            <span class="preset-dot" style="background:${p.color}"></span>${esc(p.name)}のみ
          </button>
        `).join('')}
      </div>
      <div class="split-rows">
        ${payers.map((p, i) => `
          <div class="split-row">
            <span class="split-color-dot" style="background:${p.color}"></span>
            <span class="split-name">${esc(p.name)}</span>
            <input type="number" class="split-input" data-payer="${esc(p.name)}"
              min="0" step="1" value="${vals[i]}">
            <span class="split-unit">${mode === 'percent' ? '%' : '円'}</span>
          </div>
        `).join('')}
      </div>
      <div class="split-footer">
        ${mode === 'amount' ? `<span class="split-total-ref">合計金額: ${fmtYen(total)}</span>` : ''}
        <span class="split-total-line">合計: <span class="split-total-num">0</span>${mode === 'percent' ? '%' : '円'} <span class="split-valid-icon"></span></span>
      </div>
    `;

    bind();
    refresh();
  }

  function bind() {
    // モード切替
    container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const oldMode = container.dataset.mode;
        const newMode = btn.dataset.mode;
        if (oldMode === newMode) return;

        // 現在値を%に変換してから新モードの値を計算
        const inputs  = container.querySelectorAll('.split-input');
        const total   = getTotal();
        const newVals = payers.map(p => {
          const inp = Array.from(inputs).find(i => i.dataset.payer === p.name);
          const val = parseFloat(inp?.value) || 0;
          const pct = oldMode === 'percent' ? val : (total > 0 ? val / total * 100 : 0);
          return Math.round(newMode === 'percent' ? pct : total * pct / 100);
        });

        container.dataset.mode = newMode;
        draw(newVals);
      });
    });

    // プリセットボタン
    container.querySelectorAll('.split-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode   = container.dataset.mode;
        const total  = getTotal();
        const inputs = container.querySelectorAll('.split-input');
        const n      = inputs.length;

        if (btn.dataset.action === 'equal') {
          if (mode === 'percent') {
            const share = Math.round(100 / n);
            inputs.forEach((inp, i) => { inp.value = i === n - 1 ? 100 - share * (n - 1) : share; });
          } else {
            // 整数の等分: 最後の人が端数を引き受ける
            const share = Math.floor(total / n);
            inputs.forEach((inp, i) => { inp.value = i === n - 1 ? total - share * (n - 1) : share; });
          }
        } else {
          const sole = btn.dataset.payer;
          inputs.forEach(inp => {
            inp.value = inp.dataset.payer === sole ? (mode === 'percent' ? 100 : total) : 0;
          });
        }
        refresh();
      });
    });

    // 入力イベント: 2人の時は片方が決まればもう片方を自動計算
    container.querySelectorAll('.split-input').forEach(inp => {
      inp.addEventListener('input', () => {
        if (payers.length === 2) {
          const mode  = container.dataset.mode;
          const val   = parseFloat(inp.value) || 0;
          const other = Array.from(container.querySelectorAll('.split-input')).find(i => i !== inp);
          if (other) other.value = Math.max(0, mode === 'percent' ? 100 - val : getTotal() - val);
        }
        refresh();
      });
    });

    // 合計金額フィールドが変わったら参照表示を更新
    const amtEl = document.getElementById(amtId);
    if (amtEl) {
      if (amtEl._splitCleanup) amtEl._splitCleanup();
      const handler = () => {
        if (container.dataset.mode !== 'amount') return;
        const refEl = container.querySelector('.split-total-ref');
        if (refEl) refEl.textContent = `合計金額: ${fmtYen(getTotal())}`;
        refresh();
      };
      amtEl.addEventListener('input', handler);
      amtEl._splitCleanup = () => amtEl.removeEventListener('input', handler);
    }
  }

  function refresh() {
    const mode   = container.dataset.mode;
    const inputs = container.querySelectorAll('.split-input');
    const sum    = Array.from(inputs).reduce((s, i) => s + (parseFloat(i.value) || 0), 0);
    const numEl  = container.querySelector('.split-total-num');
    const icon   = container.querySelector('.split-valid-icon');

    if (numEl) {
      numEl.textContent = mode === 'percent'
        ? (Math.round(sum * 10) / 10)
        : Math.round(sum).toLocaleString('ja-JP');
    }
    if (icon) {
      const ok = mode === 'percent'
        ? Math.abs(sum - 100) < 0.6
        : (getTotal() > 0 && Math.abs(sum - getTotal()) < 1);
      icon.textContent = ok ? '✓' : '✗';
      icon.className   = ok ? 'split-valid-icon ok' : 'split-valid-icon ng';
    }
  }

  draw();
}

function getSplits(containerId) {
  const container = document.getElementById(containerId);
  const mode      = container?.dataset.mode || 'percent';
  const inputs    = container ? Array.from(container.querySelectorAll('.split-input')) : [];

  if (!inputs.length) return [{ name: payers[0]?.name || '自分', numer: 1, denom: 1 }];

  if (mode === 'amount') {
    const amtId = containerId === 'add-split-container' ? 'f-amount' : 'e-amount';
    const total = Math.round(parseFloat(document.getElementById(amtId)?.value) || 0);

    const arr = payers.map(p => {
      const inp = inputs.find(i => i.dataset.payer === p.name);
      return { name: p.name, numer: Math.round(parseFloat(inp?.value) || 0), denom: total };
    });

    // 最後の人に端数を割り当て: total - Σ(他の人) で整数演算を保証
    if (arr.length >= 2) {
      const sumOthers = arr.slice(0, -1).reduce((s, x) => s + x.numer, 0);
      arr[arr.length - 1].numer = total - sumOthers;
    }
    return arr;
  } else {
    // 割合モード: denom=100
    return payers.map(p => {
      const inp = inputs.find(i => i.dataset.payer === p.name);
      return { name: p.name, numer: Math.round(parseFloat(inp?.value) || 0), denom: 100 };
    });
  }
}

// ===== Firestore =====
function colRef(uid) {
  return collection(db, 'users', uid, 'payments');
}

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

function fmtDate(date) {
  return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;
}

function fmtYen(n) { return '¥' + Math.round(n).toLocaleString('ja-JP'); }

function freqLabel(months) {
  const map = { 1:'毎月', 2:'2ヶ月ごと', 3:'3ヶ月ごと', 6:'半年ごと', 12:'年1回', 24:'2年ごと', 36:'3年ごと' };
  return map[months] ?? `${months}ヶ月ごと`;
}

const CAT_COLORS = {
  '賃貸':'#2563eb', 'インフラ':'#0891b2', 'サブスク':'#7c3aed', '保険':'#ea580c', 'その他':'#64748b'
};

function payerColor(name) { return payers.find(p => p.name === name)?.color || '#64748b'; }
function esc(str) { return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

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

    const splits = normSplits(p.splits);
    splits.forEach(s => {
      if (!perPayer[s.name]) return;
      perPayer[s.name].monthly += computeShare(p.amount, s) / freq;
      if (dueNext) perPayer[s.name].nextMonth += computeShare(p.amount, s);
    });
  });

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
        <td class="bd-val">${fmtYen(perPayer[p.name]?.monthly ?? 0)}</td>
        <td class="bd-val">${fmtYen(perPayer[p.name]?.nextMonth ?? 0)}</td>
      </tr>
    `).join('');
  } else {
    bdCard.style.display = 'none';
  }

  // 来月リスト
  const nml = document.getElementById('next-month-list');
  nml.innerHTML = nextItems.length === 0
    ? '<p class="empty-msg">来月の支払い予定はありません</p>'
    : nextItems.map(p => {
        const splits    = normSplits(p.splits);
        const splitHint = payers.length > 1
          ? splits.filter(s => splitPct(s) > 0).map(s =>
              `<span class="split-chip"><span class="chip-dot" style="background:${payerColor(s.name)}"></span>${esc(s.name)} ${fmtYen(computeShare(p.amount, s))}</span>`
            ).join('')
          : '';
        return `
          <div class="next-item">
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

  document.getElementById('item-count').textContent = payments.length ? `${payments.length}件` : '';

  // 全項目リスト
  const list = document.getElementById('payments-list');
  if (payments.length === 0) {
    list.innerHTML = '<p class="empty-msg">まだ項目がありません。上のフォームから追加してください。</p>';
    return;
  }

  list.innerHTML = payments.map(p => {
    const freq    = p.frequencyMonths || 1;
    const eff     = effectiveNextDate(p.nextPaymentDate, freq);
    const dueNext = isInNextMonth(eff);
    const splits  = normSplits(p.splits);
    const splitText = payers.length > 1
      ? splits.filter(s => splitPct(s) > 0).map(s => {
          const pct       = splitPct(s);
          const monthlyAmt = Math.round(computeShare(p.amount, s) / freq);
          return `<span class="split-chip"><span class="chip-dot" style="background:${payerColor(s.name)}"></span>${esc(s.name)} ${pct}% (${fmtYen(monthlyAmt)}/月)</span>`;
        }).join('')
      : '';

    return `
      <div class="payment-item ${dueNext ? 'due-next' : ''}">
        <div class="payment-item-top">
          <span class="cat-badge" style="background:${CAT_COLORS[p.category]||'#64748b'}">${esc(p.category)}</span>
          <span class="payment-name">${esc(p.name)}${dueNext ? '<span class="due-badge">来月</span>' : ''}</span>
          <div class="payment-actions">
            <button class="edit-btn" data-id="${p.id}">編集</button>
            <button class="del-btn" data-id="${p.id}">削除</button>
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

  list.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.id)));
  list.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = payments.find(p => p.id === btn.dataset.id)?.name;
      if (confirm(`「${name}」を削除しますか？`)) deletePayment(btn.dataset.id);
    });
  });
}

// 旧フォーマット { ratio } と新フォーマット { numer, denom } を統一
function normSplits(splits) {
  if (!splits?.length) return [{ name: payers[0]?.name || '自分', numer: 1, denom: 1 }];
  return splits;
}

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
      note:            document.getElementById('f-note').value.trim(),
      splits:          getSplits('add-split-container'),
    });
    addForm.reset();
    fFreq.value = '1';
    addCustomGroup.style.display = 'none';
    buildSplitContainer('add-split-container', null);
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
  document.getElementById('e-category').value  = p.category || 'その他';
  document.getElementById('e-note').value      = p.note || '';

  const freq = p.frequencyMonths || 1;
  const presets = [1, 2, 3, 6, 12, 24, 36];
  if (presets.includes(freq)) {
    eFreq.value = String(freq); editCustomGroup.style.display = 'none';
  } else {
    eFreq.value = 'custom'; eFreqCustom.value = freq; editCustomGroup.style.display = 'block';
  }

  buildSplitContainer('edit-split-container', p.splits || null);
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
      note:            document.getElementById('e-note').value.trim(),
      splits:          getSplits('edit-split-container'),
    });
    closeModal();
  } catch { alert('保存に失敗しました'); }
  btn.disabled = false;
});
