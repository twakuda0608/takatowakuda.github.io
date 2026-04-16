/* ============================================================
   変数デモ
============================================================ */
const varNameInput  = document.getElementById("varNameInput");
const varValueInput = document.getElementById("varValueInput");
const varLabelEl    = document.getElementById("varLabel");
const varValEl      = document.getElementById("varVal");
const varTypeEl     = document.getElementById("varType");
const varCodeEl     = document.getElementById("varCode");
const varBox        = document.getElementById("varBox");

function detectType(val) {
  if (val.trim() === "") return { label: "空", style: "#9ca3af" };
  if (!isNaN(val) && val.trim() !== "") {
    return val.includes(".")
      ? { label: "小数（float）", style: "#d97706" }
      : { label: "整数（int）",   style: "#d97706" };
  }
  if (val.toLowerCase() === "true" || val.toLowerCase() === "false") {
    return { label: "真偽値（bool）", style: "#7c3aed" };
  }
  return { label: "文字列（str）", style: "#059669" };
}

function codeValue(val) {
  if (!isNaN(val) && val.trim() !== "") return val;
  if (val.toLowerCase() === "true" || val.toLowerCase() === "false") return val;
  return `"${val}"`;
}

function updateVarDemo() {
  const name  = varNameInput.value.trim()  || "変数名";
  const value = varValueInput.value;

  varLabelEl.textContent = name;
  varValEl.textContent   = value === "" ? "（空）" : value;

  const type = detectType(value);
  varTypeEl.textContent  = type.label;
  varTypeEl.style.color  = type.style;
  varTypeEl.style.background = type.style + "1a"; // 10% opacity

  varCodeEl.textContent = `${name} = ${codeValue(value)}`;

  // ポップアニメーション
  varBox.classList.remove("pop");
  void varBox.offsetWidth;
  varBox.classList.add("pop");
}

varNameInput.addEventListener("input",  updateVarDemo);
varValueInput.addEventListener("input", updateVarDemo);


/* ============================================================
   代入デモ
============================================================ */
const assignInput   = document.getElementById("assignInput");
const assignBtn     = document.getElementById("assignBtn");
const assignBoxEl   = document.getElementById("assignBox");
const assignBoxValEl = document.getElementById("assignBoxVal");
const assignRhsBox  = document.getElementById("assignRhsBox");
const assignRhsValEl = document.getElementById("assignRhsVal");
const assignCodeEl  = document.getElementById("assignCode");
const assignArrowEl = document.getElementById("assignArrow");

function updateAssignRhs() {
  const v = assignInput.value !== "" ? assignInput.value : "0";
  assignRhsValEl.textContent = v;
  assignCodeEl.textContent   = `score = ${v}`;
}

assignInput.addEventListener("input", updateAssignRhs);

assignBtn.addEventListener("click", () => {
  const val = assignInput.value !== "" ? assignInput.value : "0";

  // 右辺ボックス光らせる
  assignRhsBox.classList.remove("flash");
  void assignRhsBox.offsetWidth;
  assignRhsBox.classList.add("flash");

  // 矢印アニメーション
  assignArrowEl.classList.remove("shooting");
  void assignArrowEl.offsetWidth;
  assignArrowEl.classList.add("shooting");

  // 少し遅らせて変数ボックスを更新
  setTimeout(() => {
    assignBoxValEl.textContent = val;
    assignBoxEl.classList.remove("pop", "receive");
    void assignBoxEl.offsetWidth;
    assignBoxEl.classList.add("receive");
  }, 180);
});


/* ============================================================
   score = score + 1 ステップデモ
============================================================ */
const stepInitInput = document.getElementById("stepInitInput");
const stepRunBtn    = document.getElementById("stepRunBtn");
const stepResetBtn  = document.getElementById("stepResetBtn");
const stepVarValEl  = document.getElementById("stepVarVal");
const stepVarBoxEl  = document.getElementById("stepVarBox");
const stepCodeEl2   = document.getElementById("stepCode");

const stepCards = [
  document.getElementById("step1"),
  document.getElementById("step2"),
  document.getElementById("step3"),
];

let stepRunning = false;

function updateStepContent(val) {
  const next = val + 1;
  document.getElementById("stepReadVal").textContent   = val;
  document.getElementById("stepCalcExpr").textContent  = `${val} + 1`;
  document.getElementById("stepCalcResult").textContent = next;
  document.getElementById("stepOldVal").textContent    = val;
  document.getElementById("stepStoreVal").textContent  = next;
  document.getElementById("stepNewVal").textContent    = next;
  stepCodeEl2.textContent =
    `score = ${val}\nscore = score + 1\nprint(score)  # → ${next}`;
}

function resetStep() {
  const init = parseInt(stepInitInput.value) || 0;
  stepVarValEl.textContent = init;
  stepCards.forEach(c => c.classList.remove("active", "done"));
  updateStepContent(init);
  stepRunBtn.disabled = false;
  stepRunning = false;
}

stepInitInput.addEventListener("input", resetStep);
stepResetBtn.addEventListener("click", () => {
  // 初期値入力を元の値に戻してリセット
  resetStep();
});

stepRunBtn.addEventListener("click", async () => {
  if (stepRunning) return;
  stepRunning = true;
  stepRunBtn.disabled = true;

  const oldVal = parseInt(stepInitInput.value) || 0;
  const newVal = oldVal + 1;

  // 全カードを非アクティブに
  stepCards.forEach(c => c.classList.remove("active", "done"));
  stepVarValEl.textContent = oldVal;

  const wait = ms => new Promise(r => setTimeout(r, ms));

  // STEP 1: 右辺の score を読む
  await wait(80);
  stepCards[0].classList.add("active");

  // STEP 2: 計算する
  await wait(900);
  stepCards[0].classList.replace("active", "done");
  stepCards[1].classList.add("active");

  // STEP 3: 代入する
  await wait(900);
  stepCards[1].classList.replace("active", "done");
  stepCards[2].classList.add("active");

  // 変数ボックスを更新
  stepVarValEl.textContent = newVal;
  stepVarBoxEl.classList.remove("pop");
  void stepVarBoxEl.offsetWidth;
  stepVarBoxEl.classList.add("pop");

  await wait(800);
  stepCards[2].classList.replace("active", "done");

  // 次の実行のために表示を更新（score がさらに +1 される準備）
  stepInitInput.value = newVal;
  updateStepContent(newVal);

  stepRunBtn.disabled = false;
  stepRunning = false;
});

// 初期化
resetStep();


/* ============================================================
   リストデモ
============================================================ */
const POOL = [
  "りんご", "バナナ", "みかん", "ぶどう",
  "もも",   "いちご", "メロン", "すいか",
  "なし",   "キウイ", "マンゴ", "レモン",
];

let listItems    = ["りんご", "バナナ", "みかん", "ぶどう"];
let selectedIdx  = null;

const listVisual  = document.getElementById("listVisual");
const listCodeEl  = document.getElementById("listCode");
const listHintEl  = document.getElementById("listHint");
const listCountEl = document.getElementById("listCount");
const addBtn      = document.getElementById("addItemBtn");
const removeBtn   = document.getElementById("removeItemBtn");

function renderList(newIndex = null) {
  listVisual.innerHTML = "";

  listItems.forEach((item, i) => {
    const el = document.createElement("div");
    el.className = "list-item";
    if (i === newIndex)   el.classList.add("new-item");
    if (i === selectedIdx) el.classList.add("selected");

    el.innerHTML = `
      <div class="list-index">[${i}]</div>
      <div class="list-box">${item}</div>
    `;

    el.addEventListener("click", () => {
      selectedIdx = (selectedIdx === i) ? null : i;
      renderList();
    });

    listVisual.appendChild(el);
  });

  updateListCode();
  updateListButtons();
  listCountEl.textContent = listItems.length;
}

function updateListCode() {
  const itemsStr = listItems.map(v => `"${v}"`).join(", ");
  let code = `fruits = [${itemsStr}]`;

  if (selectedIdx !== null && listItems[selectedIdx] !== undefined) {
    const val = listItems[selectedIdx];
    code += `\n\n# [${selectedIdx}] にアクセス\nprint(fruits[${selectedIdx}])  # → "${val}"`;
    listHintEl.textContent = `fruits[${selectedIdx}] の値は "${val}" です`;
  } else {
    listHintEl.textContent = "箱をクリックするとアクセス方法が見られます";
  }

  listCodeEl.textContent = code;
}

function updateListButtons() {
  addBtn.disabled    = listItems.length >= 10;
  removeBtn.disabled = listItems.length <= 1;
}

addBtn.addEventListener("click", () => {
  if (listItems.length >= 10) return;
  // まだ使っていない果物を選ぶ
  const unused = POOL.filter(p => !listItems.includes(p));
  const next   = unused.length > 0 ? unused[0] : POOL[listItems.length % POOL.length];
  listItems.push(next);
  selectedIdx = null;
  renderList(listItems.length - 1);
});

removeBtn.addEventListener("click", () => {
  if (listItems.length <= 1) return;
  if (selectedIdx === listItems.length - 1) selectedIdx = null;
  listItems.pop();
  renderList();
});

// 初期描画
renderList();


/* ============================================================
   二次元リストデモ
============================================================ */
const matrixHintEl = document.getElementById("matrixHint");
const matrixCodeEl = document.getElementById("matrixCode");

const matrixData = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

const baseMatrixCode = () =>
  `matrix = [\n  [1, 2, 3],\n  [4, 5, 6],\n  [7, 8, 9],\n]`;

let selectedMatrixCell = null;

document.querySelectorAll(".matrix-cell").forEach(cell => {
  cell.addEventListener("click", () => {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (selectedMatrixCell === cell) {
      selectedMatrixCell = null;
      document.querySelectorAll(".matrix-cell").forEach(c => c.classList.remove("selected"));
      matrixHintEl.textContent = "セルをクリックするとアクセス方法が見られます";
      matrixCodeEl.textContent = baseMatrixCode();
    } else {
      document.querySelectorAll(".matrix-cell").forEach(c => c.classList.remove("selected"));
      cell.classList.add("selected");
      selectedMatrixCell = cell;
      const val = matrixData[row][col];
      matrixHintEl.textContent = `matrix[${row}][${col}] の値は ${val} です`;
      matrixCodeEl.textContent =
        baseMatrixCode() + `\n\n# [${row}][${col}] にアクセス\nprint(matrix[${row}][${col}])  # → ${val}`;
    }
  });
});
