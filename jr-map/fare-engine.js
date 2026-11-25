/**
 * JR Fare & Passenger Rules Engine (JR旅客営業規則・運賃計算・途中下車・有効期間判定)
 * 2026年3月14日 JR東日本運賃改定（通算加算方式・東海道新幹線別線化・鉄道駅バリアフリー料金廃止）完全準拠
 * 普通乗車券（片道マルス券）特化版
 */
(function() {
  // 外部マスタデータ（fare-rules-data.js）の安全な取得
  let FareRulesData = null;
  if (typeof window !== 'undefined' && window.JR_FARE_RULES_DATA) {
    FareRulesData = window.JR_FARE_RULES_DATA;
  } else if (typeof require !== 'undefined') {
    try {
      FareRulesData = require('./data/fare-rules-data.js');
    } catch (e) {}
  }

  // 1. JR東日本 幹線普通旅客運賃表 (2026年3月14日改定 公式A表完全準拠)
  const JREAST_BASE_FARE_TABLE = [
    { maxKm: 3, ticket: 160 },
    { maxKm: 6, ticket: 200 },
    { maxKm: 10, ticket: 210 },
    { maxKm: 15, ticket: 260 },
    { maxKm: 20, ticket: 350 },
    { maxKm: 25, ticket: 440 },
    { maxKm: 30, ticket: 530 },
    { maxKm: 35, ticket: 620 },
    { maxKm: 40, ticket: 720 },
    { maxKm: 45, ticket: 810 },
    { maxKm: 50, ticket: 910 },
    { maxKm: 60, ticket: 1040 },
    { maxKm: 70, ticket: 1230 },
    { maxKm: 80, ticket: 1410 },
    { maxKm: 90, ticket: 1600 },
    { maxKm: 100, ticket: 1790 },
    { maxKm: 120, ticket: 2090 },
    { maxKm: 140, ticket: 2420 },
    { maxKm: 160, ticket: 2750 },
    { maxKm: 180, ticket: 3190 },
    { maxKm: 200, ticket: 3520 },
    { maxKm: 220, ticket: 3850 },
    { maxKm: 240, ticket: 4180 },
    { maxKm: 260, ticket: 4620 },
    { maxKm: 280, ticket: 5060 },
    { maxKm: 300, ticket: 5390 },
    { maxKm: 320, ticket: 5720 },
    { maxKm: 340, ticket: 5940 },
    { maxKm: 360, ticket: 6270 },
    { maxKm: 380, ticket: 6600 },
    { maxKm: 400, ticket: 6930 },
    { maxKm: 420, ticket: 7260 },
    { maxKm: 440, ticket: 7480 },
    { maxKm: 460, ticket: 7810 },
    { maxKm: 480, ticket: 8030 },
    { maxKm: 500, ticket: 8360 },
    { maxKm: 520, ticket: 8690 },
    { maxKm: 540, ticket: 9020 },
    { maxKm: 560, ticket: 9350 },
    { maxKm: 580, ticket: 9570 },
    { maxKm: 600, ticket: 9900 },
    { maxKm: 640, ticket: 10230 },
    { maxKm: 680, ticket: 10450 },
    { maxKm: 720, ticket: 10780 },
    { maxKm: 760, ticket: 11110 },
    { maxKm: 800, ticket: 11440 },
    { maxKm: 840, ticket: 11770 },
    { maxKm: 880, ticket: 11990 },
    { maxKm: 920, ticket: 12320 },
    { maxKm: 960, ticket: 12650 },
    { maxKm: 1000, ticket: 12980 }
  ];

  // 2. JR他社・本州3社基準幹線普通旅客運賃表 (JR東海・JR西日本等および跨線通算時の基準額・公式準拠)
  const JR_CENTRAL_WEST_FARE_TABLE = [
    { maxKm: 3, ticket: 150 }, { maxKm: 6, ticket: 190 }, { maxKm: 10, ticket: 200 },
    { maxKm: 15, ticket: 240 }, { maxKm: 20, ticket: 330 }, { maxKm: 25, ticket: 420 },
    { maxKm: 30, ticket: 510 }, { maxKm: 35, ticket: 590 }, { maxKm: 40, ticket: 680 },
    { maxKm: 45, ticket: 770 }, { maxKm: 50, ticket: 860 }, { maxKm: 60, ticket: 990 },
    { maxKm: 70, ticket: 1170 }, { maxKm: 80, ticket: 1340 }, { maxKm: 90, ticket: 1520 },
    { maxKm: 100, ticket: 1690 }, { maxKm: 120, ticket: 1980 }, { maxKm: 140, ticket: 2310 },
    { maxKm: 160, ticket: 2640 }, { maxKm: 180, ticket: 3080 }, { maxKm: 200, ticket: 3410 },
    { maxKm: 220, ticket: 3740 }, { maxKm: 240, ticket: 4070 }, { maxKm: 260, ticket: 4510 },
    { maxKm: 280, ticket: 4840 }, { maxKm: 300, ticket: 5170 }, { maxKm: 320, ticket: 5500 },
    { maxKm: 340, ticket: 5720 }, { maxKm: 360, ticket: 6050 }, { maxKm: 380, ticket: 6380 },
    { maxKm: 400, ticket: 6600 }, { maxKm: 420, ticket: 6930 }, { maxKm: 440, ticket: 7150 },
    { maxKm: 460, ticket: 7480 }, { maxKm: 480, ticket: 7700 }, { maxKm: 500, ticket: 8030 },
    { maxKm: 520, ticket: 8360 }, { maxKm: 540, ticket: 8580 }, { maxKm: 560, ticket: 8910 },
    { maxKm: 580, ticket: 9130 }, { maxKm: 600, ticket: 9460 }, { maxKm: 640, ticket: 9790 },
    { maxKm: 680, ticket: 10010 }, { maxKm: 720, ticket: 10340 }, { maxKm: 760, ticket: 10670 },
    { maxKm: 800, ticket: 11000 }, { maxKm: 840, ticket: 11330 }, { maxKm: 880, ticket: 11550 },
    { maxKm: 920, ticket: 11880 }, { maxKm: 960, ticket: 12210 }, { maxKm: 1000, ticket: 12540 }
  ];

  // 3. JR東日本区間営業キロに対する加算額表 (2026年3月14日改定・公式E表完全準拠)
  const JREAST_ADDON_TABLE = [
    { maxKm: 10, addOn: 10 },
    { maxKm: 30, addOn: 20 },
    { maxKm: 35, addOn: 30 },
    { maxKm: 45, addOn: 40 },
    { maxKm: 60, addOn: 50 },
    { maxKm: 70, addOn: 60 },
    { maxKm: 80, addOn: 70 },
    { maxKm: 90, addOn: 80 },
    { maxKm: 100, addOn: 100 },
    { maxKm: 260, addOn: 110 },
    { maxKm: 380, addOn: 220 },
    { maxKm: 520, addOn: 330 }
  ];

  function calculateEastAddOn(eastKm) {
    if (eastKm <= 0) return 0;
    const rounded = Math.ceil(eastKm);
    for (const row of JREAST_ADDON_TABLE) {
      if (rounded <= row.maxKm) return row.addOn;
    }
    return 440;
  }

  // 汎用運賃表ルックアップ
  function lookupFareTable(table, km) {
    if (!table || table.length === 0 || km <= 0) return 0;
    const rounded = Math.ceil(km);
    for (const row of table) {
      if (rounded <= row.maxKm) return row.ticket;
    }
    return table[table.length - 1].ticket;
  }

  // 三島会社加算額ルックアップ
  function calculateMishimaAddOn(table, km) {
    if (!table || table.length === 0 || km <= 0) return 0;
    const rounded = Math.ceil(km);
    for (const row of table) {
      if (rounded <= row.maxKm) return row.addOn;
    }
    return table[table.length - 1].addOn;
  }

  // JR西日本在来線・新幹線路線一覧
  const JR_WEST_LINES = new Set([
    'shinkansen-sanyo', 'hakataminami-line',
    'osaka-loop', 'tokaido-west', 'jr-tozai', 'osaka-higashi', 'katamachi-line',
    'fukuchiyama-line', 'hanwa-line', 'kanku-line', 'kansai-west', 'nara-line',
    'kosei-line', 'kusatsu-line', 'sakurajima-line', 'wakayama-line', 'sakurai-line',
    'kisei-west', 'hokuriku-main', 'kakogawa-line', 'bantan-line', 'kishin-line',
    'ako-line', 'etsumihoku-line', 'obama-line', 'maizuru-line', 'nanao-line',
    'johana-line', 'himi-line', 'takayama-west',
    'sanyo-main', 'sanyo-wadamisaki', 'sanin-main', 'sanin-senzaki', 'hakubi-line',
    'kure-line', 'kabe-line', 'geibi-line', 'fukuen-line', 'tsuyama-line',
    'kibi-line', 'uno-line', 'seto-ohashi-west', 'imbi-line', 'sakai-line',
    'kisuki-line', 'yamaguchi-line', 'ube-line', 'onoda-line', 'mine-line', 'gantoku-line'
  ]);

  // 北陸新幹線のJR西日本管轄駅（上越妙高以西）
  const HOKURIKU_WEST_STATIONS = new Set([
    '敦賀', '越前たけふ', '福井', '芦原温泉', '加賀温泉', '小松', '金沢', '新高岡', '富山', '黒部宇奈月温泉', '糸魚川'
  ]);

  // 大糸線のJR西日本管轄駅（南小谷以北）
  const OITO_WEST_STATIONS = new Set([
    '糸魚川', '姫川', '頸城大野', '根知', '小滝', '平岩', '北小谷', '中土'
  ]);

  /**
   * 路線の所属会社を判定 (エッジ単位・境界駅対応)
   */
  function getLineCompany(lineId, lineName, fromStation, toStation, stations = {}) {
    if (!lineId) return 'east';

    const getName = (st) => {
      if (!st) return '';
      if (stations[st] && stations[st].name) return stations[st].name;
      return st;
    };
    const fName = getName(fromStation);
    const tName = getName(toStation);

    // 1. 北陸新幹線 (境界: 上越妙高)
    if (lineId === 'shinkansen-hokuriku') {
      if (fName && tName) {
        if (HOKURIKU_WEST_STATIONS.has(fName) || HOKURIKU_WEST_STATIONS.has(tName)) {
          return 'west';
        }
        return 'east';
      }
      return 'east';
    }

    // 2. 大糸線 (境界: 南小谷)
    if (lineId === 'oito-line') {
      if (fName && tName) {
        if (OITO_WEST_STATIONS.has(fName) || OITO_WEST_STATIONS.has(tName)) {
          return 'west';
        }
        return 'east';
      }
      return 'east';
    }

    // 3. 北海道
    if (lineId.startsWith('hokkaido-') || lineId === 'shinkansen-hokkaido') return 'hokkaido';

    // 4. 東海
    if (lineId === 'shinkansen-tokaido' || lineId.startsWith('tokai-')) return 'central';

    // 5. 四国
    if (lineId.startsWith('shikoku-')) return 'shikoku';

    // 6. 九州 (博多南線を除く)
    if (lineId !== 'hakataminami-line' && (lineId.startsWith('kyushu-') || lineId === 'shinkansen-kyushu' || lineId === 'shinkansen-nishi-kyushu')) {
      return 'kyushu';
    }

    // 7. 西日本
    if (JR_WEST_LINES.has(lineId) || lineId.startsWith('west-')) return 'west';

    // 8. 東日本 (上記以外すべて)
    return 'east';
  }

  /**
   * 本州3社基準額の賃率計算 (1001km以上対応)
   */
  function calculateCentralWestBaseFare(roundedKm) {
    for (const row of JR_CENTRAL_WEST_FARE_TABLE) {
      if (roundedKm <= row.maxKm) {
        return row.ticket;
      }
    }
    const step = Math.ceil((roundedKm - 600) / 40);
    const midKm = 600 + (step * 40 - 20);
    const calcBase = (300 * 16.20) + (300 * 12.85) + ((midKm - 600) * 7.05);
    return Math.round((calcBase * 1.10) / 10) * 10;
  }

  /**
   * JR九州 幹線長距離運賃計算 (601km以上対応)
   */
  function calculateKyushuBaseFare(roundedKm) {
    if (FareRulesData && FareRulesData.KYUSHU_MAIN_FARE_TABLE) {
      for (const row of FareRulesData.KYUSHU_MAIN_FARE_TABLE) {
        if (roundedKm <= row.maxKm) return row.ticket;
      }
    }
    const step = Math.ceil((roundedKm - 600) / 40);
    const midKm = 600 + (step * 40 - 20);
    const calcBase = (300 * 16.20) + (300 * 12.85) + ((midKm - 600) * 7.05);
    return Math.round((calcBase * 1.10) / 10) * 10;
  }

  /**
   * JR北海道 幹線長距離運賃計算 (1001km以上対応)
   */
  function calculateHokkaidoBaseFare(roundedKm) {
    if (FareRulesData && FareRulesData.HOKKAIDO_MAIN_FARE_TABLE) {
      for (const row of FareRulesData.HOKKAIDO_MAIN_FARE_TABLE) {
        if (roundedKm <= row.maxKm) return row.ticket;
      }
    }
    const step = Math.ceil((roundedKm - 600) / 40);
    const midKm = 600 + (step * 40 - 20);
    const calcBase = (300 * 17.85) + (300 * 14.15) + ((midKm - 600) * 7.75);
    return Math.round((calcBase * 1.10) / 10) * 10;
  }

  /**
   * JR四国 幹線長距離運賃計算 (401km以上対応)
   */
  function calculateShikokuBaseFare(roundedKm) {
    if (FareRulesData && FareRulesData.SHIKOKU_MAIN_FARE_TABLE) {
      for (const row of FareRulesData.SHIKOKU_MAIN_FARE_TABLE) {
        if (roundedKm <= row.maxKm) return row.ticket;
      }
    }
    const step = Math.ceil((roundedKm - 300) / 20);
    const midKm = 300 + (step * 20 - 10);
    const calcBase = (300 * 16.20) + ((midKm - 300) * 12.85);
    return Math.round((calcBase * 1.10) / 10) * 10;
  }

  // 大都市近郊区間の厳密な定義 (旅客営業規則 別表第2号)
  const SUBURBAN_DEFINITION = {
    tokyo: {
      name: '東京近郊区間',
      fullLines: new Set([
        'yamanote', 'negishi-line', 'akabane-line', 'tokaido', 'yokosuka-line', 'yokohama-line',
        'nambu', 'sagami', 'tsurumi-line', 'ito-line', 'keiyo', 'musashino', 'takasaki-line',
        'ome-line', 'shinetsu-takasaki', 'kawagoe-line', 'agatsuma-line',
        'karasuyama-line', 'kashima-line', 'togane-line', 'kururi-line', 'ryomo-line',
        'mito-line', 'nikko-line', 'hachiko-line', 'uchibo-line', 'sotobo-line', 'narita-line',
        'sobu-main', 'itsukaichi-line', 'chuo-tatsuno', 'shinonoi-line'
      ]),
      boundedLines: {
        'tohoku-main': { from: '東京', to: '黒磯' },
        'joban': { from: '日暮里', to: '浪江' },
        'joetsu-line': { from: '高崎', to: '水上' },
        'chuo-main': { from: '東京', to: '塩尻' },
        'koumi-line': { from: '小淵沢', to: '野辺山' },
        'suigun-line': { from: '水戸', to: '常陸大子' },
        'oito-line': { from: '松本', to: '白馬' }
      }
    },
    sendai: {
      name: '仙台近郊区間',
      fullLines: new Set([
        'senzan-line', 'senseki-line', 'ishinomaki-line', 'rikuuto-line', 'aterazawa-line'
      ]),
      boundedLines: {
        'tohoku-main': { from: '矢吹', to: '平泉' },
        'joban': { from: '小高', to: '岩沼' },
        'banetsu-west': { from: '郡山', to: '喜多方' },
        'banetsu-east': { from: '郡山', to: '船引' },
        'ou-main': { from: '福島', to: '新庄' }
      }
    },
    niigata: {
      name: '新潟近郊区間',
      fullLines: new Set([
        'echigo-line', 'yahiko-line', 'hakushin-line'
      ]),
      boundedLines: {
        'shinetsu-line': { from: '直江津', to: '新潟' },
        'uetsu-main': { from: '新発田', to: '村上' },
        'joetsu-line': { from: '越後中里', to: '宮内' },
        'banetsu-west': { from: '五泉', to: '新津' }
      }
    },
    osaka: {
      name: '大阪近郊区間',
      fullLines: new Set([
        'osaka-loop', 'jr-tozai', 'sakurajima-line', 'kanku-line', 'katamachi-line',
        'osaka-higashi', 'nara-line', 'kusatsu-line', 'kosei-line', 'sakurai-line',
        'ako-line', 'sanyo-wadamisaki'
      ]),
      boundedLines: {
        'tokaido-west': { from: '米原', to: '神戸' },
        'sanyo-main': { from: '神戸', to: '相生' },
        'hokuriku-main': { from: '米原', to: '近江塩津' },
        'kansai-west': { from: '亀山', to: 'JR難波' },
        'hanwa-line': { from: '天王寺', to: '和歌山' },
        'wakayama-line': { from: '王寺', to: '和歌山' },
        'kisei-west': { from: '和歌山', to: '和歌山市' },
        'fukuchiyama-line': { from: '尼崎', to: '谷川' },
        'kakogawa-line': { from: '加古川', to: '谷川' },
        'bantan-line': { from: '姫路', to: '寺前' }
      }
    },
    fukuoka: {
      name: '福岡近郊区間',
      fullLines: new Set([
        'kyushu-chikuho', 'kyushu-sasaguri', 'kyushu-kashii', 'kyushu-gotoji'
      ]),
      boundedLines: {
        'kyushu-kagoshima': { from: '門司港', to: '鳥栖' },
        'kyushu-sanyo': { from: '下関', to: '門司' },
        'kyushu-nippo': { from: '小倉', to: '行橋' },
        'kyushu-hitahikosan': { from: '城野', to: '田川後藤寺' }
      }
    }
  };

  let CACHED_SUBURBAN_STATION_SETS = null;

  function buildSuburbanStationSets(lines, stations) {
    if (CACHED_SUBURBAN_STATION_SETS) return CACHED_SUBURBAN_STATION_SETS;

    let targetLines = lines;
    if (!targetLines || targetLines.length === 0) {
      if (typeof window !== 'undefined' && window.JR_LINES) targetLines = window.JR_LINES;
      else if (typeof require !== 'undefined') {
        try { targetLines = require('./data/build-data.js').JR_LINES; } catch(e) {}
      }
    }

    let targetStations = stations;
    if (!targetStations || Object.keys(targetStations).length === 0) {
      if (typeof window !== 'undefined' && (window.STATIONS || window.JR_STATIONS)) targetStations = window.STATIONS || window.JR_STATIONS;
      else if (typeof require !== 'undefined') {
        try { targetStations = require('./data/build-data.js').JR_STATIONS; } catch(e) {}
      }
    }

    if (!targetLines || !targetStations) return null;

    const lineMap = {};
    targetLines.forEach(l => { lineMap[l.id] = l; });

    const resultSets = {};

    for (const [areaKey, def] of Object.entries(SUBURBAN_DEFINITION)) {
      const stationSet = new Set();

      def.fullLines.forEach(lineId => {
        const l = lineMap[lineId];
        if (l) {
          if (l.stations) l.stations.forEach(id => stationSet.add(id));
          if (l.branches && Array.isArray(l.branches)) {
            l.branches.forEach(b => {
              if (Array.isArray(b)) b.forEach(id => stationSet.add(id));
            });
          }
        }
      });

      for (const [lineId, range] of Object.entries(def.boundedLines)) {
        const l = lineMap[lineId];
        if (!l || !l.stations) continue;
        const idxFrom = l.stations.findIndex(id => targetStations[id] && targetStations[id].name === range.from);
        const idxTo = l.stations.findIndex(id => targetStations[id] && targetStations[id].name === range.to);
        if (idxFrom >= 0 && idxTo >= 0) {
          const start = Math.min(idxFrom, idxTo);
          const end = Math.max(idxFrom, idxTo);
          for (let i = start; i <= end; i++) {
            stationSet.add(l.stations[i]);
          }
        }

        if (l.branches && Array.isArray(l.branches)) {
          l.branches.forEach(b => {
            if (!Array.isArray(b)) return;
            const branchHasStation = (stationName) => b.some(id => targetStations[id] && targetStations[id].name === stationName);

            if (lineId === 'tohoku-main') {
              if (areaKey === 'tokyo' && branchHasStation('武蔵浦和')) {
                b.forEach(id => stationSet.add(id));
              } else if (areaKey === 'sendai' && branchHasStation('利府')) {
                b.forEach(id => stationSet.add(id));
              }
            } else if (lineId === 'suigun-line' && areaKey === 'tokyo' && branchHasStation('常陸太田')) {
              b.forEach(id => stationSet.add(id));
            } else if (lineId === 'hanwa-line' && areaKey === 'osaka' && branchHasStation('東羽衣')) {
              b.forEach(id => stationSet.add(id));
            }
          });
        }
      }

      resultSets[areaKey] = stationSet;
    }

    CACHED_SUBURBAN_STATION_SETS = resultSets;
    return resultSets;
  }

  function evaluateSuburbanArea(sections, allStationIds = [], stations = {}, lines = []) {
    if (!sections || sections.length === 0) {
      return { isSuburbanOnly: false, areaName: null, hasShinkansen: false, shinkansenBypassed: false };
    }

    const hasShinkansen = sections.some(s => s.isShinkansen || (s.lineId && s.lineId.startsWith('shinkansen-')));

    if (hasShinkansen) {
      return {
        isSuburbanOnly: false,
        areaName: null,
        hasShinkansen: true,
        shinkansenBypassed: true
      };
    }

    const stationSets = buildSuburbanStationSets(lines, stations);
    if (!stationSets || !allStationIds || allStationIds.length === 0) {
      return { isSuburbanOnly: false, areaName: null, hasShinkansen: false, shinkansenBypassed: false };
    }

    for (const [areaKey, def] of Object.entries(SUBURBAN_DEFINITION)) {
      const areaSet = stationSets[areaKey];
      if (!areaSet) continue;

      const allStationsInArea = allStationIds.every(id => areaSet.has(id));
      if (!allStationsInArea) continue;

      const allEdgesInArea = sections.every(sec => {
        if (!sec.lineId) return false;
        if (def.fullLines.has(sec.lineId)) return true;
        if (def.boundedLines[sec.lineId]) return true;
        return false;
      });

      if (allEdgesInArea) {
        return {
          isSuburbanOnly: true,
          areaName: def.name,
          hasShinkansen: false,
          shinkansenBypassed: false
        };
      }
    }

    return {
      isSuburbanOnly: false,
      areaName: null,
      hasShinkansen: false,
      shinkansenBypassed: false
    };
  }

  /**
   * 有効期間日数の計算 (旅規第154条)
   * ※営業キロ（km）で計算する (第154条第1項第2号イにより特定都区市内・山手線内適用時は中心駅営業キロ)
   */
  function calculateValidityDays(km, isSuburbanOnly) {
    if (isSuburbanOnly) return 1;
    if (km <= 100) return 1;
    return Math.floor((km - 1) / 200) + 2;
  }

  /**
   * 途中下車可否の判定 (旅規第156条)
   */
  function evaluateStopover(km, isSuburbanOnly, isLoopRoute, hasShinkansen, shinkansenBypassed, hasTokaidoShinkansen) {
    if (km <= 100) {
      return {
        allowed: false,
        summary: '途中下車不可',
        detail: '営業キロが100km以下のため下車前途無効（途中下車不可）です。'
      };
    }

    if (isSuburbanOnly) {
      return {
        allowed: false,
        summary: '途中下車不可 (近郊区間完結)',
        detail: '大都市近郊区間内のみをご利用の場合、乗車経路に関わらず下車前途無効（途中下車不可・当日限り有効）となります。※一部区間に新幹線を指定すると近郊区間特例が解除され、途中下車が可能になります。'
      };
    }

    let detail = '途中下車可能（有効期間内であれば指定区間内の各駅で後戻りしない限り何度でも途中下車できます）。';
    if (isLoopRoute) {
      detail += ' ※発着駅（または同一駅）では下車前途無効となります。';
    }
    if (shinkansenBypassed) {
      detail += ' 【新幹線特例】新幹線利用区間が含まれるため、大都市近郊区間の最短経路特例が解除され、実際の経路通りの営業キロで途中下車が可能です。';
    }
    detail += ' 【特定都区市内・山手線内特例】特定都区市内または東京山手線内発着の乗車券は、そのゾーン内の駅では途中下車できません（ゾーン外では何度でも途中下車可能）。';
    if (hasTokaidoShinkansen) {
      detail += ' 【東海道新幹線別線化（2026年3月改定）】東京〜新大阪間の東海道新幹線（JR東海）と東海道本線は別線扱いとなり、別線相互の乗り分けが可能です。';
    }

    return {
      allowed: true,
      summary: '途中下車可能',
      detail: detail
    };
  }

  /**
   * 境界駅と中心駅の公式営業キロ辞書（特定都区市内・山手線内中心駅計算用）
   */
  const BORDER_TO_CENTER_KILOS = {
    // 東京 (tokyo)
    'tokyo::akabane': 13.2,
    'tokyo::shinagawa': 6.8,
    'tokyo::shinjuku': 10.3,
    'tokyo::nishi-ogikubo': 22.5,
    'tokyo::mitaka': 24.1,
    'tokyo::kanamachi': 16.7,
    'tokyo::koiwa': 14.4,
    'tokyo::kasai-rinkai-koen': 13.4,
    'tokyo::kamata': 14.4,
    'tokyo::omiya': 30.3,
    'tokyo::ueno': 3.6,
    // 大阪 (st-fzkz / osaka)
    'osaka::shin-osaka': 3.8,
    'osaka::amagasaki': 7.7,
    'osaka::tsukamoto': 3.8,
    'osaka::kyobashi': 4.2,
    'osaka::tennoji': 11.0,
    'osaka::jr-nanba': 7.3,
    // 横浜 (yokohama)
    'yokohama::shin-yokohama': 6.1,
    'yokohama::ofuna': 17.7,
    'yokohama::tsurumi': 7.1,
    // 名古屋 (nagoya)
    'nagoya::kanayama': 3.3,
    'nagoya::chikusa': 6.1,
    // 京都 (kyoto)
    'kyoto::yamashina': 5.5,
    'kyoto::katsuragawa': 5.3,
    // 神戸 (st-l6l6 / kobe)
    'kobe::sannomiya': 2.2,
    'kobe::shin-kobe': 3.7,
    'kobe::hyogo': 1.8,
    // 広島 (hiroshima)
    'hiroshima::kaitaichi': 6.4,
    'hiroshima::nishi-hiroshima': 3.1,
    // 小倉 (kokura)
    'kokura::mojiko': 11.0,
    'kokura::moji': 5.5,
    'kokura::orio': 19.1,
    // 博多 (hakata)
    'hakata::fukuko-daimae': 12.8,
    'hakata::minami-fukuoka': 9.2,
    // 仙台 (sendai)
    'sendai::iwakiri': 8.1,
    'sendai::nagamachi': 4.5,
    // 札幌 (sapporo)
    'sapporo::shin-sapporo': 13.8,
    'sapporo::teine': 10.6
  };

  /**
   * 境界駅と中心駅の距離を取得 (テーブル優先、必要に応じて findLeg フォールバック)
   */
  function getBorderToCenterDistance(centerKey, stationId, graph, centerStationId) {
    const key1 = `${centerKey}::${stationId}`;
    if (BORDER_TO_CENTER_KILOS[key1] !== undefined) return BORDER_TO_CENTER_KILOS[key1];

    const targetCenterId = centerStationId || centerKey;

    if (graph && typeof window !== 'undefined' && window.JR_ROUTE_ENGINE && window.JR_ROUTE_ENGINE.findLeg) {
      try {
        const leg = window.JR_ROUTE_ENGINE.findLeg(graph, stationId, targetCenterId, { useShinkansen: false });
        if (leg && leg.length > 0) {
          const tenths = leg.reduce((sum, s) => sum + Math.round(s.dist * 10), 0);
          return tenths / 10;
        }
      } catch (e) {}
    } else if (graph && typeof require !== 'undefined') {
      try {
        const re = require('./route-engine.js');
        const leg = re.findLeg(graph, stationId, targetCenterId, { useShinkansen: false });
        if (leg && leg.length > 0) {
          const tenths = leg.reduce((sum, s) => sum + Math.round(s.dist * 10), 0);
          return tenths / 10;
        }
      } catch (e) {}
    }
    return 0;
  }

  /**
   * 旅規第69条 (特定区間通過の最短キロ計算) の判定・適用
   */
  function evaluateArticle69Rules(fullSegments, sections, stations) {
    if (!FareRulesData || !FareRulesData.ARTICLE_69_CORRIDORS) {
      return { totalShortenKm: 0, appliedCorridors: [], trunkDelta: 0, localDelta: 0 };
    }

    const appliedCorridors = [];
    let totalShortenKm = 0;
    let trunkDelta = 0;
    let localDelta = 0;

    const segments = fullSegments || sections || [];
    if (segments.length === 0) return { totalShortenKm: 0, appliedCorridors: [], trunkDelta: 0, localDelta: 0 };

    // 経路上の駅ノード列を構築 (segments[i] は nodeNames[i] から nodeNames[i+1] へのエッジ)
    const nodeNames = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const fName = stations[seg.from] ? stations[seg.from].name : seg.from;
      const tName = stations[seg.to] ? stations[seg.to].name : seg.to;
      if (i === 0) nodeNames.push(fName);
      nodeNames.push(tName);
    }

    for (const corridor of FareRulesData.ARTICLE_69_CORRIDORS) {
      const end1 = corridor.endStationNames[0];
      const end2 = corridor.endStationNames[1];

      // 駅ノード列から end1, end2 の位置を特定
      const nIdx1 = nodeNames.indexOf(end1);
      const nIdx2 = nodeNames.indexOf(end2);

      if (nIdx1 >= 0 && nIdx2 >= 0 && nIdx1 !== nIdx2) {
        // end1 と end2 の間に挟まれたセグメントだけをスライス
        const startSegIdx = Math.min(nIdx1, nIdx2);
        const endSegIdx = Math.max(nIdx1, nIdx2) - 1;
        const subSegments = segments.slice(startSegIdx, endSegIdx + 1);

        const subStationNames = new Set();
        let subActualKm = 0;
        let subLocalKm = 0;
        let subTrunkKm = 0;

        subSegments.forEach(seg => {
          const fName = stations[seg.from] ? stations[seg.from].name : seg.from;
          const tName = stations[seg.to] ? stations[seg.to].name : seg.to;
          subStationNames.add(fName);
          subStationNames.add(tName);
          const segDist = seg.dist !== undefined ? seg.dist : (seg.km || 0);
          subActualKm += segDist;
          const isLoc = FareRulesData.isLocalLineSegment ? FareRulesData.isLocalLineSegment(seg.lineId, seg.from, seg.to, stations) : false;
          if (isLoc) subLocalKm += segDist;
          else subTrunkKm += segDist;
        });

        let passesDetour = false;
        if (corridor.id === 'art69::akabane-omiya') {
          passesDetour = subStationNames.has('武蔵浦和');
        } else if (corridor.id === 'art69::iwakuni-kushigahama') {
          passesDetour = subStationNames.has('柳井');
        } else if (corridor.id === 'art69::mihara-kaitaichi') {
          passesDetour = subSegments.some(seg => corridor.detourLineIds.has(seg.lineId));
        } else if (corridor.id === 'art69::shinosaka-amagasaki') {
          passesDetour = subSegments.some(seg => corridor.detourLineIds.has(seg.lineId));
        } else if (corridor.id === 'art69::kashii-hakata') {
          passesDetour = subSegments.some(seg => corridor.detourLineIds.has(seg.lineId));
        } else if (corridor.id === 'art69::nippori-akabane') {
          passesDetour = false; // 同一キロのため短縮なし
        } else {
          passesDetour = subSegments.some(seg => corridor.detourLineIds.has(seg.lineId));
        }

        if (passesDetour) {
          const actualDetourKm = Math.round(subActualKm * 10) / 10;
          const shorten = Math.max(0, Math.round((actualDetourKm - corridor.shortcutKm) * 10) / 10);
          if (shorten > 0) {
            totalShortenKm += shorten;
            appliedCorridors.push({
              id: corridor.id,
              name: corridor.name,
              detourKm: actualDetourKm,
              shortcutKm: corridor.shortcutKm,
              shortenKm: shorten
            });

            // 幹線・地方交通線のキロ数調整
            if (corridor.id === 'art69::mihara-kaitaichi') {
              localDelta -= subLocalKm;
              trunkDelta += (corridor.shortcutKm - subTrunkKm);
            } else if (corridor.id === 'art69::iwakuni-kushigahama') {
              trunkDelta -= subTrunkKm;
              localDelta += (corridor.shortcutKm - subLocalKm);
            } else {
              trunkDelta -= shorten;
            }
          }
        }
      }
    }

    return {
      totalShortenKm: Math.round(totalShortenKm * 10) / 10,
      appliedCorridors: appliedCorridors,
      trunkDelta: Math.round(trunkDelta * 10) / 10,
      localDelta: Math.round(localDelta * 10) / 10
    };
  }

  // 特定都区市内・山手線内 マーク定義
  const ZONE_MARK_MAP = {
    yamanote: { char: '山', type: 'yamanote', title: '東京山手線内' },
    tokyo: { char: '区', type: 'city', title: '東京都区内' },
    sapporo: { char: '札', type: 'city', title: '札幌市内' },
    sendai: { char: '仙', type: 'city', title: '仙台市内' },
    yokohama: { char: '浜', type: 'city', title: '横浜市内' },
    nagoya: { char: '名', type: 'city', title: '名古屋市内' },
    kyoto: { char: '京', type: 'city', title: '京都市内' },
    osaka: { char: '阪', type: 'city', title: '大阪市内' },
    kobe: { char: '神', type: 'city', title: '神戸市内' },
    hiroshima: { char: '広', type: 'city', title: '広島市内' },
    kitakyushu: { char: '九', type: 'city', title: '北九州市内' },
    fukuoka: { char: '福', type: 'city', title: '福岡市内' }
  };

  /**
   * 同名駅の他都道府県誤判定を防ぐためのゾーン所属チェック (中心駅との近接判定)
   */
  function isStationInZone(stId, stName, zone, stationsMap) {
    if (!zone || !zone.stationNames || !zone.stationNames.has(stName)) return false;
    if (!stId || !stationsMap || !stationsMap[stId]) return true;
    const st = stationsMap[stId];
    const centerSt = stationsMap[zone.centerId];
    if (!centerSt || st.lat == null || centerSt.lat == null) return true;
    const dLat = Math.abs(st.lat - centerSt.lat);
    const dLng = Math.abs(st.lng - centerSt.lng);
    return (dLat < 0.8 && dLng < 0.8);
  }

  /**
   * 駅の所属ゾーンマーク一覧を取得（[山]、[区]など）
   * @param {string|object} stOrId - 駅オブジェクトまたは駅ID
   * @param {object} stationsMap - 駅辞書 (STATIONS)
   * @returns {Array<{char: string, type: string, title: string, zoneId: string}>}
   */
  function getStationZoneMarks(stOrId, stationsMap) {
    if (!FareRulesData || !FareRulesData.SPECIFIC_CITY_ZONES) return [];
    const zones = FareRulesData.SPECIFIC_CITY_ZONES;
    const st = typeof stOrId === 'object' && stOrId ? stOrId : (stationsMap ? stationsMap[stOrId] : null);
    const stId = st ? st.id : (typeof stOrId === 'string' ? stOrId : null);
    const stName = st ? st.name : (stId && stationsMap && stationsMap[stId] ? stationsMap[stId].name : null);
    if (!stName) return [];

    const marks = [];

    // 1. 東京山手線内チェック（存在する場合は左端に [山] を配置）
    if (zones.yamanote && isStationInZone(stId, stName, zones.yamanote, stationsMap)) {
      marks.push({
        zoneId: 'yamanote',
        char: ZONE_MARK_MAP.yamanote.char,
        type: ZONE_MARK_MAP.yamanote.type,
        title: ZONE_MARK_MAP.yamanote.title
      });
    }

    // 2. 11大特定都区市内チェック（[区]、[札]、[仙]、[浜]、[名]、[京]、[阪]、[神]、[広]、[九]、[福]）
    for (const [key, z] of Object.entries(zones)) {
      if (key === 'yamanote') continue;
      if (isStationInZone(stId, stName, z, stationsMap)) {
        const info = ZONE_MARK_MAP[key] || { char: z.displayName ? z.displayName.charAt(0) : '区', type: 'city', title: z.name };
        marks.push({
          zoneId: key,
          char: info.char,
          type: info.type,
          title: info.title
        });
        break; // 特定都区市内は最大1つ
      }
    }

    return marks;
  }

  /**
   * 特定都区市内 (旅規第86条) & 東京山手線内 (旅規第87条) の判定・適用
   */
  function evaluateZoneRules(deptStationName, destStationName, deptId, destId, totalKm, fullSegments, stations, graph) {
    if (!FareRulesData || !FareRulesData.SPECIFIC_CITY_ZONES) {
      return {
        displayDeptName: deptStationName,
        displayDestName: destStationName,
        fareBasisKm: totalKm,
        deptZone: null,
        destZone: null,
        deptApplied: false,
        destApplied: false,
        deptDelta: 0,
        destDelta: 0,
        deptBorderStationId: null,
        destBorderStationId: null,
        deptBorderDist: 0,
        destBorderDist: 0
      };
    }

    const zones = FareRulesData.SPECIFIC_CITY_ZONES;
    const yamanoteZone = zones.yamanote;

    // 同名駅の他都道府県誤判定を防ぐためのゾーン所属チェック (中心駅との近接判定)
    function isStationInZoneLocal(stId, stName, zone) {
      return isStationInZone(stId, stName, zone, stations);
    }

    // 1. 発駅・着駅が属する特定都区市内ゾーン（tokyo, osaka, etc.）
    let deptCityZone = null;
    let destCityZone = null;
    for (const [key, z] of Object.entries(zones)) {
      if (key === 'yamanote') continue;
      if (isStationInZoneLocal(deptId, deptStationName, z)) deptCityZone = z;
      if (isStationInZoneLocal(destId, destStationName, z)) destCityZone = z;
    }

    const isDeptYamanote = isStationInZoneLocal(deptId, deptStationName, yamanoteZone);
    const isDestYamanote = isStationInZoneLocal(destId, destStationName, yamanoteZone);

    const segments = fullSegments || [];

    // ゾーン遷移状態の圧縮列 (['IN', 'OUT', 'IN'] 等) を取得
    function getZoneTransitions(zone) {
      if (!zone || segments.length === 0) return [];
      const allSts = [segments[0].from, ...segments.map(s => s.to)];
      const transitions = [];
      allSts.forEach(stId => {
        const stName = stations[stId] ? stations[stId].name : stId;
        const inZ = isStationInZoneLocal(stId, stName, zone);
        const state = inZ ? 'IN' : 'OUT';
        if (transitions.length === 0 || transitions[transitions.length - 1] !== state) {
          transitions.push(state);
        }
      });
      return transitions;
    }

    // ゾーン再通過（第86条・第87条ただし書）判定
    // IN -> OUT -> IN -> OUT 等、ゾーンを出て再び入ってまた抜ける場合は適用除外
    function isZoneReentry(zone, isDept, isDest) {
      if (!zone || segments.length === 0) return false;
      const trans = getZoneTransitions(zone);
      if (trans.length <= 1) return false;

      if (isDept && isDest) {
        // 同一ゾーン発着: ['IN', 'OUT', 'IN'] は再通過ではない (正常)
        // 長さ > 3 (例: ['IN', 'OUT', 'IN', 'OUT', ...]) は再通過 (除外)
        return trans.length > 3;
      } else if (isDept) {
        // 発駅側ゾーン: ['IN', 'OUT'] は正常
        // 長さ > 2 (例: ['IN', 'OUT', 'IN', ...]) は再進入・再通過 (除外)
        return trans.length > 2;
      } else if (isDest) {
        // 着駅側ゾーン: ['OUT', 'IN'] は正常
        // 長さ > 2 (例: ['OUT', 'IN', 'OUT', 'IN', ...] や ['IN', ...]) は再進入・再通過 (除外)
        return trans.length > 2;
      }
      return false;
    }

    // 発側境界駅・補正キロの算出
    function calcDeptBorder(zone) {
      let deptBorderStationId = null;
      let distDeptToBorder = 0;
      let deptDelta = 0;
      let deptCenterKm = totalKm;

      if (deptStationName === zone.centerName) {
        deptDelta = 0;
        deptCenterKm = totalKm;
        deptBorderStationId = deptId;
        distDeptToBorder = 0;
      } else {
        let cumDist = 0;
        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          const segDist = seg.dist !== undefined ? seg.dist : (seg.km || 0);
          const fName = stations[seg.from] ? stations[seg.from].name : seg.from;
          const tName = stations[seg.to] ? stations[seg.to].name : seg.to;

          const isFromInZone = isStationInZoneLocal(seg.from, fName, zone);
          const isToInZone = isStationInZoneLocal(seg.to, tName, zone);
          const isShinkansen = seg.isShinkansen || (seg.lineId && seg.lineId.startsWith('shinkansen-'));

          if (isFromInZone && isShinkansen) {
            deptBorderStationId = seg.from;
            distDeptToBorder = cumDist;
            break;
          }

          if (isFromInZone && !isToInZone) {
            deptBorderStationId = seg.from;
            distDeptToBorder = cumDist;
            break;
          }
          cumDist += segDist;
        }

        if (deptBorderStationId) {
          const borderStName = stations[deptBorderStationId] ? stations[deptBorderStationId].name : deptBorderStationId;
          let borderToCenter = 0;
          if (zone.centerName === borderStName) {
            borderToCenter = 0;
          } else if (zone.id === 'tokyo' && borderStName === '赤羽') {
            borderToCenter = 13.2;
          } else {
            borderToCenter = getBorderToCenterDistance(zone.id, deptBorderStationId, graph, zone.centerId);
          }
          deptDelta = borderToCenter - distDeptToBorder;
          deptCenterKm = totalKm + deptDelta;
        }
      }
      return { deptBorderStationId, distDeptToBorder, deptDelta, deptCenterKm };
    }

    // 着側境界駅・補正キロの算出 (終点側から逆走査)
    function calcDestBorder(zone) {
      let destBorderStationId = null;
      let distBorderToDest = 0;
      let destDelta = 0;
      let destCenterKm = totalKm;

      if (destStationName === zone.centerName) {
        destDelta = 0;
        destCenterKm = totalKm;
        destBorderStationId = destId;
        distBorderToDest = 0;
      } else {
        let cumDistBack = 0;
        for (let i = segments.length - 1; i >= 0; i--) {
          const seg = segments[i];
          const segDist = seg.dist !== undefined ? seg.dist : (seg.km || 0);
          const fName = stations[seg.from] ? stations[seg.from].name : seg.from;
          const tName = stations[seg.to] ? stations[seg.to].name : seg.to;

          const isFromInZone = isStationInZoneLocal(seg.from, fName, zone);
          const isToInZone = isStationInZoneLocal(seg.to, tName, zone);
          const isShinkansen = seg.isShinkansen || (seg.lineId && seg.lineId.startsWith('shinkansen-'));

          if (isToInZone && isShinkansen) {
            destBorderStationId = seg.to;
            distBorderToDest = cumDistBack;
            break;
          }

          if (isToInZone && !isFromInZone) {
            destBorderStationId = seg.to;
            distBorderToDest = cumDistBack;
            break;
          }
          cumDistBack += segDist;
        }

        if (!destBorderStationId && segments.length > 0) {
          destBorderStationId = segments[0].from;
          distBorderToDest = totalKm;
        }

        if (destBorderStationId) {
          const borderStName = stations[destBorderStationId] ? stations[destBorderStationId].name : destBorderStationId;
          let borderToCenter = 0;
          if (zone.centerName === borderStName) {
            borderToCenter = 0;
          } else if (zone.id === 'osaka' && borderStName === '新大阪') {
            borderToCenter = 3.8;
          } else {
            borderToCenter = getBorderToCenterDistance(zone.id, destBorderStationId, graph, zone.centerId);
          }
          destDelta = borderToCenter - distBorderToDest;
          destCenterKm = totalKm + destDelta;
        }
      }
      return { destBorderStationId, distBorderToDest, destDelta, destCenterKm };
    }

    let deptDelta = 0;
    let destDelta = 0;
    let deptApplied = false;
    let destApplied = false;
    let displayDeptName = deptStationName;
    let displayDestName = destStationName;
    let deptBorderStationId = null;
    let destBorderStationId = null;
    let distDeptToBorder = 0;
    let distBorderToDest = 0;
    let candidateDeptZone = null;
    let candidateDestZone = null;

    const isSameCityZone = !!(deptCityZone && destCityZone && deptCityZone.id === destCityZone.id);
    const isSameYamanote = !!(isDeptYamanote && isDestYamanote);

    // A. 同一特定都区市内発着 (第86条)
    const isRe = isZoneReentry(deptCityZone, true, true);
    const trans = deptCityZone ? getZoneTransitions(deptCityZone) : [];
    if (isSameCityZone && !isZoneReentry(deptCityZone, true, true)) {
      const trans = getZoneTransitions(deptCityZone);
      if (trans.length === 3 && trans[0] === 'IN' && trans[1] === 'OUT' && trans[2] === 'IN') {
        const dInfo = calcDeptBorder(deptCityZone);
        const aInfo = calcDestBorder(deptCityZone);
        const centerFareKm = totalKm + dInfo.deptDelta + aInfo.destDelta;
        if (centerFareKm > 200.0) {
          deptApplied = true;
          destApplied = true;
          candidateDeptZone = deptCityZone;
          candidateDestZone = deptCityZone;
          displayDeptName = deptCityZone.displayName;
          displayDestName = deptCityZone.displayName;
          deptDelta = dInfo.deptDelta;
          destDelta = aInfo.destDelta;
          deptBorderStationId = dInfo.deptBorderStationId;
          destBorderStationId = aInfo.destBorderStationId;
          distDeptToBorder = dInfo.distDeptToBorder;
          distBorderToDest = aInfo.distBorderToDest;
        }
      }
    }

    // B. 同一東京山手線内発着 (第87条) (都区市内が未適用の場合)
    if (!deptApplied && !destApplied && isSameYamanote && !isZoneReentry(yamanoteZone, true, true)) {
      const trans = getZoneTransitions(yamanoteZone);
      if (trans.length === 3 && trans[0] === 'IN' && trans[1] === 'OUT' && trans[2] === 'IN') {
        const dInfo = calcDeptBorder(yamanoteZone);
        const aInfo = calcDestBorder(yamanoteZone);
        const centerFareKm = totalKm + dInfo.deptDelta + aInfo.destDelta;
        if (centerFareKm > 100.0 && centerFareKm <= 200.0) {
          deptApplied = true;
          destApplied = true;
          candidateDeptZone = yamanoteZone;
          candidateDestZone = yamanoteZone;
          displayDeptName = yamanoteZone.displayName;
          displayDestName = yamanoteZone.displayName;
          deptDelta = dInfo.deptDelta;
          destDelta = aInfo.destDelta;
          deptBorderStationId = dInfo.deptBorderStationId;
          destBorderStationId = aInfo.destBorderStationId;
          distDeptToBorder = dInfo.distDeptToBorder;
          distBorderToDest = aInfo.distBorderToDest;
        }
      }
    }

    // C. 異なるゾーンまたは片側ゾーン発着
    if (!deptApplied && !destApplied && !isSameCityZone) {
      let rawDeptZone = deptCityZone || (isDeptYamanote ? yamanoteZone : null);
      let rawDestZone = destCityZone || (isDestYamanote ? yamanoteZone : null);

      if (rawDeptZone && !isZoneReentry(rawDeptZone, true, false)) {
        const dInfo = calcDeptBorder(rawDeptZone);
        if (rawDeptZone.id !== 'yamanote' && dInfo.deptCenterKm > 200.0) {
          deptApplied = true;
          candidateDeptZone = rawDeptZone;
          displayDeptName = rawDeptZone.displayName;
          deptDelta = dInfo.deptDelta;
          deptBorderStationId = dInfo.deptBorderStationId;
          distDeptToBorder = dInfo.distDeptToBorder;
        } else if (isDeptYamanote && dInfo.deptCenterKm > 100.0 && dInfo.deptCenterKm <= 200.0) {
          deptApplied = true;
          candidateDeptZone = yamanoteZone;
          displayDeptName = yamanoteZone.displayName;
          deptDelta = dInfo.deptDelta;
          deptBorderStationId = dInfo.deptBorderStationId;
          distDeptToBorder = dInfo.distDeptToBorder;
        }
      }

      if (rawDestZone && !isZoneReentry(rawDestZone, false, true)) {
        const aInfo = calcDestBorder(rawDestZone);
        if (rawDestZone.id !== 'yamanote' && aInfo.destCenterKm > 200.0) {
          destApplied = true;
          candidateDestZone = rawDestZone;
          displayDestName = rawDestZone.displayName;
          destDelta = aInfo.destDelta;
          destBorderStationId = aInfo.destBorderStationId;
          distBorderToDest = aInfo.distBorderToDest;
        } else if (isDestYamanote && aInfo.destCenterKm > 100.0 && aInfo.destCenterKm <= 200.0) {
          destApplied = true;
          candidateDestZone = yamanoteZone;
          displayDestName = yamanoteZone.displayName;
          destDelta = aInfo.destDelta;
          destBorderStationId = aInfo.destBorderStationId;
          distBorderToDest = aInfo.distBorderToDest;
        }
      }
    }

    // 両方適用時の正確な基準キロ合算 (旅規第86条・第87条 中心駅間営業キロ)
    let fareBasisKm = totalKm;
    if (deptApplied && destApplied) {
      fareBasisKm = totalKm + deptDelta + destDelta;
    } else if (deptApplied) {
      fareBasisKm = totalKm + deptDelta;
    } else if (destApplied) {
      fareBasisKm = totalKm + destDelta;
    }

    return {
      displayDeptName: displayDeptName,
      displayDestName: displayDestName,
      fareBasisKm: Math.round(fareBasisKm * 10) / 10,
      deptZone: deptApplied ? candidateDeptZone : null,
      destZone: destApplied ? candidateDestZone : null,
      deptApplied: deptApplied,
      destApplied: destApplied,
      deptDelta: deptDelta,
      destDelta: destDelta,
      deptBorderStationId: deptBorderStationId,
      destBorderStationId: destBorderStationId,
      deptBorderToCenter: deptBorderStationId ? Math.max(0, Math.round((deptDelta + distDeptToBorder) * 10) / 10) : 0,
      destBorderToCenter: destBorderStationId ? Math.max(0, Math.round((destDelta + distBorderToDest) * 10) / 10) : 0,
      distDeptToBorder: distDeptToBorder,
      distBorderToDest: distBorderToDest
    };
  }

  /**
   * 普通旅客運賃の計算 (大人・片道)
   * 2026年3月14日改定・通算加算方式対応 & JR6社・地方交通線完全対応
   */
  function calculateBaseFare(km, options = {}) {
    if (km <= 0) return 0;
    const roundedKm = Math.ceil(km);
    const company = options.company || 'east';
    const isInterCompany = !!options.isInterCompany;
    const isLocalOnly = !!options.isLocalOnly;
    const isOsakaLoopOnly = !!options.isOsakaLoopOnly;
    const isDenshaTokuteiOnly = !!options.isDenshaTokuteiOnly;

    const eastKm = options.eastKm || 0;
    const hokkaidoKm = options.hokkaidoKm || 0;
    const shikokuKm = options.shikokuKm || 0;
    const kyushuKm = options.kyushuKm || 0;

    // 1. 跨線利用 (通算加算方式)
    if (isInterCompany) {
      const baseAmount = calculateCentralWestBaseFare(roundedKm);
      const eastAddOn = eastKm > 0 ? calculateEastAddOn(eastKm) : 0;
      const hokkaidoAddOn = (hokkaidoKm > 0 && FareRulesData) ? calculateMishimaAddOn(FareRulesData.HOKKAIDO_ADDON_TABLE, hokkaidoKm) : 0;
      const shikokuAddOn = (shikokuKm > 0 && FareRulesData) ? calculateMishimaAddOn(FareRulesData.SHIKOKU_ADDON_TABLE, shikokuKm) : 0;
      const kyushuAddOn = (kyushuKm > 0 && FareRulesData) ? calculateMishimaAddOn(FareRulesData.KYUSHU_ADDON_TABLE, kyushuKm) : 0;

      return baseAmount + eastAddOn + hokkaidoAddOn + shikokuAddOn + kyushuAddOn;
    }

    // 2. 地方交通線単独利用 (旅規第84条第1項第2号準拠)
    // 10km以下は各社固有の初乗り表、11km以上は換算キロ(Math.ceil(km * 1.1))で該当社の幹線表を参照
    if (isLocalOnly) {
      if (roundedKm <= 10 && FareRulesData && FareRulesData.LOCAL_UNDER_10KM_TABLES && FareRulesData.LOCAL_UNDER_10KM_TABLES[company]) {
        return lookupFareTable(FareRulesData.LOCAL_UNDER_10KM_TABLES[company], roundedKm);
      }
      return calculateBaseFare(roundedKm, {
        company: company,
        isInterCompany: false,
        isLocalOnly: false,
        isOsakaLoopOnly: false,
        isDenshaTokuteiOnly: false
      });
    }

    // 3. 幹線単独利用
    if (company === 'east') {
      for (const row of JREAST_BASE_FARE_TABLE) {
        if (roundedKm <= row.maxKm) return row.ticket;
      }
      return calculateCentralWestBaseFare(roundedKm) + 440;
    }

    if (company === 'central') {
      return calculateCentralWestBaseFare(roundedKm);
    }

    if (company === 'west') {
      if (isOsakaLoopOnly && roundedKm <= 25 && FareRulesData && FareRulesData.WEST_OSAKA_LOOP_TABLE) {
        return lookupFareTable(FareRulesData.WEST_OSAKA_LOOP_TABLE, roundedKm);
      }
      if (isDenshaTokuteiOnly && roundedKm <= 100 && FareRulesData && FareRulesData.WEST_DENSHA_TOKUTEI_TABLE) {
        return lookupFareTable(FareRulesData.WEST_DENSHA_TOKUTEI_TABLE, roundedKm);
      }
      return calculateCentralWestBaseFare(roundedKm);
    }

    if (company === 'hokkaido') {
      return calculateHokkaidoBaseFare(roundedKm);
    }

    if (company === 'shikoku') {
      return calculateShikokuBaseFare(roundedKm);
    }

    if (company === 'kyushu') {
      return calculateKyushuBaseFare(roundedKm);
    }

    return calculateCentralWestBaseFare(roundedKm);
  }

  /**
   * 総合判定メインAPI (JR普通乗車券・片道マルス券規則完全準拠)
   */
  function evaluateRouteFareAndRules(routeResult, stations = {}, lines = [], options = {}) {
    if (!routeResult || !routeResult.success) {
      return null;
    }

    const totalKm = routeResult.totalKm || 0;
    const sections = routeResult.sections || [];
    const fullSegments = routeResult.fullSegments || sections;
    const deptId = routeResult.deptId;
    const destId = routeResult.destId;
    const deptName = routeResult.deptName || (stations[deptId] ? stations[deptId].name : deptId);
    const destName = routeResult.destName || (stations[destId] ? stations[destId].name : destId);
    const allStationIds = routeResult.allStationIds || [];
    const lineRuns = routeResult.lineRuns || [];
    const isLoopRoute = (deptId === destId);
    const graph = routeResult.graph || options.graph;

    // 経路上の駅名リスト
    const passedNames = [];
    fullSegments.forEach(seg => {
      const f = stations[seg.from] ? stations[seg.from].name : seg.from;
      const t = stations[seg.to] ? stations[seg.to].name : seg.to;
      if (passedNames.length === 0 || passedNames[passedNames.length - 1] !== f) passedNames.push(f);
      passedNames.push(t);
    });

    // 1. 大都市近郊区間 & 新幹線厳密判定
    const suburbanInfo = evaluateSuburbanArea(sections, allStationIds, stations, lines);

    // 2. 会社別・幹線地方交通線別キロ集計
    let eastKm = 0;
    let centralKm = 0;
    let westKm = 0;
    let hokkaidoKm = 0;
    let shikokuKm = 0;
    let kyushuKm = 0;
    let hasTokaidoShinkansen = false;

    let trunkKm = 0;
    let localKm = 0;

    fullSegments.forEach(seg => {
      const segKm = seg.dist !== undefined ? seg.dist : (seg.km || 0);
      const fromSt = seg.from;
      const toSt = seg.to;
      const comp = getLineCompany(seg.lineId, seg.lineName, fromSt, toSt, stations);

      if (comp === 'east') eastKm += segKm;
      else if (comp === 'central') centralKm += segKm;
      else if (comp === 'west') westKm += segKm;
      else if (comp === 'hokkaido') hokkaidoKm += segKm;
      else if (comp === 'shikoku') shikokuKm += segKm;
      else if (comp === 'kyushu') kyushuKm += segKm;

      if (seg.lineId === 'shinkansen-tokaido' || seg.lineName === '東海道新幹線') {
        hasTokaidoShinkansen = true;
      }

      // 地方交通線・幹線判定
      const isLocal = FareRulesData ? FareRulesData.isLocalLineSegment(seg.lineId, fromSt, toSt, stations) : false;
      if (isLocal) {
        localKm += segKm;
      } else {
        trunkKm += segKm;
      }
    });

    // 3. 旅規第69条 (特定区間通過の最短キロ計算)
    const art69Result = evaluateArticle69Rules(fullSegments, sections, stations);
    let effectiveTrunkKm = trunkKm + art69Result.trunkDelta;
    let effectiveLocalKm = localKm + art69Result.localDelta;

    // 旅規第70条 (東京付近特定区間短縮)
    // 第70条太線区間はすべてJR東日本の幹線であるため、幹線キロおよびJR東日本営業キロから短縮差分を控除
    const article70ShortenKm = routeResult.article70ShortenKm || 0;
    if (article70ShortenKm > 0) {
      effectiveTrunkKm = Math.max(0, Math.round((effectiveTrunkKm - article70ShortenKm) * 10) / 10);
      eastKm = Math.max(0, Math.round((eastKm - article70ShortenKm) * 10) / 10);
    }

    if (effectiveTrunkKm < 0) effectiveTrunkKm = 0;
    if (effectiveLocalKm < 0) effectiveLocalKm = 0;

    // 4. 特定都区市内・東京山手線内 (旅規第86条・第87条)
    const zoneResult = evaluateZoneRules(
      deptName, destName, deptId, destId, totalKm, fullSegments, stations, graph
    );

    // 5. ゾーン適用時の会社別営業キロ補正 (実乗車区間を中心駅発着に差し替え)
    const ZONE_COMPANY_MAP = {
      tokyo: 'east',
      yamanote: 'east',
      yokohama: 'east',
      sendai: 'east',
      nagoya: 'central',
      kyoto: 'west',
      osaka: 'west',
      kobe: 'west',
      hiroshima: 'west',
      sapporo: 'hokkaido',
      kitakyushu: 'kyushu',
      fukuoka: 'kyushu'
    };

    if (zoneResult.deptApplied && zoneResult.deptZone && deptName !== zoneResult.deptZone.centerName) {
      const borderStId = zoneResult.deptBorderStationId;
      const borderStName = stations[borderStId] ? stations[borderStId].name : borderStId;

      for (let i = 0; i < fullSegments.length; i++) {
        const seg = fullSegments[i];
        const isShinkansen = seg.isShinkansen || (seg.lineId && seg.lineId.startsWith('shinkansen-'));
        if (isShinkansen) break;

        const segKm = seg.dist !== undefined ? seg.dist : (seg.km || 0);
        const comp = getLineCompany(seg.lineId, seg.lineName, seg.from, seg.to, stations);
        if (comp === 'east') eastKm = Math.max(0, eastKm - segKm);
        else if (comp === 'central') centralKm = Math.max(0, centralKm - segKm);
        else if (comp === 'west') westKm = Math.max(0, westKm - segKm);
        else if (comp === 'hokkaido') hokkaidoKm = Math.max(0, hokkaidoKm - segKm);
        else if (comp === 'shikoku') shikokuKm = Math.max(0, shikokuKm - segKm);
        else if (comp === 'kyushu') kyushuKm = Math.max(0, kyushuKm - segKm);

        const fName = stations[seg.from] ? stations[seg.from].name : seg.from;
        const tName = stations[seg.to] ? stations[seg.to].name : seg.to;
        if (borderStId && (seg.to === borderStId || tName === borderStName)) {
          break;
        }
      }
      let deptComp = ZONE_COMPANY_MAP[zoneResult.deptZone.id] || 'east';
      // 特例: 東京都区内・山手線内で境界駅が「品川」かつ東海道新幹線へ接続する場合、中心駅(東京)〜品川はJR東海(central)に帰属
      if ((zoneResult.deptZone.id === 'tokyo' || zoneResult.deptZone.id === 'yamanote') && (borderStName === '品川' || borderStId === 'shinagawa')) {
        const hasTokaidoShinkansenFromShinagawa = fullSegments.some(s =>
          (s.from === 'shinagawa' || (stations[s.from] && stations[s.from].name === '品川')) &&
          (s.lineId === 'shinkansen-tokaido' || s.lineName === '東海道新幹線')
        );
        if (hasTokaidoShinkansenFromShinagawa) {
          deptComp = 'central';
        }
      }
      const addKm = zoneResult.deptBorderToCenter || 0;
      if (deptComp === 'east') eastKm += addKm;
      else if (deptComp === 'central') centralKm += addKm;
      else if (deptComp === 'west') westKm += addKm;
      else if (deptComp === 'hokkaido') hokkaidoKm += addKm;
      else if (deptComp === 'shikoku') shikokuKm += addKm;
      else if (deptComp === 'kyushu') kyushuKm += addKm;
    }

    if (zoneResult.destApplied && zoneResult.destZone && destName !== zoneResult.destZone.centerName) {
      const borderStId = zoneResult.destBorderStationId;
      const borderStName = stations[borderStId] ? stations[borderStId].name : borderStId;

      for (let i = fullSegments.length - 1; i >= 0; i--) {
        const seg = fullSegments[i];
        const isShinkansen = seg.isShinkansen || (seg.lineId && seg.lineId.startsWith('shinkansen-'));
        if (isShinkansen) break;

        const segKm = seg.dist !== undefined ? seg.dist : (seg.km || 0);
        const comp = getLineCompany(seg.lineId, seg.lineName, seg.from, seg.to, stations);
        if (comp === 'east') eastKm = Math.max(0, eastKm - segKm);
        else if (comp === 'central') centralKm = Math.max(0, centralKm - segKm);
        else if (comp === 'west') westKm = Math.max(0, westKm - segKm);
        else if (comp === 'hokkaido') hokkaidoKm = Math.max(0, hokkaidoKm - segKm);
        else if (comp === 'shikoku') shikokuKm = Math.max(0, shikokuKm - segKm);
        else if (comp === 'kyushu') kyushuKm = Math.max(0, kyushuKm - segKm);

        const fName = stations[seg.from] ? stations[seg.from].name : seg.from;
        const tName = stations[seg.to] ? stations[seg.to].name : seg.to;
        if (borderStId && (seg.from === borderStId || fName === borderStName)) {
          break;
        }
      }
      let destComp = ZONE_COMPANY_MAP[zoneResult.destZone.id] || 'west';
      // 特例: 東京都区内・山手線内で境界駅が「品川」かつ東海道新幹線から接続する場合、品川〜中心駅(東京)はJR東海(central)に帰属
      if ((zoneResult.destZone.id === 'tokyo' || zoneResult.destZone.id === 'yamanote') && (borderStName === '品川' || borderStId === 'shinagawa')) {
        const hasTokaidoShinkansenToShinagawa = fullSegments.some(s =>
          (s.to === 'shinagawa' || (stations[s.to] && stations[s.to].name === '品川')) &&
          (s.lineId === 'shinkansen-tokaido' || s.lineName === '東海道新幹線')
        );
        if (hasTokaidoShinkansenToShinagawa) {
          destComp = 'central';
        }
      }
      const addKm = zoneResult.destBorderToCenter || 0;
      if (destComp === 'east') eastKm += addKm;
      else if (destComp === 'central') centralKm += addKm;
      else if (destComp === 'west') westKm += addKm;
      else if (destComp === 'hokkaido') hokkaidoKm += addKm;
      else if (destComp === 'shikoku') shikokuKm += addKm;
      else if (destComp === 'kyushu') kyushuKm += addKm;
    }

    // 6. 主担当会社 & 跨線判定
    const kmMap = {
      east: Math.round(eastKm * 10) / 10,
      central: Math.round(centralKm * 10) / 10,
      west: Math.round(westKm * 10) / 10,
      hokkaido: Math.round(hokkaidoKm * 10) / 10,
      shikoku: Math.round(shikokuKm * 10) / 10,
      kyushu: Math.round(kyushuKm * 10) / 10
    };
    let primaryCompany = 'east';
    let maxKm = -1;
    for (const [comp, km] of Object.entries(kmMap)) {
      if (km > maxKm) {
        maxKm = km;
        primaryCompany = comp;
      }
    }
    const activeCompanies = Object.entries(kmMap).filter(([_, km]) => km > 0).map(([c]) => c);
    const isInterCompany = activeCompanies.length > 1;

    // 7. 運賃計算キロ (fareKm) の算出 (旅規第84条 換算キロ & 第86条・第87条 中心駅基準)
    let fareKm = totalKm;
    let isAvailable = true;

    if (suburbanInfo.isSuburbanOnly && isLoopRoute) {
      fareKm = 0.0;
      isAvailable = false;
    } else {
      let calcTrunkKm = effectiveTrunkKm;
      let calcLocalKm = effectiveLocalKm;

      if (zoneResult.deptApplied || zoneResult.destApplied) {
        calcTrunkKm = Math.max(0, zoneResult.fareBasisKm - calcLocalKm);
      }

      if (calcTrunkKm > 0 && calcLocalKm > 0) {
        fareKm = Math.ceil(calcTrunkKm + calcLocalKm * 1.1);
      } else if (calcTrunkKm === 0 && calcLocalKm > 0) {
        if (calcLocalKm <= 10) {
          fareKm = calcLocalKm;
        } else {
          fareKm = Math.ceil(calcLocalKm * 1.1);
        }
      } else {
        fareKm = calcTrunkKm;
      }

      if (suburbanInfo.isSuburbanOnly && !zoneResult.deptApplied && !zoneResult.destApplied && routeResult.directShortestKm !== undefined && routeResult.directShortestKm < fareKm) {
        fareKm = routeResult.directShortestKm;
      }
    }

    // 8. JR西日本の特定運賃適用チェック (電車特定区間・大阪環状線)
    const isOsakaLoopOnly = fullSegments.every(s => s.lineId === 'osaka-loop') && fareKm <= 25;

    // 全通過駅が WEST_DENSHA_TOKUTEI_STATIONS に含まれている場合のみ電車特定区間を適用
    const isDenshaTokuteiOnly = (
      primaryCompany === 'west' &&
      !isInterCompany &&
      fareKm <= 100 &&
      FareRulesData &&
      FareRulesData.WEST_DENSHA_TOKUTEI_STATIONS &&
      allStationIds.length > 0 &&
      allStationIds.every(id => {
        const name = stations[id] ? stations[id].name : id;
        return FareRulesData.WEST_DENSHA_TOKUTEI_STATIONS.has(name);
      })
    );

    // 9. 運賃計算 (大人・小児・学割)
    const fareOpts = {
      company: primaryCompany,
      isInterCompany: isInterCompany,
      eastKm: Math.round(eastKm * 10) / 10,
      hokkaidoKm: Math.round(hokkaidoKm * 10) / 10,
      shikokuKm: Math.round(shikokuKm * 10) / 10,
      kyushuKm: Math.round(kyushuKm * 10) / 10,
      isLocalOnly: (effectiveTrunkKm === 0 && effectiveLocalKm > 0),
      isOsakaLoopOnly: isOsakaLoopOnly,
      isDenshaTokuteiOnly: isDenshaTokuteiOnly
    };

    let adultFare = 0;
    if (isAvailable) {
      adultFare = calculateBaseFare(fareKm, fareOpts);
    }
    const childFare = Math.floor(adultFare / 2 / 10) * 10;

    // 学割運賃 (旅規第28条: 判定営業キロが100km超過で2割引・10円未満端数切捨)
    const evalBasisKm = (zoneResult.deptApplied || zoneResult.destApplied) ? zoneResult.fareBasisKm : totalKm;
    const isStudentEligible = evalBasisKm > 100.0;
    let studentFare = adultFare;
    if (isStudentEligible) {
      studentFare = Math.floor((adultFare * 0.8) / 10) * 10;
    }

    // 10. 有効期間日数 (旅規第154条: 営業キロまたは中心駅営業キロ)
    const validityDays = calculateValidityDays(evalBasisKm, suburbanInfo.isSuburbanOnly);

    // 11. 途中下車可否 (旅規第156条: 実営業キロ)
    const stopoverInfo = evaluateStopover(
      totalKm,
      suburbanInfo.isSuburbanOnly,
      isLoopRoute,
      suburbanInfo.hasShinkansen,
      suburbanInfo.shinkansenBypassed,
      hasTokaidoShinkansen
    );

    // 12. マルス経由線数カウント (16経路の壁)
    const marsRouteCount = lineRuns.length > 0 ? lineRuns.length : (sections.length > 0 ? sections.length : 1);
    const isMarsIssuable = (marsRouteCount <= 16);
    const marsIssuableStatus = isMarsIssuable
      ? `マルス発券可能（経由線数: ${marsRouteCount} / 16経路以内）`
      : `マルス発券不可・出札補充券対応（経由線数: ${marsRouteCount} / 16経路超過）`;

    // 一周乗車券 (発着同一駅) の特記事項
    let loopNote = null;
    if (isLoopRoute) {
      if (suburbanInfo.isSuburbanOnly) {
        loopNote = '【大都市近郊区間特例】近郊区間内完結のため、発着区間の最短営業キロ（0km・0円）が適用され、同一駅発着の片道乗車券は発売されません。';
      } else if (totalKm > 100) {
        loopNote = '【一周片道乗車券】営業キロ100km超過のため、みどりの窓口等で購入可能な片道普通乗車券です（旅規第68条第4号）。';
      } else {
        loopNote = '【発着同一駅】営業キロが100km以下の同一駅発着片道乗車券は原則発売されません。';
      }
    }

    return {
      totalKm: Math.round(totalKm * 10) / 10,
      fareKm: Math.round(fareKm * 10) / 10,
      trunkKm: Math.round(effectiveTrunkKm * 10) / 10,
      localKm: Math.round(effectiveLocalKm * 10) / 10,
      fareBasisKm: Math.round(evalBasisKm * 10) / 10,

      displayDeptName: zoneResult.displayDeptName,
      displayDestName: zoneResult.displayDestName,
      deptZoneApplied: zoneResult.deptApplied,
      destZoneApplied: zoneResult.destApplied,
      deptBorderStationId: zoneResult.deptBorderStationId,
      destBorderStationId: zoneResult.destBorderStationId,

      isAvailable: isAvailable,
      baseFare: adultFare,
      adultFare: adultFare,
      childFare: childFare,
      studentFare: studentFare,
      isStudentEligible: isStudentEligible,

      isEast2026Revision: true,
      primaryCompany: primaryCompany,
      isInterCompany: isInterCompany,
      eastKm: Math.round(eastKm * 10) / 10,
      centralKm: Math.round(centralKm * 10) / 10,
      westKm: Math.round(westKm * 10) / 10,
      hokkaidoKm: Math.round(hokkaidoKm * 10) / 10,
      shikokuKm: Math.round(shikokuKm * 10) / 10,
      kyushuKm: Math.round(kyushuKm * 10) / 10,

      article69Applied: art69Result.appliedCorridors.length > 0,
      article69Details: art69Result.appliedCorridors,
      article70Applied: !!routeResult.article70Applied,
      article70ShortenKm: article70ShortenKm,

      marsRouteCount: marsRouteCount,
      isMarsIssuable: isMarsIssuable,
      marsIssuableStatus: marsIssuableStatus,

      hasShinkansen: suburbanInfo.hasShinkansen,
      hasTokaidoShinkansen: hasTokaidoShinkansen,
      isSuburbanOnly: suburbanInfo.isSuburbanOnly,
      suburbanAreaName: suburbanInfo.areaName,
      shinkansenBypassed: suburbanInfo.shinkansenBypassed,

      validityDays: validityDays,
      validityText: `${validityDays}日間有効` + (suburbanInfo.isSuburbanOnly ? ' (当日限り)' : ''),
      stopoverAllowed: stopoverInfo.allowed,
      stopoverSummary: stopoverInfo.summary,
      stopoverDetail: stopoverInfo.detail,
      isLoopRoute: isLoopRoute,
      loopNote: loopNote
    };
  }

  // グローバルエクスポート
  const FareEngine = {
    JREAST_BASE_FARE_TABLE,
    JR_CENTRAL_WEST_FARE_TABLE,
    JREAST_ADDON_TABLE,
    SUBURBAN_DEFINITION,
    getLineCompany,
    calculateEastAddOn,
    calculateCentralWestBaseFare,
    calculateKyushuBaseFare,
    calculateHokkaidoBaseFare,
    calculateShikokuBaseFare,
    calculateBaseFare,
    evaluateSuburbanArea,
    calculateValidityDays,
    ZONE_MARK_MAP,
    isStationInZone,
    getStationZoneMarks,
    evaluateStopover,
    evaluateRouteFareAndRules
  };

  if (typeof window !== 'undefined') {
    window.JR_FARE_ENGINE = FareEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FareEngine;
  }
})();
