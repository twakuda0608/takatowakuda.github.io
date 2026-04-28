/* ============================================================
   Helpers
============================================================ */
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t)  { return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t; }

function setFont(ctx, size, weight) {
  ctx.font = `${weight || 'normal'} ${size}px system-ui, "Hiragino Sans", sans-serif`;
}


/* ============================================================
   Section 1: 直径デモ
============================================================ */
const diaCanvas = document.getElementById('diaCanvas');
const dCtx      = diaCanvas.getContext('2d');
const DW = diaCanvas.width;
const DH = diaCanvas.height;
const DCX = DW / 2;
const DCY = DH / 2 + 10;

function drawDiaCanvas(R) {
  dCtx.clearRect(0, 0, DW, DH);

  // Circle fill
  dCtx.beginPath();
  dCtx.arc(DCX, DCY, R, 0, Math.PI * 2);
  dCtx.fillStyle = '#eff6ff';
  dCtx.fill();
  dCtx.strokeStyle = '#93c5fd';
  dCtx.lineWidth = 2.5;
  dCtx.stroke();

  // Center dot
  dCtx.beginPath();
  dCtx.arc(DCX, DCY, 4, 0, Math.PI * 2);
  dCtx.fillStyle = '#3b82f6';
  dCtx.fill();

  // Diameter line
  dCtx.beginPath();
  dCtx.moveTo(DCX - R, DCY);
  dCtx.lineTo(DCX + R, DCY);
  dCtx.strokeStyle = '#2563eb';
  dCtx.lineWidth = 3.5;
  dCtx.lineCap = 'round';
  dCtx.stroke();

  // Endpoint dots
  [[DCX - R, DCY], [DCX + R, DCY]].forEach(([x, y]) => {
    dCtx.beginPath();
    dCtx.arc(x, y, 5, 0, Math.PI * 2);
    dCtx.fillStyle = '#2563eb';
    dCtx.fill();
  });

  // "直径" label above line
  dCtx.fillStyle = '#1e40af';
  setFont(dCtx, 14, 'bold');
  dCtx.textAlign = 'center';
  dCtx.textBaseline = 'bottom';
  dCtx.fillText('← 直径 →', DCX, DCY - 10);

  // "中心" label at center
  dCtx.fillStyle = '#6b7280';
  setFont(dCtx, 11);
  dCtx.textBaseline = 'top';
  dCtx.fillText('中心', DCX + 10, DCY + 6);
}

const diaSlider = document.getElementById('diaSlider');
diaSlider.addEventListener('input', () => drawDiaCanvas(+diaSlider.value));
drawDiaCanvas(+diaSlider.value);


/* ============================================================
   Section 2: 円周テープアニメーション
============================================================ */
const stringCanvas = document.getElementById('stringCanvas');
const sCtx         = stringCanvas.getContext('2d');
const SW  = stringCanvas.width;   // 560
const SH  = stringCanvas.height;  // 290
const SR  = 72;                   // circle radius
const SCX = 90;                   // circle center x (left side)
const SCY = 112;                  // circle center y
const SContactX = SCX;            // tangent point x (bottom of circle)
const SContactY = SCY + SR;       // tangent point y = 184
const SCircumference = 2 * Math.PI * SR; // ≈ 452

const DURATION = 1800; // ms
let sProgress  = 0;
let sAnimating = false;
let sStart     = null;
let sRAF       = null;

function drawStringCanvas(p) {
  sCtx.clearRect(0, 0, SW, SH);
  const ep = easeInOut(p);

  // Circle fill
  sCtx.beginPath();
  sCtx.arc(SCX, SCY, SR, 0, Math.PI * 2);
  sCtx.fillStyle = '#eff6ff';
  sCtx.fill();
  sCtx.strokeStyle = '#bfdbfe';
  sCtx.lineWidth = 1.5;
  sCtx.stroke();

  // Diameter line
  sCtx.beginPath();
  sCtx.moveTo(SCX - SR, SCY);
  sCtx.lineTo(SCX + SR, SCY);
  sCtx.strokeStyle = '#3b82f6';
  sCtx.lineWidth = 2.5;
  sCtx.lineCap = 'round';
  sCtx.stroke();

  // Center dot
  sCtx.beginPath();
  sCtx.arc(SCX, SCY, 4, 0, Math.PI * 2);
  sCtx.fillStyle = '#3b82f6';
  sCtx.fill();

  // Diameter label (fades as tape extends)
  sCtx.globalAlpha = 1 - ep * 0.7;
  sCtx.fillStyle = '#1e40af';
  setFont(sCtx, 12, 'bold');
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'bottom';
  sCtx.fillText('直径', SCX, SCY - 6);
  sCtx.globalAlpha = 1;

  // Peel counterclockwise from bottom (π/2): right side peels first
  const bottomAngle = Math.PI / 2;
  const peelAngle   = bottomAngle - ep * 2 * Math.PI;
  const lineEndX    = SContactX + ep * SCircumference;

  // Remaining arc (unpeeled portion, counterclockwise from peel point back to bottom)
  if (ep < 0.001) {
    sCtx.beginPath();
    sCtx.arc(SCX, SCY, SR, 0, Math.PI * 2);
    sCtx.strokeStyle = '#ef4444';
    sCtx.lineWidth = 4;
    sCtx.stroke();
  } else if (ep < 0.999) {
    sCtx.beginPath();
    sCtx.arc(SCX, SCY, SR, peelAngle, bottomAngle, true);
    sCtx.strokeStyle = '#ef4444';
    sCtx.lineWidth = 4;
    sCtx.lineCap = 'round';
    sCtx.stroke();
  }

  // Growing tape line (extending rightward from tangent point)
  if (ep > 0.001) {
    sCtx.beginPath();
    sCtx.moveTo(SContactX, SContactY);
    sCtx.lineTo(lineEndX, SContactY);
    sCtx.strokeStyle = '#ef4444';
    sCtx.lineWidth = 4;
    sCtx.lineCap = 'round';
    sCtx.stroke();
  }

  // Tangent point dot (fixed at bottom of circle = left anchor of tape)
  sCtx.beginPath();
  sCtx.arc(SContactX, SContactY, 5.5, 0, Math.PI * 2);
  sCtx.fillStyle = '#ef4444';
  sCtx.fill();
  sCtx.strokeStyle = '#fff';
  sCtx.lineWidth = 2;
  sCtx.stroke();

  // Moving peel point dot + right-end dot (during animation)
  if (ep > 0.005 && ep < 0.995) {
    const peelX = SCX + SR * Math.cos(peelAngle);
    const peelY = SCY + SR * Math.sin(peelAngle);

    sCtx.beginPath();
    sCtx.arc(peelX, peelY, 5.5, 0, Math.PI * 2);
    sCtx.fillStyle = '#ef4444';
    sCtx.fill();
    sCtx.strokeStyle = '#fff';
    sCtx.lineWidth = 2;
    sCtx.stroke();

    sCtx.beginPath();
    sCtx.arc(lineEndX, SContactY, 5.5, 0, Math.PI * 2);
    sCtx.fillStyle = '#ef4444';
    sCtx.fill();
    sCtx.strokeStyle = '#fff';
    sCtx.lineWidth = 2;
    sCtx.stroke();
  }

  // Labels + tick marks (fade in when nearly done)
  if (ep > 0.75) {
    const alpha = Math.min((ep - 0.75) / 0.25, 1);
    sCtx.globalAlpha = alpha;

    sCtx.fillStyle = '#dc2626';
    setFont(sCtx, 14, 'bold');
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'top';
    sCtx.fillText('← 円周（まわりの長さ） →', SContactX + SCircumference / 2, SContactY + 10);

    const dLen = SR * 2;
    for (let i = 1; i <= 3; i++) {
      const tx = SContactX + dLen * i;
      sCtx.beginPath();
      sCtx.moveTo(tx, SContactY - 10);
      sCtx.lineTo(tx, SContactY + 10);
      sCtx.strokeStyle = '#3b82f6';
      sCtx.lineWidth = 2;
      sCtx.stroke();

      setFont(sCtx, 10, 'bold');
      sCtx.fillStyle = '#1e40af';
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'bottom';
      sCtx.fillText(`${i}D`, tx, SContactY - 12);
    }

    sCtx.fillStyle = '#059669';
    setFont(sCtx, 12, 'bold');
    sCtx.textAlign = 'right';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('≈ 直径 × 3.14', SContactX + SCircumference - 2, SContactY - 50);

    sCtx.globalAlpha = 1;
  }

  // Hint at rest (shown to the right of the circle)
  if (ep < 0.05) {
    sCtx.fillStyle = '#6b7280';
    setFont(sCtx, 12);
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('赤い線が円周。ボタンを押して引き伸ばしてみよう！', (SCX + SR + SW) / 2, SCY);
  }
}

function startAnimation() {
  if (sAnimating) return;
  sAnimating = true;
  sStart     = null;

  function frame(ts) {
    if (!sStart) sStart = ts;
    sProgress = Math.min((ts - sStart) / DURATION, 1);
    drawStringCanvas(sProgress);
    if (sProgress < 1) {
      sRAF = requestAnimationFrame(frame);
    } else {
      sAnimating = false;
    }
  }
  sRAF = requestAnimationFrame(frame);
}

function resetAnimation() {
  cancelAnimationFrame(sRAF);
  sAnimating = false;
  sProgress  = 0;
  drawStringCanvas(0);
}

document.getElementById('unrollBtn').addEventListener('click', () => {
  if (sProgress >= 1) resetAnimation(); // replay if already done
  setTimeout(startAnimation, 50);
});
document.getElementById('resetBtn').addEventListener('click', resetAnimation);

drawStringCanvas(0);
