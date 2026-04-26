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
   Section 3: 引数ステップデモ
============================================================ */
const fsInput   = document.getElementById('fsInput');
const fsNextBtn = document.getElementById('fsNextBtn');
const fsCards   = [
  document.getElementById('fs0'),
  document.getElementById('fs1'),
  document.getElementById('fs2'),
  document.getElementById('fs3'),
];

let fsStep = -1;

function updateFsContent() {
  const x = parseInt(fsInput.value) || 5;
  const result = x * 2;
  document.getElementById('fscode0').innerHTML = `double(<mark>${x}</mark>)`;
  document.getElementById('fscode1').innerHTML = `x = <mark>${x}</mark>`;
  document.getElementById('fscode2').innerHTML = `<mark>${x}</mark> × 2`;
  document.getElementById('fscode3').innerHTML = `<mark>${result}</mark>`;
}

function fsReset() {
  fsStep = -1;
  fsCards.forEach(c => c.classList.remove('active'));
  fsNextBtn.disabled = false;
  updateFsContent();
}

fsNextBtn.addEventListener('click', () => {
  fsStep++;
  const card = fsCards[fsStep];
  card.classList.remove('active');
  void card.offsetWidth;
  card.classList.add('active');
  if (fsStep >= fsCards.length - 1) fsNextBtn.disabled = true;
});

document.getElementById('fsResetBtn').addEventListener('click', fsReset);

fsInput.addEventListener('input', () => {
  fsReset();
});

updateFsContent();


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
