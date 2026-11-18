const fs = require('fs');
const path = require('path');
const { JR_STATIONS, JR_LINES } = require(path.resolve(__dirname, '../data/build-data.js'));

const corrections = {
  'hokkaido-hakodate': { '仁木': 228.2 },
  'hokkaido-nemuro': { '別当賀': 414.5, '落石': 424.8 },
  'tokai-tokaido': { '金山': 362.7, '尾頭橋': 363.6 },
  'tokai-minobu': {
    '下部温泉': 51.7, '甲斐常葉': 54.1, '市ノ瀬': 56.1, '久那土': 58.8, '甲斐岩間': 60.3, '落居': 61.8
  },
  'tokaido-west': {
    '守山': 487.0, '栗東': 489.1, '草津': 491.4, '南草津': 493.9, '瀬田': 496.6,
    '石山': 499.1, '膳所': 501.9, '大津': 503.6, '山科': 508.1,
    '塚本': 559.8, '尼崎': 564.1, '立花': 567.1, '甲子園口': 569.3,
    '西宮': 571.8, 'さくら夙川': 573.3, '芦屋': 575.6
  },
  'kisei-west': {
    '印南': 309.3, '稲原': 313.6, '和佐': 320.4, '下里': 201.1
  },
  'kishin-line': {
    '東津山': 83.7, '津山': 86.3, '院庄': 90.8, '美作千代': 95.6, '坪井': 98.3
  },
  'himi-line': {
    '越中国分': 9.0
  },
  'shikoku-yosan': {
    '高野川': 213.9, '伊予上灘': 217.1
  },
  'kyushu-hohi': {
    '滝尾': 5.1, '中判田': 11.7, '犬飼': 22.8, '三重町': 36.1, '緒方': 47.7, '朝地': 54.1,
    '豊後竹田': 60.0, '玉来': 63.1, '宮地': 94.6, 'いこいの村': 96.8, '阿蘇': 98.1,
    '内牧': 101.6, '市ノ川': 105.4, '赤水': 107.8, '立野': 115.7, '瀬田': 120.8,
    '肥後大津': 125.4, '原水': 129.1, '三里木': 132.2, '光の森': 133.2, '武蔵塚': 135.1,
    '竜田口': 139.1, '東海学園前': 140.2, '水前寺': 142.2, '新水前寺': 142.8, '南熊本': 144.4, '平成': 145.3
  },
  'kyushu-ibusuki': {
    '薩摩塩屋': 79.9
  },
  'kyushu-nichinan': {
    '内之田': 37.1, '飫肥': 39.8, '日南': 43.8, '油津': 46.0, '大堂津': 50.3, '南郷': 53.0, '谷之口': 56.1
  }
};

// Build station name to id mapping for each line
const nameToIdByLine = {};
for (const line of JR_LINES) {
  nameToIdByLine[line.id] = {};
  for (const stId of line.stations) {
    const st = JR_STATIONS[stId];
    if (st) {
      nameToIdByLine[line.id][st.name] = st.id;
    }
  }
}

const officialKilosPath = path.resolve(__dirname, '../data/official-kilos.js');
const lines = fs.readFileSync(officialKilosPath, 'utf8').split('\n');
const updatedLines = lines.map(lineStr => {
  const m = lineStr.match(/^\s*"([^"]+)":\s*(\{[^}]+\})(,?)$/);
  if (!m) return lineStr;
  const lineId = m[1];
  const trailingComma = m[3];
  if (!corrections[lineId]) return lineStr;

  const obj = JSON.parse(m[2]);
  const corr = corrections[lineId];
  for (const [stName, val] of Object.entries(corr)) {
    obj[stName] = val;
    const stId = nameToIdByLine[lineId]?.[stName];
    if (stId) obj[stId] = val;
  }
  return `    "${lineId}": ${JSON.stringify(obj)}${trailingComma}`;
});

fs.writeFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/official-kilos-updated2.js', updatedLines.join('\n'));
console.log('Saved official-kilos-updated2.js');
