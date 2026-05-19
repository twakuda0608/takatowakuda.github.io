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
