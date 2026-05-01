let currentStartDate = null;
const customRowUpdaters = [];

function formatDateICS(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function makeCalBtns(days, mDate) {
  const title = `${days}日記念日`;
  const dateStr = formatDateICS(mDate);
  const next = new Date(mDate);
  next.setDate(next.getDate() + 1);
  const nextStr = formatDateICS(next);

  const wrap = document.createElement("div");
  wrap.className = "cal-btns";

  const gBtn = document.createElement("a");
  gBtn.className = "cal-btn cal-btn--google";
  gBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateStr}/${nextStr}`;
  gBtn.target = "_blank";
  gBtn.rel = "noopener noreferrer";
  gBtn.title = "Google カレンダーに追加";
  gBtn.setAttribute("aria-label", "Google カレンダーに追加");
  gBtn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>`;

  const iBtn = document.createElement("button");
  iBtn.type = "button";
  iBtn.className = "cal-btn cal-btn--icloud";
  iBtn.title = "iCloud カレンダーに追加";
  iBtn.setAttribute("aria-label", "iCloud カレンダーに追加");
  iBtn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>`;
  iBtn.addEventListener("click", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Date Calculator//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${nextStr}`,
      `SUMMARY:${title}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  });

  wrap.append(iBtn, gBtn);
  return wrap;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}年${m}月${d}日`;
}

function formatWareki(date) {
  return new Intl.DateTimeFormat(
    "ja-JP-u-ca-japanese",
    { year: "numeric", month: "long", day: "numeric" }
  ).format(date);
}

function addDays(baseDate, days) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d;
}

function milestoneStatus(milestoneDate, today, msPerDay) {
  const diff = Math.floor((milestoneDate - today) / msPerDay);
  if (diff > 0) return `（あと ${diff} 日）`;
  if (diff === 0) return "（ちょうど今日）";
  return `（${-diff} 日前に到達）`;
}

function calculate() {
  const y = document.getElementById("inputYear").value.trim();
  const m = document.getElementById("inputMonth").value.trim();
  const d = document.getElementById("inputDay").value.trim();
  const resultDiv = document.getElementById("result");
  const milestoneSection = document.getElementById("milestoneSection");

  if (!y || !m || !d) {
    resultDiv.textContent = "日付を入力してください．";
    milestoneSection.hidden = true;
    return;
  }

  const dateStr = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const startDate = new Date(dateStr);

  if (
    isNaN(startDate.getTime()) ||
    startDate.getFullYear() !== parseInt(y, 10) ||
    startDate.getMonth() + 1 !== parseInt(m, 10) ||
    startDate.getDate() !== parseInt(d, 10)
  ) {
    resultDiv.textContent = "無効な日付です．";
    milestoneSection.hidden = true;
    return;
  }

  const wareki = formatWareki(startDate);
  const today = new Date();

  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = today - startDate;
  const totalDays = Math.floor(diffMs / msPerDay);

  if (totalDays < 0) {
    resultDiv.textContent = "未来の日付です．";
    milestoneSection.hidden = true;
    return;
  }

  const weeks = Math.floor(totalDays / 7);
  const daysAfterWeeks = totalDays % 7;

  let years = 0, months = 0;
  let tempDate = new Date(startDate);

  while (true) {
    const nextYear = new Date(tempDate);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    if (nextYear <= today) { years++; tempDate = nextYear; } else break;
  }

  const daysAfterYears = Math.floor((today - tempDate) / msPerDay);

  while (true) {
    const nextMonth = new Date(tempDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    if (nextMonth <= today) { months++; tempDate = nextMonth; } else break;
  }

  const remainingDays = Math.floor((today - tempDate) / msPerDay);

  resultDiv.innerHTML = `
    <div class="result-card">
      <div class="result-title">入力した日付</div>
      <div class="result-body">
        <p>${formatDate(startDate)}</p>
        <p>（${wareki}）</p>
      </div>
    </div>
    <div class="result-card">
      <div class="result-title">経過期間</div>
      <div class="result-body">
        <p class="sumline">合計：${totalDays} 日</p>
        <p>${weeks} 週間 ${daysAfterWeeks} 日</p>
        <p>${years} 年 ${months} ヶ月 ${remainingDays} 日</p>
        <p>${years} 年 + ${daysAfterYears} 日</p>
      </div>
    </div>
  `;

  // 記念日（固定）
  currentStartDate = startDate;
  document.querySelectorAll("#milestoneList [data-days]").forEach(li => {
    const days = parseInt(li.dataset.days, 10);
    const mDate = addDays(startDate, days);
    li.innerHTML = "";
    const textSpan = document.createElement("span");
    textSpan.textContent = `${days} 日目：${formatDate(mDate)} ${milestoneStatus(mDate, today, msPerDay)}`;
    li.append(textSpan, makeCalBtns(days, mDate));
  });

  // 記念日（カスタム）
  customRowUpdaters.forEach(fn => fn());

  milestoneSection.hidden = false;
}

function addCustomMilestoneRow() {
  const list = document.getElementById("milestoneList");

  const li = document.createElement("li");
  li.className = "custom-milestone";

  const input = document.createElement("input");
  input.type = "number";
  input.className = "milestone-input";
  input.placeholder = "日数";
  input.min = "1";

  const resultSpan = document.createElement("span");
  resultSpan.className = "milestone-result";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-milestone-btn";
  removeBtn.textContent = "×";

  let calBtnsEl = null;

  function updateRow() {
    const val = parseInt(input.value, 10);
    if (calBtnsEl) { calBtnsEl.remove(); calBtnsEl = null; }
    if (!currentStartDate || isNaN(val) || val <= 0) {
      resultSpan.textContent = "";
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;
    const mDate = addDays(currentStartDate, val);
    resultSpan.textContent = `${val} 日目：${formatDate(mDate)} ${milestoneStatus(mDate, today, msPerDay)}`;
    calBtnsEl = makeCalBtns(val, mDate);
    li.insertBefore(calBtnsEl, removeBtn);
  }

  input.addEventListener("input", updateRow);

  removeBtn.addEventListener("click", () => {
    const idx = customRowUpdaters.indexOf(updateRow);
    if (idx !== -1) customRowUpdaters.splice(idx, 1);
    li.remove();
  });

  li.append(input, resultSpan, removeBtn);
  list.appendChild(li);
  customRowUpdaters.push(updateRow);
  input.focus();
}

document.addEventListener("DOMContentLoaded", () => {
  const calBtn     = document.getElementById("calBtn");
  const hiddenDate = document.getElementById("hiddenDate");
  const inputYear  = document.getElementById("inputYear");
  const inputMonth = document.getElementById("inputMonth");
  const inputDay   = document.getElementById("inputDay");

  function syncHiddenDate() {
    const y = inputYear.value.trim();
    const m = inputMonth.value.trim();
    const d = inputDay.value.trim();
    if (y && m && d) {
      hiddenDate.value = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    }
  }

  calBtn.addEventListener("click", () => {
    try { hiddenDate.showPicker(); } catch { hiddenDate.click(); }
  });

  hiddenDate.addEventListener("change", () => {
    const [y, m, d] = hiddenDate.value.split("-");
    inputYear.value  = parseInt(y, 10);
    inputMonth.value = parseInt(m, 10);
    inputDay.value   = parseInt(d, 10);
    calculate();
  });

  [inputYear, inputMonth, inputDay].forEach(el =>
    el.addEventListener("input", () => { syncHiddenDate(); calculate(); })
  );

  document.getElementById("addMilestoneBtn").addEventListener("click", addCustomMilestoneRow);

  const param = new URLSearchParams(location.search).get("date");
  if (param) {
    const parts = param.split("-");
    if (parts.length === 3) {
      inputYear.value  = parseInt(parts[0], 10);
      inputMonth.value = parseInt(parts[1], 10);
      inputDay.value   = parseInt(parts[2], 10);
    }
  }

  syncHiddenDate();
  calculate();
});
