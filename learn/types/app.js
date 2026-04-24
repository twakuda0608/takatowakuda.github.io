/* ============================================================
   Helpers
============================================================ */
const MAX_BLOCKS = 20;

function renderBlocks(n, extraCls = '') {
  const num = Math.round(parseFloat(n));
  if (isNaN(num)) return '';
  if (num === 0) return `<div class="blocks-row"><span class="block-zero">0（ブロックなし）</span></div>`;
  const count   = Math.min(Math.abs(num), MAX_BLOCKS);
  const overflow = Math.abs(num) - count;
  const cls    = extraCls ? `count-block ${extraCls}` : 'count-block';
  const blocks = Array(count).fill(`<span class="${cls}"></span>`).join('');
  const more   = overflow > 0 ? `<span class="block-more">+${overflow}</span>` : '';
  return `<div class="blocks-row">${blocks}${more}</div>`;
}

function tile(ch, cls) {
  return `<span class="char-tile ${cls}">${ch === ' ' ? '·' : ch}</span>`;
}

function renderTiles(str, cls = 'a-tile') {
  if (!str || str.length === 0)
    return `<div class="char-tiles-row"><span class="empty-tile">（空）</span></div>`;
  const MAX    = 16;
  const chars  = [...str].slice(0, MAX);
  const more   = [...str].length > MAX ? `<span class="tile-more">+${[...str].length - MAX}</span>` : '';
  return `<div class="char-tiles-row">${chars.map(ch => tile(ch, cls)).join('')}${more}</div>`;
}


/* ============================================================
   Section 1 – int と str のちがい
============================================================ */
const typeInput   = document.getElementById('typeInput');
const typeCompare = document.getElementById('typeCompare');

function updateTypeCompare() {
  const raw    = typeInput.value;
  const isNum  = raw.trim() !== '' && !isNaN(raw) && !isNaN(parseFloat(raw));
  const intVal = isNum ? parseInt(raw, 10) : null;

  typeCompare.innerHTML = `
    <div class="compare-row">
      <div class="compare-panel int-panel${isNum ? '' : ' invalid'}">
        <span class="type-pill int-pill">int</span>
        <div class="compare-val">${isNum ? intVal : '⚠ ValueError'}</div>
        ${isNum
          ? renderBlocks(intVal)
          : `<div class="invalid-note">"${raw}" は整数に変換できない</div>`}
      </div>
      <div class="compare-panel str-panel">
        <span class="type-pill str-pill">str</span>
        <div class="compare-val">"${raw}"</div>
        ${renderTiles(raw, 'a-tile')}
      </div>
    </div>
    <p class="compare-note">
      ${isNum
        ? `<strong>${raw}</strong> は int にも str にもなれる。でも意味はまったくちがう。`
        : `<strong>"${raw}"</strong> は str としては使えるが、int には変換できない。`}
    </p>`;
}

typeInput.addEventListener('input', updateTypeCompare);
updateTypeCompare();


/* ============================================================
   Section 2 – + 演算子
============================================================ */
const valA        = document.getElementById('valA');
const valB        = document.getElementById('valB');
const typeAInt    = document.getElementById('typeAInt');
const typeAStr    = document.getElementById('typeAStr');
const typeBInt    = document.getElementById('typeBInt');
const typeBStr    = document.getElementById('typeBStr');
const plusDiagramEl = document.getElementById('plusDiagram');
const plusCode    = document.getElementById('plusCode');

let typeA = 'int', typeB = 'int';

function setTypeA(t) { typeA = t; typeAInt.classList.toggle('active', t==='int'); typeAStr.classList.toggle('active', t==='str'); updatePlus(); }
function setTypeB(t) { typeB = t; typeBInt.classList.toggle('active', t==='int'); typeBStr.classList.toggle('active', t==='str'); updatePlus(); }

typeAInt.addEventListener('click', () => setTypeA('int'));
typeAStr.addEventListener('click', () => setTypeA('str'));
typeBInt.addEventListener('click', () => setTypeB('int'));
typeBStr.addEventListener('click', () => setTypeB('str'));
valA.addEventListener('input', updatePlus);
valB.addEventListener('input', updatePlus);

function opBox(type, val) {
  const display = type === 'str' ? `"${val}"` : (val || '0');
  const vis     = type === 'int' ? renderBlocks(parseFloat(val) || 0) : renderTiles(val, 'a-tile');
  return `<div class="diag-box ${type}-box">
    <span class="type-pill ${type}-pill">${type}</span>
    <div class="diag-val">${display}</div>
    ${vis}
  </div>`;
}

function updatePlus() {
  const a = valA.value;
  const b = valB.value;

  if (typeA !== typeB) {
    plusDiagramEl.innerHTML = `
      <div class="diag-row">
        ${opBox(typeA, a)}
        <div class="diag-op-sign error-op">+</div>
        ${opBox(typeB, b)}
        <div class="diag-op-sign">=</div>
        <div class="diag-box err-box">
          <div class="err-cross">✕</div>
          <div class="err-title">TypeError</div>
          <div class="err-msg">int と str は<br>+ できない</div>
        </div>
      </div>
      <div class="diag-caption err-caption">型が違うと + はエラー！ int() か str() で型を合わせよう</div>`;
    plusCode.textContent =
      `# これはエラーになる！\n` +
      `${typeA === 'str' ? '"' + a + '"' : a} + ${typeB === 'str' ? '"' + b + '"' : b}\n` +
      `# TypeError: can only concatenate str (not "int") to str`;
    return;
  }

  if (typeA === 'int') {
    const n = parseFloat(a) || 0;
    const m = parseFloat(b) || 0;
    const r = n + m;
    plusDiagramEl.innerHTML = `
      <div class="diag-row">
        <div class="diag-box int-box">
          <span class="type-pill int-pill">int</span>
          <div class="diag-val">${a || '0'}</div>
          ${renderBlocks(n)}
        </div>
        <div class="diag-op-sign">+</div>
        <div class="diag-box int-box">
          <span class="type-pill int-pill">int</span>
          <div class="diag-val">${b || '0'}</div>
          ${renderBlocks(m)}
        </div>
        <div class="diag-op-sign">=</div>
        <div class="diag-box res-int">
          <span class="type-pill res-pill">int</span>
          <div class="diag-val">${r}</div>
          ${renderBlocks(r, 'res-block')}
        </div>
      </div>
      <div class="diag-caption">数値として<strong>足し算</strong>が行われる</div>`;
    plusCode.textContent = `${n} + ${m}  # → ${r}`;
  } else {
    const r      = a + b;
    const aTiles = [...a].slice(0, 16).map(ch => tile(ch, 'a-tile')).join('');
    const bTiles = [...b].slice(0, 16).map(ch => tile(ch, 'b-tile')).join('');
    const rArr   = [...r].slice(0, 16);
    const rMore  = [...r].length > 16 ? `<span class="tile-more">+${[...r].length - 16}</span>` : '';
    const rTiles = rArr.map((ch, i) => tile(ch, i < [...a].length ? 'a-tile' : 'b-tile')).join('') + rMore;
    plusDiagramEl.innerHTML = `
      <div class="diag-row">
        <div class="diag-box str-box">
          <span class="type-pill str-pill">str</span>
          <div class="diag-val">"${a}"</div>
          <div class="char-tiles-row">${aTiles || '<span class="empty-tile">（空）</span>'}</div>
        </div>
        <div class="diag-op-sign">+</div>
        <div class="diag-box str-box">
          <span class="type-pill str-pill">str</span>
          <div class="diag-val">"${b}"</div>
          <div class="char-tiles-row">${bTiles || '<span class="empty-tile">（空）</span>'}</div>
        </div>
        <div class="diag-op-sign">=</div>
        <div class="diag-box res-str">
          <span class="type-pill res-pill">str</span>
          <div class="diag-val">"${r}"</div>
          <div class="char-tiles-row">${rTiles || '<span class="empty-tile">（空）</span>'}</div>
        </div>
      </div>
      <div class="diag-caption">文字が順番に<strong>つながる（連結）</strong></div>`;
    plusCode.textContent = `"${a}" + "${b}"  # → "${r}"`;
  }
}

updatePlus();


/* ============================================================
   Section 3 – 型変換
============================================================ */
const convInput   = document.getElementById('convInput');
const convDiagram = document.getElementById('convDiagram');
const convCode    = document.getElementById('convCode');

function updateConv() {
  const n = parseInt(convInput.value, 10) || 0;
  const s = String(n);

  convDiagram.innerHTML = `
    <div class="conv-flows">
      <div class="conv-flow-row">
        <div class="diag-box int-box">
          <span class="type-pill int-pill">int</span>
          <div class="diag-val">${n}</div>
          ${renderBlocks(n)}
        </div>
        <div class="conv-arrow-col">
          <div class="conv-func">str()</div>
          <div class="conv-arrow">→</div>
        </div>
        <div class="diag-box str-box">
          <span class="type-pill str-pill">str</span>
          <div class="diag-val">"${s}"</div>
          ${renderTiles(s, 'a-tile')}
        </div>
      </div>
      <div class="conv-flow-row">
        <div class="diag-box str-box">
          <span class="type-pill str-pill">str</span>
          <div class="diag-val">"${s}"</div>
          ${renderTiles(s, 'a-tile')}
        </div>
        <div class="conv-arrow-col">
          <div class="conv-func">int()</div>
          <div class="conv-arrow">→</div>
        </div>
        <div class="diag-box int-box">
          <span class="type-pill int-pill">int</span>
          <div class="diag-val">${n}</div>
          ${renderBlocks(n)}
        </div>
      </div>
    </div>`;

  convCode.textContent =
    `n = ${n}\ns = "${s}"\n\nstr(${n})   # → "${s}"\nint("${s}") # → ${n}`;
}

convInput.addEventListener('input', updateConv);
updateConv();
