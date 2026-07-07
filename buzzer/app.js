import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, Timestamp, doc, setDoc, getDoc
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
const newRoomTab = document.getElementById("new-room-tab");
const continueRoomTab = document.getElementById("continue-room-tab");
const joinBtn = document.getElementById("join-btn");
const roomCodeLabel = document.getElementById("room-code-label");
const toolbarPlayerCount = document.getElementById("toolbar-player-count");
const roleLabel = document.getElementById("role-label");
const roundLabel = document.getElementById("round-label");
const winnerCard = document.getElementById("winner-card");
const winnerName = document.getElementById("winner-name");
const winnerTime = document.getElementById("winner-time");
const hostActions = document.getElementById("host-actions");
const resetBtn = document.getElementById("reset-btn");
const playerPanel = document.getElementById("player-panel");
const buzzBtn = document.getElementById("buzz-btn");
const playersList = document.getElementById("players-list");
const emptyPlayers = document.getElementById("empty-players");
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
const qrRoomCode = document.getElementById("qr-room-code");

let role = "host";
let roomMode = "new";
let roomCode = "";
let playerName = "";
let playerId = getPlayerId();
let unsubscribeEvents = null;
let unsubscribeState = null;
let events = [];
let roomState = makeDefaultState();
let currentRound = 1;
let currentSessionId = "";
let currentWinnerId = null;
let lastWinnerId = null;
let currentKicked = false;

restoreEntry();

randomBtn.addEventListener("click", () => {
  roomInput.value = makeRoomCode();
  roomInput.select();
});

hostTab.addEventListener("click", () => setRole("host"));
playerTab.addEventListener("click", () => setRole("player"));
newRoomTab.addEventListener("click", () => setRoomMode("new"));
continueRoomTab.addEventListener("click", () => setRoomMode("continue"));
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
  setRoomMode(saved.roomMode || "new");
  setRole(hashCode ? "player" : (saved.role || "host"));
}

function setRole(nextRole) {
  role = nextRole === "player" ? "player" : "host";
  hostTab.classList.toggle("active", role === "host");
  playerTab.classList.toggle("active", role === "player");
  entryView.classList.toggle("host-selected", role === "host");
}

function setRoomMode(nextMode) {
  roomMode = nextMode === "continue" ? "continue" : "new";
  newRoomTab.classList.toggle("active", roomMode === "new");
  continueRoomTab.classList.toggle("active", roomMode === "continue");
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
  saveEntry();
  try {
    await prepareRoomState();
  } catch (error) {
    buzzBtn.textContent = "通信エラー";
    console.error(error);
    return;
  }
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
    if (role === "player" && !isPlayerKicked(playerId)) {
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
  roomState = makeDefaultState();
  currentRound = 1;
  currentSessionId = "";
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
  unsubscribeState = onSnapshot(roomStateRef(), snapshot => {
    if (snapshot.exists()) {
      roomState = normalizeState(snapshot.data());
      currentSessionId = roomState.sessionId;
      applyRound(roomState.currentRound);
      render();
    }
  }, error => {
    buzzBtn.textContent = "通信エラー";
    console.error(error);
  });

  const q = query(collection(db, "rooms", roomCode, "clips"), orderBy("createdAt", "asc"));
  unsubscribeEvents = onSnapshot(q, snapshot => {
    events = snapshot.docs
      .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
      .filter(item => item.type === "buzzer")
      .map(item => ({
        ...item,
        sessionId: item.sessionId || "",
        createdMs: item.createdAt?.toMillis?.() || item.clientMs || 0
      }));
    render();
  }, error => {
    buzzBtn.textContent = "通信エラー";
    console.error(error);
  });
}

function stopListening() {
  if (unsubscribeEvents) {
    unsubscribeEvents();
    unsubscribeEvents = null;
  }
  if (unsubscribeState) {
    unsubscribeState();
    unsubscribeState = null;
  }
}

async function prepareRoomState() {
  const snapshot = await getDoc(roomStateRef());
  const existing = snapshot.exists() ? normalizeState(snapshot.data()) : null;

  if (role === "host" && roomMode === "new") {
    roomState = makeDefaultState(makeSessionId());
    await setDoc(roomStateRef(), {
      ...roomState,
      hostId: playerId,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } else if (existing) {
    roomState = existing;
    if (!snapshot.data().sessionId) {
      await setDoc(roomStateRef(), {
        sessionId: roomState.sessionId,
        currentRound: roomState.currentRound,
        kicked: roomState.kicked,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } else {
    roomState = makeDefaultState(makeSessionId());
    await setDoc(roomStateRef(), {
      ...roomState,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  currentSessionId = roomState.sessionId;
  applyRound(roomState.currentRound);
}

async function resetRound() {
  const nextRound = currentRound + 1;
  resetBtn.disabled = true;
  applyRound(nextRound);
  renderWinner(null);
  renderRanking([]);
  renderPlayerState([]);
  try {
    roomState = normalizeState({
      ...roomState,
      currentRound: nextRound,
      sessionId: currentSessionId || roomState.sessionId || makeSessionId()
    });
    currentSessionId = roomState.sessionId;
    await setDoc(roomStateRef(), {
      currentRound: nextRound,
      sessionId: roomState.sessionId,
      kicked: roomState.kicked || {},
      updatedAt: serverTimestamp(),
      resetBy: playerId
    }, { merge: true });
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
  if (currentKicked) {
    leaveRoom();
    return;
  }
  const alreadyBuzzed = events.some(item =>
    belongsToCurrentSession(item) &&
    item.action === "buzz" &&
    Number(item.round) === currentRound &&
    item.playerId === playerId
  );
  if (alreadyBuzzed) return;
  playerName = nameInput.value.trim() || playerName || "名無し";
  saveEntry();
  buzzBtn.disabled = true;
  buzzBtn.classList.add("pressed");
  buzzBtn.textContent = "送信中";
  vibrate();
  try {
    await sendEvent("buzz", {
      round: currentRound,
      playerId,
      playerName,
      text: `[早押し] ${playerName} 回答`
    });
  } catch (error) {
    buzzBtn.disabled = false;
    buzzBtn.classList.remove("pressed");
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
    sessionId: currentSessionId || roomState.sessionId || "",
    round: extra.round || currentRound,
    playerId: extra.playerId || playerId,
    playerName: extra.playerName || playerName,
    targetPlayerId: extra.targetPlayerId || "",
    targetPlayerName: extra.targetPlayerName || "",
    text: extra.text || `[早押し] ${action}`,
    clientMs: Date.now(),
    createdAt: serverTimestamp(),
    expireAt
  });
}

function render() {
  applyRound(roomState.currentRound || currentRound);
  const sessionEvents = events.filter(belongsToCurrentSession);

  const roundBuzzes = uniqueByPlayer(sessionEvents
    .filter(item => item.action === "buzz")
    .filter(item => Number(item.round) === currentRound)
    .sort((a, b) => a.createdMs - b.createdMs));

  const players = buildPlayers(sessionEvents);
  const activePlayerIds = new Set(players.map(item => item.id));
  const activeRoundBuzzes = roundBuzzes.filter(item => activePlayerIds.has(item.playerId));

  const winner = activeRoundBuzzes[0] || null;
  currentWinnerId = winner ? winner.playerId : null;
  currentKicked = role === "player" && isPlayerKicked(playerId);

  roundLabel.textContent = `第${currentRound}問`;
  playerCount.textContent = `${players.length}人`;
  toolbarPlayerCount.textContent = `${players.length}人`;
  renderWinner(winner);
  renderPlayers(players, activeRoundBuzzes);
  renderRanking(activeRoundBuzzes);
  renderPlayerState(activeRoundBuzzes);

  if (winner && winner.playerId !== lastWinnerId && role === "host") playChime();
  lastWinnerId = winner ? winner.playerId : null;
}

function buildPlayers(sourceEvents = events.filter(belongsToCurrentSession)) {
  const players = new Map();

  sourceEvents.forEach(item => {
    if (item.action === "join" || item.action === "buzz") {
      if (!item.playerId) return;
      const player = players.get(item.playerId) || {
        id: item.playerId,
        name: item.playerName || "名無し",
        lastSeenMs: 0
      };
      player.name = item.playerName || player.name || "名無し";
      player.lastSeenMs = Math.max(player.lastSeenMs, item.createdMs || 0);
      players.set(item.playerId, player);
    }
  });

  return [...players.values()]
    .filter(item => !isPlayerKicked(item.id))
    .sort((a, b) => a.lastSeenMs - b.lastSeenMs);
}

function isPlayerKicked(id) {
  return Boolean(roomState.kicked?.[id]);
}

function renderPlayers(players, roundBuzzes) {
  playersList.innerHTML = "";
  emptyPlayers.classList.toggle("hidden", players.length > 0);
  const answerOrder = new Map(roundBuzzes.map((item, index) => [item.playerId, index + 1]));

  players.forEach(player => {
    const order = answerOrder.get(player.id);
    const item = document.createElement("li");
    const stateClass = order ? "is-answered" : "is-waiting";
    item.className = `player-item ${stateClass}`;
    item.innerHTML = `
      <div class="player-main">
        <span class="player-name"></span>
        <span class="player-device">端末 ${shortId(player.id)}</span>
      </div>
      <span class="player-status ${stateClass}">${order ? `${order}着` : "未回答"}</span>
      <button class="kick-btn" type="button">キック</button>
    `;
    item.querySelector(".player-name").textContent = player.name || "名無し";
    item.querySelector(".kick-btn").addEventListener("click", () => kickPlayer(player));
    playersList.appendChild(item);
  });
}

async function kickPlayer(player) {
  const kicked = {
    ...(roomState.kicked || {}),
    [player.id]: {
      name: player.name || "名無し",
      kickedAt: Date.now(),
      by: playerId
    }
  };
  roomState = normalizeState({ ...roomState, kicked });
  await setDoc(roomStateRef(), {
    kicked,
    sessionId: roomState.sessionId,
    currentRound: roomState.currentRound,
    updatedAt: serverTimestamp()
  }, { merge: true });
  await sendEvent("kick", {
    targetPlayerId: player.id,
    targetPlayerName: player.name,
    text: `[早押し] ${player.name} キック`
  });
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
  if (currentKicked) {
    buzzBtn.disabled = false;
    buzzBtn.textContent = "退室";
    buzzBtn.classList.add("kicked");
    buzzBtn.classList.remove("pressed");
    return;
  }

  buzzBtn.classList.remove("kicked");
  const ownIndex = roundBuzzes.findIndex(item => item.playerId === playerId);
  const ownBuzz = ownIndex >= 0;
  buzzBtn.disabled = ownBuzz;

  if (ownBuzz) {
    buzzBtn.classList.add("pressed");
    buzzBtn.textContent = `${ownIndex + 1}着`;
  } else {
    buzzBtn.classList.remove("pressed");
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
  qrRoomCode.textContent = roomCode;
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

function roomStateRef() {
  return doc(db, "rooms", roomCode, "state", "currentRound");
}

function makeDefaultState(sessionId = makeSessionId()) {
  return {
    currentRound: 1,
    sessionId,
    kicked: {}
  };
}

function normalizeState(state = {}) {
  return {
    currentRound: Math.max(1, Number(state.currentRound) || 1),
    sessionId: state.sessionId || makeSessionId(),
    kicked: state.kicked && typeof state.kicked === "object" ? state.kicked : {}
  };
}

function belongsToCurrentSession(item) {
  return !currentSessionId || item.sessionId === currentSessionId;
}

function saveEntry() {
  localStorage.setItem(ENTRY_KEY, JSON.stringify({ roomCode, name: playerName, role, roomMode }));
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

function makeSessionId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
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

function shortId(id) {
  return String(id || "").replace(/-/g, "").slice(0, 8) || "unknown";
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
