const fs = require('fs');

const kilosPath = 'C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/official_kilos_final_complete.js';
let content = fs.readFileSync(kilosPath, 'utf8');

// 1. uetsu-main の差し替え
const uetsuKilos = {
  "niitsu": 0,
  "st-brs0y": 6.1,
  "st-iv3f": 10.2,
  "st-l5g3": 13.9,
  "st-i17d": 17.8,
  "st-dwbd": 21.5,
  "shibata": 26,
  "st-enff": 30.3,
  "st-pacp": 35.3,
  "st-dv4k": 39.1,
  "st-ec7uj": 44.7,
  "sakamachi": 48,
  "st-gmtg": 51.6,
  "st-e7dze": 55.2,
  "murakami": 59.4,
  "st-py9v": 66.5,
  "st-i95yom": 71.4,
  "st-i9bg": 78.3,
  "st-dx03": 82.6,
  "st-i948wd": 87.5,
  "st-ensb": 92.8,
  "st-glkf": 95.9,
  "st-nk7m4": 101,
  "st-dxp5v": 105.4,
  "st-1gxv9wd": 109.8,
  "st-bx0ls": 115.7,
  "st-e0jpq": 120.1,
  "st-dw03": 123.2,
  "st-ggld0e": 128.9,
  "st-ggi15m": 133.4,
  "tsuruoka": 139.4,
  "st-na8i": 146,
  "st-o4x8": 151.1,
  "amarume": 154.7,
  "st-cka30": 157.4,
  "st-l6tk": 160.4,
  "st-fuszz": 163.7,
  "sakata": 166.9,
  "st-i4lf": 173.3,
  "st-cyqix": 175.9,
  "st-oz7q": 179.1,
  "st-excd": 186.1,
  "st-g31o": 189.7,
  "st-e2cmi": 194.8,
  "st-dvgy": 198.5,
  "st-ohlq": 203.4,
  "st-peid": 208.9,
  "st-c7na6": 214.4,
  "st-o1fz": 221.8,
  "st-giih5n": 228.9,
  "st-gigqjh": 236,
  "st-hdhl": 240.2,
  "st-gie7a7": 245.5,
  "st-if8cd4": 249.2,
  "st-p2ay": 251.5,
  "st-dvht": 258.4,
  "st-ib07": 261.6,
  "st-hswr": 265.7,
  "st-gik622": 269,
  "akita": 271.7
};

// 2. kyushu-nagasaki & kyushu-nagasaki-nagayo
const nagasakiKilos = {
  "st-r9ap": 0,
  "shin-tosu": 3,
  "st-j97ij": 4.2,
  "st-dr82": 8.5,
  "st-111q3kx": 13.1,
  "st-l4ke": 15.7,
  "st-c97v9": 20.2,
  "st-e9gw": 25,
  "st-pkaz": 28,
  "st-buxvc": 31.4,
  "st-k1t6": 34.2,
  "st-iw0o": 39.6,
  "st-gkrb6m": 44.7,
  "st-gks12v": 49.4,
  "st-gkxyu7": 54.6,
  "st-j8xsk": 56.5,
  "st-gkkd8r": 61.5,
  "st-gkx5k9": 63.6,
  "st-fvdh": 67.7,
  "st-gkm9gn": 75.6,
  "st-e79zh": 82.3,
  "st-q81h": 84.7,
  "st-jdn4": 87.6,
  "st-g94g": 90.9,
  "st-gkwkbl": 95.6,
  "st-ftmrz": 97.8,
  "isahaya": 100.4,
  "st-kt7a5": 103.2,
  "st-cs6l8": 106.9,
  "st-gi81": 109.4,
  "st-gkljfo": 112.3,
  "st-k8tb": 114.8,
  "st-j1b8": 123.7,
  "nagasaki": 125.3
};

const nagayoKilos = {
  "st-cs6l8": 0,
  "st-i2m9": 2.5,
  "st-fvuq": 7.2,
  "st-fkfp0": 13.4,
  "st-punr": 15.4,
  "st-qzbs": 16.4,
  "st-ldtqb": 18.9,
  "st-ko1sz": 20.6,
  "st-j1b8": 23.5
};

// JSONパースして更新
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(content, sandbox);

// window.OFFICIAL_STATION_KILOS を抽出
// OFFICIAL_STATION_KILOS は内部スコープなので、パースするか正規表現置換
// content 内の "uetsu-main": { ... } と "kyushu-nagasaki": { ... } を置換
const uetsuStr = '"uetsu-main": ' + JSON.stringify(uetsuKilos, null, 4);
const nagasakiStr = '"kyushu-nagasaki": ' + JSON.stringify(nagasakiKilos, null, 4) + ',\n  "kyushu-nagasaki-nagayo": ' + JSON.stringify(nagayoKilos, null, 4);

content = content.replace(/"uetsu-main":\s*\{[\s\S]*?\n\s*\}/, uetsuStr);
content = content.replace(/"kyushu-nagasaki":\s*\{[\s\S]*?\n\s*\}/, nagasakiStr);

fs.writeFileSync(kilosPath, content, 'utf8');
console.log('Successfully updated uetsu-main and nagasaki kilos in scratch file.');
