import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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

const ENTRY_KEY = "buzzer_entry_v1";
const PLAYER_KEY = "buzzer_player_id_v1";
const EVENT_TTL_MS = 6 * 60 * 60 * 1000;

const entryView = document.getElementById("entry-view");
const roomView = document.getElementById("room-view");
const roomInput = document.getElementById("room-input");
const nameInput = document.getElementById("name-input");
const randomBtn = document.getElementById("random-btn");
const hostTab = document.getElementById("host-tab");
const playerTab = document.getElementById("player-tab");
const joinBtn = document.getElementById("join-btn");
const roomCodeLabel = document.getElementById("room-code-label");
const roleLabel = document.getElementById("role-label");
const roundLabel = document.getElementById("round-label");
const winnerCard = document.getElementById("winner-card");
const winnerName = document.getElementById("winner-name");
const winnerTime = document.getElementById("winner-time");
const hostActions = document.getElementById("host-actions");
const resetBtn = document.getElementById("reset-btn");
const playerPanel = document.getElementById("player-panel");
const roomNameInput = document.getElementById("room-name-input");
const saveNameBtn = document.getElementById("save-name-btn");
const buzzBtn = document.getElementById("buzz-btn");
const playerMessage = document.getElementById("player-message");
const rankingList = document.getElementById("ranking-list");
const emptyRanking = document.getElementById("empty-ranking");
const playerCount = document.getElementById("player-count");
const qrBtn = document.getElementById("qr-btn");
const copyBtn = document.getElementById("copy-btn");
const leaveBtn = document.getElementById("leave-btn");
const qrModal = document.getElementById("qr-modal");
const qrBackdrop = document.getElementById("qr-backdrop");
const qrCloseBtn = document.getElementById("qr-close-btn");
const qrContainer = document.getElementById("qr-container");
const qrUrl = document.getElementById("qr-url");

let role = "host";
let roomCode = "";
let playerName = "";
let playerId = getPlayerId();
let unsubscribe = null;
let events = [];
let currentRound = 1;
let currentWinnerId = null;
let lastWinnerId = null;

restoreEntry();

randomBtn.addEventListener("click", () => {
  roomInput.value = makeRoomCode();
  roomInput.select();
});

hostTab.addEventListener("click", () => setRole("host"));
playerTab.addEventListener("click", () => setRole("player"));
joinBtn.addEventListener("click", enterRoom);
roomInput.addEventListener("keydown", e => {
  if (e.key === "Enter") enterRoom();
});
nameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") enterRoom();
});

resetBtn.addEventListener("click", resetRound);
buzzBtn.addEventListener("click", buzz);
saveNameBtn.addEventListener("click", saveName);
copyBtn.addEventListener("click", copyRoomUrl);
qrBtn.addEventListener("click", showQr);
leaveBtn.addEventListener("click", leaveRoom);
qrBackdrop.addEventListener("click", hideQr);
qrCloseBtn.addEventListener("click", hideQr);

function restoreEntry() {
  const saved = readJson(ENTRY_KEY) || {};
  const hashCode = normalizeCode(location.hash.slice(1));
  roomInput.value = hashCode || saved.roomCode || makeRoomCode();
  nameInput.value = saved.name || "";
  setRole(hashCode ? "player" : (saved.role || "host"));
}

function setRole(nextRole) {
  role = nextRole === "player" ? "player" : "host";
  hostTab.classList.toggle("active", role === "host");
  playerTab.classList.toggle("active", role === "player");
}

async function enterRoom() {
  const nextCode = normalizeCode(roomInput.value);
  const nextName = nameInput.value.trim() || "名無し";
  if (!nextCode) {
    roomInput.focus();
    return;
  }

  roomCode = nextCode;
  playerName = nextName;
  localStorage.setItem(ENTRY_KEY, JSON.stringify({ roomCode, name: playerName, role }));
  roomNameInput.value = playerName;
  roomCodeLabel.textContent = roomCode;
  roleLabel.textContent = role === "host" ? "親機" : "子機";
  hostActions.classList.toggle("hidden", role !== "host");
  playerPanel.classList.toggle("hidden", role !== "player");
  entryView.classList.add("hidden");
  roomView.classList.remove("hidden");
  history.replaceState(null, "", `#${roomCode}`);

  startListening();
  try {
    await sendEvent("join", { text: `[早押し] ${playerName} 参加` });
  } catch (error) {
    playerMessage.textContent = "通信エラー";
    console.error(error);
  }
}

function leaveRoom() {
  stopListening();
  roomCode = "";
  events = [];
  currentRound = 1;
  currentWinnerId = null;
  lastWinnerId = null;
  hideQr();
  roomView.classList.add("hidden");
  entryView.classList.remove("hidden");
  history.replaceState(null, "", location.pathname);
}

function startListening() {
  stopListening();
  const q = query(collection(db, "rooms", roomCode, "clips"), orderBy("createdAt", "asc"));
  unsubscribe = onSnapshot(q, snapshot => {
    events = snapshot.docs
      .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
      .filter(item => item.type === "buzzer" && item.createdAt)
      .map(item => ({ ...item, createdMs: item.createdAt.toMillis() }));
    render();
  }, error => {
    playerMessage.textContent = "通信エラー";
    console.error(error);
  });
}

function stopListening() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

async function resetRound() {
  const nextRound = currentRound + 1;
  resetBtn.disabled = true;
  try {
    await sendEvent("reset", {
      round: nextRound,
      text: `[早押し] 第${nextRound}問 リセット`
    });
  } catch (error) {
    playerMessage.textContent = "通信エラー";
    console.error(error);
  } finally {
    resetBtn.disabled = false;
  }
}

async function buzz() {
  if (currentWinnerId) return;
  saveName();
  buzzBtn.disabled = true;
  playerMessage.textContent = "送信中";
  try {
    await sendEvent("buzz", {
      round: currentRound,
      playerId,
      playerName,
      text: `[早押し] ${playerName} 回答`
    });
    vibrate();
  } catch (error) {
    buzzBtn.disabled = false;
    playerMessage.textContent = "通信エラー";
    console.error(error);
  }
}

function saveName() {
  playerName = roomNameInput.value.trim() || nameInput.value.trim() || "名無し";
  roomNameInput.value = playerName;
  nameInput.value = playerName;
  localStorage.setItem(ENTRY_KEY, JSON.stringify({ roomCode, name: playerName, role }));
  playerMessage.textContent = "名前保存済み";
}

async function sendEvent(action, extra = {}) {
  if (!roomCode) return;
  const expireAt = Timestamp.fromMillis(Date.now() + EVENT_TTL_MS);
  await addDoc(collection(db, "rooms", roomCode, "clips"), {
    type: "buzzer",
    action,
    round: extra.round || currentRound,
    playerId: extra.playerId || playerId,
    playerName: extra.playerName || playerName,
    text: extra.text || `[早押し] ${action}`,
    createdAt: serverTimestamp(),
    expireAt
  });
}

function render() {
  const resets = events.filter(item => item.action === "reset");
  const latestReset = resets[resets.length - 1];
  currentRound = latestReset ? Number(latestReset.round) || 1 : 1;

  const resetMs = latestReset ? latestReset.createdMs : 0;
  const roundBuzzes = uniqueByPlayer(events
    .filter(item => item.action === "buzz")
    .filter(item => Number(item.round) === currentRound)
    .filter(item => item.createdMs >= resetMs)
    .sort((a, b) => a.createdMs - b.createdMs));

  const players = new Map();
  events
    .filter(item => item.action === "join" || item.action === "buzz")
    .forEach(item => {
      if (item.playerId) players.set(item.playerId, item.playerName || "名無し");
    });

  const winner = roundBuzzes[0] || null;
  currentWinnerId = winner ? winner.playerId : null;

  roundLabel.textContent = `第${currentRound}問`;
  playerCount.textContent = `${players.size}人`;
  renderWinner(winner);
  renderRanking(roundBuzzes);
  renderPlayerState(winner);

  if (winner && winner.playerId !== lastWinnerId && role === "host") playChime();
  lastWinnerId = winner ? winner.playerId : null;
}

function renderWinner(winner) {
  winnerCard.classList.toggle("waiting", !winner);
  winnerName.textContent = winner ? winner.playerName || "名無し" : "待機中";
  winnerTime.textContent = winner
    ? formatTime(winner.createdMs)
    : "子機の回答を待っています";
}

function renderRanking(roundBuzzes) {
  rankingList.innerHTML = "";
  emptyRanking.classList.toggle("hidden", roundBuzzes.length > 0);
  roundBuzzes.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank-number">${index + 1}着</span>
      <span class="rank-name"></span>
      <span class="rank-time">${formatTime(item.createdMs)}</span>
    `;
    li.querySelector(".rank-name").textContent = item.playerName || "名無し";
    rankingList.appendChild(li);
  });
}

function renderPlayerState(winner) {
  if (role !== "player") return;
  const ownBuzz = events.some(item =>
    item.action === "buzz" &&
    Number(item.round) === currentRound &&
    item.playerId === playerId
  );
  buzzBtn.disabled = !!winner || ownBuzz;

  if (!winner) {
    playerMessage.textContent = "準備完了";
  } else if (winner.playerId === playerId) {
    playerMessage.textContent = "1着";
  } else {
    playerMessage.textContent = `${winner.playerName || "名無し"} さんが1着`;
  }
}

function uniqueByPlayer(items) {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.playerId)) return false;
    seen.add(item.playerId);
    return true;
  });
}

function showQr() {
  const url = roomUrl();
  qrUrl.textContent = url;
  qrContainer.innerHTML = "";
  qrModal.classList.remove("hidden");
  new QRCode(qrContainer, { text: url, width: 210, height: 210, correctLevel: QRCode.CorrectLevel.M });
}

function hideQr() {
  qrModal.classList.add("hidden");
}

async function copyRoomUrl() {
  const url = roomUrl();
  try {
    await navigator.clipboard.writeText(url);
    copyBtn.textContent = "済み";
    setTimeout(() => { copyBtn.textContent = "コピー"; }, 1200);
  } catch (_) {
    playerMessage.textContent = "コピー失敗";
  }
}

function roomUrl() {
  return `${location.origin}${location.pathname}#${roomCode}`;
}

function normalizeCode(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);
}

function makeRoomCode() {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getPlayerId() {
  let id = localStorage.getItem(PLAYER_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
    localStorage.setItem(PLAYER_KEY, id);
  }
  return id;
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch (_) {
    return null;
  }
}

function formatTime(ms) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false
  }).format(new Date(ms));
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (_) {}
}

function vibrate() {
  if (navigator.vibrate) navigator.vibrate(40);
}
