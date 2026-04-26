import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp, deleteDoc, doc,
  updateDoc, arrayUnion, arrayRemove, getDoc, setDoc
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
let sessionsUnsubscribe = null;
let sessions = [];
let activeSession = null;
let myName = '';
let playerHistory = [];

// Previous values for rank dropdowns — used for swap-on-duplicate logic
let rankPrevVals = ['0', '1', '2', '3'];

// ====== Tab switching ======
document.querySelectorAll('.tabbtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabbtn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ====== Tab 1: ウマ/オカ精算 ======
const init1 = el('init1'), oka1 = el('oka1'), uma1 = el('uma1'), rate1 = el('rate1');
const s1_1 = el('s1_1'), s2_1 = el('s2_1'), s3_1 = el('s3_1'), s4_1 = el('s4_1');
const r1_1 = el('r1_1'), r2_1 = el('r2_1'), r3_1 = el('r3_1'), r4_1 = el('r4_1');
const decimal1 = el('decimal1');

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

  const RS2 = S2 * 100, RS3 = S3 * 100, RS4 = S4 * 100;
  const okaPt = (O * 100) / 1000;

  const p2 = thousandRoundPt1(RS2) + UX - okaPt;
  const p3 = thousandRoundPt1(RS3) - UX - okaPt;
  const p4 = thousandRoundPt1(RS4) - UY - okaPt;
  const p1 = -(p2 + p3 + p4);

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
}

['input', 'change'].forEach(ev => {
  [init1, oka1, uma1, rate1, s2_1, s3_1, s4_1, decimal1].forEach(e =>
    e.addEventListener(ev, computeTab1)
  );
});

computeTab1();

// ====== Record section (Tab 1 bottom) ======
function updateRecordSection() {
  const needsLogin = el('record-needs-login');
  const noSession  = el('record-no-session');
  const loggedIn   = el('record-logged-in');

  if (!currentUser) {
    needsLogin.style.display = 'block';
    noSession.style.display  = 'none';
    loggedIn.style.display   = 'none';
    return;
  }
  if (!activeSession) {
    needsLogin.style.display = 'none';
    noSession.style.display  = 'block';
    loggedIn.style.display   = 'none';
    return;
  }

  needsLogin.style.display = 'none';
  noSession.style.display  = 'none';
  loggedIn.style.display   = 'block';

  const date = activeSession.createdAt
    ? activeSession.createdAt.toDate().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
    : '?';
  el('active-session-label').textContent =
    `記録先: ${date} — ${(activeSession.players || []).join(' / ')}`;

  const players = activeSession.players || ['P1', 'P2', 'P3', 'P4'];
  ['ra1', 'ra2', 'ra3', 'ra4'].forEach((id, rankIdx) => {
    const sel = el(id);
    if (!sel) return;
    const curVal = sel.value;
    sel.innerHTML = players.map((n, i) => `<option value="${i}">${escHtml(n)}</option>`).join('');
    sel.value = (curVal !== '' && Number(curVal) < players.length) ? curVal : String(rankIdx);
    if (!sel.value) sel.value = String(rankIdx);
  });

  // Sync swap-tracking array after repopulating dropdowns
  rankPrevVals = ['ra1', 'ra2', 'ra3', 'ra4'].map(id => el(id).value);

  if (lastResult) {
    [1, 2, 3, 4].forEach(rank => {
      const ptEl = el(`ra${rank}-pt`);
      if (ptEl) ptEl.textContent = `${lastResult.ptStrs[rank - 1]}pt`;
    });
  }
}

// Swap-on-duplicate: when a dropdown is changed to a value already held by
// another dropdown, swap the two so no player appears twice.
;['ra1', 'ra2', 'ra3', 'ra4'].forEach((id, i) => {
  el(id).addEventListener('change', () => {
    const newVal = el(id).value;
    const oldVal = rankPrevVals[i];
    if (newVal === oldVal) return;

    const conflictIdx = rankPrevVals.findIndex((v, j) => j !== i && v === newVal);
    if (conflictIdx >= 0) {
      const conflictId = ['ra1', 'ra2', 'ra3', 'ra4'][conflictIdx];
      el(conflictId).value = oldVal;
      rankPrevVals[conflictIdx] = oldVal;
    }
    rankPrevVals[i] = newVal;
  });
});

el('record-btn').addEventListener('click', async () => {
  if (!currentUser || !activeSession || !lastResult) return;

  const players = activeSession.players || ['P1', 'P2', 'P3', 'P4'];
  const playerRecords = [null, null, null, null];
  const usedSlots = new Set();

  for (let rankIdx = 0; rankIdx < 4; rankIdx++) {
    const slotIdx = Number(el(`ra${rankIdx + 1}`).value);
    if (!usedSlots.has(slotIdx)) {
      playerRecords[slotIdx] = {
        name: players[slotIdx] || `P${slotIdx + 1}`,
        pt: lastResult.pts[rankIdx],
        rank: rankIdx + 1
      };
      usedSlots.add(slotIdx);
    }
  }
  playerRecords.forEach((r, i) => {
    if (!r) playerRecords[i] = { name: players[i] || `P${i + 1}`, pt: 0, rank: null };
  });

  const matchRecord = { recordedAt: new Date().toISOString(), players: playerRecords };

  const btn = el('record-btn');
  const msg = el('record-success');
  btn.disabled = true;
  btn.textContent = '記録中...';

  try {
    await updateDoc(
      doc(db, 'mahjong_records', currentUser.uid, 'sessions', activeSession.id),
      { matches: arrayUnion(matchRecord) }
    );
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
    subscribeSessions();
  } else {
    if (sessionsUnsubscribe) { sessionsUnsubscribe(); sessionsUnsubscribe = null; }
    sessions = [];
    activeSession = null;
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
  updatePlayerHistoryDatalist();
  renderPlayerHistory();
}

function updatePlayerHistoryDatalist() {
  const inputIds = ['ns-p1', 'ns-p2', 'ns-p3', 'ns-p4'];
  const taken = inputIds.map(id => { const inp = el(id); return inp ? inp.value.trim() : ''; });
  inputIds.forEach((_, i) => {
    const dl = el(`phd-${i + 1}`);
    if (!dl) return;
    const others = new Set(taken.filter((v, j) => j !== i && v !== ''));
    dl.innerHTML = playerHistory.filter(n => !others.has(n)).map(n => `<option value="${escHtml(n)}">`).join('');
  });
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
  updatePlayerHistoryDatalist();
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
      if (!confirm(`「${name}」をプレイヤー履歴と全試合記録から削除しますか？\nこの操作は取り消せません。`)) return;
      btn.disabled = true;

      playerHistory = playerHistory.filter(n => n !== name);
      await savePlayerHistory();

      for (const session of sessions) {
        const inPlayers = (session.players || []).includes(name);
        const inMatches = (session.matches || []).some(m => (m.players || []).some(p => p.name === name));
        if (!inPlayers && !inMatches) continue;
        const newPlayers = (session.players || []).filter(p => p !== name);
        const newMatches = (session.matches || []).map(m => ({
          ...m,
          players: (m.players || []).filter(p => p.name !== name)
        }));
        await updateDoc(
          doc(db, 'mahjong_records', currentUser.uid, 'sessions', session.id),
          { players: newPlayers, matches: newMatches }
        );
      }
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

// ====== Tab 3: Session management ======
el('new-session-toggle').addEventListener('click', () => {
  el('new-session-form').style.display = 'block';
  el('new-session-toggle').style.display = 'none';
  if (myName && !el('ns-p1').value) el('ns-p1').value = myName;
  updatePlayerHistoryDatalist();
  (myName ? el('ns-p2') : el('ns-p1')).focus();
});

['ns-p1', 'ns-p2', 'ns-p3', 'ns-p4'].forEach(id => {
  el(id).addEventListener('input', updatePlayerHistoryDatalist);
});

el('cancel-session-btn').addEventListener('click', () => {
  el('new-session-form').style.display = 'none';
  el('new-session-toggle').style.display = 'block';
});

el('create-session-btn').addEventListener('click', async () => {
  const rawNames = ['ns-p1', 'ns-p2', 'ns-p3', 'ns-p4'].map(id => el(id).value.trim());
  const filledNames = rawNames.filter(n => n !== '');
  if (new Set(filledNames).size < filledNames.length) {
    alert('プレイヤー名が重複しています。それぞれ異なる名前を入力してください。');
    return;
  }
  const players = rawNames.map((n, i) => n || `P${i + 1}`);

  const btn = el('create-session-btn');
  btn.disabled = true;
  btn.textContent = '作成中...';

  try {
    await addDoc(
      collection(db, 'mahjong_records', currentUser.uid, 'sessions'),
      { createdAt: serverTimestamp(), players, matches: [] }
    );
    updateHistoryWithNames(players);
    await savePlayerHistory();
    ['ns-p1', 'ns-p2', 'ns-p3', 'ns-p4'].forEach(id => { el(id).value = ''; });
    el('new-session-form').style.display = 'none';
    el('new-session-toggle').style.display = 'block';
  } catch (err) {
    console.error('セッション作成エラー:', err);
    alert('ゲームの作成に失敗しました。');
  } finally {
    btn.disabled = false;
    btn.textContent = '作成';
  }
});

function subscribeSessions() {
  const ref = collection(db, 'mahjong_records', currentUser.uid, 'sessions');
  const q = query(ref, orderBy('createdAt', 'desc'));
  sessionsUnsubscribe = onSnapshot(q, (snap) => {
    sessions = [];
    snap.forEach(d => sessions.push({ id: d.id, ...d.data() }));
    activeSession = sessions[0] || null;
    renderSessions(sessions);
    updateRecordSection();
  });
}

// ====== Helpers ======
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtPt(pt) {
  if (typeof pt !== 'number' || isNaN(pt)) return '—';
  const str = Number.isInteger(pt) ? String(pt) : pt.toFixed(1);
  return `${pt > 0 ? '+' : ''}${str}pt`;
}

const ptClass = pt => pt > 0 ? 'pt-pos' : pt < 0 ? 'pt-neg' : '';

// ====== Tab 3: Render sessions ======
function renderSessions(sessions) {
  const container = el('sessions-list');

  if (sessions.length === 0) {
    container.innerHTML = '<p class="muted sessions-empty">まだゲームがありません。</p>';
    el('alltime-section').style.display = 'none';
    return;
  }

  container.innerHTML = sessions.map(session => {
    const date = session.createdAt
      ? session.createdAt.toDate().toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' })
      : '?';
    const players = session.players || [];
    const matches = (session.matches || []).slice().sort((a, b) => a.recordedAt < b.recordedAt ? -1 : 1);

    const totals = players.map(() => 0);
    matches.forEach(m => {
      (m.players || []).forEach((p, i) => { totals[i] += (p && typeof p.pt === 'number') ? p.pt : 0; });
    });

    const matchRows = matches.length === 0
      ? '<tr><td colspan="99" class="muted" style="text-align:center;padding:12px">まだ試合がありません</td></tr>'
      : matches.map((m, mi) => {
          const mPlayers = m.players || [];
          return `<tr data-rid="${escHtml(session.id)}" data-midx="${mi}">
            <td class="date-cell">${mi + 1}試合目</td>
            ${mPlayers.map(p => {
              const pt = (p && typeof p.pt === 'number') ? p.pt : 0;
              return `<td class="${ptClass(pt)}">${fmtPt(pt)}</td>`;
            }).join('')}
            <td class="match-actions-cell">
              <button class="rec-del-btn match-edit-btn" data-sid="${escHtml(session.id)}" data-midx="${mi}" title="編集">✎</button>
              <button class="rec-del-btn match-del-btn"  data-sid="${escHtml(session.id)}" data-midx="${mi}" title="削除">×</button>
            </td>
          </tr>`;
        }).join('');

    return `
    <fieldset class="session-card">
      <legend class="session-legend">${escHtml(date)}</legend>
      <div class="session-players-row" data-sid="${escHtml(session.id)}">
        <span class="session-players-text">${players.map(escHtml).join(' · ')}</span>
        <button class="players-edit-btn rec-del-btn" data-sid="${escHtml(session.id)}" title="名前を編集">✎</button>
      </div>
      <div class="records-scroll">
        <table class="records-tbl">
          <thead><tr>
            <th></th>
            ${players.map(n => `<th>${escHtml(n)}</th>`).join('')}
            <th></th>
          </tr></thead>
          <tbody>${matchRows}</tbody>
          <tfoot><tr class="totals-row">
            <th>合計</th>
            ${totals.map(t => `<th class="${ptClass(t)}">${fmtPt(t)}</th>`).join('')}
            <th></th>
          </tr></tfoot>
        </table>
      </div>
      <div class="session-footer">
        <span class="muted" style="font-size:12px">${matches.length}試合</span>
        <button class="session-del-btn" data-id="${escHtml(session.id)}">このゲームを削除</button>
      </div>
    </fieldset>`;
  }).join('');

  // Delete session
  container.querySelectorAll('.session-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('このゲームとすべての試合記録を削除しますか？')) return;
      await deleteDoc(doc(db, 'mahjong_records', currentUser.uid, 'sessions', btn.dataset.id));
    });
  });

  // Delete match
  container.querySelectorAll('.match-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('この試合の記録を削除しますか？')) return;
      const sid = btn.dataset.sid;
      const midx = Number(btn.dataset.midx);
      const session = sessions.find(s => s.id === sid);
      if (!session) return;
      const sorted = (session.matches || []).slice().sort((a, b) => a.recordedAt < b.recordedAt ? -1 : 1);
      const target = sorted[midx];
      if (!target) return;
      await updateDoc(
        doc(db, 'mahjong_records', currentUser.uid, 'sessions', sid),
        { matches: arrayRemove(target) }
      );
    });
  });

  // Edit player names
  container.querySelectorAll('.players-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.sid;
      const session = sessions.find(s => s.id === sid);
      if (!session) return;

      const row = btn.closest('.session-players-row');
      const players = session.players || [];
      row.innerHTML = '';

      const grid = document.createElement('div');
      grid.className = 'player-edit-grid';
      const inputs = players.map((name, i) => {
        const inp = document.createElement('input');
        inp.value = name;
        inp.placeholder = `P${i + 1}`;
        inp.className = 'player-name-input';
        grid.appendChild(inp);
        return inp;
      });

      const actions = document.createElement('div');
      actions.className = 'player-edit-actions';
      const saveBtn = document.createElement('button');
      saveBtn.textContent = '保存';
      saveBtn.className = 'edit-save-btn';
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'キャンセル';
      cancelBtn.className = 'logout-btn';
      actions.append(saveBtn, cancelBtn);
      row.append(grid, actions);

      cancelBtn.addEventListener('click', () => renderSessions(sessions));

      saveBtn.addEventListener('click', async () => {
        const rawInputs = inputs.map(inp => inp.value.trim());
        const filled = rawInputs.filter(n => n !== '');
        if (new Set(filled).size < filled.length) {
          alert('プレイヤー名が重複しています。');
          return;
        }
        const newPlayers = rawInputs.map((n, i) => n || `P${i + 1}`);
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';
        try {
          await updateDoc(
            doc(db, 'mahjong_records', currentUser.uid, 'sessions', sid),
            { players: newPlayers }
          );
        } catch (err) {
          console.error(err);
          alert('保存に失敗しました。');
          saveBtn.disabled = false;
          saveBtn.textContent = '保存';
        }
      });
    });
  });

  // Edit match
  container.querySelectorAll('.match-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid  = btn.dataset.sid;
      const midx = Number(btn.dataset.midx);
      const session = sessions.find(s => s.id === sid);
      if (!session) return;
      const sorted = (session.matches || []).slice().sort((a, b) => a.recordedAt < b.recordedAt ? -1 : 1);
      const match = sorted[midx];
      if (!match) return;

      const displayRow = btn.closest('tr');
      const editRow = buildEditRow(session, match, midx, displayRow);
      displayRow.replaceWith(editRow);
    });
  });

  renderAlltimeTotals(sessions);
}

// Build an inline edit <tr> for a match
function buildEditRow(session, match, midx, displayRow) {
  const tr = document.createElement('tr');
  tr.className = 'edit-row';

  // Label cell
  const labelTd = document.createElement('td');
  labelTd.className = 'date-cell';
  labelTd.textContent = `${midx + 1}試合目`;
  tr.appendChild(labelTd);

  // One input per player
  const inputs = (match.players || []).map((p, i) => {
    const td = document.createElement('td');
    const inp = document.createElement('input');
    inp.type = 'number';
    inp.value = (p && typeof p.pt === 'number') ? p.pt : 0;
    inp.className = 'pt-edit-input';
    td.appendChild(inp);
    tr.appendChild(td);
    return inp;
  });

  // Actions cell: sum indicator + save + cancel
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
    const ok = Math.abs(sum) < 1e-9;
    sumSpan.textContent = ok ? '合計: 0 ✓' : `合計: ${sum > 0 ? '+' : ''}${sum}`;
    sumSpan.className = 'edit-sum ' + (ok ? 'sum-ok' : 'sum-ng');
    saveBtn.disabled = !ok;
    return sum;
  }

  inputs.forEach(inp => inp.addEventListener('input', checkSum));
  checkSum();

  cancelBtn.addEventListener('click', () => tr.replaceWith(displayRow));

  saveBtn.addEventListener('click', async () => {
    if (Math.abs(inputs.reduce((s, inp) => s + (Number(inp.value) || 0), 0)) >= 1e-9) return;

    const updatedPlayers = (match.players || []).map((p, i) => ({
      ...p,
      pt: Number(inputs[i].value) || 0
    }));
    const updatedMatch = { ...match, players: updatedPlayers };
    const allMatches = (session.matches || []).map(m =>
      m.recordedAt === match.recordedAt ? updatedMatch : m
    );

    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    try {
      await updateDoc(
        doc(db, 'mahjong_records', currentUser.uid, 'sessions', session.id),
        { matches: allMatches }
      );
      // onSnapshot re-renders everything automatically
    } catch (err) {
      console.error('保存エラー:', err);
      alert('保存に失敗しました。');
      saveBtn.disabled = false;
      saveBtn.textContent = '保存';
    }
  });

  return tr;
}

// ====== Tab 3: All-time totals ======
function renderAlltimeTotals(sessions) {
  const totalsMap = {};
  let totalMatches = 0;

  sessions.forEach(session => {
    (session.matches || []).forEach(m => {
      totalMatches++;
      (m.players || []).forEach(p => {
        if (!p || !p.name) return;
        totalsMap[p.name] = (totalsMap[p.name] || 0) + (typeof p.pt === 'number' ? p.pt : 0);
      });
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
