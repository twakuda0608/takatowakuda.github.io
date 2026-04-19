const TIMEZONE = 'Asia/Tokyo';
const COLOR_HIGH    = '#007700';
const COLOR_LOW     = 'goldenrod';
const COLOR_NEUTRAL = '#000000';

const RATE_A = 2000;
const RATE_B = 1226;

const SCHEDULE = [
  { start: '14:45:01', end: '15:00:00', rate: RATE_B },
  { start: '15:00:01', end: '16:30:00', rate: RATE_A },
  { start: '16:30:01', end: '17:00:00', rate: RATE_B },
  { start: '17:00:01', end: '18:30:00', rate: RATE_A },
  { start: '18:30:01', end: '19:00:00', rate: RATE_B },
  { start: '19:00:01', end: '20:30:00', rate: RATE_A },
  { start: '20:30:01', end: '23:59:59', rate: RATE_B },
];

const SCHEDULE_SAT = [
  { start: '09:30:01', end: '10:00:00', rate: RATE_B },
  { start: '10:00:01', end: '11:30:00', rate: RATE_A },
  { start: '11:30:01', end: '11:45:00', rate: RATE_B },
  { start: '11:45:01', end: '12:45:00', rate: 0 },
  { start: '12:45:01', end: '13:00:00', rate: RATE_B },
  { start: '13:00:01', end: '14:30:00', rate: RATE_A },
  { start: '14:30:01', end: '15:00:00', rate: RATE_B },
  { start: '15:00:01', end: '16:30:00', rate: RATE_A },
  { start: '16:30:01', end: '17:00:00', rate: RATE_B },
  { start: '17:00:01', end: '18:30:00', rate: RATE_A },
  { start: '18:30:01', end: '19:00:00', rate: RATE_B },
  { start: '19:00:01', end: '20:30:00', rate: RATE_A },
  { start: '20:30:01', end: '20:45:00', rate: RATE_B },
];

const SCHEDULE_FRI = [
  { start: '16:45:01', end: '17:00:00', rate: RATE_B },
  { start: '17:00:01', end: '18:30:00', rate: RATE_A },
  { start: '18:30:01', end: '19:00:00', rate: RATE_B },
  { start: '19:00:01', end: '20:30:00', rate: RATE_A },
  { start: '20:30:01', end: '20:45:00', rate: RATE_B },
];

const fmtTime = new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: TIMEZONE });
const fmtNum  = new Intl.NumberFormat('ja-JP', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const asToday = (hhmmss, baseDate) => {
  const [HH, MM, SS] = hhmmss.split(':').map(Number);
  const d = new Date(baseDate.getTime());
  d.setHours(HH, MM, SS, 0);
  return d;
};

const buildBlocks = (baseDate) => {
  const day = baseDate.getDay();
  const schedule = day === 5 ? SCHEDULE_FRI : day === 6 ? SCHEDULE_SAT : [];
  return schedule.map(p => ({
    start: asToday(p.start, baseDate),
    end: asToday(p.end, baseDate),
    rate: p.rate
  }));
};

const secsBetween = (a, b) => Math.max(0, Math.floor((b - a) / 1000));

function calcTotal(now, blocks) {
  let total = 0;
  for (const blk of blocks) {
    if (now <= blk.start) continue;
    const effectiveEnd = now < blk.end ? now : blk.end;
    const secs = secsBetween(blk.start, effectiveEnd);
    if (secs > 0) total += (blk.rate / 3600) * secs;
  }
  return total;
}

const findCurrentBlock = (now, blocks) => blocks.find(b => now >= b.start && now < b.end) || null;

function tick() {
  const now = new Date();
  const today = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const parts = fmtTime.formatToParts(today).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  document.getElementById('clock').innerHTML = `${parts.hour}<span id="colon">:</span>${parts.minute}<span id="sec">` + parts.second + `</span>`;

  const blocks = buildBlocks(today);
  const total = calcTotal(today, blocks);
  const earnedEl = document.getElementById('earned');
  earnedEl.textContent = fmtNum.format(total);

  const current = findCurrentBlock(today, blocks);
  if (!current) {
    earnedEl.style.color = COLOR_NEUTRAL;
  } else {
    earnedEl.style.color = (current.rate >= 2000) ? COLOR_HIGH : COLOR_LOW;
  }
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'sec') {
    const earnedEl = document.getElementById('earned');
    earnedEl.style.visibility =
      (earnedEl.style.visibility === 'hidden') ? 'visible' : 'hidden';
  }
});

tick();
setInterval(tick, 1000);
