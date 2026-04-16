let integerBits = [16, 8, 4, 2, 1];
let fractionBits = [1 / 2, 1 / 4, 1 / 8, 1 / 16];

let integerStates = new Array(integerBits.length).fill(false);
let fractionStates = new Array(fractionBits.length).fill(false);

const boxesEl = document.getElementById("boxes");
const binaryDisplay = document.getElementById("binaryDisplay");
const decimalDisplay = document.getElementById("decimalDisplay");
const addIntegerBitBtn = document.getElementById("addIntegerBit");
const removeIntegerBitBtn = document.getElementById("removeIntegerBit");
const addFractionBitBtn = document.getElementById("addFractionBit");
const removeFractionBitBtn = document.getElementById("removeFractionBit");
const resetButton = document.getElementById("resetButton");
const incrementBtn = document.getElementById("incrementBtn");
const decrementBtn = document.getElementById("decrementBtn");

let isApplyingDecimal = false;

function formatLabel(v) {
  if (v >= 1) return String(v);
  const denominator = Math.round(1 / v);
  return `1/${denominator}`;
}

function createBitElement(labelText, isActive, onClick) {
  const wrapper = document.createElement("div");
  wrapper.className = "bit-wrapper";

  const box = document.createElement("div");
  box.className = "bit-box" + (isActive ? " active" : "");
  box.textContent = isActive ? "1" : "0";

  const label = document.createElement("div");
  label.className = "bit-label";
  label.textContent = labelText;

  wrapper.appendChild(box);
  wrapper.appendChild(label);
  wrapper.addEventListener("click", onClick);
  return wrapper;
}

function createDotElement() {
  const wrapper = document.createElement("div");
  wrapper.className = "dot-group";

  const dot = document.createElement("div");
  dot.className = "dot";
  dot.textContent = ".";

  const spacer = document.createElement("div");
  spacer.className = "bit-label";
  spacer.textContent = "";

  wrapper.appendChild(dot);
  wrapper.appendChild(spacer);
  return wrapper;
}

function renderBoxes() {
  boxesEl.innerHTML = "";

  integerBits.forEach((bit, index) => {
    const element = createBitElement(
      formatLabel(bit),
      integerStates[index],
      () => {
        integerStates[index] = !integerStates[index];
        updateDisplays();
        renderBoxes();
      }
    );
    boxesEl.appendChild(element);
  });

  if (fractionBits.length > 0) {
    boxesEl.appendChild(createDotElement());
  }

  fractionBits.forEach((bit, index) => {
    const element = createBitElement(
      formatLabel(bit),
      fractionStates[index],
      () => {
        fractionStates[index] = !fractionStates[index];
        updateDisplays();
        renderBoxes();
      }
    );
    boxesEl.appendChild(element);
  });

  updateControlButtons();
}

function updateDisplays() {
  const integerBinary = integerStates.map(v => (v ? 1 : 0)).join("");
  const fractionBinary = fractionStates.map(v => (v ? 1 : 0)).join("");

  binaryDisplay.textContent = fractionBits.length > 0
    ? `${integerBinary}.${fractionBinary}`
    : integerBinary;

  const integerSum = integerBits.reduce((sum, bit, index) => {
    return sum + (integerStates[index] ? bit : 0);
  }, 0);

  const fractionSum = fractionBits.reduce((sum, bit, index) => {
    return sum + (fractionStates[index] ? bit : 0);
  }, 0);

  const total = integerSum + fractionSum;
  if (!isApplyingDecimal) {
    decimalDisplay.value = Number(total.toFixed(10)).toString();
  }
}

function updateControlButtons() {
  removeIntegerBitBtn.disabled = integerBits.length <= 1;
  removeFractionBitBtn.disabled = fractionBits.length === 0;
}

function addIntegerBit() {
  const nextValue = integerBits[0] * 2;
  integerBits.unshift(nextValue);
  integerStates.unshift(false);
  updateDisplays();
  renderBoxes();
}

function removeIntegerBit() {
  if (integerBits.length <= 1) return;
  integerBits.shift();
  integerStates.shift();
  updateDisplays();
  renderBoxes();
}

function addFractionBit() {
  const nextValue = fractionBits.length === 0
    ? 1 / 2
    : fractionBits[fractionBits.length - 1] / 2;
  fractionBits.push(nextValue);
  fractionStates.push(false);
  updateDisplays();
  renderBoxes();
}

function removeFractionBit() {
  if (fractionBits.length === 0) return;
  fractionBits.pop();
  fractionStates.pop();
  updateDisplays();
  renderBoxes();
}

addIntegerBitBtn.addEventListener("click", addIntegerBit);
removeIntegerBitBtn.addEventListener("click", removeIntegerBit);
addFractionBitBtn.addEventListener("click", addFractionBit);
removeFractionBitBtn.addEventListener("click", removeFractionBit);

resetButton.addEventListener("click", () => {
  integerBits   = [16, 8, 4, 2, 1];
  fractionBits  = [1 / 2, 1 / 4, 1 / 8, 1 / 16];
  integerStates = new Array(integerBits.length).fill(false);
  fractionStates = new Array(fractionBits.length).fill(false);
  updateDisplays();
  renderBoxes();
});

incrementBtn.addEventListener("click", () => {
  const current = parseFloat(decimalDisplay.value) || 0;
  const next = current + 1;
  applyDecimalInput(String(next));
  decimalDisplay.value = Number(next.toFixed(10)).toString();
});

decrementBtn.addEventListener("click", () => {
  const current = parseFloat(decimalDisplay.value) || 0;
  const next = current - 1;
  if (next < 0) return;
  applyDecimalInput(String(next));
  decimalDisplay.value = Number(next.toFixed(10)).toString();
});

function applyDecimalInput(raw) {
  const num = parseFloat(raw);
  if (isNaN(num) || num < 0) return;

  const intPart = Math.floor(num);
  const fracPart = num - intPart;

  // 桁が足りなければ上位ビットを自動追加
  while (intPart > integerBits.reduce((s, b) => s + b, 0)) {
    integerBits.unshift(integerBits[0] * 2);
    integerStates.unshift(false);
  }

  // 整数部分を貪欲法でビットに変換
  let rem = intPart;
  integerStates = integerBits.map(bit => {
    if (rem >= bit) { rem -= bit; return true; }
    return false;
  });

  // 小数部分を貪欲法でビットに変換
  let fracRem = fracPart;
  fractionStates = fractionBits.map(bit => {
    if (fracRem >= bit - 1e-12) { fracRem -= bit; return true; }
    return false;
  });

  isApplyingDecimal = true;
  updateDisplays();
  renderBoxes();
  isApplyingDecimal = false;
}

decimalDisplay.addEventListener("input", () => {
  const cleaned = decimalDisplay.value
    .replace(/[^0-9.]/g, "")
    .replace(/^(\d*\.?\d*).*$/, "$1");
  if (cleaned !== decimalDisplay.value) decimalDisplay.value = cleaned;

  if (cleaned !== "" && cleaned !== ".") {
    applyDecimalInput(cleaned);
  }
});

updateDisplays();
renderBoxes();
