/* ============================================================
   UI 番号バッジを全カードに自動付与
============================================================ */
document.querySelectorAll(".ui").forEach((ui, i) => {
  const badge = document.createElement("div");
  badge.className = "ui-number";
  badge.textContent = `No.${i}`;
  ui.prepend(badge);
});


/* ============================================================
   グローバル：基準日 & 照合
============================================================ */
let targetDate = null;

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


/* ============================================================
   0. 基準の誕生日設定（親切なUI）
============================================================ */
(function () {
  const baseYear   = document.getElementById("base-year");
  const baseMonth  = document.getElementById("base-month");
  const baseDay    = document.getElementById("base-day");
  const baseSubmit = document.getElementById("base-submit");
  const baseResult = document.getElementById("base-result");

  baseSubmit.addEventListener("click", () => {
    const y = Number(baseYear.value);
    const m = Number(baseMonth.value);
    const d = Number(baseDay.value);
    const t = new Date(y, m - 1, d);
    if (!y || !m || !d || t.getFullYear() !== y || t.getMonth() + 1 !== m || t.getDate() !== d) {
      baseResult.textContent = "正しい日付を入力してください";
      return;
    }
    targetDate = { y, m, d };
    baseResult.textContent = `${y}年${m}月${d}日を設定しました`;
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
  for (let i = 1900; i <= currentYear; i++) {
    const opt = document.createElement("option");
    opt.value = i; opt.textContent = i;
    year.appendChild(opt);
  }
  year.value = "1900";
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
  if (y < 1900 || y > currentYear) return false;
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

  escBtn.style.cssText = "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);";

  escBtn.addEventListener("mouseenter", () => {
    const maxX = arena.offsetWidth  - escBtn.offsetWidth  - 8;
    const maxY = arena.offsetHeight - escBtn.offsetHeight - 8;
    escBtn.style.transform = "";
    escBtn.style.left = Math.random() * Math.max(maxX, 0) + "px";
    escBtn.style.top  = Math.random() * Math.max(maxY, 0) + "px";
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
})();


/* ============================================================
   3. シャッフルアンケート
============================================================ */
(function () {
  const FOODS = ["ラーメン","カレー","すし","ピザ","うどん","パスタ","焼肉","天ぷら"];
  const container = document.getElementById("shuffle-options");
  const res       = document.getElementById("shuffle-result");
  const submitBtn = document.getElementById("shuffle-submit");
  let selected = null;

  function renderFoods() {
    const order = [...FOODS].sort(() => Math.random() - 0.5);
    container.innerHTML = "";
    order.forEach(food => {
      const label = document.createElement("label");
      label.style.cssText = "display:block;padding:5px 0;cursor:pointer;user-select:none;text-align:left;";
      const radio = document.createElement("input");
      radio.type = "radio"; radio.name = "food"; radio.value = food;
      if (food === selected) radio.checked = true;
      radio.addEventListener("change", () => { selected = food; });
      label.appendChild(radio);
      label.appendChild(document.createTextNode(" " + food));
      container.appendChild(label);
    });
  }

  renderFoods();
  setInterval(renderFoods, 1500);

  submitBtn.addEventListener("click", () => {
    res.textContent = selected ? `「${selected}」を選択しました` : "選択してください";
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
    entered = ""; display.textContent = "--";
    shuffleArr(digits); renderKeys();
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

  input.addEventListener("input", () => { lenEl.textContent = input.value.length; });

  function showText()  { input.style.color = "#1a202c"; }
  function hideText()  { input.style.color = "#fff"; }

  toggle.addEventListener("mousedown",   showText);
  toggle.addEventListener("touchstart",  showText, { passive: true });
  toggle.addEventListener("mouseup",     hideText);
  toggle.addEventListener("mouseleave",  hideText);
  toggle.addEventListener("touchend",    hideText);
  toggle.addEventListener("touchcancel", hideText);

  submit.addEventListener("click", () => {
    result.textContent = input.value.trim()
      ? `「${input.value}」さん、登録しました`
      : "名前を入力してください";
  });
})();


/* ============================================================
   8. OK と キャンセルが逆
      - 青い「キャンセル」ボタン → 実際は送信（確定）
      - 下線だけの「OK」→ 実際はキャンセル
============================================================ */
(function () {
  const cancelBtn  = document.getElementById("ok-cancel-btn");   // 青・目立つ → 実際は送信
  const confirmBtn = document.getElementById("ok-confirm-btn");  // 下線のみ → 実際はキャンセル
  const result     = document.getElementById("ok-result");

  // cancelBtn = 青くて目立つ見た目だが「キャンセル」の文字どおりキャンセル
  cancelBtn.addEventListener("click", () => {
    document.getElementById("ok-year").value  = "";
    document.getElementById("ok-month").value = "";
    document.getElementById("ok-day").value   = "";
    result.textContent = "キャンセルしました";
  });

  // confirmBtn = 下線のみで地味な見た目だが「OK」の文字どおり送信
  confirmBtn.addEventListener("click", () => {
    const y = Number(document.getElementById("ok-year").value);
    const m = Number(document.getElementById("ok-month").value);
    const d = Number(document.getElementById("ok-day").value);
    if (!y || !m || !d) { result.textContent = "すべて入力してください"; return; }
    checkDate(y, m, d, result, () => {
      document.getElementById("ok-year").value  = "";
      document.getElementById("ok-month").value = "";
      document.getElementById("ok-day").value   = "";
    });
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

  const yearOpts = [];
  for (let y = 1950; y <= 2025; y++) yearOpts.push({ y, label: yearToWords(y) });
  yearOpts.sort((a, b) => a.label.localeCompare(b.label));
  yearOpts.forEach(({ y, label }) => {
    const opt = document.createElement("option");
    opt.value = y; opt.textContent = label;
    engYear.appendChild(opt);
  });

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
  });

  phoneChars.forEach((el, i) => {
    el.addEventListener("input", () => { el.style.color = "#aaa"; });
    el.addEventListener("keydown", e => {
      if (e.key === "Tab") e.preventDefault();
    });
  });

  submit.addEventListener("click", () => {
    const name = input.value;
    const addr = address.value;
    const ph   = phoneChars.map(el => el.value).join("");
    if (name === "お名前を入力してください" || addr === "住所を入力してください" || ph.length < 11) {
      result.textContent = "すべて入力してください"; return;
    }
    result.textContent = `「${name}」さん、登録しました！`;
  });
})();
