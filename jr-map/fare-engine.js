/**
 * JR Fare & Passenger Rules Engine (JR旅客営業規則・運賃計算・途中下車・有効期間判定)
 * 2026年3月14日 JR東日本運賃改定（通算加算方式・東海道新幹線別線化・鉄道駅バリアフリー料金廃止）完全準拠
 * 普通乗車券（片道マルス券）特化版
 */
(function() {
  // 1. JR東日本 幹線普通旅客運賃表 (2026年3月14日改定 公式A表完全準拠)
  // 電車特定区間・山手線内運賃は廃止され幹線運賃に統合。鉄道駅バリアフリー料金は廃止。
  // きっぷ（磁気券・10円単位）の運賃
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
   * @param {string} lineId 路線ID
   * @param {string} lineName 路線名
   * @param {string} [fromStation] 始点駅名またはID
   * @param {string} [toStation] 終点駅名またはID
   * @param {Object} [stations] 駅データ辞書
   */
  function getLineCompany(lineId, lineName, fromStation, toStation, stations = {}) {
    if (!lineId) return 'east';

    // 駅名の解決
    const getName = (st) => {
      if (!st) return '';
      if (stations[st] && stations[st].name) return stations[st].name;
      return st;
    };
    const fName = getName(fromStation);
    const tName = getName(toStation);

    // 1. 北陸新幹線 (境界: 上越妙高)
    // 東京〜上越妙高は JR東日本 ('east')、上越妙高〜敦賀は JR西日本 ('west')
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
    // 松本〜南小谷は JR東日本 ('east')、南小谷〜糸魚川は JR西日本 ('west')
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
   * 普通旅客運賃の計算 (大人・片道)
   * 2026年3月14日改定・通算加算方式対応
   */
  function calculateBaseFare(km, options = {}) {
    if (km <= 0) return 0;
    const roundedKm = Math.ceil(km);
    const company = options.company || 'east';
    const isInterCompany = !!options.isInterCompany;
    const eastKm = options.eastKm || (company === 'east' ? km : 0);

    // 1. JR東日本内完結 (公式A表を直接適用。1000km超は基準額計算式 + E表上限440円)
    if (company === 'east' && !isInterCompany) {
      for (const row of JREAST_BASE_FARE_TABLE) {
        if (roundedKm <= row.maxKm) return row.ticket;
      }
      return calculateCentralWestBaseFare(roundedKm) + 440;
    }

    // 2. JR他社内単独またはJR他社との跨線 (通算加算方式)
    const baseAmount = calculateCentralWestBaseFare(roundedKm);

    // 跨線時のみ JR東日本区間営業キロに応じた加算額 (公式E表) を上乗せ
    if (isInterCompany && eastKm > 0) {
      const addOn = calculateEastAddOn(eastKm);
      return baseAmount + addOn;
    }

    return baseAmount;
  }

  // 5. 大都市近郊区間の厳密な定義 (旅客営業規則 別表第2号)
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

  // キャッシュされたエリア別駅ID Set
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

      // 1. fullLines の駅を追加 (本線 + 支線 branches)
      def.fullLines.forEach(lineId => {
        const l = lineMap[lineId];
        if (l) {
          if (l.stations) {
            l.stations.forEach(id => stationSet.add(id));
          }
          if (l.branches && Array.isArray(l.branches)) {
            l.branches.forEach(b => {
              if (Array.isArray(b)) {
                b.forEach(id => stationSet.add(id));
              }
            });
          }
        }
      });

      // 2. boundedLines の区間駅を追加 (本線区間 + 近郊区間内の支線)
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

        // 近郊区間に属する支線 branches の取り込み
        if (l.branches && Array.isArray(l.branches)) {
          if (lineId === 'tohoku-main') {
            if (areaKey === 'tokyo' && l.branches[0]) {
              // 赤羽〜武蔵浦和〜大宮 (埼京線支線)
              l.branches[0].forEach(id => stationSet.add(id));
            } else if (areaKey === 'sendai' && l.branches[1]) {
              // 岩切〜利府 (利府支線)
              l.branches[1].forEach(id => stationSet.add(id));
            }
          } else if (lineId === 'suigun-line' && areaKey === 'tokyo' && l.branches[0]) {
            // 上菅谷〜常陸太田
            l.branches[0].forEach(id => stationSet.add(id));
          } else if (lineId === 'hanwa-line' && areaKey === 'osaka' && l.branches[0]) {
            // 鳳〜東羽衣
            l.branches[0].forEach(id => stationSet.add(id));
          }
        }
      }

      resultSets[areaKey] = stationSet;
    }

    CACHED_SUBURBAN_STATION_SETS = resultSets;
    return resultSets;
  }

  /**
   * 大都市近郊区間の厳密判定 (全エッジ・通過線区 & 全駅チェック)
   * ※新幹線が含まれる場合は無条件で除外（近郊区間特例なし）
   */
  function evaluateSuburbanArea(sections, allStationIds = [], stations = {}, lines = []) {
    if (!sections || sections.length === 0) {
      return { isSuburbanOnly: false, areaName: null, hasShinkansen: false, shinkansenBypassed: false };
    }

    const hasShinkansen = sections.some(s => s.isShinkansen || (s.lineId && s.lineId.startsWith('shinkansen-')));

    // 新幹線が1区間でも含まれる場合、大都市近郊区間の特例は適用除外
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

    // 各大都市近郊区間について、経路上の全エッジ（通過線区）および全駅が近郊区間内にあるか判定
    for (const [areaKey, def] of Object.entries(SUBURBAN_DEFINITION)) {
      const areaSet = stationSets[areaKey];
      if (!areaSet) continue;

      // 1. ルート上の全駅がこの近郊区間内か
      const allStationsInArea = allStationIds.every(id => areaSet.has(id));
      if (!allStationsInArea) continue;

      // 2. 経路上の全エッジ（通過線区）がこの近郊区間の対象路線か
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

    // いずれかの近郊区間外の駅・線区を通る、または複数近郊区間にまたがる場合
    return {
      isSuburbanOnly: false,
      areaName: null,
      hasShinkansen: false,
      shinkansenBypassed: false
    };
  }

  /**
   * 有効期間日数の計算 (旅規第154条)
   * ※営業キロ（km）で計算する (第154条第2項)
   * - 大都市近郊区間内相互発着 (新幹線なし): 1日 (当日限り)
   * - 100kmまで: 1日
   * - 101〜200km: 2日
   * - 201〜400km: 3日
   * - 401〜600km: 4日
   * - 601〜800km: 5日
   * - 801〜1000km: 6日
   * - 以降200kmごとに +1日
   */
  function calculateValidityDays(km, isSuburbanOnly) {
    if (isSuburbanOnly) return 1;
    if (km <= 100) return 1;
    return Math.floor((km - 1) / 200) + 2;
  }

  /**
   * 途中下車可否の判定 (旅規第156条・2026年3月改定対応)
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
    detail += ' 【旅規第70条特例】山手線周辺の特定区間を通過する場合、運賃は最短経路で計算され、区間内はう回乗車が可能です。';
    if (hasTokaidoShinkansen) {
      detail += ' 【重要：東海道新幹線別線化（2026年3月改定）】東京〜新大阪間の東海道新幹線（JR東海）と東海道本線は別線扱いとなり、別線相互の乗り分けが可能です。';
    } else if (hasShinkansen) {
      detail += '（同一線扱いの新幹線区間（上野〜大宮等）は並行在来線と同一線扱いとなります）';
    }

    return {
      allowed: true,
      summary: '途中下車可能',
      detail: detail
    };
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
    const deptId = routeResult.deptId;
    const destId = routeResult.destId;
    const allStationIds = routeResult.allStationIds || [];
    const isLoopRoute = (deptId === destId);

    // 大都市近郊区間 & 新幹線厳密判定
    const suburbanInfo = evaluateSuburbanArea(sections, allStationIds, stations, lines);

    // 会社別キロ集計 & 跨線判定 (エッジ・セクション単位で境界判定)
    let eastKm = 0;
    let centralKm = 0;
    let westKm = 0;
    let hokkaidoKm = 0;
    let shikokuKm = 0;
    let kyushuKm = 0;
    let hasTokaidoShinkansen = false;

    // fullSegments があればエッジ単位で正確に会社判定、なければ sections 単位
    const segmentsToEvaluate = routeResult.fullSegments || sections;
    segmentsToEvaluate.forEach(seg => {
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
    });

    const otherKm = centralKm + westKm + hokkaidoKm + shikokuKm + kyushuKm;
    const isInterCompany = (eastKm > 0 && otherKm > 0);
    const primaryCompany = (eastKm >= centralKm && eastKm >= westKm) ? 'east' : (centralKm >= westKm ? 'central' : 'west');

    // 運賃計算キロ (fareKm) の算出:
    // 大都市近郊区間内のみご利用の場合 (旅規第157条第2項): 最短経路で運賃計算
    let fareKm = totalKm;
    let baseFare = 0;
    let isAvailable = true;

    const fareOpts = {
      company: primaryCompany,
      isInterCompany: isInterCompany,
      eastKm: eastKm
    };

    if (suburbanInfo.isSuburbanOnly) {
      if (isLoopRoute) {
        // 発着同一駅: 最短距離は0km (0円) となり発売不可
        fareKm = 0.0;
        baseFare = 0;
        isAvailable = false;
      } else {
        // 最短営業キロを採用
        fareKm = (routeResult.directShortestKm !== undefined) ? routeResult.directShortestKm : totalKm;
        baseFare = calculateBaseFare(fareKm, fareOpts);
      }
    } else {
      fareKm = totalKm;
      baseFare = calculateBaseFare(fareKm, fareOpts);
    }

    // 有効期間日数は営業キロ (totalKm) で計算 (旅規第154条第2項)
    const validityDays = calculateValidityDays(totalKm, suburbanInfo.isSuburbanOnly);

    // 途中下車可否の判定 (旅規第156条) - 営業キロ (totalKm) で判定
    const stopoverInfo = evaluateStopover(
      totalKm,
      suburbanInfo.isSuburbanOnly,
      isLoopRoute,
      suburbanInfo.hasShinkansen,
      suburbanInfo.shinkansenBypassed,
      hasTokaidoShinkansen
    );

    // 一周乗車券 (発着同一駅) の特記事項
    let loopNote = null;
    if (isLoopRoute) {
      if (suburbanInfo.isSuburbanOnly) {
        loopNote = '【大都市近郊区間特例】近郊区間内完結のため、発着区間の最短営業キロ（0km・0円）が適用され、同一駅発着の片道乗車券は発売されません。一周の大回り乗車を行う場合は、隣駅を着駅に指定してください。※一部区間に新幹線を指定すると近郊区間特例が解除され、一周片道乗車券として購入可能です。';
      } else if (totalKm > 100) {
        loopNote = '【一周片道乗車券】営業キロ100km超過のため、みどりの窓口等で購入可能な片道普通乗車券です（旅規第68条第4号）。';
      } else {
        loopNote = '【発着同一駅】営業キロが100km以下の同一駅発着片道乗車券は原則発売されません（大回り乗車または別乗車券をご利用ください）。';
      }
    }

    return {
      totalKm: totalKm,
      fareKm: Math.round(fareKm * 10) / 10,
      isAvailable: isAvailable,
      baseFare: baseFare,       // 普通乗車券（片道マルス券）運賃
      isEast2026Revision: true, // 2026年3月14日改定適用フラグ
      isInterCompany: isInterCompany,
      eastKm: Math.round(eastKm * 10) / 10,
      centralKm: Math.round(centralKm * 10) / 10,
      westKm: Math.round(westKm * 10) / 10,
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
    calculateBaseFare,
    evaluateSuburbanArea,
    calculateValidityDays,
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
