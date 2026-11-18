const fs = require('fs');
const path = require('path');

const kilosModule = require(path.resolve(__dirname, '../data/official-kilos.js'));
const allKilos = kilosModule.OFFICIAL_STATION_KILOS;

// 1. 和田岬線 (sanyo-wadamisaki)
allKilos['sanyo-wadamisaki'] = {
  "兵庫": 0.0,
  "和田岬": 2.7,
  "st-edhy": 0.0,
  "st-cy96w": 2.7
};

// 2. 仙崎支線 (sanin-senzaki)
allKilos['sanin-senzaki'] = {
  "長門市": 0.0,
  "仙崎": 2.2,
  "st-mm2ih": 0.0,
  "st-dx79": 2.2
};

// 3. 予讃線新線 (shikoku-yosan-new: 向井原〜内子〜新谷〜伊予大洲)
allKilos['shikoku-yosan-new'] = {
  "向井原": 0.0,
  "st-cp3sr": 0.0,
  "伊予大平": 2.8,
  "st-aatoiy": 2.8,
  "伊予中山": 10.2,
  "st-aarswy": 10.2,
  "伊予立川": 16.9,
  "st-aazeeo": 16.9,
  "内子": 23.5,
  "st-ed7v": 23.5,
  "五十崎": 25.1,
  "st-edg0a": 25.1,
  "喜多山": 27.2,
  "st-cwlhq": 27.2,
  "新谷": 28.8,
  "st-i2dj": 28.8,
  "伊予大洲": 34.7,
  "st-aatrft": 34.7
};

// 4. 山陽新幹線 (shinkansen-sanyo: 並行在来線営業キロ準拠)
allKilos['shinkansen-sanyo'] = {
  "新大阪": 0.0, "shin-osaka": 0.0,
  "新神戸": 36.9, "shin-kobe": 36.9,
  "西明石": 59.7, "nishi-akashi": 59.7,
  "姫路": 91.7, "himeji": 91.7,
  "相生": 112.4, "aioi": 112.4,
  "岡山": 180.3, "okayama": 180.3,
  "新倉敷": 202.8, "shin-kurashiki": 202.8,
  "福山": 238.6, "fukuyama": 238.6,
  "新尾道": 257.3, "shin-onomichi": 257.3,
  "三原": 270.2, "mihara": 270.2,
  "東広島": 318.8, "higashi-hiroshima": 318.8,
  "広島": 341.6, "hiroshima": 341.6,
  "新岩国": 383.0, "shin-iwakuni": 383.0,
  "徳山": 426.7, "tokuyama": 426.7,
  "新山口": 474.2, "shin-yamaguchi": 474.2,
  "厚狭": 507.0, "asa": 507.0,
  "新下関": 531.0, "shin-shimonoseki": 531.0,
  "小倉": 549.9, "kokura": 549.9,
  "博多": 617.1, "hakata": 617.1
};

// 5. tokaido-west の新大阪を 552.6 に修正
allKilos['tokaido-west']['新大阪'] = 552.6;
allKilos['tokaido-west']['shin-osaka'] = 552.6;

// 6. 山陽本線 (sanyo-main) の和田岬削除
delete allKilos['sanyo-main']['和田岬'];
delete allKilos['sanyo-main']['st-cy96w'];

// 7. 山陰本線 (sanin-main) の仙崎削除
delete allKilos['sanin-main']['仙崎'];
delete allKilos['sanin-main']['st-dx79'];

console.log('Total lines in allKilos:', Object.keys(allKilos).length);

// 出力JS生成
const outJs = `// JR公式営業キロ程データ (第1弾: 新幹線・関東甲信越 ＋ 第2弾: 東海・北陸 ＋ 第3弾: 近畿・中国・四国全線)
// ※JR時刻表・旅客営業規則に基づく公式累計営業キロ (省略なし完全版)
(function() {
  const OFFICIAL_STATION_KILOS = ${JSON.stringify(allKilos, null, 2)};

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
  'C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/official_kilos_updated.js',
  outJs,
  'utf8'
);
console.log('Generated official_kilos_updated.js, size:', outJs.length);
