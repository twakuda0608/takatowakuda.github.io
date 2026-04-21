import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp, deleteDoc, doc,
  getDoc, setDoc
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

const app      = initializeApp(firebaseConfig);
const db       = getFirestore(app);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

// DOM
const loginBtn       = document.getElementById("login-btn");
const loginBtn2      = document.getElementById("login-btn-2");
const logoutBtn      = document.getElementById("logout-btn");
const userInfo       = document.getElementById("user-info");
const userAvatar     = document.getElementById("user-avatar");
const userName       = document.getElementById("user-name");
const editNameBtn    = document.getElementById("edit-name-btn");
const nicknameModal  = document.getElementById("nickname-modal");
const nicknameInput  = document.getElementById("nickname-input");
const nicknameSave   = document.getElementById("nickname-save");
const nicknameCancel = document.getElementById("nickname-cancel");
const loginPrompt    = document.getElementById("login-prompt");
const postForm       = document.getElementById("post-form");
const formAvatar     = document.getElementById("form-avatar");
const formName       = document.getElementById("form-name");
const msgInput       = document.getElementById("message-input");
const submitBtn      = document.getElementById("submit-btn");
const postsList      = document.getElementById("posts-list");

let currentUser    = null;
let userNickname   = "";

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(ts) {
  if (!ts) return "投稿中...";
  return ts.toDate().toLocaleString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

async function loadOrCreateProfile(user) {
  const ref  = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    userNickname = snap.data().nickname || user.displayName || user.email;
  } else {
    userNickname = user.displayName || user.email;
    await setDoc(ref, { nickname: userNickname });
  }
  userName.textContent = userNickname;
  formName.textContent = userNickname;
}

editNameBtn.addEventListener("click", () => {
  nicknameInput.value = userNickname;
  nicknameModal.style.display = "flex";
  nicknameInput.focus();
  nicknameInput.select();
});

nicknameCancel.addEventListener("click", () => {
  nicknameModal.style.display = "none";
});

nicknameSave.addEventListener("click", async () => {
  const newName = nicknameInput.value.trim();
  if (!newName || !currentUser) return;
  await setDoc(doc(db, "users", currentUser.uid), { nickname: newName });
  userNickname = newName;
  userName.textContent = userNickname;
  formName.textContent = userNickname;
  nicknameModal.style.display = "none";
});

nicknameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") nicknameSave.click();
  if (e.key === "Escape") nicknameCancel.click();
});

async function signIn() {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error("ログインエラー:", err);
  }
}

loginBtn.addEventListener("click",  signIn);
loginBtn2.addEventListener("click", signIn);

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    // ログイン済み
    loginBtn.style.display    = "none";
    userInfo.style.display    = "flex";
    userAvatar.src            = user.photoURL || "";
    await loadOrCreateProfile(user);
    loginPrompt.style.display = "none";
    postForm.style.display    = "flex";
    formAvatar.src            = user.photoURL || "";
    formName.textContent      = user.displayName || user.email;
  } else {
    // 未ログイン
    loginBtn.style.display    = "flex";
    userInfo.style.display    = "none";
    loginPrompt.style.display = "block";
    postForm.style.display    = "none";
  }
});

postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const message = msgInput.value.trim();
  if (!message) return;

  submitBtn.disabled     = true;
  submitBtn.textContent  = "投稿中...";

  try {
    await addDoc(collection(db, "bbs"), {
      name:      userNickname,
      avatarUrl: currentUser.photoURL || "",
      uid:       currentUser.uid,
      message,
      createdAt: serverTimestamp()
    });
    msgInput.value = "";
  } catch (err) {
    console.error("投稿エラー:", err);
    alert("投稿に失敗しました。もう一度お試しください。");
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = "投稿する";
  }
});

const q = query(collection(db, "bbs"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  postsList.innerHTML = "";

  if (snapshot.empty) {
    postsList.innerHTML = '<div class="bbs-empty">まだ投稿がありません。最初の一言をどうぞ！</div>';
    return;
  }

  snapshot.forEach((snap) => {
    const data     = snap.data();
    const isAdmin  = currentUser && currentUser.uid === "DCrmDRYKuPXKQtiQ9gAgz8fAJRL2";
    const isOwner  = currentUser && (currentUser.uid === data.uid || isAdmin);
    const div      = document.createElement("div");
    div.className  = "post";
    div.innerHTML  = `
      <div class="post-header">
        <div class="post-user">
          ${data.avatarUrl ? `<img class="post-avatar" src="${escHtml(data.avatarUrl)}" alt="">` : ""}
          <span class="post-name">${escHtml(data.name)}</span>
        </div>
        <span class="post-date">${formatDate(data.createdAt)}</span>
      </div>
      <div class="post-message">${escHtml(data.message).replace(/\n/g, "<br>")}</div>
      ${isOwner ? `<button class="delete-btn" data-id="${snap.id}">削除</button>` : ""}
    `;
    if (isOwner) {
      div.querySelector(".delete-btn").addEventListener("click", async () => {
        if (!confirm("この投稿を削除しますか？")) return;
        await deleteDoc(doc(db, "bbs", snap.id));
      });
    }
    postsList.appendChild(div);
  });
});
