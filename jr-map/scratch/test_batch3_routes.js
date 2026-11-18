const fs = require('fs');
const vm = require('vm');

const sandbox = {
  window: {},
  console: console,
  require: require,
  module: { exports: {} }
};
vm.createContext(sandbox);

// 1. build-data.js
vm.runInContext(fs.readFileSync('jr-map/data/build-data.js', 'utf8'), sandbox);

// 2. official-kilos.js
vm.runInContext(fs.readFileSync('jr-map/data/official-kilos.js', 'utf8'), sandbox);

// 3. route-engine.js
vm.runInContext(fs.readFileSync('jr-map/route-engine.js', 'utf8'), sandbox);

const RouteEngine = sandbox.window.JR_ROUTE_ENGINE;
const JR_STATIONS = sandbox.window.JR_STATIONS;
const JR_LINES = sandbox.window.JR_LINES;

sandbox.window.applyOfficialKilos(JR_LINES);
RouteEngine.buildGraph(JR_LINES, JR_STATIONS);

function getStationId(name) {
  const stationList = Object.values(JR_STATIONS);
  const s = stationList.find(st => st.name === name);
  if (!s) throw new Error('Station not found: ' + name);
  return s.id;
}

const tests = [
  {
    name: "東京 → 山口 (東海道・山陽・山口線経由)",
    start: "東京",
    vias: ["神戸", "柳井"], // 在来線山陽本線経由
    goal: "山口",
    expectedKm: 1061.4
  },
  {
    name: "米原 → 神戸 (東海道本線西全通)",
    start: "米原",
    vias: ["京都", "大阪"],
    goal: "神戸",
    expectedKm: 143.6
  },
  {
    name: "京都 → 大阪 (東海道本線)",
    start: "京都",
    vias: [],
    goal: "大阪",
    expectedKm: 42.8
  },
  {
    name: "大阪 → 神戸 (東海道本線)",
    start: "大阪",
    vias: [],
    goal: "神戸",
    expectedKm: 33.1
  },
  {
    name: "神戸 → 下関 (山陽本線全通: 柳井経由本線)",
    start: "神戸",
    vias: ["岡山", "広島", "柳井"],
    goal: "下関",
    expectedKm: 528.1
  },
  {
    name: "下関 → 門司 (山陽本線関門トンネル区間)",
    start: "下関",
    vias: [],
    goal: "門司",
    expectedKm: 6.3
  },
  {
    name: "京都 → 幡生 (山陰本線全通)",
    start: "京都",
    vias: ["福知山", "鳥取", "出雲市", "益田", "長門市"],
    goal: "幡生",
    expectedKm: 673.8
  },
  {
    name: "天王寺 → 大阪 (大阪環状線外回り鶴橋・京橋経由)",
    start: "天王寺",
    vias: ["京橋"],
    goal: "大阪",
    expectedKm: 10.7
  },
  {
    name: "倉敷 → 伯耆大山 (伯備線全通)",
    start: "倉敷",
    vias: ["新見"],
    goal: "伯耆大山",
    expectedKm: 138.4
  },
  {
    name: "岡山 → 宇野 (宇野線全通)",
    start: "岡山",
    vias: ["茶屋町"],
    goal: "宇野",
    expectedKm: 32.8
  },
  {
    name: "岡山 → 高松 (瀬戸大橋線経由: 宇野線・本四備讃線・予讃線)",
    start: "岡山",
    vias: ["児島", "宇多津"],
    goal: "高松",
    expectedKm: 71.8
  },
  {
    name: "多度津 → 窪川 (土讃線全通)",
    start: "多度津",
    vias: ["高知"],
    goal: "窪川",
    expectedKm: 198.7
  },
  {
    name: "高松 → 徳島 (高徳線全通)",
    start: "高松",
    vias: ["引田"],
    goal: "徳島",
    expectedKm: 74.5
  },
  {
    name: "佐古 → 佃 (徳島線全通)",
    start: "佐古",
    vias: ["穴吹"],
    goal: "佃",
    expectedKm: 67.5
  },
  {
    name: "徳島 → 阿波海南 (牟岐線全通)",
    start: "徳島",
    vias: ["牟岐"],
    goal: "阿波海南",
    expectedKm: 77.8
  },
  {
    name: "新山口 → 益田 (山口線全通)",
    start: "新山口",
    vias: ["山口", "津和野"],
    goal: "益田",
    expectedKm: 93.9
  },
  {
    name: "姫路 → 新見 (姫新線全通)",
    start: "姫路",
    vias: ["津山"],
    goal: "新見",
    expectedKm: 158.1
  }
];

let failedCount = 0;
for (const t of tests) {
  try {
    const startId = getStationId(t.start);
    const viaIds = t.vias.map(v => getStationId(v));
    const goalId = getStationId(t.goal);

    const result = RouteEngine.searchMarsRoute(startId, viaIds, goalId);
    if (!result) {
      console.error(`[FAIL] ${t.name}: Route not found`);
      failedCount++;
      continue;
    }

    const dist = result.totalDist;
    const diff = Math.abs(dist - t.expectedKm);
    const hasEst = result.hasEstimatedDistance;

    if (diff > 0.05 || hasEst) {
      console.error(`[FAIL] ${t.name}: expected ${t.expectedKm} km, got ${dist} km. hasEstimated: ${hasEst}`);
      if (result.unregisteredLines && result.unregisteredLines.length > 0) {
        console.error(`       Unregistered lines: ${result.unregisteredLines.join(', ')}`);
      }
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
if (failedCount > 0) {
  process.exit(1);
}
