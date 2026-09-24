import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  orderBy, query, deleteDoc, doc,
  updateDoc, getDoc, setDoc, writeBatch
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const el = id => document.getElementById(id);

let currentUser = null;
let lastResult = null;
let matchesUnsubscribe = null;
let matches = [];
let myName = '';
let playerHistory = [];
let pendingTableGame = null;
let tableSeatNames = ['P1', 'P2', 'P3', 'P4'];

function cleanName(name, fallback = '') {
  const trimmed = String(name || '').trim();
  return trimmed || fallback;
}

function normalizeNameList(names, fallbackPrefix = 'P') {
  return [0, 1, 2, 3].map(i => cleanName(names?.[i], `${fallbackPrefix}${i + 1}`));
}

function getPlayerSlotNames(useFallback = true) {
  return [1, 2, 3, 4].map(slot =>
    cleanName(el(`sn${slot}_1`)?.value, useFallback ? `P${slot}` : '')
  );
}

function getRankedSlotIndexes() {
  return [0, 1, 2, 3].sort((a, b) =>
    Number(el(`sr${a + 1}_1`)?.value || a + 1) - Number(el(`sr${b + 1}_1`)?.value || b + 1)
  );
}

function getRankNames(useFallback = true) {
  const slotNames = getPlayerSlotNames(useFallback);
  return getRankedSlotIndexes().map(slotIndex => slotNames[slotIndex]);
}

function resetScoreRankSelections() {
  [1, 2, 3, 4].forEach(slot => {
    const select = el(`sr${slot}_1`);
    if (!select) return;
    select.value = String(slot);
    select.dataset.previousRank = String(slot);
  });
  reorderScoreRowsByRank();
}

function reorderScoreRowsByRank() {
  const container = el('score-rows');
  if (!container) return;
  Array.from(container.querySelectorAll('.score-row'))
    .sort((a, b) => {
      const aSlot = a.dataset.playerSlot;
      const bSlot = b.dataset.playerSlot;
      return Number(el(`sr${aSlot}_1`)?.value || 9) - Number(el(`sr${bSlot}_1`)?.value || 9);
    })
    .forEach(row => container.appendChild(row));
}

function getRankPlayerRecords() {
  if (!lastResult) return [];
  return getRankNames().map((name, i) => ({
    name,
    pt: Number(lastResult.pts[i]) || 0,
    rank: i + 1
  }));
}

function setTableSeatNames(names) {
  tableSeatNames = normalizeNameList(names);
}

function sendToTable() {}


// ====== Tab switching ======
function activateTab(tabId) {
  document.querySelectorAll('.tabbtn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const btn = document.querySelector(`[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
}

document.querySelectorAll('.tabbtn').forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

if (location.hash) {
  const hashId = location.hash.slice(1);
  if (document.getElementById(hashId)) activateTab(hashId);
}

// ====== Tab 1: ウマ/オカ精算 ======
const init1 = el('init1'), oka1 = el('oka1'), uma1 = el('uma1'), rate1 = el('rate1');
const s1_1 = el('s1_1'), s2_1 = el('s2_1'), s3_1 = el('s3_1'), s4_1 = el('s4_1');
const r1_1 = el('r1_1'), r2_1 = el('r2_1'), r3_1 = el('r3_1'), r4_1 = el('r4_1');
const decimal1 = el('decimal1'), tie1 = el('tie1');

function thousandRoundPt1(realScore) {
  const score = Number(realScore) || 0;
  if (decimal1 && decimal1.checked) return score / 1000;
  return Math.round((score - 100) / 1000);
}

function parseUma1(val) {
  const v = Number(val);
  const x = Math.round(v / 100);
  const y = v - x * 100;
  return { x, y };
}

function computeTab1() {
  const I = Number(init1.value || 0);
  const O = Number(oka1.value || 0);
  const R = Number(rate1.value || 0);
  const { x: UX, y: UY } = parseUma1(uma1.value);

  const scoreInputs = [s1_1, s2_1, s3_1, s4_1];
  const topSlotIndex = getRankedSlotIndexes()[0];
  const autoScoreInput = scoreInputs[topSlotIndex];
  const manualScoreInputs = scoreInputs.filter((_, slotIndex) => slotIndex !== topSlotIndex);

  scoreInputs.forEach((input, slotIndex) => {
    const isAuto = slotIndex === topSlotIndex;
    input.readOnly = isAuto;
    input.placeholder = isAuto ? '自動計算' : '';
  });

  if (manualScoreInputs.some(input => input.value.trim() === '')) {
    autoScoreInput.value = '';
    [r1_1, r2_1, r3_1, r4_1].forEach(result => { result.textContent = '—'; });
    lastResult = null;
    updateRecordSection();
    updateRankNames();
    return;
  }

  const kyotakuOffset = pendingTableGame?.kyotakuExcluded || 0;
  const autoScore = I * 4 - kyotakuOffset - manualScoreInputs.reduce((sum, input) => sum + Number(input.value), 0);
  autoScoreInput.value = autoScore;
  const slotScores = scoreInputs.map(input => Number(input.value));
  const S = getRankedSlotIndexes().map(slotIndex => slotScores[slotIndex]);

  const okaPt = (O * 100) / 1000;

  let p1, p2, p3, p4;

  if (tie1 && tie1.checked) {
    // Uma bonus per rank: 1st=+UY, 2nd=+UX, 3rd=-UX, 4th=-UY
    const uma = [UY, UX, -UX, -UY];

    // Average uma bonuses for any group of consecutive equal scores
    let i = 0;
    while (i < 4) {
      let j = i + 1;
      while (j < 4 && S[j] === S[i]) j++;
      if (j - i > 1) {
        const avg = uma.slice(i, j).reduce((a, b) => a + b, 0) / (j - i);
        for (let k = i; k < j; k++) uma[k] = avg;
      }
      i = j;
    }

    // Compute each player's score directly (no p1=-(p2+p3+p4) yet)
    const direct = S.map((s, idx) => thousandRoundPt1(s * 100) + uma[idx] - okaPt);

    // The sum won't be zero when init ≠ oka; distribute the surplus to the top-score group
    const surplus = -direct.reduce((a, b) => a + b, 0) - (kyotakuOffset ? (kyotakuOffset * 100 / 1000) : 0);
    const maxS = Math.max(...S);
    const topCount = S.filter(s => s === maxS).length;
    [p1, p2, p3, p4] = direct.map((d, idx) => d + (S[idx] === maxS ? surplus / topCount : 0));

  } else {
    // Original formula: p1 absorbs all oka surplus (standard mahjong)
    p2 = thousandRoundPt1(S[1] * 100) + UX - okaPt;
    p3 = thousandRoundPt1(S[2] * 100) - UX - okaPt;
    p4 = thousandRoundPt1(S[3] * 100) - UY - okaPt;
    p1 = kyotakuOffset ? (thousandRoundPt1(S[0] * 100) + UY) : -(p2 + p3 + p4);
  }

  function fmt(pt) {
    const val = Math.abs(pt) < 1e-9 ? 0 : pt;
    const ptStr = (decimal1 && decimal1.checked) ? val.toFixed(1) : String(Math.round(val));
    const money = Math.round(pt * R);
    return { ptStr, money, ptNum: Math.abs(val) < 1e-9 ? 0 : val };
  }

  const [f1, f2, f3, f4] = [fmt(p1), fmt(p2), fmt(p3), fmt(p4)];

  r1_1.textContent = `${f1.ptStr}pt × ${R} = ${f1.money}`;
  r2_1.textContent = `${f2.ptStr}pt × ${R} = ${f2.money}`;
  r3_1.textContent = `${f3.ptStr}pt × ${R} = ${f3.money}`;
  r4_1.textContent = `${f4.ptStr}pt × ${R} = ${f4.money}`;

  lastResult = {
    pts: [f1.ptNum, f2.ptNum, f3.ptNum, f4.ptNum],
    ptStrs: [f1.ptStr, f2.ptStr, f3.ptStr, f4.ptStr]
  };
  updateRecordSection();
  updateRankNames();
}

['input', 'change'].forEach(ev => {
  [init1, oka1, uma1, rate1, s1_1, s2_1, s3_1, s4_1, decimal1, tie1].forEach(e =>
    e.addEventListener(ev, computeTab1)
  );
});

computeTab1();

// ====== Rank card name display (Tab 1) ======
function updateRankNames() {
  const rankNames = getRankNames(false);
  [1, 2, 3, 4].forEach(i => {
    const nameEl = el(`rn${i}_1`);
    if (!nameEl) return;
    const name = rankNames[i - 1];
    nameEl.textContent = name ? ` · ${name}` : '';
  });
  updateRecordSourceUI();
}

// ====== Name field autocomplete init (Tab 1) ======
function getScoreInputNames(rank) {
  const taken = new Set();
  [1, 2, 3, 4].forEach(r => {
    if (r === rank) return;
    const f = el(`sn${r}_1`);
    if (f) { const v = f.value.trim(); if (v) taken.add(v); }
  });
  return playerHistory.filter(n => !taken.has(n));
}

[1, 2, 3, 4].forEach(slot => {
  const inp = el(`sn${slot}_1`);
  if (!inp) return;
  inp.addEventListener('input', () => {
    updateRankNames();
    if (!pendingTableGame) setTableSeatNames(getPlayerSlotNames());
  });
  makeAutocomplete(inp, () => getScoreInputNames(slot));

  const rankSelect = el(`sr${slot}_1`);
  if (!rankSelect) return;
  rankSelect.dataset.previousRank = rankSelect.value;
  rankSelect.addEventListener('change', () => {
    const previousRank = rankSelect.dataset.previousRank;
    const nextRank = rankSelect.value;
    const otherSelect = [1, 2, 3, 4]
      .filter(otherSlot => otherSlot !== slot)
      .map(otherSlot => el(`sr${otherSlot}_1`))
      .find(select => select?.value === nextRank);
    if (otherSelect) {
      otherSelect.value = previousRank;
      otherSelect.dataset.previousRank = previousRank;
    }
    rankSelect.dataset.previousRank = nextRank;
    reorderScoreRowsByRank();
    computeTab1();
  });
});

// ====== Record section (Tab 1 bottom) ======
function updateRecordSection() {
  const needsLogin = el('record-needs-login');
  const loggedIn   = el('record-logged-in');
  needsLogin.style.display = currentUser ? 'none' : 'block';
  loggedIn.style.display   = currentUser ? 'block' : 'none';
  const recordBtn = el('record-btn');
  if (recordBtn) recordBtn.disabled = !lastResult;
  updateRecordSourceUI();
}

function resetTab1ScoresForNextMatch() {
  [s1_1, s2_1, s3_1, s4_1].forEach(input => { input.value = ''; });
  computeTab1();
}

function updateRecordSourceUI() {
  const sourceLabel = el('record-source-label');
  const preview = el('record-preview');
  const clearBtn = el('record-clear-table');
  if (!sourceLabel || !preview || !clearBtn) return;

  const hasTable = !!pendingTableGame;
  sourceLabel.textContent = hasTable ? 'テーブル記録' : '点数のみ';
  sourceLabel.classList.toggle('record-source-table', hasTable);
  clearBtn.style.display = hasTable ? '' : 'none';

  const players = getRankPlayerRecords();
  preview.textContent = players.length
    ? players.map(p => `${p.name} ${fmtPt(p.pt)}`).join(' / ')
    : '';
}

el('record-clear-table').addEventListener('click', () => {
  pendingTableGame = null;
  setTableSeatNames(getPlayerSlotNames());
  const banner = el('import-banner');
  if (banner) banner.style.display = 'none';
  updateRecordSourceUI();
});

el('import-banner-close').addEventListener('click', () => {
  el('import-banner').style.display = 'none';
});

el('record-btn').addEventListener('click', async () => {
  if (!currentUser || !lastResult) return;

  const playerRecords = getRankPlayerRecords();

  const matchRecord = {
    recordedAt: new Date().toISOString(),
    source: pendingTableGame ? 'table' : 'score',
    players: playerRecords
  };
  if (pendingTableGame) matchRecord.tableGame = pendingTableGame;

  const btn = el('record-btn');
  const msg = el('record-success');
  btn.disabled = true;
  btn.textContent = '記録中';

  try {
    await addDoc(collection(db, 'mahjong_records', currentUser.uid, 'matches'), matchRecord);
    updateHistoryWithNames(playerRecords.map(p => p.name));
    await savePlayerHistory();
    pendingTableGame = null;
    const banner = el('import-banner');
    if (banner) banner.style.display = 'none';
    resetTab1ScoresForNextMatch();
    msg.textContent = '記録しました！';
    msg.className = 'record-msg success';
    updateRecordSourceUI();
    setTimeout(() => { msg.textContent = ''; msg.className = 'record-msg'; }, 3000);
  } catch (err) {
    console.error('記録エラー:', err);
    msg.textContent = '記録に失敗しました。';
    msg.className = 'record-msg error';
  } finally {
    btn.disabled = !lastResult;
    btn.textContent = '試合記録';
  }
});

// ====== Tab 2: 総合ポイント精算 ======
const rate2 = el('rate2');
const n1_2 = el('n1_2'), n2_2 = el('n2_2'), n3_2 = el('n3_2'), n4_2 = el('n4_2');
const p1_2 = el('p1_2'), p2_2 = el('p2_2'), p3_2 = el('p3_2'), p4_2 = el('p4_2');
const resultList2 = el('resultList2');
const check2 = el('check2');

function settle2(names, amounts) {
  const creditors = [], debtors = [];
  names.forEach((nm, i) => {
    const a = Math.round(amounts[i]);
    if (a > 0) creditors.push({ name: nm, amt: a });
    else if (a < 0) debtors.push({ name: nm, amt: -a });
  });
  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);
  const res = [];
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const pay = Math.min(creditors[ci].amt, debtors[di].amt);
    res.push({ from: debtors[di].name, to: creditors[ci].name, amount: pay });
    creditors[ci].amt -= pay;
    debtors[di].amt -= pay;
    if (creditors[ci].amt === 0) ci++;
    if (debtors[di].amt === 0) di++;
    if (ci + 1 < creditors.length && creditors[ci]?.amt < creditors[ci + 1]?.amt) creditors.sort((a, b) => b.amt - a.amt);
    if (di + 1 < debtors.length && debtors[di]?.amt < debtors[di + 1]?.amt) debtors.sort((a, b) => b.amt - a.amt);
  }
  return res;
}

function computeTab2() {
  const R = Number(rate2.value);
  const names = [n1_2.value || '1', n2_2.value || '2', n3_2.value || '3', n4_2.value || '4'];
  const pts = [p1_2.value, p2_2.value, p3_2.value, p4_2.value].map(Number);
  const amounts = pts.map(pt => pt * R);
  const sum = amounts.reduce((a, b) => a + b, 0);
  check2.textContent = `チェック: 合計 = ${sum} （0ならOK）`;
  resultList2.innerHTML = '';
  if (sum === 0) {
    settle2(names, amounts).forEach(t => {
      const li = document.createElement('li');
      li.textContent = `${t.from} → ${t.to}: ${t.amount}円`;
      resultList2.appendChild(li);
    });
  }
}

['input', 'change'].forEach(ev => {
  [rate2, n1_2, n2_2, n3_2, n4_2, p1_2, p2_2, p3_2, p4_2].forEach(e => e.addEventListener(ev, computeTab2));
});
[n1_2, n2_2, n3_2, n4_2].forEach(inp => makeAutocomplete(inp, () => playerHistory));
computeTab2();

// ====== Tab 3: Auth ======
el('t3-login-btn').addEventListener('click', () => signInWithPopup(auth, provider).catch(console.error));
el('t3-logout-btn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  updateAuthUI();
  if (user) {
    await loadProfile();
    subscribeMatches();
  } else {
    if (matchesUnsubscribe) { matchesUnsubscribe(); matchesUnsubscribe = null; }
    matches = [];
    playerHistory = [];
    el('sessions-list').innerHTML = '';
    el('alltime-section').style.display = 'none';
    el('player-history-section').style.display = 'none';
    updateRecordSection();
  }
});

function updateAuthUI() {
  const loggedIn = !!currentUser;
  el('t3-login').style.display   = loggedIn ? 'none' : 'block';
  el('t3-content').style.display = loggedIn ? 'block' : 'none';
  if (loggedIn) {
    el('t3-avatar').src = currentUser.photoURL || '';
    el('t3-name').textContent = currentUser.displayName || currentUser.email;
  }
  updateRecordSection();
}

async function loadProfile() {
  const ref = doc(db, 'mahjong_records', currentUser.uid, 'settings', 'profile');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    myName = snap.data().myName || '';
    playerHistory = Array.isArray(snap.data().playerNames) ? snap.data().playerNames : [];
  } else {
    try { playerHistory = JSON.parse(localStorage.getItem('mahjong_playerHistory') || '[]'); } catch { playerHistory = []; }
  }
  playerHistory = playerHistory.map(n => cleanName(n)).filter(Boolean);
  el('my-name-input').value = myName;
  applyMyNameToUi();
  try { localStorage.setItem('mahjong_playerHistory', JSON.stringify(playerHistory)); } catch {}
  renderPlayerHistory();
}

function applyMyNameToUi(oldName = '') {
  const label = document.querySelector('.my-name-label');
  if (label) label.textContent = myName || '自分';

  if (myName && (!tableSeatNames[0] || tableSeatNames[0] === 'P1' || tableSeatNames[0] === oldName)) {
    setTableSeatNames([myName, ...tableSeatNames.slice(1)]);
  }
}

function updateHistoryWithNames(names) {
  names.filter(Boolean).reverse().forEach(name => {
    playerHistory = [name, ...playerHistory.filter(n => n !== name)];
  });
  playerHistory = playerHistory.slice(0, 30);
}

async function savePlayerHistory() {
  await setDoc(
    doc(db, 'mahjong_records', currentUser.uid, 'settings', 'profile'),
    { playerNames: playerHistory },
    { merge: true }
  );
  try { localStorage.setItem('mahjong_playerHistory', JSON.stringify(playerHistory)); } catch {}
  renderPlayerHistory();
}

function renderPlayerHistory() {
  const container = el('player-history-list');
  if (!container) return;
  const section = el('player-history-section');
  if (playerHistory.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }
  if (section) section.style.display = 'block';
  container.innerHTML = `<div class="history-grid">${
    playerHistory.map(name => `
      <div class="history-row">
        <span class="history-name">${escHtml(name)}</span>
        <div class="history-row-actions">
          <button type="button" class="history-edit-btn" data-name="${escHtml(name)}">編集</button>
          <button type="button" class="history-del-btn" data-name="${escHtml(name)}">削除</button>
        </div>
      </div>`).join('')
  }</div>`;

  container.querySelectorAll('.history-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const oldName = btn.dataset.name;
      const row = btn.closest('.history-row');
      if (!row) return;

      row.classList.add('is-editing');
      row.innerHTML = `
        <input class="history-name-input" value="${escHtml(oldName)}" aria-label="${escHtml(oldName)}の新しい名前" maxlength="30">
        <div class="history-edit-actions">
          <button type="button" class="history-save-btn">保存</button>
          <button type="button" class="history-cancel-btn">取消</button>
        </div>
        <span class="history-edit-msg" aria-live="polite"></span>`;

      const input = row.querySelector('.history-name-input');
      const saveBtn = row.querySelector('.history-save-btn');
      const cancelBtn = row.querySelector('.history-cancel-btn');
      const msg = row.querySelector('.history-edit-msg');

      const showError = text => {
        msg.textContent = text;
        msg.className = 'history-edit-msg error';
      };

      const cancelEdit = () => renderPlayerHistory();
      const saveEdit = async () => {
        const newName = cleanName(input.value);
        if (!newName) { showError('名前を入力してください'); return; }
        if (newName === oldName) { cancelEdit(); return; }
        if (playerHistory.includes(newName) || matches.some(match =>
          (match.players || []).some(player => player.name === newName)
        )) {
          showError('同じ名前が既にあります');
          return;
        }

        input.disabled = true;
        saveBtn.disabled = true;
        cancelBtn.disabled = true;
        saveBtn.textContent = '保存中';
        try {
          await renamePlayer(oldName, newName);
        } catch (err) {
          console.error('プレイヤー名の変更エラー:', err);
          input.disabled = false;
          saveBtn.disabled = false;
          cancelBtn.disabled = false;
          saveBtn.textContent = '保存';
          showError('名前変更に失敗しました');
        }
      };

      saveBtn.addEventListener('click', saveEdit);
      cancelBtn.addEventListener('click', cancelEdit);
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') saveEdit();
        if (event.key === 'Escape') cancelEdit();
      });
      input.focus();
      input.select();
    });
  });

  function confirmPlayerDeletion(name) {
    const dialog = el('player-delete-dialog');
    el('player-delete-name').textContent = `「${name}」`;
    dialog.returnValue = 'cancel';
    dialog.showModal();
    return new Promise(resolve => {
      dialog.addEventListener('close', () => resolve(dialog.returnValue === 'delete'), { once: true });
    });
  }

  container.querySelectorAll('.history-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.dataset.name;
      if (!await confirmPlayerDeletion(name)) return;

      const previousHistory = playerHistory.slice();
      const row = btn.closest('.history-row');
      row?.querySelectorAll('button').forEach(button => { button.disabled = true; });
      playerHistory = playerHistory.filter(playerName => playerName !== name);
      try {
        await savePlayerHistory();
      } catch (err) {
        console.error('プレイヤー削除エラー:', err);
        playerHistory = previousHistory;
        renderPlayerHistory();
        alert('プレイヤーを削除できませんでした。');
      }
    });
  });
}

async function renamePlayer(oldName, newName) {
  const renamedHistory = playerHistory.map(name => name === oldName ? newName : name);
  const profilePatch = { playerNames: renamedHistory };
  if (myName === oldName) profilePatch.myName = newName;

  const matchPatches = matches.flatMap(match => {
    if (!(match.players || []).some(player => player.name === oldName)) return [];
    const updatedPlayers = match.players.map(player =>
      player.name === oldName ? { ...player, name: newName } : player
    );
    const patch = { players: updatedPlayers };
    if (match.tableGame) {
      patch.tableGame = {
        ...match.tableGame,
        playerNames: Array.isArray(match.tableGame.playerNames)
          ? match.tableGame.playerNames.map(name => name === oldName ? newName : name)
          : match.tableGame.playerNames
      };
    }
    return [{ id: match.id, patch }];
  });

  const chunks = [];
  for (let i = 0; i < matchPatches.length; i += 400) chunks.push(matchPatches.slice(i, i + 400));
  if (chunks.length === 0) chunks.push([]);

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    batch.set(
      doc(db, 'mahjong_records', currentUser.uid, 'settings', 'profile'),
      profilePatch,
      { merge: true }
    );
    chunk.forEach(item => {
      batch.update(doc(db, 'mahjong_records', currentUser.uid, 'matches', item.id), item.patch);
    });
    await batch.commit();
  }

  playerHistory = renamedHistory;
  matches = matches.map(match => {
    const item = matchPatches.find(candidate => candidate.id === match.id);
    return item ? { ...match, ...item.patch } : match;
  });
  if (myName === oldName) {
    myName = newName;
    el('my-name-input').value = newName;
  }
  tableSeatNames = tableSeatNames.map(name => name === oldName ? newName : name);
  document.querySelectorAll('.player-name-input, #n1_2, #n2_2, #n3_2, #n4_2').forEach(input => {
    if (input.value.trim() === oldName) input.value = newName;
  });
  applyMyNameToUi(oldName);
  try { localStorage.setItem('mahjong_playerHistory', JSON.stringify(playerHistory)); } catch {}
  renderPlayerHistory();
  renderMatches(matches);
  updateRecordSourceUI();
  updateRankNames();
}

el('my-name-save').addEventListener('click', async () => {
  const name = el('my-name-input').value.trim();
  const oldName = myName;
  myName = name;
  const msg = el('my-name-msg');
  try {
    await setDoc(
      doc(db, 'mahjong_records', currentUser.uid, 'settings', 'profile'),
      { myName: name },
      { merge: true }
    );
    applyMyNameToUi(oldName);
    if (name) {
      updateHistoryWithNames([name]);
      await savePlayerHistory();
    }
    msg.textContent = '保存しました';
    msg.className = 'record-msg success';
    setTimeout(() => { msg.textContent = ''; msg.className = 'record-msg'; }, 2000);
  } catch (err) {
    console.error(err);
    msg.textContent = '保存失敗';
    msg.className = 'record-msg error';
  }
});

makeAutocomplete(el('my-name-input'), () => playerHistory);

function subscribeMatches() {
  if (matchesUnsubscribe) matchesUnsubscribe();
  const ref = collection(db, 'mahjong_records', currentUser.uid, 'matches');
  const q = query(ref, orderBy('recordedAt', 'desc'));
  matchesUnsubscribe = onSnapshot(q, (snap) => {
    matches = [];
    snap.forEach(d => matches.push({ id: d.id, ...d.data() }));
    renderMatches(matches);
    updateRecordSection();
  });
}

// ====== Helpers ======
function formatMatchTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const mm  = String(d.getMonth() + 1).padStart(2, '0');
  const dd  = String(d.getDate()).padStart(2, '0');
  const hh  = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${min}`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtPt(pt) {
  if (typeof pt !== 'number' || isNaN(pt)) return '—';
  const abs = Math.abs(pt).toFixed(1);
  if (pt > 0) return `+${abs}`;
  if (pt < 0) return `▲${abs}`;
  return abs;
}

const ptClass = pt => pt > 0 ? 'pt-pos' : pt < 0 ? 'pt-neg' : '';

function getMatchPlayerRank(match, playerName) {
  const players = (match.players || []).filter(p => p && p.name);
  const found = players.find(p => p.name === playerName);
  if (!found) return null;
  if (Number.isFinite(found.rank) && found.rank > 0) return found.rank;

  const sorted = players.slice().sort((a, b) => {
    const pointDiff = (Number(b.pt) || 0) - (Number(a.pt) || 0);
    return pointDiff || String(a.name).localeCompare(String(b.name), 'ja');
  });
  const index = sorted.findIndex(p => p === found);
  return index >= 0 ? index + 1 : null;
}

function getSessionStats(group) {
  return group.colPlayers.map(name => {
    let total = 0;
    const ranks = [];
    const rankCounts = [0, 0, 0, 0];

    group.matches.forEach(match => {
      const player = (match.players || []).find(p => p.name === name);
      if (player && typeof player.pt === 'number') total += player.pt;
      const rank = getMatchPlayerRank(match, name);
      if (rank) {
        ranks.push(rank);
        if (rank <= rankCounts.length) rankCounts[rank - 1]++;
      }
    });

    return {
      name,
      total: Math.round(total * 10) / 10,
      averageRank: ranks.length ? ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length : null,
      rankCounts
    };
  }).sort((a, b) =>
    b.total - a.total ||
    (a.averageRank ?? 99) - (b.averageRank ?? 99) ||
    a.name.localeCompare(b.name, 'ja')
  );
}

function formatMatchClock(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function drawRoundRect(ctx, x, y, width, height, radius, fill, stroke = null) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function fitCanvasText(ctx, value, maxWidth) {
  const text = String(value);
  if (ctx.measureText(text).width <= maxWidth) return text;
  let fitted = text;
  while (fitted.length && ctx.measureText(`${fitted}…`).width > maxWidth) fitted = fitted.slice(0, -1);
  return `${fitted}…`;
}

let currentPreviewObjectUrl = null;
let currentPreviewBlob = null;
let currentPreviewFileName = '';

function initImagePreviewDialog() {
  const dialog = document.getElementById('image-preview-dialog');
  if (!dialog) return;

  const closeBtn = document.getElementById('image-preview-close-btn');
  const cancelBtn = document.getElementById('image-preview-cancel-btn');
  const downloadBtn = document.getElementById('image-preview-download-btn');

  closeBtn?.addEventListener('click', () => dialog.close());
  cancelBtn?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    const img = document.getElementById('image-preview-img');
    if (img) img.src = '';
    if (currentPreviewObjectUrl) {
      URL.revokeObjectURL(currentPreviewObjectUrl);
      currentPreviewObjectUrl = null;
    }
    currentPreviewBlob = null;
    currentPreviewFileName = '';
  });

  downloadBtn?.addEventListener('click', () => {
    if (!currentPreviewBlob || !currentPreviewFileName) return;
    const url = URL.createObjectURL(currentPreviewBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentPreviewFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

function openImagePreview(blob, fileName) {
  const dialog = document.getElementById('image-preview-dialog');
  const img = document.getElementById('image-preview-img');
  if (!dialog || !img) return;

  if (currentPreviewObjectUrl) {
    URL.revokeObjectURL(currentPreviewObjectUrl);
    currentPreviewObjectUrl = null;
  }

  currentPreviewBlob = blob;
  currentPreviewFileName = fileName;
  currentPreviewObjectUrl = URL.createObjectURL(blob);
  img.src = currentPreviewObjectUrl;

  dialog.showModal();
}

function getSessionDetailedStats(group) {
  const stats = group.colPlayers.map(name => ({
    name,
    ron: 0,
    tsumo: 0,
    houju: 0,
    riichi: 0,
    totalRounds: 0,
    hasStats: false
  }));

  let hasAnyStats = false;

  group.matches.forEach(m => {
    const tg = m.tableGame;
    if (!tg) return;
    hasAnyStats = true;
    const roundLog = tg.roundLog || [];
    const riichiCounts = tg.riichiCounts || [0, 0, 0, 0];
    const seatToGroup = [];
    const tgNames = (Array.isArray(tg.playerNames) && tg.playerNames.length)
      ? tg.playerNames.slice()
      : (m.players || []).map(p => p.name);

    tgNames.forEach(nm => {
      const gi = group.colPlayers.indexOf(nm);
      seatToGroup.push(gi);
    });

    const tgN = tgNames.length;
    const validRounds = roundLog.filter(e => e.type === 'agari' || e.type === 'ryukyoku').length;

    for (let si = 0; si < tgN; si++) {
      const gi = seatToGroup[si];
      if (gi < 0) continue;
      stats[gi].riichi += (riichiCounts[si] || 0);
      stats[gi].totalRounds += validRounds;
      stats[gi].hasStats = true;
    }

    for (const ev of roundLog) {
      if (ev.type === 'agari') {
        const winners = ev.winnerIdxs || (ev.winnerIdx >= 0 ? [ev.winnerIdx] : []);
        if (ev.winType === 'ron') {
          winners.forEach(wi => {
            const gi = seatToGroup[wi];
            if (gi >= 0) stats[gi].ron++;
          });
          const li = seatToGroup[ev.loserIdx];
          if (li >= 0) stats[li].houju++;
        } else {
          winners.forEach(wi => {
            const gi = seatToGroup[wi];
            if (gi >= 0) stats[gi].tsumo++;
          });
        }
      }
    }
  });

  return { hasAnyStats, stats };
}

async function generateSessionImage(group) {
  const width = 1200;
  const margin = 72;
  const contentWidth = width - margin * 2;
  const stats = getSessionStats(group);
  const playerNames = stats.map(stat => stat.name);
  const detailedStats = getSessionDetailedStats(group);
  const summaryRowHeight = 76;
  const matchHeaderHeight = 70;
  const matchRowHeight = 82;
  const totalRowHeight = 78;
  const detailedHeaderHeight = 56;
  const detailedRowHeight = 62;

  let totalHeight = 176 + 58 + stats.length * summaryRowHeight;
  totalHeight += 48 + 52 + matchHeaderHeight + group.matches.length * matchRowHeight + totalRowHeight;
  if (detailedStats.hasAnyStats) {
    totalHeight += 48 + 52 + detailedHeaderHeight + stats.length * detailedRowHeight;
  }
  totalHeight += 64;

  const height = totalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');

  const fontFamily = '"Noto Sans JP", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif';
  const colors = {
    ink: '#172033', muted: '#64748b', line: '#dbe4ef', brand: '#0078d7',
    pale: '#eff7ff', positive: '#059669', negative: '#dc2626', white: '#ffffff'
  };

  ctx.fillStyle = '#edf4fb';
  ctx.fillRect(0, 0, width, height);
  drawRoundRect(ctx, 32, 32, width - 64, height - 64, 28, colors.white);

  ctx.fillStyle = colors.brand;
  ctx.fillRect(32, 32, 10, height - 64);
  ctx.fillStyle = colors.ink;
  ctx.font = `700 42px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('麻雀 日別成績', margin, 104);
  ctx.fillStyle = colors.muted;
  ctx.font = `600 24px ${fontFamily}`;
  ctx.fillText(group.date, margin, 144);
  ctx.textAlign = 'right';
  ctx.fillText(`${group.matches.length}試合`, width - margin, 144);
  ctx.textAlign = 'left';

  let y = 176;
  ctx.fillStyle = colors.brand;
  ctx.font = `700 24px ${fontFamily}`;
  ctx.fillText('総合順位', margin, y + 32);
  y += 58;

  stats.forEach((stat, index) => {
    const rowY = y + index * summaryRowHeight;
    drawRoundRect(ctx, margin, rowY + 5, contentWidth, summaryRowHeight - 10, 14,
      index === 0 ? '#eef8ff' : '#f8fafc');
    const rankColors = ['#f59e0b', '#94a3b8', '#b7791f', '#64748b'];
    drawRoundRect(ctx, margin + 16, rowY + 17, 42, 42, 21, rankColors[index] || colors.muted);
    ctx.fillStyle = colors.white;
    ctx.font = `700 20px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), margin + 37, rowY + 38);

    ctx.textAlign = 'left';
    ctx.fillStyle = colors.ink;
    ctx.font = `700 24px ${fontFamily}`;
    ctx.fillText(fitCanvasText(ctx, stat.name, 260), margin + 78, rowY + 39);

    ctx.fillStyle = colors.muted;
    ctx.font = `500 18px ${fontFamily}`;
    const average = stat.averageRank == null ? '—' : `${stat.averageRank.toFixed(2)}位`;
    const distribution = stat.rankCounts.map((count, rank) => `${rank + 1}着 ${count}`).join('  ');
    ctx.fillText(`平均 ${average}　${distribution}`, margin + 360, rowY + 39);

    ctx.textAlign = 'right';
    ctx.fillStyle = stat.total > 0 ? colors.positive : stat.total < 0 ? colors.negative : colors.ink;
    ctx.font = `700 28px ${fontFamily}`;
    ctx.fillText(`${fmtPt(stat.total)} pt`, width - margin - 18, rowY + 39);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  });
  y += stats.length * summaryRowHeight;

  y += 48;
  ctx.fillStyle = colors.brand;
  ctx.font = `700 24px ${fontFamily}`;
  ctx.fillText('各試合', margin, y + 32);
  y += 52;

  const labelWidth = 196;
  const playerWidth = (contentWidth - labelWidth) / Math.max(playerNames.length, 1);
  drawRoundRect(ctx, margin, y, contentWidth, matchHeaderHeight, 14, colors.pale);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.muted;
  ctx.font = `700 18px ${fontFamily}`;
  ctx.fillText('試合', margin + labelWidth / 2, y + matchHeaderHeight / 2);
  playerNames.forEach((name, index) => {
    const x = margin + labelWidth + playerWidth * index;
    ctx.fillStyle = colors.ink;
    ctx.font = `700 21px ${fontFamily}`;
    ctx.fillText(fitCanvasText(ctx, name, playerWidth - 24), x + playerWidth / 2, y + matchHeaderHeight / 2);
  });
  y += matchHeaderHeight;

  group.matches.forEach((match, matchIndex) => {
    const rowY = y + matchIndex * matchRowHeight;
    ctx.fillStyle = matchIndex % 2 ? '#fbfdff' : colors.white;
    ctx.fillRect(margin, rowY, contentWidth, matchRowHeight);
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, rowY + matchRowHeight);
    ctx.lineTo(margin + contentWidth, rowY + matchRowHeight);
    ctx.stroke();

    const source = match.tableGame || match.source === 'table' ? 'テーブル' : '点数';
    const clock = formatMatchClock(match.recordedAt);
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.ink;
    ctx.font = `700 20px ${fontFamily}`;
    ctx.fillText(`第${matchIndex + 1}試合`, margin + 18, rowY + 32);
    ctx.fillStyle = colors.muted;
    ctx.font = `500 15px ${fontFamily}`;
    ctx.fillText([clock, source].filter(Boolean).join('  ·  '), margin + 18, rowY + 58);

    playerNames.forEach((name, playerIndex) => {
      const player = (match.players || []).find(p => p.name === name);
      const point = player && typeof player.pt === 'number' ? player.pt : 0;
      const rank = getMatchPlayerRank(match, name);
      const centerX = margin + labelWidth + playerWidth * playerIndex + playerWidth / 2;
      ctx.textAlign = 'center';
      ctx.fillStyle = colors.muted;
      ctx.font = `600 15px ${fontFamily}`;
      ctx.fillText(rank ? `${rank}位` : '—', centerX, rowY + 28);
      ctx.fillStyle = point > 0 ? colors.positive : point < 0 ? colors.negative : colors.ink;
      ctx.font = `700 23px ${fontFamily}`;
      ctx.fillText(fmtPt(point), centerX, rowY + 57);
    });
  });
  y += group.matches.length * matchRowHeight;

  ctx.fillStyle = colors.pale;
  ctx.fillRect(margin, y, contentWidth, totalRowHeight);
  ctx.textAlign = 'left';
  ctx.fillStyle = colors.ink;
  ctx.font = `700 21px ${fontFamily}`;
  ctx.fillText('合計', margin + 18, y + totalRowHeight / 2);
  playerNames.forEach((name, index) => {
    const stat = stats.find(item => item.name === name);
    const centerX = margin + labelWidth + playerWidth * index + playerWidth / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = stat.total > 0 ? colors.positive : stat.total < 0 ? colors.negative : colors.ink;
    ctx.font = `700 26px ${fontFamily}`;
    ctx.fillText(fmtPt(stat.total), centerX, y + totalRowHeight / 2);
  });
  y += totalRowHeight;

  // プレイヤー統計（ロン・ツモ・放銃・リーチ・和了率・放銃率）
  if (detailedStats.hasAnyStats) {
    y += 48;
    ctx.fillStyle = colors.brand;
    ctx.font = `700 24px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('プレイヤー統計', margin, y + 32);
    y += 52;

    drawRoundRect(ctx, margin, y, contentWidth, detailedHeaderHeight, 14, colors.pale);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colors.muted;
    ctx.font = `700 17px ${fontFamily}`;

    const colWidths = [256, 130, 130, 130, 130, 140, 140];
    const colHeaders = ['名前', 'ロン', 'ツモ', '放銃', 'リーチ', '和了率', '放銃率'];

    let curX = margin;
    ctx.textAlign = 'left';
    ctx.fillText(colHeaders[0], curX + 24, y + detailedHeaderHeight / 2);
    curX += colWidths[0];

    ctx.textAlign = 'center';
    for (let c = 1; c < colHeaders.length; c++) {
      ctx.fillText(colHeaders[c], curX + colWidths[c] / 2, y + detailedHeaderHeight / 2);
      curX += colWidths[c];
    }
    y += detailedHeaderHeight;

    stats.forEach((stat, index) => {
      const pStat = detailedStats.stats.find(item => item.name === stat.name) || {
        ron: 0, tsumo: 0, houju: 0, riichi: 0, totalRounds: 0, hasStats: false
      };
      const rowY = y + index * detailedRowHeight;
      ctx.fillStyle = index % 2 ? '#fbfdff' : colors.white;
      ctx.fillRect(margin, rowY, contentWidth, detailedRowHeight);
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, rowY + detailedRowHeight);
      ctx.lineTo(margin + contentWidth, rowY + detailedRowHeight);
      ctx.stroke();

      const agari = pStat.ron + pStat.tsumo;
      const rounds = pStat.totalRounds || 0;
      const agariPct = rounds > 0 ? `${Math.round(agari / rounds * 100)}%` : '—';
      const houjuPct = rounds > 0 ? `${Math.round(pStat.houju / rounds * 100)}%` : '—';

      let rowX = margin;
      // 名前
      ctx.textAlign = 'left';
      ctx.fillStyle = colors.ink;
      ctx.font = `700 20px ${fontFamily}`;
      ctx.fillText(fitCanvasText(ctx, stat.name, colWidths[0] - 36), rowX + 24, rowY + detailedRowHeight / 2);
      rowX += colWidths[0];

      // ロン
      ctx.textAlign = 'center';
      ctx.font = `600 20px ${fontFamily}`;
      ctx.fillStyle = colors.ink;
      ctx.fillText(pStat.hasStats ? String(pStat.ron) : '—', rowX + colWidths[1] / 2, rowY + detailedRowHeight / 2);
      rowX += colWidths[1];

      // ツモ
      ctx.fillText(pStat.hasStats ? String(pStat.tsumo) : '—', rowX + colWidths[2] / 2, rowY + detailedRowHeight / 2);
      rowX += colWidths[2];

      // 放銃
      ctx.fillStyle = pStat.houju > 0 ? colors.negative : colors.ink;
      ctx.fillText(pStat.hasStats ? String(pStat.houju) : '—', rowX + colWidths[3] / 2, rowY + detailedRowHeight / 2);
      rowX += colWidths[3];

      // リーチ
      ctx.fillStyle = colors.ink;
      ctx.fillText(pStat.hasStats ? String(pStat.riichi) : '—', rowX + colWidths[4] / 2, rowY + detailedRowHeight / 2);
      rowX += colWidths[4];

      // 和了率
      ctx.font = `700 20px ${fontFamily}`;
      ctx.fillStyle = (rounds > 0 && agari > 0) ? colors.positive : colors.ink;
      ctx.fillText(agariPct, rowX + colWidths[5] / 2, rowY + detailedRowHeight / 2);
      rowX += colWidths[5];

      // 放銃率
      ctx.fillStyle = (rounds > 0 && pStat.houju > 0) ? colors.negative : colors.muted;
      ctx.fillText(houjuPct, rowX + colWidths[6] / 2, rowY + detailedRowHeight / 2);
    });

    y += stats.length * detailedRowHeight;
  }

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Image creation failed');
  const safeDate = group.date.replace(/[\\/:*?"<>|\s()（）]+/g, '-').replace(/-+$/g, '');
  const fileName = `麻雀_日別成績_${safeDate}.png`;
  return { blob, fileName };
}

function syncTableGameNames(tableGame, players) {
  if (!tableGame || !Array.isArray(tableGame.roundLog)) return tableGame;
  const n = Array.isArray(tableGame.playerNames) && tableGame.playerNames.length
    ? tableGame.playerNames.length
    : 4;
  const roundLog = tableGame.roundLog;
  if (!roundLog.length) {
    return { ...tableGame, playerNames: normalizeNameList(players.map(p => p.name)) };
  }

  const initial = Array.isArray(roundLog[0]?.scoresBefore)
    ? roundLog[0].scoresBefore.slice(0, n)
    : Array(n).fill(25000);
  const finalScores = initial.slice();
  roundLog.forEach(ev => {
    const deltas = ev.deltas || [];
    for (let i = 0; i < n; i++) finalScores[i] += deltas[i] || 0;
  });

  const names = Array.from({ length: n }, (_, i) => tableGame.playerNames?.[i] || `P${i + 1}`);
  const seatOrder = Array.from({ length: n }, (_, i) => i).sort((a, b) => finalScores[b] - finalScores[a]);
  const rankOrder = players.slice().sort((a, b) => (a.rank || 9) - (b.rank || 9));
  seatOrder.forEach((seatIdx, rankIdx) => {
    const name = cleanName(rankOrder[rankIdx]?.name);
    if (name) names[seatIdx] = name;
  });
  return { ...tableGame, playerNames: names };
}

// ====== Tab 3: Group matches by 3-hour window + same player set ======
function groupMatches(allMatches) {
  // 昇順に並べて処理（古い順）
  const sorted = [...allMatches].sort((a, b) =>
    (a.recordedAt || '') < (b.recordedAt || '') ? -1 : 1
  );

  const THREE_HOURS_MS = 5 * 60 * 60 * 1000;
  const groups = []; // { date, key, colPlayers, matches, lastTs }

  sorted.forEach(m => {
    const sortedNames = (m.players || []).map(p => p.name).sort().join('|');
    const ts = m.recordedAt ? new Date(m.recordedAt).getTime() : null;

    // 同じメンバーで、最後の試合から3時間以内のグループを探す
    const existing = groups.find(g =>
      g.sortedNames === sortedNames &&
      ts !== null && g.lastTs !== null &&
      (ts - g.lastTs) <= THREE_HOURS_MS
    );

    if (existing) {
      existing.matches.push(m);
      if (ts !== null) existing.lastTs = ts;
    } else {
      const date = m.recordedAt
        ? new Date(m.recordedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' })
        : '?';
      const colPlayers = (m.players || []).map(p => p.name).sort();
      groups.push({ date, sortedNames, colPlayers, matches: [m], lastTs: ts });
    }
  });

  // グループ内の試合は昇順（古い順）のまま確定、グループ自体は降順（新しい順）で返す
  groups.reverse();
  return groups;
}

// ====== Tab 3: Render matches ======
function renderMatches(allMatches) {
  const container = el('sessions-list');

  if (allMatches.length === 0) {
    container.innerHTML = '<p class="muted sessions-empty">まだ試合がありません。</p>';
    el('alltime-section').style.display = 'none';
    return;
  }

  const groups = groupMatches(allMatches);

  container.innerHTML = groups.map((group, groupIndex) => {
    const { date, colPlayers, matches: gMatches } = group;
    const tableCount = gMatches.filter(m => m.tableGame || m.source === 'table').length;
    const scoreCount = gMatches.length - tableCount;
    const sourceSummary = [
      tableCount ? `テーブル${tableCount}` : '',
      scoreCount ? `点数${scoreCount}` : ''
    ].filter(Boolean).join(' / ');

    const totals = colPlayers.map(() => 0);
    gMatches.forEach(m => {
      colPlayers.forEach((pname, ci) => {
        const found = (m.players || []).find(p => p.name === pname);
        if (found && typeof found.pt === 'number') totals[ci] += found.pt;
      });
    });

    const matchRows = gMatches.map((m, mi) => {
      const isTable = !!(m.tableGame || m.source === 'table');
      return `
      <tr>
        <td class="date-cell match-label" data-time="${escHtml(formatMatchTime(m.recordedAt))}">
          <span class="match-num ${isTable ? 'match-num-table' : ''}" title="${escHtml(formatMatchTime(m.recordedAt) || (isTable ? 'テーブル' : '点数'))}">G${mi + 1}</span>
        </td>
        ${colPlayers.map(pname => {
          const found = (m.players || []).find(p => p.name === pname);
          const pt = found && typeof found.pt === 'number' ? found.pt : 0;
          return `<td class="${ptClass(pt)}">${fmtPt(pt)}</td>`;
        }).join('')}
        <td class="match-actions-cell">
          <button class="rec-del-btn match-edit-btn" data-mid="${escHtml(m.id)}" title="編集">✎</button>
          <button class="rec-del-btn match-del-btn"  data-mid="${escHtml(m.id)}" title="削除">×</button>
        </td>
      </tr>`;
    }).join('');

    return `
    <fieldset class="session-card">
      <legend class="session-legend">${escHtml(date)}</legend>
      <div class="session-players-row">
        <span class="session-players-text">${colPlayers.map(escHtml).join(' · ')}</span>
        <span class="session-source-text">${escHtml(sourceSummary)}</span>
      </div>
      <div class="records-scroll">
        <table class="records-tbl">
          <colgroup>
            <col class="col-match">
            ${colPlayers.map(() => '<col class="col-player">').join('')}
            <col class="col-actions">
          </colgroup>
          <thead><tr>
            <th class="th-match"></th>
            ${colPlayers.map(n => `<th class="th-player" title="${escHtml(n)}"><span class="player-col-name">${escHtml(n)}</span></th>`).join('')}
            <th class="th-actions"></th>
          </tr></thead>
          <tbody>${matchRows}</tbody>
          <tfoot><tr>
            <th class="th-match">合計</th>
            ${totals.map(t => `<th class="${ptClass(t)} th-player">${fmtPt(t)}</th>`).join('')}
            <th class="th-actions"></th>
          </tr></tfoot>
        </table>
      </div>
      <div class="session-footer">
        <span class="muted" style="font-size:12px">${gMatches.length}試合</span>
        <button class="session-image-btn" type="button" data-group-index="${groupIndex}" aria-label="${escHtml(date)}の結果を画像で保存">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>
          </svg>
          結果画像
        </button>
      </div>
    </fieldset>`;
  }).join('');

  container.querySelectorAll('.session-image-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const group = groups[Number(btn.dataset.groupIndex)];
      if (!group) return;
      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = '作成中…';
      try {
        const { blob, fileName } = await generateSessionImage(group);
        openImagePreview(blob, fileName);
      } catch (err) {
        console.error('結果画像の作成エラー:', err);
        alert('結果画像を作成できませんでした。');
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    });
  });

  container.querySelectorAll('.match-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('この試合の記録を削除しますか？')) return;
      await deleteDoc(doc(db, 'mahjong_records', currentUser.uid, 'matches', btn.dataset.mid));
    });
  });

  container.querySelectorAll('.match-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const match = matches.find(m => m.id === btn.dataset.mid);
      if (!match) return;
      const displayRow = btn.closest('tr');
      displayRow.replaceWith(buildEditRow(match, displayRow));
    });
  });

  renderAlltimeTotals(allMatches);
}

// Build an inline edit <tr> for a match
function buildEditRow(match, displayRow) {
  const tr = document.createElement('tr');
  tr.className = 'edit-row';

  const colPlayers = (match.players || []).slice().sort((a, b) => a.name < b.name ? -1 : 1);

  const labelTd = document.createElement('td');
  labelTd.className = 'date-cell';
  labelTd.textContent = formatMatchTime(match.recordedAt);
  tr.appendChild(labelTd);

  const inputs = colPlayers.map(p => {
    const td = document.createElement('td');
    td.className = 'edit-player-cell';

    const nameInp = document.createElement('input');
    nameInp.type = 'text';
    nameInp.value = cleanName(p.name);
    nameInp.className = 'name-edit-input player-name-input';
    nameInp.placeholder = '名前';
    makeAutocomplete(nameInp, () => playerHistory);

    const ptInp = document.createElement('input');
    ptInp.type = 'number';
    ptInp.value = typeof p.pt === 'number' ? p.pt : 0;
    ptInp.className = 'pt-edit-input';

    td.append(nameInp, ptInp);
    tr.appendChild(td);
    return { nameInp, ptInp, original: p };
  });

  const actionTd = document.createElement('td');
  actionTd.className = 'match-actions-cell';
  const sumSpan = document.createElement('span');
  sumSpan.className = 'edit-sum';
  const saveBtn = document.createElement('button');
  saveBtn.textContent = '保存';
  saveBtn.className = 'edit-save-btn';
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '×';
  cancelBtn.className = 'rec-del-btn';
  actionTd.append(sumSpan, saveBtn, cancelBtn);
  tr.appendChild(actionTd);

  function checkSum() {
    const sum = inputs.reduce((s, item) => s + (Number(item.ptInp.value) || 0), 0);
    const rounded = Math.round(sum * 10) / 10;
    const ok = Math.abs(rounded) < 1e-9;
    sumSpan.textContent = ok ? '合計: 0 ✓' : `合計: ${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}`;
    sumSpan.className = 'edit-sum ' + (ok ? 'sum-ok' : 'sum-ng');
    saveBtn.disabled = !ok;
  }

  inputs.forEach(item => item.ptInp.addEventListener('input', checkSum));
  checkSum();

  cancelBtn.addEventListener('click', () => tr.replaceWith(displayRow));

  saveBtn.addEventListener('click', async () => {
    const sum = inputs.reduce((s, item) => s + (Number(item.ptInp.value) || 0), 0);
    if (Math.abs(Math.round(sum * 10) / 10) > 1e-9) return;
    const updatedPlayers = inputs.map((item, i) => ({
      ...item.original,
      name: cleanName(item.nameInp.value, `P${i + 1}`),
      pt: Number(item.ptInp.value) || 0
    }));

    saveBtn.disabled = true;
    saveBtn.textContent = '保存中';
    try {
      const patch = { players: updatedPlayers };
      if (match.tableGame) patch.tableGame = syncTableGameNames(match.tableGame, updatedPlayers);
      await updateDoc(doc(db, 'mahjong_records', currentUser.uid, 'matches', match.id), patch);
      updateHistoryWithNames(updatedPlayers.map(p => p.name));
      await savePlayerHistory();
    } catch (err) {
      console.error('保存エラー:', err);
      alert('保存に失敗しました。');
      saveBtn.disabled = false;
      saveBtn.textContent = '保存';
    }
  });

  return tr;
}

// ====== mahjong-table import ======
function applyTableImport() {
  try {
    const raw = localStorage.getItem('mahjong_table_import');
    if (!raw) return;
    localStorage.removeItem('mahjong_table_import');

    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.players) || data.players.length !== 4) return;

    // Sort by score descending to get rank order
    const sorted = data.players.slice().sort((a, b) => b.score - a.score);
    if (data.tableGame?.playerNames) {
      setTableSeatNames(data.tableGame.playerNames, false);
    } else {
      setTableSeatNames(data.players.map(p => p.name), false);
    }
    resetScoreRankSelections();

    // Fill score inputs (mahjong uses 百点単位: divide by 100)
    // s1_1 is auto-calculated; fill s2_1, s3_1, s4_1
    el('s2_1').value = Math.round(sorted[1].score / 100);
    el('s3_1').value = Math.round(sorted[2].score / 100);
    el('s4_1').value = Math.round(sorted[3].score / 100);

    pendingTableGame = data.tableGame || null;
    if (data.kyotaku && data.settingKyotakuEnd === 'exclude') {
      if (!pendingTableGame) pendingTableGame = {};
      pendingTableGame.kyotakuExcluded = Math.round(Number(data.kyotaku) / 100);
    }
    [1, 2, 3, 4].forEach((rank, i) => {
      const inp = el(`sn${rank}_1`);
      if (inp) inp.value = cleanName(sorted[i].name, `P${rank}`);
    });
    computeTab1();

    const banner = el('import-banner');
    if (banner) banner.style.display = 'flex';
  } catch {}
}

applyTableImport();

// ====== Tab 4: 逆転計算 ======
let oppIdx4 = 0;

function ceilTo100(x) {
  return x <= 0 ? 0 : Math.ceil(x / 100) * 100;
}

// 飜/符 → 支払い lookup
// Valid fu per han (matches cbFuOptions in mahjong-table)
const HAND4_FU_BY_HAN = {
  1: [30, 40, 50, 60, 70, 80, 90, 100, 110],
  2: [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110],
  3: [20, 25, 30, 40, 50, 60],
  4: [20, 25, 30],
};
const HAND4_MANGAN = { ronOya: 12000, ronKo: 8000, tsumoOya: 4000, tsumoKo: 2000 };
const HAND4_ABOVE = {
  ronOya:   [[12000,'満貫'],[18000,'跳満'],[24000,'倍満'],[36000,'三倍満'],[48000,'役満']],
  ronKo:    [[8000,'満貫'],[12000,'跳満'],[16000,'倍満'],[24000,'三倍満'],[32000,'役満']],
  tsumoOya: [[4000,'満貫'],[6000,'跳満'],[8000,'倍満'],[12000,'三倍満'],[16000,'役満']],
  tsumoKo:  [[2000,'満貫'],[3000,'跳満'],[4000,'倍満'],[6000,'三倍満'],[8000,'役満']],
};

// Returns {label, pay, alt?} for the minimum valid hand achieving required base payment.
// Priority: minimum payment → minimum fu → minimum han.
// When best.fu > 50 (unrealistic), also sets alt: {label, pay} restricted to fu ≤ 50.
// Checks mangan+ table only; returns {label, pay} or null.
function findManganPlus4(required, mode, tsumoOppIsOya, tieOk) {
  if (mode === 'tsumoKo') {
    const above = [[2000, 4000, '満貫'], [3000, 6000, '跳満'], [4000, 8000, '倍満'], [6000, 12000, '三倍満'], [8000, 16000, '役満']];
    for (const [ko, dealer, lbl] of above) {
      const netChange = tsumoOppIsOya ? (2 * ko + 2 * dealer) : (3 * ko + dealer);
      if (tieOk ? netChange >= required : netChange > required) return { label: lbl, pay: ko };
    }
  } else {
    for (const [amt, lbl] of HAND4_ABOVE[mode]) {
      if (tieOk ? amt >= required : amt > required) return { label: lbl, pay: amt };
    }
  }
  return null;
}

// required: for tsumoKo = raw diff (points); for other modes = min payment needed
// tsumoOppIsOya: opponent is dealer (affects tsumoKo net-change formula)
function minHand4(required, mode, tsumoOppIsOya = false, tieOk = false) {
  if (required <= 0) return { label: '任意', pay: 0 };

  const manganPay = HAND4_MANGAN[mode];
  const isRon = mode.startsWith('ron');

  function search(fuLimit) {
    let minPay = Infinity, best = null;
    for (let han = 1; han <= 4; han++) {
      for (const fu of HAND4_FU_BY_HAN[han]) {
        if (fu > fuLimit) continue;
        if (isRon && fu === 20) continue;   // 20符はツモのみ
        if (fu === 25 && han < 2) continue; // 七対子は2飜以上
        const basic = fu * (1 << (han + 2));
        if (mode === 'tsumoKo') {
          const ko = Math.ceil(basic / 100) * 100;
          if (ko >= manganPay) continue;
          const dealer = Math.ceil(basic * 2 / 100) * 100;
          // net score swing = my gain + opp loss
          const netChange = tsumoOppIsOya ? (2 * ko + 2 * dealer) : (3 * ko + dealer);
          if (tieOk ? netChange < required : netChange <= required) continue;
          if (ko < minPay || (ko === minPay && (fu < best.fu || (fu === best.fu && han < best.han)))) {
            minPay = ko; best = { han, fu };
          }
        } else {
          let raw;
          if (mode === 'ronOya')        raw = Math.ceil(basic * 6 / 100) * 100;
          else if (mode === 'ronKo')    raw = Math.ceil(basic * 4 / 100) * 100;
          else /* tsumoOya */           raw = Math.ceil(basic * 2 / 100) * 100;
          if (raw >= manganPay || (tieOk ? raw < required : raw <= required)) continue;
          if (raw < minPay || (raw === minPay && (fu < best.fu || (fu === best.fu && han < best.han)))) {
            minPay = raw; best = { han, fu };
          }
        }
      }
    }
    return best ? { han: best.han, fu: best.fu, pay: minPay } : null;
  }

  const b = search(110);
  if (b) {
    if (b.fu > 50) {
      // Prefer realistic (fu ≤ 50) result as primary; fall back to mangan+ if needed
      const a = search(50) || findManganPlus4(required, mode, tsumoOppIsOya, tieOk);
      if (a) {
        return {
          ...(a.han != null ? { label: `${a.han}飜${a.fu}符`, han: a.han, fu: a.fu } : { label: a.label }),
          pay: a.pay,
          alt: { label: `${b.han}飜${b.fu}符`, pay: b.pay, han: b.han, fu: b.fu }
        };
      }
    }
    return { label: `${b.han}飜${b.fu}符`, pay: b.pay, han: b.han, fu: b.fu };
  }

  const mg = findManganPlus4(required, mode, tsumoOppIsOya, tieOk);
  return mg || { label: '役満でも届かない', pay: null };
}



function revCell4(required, mode, honba, tsumoOppIsOya = false, tieOk = false, scores = null) {
  const h = minHand4(required, mode, tsumoOppIsOya, tieOk);
  if (h.label === '任意') return '<span class="rev-any">任意でOK</span>';
  if (h.pay === null) return '<span class="rev-tag rev-tag-ng">達成不可</span>';

  function getDealer(hand) {
    return (hand.han != null && hand.fu != null)
      ? Math.ceil(hand.fu * (1 << (hand.han + 2)) * 2 / 100) * 100
      : hand.pay * 2;
  }

  function payStr(hand) {
    const { label, pay } = hand;
    const bold = `<strong>${label}</strong>`;
    if (mode === 'tsumoOya') {
      const act = pay + honba * 100;
      return honba > 0
        ? `${bold} 本場込 ${act.toLocaleString()}点オール`
        : `${bold} ${pay.toLocaleString()}点オール`;
    }
    if (mode === 'tsumoKo') {
      const dealer = getDealer(hand);
      const act_ko = pay + honba * 100, act_dealer = dealer + honba * 100;
      return honba > 0
        ? `${bold} 本場込 ${act_ko.toLocaleString()}-${act_dealer.toLocaleString()}点`
        : `${bold} ${pay.toLocaleString()}-${dealer.toLocaleString()}点`;
    }
    const act = pay + honba * 300;
    return honba > 0
      ? `${bold} 本場込 ${act.toLocaleString()}点`
      : `${bold} ${pay.toLocaleString()}点`;
  }

  function scoreStr(hand) {
    if (!scores) return '';
    let myGain, oppLoss;
    if (mode === 'tsumoOya') {
      const act = hand.pay + honba * 100;
      myGain  = 3 * act;
      oppLoss = act;
    } else if (mode === 'tsumoKo') {
      const dealer   = getDealer(hand);
      const act_ko   = hand.pay + honba * 100;
      const act_deal = dealer   + honba * 100;
      myGain  = 2 * act_ko + act_deal;
      oppLoss = tsumoOppIsOya ? act_deal : act_ko;
    } else {
      // ron (ronOya / ronKo)
      const act = hand.pay + honba * 300;
      myGain  = act;
      oppLoss = scores.oppPays ? act : 0;
    }
    const myFinal  = scores.my  + myGain + (scores.kyoutaku || 0);
    const oppFinal = scores.opp - oppLoss;
    const winning  = myFinal > oppFinal;
    const myStyle  = `color:${winning ? '#059669' : '#dc2626'};font-weight:600`;
    return `<span class="rev-final">→ <span style="${myStyle}">${myFinal.toLocaleString()}点</span> / 相手 ${oppFinal.toLocaleString()}点</span>`;
  }

  let html = payStr(h) + scoreStr(h);
  if (h.alt) {
    html += `<span class="rev-alt">または ${payStr(h.alt)}</span>`;
  }
  return html;
}

function computeTab4() {
  const honba    = Number(el('honba4').value    || 0);
  const kyoutaku = Number(el('kyoutaku4').value || 0) * 1000;
  const tieOk = el('tie4').checked;
  const myScore = Number(el('my-score4').value || 0) * 100;
  // Keep auto opponent score in sync (100,000 − me − manual opponents)
  const autoRow = document.querySelector('#opponents4 .opp-row[data-auto]');
  if (autoRow) {
    const manualTotal = Array.from(
      document.querySelectorAll('#opponents4 .opp-row:not([data-auto]) .opp-score')
    ).reduce((s, inp) => s + Number(inp.value || 0) * 100, 0);
    autoRow.querySelector('.opp-score').value = (100000 - myScore - manualTotal) / 100;
  }
  const isMyOya = el('my-role4').value === 'oya';
  const opponents = Array.from(document.querySelectorAll('#opponents4 .opp-row')).map((row, i) => ({
    name: row.querySelector('.opp-name').value.trim() || `相手${i + 1}`,
    score: Number(row.querySelector('.opp-score').value || 0) * 100,
    isOya: row.querySelector('.opp-role').value === 'oya'
  }));

  const result = el('result4');
  if (opponents.length === 0) { result.innerHTML = ''; return; }

  result.innerHTML = opponents.map(opp => {
    const diff = opp.score - myScore;

    const hdr = `<div class="rev-card-hdr">
      <span class="rev-opp-name">${escHtml(opp.name)}</span>
      <span class="rev-diff">${opp.score.toLocaleString()} − ${myScore.toLocaleString()} = <strong>${Math.abs(diff).toLocaleString()}点差</strong></span>
    </div>`;

    if (diff < 0) return `<div class="rev-card">${hdr}<p class="rev-ahead">✓ 既にトップ</p></div>`;
    if (diff === 0) return `<div class="rev-card">${hdr}<p class="rev-ahead">${tieOk ? '同点可ルール — 任意の和了でOK' : '△ 同点 — 逆転には1点以上の差が必要'}</p></div>`;

    const h400 = honba * 400;
    const h300 = honba * 300;
    const h600 = honba * 600;

    // 必要な基本支払い（本場なし）
    // 親ツモ: 4x > diff - h400   子ツモ vs親: 6x   子ツモ vs子: 5x
    // tsumoOya: 3 players each pay same amount; tsumoKo: pass raw diff for actual net-change check
    const tsumoBase  = isMyOya ? ceilTo100((diff - h400 - kyoutaku) / 4) : (diff - h400 - kyoutaku);
    const ronElseBase = ceilTo100(diff - h300 - kyoutaku);
    const ronDirBase  = ceilTo100((diff - h600 - kyoutaku) / 2);

    const tsumoMode = isMyOya ? 'tsumoOya' : 'tsumoKo';
    const ronMode   = isMyOya ? 'ronOya'   : 'ronKo';

    return `<div class="rev-card">
      ${hdr}
      <table class="rev-tbl">
        <thead><tr><th>和了</th><th>必要な手</th></tr></thead>
        <tbody>
          <tr>
            <td class="rev-method">ツモ</td>
            <td class="rev-amount">${revCell4(tsumoBase, tsumoMode, honba, opp.isOya, tieOk, { my: myScore, opp: opp.score, oppPays: true,  kyoutaku })}</td>
          </tr>
          <tr>
            <td class="rev-method">他家ロン</td>
            <td class="rev-amount">${revCell4(ronElseBase, ronMode, honba, false, tieOk, { my: myScore, opp: opp.score, oppPays: false, kyoutaku })}</td>
          </tr>
          <tr>
            <td class="rev-method">直撃</td>
            <td class="rev-amount">${revCell4(ronDirBase, ronMode, honba, false, tieOk, { my: myScore, opp: opp.score, oppPays: true,  kyoutaku })}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
  }).join('');
}

function addOppRow4(idx) {
  const div = document.createElement('div');
  div.className = 'opp-row';
  div.innerHTML = `
    <input class="opp-name player-name-input" placeholder="相手${idx}" autocomplete="off">
    <input class="opp-score score-num" type="number" value="250" min="0">
    <select class="opp-role">
      <option value="ko">子</option>
      <option value="oya">親</option>
    </select>
    <button class="opp-del-btn rec-del-btn" title="削除">×</button>
  `;
  div.querySelector('.opp-del-btn').addEventListener('click', () => {
    div.remove();
    document.querySelector('#opponents4 .opp-row[data-auto]')?.remove();
    updateDeleteButtons4();
    updateAddButton4();
    computeTab4();
  });
  ['input', 'change'].forEach(ev => {
    div.querySelector('.opp-name').addEventListener(ev, computeTab4);
    div.querySelector('.opp-score').addEventListener(ev, computeTab4);
  });
  makeAutocomplete(div.querySelector('.opp-name'), () => playerHistory);
  const roleEl = div.querySelector('.opp-role');
  roleEl.addEventListener('change', () => { enforceOya4(roleEl); computeTab4(); });
  el('opponents4').appendChild(div);
}

function addAutoOpp4(idx) {
  const div = document.createElement('div');
  div.className = 'opp-row opp-row-auto';
  div.dataset.auto = 'true';
  div.innerHTML = `
    <input class="opp-name player-name-input" placeholder="相手${idx}" autocomplete="off">
    <input class="opp-score score-num" type="number" value="0" readonly tabindex="-1">
    <select class="opp-role">
      <option value="ko">子</option>
      <option value="oya">親</option>
    </select>
    <span class="opp-del-placeholder auto-badge-cell"><span class="auto-badge">自動</span></span>
  `;
  ['input', 'change'].forEach(ev =>
    div.querySelector('.opp-name').addEventListener(ev, computeTab4)
  );
  makeAutocomplete(div.querySelector('.opp-name'), () => playerHistory);
  const roleEl = div.querySelector('.opp-role');
  roleEl.addEventListener('change', () => { enforceOya4(roleEl); computeTab4(); });
  el('opponents4').appendChild(div);
}

function updateDeleteButtons4() {
  const manualRows = document.querySelectorAll('#opponents4 .opp-row:not([data-auto])');
  const show = manualRows.length > 1;
  manualRows.forEach(row => {
    const btn = row.querySelector('.opp-del-btn');
    if (btn) btn.style.display = show ? '' : 'none';
  });
}

function updateAddButton4() {
  const hasAuto = !!document.querySelector('#opponents4 .opp-row[data-auto]');
  el('add-opp4').style.display = hasAuto ? 'none' : '';
}

function enforceOya4(changedEl) {
  if (changedEl.value !== 'oya') return;
  const myRole = el('my-role4');
  if (myRole !== changedEl) myRole.value = 'ko';
  document.querySelectorAll('#opponents4 .opp-role').forEach(sel => {
    if (sel !== changedEl) sel.value = 'ko';
  });
}

addOppRow4(++oppIdx4);
updateDeleteButtons4();

el('add-opp4').addEventListener('click', () => {
  addOppRow4(++oppIdx4);
  addAutoOpp4(++oppIdx4);
  updateDeleteButtons4();
  updateAddButton4();
  computeTab4();
});
['input', 'change'].forEach(ev => {
  el('honba4').addEventListener(ev, computeTab4);
  el('kyoutaku4').addEventListener(ev, computeTab4);
  el('my-score4').addEventListener(ev, computeTab4);
});
el('my-role4').addEventListener('change', () => { enforceOya4(el('my-role4')); computeTab4(); });
el('tie4').addEventListener('change', computeTab4);
computeTab4();

// ====== Tab 3: All-time totals ======
function renderAlltimeTotals(allMatches) {
  const totalsMap = {};
  let totalMatches = 0;

  allMatches.forEach(m => {
    totalMatches++;
    (m.players || []).forEach(p => {
      if (!p || !p.name) return;
      totalsMap[p.name] = (totalsMap[p.name] || 0) + (typeof p.pt === 'number' ? p.pt : 0);
    });
  });

  const entries = Object.entries(totalsMap).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    el('alltime-section').style.display = 'none';
    return;
  }

  el('alltime-section').style.display = 'block';
  el('alltime-table').innerHTML = `
    <p class="note">のべ ${totalMatches} 試合</p>
    <table class="records-tbl alltime-tbl">
      <tbody>
        ${entries.map(([name, pt]) => `
          <tr>
            <td class="date-cell alltime-name">${escHtml(name)}</td>
            <td class="${ptClass(pt)}">${fmtPt(pt)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

initImagePreviewDialog();

