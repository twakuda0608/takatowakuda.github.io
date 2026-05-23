const sliderR = document.getElementById('sliderR');
const sliderG = document.getElementById('sliderG');
const sliderB = document.getElementById('sliderB');
const valueR  = document.getElementById('valueR');
const valueG  = document.getElementById('valueG');
const valueB  = document.getElementById('valueB');
const preview = document.getElementById('colorPreview');
const hexDisp = document.getElementById('hexDisplay');
const barR    = document.getElementById('barR');
const barG    = document.getElementById('barG');
const barB    = document.getElementById('barB');
const barValR = document.getElementById('barValR');
const barValG = document.getElementById('barValG');
const barValB = document.getElementById('barValB');

function toHex(n) {
  return n.toString(16).padStart(2, '0').toUpperCase();
}

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function update() {
  const r = clamp(parseInt(sliderR.value));
  const g = clamp(parseInt(sliderG.value));
  const b = clamp(parseInt(sliderB.value));

  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  preview.style.background = hex;
  hexDisp.textContent = hex;

  valueR.value = r;
  valueG.value = g;
  valueB.value = b;

  barR.style.width = `${(r / 255) * 100}%`;
  barG.style.width = `${(g / 255) * 100}%`;
  barB.style.width = `${(b / 255) * 100}%`;
  barValR.textContent = r;
  barValG.textContent = g;
  barValB.textContent = b;

  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  hexDisp.style.color = luminance > 128 ? '#333' : '#eee';
  hexDisp.style.background = luminance > 128 ? '#f4f6fb' : '#2a2a2a';
  hexDisp.style.borderColor = luminance > 128 ? '#e0e4ea' : '#444';
}

function syncFromInput(input, slider) {
  let v = parseInt(input.value);
  if (isNaN(v)) return;
  v = clamp(v);
  input.value = v;
  slider.value = v;
  update();
}

sliderR.addEventListener('input', update);
sliderG.addEventListener('input', update);
sliderB.addEventListener('input', update);

valueR.addEventListener('input', () => syncFromInput(valueR, sliderR));
valueG.addEventListener('input', () => syncFromInput(valueG, sliderG));
valueB.addEventListener('input', () => syncFromInput(valueB, sliderB));

valueR.addEventListener('change', () => syncFromInput(valueR, sliderR));
valueG.addEventListener('change', () => syncFromInput(valueG, sliderG));
valueB.addEventListener('change', () => syncFromInput(valueB, sliderB));

update();

// Blend helpers
function blendScreen(a, b) {
  return a.map((v, i) => Math.round(255 - (255 - v) * (255 - b[i]) / 255));
}
function blendMultiply(a, b) {
  return a.map((v, i) => Math.round(v * b[i] / 255));
}
function parseCh(str) { return str.split(',').map(Number); }
function chToHex(ch) { return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join(''); }

const COLOR_NAMES = {
  'ff0000': '赤', '00ff00': '緑', '0000ff': '青',
  'ffff00': '黄', 'ff00ff': 'マゼンタ', '00ffff': 'シアン',
  'ffffff': '白', '000000': '黒',
};
function nameFromHex(hex) { return COLOR_NAMES[hex.slice(1)] || hex.toUpperCase(); }

// Flashlight demo (additive / screen)
const FL_COLORS = {
  '255,0,0': { name: '赤',  hex: '#ff0000', labelColor: '#ff4444' },
  '0,255,0': { name: '緑',  hex: '#00ff00', labelColor: '#22aa44' },
  '0,0,255': { name: '青',  hex: '#0000ff', labelColor: '#4488ff' },
};

function updateFlashlight() {
  const v1 = document.getElementById('flSel1').value;
  const v2 = document.getElementById('flSel2').value;
  const v3 = document.getElementById('flSel3').value;
  const c1 = FL_COLORS[v1], c2 = FL_COLORS[v2], c3 = FL_COLORS[v3];
  const mixCh = blendScreen(blendScreen(parseCh(v1), parseCh(v2)), parseCh(v3));
  const mixHex = chToHex(mixCh);

  document.getElementById('flBeam1').style.background = `rgb(${v1})`;
  document.getElementById('flBeam2').style.background = `rgb(${v2})`;
  document.getElementById('flBeam3').style.background = `rgb(${v3})`;
  document.getElementById('flDot1').style.background = c1.hex;
  document.getElementById('flDot2').style.background = c2.hex;
  document.getElementById('flDot3').style.background = c3.hex;

  ['flC1Name','flC2Name','flC3Name'].forEach((id, i) => {
    const c = [c1, c2, c3][i];
    const el = document.getElementById(id);
    el.textContent = c.name;
    el.style.color = c.labelColor;
  });

  document.getElementById('flMixSwatch').style.background = mixHex;
  document.getElementById('flMixName').textContent = nameFromHex(mixHex);
}

['flSel1','flSel2','flSel3'].forEach(id =>
  document.getElementById(id).addEventListener('change', updateFlashlight)
);
updateFlashlight();

// Ink mixing demo (subtractive / multiply)
const INK_COLORS = {
  '0,255,255':  { name: 'シアン',   hex: '#00ffff', labelColor: '#008888' },
  '255,0,255':  { name: 'マゼンタ', hex: '#ff00ff', labelColor: '#aa00aa' },
  '255,255,0':  { name: 'イエロー', hex: '#ffff00', labelColor: '#888800' },
};

function updateInk() {
  const v1 = document.getElementById('inkSel1').value;
  const v2 = document.getElementById('inkSel2').value;
  const v3 = document.getElementById('inkSel3').value;
  const c1 = INK_COLORS[v1], c2 = INK_COLORS[v2], c3 = INK_COLORS[v3];
  const mixCh = blendMultiply(blendMultiply(parseCh(v1), parseCh(v2)), parseCh(v3));
  const mixHex = chToHex(mixCh);

  document.getElementById('inkBlob1').style.background = `rgb(${v1})`;
  document.getElementById('inkBlob2').style.background = `rgb(${v2})`;
  document.getElementById('inkBlob3').style.background = `rgb(${v3})`;
  document.getElementById('inkDot1').style.background = c1.hex;
  document.getElementById('inkDot2').style.background = c2.hex;
  document.getElementById('inkDot3').style.background = c3.hex;

  ['inkC1Name','inkC2Name','inkC3Name'].forEach((id, i) => {
    const c = [c1, c2, c3][i];
    const el = document.getElementById(id);
    el.textContent = c.name;
    el.style.color = c.labelColor;
  });

  document.getElementById('inkMixSwatch').style.background = mixHex;
  document.getElementById('inkMixName').textContent = nameFromHex(mixHex);
}

['inkSel1','inkSel2','inkSel3'].forEach(id =>
  document.getElementById(id).addEventListener('change', updateInk)
);
updateInk();

document.querySelectorAll('.tip-card[data-r]').forEach(card => {
  const apply = () => {
    sliderR.value = card.dataset.r;
    sliderG.value = card.dataset.g;
    sliderB.value = card.dataset.b;
    update();
  };
  card.addEventListener('click', apply);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply(); }
  });
});
