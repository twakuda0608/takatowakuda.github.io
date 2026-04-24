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
