const dateInput = document.getElementById("target-date");
const timeInput = document.getElementById("target-time");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");

const output = {
  years: document.getElementById("years"),
  months: document.getElementById("months"),
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function toInputDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toInputTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function readTarget() {
  if (!dateInput.value || !timeInput.value) return null;
  const target = new Date(`${dateInput.value}T${timeInput.value}`);
  return Number.isNaN(target.getTime()) ? null : target;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addYears(date, years) {
  const next = new Date(date);
  const targetYear = next.getFullYear() + years;
  const targetMonth = next.getMonth();
  const targetDay = Math.min(next.getDate(), daysInMonth(targetYear, targetMonth));
  next.setFullYear(targetYear, targetMonth, targetDay);
  return next;
}

function addMonths(date, months) {
  const targetMonthIndex = date.getMonth() + months;
  const targetYear = date.getFullYear() + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const targetDay = Math.min(date.getDate(), daysInMonth(targetYear, targetMonth));
  const next = new Date(date);
  next.setFullYear(targetYear, targetMonth, targetDay);
  return next;
}

function calendarDiff(from, to) {
  if (to <= from) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  let cursor = new Date(from);
  let years = to.getFullYear() - cursor.getFullYear();
  if (addYears(cursor, years) > to) years -= 1;
  cursor = addYears(cursor, years);

  let months = (to.getFullYear() - cursor.getFullYear()) * 12 + to.getMonth() - cursor.getMonth();
  if (addMonths(cursor, months) > to) months -= 1;
  cursor = addMonths(cursor, months);

  let remainingMs = to - cursor;
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const minuteMs = 60 * 1000;

  const days = Math.floor(remainingMs / dayMs);
  remainingMs -= days * dayMs;
  const hours = Math.floor(remainingMs / hourMs);
  remainingMs -= hours * hourMs;
  const minutes = Math.floor(remainingMs / minuteMs);
  remainingMs -= minutes * minuteMs;
  const seconds = Math.floor(remainingMs / 1000);

  return { years, months, days, hours, minutes, seconds };
}

function writeOutput(parts) {
  Object.entries(parts).forEach(([key, value]) => {
    const nextText = value.toLocaleString("ja-JP");
    const el = output[key];
    const valueText = el.querySelector(".value-text");
    const currentText = el.dataset.current || (valueText ? valueText.textContent : el.textContent);
    if (currentText === nextText) return;

    const block = el.closest(".time-block");
    el.dataset.prev = currentText;
    el.dataset.current = nextText;
    if (!block) return;

    window.clearTimeout(Number(el.dataset.swapTimer || 0));
    window.clearTimeout(Number(el.dataset.flipTimer || 0));
    block.classList.remove("is-flipping");
    void block.offsetWidth;
    block.classList.add("is-flipping");

    el.dataset.swapTimer = window.setTimeout(() => {
      if (valueText) {
        valueText.textContent = nextText;
      } else {
        el.textContent = nextText;
      }
    }, 310);

    el.dataset.flipTimer = window.setTimeout(() => {
      block.classList.remove("is-flipping");
    }, 720);
  });
}

function updateCountdown() {
  const target = readTarget();
  if (!target) {
    writeOutput({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
    statusDot.classList.remove("past");
    statusText.textContent = "未来の日付と時刻を選んでください。";
    return;
  }

  const now = new Date();
  if (target <= now) {
    writeOutput({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
    statusDot.classList.add("past");
    statusText.textContent = "選択した日時はすでに過ぎています。";
    return;
  }

  const parts = calendarDiff(now, target);
  writeOutput(parts);
  statusDot.classList.remove("past");
  statusText.textContent = "リアルタイムでカウントダウン中です。";
}

function setDefaultTarget() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  dateInput.value = toInputDate(tomorrow);
  timeInput.value = toInputTime(tomorrow);
}

document.addEventListener("DOMContentLoaded", () => {
  setDefaultTarget();
  updateCountdown();
  dateInput.addEventListener("input", updateCountdown);
  timeInput.addEventListener("input", updateCountdown);
  setInterval(updateCountdown, 1000);
});
