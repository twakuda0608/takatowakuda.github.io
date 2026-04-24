/* ============================================================
   比較演算子
============================================================ */
const aInput   = document.getElementById('aInput');
const bInput   = document.getElementById('bInput');
const cmpTable = document.getElementById('cmpTable');
const cmpCode  = document.getElementById('cmpCode');

const CMP_OPS = [
  { op: '==', label: '==', fn: (a, b) => a === b },
  { op: '!=', label: '!=', fn: (a, b) => a !== b },
  { op: '<',  label: '<',  fn: (a, b) => a < b },
  { op: '>',  label: '>',  fn: (a, b) => a > b },
  { op: '<=', label: '<=', fn: (a, b) => a <= b },
  { op: '>=', label: '>=', fn: (a, b) => a >= b },
];

function pill(val) {
  return `<span class="result-pill ${val ? 'true' : 'false'}">${val ? 'True' : 'False'}</span>`;
}

function updateCmp() {
  const a = parseFloat(aInput.value) || 0;
  const b = parseFloat(bInput.value) || 0;

  cmpTable.innerHTML = CMP_OPS.map(({ op, fn }) => {
    const result = fn(a, b);
    return `<div class="cmp-row ${result ? 'is-true' : 'is-false'}">
      <span class="cmp-op">${op}</span>
      <span class="cmp-expr">${a} ${op} ${b}</span>
      ${pill(result)}
    </div>`;
  }).join('');

  cmpCode.textContent = `a = ${a}\nb = ${b}\n\n` +
    CMP_OPS.map(({ op, fn }) => `print(a ${op} b)  # → ${fn(a, b)}`).join('\n');
}

aInput.addEventListener('input', updateCmp);
bInput.addEventListener('input', updateCmp);
updateCmp();


/* ============================================================
   論理演算子
============================================================ */
const toggleA   = document.getElementById('toggleA');
const toggleB   = document.getElementById('toggleB');
const logicTable = document.getElementById('logicTable');
const logicCode  = document.getElementById('logicCode');

function getBool(btn) { return btn.dataset.val === 'true'; }

function updateLogic() {
  const A = getBool(toggleA);
  const B = getBool(toggleB);

  const rows = [
    { op: 'and', expr: `A and B`, result: A && B },
    { op: 'or',  expr: `A or B`,  result: A || B },
    { op: 'not', expr: `not A`,   result: !A },
    { op: 'not', expr: `not B`,   result: !B },
  ];

  logicTable.innerHTML = rows.map(({ op, expr, result }) =>
    `<div class="logic-row ${result ? 'is-true' : 'is-false'}">
      <span class="logic-op">${op}</span>
      <span class="logic-expr">${expr}</span>
      ${pill(result)}
    </div>`
  ).join('');

  logicCode.textContent =
`A = ${A}
B = ${B}

print(A and B)  # → ${A && B}
print(A or B)   # → ${A || B}
print(not A)    # → ${!A}
print(not B)    # → ${!B}`;
}

toggleA.addEventListener('click', () => {
  const next = toggleA.dataset.val === 'true' ? 'false' : 'true';
  toggleA.dataset.val  = next;
  toggleA.textContent  = next === 'true' ? 'True' : 'False';
  updateLogic();
});

toggleB.addEventListener('click', () => {
  const next = toggleB.dataset.val === 'true' ? 'false' : 'true';
  toggleB.dataset.val  = next;
  toggleB.textContent  = next === 'true' ? 'True' : 'False';
  updateLogic();
});

updateLogic();


/* ============================================================
   組み合わせ（score の例）
============================================================ */
const scoreInput = document.getElementById('scoreInput');
const comboTable = document.getElementById('comboTable');
const comboCode  = document.getElementById('comboCode');

const COMBO_ROWS = [
  { expr: s => `score >= 60`,           fn: s => s >= 60 },
  { expr: s => `score >= 80`,           fn: s => s >= 80 },
  { expr: s => `score >= 60 and score < 80`, fn: s => s >= 60 && s < 80 },
  { expr: s => `score < 60 or score >= 90`,  fn: s => s < 60 || s >= 90 },
  { expr: s => `not (score >= 60)`,     fn: s => !(s >= 60) },
];

function updateCombo() {
  const s = parseInt(scoreInput.value) || 0;

  comboTable.innerHTML = COMBO_ROWS.map(({ expr, fn }) => {
    const result = fn(s);
    return `<div class="combo-row ${result ? 'is-true' : 'is-false'}">
      <span class="combo-expr">${expr(s)}</span>
      ${pill(result)}
    </div>`;
  }).join('');

  comboCode.textContent = `score = ${s}\n\n` +
    COMBO_ROWS.map(({ expr, fn }) => `print(${expr(s)})  # → ${fn(s)}`).join('\n');
}

scoreInput.addEventListener('input', updateCombo);
updateCombo();
