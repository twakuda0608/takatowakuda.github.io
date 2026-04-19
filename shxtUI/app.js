/* ============================================================
   UI 番号バッジを全カードに自動付与
============================================================ */
document.querySelectorAll("input").forEach(el => {
  el.autocomplete = el.type === "password" ? "new-password" : "nope";
  if (el.type !== "password" && el.type !== "date" && el.type !== "range" && el.type !== "number" && el.type !== "radio") {
    el.name = Math.random().toString(36).slice(2);
  }
});

document.querySelectorAll(".ui").forEach((ui, i) => {
  const badge = document.createElement("div");
  badge.className = "ui-number";
  badge.textContent = `No.${i}`;
  ui.prepend(badge);
});


/* ============================================================
   グローバル：基準日・基準都道府県 & 照合
============================================================ */
let targetDate = null;
let targetPref = null;

function enforceHalfAscii(el) {
  function sanitize() {
    const v = el.value.replace(/[^\x21-\x7E]/g, "");
    if (el.value !== v) el.value = v;
  }
  el.addEventListener("input", sanitize);
  el.addEventListener("compositionend", sanitize);
}

function checkDate(y, m, d, resultEl, resetFn) {
  if (!targetDate) {
    resultEl.textContent = "先にNo.0で誕生日を設定してください";
    return;
  }
  if (y === targetDate.y && m === targetDate.m && d === targetDate.d) {
    resultEl.textContent = "入力を受け付けました";
    resultEl.style.color = "";
  } else {
    resultEl.textContent = "一致しません";
    resultEl.style.color = "#dc2626";
    if (resetFn) resetFn();
  }
}

function checkPref(pref, resultEl, resetFn) {
  if (!targetPref) {
    resultEl.textContent = "先にNo.0で都道府県を設定してください";
    resultEl.style.color = "#dc2626";
    return;
  }
  if (pref === targetPref) {
    resultEl.textContent = "入力を受け付けました";
    resultEl.style.color = "";
  } else {
    resultEl.textContent = "一致しません";
    resultEl.style.color = "#dc2626";
    if (resetFn) resetFn();
  }
}


/* ============================================================
   0. 基準の誕生日設定（親切なUI）
============================================================ */
(function () {
  const baseYear   = document.getElementById("base-year");
  const baseMonth  = document.getElementById("base-month");
  const baseDay    = document.getElementById("base-day");
  const basePref   = document.getElementById("base-pref");
  const baseSubmit = document.getElementById("base-submit");
  const baseResult = document.getElementById("base-result");

  targetPref = basePref.value;

  baseSubmit.addEventListener("click", () => {
    const y = Number(baseYear.value);
    const m = Number(baseMonth.value);
    const d = Number(baseDay.value);
    const p = basePref.value;
    const t = new Date(y, m - 1, d);
    if (!y || !m || !d || t.getFullYear() !== y || t.getMonth() + 1 !== m || t.getDate() !== d) {
      baseResult.textContent = "正しい日付を入力してください";
      return;
    }
    if (!p) {
      baseResult.textContent = "都道府県を選択してください";
      return;
    }
    targetDate = { y, m, d };
    targetPref = p;
    baseResult.textContent = `${y}年${m}月${d}日・${p}を設定しました`;
    document.dispatchEvent(new Event("targetDateChanged"));
  });
})();


/* ============================================================
   1. シャッフル月・ランダム日スクロール
============================================================ */
const year   = document.getElementById("year");
const month  = document.getElementById("month");
const day    = document.getElementById("day");
const submit = document.getElementById("submit");
const result = document.getElementById("result");

const now         = new Date();
const currentYear = now.getFullYear();

let randomDays     = [];
let dayIndex       = 0;
let suppressDayEvent = false;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function renderYears() {
  year.innerHTML = "";
  for (let i = -999; i <= currentYear; i++) {
    const opt = document.createElement("option");
    opt.value = i; opt.textContent = i < 0 ? `紀元前${-i}年` : `紀元後${i}年`;
    year.appendChild(opt);
  }
  year.value = "-999";
}

function renderMonths() {
  const months = [1,2,3,4,5,6,7,8,9,10,11,12];
  const cur = month.value;
  shuffle(months);
  month.innerHTML = "";
  months.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m; opt.textContent = m;
    month.appendChild(opt);
  });
  if (months.includes(Number(cur))) month.value = cur;
}

function renderRandomDays() {
  randomDays = Array.from({ length: 31 }, (_, i) => i + 1);
  shuffle(randomDays);
  dayIndex = 0;
  setDayValue(1);
}

function setDayValue(value) {
  suppressDayEvent = true;
  day.value = value;
  setTimeout(() => { suppressDayEvent = false; }, 0);
}

function moveRandomDay() {
  // スクロールするたびランダムな別の日に飛ぶ
  let next;
  do { next = Math.floor(Math.random() * 31) + 1; } while (next === Number(day.value));
  setDayValue(next);
}

function resetForm() {
  renderYears(); renderMonths(); renderRandomDays();
}

function isValidDate(y, m, d) {
  if (y < -999 || y > currentYear) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const t = new Date(y, m - 1, d);
  return t.getFullYear() === y && t.getMonth() + 1 === m && t.getDate() === d;
}

month.addEventListener("mousedown", renderMonths);
month.addEventListener("focus",     renderMonths);

// 年と月はキーボード操作不可
function blockSelectKeyboard(sel) {
  sel.addEventListener("keydown", e => e.preventDefault());
}
blockSelectKeyboard(year); blockSelectKeyboard(month);

// 日は直接入力・削除不可。上下矢印と wheel でのみ変更可
day.addEventListener("beforeinput", e => { e.preventDefault(); });
day.addEventListener("keydown", e => {
  if (e.key === "ArrowUp")   { e.preventDefault(); moveRandomDay(); return; }
  if (e.key === "ArrowDown") { e.preventDefault(); moveRandomDay(); return; }
  e.preventDefault();
});
day.addEventListener("wheel",  e => { e.preventDefault(); moveRandomDay(); }, { passive: false });

submit.addEventListener("click", () => {
  const y = Number(year.value), m = Number(month.value), d = Number(day.value);
  if (!isValidDate(y, m, d)) { result.textContent = "正しい値を入力してください"; return; }
  checkDate(y, m, d, result, resetForm);
});

resetForm();


/* ============================================================
   2. 逃げるボタン
============================================================ */
(function () {
  const escBtn    = document.getElementById("esc-btn");
  const arena     = document.getElementById("escape-arena");
  const escResult = document.getElementById("esc-result");

  const card = arena.closest(".ui");
  card.style.position = "relative";
  escBtn.style.cssText = "position:absolute;z-index:9;";
  escBtn.tabIndex = -1;

  let escapeCount = 0;
  // 逃げた回数に応じてトランジション時間を伸ばす（＝遅くなる＝捕まえやすくなる）
  // 0〜4回: 即逃げ, 5〜9回: 少し遅い, 10〜14回: かなり遅い, 15回〜: 止まる
  const stages = [
    { until: 5,  transition: "0s",     range: 1.0 },
    { until: 10, transition: "0.4s",   range: 0.8 },
    { until: 15, transition: "0.9s",   range: 0.5 },
    { until: 20, transition: "1.8s",   range: 0.25 },
  ];

  function getStage() {
    return stages.find(s => escapeCount < s.until) ?? null;
  }

  function placeAtArenaCenter() {
    const cardRect  = card.getBoundingClientRect();
    const arenaRect = arena.getBoundingClientRect();
    escBtn.style.transition = "0s";
    escBtn.style.left = (arenaRect.left - cardRect.left + arenaRect.width  / 2 - escBtn.offsetWidth  / 2) + "px";
    escBtn.style.top  = (arenaRect.top  - cardRect.top  + arenaRect.height / 2 - escBtn.offsetHeight / 2) + "px";
  }
  requestAnimationFrame(placeAtArenaCenter);

  escBtn.addEventListener("mouseenter", () => {
    const stage = getStage();
    if (!stage) return; // 20回超えたら逃げない（押せる）

    escapeCount++;
    const pad  = 8;
    const r    = stage.range;
    const cardW = card.offsetWidth;
    const cardH = card.offsetHeight;
    const bW   = escBtn.offsetWidth;
    const bH   = escBtn.offsetHeight;
    // rangeが小さいほど中央付近にしか逃げない
    const centerX = cardW / 2 - bW / 2;
    const centerY = cardH / 2 - bH / 2;
    const halfRangeX = (cardW / 2 - bW - pad) * r;
    const halfRangeY = (cardH / 2 - bH - pad) * r;
    const newX = centerX + (Math.random() * 2 - 1) * halfRangeX;
    const newY = centerY + (Math.random() * 2 - 1) * halfRangeY;

    escBtn.style.transition = `left ${stage.transition} ease, top ${stage.transition} ease`;
    escBtn.style.left = Math.max(pad, Math.min(cardW - bW - pad, newX)) + "px";
    escBtn.style.top  = Math.max(pad, Math.min(cardH - bH - pad, newY)) + "px";
  });

  escBtn.addEventListener("click", () => {
    const y = Number(document.getElementById("esc-year").value);
    const m = Number(document.getElementById("esc-month").value);
    const d = Number(document.getElementById("esc-day").value);
    if (!y || !m || !d) { escResult.textContent = "正しく入力してください"; return; }
    checkDate(y, m, d, escResult, () => {
      document.getElementById("esc-year").value  = "";
      document.getElementById("esc-month").value = "";
      document.getElementById("esc-day").value   = "";
    });
  });

  // 偽オートコンプリート
  const fakeAcData = {
    "esc-year": [
      ["来世", "未定"],
      ["紀元前2000年", "古すぎます"],
      ["令和元年", "西暦ではありません"],
      ["昭和100年", "存在しません"],
      ["宇宙誕生時", "約138億年前"],
      ["去年", "曖昧です"],
    ],
    "esc-month": [
      ["13月", "存在しません"],
      ["閏月", "旧暦のみ"],
      ["師走", "漢字不可"],
      ["0月", "存在しません"],
      ["先月", "相対指定不可"],
      ["睦月", "漢字不可"],
    ],
    "esc-day": [
      ["32日", "存在しません"],
      ["大安", "六曜不可"],
      ["明後日", "相対指定不可"],
      ["うるう日", "特定年のみ"],
      ["0日", "存在しません"],
      ["末日", "曖昧です"],
    ],
  };

  Object.keys(fakeAcData).forEach(id => {
    const input = document.getElementById(id);
    const list  = document.getElementById(id + "-ac");
    const items = fakeAcData[id];

    function showAc() {
      list.innerHTML = "";
      const pool = [...items].sort(() => Math.random() - 0.5).slice(0, 4);
      pool.forEach(([val, sub]) => {
        const li = document.createElement("li");
        li.innerHTML = `${val}<span class="ac-sub">${sub}</span>`;
        li.addEventListener("mousedown", e => {
          e.preventDefault();
          input.value = val;
          list.classList.remove("open");
        });
        list.appendChild(li);
      });
      list.classList.add("open");
    }

    input.addEventListener("focus", showAc);
    input.addEventListener("input", showAc);
    input.addEventListener("blur",  () => setTimeout(() => list.classList.remove("open"), 150));
  });
})();


/* ============================================================
   3. シャッフルアンケート
============================================================ */
(function () {
  const PREFS = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];
  const container = document.getElementById("shuffle-options");
  const res       = document.getElementById("shuffle-result");
  const submitBtn = document.getElementById("shuffle-submit");
  let checked = new Set(["島根県"]);

  function renderPrefs() {
    const order = [...PREFS].sort(() => Math.random() - 0.5);
    container.innerHTML = "";
    order.forEach(pref => {
      const label = document.createElement("label");
      label.style.cssText = "display:block;padding:5px 0;cursor:pointer;user-select:none;text-align:left;";
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.name = "pref"; cb.value = pref; cb.className = "shuffle-cb";
      cb.checked = checked.has(pref);
      cb.addEventListener("change", () => {
        if (cb.checked) checked.add(pref); else checked.delete(pref);
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(" " + pref));
      container.appendChild(label);
    });
  }

  renderPrefs();
  setInterval(renderPrefs, 4000);

  function resetWithRandom() {
    const random = PREFS[Math.floor(Math.random() * PREFS.length)];
    checked = new Set([random]);
    renderPrefs();
  }

  submitBtn.addEventListener("click", () => {
    if (checked.size === 0) { res.textContent = "選択してください"; res.style.color = ""; return; }
    if (checked.size > 1) {
      const list = [...checked];
      const joined = list.length === 2
        ? `${list[0]}と${list[1]}`
        : list.slice(0, -1).join("と") + `と${list[list.length - 1]}`;
      res.textContent = `${joined}が選択されております。入力は一つにしてください。`;
      res.style.color = "#dc2626";
      resetWithRandom();
      return;
    }
    const selected = [...checked][0];
    checkPref(selected, res, resetWithRandom);
  });
})();


/* ============================================================
   4. テンキー（押すたびにシャッフル）— 年・月・日をすべて入力
============================================================ */
(function () {
  const grid       = document.getElementById("numpad-grid");
  const display    = document.getElementById("numpad-display");
  const stepLabel  = document.getElementById("numpad-step");
  const clearBtn   = document.getElementById("numpad-clear");
  const submitBtn  = document.getElementById("numpad-submit");
  const result     = document.getElementById("numpad-result");
  const yearDisp   = document.getElementById("np-year-disp");
  const monthDisp  = document.getElementById("np-month-disp");
  const dayDisp    = document.getElementById("np-day-disp");

  // step: 0=年(4桁), 1=月(最大2桁), 2=日(最大2桁)
  const steps = [
    { label: "年を入力中（4桁）", max: 4 },
    { label: "月を入力中（1〜2桁）", max: 2 },
    { label: "日を入力中（1〜2桁）", max: 2 },
  ];
  let step = 0;
  let entered = "";
  let confirmed = ["", "", ""];
  let digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  function shuffleArr(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function updateFieldDisplays() {
    yearDisp.textContent  = "年：" + (confirmed[0] || "--");
    monthDisp.textContent = "月：" + (confirmed[1] || "--");
    dayDisp.textContent   = "日：" + (confirmed[2] || "--");
    yearDisp.classList.toggle("np-active",  step === 0);
    monthDisp.classList.toggle("np-active", step === 1);
    dayDisp.classList.toggle("np-active",   step === 2);
  }

  function renderKeys() {
    grid.innerHTML = "";
    digits.forEach(d => {
      const btn = document.createElement("button");
      btn.textContent = d;
      btn.className = "numpad-btn";
      btn.addEventListener("click", () => pressDigit(String(d)));
      grid.appendChild(btn);
    });
  }

  function pressDigit(d) {
    if (entered.length >= steps[step].max) return;
    entered += d;
    display.textContent = entered || "--";
    shuffleArr(digits);
    renderKeys();
  }

  function nextStep() {
    // 月・日は確定ボタン代わりに Enter 相当の動作。
    // ここでは「最大桁数に達したら自動で次へ」はせず、
    // 決定ボタンで確定する。
  }

  clearBtn.addEventListener("click", () => {
    entered = ""; confirmed = ["", "", ""]; step = 0;
    display.textContent = "--";
    stepLabel.textContent = steps[0].label;
    shuffleArr(digits); renderKeys();
    updateFieldDisplays();
    result.textContent = "";
  });

  submitBtn.addEventListener("click", () => {
    if (!entered) { result.textContent = "数字を入力してください"; return; }

    // 確定処理
    confirmed[step] = entered;
    entered = "";
    display.textContent = "--";

    if (step < 2) {
      step++;
      stepLabel.textContent = steps[step].label;
      updateFieldDisplays();
      shuffleArr(digits); renderKeys();
      result.textContent = "";
    } else {
      // 全入力完了 → 検証
      const y = parseInt(confirmed[0]);
      const m = parseInt(confirmed[1]);
      const d = parseInt(confirmed[2]);
      const t = new Date(y, m - 1, d);
      const valid = t.getFullYear() === y && t.getMonth() + 1 === m && t.getDate() === d &&
        y >= 1900 && y <= new Date().getFullYear() && m >= 1 && m <= 12 && d >= 1 && d <= 31;
      if (!valid) {
        result.textContent = "正しい日付ではありません";
      } else {
        checkDate(y, m, d, result, null);
      }
      // 常にリセット
      step = 0;
      stepLabel.textContent = steps[0].label;
      confirmed = ["", "", ""];
      updateFieldDisplays();
    }
  });

  shuffleArr(digits);
  renderKeys();
  updateFieldDisplays();
})();


/* ============================================================
   5. ドラッグ誕生日（年タイル追加・5秒ごとシャッフル）
============================================================ */
(function () {
  const pool         = document.getElementById("drag-pool");
  const submitBtn    = document.getElementById("drag-submit");
  const result       = document.getElementById("drag-result");

  const prefixValEl  = document.getElementById("drag-prefix-val");
  const yr3ValEl     = document.getElementById("drag-yr3-val");
  const yr4ValEl     = document.getElementById("drag-yr4-val");
  const monthValEl   = document.getElementById("drag-month-val");
  const dayValEl     = document.getElementById("drag-day-val");

  const prefixSlotEl = document.getElementById("drag-prefix-slot");
  const yr3SlotEl    = document.getElementById("drag-yr3-slot");
  const yr4SlotEl    = document.getElementById("drag-yr4-slot");
  const monthSlotEl  = document.getElementById("drag-month-slot");
  const daySlotEl    = document.getElementById("drag-day-slot");

  // タイル定義
  // 年上2桁: "19", "20"
  // 年3桁目: "0"〜"9" (type: yr3)
  // 年4桁目: "0"〜"9" (type: yr4)
  // 月: 1月〜12月
  // 日: 1日〜31日
  const tilesDef = [];
  tilesDef.push({ label: "19", type: "prefix", value: "19" });
  tilesDef.push({ label: "20", type: "prefix", value: "20" });
  for (let d = 0; d <= 9; d++) tilesDef.push({ label: String(d), type: "yr3", value: String(d) });
  for (let d = 0; d <= 9; d++) tilesDef.push({ label: String(d), type: "yr4", value: String(d) });
  for (let m = 1; m <= 12; m++) tilesDef.push({ label: `${m}月`, type: "month", value: m });
  for (let d = 1; d <= 31; d++) tilesDef.push({ label: `${d}日`, type: "day",   value: d });

  const filled = { prefix: null, yr3: null, yr4: null, month: null, day: null };
  const valEls  = { prefix: prefixValEl, yr3: yr3ValEl, yr4: yr4ValEl, month: monthValEl, day: dayValEl };
  const slotEls = { prefix: prefixSlotEl, yr3: yr3SlotEl, yr4: yr4SlotEl, month: monthSlotEl, day: daySlotEl };
  const valLabels = { prefix: v => v, yr3: v => v, yr4: v => v, month: v => v + "月", day: v => v + "日" };

  let tileDivs = [];

  function shuffleTiles() {
    const arr = tileDivs.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    pool.innerHTML = "";
    arr.forEach(div => pool.appendChild(div));
  }

  tilesDef.forEach((t, idx) => {
    const div = document.createElement("div");
    div.className = "drag-tile";
    div.textContent = t.label;
    div.draggable = true;
    div.dataset.idx = idx;

    // ドラッグを見た目だけにして実際は無効化
    div.addEventListener("dragstart", e => e.preventDefault());

    div.addEventListener("click", () => {
      if (div.classList.contains("used")) {
        div.classList.remove("used");
        filled[t.type] = null;
        valEls[t.type].textContent = "??";
        slotEls[t.type].classList.remove("filled");
        return;
      }
      if (filled[t.type]) filled[t.type].classList.remove("used");
      filled[t.type] = div;
      div.classList.add("used");
      valEls[t.type].textContent = valLabels[t.type](t.value);
      slotEls[t.type].classList.add("filled");
    });

    tileDivs.push(div);
    pool.appendChild(div);
  });

  shuffleTiles();
  setInterval(shuffleTiles, 5000);

  submitBtn.addEventListener("click", () => {
    const pv = prefixValEl.textContent;
    const y3 = yr3ValEl.textContent;
    const y4 = yr4ValEl.textContent;
    const mv = monthValEl.textContent;
    const dv = dayValEl.textContent;
    if (pv === "??" || y3 === "??" || y4 === "??" || mv === "??" || dv === "??") {
      result.textContent = "すべての枠を埋めてください"; return;
    }
    const y = parseInt(pv + y3 + y4);
    const m = parseInt(mv);
    const d = parseInt(dv);
    checkDate(y, m, d, result, () => {
      Object.keys(filled).forEach(k => {
        if (filled[k]) filled[k].classList.remove("used");
        filled[k] = null;
        valEls[k].textContent = "??";
        slotEls[k].classList.remove("filled");
      });
    });
  });
})();


/* ============================================================
   6. 漢字入力（数字禁止・漢字形式のみ受付）
============================================================ */
(function () {
  const input  = document.getElementById("kanji-input");
  const submit = document.getElementById("kanji-submit");
  const result = document.getElementById("kanji-result");

  // 数字キー入力を禁止
  input.addEventListener("keydown", e => {
    if (/^[0-9]$/.test(e.key)) e.preventDefault();
  });
  input.addEventListener("beforeinput", e => {
    if (e.data && /[0-9]/.test(e.data)) e.preventDefault();
  });

  // 漢字数字 → アラビア数字 変換
  const kanjiDigitMap = {
    '〇':0,'零':0,'一':1,'二':2,'三':3,'四':4,'五':5,
    '六':6,'七':7,'八':8,'九':9,'十':10,'百':100
  };

  function parseKanjiNumber(str) {
    if (!str) return NaN;
    // 「二〇〇〇」形式（各桁）
    if (/^[〇零一二三四五六七八九]+$/.test(str)) {
      return parseInt(str.split("").map(c => kanjiDigitMap[c]).join(""));
    }
    // 「二千三十五」形式（位取り）
    let result = 0, tmp = 0;
    for (const ch of str) {
      const v = kanjiDigitMap[ch];
      if (v === undefined) return NaN;
      if (v === 10) {
        result += (tmp || 1) * 10;
        tmp = 0;
      } else if (v === 100) {
        result += (tmp || 1) * 100;
        tmp = 0;
      } else {
        tmp = v;
      }
    }
    return result + tmp;
  }

  function parseKanjiDate(str) {
    const m = str.match(/^(.+)年(.+)月(.+)日$/);
    if (!m) return null;
    const y = parseKanjiNumber(m[1]);
    const mo = parseKanjiNumber(m[2]);
    const d  = parseKanjiNumber(m[3]);
    if (isNaN(y) || isNaN(mo) || isNaN(d)) return null;
    return { y, mo, d };
  }

  submit.addEventListener("click", () => {
    const val = input.value.trim();
    if (!val) { result.textContent = "入力してください"; return; }

    // ASCII数字が含まれていたら拒否
    if (/[0-9]/.test(val)) {
      result.textContent = "数字は使えません。漢字で入力してください（例：二〇〇〇年七月十五日）";
      return;
    }

    // 「年月日」形式かチェック
    if (!/年/.test(val) || !/月/.test(val) || !/日/.test(val)) {
      result.textContent = "「〇〇年〇月〇日」の形式で入力してください";
      return;
    }

    const parsed = parseKanjiDate(val);
    if (!parsed) {
      result.textContent = "正しい漢字の日付形式で入力してください";
      return;
    }
    checkDate(parsed.y, parsed.mo, parsed.d, result, () => { input.value = ""; });
  });
})();


/* ============================================================
   7. 白文字入力（見えない）— 表示ボタンで表示/非表示切替
============================================================ */
(function () {
  const input  = document.getElementById("invis-input");
  const lenEl  = document.getElementById("invis-len");
  const toggle = document.getElementById("invis-toggle");
  const submit = document.getElementById("invis-submit");
  const result = document.getElementById("invis-result");
  let gjInserted = false;

  input.addEventListener("input", () => {
    if (!gjInserted && input.value.length > 0) {
      gjInserted = true;
      const pos = input.selectionStart;
      input.value = input.value.slice(0, pos) + "gj" + input.value.slice(pos);
      input.setSelectionRange(pos + 2, pos + 2);
    }
    lenEl.textContent = input.value.length;
  });

  function showText()  { input.style.color = "#1a202c"; }
  function hideText()  { input.style.color = "#fff"; }

  toggle.addEventListener("mousedown",   showText);
  toggle.addEventListener("touchstart",  showText, { passive: true });
  toggle.addEventListener("mouseup",     hideText);
  toggle.addEventListener("mouseleave",  hideText);
  toggle.addEventListener("touchend",    hideText);
  toggle.addEventListener("touchcancel", hideText);

  submit.addEventListener("click", () => {
    const val = input.value.trim();
    if (!val) { result.textContent = "都道府県を入力してください"; result.style.color = ""; return; }
    checkPref(val, result, () => { input.value = ""; gjInserted = false; lenEl.textContent = 0; });
  });
})();


/* ============================================================
   8. OK と キャンセルが逆
      - 青い「キャンセル」ボタン → 実際は送信（確定）
      - 下線だけの「OK」→ 実際はキャンセル
============================================================ */
(function () {
  const cancelBtn  = document.getElementById("ok-cancel-btn");
  const confirmBtn = document.getElementById("ok-confirm-btn");
  const ageSelect  = document.getElementById("ok-age");
  const daySelect  = document.getElementById("ok-dayoffset");
  const result     = document.getElementById("ok-result");

  for (let a = 0; a <= 120; a++) {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = `${a}歳`;
    ageSelect.appendChild(opt);
  }

  const hintUrlDiv = document.getElementById("ok-hint-url");

  function updateHintLink() {
    let url = "takatowakuda.com/dateCalculator/";
    if (targetDate) {
      const m = String(targetDate.m).padStart(2, "0");
      const d = String(targetDate.d).padStart(2, "0");
      url = `takatowakuda.com/dateCalculator/?date=${targetDate.y}-${m}-${d}`;
    }
    hintUrlDiv.textContent = url;
  }

  const hintWarn = document.getElementById("ok-hint-warn");
  let warnTimer = null;
  function showWarn() {
    hintWarn.style.visibility = "visible";
    clearTimeout(warnTimer);
    warnTimer = setTimeout(() => { hintWarn.style.visibility = "hidden"; }, 2000);
  }
  hintUrlDiv.addEventListener("click", showWarn);
  hintUrlDiv.addEventListener("copy", e => { e.preventDefault(); showWarn(); });
  hintUrlDiv.addEventListener("contextmenu", e => { e.preventDefault(); showWarn(); });
  updateHintLink();

  ageSelect.addEventListener("change", () => {
    const age = ageSelect.value;
    daySelect.innerHTML = "";
    if (age === "") {
      daySelect.disabled = true;
      daySelect.innerHTML = "<option>先に年齢を選択してください</option>";
      updateHintLink();
      return;
    }
    daySelect.disabled = false;
    const ph = document.createElement("option");
    ph.value = ""; ph.textContent = "日数を選択してください";
    daySelect.appendChild(ph);
    for (let d = 0; d <= 365; d++) {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = `${age}歳${d}日`;
      daySelect.appendChild(opt);
    }
    updateHintLink();
  });

  daySelect.addEventListener("change", updateHintLink);
  document.addEventListener("targetDateChanged", updateHintLink);

  function resetSelects() {
    ageSelect.value = "";
    daySelect.disabled = true;
    daySelect.innerHTML = "<option>先に年齢を選択してください</option>";
    updateHintLink();
  }

  // cancelBtn = 青くて目立つ見た目だが「キャンセル」の文字どおりキャンセル
  cancelBtn.addEventListener("click", () => {
    resetSelects();
    result.textContent = "キャンセルしました";
  });

  // confirmBtn = 下線のみで地味な見た目だが「OK」の文字どおり送信
  confirmBtn.addEventListener("click", () => {
    const age = ageSelect.value;
    const dayOffset = daySelect.value;
    if (age === "" || dayOffset === "") return;
    const today = new Date();
    const birth = new Date(today);
    birth.setFullYear(birth.getFullYear() - Number(age));
    birth.setDate(birth.getDate() - Number(dayOffset));
    const y = birth.getFullYear(), m = birth.getMonth() + 1, d = birth.getDate();
    checkDate(y, m, d, result, resetSelects);
  });
})();


/* ============================================================
   9. 英語アルファベット順の月・年選択
============================================================ */
(function () {
  const engYear  = document.getElementById("eng-year");
  const engMonth = document.getElementById("eng-month");
  const submit   = document.getElementById("eng-submit");
  const result   = document.getElementById("eng-result");

  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
                 "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
                 "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  function twoDigits(n) {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    const o = ones[n % 10];
    return o ? `${tens[Math.floor(n / 10)]}-${o}` : tens[Math.floor(n / 10)];
  }

  function yearToWords(y) {
    if (y === 2000) return "two thousand";
    if (y >= 2001 && y <= 2009) return `two thousand ${ones[y - 2000]}`;
    if (y >= 2010 && y <= 2099) return `twenty ${twoDigits(y - 2000)}`;
    if (y === 1900) return "nineteen hundred";
    if (y >= 1901 && y <= 1909) return `nineteen oh ${ones[y - 1900]}`;
    if (y >= 1910 && y <= 1999) return `nineteen ${twoDigits(y - 1900)}`;
    return String(y);
  }

  function makePlaceholder(text) {
    const opt = document.createElement("option");
    opt.value = ""; opt.textContent = text; opt.disabled = true; opt.selected = true;
    return opt;
  }

  engYear.appendChild(makePlaceholder("年を入力してください"));
  const yearOpts = [];
  for (let y = 1950; y <= 2025; y++) yearOpts.push({ y, label: yearToWords(y) });
  yearOpts.sort((a, b) => a.label.localeCompare(b.label));
  yearOpts.forEach(({ y, label }) => {
    const opt = document.createElement("option");
    opt.value = y; opt.textContent = label;
    engYear.appendChild(opt);
  });

  engMonth.appendChild(makePlaceholder("月を入力してください"));
  const MONTHS_EN = [
    { name: "April",     n: 4  }, { name: "August",    n: 8  },
    { name: "December",  n: 12 }, { name: "February",  n: 2  },
    { name: "January",   n: 1  }, { name: "July",      n: 7  },
    { name: "June",      n: 6  }, { name: "March",     n: 3  },
    { name: "May",       n: 5  }, { name: "November",  n: 11 },
    { name: "October",   n: 10 }, { name: "September", n: 9  },
  ];
  MONTHS_EN.forEach(({ name, n }) => {
    const opt = document.createElement("option");
    opt.value = n; opt.textContent = name;
    engMonth.appendChild(opt);
  });

  submit.addEventListener("click", () => {
    const y = Number(engYear.value);
    const m = Number(engMonth.value);
    const d = Number(document.getElementById("eng-day").value);
    if (!d) { result.textContent = "日を入力してください"; return; }
    checkDate(y, m, d, result, () => {
      document.getElementById("eng-day").value = "";
    });
  });
})();


/* ============================================================
   11. スライダー誕生日（1940-01-01〜2100-12-31 全日程1本）
============================================================ */
(function () {
  const slider  = document.getElementById("sl-single");
  const display = document.getElementById("sl-date-display");
  const submit  = document.getElementById("sl-submit");
  const result  = document.getElementById("sl-result");

  const start = new Date(1940, 0, 1);
  const end   = new Date(2100, 11, 31);
  const total = Math.round((end - start) / 86400000); // 約58,804日

  slider.max   = total;
  slider.value = 0;

  function offsetToDate(offset) {
    const d = new Date(start);
    d.setDate(d.getDate() + offset);
    return d;
  }

  function fmt(d) {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }

  slider.addEventListener("input", () => {
    display.textContent = fmt(offsetToDate(Number(slider.value)));
  });

  slider.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      result.textContent = "左キーは利用できません";
      result.style.color = "#dc2626";
    } else if (e.key === "ArrowRight") {
      result.textContent = "";
    }
  });

  submit.addEventListener("click", () => {
    const date = offsetToDate(Number(slider.value));
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    checkDate(y, m, d, result, () => {
      slider.value = 0;
      display.textContent = fmt(offsetToDate(0));
    });
  });
})();


/* ============================================================
   12. 地図から住所を選ぶ
============================================================ */
(function () {
  const selectedEl = document.getElementById("address-selected");
  const submitBtn  = document.getElementById("address-submit");
  const result     = document.getElementById("address-result");

  const map = L.map("address-map").setView([27.09, 142.19], 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  let marker = null;
  let selectedAddress = "";

  map.on("click", async (e) => {
    const { lat, lng } = e.latlng;
    if (marker) marker.remove();
    marker = L.marker([lat, lng]).addTo(map);
    selectedEl.textContent = "住所を取得中...";
    selectedAddress = "";
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ja`,
        { headers: { "User-Agent": "takatowakuda.com/shXtUI" } }
      );
      const data = await res.json();
      selectedAddress = data.display_name ?? "";
      selectedEl.textContent = selectedAddress || "住所を取得できませんでした";
    } catch {
      selectedEl.textContent = "住所の取得に失敗しました";
    }
  });

  submitBtn.addEventListener("click", () => {
    if (!selectedAddress) { result.textContent = "地図から住所を選択してください"; return; }
    result.textContent = `「${selectedAddress}」で登録しました`;
  });
})();


/* ============================================================
   13. 郵便番号自動入力（国名のみ）
============================================================ */
(function () {
  const zipInput    = document.getElementById("addr-zip");
  const autofillBtn = document.getElementById("addr-autofill");
  const countryEl   = document.getElementById("addr-country");
  const submit      = document.getElementById("addr-submit");
  const result      = document.getElementById("addr-result");

  autofillBtn.addEventListener("click", () => {
    if (!zipInput.value.trim()) { result.textContent = "郵便番号を入力してください"; return; }
    autofillBtn.textContent = "取得中...";
    autofillBtn.disabled = true;
    result.textContent = "郵便番号から住所を取得しています。しばらくお待ちください...";
    setTimeout(() => {
      countryEl.value = "日本";
      autofillBtn.textContent = "自動入力";
      autofillBtn.disabled = false;
      result.textContent = "住所の自動入力が完了しました";
    }, 4000);
  });

  // 都道府県サフィックスボタン（ラジオ式）
  const suffixBtns = document.querySelectorAll(".suffix-btn");
  let selectedSuffix = "";
  suffixBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const s = btn.dataset.suffix;
      if (selectedSuffix === s) {
        selectedSuffix = "";
        btn.classList.remove("active");
      } else {
        suffixBtns.forEach(b => b.classList.remove("active"));
        selectedSuffix = s;
        btn.classList.add("active");
      }
    });
  });

  // 市区町村ボタン（先頭に挿入）
  const cityInput = document.getElementById("addr-city");
  document.querySelectorAll(".city-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      cityInput.value = btn.dataset.kanji + cityInput.value;
    });
  });

  submit.addEventListener("click", () => {
    const prefText = document.getElementById("addr-pref").value.trim();
    const pref     = prefText + selectedSuffix;
    const city     = cityInput.value.trim();
    const other1   = document.getElementById("addr-other1").value.trim();
    const other2   = document.getElementById("addr-other2").value.trim();
    if (!prefText || !city || !other1) { result.textContent = "必須項目を入力してください"; result.style.color = ""; return; }
    if (!selectedSuffix) { result.textContent = "エラー：都・道・府・県のいずれかを選択してください"; result.style.color = "#dc2626"; return; }
    if (!/[市区町村]$/.test(city)) { result.textContent = "エラー：市区町村は「市」「区」「町」「村」で終わる必要があります"; result.style.color = "#dc2626"; return; }
    if (!targetPref) { result.textContent = "先にNo.0で都道府県を設定してください"; result.style.color = "#dc2626"; return; }
    if (pref !== targetPref) {
      result.textContent = "一致しません"; result.style.color = "#dc2626";
      document.getElementById("addr-pref").value = ""; selectedSuffix = "";
      suffixBtns.forEach(b => b.classList.remove("active"));
      return;
    }
    result.style.color = "";
    result.textContent = `登録しました：${countryEl.value} ${pref}${city}${other1}${other2 ? " " + other2 : ""}`;
  });
})();


/* ============================================================
   14. ドット絵QRコード入力
============================================================ */
(function () {
  const COLS = 21, ROWS = 21;
  const gridEl   = document.getElementById("qr-grid");
  const canvas   = document.getElementById("qr-canvas");
  const readBtn  = document.getElementById("qr-read");
  const clearBtn = document.getElementById("qr-clear");
  const result   = document.getElementById("qr-result");

  const FINDER = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
  ];

  const cells = [];
  let isDrawing = false;
  let drawFill  = true;

  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "qr-cell";
      cell.addEventListener("mousedown", e => {
        e.preventDefault();
        if (cell.classList.contains("qr-fixed")) return;
        isDrawing = true;
        cell.classList.toggle("filled");
        drawFill = cell.classList.contains("filled");
      });
      cell.addEventListener("mouseenter", () => {
        if (isDrawing && !cell.classList.contains("qr-fixed"))
          cell.classList.toggle("filled", drawFill);
      });
      cell.addEventListener("touchmove", e => {
        e.preventDefault();
        const t = e.touches[0];
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (el && el.classList.contains("qr-cell") && !el.classList.contains("qr-fixed"))
          el.classList.add("filled");
      }, { passive: false });
      gridEl.appendChild(cell);
      row.push(cell);
    }
    cells.push(row);
  }

  function applyFinder(startRow, startCol) {
    FINDER.forEach((row, dr) => {
      row.forEach((val, dc) => {
        const cell = cells[startRow + dr][startCol + dc];
        cell.classList.toggle("filled", val === 1);
        cell.classList.add("qr-fixed");
      });
    });
  }

  applyFinder(0, 0);   // 左上
  applyFinder(0, 14);  // 右上
  applyFinder(14, 0);  // 左下

  document.addEventListener("mouseup", () => { isDrawing = false; });

  clearBtn.addEventListener("click", () => {
    cells.flat().forEach(c => {
      if (!c.classList.contains("qr-fixed")) c.classList.remove("filled");
    });
    result.textContent = "";
    result.style.color = "";
  });

  readBtn.addEventListener("click", () => {
    const PX = 12;
    canvas.width  = COLS * PX;
    canvas.height = ROWS * PX;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    cells.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell.classList.contains("filled")) ctx.fillRect(c * PX, r * PX, PX, PX);
      });
    });

    const PREFS = [
      "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
      "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
      "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
      "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
      "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
      "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
      "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
    ];

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);
    if (!code) {
      result.textContent = "QRコードを認識できませんでした";
      result.style.color = "#dc2626";
    } else if (!PREFS.includes(code.data.trim())) {
      result.textContent = "エラー：都道府県を入力してください";
      result.style.color = "#dc2626";
    } else {
      result.textContent = `登録しました。${code.data.trim()}`;
      result.style.color = "";
    }
  });
})();


/* ============================================================
   15. 複素数年齢スライダー（見た目は普通の横バー）
============================================================ */
(function () {
  const arena   = document.getElementById("cslider");
  const handle  = document.getElementById("cslider-handle");
  const display = document.getElementById("cslider-display");
  const submit  = document.getElementById("cslider-submit");
  const result  = document.getElementById("cslider-result");

  let real = 0, imag = 0;
  let dragging = false;

  function updateDisplay() {
    if (imag === 0) {
      display.textContent = `${real}`;
    } else if (imag > 0) {
      display.textContent = `${real} + ${imag}i`;
    } else {
      display.textContent = `${real} - ${Math.abs(imag)}i`;
    }
  }

  function applyPos(clientX, clientY) {
    const rect = arena.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;

    const rx = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const dy = clientY - centerY; // pixels from center

    handle.style.left = rx + "px";
    handle.style.top  = (rect.height / 2 + dy) + "px";

    real = Math.round(rx / rect.width * 100);
    imag = -Math.round(dy);

    updateDisplay();
  }

  arena.addEventListener("mousedown", e => {
    dragging = true; applyPos(e.clientX, e.clientY);
  });
  document.addEventListener("mousemove", e => {
    if (dragging) applyPos(e.clientX, e.clientY);
  });
  document.addEventListener("mouseup", () => { dragging = false; });

  arena.addEventListener("touchstart", e => {
    dragging = true; applyPos(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  document.addEventListener("touchmove", e => {
    if (dragging) applyPos(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  document.addEventListener("touchend", () => { dragging = false; });

  function resetSlider() {
    real = 0; imag = 0;
    handle.style.left = "0px";
    handle.style.top  = "50%";
    updateDisplay();
  }

  submit.addEventListener("click", () => {
    if (imag !== 0) {
      result.textContent = "値が複素数です。実数で入力してください";
      result.style.color = "#dc2626";
      resetSlider();
      return;
    }
    if (!targetDate) {
      result.textContent = "先にNo.0で誕生日を設定してください";
      result.style.color = "";
      return;
    }
    const today = new Date();
    let age = today.getFullYear() - targetDate.y;
    if (today.getMonth() + 1 < targetDate.m ||
       (today.getMonth() + 1 === targetDate.m && today.getDate() < targetDate.d)) age--;
    if (real !== age) {
      result.textContent = "一致しません";
      result.style.color = "#dc2626";
      resetSlider();
    } else {
      result.textContent = `登録しました。${real}歳`;
      result.style.color = "";
    }
  });

  // 初期位置：左端・中央
  handle.style.left = "0px";
  handle.style.top  = "50%";
})();


/* ============================================================
   16. 住所入力（国名・都道府県名は半角カタカナでふりがな必要）
============================================================ */
(function () {
  const submit = document.getElementById("furi-submit");
  const result = document.getElementById("furi-result");

  function isHalfKana(str) {
    return /^[ｦ-ﾟ\s]+$/.test(str);
  }

  submit.addEventListener("click", () => {
    const country     = document.getElementById("furi-country").value.trim();
    const countryKana = document.getElementById("furi-country-kana").value.trim();
    const pref        = document.getElementById("furi-pref").value.trim();
    const prefKana    = document.getElementById("furi-pref-kana").value.trim();
    const city        = document.getElementById("furi-city").value.trim();
    const street      = document.getElementById("furi-street").value.trim();

    result.style.color = "#dc2626";
    if (!country)      { result.textContent = "国名を入力してください"; return; }
    if (!countryKana)  { result.textContent = "国名のふりがなを入力してください（半角カタカナ）"; return; }
    if (!isHalfKana(countryKana)) {
      result.textContent = "エラー：国名のふりがなは半角カタカナで入力してください";
      document.getElementById("furi-country-kana").value = "";
      return;
    }
    if (!pref)         { result.textContent = "都道府県を入力してください"; return; }
    if (!prefKana)     { result.textContent = "都道府県のふりがなを入力してください（半角カタカナ）"; return; }
    if (!isHalfKana(prefKana)) {
      result.textContent = "エラー：都道府県のふりがなは半角カタカナで入力してください";
      document.getElementById("furi-pref-kana").value = "";
      return;
    }
    if (!city)   { result.textContent = "市区町村を入力してください"; return; }
    if (!street) { result.textContent = "番地を入力してください"; return; }
    result.style.color = "";
    result.textContent = "登録しました";
  });
})();


/* ============================================================
   17. 登録フォーム（パスワードが常に使用済み）
============================================================ */
(function () {
  const submit = document.getElementById("reg-submit");
  const result = document.getElementById("reg-result");

  const NAMES = ["taro","hanako","kenji","yuki","masa","sato","tanaka","yamada","suzuki",
                  "nakamura","kobayashi","ito","watanabe","kato","yoshida","aoki","nishida",
                  "hayashi","inoue","kimura","matsumoto","fujiwara","ogawa","goto","hasegawa"];
  const usedEmails = new Set();

  function genFakeEmail() {
    let email;
    do {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const num  = Math.floor(Math.random() * 9999);
      email = `${name}${num}@xmail.com`;
    } while (usedEmails.has(email));
    usedEmails.add(email);
    return email;
  }

  enforceHalfAscii(document.getElementById("reg-password"));
  enforceHalfAscii(document.getElementById("reg-password2"));

  let attempts = 0;

  document.getElementById("reg-password2").addEventListener("input", () => {
    const pass1 = document.getElementById("reg-password").value;
    const pass2 = document.getElementById("reg-password2").value;
    if (pass2.length > 0 && pass1 !== pass2) {
      alert("パスワードが一致しません");
    }
  });

  submit.addEventListener("click", () => {
    const email = document.getElementById("reg-email").value.trim();
    const pass1 = document.getElementById("reg-password").value;
    const pass2 = document.getElementById("reg-password2").value;

    result.style.color = "#dc2626";
    if (!email)               { result.textContent = "メールアドレスを入力してください"; return; }
    if (!pass1)               { result.textContent = "パスワードを入力してください"; return; }
    if (pass1.length < 4)     { result.textContent = "パスワードは4文字以上で入力してください"; return; }
    if (!/^[\x21-\x7E]+$/.test(pass1)) { result.textContent = "パスワードは半角英数字・記号のみ使用できます"; return; }
    if (pass1 !== pass2)      { result.textContent = "パスワードが一致しません"; return; }

    attempts++;
    if (attempts >= 3) {
      result.style.color = "#dc2626";
      result.style.fontSize = "1.4em";
      result.style.fontWeight = "900";
      result.textContent = `パスワードを「${pass1}」に登録しました。`;
      attempts = 0;
      return;
    }

    result.innerHTML = `このパスワードはメールアドレスが <strong>${genFakeEmail()}</strong> によってすでに使用されております。他のパスワードをご利用ください。`;
    document.getElementById("reg-password").value = "";
    document.getElementById("reg-password2").value = "";
  });
})();


/* ============================================================
   20. 電話番号目押し入力
============================================================ */
(function () {
  const PREFIXES = ["070", "080", "090"];
  const DIGITS   = ["0","1","2","3","4","5","6","7","8","9"];
  const PREFIX_SPEED = 900;
  const DIGIT_SPEEDS = [700, 580, 480, 390, 300, 220, 150, 80];

  const prevEl   = document.getElementById("tel-reel-prev");
  const curEl    = document.getElementById("tel-reel-cur");
  const nextEl   = document.getElementById("tel-reel-next");
  const confirmBtn    = document.getElementById("tel-confirm-btn");
  const clearBtn      = document.getElementById("tel-clear-btn");
  const registerWrap  = document.getElementById("tel-register-wrap");
  const registerBtn   = document.getElementById("tel-register-btn");
  const retryBtn      = document.getElementById("tel-retry-btn");
  const result        = document.getElementById("tel-result");

  let timer = null;
  let idx = 0;
  let currentItems = PREFIXES;
  let phase = 0;       // 0=prefix, 1〜8=桁
  let confirmed = [];  // [prefix, d1..d8]

  function renderReel() {
    const len = currentItems.length;
    prevEl.textContent = currentItems[(idx - 1 + len) % len];
    curEl.textContent  = currentItems[idx];
    nextEl.textContent = currentItems[(idx + 1) % len];
  }

  function startReel(items, speed) {
    if (timer) clearInterval(timer);
    currentItems = items;
    idx = 0;
    renderReel();
    timer = setInterval(() => {
      idx = (idx + 1) % currentItems.length;
      renderReel();
    }, speed);
  }

  function updateDisplay() {
    const prefix = phase === 0 ? "???" : confirmed[0];
    function digitAt(i) {
      if (phase === 0) return "_";
      if (phase > i + 1) return confirmed[i + 1]; // 確定済み
      if (phase === i + 1) return "?";             // スピン中
      return "_";                                   // 未入力
    }
    document.getElementById("tel-seg-0").textContent = prefix;
    document.getElementById("tel-seg-1").textContent = digitAt(0)+digitAt(1)+digitAt(2)+digitAt(3);
    document.getElementById("tel-seg-2").textContent = digitAt(4)+digitAt(5)+digitAt(6)+digitAt(7);
  }

  function init() {
    phase = 0;
    confirmed = [];
    result.textContent = "";
    result.style.color = "";
    confirmBtn.style.display = "";
    registerWrap.style.display = "none";
    updateDisplay();
    startReel(PREFIXES, PREFIX_SPEED);
  }

  confirmBtn.addEventListener("click", () => {
    const val = currentItems[idx];
    confirmed.push(val);
    phase = phase === 0 ? 1 : phase + 1;
    updateDisplay();

    if (phase > 8) {
      clearInterval(timer);
      timer = null;
      curEl.textContent = "✓";
      prevEl.textContent = "";
      nextEl.textContent = "";
      confirmBtn.style.display = "none";
      registerWrap.style.display = "";
      return;
    }

    startReel(DIGITS, DIGIT_SPEEDS[phase - 1]);
  });

  registerBtn.addEventListener("click", () => {
    const prefix = confirmed[0];
    const digs   = confirmed.slice(1).join("");
    result.textContent = `${prefix}-${digs.slice(0,4)}-${digs.slice(4)} で登録しました`;
    result.style.color = "";
    registerWrap.style.display = "none";
  });

  clearBtn.addEventListener("click", init);

  init();
})();


/* ============================================================
   19. 会員登録（メール伏せ・パスワード丸見え）
============================================================ */
(function () {
  const submit = document.getElementById("login-submit");
  const result = document.getElementById("login-result");

  enforceHalfAscii(document.getElementById("login-password"));

  submit.addEventListener("click", () => {
    const email = document.getElementById("login-email").value.trim();
    const pass  = document.getElementById("login-password").value;
    result.style.color = "#dc2626";
    if (!email) { result.textContent = "メールアドレスを入力してください"; return; }
    if (!pass)  { result.textContent = "パスワードを入力してください"; return; }
    if (!/^[\x21-\x7E]+$/.test(pass)) { result.textContent = "パスワードは半角英数字・記号のみ使用できます"; return; }
    result.style.color = "";
    result.textContent = "登録しました";
  });
})();


/* ============================================================
   18. 性別選択（どれを選んでも「既に存在します」）
============================================================ */
(function () {
  const submit = document.getElementById("gender-submit");
  const result = document.getElementById("gender-result");

  submit.addEventListener("click", () => {
    const selected = document.querySelector('input[name="gender"]:checked');
    if (!selected) {
      result.textContent = "性別を選択してください";
      result.style.color = "#dc2626";
      return;
    }
    if (selected.value === "回答しない") {
      result.textContent = "登録しました";
      result.style.color = "";
    } else {
      result.textContent = `「${selected.value}」は他のユーザーによってすでに使用されております。別の性別を選んでください。`;
      result.style.color = "#dc2626";
      selected.checked = false;
    }
  });
})();




/* ============================================================
   10. 偽プレースホルダー（実際の値・グレーのまま）
============================================================ */
(function () {
  const input      = document.getElementById("ghost-input");
  const address    = document.getElementById("ghost-address");
  const phoneChars = Array.from(document.querySelectorAll("#ghost-phone-wrap .phone-char"));
  const submit     = document.getElementById("ghost-submit");
  const result     = document.getElementById("ghost-result");

  [input, address].forEach(el => {
    el.addEventListener("input", () => { el.style.color = "#aaa"; });
    el.addEventListener("keydown", e => {
      if (e.key === "a" && (e.ctrlKey || e.metaKey)) e.preventDefault();
    });
    el.addEventListener("select", () => {
      el.setSelectionRange(el.selectionEnd, el.selectionEnd);
    });
    el.addEventListener("contextmenu", e => e.preventDefault());
  });

  phoneChars.forEach((el, i) => {
    el.addEventListener("input", () => { el.style.color = "#aaa"; });
    el.addEventListener("keydown", e => {
      if (e.key === "Tab") e.preventDefault();
      if (e.key === "a" && (e.ctrlKey || e.metaKey)) e.preventDefault();
    });
    el.addEventListener("select", () => {
      el.setSelectionRange(el.value.length, el.value.length);
    });
    el.addEventListener("contextmenu", e => e.preventDefault());
  });

  submit.addEventListener("click", () => {
    const name = input.value;
    const addr = address.value;
    const ph   = phoneChars.map(el => el.value).join("");
    if (name === "お名前を入力してください" || addr === "住所を入力してください" || ph.length < 11 || ph.includes("X")) {
      result.textContent = "すべて入力してください"; return;
    }
    result.textContent = `「${name}」さん、登録しました！`;
  });
})();
