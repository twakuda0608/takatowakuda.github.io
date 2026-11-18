/**
 * JR Route Engine & MARS Route Generator
 * マルス経由線名算出 & 一筆書き・最短経路探索エンジン
 */
(function() {
  // 1. マルス路線名辞書 (JR旅客営業規則・マルス経由線略称)
  const MARS_LINE_NAMES = {
    // 新幹線
    'shinkansen-tokaido': '東海新',
    'shinkansen-sanyo': '山陽新',
    'shinkansen-tohoku': '東北新',
    'shinkansen-joetsu': '上越新',
    'shinkansen-hokuriku': '北陸新',
    'shinkansen-kyushu': '九州新',
    'shinkansen-nishi-kyushu': '西九州新',
    'shinkansen-hokkaido': '北海新',
    'shinkansen-yamagata': '奥羽',
    'shinkansen-akita': '田沢湖',

    // 関東・東日本主要幹線
    'yamanote': '山手',
    'tokaido': '東海道',
    'chuo-main': '中央東',
    'chuo-tatsuno': '辰野',
    'tokai-chuo': '中央西',
    'sobu-main': '総武',
    'tohoku-main': '東北',
    'joban': '常磐',
    'takasaki-line': '高崎',
    'joetsu-line': '上越',
    'shinetsu-line': '信越',
    'shinetsu-takasaki': '信越',
    'shinonoi-line': '篠ノ井',
    'negishi-line': '根岸',
    'yokohama-line': '横浜',
    'nambu': '南武',
    'tsurumi-line': '鶴見',
    'musashino': '武蔵野',
    'keiyo': '京葉',
    'akabane-line': '赤羽',
    'yokosuka-line': '横須賀',
    'sagami': '相模',
    'ito-line': '伊東',
    'ome-line': '青梅',
    'itsukaichi-line': '五日市',
    'hachiko-line': '八高',
    'kawagoe-line': '川越',
    'ryomo-line': '両毛',
    'mito-line': '水戸',
    'nikko-line': '日光',
    'karasuyama-line': '烏山',
    'agatsuma-line': '吾妻',
    'uchibo-line': '内房',
    'sotobo-line': '外房',
    'narita-line': '成田',
    'kashima-line': '鹿島',
    'kururi-line': '久留里',
    'togane-line': '東金',
    'suigun-line': '水郡',

    // 東北・甲信越
    'banetsu-west': '磐越西',
    'banetsu-east': '磐越東',
    'ou-main': '奥羽',
    'uetsu-main': '羽越',
    'senzan-line': '仙山',
    'senseki-line': '仙石',
    'ishinomaki-line': '石巻',
    'ofunato-line': '大船渡',
    'kamaishi-line': '釜石',
    'yamada-line': '山田',
    'hachinohe-line': '八戸',
    'hanawa-line': '花輪',
    'kitakami-line': '北上',
    'tazawako-line': '田沢湖',
    'tsugaru-line': '津軽',
    'ominato-line': '大湊',
    'gonou-line': '五能',
    'oga-line': '男鹿',
    'rikuuto-line': '陸羽東',
    'rikuusai-line': '陸羽西',
    'yonesaka-line': '米坂',
    'aterazawa-line': '左沢',
    'tadami-line': '只見',
    'echigo-line': '越後',
    'yahiko-line': '弥彦',
    'hakushin-line': '白新',
    'iiyama-line': '飯山',
    'oito-line': '大糸',
    'koumi-line': '小海',

    // 東海
    'tokai-tokaido': '東海道',
    'tokai-minoakasaka': '赤坂',
    'tokai-kansai': '関西',
    'tokai-kisei': '紀勢',
    'tokai-takayama': '高山',
    'tokai-iida': '飯田',
    'tokai-minobu': '身延',
    'tokai-gotemba': '御殿場',
    'tokai-taketoyo': '武豊',
    'tokai-taita': '太多',
    'tokai-sangu': '参宮',
    'tokai-meisho': '名松',

    // 近畿・西日本
    'tokaido-west': '東海道',
    'sanyo-main': '山陽',
    'sanin-main': '山陰',
    'osaka-loop': '大阪環',
    'jr-tozai': '東西',
    'fukuchiyama-line': '福知山',
    'hanwa-line': '阪和',
    'kansai-west': '関西',
    'nara-line': '奈良',
    'hokuriku-main': '北陸',
    'kosei-line': '湖西',
    'kusatsu-line': '草津',
    'kisei-west': '紀勢',
    'wakayama-line': '和歌山',
    'sakurai-line': '桜井',
    'kanku-line': '関空',
    'katamachi-line': '片町',
    'osaka-higashi': 'おおさか東',
    'bantan-line': '播但',
    'maizuru-line': '舞鶴',
    'hakubi-line': '伯備',
    'kishin-line': '姫新',
    'tsuyama-line': '津山',
    'kibi-line': '吉備',
    'uno-line': '宇野',
    'seto-ohashi-west': '本四備讃',
    'akaho-line': '赤穂',
    'geibi-line': '芸備',
    'fukuen-line': '福塩',
    'kure-line': '呉',
    'kabe-line': '可部',
    'gantoku-line': '岩徳',
    'yamaguchi-line': '山口',
    'mine-line': '美祢',
    'ube-line': '宇部',
    'onoda-line': '小野田',
    'inbi-line': '因美',
    'sakai-line': '境',
    'kisuki-line': '木次',

    // 四国
    'shikoku-yosan': '予讃',
    'shikoku-dosan': '土讃',
    'shikoku-kotoku': '高徳',
    'shikoku-tokushima': '徳島',
    'shikoku-naruto': '鳴門',
    'shikoku-mugi': '牟岐',
    'shikoku-yodo': '予土',
    'shikoku-uchiko': '内子',
    'shikoku-seto-ohashi': '本四備讃',

    // 九州
    'kyushu-kagoshima': '鹿児島',
    'kyushu-nippo': '日豊',
    'kyushu-nagasaki': '長崎',
    'kyushu-sasebo': '佐世保',
    'kyushu-omura': '大村',
    'kyushu-kyudai': '久大',
    'kyushu-hohi': '豊肥',
    'kyushu-misumi': '三角',
    'kyushu-hisatsu': '肥薩',
    'kyushu-kitto': '吉都',
    'kyushu-nichinan': '日南',
    'kyushu-miyazaki-kuko': '宮崎空',
    'kyushu-ibusuki': '指宿枕',
    'kyushu-chikuhi': '筑肥',
    'kyushu-karatsu': '唐津',
    'kyushu-chikuho': '筑豊',
    'kyushu-sasaguri': '篠栗',
    'kyushu-gotoji': '後藤寺',
    'kyushu-kashii': '香椎',

    // 北海道
    'hokkaido-hakodate': '函館',
    'hokkaido-chitose': '千歳',
    'hokkaido-muroran': '室蘭',
    'hokkaido-sekisho': '石勝',
    'hokkaido-nemuro': '根室',
    'hokkaido-furano': '富良野',
    'hokkaido-soya': '宗谷',
    'hokkaido-sekihoku': '石北',
    'hokkaido-senmo': '釧網',
    'hokkaido-sassho': '札沼',
    'hokkaido-rumoi': '留萌',
    'hokkaido-hidaka': '日高',
    'hokkaido-kaikyo': '海峡'
  };

  function getMarsLineName(line) {
    if (!line) return '';
    if (MARS_LINE_NAMES[line.id]) return MARS_LINE_NAMES[line.id];
    let name = line.name || '';
    name = name.replace('本線', '').replace('線', '');
    if (line.category === 'shinkansen' && !name.endsWith('新')) {
      name += '新';
    }
    return name;
  }

  // 2点間距離 (km)
  function calcDistKm(st1, st2) {
    const dLat = (st1.lat - st2.lat) * 111.13;
    const dLng = (st1.lng - st2.lng) * 91.0;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  // 公式営業キロ程テーブル (東海道本線・東海道新幹線・美濃赤坂支線)
  // 東京起点 (km)
  const TOKAIDO_KILO = {
    '東京': 0.0, '有楽町': 0.8, '新橋': 1.9, '浜松町': 3.1, '田町': 4.6, '高輪ゲートウェイ': 5.9, '品川': 6.8,
    '大井町': 9.2, '大森': 11.4, '蒲田': 14.4, '川崎': 18.2, '鶴見': 21.7, '新子安': 24.8, '東神奈川': 27.2,
    '横浜': 28.8, '保土ケ谷': 31.8, '東戸塚': 36.7, '戸塚': 40.9, '大船': 46.5, '藤沢': 51.1, '辻堂': 54.8,
    '茅ヶ崎': 58.6, '平塚': 63.8, '大磯': 67.8, '二宮': 73.1, '国府津': 77.7, '鴨宮': 80.8, '小田原': 83.9,
    '早川': 86.0, '根府川': 90.4, '真鶴': 95.8, '湯河原': 99.1, '熱海': 104.6, '函南': 114.5, '三島': 120.7,
    '沼津': 126.2, '片浜': 130.3, '原': 132.8, '東田子の浦': 137.4, '吉原': 141.3, '富士': 146.2, '富士川': 149.7,
    '新蒲原': 152.5, '蒲原': 154.9, '由比': 158.4, '興津': 164.3, '清水': 169.0, '草薙': 174.2, '東静岡': 177.4,
    '静岡': 180.2, '安倍川': 184.5, '用宗': 186.6, '焼津': 193.7, '西焼津': 197.0, '藤枝': 200.3, '六合': 204.9,
    '島田': 207.8, '金谷': 212.9, '菊川': 222.2, '掛川': 229.3, '愛野': 234.6, '袋井': 238.1, '御厨': 242.7,
    '磐田': 245.9, '豊田町': 248.8, '天竜川': 252.7, '浜松': 257.1, '高塚': 262.4, '舞阪': 267.5, '弁天島': 269.8,
    '新居町': 272.9, '鷲津': 276.6, '新所原': 282.4, '二川': 286.7, '豊橋': 293.6, '西小坂井': 298.4, '愛知御津': 302.1,
    '三河大塚': 305.2, '三河三谷': 308.3, '蒲郡': 310.6, '三河塩津': 312.9, '三ヶ根': 315.5, '幸田': 318.5, '相見': 321.6,
    '岡崎': 325.9, '西岡崎': 330.1, '安城': 333.7, '三河安城': 336.3, '東刈谷': 338.1, '野田新町': 339.7, '刈谷': 341.6,
    '逢妻': 343.5, '大府': 346.5, '共和': 349.5, '南大高': 351.8, '大高': 353.6, '笠寺': 356.8, '熱田': 360.8,
    '金山': 363.6, '尾頭橋': 364.5, '名古屋': 366.0, '枇杷島': 370.0, '清洲': 373.8, '稲沢': 377.1, '尾張一宮': 383.1,
    '木曽川': 388.6, '岐阜': 396.3, '西岐阜': 399.5, '穂積': 402.3, '大垣': 410.0, '垂井': 418.1, '関ヶ原': 423.8,
    '柏原': 430.9, '近江長岡': 435.2, '醒ヶ井': 439.8, '米原': 445.9, '彦根': 451.9, '南彦根': 455.2, '河瀬': 458.0,
    '稲枝': 462.0, '能登川': 467.4, '安土': 472.8, '近江八幡': 477.4, '篠原': 481.4, '野洲': 487.0, '守山': 490.1,
    '栗東': 492.2, '草津': 494.5, '南草津': 497.0, '瀬田': 499.7, '石山': 503.2, '膳所': 505.9, '大津': 507.7,
    '山科': 511.2, '京都': 513.6, '西大路': 516.1, '桂川': 518.9, '向日町': 520.0, '長岡京': 523.7, '山崎': 527.7,
    '島本': 529.9, '高槻': 535.2, '摂津富田': 538.5, 'JR総持寺': 540.0, '茨木': 541.5, '千里丘': 544.5, '岸辺': 546.0,
    '吹田': 548.8, '東淀川': 551.9, '新大阪': 552.6, '大阪': 556.4, '福島': 557.4, '塚本': 560.3, '尼崎': 563.1,
    '立花': 566.1, '甲子園口': 568.3, '西宮': 570.8, 'さくら夙川': 572.3, '芦屋': 574.7, '甲南山手': 576.1,
    '摂津本山': 577.6, '住吉': 579.2, '六甲道': 581.1, '摩耶': 582.5, '灘': 583.4, '三ノ宮': 585.8, '元町': 586.6,
    '神戸': 589.5,
    // 新幹線駅 (並行在来線対応キロ)
    '新横浜': 28.8, '新富士': 146.2, '岐阜羽島': 396.3,
    // 美濃赤坂支線
    '荒尾': 413.4, '美濃赤坂': 415.0
  };

  // 中央東線 (東京〜塩尻) 公式営業キロ程 (東京起点 km)
  const CHUO_EAST_KILO = {
    '東京': 0.0, '神田': 1.3, '御茶ノ水': 2.6, '水道橋': 3.4, '飯田橋': 4.3, '市ヶ谷': 5.8, '市ケ谷': 5.8,
    '四ツ谷': 6.6, '信濃町': 7.9, '千駄ヶ谷': 8.6, '千駄ケ谷': 8.6, '代々木': 9.6, '新宿': 10.3,
    '大久保': 11.7, '東中野': 12.8, '中野': 14.7, '高円寺': 16.1, '阿佐ヶ谷': 17.3, '阿佐ケ谷': 17.3,
    '荻窪': 18.7, '西荻窪': 20.6, '吉祥寺': 22.5, '三鷹': 24.1, '武蔵境': 25.7, '東小金井': 27.4,
    '武蔵小金井': 29.1, '国分寺': 31.4, '西国分寺': 32.8, '国立': 34.5, '立川': 37.5, '日野': 40.8,
    '豊田': 43.1, '八王子': 47.4, '西八王子': 49.8, '高尾': 53.1, '相模湖': 62.6, '藤野': 66.3,
    '上野原': 69.8, '四方津': 74.0, '梁川': 77.6, '鳥沢': 81.2, '猿橋': 85.3, '大月': 87.8,
    '初狩': 93.9, '笹子': 100.4, '甲斐大和': 106.5, '勝沼ぶどう郷': 112.5, '塩山': 116.9, '東山梨': 120.1,
    '山梨市': 122.2, '春日居町': 125.0, '石和温泉': 127.8, '酒折': 131.2, '甲府': 134.1, '竜王': 138.6,
    '塩崎': 142.7, '韮崎': 147.0, '新府': 151.2, '穴山': 154.7, '日野春': 160.1, '長坂': 166.3,
    '小淵沢': 173.7, '信濃境': 178.2, '富士見': 182.9, 'すずらんの里': 186.1, '青柳': 188.0, '茅野': 195.2,
    '上諏訪': 201.9, '下諏訪': 206.3, '岡谷': 210.4, 'みどり湖': 218.2, '塩尻': 222.1
  };

  // 中央西線 (塩尻〜名古屋) 公式営業キロ程 (塩尻起点 km)
  const CHUO_WEST_KILO = {
    '塩尻': 0.0, '洗馬': 4.2, '日出塩': 8.9, '贄川': 14.1, '木曽平沢': 19.3, '奈良井': 21.1,
    '藪原': 27.7, '宮ノ越': 33.4, '原野': 36.2, '木曽福島': 41.7, '上松': 49.0, '倉本': 55.6,
    '須原': 60.4, '大桑': 63.7, '野尻': 66.7, '十二兼': 70.4, '南木曽': 75.9, '田立': 82.2,
    '坂下': 85.0, '落合川': 91.1, '中津川': 94.9, '美乃坂本': 101.3, '恵那': 106.5, '武並': 111.9,
    '釜戸': 117.3, '瑞浪': 124.7, '土岐市': 131.6, '多治見': 138.6, '古虎渓': 143.2, '定光寺': 146.7,
    '高蔵寺': 150.8, '神領': 154.0, '春日井': 156.7, '勝川': 159.8, '新守山': 162.5, '大曽根': 165.0,
    '千種': 167.7, '鶴舞': 169.2, '金山': 171.5, '名古屋': 174.8
  };

  // 山手線 公式営業キロ程 (品川起点 km)
  const YAMANOTE_KILO = {
    '品川': 0.0, '大崎': 2.0, '五反田': 2.9, '目黒': 4.1, '恵比寿': 5.6, '渋谷': 7.2,
    '原宿': 8.4, '代々木': 9.9, '新宿': 10.6, '新大久保': 11.9, '高田馬場': 13.3,
    '目白': 14.2, '池袋': 15.4, '大塚': 17.2, '巣鴨': 18.3, '駒込': 19.0, '田端': 20.6
  };

  const OFFICIAL_LINE_KILOS = {
    'tokaido': TOKAIDO_KILO,
    'tokai-tokaido': TOKAIDO_KILO,
    'tokaido-west': TOKAIDO_KILO,
    'shinkansen-tokaido': TOKAIDO_KILO,
    'tokai-minoakasaka': TOKAIDO_KILO,
    'chuo-main': CHUO_EAST_KILO,
    'tokai-chuo': CHUO_WEST_KILO,
    'yamanote': YAMANOTE_KILO
  };

  // 新幹線と並行在来線の営業キロテーブルマッピング (旅客営業規則第14条・第16条)
  const SHINKANSEN_PARALLEL_TABLES = {
    'shinkansen-tokaido': TOKAIDO_KILO
  };

  /**
   * 駅間営業キロ（エッジ距離）の取得
   * 優先順位:
   * 1. 路線データ自体の stationKilos (駅ID or 駅名での累計キロ) または edgeDistances (駅間キロ)
   * 2. 内蔵の公式営業キロ程テーブル (OFFICIAL_LINE_KILOS または 新幹線並行在来線テーブル)
   * 3. 幾何直線距離 (概算フォールバック: isEstimated = true)
   * ※戻り値は常にオブジェクト { dist: number, isEstimated: boolean }
   */
  function getEdgeDistance(line, stU, stV, uId, vId) {
    if (!stU || !stV) return { dist: 0, isEstimated: false };

    // 優先度 1: 路線データ (build-data.js の JR_LINES) に直接定義された営業キロプロパティ
    if (line) {
      // 1-a: stationKilos (駅ごとの累計営業キロテーブル: { 'tokyo': 0.0, 'mitaka': 24.1, ... })
      if (line.stationKilos) {
        const kU = (uId && line.stationKilos[uId] !== undefined) ? line.stationKilos[uId] : line.stationKilos[stU.name];
        const kV = (vId && line.stationKilos[vId] !== undefined) ? line.stationKilos[vId] : line.stationKilos[stV.name];
        if (kU !== undefined && kV !== undefined) {
          const d = Math.abs(kV - kU);
          return { dist: Math.round(d * 10) / 10, isEstimated: false };
        }
      }
      // 1-b: edgeDistances (隣接駅間の営業キロマップ: { 'st1-st2': 1.3, ... })
      if (line.edgeDistances) {
        const k1 = `${uId}-${vId}`;
        const k2 = `${vId}-${uId}`;
        const kName1 = `${stU.name}-${stV.name}`;
        const kName2 = `${stV.name}-${stU.name}`;
        const d = line.edgeDistances[k1] ?? line.edgeDistances[k2] ??
                  line.edgeDistances[kName1] ?? line.edgeDistances[kName2];
        if (d !== undefined && d !== null) {
          return { dist: Math.round(d * 10) / 10, isEstimated: false };
        }
      }
    }

    // 優先度 2: エンジン内蔵の公式営業キロ程テーブル (OFFICIAL_LINE_KILOS)
    let table = line ? OFFICIAL_LINE_KILOS[line.id] : null;
    if (!table && line && line.category === 'shinkansen' && SHINKANSEN_PARALLEL_TABLES[line.id]) {
      table = SHINKANSEN_PARALLEL_TABLES[line.id];
    }
    if (table && table[stU.name] !== undefined && table[stV.name] !== undefined) {
      const d = Math.abs(table[stU.name] - table[stV.name]);
      return { dist: Math.round(d * 10) / 10, isEstimated: false };
    }

    // 優先度 3: 緯度・経度からの直線距離 (概算フォールバック)
    const estDist = Math.round(calcDistKm(stU, stV) * 10) / 10;
    return { dist: estDist, isEstimated: true };
  }

  let cachedGraph = null;
  let cachedStations = null;
  let cachedLines = null;

  // グラフ構築
  function buildGraph(arg1, arg2) {
    let lines, stations;
    if (Array.isArray(arg1)) {
      lines = arg1;
      stations = arg2 || (typeof window !== 'undefined' ? window.JR_STATIONS : {}) || {};
    } else if (Array.isArray(arg2)) {
      lines = arg2;
      stations = arg1 || (typeof window !== 'undefined' ? window.JR_STATIONS : {}) || {};
    } else {
      stations = (typeof window !== 'undefined' ? window.JR_STATIONS : {}) || {};
      lines = (typeof window !== 'undefined' ? window.JR_LINES : []) || [];
    }

    // 公式キロ程データ (official-kilos.js) の適用
    if (typeof window !== 'undefined' && window.applyOfficialKilos) {
      window.applyOfficialKilos(lines);
    } else if (typeof require !== 'undefined') {
      try {
        const kilosMod = require('./data/official-kilos.js');
        if (kilosMod && kilosMod.applyOfficialKilos) {
          kilosMod.applyOfficialKilos(lines);
        }
      } catch (e) {}
    }

    const adj = new Map(); // stationId -> Array of edges

    lines.forEach(line => {
      const isShinkansen = line.category === 'shinkansen';
      const marsName = getMarsLineName(line);
      const chains = [line.stations, ...(line.branches || [])];

      chains.forEach(stIds => {
        if (!stIds || !Array.isArray(stIds)) return;
        for (let i = 0; i < stIds.length - 1; i++) {
          const u = stIds[i];
          const v = stIds[i + 1];
          const stU = stations[u];
          const stV = stations[v];
          if (!stU || !stV) continue;

          const edgeDistInfo = getEdgeDistance(line, stU, stV, u, v);
          const dist = (typeof edgeDistInfo === 'object') ? edgeDistInfo.dist : edgeDistInfo;
          const isEstimated = (typeof edgeDistInfo === 'object') ? !!edgeDistInfo.isEstimated : false;

          if (!adj.has(u)) adj.set(u, []);
          if (!adj.has(v)) adj.set(v, []);

          adj.get(u).push({
            to: v,
            lineId: line.id,
            lineName: line.name,
            marsName: marsName,
            color: line.color || '#0070c0',
            isShinkansen: isShinkansen,
            dist: dist,
            isEstimated: isEstimated
          });

          adj.get(v).push({
            to: u,
            lineId: line.id,
            lineName: line.name,
            marsName: marsName,
            color: line.color || '#0070c0',
            isShinkansen: isShinkansen,
            dist: dist,
            isEstimated: isEstimated
          });
        }
      });
    });

    cachedGraph = adj;
    cachedStations = stations;
    cachedLines = lines;

    return adj;
  }

  // 単一レグ探索 (状態空間ダイクストラ法: stationId + marsName)
  function findLeg(graph, startId, endId, options = {}) {
    const allowShinkansen = (options.useShinkansen !== undefined) ? options.useShinkansen : (options.allowShinkansen !== false);
    const forbiddenStations = options.forbiddenStations || new Set();

    const dist = new Map();
    const prev = new Map();
    const pq = [{ id: startId, marsName: '', isShinkansen: false, d: 0 }];
    dist.set(startId + '::', 0);

    let bestEndState = null;

    while (pq.length > 0) {
      pq.sort((a, b) => a.d - b.d);
      const curr = pq.shift();
      const currKey = curr.id + '::' + curr.marsName;

      if (curr.id === endId) {
        bestEndState = currKey;
        break;
      }

      if (curr.d > dist.get(currKey)) continue;

      const neighbors = graph.get(curr.id) || [];
      for (const edge of neighbors) {
        if (!allowShinkansen && edge.isShinkansen) continue;
        if (forbiddenStations.has(edge.to) && edge.to !== endId) continue;

        let transferPenalty = 0;
        if (curr.marsName && (curr.marsName !== edge.marsName)) {
          if (curr.isShinkansen !== edge.isShinkansen) {
            transferPenalty = 40.0; // 新幹線と在来線の乗降ペナルティ
          } else {
            transferPenalty = 10.0; // 同一種別間の路線乗り換えペナルティ
          }
        }

        // 新幹線優先モード時、新幹線の速達性・直通性を考慮した探索重みを適用 (実際の営業キロ dist は変化なし)
        const edgeWeight = (allowShinkansen && edge.isShinkansen) ? (edge.dist * 0.85) : edge.dist;
        const nextD = curr.d + edgeWeight + transferPenalty;
        const nextKey = edge.to + '::' + edge.marsName;

        if (!dist.has(nextKey) || nextD < dist.get(nextKey)) {
          dist.set(nextKey, nextD);
          prev.set(nextKey, {
            fromId: curr.id,
            fromMars: curr.marsName,
            edge: edge
          });
          pq.push({ id: edge.to, marsName: edge.marsName, isShinkansen: edge.isShinkansen, d: nextD });
        }
      }
    }

    if (!bestEndState) return null;

    const segments = [];
    let currKey = bestEndState;
    while (true) {
      const p = prev.get(currKey);
      if (!p) break;
      segments.unshift({
        from: p.fromId,
        to: p.edge.to,
        lineId: p.edge.lineId,
        lineName: p.edge.lineName,
        marsName: p.edge.marsName,
        color: p.edge.color,
        isShinkansen: p.edge.isShinkansen,
        dist: p.edge.dist,
        isEstimated: !!p.edge.isEstimated
      });
      currKey = p.fromId + '::' + p.fromMars;
    }

    return segments;
  }

  // 最近傍線路インデックス検索
  function findClosestTrackIdx(chain, lat, lng) {
    let minD = Infinity;
    let minIdx = -1;
    for (let i = 0; i < chain.length; i++) {
      const pt = chain[i];
      const dLat = pt[0] - lat;
      const dLng = pt[1] - lng;
      const d = dLat * dLat + dLng * dLng;
      if (d < minD) {
        minD = d;
        minIdx = i;
      }
    }
    return minIdx;
  }

  // セグメント線路座標の抽出 (駅間エッジ対応・候補路線フォールバック・確実な端点スナップ)
  function getSegmentCoords(tracks, stations, lineId, fromStId, toStId) {
    const st1 = stations[fromStId];
    const st2 = stations[toStId];
    if (!st1 || !st2) return [];

    // 候補路線リスト: 指定路線を最優先、次に駅同士の共通路線
    const candidateLineIds = [lineId];
    if (st1.lines && st2.lines) {
      st1.lines.forEach(lid => {
        if (st2.lines.includes(lid) && !candidateLineIds.includes(lid)) {
          candidateLineIds.push(lid);
        }
      });
    }

    let bestChain = null;
    let bestIdx1 = -1;
    let bestIdx2 = -1;
    let bestDistSum = Infinity;

    candidateLineIds.forEach(lid => {
      const rawChains = tracks[lid] || [];
      rawChains.forEach(rawChain => {
        // [lat, lng] への確実な正規化
        const chain = rawChain.map(pt => pt[0] > 90 ? [pt[1], pt[0]] : pt);
        let i1 = -1, minD1 = Infinity;
        let i2 = -1, minD2 = Infinity;

        for (let i = 0; i < chain.length; i++) {
          const p = chain[i];
          const d1 = Math.hypot(p[0] - st1.lat, p[1] - st1.lng);
          const d2 = Math.hypot(p[0] - st2.lat, p[1] - st2.lng);
          if (d1 < minD1) { minD1 = d1; i1 = i; }
          if (d2 < minD2) { minD2 = d2; i2 = i; }
        }

        if (i1 >= 0 && i2 >= 0) {
          const dSum = minD1 + minD2;
          if (dSum < bestDistSum) {
            bestDistSum = dSum;
            bestChain = chain;
            bestIdx1 = i1;
            bestIdx2 = i2;
          }
        }
      });
    });

    // 閾値チェック (約15km以内)
    if (!bestChain || bestDistSum > 0.15) {
      return [[st1.lat, st1.lng], [st2.lat, st2.lng]];
    }

    let rawSlice = [];
    if (bestIdx1 === bestIdx2) {
      rawSlice = [bestChain[bestIdx1]];
    } else if (bestIdx1 < bestIdx2) {
      rawSlice = bestChain.slice(bestIdx1, bestIdx2 + 1);
    } else {
      rawSlice = bestChain.slice(bestIdx2, bestIdx1 + 1).reverse();
    }

    // 端点を st1 と st2 に確実にスナップ接続 (駅マーカーと線路の隙間をゼロに)
    const resultCoords = [[st1.lat, st1.lng]];
    for (let k = 0; k < rawSlice.length; k++) {
      const p = rawSlice[k];
      const prev = resultCoords[resultCoords.length - 1];
      if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 0.00005) {
        resultCoords.push(p);
      }
    }
    const lastP = resultCoords[resultCoords.length - 1];
    if (Math.hypot(st2.lat - lastP[0], st2.lng - lastP[1]) > 0.00005) {
      resultCoords.push([st2.lat, st2.lng]);
    }

    return resultCoords;
  }

  // マルチストップルート探索メインAPI
  function searchMarsRoute(...args) {
    let graph, tracks, stations, stops, options;
    let deptId, destId, viaIds = [];

    if (typeof args[0] === 'string') {
      deptId = args[0];
      viaIds = Array.isArray(args[1]) ? args[1] : (args[1] ? [args[1]] : []);
      destId = args[2];
      options = args[3] || {};
      stops = [deptId, ...viaIds, destId];

      if (!cachedGraph) {
        buildGraph();
      }
      graph = cachedGraph;
      stations = cachedStations || (typeof window !== 'undefined' ? window.JR_STATIONS : {}) || {};
      tracks = (typeof window !== 'undefined' ? window.JR_TRACKS : null);
    } else {
      graph = args[0];
      tracks = args[1];
      stations = args[2];
      stops = args[3] || [];
      options = args[4] || {};
      deptId = stops[0];
      destId = stops[stops.length - 1];
      viaIds = stops.slice(1, -1);
    }

    if (!stops || stops.length < 2) {
      return { success: false, error: '発駅と着駅を指定してください。' };
    }

    const searchMode = options.searchMode || options.mode || 'shortest';
    const requireOneWay = (searchMode === 'oneway');

    const fullSegments = [];
    const visitedStations = new Set();
    let hasDuplicate = false;

    for (let i = 0; i < stops.length - 1; i++) {
      const origin = stops[i];
      const destination = stops[i + 1];

      let leg = null;
      if (requireOneWay) {
        // 重複区間なし（一筆書き）モード: 訪問済み駅を禁止して探索
        leg = findLeg(graph, origin, destination, {
          allowShinkansen: (options.useShinkansen !== undefined) ? options.useShinkansen : (options.allowShinkansen !== false),
          forbiddenStations: visitedStations
        });
        if (!leg) {
          const originName = (stations[origin] && stations[origin].name) || origin;
          const destName = (stations[destination] && stations[destination].name) || destination;
          return {
            success: false,
            error: `「${originName}」から「${destName}」への重複区間なし（一筆書き）ルートが見つかりませんでした。「最短経路」をお試しください。`
          };
        }
      } else {
        // 最短経路モード: 禁止ノードなしで常に最短経路を探索
        leg = findLeg(graph, origin, destination, {
          allowShinkansen: (options.useShinkansen !== undefined) ? options.useShinkansen : (options.allowShinkansen !== false),
          forbiddenStations: new Set()
        });
        if (!leg) {
          const originName = (stations[origin] && stations[origin].name) || origin;
          const destName = (stations[destination] && stations[destination].name) || destination;
          return {
            success: false,
            error: `「${originName}」から「${destName}」への経路が見つかりませんでした。`
          };
        }
      }

      leg.forEach(seg => {
        fullSegments.push(seg);
      });
    }

    if (fullSegments.length === 0) {
      return { success: false, error: '有効な経路が見つかりませんでした。' };
    }

    // エッジごとの通過回数集計 (無向エッジとして同一区間の往復または重複通過を検出)
    const edgeCountMap = new Map();
    fullSegments.forEach(seg => {
      const idKey = seg.from < seg.to ? `${seg.from}::${seg.to}` : `${seg.to}::${seg.from}`;
      edgeCountMap.set(idKey, (edgeCountMap.get(idKey) || 0) + 1);

      const st1 = stations[seg.from];
      const st2 = stations[seg.to];
      const n1 = st1 ? st1.name : seg.from;
      const n2 = st2 ? st2.name : seg.to;
      if (n1 !== n2) {
        const nameKey = n1 < n2 ? `${n1}::${n2}` : `${n2}::${n1}`;
        edgeCountMap.set(`name::${nameKey}`, (edgeCountMap.get(`name::${nameKey}`) || 0) + 1);
      }
    });

    let hasDuplicateEdges = false;
    fullSegments.forEach(seg => {
      const idKey = seg.from < seg.to ? `${seg.from}::${seg.to}` : `${seg.to}::${seg.from}`;
      const st1 = stations[seg.from];
      const st2 = stations[seg.to];
      const n1 = st1 ? st1.name : seg.from;
      const n2 = st2 ? st2.name : seg.to;
      const nameKey = n1 < n2 ? `${n1}::${n2}` : `${n2}::${n1}`;

      const idCount = edgeCountMap.get(idKey) || 0;
      const nameCount = (n1 !== n2) ? (edgeCountMap.get(`name::${nameKey}`) || 0) : idCount;

      seg.isDuplicate = (idCount > 1 || nameCount > 1);
      if (seg.isDuplicate) hasDuplicateEdges = true;
    });

    // 通過全駅IDリスト
    const allStationIds = [fullSegments[0].from, ...fullSegments.map(s => s.to)];

    // 各駅の到達・訪問回数集計 (到着駅としてのカウント)
    const arrivalCount = new Map();
    fullSegments.forEach(seg => {
      arrivalCount.set(seg.to, (arrivalCount.get(seg.to) || 0) + 1);
    });

    // 始点駅が途中で再訪問された場合も検知
    const originId = stops[0];
    const originVisitedAgain = fullSegments.slice(1).some(s => s.from === originId || s.to === originId);

    const duplicateStationIds = [];
    arrivalCount.forEach((cnt, id) => {
      if (cnt > 1) duplicateStationIds.push(id);
    });
    if (originVisitedAgain && !duplicateStationIds.includes(originId)) {
      duplicateStationIds.push(originId);
    }

    hasDuplicate = hasDuplicateEdges || (duplicateStationIds.length > 0);

    // 路線ごとの区間ラン（連続乗車区間）の圧縮集計
    // 小数点計算の誤差防止のため、0.1km単位の整数(tenths)で積算
    const lineRuns = [];
    fullSegments.forEach(seg => {
      const segTenths = Math.round(seg.dist * 10);
      if (lineRuns.length === 0 || lineRuns[lineRuns.length - 1].lineId !== seg.lineId) {
        lineRuns.push({
          lineId: seg.lineId,
          lineName: seg.lineName,
          marsName: seg.marsName,
          color: seg.color,
          isShinkansen: seg.isShinkansen,
          from: seg.from,
          to: seg.to,
          stationIds: [seg.from, seg.to],
          distTenths: segTenths,
          dist: segTenths / 10,
          hasDuplicate: !!seg.isDuplicate,
          isEstimated: !!seg.isEstimated
        });
      } else {
        const last = lineRuns[lineRuns.length - 1];
        last.to = seg.to;
        last.stationIds.push(seg.to);
        last.distTenths += segTenths;
        last.dist = last.distTenths / 10;
        if (seg.isDuplicate) last.hasDuplicate = true;
        if (seg.isEstimated) last.isEstimated = true;
      }
    });

    // 概算距離（直線距離フォールバック）の有無および未登録路線名の集計
    let hasEstimatedDistance = false;
    const unregisteredLinesSet = new Set();
    fullSegments.forEach(seg => {
      if (seg.isEstimated) {
        hasEstimatedDistance = true;
        if (seg.lineName) unregisteredLinesSet.add(seg.lineName);
      }
    });
    const unregisteredLines = Array.from(unregisteredLinesSet);

    // マルス経由線表記の生成 (例: 東海道・山手・中央東)
    const marsNamesList = [];
    lineRuns.forEach(r => {
      if (marsNamesList.length === 0 || marsNamesList[marsNamesList.length - 1] !== r.marsName) {
        marsNamesList.push(r.marsName);
      }
    });
    const marsFormatString = marsNamesList.join('・');

    // 総距離 (0.1km単位の整数で合算してから10で割ることで浮動小数点誤差を完全防止)
    const totalDistTenths = fullSegments.reduce((sum, s) => sum + Math.round(s.dist * 10), 0);
    const totalDist = totalDistTenths / 10;

    // 線路ジオメトリの抽出 (連続する通常区間・重複区間をそれぞれ1本の長い連続Polylineに連結)
    const geometryLatlngs = [];
    const normalPolylines = [];    // 通常通過区間の連続座標群 (青色用)
    const duplicatePolylines = []; // 重複通過区間の連続座標群 (赤色用)

    if (tracks) {
      let currentChain = [];
      let currentIsDup = null;

      for (let s = 0; s < fullSegments.length; s++) {
        const seg = fullSegments[s];
        const coords = getSegmentCoords(tracks, stations, seg.lineId, seg.from, seg.to);
        if (!coords || coords.length === 0) continue;

        // 全体ジオメトリへの追加 (スムーズ接続)
        if (geometryLatlngs.length > 0) {
          geometryLatlngs.push(...coords.slice(1));
        } else {
          geometryLatlngs.push(...coords);
        }

        const isDup = !!seg.isDuplicate;

        if (currentIsDup === null) {
          currentIsDup = isDup;
          currentChain = [...coords];
        } else if (currentIsDup === isDup) {
          // 同一状態が連続: 駅ごとに分けないで1本の長いチェーンに連結！
          if (coords.length > 1) {
            currentChain.push(...coords.slice(1));
          } else {
            currentChain.push(...coords);
          }
        } else {
          // 通常/重複の状態が切り替わったところで1本のPolylineとして確定
          if (currentChain.length > 0) {
            if (currentIsDup) {
              duplicatePolylines.push(currentChain);
            } else {
              normalPolylines.push(currentChain);
            }
          }
          currentIsDup = isDup;
          currentChain = [...coords];
        }
      }

      if (currentChain.length > 0) {
        if (currentIsDup) {
          duplicatePolylines.push(currentChain);
        } else {
          normalPolylines.push(currentChain);
        }
      }
    }

    // フォールバック: tracks がない、またはジオメトリ抽出できなかった場合は駅間座標を連続連結
    if (geometryLatlngs.length === 0) {
      allStationIds.forEach(stId => {
        const st = stations[stId];
        if (st) geometryLatlngs.push([st.lat, st.lng]);
      });

      let currentChain = [];
      let currentIsDup = null;

      for (let s = 0; s < fullSegments.length; s++) {
        const seg = fullSegments[s];
        const st1 = stations[seg.from];
        const st2 = stations[seg.to];
        if (!st1 || !st2) continue;

        const coords = [[st1.lat, st1.lng], [st2.lat, st2.lng]];
        const isDup = !!seg.isDuplicate;

        if (currentIsDup === null) {
          currentIsDup = isDup;
          currentChain = [...coords];
        } else if (currentIsDup === isDup) {
          currentChain.push(coords[1]);
        } else {
          if (currentChain.length > 0) {
            if (currentIsDup) duplicatePolylines.push(currentChain);
            else normalPolylines.push(currentChain);
          }
          currentIsDup = isDup;
          currentChain = [...coords];
        }
      }

      if (currentChain.length > 0) {
        if (currentIsDup) duplicatePolylines.push(currentChain);
        else normalPolylines.push(currentChain);
      }
    }

    // UI用セクション一覧
    const sections = lineRuns.map(r => ({
      lineId: r.lineId,
      lineName: r.lineName,
      marsName: r.marsName,
      lineColor: r.color,
      isShinkansen: r.isShinkansen,
      from: r.from,
      to: r.to,
      deptName: (stations[r.from] && stations[r.from].name) || r.from,
      destName: (stations[r.to] && stations[r.to].name) || r.to,
      km: Math.round(r.dist * 10) / 10,
      stationCount: r.stationIds.length,
      stations: r.stationIds,
      isDuplicate: !!r.hasDuplicate,
      isEstimated: !!r.isEstimated
    }));

    const deptName = (stations[deptId] && stations[deptId].name) || deptId;
    const destName = (stations[destId] && stations[destId].name) || destId;

    // 通過するユニークな路線IDのリスト
    const passedLineIds = Array.from(new Set(fullSegments.map(s => s.lineId)));

    return {
      success: true,
      deptId: deptId,
      destId: destId,
      deptName: deptName,
      destName: destName,
      viaIds: viaIds,
      marsString: marsFormatString,
      totalKm: Math.round(totalDist * 10) / 10,
      hasEstimatedDistance: hasEstimatedDistance,
      unregisteredLines: unregisteredLines,
      isOneWayTrip: !hasDuplicate,
      sections: sections,
      geometryLatlngs: geometryLatlngs,
      normalPolylines: normalPolylines,
      duplicatePolylines: duplicatePolylines,
      passedLineIds: passedLineIds,

      // 従来互換フィールド
      isOneWay: !hasDuplicate,
      stops: stops,
      marsFormat: marsFormatString,
      marsNamesList: marsNamesList,
      totalDist: Math.round(totalDist * 10) / 10,
      lineRuns: lineRuns,
      allStationIds: allStationIds,
      duplicateStationIds: duplicateStationIds
    };
  }

  // グローバルエクスポート
  const RouteEngine = {
    MARS_LINE_NAMES,
    getMarsLineName,
    buildGraph,
    getSegmentCoords,
    searchMarsRoute
  };

  if (typeof window !== 'undefined') {
    window.JR_ROUTE_ENGINE = RouteEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RouteEngine;
  }
})();
