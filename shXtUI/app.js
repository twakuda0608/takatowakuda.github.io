const year = document.getElementById("year");
const month = document.getElementById("month");
const day = document.getElementById("day");
const submit = document.getElementById("submit");
const result = document.getElementById("result");

const now = new Date();
const currentYear = now.getFullYear();

let randomDays = [];
let dayIndex = 0;
let suppressDayEvent = false;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function renderYears() {
  year.innerHTML = "";
  for (let i = 0; i <= currentYear; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    year.appendChild(option);
  }
  year.value = "0";
}

function renderMonths() {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const currentValue = month.value;
  shuffle(months);

  month.innerHTML = "";
  months.forEach((m) => {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = m;
    month.appendChild(option);
  });

  if (months.includes(Number(currentValue))) {
    month.value = currentValue;
  }
}

function renderRandomDays() {
  randomDays = Array.from({ length: 32 }, (_, i) => i);
  shuffle(randomDays);
  dayIndex = 0;
  setDayValue(randomDays[dayIndex]);
}

function setDayValue(value) {
  suppressDayEvent = true;
  day.value = value;
  setTimeout(() => {
    suppressDayEvent = false;
  }, 0);
}

function moveRandomDay(step) {
  dayIndex = (dayIndex + step + randomDays.length) % randomDays.length;
  setDayValue(randomDays[dayIndex]);
}

function resetForm() {
  renderYears();
  renderMonths();
  renderRandomDays();
}

function isValidDate(y, m, d) {
  if (y < 1900 || y > currentYear) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;

  const testDate = new Date(y, m - 1, d);

  if (
    testDate.getFullYear() !== y ||
    testDate.getMonth() + 1 !== m ||
    testDate.getDate() !== d
  ) {
    return false;
  }

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const inputDate = new Date(y, m - 1, d);

  return inputDate <= today;
}

month.addEventListener("mousedown", renderMonths);
month.addEventListener("focus", renderMonths);

function blockSelectKeyboard(selectElement) {
  selectElement.addEventListener("keydown", (e) => {
    e.preventDefault();
  });
}

blockSelectKeyboard(year);
blockSelectKeyboard(month);

day.addEventListener("beforeinput", (e) => {
  if (e.inputType === "insertText" || e.inputType === "insertFromPaste") {
    e.preventDefault();
  }
});

day.addEventListener("keydown", (e) => {
  if (
    e.key.length === 1 ||
    e.key === "Backspace" ||
    e.key === "Delete"
  ) {
    e.preventDefault();
  }
});

day.addEventListener("input", () => {
  if (suppressDayEvent) return;
  moveRandomDay(1);
});

day.addEventListener("wheel", (e) => {
  e.preventDefault();
  moveRandomDay(1);
}, { passive: false });

year.addEventListener("wheel", (e) => {
  e.preventDefault();
  year.selectedIndex = (year.selectedIndex + 1) % year.options.length;
}, { passive: false });

month.addEventListener("wheel", (e) => {
  e.preventDefault();
  month.selectedIndex = (month.selectedIndex + 1) % month.options.length;
}, { passive: false });

submit.addEventListener("click", () => {
  const y = Number(year.value);
  const m = Number(month.value);
  const d = Number(day.value);

  if (isValidDate(y, m, d)) {
    result.textContent = `${y}/${m}/${d}`;
    return;
  }

  result.textContent = "正しい値を入力してください";
  setTimeout(() => {
    resetForm();
    result.textContent = "";
  }, 300);
});

resetForm();
