import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, writeBatch
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const STORAGE_KEY = "takato-flashcards-v1";

let cards = [];
let currentUser = null;
let unsubscribeCards = null;
let currentIndex = 0;
let showingBack = false;
let mode = "cards";

const els = {
  loginScreen: document.getElementById("login-screen"),
  mainContent: document.getElementById("main-content"),
  authArea: document.getElementById("auth-area"),
  loginBtn: document.getElementById("login-btn"),
  logoutBtn: document.getElementById("logout-btn"),
  userAvatar: document.getElementById("user-avatar"),
  userName: document.getElementById("user-name"),
  cardCount: document.getElementById("card-count"),
  knownCount: document.getElementById("known-count"),
  progressText: document.getElementById("progress-text"),
  prevCard: document.getElementById("prev-card"),
  nextCard: document.getElementById("next-card"),
  flashcard: document.getElementById("flashcard"),
  cardSide: document.getElementById("card-side"),
  cardMain: document.getElementById("card-main"),
  cardSub: document.getElementById("card-sub"),
  knownBtn: document.getElementById("known-btn"),
  shuffleBtn: document.getElementById("shuffle-btn"),
  resetKnownBtn: document.getElementById("reset-known-btn"),
  addForm: document.getElementById("add-form"),
  frontInput: document.getElementById("front-input"),
  backInput: document.getElementById("back-input"),
  bulkInput: document.getElementById("bulk-input"),
  bulkAddBtn: document.getElementById("bulk-add-btn"),
  cardList: document.getElementById("card-list"),
  editAddBtn: document.getElementById("edit-add-btn"),
  editAddPanel: document.getElementById("edit-add-panel"),
  exportBtn: document.getElementById("export-btn"),
  importFile: document.getElementById("import-file"),
};

els.loginBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider).catch((err) => {
    if (err.code !== "auth/popup-closed-by-user") alert("ログインに失敗しました");
  });
});
els.logoutBtn.addEventListener("click", () => signOut(auth));

document.querySelectorAll(".mode-tab").forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

els.flashcard.addEventListener("click", () => {
  if (!cards.length) return;
  showingBack = !showingBack;
  renderCard();
});

els.prevCard.addEventListener("click", () => moveCard(-1));
els.nextCard.addEventListener("click", () => moveCard(1));
els.shuffleBtn.addEventListener("click", shuffleCards);
els.resetKnownBtn.addEventListener("click", resetKnown);
els.knownBtn.addEventListener("click", toggleKnown);
els.addForm.addEventListener("submit", addCard);
els.bulkAddBtn.addEventListener("click", addBulkCards);
els.editAddBtn.addEventListener("click", toggleEditAddPanel);
els.exportBtn.addEventListener("click", exportCards);
els.importFile.addEventListener("change", importCards);

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  stopListening();
  if (user) {
    showMain(user);
    await migrateLocalCards(user.uid);
    startListening(user.uid);
  } else {
    cards = [];
    showLogin();
    render();
  }
});

function showMain(user) {
  els.loginScreen.style.display = "none";
  els.mainContent.style.display = "grid";
  els.authArea.style.display = "flex";
  els.userAvatar.src = user.photoURL || "";
  els.userName.textContent = user.displayName || user.email;
}

function showLogin() {
  els.loginScreen.style.display = "flex";
  els.mainContent.style.display = "none";
  els.authArea.style.display = "none";
}

function cardCollection(uid = currentUser.uid) {
  return collection(db, "users", uid, "flashcards");
}

function cardDoc(id) {
  return doc(db, "users", currentUser.uid, "flashcards", id);
}

function startListening(uid) {
  const q = query(cardCollection(uid), orderBy("createdAt", "asc"));
  unsubscribeCards = onSnapshot(q, (snapshot) => {
    cards = snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        front: data.front || "",
        back: data.back || "",
        known: Boolean(data.known),
      };
    }).filter((card) => card.front && card.back);
    render();
  }, (err) => {
    if (err.code === "permission-denied") {
      alert("Firestoreルールの確認");
    }
  });
}

function stopListening() {
  if (unsubscribeCards) {
    unsubscribeCards();
    unsubscribeCards = null;
  }
}

async function migrateLocalCards(uid) {
  const localCards = loadLocalCards();
  if (!localCards.length) return;

  const batch = writeBatch(db);
  localCards.forEach((card) => {
    const ref = doc(cardCollection(uid));
    batch.set(ref, {
      front: card.front,
      back: card.back,
      known: Boolean(card.known),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  localStorage.removeItem(STORAGE_KEY);
}

function loadLocalCards() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((card) => card?.front && card?.back)
      .map((card) => ({
        front: String(card.front).trim(),
        back: String(card.back).trim(),
        known: Boolean(card.known),
      }))
      .filter((card) => card.front && card.back);
  } catch {
    return [];
  }
}

function setMode(nextMode) {
  mode = nextMode;
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });
  document.querySelectorAll(".mode-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${mode}-panel`);
  });
}

function render() {
  currentIndex = clampIndex(currentIndex);
  els.cardCount.textContent = cards.length;
  els.knownCount.textContent = cards.filter((card) => card.known).length;
  renderCard();
  renderList();
}

function renderCard() {
  const card = cards[currentIndex];
  const hasCards = Boolean(card);
  els.prevCard.disabled = cards.length <= 1;
  els.nextCard.disabled = cards.length <= 1;
  els.shuffleBtn.disabled = cards.length <= 1;
  els.resetKnownBtn.disabled = !cards.some((item) => item.known);
  els.knownBtn.disabled = !hasCards;
  els.progressText.textContent = hasCards ? `${currentIndex + 1} / ${cards.length}` : "0 / 0";

  if (!hasCards) {
    els.cardSide.textContent = "表";
    els.cardMain.textContent = "カード未追加";
    els.cardSub.textContent = "下の入力欄から追加";
    els.knownBtn.textContent = "暗記";
    return;
  }

  els.cardSide.textContent = showingBack ? "裏" : "表";
  els.cardMain.textContent = showingBack ? card.back : card.front;
  els.cardSub.textContent = showingBack ? "クリックで表面" : "クリックで裏面";
  els.knownBtn.textContent = card.known ? "未暗記" : "暗記";
}

function renderList() {
  if (!cards.length) {
    els.cardList.innerHTML = `<div class="empty-message">カードがありません</div>`;
    return;
  }

  els.cardList.innerHTML = cards.map((card, index) => `
    <div class="list-item" data-id="${card.id}">
      <div class="list-word list-front">${escapeHtml(card.front)}</div>
      <div class="list-word list-back">${escapeHtml(card.back)}</div>
      <div class="mini-actions">
        <button type="button" class="mini-btn" data-action="known" data-index="${index}">${card.known ? "未暗記" : "暗記"}</button>
        <button type="button" class="mini-btn delete" data-action="delete" data-index="${index}">削除</button>
      </div>
    </div>
  `).join("");

  els.cardList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", async () => {
      const card = cards[Number(button.dataset.index)];
      if (!card) return;
      button.disabled = true;
      if (button.dataset.action === "delete") {
        await deleteDoc(cardDoc(card.id));
      } else {
        await updateDoc(cardDoc(card.id), { known: !card.known, updatedAt: serverTimestamp() });
      }
    });
  });
}

function moveCard(step) {
  if (!cards.length) return;
  currentIndex = (currentIndex + step + cards.length) % cards.length;
  showingBack = false;
  renderCard();
}

function shuffleCards() {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  currentIndex = 0;
  showingBack = false;
  render();
}

function toggleEditAddPanel() {
  const nextOpen = els.editAddPanel.hidden;
  els.editAddPanel.hidden = !nextOpen;
  els.editAddBtn.textContent = nextOpen ? "編集終了" : "編集・追加";
  if (nextOpen) els.frontInput.focus();
}

async function toggleKnown() {
  const card = cards[currentIndex];
  if (!card) return;
  els.knownBtn.disabled = true;
  await updateDoc(cardDoc(card.id), { known: !card.known, updatedAt: serverTimestamp() });
}

async function resetKnown() {
  const batch = writeBatch(db);
  cards.filter((card) => card.known).forEach((card) => {
    batch.update(cardDoc(card.id), { known: false, updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

async function addCard(event) {
  event.preventDefault();
  const front = els.frontInput.value.trim();
  const back = els.backInput.value.trim();
  if (!front || !back) return;

  const btn = els.addForm.querySelector("button[type='submit']");
  btn.disabled = true;
  try {
    await addDoc(cardCollection(), {
      front,
      back,
      known: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    els.addForm.reset();
    els.frontInput.focus();
  } catch {
    alert("追加に失敗しました");
  } finally {
    btn.disabled = false;
  }
}

async function addBulkCards() {
  const nextCards = parseCardText(els.bulkInput.value);

  if (!nextCards.length) return;
  els.bulkAddBtn.disabled = true;
  try {
    const batch = writeBatch(db);
    nextCards.forEach((card) => {
      batch.set(doc(cardCollection()), {
        ...card,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
    els.bulkInput.value = "";
  } catch {
    alert("一括追加に失敗しました");
  } finally {
    els.bulkAddBtn.disabled = false;
  }
}

function parseCardText(text) {
  return parseRows(text)
    .map(rowToCard)
    .filter(Boolean);
}

function parseRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && (char === "," || char === "\t")) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((items) => items.some((item) => item.trim()));
}

function rowToCard(row) {
  const [front, ...rest] = row;
  const back = rest.join(",").trim();
  if (!front?.trim() || !back) return null;
  if (front.trim().toLowerCase() === "front" && back.toLowerCase() === "back") return null;
  return { front: front.trim(), back, known: false };
}

function exportCards() {
  const exportData = cards.map(({ front, back, known }) => ({ front, back, known }));
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "flashcards.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importCards(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", async () => {
    try {
      const nextCards = parseImportedCards(String(reader.result));
      if (!nextCards.length) return;

      const batch = writeBatch(db);
      nextCards.forEach((card) => {
        batch.set(doc(cardCollection()), {
          ...card,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

function parseImportedCards(text) {
  try {
    const imported = JSON.parse(text);
    if (Array.isArray(imported)) {
      return imported
        .filter((card) => card?.front && card?.back)
        .map((card) => ({
          front: String(card.front).trim(),
          back: String(card.back).trim(),
          known: Boolean(card.known),
        }))
        .filter((card) => card.front && card.back);
    }
  } catch {
    // JSON以外はCSV/TSVとして扱う
  }
  return parseCardText(text);
}

function clampIndex(index) {
  if (!cards.length) return 0;
  return Math.max(0, Math.min(index, cards.length - 1));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}
