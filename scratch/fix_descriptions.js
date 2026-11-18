const fs = require('fs');

const dataCode = fs.readFileSync('jr-map/data/build-data.js', 'utf8');
const window = {};
eval(dataCode);

const lines = window.JR_LINES;
const stations = window.JR_STATIONS;

const lineMeta = {
  'chuo-main': {
    en: 'Chuo Main Line',
    description: '東京〜甲府〜塩尻を結ぶ主要幹線'
  },
  'tohoku-main': {
    en: 'Tohoku Main Line',
    description: '東京〜宇都宮〜仙台〜盛岡を結ぶ東北の大動脈'
  },
  'joban': {
    en: 'Joban Line',
    description: '日暮里〜水戸〜いわき〜岩沼を結ぶ主要幹線'
  },
  'ou-main': {
    en: 'Ou Main Line',
    description: '福島〜山形〜秋田〜青森を結ぶ奥羽山脈縦断幹線'
  },
  'uetsu-main': {
    en: 'Uetsu Main Line',
    description: '新津〜鶴岡〜酒田〜秋田を結ぶ日本海縦貫幹線'
  },
  'oito-line': {
    en: 'Oito Line',
    description: '松本〜信濃大町〜南小谷〜糸魚川を結ぶ北アルプス山麓線'
  }
};

lines.forEach(l => {
  if (lineMeta[l.id]) {
    l.en = lineMeta[l.id].en;
    l.description = lineMeta[l.id].description;
  }
});

// 検証: 全ラインで en と description が存在するか
let missingCount = 0;
lines.forEach(l => {
  if (!l.en || !l.description) {
    console.error(`Still missing en/desc: [${l.id}] ${l.name}`);
    missingCount++;
  }
});

if (missingCount === 0) {
  console.log('All lines now have en and description!');
}

const outBrainDir = 'C:\\Users\\Takato Wakuda\\.gemini\\antigravity-cli\\brain\\718ddd58-6a5a-4862-8418-dedf5e77c519\\scratch\\';
const buildDataContent = `// JR East & Nationwide Stations and Lines Data
(function() {
  const JR_LINES = ${JSON.stringify(lines, null, 2)};
  const JR_STATIONS = ${JSON.stringify(stations, null, 2)};

  if (typeof window !== 'undefined') {
    window.JR_LINES = JR_LINES;
    window.JR_STATIONS = JR_STATIONS;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JR_LINES, JR_STATIONS };
  }
})();
`;

fs.writeFileSync(outBrainDir + 'build-data-fixed-desc.js', buildDataContent, 'utf8');
console.log('Successfully written build-data-fixed-desc.js');
