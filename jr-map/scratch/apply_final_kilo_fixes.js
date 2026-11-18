const fs = require('fs');

const finalAllKilos = JSON.parse(fs.readFileSync('C:/Users/Takato Wakuda/.gemini/antigravity-cli/brain/0fed1d73-5ea9-469b-b408-e44b39e3be6d/scratch/final_all_kilos.json', 'utf8'));

// 1. 羽越本線 (uetsu-main) の下浜・桂根・新屋キロ修正
finalAllKilos['uetsu-main']['道川'] = 251.8;
finalAllKilos['uetsu-main']['st-p2ay'] = 251.8;
finalAllKilos['uetsu-main']['下浜'] = 258.4;
finalAllKilos['uetsu-main']['st-dvht'] = 258.4;
finalAllKilos['uetsu-main']['桂根'] = 261.7;
finalAllKilos['uetsu-main']['st-ib07'] = 261.7;
finalAllKilos['uetsu-main']['新屋'] = 265.7;
finalAllKilos['uetsu-main']['st-hswr'] = 265.7;
finalAllKilos['uetsu-main']['羽後牛島'] = 269.0;
finalAllKilos['uetsu-main']['st-gik622'] = 269.0;
finalAllKilos['uetsu-main']['秋田'] = 271.7;
finalAllKilos['uetsu-main']['akita'] = 271.7;

// 2. 宗谷本線 (hokkaido-soya) の名寄高校修正 (74.7km)
finalAllKilos['hokkaido-soya']['名寄高校'] = 74.7;
finalAllKilos['hokkaido-soya']['st-aztx40'] = 74.7;

// 3. 千歳線空港支線 (hokkaido-chitose-airport)
finalAllKilos['hokkaido-chitose-airport'] = {
  "南千歳": 0.0, "st-cm78n": 0.0,
  "新千歳空港": 2.6, "st-1hea2id": 2.6
};

// 4. 室蘭本線室蘭支線 (hokkaido-muroran-branch)
finalAllKilos['hokkaido-muroran-branch'] = {
  "東室蘭": 0.0, "st-flrne": 0.0,
  "輪西": 2.3, "st-p3th": 2.3,
  "御崎": 4.2, "st-gryl": 4.2,
  "母恋": 5.4, "st-iv4u": 5.4,
  "室蘭": 7.0, "st-gbnt": 7.0
};

// 5. 函館本線砂原支線 (hokkaido-hakodate-sawara) 大沼(0) 〜 森(35.3)
finalAllKilos['hokkaido-hakodate-sawara'] = {
  "大沼": 0.0, "st-fred": 0.0,
  "鹿部": 14.6, "st-rr61": 14.6,
  "渡島沼尻": 20.4, "st-ea73qs": 20.4,
  "渡島砂原": 25.3, "st-ea8z2q": 25.3,
  "掛澗": 30.0, "st-hjz0": 30.0,
  "尾白内": 33.1, "st-e2zqe": 33.1,
  "東森": 35.4, "st-i659": 35.4,
  "森": 35.3, "st-kq6": 35.3
};

// 6. 函館本線本線の駅（砂原支線駅削除）
delete finalAllKilos['hokkaido-hakodate']['東森'];
delete finalAllKilos['hokkaido-hakodate']['st-i659'];
delete finalAllKilos['hokkaido-hakodate']['尾白内'];
delete finalAllKilos['hokkaido-hakodate']['st-e2zqe'];
delete finalAllKilos['hokkaido-hakodate']['掛澗'];
delete finalAllKilos['hokkaido-hakodate']['st-hjz0'];
delete finalAllKilos['hokkaido-hakodate']['渡島砂原'];
delete finalAllKilos['hokkaido-hakodate']['st-ea8z2q'];
delete finalAllKilos['hokkaido-hakodate']['渡島沼尻'];
delete finalAllKilos['hokkaido-hakodate']['st-ea73qs'];
delete finalAllKilos['hokkaido-hakodate']['鹿部'];
delete finalAllKilos['hokkaido-hakodate']['st-rr61'];

// 7. 室蘭本線本線の駅（室蘭支線駅削除）
delete finalAllKilos['hokkaido-muroran']['輪西'];
delete finalAllKilos['hokkaido-muroran']['st-p3th'];
delete finalAllKilos['hokkaido-muroran']['御崎'];
delete finalAllKilos['hokkaido-muroran']['st-gryl'];
delete finalAllKilos['hokkaido-muroran']['母恋'];
delete finalAllKilos['hokkaido-muroran']['st-iv4u'];
delete finalAllKilos['hokkaido-muroran']['室蘭'];
delete finalAllKilos['hokkaido-muroran']['st-gbnt'];

// 8. 千歳線本線の駅（新千歳空港削除）
delete finalAllKilos['hokkaido-chitose']['新千歳空港'];
delete finalAllKilos['hokkaido-chitose']['st-1hea2id'];

console.log('Total lines in finalAllKilos:', Object.keys(finalAllKilos).length);

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
console.log('Regenerated official_kilos_final_complete.js, size:', outJs.length);
