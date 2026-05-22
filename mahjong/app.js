import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  orderBy, query, deleteDoc, doc,
  updateDoc, getDoc, setDoc
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


// ====== Tab switching + テーブルタブ ======
let tableIframe = null;

function getSharedPlayerNames() {
  return [
    el('sn1_1').value || '',
    el('sn2_1').value || '',
    el('sn3_1').value || '',
    el('sn4_1').value || '',
  ];
}

function sendToTable(msg) {
  if (tableIframe && tableIframe.contentWindow) {
    tableIframe.contentWindow.postMessage(msg, location.origin);
  }
}

function activateTab(tabId) {
  document.querySelectorAll('.tabbtn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const btn = document.querySelector(`[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');

  if (tabId === 't0') {
    document.body.classList.add('table-tab-active');
    if (!tableIframe) {
      tableIframe = document.createElement('iframe');
      tableIframe.src = '/mahjong-table/?embedded=1';
      tableIframe.style.cssText = 'width:100%;height:100%;border:none;display:block';
      document.getElementById('t0').appendChild(tableIframe);
    } else {
      sendToTable({ type: 'update_players', names: getSharedPlayerNames() });
    }
  } else {
    document.body.classList.remove('table-tab-active');
  }
}

document.querySelectorAll('.tabbtn').forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

if (location.hash === '#table') activateTab('t0');

window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) return;
  const msg = e.data;
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'table_ready') {
    sendToTable({ type: 'init_players', names: getSharedPlayerNames() });
    return;
  }

  if (msg.type === 'return_to_seisan') {
    activateTab('t1');
    return;
  }

  if (msg.type === 'game_end') {
    const players = msg.players;
    if (!Array.isArray(players) || players.length !== 4) return;
    pendingTableGame = msg.tableGame || null;
    el('s2_1').value = Math.round(players[1].score / 100);
    el('s3_1').value = Math.round(players[2].score / 100);
    el('s4_1').value = Math.round(players[3].score / 100);
    [1, 2, 3, 4].forEach((rank, i) => {
      const inp = el(`sn${rank}_1`);
      if (inp) inp.value = players[i].name;
    });
    computeTab1();
    const banner = el('import-banner');
    if (banner) banner.style.display = 'flex';
    activateTab('t1');
  }
});

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

  const S2 = Number(s2_1.value || 0);
  const S3 = Number(s3_1.value || 0);
  const S4 = Number(s4_1.value || 0);

  const S1 = I * 4 - S2 - S3 - S4;
  s1_1.value = S1;

  const okaPt = (O * 100) / 1000;

  let p1, p2, p3, p4;

  if (tie1 && tie1.checked) {
    const S = [S1, S2, S3, S4];

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
    const surplus = -direct.reduce((a, b) => a + b, 0);
    const maxS = Math.max(...S);
    const topCount = S.filter(s => s === maxS).length;
    [p1, p2, p3, p4] = direct.map((d, idx) => d + (S[idx] === maxS ? surplus / topCount : 0));

  } else {
    // Original formula: p1 absorbs all oka surplus (standard mahjong)
    p2 = thousandRoundPt1(S2 * 100) + UX - okaPt;
    p3 = thousandRoundPt1(S3 * 100) - UX - okaPt;
    p4 = thousandRoundPt1(S4 * 100) - UY - okaPt;
    p1 = -(p2 + p3 + p4);
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
  [init1, oka1, uma1, rate1, s2_1, s3_1, s4_1, decimal1, tie1].forEach(e =>
    e.addEventListener(ev, computeTab1)
  );
});

computeTab1();

// ====== Rank card name display (Tab 1) ======
function updateRankNames() {
  [1, 2, 3, 4].forEach(i => {
    const nameEl = el(`rn${i}_1`);
    if (!nameEl) return;
    const field = el(`sn${i}_1`);
    if (!field) { nameEl.textContent = ''; return; }
    const name = field.value.trim();
    nameEl.textContent = name ? ` · ${name}` : '';
  });
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

[1, 2, 3, 4].forEach(rank => {
  const inp = el(`sn${rank}_1`);
  if (!inp) return;
  inp.addEventListener('input', updateRankNames);
  makeAutocomplete(inp, () => getScoreInputNames(rank));
});

// ====== Record section (Tab 1 bottom) ======
function updateRecordSection() {
  const needsLogin = el('record-needs-login');
  const loggedIn   = el('record-logged-in');
  needsLogin.style.display = currentUser ? 'none' : 'block';
  loggedIn.style.display   = currentUser ? 'block' : 'none';
}

el('record-btn').addEventListener('click', async () => {
  if (!currentUser || !lastResult) return;

  const names = [1, 2, 3, 4].map(rank => el(`sn${rank}_1`)?.value.trim() || `P${rank}`);
  const playerRecords = names.map((name, i) => ({ name, pt: lastResult.pts[i], rank: i + 1 }));

  const matchRecord = { recordedAt: new Date().toISOString(), players: playerRecords };
  if (pendingTableGame) matchRecord.tableGame = pendingTableGame;

  const btn = el('record-btn');
  const msg = el('record-success');
  btn.disabled = true;
  btn.textContent = '記録中...';

  try {
    await addDoc(collection(db, 'mahjong_records', currentUser.uid, 'matches'), matchRecord);
    updateHistoryWithNames(names);
    await savePlayerHistory();
    pendingTableGame = null;
    msg.textContent = '記録しました！';
    msg.className = 'record-msg success';
    setTimeout(() => { msg.textContent = ''; msg.className = 'record-msg'; }, 3000);
  } catch (err) {
    console.error('記録エラー:', err);
    msg.textContent = '記録に失敗しました。';
    msg.className = 'record-msg error';
  } finally {
    btn.disabled = false;
    btn.textContent = 'この試合を記録する';
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
    playerHistory = snap.data().playerNames || [];
    el('my-name-input').value = myName;
  }
  try { localStorage.setItem('mahjong_playerHistory', JSON.stringify(playerHistory)); } catch {}
  renderPlayerHistory();
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
        <button class="rec-del-btn history-del-btn" data-name="${escHtml(name)}" title="削除">×</button>
      </div>`).join('')
  }</div>`;

  container.querySelectorAll('.history-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.dataset.name;
      if (!confirm(`「${name}」を候補リストから削除しますか？\n試合記録は変わりません。`)) return;
      btn.disabled = true;

      playerHistory = playerHistory.filter(n => n !== name);
      await savePlayerHistory();
    });
  });
}

el('my-name-save').addEventListener('click', async () => {
  const name = el('my-name-input').value.trim();
  myName = name;
  const msg = el('my-name-msg');
  try {
    await setDoc(
      doc(db, 'mahjong_records', currentUser.uid, 'settings', 'profile'),
      { myName: name }
    );
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

// ====== Tab 3: Group matches by date + player set ======
function groupMatches(allMatches) {
  const groups = [];
  const keyToGroup = new Map();

  allMatches.forEach(m => {
    const date = m.recordedAt
      ? new Date(m.recordedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' })
      : '?';
    const sortedNames = (m.players || []).map(p => p.name).sort().join('|');
    const key = `${date}||${sortedNames}`;

    if (!keyToGroup.has(key)) {
      const colPlayers = (m.players || []).map(p => p.name).sort();
      const group = { date, key, colPlayers, matches: [] };
      keyToGroup.set(key, group);
      groups.push(group);
    }
    keyToGroup.get(key).matches.push(m);
  });

  groups.forEach(g => g.matches.sort((a, b) => (a.recordedAt || '') < (b.recordedAt || '') ? -1 : 1));
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

  container.innerHTML = groups.map(group => {
    const { date, colPlayers, matches: gMatches } = group;

    const totals = colPlayers.map(() => 0);
    gMatches.forEach(m => {
      colPlayers.forEach((pname, ci) => {
        const found = (m.players || []).find(p => p.name === pname);
        if (found && typeof found.pt === 'number') totals[ci] += found.pt;
      });
    });

    const matchRows = gMatches.map((m, mi) => `
      <tr>
        <td class="date-cell match-label" data-time="${escHtml(formatMatchTime(m.recordedAt))}">${mi + 1}試合目</td>
        ${colPlayers.map(pname => {
          const found = (m.players || []).find(p => p.name === pname);
          const pt = found && typeof found.pt === 'number' ? found.pt : 0;
          return `<td class="${ptClass(pt)}">${fmtPt(pt)}</td>`;
        }).join('')}
        <td class="match-actions-cell">
          <button class="rec-del-btn match-edit-btn" data-mid="${escHtml(m.id)}" title="編集">✎</button>
          <button class="rec-del-btn match-del-btn"  data-mid="${escHtml(m.id)}" title="削除">×</button>
        </td>
      </tr>`).join('');

    return `
    <fieldset class="session-card">
      <legend class="session-legend">${escHtml(date)}</legend>
      <div class="session-players-row">
        <span class="session-players-text">${colPlayers.map(escHtml).join(' · ')}</span>
      </div>
      <div class="records-scroll">
        <table class="records-tbl">
          <thead><tr>
            <th></th>
            ${colPlayers.map(n => `<th>${escHtml(n)}</th>`).join('')}
            <th></th>
          </tr></thead>
          <tbody>${matchRows}</tbody>
          <tfoot><tr>
            <th>合計</th>
            ${totals.map(t => `<th class="${ptClass(t)}">${fmtPt(t)}</th>`).join('')}
            <th></th>
          </tr></tfoot>
        </table>
      </div>
      <div class="session-footer">
        <span class="muted" style="font-size:12px">${gMatches.length}試合</span>
      </div>
    </fieldset>`;
  }).join('');

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
    const inp = document.createElement('input');
    inp.type = 'number';
    inp.value = typeof p.pt === 'number' ? p.pt : 0;
    inp.className = 'pt-edit-input';
    td.appendChild(inp);
    tr.appendChild(td);
    return inp;
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
    const sum = inputs.reduce((s, inp) => s + (Number(inp.value) || 0), 0);
    const rounded = Math.round(sum * 10) / 10;
    const ok = Math.abs(rounded) < 1e-9;
    sumSpan.textContent = ok ? '合計: 0 ✓' : `合計: ${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}`;
    sumSpan.className = 'edit-sum ' + (ok ? 'sum-ok' : 'sum-ng');
    saveBtn.disabled = !ok;
  }

  inputs.forEach(inp => inp.addEventListener('input', checkSum));
  checkSum();

  cancelBtn.addEventListener('click', () => tr.replaceWith(displayRow));

  saveBtn.addEventListener('click', async () => {
    if (inputs.reduce((s, inp) => s + (Number(inp.value) || 0), 0) !== 0) return;
    const ptByName = {};
    colPlayers.forEach((p, i) => { ptByName[p.name] = Number(inputs[i].value) || 0; });
    const updatedPlayers = (match.players || []).map(p => ({ ...p, pt: ptByName[p.name] ?? p.pt }));

    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';
    try {
      await updateDoc(doc(db, 'mahjong_records', currentUser.uid, 'matches', match.id), { players: updatedPlayers });
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

    // Fill score inputs (mahjong uses 百点単位: divide by 100)
    // s1_1 is auto-calculated; fill s2_1, s3_1, s4_1
    el('s2_1').value = Math.round(sorted[1].score / 100);
    el('s3_1').value = Math.round(sorted[2].score / 100);
    el('s4_1').value = Math.round(sorted[3].score / 100);

    pendingTableGame = data.tableGame || null;
    [1, 2, 3, 4].forEach((rank, i) => {
      const inp = el(`sn${rank}_1`);
      if (inp) inp.value = sorted[i].name;
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
    return `<span class="rev-final">→ 自分 ${myFinal.toLocaleString()}点 / 相手 ${oppFinal.toLocaleString()}点</span>`;
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

    const diffLine = `<div class="rev-diff">${opp.score.toLocaleString()} − ${myScore.toLocaleString()} = <strong>${Math.abs(diff).toLocaleString()}点差</strong></div>`;

    if (diff < 0) return `<fieldset class="rev-card"><legend>${escHtml(opp.name)}</legend>
      ${diffLine}<p class="rev-ahead">既にトップ</p></fieldset>`;
    if (diff === 0) return `<fieldset class="rev-card"><legend>${escHtml(opp.name)}</legend>
      ${diffLine}<p class="rev-ahead">${tieOk ? '同点可ルール — 起家に近い方が上位（任意の和了でOK）' : '同点 — 逆転には1点以上の差が必要'}</p></fieldset>`;

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

    return `<fieldset class="rev-card">
      <legend>${escHtml(opp.name)}</legend>
      ${diffLine}
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
    </fieldset>`;
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
    <span class="opp-del-placeholder"></span>
  `;
  ['input', 'change'].forEach(ev =>
    div.querySelector('.opp-name').addEventListener(ev, computeTab4)
  );
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
