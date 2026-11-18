const fs = require('fs');

// 1. build-data.js の長崎本線更新
const buildDataPath = 'jr-map/data/build-data.js';
let buildData = fs.readFileSync(buildDataPath, 'utf8');

const oldNagasakiSection = `    "id": "kyushu-nagasaki",
    "name": "長崎本線",
    "en": "Nagasaki Main Line",
    "category": "kyushu",
    "color": "#00a3e0",
    "textColor": "#ffffff",
    "code": "JH",
    "description": "鳥栖から佐賀・江北・諫早を経て長崎を結ぶ西九州幹線。",
    "stations": [
      "st-r9ap",
      "shin-tosu",
      "st-j97ij",
      "st-dr82",
      "st-111q3kx",
      "st-l4ke",
      "st-c97v9",
      "st-e9gw",
      "st-pkaz",
      "st-buxvc",
      "st-k1t6",
      "st-iw0o",
      "st-gkrb6m",
      "st-gks12v",
      "st-gkxyu7",
      "st-j8xsk",
      "st-gkkd8r",
      "st-gkx5k9",
      "st-fvdh",
      "st-gkm9gn",
      "st-e79zh",
      "st-q81h",
      "st-jdn4",
      "st-g94g",
      "st-gkwkbl",
      "st-ftmrz",
      "isahaya",
      "st-kt7a5",
      "st-cs6l8",
      "st-gi81",
      "st-gkljfo",
      "st-k8tb",
      "st-fkfp0",
      "st-punr",
      "st-qzbs",
      "st-ldtqb",
      "st-ko1sz",
      "st-j1b8",
      "nagasaki",
      "st-fvuq",
      "st-i2m9"
    ]`;

const newNagasakiSection = `    "id": "kyushu-nagasaki",
    "name": "長崎本線",
    "en": "Nagasaki Main Line",
    "category": "kyushu",
    "color": "#00a3e0",
    "textColor": "#ffffff",
    "code": "JH",
    "description": "鳥栖から佐賀・江北・諫早を経て長崎を結ぶ西九州幹線。",
    "stations": [
      "st-r9ap",
      "shin-tosu",
      "st-j97ij",
      "st-dr82",
      "st-111q3kx",
      "st-l4ke",
      "st-c97v9",
      "st-e9gw",
      "st-pkaz",
      "st-buxvc",
      "st-k1t6",
      "st-iw0o",
      "st-gkrb6m",
      "st-gks12v",
      "st-gkxyu7",
      "st-j8xsk",
      "st-gkkd8r",
      "st-gkx5k9",
      "st-fvdh",
      "st-gkm9gn",
      "st-e79zh",
      "st-q81h",
      "st-jdn4",
      "st-g94g",
      "st-gkwkbl",
      "st-ftmrz",
      "isahaya",
      "st-kt7a5",
      "st-cs6l8",
      "st-gi81",
      "st-gkljfo",
      "st-k8tb",
      "st-j1b8",
      "nagasaki"
    ]
  },
  {
    "id": "kyushu-nagasaki-nagayo",
    "name": "長崎本線（長与支線）",
    "en": "Nagasaki Main Line (Nagayo Branch)",
    "category": "kyushu",
    "color": "#00a3e0",
    "textColor": "#ffffff",
    "code": "JH",
    "description": "喜々津から大草・長与を経て浦上を結ぶ長崎本線の旧線区間。",
    "stations": [
      "st-cs6l8",
      "st-i2m9",
      "st-fvuq",
      "st-fkfp0",
      "st-punr",
      "st-qzbs",
      "st-ldtqb",
      "st-ko1sz",
      "st-j1b8"
    ]`;

const isCrlf = buildData.includes('\r\n');
const normBuild = buildData.replace(/\r\n/g, '\n');
const normOld = oldNagasakiSection.replace(/\r\n/g, '\n');
const normNew = newNagasakiSection.replace(/\r\n/g, '\n');

if (normBuild.includes(normOld)) {
  const updatedNorm = normBuild.replace(normOld, normNew);
  const finalBuild = isCrlf ? updatedNorm.replace(/\n/g, '\r\n') : updatedNorm;
  fs.writeFileSync(buildDataPath, finalBuild, 'utf8');
  console.log('build-data.js updated successfully (nagasaki split).');
} else {
  console.log('old nagasaki section not found in build-data.js!');
}
