let currentStartDate = null;
const customRowUpdaters = [];

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

  if (isNaN(startDate.getTime())) {
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
    li.textContent = `${days} 日目：${formatDate(mDate)} ${milestoneStatus(mDate, today, msPerDay)}`;
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

  function updateRow() {
    const val = parseInt(input.value, 10);
    if (!currentStartDate || isNaN(val) || val <= 0) {
      resultSpan.textContent = "";
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;
    const mDate = addDays(currentStartDate, val);
    resultSpan.textContent = `${val} 日目：${formatDate(mDate)} ${milestoneStatus(mDate, today, msPerDay)}`;
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
    el.addEventListener("change", syncHiddenDate)
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
