// ── Gear drawing constants ──
const M = 6; // module: pixels per tooth unit
const C_DRV = '#f97316'; // driver orange
const C_FOL = '#3b82f6'; // follower blue
const C_IDL = '#a855f7'; // idler purple
const C_INK = '#1e293b';

function pitchR(T) { return T * M / 2; }
function outerR(T) { return pitchR(T) + M; }

function drawGear(ctx, cx, cy, T, angle, fill) {
  const pr = pitchR(T);
  const or = outerR(T);
  const hub = Math.max(6, pr * 0.22);
  const ta = (Math.PI * 2) / T;
  const tw = ta * 0.38;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.beginPath();
  for (let i = 0; i < T; i++) {
    const a = i * ta;
    ctx.lineTo(pr * Math.cos(a - tw),        pr * Math.sin(a - tw));
    ctx.lineTo(or * Math.cos(a - tw * 0.55), or * Math.sin(a - tw * 0.55));
    ctx.lineTo(or * Math.cos(a + tw * 0.55), or * Math.sin(a + tw * 0.55));
    ctx.lineTo(pr * Math.cos(a + tw),        pr * Math.sin(a + tw));
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = C_INK;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Spokes
  const ns = T <= 10 ? 3 : T <= 18 ? 4 : 5;
  ctx.lineWidth = Math.max(2, pr * 0.07);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < ns; i++) {
    const a = (i / ns) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(hub * 1.5 * Math.cos(a), hub * 1.5 * Math.sin(a));
    ctx.lineTo(pr * 0.75 * Math.cos(a), pr * 0.75 * Math.sin(a));
    ctx.stroke();
  }

  // Hub
  ctx.beginPath();
  ctx.arc(0, 0, hub, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = C_INK;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Center pin
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = C_INK;
  ctx.fill();

  ctx.restore();
}

function gearLabel(ctx, x, y, text, color) {
  ctx.save();
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Curved rotation arrow around a gear
function rotArrow(ctx, cx, cy, r, clockwise, color) {
  const s = -Math.PI * 0.75, e = Math.PI * 0.75;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  if (clockwise) ctx.arc(cx, cy, r, s, e);
  else            ctx.arc(cx, cy, r, e, s, true);
  ctx.stroke();

  // Arrowhead
  const tipA  = clockwise ? e : s;
  const tx = cx + r * Math.cos(tipA);
  const ty = cy + r * Math.sin(tipA);
  const tang = clockwise ? tipA + Math.PI / 2 : tipA - Math.PI / 2;
  const al = 8;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx + al * Math.cos(tang + Math.PI - 0.4), ty + al * Math.sin(tang + Math.PI - 0.4));
  ctx.lineTo(tx + al * Math.cos(tang + Math.PI + 0.4), ty + al * Math.sin(tang + Math.PI + 0.4));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.restore();
}

// ════════════════════════════════════════
// SECTION 1 — Basic: two equal gears
// ════════════════════════════════════════
const c1    = document.getElementById('c1');
const ctx1  = c1.getContext('2d');
const W1 = 560, H1 = 200, T1 = 12;
let s1 = { running: false, angle: 0, raf: null };

function drawBasic() {
  ctx1.clearRect(0, 0, W1, H1);
  const r = pitchR(T1);  // 36
  const cx1a = W1 / 2 - r, cx1b = W1 / 2 + r, cy1 = H1 / 2 - 10;
  drawGear(ctx1, cx1a, cy1, T1, s1.angle, C_DRV);
  drawGear(ctx1, cx1b, cy1, T1, -s1.angle, C_FOL);
  rotArrow(ctx1, cx1a, cy1, r + 14, true, C_DRV);
  rotArrow(ctx1, cx1b, cy1, r + 14, false, C_FOL);
  gearLabel(ctx1, cx1a, cy1 + outerR(T1) + 18, 'ドライバー', C_DRV);
  gearLabel(ctx1, cx1b, cy1 + outerR(T1) + 18, 'フォロワー', C_FOL);
}

function loopBasic() {
  s1.angle += 0.025;
  drawBasic();
  s1.raf = requestAnimationFrame(loopBasic);
}

const btnBasic = document.getElementById('btn-basic');
btnBasic.addEventListener('click', () => {
  s1.running = !s1.running;
  if (s1.running) {
    btnBasic.textContent = '⏸ ストップ';
    loopBasic();
  } else {
    btnBasic.textContent = '▶ スタート';
    cancelAnimationFrame(s1.raf);
  }
});

drawBasic(); // initial static frame

// ════════════════════════════════════════
// SECTION 2 — Variable teeth + sliders
// ════════════════════════════════════════
const c2   = document.getElementById('c2');
const ctx2 = c2.getContext('2d');
const W2 = 560, H2 = 260;
let s2 = { Td: 12, Tf: 24, angle: 0, raf: null };

function drawTeeth() {
  ctx2.clearRect(0, 0, W2, H2);
  const { Td, Tf, angle } = s2;
  const rd = pitchR(Td), rf = pitchR(Tf);
  const cy2 = H2 / 2 - 10;
  // Mesh point always at canvas center
  const cx_d = W2 / 2 - rd;
  const cx_f = W2 / 2 + rf;
  const a_d = angle;
  const a_f = -angle * (Td / Tf);

  drawGear(ctx2, cx_d, cy2, Td, a_d, C_DRV);
  drawGear(ctx2, cx_f, cy2, Tf, a_f, C_FOL);
  rotArrow(ctx2, cx_d, cy2, rd + 14, true, C_DRV);
  rotArrow(ctx2, cx_f, cy2, rf + 14, false, C_FOL);
  gearLabel(ctx2, cx_d, cy2 + outerR(Td) + 18, `ドライバー (${Td}歯)`, C_DRV);
  gearLabel(ctx2, cx_f, cy2 + outerR(Tf) + 18, `フォロワー (${Tf}歯)`, C_FOL);
}

function loopTeeth() {
  s2.angle += 0.025;
  drawTeeth();
  s2.raf = requestAnimationFrame(loopTeeth);
}

function updateTeethUI() {
  const Td = s2.Td, Tf = s2.Tf;
  const ratio = Tf / Td;
  document.getElementById('sv-drv').textContent = Td;
  document.getElementById('sv-fol').textContent = Tf;
  document.getElementById('rb-drv').textContent = Td;
  document.getElementById('rb-fol').textContent = Tf;
  document.getElementById('rb-val').textContent = ratio.toFixed(2);

  let note;
  if (ratio > 1.05)      note = `ギア比 ${ratio.toFixed(2)} → フォロワーはドライバーの <strong>1/${ratio.toFixed(1)} 倍</strong> のスピード（遅い・力が強い）`;
  else if (ratio < 0.95) note = `ギア比 ${ratio.toFixed(2)} → フォロワーはドライバーの <strong>${(1/ratio).toFixed(1)} 倍</strong> のスピード（速い・力が弱い）`;
  else                   note = 'ギア比 1.00 → ドライバーと<strong>同じスピード</strong>';
  document.getElementById('ratio-note').innerHTML = note;
}

document.getElementById('sl-drv').addEventListener('input', e => { s2.Td = +e.target.value; updateTeethUI(); });
document.getElementById('sl-fol').addEventListener('input', e => { s2.Tf = +e.target.value; updateTeethUI(); });
updateTeethUI();
loopTeeth();

// ════════════════════════════════════════
// SECTION 3 — Idler step demo
// ════════════════════════════════════════
const c3   = document.getElementById('c3');
const ctx3 = c3.getContext('2d');
const W3 = 560, H3 = 200, TG = 12;
let s3 = { step: 0, angle: 0, raf: null };

const NOTES = [
  'ドライバーが <strong style="color:#c2410c">時計回り</strong> に回っています。',
  'フォロワーを追加すると <strong style="color:#1d4ed8">反時計回り</strong> に！ドライバーと逆向きです。',
  'アイドラーを間に入れると、フォロワーは <strong style="color:#c2410c">時計回り</strong> に！<br>ギア比は変わらず、向きだけが戻ります。'
];

function drawIdler() {
  ctx3.clearRect(0, 0, W3, H3);
  const r = pitchR(TG); // 36
  const cy = H3 / 2 - 10;
  const step = s3.step;
  const a = s3.angle;

  if (step === 0) {
    // Driver alone, centered
    drawGear(ctx3, W3 / 2, cy, TG, a, C_DRV);
    rotArrow(ctx3, W3 / 2, cy, r + 14, true, C_DRV);
    gearLabel(ctx3, W3 / 2, cy + outerR(TG) + 18, 'ドライバー', C_DRV);

  } else if (step === 1) {
    // Driver + Follower directly meshing
    const cx_d = W3 / 2 - r, cx_f = W3 / 2 + r;
    drawGear(ctx3, cx_d, cy, TG, a, C_DRV);
    drawGear(ctx3, cx_f, cy, TG, -a, C_FOL);
    rotArrow(ctx3, cx_d, cy, r + 14, true, C_DRV);
    rotArrow(ctx3, cx_f, cy, r + 14, false, C_FOL);
    gearLabel(ctx3, cx_d, cy + outerR(TG) + 18, 'ドライバー', C_DRV);
    gearLabel(ctx3, cx_f, cy + outerR(TG) + 18, 'フォロワー', C_FOL);

  } else {
    // Driver + Idler + Follower
    const d = r * 2; // center-to-center distance = 72px
    const cx_d = W3 / 2 - d, cx_i = W3 / 2, cx_f = W3 / 2 + d;
    drawGear(ctx3, cx_d, cy, TG, a,  C_DRV);
    drawGear(ctx3, cx_i, cy, TG, -a, C_IDL);
    drawGear(ctx3, cx_f, cy, TG, a,  C_FOL);
    rotArrow(ctx3, cx_d, cy, r + 14, true,  C_DRV);
    rotArrow(ctx3, cx_i, cy, r + 14, false, C_IDL);
    rotArrow(ctx3, cx_f, cy, r + 14, true,  C_FOL);
    gearLabel(ctx3, cx_d, cy + outerR(TG) + 18, 'ドライバー', C_DRV);
    gearLabel(ctx3, cx_i, cy + outerR(TG) + 18, 'アイドラー', C_IDL);
    gearLabel(ctx3, cx_f, cy + outerR(TG) + 18, 'フォロワー', C_FOL);
  }
}

function loopIdler() {
  s3.angle += 0.025;
  drawIdler();
  s3.raf = requestAnimationFrame(loopIdler);
}

document.querySelectorAll('.stab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    s3.step = +btn.dataset.s;
    document.getElementById('idler-note').innerHTML = NOTES[s3.step];
  });
});

document.getElementById('idler-note').innerHTML = NOTES[0];
loopIdler();

// ════════════════════════════════════════
// SECTION 4 — Calculator
// ════════════════════════════════════════
const ciDrv   = document.getElementById('ci-drv');
const ciFol   = document.getElementById('ci-fol');
const calcRval = document.getElementById('calc-rval');
const sfDrv   = document.getElementById('sf-drv');
const sfFol   = document.getElementById('sf-fol');
const stDrv   = document.getElementById('st-drv');
const stFol   = document.getElementById('st-fol');
const calcNote = document.getElementById('calc-note');

function updateCalc() {
  const Td = Math.max(1, +ciDrv.value || 1);
  const Tf = Math.max(1, +ciFol.value || 1);
  const ratio = Tf / Td;

  calcRval.textContent = ratio.toFixed(2);

  // Speed bars: normalize so the faster gear = 100%
  const dPct = ratio >= 1 ? 100 : ratio * 100;
  const fPct = ratio <= 1 ? 100 : (1 / ratio) * 100;
  sfDrv.style.width = Math.max(4, dPct) + '%';
  sfFol.style.width = Math.max(4, fPct) + '%';
  stDrv.textContent = '1 回転/秒';
  stFol.textContent = (1 / ratio).toFixed(2) + ' 回転/秒';

  if (ratio > 1.01)      calcNote.innerHTML = `ギア比 <strong>${ratio.toFixed(2)}</strong> → フォロワーはドライバーの <strong>1/${ratio.toFixed(1)} 倍</strong> のスピード。歯数が多いぶん遅いが力（トルク）が強い。`;
  else if (ratio < 0.99) calcNote.innerHTML = `ギア比 <strong>${ratio.toFixed(2)}</strong> → フォロワーはドライバーの <strong>${(1/ratio).toFixed(1)} 倍</strong> のスピード。歯数が少ないぶん速いが力（トルク）は弱い。`;
  else                   calcNote.innerHTML = 'ギア比 <strong>1.00</strong> → 同じスピード、同じ力。';
}

ciDrv.addEventListener('input', updateCalc);
ciFol.addEventListener('input', updateCalc);
updateCalc();
