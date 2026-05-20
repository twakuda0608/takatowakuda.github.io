import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc,
  query, where, orderBy, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
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

const EXPIRE_MS = 3 * 60 * 1000;

// DOM
const loginScreen     = document.getElementById("login-screen");
const mainScreen      = document.getElementById("main-screen");
const loginBtn        = document.getElementById("login-btn");
const logoutBtn       = document.getElementById("logout-btn");
const leaveRoomBtn    = document.getElementById("leave-room-btn");
const userAvatar      = document.getElementById("user-avatar");
const roomLabel       = document.getElementById("room-label");
const textInput       = document.getElementById("text-input");
const postBtn         = document.getElementById("post-btn");
const clipsList       = document.getElementById("clips-list");
const emptyMsg        = document.getElementById("empty-msg");
const roomInput       = document.getElementById("room-input");
const roomBtn         = document.getElementById("room-btn");
const mainRoomInput   = document.getElementById("main-room-input");
const mainRoomBtn     = document.getElementById("main-room-btn");
const mainRoomSection = document.getElementById("main-room-section");
const roomSwitchInput   = document.getElementById("room-switch-input");
const roomSwitchConfirm = document.getElementById("room-switch-confirm");
const postTargetRow   = document.getElementById("post-target-row");
const targetUserBtn   = document.getElementById("target-user-btn");
const targetRoomBtn   = document.getElementById("target-room-btn");

let currentUser      = null;
let roomCode         = null;
let postTarget       = "user"; // "user" | "room"
let unsubscribeUser  = null;
let unsubscribeRoom  = null;
let tickInterval     = null;
let userClips        = [];
let roomClips        = [];

// ---- Room label inline edit ----
roomLabel.addEventListener("click", openRoomSwitchUI);

roomSwitchConfirm.addEventListener("mousedown", e => e.preventDefault()); // prevent blur on input
roomSwitchConfirm.addEventListener("click", confirmRoomSwitch);

roomSwitchInput.addEventListener("keydown", e => {
  if (e.key === "Enter")  confirmRoomSwitch();
  if (e.key === "Escape") cancelRoomSwitch();
});

roomSwitchInput.addEventListener("blur", cancelRoomSwitch);

function openRoomSwitchUI() {
  roomLabel.style.display         = "none";
  roomSwitchInput.value           = roomCode || "";
  roomSwitchInput.style.display   = "inline";
  roomSwitchConfirm.style.display = "inline";
  roomSwitchInput.select();
  roomSwitchInput.focus();
}

function confirmRoomSwitch() {
  const newCode = roomSwitchInput.value.trim().toLowerCase();
  closeRoomSwitchUI();
  if (newCode && newCode !== roomCode) {
    roomClips = [];
    enterRoom(newCode);
  } else {
    roomLabel.style.display = "inline";
  }
}

function cancelRoomSwitch() {
  closeRoomSwitchUI();
  roomLabel.style.display = "inline";
}

function closeRoomSwitchUI() {
  roomSwitchInput.style.display   = "none";
  roomSwitchConfirm.style.display = "none";
}

// ---- Post target toggle ----
targetUserBtn.addEventListener("click", () => setPostTarget("user"));
targetRoomBtn.addEventListener("click", () => setPostTarget("room"));

function setPostTarget(target) {
  postTarget = target;
  targetUserBtn.classList.toggle("active", target === "user");
  targetRoomBtn.classList.toggle("active", target === "room");
}

function updatePostTargetRow() {
  const combined = !!(currentUser && roomCode);
  postTargetRow.style.display = combined ? "flex" : "none";
  if (!combined) setPostTarget("user"); // reset when leaving combined mode
}

// ---- Auth ----
loginBtn.addEventListener("click", () => signInWithPopup(auth, provider));

logoutBtn.addEventListener("click", () => {
  if (!currentUser && roomCode) leaveRoom(); // room-only mode
  else signOut(auth);
});

leaveRoomBtn.addEventListener("click", leaveRoom);

onAuthStateChanged(auth, user => {
  if (roomCode) {
    // entering/leaving auth while already in room mode — just track the user, don't rebuild UI
    currentUser = user;
    return;
  }
  currentUser = user;
  if (user) {
    showMain();
    userAvatar.src                = user.photoURL || "";
    userAvatar.style.display      = "";
    roomLabel.style.display       = "none";
    leaveRoomBtn.style.display    = "none";
    mainRoomSection.style.display = "block";
    logoutBtn.textContent         = "ログアウト";
    startListeningUser(user.uid);
    startTick();
  } else {
    showLogin();
    stopUserListener();
    stopRoomListener();
    stopTick();
    userClips = [];
    roomClips = [];
    renderClips();
  }
});

// ---- Room mode ----
roomBtn.addEventListener("click",     () => enterRoom(roomInput.value));
mainRoomBtn.addEventListener("click", () => enterRoom(mainRoomInput.value));
roomInput.addEventListener("keydown",     e => { if (e.key === "Enter") enterRoom(roomInput.value); });
mainRoomInput.addEventListener("keydown", e => { if (e.key === "Enter") enterRoom(mainRoomInput.value); });

function enterRoom(raw) {
  const code = (raw || "").trim().toLowerCase();
  if (!code) return;
  roomClips = [];
  roomCode  = code;
  showMain();
  roomLabel.textContent         = `🔑 ${code}`;
  roomLabel.style.display       = "inline";
  mainRoomSection.style.display = "none";

  if (currentUser) {
    // combined mode: keep avatar + logout btn; add ✕ to leave room only
    leaveRoomBtn.style.display = "inline";
    updatePostTargetRow();
  } else {
    // room-only mode: no avatar, logout btn becomes 退出
    userAvatar.style.display   = "none";
    leaveRoomBtn.style.display = "none";
    logoutBtn.textContent      = "退出";
    startTick();
  }

  startListeningRoom(code);
}

function leaveRoom() {
  roomCode = null;
  stopRoomListener();
  roomClips        = [];
  roomInput.value  = "";
  mainRoomInput.value = "";

  if (currentUser) {
    // combined → personal only
    roomLabel.style.display       = "none";
    leaveRoomBtn.style.display    = "none";
    mainRoomSection.style.display = "block";
    updatePostTargetRow();
    renderClips();
  } else {
    // room-only → login screen
    stopTick();
    showLogin();
  }
}

// ---- Post ----
postBtn.addEventListener("click", async () => {
  const text = textInput.value.trim();
  if (!text || (!currentUser && !roomCode)) return;
  postBtn.disabled = true;
  const expireAt = Timestamp.fromMillis(Date.now() + EXPIRE_MS);
  if (currentUser && (!roomCode || postTarget === "user")) {
    await addDoc(collection(db, "clips"), {
      uid: currentUser.uid,
      text,
      createdAt: serverTimestamp(),
      expireAt
    });
  } else {
    // room-only mode, or logged in + chose room
    await addDoc(collection(db, "rooms", roomCode, "clips"), {
      text,
      createdAt: serverTimestamp(),
      expireAt
    });
  }
  textInput.value  = "";
  postBtn.disabled = false;
});

textInput.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") postBtn.click();
});

// ---- Firestore listeners ----
function startListeningUser(uid) {
  stopUserListener();
  const q = query(
    collection(db, "clips"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  unsubscribeUser = onSnapshot(q, snapshot => {
    userClips = snapshot.docs
      .filter(d => d.data().createdAt)
      .map(d => ({
        id:        d.id,
        source:    "user",
        text:      d.data().text,
        createdAt: d.data().createdAt.toMillis()
      }));
    purgeExpired();
    renderClips();
  });
}

function startListeningRoom(code) {
  stopRoomListener();
  const q = query(
    collection(db, "rooms", code, "clips"),
    orderBy("createdAt", "desc")
  );
  unsubscribeRoom = onSnapshot(q, snapshot => {
    roomClips = snapshot.docs
      .filter(d => d.data().createdAt)
      .map(d => ({
        id:        d.id,
        source:    "room",
        text:      d.data().text,
        createdAt: d.data().createdAt.toMillis()
      }));
    purgeExpired();
    renderClips();
  });
}

function stopUserListener() {
  if (unsubscribeUser) { unsubscribeUser(); unsubscribeUser = null; }
}

function stopRoomListener() {
  if (unsubscribeRoom) { unsubscribeRoom(); unsubscribeRoom = null; }
}

// ---- Tick ----
function startTick() {
  stopTick();
  tickInterval = setInterval(() => { purgeExpired(); updateTimers(); }, 1000);
}

function stopTick() {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
}

// ---- Expiry ----
async function purgeExpired() {
  const now = Date.now();
  for (const c of userClips.filter(c => now - c.createdAt >= EXPIRE_MS)) {
    await deleteDoc(doc(db, "clips", c.id));
  }
  if (roomCode) {
    for (const c of roomClips.filter(c => now - c.createdAt >= EXPIRE_MS)) {
      await deleteDoc(doc(db, "rooms", roomCode, "clips", c.id));
    }
  }
}

function clipRef(clip) {
  return clip.source === "room"
    ? doc(db, "rooms", roomCode, "clips", clip.id)
    : doc(db, "clips", clip.id);
}

// ---- Render ----
function renderClips() {
  clipsList.querySelectorAll(".clip-item").forEach(el => el.remove());
  const now      = Date.now();
  const combined = currentUser && roomCode; // show source badges only when both are active
  const alive    = [...userClips, ...roomClips]
    .filter(c => now - c.createdAt < EXPIRE_MS)
    .sort((a, b) => b.createdAt - a.createdAt);
  emptyMsg.style.display = alive.length === 0 ? "block" : "none";
  for (const clip of alive) {
    clipsList.appendChild(buildClipEl(clip, combined));
  }
}

function buildClipEl(clip, showSource) {
  const item = document.createElement("div");
  item.className  = "clip-item";
  item.dataset.id = clip.id;

  if (showSource) {
    const badge = document.createElement("div");
    badge.className   = `clip-source ${clip.source === "room" ? "clip-source-room" : "clip-source-user"}`;
    badge.textContent = clip.source === "room" ? `🔑 ${roomCode}` : "👤 アカウント";
    item.appendChild(badge);
  }

  const textEl = document.createElement("div");
  textEl.className   = "clip-text";
  textEl.textContent = clip.text;

  const footer = document.createElement("div");
  footer.className = "clip-footer";

  const timer = document.createElement("span");
  timer.className       = "clip-timer";
  timer.dataset.created = clip.createdAt;
  refreshTimer(timer, clip.createdAt);

  const actions = document.createElement("div");
  actions.className = "clip-actions";

  const copyBtn = document.createElement("button");
  copyBtn.className   = "copy-btn";
  copyBtn.textContent = "コピー";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(clip.text).then(() => {
      copyBtn.textContent = "コピー済み";
      setTimeout(() => { copyBtn.textContent = "コピー"; }, 1500);
    });
  });

  const delBtn = document.createElement("button");
  delBtn.className   = "delete-btn";
  delBtn.textContent = "削除";
  delBtn.addEventListener("click", () => deleteDoc(clipRef(clip)));

  actions.append(copyBtn, delBtn);
  footer.append(timer, actions);
  item.append(textEl, footer);
  return item;
}

function updateTimers() {
  clipsList.querySelectorAll(".clip-timer[data-created]").forEach(el => {
    refreshTimer(el, Number(el.dataset.created));
  });
}

function refreshTimer(el, createdMs) {
  const remaining = EXPIRE_MS - (Date.now() - createdMs);
  if (remaining <= 0) { el.textContent = "期限切れ"; return; }
  const sec = Math.ceil(remaining / 1000);
  const m   = Math.floor(sec / 60);
  const s   = sec % 60;
  el.textContent = `⏱ ${m}:${s.toString().padStart(2, "0")}`;
  el.classList.toggle("urgent", remaining < 30000);
}

// ---- Helpers ----
function showMain()  { mainScreen.style.display = "block"; loginScreen.style.display = "none"; }
function showLogin() { loginScreen.style.display = "flex"; mainScreen.style.display  = "none"; }
