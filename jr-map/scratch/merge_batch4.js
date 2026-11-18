const fs = require('fs');

const part1 = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_part1_built.json', 'utf8'));
const part2 = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_part2_built.json', 'utf8'));
const part3 = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_part3_built.json', 'utf8'));
const part4 = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/batch4_part4_built.json', 'utf8'));

const batch4All = Object.assign({}, part1, part2, part3, part4);
console.log('Batch 4 total lines:', Object.keys(batch4All).length);

// 既存の official-kilos.js を読み込む
const path = require('path');
const existingKilos = require(path.resolve(__dirname, '../data/official-kilos.js')).OFFICIAL_STATION_KILOS;
console.log('Existing lines in official-kilos.js:', Object.keys(existingKilos).length);

const finalAllKilos = Object.assign({}, existingKilos, batch4All);
console.log('Final all lines count:', Object.keys(finalAllKilos).length);

fs.writeFileSync(
  'C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/final_all_kilos.json',
  JSON.stringify(finalAllKilos),
  'utf8'
);

// 出力JS生成
const outJs = `// JR公式営業キロ程データ (全国JR全路線・全駅完全網羅版: 新幹線・在来線幹線・地方交通線・支線)
// ※JR時刻表・旅客営業規則に基づく公式累計営業キロ (省略なし完全版)
(function() {
  const OFFICIAL_STATION_KILOS = ${JSON.stringify(finalAllKilos, null, 2)};

  function applyOfficialKilos(lines) {
    if (!lines || !Array.isArray(lines)) return;
    lines.forEach(line => {
      if (OFFICIAL_STATION_KILOS[line.id]) {
        line.stationKilos = Object.assign({}, line.stationKilos || {}, OFFICIAL_STATION_KILOS[line.id]);
      }
    });
  }

  if (typeof window !== "undefined") {
    window.JR_OFFICIAL_KILOS = OFFICIAL_STATION_KILOS;
    window.applyOfficialKilos = applyOfficialKilos;
    if (window.JR_LINES) {
      applyOfficialKilos(window.JR_LINES);
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      OFFICIAL_STATION_KILOS,
      BATCH1_STATION_KILOS: OFFICIAL_STATION_KILOS,
      applyOfficialKilos
    };
  }
})();
`;

fs.writeFileSync(
  'C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/official_kilos_final_complete.js',
  outJs,
  'utf8'
);
console.log('Generated official_kilos_final_complete.js, size:', outJs.length);
