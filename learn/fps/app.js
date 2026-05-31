/* ============================================================
   Section 1: フレームコマ送りデモ
============================================================ */
const frameCanvas = document.getElementById('frameCanvas');
const fCtx = frameCanvas.getContext('2d');
const FW = frameCanvas.width;   // 560
const FH = frameCanvas.height;  // 160

const TOTAL_FRAMES = 8;
const BALL_COLORS = ['#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3730a3', '#312e81', '#1e1b4b', '#0f0b1f'];
let currentFrame = 0;
let frameAnimId = null;

function drawFrameCanvas(frameIndex) {
  fCtx.clearRect(0, 0, FW, FH);

  const cellW = FW / TOTAL_FRAMES;
  const ballY = FH / 2;

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const cx = cellW * i + cellW / 2;

    // Cell background
    fCtx.fillStyle = i === frameIndex ? '#ede9fe' : '#f8fafc';
    roundRect(fCtx, cellW * i + 2, 4, cellW - 4, FH - 8, 8);
    fCtx.fill();

    // Cell border
    fCtx.strokeStyle = i === frameIndex ? '#7c3aed' : '#e2e8f0';
    fCtx.lineWidth = i === frameIndex ? 2.5 : 1;
    roundRect(fCtx, cellW * i + 2, 4, cellW - 4, FH - 8, 8);
    fCtx.stroke();

    // Ball
    const progress = i / (TOTAL_FRAMES - 1);
    const bx = (cellW - 40) * progress + 20;
    const by = ballY + Math.sin(progress * Math.PI) * -28;

    fCtx.beginPath();
    fCtx.arc(cellW * i + bx, by, 14, 0, Math.PI * 2);
    fCtx.fillStyle = i <= frameIndex ? '#7c3aed' : '#c4b5fd';
    fCtx.fill();

    // Frame number
    fCtx.fillStyle = i === frameIndex ? '#5b21b6' : '#9ca3af';
    fCtx.font = `bold 10px system-ui`;
    fCtx.textAlign = 'center';
    fCtx.textBaseline = 'bottom';
    fCtx.fillText(`${i + 1}`, cellW * i + cellW / 2, FH - 6);
  }

  // Active frame highlight arrow
  const ax = cellW * frameIndex + cellW / 2;
  fCtx.fillStyle = '#7c3aed';
  fCtx.beginPath();
  fCtx.moveTo(ax - 6, 2);
  fCtx.lineTo(ax + 6, 2);
  fCtx.lineTo(ax, 10);
  fCtx.closePath();
  fCtx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

let frameAutoPlaying = false;

document.getElementById('framePlayBtn').addEventListener('click', () => {
  if (frameAutoPlaying) return;
  frameAutoPlaying = true;
  currentFrame = 0;

  function stepFrame() {
    drawFrameCanvas(currentFrame);
    if (currentFrame < TOTAL_FRAMES - 1) {
      currentFrame++;
      frameAnimId = setTimeout(stepFrame, 280);
    } else {
      frameAutoPlaying = false;
    }
  }
  stepFrame();
});

document.getElementById('frameResetBtn').addEventListener('click', () => {
  clearTimeout(frameAnimId);
  frameAutoPlaying = false;
  currentFrame = 0;
  drawFrameCanvas(0);
});

drawFrameCanvas(0);


/* ============================================================
   Section 3: 低FPS vs 高FPS 比較
============================================================ */
const lowCanvas  = document.getElementById('lowCanvas');
const highCanvas = document.getElementById('highCanvas');
const lCtx = lowCanvas.getContext('2d');
const hCtx = highCanvas.getContext('2d');

const CW = lowCanvas.width;   // 240
const CH = lowCanvas.height;  // 120
const BALL_R = 14;

let comparePlaying = false;
let compareStartTime = null;
let compareRAF = null;

const SPEED = 160; // px per second

function getBallX(t) {
  const period = (CW - BALL_R * 2) * 2 / SPEED;
  const pos = (t % period) / period;
  const bounce = pos < 0.5 ? pos * 2 : 2 - pos * 2;
  return BALL_R + bounce * (CW - BALL_R * 2);
}

function drawBallCanvas(ctx, ballX, label) {
  ctx.clearRect(0, 0, CW, CH);

  // Floor
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, CH - 18, CW, 18);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, CH - 18);
  ctx.lineTo(CW, CH - 18);
  ctx.stroke();

  // Ball shadow
  ctx.beginPath();
  ctx.ellipse(ballX, CH - 18, 10, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fill();

  // Ball
  const ballY = CH - 18 - BALL_R;
  const grad = ctx.createRadialGradient(ballX - 4, ballY - 4, 2, ballX, ballY, BALL_R);
  grad.addColorStop(0, '#a78bfa');
  grad.addColorStop(1, '#5b21b6');
  ctx.beginPath();
  ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

// Low FPS: update at 5fps
let lowLastTime = 0;
let lowBallX = BALL_R;
const LOW_FPS = 5;

// High FPS: update every frame (60fps)
let highBallX = BALL_R;

function compareFrame(ts) {
  if (!compareStartTime) compareStartTime = ts;
  const elapsed = (ts - compareStartTime) / 1000;

  // High FPS: smooth every frame
  highBallX = getBallX(elapsed);
  drawBallCanvas(hCtx, highBallX, '60');

  // Low FPS: throttled update
  if (ts - lowLastTime >= 1000 / LOW_FPS) {
    lowBallX = getBallX(elapsed);
    lowLastTime = ts;
  }
  drawBallCanvas(lCtx, lowBallX, '5');

  if (comparePlaying) {
    compareRAF = requestAnimationFrame(compareFrame);
  }
}

function drawStillBall(ctx) {
  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, CH - 18, CW, 18);
  ctx.fillStyle = '#c4b5fd';
  ctx.beginPath();
  ctx.arc(BALL_R + 10, CH - 18 - BALL_R, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('▶ を押してね', CW / 2, CH / 2 - 4);
}

drawStillBall(lCtx);
drawStillBall(hCtx);

document.getElementById('compareStartBtn').addEventListener('click', () => {
  if (comparePlaying) return;
  comparePlaying = true;
  compareStartTime = null;
  lowLastTime = 0;
  compareRAF = requestAnimationFrame(compareFrame);
});

document.getElementById('compareStopBtn').addEventListener('click', () => {
  comparePlaying = false;
  cancelAnimationFrame(compareRAF);
  drawStillBall(lCtx);
  drawStillBall(hCtx);
});


/* ============================================================
   Section 4: FPS スライダー体験
============================================================ */
const tryCanvas = document.getElementById('tryCanvas');
const tCtx = tryCanvas.getContext('2d');
const TW = tryCanvas.width;   // 560
const TH = tryCanvas.height;  // 160

const fpsSlider   = document.getElementById('fpsSlider');
const fpsDisplay  = document.getElementById('fpsDisplay');
const fpsTag      = document.getElementById('fpsTag');
const fpsMeter    = document.getElementById('fpsMeterFill');

let targetFPS = 30;
let tryLastTime = 0;
let tryBallX = 30;
let tryBallDir = 1;
let tryRAF = null;

const TRY_BALL_R = 20;
const TRY_SPEED = 220; // px/s

function tryFpsTag(fps) {
  if (fps <= 5)  return { text: 'カクカク', bg: '#fee2e2', color: '#991b1b' };
  if (fps <= 15) return { text: 'ちょっとカクカク', bg: '#fef3c7', color: '#92400e' };
  if (fps <= 30) return { text: 'ふつう', bg: '#d1fae5', color: '#065f46' };
  return { text: 'なめらか！', bg: '#dbeafe', color: '#1e40af' };
}

function updateFpsUI() {
  const fps = +fpsSlider.value;
  targetFPS = fps;
  fpsDisplay.textContent = `${fps} FPS`;
  fpsMeter.style.width = `${(fps / 60) * 100}%`;

  const tag = tryFpsTag(fps);
  fpsTag.textContent = tag.text;
  fpsTag.style.background = tag.bg;
  fpsTag.style.color = tag.color;
}

function drawTryCanvas(ballX) {
  tCtx.clearRect(0, 0, TW, TH);

  // Track
  tCtx.fillStyle = '#f1f5f9';
  tCtx.beginPath();
  tCtx.roundRect(16, TH / 2 - 6, TW - 32, 12, 6);
  tCtx.fill();

  // Trail dots (ghost frames)
  for (let i = 1; i <= 4; i++) {
    const ghost = ballX - tryBallDir * TRY_BALL_R * i * 0.8;
    tCtx.globalAlpha = 0.08 * (5 - i) * (targetFPS / 60);
    tCtx.beginPath();
    tCtx.arc(ghost, TH / 2, TRY_BALL_R, 0, Math.PI * 2);
    tCtx.fillStyle = '#7c3aed';
    tCtx.fill();
  }
  tCtx.globalAlpha = 1;

  // Ball
  const grad = tCtx.createRadialGradient(ballX - 5, TH / 2 - 5, 3, ballX, TH / 2, TRY_BALL_R);
  grad.addColorStop(0, '#a78bfa');
  grad.addColorStop(1, '#4c1d95');
  tCtx.beginPath();
  tCtx.arc(ballX, TH / 2, TRY_BALL_R, 0, Math.PI * 2);
  tCtx.fillStyle = grad;
  tCtx.fill();

  // FPS counter overlay
  tCtx.fillStyle = '#6b7280';
  tCtx.font = 'bold 11px system-ui';
  tCtx.textAlign = 'right';
  tCtx.textBaseline = 'top';
  tCtx.fillText(`${targetFPS} FPS`, TW - 10, 8);
}

function tryFrame(ts) {
  const interval = 1000 / targetFPS;
  if (ts - tryLastTime >= interval) {
    const dt = Math.min((ts - tryLastTime) / 1000, 0.1);
    tryBallX += TRY_SPEED * tryBallDir * dt;
    if (tryBallX >= TW - TRY_BALL_R - 16) { tryBallX = TW - TRY_BALL_R - 16; tryBallDir = -1; }
    if (tryBallX <= TRY_BALL_R + 16)      { tryBallX = TRY_BALL_R + 16; tryBallDir = 1; }
    drawTryCanvas(tryBallX);
    tryLastTime = ts;
  }
  tryRAF = requestAnimationFrame(tryFrame);
}

fpsSlider.addEventListener('input', updateFpsUI);
updateFpsUI();
tryRAF = requestAnimationFrame(tryFrame);
