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
const BUZZER_SOUND_SRC = "quiz-button.mp3";

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
const buzzBtn = document.getElementById("buzz-btn");
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
copyBtn.addEventListener("click", copyRoomUrl);
qrBtn.addEventListener("click", showQr);
leaveBtn.addEventListener("click", leaveRoom);
qrBackdrop.addEventListener("click", hideQr);
qrCloseBtn.addEventListener("click", hideQr);
document.addEventListener("keydown", handleShortcut);

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
  entryView.classList.toggle("host-selected", role === "host");
}

function handleShortcut(e) {
  const tagName = e.target?.tagName?.toLowerCase();
  const isTyping = tagName === "input" || tagName === "textarea" || tagName === "select";
  if (isTyping || role !== "host" || !roomCode || e.code !== "Space" || e.repeat) return;
  e.preventDefault();
  if (!resetBtn.disabled) resetRound();
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
  roomCodeLabel.textContent = roomCode;
  roleLabel.textContent = role === "host" ? "親機" : "子機";
  hostActions.classList.toggle("hidden", role !== "host");
  playerPanel.classList.toggle("hidden", role !== "player");
  document.body.classList.toggle("player-room", role === "player");
  document.body.classList.toggle("host-room", role === "host");
  entryView.classList.add("hidden");
  roomView.classList.remove("hidden");
  history.replaceState(null, "", `#${roomCode}`);

  startListening();
  try {
    if (role === "player") {
      await sendEvent("join", { text: `[早押し] ${playerName} 参加` });
    }
  } catch (error) {
    buzzBtn.textContent = "通信エラー";
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
  document.body.classList.remove("player-room", "host-room");
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
      .filter(item => item.type === "buzzer")
      .map(item => ({
        ...item,
        createdMs: item.createdAt?.toMillis?.() || item.clientMs || 0
      }));
    render();
  }, error => {
    buzzBtn.textContent = "通信エラー";
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
  applyRound(nextRound);
  renderWinner(null);
  renderRanking([]);
  renderPlayerState([]);
  try {
    await sendEvent("reset", {
      round: nextRound,
      text: `[早押し] 第${nextRound}問 リセット`
    });
  } catch (error) {
    buzzBtn.textContent = "通信エラー";
    console.error(error);
  } finally {
    resetBtn.disabled = false;
  }
}

async function buzz() {
  const alreadyBuzzed = events.some(item =>
    item.action === "buzz" &&
    Number(item.round) === currentRound &&
    item.playerId === playerId
  );
  if (alreadyBuzzed) return;
  playerName = nameInput.value.trim() || playerName || "名無し";
  localStorage.setItem(ENTRY_KEY, JSON.stringify({ roomCode, name: playerName, role }));
  buzzBtn.disabled = true;
  buzzBtn.textContent = "送信中";
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
    buzzBtn.textContent = "通信エラー";
    console.error(error);
  }
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
    clientMs: Date.now(),
    createdAt: serverTimestamp(),
    expireAt
  });
}

function render() {
  const resets = events
    .filter(item => item.action === "reset")
    .sort((a, b) => Number(a.round) - Number(b.round));
  const latestReset = resets[resets.length - 1];
  applyRound(latestReset ? Number(latestReset.round) || 1 : currentRound);

  const roundBuzzes = uniqueByPlayer(events
    .filter(item => item.action === "buzz")
    .filter(item => Number(item.round) === currentRound)
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
  renderPlayerState(roundBuzzes);

  if (winner && winner.playerId !== lastWinnerId && role === "host") playChime();
  lastWinnerId = winner ? winner.playerId : null;
}

function applyRound(round) {
  const nextRound = Math.max(1, Number(round) || 1);
  if (nextRound !== currentRound) {
    currentRound = nextRound;
    currentWinnerId = null;
    lastWinnerId = null;
  }
  roundLabel.textContent = `第${currentRound}問`;
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
  const firstMs = roundBuzzes[0]?.createdMs || 0;
  roundBuzzes.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank-number">${index + 1}着</span>
      <span class="rank-name"></span>
      <span class="rank-time">${formatTime(item.createdMs)}</span>
      <span class="rank-diff">${formatDiff(item.createdMs - firstMs)}</span>
    `;
    li.querySelector(".rank-name").textContent = item.playerName || "名無し";
    rankingList.appendChild(li);
  });
}

function renderPlayerState(roundBuzzes) {
  if (role !== "player") return;
  const ownIndex = roundBuzzes.findIndex(item => item.playerId === playerId);
  const ownBuzz = ownIndex >= 0;
  buzzBtn.disabled = ownBuzz;

  if (ownBuzz) {
    buzzBtn.textContent = `${ownIndex + 1}着`;
  } else {
    buzzBtn.textContent = "回答";
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
    buzzBtn.textContent = "コピー失敗";
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

function formatDiff(ms) {
  if (ms <= 0) return "+0.000秒";
  return `+${(ms / 1000).toFixed(3)}秒`;
}

function playChime() {
  try {
    const sound = new Audio(BUZZER_SOUND_SRC);
    sound.volume = 1;
    sound.play();
  } catch (_) {}
}

function vibrate() {
  if (navigator.vibrate) navigator.vibrate(40);
}
