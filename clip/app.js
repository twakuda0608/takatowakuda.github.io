import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc,
  query, where, orderBy, serverTimestamp
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
const loginScreen = document.getElementById("login-screen");
const mainScreen  = document.getElementById("main-screen");
const loginBtn    = document.getElementById("login-btn");
const logoutBtn   = document.getElementById("logout-btn");
const userAvatar  = document.getElementById("user-avatar");
const textInput   = document.getElementById("text-input");
const postBtn     = document.getElementById("post-btn");
const clipsList   = document.getElementById("clips-list");
const emptyMsg    = document.getElementById("empty-msg");

let currentUser = null;
let unsubscribe = null;
let tickInterval = null;
let clips = [];

// ---- Auth ----
loginBtn.addEventListener("click", () => signInWithPopup(auth, provider));
logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) {
    loginScreen.style.display = "none";
    mainScreen.style.display  = "block";
    userAvatar.src = user.photoURL || "";
    startListening(user.uid);
    startTick();
  } else {
    loginScreen.style.display = "flex";
    mainScreen.style.display  = "none";
    stopListening();
    stopTick();
    clips = [];
    clipsList.innerHTML = "";
    emptyMsg.style.display = "none";
  }
});

// ---- Post ----
postBtn.addEventListener("click", async () => {
  const text = textInput.value.trim();
  if (!text || !currentUser) return;
  postBtn.disabled = true;
  await addDoc(collection(db, "clips"), {
    uid: currentUser.uid,
    text,
    createdAt: serverTimestamp()
  });
  textInput.value = "";
  postBtn.disabled = false;
});

textInput.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") postBtn.click();
});

// ---- Firestore listener ----
function startListening(uid) {
  if (unsubscribe) unsubscribe();
  const q = query(
    collection(db, "clips"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  unsubscribe = onSnapshot(q, snapshot => {
    clips = snapshot.docs
      .filter(d => d.data().createdAt)
      .map(d => ({
        id:        d.id,
        text:      d.data().text,
        createdAt: d.data().createdAt.toMillis()
      }));
    purgeExpired();
    renderClips();
  });
}

function stopListening() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
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
  const now     = Date.now();
  const expired = clips.filter(c => now - c.createdAt >= EXPIRE_MS);
  for (const c of expired) {
    await deleteDoc(doc(db, "clips", c.id));
  }
}

// ---- Render ----
function renderClips() {
  clipsList.querySelectorAll(".clip-item").forEach(el => el.remove());
  const now   = Date.now();
  const alive = clips.filter(c => now - c.createdAt < EXPIRE_MS);
  emptyMsg.style.display = alive.length === 0 ? "block" : "none";
  for (const clip of alive) {
    clipsList.appendChild(buildClipEl(clip));
  }
}

function buildClipEl(clip) {
  const item = document.createElement("div");
  item.className = "clip-item";
  item.dataset.id = clip.id;

  const textEl = document.createElement("div");
  textEl.className = "clip-text";
  textEl.textContent = clip.text;

  const footer = document.createElement("div");
  footer.className = "clip-footer";

  const timer = document.createElement("span");
  timer.className = "clip-timer";
  timer.dataset.created = clip.createdAt;
  refreshTimer(timer, clip.createdAt);

  const actions = document.createElement("div");
  actions.className = "clip-actions";

  const copyBtn = document.createElement("button");
  copyBtn.className = "copy-btn";
  copyBtn.textContent = "コピー";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(clip.text).then(() => {
      copyBtn.textContent = "コピー済み";
      setTimeout(() => { copyBtn.textContent = "コピー"; }, 1500);
    });
  });

  const delBtn = document.createElement("button");
  delBtn.className = "delete-btn";
  delBtn.textContent = "削除";
  delBtn.addEventListener("click", () => deleteDoc(doc(db, "clips", clip.id)));

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
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  el.textContent = `⏱ ${m}:${s.toString().padStart(2, "0")}`;
  el.classList.toggle("urgent", remaining < 30000);
}
