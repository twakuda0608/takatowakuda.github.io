/**
 * JR Fare & Passenger Rules Engine (JR旅客営業規則・運賃計算・途中下車・有効期間判定)
 * 2026年3月14日 JR東日本運賃改定（パンフレット https://www.jreast.co.jp/2026unchin-kaitei/assets/pdf/pamphlet.pdf）完全準拠
 */
(function() {
  // 1. JR東日本 幹線普通旅客運賃表 (2026年3月14日改定)
  // 電車特定区間・山手線内運賃は廃止され、幹線運賃に統合。鉄道駅バリアフリー料金は廃止（運賃に内包）。
  // きっぷ（磁気券・10円単位）およびICカード（1円単位）の運賃
  const JREAST_BASE_FARE_TABLE = [
    { maxKm: 3, ticket: 160, ic: 155 },
    { maxKm: 6, ticket: 200, ic: 199 },
    { maxKm: 10, ticket: 210, ic: 209 },
    { maxKm: 15, ticket: 260, ic: 253 }, // 三鷹〜新宿(13.8km)はここ！
    { maxKm: 20, ticket: 350, ic: 341 },
    { maxKm: 25, ticket: 440, ic: 440 },
    { maxKm: 30, ticket: 530, ic: 528 },
    { maxKm: 35, ticket: 620, ic: 616 },
    { maxKm: 40, ticket: 720, ic: 715 },
    { maxKm: 45, ticket: 810, ic: 803 },
    { maxKm: 50, ticket: 910, ic: 902 },
    { maxKm: 60, ticket: 1040, ic: 1040 },
    { maxKm: 70, ticket: 1230, ic: 1230 },
    { maxKm: 80, ticket: 1410, ic: 1410 },
    { maxKm: 90, ticket: 1600, ic: 1600 },
    { maxKm: 100, ticket: 1790, ic: 1790 },
    { maxKm: 120, ticket: 2090, ic: 2090 },
    { maxKm: 140, ticket: 2420, ic: 2420 },
    { maxKm: 160, ticket: 2750, ic: 2750 },
    { maxKm: 180, ticket: 3190, ic: 3190 },
    { maxKm: 200, ticket: 3520, ic: 3520 },
    { maxKm: 220, ticket: 3850, ic: 3850 },
    { maxKm: 240, ticket: 4180, ic: 4180 },
    { maxKm: 260, ticket: 4620, ic: 4620 },
    { maxKm: 280, ticket: 5060, ic: 5060 },
    { maxKm: 300, ticket: 5390, ic: 5390 },
    { maxKm: 320, ticket: 5500, ic: 5500 },
    { maxKm: 340, ticket: 5720, ic: 5720 },
    { maxKm: 360, ticket: 6050, ic: 6050 },
    { maxKm: 380, ticket: 6380, ic: 6380 },
    { maxKm: 400, ticket: 6930, ic: 6930 },
    { maxKm: 420, ticket: 7260, ic: 7260 },
    { maxKm: 440, ticket: 7480, ic: 7480 },
    { maxKm: 460, ticket: 7810, ic: 7810 },
    { maxKm: 480, ticket: 8030, ic: 8030 },
    { maxKm: 500, ticket: 8360, ic: 8360 },
    { maxKm: 520, ticket: 8690, ic: 8690 },
    { maxKm: 540, ticket: 9020, ic: 9020 },
    { maxKm: 560, ticket: 9350, ic: 9350 },
    { maxKm: 580, ticket: 9570, ic: 9570 },
    { maxKm: 600, ticket: 9900, ic: 9900 },
    { maxKm: 640, ticket: 10230, ic: 10230 },
    { maxKm: 680, ticket: 10450, ic: 10450 },
    { maxKm: 720, ticket: 10780, ic: 10780 },
    { maxKm: 760, ticket: 11110, ic: 11110 },
    { maxKm: 800, ticket: 11440, ic: 11440 }
  ];

  // JR他社（JR東海・JR西日本等の本州従来運賃表：改定なし）
  const JR_CENTRAL_WEST_FARE_TABLE = [
    { maxKm: 3, ticket: 150 }, { maxKm: 6, ticket: 190 }, { maxKm: 10, ticket: 200 },
    { maxKm: 15, ticket: 240 }, { maxKm: 20, ticket: 310 }, { maxKm: 25, ticket: 420 },
    { maxKm: 30, ticket: 510 }, { maxKm: 35, ticket: 590 }, { maxKm: 40, ticket: 680 },
    { maxKm: 45, ticket: 770 }, { maxKm: 50, ticket: 860 }, { maxKm: 60, ticket: 990 },
    { maxKm: 70, ticket: 1170 }, { maxKm: 80, ticket: 1340 }, { maxKm: 90, ticket: 1520 },
    { maxKm: 100, ticket: 1690 }, { maxKm: 120, ticket: 1980 }, { maxKm: 140, ticket: 2310 },
    { maxKm: 160, ticket: 2640 }, { maxKm: 180, ticket: 3080 }, { maxKm: 200, ticket: 3410 },
    { maxKm: 220, ticket: 3740 }, { maxKm: 240, ticket: 4070 }, { maxKm: 260, ticket: 4510 },
    { maxKm: 280, ticket: 4840 }, { maxKm: 300, ticket: 5170 }, { maxKm: 320, ticket: 5500 },
    { maxKm: 340, ticket: 5720 }, { maxKm: 360, ticket: 6050 }, { maxKm: 380, ticket: 6380 },
    { maxKm: 400, ticket: 6710 }
  ];

  /**
   * 普通旅客運賃の計算 (大人・片道)
   * 2026年3月14日 JR東日本運賃改定に準拠
   */
  function calculateBaseFare(km, options = {}) {
    if (km <= 0) return 0;
    const roundedKm = Math.ceil(km);
    const company = options.company || 'east'; // デフォルトはJR東日本

    if (company === 'east') {
      for (const row of JREAST_BASE_FARE_TABLE) {
        if (roundedKm <= row.maxKm) {
          return row.ticket;
        }
      }
      // 800km超 (40kmごとに+330円加算)
      const extraSteps = Math.ceil((roundedKm - 800) / 40);
      return 11440 + extraSteps * 330;
    } else {
      // JR他社区間
      for (const row of JR_CENTRAL_WEST_FARE_TABLE) {
        if (roundedKm <= row.maxKm) {
          return row.ticket;
        }
      }
      const step = Math.ceil((roundedKm - 600) / 40);
      const midKm = 600 + (step * 40 - 20);
      const baseAmount = (300 * 16.20) + (300 * 12.85) + ((midKm - 600) * 7.05);
      return Math.round((baseAmount * 1.10) / 10) * 10;
    }
  }

  /**
   * ICカード運賃の計算 (大人・片道)
   */
  function calculateIcFare(km, options = {}) {
    if (km <= 0) return 0;
    const roundedKm = Math.ceil(km);
    for (const row of JREAST_BASE_FARE_TABLE) {
      if (roundedKm <= row.maxKm) {
        return row.ic || row.ticket;
      }
    }
    const extraSteps = Math.ceil((roundedKm - 800) / 40);
    return 11440 + extraSteps * 330;
  }

  // 2. 新幹線特急料金テーブル (大人・片道・通常期)
  const SHINKANSEN_EXPRESS_TABLE = [
    { maxKm: 100, reserved: 2510, nonReserved: 1760, nearNonReserved: 870 },
    { maxKm: 200, reserved: 3170, nonReserved: 2530 },
    { maxKm: 300, reserved: 3720, nonReserved: 3210 },
    { maxKm: 400, reserved: 4280, nonReserved: 3750 },
    { maxKm: 500, reserved: 4830, nonReserved: 4300 },
    { maxKm: 600, reserved: 5270, nonReserved: 4740 },
    { maxKm: 700, reserved: 5710, nonReserved: 5180 },
    { maxKm: 800, reserved: 6150, nonReserved: 5620 },
    { maxKm: 900, reserved: 6690, nonReserved: 6160 },
    { maxKm: 1000, reserved: 7130, nonReserved: 6600 }
  ];

  /**
   * 新幹線特急料金の計算 (通常期指定席 / 自由席)
   */
  function calculateShinkansenExpressFare(km) {
    if (km <= 0) return { reserved: 0, nonReserved: 0, km: 0 };
    const roundedKm = Math.ceil(km);

    // 50km以下の近距離区間 (上野〜大宮 26.7km、東京〜大宮 30.3km、新横浜〜小田原等) は特定特急券 870円
    const isNearDistance = (roundedKm <= 50);

    for (const row of SHINKANSEN_EXPRESS_TABLE) {
      if (roundedKm <= row.maxKm) {
        const nonRes = (isNearDistance && row.nearNonReserved) ? row.nearNonReserved : row.nonReserved;
        return {
          km: Math.round(km * 10) / 10,
          reserved: row.reserved,
          nonReserved: nonRes,
          isNearSpecial: isNearDistance
        };
      }
    }

    const extraSteps = Math.ceil((roundedKm - 1000) / 100);
    const res = 7130 + extraSteps * 440;
    return {
      km: Math.round(km * 10) / 10,
      reserved: res,
      nonReserved: res - 530,
      isNearSpecial: false
    };
  }

  // 3. 大都市近郊区間の定義
  const SUBURBAN_AREAS = {
    tokyo: {
      name: '東京近郊区間',
      lineIds: new Set([
        'yamanote', 'negishi-line', 'akabane-line', 'tokaido', 'yokosuka-line', 'yokohama-line',
        'nambu', 'sagami', 'tsurumi-line', 'ito-line', 'keiyo', 'musashino', 'takasaki-line',
        'ome-line', 'shinetsu-takasaki', 'chuo-main', 'chuo-tatsuno', 'kawagoe-line', 'agatsuma-line',
        'karasuyama-line', 'kashima-line', 'togane-line', 'kururi-line', 'suigun-line', 'ryomo-line',
        'mito-line', 'nikko-line', 'hachiko-line', 'uchibo-line', 'sotobo-line', 'narita-line',
        'sobu-main', 'itsukaichi-line', 'tohoku-main', 'joban', 'joetsu-line', 'koumi-line',
        'shinetsu-nagano', 'shinonoi-line', 'oito-line'
      ]),
      // 境界駅 (これを超えると近郊区間外)
      borders: {
        'tokaido': ['atami'],              // 熱海まで
        'tohoku-main': ['kuroiso'],        // 黒磯まで
        'joban': ['st-j7ed', '浪江'],       // 浪江まで
        'joetsu-line': ['minakami'],       // 水上まで
        'chuo-main': ['shiojiri'],         // 塩尻まで
        'shinetsu-takasaki': ['st-ikmr', '横川'], // 横川まで
        'koumi-line': ['nobeyama'],        // 野辺山まで
        'suigun-line': ['hitachi-daigo'],  // 常陸大子まで
        'oito-line': ['hakuba']            // 白馬まで
      }
    },
    osaka: {
      name: '大阪近郊区間',
      lineIds: new Set([
        'tokaido-west', 'sanyo-main', 'sanyo-wadamisaki', 'osaka-loop', 'jr-tozai', 'fukuchiyama-line',
        'hanwa-line', 'kansai-west', 'nara-line', 'hokuriku-main', 'kosei-line', 'kusatsu-line',
        'kisei-west', 'wakayama-line', 'sakurai-line', 'kanku-line', 'katamachi-line', 'osaka-higashi',
        'bantan-line', 'kishin-line', 'akaho-line', 'ako-line'
      ])
    },
    fukuoka: {
      name: '福岡近郊区間',
      lineIds: new Set([
        'kyushu-kagoshima', 'kyushu-nippo', 'kyushu-nagasaki', 'kyushu-chikuhi', 'kyushu-chikuho',
        'kyushu-sasaguri', 'kyushu-gotoji', 'kyushu-kashii'
      ])
    },
    niigata: {
      name: '新潟近郊区間',
      lineIds: new Set([
        'shinetsu-line', 'hakushin-line', 'echigo-line', 'yahiko-line', 'uetsu-main', 'banetsu-west'
      ])
    },
    sendai: {
      name: '仙台近郊区間',
      lineIds: new Set([
        'senzan-line', 'senseki-line', 'ishinomaki-line', 'rikuuto-line'
      ])
    }
  };

  /**
   * 大都市近郊区間の判定 (新幹線判定を含む)
   * ※重要: 新幹線が1区間でも含まれる場合、大都市近郊区間の特例は適用除外
   */
  function evaluateSuburbanArea(sections) {
    if (!sections || sections.length === 0) {
      return { isSuburbanOnly: false, areaName: null, hasShinkansen: false, shinkansenBypassed: false };
    }

    const hasShinkansen = sections.some(s => s.isShinkansen || (s.lineId && s.lineId.startsWith('shinkansen-')));

    for (const [key, area] of Object.entries(SUBURBAN_AREAS)) {
      const allInArea = sections.every(s => area.lineIds.has(s.lineId) || s.isShinkansen);
      const allInZairaiArea = sections.every(s => area.lineIds.has(s.lineId));

      if (hasShinkansen && allInArea) {
        return {
          isSuburbanOnly: false,
          areaName: area.name,
          hasShinkansen: true,
          shinkansenBypassed: true
        };
      }

      if (!hasShinkansen && allInZairaiArea) {
        return {
          isSuburbanOnly: true,
          areaName: area.name,
          hasShinkansen: false,
          shinkansenBypassed: false
        };
      }
    }

    return {
      isSuburbanOnly: false,
      areaName: null,
      hasShinkansen: hasShinkansen,
      shinkansenBypassed: false
    };
  }

  /**
   * 有効期間日数の計算 (旅規第154条)
   * - 大都市近郊区間内完結 (新幹線なし): 1日 (当日限り)
   * - 100km以下: 1日
   * - 101〜200km: 2日
   * - 201〜400km: 3日
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

    let detail = '途中下車可能（有効期間内であれば指定区間内の各駅で何度でも途中下車できます）。';
    if (isLoopRoute) {
      detail += ' ※発着駅（または同一駅）では下車前途無効となります。';
    }
    if (shinkansenBypassed) {
      detail += ' 【新幹線特例】新幹線利用区間が含まれるため、大都市近郊区間の最短経路特例が解除され、実際の経路通りの営業キロで途中下車が可能です。';
    }
    detail += ' 【旅規第70条特例】山手線周辺（新宿〜赤羽等）の特定区間を通過する場合、運賃は最短経路（埼京線・池袋経由等）で計算され、区間内はう回乗車（上野経由の新幹線乗車など）が可能です（第159条）。';
    if (hasTokaidoShinkansen) {
      detail += ' 【重要：東海道新幹線別線化（2026年3月改定）】東京〜熱海間の東海道新幹線（JR東海）と東海道本線（JR東日本）は別線扱いとなり、新幹線経由の乗車券では並行在来線への乗車・途中下車はできません。';
    } else if (hasShinkansen) {
      detail += '（JR東日本自社内の新幹線区間（上野〜大宮等）は並行在来線と同一線扱いの特例が維持されているため、新幹線経由の乗車券で並行在来線に乗車することも可能です）';
    }

    return {
      allowed: true,
      summary: '途中下車可能',
      detail: detail
    };
  }

  /**
   * 総合判定メインAPI (2026年3月14日JR東日本運賃改定準拠)
   */
  function evaluateRouteFareAndRules(routeResult, stations = {}, lines = [], options = {}) {
    if (!routeResult || !routeResult.success) {
      return null;
    }

    const totalKm = routeResult.totalKm || 0;
    const sections = routeResult.sections || [];
    const deptId = routeResult.deptId;
    const destId = routeResult.destId;
    const isLoopRoute = (deptId === destId);

    // 大都市近郊区間 & 新幹線判定
    const suburbanInfo = evaluateSuburbanArea(sections);

    // 新幹線利用区間の抽出 & 特急料金算出 & 東海道新幹線別線化チェック
    const shinkansenSections = [];
    let currentShinkansenKm = 0;
    let shinkansenFrom = null;
    let shinkansenTo = null;
    let hasTokaidoShinkansen = false;

    // 1. sections 内の新幹線区間を集計
    sections.forEach((sec) => {
      const isShinkansen = sec.isShinkansen || (sec.lineId && sec.lineId.startsWith('shinkansen-'));
      if (isShinkansen) {
        if (!shinkansenFrom) shinkansenFrom = sec.deptName;
        shinkansenTo = sec.destName;
        currentShinkansenKm += sec.km;

        if (sec.lineId === 'shinkansen-tokaido' || sec.lineName === '東海道新幹線') {
          hasTokaidoShinkansen = true;
        }
      } else {
        if (shinkansenFrom && shinkansenTo) {
          const exp = calculateShinkansenExpressFare(currentShinkansenKm);
          shinkansenSections.push({
            from: shinkansenFrom,
            to: shinkansenTo,
            km: Math.round(currentShinkansenKm * 10) / 10,
            reserved: exp.reserved,
            nonReserved: exp.nonReserved,
            isNearSpecial: exp.isNearSpecial
          });
          shinkansenFrom = null;
          shinkansenTo = null;
          currentShinkansenKm = 0;
        }
      }
    });
    if (shinkansenFrom && shinkansenTo) {
      const exp = calculateShinkansenExpressFare(currentShinkansenKm);
      shinkansenSections.push({
        from: shinkansenFrom,
        to: shinkansenTo,
        km: Math.round(currentShinkansenKm * 10) / 10,
        reserved: exp.reserved,
        nonReserved: exp.nonReserved,
        isNearSpecial: exp.isNearSpecial
      });
    }

    // 2. sections に新幹線がない場合のフォールバック (options.shinkansenSegments)
    const optShinkansenSegs = options.shinkansenSegments || [];
    if (shinkansenSections.length === 0 && optShinkansenSegs.length > 0) {
      optShinkansenSegs.forEach(seg => {
        const fromSt = stations[seg.fromId] || (stations[seg.from] ? stations[seg.from] : null);
        const toSt = stations[seg.toId] || (stations[seg.to] ? stations[seg.to] : null);
        const fromName = fromSt ? fromSt.name : (seg.fromName || seg.from || seg.fromId);
        const toName = toSt ? toSt.name : (seg.toName || seg.to || seg.toId);

        let segKm = seg.km || 0;
        if (!segKm) {
          if ((fromName === '上野' && toName === '大宮') || (fromName === '大宮' && toName === '上野')) segKm = 26.7;
          else if ((fromName === '東京' && toName === '大宮') || (fromName === '大宮' && toName === '東京')) segKm = 30.3;
          else if ((fromName === '東京' && toName === '熱海') || (fromName === '熱海' && toName === '東京')) segKm = 104.6;
          else if ((fromName === '新横浜' && toName === '小田原') || (fromName === '小田原' && toName === '新横浜')) segKm = 55.1;
          else segKm = 30.0;
        }

        const exp = calculateShinkansenExpressFare(segKm);
        shinkansenSections.push({
          from: fromName,
          to: toName,
          km: segKm,
          reserved: exp.reserved,
          nonReserved: exp.nonReserved,
          isNearSpecial: exp.isNearSpecial
        });

        if (fromName === '熱海' || toName === '熱海' || seg.lineId === 'shinkansen-tokaido') {
          hasTokaidoShinkansen = true;
        }
      });
    }

    if (shinkansenSections.length > 0) {
      suburbanInfo.hasShinkansen = true;
      suburbanInfo.isSuburbanOnly = false;
      suburbanInfo.shinkansenBypassed = true;
    }

    // 特急料金合計
    const totalExpressReserved = shinkansenSections.reduce((sum, s) => sum + s.reserved, 0);
    const totalExpressNonReserved = shinkansenSections.reduce((sum, s) => sum + s.nonReserved, 0);

    // 運賃計算キロ (fareKm) の算出:
    // 大都市近郊区間内のみご利用の場合 (旅規第157条第2項):
    // 実際にご乗車になる経路にかかわらず、最も安くなる経路 (最短経路) で運賃を計算
    let fareKm = totalKm;
    let baseFare = 0;
    let icFare = 0;
    let isAvailable = true;

    if (suburbanInfo.isSuburbanOnly) {
      if (isLoopRoute) {
        // 発着同一駅 (三鷹 -> 三鷹 等): 最短距離は0km (0円) となり、大都市近郊区間特例上は発売不可
        fareKm = 0.0;
        baseFare = 0;
        icFare = 0;
        isAvailable = false;
      } else {
        // 発着が異なる駅 (三鷹 -> 武蔵境 等): 発着区間の最短営業キロを採用
        fareKm = (routeResult.directShortestKm !== undefined) ? routeResult.directShortestKm : totalKm;
        baseFare = calculateBaseFare(fareKm, options);
        icFare = calculateIcFare(fareKm, options);
      }
    } else {
      // 新幹線利用区間が含まれる、または近郊区間外に跨る場合:
      // 近郊区間特例は解除され、実際の乗車経路 (第70条適用時は最短キロ) で計算
      fareKm = totalKm;
      baseFare = calculateBaseFare(fareKm, options);
      icFare = calculateIcFare(fareKm, options);
    }

    // 有効期間日数
    const validityDays = calculateValidityDays(fareKm, suburbanInfo.isSuburbanOnly);

    // 途中下車可否
    const stopoverInfo = evaluateStopover(
      fareKm,
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
        loopNote = '【大都市近郊区間特例】近郊区間内完結のため、発着区間の最短営業キロ（0km・0円）が適用され、同一駅発着の片道乗車券は発売されません。一周の大回り乗車を行う場合は、隣駅（例: 武蔵境）を着駅に指定してください。※一部区間に新幹線を指定すると近郊区間特例が解除され、一周片道乗車券として購入可能です。';
      } else if (totalKm > 100) {
        loopNote = '【一周片道乗車券】営業キロ100km超過のため、みどりの窓口等で購入可能な片道普通乗車券です（旅規第68条第4号）。';
      } else {
        loopNote = '【発着同一駅】営業キロが100km以下の同一駅発着片道乗車券は原則発売されません（大回り乗車または別乗車券をご利用ください）。';
      }
    }

    return {
      totalKm: totalKm,
      fareKm: fareKm,
      isAvailable: isAvailable,
      baseFare: baseFare,       // きっぷ運賃（紙の乗車券）
      icFare: icFare,           // IC運賃
      isEast2026Revision: true, // 2026年3月14日改定適用フラグ
      expressReserved: totalExpressReserved,
      expressNonReserved: totalExpressNonReserved,
      totalFareWithReserved: baseFare + totalExpressReserved,
      totalFareWithNonReserved: baseFare + totalExpressNonReserved,
      hasShinkansen: suburbanInfo.hasShinkansen,
      hasTokaidoShinkansen: hasTokaidoShinkansen,
      shinkansenSections: shinkansenSections,
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
    calculateBaseFare,
    calculateIcFare,
    calculateShinkansenExpressFare,
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
