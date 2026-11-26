// 採点カウンター ロジック
(function () {
  "use strict";

  const STORAGE_KEY = "wakuda_scoring_state_v1";
  const SOUND_KEY = "wakuda_scoring_sound_v1";

  // 状態管理
  // history: Array<'correct' | 'wrong'>
  let state = {
    history: []
  };

  let soundEnabled = true;

  // DOM要素
  const elAccuracyRate = document.getElementById("accuracy-rate");
  const elTotalCount = document.getElementById("total-count");
  const elCorrectCount = document.getElementById("correct-count");
  const elWrongCount = document.getElementById("wrong-count");

  const btnCorrect = document.getElementById("btn-correct");
  const btnWrong = document.getElementById("btn-wrong");
  const btnUndo = document.getElementById("btn-undo");
  const btnSound = document.getElementById("btn-sound");
  const btnReset = document.getElementById("btn-reset");
  const btnCopyAll = document.getElementById("btn-copy-all");
  const btnCopyWrong = document.getElementById("btn-copy-wrong");

  const iconSoundOn = document.getElementById("icon-sound-on");
  const iconSoundOff = document.getElementById("icon-sound-off");
  const soundLabel = document.getElementById("sound-label");

  const historyList = document.getElementById("history-list");
  const historyEmpty = document.getElementById("history-empty");
  const historyBadge = document.getElementById("history-badge");

  const toastEl = document.getElementById("toast");
  let toastTimer = null;

  const confirmModal = document.getElementById("confirm-modal");
  const modalBtnCancel = document.getElementById("modal-btn-cancel");
  const modalBtnConfirm = document.getElementById("modal-btn-confirm");

  // Web Audio API による効果音合成
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // 正解音: 高めの2音（ピンポン♫）
  function playCorrectSound() {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1音目: E5 (659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // 2音目: G5 (783.99Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(783.99, now + 0.12);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // 不正解音: 低めのブッ
  function playWrongSound() {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // バイブレーション (スマホ用)
  function triggerHaptic(type) {
    if ("vibrate" in navigator) {
      try {
        if (type === "correct") {
          navigator.vibrate(25);
        } else if (type === "wrong") {
          navigator.vibrate([40, 30, 40]);
        }
      } catch (_) {}
    }
  }

  // ローカルストレージ
  function loadSavedState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.history)) {
          state.history = parsed.history;
        }
      }
    } catch (e) {
      console.warn("Failed to load scoring state", e);
    }

    try {
      const savedSound = localStorage.getItem(SOUND_KEY);
      if (savedSound !== null) {
        soundEnabled = savedSound === "true";
      }
    } catch (e) {}
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function persistSound() {
    try {
      localStorage.setItem(SOUND_KEY, soundEnabled.toString());
    } catch (e) {}
  }

  // UI更新
  function updateUI() {
    const total = state.history.length;
    let correct = 0;
    let wrong = 0;

    for (let i = 0; i < total; i++) {
      if (state.history[i] === "correct") correct++;
      else if (state.history[i] === "wrong") wrong++;
    }

    // 正解率計算
    let rate = 0;
    if (total > 0) {
      rate = (correct / total) * 100;
    }

    // 表示フォーマット (割り切れるなら整数、割り切れないなら小数第1位)
    let rateFormatted = "0";
    if (total > 0) {
      rateFormatted = Number.isInteger(rate) ? rate.toString() : rate.toFixed(1);
    }

    elAccuracyRate.textContent = rateFormatted;
    elTotalCount.textContent = total;
    elCorrectCount.textContent = correct;
    elWrongCount.textContent = wrong;

    // 取消ボタンの有効・無効
    btnUndo.disabled = total === 0;

    // コピーボタンの有効・無効
    if (btnCopyAll) {
      btnCopyAll.disabled = total === 0;
      btnCopyAll.title = total === 0 ? "採点履歴がありません" : "正解数/採点数と全問の結果をコピー";
    }
    if (btnCopyWrong) {
      btnCopyWrong.disabled = total === 0 || wrong === 0;
      if (total === 0) {
        btnCopyWrong.title = "採点履歴がありません";
      } else if (wrong === 0) {
        btnCopyWrong.title = "不正解の問題がありません";
      } else {
        btnCopyWrong.title = `不正解の問題番号（${wrong}問）をコピー`;
      }
    }

    // 履歴数バッジ
    historyBadge.textContent = `${total}問`;

    // 履歴リストの描画
    if (total === 0) {
      historyEmpty.style.display = "block";
      historyList.innerHTML = "";
    } else {
      historyEmpty.style.display = "none";
      historyList.innerHTML = "";

      // 履歴チップを描画 (直近が分かりやすいよう通し番号付き)
      state.history.forEach((type, idx) => {
        const chip = document.createElement("span");
        chip.className = `history-chip ${type === "correct" ? "history-chip-correct" : "history-chip-wrong"}`;
        
        const numSpan = document.createElement("span");
        numSpan.className = "history-chip-idx";
        numSpan.textContent = `#${idx + 1}`;

        const markSpan = document.createElement("span");
        markSpan.textContent = type === "correct" ? "〇" : "✕";

        chip.appendChild(numSpan);
        chip.appendChild(markSpan);
        historyList.appendChild(chip);
      });

      // 最新の項目へ自動スクロール
      const container = document.getElementById("history-container");
      container.scrollLeft = container.scrollWidth;
    }

    // 音声UI反映
    if (soundEnabled) {
      iconSoundOn.style.display = "inline-block";
      iconSoundOff.style.display = "none";
      soundLabel.textContent = "音声";
    } else {
      iconSoundOn.style.display = "none";
      iconSoundOff.style.display = "inline-block";
      soundLabel.textContent = "消音";
    }
  }

  // アクション: 正解追加
  function addCorrect() {
    state.history.push("correct");
    persistState();
    updateUI();
    playCorrectSound();
    triggerHaptic("correct");
  }

  // アクション: 不正解追加
  function addWrong() {
    state.history.push("wrong");
    persistState();
    updateUI();
    playWrongSound();
    triggerHaptic("wrong");
  }

  // アクション: 取消 (Undo)
  function undoLast() {
    if (state.history.length === 0) return;
    state.history.pop();
    persistState();
    updateUI();
  }

  // アクション: リセットモーダル表示
  function showResetConfirm() {
    if (state.history.length === 0) return;
    confirmModal.style.display = "flex";
  }

  function hideResetConfirm() {
    confirmModal.style.display = "none";
  }

  function executeReset() {
    state.history = [];
    persistState();
    hideResetConfirm();
    updateUI();
  }

  // 音声切替
  function toggleSound() {
    soundEnabled = !soundEnabled;
    persistSound();
    updateUI();
    if (soundEnabled) {
      playCorrectSound();
    }
  }

  // トースト表示
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("show");
      toastTimer = null;
    }, 2000);
  }

  // クリップボードへコピー
  async function copyText(text, successMsg) {
    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (_) {}
    }
    if (!success) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        textarea.setAttribute("readonly", "");
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch (e) {
        console.warn("Clipboard fallback failed", e);
      }
    }

    if (success) {
      showToast(successMsg);
    } else {
      showToast("コピー失敗");
    }
  }

  // 全部コピー: 正解数/採点数を約分せずに、1◯2✕というふうに結果の羅列
  function copyAllResult() {
    const total = state.history.length;
    if (total === 0) return;
    let correct = 0;
    let listStr = "";
    for (let i = 0; i < total; i++) {
      const isCorrect = state.history[i] === "correct";
      if (isCorrect) correct++;
      listStr += `${i + 1}${isCorrect ? "◯" : "✕"}`;
    }
    const text = `${correct}/${total} ${listStr}`;
    copyText(text, "全結果をコピーしました");
  }

  // 不正解のみコピー: 不正解だった問題番号だけを出力(1,3,5,6）など
  function copyWrongOnly() {
    const total = state.history.length;
    if (total === 0) return;
    const wrongNums = [];
    for (let i = 0; i < total; i++) {
      if (state.history[i] === "wrong") {
        wrongNums.push(i + 1);
      }
    }
    if (wrongNums.length === 0) {
      showToast("不正解はありません");
      return;
    }
    const text = wrongNums.join(",");
    copyText(text, "不正解番号をコピーしました");
  }

  // イベント登録
  btnCorrect.addEventListener("click", () => {
    addCorrect();
  });

  btnWrong.addEventListener("click", () => {
    addWrong();
  });

  btnUndo.addEventListener("click", () => {
    undoLast();
  });

  btnSound.addEventListener("click", () => {
    toggleSound();
  });

  btnReset.addEventListener("click", () => {
    showResetConfirm();
  });

  if (btnCopyAll) {
    btnCopyAll.addEventListener("click", () => {
      copyAllResult();
    });
  }

  if (btnCopyWrong) {
    btnCopyWrong.addEventListener("click", () => {
      copyWrongOnly();
    });
  }

  modalBtnCancel.addEventListener("click", () => {
    hideResetConfirm();
  });

  modalBtnConfirm.addEventListener("click", () => {
    executeReset();
  });

  // モーダル背景クリックで閉じる
  confirmModal.addEventListener("click", (e) => {
    if (e.target === confirmModal) {
      hideResetConfirm();
    }
  });

  // キーボードショートカット
  window.addEventListener("keydown", (e) => {
    // モーダル表示中のキーハンドリング
    if (confirmModal.style.display === "flex") {
      if (e.key === "Escape") {
        e.preventDefault();
        hideResetConfirm();
      } else if (e.key === "Enter") {
        e.preventDefault();
        executeReset();
      }
      return;
    }

    // 入力フォーム等で打鍵されている場合は無視
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      return;
    }

    if (e.key === "1" || e.key === "Enter" || e.key.toLowerCase() === "o" || e.key === "ArrowRight") {
      e.preventDefault();
      btnCorrect.classList.add("active-press");
      setTimeout(() => btnCorrect.classList.remove("active-press"), 100);
      addCorrect();
    } else if (e.key === "2" || e.key === " " || e.key.toLowerCase() === "x" || e.key === "ArrowLeft") {
      e.preventDefault();
      btnWrong.classList.add("active-press");
      setTimeout(() => btnWrong.classList.remove("active-press"), 100);
      addWrong();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undoLast();
    } else if (e.key.toLowerCase() === "z" || e.key === "Backspace") {
      e.preventDefault();
      undoLast();
    } else if (e.key.toLowerCase() === "r") {
      e.preventDefault();
      showResetConfirm();
    }
  });

  // 初回初期化
  loadSavedState();
  updateUI();
})();
