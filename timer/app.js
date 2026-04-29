// Shared schedule constants & helpers

const TIMEZONE = 'Asia/Tokyo';
const COLOR_HIGH    = '#007700';
const COLOR_LOW     = 'goldenrod';
const COLOR_NEUTRAL = '#000000';

const RATE_A = 2000;
const RATE_B = 1226;

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

const fmtTime = new Intl.DateTimeFormat('ja-JP', {
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false, timeZone: TIMEZONE,
});
const fmtNum = new Intl.NumberFormat('ja-JP', {
  style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2,
});

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
    end:   asToday(p.end,   baseDate),
    rate:  p.rate,
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

const findCurrentBlock = (now, blocks) =>
  blocks.find(b => now >= b.start && now < b.end) || null;

// Timer tab

function tick() {
  const now   = new Date();
  const today = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const parts = fmtTime.formatToParts(today)
    .reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  document.getElementById('clock').innerHTML =
    parts.hour + '<span id="colon">:</span>' + parts.minute +
    '<span id="sec">' + parts.second + '</span>';

  const blocks   = buildBlocks(today);
  const total    = calcTotal(today, blocks);
  const earnedEl = document.getElementById('earned');
  earnedEl.textContent = fmtNum.format(total);

  const current = findCurrentBlock(today, blocks);
  earnedEl.style.color = !current
    ? COLOR_NEUTRAL
    : current.rate >= 2000 ? COLOR_HIGH : COLOR_LOW;
}

document.addEventListener('click', function(e) {
  if (e.target.id === 'sec') {
    const el = document.getElementById('earned');
    el.style.visibility = el.style.visibility === 'hidden' ? 'visible' : 'hidden';
  }
});

tick();
setInterval(tick, 1000);

// Total tab

const DAY_JA = ['日', '月', '火', '水', '木', '金', '土'];
const STORAGE_PREFIX = 'timer_month_';

var totalYear, totalMonth;

function storageKey(y, m) {
  return STORAGE_PREFIX + y + '-' + String(m).padStart(2, '0');
}

function loadSettings(y, m) {
  try {
    const raw = localStorage.getItem(storageKey(y, m));
    return raw ? JSON.parse(raw) : {};
  } catch (err) { return {}; }
}

function saveSettings(y, m, settings) {
  try { localStorage.setItem(storageKey(y, m), JSON.stringify(settings)); }
  catch (err) {}
}

function getWorkingDays(y, m) {
  const days = [];
  const d = new Date(y, m - 1, 1);
  while (d.getMonth() === m - 1) {
    if (d.getDay() === 5 || d.getDay() === 6) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function calcDayEarnings(date, mode, endTime) {
  const blocks = buildBlocks(date);
  if (mode === 'off' || blocks.length === 0) return 0;
  if (mode === 'custom') {
    const parts = (endTime || '17:00').split(':').map(Number);
    const end = new Date(date.getTime());
    end.setHours(parts[0], parts[1], 0, 0);
    return calcTotal(end, blocks);
  }
  return calcTotal(blocks[blocks.length - 1].end, blocks);
}

function formatYen(amount) {
  return '¥' + Math.round(amount).toLocaleString('ja-JP');
}

function dayKey(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function recalcTotal(days, settings) {
  var total = 0;
  for (var i = 0; i < days.length; i++) {
    var s = settings[dayKey(days[i])] || { mode: 'full', endTime: '' };
    total += calcDayEarnings(days[i], s.mode, s.endTime);
  }
  document.getElementById('total-amount').textContent = formatYen(total);
}

function renderTotal() {
  var y        = totalYear;
  var m        = totalMonth;
  var settings = loadSettings(y, m);
  var days     = getWorkingDays(y, m);

  document.getElementById('month-heading').textContent = y + '年' + m + '月';

  var list = document.getElementById('days-list');
  list.innerHTML = '';

  var totalEarnings = 0;

  for (var i = 0; i < days.length; i++) {
    var day  = days[i];
    var key  = dayKey(day);
    var s    = settings[key] || { mode: 'full', endTime: '' };
    var dow  = day.getDay();
    var earn = calcDayEarnings(day, s.mode, s.endTime);
    totalEarnings += earn;

    var isOff      = s.mode === 'off';
    var dateLabel  = m + '月' + day.getDate() + '日(' + DAY_JA[dow] + ')';
    var dowClass   = dow === 6 ? 'sat' : 'fri';
    var rowClass   = 'day-row' + (isOff ? ' is-off' : '');
    var timeDisp   = s.mode === 'custom' ? 'inline-block' : 'none';
    var fullSel    = s.mode === 'full'   ? ' selected' : '';
    var customSel  = s.mode === 'custom' ? ' selected' : '';
    var offSel     = s.mode === 'off'    ? ' selected' : '';

    var row = document.createElement('div');
    row.className    = rowClass;
    row.dataset.key  = key;
    row.innerHTML =
      '<span class="day-label ' + dowClass + '">' + dateLabel + '</span>' +
      '<select class="mode-select" data-key="' + key + '">' +
        '<option value="full"'   + fullSel   + '>フル</option>' +
        '<option value="custom"' + customSel + '>カスタム</option>' +
        '<option value="off"'    + offSel    + '>休み</option>' +
      '</select>' +
      '<input type="time" class="end-time-input" data-key="' + key + '"' +
        ' value="' + (s.endTime || '') + '"' +
        ' style="display:' + timeDisp + '" />' +
      '<span class="day-earnings">' + (isOff ? '—' : formatYen(earn)) + '</span>';

    list.appendChild(row);
  }

  document.getElementById('total-amount').textContent = formatYen(totalEarnings);

  list.querySelectorAll('.mode-select').forEach(function(sel) {
    sel.addEventListener('change', function(e) {
      var key  = e.target.dataset.key;
      var mode = e.target.value;
      if (!settings[key]) settings[key] = { mode: 'full', endTime: '' };
      settings[key].mode = mode;
      saveSettings(y, m, settings);

      var row     = list.querySelector('.day-row[data-key="' + key + '"]');
      var timeInp = row.querySelector('.end-time-input');
      timeInp.style.display = mode === 'custom' ? 'inline-block' : 'none';
      row.classList.toggle('is-off', mode === 'off');

      var parts = key.split('-').map(Number);
      var date  = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      var earn  = calcDayEarnings(date, mode, settings[key].endTime || '');
      row.querySelector('.day-earnings').textContent = mode === 'off' ? '—' : formatYen(earn);
      recalcTotal(days, settings);
    });
  });

  list.querySelectorAll('.end-time-input').forEach(function(inp) {
    inp.addEventListener('change', function(e) {
      var key = e.target.dataset.key;
      if (!settings[key]) settings[key] = { mode: 'full', endTime: '' };
      settings[key].endTime = e.target.value;
      saveSettings(y, m, settings);

      var parts = key.split('-').map(Number);
      var date  = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      var earn  = calcDayEarnings(date, settings[key].mode, e.target.value);
      list.querySelector('.day-row[data-key="' + key + '"] .day-earnings').textContent = formatYen(earn);
      recalcTotal(days, settings);
    });
  });
}

// Tab switching

var totalReady = false;

document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(function(b) {
      b.classList.toggle('active', b === btn);
    });
    document.getElementById('timer-view').classList.toggle('hidden', tab !== 'timer');
    document.getElementById('total-view').classList.toggle('hidden', tab !== 'total');

    if (tab === 'total' && !totalReady) {
      var now  = new Date();
      totalYear  = now.getFullYear();
      totalMonth = now.getMonth() + 1;
      renderTotal();
      totalReady = true;
    }
  });
});

document.getElementById('prev-month').addEventListener('click', function() {
  totalMonth--;
  if (totalMonth < 1) { totalMonth = 12; totalYear--; }
  renderTotal();
});

document.getElementById('next-month').addEventListener('click', function() {
  totalMonth++;
  if (totalMonth > 12) { totalMonth = 1; totalYear++; }
  renderTotal();
});
