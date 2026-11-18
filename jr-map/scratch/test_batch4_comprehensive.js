const fs = require('fs');
const vm = require('vm');

const sandbox = { window: {}, console, require, module: { exports: {} } };
vm.createContext(sandbox);

vm.runInContext(fs.readFileSync('jr-map/data/build-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('jr-map/data/official-kilos.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('jr-map/route-engine.js', 'utf8'), sandbox);

const RouteEngine = sandbox.window.JR_ROUTE_ENGINE;
const JR_STATIONS = sandbox.window.JR_STATIONS;
const JR_LINES = sandbox.window.JR_LINES;

sandbox.window.applyOfficialKilos(JR_LINES);
RouteEngine.buildGraph(JR_LINES, JR_STATIONS);

function getStationId(name, lineId) {
  const stationList = Object.values(JR_STATIONS);
  if (lineId) {
    const s = stationList.find(st => st.name === name && st.lines.includes(lineId));
    if (s) return s.id;
  }
  const s = stationList.find(st => st.name === name);
  if (!s) throw new Error('Station not found: ' + name);
  return s.id;
}

const tests = [
  // 1. 東京 → 新青森 (東北新幹線) 713.7 km
  {
    name: "東京 → 新青森 (東北新幹線全通)",
    start: getStationId("東京", "shinkansen-tohoku"),
    vias: [getStationId("仙台", "shinkansen-tohoku"), getStationId("盛岡", "shinkansen-tohoku")],
    goal: getStationId("新青森", "shinkansen-tohoku"),
    expectedKm: 713.7
  },
  // 2. 東京 → 盛岡 (東北本線在来線) 535.3 km
  {
    name: "東京 → 盛岡 (東北本線在来線全通)",
    start: getStationId("東京", "tohoku-main"),
    vias: [getStationId("宇都宮", "tohoku-main"), getStationId("黒磯", "tohoku-main"), getStationId("郡山", "tohoku-main"), getStationId("福島", "tohoku-main"), getStationId("仙台", "tohoku-main"), getStationId("一ノ関", "tohoku-main")],
    goal: getStationId("盛岡", "tohoku-main"),
    expectedKm: 535.3
  },
  // 3. 福島 → 青森 (奥羽本線全通) 484.5 km
  {
    name: "福島 → 青森 (奥羽本線全通)",
    start: getStationId("福島", "ou-main"),
    vias: [getStationId("山形", "ou-main"), getStationId("新庄", "ou-main"), getStationId("横手", "ou-main"), getStationId("秋田", "ou-main"), getStationId("大館", "ou-main"), getStationId("弘前", "ou-main")],
    goal: getStationId("青森", "ou-main"),
    expectedKm: 484.5
  },
  // 4. 新津 → 秋田 (羽越本線全通) 271.7 km
  {
    name: "新津 → 秋田 (羽越本線全通)",
    start: getStationId("新津", "uetsu-main"),
    vias: [getStationId("坂町", "uetsu-main"), getStationId("鶴岡", "uetsu-main"), getStationId("酒田", "uetsu-main")],
    goal: getStationId("秋田", "uetsu-main"),
    expectedKm: 271.7
  },
  // 5. 郡山 → 新津 (磐越西線全通) 175.6 km
  {
    name: "郡山 → 新津 (磐越西線全通)",
    start: getStationId("郡山", "banetsu-west"),
    vias: [getStationId("会津若松", "banetsu-west"), getStationId("喜多方", "banetsu-west")],
    goal: getStationId("新津", "banetsu-west"),
    expectedKm: 175.6
  },
  // 6. いわき → 郡山 (磐越東線全通) 85.6 km
  {
    name: "いわき → 郡山 (磐越東線全通)",
    start: getStationId("いわき", "banetsu-east"),
    vias: [getStationId("小野新町", "banetsu-east")],
    goal: getStationId("郡山", "banetsu-east"),
    expectedKm: 85.6
  },
  // 7. 仙台 → 羽前千歳 (仙山線全通) 58.0 km
  {
    name: "仙台 → 羽前千歳 (仙山線全通)",
    start: getStationId("仙台", "senzan-line"),
    vias: [getStationId("作並", "senzan-line")],
    goal: getStationId("羽前千歳", "senzan-line"),
    expectedKm: 58.0
  },
  // 8. あおば通 → 石巻 (仙石線全通) 49.0 km
  {
    name: "あおば通 → 石巻 (仙石線全通)",
    start: getStationId("あおば通", "senseki-line"),
    vias: [getStationId("多賀城", "senseki-line")],
    goal: getStationId("石巻", "senseki-line"),
    expectedKm: 49.0
  },
  // 9. 函館 → 旭川 (函館本線全通) 423.1 km
  {
    name: "函館 → 旭川 (函館本線全通: 本線小樽・札幌経由)",
    start: getStationId("函館", "hokkaido-hakodate"),
    vias: [getStationId("森", "hokkaido-hakodate"), getStationId("長万部", "hokkaido-hakodate"), getStationId("小樽", "hokkaido-hakodate"), getStationId("札幌", "hokkaido-hakodate"), getStationId("岩見沢", "hokkaido-hakodate"), getStationId("滝川", "hokkaido-hakodate")],
    goal: getStationId("旭川", "hokkaido-hakodate"),
    expectedKm: 423.1
  },
  // 10. 沼ノ端 → 白石 (千歳線全通) 56.6 km
  {
    name: "沼ノ端 → 白石 (千歳線全通)",
    start: getStationId("沼ノ端", "hokkaido-chitose"),
    vias: [getStationId("千歳", "hokkaido-chitose")],
    goal: getStationId("白石", "hokkaido-chitose"),
    expectedKm: 56.6
  },
  // 11. 長万部 → 岩見沢 (室蘭本線本線全通) 211.0 km
  {
    name: "長万部 → 岩見沢 (室蘭本線全通)",
    start: getStationId("長万部", "hokkaido-muroran"),
    vias: [getStationId("東室蘭", "hokkaido-muroran"), getStationId("苫小牧", "hokkaido-muroran"), getStationId("追分", "hokkaido-muroran")],
    goal: getStationId("岩見沢", "hokkaido-muroran"),
    expectedKm: 211.0
  },
  // 12. 南千歳 → 新得 (石勝線全通) 132.4 km
  {
    name: "南千歳 → 新得 (石勝線全通)",
    start: getStationId("南千歳", "hokkaido-sekisho"),
    vias: [getStationId("新夕張", "hokkaido-sekisho")],
    goal: getStationId("新得", "hokkaido-sekisho"),
    expectedKm: 132.4
  },
  // 13. 旭川 → 稚内 (宗谷本線全通) 259.4 km
  {
    name: "旭川 → 稚内 (宗谷本線全通)",
    start: getStationId("旭川", "hokkaido-soya"),
    vias: [getStationId("名寄", "hokkaido-soya"), getStationId("音威子府", "hokkaido-soya")],
    goal: getStationId("稚内", "hokkaido-soya"),
    expectedKm: 259.4
  },
  // 14. 桑園 → 北海道医療大学 (札沼線全通) 28.9 km
  {
    name: "桑園 → 北海道医療大学 (札沼線全通)",
    start: getStationId("桑園", "hokkaido-sassho"),
    vias: [getStationId("あいの里教育大", "hokkaido-sassho")],
    goal: getStationId("北海道医療大学", "hokkaido-sassho"),
    expectedKm: 28.9
  },
  // 15. 博多 → 鹿児島中央 (九州新幹線) 288.9 km
  {
    name: "博多 → 鹿児島中央 (九州新幹線全通)",
    start: getStationId("博多", "shinkansen-kyushu"),
    vias: [getStationId("熊本", "shinkansen-kyushu"), getStationId("新八代", "shinkansen-kyushu")],
    goal: getStationId("鹿児島中央", "shinkansen-kyushu"),
    expectedKm: 288.9
  },
  // 16. 門司港 → 八代 (鹿児島本線北部在来線全通) 232.3 km
  {
    name: "門司港 → 八代 (鹿児島本線在来線全通)",
    start: getStationId("門司港", "kyushu-kagoshima"),
    vias: [getStationId("折尾", "kyushu-kagoshima"), getStationId("南福岡", "kyushu-kagoshima"), getStationId("大牟田", "kyushu-kagoshima"), getStationId("熊本", "kyushu-kagoshima")],
    goal: getStationId("八代", "kyushu-kagoshima"),
    expectedKm: 232.3
  },
  // 17. 鳥栖 → 長崎 (長崎本線本線全通) 125.3 km
  {
    name: "鳥栖 → 長崎 (長崎本線全通)",
    start: getStationId("鳥栖", "kyushu-nagasaki"),
    vias: [getStationId("佐賀", "kyushu-nagasaki"), getStationId("肥前鹿島", "kyushu-nagasaki"), getStationId("諫早", "kyushu-nagasaki"), getStationId("現川", "kyushu-nagasaki")],
    goal: getStationId("長崎", "kyushu-nagasaki"),
    expectedKm: 125.3
  },
  // 18. 江北 → 佐世保 (佐世保線全通) 48.8 km
  {
    name: "江北 → 佐世保 (佐世保線全通)",
    start: getStationId("江北", "kyushu-sasebo"),
    vias: [getStationId("武雄温泉", "kyushu-sasebo"), getStationId("早岐", "kyushu-sasebo")],
    goal: getStationId("佐世保", "kyushu-sasebo"),
    expectedKm: 48.8
  },
  // 19. 早岐 → 諫早 (大村線全通) 47.6 km
  {
    name: "早岐 → 諫早 (大村線全通)",
    start: getStationId("早岐", "kyushu-omura"),
    vias: [getStationId("ハウステンボス", "kyushu-omura"), getStationId("大村", "kyushu-omura")],
    goal: getStationId("諫早", "kyushu-omura"),
    expectedKm: 47.6
  },
  // 20. 久留米 → 大分 (久大本線全通) 141.5 km
  {
    name: "久留米 → 大分 (久大本線全通)",
    start: getStationId("久留米", "kyushu-kyudai"),
    vias: [getStationId("日田", "kyushu-kyudai"), getStationId("由布院", "kyushu-kyudai")],
    goal: getStationId("大分", "kyushu-kyudai"),
    expectedKm: 141.5
  },
  // 21. 宇土 → 三角 (三角線全通) 25.6 km
  {
    name: "宇土 → 三角 (三角線全通)",
    start: getStationId("宇土", "kyushu-misumi"),
    vias: [getStationId("網田", "kyushu-misumi")],
    goal: getStationId("三角", "kyushu-misumi"),
    expectedKm: 25.6
  },
  // 22. 鹿児島中央 → 枕崎 (指宿枕崎線全通) 87.8 km
  {
    name: "鹿児島中央 → 枕崎 (指宿枕崎線全通)",
    start: getStationId("鹿児島中央", "kyushu-ibusuki"),
    vias: [getStationId("喜入", "kyushu-ibusuki"), getStationId("指宿", "kyushu-ibusuki"), getStationId("山川", "kyushu-ibusuki")],
    goal: getStationId("枕崎", "kyushu-ibusuki"),
    expectedKm: 87.8
  },
  // 23. 南宮崎 → 志布志 (日南線全通) 88.9 km
  {
    name: "南宮崎 → 志布志 (日南線全通)",
    start: getStationId("南宮崎", "kyushu-nichinan"),
    vias: [getStationId("青島", "kyushu-nichinan"), getStationId("油津", "kyushu-nichinan")],
    goal: getStationId("志布志", "kyushu-nichinan"),
    expectedKm: 88.9
  },
  // 24. 若松 → 原田 (筑豊本線全通) 66.1 km
  {
    name: "若松 → 原田 (筑豊本線全通)",
    start: getStationId("若松", "kyushu-chikuho"),
    vias: [getStationId("折尾", "kyushu-chikuho"), getStationId("直方", "kyushu-chikuho"), getStationId("新飯塚", "kyushu-chikuho"), getStationId("桂川", "kyushu-chikuho")],
    goal: getStationId("原田", "kyushu-chikuho"),
    expectedKm: 66.1
  },
  // 25. 吉塚 → 桂川 (篠栗線全通) 25.1 km
  {
    name: "吉塚 → 桂川 (篠栗線全通)",
    start: getStationId("吉塚", "kyushu-sasaguri"),
    vias: [getStationId("篠栗", "kyushu-sasaguri")],
    goal: getStationId("桂川", "kyushu-sasaguri"),
    expectedKm: 25.1
  },
  // 26. 西戸崎 → 宇美 (香椎線全通) 25.4 km
  {
    name: "西戸崎 → 宇美 (香椎線全通)",
    start: getStationId("西戸崎", "kyushu-kashii"),
    vias: [getStationId("香椎", "kyushu-kashii")],
    goal: getStationId("宇美", "kyushu-kashii"),
    expectedKm: 25.4
  },
  // 27. 田川後藤寺 → 新飯塚 (後藤寺線全通) 13.3 km
  {
    name: "田川後藤寺 → 新飯塚 (後藤寺線全通)",
    start: getStationId("田川後藤寺", "kyushu-gotoji"),
    vias: [getStationId("船尾", "kyushu-gotoji")],
    goal: getStationId("新飯塚", "kyushu-gotoji"),
    expectedKm: 13.3
  }
];

let failedCount = 0;
for (const t of tests) {
  try {
    const result = RouteEngine.searchMarsRoute(t.start, t.vias, t.goal);
    if (!result) {
      console.error(`[FAIL] ${t.name}: Route not found`);
      failedCount++;
      continue;
    }

    const dist = result.totalDist;
    const diff = Math.abs(dist - t.expectedKm);
    const hasEst = result.hasEstimatedDistance;

    if (diff > 0.1 || hasEst) {
      console.error(`[FAIL] ${t.name}: expected ${t.expectedKm} km, got ${dist} km. hasEstimated: ${hasEst}`);
      result.lineRuns.forEach(lr => console.log(`       run: ${lr.lineName} ${lr.fromName} -> ${lr.toName} ${lr.dist}km`));
      failedCount++;
    } else {
      console.log(`[PASS] ${t.name}: ${dist} km (matches ${t.expectedKm} km, official 100%)`);
    }
  } catch (err) {
    console.error(`[ERROR] ${t.name}: ${err.message}`);
    failedCount++;
  }
}

console.log(`\nVerification finished: ${tests.length - failedCount}/${tests.length} passed.`);
if (failedCount > 0) process.exit(1);
