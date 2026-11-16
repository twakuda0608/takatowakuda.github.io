/* ============================================================
   if デモ
============================================================ */
const ifScoreInput  = document.getElementById('ifScoreInput');
const ifThreshInput = document.getElementById('ifThreshInput');
const ifCondBox     = document.getElementById('ifCondBox');
const ifThreshDisp  = document.getElementById('ifThreshDisplay');
const trueBranch    = document.getElementById('trueBranch');
const falseBranch   = document.getElementById('falseBranch');
const ifCodeEl      = document.getElementById('ifCode');

function updateIf() {
  const score  = parseInt(ifScoreInput.value)  ?? 0;
  const thresh = parseInt(ifThreshInput.value) ?? 0;
  const passed = score >= thresh;

  ifThreshDisp.textContent = thresh;
  ifCondBox.classList.toggle('is-true',  passed);
  ifCondBox.classList.toggle('is-false', !passed);
  trueBranch.classList.toggle('active',   passed);
  falseBranch.classList.toggle('active', !passed);

  ifCodeEl.textContent =
`score = ${score}
if score >= ${thresh}:
    print("合格！")
else:
    print("不合格")
# → ${passed ? '合格！' : '不合格'}`;
}

ifScoreInput.addEventListener('input',  updateIf);
ifThreshInput.addEventListener('input', updateIf);
updateIf();


/* ============================================================
   for デモ
============================================================ */
const forNInput   = document.getElementById('forNInput');
const forStepBtn  = document.getElementById('forStepBtn');
const forResetBtn = document.getElementById('forResetBtn');
const forVisualEl = document.getElementById('forVisual');
const forHintEl   = document.getElementById('forHint');
const forCodeEl   = document.getElementById('forCode');
const forFcNEl    = document.getElementById('forFcN');

let forStep = -1;
let forN    = 5;

function renderFor() {
  forVisualEl.innerHTML = '';
  for (let i = 0; i < forN; i++) {
    let cellClass = 'for-cell ';
    if      (forStep < 0)   cellClass += 'pending';
    else if (i < forStep)   cellClass += 'done';
    else if (i === forStep) cellClass += 'active';
    else                    cellClass += 'pending';

    const box = document.createElement('div');
    box.className = 'for-box';
    box.innerHTML = `<div class="for-index">i = ${i}</div><div class="${cellClass}">${i}</div>`;
    forVisualEl.appendChild(box);
  }

  const range = Array.from({ length: forN }, (_, i) => i).join(', ');
  let code = `for i in range(${forN}):\n    print(i)\n# 出力: ${range}`;
  if (forStep >= 0 && forStep < forN) code += `\n\n# 現在: i = ${forStep}`;
  else if (forStep >= forN)           code += `\n\n# ループ完了（${forN} 回）`;
  forCodeEl.textContent = code;
}

function resetFor() {
  forN = Math.max(1, Math.min(8, parseInt(forNInput.value) || 5));
  forStep = -1;
  forFcNEl.textContent     = forN;
  forStepBtn.disabled      = false;
  forStepBtn.textContent   = '▶ 次へ';
  forHintEl.textContent    = '▶ ボタンを押してステップを確認しよう';
  renderFor();
}

forStepBtn.addEventListener('click', () => {
  forStep++;
  if (forStep >= forN) {
    forStepBtn.disabled    = true;
    forStepBtn.textContent = '完了';
    forHintEl.textContent  = `ループが終わりました（合計 ${forN} 回繰り返した）`;
  } else {
    forHintEl.textContent = `i = ${forStep} の処理を実行中 … (${forStep + 1} / ${forN})`;
  }
  renderFor();
});

forResetBtn.addEventListener('click', resetFor);
forNInput.addEventListener('input', resetFor);
resetFor();


/* ============================================================
   while デモ
============================================================ */
const whileLimitInput = document.getElementById('whileLimitInput');
const whileStepBtn    = document.getElementById('whileStepBtn');
const whileResetBtn   = document.getElementById('whileResetBtn');
const whileCountValEl = document.getElementById('whileCountVal');
const whileVarBox     = document.getElementById('whileVarBox');
const whileCondStepEl = document.getElementById('whileCondStep');
const whileBodyStepEl = document.getElementById('whileBodyStep');
const whileCondTextEl = document.getElementById('whileCondText');
const whileCondResEl  = document.getElementById('whileCondResult');
const whileCodeEl     = document.getElementById('whileCode');
const whileFcLimitEl  = document.getElementById('whileFcLimit');

let whileCount = 0;
let whileLimit = 5;
let whilePhase = 'cond'; // 'cond' | 'body' | 'done'

function resetWhile() {
  whileLimit = Math.max(1, Math.min(10, parseInt(whileLimitInput.value) || 5));
  whileCount = 0;
  whilePhase = 'cond';

  whileFcLimitEl.textContent  = whileLimit;
  whileCountValEl.textContent = 0;
  whileCondTextEl.innerHTML   = `count &lt; ${whileLimit}`;
  whileCondResEl.textContent  = '—';
  whileCondResEl.className    = 'flow-result';

  whileCondStepEl.classList.remove('active', 'done');
  whileBodyStepEl.classList.remove('active', 'done');

  whileStepBtn.disabled    = false;
  whileStepBtn.textContent = '▶ 次のステップ';

  whileCodeEl.textContent =
`count = 0
while count < ${whileLimit}:
    count += 1
print(count)  # → ${whileLimit}`;
}

whileStepBtn.addEventListener('click', () => {
  if (whilePhase === 'cond') {
    const passes = whileCount < whileLimit;
    whileCondStepEl.classList.add('active');
    whileBodyStepEl.classList.remove('active', 'done');
    whileCondResEl.textContent = passes ? '→ True：ループ続行' : '→ False：ループ終了';
    whileCondResEl.className   = 'flow-result ' + (passes ? 'is-true' : 'is-false');

    if (passes) {
      whilePhase = 'body';
    } else {
      whileCondStepEl.classList.replace('active', 'done');
      whilePhase = 'done';
      whileStepBtn.disabled    = true;
      whileStepBtn.textContent = '完了';
    }

  } else if (whilePhase === 'body') {
    whileCondStepEl.classList.replace('active', 'done');
    whileBodyStepEl.classList.add('active');

    whileCount++;
    whileCountValEl.textContent = whileCount;
    whileVarBox.classList.remove('pop');
    void whileVarBox.offsetWidth;
    whileVarBox.classList.add('pop');

    whilePhase = 'cond';
    setTimeout(() => {
      whileBodyStepEl.classList.replace('active', 'done');
      whileCondStepEl.classList.remove('done');
    }, 500);
  }
});

whileResetBtn.addEventListener('click', resetWhile);
whileLimitInput.addEventListener('input', resetWhile);
resetWhile();


/* ============================================================
   二重ループ（i と j）デモ
============================================================ */
const dforRowsInput   = document.getElementById('dforRowsInput');
const dforColsInput   = document.getElementById('dforColsInput');
const dforStepBtn     = document.getElementById('dforStepBtn');
const dforAutoBtn     = document.getElementById('dforAutoBtn');
const dforResetBtn    = document.getElementById('dforResetBtn');
const dforIValEl      = document.getElementById('dforIVal');
const dforJValEl      = document.getElementById('dforJVal');
const dforCoordValEl  = document.getElementById('dforCoordVal');
const dforGridEl      = document.getElementById('dforGrid');
const dforConsoleBody = document.getElementById('dforConsoleBody');
const dforHintEl      = document.getElementById('dforHint');
const dforCodeEl      = document.getElementById('dforCode');

let dforRows = 3;
let dforCols = 3;
let dforStep = -1;
let dforAutoTimer = null;

function updateDforCode(activeI = null, activeJ = null) {
  let code = `for i in range(${dforRows}):\n    for j in range(${dforCols}):\n        print(f"({i}, {j})")`;
  if (activeI !== null && activeJ !== null) {
    code += `\n\n# 実行中: i = ${activeI} (行), j = ${activeJ} (列)`;
  } else if (dforStep >= dforRows * dforCols - 1) {
    code += `\n\n# ループ終了（合計 ${dforRows * dforCols} 回実行）`;
  }
  dforCodeEl.textContent = code;
}

function renderDforGrid() {
  dforGridEl.innerHTML = '';
  dforGridEl.style.gridTemplateColumns = `repeat(${dforCols}, 1fr)`;

  for (let r = 0; r < dforRows; r++) {
    for (let c = 0; c < dforCols; c++) {
      const idx = r * dforCols + c;
      const cell = document.createElement('div');
      cell.className = 'dfor-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.dataset.idx = idx;

      if (dforStep < 0) {
        // 初期状態
      } else if (idx < dforStep) {
        cell.classList.add('done');
      } else if (idx === dforStep) {
        cell.classList.add('active');
      }

      cell.innerHTML = `
        <span class="dfor-cell-val">(${r}, ${c})</span>
        <span class="dfor-cell-coord">i=${r}, j=${c}</span>
      `;
      dforGridEl.appendChild(cell);
    }
  }
}

function stopDforAuto() {
  if (dforAutoTimer) {
    clearInterval(dforAutoTimer);
    dforAutoTimer = null;
    dforAutoBtn.textContent = '▶ 自動再生';
  }
}

function resetDfor() {
  stopDforAuto();
  dforRows = Math.max(2, Math.min(4, parseInt(dforRowsInput.value) || 3));
  dforCols = Math.max(2, Math.min(4, parseInt(dforColsInput.value) || 3));
  dforStep = -1;

  dforIValEl.textContent     = '-';
  dforJValEl.textContent     = '-';
  dforCoordValEl.textContent = '—';

  dforStepBtn.disabled    = false;
  dforStepBtn.textContent = '▶ 次へ';
  dforAutoBtn.disabled    = false;
  dforAutoBtn.textContent = '▶ 自動再生';
  dforHintEl.textContent  = '▶ ボタンを押してステップを確認しよう';

  dforConsoleBody.innerHTML = '<div class="console-line-hint">「▶ 次へ」を押してステップを確認しよう</div>';
  renderDforGrid();
  updateDforCode();
}

function advanceDforStep() {
  const total = dforRows * dforCols;
  dforStep++;

  if (dforStep >= total) {
    stopDforAuto();
    dforStepBtn.disabled    = true;
    dforStepBtn.textContent = '完了';
    dforAutoBtn.disabled    = true;
    dforHintEl.textContent  = `すべてのマス（${dforRows} × ${dforCols} = ${total} 回）の処理が完了しました！`;
    updateDforCode();
    return;
  }

  const r = Math.floor(dforStep / dforCols);
  const c = dforStep % dforCols;

  dforIValEl.textContent     = r;
  dforJValEl.textContent     = c;
  dforCoordValEl.textContent = `(${r}, ${c})`;

  // グリッド更新
  const cells = dforGridEl.querySelectorAll('.dfor-cell');
  cells.forEach(cell => {
    const idx = parseInt(cell.dataset.idx);
    cell.classList.remove('active', 'done');
    if (idx < dforStep) cell.classList.add('done');
    if (idx === dforStep) cell.classList.add('active');
  });

  // コンソール更新
  if (dforStep === 0) {
    dforConsoleBody.innerHTML = '';
  }
  if (c === 0) {
    const divLine = document.createElement('div');
    divLine.className = 'console-line-divider';
    divLine.textContent = `--- [外側ループ i = ${r} 開始] ---`;
    dforConsoleBody.appendChild(divLine);
  }

  const outLine = document.createElement('div');
  outLine.className = 'console-line highlight';
  outLine.textContent = `i=${r}, j=${c}  => 出力: (${r}, ${c})`;
  dforConsoleBody.appendChild(outLine);
  dforConsoleBody.scrollTop = dforConsoleBody.scrollHeight;

  dforHintEl.textContent = `i = ${r} (行), j = ${c} (列) の処理を実行中 (${dforStep + 1} / ${total})`;
  updateDforCode(r, c);

  if (dforStep === total - 1) {
    dforStepBtn.disabled    = true;
    dforStepBtn.textContent = '完了';
    dforAutoBtn.disabled    = true;
    stopDforAuto();
  }
}

dforStepBtn.addEventListener('click', advanceDforStep);

dforAutoBtn.addEventListener('click', () => {
  if (dforAutoTimer) {
    stopDforAuto();
  } else {
    if (dforStep >= dforRows * dforCols - 1) {
      resetDfor();
    }
    dforAutoBtn.textContent = '⏸ 一時停止';
    advanceDforStep();
    dforAutoTimer = setInterval(() => {
      advanceDforStep();
    }, 600);
  }
});

dforResetBtn.addEventListener('click', resetDfor);
dforRowsInput.addEventListener('input', resetDfor);
dforColsInput.addEventListener('input', resetDfor);
resetDfor();


/* ============================================================
   二重ループ図解アニメーション（i と j の切り替え）
============================================================ */
const animToggleBtn  = document.getElementById('animToggleBtn');
const stageOuterBox  = document.getElementById('stageOuterBox');
const stageIVal      = document.getElementById('stageIVal');
const stageInnerBox  = document.getElementById('stageInnerBox');
const stageJVal      = document.getElementById('stageJVal');
const stageActionBox = document.getElementById('stageActionBox');
const stageOutputVal = document.getElementById('stageOutputVal');

const histItems = [
  document.getElementById('histItem0'),
  document.getElementById('histItem1'),
  document.getElementById('histItem2'),
  document.getElementById('histItem3'),
  document.getElementById('histItem4'),
  document.getElementById('histItem5'),
];

let stageAnimStep = 0;
let stageAnimTimer = null;
let isStageAnimPlaying = true;

const stepsData = [
  { i: 0, j: 0, out: "(0, 0)", isNewOuter: true },
  { i: 0, j: 1, out: "(0, 1)", isNewOuter: false },
  { i: 0, j: 2, out: "(0, 2)", isNewOuter: false },
  { i: 1, j: 0, out: "(1, 0)", isNewOuter: true },
  { i: 1, j: 1, out: "(1, 1)", isNewOuter: false },
  { i: 1, j: 2, out: "(1, 2)", isNewOuter: false },
];

function updateStageAnimation() {
  if (!stageOuterBox || !stageInnerBox) return;

  if (stageAnimStep < stepsData.length) {
    const data = stepsData[stageAnimStep];

    // 外側 i の更新
    if (stageIVal) {
      stageIVal.textContent = `i = ${data.i}`;
      if (data.isNewOuter) {
        stageIVal.classList.remove('pop');
        void stageIVal.offsetWidth;
        stageIVal.classList.add('pop');
      }
    }

    if (data.isNewOuter) {
      stageOuterBox.classList.remove('pulse');
      void stageOuterBox.offsetWidth;
      stageOuterBox.classList.add('pulse');
    }

    // 内側 j の更新
    if (stageJVal) {
      stageJVal.textContent = `j = ${data.j}`;
      stageJVal.classList.remove('pop');
      void stageJVal.offsetWidth;
      stageJVal.classList.add('pop');
    }

    stageInnerBox.classList.remove('pulse');
    void stageInnerBox.offsetWidth;
    stageInnerBox.classList.add('pulse');

    // 実行処理 & 出力の更新
    if (stageOutputVal) {
      stageOutputVal.textContent = data.out;
      stageOutputVal.classList.remove('pop');
      void stageOutputVal.offsetWidth;
      stageOutputVal.classList.add('pop');
    }
    if (stageActionBox) {
      stageActionBox.classList.remove('pulse');
      void stageActionBox.offsetWidth;
      stageActionBox.classList.add('pulse');
    }

    // 履歴スロット
    histItems.forEach((item, idx) => {
      if (!item) return;
      item.classList.remove('active', 'filled');
      if (idx < stageAnimStep) {
        item.classList.add('filled');
      } else if (idx === stageAnimStep) {
        item.classList.add('active');
      }
    });

  } else {
    // 完了ステップ（全点灯のあと次で 0 に戻る）
    histItems.forEach(item => {
      if (!item) return;
      item.classList.remove('active');
      item.classList.add('filled');
    });
  }
}

function nextStageStep() {
  stageAnimStep = (stageAnimStep + 1) % (stepsData.length + 1);
  updateStageAnimation();
}

function startStageAnimation() {
  if (stageAnimTimer) clearInterval(stageAnimTimer);
  stageAnimTimer = setInterval(nextStageStep, 1100);
  isStageAnimPlaying = true;
  if (animToggleBtn) animToggleBtn.textContent = "⏸ 一時停止";
}

function stopStageAnimation() {
  if (stageAnimTimer) {
    clearInterval(stageAnimTimer);
    stageAnimTimer = null;
  }
  isStageAnimPlaying = false;
  if (animToggleBtn) animToggleBtn.textContent = "▶ 再生";
}

if (animToggleBtn) {
  animToggleBtn.addEventListener('click', () => {
    if (isStageAnimPlaying) {
      stopStageAnimation();
    } else {
      startStageAnimation();
    }
  });
}

// 初期実行
updateStageAnimation();
startStageAnimation();
