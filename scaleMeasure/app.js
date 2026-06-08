const uploadArea   = document.getElementById('upload-area');
const fileInput    = document.getElementById('file-input');
const toolArea     = document.getElementById('tool-area');
const btnCalibrate = document.getElementById('btn-calibrate');
const btnMeasure   = document.getElementById('btn-measure');
const btnArea      = document.getElementById('btn-area');
const btnUndo      = document.getElementById('btn-undo');
const btnClear     = document.getElementById('btn-clear');
const btnChange    = document.getElementById('btn-change');
const statusBar    = document.getElementById('status-bar');
const calibDiv     = document.getElementById('calib-input');
const realLenInput = document.getElementById('real-length');
const btnSetScale  = document.getElementById('btn-set-scale');
const unitSelect   = document.getElementById('unit-select');
const scaleInfo    = document.getElementById('scale-info');
const imgEl        = document.getElementById('img-preview');
const canvas       = document.getElementById('canvas');
const ctx          = canvas.getContext('2d');
const measPanel    = document.getElementById('measurements-panel');
const measList     = document.getElementById('measurements-list');
const areaUnitEl   = document.getElementById('area-unit');

// ── State ─────────────────────────────────────────────────────────────────────
let mode = 'calibrate';   // 'calibrate' | 'measure' | 'area'
let calibScale = null;    // meters per canvas-pixel
let calibPts = null;      // {p1, p2} for calibration line
let pending = null;       // first-click point (calibrate / measure modes)
let hover = null;         // current mouse position for preview
let areaPts = [];         // polygon vertices being drawn (area mode)
let measures = [];        // completed measurements

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];
const CLOSE_DIST = 15;    // px — click within this of first vertex to close polygon

// ── Image loading ─────────────────────────────────────────────────────────────
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadFile(file);
});
fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); });

function loadFile(file) {
  const url = URL.createObjectURL(file);
  imgEl.onload = () => {
    uploadArea.hidden = true;
    toolArea.hidden = false;
    requestAnimationFrame(() => { fitCanvas(); resetAll(); updateStatus(); });
  };
  imgEl.src = url;
}

function fitCanvas() {
  const w = imgEl.offsetWidth, h = imgEl.offsetHeight;
  if (!w || !h) return;
  canvas.width = w; canvas.height = h;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
btnCalibrate.addEventListener('click', () => enterMode('calibrate'));
btnMeasure.addEventListener('click', () => {
  if (!calibScale) { alert('先にキャリブレーションを完了してください。'); return; }
  enterMode('measure');
});
btnArea.addEventListener('click', () => {
  if (!calibScale) { alert('先にキャリブレーションを完了してください。'); return; }
  enterMode('area');
});
btnUndo.addEventListener('click', undo);

btnClear.addEventListener('click', () => {
  measures = []; pending = null; hover = null; areaPts = [];
  renderMeasList(); redraw(); updateStatus();
});
btnChange.addEventListener('click', () => {
  uploadArea.hidden = false; toolArea.hidden = true;
  fileInput.value = ''; imgEl.src = ''; resetAll();
});

function enterMode(m) {
  mode = m;
  pending = null; hover = null; areaPts = [];
  btnCalibrate.classList.toggle('btn-active', m === 'calibrate');
  btnMeasure.classList.toggle('btn-active', m === 'measure');
  btnArea.classList.toggle('btn-active', m === 'area');
  calibDiv.hidden = true;
  redraw(); updateStatus();
}

function resetAll() {
  calibScale = null; calibPts = null;
  pending = null; hover = null; areaPts = []; measures = [];
  mode = 'calibrate';
  btnCalibrate.classList.add('btn-active');
  btnMeasure.classList.remove('btn-active');
  btnArea.classList.remove('btn-active');
  btnMeasure.disabled = true; btnArea.disabled = true;
  calibDiv.hidden = true; scaleInfo.hidden = true;
  measPanel.hidden = true; measList.innerHTML = '';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateUndoBtn();
}

function updateStatus() {
  if (mode === 'calibrate') {
    statusBar.textContent = pending
      ? 'キャリブレーション: 2点目をクリック'
      : 'キャリブレーション: 既知の長さの端点を1点目クリック';
  } else if (mode === 'measure') {
    statusBar.textContent = pending
      ? '線計測: 終点をクリック（Shift で水平/垂直、Esc でキャンセル）'
      : `線計測: 始点をクリック（1px ≈ ${fmt(calibScale)}）`;
  } else {
    statusBar.textContent = areaPts.length === 0
      ? '面積計測: 最初の頂点をクリック'
      : `面積計測: 頂点 ${areaPts.length} 個追加済み（最初の点をクリックか Enter で閉じる、Esc でキャンセル）`;
  }
  updateUndoBtn();
}

// ── Canvas interaction ────────────────────────────────────────────────────────
canvas.addEventListener('click', e => {
  const raw = coords(e);

  if (mode === 'calibrate') {
    if (!pending) { pending = raw; }
    else {
      calibPts = { p1: pending, p2: raw };
      pending = null; hover = null;
      calibDiv.hidden = false;
      realLenInput.value = ''; realLenInput.focus();
    }

  } else if (mode === 'measure') {
    const pt = (e.shiftKey && pending) ? snapAxis(pending, raw) : raw;
    if (!pending) { pending = pt; }
    else {
      const color = COLORS[measures.length % COLORS.length];
      measures.push({ type: 'line', p1: pending, p2: pt, dist: pixDist(pending, pt) * calibScale, color });
      pending = null; hover = null;
      renderMeasList();
    }

  } else if (mode === 'area') {
    const ref = areaPts.length > 0 ? areaPts[areaPts.length - 1] : null;
    const pt = (e.shiftKey && ref) ? snapAxis(ref, raw) : raw;
    if (areaPts.length >= 3 && pixDist(pt, areaPts[0]) < CLOSE_DIST) {
      closePoly(); return;
    }
    areaPts.push(pt);
  }

  redraw(); updateStatus();
});

canvas.addEventListener('mousemove', e => {
  const raw = coords(e);
  if (mode === 'measure' && pending) {
    hover = e.shiftKey ? snapAxis(pending, raw) : raw;
    redraw();
  } else if (mode === 'area' && areaPts.length > 0) {
    const ref = areaPts[areaPts.length - 1];
    hover = e.shiftKey ? snapAxis(ref, raw) : raw;
    redraw();
  } else {
    hover = null;
  }
});

canvas.addEventListener('mouseleave', () => {
  hover = null;
  if (pending || areaPts.length > 0) redraw();
});

document.addEventListener('keydown', e => {
  if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault(); undo(); return;
  }
  if (e.key === 'Escape') {
    if (pending) { pending = null; hover = null; redraw(); updateStatus(); }
    if (areaPts.length > 0) { areaPts = []; hover = null; redraw(); updateStatus(); }
  }
  if (e.key === 'Enter' && mode === 'area' && areaPts.length >= 3) {
    closePoly();
  }
});

function closePoly() {
  const color = COLORS[measures.length % COLORS.length];
  measures.push({
    type: 'area',
    pts: [...areaPts],
    perimeter: polygonPerimPx(areaPts) * calibScale,
    area: polygonAreaPx(areaPts) * calibScale * calibScale,
    color,
  });
  areaPts = []; hover = null;
  renderMeasList(); redraw(); updateStatus();
}

function undo() {
  if (areaPts.length > 0) {
    areaPts.pop();
    hover = null;
  } else if (pending) {
    pending = null;
    hover = null;
  } else if (measures.length > 0) {
    measures.pop();
    renderMeasList();
  } else {
    return;
  }
  redraw(); updateStatus();
}

function updateUndoBtn() {
  btnUndo.disabled = !areaPts.length && !pending && !measures.length;
}

function coords(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top)  * (canvas.height / r.height),
  };
}

function pixDist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

function snapAxis(from, to) {
  return Math.abs(to.x - from.x) >= Math.abs(to.y - from.y)
    ? { x: to.x, y: from.y }
    : { x: from.x, y: to.y };
}

// ── Scale input ───────────────────────────────────────────────────────────────
areaUnitEl.addEventListener('change', () => { renderMeasList(); redraw(); });

btnSetScale.addEventListener('click', applyScale);
realLenInput.addEventListener('keydown', e => { if (e.key === 'Enter') applyScale(); });

function applyScale() {
  if (!calibPts) return;
  const val = parseFloat(realLenInput.value);
  if (isNaN(val) || val <= 0) { alert('有効な数値を入力してください。'); realLenInput.focus(); return; }
  const unit = unitSelect.value;
  const meters = unit === 'mm' ? val / 1000 : unit === 'cm' ? val / 100 : val;
  const px = pixDist(calibPts.p1, calibPts.p2);
  if (px < 5) { alert('2点が近すぎます。もう少し離れた点を選んでください。'); return; }
  calibScale = meters / px;
  calibDiv.hidden = true;
  btnMeasure.disabled = false; btnArea.disabled = false;
  scaleInfo.innerHTML = `<span class="scale-info-dot"></span>スケール設定済み: ${val} ${unit} = ${Math.round(px)} px（1px ≈ ${fmt(calibScale)}）`;
  scaleInfo.hidden = false;
  enterMode('measure');
}

// ── Drawing ───────────────────────────────────────────────────────────────────
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calibration line
  if (calibPts) drawSegment(calibPts.p1, calibPts.p2, '#f59e0b', 'キャリブ', 1.5);

  // Completed measures
  measures.forEach((m, i) => {
    if (m.type === 'line') {
      drawSegment(m.p1, m.p2, m.color, fmt(m.dist), 2);
    } else {
      drawPolygon(m);
    }
  });

  // In-progress: calibrate / line mode
  if (pending) {
    dot(pending, mode === 'calibrate' ? '#f59e0b' : '#ef4444');
    if (hover) {
      const c = mode === 'calibrate' ? '#f59e0b' : '#2563eb';
      dashedLine(pending, hover, c);
      if (mode === 'measure') label(mid(pending, hover), fmt(pixDist(pending, hover) * calibScale), c);
    }
  }

  // In-progress: area mode
  if (areaPts.length > 0) {
    for (let i = 0; i + 1 < areaPts.length; i++) solidLine(areaPts[i], areaPts[i + 1], '#10b981', 2);
    if (hover) {
      dashedLine(areaPts[areaPts.length - 1], hover, '#10b981');
      // Closing indicator
      if (areaPts.length >= 3 && pixDist(hover, areaPts[0]) < CLOSE_DIST) {
        ctx.save();
        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.5; ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(areaPts[0].x, areaPts[0].y, 11, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        const previewArea = polygonAreaPx([...areaPts, hover]) * calibScale * calibScale;
        label({ x: hover.x, y: hover.y - 22 }, `閉じる  ${fmtArea(previewArea)}`, '#10b981');
      }
    }
    areaPts.forEach((p, i) => dot(p, i === 0 ? '#10b981' : '#059669'));
  }
}

function drawSegment(p1, p2, color, text, lw) {
  solidLine(p1, p2, color, lw);
  dot(p1, color); dot(p2, color);
  label(mid(p1, p2), text, color);
}

function drawPolygon(m) {
  const { pts, color, area } = m;
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.globalAlpha = 0.18; ctx.fillStyle = color; ctx.fill();
  ctx.globalAlpha = 1; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  pts.forEach(p => dot(p, color));
  // Edge length labels
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    label(mid(pts[i], pts[j]), fmt(pixDist(pts[i], pts[j]) * calibScale), color);
  }
  // Area at centroid
  label(centroid(pts), fmtArea(area), color);
}

function solidLine(p1, p2, color, lw) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  ctx.restore();
}

function dashedLine(p1, p2, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  ctx.restore();
}

function dot(p, color) {
  ctx.save();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';  ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function label(p, text, color) {
  ctx.save();
  ctx.font = 'bold 12px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 10, h = 18;
  const lx = clamp(p.x - w / 2, 2, canvas.width - w - 2);
  const ly = clamp(p.y - h - 4, 2, canvas.height - h - 2);
  ctx.fillStyle = color; rRect(lx, ly, w, h, 4); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, lx + w / 2, ly + h / 2);
  ctx.restore();
}

function areaLabel(p, line1, line2, color) {
  ctx.save();
  ctx.font = 'bold 13px system-ui, sans-serif';
  const w1 = ctx.measureText(line1).width;
  ctx.font = '11px system-ui, sans-serif';
  const w2 = ctx.measureText(line2).width;
  const w = Math.max(w1, w2) + 14, h = 36;
  const lx = clamp(p.x - w / 2, 2, canvas.width - w - 2);
  const ly = clamp(p.y - h / 2, 2, canvas.height - h - 2);
  const tx = lx + w / 2;
  ctx.globalAlpha = 0.88; ctx.fillStyle = color; rRect(lx, ly, w, h, 5); ctx.fill();
  ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px system-ui, sans-serif'; ctx.fillText(line1, tx, ly + 11);
  ctx.font = '11px system-ui, sans-serif'; ctx.fillText(line2, tx, ly + 26);
  ctx.restore();
}

function rRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Geometry ──────────────────────────────────────────────────────────────────
function polygonAreaPx(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(a) / 2;
}

function polygonPerimPx(pts) {
  let p = 0;
  for (let i = 0; i < pts.length; i++) p += pixDist(pts[i], pts[(i + 1) % pts.length]);
  return p;
}

function centroid(pts) {
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  };
}

function fmt(m) {
  if (m >= 10)   return m.toFixed(1) + ' m';
  if (m >= 1)    return m.toFixed(2) + ' m';
  if (m >= 0.01) return (m * 100).toFixed(1) + ' cm';
  return (m * 1000).toFixed(0) + ' mm';
}

function fmtArea(m2) {
  if (areaUnitEl.value === 'jo') return (m2 / 1.62).toFixed(2) + ' 帖';
  if (m2 >= 1) return m2.toFixed(2) + ' m²';
  return (m2 * 10000).toFixed(1) + ' cm²';
}

// ── Measurements list ─────────────────────────────────────────────────────────
function renderMeasList() {
  if (!measures.length) { measPanel.hidden = true; return; }
  measPanel.hidden = false;
  measList.innerHTML = measures.map((m, i) => {
    const main = m.type === 'line' ? fmt(m.dist) : fmtArea(m.area);
    const sub = m.type === 'line'
      ? `(${Math.round(m.p1.x)}, ${Math.round(m.p1.y)}) → (${Math.round(m.p2.x)}, ${Math.round(m.p2.y)})`
      : `${m.pts.length} 辺`;
    return `<li class="meas-item">
      <span class="meas-swatch" style="background:${m.color}"></span>
      <span class="meas-dist">${main}</span>
      <span class="meas-coords">${sub}</span>
      <button class="btn-delete" data-i="${i}">削除</button>
    </li>`;
  }).join('');

  measList.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      measures.splice(+btn.dataset.i, 1);
      renderMeasList(); redraw(); updateUndoBtn();
    });
  });
}
