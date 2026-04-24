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
const toggleA    = document.getElementById('toggleA');
const toggleB    = document.getElementById('toggleB');
const logicTable = document.getElementById('logicTable');
const logicCode  = document.getElementById('logicCode');
const andTruth   = document.getElementById('andTruth');
const orTruth    = document.getElementById('orTruth');
const vennAnd    = document.getElementById('vennAnd');
const vennOr     = document.getElementById('vennOr');

function getBool(btn) { return btn.dataset.val === 'true'; }

const TRUTH_COMBOS = [[true, true], [true, false], [false, true], [false, false]];

// Two circles: A center(72,60) r48, B center(128,60) r48
// Intersection points calculated at x=100, y=60±39
function renderVenn(svgEl, isAnd, A, B) {
  const sid = isAnd ? 'and' : 'or';

  let fillAOnly, fillIntersect, fillBOnly;
  if (isAnd) {
    fillAOnly    = '#f1f5f9';
    fillIntersect = (A && B) ? '#10b981' : '#f1f5f9';
    fillBOnly    = '#f1f5f9';
  } else {
    fillAOnly    = A ? '#10b981' : '#f1f5f9';
    fillIntersect = (A || B) ? '#10b981' : '#f1f5f9';
    fillBOnly    = B ? '#10b981' : '#f1f5f9';
  }

  const strokeA = A ? '#10b981' : '#d1d5db';
  const strokeB = B ? '#10b981' : '#d1d5db';
  const swA = A ? 3 : 1.5;
  const swB = B ? 3 : 1.5;
  const lblA = A ? '#065f46' : '#9ca3af';
  const lblB = B ? '#065f46' : '#9ca3af';

  svgEl.innerHTML = `
    <defs>
      <mask id="vm-a-${sid}">
        <rect width="200" height="120" fill="black"/>
        <circle cx="72" cy="60" r="48" fill="white"/>
        <circle cx="128" cy="60" r="48" fill="black"/>
      </mask>
      <mask id="vm-b-${sid}">
        <rect width="200" height="120" fill="black"/>
        <circle cx="128" cy="60" r="48" fill="white"/>
        <circle cx="72" cy="60" r="48" fill="black"/>
      </mask>
      <clipPath id="vc-a-${sid}">
        <circle cx="72" cy="60" r="48"/>
      </clipPath>
    </defs>
    <rect width="200" height="120" fill="${fillAOnly}" mask="url(#vm-a-${sid})"/>
    <circle cx="128" cy="60" r="48" fill="${fillIntersect}" clip-path="url(#vc-a-${sid})"/>
    <rect width="200" height="120" fill="${fillBOnly}" mask="url(#vm-b-${sid})"/>
    <circle cx="72"  cy="60" r="48" fill="none" stroke="${strokeA}" stroke-width="${swA}"/>
    <circle cx="128" cy="60" r="48" fill="none" stroke="${strokeB}" stroke-width="${swB}"/>
    <text x="38"  y="65" fill="${lblA}" font-size="20" font-weight="800" text-anchor="middle" font-family="system-ui,sans-serif">A</text>
    <text x="162" y="65" fill="${lblB}" font-size="20" font-weight="800" text-anchor="middle" font-family="system-ui,sans-serif">B</text>
  `;
}

function renderTruth(el, isAnd, A, B) {
  el.innerHTML = TRUTH_COMBOS.map(([a, b]) => {
    const result    = isAnd ? (a && b) : (a || b);
    const isCurrent = a === A && b === B;
    return `<div class="truth-row ${result ? 'is-true' : 'is-false'}${isCurrent ? ' is-current' : ''}">
      <span class="truth-val ${a ? 'tv-true' : 'tv-false'}">${a ? 'True' : 'False'}</span>
      <span class="truth-op-txt">${isAnd ? 'and' : 'or'}</span>
      <span class="truth-val ${b ? 'tv-true' : 'tv-false'}">${b ? 'True' : 'False'}</span>
      <span class="truth-arrow">→</span>
      ${pill(result)}
    </div>`;
  }).join('');
}

function updateLogic() {
  const A = getBool(toggleA);
  const B = getBool(toggleB);

  const rows = [
    { op: 'and', expr: `A and B`, result: A && B },
    { op: 'or',  expr: `A or B`,  result: A || B },
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
print(A or B)   # → ${A || B}`;

  renderVenn(vennAnd, true,  A, B);
  renderVenn(vennOr,  false, A, B);
  renderTruth(andTruth, true,  A, B);
  renderTruth(orTruth,  false, A, B);
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
  { expr: s => `score >= 60`,                fn: s => s >= 60 },
  { expr: s => `score >= 80`,                fn: s => s >= 80 },
  { expr: s => `score >= 60 and score < 80`, fn: s => s >= 60 && s < 80 },
  { expr: s => `score < 60 or score >= 90`,  fn: s => s < 60 || s >= 90 },
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
