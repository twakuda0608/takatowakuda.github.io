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
const DRILL_STORAGE_KEY = "takato-flashcards-drill-v1";
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
let studyOrderMode = "normal";
let lastViewedCardId = null;
let pointerStartX = 0;
let pointerStartY = 0;
let pointerTracking = false;
let flipTimer = null;
let dragCardId = null;
let currentUndo = null;
let undoTimer = null;

// Drill (暗記モード) State
let drillState = {
  view: "start", // "start" | "play" | "set-result" | "complete"
  deckId: DEFAULT_DECK_ID,
  direction: "front",
  setSize: 10,
  pool: [],
  currentSet: [],
  roundCards: [],
  roundIndex: 0,
  roundNumber: 1,
  roundUnlearned: [],
  carryOverCards: [],
  completedCardIds: [],
  lastCarriedOverName: null,
  isReviewInterleaved: false,
  sessionStats: {
    totalAnswered: 0,
    firstTrySuccesses: 0,
    totalSuccesses: 0,
    totalFails: 0,
  },
  showingBack: false,
};

let drillPointerStartX = 0;
let drillPointerStartY = 0;
let drillPointerTracking = false;
let drillFlipTimer = null;

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
  studyOrderSelect: document.getElementById("study-order-select"),
  progressText: document.getElementById("progress-text"),
  prevCard: document.getElementById("prev-card"),
  nextCard: document.getElementById("next-card"),
  flashcard: document.getElementById("flashcard"),
  swipeHintLeft: document.getElementById("swipe-hint-left"),
  swipeHintRight: document.getElementById("swipe-hint-right"),
  cardKnownTag: document.getElementById("card-known-tag"),
  cardQuickEditBtn: document.getElementById("card-quick-edit-btn"),
  cardSide: document.getElementById("card-side"),
  cardMain: document.getElementById("card-main"),
  cardSub: document.getElementById("card-sub"),
  cardEditBtn: document.getElementById("card-edit-btn"),
  shuffleBtn: document.getElementById("shuffle-btn"),
  resetKnownBtn: document.getElementById("reset-known-btn"),
  cardEditModal: document.getElementById("card-edit-modal"),
  cardEditCloseBtn: document.getElementById("card-edit-close-btn"),
  cardEditCancelBtn: document.getElementById("card-edit-cancel-btn"),
  cardEditForm: document.getElementById("card-edit-form"),
  editModalFront: document.getElementById("edit-modal-front"),
  editModalBack: document.getElementById("edit-modal-back"),
  cardEditDeleteBtn: document.getElementById("card-edit-delete-btn"),
  cardEditSaveBtn: document.getElementById("card-edit-save-btn"),
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
  syncStatus: document.getElementById("sync-status"),
  undoToast: document.getElementById("undo-toast"),
  undoMessage: document.getElementById("undo-message"),
  undoBtn: document.getElementById("undo-btn"),

  // Drill Mode Elements
  drillStartView: document.getElementById("drill-start-view"),
  drillPlayView: document.getElementById("drill-play-view"),
  drillSetResultView: document.getElementById("drill-set-result-view"),
  drillCompleteView: document.getElementById("drill-complete-view"),
  drillDeckRate: document.getElementById("drill-deck-rate"),
  drillDeckCount: document.getElementById("drill-deck-count"),
  drillCatMastered: document.getElementById("drill-cat-mastered"),
  drillCatLearning: document.getElementById("drill-cat-learning"),
  drillCatWeak: document.getElementById("drill-cat-weak"),
  drillCatUnseen: document.getElementById("drill-cat-unseen"),
  drillDirectionSelect: document.getElementById("drill-direction-select"),
  drillSetSizeSelect: document.getElementById("drill-set-size-select"),
  drillResumeBox: document.getElementById("drill-resume-box"),
  drillResumeText: document.getElementById("drill-resume-text"),
  drillResumeBtn: document.getElementById("drill-resume-btn"),
  drillRestartBtn: document.getElementById("drill-restart-btn"),
  drillStartBtn: document.getElementById("drill-start-btn"),
  drillFocusList: document.getElementById("drill-focus-list"),
  drillSetBadge: document.getElementById("drill-set-badge"),
  drillRoundBadge: document.getElementById("drill-round-badge"),
  drillProgressText: document.getElementById("drill-progress-text"),
  drillDeckProgressText: document.getElementById("drill-deck-progress-text"),
  drillProgressFill: document.getElementById("drill-progress-fill"),
  drillRoundNotice: document.getElementById("drill-round-notice"),
  drillFlashcard: document.getElementById("drill-flashcard"),
  drillSwipeHintLeft: document.getElementById("drill-swipe-hint-left"),
  drillSwipeHintRight: document.getElementById("drill-swipe-hint-right"),
  drillCardSide: document.getElementById("drill-card-side"),
  drillCardRateTag: document.getElementById("drill-card-rate-tag"),
  drillCardQuickEditBtn: document.getElementById("drill-card-quick-edit-btn"),
  drillCardMain: document.getElementById("drill-card-main"),
  drillCardSub: document.getElementById("drill-card-sub"),
  drillFailBtn: document.getElementById("drill-fail-btn"),
  drillFlipBtn: document.getElementById("drill-flip-btn"),
  drillPassBtn: document.getElementById("drill-pass-btn"),
  drillEditBtn: document.getElementById("drill-edit-btn"),
  drillPauseBtn: document.getElementById("drill-pause-btn"),
  drillSetResultDesc: document.getElementById("drill-set-result-desc"),
  drillCarryOverAlert: document.getElementById("drill-carry-over-alert"),
  drillCarryOverMsg: document.getElementById("drill-carry-over-msg"),
  drillSetLearnedCount: document.getElementById("drill-set-learned-count"),
  drillSetOverallProgress: document.getElementById("drill-set-overall-progress"),
  drillSetRemainingCount: document.getElementById("drill-set-remaining-count"),
  drillNextSetBtn: document.getElementById("drill-next-set-btn"),
  drillSavePauseBtn: document.getElementById("drill-save-pause-btn"),
  drillCompleteTotal: document.getElementById("drill-complete-total"),
  drillCompleteFirstRate: document.getElementById("drill-complete-first-rate"),
  drillCompleteWeakBox: document.getElementById("drill-complete-weak-box"),
  drillCompleteWeakList: document.getElementById("drill-complete-weak-list"),
  drillRestartAllBtn: document.getElementById("drill-restart-all-btn"),
  drillBackDecksBtn: document.getElementById("drill-back-decks-btn"),
};

// Event Listeners
els.loginBtn?.addEventListener("click", () => {
  signInWithPopup(auth, provider).catch((err) => {
    if (err.code !== "auth/popup-closed-by-user") alert("ログインに失敗しました");
  });
});
els.logoutBtn?.addEventListener("click", () => signOut(auth));
els.backToDecksBtn?.addEventListener("click", showDeckList);
els.deckForm?.addEventListener("submit", createDeck);
els.deckRenameForm?.addEventListener("submit", renameDeck);
els.deleteDeckBtn?.addEventListener("click", deleteCurrentDeck);

document.querySelectorAll(".mode-tab").forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

// Regular Flashcard Events
els.flashcard?.addEventListener("click", (event) => {
  if (!cards.length) return;
  if (event.target.closest("#card-quick-edit-btn")) return;
  if (els.flashcard.dataset.dragged === "true") {
    els.flashcard.dataset.dragged = "false";
    return;
  }
  flipCard();
});
els.flashcard?.addEventListener("keydown", (event) => {
  if (event.target.closest("#card-quick-edit-btn")) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (cards.length) flipCard();
  }
});
els.flashcard?.addEventListener("pointerdown", startFlick);
els.flashcard?.addEventListener("pointermove", moveFlick);
els.flashcard?.addEventListener("pointerup", endFlick);
els.flashcard?.addEventListener("pointercancel", cancelFlick);

els.prevCard?.addEventListener("click", () => moveCard(-1, "right"));
els.nextCard?.addEventListener("click", () => moveCard(1, "left"));
els.directionSelect?.addEventListener("change", () => {
  studyDirection = els.directionSelect.value;
  showingBack = false;
  renderCard();
});
els.studyOrderSelect?.addEventListener("change", () => {
  studyOrderMode = els.studyOrderSelect.value;
  studyOrder = [];
  currentIndex = 0;
  showingBack = false;
  render();
});
els.shuffleBtn?.addEventListener("click", shuffleCards);
els.resetKnownBtn?.addEventListener("click", resetKnown);
els.cardEditBtn?.addEventListener("click", openCardEditModal);
els.cardQuickEditBtn?.addEventListener("pointerdown", (event) => event.stopPropagation());
els.cardQuickEditBtn?.addEventListener("pointerup", (event) => event.stopPropagation());
els.cardQuickEditBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  openCardEditModal();
});
els.cardEditCloseBtn?.addEventListener("click", closeCardEditModal);
els.cardEditCancelBtn?.addEventListener("click", closeCardEditModal);
els.cardEditModal?.addEventListener("click", (event) => {
  if (event.target === els.cardEditModal) closeCardEditModal();
});
els.cardEditForm?.addEventListener("submit", saveCardEdit);
document.getElementById("card-edit-delete-group")?.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;
  if (btn.id === "card-edit-delete-btn") {
    const group = document.getElementById("card-edit-delete-group");
    if (group) {
      group.innerHTML = `
        <button type="button" class="danger-btn" id="card-edit-confirm-delete-btn">本当に削除</button>
        <button type="button" class="secondary-btn" id="card-edit-cancel-delete-btn">中止</button>
      `;
    }
    return;
  }
  if (btn.id === "card-edit-cancel-delete-btn") {
    resetModalDeleteButton();
    return;
  }
  if (btn.id === "card-edit-confirm-delete-btn") {
    btn.disabled = true;
    deleteCardFromModal();
    return;
  }
});
[els.editModalFront, els.editModalBack].forEach((textarea) => {
  textarea?.addEventListener("input", () => autoResizeTextarea(textarea));
  textarea?.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      els.cardEditForm.requestSubmit();
    }
  });
});
els.addForm?.addEventListener("submit", addCard);
[els.frontInput, els.backInput].forEach((textarea) => {
  textarea?.addEventListener("input", () => autoResizeTextarea(textarea));
  textarea?.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      els.addForm.requestSubmit();
    }
  });
});
els.bulkAddBtn?.addEventListener("click", addBulkCards);
els.bulkInput?.addEventListener("input", renderImportPreview);
els.termCustomInput?.addEventListener("input", renderImportPreview);
els.cardCustomInput?.addEventListener("input", renderImportPreview);
els.duplicateSkipCheckbox?.addEventListener("change", renderImportPreview);
els.termCustomInput?.addEventListener("focus", () => selectCustomSeparator("term-separator"));
els.cardCustomInput?.addEventListener("focus", () => selectCustomSeparator("card-separator"));
document.querySelectorAll("input[name='term-separator'], input[name='card-separator']").forEach((input) => {
  input.addEventListener("change", renderImportPreview);
});
els.editAddBtn?.addEventListener("click", toggleEditAddPanel);
els.exportBtn?.addEventListener("click", exportCards);
els.importFile?.addEventListener("change", importCards);
document.addEventListener("keydown", handleKeyboard);
els.undoBtn?.addEventListener("click", runUndo);
window.addEventListener("offline", () => setSyncStatus("reconnect"));
window.addEventListener("online", () => setSyncStatus("saved"));
document.addEventListener("pointerdown", (event) => {
  const target = event.target;
  if (target.closest(".inline-edit-form") || target.closest("button[data-action='edit']")) {
    return;
  }
  closeAllInlineEdits();
});

// Drill Mode Events
els.drillStartBtn?.addEventListener("click", () => startDrillSession(false));
els.drillResumeBtn?.addEventListener("click", () => startDrillSession(true));
els.drillRestartBtn?.addEventListener("click", () => startDrillSession(false));
els.drillPassBtn?.addEventListener("click", () => handleDrillAnswer(true));
els.drillFailBtn?.addEventListener("click", () => handleDrillAnswer(false));
els.drillFlipBtn?.addEventListener("click", flipDrillCard);
els.drillPauseBtn?.addEventListener("click", pauseDrillSession);
els.drillNextSetBtn?.addEventListener("click", proceedToNextDrillSet);
els.drillSavePauseBtn?.addEventListener("click", pauseDrillSession);
els.drillRestartAllBtn?.addEventListener("click", () => startDrillSession(false));
els.drillBackDecksBtn?.addEventListener("click", showDeckList);

els.drillEditBtn?.addEventListener("click", openCardEditModal);
els.drillCardQuickEditBtn?.addEventListener("pointerdown", (event) => event.stopPropagation());
els.drillCardQuickEditBtn?.addEventListener("pointerup", (event) => event.stopPropagation());
els.drillCardQuickEditBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  openCardEditModal();
});

els.drillFlashcard?.addEventListener("click", (event) => {
  if (event.target.closest("#drill-card-quick-edit-btn")) return;
  if (els.drillFlashcard.dataset.dragged === "true") {
    els.drillFlashcard.dataset.dragged = "false";
    return;
  }
  flipDrillCard();
});
els.drillFlashcard?.addEventListener("keydown", (event) => {
  if (event.target.closest("#drill-card-quick-edit-btn")) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    flipDrillCard();
  }
});
els.drillFlashcard?.addEventListener("pointerdown", startDrillFlick);
els.drillFlashcard?.addEventListener("pointermove", moveDrillFlick);
els.drillFlashcard?.addEventListener("pointerup", endDrillFlick);
els.drillFlashcard?.addEventListener("pointercancel", cancelDrillFlick);

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
        drillAttempts: Number(data.drillAttempts || 0),
        drillSuccesses: Number(data.drillSuccesses || 0),
        lastStudiedAt: readMillis(data.lastStudiedAt),
        lastKnownAt: readMillis(data.lastKnownAt),
      };
    })
      .filter((card) => card.front && card.back)
      .sort((a, b) => a.order - b.order);
    render();
  }, (err) => {
    setSyncStatus("reconnect");
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
  await saveWithStatus(() => setDoc(userDoc(uid), {
    flashcardDecks: decks,
    currentFlashcardDeckId: currentDeckId,
  }, { merge: true }));
}

async function switchDeck(deckId) {
  if (!decks.some((deck) => deck.id === deckId)) return;
  currentDeckId = deckId;
  currentView = "study";
  currentIndex = 0;
  showingBack = false;
  studyOrder = [];
  drillState.view = "start";
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

  const deletedDeck = { ...deck };
  const deletedCards = allCards.filter((card) => card.deckId === currentDeckId);
  els.deleteDeckBtn.disabled = true;
  try {
    const batch = writeBatch(db);
    deletedCards.forEach((card) => batch.delete(cardDoc(card.id)));
    decks = decks.filter((item) => item.id !== currentDeckId);
    currentDeckId = decks[0].id;
    currentView = "decks";
    currentIndex = 0;
    studyOrder = [];
    clearDrillSession(deletedDeck.id);
    await saveDeckSettings();
    await saveWithStatus(() => batch.commit());
    showUndo("カード集を削除", async () => {
      decks.push(deletedDeck);
      currentDeckId = deletedDeck.id;
      currentView = "study";
      currentIndex = 0;
      studyOrder = [];
      await saveDeckSettings();
      const restoreBatch = writeBatch(db);
      deletedCards.forEach((card) => restoreBatch.set(cardDoc(card.id), cardToDoc(card)));
      return restoreBatch.commit();
    });
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
      drillAttempts: 0,
      drillSuccesses: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await saveWithStatus(() => batch.commit());
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

function setSyncStatus(state) {
  const labels = {
    pending: "保存待ち",
    saving: "保存中",
    saved: "保存済",
    reconnect: "再接続待ち",
  };
  els.syncStatus.textContent = labels[state] || "";
  els.syncStatus.className = `sync-status sync-${state}`;
  els.syncStatus.hidden = !state;
  if (state === "saved") {
    window.setTimeout(() => {
      if (els.syncStatus.classList.contains("sync-saved")) els.syncStatus.hidden = true;
    }, 1400);
  }
}

async function saveWithStatus(task, { silent = false } = {}) {
  if (!silent) {
    if (!navigator.onLine) setSyncStatus("pending");
    else setSyncStatus("saving");
  }
  try {
    const result = await task();
    if (!silent) setSyncStatus("saved");
    return result;
  } catch (error) {
    setSyncStatus("reconnect");
    throw error;
  }
}

function showUndo(message, undo) {
  currentUndo = undo;
  window.clearTimeout(undoTimer);
  els.undoMessage.textContent = message;
  els.undoToast.hidden = false;
  undoTimer = window.setTimeout(clearUndo, 9000);
}

function clearUndo() {
  currentUndo = null;
  els.undoToast.hidden = true;
}

async function runUndo() {
  if (!currentUndo) return;
  const undo = currentUndo;
  clearUndo();
  await saveWithStatus(undo);
}

function cardToDoc(card) {
  return {
    front: card.front,
    back: card.back,
    known: Boolean(card.known),
    deckId: card.deckId || currentDeckId,
    order: card.order || Date.now(),
    createdAt: serverTimestamp(),
    viewCount: card.viewCount || 0,
    flipCount: card.flipCount || 0,
    knownCount: card.knownCount || 0,
    drillAttempts: card.drillAttempts || 0,
    drillSuccesses: card.drillSuccesses || 0,
    lastStudiedAt: card.lastStudiedAt || null,
    lastKnownAt: card.lastKnownAt || null,
    updatedAt: serverTimestamp(),
  };
}

function setMode(nextMode) {
  closeAllInlineEdits();
  mode = nextMode;
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });
  document.querySelectorAll(".mode-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${mode}-panel`);
  });
  if (mode === "drill") {
    renderDrill();
  }
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
  if (mode === "drill") {
    renderDrill();
  }
}

function getStudyCards() {
  const deckCards = allCards.filter((card) => card.deckId === currentDeckId);
  if (studyOrderMode === "weak") {
    return [...deckCards].sort((a, b) => {
      if (a.known !== b.known) return a.known ? 1 : -1;
      return (b.viewCount || 0) - (a.viewCount || 0);
    });
  }
  if (studyOrderMode === "rate-asc") {
    return [...deckCards].sort((a, b) => {
      const rateA = a.drillAttempts ? (a.drillSuccesses / a.drillAttempts) : -1;
      const rateB = b.drillAttempts ? (b.drillSuccesses / b.drillAttempts) : -1;
      return rateA - rateB;
    });
  }
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

function updateCardTextSize(element, text) {
  if (!element) return;
  const str = text || "";
  const len = str.length;
  element.classList.remove("text-short", "text-mid", "text-long", "text-xlarge", "align-left");

  const hasNewline = str.includes("\n");
  const isMultiLine = hasNewline || len > 22;

  if (isMultiLine) {
    element.classList.add("align-left");
  }

  if (len <= 25 && !hasNewline) {
    element.classList.add("text-short");
  } else if (len <= 65) {
    element.classList.add("text-mid");
  } else if (len <= 130) {
    element.classList.add("text-long");
  } else {
    element.classList.add("text-xlarge");
  }
}

function renderCard() {
  const card = cards[currentIndex];
  const hasCards = Boolean(card);
  els.prevCard.disabled = cards.length <= 1;
  els.nextCard.disabled = cards.length <= 1;
  els.shuffleBtn.disabled = cards.length <= 1;
  els.resetKnownBtn.disabled = !cards.some((item) => item.known);
  els.cardEditBtn.disabled = !hasCards;
  if (els.cardQuickEditBtn) {
    els.cardQuickEditBtn.style.display = hasCards ? "inline-flex" : "none";
  }
  els.progressText.textContent = hasCards ? `${currentIndex + 1} / ${cards.length}` : "0 / 0";
  resetSwipeHints();

  if (!hasCards) {
    els.cardSide.textContent = "表";
    els.cardMain.textContent = "カード未追加";
    updateCardTextSize(els.cardMain, "カード未追加");
    els.cardSub.textContent = "下の入力欄から追加";
    if (els.cardKnownTag) els.cardKnownTag.hidden = true;
    return;
  }

  const promptSide = studyDirection === "front" ? "表" : "裏";
  const answerSide = studyDirection === "front" ? "裏" : "表";
  const promptText = studyDirection === "front" ? card.front : card.back;
  const answerText = studyDirection === "front" ? card.back : card.front;
  const mainText = showingBack ? answerText : promptText;
  els.cardSide.textContent = showingBack ? answerSide : promptSide;
  els.cardMain.textContent = mainText;
  updateCardTextSize(els.cardMain, mainText);
  els.cardSub.textContent = showingBack ? `${promptSide}へ` : `${answerSide}へ`;
  if (els.cardKnownTag) {
    els.cardKnownTag.hidden = !card.known;
  }
  recordCardView(card);
}

let currentEditingCardId = null;

function getCurrentActiveCard() {
  if (mode === "drill") {
    if (drillState.view === "play") {
      const cardId = drillState.roundCards[drillState.roundIndex];
      return allCards.find((c) => c.id === cardId) || null;
    }
    return null;
  }
  return cards[currentIndex] || null;
}

function isCurrentActiveCardBack() {
  if (mode === "drill") {
    return Boolean(drillState.showingBack);
  }
  return Boolean(showingBack);
}

function autoResizeTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  const offset = textarea.offsetHeight - textarea.clientHeight;
  const newHeight = textarea.scrollHeight + offset;
  if (newHeight > 0) {
    textarea.style.height = `${newHeight}px`;
  }
}

function resetModalDeleteButton() {
  const group = document.getElementById("card-edit-delete-group");
  if (group) {
    group.innerHTML = `<button type="button" class="danger-btn" id="card-edit-delete-btn">削除</button>`;
  }
}

function closeAllInlineEdits(exceptRow = null) {
  document.querySelectorAll(".list-item.editing-inline").forEach((row) => {
    if (row !== exceptRow) {
      row.classList.remove("editing-inline");
    }
  });
}

function openCardEditModal() {
  const card = getCurrentActiveCard();
  if (!card) return;
  currentEditingCardId = card.id;
  els.editModalFront.value = card.front;
  els.editModalBack.value = card.back;
  resetModalDeleteButton();
  els.cardEditModal.hidden = false;
  autoResizeTextarea(els.editModalFront);
  autoResizeTextarea(els.editModalBack);
  if (isCurrentActiveCardBack()) {
    els.editModalBack.focus();
    els.editModalBack.setSelectionRange(card.back.length, card.back.length);
  } else {
    els.editModalFront.focus();
    els.editModalFront.setSelectionRange(card.front.length, card.front.length);
  }
}

function closeCardEditModal() {
  currentEditingCardId = null;
  resetModalDeleteButton();
  if (els.cardEditModal) {
    els.cardEditModal.hidden = true;
  }
}

async function saveCardEdit(event) {
  event.preventDefault();
  const card = (currentEditingCardId && allCards.find((c) => c.id === currentEditingCardId)) || getCurrentActiveCard();
  if (!card) return;

  const front = els.editModalFront.value.trim();
  const back = els.editModalBack.value.trim();
  if (!front || !back) return;

  els.cardEditSaveBtn.disabled = true;
  try {
    card.front = front;
    card.back = back;
    const targetCard = allCards.find((item) => item.id === card.id);
    if (targetCard) {
      targetCard.front = front;
      targetCard.back = back;
    }
    renderCard();
    if (mode === "drill" && drillState.view === "play") {
      renderDrillPlay();
    }
    renderList();
    closeCardEditModal();
    await saveWithStatus(() => updateDoc(cardDoc(card.id), {
      front,
      back,
      updatedAt: serverTimestamp(),
    }));
  } catch {
    alert("保存に失敗しました");
  } finally {
    els.cardEditSaveBtn.disabled = false;
  }
}

async function deleteCardFromModal() {
  const card = (currentEditingCardId && allCards.find((c) => c.id === currentEditingCardId)) || getCurrentActiveCard();
  if (!card) return;

  const deletedId = card.id;
  closeCardEditModal();
  try {
    if (mode === "drill") {
      drillState.roundCards = drillState.roundCards.filter((id) => id !== deletedId);
      drillState.currentSet = drillState.currentSet.filter((id) => id !== deletedId);
      drillState.pool = drillState.pool.filter((id) => id !== deletedId);
      drillState.roundUnlearned = drillState.roundUnlearned.filter((id) => id !== deletedId);
      drillState.carryOverCards = drillState.carryOverCards.filter((id) => id !== deletedId);
      drillState.completedCardIds = drillState.completedCardIds.filter((id) => id !== deletedId);
      if (drillState.roundIndex >= drillState.roundCards.length) {
        drillState.roundIndex = Math.max(0, drillState.roundCards.length - 1);
      }
      saveDrillSession();
      if (drillState.roundCards.length === 0) {
        processDrillRoundCompletion();
      } else {
        renderDrillPlay();
      }
    }
    await saveWithStatus(() => deleteDoc(cardDoc(deletedId)));
    showUndo("カードを削除", () => setDoc(cardDoc(deletedId), cardToDoc(card)));
  } catch {
    alert("削除に失敗しました");
  }
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
  els.cardList.innerHTML = listCards.map((card, index) => {
    let rateBadge = "";
    if (card.drillAttempts && card.drillAttempts > 0) {
      const rate = Math.round((card.drillSuccesses / card.drillAttempts) * 100);
      if (rate >= 80) {
        rateBadge = `<span class="rate-badge rate-high">暗記率 ${rate}%</span>`;
      } else if (rate >= 50) {
        rateBadge = `<span class="rate-badge rate-mid">暗記率 ${rate}%</span>`;
      } else {
        rateBadge = `<span class="rate-badge rate-low">暗記率 ${rate}% (苦手)</span>`;
      }
    } else {
      rateBadge = `<span class="rate-badge rate-none">未学習</span>`;
    }

    const rateText = card.drillAttempts
      ? `${Math.round((card.drillSuccesses / card.drillAttempts) * 100)}% (${card.drillSuccesses}/${card.drillAttempts}回)`
      : "未回答";

    return `
      <div class="list-item${duplicateMap.has(normalizeFront(card.front)) ? " duplicate-item" : ""}${editing ? " reorder-enabled" : ""}"
        data-id="${card.id}">
        ${editing ? '<span class="drag-handle" draggable="true" title="ドラッグして並び替え" aria-label="並び替え">&#8801;</span>' : ''}
        <div class="list-word list-front">
          ${escapeHtml(card.front)}
          ${duplicateMap.has(normalizeFront(card.front)) ? '<span class="duplicate-badge">重複</span>' : ''}
          ${rateBadge}
        </div>
        <div class="list-word list-back">${escapeHtml(card.back)}</div>
        <div class="mini-actions">
          ${editing ? `<button type="button" class="mini-btn" data-action="edit" data-index="${index}">編集</button>` : ""}
          <button type="button" class="mini-btn delete" data-action="delete" data-index="${index}">削除</button>
        </div>
        ${editing ? `
          <form class="inline-edit-form" data-id="${card.id}">
            <textarea name="front" rows="2" placeholder="表">${escapeHtml(card.front)}</textarea>
            <textarea name="back" rows="2" placeholder="裏">${escapeHtml(card.back)}</textarea>
            <button type="submit" class="primary-btn">更新</button>
          </form>
        ` : ""}
        <div class="history-line">
          <span>暗記率: ${rateText}</span>
          <span>学習 ${card.viewCount || 0}回</span>
          <span>反転 ${card.flipCount || 0}回</span>
          ${card.lastStudiedAt ? `<span>最終 ${formatShortDate(card.lastStudiedAt)}</span>` : ""}
        </div>
      </div>
    `;
  }).join("");

  els.cardList.onclick = async (event) => {
    const button = event.target.closest("button");
    if (!button || !els.cardList.contains(button)) return;
    const action = button.dataset.action;
    if (!action) return;
    const index = Number(button.dataset.index);
    const card = listCards[index];

    if (action === "edit") {
      const row = button.closest(".list-item");
      if (row) {
        closeAllInlineEdits(row);
        const isOpening = row.classList.toggle("editing-inline");
        if (isOpening) {
          row.querySelectorAll(".inline-edit-form textarea").forEach((ta) => {
            autoResizeTextarea(ta);
          });
          row.querySelector(".inline-edit-form textarea")?.focus();
        }
      }
      return;
    }

    if (action === "delete") {
      const miniActions = button.closest(".mini-actions");
      if (miniActions) {
        miniActions.innerHTML = `
          <button type="button" class="mini-btn confirm-delete" data-action="confirm-delete" data-index="${index}">本当に削除</button>
          <button type="button" class="mini-btn cancel-delete" data-action="cancel-delete" data-index="${index}">中止</button>
        `;
      }
      return;
    }

    if (action === "cancel-delete") {
      const miniActions = button.closest(".mini-actions");
      if (miniActions) {
        miniActions.innerHTML = `
          ${editing ? `<button type="button" class="mini-btn" data-action="edit" data-index="${index}">編集</button>` : ""}
          <button type="button" class="mini-btn delete" data-action="delete" data-index="${index}">削除</button>
        `;
      }
      return;
    }

    if (action === "confirm-delete") {
      if (!card) return;
      button.disabled = true;
      await saveWithStatus(() => deleteDoc(cardDoc(card.id)));
      showUndo("カードを削除", () => setDoc(cardDoc(card.id), cardToDoc(card)));
      return;
    }
  };
  els.cardList.querySelectorAll(".inline-edit-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const front = form.elements.front.value.trim();
      const back = form.elements.back.value.trim();
      if (!front || !back) return;
      const btn = form.querySelector("button");
      btn.disabled = true;
      const row = form.closest(".list-item");
      try {
        await saveWithStatus(() => updateDoc(cardDoc(form.dataset.id), { front, back, updatedAt: serverTimestamp() }));
        row?.classList.remove("editing-inline");
      } finally {
        btn.disabled = false;
      }
    });
  });
  els.cardList.querySelectorAll(".inline-edit-form textarea").forEach((textarea) => {
    textarea.addEventListener("input", () => autoResizeTextarea(textarea));
    textarea.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        textarea.closest("form")?.requestSubmit();
      }
    });
  });
  setupListDrag();
}

function setupListDrag() {
  els.cardList.querySelectorAll(".drag-handle[draggable='true']").forEach((handle) => {
    handle.addEventListener("dragstart", (event) => {
      const item = handle.closest(".list-item");
      if (!item) return;
      dragCardId = item.dataset.id;
      item.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", dragCardId);
      if (event.dataTransfer.setDragImage) {
        event.dataTransfer.setDragImage(item, 20, 20);
      }
    });

    handle.addEventListener("dragend", () => {
      dragCardId = null;
      clearDragTargets();
    });
  });

  els.cardList.querySelectorAll(".list-item").forEach((item) => {
    item.addEventListener("dragover", (event) => {
      if (!dragCardId || item.dataset.id === dragCardId) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      clearDragTargets(item);
      const rect = item.getBoundingClientRect();
      const before = event.clientY < rect.top + rect.height / 2;
      item.classList.remove(before ? "drag-over-after" : "drag-over-before");
      item.classList.add(before ? "drag-over-before" : "drag-over-after");
      item.dataset.dropPosition = before ? "before" : "after";
    });

    item.addEventListener("dragleave", (event) => {
      if (!item.contains(event.relatedTarget)) {
        item.classList.remove("drag-over-before", "drag-over-after");
        delete item.dataset.dropPosition;
      }
    });

    item.addEventListener("drop", async (event) => {
      if (!dragCardId || dragCardId === item.dataset.id) return;
      event.preventDefault();
      const targetId = item.dataset.id;
      const position = item.dataset.dropPosition || "before";
      clearDragTargets();
      await reorderCards(dragCardId, targetId, position);
      dragCardId = null;
    });
  });
}

function clearDragTargets(exceptItem = null) {
  els.cardList.querySelectorAll(".dragging, .drag-over-before, .drag-over-after").forEach((item) => {
    if (item !== exceptItem) {
      item.classList.remove("drag-over-before", "drag-over-after");
      delete item.dataset.dropPosition;
    }
    if (!dragCardId && item !== exceptItem) {
      item.classList.remove("dragging");
    }
  });
}

async function reorderCards(sourceId, targetId, position) {
  const nextCards = getOrderedDeckCards();
  const previous = nextCards.map((card) => ({ id: card.id, order: card.order }));
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
  await saveWithStatus(() => batch.commit());
  showUndo("並び替え", () => {
    const undoBatch = writeBatch(db);
    previous.forEach((item) => undoBatch.update(cardDoc(item.id), { order: item.order, updatedAt: serverTimestamp() }));
    return undoBatch.commit();
  });
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

function resetSwipeHints() {
  if (els.swipeHintLeft) els.swipeHintLeft.style.opacity = "0";
  if (els.swipeHintRight) els.swipeHintRight.style.opacity = "0";
}

function startFlick(event) {
  if (event.target.closest(".card-quick-edit-btn")) return;
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
  const limited = Math.max(-140, Math.min(140, dx));
  els.flashcard.style.transform = `translateX(${limited}px) rotate(${limited / 14}deg)`;

  if (dx > 0) {
    const opacity = Math.min(1, Math.max(0, (dx - 10) / 60));
    if (els.swipeHintRight) els.swipeHintRight.style.opacity = String(opacity);
    if (els.swipeHintLeft) els.swipeHintLeft.style.opacity = "0";
  } else {
    const opacity = Math.min(1, Math.max(0, (-dx - 10) / 60));
    if (els.swipeHintLeft) els.swipeHintLeft.style.opacity = String(opacity);
    if (els.swipeHintRight) els.swipeHintRight.style.opacity = "0";
  }
}

function endFlick(event) {
  if (!pointerTracking) return;
  const dx = event.clientX - pointerStartX;
  const dy = event.clientY - pointerStartY;
  pointerTracking = false;
  resetSwipeHints();

  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.1) {
    els.flashcard.style.transform = "";
    if (dx > 0) {
      swipeMarkCard(true);
    } else {
      swipeMarkCard(false);
    }
  } else {
    els.flashcard.style.transform = "";
  }
}

function cancelFlick() {
  pointerTracking = false;
  resetSwipeHints();
  els.flashcard.style.transform = "";
}

async function swipeMarkCard(isKnown) {
  const card = cards[currentIndex];
  if (!card) return;

  animateCardAction(isKnown ? "known" : "unknown");

  const data = {
    known: isKnown,
    knownCount: isKnown ? (card.knownCount || 0) + 1 : (card.knownCount || 0),
    lastStudiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (isKnown) data.lastKnownAt = serverTimestamp();

  card.known = isKnown;
  if (isKnown) card.knownCount = (card.knownCount || 0) + 1;

  window.setTimeout(() => {
    els.flashcard.classList.remove("flick-known", "flick-unknown");
    els.flashcard.style.transform = "";
    if (cards.length > 1) {
      currentIndex = (currentIndex + 1) % cards.length;
    }
    showingBack = false;
    render();
  }, 200);

  await saveWithStatus(() => updateDoc(cardDoc(card.id), data), { silent: true });
}

function handleKeyboard(event) {
  if (els.cardEditModal && !els.cardEditModal.hidden) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeCardEditModal();
    }
    return;
  }

  const active = document.activeElement;
  const typing = active && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName);
  if (typing || currentView !== "study") return;

  if (mode === "cards") {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      swipeMarkCard(false);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      swipeMarkCard(true);
    } else if (event.key === " ") {
      event.preventDefault();
      if (cards.length) flipCard();
    } else if (event.key === "e" || event.key === "E") {
      event.preventDefault();
      if (cards.length) openCardEditModal();
    }
  } else if (mode === "drill" && drillState.view === "play") {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      event.preventDefault();
      handleDrillAnswer(false);
    } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      event.preventDefault();
      handleDrillAnswer(true);
    } else if (event.key === " ") {
      event.preventDefault();
      flipDrillCard();
    } else if (event.key === "e" || event.key === "E") {
      event.preventDefault();
      openCardEditModal();
    } else if (event.key === "Escape") {
      event.preventDefault();
      pauseDrillSession();
    }
  }
}

function animateCardAction(type) {
  els.flashcard.classList.remove("flick-known", "flick-unknown", "flick-left", "flick-right");
  void els.flashcard.offsetWidth;
  if (type === "known") {
    els.flashcard.classList.add("flick-known");
  } else if (type === "unknown") {
    els.flashcard.classList.add("flick-unknown");
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
  studyOrder = shuffleArray(studyOrder);
  currentIndex = 0;
  showingBack = false;
  render();
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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

async function resetKnown() {
  const batch = writeBatch(db);
  cards.filter((card) => card.known).forEach((card) => {
    batch.update(cardDoc(card.id), { known: false, updatedAt: serverTimestamp() });
  });
  await saveWithStatus(() => batch.commit());
}

async function addCard(event) {
  event.preventDefault();
  const front = els.frontInput.value.trim();
  const back = els.backInput.value.trim();
  if (!front || !back) return;

  const btn = els.addForm.querySelector("button[type='submit']");
  btn.disabled = true;
  try {
    await saveWithStatus(() => addDoc(cardCollection(), {
      front,
      back,
      known: false,
      deckId: currentDeckId,
      order: Date.now(),
      drillAttempts: 0,
      drillSuccesses: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    els.addForm.reset();
    els.frontInput.style.height = "";
    els.backInput.style.height = "";
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
    const createdIds = [];
    nextCards.forEach((card, index) => {
      const ref = doc(cardCollection());
      createdIds.push(ref.id);
      batch.set(ref, {
        ...card,
        deckId: currentDeckId,
        order: baseOrder + index,
        drillAttempts: 0,
        drillSuccesses: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await saveWithStatus(() => batch.commit());
    showUndo("一括追加", () => deleteCardsByIds(createdIds));
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
  return { front: front.trim(), back, known: false, drillAttempts: 0, drillSuccesses: 0 };
}

function exportCards() {
  const scope = els.exportScope.value;
  const exportData = scope === "all"
    ? {
        decks,
        cards: allCards.map(({ front, back, known, deckId, order, drillAttempts, drillSuccesses }) => ({
          front, back, known, deckId, order, drillAttempts: drillAttempts || 0, drillSuccesses: drillSuccesses || 0
        })),
      }
    : getOrderedDeckCards().map(({ front, back, known, drillAttempts, drillSuccesses }) => ({
        front, back, known, drillAttempts: drillAttempts || 0, drillSuccesses: drillSuccesses || 0
      }));
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
      const createdIds = [];
      nextCards.forEach((card, index) => {
        const ref = doc(cardCollection());
        createdIds.push(ref.id);
        batch.set(ref, {
          ...card,
          deckId: currentDeckId,
          order: baseOrder + index,
          drillAttempts: card.drillAttempts || 0,
          drillSuccesses: card.drillSuccesses || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await saveWithStatus(() => batch.commit());
      showUndo("読み込み", () => deleteCardsByIds(createdIds));
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

function deleteCardsByIds(ids) {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(cardDoc(id)));
  return batch.commit();
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
          drillAttempts: Number(card.drillAttempts || 0),
          drillSuccesses: Number(card.drillSuccesses || 0),
        }))
        .filter((card) => card.front && card.back));
    }
    if (imported && Array.isArray(imported.cards)) {
      return applyDuplicatePolicy(imported.cards
        .filter((card) => card?.front && card?.back)
        .map((card) => ({
          front: String(card.front).trim(),
          back: String(card.back).trim(),
          known: Boolean(card.known),
          drillAttempts: Number(card.drillAttempts || 0),
          drillSuccesses: Number(card.drillSuccesses || 0),
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

// ==========================================
// DRILL MODE (暗記モード) IMPLEMENTATION
// ==========================================

function getSavedDrillSession(deckId = currentDeckId) {
  try {
    const raw = localStorage.getItem(`${DRILL_STORAGE_KEY}_${deckId}`);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || !Array.isArray(session.currentSet)) return null;

    // Validate if saved cards still exist in deck
    const deckCardIds = new Set(getOrderedDeckCards().map((c) => c.id));
    session.pool = (session.pool || []).filter((id) => deckCardIds.has(id));
    session.currentSet = (session.currentSet || []).filter((id) => deckCardIds.has(id));
    session.roundCards = (session.roundCards || []).filter((id) => deckCardIds.has(id));
    session.carryOverCards = (session.carryOverCards || []).filter((id) => deckCardIds.has(id));
    session.completedCardIds = (session.completedCardIds || []).filter((id) => deckCardIds.has(id));

    if (session.currentSet.length === 0 && session.pool.length === 0 && session.carryOverCards.length === 0) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveDrillSession() {
  try {
    localStorage.setItem(`${DRILL_STORAGE_KEY}_${drillState.deckId}`, JSON.stringify(drillState));
  } catch {
    // ignore quota errors
  }
}

function clearDrillSession(deckId = drillState.deckId) {
  try {
    localStorage.removeItem(`${DRILL_STORAGE_KEY}_${deckId}`);
  } catch {
    // ignore
  }
}

function renderDrill() {
  const deckCards = getOrderedDeckCards();

  // Hide all drill subviews first
  els.drillStartView.hidden = true;
  els.drillPlayView.hidden = true;
  els.drillSetResultView.hidden = true;
  els.drillCompleteView.hidden = true;

  if (drillState.view === "play") {
    renderDrillPlay();
    els.drillPlayView.hidden = false;
  } else if (drillState.view === "set-result") {
    renderDrillSetResult();
    els.drillSetResultView.hidden = false;
  } else if (drillState.view === "complete") {
    renderDrillComplete();
    els.drillCompleteView.hidden = false;
  } else {
    // Start view
    renderDrillStart(deckCards);
    els.drillStartView.hidden = false;
  }
}

function renderDrillStart(deckCards) {
  const total = deckCards.length;
  let masteredCount = 0;
  let learningCount = 0;
  let weakCount = 0;
  let unseenCount = 0;
  let totalAttempts = 0;
  let totalSuccesses = 0;

  deckCards.forEach((card) => {
    if (!card.drillAttempts || card.drillAttempts === 0) {
      unseenCount++;
    } else {
      totalAttempts += card.drillAttempts;
      totalSuccesses += (card.drillSuccesses || 0);
      const rate = (card.drillSuccesses || 0) / card.drillAttempts;
      if (rate >= 0.8) masteredCount++;
      else if (rate >= 0.5) learningCount++;
      else weakCount++;
    }
  });

  const overallRate = totalAttempts > 0 ? Math.round((totalSuccesses / totalAttempts) * 100) : 0;
  els.drillDeckRate.textContent = `${overallRate}%`;
  els.drillDeckCount.textContent = `${total}枚`;
  els.drillCatMastered.textContent = masteredCount;
  els.drillCatLearning.textContent = learningCount;
  els.drillCatWeak.textContent = weakCount;
  els.drillCatUnseen.textContent = unseenCount;

  // Check saved session
  const saved = getSavedDrillSession(currentDeckId);
  if (saved && saved.view !== "complete") {
    els.drillResumeBox.hidden = false;
    const completed = saved.completedCardIds?.length || 0;
    els.drillResumeText.textContent = `習得済: ${completed} / ${total}枚 (残り ${Math.max(0, total - completed)}枚)`;
  } else {
    els.drillResumeBox.hidden = true;
  }

  // Render weak cards focus ranking
  const sorted = [...deckCards].sort((a, b) => {
    const rateA = a.drillAttempts ? (a.drillSuccesses / a.drillAttempts) : -1;
    const rateB = b.drillAttempts ? (b.drillSuccesses / b.drillAttempts) : -1;
    if (rateA !== rateB) return rateA - rateB;
    return (b.drillAttempts || 0) - (a.drillAttempts || 0);
  });

  if (!sorted.length) {
    els.drillFocusList.innerHTML = `<div class="empty-message">カードがありません</div>`;
    return;
  }

  els.drillFocusList.innerHTML = sorted.slice(0, 8).map((card) => {
    let statText = "未学習";
    let badgeClass = "rate-none";
    if (card.drillAttempts && card.drillAttempts > 0) {
      const rate = Math.round((card.drillSuccesses / card.drillAttempts) * 100);
      statText = `暗記率 ${rate}% (${card.drillSuccesses}/${card.drillAttempts})`;
      if (rate >= 80) badgeClass = "rate-high";
      else if (rate >= 50) badgeClass = "rate-mid";
      else badgeClass = "rate-low";
    }
    return `
      <div class="drill-focus-item">
        <span class="drill-focus-front">${escapeHtml(card.front)}</span>
        <span class="drill-focus-back">${escapeHtml(card.back)}</span>
        <span class="drill-focus-stat ${badgeClass}">${statText}</span>
      </div>
    `;
  }).join("");
}

function startDrillSession(resume = false) {
  const deckCards = getOrderedDeckCards();
  if (!deckCards.length) {
    alert("カード集にカードがありません");
    return;
  }

  if (resume) {
    const saved = getSavedDrillSession(currentDeckId);
    if (saved) {
      drillState = {
        ...saved,
        deckId: currentDeckId,
        view: "play",
        showingBack: false,
      };
      if (drillState.roundIndex >= drillState.roundCards.length) {
        drillState.roundIndex = 0;
      }
      saveDrillSession();
      renderDrill();
      return;
    }
  }

  // Start fresh drill session
  const setSize = parseInt(els.drillSetSizeSelect.value, 10) || 10;
  const direction = els.drillDirectionSelect.value || "front";
  const allShuffledIds = shuffleArray(deckCards.map((c) => c.id));

  drillState = {
    view: "play",
    deckId: currentDeckId,
    direction,
    setSize,
    pool: allShuffledIds,
    currentSet: [],
    roundCards: [],
    roundIndex: 0,
    roundNumber: 1,
    roundUnlearned: [],
    carryOverCards: [],
    completedCardIds: [],
    lastCarriedOverName: null,
    isReviewInterleaved: false,
    sessionStats: {
      totalAnswered: 0,
      firstTrySuccesses: 0,
      totalSuccesses: 0,
      totalFails: 0,
    },
    showingBack: false,
  };

  initNextDrillSet();
}

function initNextDrillSet() {
  const setSize = drillState.setSize || 10;
  const needed = setSize - drillState.carryOverCards.length;
  const newBatch = drillState.pool.splice(0, Math.max(0, needed));
  drillState.currentSet = shuffleArray([...drillState.carryOverCards, ...newBatch]);
  drillState.carryOverCards = [];
  drillState.roundCards = [...drillState.currentSet];
  drillState.roundIndex = 0;
  drillState.roundNumber = 1;
  drillState.roundUnlearned = [];
  drillState.showingBack = false;
  drillState.isReviewInterleaved = false;
  drillState.view = "play";

  saveDrillSession();
  renderDrill();
}

function renderDrillPlay() {
  const cardId = drillState.roundCards[drillState.roundIndex];
  const card = allCards.find((c) => c.id === cardId);
  const totalDeckCards = getOrderedDeckCards().length;
  const completedCount = drillState.completedCardIds.length;

  resetDrillSwipeHints();

  if (!card) {
    processDrillRoundCompletion();
    return;
  }

  // Meta Badges
  const roundText = `${drillState.roundNumber}周目`;
  els.drillRoundBadge.textContent = roundText;
  els.drillRoundBadge.classList.toggle("retry-round", drillState.roundNumber > 1);

  const setTotal = Math.ceil(totalDeckCards / (drillState.setSize || 10));
  const currentSetNum = Math.min(setTotal, Math.floor(completedCount / (drillState.setSize || 10)) + 1);
  els.drillSetBadge.textContent = `セット ${currentSetNum} / ${setTotal}`;

  // Progress Text
  els.drillProgressText.textContent = `${drillState.roundIndex + 1} / ${drillState.roundCards.length}枚`;
  els.drillDeckProgressText.textContent = `全体 ${completedCount} / ${totalDeckCards}枚 習得`;

  // Progress Track Fill
  const percent = totalDeckCards > 0 ? Math.round((completedCount / totalDeckCards) * 100) : 0;
  els.drillProgressFill.style.width = `${percent}%`;

  // Banner Notice for Round 2+
  if (drillState.roundNumber > 1) {
    els.drillRoundNotice.hidden = false;
    if (drillState.isReviewInterleaved) {
      els.drillRoundNotice.textContent = `💡 残り1枚の定着確認のため、復習カードと一緒に再出題しています`;
    } else {
      els.drillRoundNotice.textContent = `🔄 ${drillState.roundNumber}周目: 覚えられなかった ${drillState.roundCards.length}枚 を再挑戦`;
    }
  } else {
    els.drillRoundNotice.hidden = true;
  }

  // Card Content
  const promptSide = drillState.direction === "front" ? "表" : "裏";
  const answerSide = drillState.direction === "front" ? "裏" : "表";
  const promptText = drillState.direction === "front" ? card.front : card.back;
  const answerText = drillState.direction === "front" ? card.back : card.front;
  const mainText = drillState.showingBack ? answerText : promptText;

  if (els.drillEditBtn) els.drillEditBtn.disabled = !card;
  if (els.drillCardQuickEditBtn) {
    els.drillCardQuickEditBtn.style.display = card ? "inline-flex" : "none";
  }

  els.drillCardSide.textContent = drillState.showingBack ? answerSide : promptSide;
  els.drillCardMain.textContent = mainText;
  updateCardTextSize(els.drillCardMain, mainText);
  els.drillCardSub.textContent = drillState.showingBack ? `${promptSide}へ` : `タップまたはSpaceで${answerSide}へ`;

  // Rate Tag on Card
  if (card.drillAttempts && card.drillAttempts > 0) {
    const rate = Math.round((card.drillSuccesses / card.drillAttempts) * 100);
    els.drillCardRateTag.textContent = `暗記率: ${rate}% (${card.drillSuccesses}/${card.drillAttempts})`;
    els.drillCardRateTag.className = "card-rate-tag";
    if (rate >= 80) els.drillCardRateTag.classList.add("rate-high");
    else if (rate >= 50) els.drillCardRateTag.classList.add("rate-mid");
    else els.drillCardRateTag.classList.add("rate-low");
  } else {
    els.drillCardRateTag.textContent = "未出題";
    els.drillCardRateTag.className = "card-rate-tag";
  }
}

function flipDrillCard() {
  const cardId = drillState.roundCards[drillState.roundIndex];
  const card = allCards.find((c) => c.id === cardId);
  if (card) {
    updateDoc(cardDoc(card.id), {
      flipCount: (card.flipCount || 0) + 1,
      lastStudiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  }
  window.clearTimeout(drillFlipTimer);
  els.drillFlashcard.classList.remove("is-flipping");
  void els.drillFlashcard.offsetWidth;
  els.drillFlashcard.classList.add("is-flipping");
  drillFlipTimer = window.setTimeout(() => {
    drillState.showingBack = !drillState.showingBack;
    renderDrillPlay();
  }, 150);
  window.setTimeout(() => {
    els.drillFlashcard.classList.remove("is-flipping");
  }, 320);
}

async function handleDrillAnswer(isKnown) {
  const cardId = drillState.roundCards[drillState.roundIndex];
  const card = allCards.find((c) => c.id === cardId);

  animateDrillCardAction(isKnown ? "known" : "unknown");

  if (card) {
    const attempts = (card.drillAttempts || 0) + 1;
    const successes = isKnown ? (card.drillSuccesses || 0) + 1 : (card.drillSuccesses || 0);
    card.drillAttempts = attempts;
    card.drillSuccesses = successes;

    const data = {
      drillAttempts: attempts,
      drillSuccesses: successes,
      lastStudiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (isKnown) {
      card.known = true;
      card.knownCount = (card.knownCount || 0) + 1;
      card.lastKnownAt = Date.now();
      data.known = true;
      data.knownCount = card.knownCount;
      data.lastKnownAt = serverTimestamp();
    }
    saveWithStatus(() => updateDoc(cardDoc(card.id), data), { silent: true }).catch(() => {});
  }

  // Update session stats
  drillState.sessionStats.totalAnswered++;
  if (isKnown) {
    drillState.sessionStats.totalSuccesses++;
    if (drillState.roundNumber === 1) {
      drillState.sessionStats.firstTrySuccesses++;
    }
  } else {
    drillState.sessionStats.totalFails++;
    drillState.roundUnlearned.push(cardId);
  }

  window.setTimeout(() => {
    els.drillFlashcard.classList.remove("flick-known", "flick-unknown");
    els.drillFlashcard.style.transform = "";

    drillState.roundIndex++;
    drillState.showingBack = false;

    if (drillState.roundIndex < drillState.roundCards.length) {
      renderDrillPlay();
      saveDrillSession();
    } else {
      processDrillRoundCompletion();
    }
  }, 200);
}

function processDrillRoundCompletion() {
  // Case 1: All cards in the round were marked known
  if (drillState.roundUnlearned.length === 0) {
    // Add all cards from currentSet to completedCardIds
    drillState.currentSet.forEach((id) => {
      if (!drillState.completedCardIds.includes(id)) {
        drillState.completedCardIds.push(id);
      }
    });

    // Check if entire deck is complete
    if (drillState.pool.length === 0 && drillState.carryOverCards.length === 0) {
      clearDrillSession();
      drillState.view = "complete";
      renderDrill();
      return;
    }

    drillState.lastCarriedOverName = null;
    drillState.view = "set-result";
    saveDrillSession();
    renderDrill();
    return;
  }

  // Case 2: Exactly 1 card left unlearned
  // User Rule: "最後の暗記済み9，未暗記1になったら，そのカードは連続して現れるので，次の10個セットに持ち越し．"
  if (drillState.roundUnlearned.length === 1) {
    const unlearnedId = drillState.roundUnlearned[0];
    const unlearnedCard = allCards.find((c) => c.id === unlearnedId);

    // If there are more cards in the pool, carry over to next set!
    if (drillState.pool.length > 0) {
      drillState.carryOverCards = [unlearnedId];
      drillState.lastCarriedOverName = unlearnedCard ? unlearnedCard.front : "単語";

      // Mark other mastered cards in this set as completed
      drillState.currentSet.forEach((id) => {
        if (id !== unlearnedId && !drillState.completedCardIds.includes(id)) {
          drillState.completedCardIds.push(id);
        }
      });

      drillState.view = "set-result";
      saveDrillSession();
      renderDrill();
      return;
    }

    // Pool is empty: interleave review cards if possible
    if (drillState.completedCardIds.length >= 2) {
      const reviewSample = shuffleArray([...drillState.completedCardIds]).slice(0, 2);
      drillState.roundCards = shuffleArray([unlearnedId, ...reviewSample]);
      drillState.roundIndex = 0;
      drillState.roundNumber++;
      drillState.roundUnlearned = [];
      drillState.isReviewInterleaved = true;
      saveDrillSession();
      renderDrill();
      return;
    }

    // Single card retry
    drillState.roundCards = [...drillState.roundUnlearned];
    drillState.roundIndex = 0;
    drillState.roundNumber++;
    drillState.roundUnlearned = [];
    drillState.isReviewInterleaved = false;
    saveDrillSession();
    renderDrill();
    return;
  }

  // Case 3: More than 1 card unlearned
  drillState.roundCards = shuffleArray([...drillState.roundUnlearned]);
  drillState.roundIndex = 0;
  drillState.roundNumber++;
  drillState.roundUnlearned = [];
  drillState.isReviewInterleaved = false;
  saveDrillSession();
  renderDrill();
}

function renderDrillSetResult() {
  const totalDeckCards = getOrderedDeckCards().length;
  const completedCount = drillState.completedCardIds.length;
  const remaining = Math.max(0, totalDeckCards - completedCount);
  const percent = totalDeckCards > 0 ? Math.round((completedCount / totalDeckCards) * 100) : 0;

  // Carried over notice
  if (drillState.lastCarriedOverName) {
    els.drillCarryOverAlert.hidden = false;
    els.drillCarryOverMsg.textContent = `「${drillState.lastCarriedOverName}」は連続出題を防ぐため、次のセットに持ち越しました。`;
    els.drillSetResultDesc.textContent = "セット内の他のカードをすべて暗記しました！";
  } else {
    els.drillCarryOverAlert.hidden = true;
    els.drillSetResultDesc.textContent = "このセットのすべてのカードを暗記しました！";
  }

  const setSize = drillState.setSize || 10;
  const learnedInSet = drillState.lastCarriedOverName ? setSize - 1 : setSize;
  els.drillSetLearnedCount.textContent = `${Math.max(1, learnedInSet)}枚`;
  els.drillSetOverallProgress.textContent = `${completedCount} / ${totalDeckCards}枚 (${percent}%)`;
  els.drillSetRemainingCount.textContent = `${remaining}枚`;
}

function proceedToNextDrillSet() {
  initNextDrillSet();
}

function pauseDrillSession() {
  saveDrillSession();
  drillState.view = "start";
  renderDrill();
}

function renderDrillComplete() {
  const totalDeckCards = getOrderedDeckCards().length;
  const totalAnswered = drillState.sessionStats.totalAnswered || 1;
  const firstRate = Math.round(((drillState.sessionStats.firstTrySuccesses || 0) / Math.max(1, totalDeckCards)) * 100);

  els.drillCompleteTotal.textContent = `${totalDeckCards}枚`;
  els.drillCompleteFirstRate.textContent = `${firstRate}%`;

  // Find lowest rate cards in this deck
  const weakCards = getOrderedDeckCards()
    .filter((c) => c.drillAttempts && (c.drillSuccesses / c.drillAttempts) < 0.75)
    .sort((a, b) => (a.drillSuccesses / a.drillAttempts) - (b.drillSuccesses / b.drillAttempts))
    .slice(0, 5);

  if (weakCards.length) {
    els.drillCompleteWeakBox.hidden = false;
    els.drillCompleteWeakList.innerHTML = weakCards.map((c) => {
      const rate = Math.round((c.drillSuccesses / c.drillAttempts) * 100);
      return `
        <div class="drill-weak-item">
          <span>${escapeHtml(c.front)}: ${escapeHtml(c.back)}</span>
          <span class="rate-badge rate-low">暗記率 ${rate}%</span>
        </div>
      `;
    }).join("");
  } else {
    els.drillCompleteWeakBox.hidden = true;
  }
}

function animateDrillCardAction(type) {
  els.drillFlashcard.classList.remove("flick-known", "flick-unknown", "flick-left", "flick-right");
  void els.drillFlashcard.offsetWidth;
  if (type === "known") {
    els.drillFlashcard.classList.add("flick-known");
  } else if (type === "unknown") {
    els.drillFlashcard.classList.add("flick-unknown");
  }
}

function resetDrillSwipeHints() {
  if (els.drillSwipeHintLeft) els.drillSwipeHintLeft.style.opacity = "0";
  if (els.drillSwipeHintRight) els.drillSwipeHintRight.style.opacity = "0";
}

function startDrillFlick(event) {
  if (event.target.closest(".card-quick-edit-btn")) return;
  drillPointerTracking = true;
  drillPointerStartX = event.clientX;
  drillPointerStartY = event.clientY;
  els.drillFlashcard.dataset.dragged = "false";
  els.drillFlashcard.setPointerCapture?.(event.pointerId);
}

function moveDrillFlick(event) {
  if (!drillPointerTracking) return;
  const dx = event.clientX - drillPointerStartX;
  const dy = event.clientY - drillPointerStartY;
  if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
  event.preventDefault();
  els.drillFlashcard.dataset.dragged = "true";
  const limited = Math.max(-140, Math.min(140, dx));
  els.drillFlashcard.style.transform = `translateX(${limited}px) rotate(${limited / 14}deg)`;

  if (dx > 0) {
    const opacity = Math.min(1, Math.max(0, (dx - 10) / 60));
    if (els.drillSwipeHintRight) els.drillSwipeHintRight.style.opacity = String(opacity);
    if (els.drillSwipeHintLeft) els.drillSwipeHintLeft.style.opacity = "0";
  } else {
    const opacity = Math.min(1, Math.max(0, (-dx - 10) / 60));
    if (els.drillSwipeHintLeft) els.drillSwipeHintLeft.style.opacity = String(opacity);
    if (els.drillSwipeHintRight) els.drillSwipeHintRight.style.opacity = "0";
  }
}

function endDrillFlick(event) {
  if (!drillPointerTracking) return;
  const dx = event.clientX - drillPointerStartX;
  const dy = event.clientY - drillPointerStartY;
  drillPointerTracking = false;
  resetDrillSwipeHints();

  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.1) {
    els.drillFlashcard.style.transform = "";
    if (dx > 0) {
      handleDrillAnswer(true);
    } else {
      handleDrillAnswer(false);
    }
  } else {
    els.drillFlashcard.style.transform = "";
  }
}

function cancelDrillFlick() {
  drillPointerTracking = false;
  resetDrillSwipeHints();
  els.drillFlashcard.style.transform = "";
}
