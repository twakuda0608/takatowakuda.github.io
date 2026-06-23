import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, writeBatch, getDoc, setDoc
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
const DEFAULT_DECK_ID = "default";

let cards = [];
let allCards = [];
let decks = [];
let currentDeckId = DEFAULT_DECK_ID;
let currentView = "decks";
let studyOrder = [];
let currentUser = null;
let unsubscribeCards = null;
let currentIndex = 0;
let showingBack = false;
let mode = "cards";
let studyDirection = "front";
let lastViewedCardId = null;
let pointerStartX = 0;
let pointerStartY = 0;
let pointerTracking = false;
let flipTimer = null;
let dragCardId = null;

const els = {
  loginScreen: document.getElementById("login-screen"),
  mainContent: document.getElementById("main-content"),
  authArea: document.getElementById("auth-area"),
  loginBtn: document.getElementById("login-btn"),
  logoutBtn: document.getElementById("logout-btn"),
  userAvatar: document.getElementById("user-avatar"),
  userName: document.getElementById("user-name"),
  deckListPanel: document.getElementById("deck-list-panel"),
  studyPanel: document.getElementById("study-panel"),
  deckList: document.getElementById("deck-list"),
  backToDecksBtn: document.getElementById("back-to-decks-btn"),
  deckTitle: document.getElementById("deck-title"),
  deckForm: document.getElementById("deck-form"),
  deckNameInput: document.getElementById("deck-name-input"),
  deckRenameForm: document.getElementById("deck-rename-form"),
  deckRenameInput: document.getElementById("deck-rename-input"),
  deleteDeckBtn: document.getElementById("delete-deck-btn"),
  cardCount: document.getElementById("card-count"),
  knownCount: document.getElementById("known-count"),
  knownRate: document.getElementById("known-rate"),
  knownRateBar: document.getElementById("known-rate-bar"),
  directionSelect: document.getElementById("direction-select"),
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
  bulkPreview: document.getElementById("bulk-preview"),
  bulkPreviewCount: document.getElementById("bulk-preview-count"),
  termCustomInput: document.getElementById("term-custom-input"),
  cardCustomInput: document.getElementById("card-custom-input"),
  duplicateSkipCheckbox: document.getElementById("duplicate-skip-checkbox"),
  cardList: document.getElementById("card-list"),
  editAddBtn: document.getElementById("edit-add-btn"),
  editAddPanel: document.getElementById("edit-add-panel"),
  duplicateWarning: document.getElementById("duplicate-warning"),
  exportBtn: document.getElementById("export-btn"),
  exportScope: document.getElementById("export-scope"),
  importFile: document.getElementById("import-file"),
};

els.loginBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider).catch((err) => {
    if (err.code !== "auth/popup-closed-by-user") alert("ログインに失敗しました");
  });
});
els.logoutBtn.addEventListener("click", () => signOut(auth));
els.backToDecksBtn.addEventListener("click", showDeckList);
els.deckForm.addEventListener("submit", createDeck);
els.deckRenameForm.addEventListener("submit", renameDeck);
els.deleteDeckBtn.addEventListener("click", deleteCurrentDeck);

document.querySelectorAll(".mode-tab").forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

els.flashcard.addEventListener("click", () => {
  if (!cards.length) return;
  if (els.flashcard.dataset.dragged === "true") {
    els.flashcard.dataset.dragged = "false";
    return;
  }
  flipCard();
});
els.flashcard.addEventListener("pointerdown", startFlick);
els.flashcard.addEventListener("pointermove", moveFlick);
els.flashcard.addEventListener("pointerup", endFlick);
els.flashcard.addEventListener("pointercancel", cancelFlick);

els.prevCard.addEventListener("click", () => moveCard(-1, "right"));
els.nextCard.addEventListener("click", () => moveCard(1, "left"));
els.directionSelect.addEventListener("change", () => {
  studyDirection = els.directionSelect.value;
  showingBack = false;
  renderCard();
});
els.shuffleBtn.addEventListener("click", shuffleCards);
els.resetKnownBtn.addEventListener("click", resetKnown);
els.knownBtn.addEventListener("click", toggleKnown);
els.addForm.addEventListener("submit", addCard);
els.bulkAddBtn.addEventListener("click", addBulkCards);
els.bulkInput.addEventListener("input", renderImportPreview);
els.termCustomInput.addEventListener("input", renderImportPreview);
els.cardCustomInput.addEventListener("input", renderImportPreview);
els.duplicateSkipCheckbox.addEventListener("change", renderImportPreview);
els.termCustomInput.addEventListener("focus", () => selectCustomSeparator("term-separator"));
els.cardCustomInput.addEventListener("focus", () => selectCustomSeparator("card-separator"));
document.querySelectorAll("input[name='term-separator'], input[name='card-separator']").forEach((input) => {
  input.addEventListener("change", renderImportPreview);
});
els.editAddBtn.addEventListener("click", toggleEditAddPanel);
els.exportBtn.addEventListener("click", exportCards);
els.importFile.addEventListener("change", importCards);
document.addEventListener("keydown", handleKeyboard);

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  stopListening();
  if (user) {
    showMain(user);
    await loadDeckSettings(user.uid);
    await migrateLocalCards(user.uid);
    startListening(user.uid);
  } else {
  cards = [];
  allCards = [];
  decks = [];
  currentDeckId = DEFAULT_DECK_ID;
  currentView = "decks";
  studyOrder = [];
    showLogin();
    render();
  }
});

function showMain(user) {
  els.loginScreen.style.display = "none";
  els.mainContent.style.display = "block";
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

function userDoc(uid = currentUser.uid) {
  return doc(db, "users", uid);
}

function startListening(uid) {
  const q = query(cardCollection(uid), orderBy("createdAt", "asc"));
  unsubscribeCards = onSnapshot(q, (snapshot) => {
    allCards = snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        front: data.front || "",
        back: data.back || "",
        known: Boolean(data.known),
        deckId: data.deckId || DEFAULT_DECK_ID,
        order: getCardOrder(data),
        viewCount: Number(data.viewCount || 0),
        flipCount: Number(data.flipCount || 0),
        knownCount: Number(data.knownCount || 0),
        lastStudiedAt: readMillis(data.lastStudiedAt),
        lastKnownAt: readMillis(data.lastKnownAt),
      };
    })
      .filter((card) => card.front && card.back)
      .sort((a, b) => a.order - b.order);
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

async function loadDeckSettings(uid) {
  const snap = await getDoc(userDoc(uid));
  const data = snap.exists() ? snap.data() : {};
  decks = normalizeDecks(data.flashcardDecks);
  currentDeckId = data.currentFlashcardDeckId || decks[0].id;
  if (!decks.some((deck) => deck.id === currentDeckId)) currentDeckId = decks[0].id;
  await saveDeckSettings(uid);
}

function normalizeDecks(value) {
  const clean = Array.isArray(value)
    ? value
        .filter((deck) => deck?.id && deck?.name)
        .map((deck) => ({ id: String(deck.id), name: String(deck.name).trim() || "マイカード" }))
    : [];
  return clean.length ? clean : [{ id: DEFAULT_DECK_ID, name: "マイカード" }];
}

async function saveDeckSettings(uid = currentUser.uid) {
  await setDoc(userDoc(uid), {
    flashcardDecks: decks,
    currentFlashcardDeckId: currentDeckId,
  }, { merge: true });
}

async function switchDeck(deckId) {
  if (!decks.some((deck) => deck.id === deckId)) return;
  currentDeckId = deckId;
  currentView = "study";
  currentIndex = 0;
  showingBack = false;
  studyOrder = [];
  render();
  await saveDeckSettings();
}

function showDeckList() {
  currentView = "decks";
  render();
}

async function createDeck(event) {
  event.preventDefault();
  const name = els.deckNameInput.value.trim();
  if (!name) return;
  const id = `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  decks.push({ id, name });
  currentDeckId = id;
  currentIndex = 0;
  showingBack = false;
  els.deckNameInput.value = "";
  await saveDeckSettings();
  render();
}

async function renameDeck(event) {
  event.preventDefault();
  const name = els.deckRenameInput.value.trim();
  if (!name) return;
  const deck = decks.find((item) => item.id === currentDeckId);
  if (!deck) return;
  deck.name = name;
  await saveDeckSettings();
  render();
}

async function deleteCurrentDeck() {
  const deck = decks.find((item) => item.id === currentDeckId);
  if (!deck) return;
  if (decks.length <= 1) {
    alert("最後のカード集は削除できません");
    return;
  }
  if (!confirm(`「${deck.name}」を削除しますか？`)) return;

  els.deleteDeckBtn.disabled = true;
  try {
    const batch = writeBatch(db);
    allCards
      .filter((card) => card.deckId === currentDeckId)
      .forEach((card) => batch.delete(cardDoc(card.id)));
    decks = decks.filter((item) => item.id !== currentDeckId);
    currentDeckId = decks[0].id;
    currentView = "decks";
    currentIndex = 0;
    studyOrder = [];
    await saveDeckSettings();
    await batch.commit();
    render();
  } catch {
    alert("削除に失敗しました");
  } finally {
    els.deleteDeckBtn.disabled = false;
  }
}

async function migrateLocalCards(uid) {
  const localCards = loadLocalCards();
  if (!localCards.length) return;

  const batch = writeBatch(db);
  const baseOrder = Date.now();
  localCards.forEach((card, index) => {
    const ref = doc(cardCollection(uid));
    batch.set(ref, {
      front: card.front,
      back: card.back,
      known: Boolean(card.known),
      deckId: currentDeckId,
      order: baseOrder + index,
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

function getCardOrder(data) {
  if (Number.isFinite(data.order)) return data.order;
  if (data.createdAt?.toMillis) return data.createdAt.toMillis();
  return Date.now();
}

function readMillis(value) {
  if (!value) return null;
  if (value.toMillis) return value.toMillis();
  if (Number.isFinite(value)) return value;
  return null;
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
  cards = getStudyCards();
  currentIndex = clampIndex(currentIndex);
  renderView();
  renderDeckControls();
  renderDeckList();
  els.cardCount.textContent = cards.length;
  els.knownCount.textContent = cards.filter((card) => card.known).length;
  const knownRate = cards.length ? Math.round(cards.filter((card) => card.known).length / cards.length * 100) : 0;
  els.knownRate.textContent = knownRate;
  els.knownRateBar.style.width = `${knownRate}%`;
  renderCard();
  renderDuplicateWarning();
  renderList();
}

function getStudyCards() {
  const deckCards = allCards.filter((card) => card.deckId === currentDeckId);
  const ids = new Set(deckCards.map((card) => card.id));
  studyOrder = studyOrder.filter((id) => ids.has(id));
  if (studyOrder.length !== deckCards.length) {
    const orderedIds = new Set(studyOrder);
    studyOrder.push(...deckCards.filter((card) => !orderedIds.has(card.id)).map((card) => card.id));
  }
  const byId = new Map(deckCards.map((card) => [card.id, card]));
  return studyOrder.map((id) => byId.get(id)).filter(Boolean);
}

function renderDeckControls() {
  const currentDeck = decks.find((deck) => deck.id === currentDeckId) || decks[0];
  els.deckTitle.textContent = currentDeck?.name || "単語カード";
  els.deckRenameInput.value = currentDeck?.name || "";
}

function renderView() {
  const showStudy = currentView === "study";
  els.deckListPanel.style.display = showStudy ? "none" : "block";
  els.studyPanel.style.display = showStudy ? "block" : "none";
}

function renderDeckList() {
  if (!decks.length) {
    els.deckList.innerHTML = `<div class="empty-message">カード集がありません</div>`;
    return;
  }

  els.deckList.innerHTML = decks.map((deck) => {
    const deckCards = allCards.filter((card) => card.deckId === deck.id);
    const known = deckCards.filter((card) => card.known).length;
    const rate = deckCards.length ? Math.round(known / deckCards.length * 100) : 0;
    const duplicateCount = countDeckDuplicates(deck.id);
    return `
      <button type="button" class="deck-list-item" data-deck-id="${escapeHtml(deck.id)}">
        <span class="deck-list-name">${escapeHtml(deck.name)}</span>
        <span class="deck-list-meta">${deckCards.length}枚 / ${known}暗記 / ${rate}%</span>
        ${duplicateCount ? `<span class="deck-list-warning">重複 ${duplicateCount}</span>` : ""}
      </button>
    `;
  }).join("");

  els.deckList.querySelectorAll(".deck-list-item").forEach((button) => {
    button.addEventListener("click", () => switchDeck(button.dataset.deckId));
  });
}

function countDeckDuplicates(deckId) {
  const map = new Map();
  allCards.filter((card) => card.deckId === deckId).forEach((card) => {
    const key = normalizeFront(card.front);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.values()].filter((count) => count > 1).length;
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

  const promptSide = studyDirection === "front" ? "表" : "裏";
  const answerSide = studyDirection === "front" ? "裏" : "表";
  const promptText = studyDirection === "front" ? card.front : card.back;
  const answerText = studyDirection === "front" ? card.back : card.front;
  els.cardSide.textContent = showingBack ? answerSide : promptSide;
  els.cardMain.textContent = showingBack ? answerText : promptText;
  els.cardSub.textContent = showingBack ? `${promptSide}へ` : `${answerSide}へ`;
  els.knownBtn.textContent = card.known ? "未暗記" : "暗記";
  recordCardView(card);
}

function flipCard() {
  const card = cards[currentIndex];
  if (card) {
    updateDoc(cardDoc(card.id), {
      flipCount: (card.flipCount || 0) + 1,
      lastStudiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  }
  window.clearTimeout(flipTimer);
  els.flashcard.classList.remove("is-flipping");
  void els.flashcard.offsetWidth;
  els.flashcard.classList.add("is-flipping");
  flipTimer = window.setTimeout(() => {
    showingBack = !showingBack;
    renderCard();
  }, 150);
  window.setTimeout(() => {
    els.flashcard.classList.remove("is-flipping");
  }, 320);
}

function recordCardView(card) {
  if (!card || lastViewedCardId === card.id || currentView !== "study" || mode !== "cards") return;
  lastViewedCardId = card.id;
  updateDoc(cardDoc(card.id), {
    viewCount: (card.viewCount || 0) + 1,
    lastStudiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(() => {});
}

function renderList() {
  const listCards = getOrderedDeckCards();
  if (!listCards.length) {
    els.cardList.innerHTML = `<div class="empty-message">カードがありません</div>`;
    return;
  }

  const duplicateMap = getDuplicateMap();
  const editing = !els.editAddPanel.hidden;
  els.cardList.innerHTML = listCards.map((card, index) => `
    <div class="list-item${duplicateMap.has(normalizeFront(card.front)) ? " duplicate-item" : ""}${editing ? " reorder-enabled" : ""}"
      data-id="${card.id}" draggable="${editing ? "true" : "false"}">
      ${editing ? '<span class="drag-handle" aria-hidden="true">=</span>' : ''}
      <div class="list-word list-front">
        ${escapeHtml(card.front)}
        ${duplicateMap.has(normalizeFront(card.front)) ? '<span class="duplicate-badge">重複</span>' : ''}
      </div>
      <div class="list-word list-back">${escapeHtml(card.back)}</div>
      <div class="mini-actions">
        ${editing ? `<button type="button" class="mini-btn" data-action="edit" data-index="${index}">編集</button>` : ""}
        <button type="button" class="mini-btn" data-action="known" data-index="${index}">${card.known ? "未暗記" : "暗記"}</button>
        <button type="button" class="mini-btn delete" data-action="delete" data-index="${index}">削除</button>
      </div>
      ${editing ? `
        <form class="inline-edit-form" data-id="${card.id}">
          <input type="text" name="front" value="${escapeAttr(card.front)}" placeholder="表">
          <input type="text" name="back" value="${escapeAttr(card.back)}" placeholder="裏">
          <button type="submit" class="primary-btn">更新</button>
        </form>
      ` : ""}
      <div class="history-line">
        <span>学習 ${card.viewCount || 0}回</span>
        <span>反転 ${card.flipCount || 0}回</span>
        ${card.lastStudiedAt ? `<span>最終 ${formatShortDate(card.lastStudiedAt)}</span>` : ""}
      </div>
    </div>
  `).join("");

  els.cardList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", async () => {
      const card = listCards[Number(button.dataset.index)];
      if (!card) return;
      if (button.dataset.action === "edit") {
        const row = button.closest(".list-item");
        row?.classList.toggle("editing-inline");
        return;
      }
      button.disabled = true;
      if (button.dataset.action === "delete") {
        await deleteDoc(cardDoc(card.id));
      } else {
        await updateDoc(cardDoc(card.id), { known: !card.known, updatedAt: serverTimestamp() });
      }
    });
  });
  els.cardList.querySelectorAll(".inline-edit-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const front = form.elements.front.value.trim();
      const back = form.elements.back.value.trim();
      if (!front || !back) return;
      const btn = form.querySelector("button");
      btn.disabled = true;
      try {
        await updateDoc(cardDoc(form.dataset.id), { front, back, updatedAt: serverTimestamp() });
      } finally {
        btn.disabled = false;
      }
    });
  });
  setupListDrag();
}

function setupListDrag() {
  els.cardList.querySelectorAll(".list-item[draggable='true']").forEach((item) => {
    item.addEventListener("dragstart", (event) => {
      dragCardId = item.dataset.id;
      item.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", dragCardId);
    });

    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (!dragCardId || item.dataset.id === dragCardId) return;
      clearDragTargets();
      const rect = item.getBoundingClientRect();
      const before = event.clientY < rect.top + rect.height / 2;
      item.classList.add(before ? "drag-over-before" : "drag-over-after");
      item.dataset.dropPosition = before ? "before" : "after";
    });

    item.addEventListener("dragleave", () => {
      item.classList.remove("drag-over-before", "drag-over-after");
    });

    item.addEventListener("drop", async (event) => {
      event.preventDefault();
      const targetId = item.dataset.id;
      const position = item.dataset.dropPosition || "before";
      clearDragTargets();
      if (!dragCardId || dragCardId === targetId) return;
      await reorderCards(dragCardId, targetId, position);
      dragCardId = null;
    });

    item.addEventListener("dragend", () => {
      dragCardId = null;
      clearDragTargets();
    });
  });
}

function clearDragTargets() {
  els.cardList.querySelectorAll(".dragging, .drag-over-before, .drag-over-after").forEach((item) => {
    item.classList.remove("dragging", "drag-over-before", "drag-over-after");
    delete item.dataset.dropPosition;
  });
}

async function reorderCards(sourceId, targetId, position) {
  const nextCards = getOrderedDeckCards();
  const from = nextCards.findIndex((card) => card.id === sourceId);
  const to = nextCards.findIndex((card) => card.id === targetId);
  if (from < 0 || to < 0) return;
  const [moved] = nextCards.splice(from, 1);
  const targetIndex = nextCards.findIndex((card) => card.id === targetId);
  nextCards.splice(position === "after" ? targetIndex + 1 : targetIndex, 0, moved);

  const baseOrder = Date.now();
  const batch = writeBatch(db);
  nextCards.forEach((card, index) => {
    batch.update(cardDoc(card.id), { order: baseOrder + index, updatedAt: serverTimestamp() });
  });
  cards = nextCards.map((card, index) => ({ ...card, order: baseOrder + index }));
  studyOrder = [];
  allCards = allCards.map((card) => cards.find((item) => item.id === card.id) || card);
  render();
  await batch.commit();
}

function renderDuplicateWarning() {
  const duplicates = [...getDuplicateMap().entries()];
  if (!duplicates.length) {
    els.duplicateWarning.hidden = true;
    els.duplicateWarning.innerHTML = "";
    return;
  }

  els.duplicateWarning.hidden = false;
  els.duplicateWarning.innerHTML = `
    <strong>表面の重複</strong>
    <span>${duplicates.map(([, items]) => escapeHtml(items[0].front)).join("、")}</span>
  `;
}

function getDuplicateMap() {
  const map = new Map();
  getOrderedDeckCards().forEach((card) => {
    const key = normalizeFront(card.front);
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(card);
  });
  return new Map([...map.entries()].filter(([, items]) => items.length > 1));
}

function getOrderedDeckCards() {
  return allCards.filter((card) => card.deckId === currentDeckId);
}

function normalizeFront(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function moveCard(step, direction = step > 0 ? "left" : "right") {
  if (!cards.length) return;
  animateCard(direction);
  currentIndex = (currentIndex + step + cards.length) % cards.length;
  showingBack = false;
  renderCard();
}

function startFlick(event) {
  if (!cards.length) return;
  pointerTracking = true;
  pointerStartX = event.clientX;
  pointerStartY = event.clientY;
  els.flashcard.dataset.dragged = "false";
  els.flashcard.setPointerCapture?.(event.pointerId);
}

function moveFlick(event) {
  if (!pointerTracking) return;
  const dx = event.clientX - pointerStartX;
  const dy = event.clientY - pointerStartY;
  if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
  event.preventDefault();
  els.flashcard.dataset.dragged = "true";
  const limited = Math.max(-90, Math.min(90, dx));
  els.flashcard.style.transform = `translateX(${limited}px) rotate(${limited / 16}deg)`;
}

function endFlick(event) {
  if (!pointerTracking) return;
  const dx = event.clientX - pointerStartX;
  const dy = event.clientY - pointerStartY;
  pointerTracking = false;
  els.flashcard.style.transform = "";

  if (Math.abs(dx) > 72 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    moveCard(dx < 0 ? 1 : -1, dx < 0 ? "left" : "right");
  }
}

function cancelFlick() {
  pointerTracking = false;
  els.flashcard.style.transform = "";
}

function handleKeyboard(event) {
  const active = document.activeElement;
  const typing = active && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName);
  if (typing || currentView !== "study" || mode !== "cards") return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveCard(-1, "right");
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    moveCard(1, "left");
  } else if (event.key === " ") {
    event.preventDefault();
    if (cards.length) flipCard();
  } else if (event.key === "Enter") {
    event.preventDefault();
    toggleKnown();
  }
}

function animateCard(direction) {
  els.flashcard.classList.remove("flick-left", "flick-right");
  void els.flashcard.offsetWidth;
  els.flashcard.classList.add(direction === "left" ? "flick-left" : "flick-right");
  window.setTimeout(() => {
    els.flashcard.classList.remove("flick-left", "flick-right");
  }, 260);
}

function shuffleCards() {
  studyOrder = cards.map((card) => card.id);
  for (let i = studyOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [studyOrder[i], studyOrder[j]] = [studyOrder[j], studyOrder[i]];
  }
  currentIndex = 0;
  showingBack = false;
  render();
}

function toggleEditAddPanel() {
  const nextOpen = els.editAddPanel.hidden;
  els.editAddPanel.hidden = !nextOpen;
  els.editAddBtn.textContent = nextOpen ? "編集終了" : "編集・追加";
  renderList();
  if (nextOpen) {
    renderImportPreview();
    els.frontInput.focus();
  }
}

async function toggleKnown() {
  const card = cards[currentIndex];
  if (!card) return;
  els.knownBtn.disabled = true;
  const nextKnown = !card.known;
  const data = {
    known: nextKnown,
    knownCount: nextKnown ? (card.knownCount || 0) + 1 : (card.knownCount || 0),
    lastStudiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (nextKnown) data.lastKnownAt = serverTimestamp();
  await updateDoc(cardDoc(card.id), data);
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
      deckId: currentDeckId,
      order: Date.now(),
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
  const nextCards = getImportPreviewCards();

  if (!nextCards.length) return;
  els.bulkAddBtn.disabled = true;
  try {
    const batch = writeBatch(db);
    const baseOrder = Date.now();
    nextCards.forEach((card, index) => {
      batch.set(doc(cardCollection()), {
        ...card,
        deckId: currentDeckId,
        order: baseOrder + index,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
    els.bulkInput.value = "";
    renderImportPreview();
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

function getImportPreviewCards() {
  const termSeparator = getSeparator("term-separator", els.termCustomInput);
  const cardSeparator = getSeparator("card-separator", els.cardCustomInput);
  if (!termSeparator || !cardSeparator) return [];
  return applyDuplicatePolicy(parseCardsWithSeparators(els.bulkInput.value, termSeparator, cardSeparator));
}

function renderImportPreview() {
  const previewCards = getImportPreviewCards();
  els.bulkPreviewCount.textContent = previewCards.length;
  els.bulkAddBtn.disabled = previewCards.length === 0;

  if (!previewCards.length) {
    els.bulkPreview.className = "bulk-preview-empty";
    els.bulkPreview.textContent = "プレビューなし";
    return;
  }

  els.bulkPreview.className = "bulk-preview-list";
  els.bulkPreview.innerHTML = previewCards.slice(0, 6).map((card) => `
    <div class="bulk-preview-row">
      <span>${escapeHtml(card.front)}</span>
      <span>${escapeHtml(card.back)}</span>
    </div>
  `).join("") + (previewCards.length > 6 ? `<div class="bulk-preview-more">ほか ${previewCards.length - 6}枚</div>` : "");
}

function getSeparator(name, customInput) {
  const value = document.querySelector(`input[name='${name}']:checked`)?.value;
  if (value === "tab") return "\t";
  if (value === "comma") return ",";
  if (value === "newline") return "\n";
  if (value === "semicolon") return ";";
  if (value === "custom") return customInput.value;
  return "";
}

function selectCustomSeparator(name) {
  const custom = document.querySelector(`input[name='${name}'][value='custom']`);
  if (custom) custom.checked = true;
  renderImportPreview();
}

function parseCardsWithSeparators(text, termSeparator, cardSeparator) {
  return splitRespectingQuotes(text, cardSeparator)
    .map((chunk) => splitRespectingQuotes(chunk, termSeparator))
    .map(rowToCard)
    .filter(Boolean);
}

function splitRespectingQuotes(text, delimiter) {
  if (!delimiter) return [text];
  const normalized = delimiter === "\n" ? text.replace(/\r\n/g, "\n").replace(/\r/g, "\n") : text;
  const parts = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const next = normalized[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && normalized.slice(i, i + delimiter.length) === delimiter) {
      parts.push(cell);
      cell = "";
      i += delimiter.length - 1;
      continue;
    }

    cell += char;
  }

  parts.push(cell);
  return parts.filter((part) => part.trim());
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
  const scope = els.exportScope.value;
  const exportData = scope === "all"
    ? {
        decks,
        cards: allCards.map(({ front, back, known, deckId, order }) => ({ front, back, known, deckId, order })),
      }
    : getOrderedDeckCards().map(({ front, back, known }) => ({ front, back, known }));
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = scope === "all" ? "flashcards-all.json" : "flashcards.json";
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
      const baseOrder = Date.now();
      nextCards.forEach((card, index) => {
        batch.set(doc(cardCollection()), {
          ...card,
          deckId: currentDeckId,
          order: baseOrder + index,
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
      return applyDuplicatePolicy(imported
        .filter((card) => card?.front && card?.back)
        .map((card) => ({
          front: String(card.front).trim(),
          back: String(card.back).trim(),
          known: Boolean(card.known),
        }))
        .filter((card) => card.front && card.back));
    }
  } catch {
    // JSON以外はCSV/TSVとして扱う
  }
  return applyDuplicatePolicy(parseCardText(text));
}

function applyDuplicatePolicy(nextCards) {
  if (!els.duplicateSkipCheckbox.checked) return nextCards;
  const seen = new Set(getOrderedDeckCards().map((card) => normalizeFront(card.front)));
  return nextCards.filter((card) => {
    const key = normalizeFront(card.front);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

function escapeAttr(value) {
  return escapeHtml(String(value || ""));
}

function formatShortDate(ms) {
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
