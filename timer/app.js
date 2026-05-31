// Shared schedule constants & helpers

const TIMEZONE = 'Asia/Tokyo';
const COLOR_HIGH    = '#007700';
const COLOR_LOW     = 'goldenrod';
const COLOR_NEUTRAL = '#000000';

const RATE_A = 2000;
const RATE_B = 1226;

// ── Google Calendar 設定 ────────────────────────────────────
const API_KEY     = 'AIzaSyANL5C5iMZtnZhdUCb0xt59P-LD-WA0ecw';
const CALENDAR_ID = 'd0eb120895b44bb5496dba4a21c45f6e6d393fbb14910748827723b4e5736015@group.calendar.google.com';

let SHIFT_DATA = {};

async function loadCalendarData() {
  const CACHE_KEY = 'shift_cal_v1';
  const CACHE_TTL = 3 * 60 * 60 * 1000; // 3時間キャッシュ
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
  } catch (_) {}

  const now  = new Date();
  const tMin = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
  const tMax = new Date(now.getFullYear(), now.getMonth() + 24, 1).toISOString();
  const url  = 'https://www.googleapis.com/calendar/v3/calendars/'
    + encodeURIComponent(CALENDAR_ID)
    + '/events?key=' + API_KEY
    + '&timeMin=' + encodeURIComponent(tMin)
    + '&timeMax=' + encodeURIComponent(tMax)
    + '&singleEvents=true&orderBy=startTime&maxResults=500';

  const res  = await fetch(url);
  if (!res.ok) throw new Error('Calendar API ' + res.status);
  const json = await res.json();

  const result = {};
  for (const ev of json.items) {
    if (!ev.start || !ev.start.dateTime) continue;
    const key   = ev.start.dateTime.substring(0, 10);  // "2026-05-16"
    const start = ev.start.dateTime.substring(11, 16); // "09:30"
    const end   = ev.end.dateTime.substring(11, 16);   // "20:45"
    result[key] = { start, end };
  }

  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: result })); } catch (_) {}
  return result;
}

// ── Schedule constants ──────────────────────────────────────

const SCHEDULE_SAT = [
  { start: '09:30:00', end: '10:00:00', rate: RATE_B },
  { start: '10:00:00', end: '11:30:00', rate: RATE_A },
  { start: '11:30:00', end: '11:45:00', rate: RATE_B },
  { start: '11:45:00', end: '12:45:00', rate: 0 },
  { start: '12:45:00', end: '13:00:00', rate: RATE_B },
  { start: '13:00:00', end: '14:30:00', rate: RATE_A },
  { start: '14:30:00', end: '15:00:00', rate: RATE_B },
  { start: '15:00:00', end: '16:30:00', rate: RATE_A },
  { start: '16:30:00', end: '17:00:00', rate: RATE_B },
  { start: '17:00:00', end: '18:30:00', rate: RATE_A },
  { start: '18:30:00', end: '19:00:00', rate: RATE_B },
  { start: '19:00:00', end: '20:30:00', rate: RATE_A },
  { start: '20:30:00', end: '20:45:00', rate: RATE_B },
];

const SCHEDULE_FRI = [
  { start: '16:45:00', end: '17:00:00', rate: RATE_B },
  { start: '17:00:00', end: '18:30:00', rate: RATE_A },
  { start: '18:30:00', end: '19:00:00', rate: RATE_B },
  { start: '19:00:00', end: '20:30:00', rate: RATE_A },
  { start: '20:30:00', end: '20:45:00', rate: RATE_B },
];

const fmtTime = new Intl.DateTimeFormat('ja-JP', {
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false, timeZone: TIMEZONE,
});
const fmtNum = new Intl.NumberFormat('ja-JP', {
  style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2,
});

function dayKey(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

const asToday = (hhmmss, baseDate) => {
  const [HH, MM, SS] = hhmmss.split(':').map(Number);
  const d = new Date(baseDate.getTime());
  d.setHours(HH, MM, SS, 0);
  return d;
};

const asTime = (hhmm, baseDate) => {
  const [HH, MM] = hhmm.split(':').map(Number);
  const d = new Date(baseDate.getTime());
  d.setHours(HH, MM, 0, 0);
  return d;
};

// Returns rate blocks + actual shift start/end from calendar data
const buildBlocks = (baseDate) => {
  const key   = dayKey(baseDate);
  const shift = SHIFT_DATA[key];
  if (!shift) return { blocks: [], shiftStart: null, shiftEnd: null };

  const dow      = baseDate.getDay();
  const schedule = dow === 5 ? SCHEDULE_FRI : SCHEDULE_SAT;
  const blocks   = schedule.map(p => ({
    start: asToday(p.start, baseDate),
    end:   asToday(p.end,   baseDate),
    rate:  p.rate,
  }));

  return {
    blocks,
    shiftStart: asTime(shift.start, baseDate),
    shiftEnd:   asTime(shift.end,   baseDate),
  };
};

// Earnings for the period [from, to], clipped to rate blocks
function calcEarned(from, to, blocks) {
  let total = 0;
  for (const blk of blocks) {
    if (!blk.rate) continue;
    const s = Math.max(from.getTime(), blk.start.getTime());
    const e = Math.min(to.getTime(),   blk.end.getTime());
    if (e <= s) continue;
    total += (blk.rate / 3600) * ((e - s) / 1000);
  }
  return total;
}

const findCurrentBlock = (now, blocks, shiftStart) =>
  (shiftStart && now >= shiftStart)
    ? (blocks.find(b => now >= b.start && now < b.end) || null)
    : null;

// ── Timer tab ──────────────────────────────────────────────

function tick() {
  const now   = new Date();
  const today = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const parts = fmtTime.formatToParts(today)
    .reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  document.getElementById('clock').innerHTML =
    '<span id="hour">' + parts.hour + '</span>' +
    '<span id="colon">:</span>' + parts.minute +
    '<span id="sec">' + parts.second + '</span>';

  const { blocks, shiftStart } = buildBlocks(today);
  const total    = shiftStart ? calcEarned(shiftStart, today, blocks) : 0;
  const earnedEl = document.getElementById('earned');
  earnedEl.textContent = fmtNum.format(total);

  const current = findCurrentBlock(today, blocks, shiftStart);
  earnedEl.style.color = !current
    ? COLOR_NEUTRAL
    : current.rate >= RATE_A ? COLOR_HIGH : COLOR_LOW;
}

function openTotal() {
  if (!totalReady) {
    var now = new Date();
    totalYear  = now.getFullYear();
    totalMonth = now.getMonth() + 1;
    if (now.getDate() > 25) {
      totalMonth++;
      if (totalMonth > 12) { totalMonth = 1; totalYear++; }
    }
    renderTotal();
    totalReady = true;
  }
  document.getElementById('timer-view').classList.add('hidden');
  document.getElementById('total-view').classList.remove('hidden');
}

function closeTotal() {
  document.getElementById('total-view').classList.add('hidden');
  document.getElementById('timer-view').classList.remove('hidden');
}

document.addEventListener('click', function(e) {
  if (e.target.id === 'hour')      openTotal();
  if (e.target.id === 'close-btn') closeTotal();
  if (e.target.id === 'sec') {
    const el = document.getElementById('earned');
    el.style.visibility = el.style.visibility === 'hidden' ? 'visible' : 'hidden';
  }
});

// ── Total tab ──────────────────────────────────────────────

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

// Returns all Fri/Sat in the pay period: prev month 26th → this month 25th
function getWorkingDays(y, m) {
  const from = new Date(y, m - 2, 26);
  const to   = new Date(y, m - 1, 25);
  const days = [];
  const cur  = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0);
  while (dayKey(cur) <= dayKey(to)) {
    const dow = cur.getDay();
    if (dow === 5 || dow === 6) {
      days.push(new Date(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function calcDayEarnings(date, mode, startTime, endTime) {
  const { blocks, shiftStart, shiftEnd } = buildBlocks(date);
  if (!shiftStart || blocks.length === 0 || mode === 'off') return 0;
  if (mode === 'custom') {
    const from = startTime ? asTime(startTime, date) : shiftStart;
    const to   = endTime   ? asTime(endTime,   date) : shiftEnd;
    const extBlocks = blocks.slice();
    if (extBlocks.length > 0) {
      if (from < extBlocks[0].start)
        extBlocks.unshift({ start: from, end: extBlocks[0].start, rate: RATE_B });
      if (to > extBlocks[extBlocks.length - 1].end)
        extBlocks.push({ start: extBlocks[extBlocks.length - 1].end, end: to, rate: RATE_B });
    }
    return calcEarned(from, to, extBlocks);
  }
  return calcEarned(shiftStart, shiftEnd, blocks);
}

function formatYen(amount) {
  return Math.round(amount).toLocaleString('ja-JP');
}

function recalcTotal(days, settings) {
  var total = 0;
  for (var i = 0; i < days.length; i++) {
    var k = dayKey(days[i]);
    var s = settings[k] || { mode: SHIFT_DATA[k] ? 'full' : 'off', startTime: '', endTime: '' };
    total += calcDayEarnings(days[i], s.mode, s.startTime, s.endTime);
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
    var day   = days[i];
    var key   = dayKey(day);
    var s     = settings[key] || { mode: SHIFT_DATA[key] ? 'full' : 'off', startTime: '', endTime: '' };
    var dow   = day.getDay();
    var earn  = calcDayEarnings(day, s.mode, s.startTime, s.endTime);
    totalEarnings += earn;

    var shift      = SHIFT_DATA[key];
    var shiftLabel = shift ? shift.start + '〜' + shift.end : '';
    var isOff      = s.mode === 'off';
    var dateLabel  = (day.getMonth() + 1) + '月' + day.getDate() + '日(' + DAY_JA[dow] + ')';
    var dowClass   = dow === 6 ? 'sat' : 'fri';
    var rowClass   = 'day-row' + (isOff ? ' is-off' : '');
    var isCustom   = s.mode === 'custom';
    var shiftDisp  = isCustom ? 'none' : 'inline';
    var inputsDisp = isCustom ? 'flex' : 'none';
    var fullSel    = s.mode === 'full'   ? ' selected' : '';
    var customSel  = isCustom            ? ' selected' : '';
    var offSel     = s.mode === 'off'    ? ' selected' : '';

    var row = document.createElement('div');
    row.className   = rowClass;
    row.dataset.key = key;
    row.innerHTML =
      '<span class="day-label ' + dowClass + '">' + dateLabel + '</span>' +
      '<span class="shift-time" style="display:' + shiftDisp + '">' + shiftLabel + '</span>' +
      '<select class="mode-select" data-key="' + key + '">' +
        '<option value="full"'   + fullSel   + '>フル</option>' +
        '<option value="custom"' + customSel + '>カスタム</option>' +
        '<option value="off"'    + offSel    + '>休み</option>' +
      '</select>' +
      '<span class="day-earnings">' + (isOff ? '—' : formatYen(earn)) + '</span>' +
      '<div class="time-inputs" style="display:' + inputsDisp + '">' +
        '<input type="time" class="start-time-input" data-key="' + key + '" value="' + (s.startTime || '') + '" />' +
        '<input type="time" class="end-time-input"   data-key="' + key + '" value="' + (s.endTime   || '') + '" />' +
      '</div>';

    list.appendChild(row);
  }

  document.getElementById('total-amount').textContent = formatYen(totalEarnings);

  list.querySelectorAll('.mode-select').forEach(function(sel) {
    sel.addEventListener('change', function(e) {
      var key  = e.target.dataset.key;
      var mode = e.target.value;
      if (!settings[key]) settings[key] = { mode: 'full', startTime: '', endTime: '' };
      settings[key].mode = mode;
      saveSettings(y, m, settings);

      var row = list.querySelector('.day-row[data-key="' + key + '"]');
      row.querySelector('.shift-time').style.display  = mode === 'custom' ? 'none' : 'inline';
      row.querySelector('.time-inputs').style.display = mode === 'custom' ? 'flex'  : 'none';
      row.classList.toggle('is-off', mode === 'off');

      if (mode === 'custom') {
        var shift = SHIFT_DATA[key];
        if (shift) {
          var startInp = row.querySelector('.start-time-input');
          var endInp   = row.querySelector('.end-time-input');
          if (!settings[key].startTime) {
            settings[key].startTime = shift.start;
            startInp.value = shift.start;
          }
          if (!settings[key].endTime) {
            settings[key].endTime = shift.end;
            endInp.value = shift.end;
          }
          saveSettings(y, m, settings);
        }
      }

      var parts = key.split('-').map(Number);
      var date  = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      var earn  = calcDayEarnings(date, mode, settings[key].startTime || '', settings[key].endTime || '');
      row.querySelector('.day-earnings').textContent = mode === 'off' ? '—' : formatYen(earn);
      recalcTotal(days, settings);
    });
  });

  list.querySelectorAll('.start-time-input').forEach(function(inp) {
    inp.addEventListener('change', function(e) {
      var key = e.target.dataset.key;
      if (!settings[key]) settings[key] = { mode: 'custom', startTime: '', endTime: '' };
      settings[key].startTime = e.target.value;
      saveSettings(y, m, settings);

      var parts = key.split('-').map(Number);
      var date  = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      var earn  = calcDayEarnings(date, settings[key].mode, e.target.value, settings[key].endTime || '');
      list.querySelector('.day-row[data-key="' + key + '"] .day-earnings').textContent = formatYen(earn);
      recalcTotal(days, settings);
    });
  });

  list.querySelectorAll('.end-time-input').forEach(function(inp) {
    inp.addEventListener('change', function(e) {
      var key = e.target.dataset.key;
      if (!settings[key]) settings[key] = { mode: 'custom', startTime: '', endTime: '' };
      settings[key].endTime = e.target.value;
      saveSettings(y, m, settings);

      var parts = key.split('-').map(Number);
      var date  = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      var earn  = calcDayEarnings(date, settings[key].mode, settings[key].startTime || '', e.target.value);
      list.querySelector('.day-row[data-key="' + key + '"] .day-earnings').textContent = formatYen(earn);
      recalcTotal(days, settings);
    });
  });
}

// ── Month nav ─────────────────────────────────────────────

var totalReady = false;

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

// ── 起動 ──────────────────────────────────────────────────

(async () => {
  try {
    SHIFT_DATA = await loadCalendarData();
  } catch (e) {
    console.error('カレンダー取得失敗:', e);
  }
  tick();
  setInterval(tick, 1000);
})();
