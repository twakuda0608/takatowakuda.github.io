/**
 * JR Fare Rules & Special Area Data
 * 旅客営業規則（運賃表・幹線地方交通線区分・特定都区市内・旅規第69条）マスターデータ
 */
(function() {
  // 1. 地方交通線 (Local Lines) 路線ID定義 (旅規別表第1号準拠)
  const LOCAL_LINE_IDS = new Set([
    // JR東日本
    'hachiko-line',      // 八高線
    'agatsuma-line',     // 吾妻線
    'karasuyama-line',   // 烏山線
    'nikko-line',        // 日光線
    'suigun-line',       // 水郡線
    'kashima-line',      // 鹿島線
    'kururi-line',       // 久留里線
    'togane-line',       // 東金線
    'koumi-line',        // 小海線
    'iiyama-line',       // 飯山線
    'oito-line',         // 大糸線 (松本〜南小谷)
    'echigo-line',       // 越後線
    'yahiko-line',       // 弥彦線
    'yonesaka-line',     // 米坂線
    'tadami-line',       // 只見線
    'banetsu-east',      // 磐越東線
    'banetsu-west',      // 磐越西線
    'senzan-line',       // 仙山線
    'senseki-line',      // 仙石線
    'ishinomaki-line',   // 石巻線
    'ofunato-line',      // 大船渡線
    'kamaishi-line',     // 釜石線
    'yamada-line',       // 山田線
    'hachinohe-line',    // 八戸線
    'hanawa-line',       // 花輪線
    'kitakami-line',     // 北上線
    'tazawako-line',     // 田沢湖線
    'tsugaru-line',      // 津軽線
    'ominato-line',      // 大湊線
    'gonou-line',        // 五能線
    'oga-line',          // 男鹿線
    'rikuuto-line',      // 陸羽東線
    'rikuusai-line',     // 陸羽西線
    'aterazawa-line',    // 左沢線

    // JR東海
    'tokai-taita',       // 太多線
    'tokai-meisho',      // 名松線
    'tokai-sangu',       // 参宮線
    'tokai-taketoyo',    // 武豊線
    'tokai-iida',        // 飯田線
    'tokai-minobu',      // 身延線

    // JR西日本
    'obama-line',        // 小浜線
    'etsumihoku-line',   // 越美北線
    'nanao-line',        // 七尾線
    'johana-line',       // 城端線
    'himi-line',         // 氷見線
    'takayama-west',     // 高山本線 (猪谷〜富山)
    'oito-west',         // 大糸線 (南小谷〜糸魚川)
    'sakurai-line',      // 桜井線 (万葉まほろば線)
    'wakayama-line',     // 和歌山線
    'bantan-line',       // 播但線
    'kishin-line',       // 姫新線
    'kakogawa-line',     // 加古川線
    'maizuru-line',      // 舞鶴線
    'tsuyama-line',      // 津山線
    'kibi-line',         // 吉備線 (桃太郎線)
    'imbi-line',         // 因美線
    'sakai-line',        // 境線
    'kisuki-line',       // 木次線
    'geibi-line',        // 芸備線
    'fukuen-line',       // 福塩線
    'kure-line',         // 呉線
    'kabe-line',         // 可部線
    'gantoku-line',      // 岩徳線
    'yamaguchi-line',    // 山口線
    'ube-line',          // 宇部線
    'onoda-line',        // 小野田線
    'mine-line',         // 美祢線

    // JR四国
    'shikoku-naruto',    // 鳴門線
    'shikoku-tokushima', // 徳島線
    'shikoku-mugi',      // 牟岐線
    'shikoku-uchiko',    // 内子線
    'shikoku-yodo',      // 予土線

    // JR北海道
    'hokkaido-furano',   // 富良野線
    'hokkaido-senmo',    // 釧網本線
    'hokkaido-sassho',   // 札沼線 (学園都市線)
    'hokkaido-rumoi',    // 留萌本線
    'hokkaido-hidaka',   // 日高本線
    'hokkaido-sekihoku', // 石北本線

    // JR九州
    'kyushu-chikuhi',    // 筑肥線
    'kyushu-karatsu',    // 唐津線
    'kyushu-omura',      // 大村線
    'kyushu-kyudai',     // 久大本線
    'kyushu-hohi',       // 豊肥本線
    'kyushu-misumi',     // 三角線
    'kyushu-ibusuki',    // 指宿枕崎線
    'kyushu-nichinan',   // 日南線
    'kyushu-miyazaki-airport', // 宮崎空港線
    'kyushu-kitto',      // 吉都線
    'kyushu-hisatsu',    // 肥薩線
    'kyushu-kashii',     // 香椎線
    'kyushu-gotoji',     // 後藤寺線
    'kyushu-hitahikosan' // 日田彦山線
  ]);

  /**
   * セグメント（通過区間）が地方交通線かどうか判定
   * ※宗谷本線（名寄〜稚内）や筑豊本線（若松〜折尾、桂川〜原田）の区間判定を含む
   */
  function isLocalLineSegment(lineId, fromId, toId, stations) {
    if (LOCAL_LINE_IDS.has(lineId)) return true;

    // 宗谷本線 (名寄〜稚内は地方交通線、旭川〜名寄は幹線)
    if (lineId === 'hokkaido-soya') {
      const stFrom = stations[fromId];
      const stTo = stations[toId];
      const nFrom = stFrom ? stFrom.name : fromId;
      const nTo = stTo ? stTo.name : toId;
      const soyaMainStationNames = new Set([
        '旭川', '旭川四条', '新旭川', '永山', '北永山', '比布', '蘭留',
        '塩狩', '和寒', '剣淵', '士別', '多寄', '瑞穂', '風連', '名寄高校', '名寄'
      ]);
      if (soyaMainStationNames.has(nFrom) && soyaMainStationNames.has(nTo)) {
        return false; // 幹線
      }
      return true; // 名寄以北は地方交通線
    }

    // 筑豊本線 (折尾〜桂川は幹線、若松〜折尾および桂川〜原田は地方交通線)
    if (lineId === 'kyushu-chikuho') {
      const stFrom = stations[fromId];
      const stTo = stations[toId];
      const nFrom = stFrom ? stFrom.name : fromId;
      const nTo = stTo ? stTo.name : toId;
      const chikuhoMainTrunkNames = new Set([
        '折尾', '東水巻', '中間', '筑前垣生', '鞍手', '筑前植木', '新入',
        '直方', '勝野', '小竹', '鯰田', '浦田', '新飯塚', '飯塚', '天道', '桂川'
      ]);
      if (chikuhoMainTrunkNames.has(nFrom) && chikuhoMainTrunkNames.has(nTo)) {
        return false; // 幹線
      }
      return true; // 若松〜折尾、桂川〜原田は地方交通線
    }

    return false;
  }

  // 2. 運賃表 (Fare Tables) 定義

  // A. 各社 地方交通線 10km以下初乗り運賃テーブル (旅規第84条第1項第2号準拠)
  // ※11km以上は換算キロ（Math.ceil(localKm * 1.1)）で各社幹線運賃表を参照
  const LOCAL_UNDER_10KM_TABLES = {
    east: [
      { maxKm: 3, ticket: 160 },
      { maxKm: 6, ticket: 200 },
      { maxKm: 10, ticket: 220 }
    ],
    central: [
      { maxKm: 3, ticket: 150 },
      { maxKm: 6, ticket: 190 },
      { maxKm: 10, ticket: 210 }
    ],
    west: [
      { maxKm: 3, ticket: 150 },
      { maxKm: 6, ticket: 190 },
      { maxKm: 10, ticket: 210 }
    ],
    hokkaido: [
      { maxKm: 3, ticket: 200 },
      { maxKm: 6, ticket: 250 },
      { maxKm: 10, ticket: 300 }
    ],
    shikoku: [
      { maxKm: 3, ticket: 190 },
      { maxKm: 6, ticket: 240 },
      { maxKm: 10, ticket: 280 }
    ],
    kyushu: [
      { maxKm: 3, ticket: 170 },
      { maxKm: 6, ticket: 210 },
      { maxKm: 10, ticket: 230 }
    ]
  };

  // B. JR西日本 電車特定区間 (C表)
  const WEST_DENSHA_TOKUTEI_TABLE = [
    { maxKm: 3, ticket: 140 }, { maxKm: 6, ticket: 170 }, { maxKm: 10, ticket: 190 },
    { maxKm: 15, ticket: 230 }, { maxKm: 20, ticket: 320 }, { maxKm: 25, ticket: 410 },
    { maxKm: 30, ticket: 490 }, { maxKm: 35, ticket: 580 }, { maxKm: 40, ticket: 670 },
    { maxKm: 45, ticket: 750 }, { maxKm: 50, ticket: 840 }, { maxKm: 60, ticket: 960 },
    { maxKm: 70, ticket: 1140 }, { maxKm: 80, ticket: 1300 }, { maxKm: 90, ticket: 1470 },
    { maxKm: 100, ticket: 1630 }
  ];

  // C. JR西日本 大阪環状線内 (D表)
  const WEST_OSAKA_LOOP_TABLE = [
    { maxKm: 3, ticket: 140 }, { maxKm: 6, ticket: 170 }, { maxKm: 10, ticket: 190 },
    { maxKm: 15, ticket: 220 }, { maxKm: 20, ticket: 250 }, { maxKm: 25, ticket: 280 }
  ];

  // D. JR北海道 幹線単独運賃表 (1000kmまで完備)
  const HOKKAIDO_MAIN_FARE_TABLE = [
    { maxKm: 3, ticket: 200 }, { maxKm: 6, ticket: 250 }, { maxKm: 10, ticket: 290 },
    { maxKm: 15, ticket: 340 }, { maxKm: 20, ticket: 440 }, { maxKm: 25, ticket: 540 },
    { maxKm: 30, ticket: 640 }, { maxKm: 35, ticket: 750 }, { maxKm: 40, ticket: 860 },
    { maxKm: 45, ticket: 970 }, { maxKm: 50, ticket: 1070 }, { maxKm: 60, ticket: 1290 },
    { maxKm: 70, ticket: 1480 }, { maxKm: 80, ticket: 1680 }, { maxKm: 90, ticket: 1890 },
    { maxKm: 100, ticket: 2100 }, { maxKm: 120, ticket: 2490 }, { maxKm: 140, ticket: 2860 },
    { maxKm: 160, ticket: 3240 }, { maxKm: 180, ticket: 3630 }, { maxKm: 200, ticket: 4070 },
    { maxKm: 220, ticket: 4400 }, { maxKm: 240, ticket: 4840 }, { maxKm: 260, ticket: 5170 },
    { maxKm: 280, ticket: 5610 }, { maxKm: 300, ticket: 5940 }, { maxKm: 320, ticket: 6380 },
    { maxKm: 340, ticket: 6710 }, { maxKm: 360, ticket: 7040 }, { maxKm: 380, ticket: 7370 },
    { maxKm: 400, ticket: 7700 }, { maxKm: 420, ticket: 8030 }, { maxKm: 440, ticket: 8360 },
    { maxKm: 460, ticket: 8690 }, { maxKm: 480, ticket: 9020 }, { maxKm: 500, ticket: 9350 },
    { maxKm: 520, ticket: 9680 }, { maxKm: 540, ticket: 10010 }, { maxKm: 560, ticket: 10340 },
    { maxKm: 580, ticket: 10670 }, { maxKm: 600, ticket: 11000 },
    { maxKm: 640, ticket: 11440 }, { maxKm: 680, ticket: 11770 }, { maxKm: 720, ticket: 12210 },
    { maxKm: 760, ticket: 12540 }, { maxKm: 800, ticket: 12980 }, { maxKm: 840, ticket: 13310 },
    { maxKm: 880, ticket: 13640 }, { maxKm: 920, ticket: 14080 }, { maxKm: 960, ticket: 14410 },
    { maxKm: 1000, ticket: 14740 }
  ];

  // E. JR四国 幹線単独運賃表 (400kmまで完備)
  const SHIKOKU_MAIN_FARE_TABLE = [
    { maxKm: 3, ticket: 190 }, { maxKm: 6, ticket: 240 }, { maxKm: 10, ticket: 260 },
    { maxKm: 15, ticket: 300 }, { maxKm: 20, ticket: 400 }, { maxKm: 25, ticket: 500 },
    { maxKm: 30, ticket: 600 }, { maxKm: 35, ticket: 690 }, { maxKm: 40, ticket: 790 },
    { maxKm: 45, ticket: 880 }, { maxKm: 50, ticket: 990 }, { maxKm: 60, ticket: 1160 },
    { maxKm: 70, ticket: 1350 }, { maxKm: 80, ticket: 1520 }, { maxKm: 90, ticket: 1720 },
    { maxKm: 100, ticket: 1910 }, { maxKm: 120, ticket: 2240 }, { maxKm: 140, ticket: 2570 },
    { maxKm: 160, ticket: 2900 }, { maxKm: 180, ticket: 3240 }, { maxKm: 200, ticket: 3570 },
    { maxKm: 220, ticket: 3840 }, { maxKm: 240, ticket: 4160 }, { maxKm: 260, ticket: 4440 },
    { maxKm: 280, ticket: 4760 }, { maxKm: 300, ticket: 5040 },
    { maxKm: 320, ticket: 5360 }, { maxKm: 340, ticket: 5590 }, { maxKm: 360, ticket: 5910 },
    { maxKm: 380, ticket: 6230 }, { maxKm: 400, ticket: 6450 }
  ];

  // F. JR九州 幹線単独運賃表 (600kmまで完備・公式準拠)
  const KYUSHU_MAIN_FARE_TABLE = [
    { maxKm: 3, ticket: 170 }, { maxKm: 6, ticket: 210 }, { maxKm: 10, ticket: 230 },
    { maxKm: 15, ticket: 280 }, { maxKm: 20, ticket: 380 }, { maxKm: 25, ticket: 480 },
    { maxKm: 30, ticket: 570 }, { maxKm: 35, ticket: 660 }, { maxKm: 40, ticket: 760 },
    { maxKm: 45, ticket: 860 }, { maxKm: 50, ticket: 950 }, { maxKm: 60, ticket: 1130 },
    { maxKm: 70, ticket: 1310 }, { maxKm: 80, ticket: 1500 }, { maxKm: 90, ticket: 1680 },
    { maxKm: 100, ticket: 1850 }, { maxKm: 120, ticket: 2170 }, { maxKm: 140, ticket: 2530 },
    { maxKm: 160, ticket: 2860 }, { maxKm: 180, ticket: 3200 }, { maxKm: 200, ticket: 3520 },
    { maxKm: 220, ticket: 3790 }, { maxKm: 240, ticket: 4110 }, { maxKm: 260, ticket: 4370 },
    { maxKm: 280, ticket: 4700 }, { maxKm: 300, ticket: 4960 }, { maxKm: 320, ticket: 5290 },
    { maxKm: 340, ticket: 5610 }, { maxKm: 360, ticket: 5940 }, { maxKm: 380, ticket: 6270 },
    { maxKm: 400, ticket: 6490 }, { maxKm: 420, ticket: 6820 }, { maxKm: 440, ticket: 7040 },
    { maxKm: 460, ticket: 7370 }, { maxKm: 480, ticket: 7590 }, { maxKm: 500, ticket: 7920 },
    { maxKm: 520, ticket: 8250 }, { maxKm: 540, ticket: 8470 }, { maxKm: 560, ticket: 8800 },
    { maxKm: 580, ticket: 9020 }, { maxKm: 600, ticket: 9350 }
  ];

  // G. 三島会社 跨線加算額表 (本州3社と跨る場合、三島会社区間の営業キロに応じて加算)
  const HOKKAIDO_ADDON_TABLE = [
    { maxKm: 25, addOn: 110 }, { maxKm: 50, addOn: 150 }, { maxKm: 75, addOn: 200 },
    { maxKm: 100, addOn: 240 }, { maxKm: 150, addOn: 290 }, { maxKm: 99999, addOn: 330 }
  ];

  const SHIKOKU_ADDON_TABLE = [
    { maxKm: 25, addOn: 110 }, { maxKm: 50, addOn: 150 }, { maxKm: 75, addOn: 190 },
    { maxKm: 100, addOn: 240 }, { maxKm: 150, addOn: 280 }, { maxKm: 99999, addOn: 330 }
  ];

  const KYUSHU_ADDON_TABLE = [
    { maxKm: 25, addOn: 70 }, { maxKm: 50, addOn: 110 }, { maxKm: 75, addOn: 140 },
    { maxKm: 100, addOn: 170 }, { maxKm: 150, addOn: 200 }, { maxKm: 99999, addOn: 220 }
  ];

  // 3. JR西日本 電車特定区間 対象駅セット (旅規第78条第1項第2号準拠)
  const WEST_DENSHA_TOKUTEI_STATIONS = new Set([
    // 東海道・山陽本線: 京都〜西明石
    '京都', '西大路', '桂川', '向日町', '長岡京', '山崎', '島本', '高槻', '摂津富田', 'JR総持寺',
    '茨木', '千里丘', '岸辺', '吹田', '東淀川', '新大阪', '大阪', '塚本', '尼崎', '立花',
    '甲子園口', '西宮', 'さくら夙川', '芦屋', '甲南山手', '摂津本山', '住吉', '六甲道', '摩耶', '灘',
    '三ノ宮', '元町', '神戸', '兵庫', '新長田', '鷹取', '須磨海浜公園', '須磨', '塩屋', '垂水',
    '舞子', '朝霧', '明石', '西明石',

    // 山陽本線(和田岬線): 兵庫〜和田岬
    '和田岬',

    // 大阪環状線: 全線
    '大阪', '福島', '野田', '西九条', '弁天町', '大正', '芦原橋', '今宮', '新今宮', '天王寺',
    '寺田町', '桃谷', '鶴橋', '玉造', '森ノ宮', '大阪城公園', '京橋', '桜ノ宮', '天満',

    // 桜島線 (JRゆめ咲線): 全線
    '安治川口', 'ユニバーサルシティ', '桜島',

    // JR東西線: 全線
    '大阪城北詰', '大阪天満宮', '北新地', '新福島', '海老江', '御幣島', '加島',

    // 片町線 (学研都市線: 京橋〜木津)
    '鴫野', '放出', '徳庵', '鴻池新田', '住道', '野崎', '四条畷', '忍ケ丘', '忍ヶ丘', '東寝屋川', '寝屋川公園',
    '星田', '河内磐船', '津田', '藤阪', '長尾', '松井山手', '大住', '京田辺', '同志社前', 'JR三山木',
    '下狛', '祝園', '西木津', '木津',

    // おおさか東線: 新大阪〜久宝寺
    '南吹田', 'JR淡路', '城北公園通', 'JR野江', '高井田中央', 'JR河内永和',
    'JR俊徳道', 'JR長瀬', '衣摺加美北', '新加美', '久宝寺',

    // 関西本線 (大和路線: JR難波〜奈良)
    'JR難波', '東部市場前', '平野', '加美', '八尾', '志紀',
    '柏原', '高井田', '河内堅上', '三郷', '王寺', '法隆寺', '大和小泉', '郡山', '奈良',

    // 阪和線 (天王寺〜和歌山、鳳〜東羽衣: 全線)
    '美章園', '南田辺', '鶴ヶ丘', '長居', '我孫子町', '杉本町', '浅香', '堺市', '三国ヶ丘',
    '百舌鳥', '上野芝', '津久野', '鳳', '富木', '北信太', '信太山', '和泉府中', '久米田', '下松',
    '東岸和田', '東貝塚', '和泉橋本', '東佐野', '熊取', '日根野', '長滝', '新家', '和泉砂川',
    '和泉鳥取', '山中渓', '紀伊', '六十谷', '紀伊中ノ島', '和歌山', '東羽衣',

    // 関西空港線 (日根野〜関西空港: 全線)
    'りんくうタウン', '関西空港',

    // 奈良線 (京都〜木津: 全線)
    '東福寺', '稲荷', 'JR藤森', '桃山', '六地蔵', '木幡', '黄檗', '宇治', 'JR小倉',
    '新田', '城陽', '長池', '山城青谷', '山城多賀', '玉水', '棚倉', '上狛',

    // 福知山線 (JR宝塚線: 尼崎〜新三田)
    '塚口', '猪名寺', '伊丹', '北伊丹', '川西池田', '中山寺', '宝塚', '生瀬', '西宮名塩',
    '武田尾', '道場', '三田', '新三田',

    // 山陰本線 (嵯峨野線: 京都〜園部)
    '梅小路京都西', '丹波口', '二条', '円町', '花園', '太秦', '嵯峨嵐山', '保津峡', '馬堀',
    '亀岡', '並河', '千代川', '八木', '吉富', '園部',

    // 湖西線 (山科〜近江舞子)
    '山科', '大津京', '唐崎', '比叡山坂本', 'おごと温泉', '堅田', '小野', '和邇', '蓬莱',
    '志賀', '比良', '近江舞子',

    // 和歌山線 (王寺〜高田)
    '畠田', '志都美', '香芝', 'JR五位堂', '高田',

    // 桜井線 (万葉まほろば線: 奈良〜高田)
    '京終', '帯解', '櫟本', '天理', '長柄', '柳本', '巻向', '三輪', '桜井', '香久山', '畝傍', '金橋'
  ]);

  // 4. 特定都区市内 (旅規第86条) & 東京山手線内 (旅規第87条) 定義
  const SPECIFIC_CITY_ZONES = {
    // A. 東京山手線内 (中心駅: 東京) - 片道101〜200kmで適用
    yamanote: {
      id: 'yamanote',
      displayName: '東京山手線内',
      centerName: '東京',
      centerId: 'tokyo',
      minKm: 101,
      maxKm: 200,
      stationNames: new Set([
        '東京', '有楽町', '新橋', '浜松町', '田町', '高輪ゲートウェイ', '品川',
        '大崎', '五反田', '目黒', '恵比寿', '渋谷', '原宿', '代々木', '新宿',
        '新大久保', '高田馬場', '目白', '池袋', '大塚', '巣鴨', '駒込', '田端',
        '西日暮里', '日暮里', '鶯谷', '上野', '御徒町', '秋葉原', '神田',
        '御茶ノ水', '水道橋', '飯田橋', '市ヶ谷', '四ツ谷', '信濃町', '千駄ヶ谷'
      ])
    },

    // B. 東京都区内 (中心駅: 東京) - 片道201km以上で適用
    tokyo: {
      id: 'tokyo',
      displayName: '東京都区内',
      centerName: '東京',
      centerId: 'tokyo',
      minKm: 201,
      stationNames: new Set([
        '東京', '有楽町', '新橋', '浜松町', '田町', '高輪ゲートウェイ', '品川',
        '大崎', '五反田', '目黒', '恵比寿', '渋谷', '原宿', '代々木', '新宿',
        '新大久保', '高田馬場', '目白', '池袋', '大塚', '巣鴨', '駒込', '田端',
        '西日暮里', '日暮里', '鶯谷', '上野', '御徒町', '秋葉原', '神田',
        '御茶ノ水', '水道橋', '飯田橋', '市ヶ谷', '四ツ谷', '信濃町', '千駄ヶ谷',
        '大久保', '東中野', '中野', '高円寺', '阿佐ヶ谷', '荻窪', '西荻窪',
        '浅草橋', '両国', '錦糸町', '亀戸', '平井', '新小岩', '小岩', '新日本橋', '馬喰町',
        '八丁堀', '越中島', '潮見', '新木場', '葛西臨海公園',
        '大井町', '大森', '蒲田', '西大井',
        '尾久', '上中里', '王子', '東十条', '十条', '板橋', '赤羽', '北赤羽', '浮間舟渡',
        '三河島', '南千住', '北千住', '綾瀬', '亀有', '金町'
      ])
    },

    // C. 横浜市内 (中心駅: 横浜) - 片道201km以上で適用
    yokohama: {
      id: 'yokohama',
      displayName: '横浜市内',
      centerName: '横浜',
      centerId: 'yokohama',
      minKm: 201,
      stationNames: new Set([
        '横浜', '保土ケ谷', '東戸塚', '戸塚',
        '桜木町', '関内', '石川町', '山手', '根岸', '磯子', '新杉田', '洋光台', '港南台', '本郷台', '大船',
        '東神奈川', '大口', '菊名', '新横浜', '小机', '鴨居', '中山', '十日市場', '長津田',
        '鶴見', '国道', '鶴見小野', '弁天橋', '浅野', '安善', '武蔵白石', '浜川崎', '昭和', '扇町', '新芝浦', '海芝浦', '大川',
        '新子安', '矢向'
      ])
    },

    // D. 名古屋市内 (中心駅: 名古屋) - 片道201km以上で適用
    nagoya: {
      id: 'nagoya',
      displayName: '名古屋市内',
      centerName: '名古屋',
      centerId: 'nagoya',
      minKm: 201,
      stationNames: new Set([
        '名古屋', '尾頭橋', '金山', '熱田', '笠寺', '大高', '南大高',
        '千種', '大曽根', '新守山', '鶴舞',
        '八田', '春田'
      ])
    },

    // E. 京都市内 (中心駅: 京都) - 片道201km以上で適用
    kyoto: {
      id: 'kyoto',
      displayName: '京都市内',
      centerName: '京都',
      centerId: 'kyoto',
      minKm: 201,
      stationNames: new Set([
        '京都', '山科', '西大路', '桂川',
        '梅小路京都西', '丹波口', '二条', '円町', '花園', '太秦', '嵯峨嵐山', '保津峡',
        '東福寺', '稲荷', 'JR藤森', '桃山'
      ])
    },

    // F. 大阪市内 (中心駅: 大阪) - 片道201km以上で適用
    osaka: {
      id: 'osaka',
      displayName: '大阪市内',
      centerName: '大阪',
      centerId: 'st-fzkz',
      minKm: 201,
      stationNames: new Set([
        '大阪', '塚本', '新大阪',
        '福島', '野田', '西九条', '弁天町', '大正', '芦原橋', '今宮', '新今宮', '天王寺',
        '寺田町', '桃谷', '鶴橋', '玉造', '森ノ宮', '大阪城公園', '京橋', '桜ノ宮', '天満',
        '安治川口', 'ユニバーサルシティ', '桜島',
        '加島', '御幣島', '海老江', '新福島', '北新地', '大阪天満宮', '大阪城北詰',
        '鴫野', '放出',
        '城北公園通', 'JR野江', 'JR河内永和', 'JR俊徳道', 'JR長瀬', '衣摺加美北', '新加美',
        'JR難波', '東部市場前', '平野', '加美',
        '美章園', '南田辺', '鶴ヶ丘', '長居', '我孫子町', '杉本町'
      ])
    },

    // G. 神戸市内 (中心駅: 神戸) - 片道201km以上で適用
    kobe: {
      id: 'kobe',
      displayName: '神戸市内',
      centerName: '神戸',
      centerId: 'st-l6l6',
      minKm: 201,
      stationNames: new Set([
        '神戸', '元町', '三ノ宮', '灘', '摩耶', '六甲道', '住吉', '摂津本山', '甲南山手',
        '兵庫', '新長田', '鷹取', '須磨海浜公園', '須磨', '塩屋', '垂水', '舞子',
        '新神戸', '道場'
      ])
    },

    // H. 広島市内 (中心駅: 広島) - 片道201km以上で適用
    hiroshima: {
      id: 'hiroshima',
      displayName: '広島市内',
      centerName: '広島',
      centerId: 'hiroshima',
      minKm: 201,
      stationNames: new Set([
        '広島', '天神川', '向洋', '海田市', '安芸阿賀', '矢野',
        '西原', '横川', '西広島', '新井口', '五日市',
        '新白島', '安芸長束', '下祇園', '古市橋', '大町', '緑井', '七軒茶屋', '梅林', '上八木', '中八木', '八木', '可部', '河戸帆待川', 'あき亀山',
        '戸坂', '安芸矢口', '玖村', '下深川', '中深川', '上深川', '狩留家', '白木山', '中三田', '上三田', '志和口', '井原市'
      ])
    },

    // I. 北九州市内 (中心駅: 小倉) - 片道201km以上で適用
    kitakyushu: {
      id: 'kitakyushu',
      displayName: '北九州市内',
      centerName: '小倉',
      centerId: 'kokura',
      minKm: 201,
      stationNames: new Set([
        '小倉', '西小倉', '九州工大前', '戸畑', '枝光', 'スペースワールド', '八幡', '黒崎', '陣原', '折尾',
        '門司港', '小森江', '門司',
        '南小倉', '城野', '安部山公園', '下曽根', '朽網',
        '石田', '志井公園', '志井', '石原町', '呼野',
        '若松', '藤ノ木', '奥洞海', '二島', '本城'
      ])
    },

    // J. 福岡市内 (中心駅: 博多) - 片道201km以上で適用
    fukuoka: {
      id: 'fukuoka',
      displayName: '福岡市内',
      centerName: '博多',
      centerId: 'hakata',
      minKm: 201,
      stationNames: new Set([
        '博多', '吉塚', '箱崎', '千早', '香椎', '九産大前', '福工大前',
        '竹下', '笹原', '南福岡',
        '西戸崎', '海ノ中道', '雁ノ巣', '奈多', '和白', '香椎神宮', '舞松原', '土井',
        '姪浜', '下山門', '今宿', '九大学研都市', '周船寺'
      ])
    },

    // K. 仙台市内 (中心駅: 仙台) - 片道201km以上で適用
    sendai: {
      id: 'sendai',
      displayName: '仙台市内',
      centerName: '仙台',
      centerId: 'sendai',
      minKm: 201,
      stationNames: new Set([
        '仙台', '東仙台', '岩切', '南仙台', '太子堂', '長町',
        '北仙台', '北山', '東北福祉大前', '国見', '葛岡', '陸前落合', '愛子', '陸前白沢', '熊ヶ根', '作並', '八ツ森', '奥新川',
        'あおば通', '榴ケ岡', '宮城野原', '陸前原ノ町', '苦竹', '小鶴新田', '福田町', '陸前高砂', '中野栄'
      ])
    },

    // L. 札幌市内 (中心駅: 札幌) - 片道201km以上で適用
    sapporo: {
      id: 'sapporo',
      displayName: '札幌市内',
      centerName: '札幌',
      centerId: 'sapporo',
      minKm: 201,
      stationNames: new Set([
        '札幌', '桑園', '琴似', '発寒中央', '発寒', '稲積公園', '手稲', '稲穂', '星置', 'ほしみ',
        '苗穂', '白石', '厚別', '森林公園',
        '平和', '新札幌', '上野幌',
        '八軒', '新川', '新琴似', '太平', '百合が原', '篠路', '拓北', 'あいの里教育大', 'あいの里公園'
      ])
    }
  };

  // 5. 旅規第69条 (特定区間通過の最短営業キロ計算) 区間定義
  const ARTICLE_69_CORRIDORS = [
    {
      id: 'art69::mihara-kaitaichi',
      name: '三原〜海田市（呉線迂回）',
      endStationNames: ['三原', '海田市'],
      detourLineIds: new Set(['kure-line']),
      shortcutLineId: 'sanyo-main',
      shortcutKm: 71.4,
      detourKm: 87.0
    },
    {
      id: 'art69::akabane-omiya',
      name: '赤羽〜大宮（埼京線迂回）',
      endStationNames: ['赤羽', '大宮'],
      detourLineIds: new Set(['tohoku-main']),
      detourStationNames: new Set(['武蔵浦和']),
      shortcutLineId: 'tohoku-main',
      shortcutKm: 17.1,
      detourKm: 18.0
    },
    {
      id: 'art69::iwakuni-kushigahama',
      name: '岩国〜櫛ケ浜（山陽本線柳井迂回）',
      endStationNames: ['岩国', '櫛ケ浜'],
      detourLineIds: new Set(['sanyo-main']),
      detourStationNames: new Set(['柳井']),
      shortcutLineId: 'gantoku-line',
      shortcutKm: 43.7,
      detourKm: 65.4
    },
    {
      id: 'art69::shinosaka-amagasaki',
      name: '新大阪〜尼崎（東西線・おおさか東線迂回）',
      endStationNames: ['新大阪', '尼崎'],
      detourLineIds: new Set(['osaka-higashi', 'jr-tozai', 'katamachi-line']),
      shortcutLineId: 'tokaido-west',
      shortcutKm: 11.5, // 東海道本線経由（新大阪〜大阪3.8 + 大阪〜塚本3.8 + 塚本〜尼崎3.9）
      detourKm: 17.8    // おおさか東線・東西線鴫野・北新地経由概算
    },
    {
      id: 'art69::kashii-hakata',
      name: '香椎〜博多（香椎線・篠栗線迂回）',
      endStationNames: ['香椎', '博多'],
      detourLineIds: new Set(['kyushu-kashii', 'kyushu-sasaguri']),
      shortcutLineId: 'kyushu-kagoshima',
      shortcutKm: 8.4,
      detourKm: 14.9
    },
    {
      id: 'art69::nippori-akabane',
      name: '日暮里〜赤羽（尾久経由・田端経由同一扱い）',
      endStationNames: ['日暮里', '赤羽'],
      detourLineIds: new Set(['tohoku-main', 'yamanote', 'keihin-tohoku']),
      shortcutLineId: 'tohoku-main',
      shortcutKm: 7.4,
      detourKm: 7.4
    }
  ];

  // 公開オブジェクト
  const FareRulesData = {
    LOCAL_LINE_IDS,
    isLocalLineSegment,
    LOCAL_UNDER_10KM_TABLES,
    WEST_DENSHA_TOKUTEI_TABLE,
    WEST_OSAKA_LOOP_TABLE,
    WEST_DENSHA_TOKUTEI_STATIONS,
    HOKKAIDO_MAIN_FARE_TABLE,
    HOKKAIDO_ADDON_TABLE,
    SHIKOKU_MAIN_FARE_TABLE,
    SHIKOKU_ADDON_TABLE,
    KYUSHU_MAIN_FARE_TABLE,
    KYUSHU_ADDON_TABLE,
    SPECIFIC_CITY_ZONES,
    ARTICLE_69_CORRIDORS
  };

  if (typeof window !== 'undefined') {
    window.JR_FARE_RULES_DATA = FareRulesData;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FareRulesData;
  }
})();
