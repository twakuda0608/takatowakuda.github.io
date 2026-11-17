/* ============================================================
   Section 1: 関数マシン (double)
============================================================ */
const mInput  = document.getElementById('mInput');
const mInVal  = document.getElementById('mInVal');
const mOutVal = document.getElementById('mOutVal');
const mBox    = document.getElementById('mBox');
const mCode   = document.getElementById('mCode');

function updateMachineDisplay() {
  const x = mInput.value;
  mInVal.textContent = x === '' ? '?' : x;
  mOutVal.textContent = '?';
}

function updateMachineCode(result) {
  const x = mInput.value || '?';
  const res = result !== undefined ? result : (isNaN(parseFloat(x)) ? '?' : parseFloat(x) * 2);
  mCode.textContent =
`def double(x):
    return x * 2

double(${x})  # → ${res}`;
}

document.getElementById('mRunBtn').addEventListener('click', () => {
  const x = parseFloat(mInput.value);
  if (isNaN(x)) return;
  const result = x * 2;

  mBox.classList.remove('running');
  void mBox.offsetWidth;
  mBox.classList.add('running');

  setTimeout(() => {
    mOutVal.textContent = result;
    mOutVal.classList.remove('pop');
    void mOutVal.offsetWidth;
    mOutVal.classList.add('pop');
    updateMachineCode(result);
  }, 350);
});

mInput.addEventListener('input', () => {
  updateMachineDisplay();
  updateMachineCode();
});

updateMachineDisplay();
updateMachineCode();


/* ============================================================
   Section 2: 解剖図 (hover highlight)
============================================================ */
document.querySelectorAll('.anat-row').forEach(row => {
  const part = row.dataset.hi;

  row.addEventListener('mouseenter', () => {
    if (part === 'body') {
      document.querySelectorAll('#anatCode .anat-indent').forEach(el => el.classList.add('hl-body'));
    } else {
      document.querySelectorAll(`#anatCode [data-hi="${part}"]`).forEach(el => el.classList.add('hl'));
    }
  });

  row.addEventListener('mouseleave', () => {
    document.querySelectorAll('#anatCode .hl, #anatCode .hl-body').forEach(el => {
      el.classList.remove('hl', 'hl-body');
    });
  });
});


/* ============================================================
   Section 3: 引数アニメーションデモ
============================================================ */
const fsInput     = document.getElementById('fsInput');
const fsNextBtn   = document.getElementById('fsNextBtn');
const fsResetBtn  = document.getElementById('fsResetBtn');
const fnFlowStage = document.getElementById('fnFlowStage');
const fnCallRes   = document.getElementById('fnCallRes');
const fnArgToken  = document.getElementById('fnArgToken');
const fnDownPill  = document.getElementById('fnDownPill');
const fnUpPill    = document.getElementById('fnUpPill');
const fnDefPanel  = document.getElementById('fnDefPanel');
const fnParamBox  = document.getElementById('fnParamBox');
const fnBodyExpr  = document.getElementById('fnBodyExpr');
const fnBodyX     = document.getElementById('fnBodyX');
const fnPill1     = document.getElementById('fnPill1');
const fnPill2     = document.getElementById('fnPill2');
const fnPill3     = document.getElementById('fnPill3');

let fnRunning = false;

function fsReset() {
  const x = parseInt(fsInput.value) || 5;
  fnArgToken.textContent = x;
  fnCallRes.textContent = "result";
  fnCallRes.classList.remove("highlight");
  fnParamBox.textContent = "x";
  fnParamBox.classList.remove("filled");
  fnBodyExpr.innerHTML = `<span id="fnBodyX">x</span> * 2`;
  fnBodyExpr.classList.remove("highlight");
  fnDefPanel.classList.remove("pulse");
  if (fnDownPill) fnDownPill.classList.remove("active");
  if (fnUpPill)   fnUpPill.classList.remove("active");
  [fnPill1, fnPill2, fnPill3].forEach(p => p && p.classList.remove("active"));
  fsNextBtn.disabled = false;
  fnRunning = false;
}

fsNextBtn.addEventListener('click', async () => {
  if (fnRunning) return;
  fnRunning = true;
  fsNextBtn.disabled = true;

  const x = parseInt(fsInput.value) || 5;
  const result = x * 2;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // リセット
  fsReset();
  fnRunning = true;
  fsNextBtn.disabled = true;

  const stageRect = fnFlowStage.getBoundingClientRect();
  const argRect   = fnArgToken.getBoundingClientRect();
  const paramRect = fnParamBox.getBoundingClientRect();
  const resRect   = fnCallRes.getBoundingClientRect();

  // ── ステップ①: 引数を渡す ──
  if (fnPill1)    fnPill1.classList.add("active");
  if (fnDownPill) fnDownPill.classList.add("active");
  await wait(150);

  const fromX1 = argRect.left - stageRect.left + argRect.width / 2;
  const fromY1 = argRect.top  - stageRect.top  + argRect.height / 2;
  const toX1   = paramRect.left - stageRect.left + paramRect.width / 2;
  const toY1   = paramRect.top  - stageRect.top  + paramRect.height / 2;

  const token1 = document.createElement("div");
  token1.className = "fly-token";
  token1.textContent = x;
  token1.style.left = fromX1 + "px";
  token1.style.top  = fromY1 + "px";
  token1.style.background = "#f59e0b";
  token1.style.color = "#fff";
  fnFlowStage.appendChild(token1);

  const dx1 = toX1 - fromX1;
  const dy1 = toY1 - fromY1;

  await new Promise(res => {
    const anim = token1.animate([
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: 0 },
      { transform: `translate(calc(-50% + ${dx1 * 0.4}px), calc(-50% + ${dy1 * 0.5 - 20}px)) scale(1.2)`, opacity: 1, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx1}px), calc(-50% + ${dy1}px)) scale(0.9)`, opacity: 0.2, offset: 1 },
    ], { duration: 500, easing: "cubic-bezier(0.25, 1, 0.5, 1)", fill: "forwards" });
    anim.onfinish = res;
  });
  token1.remove();

  fnParamBox.textContent = `x=${x}`;
  fnParamBox.classList.add("filled");

  await wait(600);

  // ── ステップ②: 処理実行（計算） ──
  if (fnPill1)    fnPill1.classList.remove("active");
  if (fnDownPill) fnDownPill.classList.remove("active");
  if (fnPill2)    fnPill2.classList.add("active");
  fnDefPanel.classList.add("pulse");

  fnBodyExpr.innerHTML = `${x} * 2`;
  fnBodyExpr.classList.add("highlight");
  await wait(450);

  fnBodyExpr.innerHTML = `→ ${result}`;

  await wait(750);

  // ── ステップ③: 結果返却 ──
  if (fnPill2)  fnPill2.classList.remove("active");
  if (fnPill3)  fnPill3.classList.add("active");
  if (fnUpPill) fnUpPill.classList.add("active");

  const exprRect = fnBodyExpr.getBoundingClientRect();
  const fromX2 = exprRect.left - stageRect.left + exprRect.width / 2;
  const fromY2 = exprRect.top  - stageRect.top  + exprRect.height / 2;
  const toX2   = resRect.left  - stageRect.left + resRect.width / 2;
  const toY2   = resRect.top   - stageRect.top  + resRect.height / 2;

  const token2 = document.createElement("div");
  token2.className = "fly-token";
  token2.textContent = result;
  token2.style.left = fromX2 + "px";
  token2.style.top  = fromY2 + "px";
  token2.style.background = "#10b981";
  token2.style.color = "#fff";
  fnFlowStage.appendChild(token2);

  const dx2 = toX2 - fromX2;
  const dy2 = toY2 - fromY2;

  await new Promise(res => {
    const anim = token2.animate([
      { transform: "translate(-50%,-50%) scale(1.1)", opacity: 1, offset: 0 },
      { transform: `translate(calc(-50% + ${dx2 * 0.4}px), calc(-50% + ${dy2 * 0.5 - 20}px)) scale(1.25)`, opacity: 1, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx2}px), calc(-50% + ${dy2}px)) scale(0.9)`, opacity: 0, offset: 1 },
    ], { duration: 520, easing: "cubic-bezier(0.25, 1, 0.5, 1)", fill: "forwards" });
    anim.onfinish = res;
  });
  token2.remove();

  fnCallRes.textContent = `result (${result})`;
  fnCallRes.classList.add("highlight");

  await wait(800);
  if (fnPill3)  fnPill3.classList.remove("active");
  if (fnUpPill) fnUpPill.classList.remove("active");

  fsNextBtn.disabled = false;
  fnRunning = false;
});

fsResetBtn.addEventListener('click', fsReset);
fsInput.addEventListener('input', fsReset);
fsReset();


/* ============================================================
   Section 4: 複数の引数 (add)
============================================================ */
const mInputA   = document.getElementById('mInputA');
const mInputB   = document.getElementById('mInputB');
const mA        = document.getElementById('mA');
const mB        = document.getElementById('mB');
const mMultiOut = document.getElementById('mMultiOut');
const mBoxMulti = document.getElementById('mBoxMulti');
const mMultiCode = document.getElementById('mMultiCode');

function updateMultiDisplay() {
  mA.textContent = mInputA.value === '' ? '?' : mInputA.value;
  mB.textContent = mInputB.value === '' ? '?' : mInputB.value;
  mMultiOut.textContent = '?';
}

function updateMultiCode(result) {
  const a = mInputA.value || '?';
  const b = mInputB.value || '?';
  const res = result !== undefined ? result : '?';
  mMultiCode.textContent =
`def add(a, b):
    return a + b

add(${a}, ${b})  # → ${res}`;
}

document.getElementById('mRunMulti').addEventListener('click', () => {
  const a = parseFloat(mInputA.value);
  const b = parseFloat(mInputB.value);
  if (isNaN(a) || isNaN(b)) return;
  const result = a + b;

  mBoxMulti.classList.remove('running');
  void mBoxMulti.offsetWidth;
  mBoxMulti.classList.add('running');

  setTimeout(() => {
    mMultiOut.textContent = result;
    mMultiOut.classList.remove('pop');
    void mMultiOut.offsetWidth;
    mMultiOut.classList.add('pop');
    updateMultiCode(result);
  }, 350);
});

[mInputA, mInputB].forEach(el => el.addEventListener('input', () => {
  updateMultiDisplay();
  updateMultiCode();
}));

updateMultiDisplay();
updateMultiCode();
