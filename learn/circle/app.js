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

  // "まん中" label at center
  dCtx.fillStyle = '#6b7280';
  setFont(dCtx, 11);
  dCtx.textBaseline = 'top';
  dCtx.fillText('まん中', DCX + 10, DCY + 6);
}

const diaSlider = document.getElementById('diaSlider');
diaSlider.addEventListener('input', () => drawDiaCanvas(+diaSlider.value));
drawDiaCanvas(+diaSlider.value);


/* ============================================================
   Section 2: 糸モーフィングアニメーション
============================================================ */
const stringCanvas = document.getElementById('stringCanvas');
const sCtx         = stringCanvas.getContext('2d');
const SW  = stringCanvas.width;   // 560
const SH  = stringCanvas.height;  // 290
const SR  = 78;                   // circle radius
const SCX = SW / 2;               // 280
const SCY = 108;                  // circle center y
const S_GAP  = 58;                // gap between circle bottom and line
const SLineY = SCY + SR + S_GAP; // y of the straight line ≈ 244
const SLineStart = SCX - Math.PI * SR; // left end of line ≈ 35
const SCircumference = 2 * Math.PI * SR;

const DURATION = 1800; // ms
let sProgress  = 0;
let sAnimating = false;
let sStart     = null;
let sRAF       = null;

function drawStringCanvas(p) {
  sCtx.clearRect(0, 0, SW, SH);

  const ep = easeInOut(p);

  // -- Circle fill --
  sCtx.beginPath();
  sCtx.arc(SCX, SCY, SR, 0, Math.PI * 2);
  sCtx.fillStyle = '#eff6ff';
  sCtx.fill();
  sCtx.strokeStyle = '#bfdbfe';
  sCtx.lineWidth = 1.5;
  sCtx.stroke();

  // -- Diameter line (stays fixed) --
  sCtx.beginPath();
  sCtx.moveTo(SCX - SR, SCY);
  sCtx.lineTo(SCX + SR, SCY);
  sCtx.strokeStyle = '#3b82f6';
  sCtx.lineWidth = 2.5;
  sCtx.lineCap = 'round';
  sCtx.stroke();

  // Diameter label (fades out as string unrolls)
  sCtx.globalAlpha = 1 - ep * 0.7;
  sCtx.fillStyle = '#1e40af';
  setFont(sCtx, 12, 'bold');
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'bottom';
  sCtx.fillText('直径', SCX, SCY - 6);
  sCtx.globalAlpha = 1;

  // -- Morph: string from circle arc → straight line --
  // Parameterization: t ∈ [0, 2π]
  // Arc: starts at top (sin/cos convention), goes clockwise
  //   arcX = SCX + SR * sin(t)
  //   arcY = SCY - SR * cos(t)
  // Line: horizontal below circle
  //   lineX = SLineStart + t * SR
  //   lineY = SLineY
  const N = 360;
  sCtx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t  = (i / N) * 2 * Math.PI;
    const ax = SCX + SR * Math.sin(t);
    const ay = SCY - SR * Math.cos(t);
    const lx = SLineStart + t * SR;
    const ly = SLineY;
    const x  = lerp(ax, lx, ep);
    const y  = lerp(ay, ly, ep);
    i === 0 ? sCtx.moveTo(x, y) : sCtx.lineTo(x, y);
  }
  sCtx.strokeStyle = '#ef4444';
  sCtx.lineWidth = 4;
  sCtx.lineCap   = 'round';
  sCtx.lineJoin  = 'round';
  sCtx.stroke();

  // -- Start point dot (top of circle → left end of line) --
  const dotX = lerp(SCX, SLineStart, ep);
  const dotY = lerp(SCY - SR, SLineY, ep);
  sCtx.beginPath();
  sCtx.arc(dotX, dotY, 6, 0, Math.PI * 2);
  sCtx.fillStyle = '#ef4444';
  sCtx.fill();
  sCtx.strokeStyle = '#fff';
  sCtx.lineWidth = 2;
  sCtx.stroke();

  // -- Line label + diameter tick marks (appear when nearly done) --
  if (ep > 0.75) {
    const alpha = Math.min((ep - 0.75) / 0.25, 1);
    sCtx.globalAlpha = alpha;

    // "円周" label
    sCtx.fillStyle = '#dc2626';
    setFont(sCtx, 15, 'bold');
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'top';
    sCtx.fillText('← 円周（まわりの長さ） →', SCX, SLineY + 12);

    // Tick marks at every diameter (D, 2D, 3D)
    const dLen = SR * 2;
    for (let i = 1; i <= 3; i++) {
      const tx = SLineStart + dLen * i;
      sCtx.beginPath();
      sCtx.moveTo(tx, SLineY - 10);
      sCtx.lineTo(tx, SLineY + 10);
      sCtx.strokeStyle = '#3b82f6';
      sCtx.lineWidth = 2;
      sCtx.stroke();

      setFont(sCtx, 10, 'bold');
      sCtx.fillStyle = '#1e40af';
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'bottom';
      sCtx.fillText(`${i}D`, tx, SLineY - 12);
    }

    // Small annotation: "約3.14倍"
    sCtx.fillStyle = '#059669';
    setFont(sCtx, 12, 'bold');
    sCtx.textAlign = 'right';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('≈ 直径 × 3.14', SLineStart + SCircumference - 2, SLineY - 26);

    sCtx.globalAlpha = 1;
  }

  // -- "糸を巻こう" hint when at rest --
  if (ep < 0.05) {
    sCtx.fillStyle = '#6b7280';
    setFont(sCtx, 12);
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'top';
    sCtx.fillText('↑ 赤い糸が円のまわりに巻いてあります', SCX, SLineY + 8);
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
