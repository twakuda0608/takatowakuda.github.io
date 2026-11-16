// 麻雀役データ定義
export const YAKU_CATEGORIES = [
  { id: 'all', label: '全役' },
  { id: '1han', label: '1飜' },
  { id: '2han', label: '2飜' },
  { id: '3han', label: '3飜' },
  { id: '6han', label: '6飜' },
  { id: 'yakuman', label: '役満' },
  { id: 'w-yakuman', label: 'W役満' },
  { id: 'special', label: '特殊役' },
];

export const YAKU_TYPES = [
  { id: 'all', label: 'すべて' },
  { id: 'shuntsu', label: '順子系' },
  { id: 'koutsu', label: '刻子系' },
  { id: 'jihai', label: '字牌・端牌系' },
  { id: 'somete', label: '染め手系' },
  { id: 'situation', label: '偶然・状況役' },
  { id: 'special', label: '特殊形' },
];

export const NAKI_TYPES = [
  { id: 'all', label: 'すべて' },
  { id: 'menzen', label: '門前限定' },
  { id: 'naki_ok', label: '鳴きOK' },
  { id: 'kuisagari', label: '喰い下がり' },
];

export const YAKU_LIST = [
  // =================== 1飜役 ===================
  {
    id: 'riichi',
    name: '立直',
    kana: 'リーチ',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'situation',
    typeName: '状況役',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '門前でテンパイした時に1000点を供託して宣言する役。',
    detail: 'あと1枚でアガれるテンパイ状態の時、1000点棒を供託に出して「リーチ」と宣言します。宣言後は手牌の変更はできず、アガリ牌以外はすべてツモ切りとなります。裏ドラを見る権利と「一発」のチャンスが得られます。',
    points: [
      '宣言牌は横向きにして捨てます',
      'アガリ牌を見逃すとフリテンになります',
      'テンパイしていなければ宣言できません（ノーテンリーチは流局時チョンボ）',
    ],
    frequency: '★★★★★',
    hand: {
      groups: [
            [
                  '1m',
                  '2m',
                  '3m'
            ],
            [
                  '4p',
                  '5p',
                  '6p'
            ],
            [
                  '7s',
                  '8s',
                  '9s'
            ],
            [
                  '1z',
                  '1z'
            ],
            [
                  '2m',
                  '3m'
            ]
      ],
      agari: '4m',
      agariLabel: ''
},
  },
  {
    id: 'ippatsu',
    name: '一発',
    kana: 'イッパツ',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'situation',
    typeName: '偶然役',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: 'リーチをかけた後、鳴きが入らずに1巡以内にアガる役。',
    detail: 'リーチ宣言をした後、次の自分のツモ番までの間（1巡以内）にツモまたはロンアガリすると成立します。途中で誰かがポン・チー・カン（暗槓含む）を行うと、一発の権利は消滅します。',
    points: [
      'リーチとの複合が必須（単独では成立しません）',
      '他家の鳴き（ポン・チー・カン）で消滅します',
      '競技ルールによっては採用されない場合があります',
    ],
    frequency: '★★★☆☆',
    hand: {
      groups: [
            [
                  '2m',
                  '3m',
                  '4m'
            ],
            [
                  '5p',
                  '6p',
                  '7p'
            ],
            [
                  '3s',
                  '4s',
                  '5s'
            ],
            [
                  '6z',
                  '6z'
            ],
            [
                  '8s',
                  '8s'
            ]
      ],
      agari: '8s',
      agariLabel: ''
},
  },
  {
    id: 'menzen-tsumo',
    name: '門前清自摸和',
    kana: 'メンゼンツモ',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'situation',
    typeName: '状況役',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '一度も鳴かずに自力でアガリ牌をツモる役。',
    detail: 'ポン・チー・明槓をせず、門前の状態でアガリ牌を自分でツモると成立します。略して「ツモ」と呼ばれることも多い基本役です。',
    points: [
      'ツモアガリ時に必ず2符加算されます（平和ツモを除く）',
      '暗槓（アンカン）をしていても門前とみなされます',
    ],
    frequency: '★★★★★',
    hand: {
      groups: [
            [
                  '1p',
                  '2p',
                  '3p'
            ],
            [
                  '4p',
                  '5p',
                  '6p'
            ],
            [
                  '7m',
                  '8m',
                  '9m'
            ],
            [
                  '5s',
                  '5s'
            ],
            [
                  '3s',
                  '4s'
            ]
      ],
      agari: '5s',
      agariLabel: 'ツモ限定'
},
  },
  {
    id: 'tanyao',
    name: '断幺九',
    kana: 'タンヤオ',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'shuntsu',
    typeName: '数牌系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '2〜8の数牌（中張牌）だけで揃える役。',
    detail: '1・9の数牌（老頭牌）と字牌を一切使わず、2〜8の数牌だけで4面子1雀頭を作る役です。作りやすく他の役とも複合しやすい現代麻雀の王道役です。',
    points: [
      '一般的なルール（喰いタンあり）ではポン・チーしても1飜のままです',
      '喰いタンなし（門前のみ）のルールもあるので事前に確認が必要です',
    ],
    frequency: '★★★★★',
    hand: {
      groups: [
            [
                  '2m',
                  '3m',
                  '4m'
            ],
            [
                  '5m',
                  '6m',
                  '7m'
            ],
            [
                  '3p',
                  '4p',
                  '5p'
            ],
            [
                  '6s',
                  '6s'
            ],
            [
                  '7s',
                  '8s'
            ]
      ],
      agari: '6s',
      agariLabel: ''
},
  },
  {
    id: 'pinfu',
    name: '平和',
    kana: 'ピンフ',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'shuntsu',
    typeName: '順子系',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '符が一切つかない美しい順子手。両面待ちでアガる役。',
    detail: '4面子すべてが順子（シュンツ）で、雀頭が役牌（三元牌・自風・場風）以外であり、待ちの形が両面待ち（リャンメンマチ）である場合に成立します。符がつかないことが成立条件です。',
    points: [
      '雀頭に三元牌・自風・場風（オタ風以外）を使うと不成立',
      'カンチャン待ち・ペンチャン待ち・単騎待ちは不成立',
      'ツモアガリ時はツモ符（2符）がつかず、20符2飜（子1500点/親2900点）となります',
    ],
    frequency: '★★★★★',
    hand: {
      groups: [
            [
                  '2m',
                  '3m',
                  '4m'
            ],
            [
                  '6m',
                  '7m',
                  '8m'
            ],
            [
                  '3p',
                  '4p',
                  '5p'
            ],
            [
                  '2s',
                  '2s'
            ],
            [
                  '5s',
                  '6s'
            ]
      ],
      agari: '7s',
      agariLabel: ''
},
  },
  {
    id: 'iipeiko',
    name: '一盃口',
    kana: 'イーペーコー',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'shuntsu',
    typeName: '順子系',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '同じ色（萬子・筒子・索子）で全く同じ順子を2組揃える役。',
    detail: '同種の数牌で全く同じ数字の順子を2組作ると成立します。門前限定の役であり、鳴いて揃えた場合は成立しません。',
    points: [
      '鳴くと無効（門前限定）',
      '2組とも同じ色・同じ数字でなければなりません（例: 234萬と234筒は三色同順）',
      '一盃口が2組できると「二盃口（3飜）」になります',
    ],
    frequency: '★★★★☆',
    hand: {
      groups: [
        ['3m', '4m', '5m'],
        ['3m', '4m', '5m'],
        ['back', 'back', 'back'],
        ['back', 'back', 'back'],
        ['back']
      ],
      agari: 'back',
      agariLabel: ''
    },
  },
  {
    id: 'yakuhai-sangen',
    name: '役牌：三元牌',
    kana: 'ヤクハイ（サンゲンパイ）',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'jihai',
    typeName: '字牌系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '三元牌（白・發・中）のいずれかを3枚揃える役。',
    detail: '白・發・中のいずれか1種類を3枚（刻子または槓子）揃えると成立します。ポンして揃えても有効です。',
    points: [
      'ポンしても1飜のまま',
      '2種類揃えるとそれぞれ1飜ずつ（計2飜）になります',
      '3種類すべて揃えると「大三元（役満）」になります',
    ],
    frequency: '★★★★★',
    hand: {
      groups: [
        ['7z', '7z', '7z'],
        ['back', 'back', 'back'],
        ['back', 'back', 'back'],
        ['back', 'back', 'back'],
        ['back']
      ],
      agari: 'back',
      agariLabel: ''
    },
  },
  {
    id: 'yakuhai-bakaze',
    name: '役牌：場風牌',
    kana: 'ヤクハイ（バカゼハイ）',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'jihai',
    typeName: '字牌系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '現在の場の風と同じ風牌（東場なら東、南場なら南）を3枚揃える役。',
    detail: '東場における東、南場における南など、その局の場風牌を3枚揃えると成立します。ポンしても有効です。',
    points: [
      'ポンしても1飜のまま',
      '東場で東、南場で南が場風です（西場・北場は通常ありません）',
      '場風と自風が重なる「ダブ東」「ダブ南」は2飜になります',
    ],
    frequency: '★★★★★',
    hand: {
      groups: [
        ['1z', '1z', '1z'],
        ['back', 'back', 'back'],
        ['back', 'back', 'back'],
        ['back', 'back', 'back'],
        ['back']
      ],
      agari: 'back',
      agariLabel: ''
    },
  },
  {
    id: 'yakuhai-jikaze',
    name: '役牌：自風牌',
    kana: 'ヤクハイ（ジカゼハイ）',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'jihai',
    typeName: '字牌系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '自分の座席の風と同じ風牌（親なら東、南家なら南など）を3枚揃える役。',
    detail: '親（東家）の東、南家の南、西家の西、北家の北など、自分の席順に対応する風牌を3枚揃えると成立します。ポンしても有効です。',
    points: [
      'ポンしても1飜のまま',
      '自分にとっての風以外（オタ風）を3枚集めても役にはなりません',
    ],
    frequency: '★★★★★',
    hand: {
      groups: [
        ['2z', '2z', '2z'],
        ['back', 'back', 'back'],
        ['back', 'back', 'back'],
        ['back', 'back', 'back'],
        ['back']
      ],
      agari: 'back',
      agariLabel: ''
    },
  },
  {
    id: 'rinshan',
    name: '嶺上開花',
    kana: 'リンシャンカイホウ',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'situation',
    typeName: '偶然役',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: 'カンをした時に補充した嶺上牌でツモアガリする役。',
    detail: '暗槓・明槓・加槓を問わず、カンを行った際に王牌から引く嶺上牌（リンシャンハイ）でアガると成立します。自摸和（ツモ）の1飜も付きます（門前の場合）。',
    points: [
      'ツモアガリ扱いになります',
      'カンした瞬間にドラマが生まれる派手な役です',
    ],
    frequency: '★★☆☆☆',
    hand: {
      groups: [
            [
                  '3m',
                  '3m',
                  '3m',
                  '3m'
            ],
            [
                  '4p',
                  '5p',
                  '6p'
            ],
            [
                  '7s',
                  '8s',
                  '9s'
            ],
            [
                  '1z',
                  '1z'
            ],
            [
                  '2s',
                  '3s'
            ]
      ],
      agari: '4s',
      agariLabel: '嶺上ツモ'
},
  },
  {
    id: 'chankan',
    name: '槍槓',
    kana: 'チャンカン',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'situation',
    typeName: '偶然役',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '他家がポンしている牌に4枚目を加槓した牌をロンアガリする役。',
    detail: '他家がポンしている刻子に4枚目の牌を手牌から加えて加槓（ショウミンカン）した瞬間、その加槓牌が自分のアガリ牌であれば「ロン」と発声してアガることができます。',
    points: [
      '暗槓に対しては槍槓できません（※国士無双のみ暗槓への槍槓を認めるローカルルールあり）',
      '大明槓（他家の捨て牌でカン）には適用されません',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '2m',
                  '3m',
                  '4m'
            ],
            [
                  '5p',
                  '6p',
                  '7p'
            ],
            [
                  '6s',
                  '7s',
                  '8s'
            ],
            [
                  '9m',
                  '9m'
            ],
            [
                  '1s',
                  '2s'
            ]
      ],
      agari: '3s',
      agariLabel: '加槓ロン'
},
  },
  {
    id: 'haitei',
    name: '海底摸月',
    kana: 'ハイテイラオユエ',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'situation',
    typeName: '偶然役',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: 'その局の最後に残った牌（海底牌）をツモってアガる役。',
    detail: '山に残った最後の1枚のツモ牌（海底牌）でツモアガリすると成立します。門前清自摸和とも複合します。',
    points: [
      '海底牌でカンはできません',
      '鳴きが入っていても成立します',
    ],
    frequency: '★★☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '2m',
                  '3m'
            ],
            [
                  '4m',
                  '5m',
                  '6m'
            ],
            [
                  '7s',
                  '8s',
                  '9s'
            ],
            [
                  '5p',
                  '5p'
            ],
            [
                  '8p',
                  '9p'
            ]
      ],
      agari: '7p',
      agariLabel: '海底ツモ'
},
  },
  {
    id: 'houtei',
    name: '河底撈魚',
    kana: 'ホウテイラオユイ',
    han: 1,
    hanText: '1飜',
    category: '1han',
    type: 'situation',
    typeName: '偶然役',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: 'その局の最後に捨てられた牌（河底牌）をロンしてアガる役。',
    detail: '海底牌をツモったプレイヤーが捨てた、その局の最後の捨て牌でロンアガリすると成立します。',
    points: [
      '最後の捨て牌を鳴く（ポン・チー・カン）ことはできません',
      '海底撈月と合わせて「ハイテイ・ホウテイ」と呼ばれます',
    ],
    frequency: '★★☆☆☆',
    hand: {
      groups: [
            [
                  '2p',
                  '3p',
                  '4p'
            ],
            [
                  '6p',
                  '7p',
                  '8p'
            ],
            [
                  '3s',
                  '4s',
                  '5s'
            ],
            [
                  '1m',
                  '1m'
            ],
            [
                  '7m',
                  '8m'
            ]
      ],
      agari: '9m',
      agariLabel: '河底ロン'
},
  },

  // =================== 2飜役 ===================
  {
    id: 'double-riichi',
    name: 'ダブル立直',
    kana: 'ダブルリーチ',
    han: 2,
    hanText: '2飜',
    category: '2han',
    type: 'situation',
    typeName: '状況役',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '鳴きが入っていない第1巡目にリーチをかける役。',
    detail: '配牌完了後の第1ツモでテンパイしており、誰もポン・チー・カンをしていない状態で第1打牌時にリーチを宣言すると成立します。通称「ダブリー」。',
    points: [
      '誰かの鳴き（ポン・チー・カン）が入ると成立しません',
      '通常の立直（1飜）と複合はせず、2飜役となります',
    ],
    frequency: '★★☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '2m',
                  '3m'
            ],
            [
                  '4p',
                  '5p',
                  '6p'
            ],
            [
                  '7s',
                  '8s',
                  '9s'
            ],
            [
                  '5z',
                  '5z'
            ],
            [
                  '2s',
                  '3s'
            ]
      ],
      agari: '1s',
      agariLabel: ''
},
  },
  {
    id: 'sanshoku-doujun',
    name: '三色同順',
    kana: 'サンショクドウジュン',
    han: 2,
    hanText: '門前2飜',
    category: '2han',
    type: 'shuntsu',
    typeName: '順子系',
    naki: 'naki_ok',
    nakiText: '鳴き1飜',
    summary: '萬子・筒子・索子の3色すべてで全く同じ並びの順子を揃える役。',
    detail: '例えば萬子・筒子・索子のそれぞれで「234」の順子を作るなど、3色で同じ数字並びの順子を揃えると成立します。麻雀の代表的な手役のひとつです。',
    points: [
      '鳴いた場合は喰い下がりで1飜になります',
      '平和やタンヤオと非常に相性が良く、複合しやすい役です',
    ],
    frequency: '★★★★☆',
    hand: {
      groups: [
        ['2m', '3m', '4m'],
        ['2p', '3p', '4p'],
        ['2s', '3s', '4s'],
        ['back', 'back', 'back'],
        ['back']
      ],
      agari: 'back',
      agariLabel: ''
    },
  },
  {
    id: 'ikkitsuukan',
    name: '一気通貫',
    kana: 'イッキツウカン',
    han: 2,
    hanText: '門前2飜',
    category: '2han',
    type: 'shuntsu',
    typeName: '順子系',
    naki: 'naki_ok',
    nakiText: '鳴き1飜',
    summary: '同色の数牌で「123」「456」「789」の3順子（1〜9）を一列に揃える役。',
    detail: '同じ色の数牌で1〜9までの連続した3面子を揃えると成立します。通称「イッツー」。鳴いても成立しますが1飜に喰い下がります。',
    points: [
      '鳴いた場合は喰い下がりで1飜になります',
      '必ず同じ色で123・456・789の順子を作る必要があります（123萬・456筒・789索では不成立）',
    ],
    frequency: '★★★☆☆',
    hand: {
      groups: [
        ['1m', '2m', '3m'],
        ['4m', '5m', '6m'],
        ['7m', '8m', '9m'],
        ['back', 'back', 'back'],
        ['back']
      ],
      agari: 'back',
      agariLabel: ''
    },
  },
  {
    id: 'chanta',
    name: '混全帯幺九',
    kana: 'チャンタ',
    han: 2,
    hanText: '門前2飜',
    category: '2han',
    type: 'jihai',
    typeName: '端牌・字牌系',
    naki: 'kuisagari',
    nakiText: '鳴き1飜',
    summary: '4面子1雀頭のすべてに1・9・字牌が含まれる役。',
    detail: 'すべての面子（順子または刻子）と雀頭に、端牌（1・9）または字牌が1枚以上含まれている場合に成立します。門前2飜、鳴くと1飜です。字牌を含まない場合は上位役の「純全帯幺九（ジュンチャン）」になります。',
    points: [
      '順子が含まれていても成立します（すべて刻子なら混老頭）',
      '字牌が1枚も入っていない場合は「純チャン（3飜）」になります',
    ],
    frequency: '★★☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '2m',
                  '3m'
            ],
            [
                  '7p',
                  '8p',
                  '9p'
            ],
            [
                  '1s',
                  '2s',
                  '3s'
            ],
            [
                  '7z',
                  '7z',
                  '7z'
            ],
            [
                  '1z'
            ]
      ],
      agari: '1z',
      agariLabel: ''
},
  },
  {
    id: 'chiitoitsu',
    name: '七対子',
    kana: 'チートイツ',
    han: 2,
    hanText: '2飜（25符固定）',
    category: '2han',
    type: 'special',
    typeName: '特殊形',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '異なる対子（トイツ）を7組揃える特殊な役。',
    detail: '4面子1雀頭の原則から外れた特殊な役で、2枚組のペア（対子）を7種類集めることで成立します。門前限定で、点数は必ず「25符固定」で計算されます。',
    points: [
      '同一の牌4枚を2組の対子として使うことはできません（必ず異なる7種）',
      '単騎待ち（タンキマチ）確定となります',
      '符計算はツモ・ロン問わず常に25符固定です',
    ],
    frequency: '★★★★☆',
    hand: {
      groups: [
            [
                  '1m',
                  '1m'
            ],
            [
                  '5m',
                  '5m'
            ],
            [
                  '3p',
                  '3p'
            ],
            [
                  '8p',
                  '8p'
            ],
            [
                  '2s',
                  '2s'
            ],
            [
                  '7s',
                  '7s'
            ],
            [
                  '6z'
            ]
      ],
      agari: '6z',
      agariLabel: ''
},
  },
  {
    id: 'toitoi',
    name: '対々和',
    kana: 'トイトイホウ',
    han: 2,
    hanText: '2飜',
    category: '2han',
    type: 'koutsu',
    typeName: '刻子系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '4面子すべてを刻子（または槓子）で揃える役。',
    detail: '順子を一切使わず、3枚同じ牌の組み合わせ（刻子・槓子）を4組揃えると成立します。通称「トイトイ」。ポンして作っても2飜のままです。',
    points: [
      'ポンしても2飜のまま下がらないため作りやすいです',
      '役牌や三暗刻、混老頭とよく複合します',
    ],
    frequency: '★★★★☆',
    hand: {
      groups: [
            [
                  '2m',
                  '2m',
                  '2m'
            ],
            [
                  '5p',
                  '5p',
                  '5p'
            ],
            [
                  '8s',
                  '8s',
                  '8s'
            ],
            [
                  '7z',
                  '7z',
                  '7z'
            ],
            [
                  '3s'
            ]
      ],
      agari: '3s',
      agariLabel: ''
},
  },
  {
    id: 'sanankou',
    name: '三暗刻',
    kana: 'サンアンコウ',
    han: 2,
    hanText: '2飜',
    category: '2han',
    type: 'koutsu',
    typeName: '刻子系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '鳴かずに自力で暗刻（暗槓含む）を3組揃える役。',
    detail: 'ポンせずに自分で揃えた3枚組（暗刻・暗槓）を3組作ると成立します。残り1面子は順子や鳴いた刻子でも構いません。',
    points: [
      '他家の捨て牌をロンして完成させた刻子は「明刻」となり、暗刻にはカウントされません',
      'シャボ待ちでロンアガリした場合、その刻子は明刻になるため三暗刻がつかない場合があります（ツモなら暗刻になり成立）',
    ],
    frequency: '★★★☆☆',
    hand: {
      groups: [
            [
                  '3m',
                  '3m',
                  '3m'
            ],
            [
                  '7p',
                  '7p',
                  '7p'
            ],
            [
                  '2s',
                  '2s',
                  '2s'
            ],
            [
                  'back',
                  'back',
                  'back'
            ],
            [
                  'back'
            ]
      ],
      agari: 'back',
      agariLabel: ''
},
  },
  {
    id: 'sankantsu',
    name: '三槓子',
    kana: 'サンカンツ',
    han: 2,
    hanText: '2飜',
    category: '2han',
    type: 'koutsu',
    typeName: '刻子系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '1人でカン（暗槓・明槓）を3回行う役。',
    detail: '1人のプレイヤーが1局中にカンを3組成立させると得られる役です。暗槓・明槓の組み合わせは自由です。',
    points: [
      'カンをするたびにカンドラが増えるため、リスクとリターンが大きくなります',
      '4回カンすると役満「四槓子」になります',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '2m',
                  '2m',
                  '2m',
                  '2m'
            ],
            [
                  '6p',
                  '6p',
                  '6p',
                  '6p'
            ],
            [
                  '9s',
                  '9s',
                  '9s',
                  '9s'
            ],
            [
                  'back',
                  'back'
            ],
            [
                  'back'
            ]
      ],
      agari: 'back',
      agariLabel: ''
},
  },
  {
    id: 'sanshoku-doukou',
    name: '三色同刻',
    kana: 'サンショクドウコウ',
    han: 2,
    hanText: '2飜',
    category: '2han',
    type: 'koutsu',
    typeName: '刻子系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '萬子・筒子・索子の3色すべてで同じ数字の刻子を揃える役。',
    detail: '萬子・筒子・索子の3種類で同じ数字の刻子（槓子）を揃えると成立します。ポンしても飜数は下がりません。',
    points: [
      '鳴いても2飜のまま（食い下がりなし）',
      '順子系の三色同順に比べて出現率が格段に低く、難易度が高い役です',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
        ['4m', '4m', '4m'],
        ['4p', '4p', '4p'],
        ['4s', '4s', '4s'],
        ['back', 'back', 'back'],
        ['back']
      ],
      agari: 'back',
      agariLabel: ''
    },
  },
  {
    id: 'honroutou',
    name: '混老頭',
    kana: 'ホンロウトウ',
    han: 2,
    hanText: '2飜（実質4飜以上）',
    category: '2han',
    type: 'jihai',
    typeName: '端牌・字牌系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '手牌全体を1・9の数牌と字牌だけで揃える役。',
    detail: '手牌のすべての面子・雀頭を老頭牌（1・9）と字牌だけで構成します。必ず「対々和」か「七対子」と複合するため、実質的に4飜以上（満貫確定級）の高打点となります。',
    points: [
      '順子は作れないため、必ずトイトイ（4飜）またはチートイツ（4飜）と複合します',
      '役牌が加わると跳満・倍満へと跳ね上がります',
    ],
    frequency: '★★☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '1m',
                  '1m'
            ],
            [
                  '9p',
                  '9p',
                  '9p'
            ],
            [
                  '1s',
                  '1s',
                  '1s'
            ],
            [
                  '1z',
                  '1z',
                  '1z'
            ],
            [
                  '7z'
            ]
      ],
      agari: '7z',
      agariLabel: ''
},
  },
  {
    id: 'shousangen',
    name: '小三元',
    kana: 'ショウサンゲン',
    han: 2,
    hanText: '2飜 (実質4飜)',
    category: '2han',
    type: 'jihai',
    typeName: '字牌系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '三元牌（白・發・中）のうち2種を刻子にし、残り1種を雀頭にする役。',
    detail: '白・發・中のうち2種類を3枚揃え、残りの1種類を2枚（雀頭）にすると成立します。小三元自体の2飜に加え、三元牌の役牌が2組（2飜）必ず複合するため実質4飜以上（満貫確定）となります。',
    points: [
      '鳴いても飜数は変わらない（鳴きOK）',
      '役牌2飜が必ず加算されるため、最低でも実質4飜（満貫）になります',
    ],
    frequency: '★★☆☆☆',
    hand: {
      groups: [
        ['5z', '5z', '5z'],
        ['6z', '6z', '6z'],
        ['7z', '7z'],
        ['back', 'back', 'back'],
        ['back', 'back']
      ],
      agari: 'back',
      agariLabel: ''
    },
  },

  // =================== 3飜役 ===================
  {
    id: 'honitsu',
    name: '混一色',
    kana: 'ホンイーソー / ホンイツ',
    han: 3,
    hanText: '門前3飜',
    category: '3han',
    type: 'somete',
    typeName: '染め手系',
    naki: 'kuisagari',
    nakiText: '鳴き2飜',
    summary: '1種類の数牌（萬子・筒子・索子）と字牌だけで揃える役。',
    detail: '数牌のいずれか1色と、字牌だけを用いてアガると成立します。通称「ホンイツ」。鳴いても2飜あり、役牌と複合させやすいため、攻撃力・柔軟性ともに非常に優れた代表的役です。',
    points: [
      'ポン・チーしても2飜残るため強烈な武器になります',
      '字牌を使わず数牌1色だけにすると「清一色（6飜）」になります',
    ],
    frequency: '★★★★☆',
    hand: {
      groups: [
            [
                  '2s',
                  '3s',
                  '4s'
            ],
            [
                  '6s',
                  '7s',
                  '8s'
            ],
            [
                  '9s',
                  '9s',
                  '9s'
            ],
            [
                  '1z',
                  '1z',
                  '1z'
            ],
            [
                  '6z'
            ]
      ],
      agari: '6z',
      agariLabel: ''
},
  },
  {
    id: 'junchan',
    name: '純全帯幺九',
    kana: 'ジュンチャン',
    han: 3,
    hanText: '門前3飜',
    category: '3han',
    type: 'shuntsu',
    typeName: '端牌系',
    naki: 'kuisagari',
    nakiText: '鳴き2飜',
    summary: '4面子1雀頭のすべてに1・9の数牌が含まれる役（字牌なし）。',
    detail: 'チャンタの上位役で、すべての面子（順子・刻子）および雀頭に1または9の数牌が含まれており、字牌が一切含まれない場合に成立します。門前3飜、鳴くと2飜です。',
    points: [
      '字牌が1枚でも混ざるとチャンタ（2飜）になります',
      '三色同順や平和と複合すると跳満・倍満の超高打点になります',
    ],
    frequency: '★★☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '2m',
                  '3m'
            ],
            [
                  '7m',
                  '8m',
                  '9m'
            ],
            [
                  '1p',
                  '2p',
                  '3p'
            ],
            [
                  '9s',
                  '9s',
                  '9s'
            ],
            [
                  '1s'
            ]
      ],
      agari: '1s',
      agariLabel: ''
},
  },
  {
    id: 'ryanpeiko',
    name: '二盃口',
    kana: 'リャンペーコー',
    han: 3,
    hanText: '3飜',
    category: '3han',
    type: 'shuntsu',
    typeName: '順子系',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '一盃口（同色同順子）を2組揃える役。',
    detail: '同じ色の同じ順子ペアを2組作ると成立します。門前限定の役です。見た目は七対子と同じ対子7組の形になりますが、常に点数の高い二盃口（4面子1雀頭）として計算されます。',
    points: [
      '門前限定（鳴くと不成立）',
      '七対子とは複合せず、二盃口として扱われます',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '2m',
                  '3m',
                  '4m'
            ],
            [
                  '2m',
                  '3m',
                  '4m'
            ],
            [
                  '5p',
                  '6p',
                  '7p'
            ],
            [
                  '5p',
                  '6p',
                  '7p'
            ],
            [
                  '9s'
            ]
      ],
      agari: '9s',
      agariLabel: ''
},
  },

  // =================== 6飜役 ===================
  {
    id: 'chinitsu',
    name: '清一色',
    kana: 'チンイーソー / チンイツ',
    han: 6,
    hanText: '門前6飜',
    category: '6han',
    type: 'somete',
    typeName: '染め手系',
    naki: 'kuisagari',
    nakiText: '鳴き5飜',
    summary: '萬子・筒子・索子のいずれか1種類だけで揃える役。',
    detail: '字牌を一切使わず、1種類の数牌だけで4面子1雀頭を作ります。通称「チンイツ」。門前で6飜（跳満確定）、鳴いても5飜（満貫確定）という麻雀屈指の破壊力を持ちます。複雑な多面待ちになりやすいのが特徴です。',
    points: [
      '門前なら跳満（12000点/18000点）が確定します',
      '鳴いても5飜で満貫確定',
      '待ち牌の把握が難しく、見逃しやフリテンに注意が必要です',
    ],
    frequency: '★★★☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '2m',
                  '3m'
            ],
            [
                  '3m',
                  '4m',
                  '5m'
            ],
            [
                  '6m',
                  '7m',
                  '8m'
            ],
            [
                  '9m',
                  '9m',
                  '9m'
            ],
            [
                  '2m'
            ]
      ],
      agari: '2m',
      agariLabel: ''
},
  },

  // =================== 役満 ===================
  {
    id: 'kokushi',
    name: '国士無双',
    kana: 'コクシムソウ',
    han: 13,
    hanText: '役満',
    category: 'yakuman',
    type: 'special',
    typeName: '特殊形',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '1・9・字牌全13種類を揃え、そのうち1種を雀頭にする役満。',
    detail: '一萬・九萬・一筒・九筒・一索・九索・東・南・西・北・白・發・中の全13種類を1枚ずつ揃え、いずれか1種類を2枚（雀頭）にしてアガる役満です。',
    points: [
      '門前限定',
      '13種すべてが1枚ずつ揃ったテンパイからアガると「国士無双十三面待ち（W役満）」になります',
      '他家の暗槓に対して唯一「槍槓ロン」ができるローカルルールも広く採用されています',
    ],
    frequency: '★★☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '9m'
            ],
            [
                  '1p',
                  '9p'
            ],
            [
                  '1s',
                  '9s'
            ],
            [
                  '1z',
                  '2z',
                  '3z',
                  '4z'
            ],
            [
                  '5z',
                  '6z',
                  '7z'
            ]
      ],
      agari: '7z',
      agariLabel: ''
},
  },
  {
    id: 'suuankou',
    name: '四暗刻',
    kana: 'スーアンコウ',
    han: 13,
    hanText: '役満',
    category: 'yakuman',
    type: 'koutsu',
    typeName: '刻子系',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '自力で暗刻（暗槓含む）を4組揃えてアガる役満。',
    detail: 'ポンをせず、自分の力だけで暗刻（または暗槓）を4組揃えてアガると成立します。シャボ待ちの場合はツモアガリのみ四暗刻となり、ロンアガリすると三暗刻・対々和になります。',
    points: [
      'シャボ待ちでのロンアガリは四暗刻になりません（ツモなら役満）',
      '先に4暗刻が完成しており単騎待ちでアガると「四暗刻単騎（W役満）」になります',
    ],
    frequency: '★★☆☆☆',
    hand: {
      groups: [
            [
                  '3m',
                  '3m',
                  '3m'
            ],
            [
                  '7p',
                  '7p',
                  '7p'
            ],
            [
                  '2s',
                  '2s',
                  '2s'
            ],
            [
                  '5z',
                  '5z',
                  '5z'
            ],
            [
                  '8m'
            ]
      ],
      agari: '8m',
      agariLabel: 'ツモ限定（単騎はロン可）'
},
  },
  {
    id: 'daisangen',
    name: '大三元',
    kana: 'ダイサンゲン',
    han: 13,
    hanText: '役満',
    category: 'yakuman',
    type: 'jihai',
    typeName: '字牌系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '三元牌（白・發・中）のすべてを刻子（槓子）にして揃える役満。',
    detail: '白・發・中の3種類すべてを刻子（または槓子）として揃えると成立します。鳴いて揃えても役満になります。役満の中でも比較的出現頻度が高い代表的な役満です。',
    points: [
      'ポン・明槓しても役満（鳴きOK）',
      'パオ（責任払い）ルールが採用されることが多いです（2種類ポンしている相手に3種類目を鳴かせた人が全額責任払い）',
    ],
    frequency: '★★☆☆☆',
    hand: {
      groups: [
        ['5z', '5z', '5z'],
        ['6z', '6z', '6z'],
        ['7z', '7z', '7z'],
        ['back', 'back', 'back'],
        ['back']
      ],
      agari: 'back',
      agariLabel: ''
    },
  },
  {
    id: 'tsuuiisou',
    name: '字一色',
    kana: 'ツーイーソー',
    han: 13,
    hanText: '役満',
    category: 'yakuman',
    type: 'jihai',
    typeName: '字牌系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '字牌（東・南・西・北・白・發・中）だけで揃える役満。',
    detail: '手牌全体を風牌（東南西北）と三元牌（白發中）の字牌だけで構成します。鳴いても役満です。対々和の形または七対子の形（大七星）で成立します。',
    points: [
      'ポンしても役満です',
      '七対子の形で作ると「大七星（ダイチーシン）」と呼ばれるローカルW役満になるルールもあります',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '1z',
                  '1z',
                  '1z'
            ],
            [
                  '2z',
                  '2z',
                  '2z'
            ],
            [
                  '3z',
                  '3z',
                  '3z'
            ],
            [
                  '5z',
                  '5z',
                  '5z'
            ],
            [
                  '7z'
            ]
      ],
      agari: '7z',
      agariLabel: ''
},
  },
  {
    id: 'ryuuiisou',
    name: '緑一色',
    kana: 'リューイーソー',
    han: 13,
    hanText: '役満',
    category: 'yakuman',
    type: 'somete',
    typeName: '染め手系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '緑色のみで描かれた牌（2・3・4・6・8索・發）だけで揃える役満。',
    detail: '麻雀牌の中で緑色のみが使われている牌（2索・3索・4索・6索・8索・發）だけで手牌を完成させます。鳴いても役満となります。',
    points: [
      '1索（鳥・赤混じり）、5索（赤）、7索（赤）、9索（赤）は使えません',
      '「發」を使わない緑一色を「發なし緑一色」としてダブル役満とするルールもあります',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '2s',
                  '3s',
                  '4s'
            ],
            [
                  '2s',
                  '3s',
                  '4s'
            ],
            [
                  '6s',
                  '6s',
                  '6s'
            ],
            [
                  '8s',
                  '8s',
                  '8s'
            ],
            [
                  '6z'
            ]
      ],
      agari: '6z',
      agariLabel: ''
},
  },
  {
    id: 'chinroutou',
    name: '清老頭',
    kana: 'チンロウトウ',
    han: 13,
    hanText: '役満',
    category: 'yakuman',
    type: 'jihai',
    typeName: '端牌系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '1と9の数牌（老頭牌）だけで揃える役満。',
    detail: '字牌を一切使わず、一萬・九萬・一筒・九筒・一索・九索の6種類のみで4刻子1雀頭を作ります。鳴いても役満です。',
    points: [
      'ポンしても役満になります',
      '字牌が混ざると混老頭（2飜）になります',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '1m',
                  '1m'
            ],
            [
                  '9m',
                  '9m',
                  '9m'
            ],
            [
                  '1p',
                  '1p',
                  '1p'
            ],
            [
                  '9s',
                  '9s',
                  '9s'
            ],
            [
                  '1s'
            ]
      ],
      agari: '1s',
      agariLabel: ''
},
  },
  {
    id: 'shousuushii',
    name: '小四喜',
    kana: 'ショウスウシー',
    han: 13,
    hanText: '役満',
    category: 'yakuman',
    type: 'jihai',
    typeName: '字牌系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '風牌（東・南・西・北）のうち3種を刻子、残り1種を雀頭にする役満。',
    detail: '東・南・西・北の4種類のうち、3種類を刻子（槓子）にし、残りの1種類を雀頭（2枚）にすることで成立します。鳴いても役満です。',
    points: [
      'ポン・明槓しても役満（鳴きOK）',
      '4種すべてを刻子にすると「大四喜（ダブル役満）」になります',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
        ['1z', '1z', '1z'],
        ['2z', '2z', '2z'],
        ['3z', '3z', '3z'],
        ['4z', '4z'],
        ['back', 'back']
      ],
      agari: 'back',
      agariLabel: ''
    },
  },
  {
    id: 'daisuushii',
    name: '大四喜',
    kana: 'ダイスーシー',
    han: 13,
    hanText: '役満 / W役満',
    category: 'yakuman',
    type: 'jihai',
    typeName: '字牌系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '風牌（東・南・西・北）の4種類すべてを刻子にする役満。',
    detail: '東・南・西・北の4種類すべてを刻子（または槓子）にしてアガる役満です。多くのルールでダブル役満として扱われます。',
    points: [
      '鳴いても成立します',
      '大四喜を確定させる最後の刻子を鳴かせたプレイヤーにはパオ（責任払い）が適用されます',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '1z',
                  '1z',
                  '1z'
            ],
            [
                  '2z',
                  '2z',
                  '2z'
            ],
            [
                  '3z',
                  '3z',
                  '3z'
            ],
            [
                  '4z',
                  '4z',
                  '4z'
            ],
            [
                  'back'
            ]
      ],
      agari: 'back',
      agariLabel: ''
},
  },
  {
    id: 'chuuren',
    name: '九蓮宝燈',
    kana: 'チュウレンポウトウ',
    han: 13,
    hanText: '役満',
    category: 'yakuman',
    type: 'somete',
    typeName: '染め手系',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '同色の数牌で「1112345678999＋同色1枚」を揃える役満。',
    detail: '門前で萬子・筒子・索子のいずれか1色を「1112345678999」の形にし、さらに同色の任意の1枚が加わってアガる伝説の役満です。',
    points: [
      '門前限定',
      '「1112345678999」の状態でテンパイすると1〜9の全数字でアガれる「九面待ち（純正九蓮宝燈 / W役満）」になります',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '1m',
                  '1m'
            ],
            [
                  '2m',
                  '3m',
                  '4m'
            ],
            [
                  '5m',
                  '6m',
                  '7m'
            ],
            [
                  '8m',
                  '9m',
                  '9m',
                  '9m'
            ]
      ],
      agari: '5m',
      agariLabel: ''
},
  },
  {
    id: 'suukantsu',
    name: '四槓子',
    kana: 'スーカンツ',
    han: 13,
    hanText: '役満',
    category: 'yakuman',
    type: 'koutsu',
    typeName: '刻子系',
    naki: 'naki_ok',
    nakiText: '鳴きOK',
    summary: '1人でカンを4回行いアガる役満。麻雀界で最も出現率が低い役。',
    detail: '1人のプレイヤーが暗槓・明槓を問わず4回カンを行い、単騎待ちでアガると成立します。4回のカンが行われた時点で通常は四開槓（流局）となりますが、1人が4回カンした時のみ局が続行されます。',
    points: [
      '出現率は麻雀の役の中で最も低く、奇跡の役満と呼ばれます',
      '4回カンした後は必ず単騎待ちになります',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '1m',
                  '1m',
                  '1m'
            ],
            [
                  '5p',
                  '5p',
                  '5p',
                  '5p'
            ],
            [
                  '8s',
                  '8s',
                  '8s',
                  '8s'
            ],
            [
                  '7z',
                  '7z',
                  '7z',
                  '7z'
            ]
      ],
      agari: '9m',
      agariLabel: ''
},
  },
  {
    id: 'tenhou',
    name: '天和',
    kana: 'テンホウ',
    han: 13,
    hanText: '役満',
    category: 'yakuman',
    type: 'situation',
    typeName: '状況役',
    naki: 'menzen',
    nakiText: '親・配牌時',
    summary: '親の配牌時、すでにアガりの形が完成している奇跡の役満。',
    detail: '親に14枚の牌が配られた時点でアガリが完成している役満です。確率はおよそ33万分の1と言われています。',
    points: [
      '親限定の役満です',
      'ツモアガリ扱いとなります',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '2m',
                  '3m'
            ],
            [
                  '4p',
                  '5p',
                  '6p'
            ],
            [
                  '7s',
                  '8s',
                  '9s'
            ],
            [
                  '3s',
                  '4s',
                  '5s'
            ],
            [
                  '1z'
            ]
      ],
      agari: '1z',
      agariLabel: '親・配牌時'
},
  },
  {
    id: 'chiihou',
    name: '地和',
    kana: 'チーホウ',
    han: 13,
    hanText: '役満',
    category: 'yakuman',
    type: 'situation',
    typeName: '状況役',
    naki: 'menzen',
    nakiText: '子・第1ツモ',
    summary: '子が第1ツモでアガる役満（鳴きが入っていないこと）。',
    detail: '子が配牌完了後、誰もポン・チー・カンをしていない状態で迎えた自分自身の第1ツモでアガると成立します。',
    points: [
      '子限定の役満です',
      '自分の第1ツモの前に親や他家の鳴き（暗槓含む）が入ると不成立になります',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '2m',
                  '3m',
                  '4m'
            ],
            [
                  '5p',
                  '6p',
                  '7p'
            ],
            [
                  '3s',
                  '4s',
                  '5s'
            ],
            [
                  '8s',
                  '8s',
                  '8s'
            ],
            [
                  '6z'
            ]
      ],
      agari: '6z',
      agariLabel: '子・第1ツモ'
},
  },

  // =================== ダブル役満 ===================
  {
    id: 'kokushi-13',
    name: '国士無双十三面待ち',
    kana: 'コクシムソウ ジュウサンメンマチ',
    han: 26,
    hanText: 'ダブル役満',
    category: 'w-yakuman',
    type: 'special',
    typeName: '特殊形',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '13種すべてが1枚ずつ揃った状態から、全種類どれでもアガれる形。',
    detail: '1・9・字牌の全13種を1枚ずつ揃えた状態でテンパイすると、13種類のどの牌がきてもアガれる究極の待ちになります。多くのルールでダブル役満として認定されます。',
    points: [
      '13種類の牌すべてが待ち牌となります',
      'フリテンになりやすいので捨て牌に注意が必要です',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '9m'
            ],
            [
                  '1p',
                  '9p'
            ],
            [
                  '1s',
                  '9s'
            ],
            [
                  '1z',
                  '2z',
                  '3z',
                  '4z'
            ],
            [
                  '5z',
                  '6z',
                  '7z'
            ]
      ],
      agari: '1m',
      agariLabel: ''
},
  },
  {
    id: 'suuankou-tanki',
    name: '四暗刻単騎待ち',
    kana: 'スーアンコウ タンキマチ',
    han: 26,
    hanText: 'ダブル役満',
    category: 'w-yakuman',
    type: 'koutsu',
    typeName: '刻子系',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '自力で4暗刻を完成させた状態で、雀頭を単騎待ちにしてアガる形。',
    detail: 'すでに暗刻が4組完成しており、最後の雀頭（アタマ）を単騎待ちにした状態でアガると成立します。ロンアガリでも確実に役満となり、ダブル役満として採用されます。',
    points: [
      'ロンアガリでも確実に役満（ツモでもロンでも可）',
      '待ち牌を自由に変えられる柔軟性があります',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '2m',
                  '2m',
                  '2m'
            ],
            [
                  '6p',
                  '6p',
                  '6p'
            ],
            [
                  '4s',
                  '4s',
                  '4s'
            ],
            [
                  '7z',
                  '7z',
                  '7z'
            ],
            [
                  '1z'
            ]
      ],
      agari: '1z',
      agariLabel: ''
},
  },
  {
    id: 'junsei-chuuren',
    name: '純正九蓮宝燈',
    kana: 'ジュンセイ チュウレンポウトウ',
    han: 26,
    hanText: 'ダブル役満',
    category: 'w-yakuman',
    type: 'somete',
    typeName: '染め手系',
    naki: 'menzen',
    nakiText: '門前限定',
    summary: '「1112345678999」の形でテンパイし、1〜9の全数字どれでもアガれる形。',
    detail: '同色の数牌で「1112345678999」の完全な基本形を作ってテンパイすると、その色の1から9までのどの数字が来てもアガれる「九面待ち」となります。ダブル役満に採用されます。',
    points: [
      '1から9までのすべての数字がアガリ牌になります',
      '門前限定',
    ],
    frequency: '★☆☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '1m',
                  '1m'
            ],
            [
                  '2m',
                  '3m',
                  '4m'
            ],
            [
                  '5m',
                  '6m',
                  '7m'
            ],
            [
                  '8m',
                  '9m',
                  '9m',
                  '9m'
            ]
      ],
      agari: '7m',
      agariLabel: ''
},
  },

  // =================== 特殊役・懸賞牌 ===================
  {
    id: 'nagashi-mangan',
    name: '流し満貫',
    kana: 'ナガシマンガン',
    han: 5,
    hanText: '満貫扱い',
    category: 'special',
    type: 'special',
    typeName: '特殊役',
    naki: 'menzen',
    nakiText: '捨て牌条件',
    summary: '流局時、自分の捨て牌がすべて1・9・字牌で、誰にも鳴かれていない役。',
    detail: '流局まで自分の捨て牌がすべてヤオ九牌（1・9・字牌）のみで、かつ他家に1枚もポン・チー・カンされていない場合に成立します。アガリ役ではなく流局時の特殊満貫として点数を授受します。',
    points: [
      '自分の捨て牌が1度でも鳴かれたら不成立',
      '自分が鳴いている場合も不成立とするルールが一般的です',
      '親なら4000点オール、子なら親4000点・子2000点オール（ツモアガリ同等）',
    ],
    frequency: '★★☆☆☆',
    hand: {
      groups: [
            [
                  '1m',
                  '9m',
                  '1p'
            ],
            [
                  '9p',
                  '1s',
                  '9s'
            ],
            [
                  '1z',
                  '2z',
                  '3z'
            ],
            [
                  '4z',
                  '5z',
                  '6z'
            ],
            [
                  '7z',
                  '7z'
            ]
      ],
      agariLabel: '流局'
},
  },
  {
    id: 'dora-guide',
    name: 'ドラ・裏ドラ・赤ドラ',
    kana: 'ドラ（ウラドラ・アカドラ）',
    han: 0,
    hanText: '懸賞役 (+1飜/枚)',
    category: 'special',
    type: 'special',
    typeName: '特殊',
    naki: 'naki_ok',
    nakiText: '常時適用',
    summary: '手牌に含まれているだけで1枚につき1飜加算されるボーナス牌。',
    detail: 'ドラ表示牌の次の牌が「ドラ」となります（例: 表示牌が2萬ならドラは3萬、北なら東、中なら白）。アガリ役にプラスして打点を大幅に高めてくれます。※ドラ単体では役にならないため、ドラだけではアガれません。',
    points: [
      '表ドラ：王牌のドラ表示牌の次の牌',
      '裏ドラ：リーチをかけてアガった時のみ見られる表示牌の下のドラ',
      '赤ドラ：赤く着色された五萬・五筒・五索（常時ドラ扱い）',
      'カンドラ：カンをした時にめくられる追加のドラ',
      '重要：ドラだけで役にはなりません（最低1飜の役が必要）',
    ],
    frequency: '★★★★★',
    hand: {
      groups: [
        ['4p', '0p', '6p'],
        ['back', 'back', 'back'],
        ['back', 'back', 'back'],
        ['back', 'back', 'back'],
        ['back']
      ],
      agari: 'back',
      agariLabel: ''
    },
  },
];
