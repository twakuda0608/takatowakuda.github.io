import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc,
  orderBy, query, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// ── Firebase ─────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyBC0X3taGcEclIO8g7Lg7odIdTwaA6gnGY",
  authDomain: "wakuda-tools.firebaseapp.com",
  projectId: "wakuda-tools",
  storageBucket: "wakuda-tools.firebasestorage.app",
  messagingSenderId: "812175144918",
  appId: "1:812175144918:web:e93ea5bec2fcad8810d677"
};

const app      = initializeApp(firebaseConfig);
const db       = getFirestore(app);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

// ── チェックリスト定義 ────────────────────────────────────────────────────────
//
//  type: 'check'  → チェックボックス
//  type: 'text'   → テキスト入力
//  type: 'num'    → 数値入力（suffix / warn 関数でバリデーション）
//  type: 'area'   → テキストエリア（メモ）
//  type: 'select' → セレクトボックス（bad: で NG 値を指定）
//
const CHECKLIST = [
  {
    id: 'pre',
    title: '📋 図面確認',
    desc: '内見前に図面・募集情報で確認しよう',
    groups: [
      {
        name: '🔴 MUST（必須条件）',
        items: [
          { id: 'pre_area',      type: 'check',  label: '中央線沿線（新宿〜西国分寺間）' },
          { id: 'pre_station',   type: 'text',   label: '最寄り駅', ph: '例: 吉祥寺' },
          { id: 'pre_walk',      type: 'walk',   label: '駅徒歩' },
          { id: 'pre_layout',    type: 'check',  label: '1DK以上（部屋が2つ確保できる）' },
          { id: 'pre_2person',   type: 'check',  label: '2人入居OK（同棲可）' },
          { id: 'pre_rent',      type: 'num',    label: '賃料（管理費込）', suffix: '円', warn: v => v > 135000 ? '13.5万円超えています！' : '' },
          { id: 'pre_age',       type: 'age',    label: '築年数' },
          { id: 'pre_structure', type: 'structure', label: '構造' },
          { id: 'pre_bath',      type: 'check',  label: 'バス・トイレ別' },
          { id: 'pre_kitchen',   type: 'check',  label: 'キッチンにまな板スペースあり（図面確認）' },
          { id: 'pre_fiber',     type: 'check',  label: '光回線利用可（VDSLでないか確認）' },
        ]
      },
      {
        name: '🟡 WANT（あると嬉しい）',
        items: [
          {
            id: 'v_washlet', type: 'btns', label: 'ウォッシュレット ⭐',
            opts: [
              { value: 'yes',    label: '○ あり' },
              { value: 'outlet', label: '△ コンセントのみ' },
              { value: 'no',     label: '×' },
            ],
            bad: ['no'], warn: ['outlet']
          },
          { id: 'pre_want_closet',    type: 'check', label: 'クローゼット広め' },
          { id: 'v_garbage24', type: 'check', label: '24時間ゴミ出し ⭐', noNote: { id: 'v_garbage_how', ph: 'ゴミの出し方（曜日・場所・方法など）' } },
          { id: 'pre_want_shower',    type: 'check', label: 'シンクのシャワーヘッド動く' },
          { id: 'pre_want_kitchen',   type: 'check', label: 'キッチン周りのスペースあり' },
        ]
      },
    ]
  },
  {
    id: 'visit',
    title: '🔍 内見チェック',
    desc: 'この順番に確認していこう',
    groups: [
      {
        name: '⚠️ 最初に確認（致命的）',
        items: [
          {
            id: 'v_gas', type: 'btns', label: 'ガスの種類',
            opts: [{ value: '都市ガス', label: '都市ガス' }, { value: 'LPG', label: 'LPG' }, { value: '不明', label: '不明' }],
            bad: ['LPG']
          },
        ]
      },
      {
        name: '🌐 インターネット回線',
        items: [
          {
            id: 'v_flets', type: 'btns', label: 'フレッツ光 住所検索',
            href: 'https://flets.com/app2/cao/',
            opts: [
              { value: 'mansion', label: 'マンション型' },
              { value: 'family',  label: 'ファミリー型' },
              { value: 'none',    label: '対象外' },
            ],
            bad: ['none'], warn: ['family'],
            subGroups: [
              {
                showFor: ['family'],
                hint: 'ファミリー型：建物への一括引き込みなし。個別の光工事が必要な可能性が高い。下の配線方式と合わせて管理会社に確認しよう。',
                items: []
              },
              {
                showFor: ['none'],
                hint: 'フレッツ光の提供対象外。別プロバイダーで確認するか、下の配線方式を現地で確認しよう。',
                items: []
              },
            ]
          },
          {
            id: 'v_net_type', type: 'btns', label: '配線方式',
            opts: [
              { value: 'fiber',   label: '光配線' },
              { value: 'lan',     label: 'LAN' },
              { value: 'vdsl',    label: 'VDSL' },
              { value: 'unknown', label: '不明' },
            ],
            bad: [], warn: ['lan', 'vdsl', 'unknown'],
            subGroups: [
              {
                showFor: ['fiber'],
                hint: '光配線（FTTH）：ファイバーが室内まで直結。\n個人型 → 自由にプロバイダーを選択可。\n一括型 → 建物が一括契約したISPのみ。',
                items: [
                  {
                    id: 'v_net_contract', type: 'btns', label: '契約形態',
                    opts: [
                      { value: 'indiv', label: '個人型' },
                      { value: 'bulk',  label: '一括型' },
                      { value: 'unk',   label: '不明' },
                    ],
                    bad: [], warn: ['bulk', 'unk']
                  },
                ]
              },
              {
                showFor: ['lan', 'vdsl'],
                hint: 'LAN・VDSL方式は速度に制限あり。\n個人で光ファイバーの新規工事を依頼できれば高速回線が使える。\n管理会社に許可されているか確認しよう。',
                items: [
                  { id: 'v_net_indiv_ok', type: 'check', label: '個人で光ファイバー工事を依頼できる（管理会社確認済）' },
                ]
              },
            ],
          },
        ]
      },
      {
        name: '👟 玄関',
        items: [
          { id: 'v_shoe_box',   type: 'check', label: 'シューズボックスあり' },
          { id: 'v_shoe_depth', type: 'text',  label: 'シューズボックス奥行き', ph: '例: 28cm' },
          { id: 'v_shoe_adj',   type: 'check', label: '棚の高さ調整可' },
          {
            id: 'v_interphone', type: 'btns', label: 'インターホン',
            opts: [{ value: 'monitor', label: 'モニター' }, { value: 'voice', label: '音声のみ' }, { value: 'none', label: '×' }],
            bad: ['none']
          },
        ]
      },
      {
        name: '🏠 リビング・部屋',
        items: [
          { id: 'v_floor', type: 'check', label: '床が硬い（フワフワしていない）' },
          { id: 'v_knock', type: 'check', label: '壁ノック → 重く鈍い音（防音良好）' },
          {
            id: 'v_wall_mm', type: 'num', label: '壁厚', suffix: 'mm',
            hint: '180mm以上が目安', warn: v => v < 180 ? '180mm未満：防音に不安あり' : ''
          },
          { id: 'v_room_size',  type: 'text',  label: '寝室・リビングの実測', ph: '例: W3.2m×D4.5m' },
          { id: 'v_bed_ok',     type: 'check', label: 'ベッドが置けるか（メジャーで計測）' },
          { id: 'v_closet',     type: 'text',  label: 'クローゼットサイズ', ph: '例: W180×D80cm' },
          { id: 'v_screen',     type: 'check', label: '網戸あり' },
        ]
      },
      {
        name: '🔧 設備・基本',
        items: [
          { id: 'v_ac_age',     type: 'text', label: 'エアコン年式', ph: '例: 2020年製' },
          {
            id: 'v_breaker', type: 'num', label: 'ブレーカー電流数', suffix: 'A',
            hint: '30A以上が目安', warn: v => v < 30 ? '30A未満：電力不足の可能性あり' : ''
          },
          { id: 'v_leftover',   type: 'check', label: '残置物なし（あれば↓に記載）' },
          { id: 'v_leftover_n', type: 'area',  label: '残置物の詳細', ph: '種類・サイズなど' },
        ]
      },
      {
        name: '🍳 キッチン',
        items: [
          { id: 'v_board',      type: 'check',  label: 'まな板スペースあり（実測確認）' },
          {
            id: 'v_stove', type: 'select', label: 'ガスコンロ',
            opts: ['（未確認）', '設備（設備表記載）', '残置物', 'なし']
          },
          { id: 'v_stove_size', type: 'text',  label: '残置物コンロのサイズ', ph: '例: W60×D45cm' },
          { id: 'v_shower',     type: 'check', label: 'シンクのシャワーヘッド動く' },
          { id: 'v_fan',        type: 'check', label: '換気扇：音・吸引力OK' },
        ]
      },
      {
        name: '🛁 お風呂',
        items: [
          { id: 'v_hot',        type: 'check', label: '給湯スイッチ動作OK' },
          { id: 'v_pressure',   type: 'check', label: '水圧OK' },
          { id: 'v_drain',      type: 'check', label: '排水口から正常に流れる' },
          { id: 'v_bath_dryer', type: 'check', label: '浴室乾燥あり' },
        ]
      },
      {
        name: '🚽 トイレ',
        items: [
          {
            id: 'v_washlet', type: 'btns', label: 'ウォッシュレット ⭐',
            opts: [
              { value: 'yes',    label: '○ あり' },
              { value: 'outlet', label: '△ コンセントのみ' },
              { value: 'no',     label: '×' },
            ],
            bad: ['no'], warn: ['outlet']
          },
        ]
      },
      {
        name: '🏢 共用部・外',
        items: [
          { id: 'v_board_ok',  type: 'check', label: '共用部の掲示板に問題なし' },
          { id: 'v_garbage24', type: 'check', label: '24時間ゴミ出しOK ⭐', noNote: { id: 'v_garbage_how', ph: 'ゴミの出し方（曜日・場所・方法など）' } },
          { id: 'v_garbage_n', type: 'text',  label: 'ゴミ置き場', ph: '場所・出し方・曜日' },
          { id: 'v_bike',      type: 'text',  label: '駐輪場', ph: '有無・台数・料金' },
        ]
      },
    ]
  },
  {
    id: 'questions',
    title: '💬 担当者への質問',
    desc: '担当者に直接確認してメモしよう',
    items: [
      { id: 'q_merit',   type: 'area', label: 'この物件のメリット・デメリット', ph: '担当者の回答をメモ' },
      { id: 'q_sound',   type: 'area', label: '防音性について', ph: '壁の厚さ、隣の声が聞こえるかなど' },
      { id: 'q_exit',    type: 'area', label: '前の入居者の退去理由', ph: '担当者の回答をメモ' },
      { id: 'q_mgmt',    type: 'area', label: '管理会社について', ph: '担当者名・対応の印象など' },
      { id: 'q_parking', type: 'area', label: '駐輪場の詳細', ph: '台数・申込方法など' },
    ]
  },
  {
    id: 'contract',
    title: '📝 契約チェック',
    desc: '契約前・契約時に確認するリスト',
    items: [
      { id: 'c_name',      type: 'text',  label: '契約名義', ph: '本人 or 親名義' },
      { id: 'c_mail',      type: 'check', label: '書類は郵送でOK' },
      { id: 'c_explain',   type: 'check', label: '重要事項説明を聞いた' },
      { id: 'c_equip',     type: 'area',  label: '設備・残置物リスト', ph: 'エアコン年式・対応方針など' },
      { id: 'c_notice',    type: 'text',  label: '解約予告期間', ph: '例: 1ヶ月前', hint: '2ヶ月以上なら注意' },
      { id: 'c_mgmt_net',  type: 'check', label: '管理会社をネット検索済み' },
      { id: 'c_special',   type: 'area',  label: '特約事項の内容', ph: 'しっかり読んで記録' },
      { id: 'c_clean_fee', type: 'text',  label: '退去時清掃費', ph: '例: 45,000円', hint: '4〜5万円が相場' },
      { id: 'c_repair_ok', type: 'check', label: '「退去補修費は全額借主負担」の特約なし（要注意）' },
      { id: 'c_penalty',   type: 'text',  label: '違約金', ph: '例: 家賃1ヶ月分' },
      { id: 'c_renewal',   type: 'text',  label: '更新料', ph: '例: 家賃1ヶ月分' },
    ]
  }
];

// ── ユーティリティ ────────────────────────────────────────────────────────────

function getAllItems(sec) {
  return sec.groups ? sec.groups.flatMap(g => g.items) : (sec.items ?? []);
}

function findItem(id) {
  for (const s of CHECKLIST) {
    const f = getAllItems(s).find(i => i.id === id);
    if (f) return f;
  }
  return null;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function calcProgress(checks) {
  const seen = new Set();
  const all  = CHECKLIST.flatMap(s => getAllItems(s))
    .filter(i => i.type === 'check' && !seen.has(i.id) && seen.add(i.id));
  const total = all.length;
  const done  = all.filter(i => checks[i.id] === true || checks[i.id] === false).length;
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
}

function showView(name) {
  document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
  document.getElementById(name)?.classList.remove('hidden');
  document.body.dataset.view = name;
}

// ── 状態 ─────────────────────────────────────────────────────────────────────

let currentUser   = null;
let properties    = [];
let currentPropId = null;
let saveTimer     = null;

// ── 認証 ─────────────────────────────────────────────────────────────────────

onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) {
    const av = document.getElementById('user-avatar');
    if (av) av.src = user.photoURL ?? '';
    loadProperties();
  } else {
    showView('view-login');
  }
});

document.getElementById('login-btn')?.addEventListener('click', () => {
  signInWithPopup(auth, provider).catch(() => alert('ログインに失敗しました'));
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await signOut(auth);
  properties = [];
  currentPropId = null;
  showView('view-login');
});

// ── 物件一覧の読み込み ────────────────────────────────────────────────────────

async function loadProperties() {
  showView('view-loading');
  try {
    const q = query(
      collection(db, 'naiken_properties'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    properties = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('loadProperties:', e);
  }
  renderPropertyList();
  showView('view-list');
}

// ── 物件一覧の描画 ────────────────────────────────────────────────────────────

function renderPropertyList() {
  const list = document.getElementById('property-list');
  if (!list) return;

  if (!properties.length) {
    list.innerHTML = `
      <div class="empty-msg">
        <div class="empty-icon">🏠</div>
        <div>物件をまだ追加していません</div>
        <div class="empty-sub">「＋ 物件を追加」ボタンから始めましょう</div>
      </div>`;
    return;
  }

  list.innerHTML = properties.map(p => {
    const prog       = calcProgress(p.checks ?? {});
    const overBudget = p.rent && Number(p.rent) > 135000;
    const rentText   = p.rent ? `${Number(p.rent).toLocaleString()}円` : '賃料未入力';
    const walkText   = p.walkMin ? `徒歩${p.walkMin}分` : '';
    const stText     = [p.station, walkText].filter(Boolean).join('・');
    const subText    = [stText, rentText].filter(Boolean).join(' / ');
    const fillClass  = prog.pct === 100 ? 'prog-fill prog-done' : 'prog-fill';

    return `
      <div class="prop-card" data-id="${esc(p.id)}" role="button" tabindex="0"
           aria-label="${esc(p.name)}を開く">
        <div class="prop-main">
          <div class="prop-name">${esc(p.name)}</div>
          <div class="prop-sub">${esc(subText)}</div>
          ${overBudget ? '<div class="prop-warn">⚠️ 予算オーバー（13.5万円超）</div>' : ''}
          <div class="prog-wrap">
            <div class="prog-bar">
              <div class="${fillClass}" style="width:${prog.pct}%"></div>
            </div>
            <span class="prog-text">${prog.done}/${prog.total} チェック済</span>
          </div>
        </div>
        <button class="prop-del" data-id="${esc(p.id)}" aria-label="削除" title="削除">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>`;
  }).join('');

  list.querySelectorAll('.prop-card').forEach(card => {
    const open = e => {
      if (e.target.closest('.prop-del')) return;
      openProperty(card.dataset.id);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
    });
  });

  list.querySelectorAll('.prop-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteProperty(btn.dataset.id);
    });
  });
}

// ── 物件追加モーダル ──────────────────────────────────────────────────────────

document.getElementById('add-btn')?.addEventListener('click', addProperty);

async function addProperty() {
  const data = {
    userId:    currentUser.uid,
    name:      `物件${properties.length + 1}`,
    station:   '',
    walkMin:   null,
    rent:      null,
    address:   '',
    checks:    {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  try {
    const ref = await addDoc(collection(db, 'naiken_properties'), data);
    properties.unshift({ id: ref.id, ...data });
    openProperty(ref.id);
  } catch (e) {
    console.error('addProperty:', e);
    alert('追加に失敗しました');
  }
}

async function deleteProperty(id) {
  if (!confirm('この物件を削除しますか？')) return;
  try {
    await deleteDoc(doc(db, 'naiken_properties', id));
    properties = properties.filter(p => p.id !== id);
    renderPropertyList();
  } catch (e) {
    console.error('deleteProperty:', e);
    alert('削除に失敗しました');
  }
}

// ── 物件詳細（チェックリスト）────────────────────────────────────────────────

function openProperty(id) {
  currentPropId = id;
  const prop = properties.find(p => p.id === id);
  if (!prop) return;

  const nameEl = document.getElementById('detail-name');
  const subEl  = document.getElementById('detail-sub');
  if (nameEl) nameEl.textContent = prop.name;

  const parts = [
    prop.station ? `${prop.station}${prop.walkMin ? `・徒歩${prop.walkMin}分` : ''}` : '',
    prop.rent    ? `${Number(prop.rent).toLocaleString()}円` : '',
  ].filter(Boolean);
  if (subEl) subEl.textContent = parts.join(' / ');

  const infoEl = document.getElementById('prop-info');
  if (infoEl) {
    infoEl.innerHTML = `
      <input class="pi-name-inp" data-meta="name" value="${esc(prop.name)}" placeholder="物件名を入力">
      <div class="pi-rows">
        <div class="pi-row"><span class="pi-lbl">住所</span><input class="pi-inp" data-meta="address" value="${esc(prop.address ?? '')}" placeholder="例: 武蔵野市吉祥寺..."></div>
      </div>`;
    bindMetaEvents(infoEl);
  }

  renderChecklist(prop.checks ?? {});
  showView('view-detail');
  window.scrollTo(0, 0);
}

document.getElementById('back-btn')?.addEventListener('click', () => {
  currentPropId = null;
  renderPropertyList();
  showView('view-list');
  window.scrollTo(0, 0);
});

// ── チェックリスト描画 ────────────────────────────────────────────────────────

function renderChecklist(checks) {
  const wrap = document.getElementById('checklist-wrap');
  if (!wrap) return;
  wrap.innerHTML = CHECKLIST.map(sec => renderSection(sec, checks)).join('');
  bindChecklistEvents(wrap);
}

function renderSection(sec, checks) {
  const all        = getAllItems(sec);
  const checkItems = all.filter(i => i.type === 'check');
  const done       = checkItems.filter(i => checks[i.id] === true).length;
  const total      = checkItems.length;

  let bodyHtml;
  if (sec.groups) {
    bodyHtml = sec.groups.map(g => `
      <div class="item-group">
        <div class="group-label">${g.name}</div>
        ${g.items.map(item => renderItem(item, checks)).join('')}
      </div>`).join('');
  } else {
    bodyHtml = (sec.items ?? []).map(item => renderItem(item, checks)).join('');
  }

  const pctHtml = total > 0
    ? `<span class="section-pct${done === total ? ' all-done' : ''}">${done}/${total}</span>`
    : '';

  return `
    <div class="section-card">
      <div class="section-hd" role="button" aria-expanded="true" tabindex="0">
        <div class="section-hd-left">
          <span class="section-title">${sec.title}</span>
          <span class="section-desc">${esc(sec.desc ?? '')}</span>
        </div>
        <div class="section-hd-right">
          ${pctHtml}
          <span class="section-chevron">▴</span>
        </div>
      </div>
      <div class="section-body">
        ${bodyHtml}
      </div>
    </div>`;
}

function renderItem(item, checks) {
  const val = checks[item.id];

  // ── チェックボックス ──
  if (item.type === 'check') {
    const isYes = val === true;
    const isNo  = val === false;
    const rowState = isYes ? ' row-on' : isNo ? ' row-no' : '';
    const btnsHtml = `
      <div class="yn-btns">
        <button class="yn-btn${isYes ? ' yn-yes-on' : ''}" data-id="${item.id}" data-yn="true">○</button>
        <button class="yn-btn${isNo  ? ' yn-no-on'  : ''}" data-id="${item.id}" data-yn="false">×</button>
      </div>`;

    if (item.noNote) {
      const noteHtml = `
        <div class="yn-note${isNo ? '' : ' hidden'}">
          <textarea class="area-inp" data-id="${esc(item.noNote.id)}"
                    placeholder="${esc(item.noNote.ph ?? '')}" rows="2">${esc(String(checks[item.noNote.id] ?? ''))}</textarea>
        </div>`;
      return `
        <div class="row-yn${rowState} row-yn--hasnote">
          <div class="yn-main">
            <span class="yn-label">${item.label}</span>
            ${btnsHtml}
          </div>
          ${noteHtml}
        </div>`;
    }

    return `
      <div class="row-yn${rowState}">
        <span class="yn-label">${item.label}</span>
        ${btnsHtml}
      </div>`;
  }

  // ── 構造3択 ──
  if (item.type === 'structure') {
    const v = val ?? null;
    return `
      <div class="row-yn${v === 'RC' || v === 'SRC' ? ' row-on' : v === 'bad' ? ' row-no' : ''}">
        <span class="yn-label">${item.label}</span>
        <div class="yn-btns">
          <button class="yn-btn str-btn${v === 'RC'  ? ' yn-yes-on' : ''}" data-id="${item.id}" data-str="RC">○ RC</button>
          <button class="yn-btn str-btn${v === 'SRC' ? ' yn-yes-on' : ''}" data-id="${item.id}" data-str="SRC">○ SRC</button>
          <button class="yn-btn str-btn${v === 'bad' ? ' yn-no-on'  : ''}" data-id="${item.id}" data-str="bad">×</button>
        </div>
      </div>`;
  }

  // ── ボタン多択 ──
  if (item.type === 'btns') {
    const v       = val ?? null;
    const isBad   = v != null && (item.bad  ?? []).includes(v);
    const isWarn  = v != null && (item.warn ?? []).includes(v);
    const rowCls  = v == null ? '' : isBad ? ' row-no' : isWarn ? ' row-warn' : ' row-on';
    const btns    = (item.opts ?? []).map(o => {
      const isSelected = v === o.value;
      const isBadOpt   = (item.bad  ?? []).includes(o.value);
      const isWarnOpt  = (item.warn ?? []).includes(o.value);
      const btnCls     = isSelected ? (isBadOpt ? ' yn-no-on' : isWarnOpt ? ' yn-warn-on' : ' yn-yes-on') : '';
      return `<button class="yn-btn multi-btn${btnCls}" data-id="${esc(item.id)}" data-val="${esc(o.value)}" data-bad="${isBadOpt}" data-warn="${isWarnOpt}">${esc(o.label)}</button>`;
    }).join('');
    const subHtml = (item.subGroups ?? []).map(sg => {
      const visible = v != null && sg.showFor.includes(v);
      const hintHtml = sg.hint
        ? `<div class="btns-sub-hint">${sg.hint.replace(/\n/g, '<br>')}</div>`
        : '';
      return `
        <div class="btns-sub${visible ? '' : ' btns-sub--hidden'}" data-show-for="${esc(sg.showFor.join(','))}">
          ${hintHtml}
          ${(sg.items ?? []).map(si => renderItem(si, checks)).join('')}
        </div>`;
    }).join('');
    const linkHtml = item.href
      ? ` <a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer" class="item-link">↗ 開く</a>`
      : '';
    return `
      <div class="row-yn row-yn--btns${rowCls}">
        <span class="yn-label">${item.label}${linkHtml}</span>
        <div class="yn-btns">${btns}</div>
        ${subHtml}
      </div>`;
  }

  // ── 徒歩スライダー ──
  if (item.type === 'walk') {
    const v = val != null ? Number(val) : 0;
    let cls = 'walk-empty', icon = '—';
    if      (v > 0 && v <= 10) { cls = 'walk-good'; icon = '○'; }
    else if (v <= 15)           { cls = 'walk-warn'; icon = '△'; }
    else if (v === 16)          { cls = 'walk-bad';  icon = '×'; }
    const dispLabel = v === 0 ? '未入力' : v >= 16 ? '16分以上' : `${v}分`;
    const accentColor = cls === 'walk-good' ? '#16a34a' : cls === 'walk-warn' ? '#d97706' : cls === 'walk-bad' ? '#dc2626' : '#94a3b8';
    return `
      <div class="row-input">
        <div class="row-label">${item.label}</div>
        <div class="walk-wrap">
          <input type="range" class="walk-range" data-id="${item.id}"
                 value="${v}" min="0" max="16" step="1" style="accent-color:${accentColor}">
          <span class="walk-badge ${cls}">${icon} ${dispLabel}</span>
        </div>
      </div>`;
  }

  // ── 築年数スライダー ──
  if (item.type === 'age') {
    const v = val != null ? Number(val) : 0;
    let cls = 'walk-empty', icon = '—';
    if      (v > 0 && v <= 20) { cls = 'walk-good'; icon = '○'; }
    else if (v <= 25)           { cls = 'walk-warn'; icon = '△'; }
    else if (v > 25)            { cls = 'walk-bad';  icon = '×'; }
    const dispLabel = v === 0 ? '未入力' : v >= 26 ? '26年以上' : `築${v}年`;
    const accentColor = cls === 'walk-good' ? '#16a34a' : cls === 'walk-warn' ? '#d97706' : cls === 'walk-bad' ? '#dc2626' : '#94a3b8';
    return `
      <div class="row-input">
        <div class="row-label">${item.label}</div>
        <div class="walk-wrap">
          <input type="range" class="age-range" data-id="${item.id}"
                 value="${v}" min="0" max="26" step="1" style="accent-color:${accentColor}">
          <span class="walk-badge ${cls}">${icon} ${dispLabel}</span>
        </div>
      </div>`;
  }

  // ── テキスト入力 ──
  if (item.type === 'text') {
    const v = val != null ? esc(String(val)) : '';
    return `
      <div class="row-input">
        <div class="row-label">
          ${item.label}
          ${item.hint ? `<span class="hint">${esc(item.hint)}</span>` : ''}
        </div>
        <input type="text" class="text-inp" data-id="${item.id}"
               value="${v}" placeholder="${esc(item.ph ?? '')}">
      </div>`;
  }

  // ── 数値入力 ──
  if (item.type === 'num') {
    const v       = val != null ? String(val) : '';
    const warnMsg = item.warn && v ? item.warn(Number(v)) : '';
    return `
      <div class="row-input">
        <div class="row-label">
          ${item.label}
          ${item.hint ? `<span class="hint">${esc(item.hint)}</span>` : ''}
        </div>
        <div class="num-row">
          <input type="number" class="num-inp" data-id="${item.id}"
                 value="${v}" placeholder="${esc(item.ph ?? '')}">
          ${item.suffix ? `<span class="inp-suffix">${esc(item.suffix)}</span>` : ''}
        </div>
        ${warnMsg ? `<div class="warn-msg">⚠️ ${esc(warnMsg)}</div>` : ''}
      </div>`;
  }

  // ── テキストエリア ──
  if (item.type === 'area') {
    const v = val != null ? esc(String(val)) : '';
    return `
      <div class="row-input">
        <div class="row-label">${item.label}</div>
        <textarea class="area-inp" data-id="${item.id}"
                  placeholder="${esc(item.ph ?? '')}" rows="3">${v}</textarea>
      </div>`;
  }

  // ── セレクト ──
  if (item.type === 'select') {
    const v     = val != null ? String(val) : (item.opts?.[0] ?? '');
    const isBad = item.bad?.includes(v) ?? false;
    const opts  = (item.opts ?? []).map(o =>
      `<option value="${esc(o)}"${v === o ? ' selected' : ''}>${esc(o)}</option>`
    ).join('');
    return `
      <div class="row-input${isBad ? ' row-bad' : ''}">
        <div class="row-label">${item.label}</div>
        <select class="sel-inp" data-id="${item.id}">${opts}</select>
        ${isBad ? '<div class="bad-msg">⚠️ 注意が必要な選択です</div>' : ''}
      </div>`;
  }

  return '';
}

// ── イベントバインド ──────────────────────────────────────────────────────────

function bindChecklistEvents(wrap) {
  // ○/×ボタン
  wrap.querySelectorAll('.yn-btn[data-yn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = btn.dataset.id;
      const isYes = btn.dataset.yn === 'true';
      const row   = btn.closest('.row-yn');
      const wasOn = btn.classList.contains(isYes ? 'yn-yes-on' : 'yn-no-on');

      row.querySelectorAll('.yn-btn').forEach(b => b.classList.remove('yn-yes-on', 'yn-no-on'));

      const newVal = wasOn ? null : isYes;
      if (!wasOn) btn.classList.add(isYes ? 'yn-yes-on' : 'yn-no-on');
      row.classList.toggle('row-on', newVal === true);
      row.classList.toggle('row-no', newVal === false);

      const noteWrap = row.querySelector('.yn-note');
      if (noteWrap) noteWrap.classList.toggle('hidden', newVal !== false);

      // 同じIDが別セクションにある場合は同期
      wrap.querySelectorAll(`.yn-btn[data-id="${id}"][data-yn]`).forEach(otherBtn => {
        const otherRow = otherBtn.closest('.row-yn');
        if (otherRow === row) return;
        otherRow.querySelectorAll('.yn-btn').forEach(b => b.classList.remove('yn-yes-on', 'yn-no-on'));
        if (newVal !== null) {
          otherRow.querySelector(`.yn-btn[data-yn="${newVal}"]`)
            ?.classList.add(newVal ? 'yn-yes-on' : 'yn-no-on');
        }
        otherRow.classList.toggle('row-on', newVal === true);
        otherRow.classList.toggle('row-no', newVal === false);
        const otherNote = otherRow.querySelector('.yn-note');
        if (otherNote) otherNote.classList.toggle('hidden', newVal !== false);
      });

      saveCheck(id, newVal);
      updateSectionCounter(btn);
    });
  });

  // 構造3択
  wrap.querySelectorAll('.str-btn[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id  = btn.dataset.id;
      const str = btn.dataset.str;
      const row = btn.closest('.row-yn');
      const wasOn = btn.classList.contains('yn-yes-on') || btn.classList.contains('yn-no-on');

      row.querySelectorAll('.str-btn').forEach(b => b.classList.remove('yn-yes-on', 'yn-no-on'));

      let newVal = null;
      if (!wasOn) {
        btn.classList.add(str === 'bad' ? 'yn-no-on' : 'yn-yes-on');
        newVal = str;
      }
      row.classList.toggle('row-on', newVal === 'RC' || newVal === 'SRC');
      row.classList.toggle('row-no', newVal === 'bad');

      saveCheck(id, newVal);
      updateSectionCounter(btn);
    });
  });

  // ボタン多択
  wrap.querySelectorAll('.multi-btn[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = btn.dataset.id;
      const v      = btn.dataset.val;
      const isBad  = btn.dataset.bad === 'true';
      const isWarn = btn.dataset.warn === 'true';
      const row    = btn.closest('.row-yn');
      const wasOn  = btn.classList.contains('yn-yes-on') || btn.classList.contains('yn-warn-on') || btn.classList.contains('yn-no-on');

      // サブパネル内のボタンを巻き込まないよう直下の .yn-btns のみクリア
      const directBtns = row.querySelector(':scope > .yn-btns');
      (directBtns ?? row).querySelectorAll('.multi-btn')
        .forEach(b => b.classList.remove('yn-yes-on', 'yn-warn-on', 'yn-no-on'));

      let newVal = null;
      if (!wasOn) {
        btn.classList.add(isBad ? 'yn-no-on' : isWarn ? 'yn-warn-on' : 'yn-yes-on');
        newVal = v;
      }
      row.classList.toggle('row-on',   newVal != null && !isBad && !isWarn);
      row.classList.toggle('row-warn', newVal != null && isWarn);
      row.classList.toggle('row-no',   newVal != null && isBad);

      // サブパネルの表示切替
      row.querySelectorAll(':scope > .btns-sub').forEach(panel => {
        const showFor = panel.dataset.showFor.split(',');
        panel.classList.toggle('btns-sub--hidden', newVal == null || !showFor.includes(newVal));
      });

      // 同じIDが別セクションにある場合は同期
      wrap.querySelectorAll(`.multi-btn[data-id="${id}"]`).forEach(otherBtn => {
        const otherRow = otherBtn.closest('.row-yn');
        if (otherRow === row) return;
        const oBtns = otherRow.querySelector(':scope > .yn-btns');
        (oBtns ?? otherRow).querySelectorAll('.multi-btn')
          .forEach(b => b.classList.remove('yn-yes-on', 'yn-warn-on', 'yn-no-on'));
        if (newVal != null) {
          const matchBtn = (oBtns ?? otherRow).querySelector(`.multi-btn[data-val="${newVal}"]`);
          if (matchBtn) {
            const mb = matchBtn.dataset.bad === 'true';
            const mw = matchBtn.dataset.warn === 'true';
            matchBtn.classList.add(mb ? 'yn-no-on' : mw ? 'yn-warn-on' : 'yn-yes-on');
            otherRow.classList.toggle('row-on',   !mb && !mw);
            otherRow.classList.toggle('row-warn', mw);
            otherRow.classList.toggle('row-no',   mb);
          } else {
            otherRow.classList.remove('row-on', 'row-warn', 'row-no');
          }
        } else {
          otherRow.classList.remove('row-on', 'row-warn', 'row-no');
        }
      });

      saveCheck(id, newVal);
      updateSectionCounter(btn);
    });
  });

  // 徒歩スライダー
  wrap.querySelectorAll('input.walk-range[data-id]').forEach(inp => {
    inp.addEventListener('input', () => {
      const v = Number(inp.value);
      saveCheck(inp.dataset.id, v || null);
      let cls = 'walk-empty', icon = '—';
      if      (v > 0 && v <= 10) { cls = 'walk-good'; icon = '○'; }
      else if (v <= 15)           { cls = 'walk-warn'; icon = '△'; }
      else if (v === 16)          { cls = 'walk-bad';  icon = '×'; }
      const dispLabel = v === 0 ? '未入力' : v >= 16 ? '16分以上' : `${v}分`;
      inp.style.accentColor = cls === 'walk-good' ? '#16a34a' : cls === 'walk-warn' ? '#d97706' : cls === 'walk-bad' ? '#dc2626' : '#94a3b8';
      const badge = inp.closest('.walk-wrap')?.querySelector('.walk-badge');
      if (badge) { badge.className = `walk-badge ${cls}`; badge.textContent = `${icon} ${dispLabel}`; }
    });
  });

  // 築年数スライダー
  wrap.querySelectorAll('input.age-range[data-id]').forEach(inp => {
    inp.addEventListener('input', () => {
      const v = Number(inp.value);
      saveCheck(inp.dataset.id, v || null);
      let cls = 'walk-empty', icon = '—';
      if      (v > 0 && v <= 20) { cls = 'walk-good'; icon = '○'; }
      else if (v <= 25)           { cls = 'walk-warn'; icon = '△'; }
      else if (v > 25)            { cls = 'walk-bad';  icon = '×'; }
      const dispLabel = v === 0 ? '未入力' : v >= 26 ? '26年以上' : `築${v}年`;
      inp.style.accentColor = cls === 'walk-good' ? '#16a34a' : cls === 'walk-warn' ? '#d97706' : cls === 'walk-bad' ? '#dc2626' : '#94a3b8';
      const badge = inp.closest('.walk-wrap')?.querySelector('.walk-badge');
      if (badge) { badge.className = `walk-badge ${cls}`; badge.textContent = `${icon} ${dispLabel}`; }
    });
  });

  // テキスト入力
  wrap.querySelectorAll('input.text-inp[data-id]').forEach(inp => {
    inp.addEventListener('input', () => saveCheck(inp.dataset.id, inp.value));
  });

  // 数値入力
  wrap.querySelectorAll('input.num-inp[data-id]').forEach(inp => {
    inp.addEventListener('input', () => {
      const v    = inp.value !== '' ? Number(inp.value) : null;
      saveCheck(inp.dataset.id, v);
      const item = findItem(inp.dataset.id);
      const row  = inp.closest('.row-input');
      if (!row) return;
      let warnEl = row.querySelector('.warn-msg');
      if (item?.warn && inp.value !== '') {
        const msg = item.warn(Number(inp.value));
        if (msg) {
          if (!warnEl) {
            warnEl = document.createElement('div');
            warnEl.className = 'warn-msg';
            row.appendChild(warnEl);
          }
          warnEl.textContent = '⚠️ ' + msg;
        } else {
          warnEl?.remove();
        }
      }
    });
  });

  // テキストエリア
  wrap.querySelectorAll('textarea.area-inp[data-id]').forEach(ta => {
    ta.addEventListener('input', () => {
      saveCheck(ta.dataset.id, ta.value);
      wrap.querySelectorAll(`textarea.area-inp[data-id="${ta.dataset.id}"]`).forEach(other => {
        if (other !== ta) other.value = ta.value;
      });
    });
  });

  // セレクト
  wrap.querySelectorAll('select.sel-inp[data-id]').forEach(sel => {
    sel.addEventListener('change', () => {
      saveCheck(sel.dataset.id, sel.value);
      const item = findItem(sel.dataset.id);
      const row  = sel.closest('.row-input');
      if (!row || !item?.bad) return;
      const isBad = item.bad.includes(sel.value);
      row.classList.toggle('row-bad', isBad);
      let badEl = row.querySelector('.bad-msg');
      if (isBad) {
        if (!badEl) {
          badEl = document.createElement('div');
          badEl.className = 'bad-msg';
          row.appendChild(badEl);
        }
        badEl.textContent = '⚠️ 注意が必要な選択です';
      } else {
        badEl?.remove();
      }
    });
  });

  // セクション開閉（クリック + キーボード）
  wrap.querySelectorAll('.section-hd').forEach(hd => {
    const toggle = () => {
      const body  = hd.nextElementSibling;
      const close = body.classList.toggle('section-closed');
      hd.setAttribute('aria-expanded', String(!close));
      hd.querySelector('.section-chevron').textContent = close ? '▾' : '▴';
    };
    hd.addEventListener('click', toggle);
    hd.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
}

// セクションのカウンター（チェック済み / 全体）をリアルタイム更新
function updateSectionCounter(el) {
  const card = el.closest('.section-card');
  if (!card) return;
  const pctEl = card.querySelector('.section-pct');
  if (!pctEl) return;
  // サブパネル内の行は集計から除外
  const rows  = [...card.querySelectorAll('.row-yn')].filter(r => !r.closest('.btns-sub'));
  const total = rows.length;
  const done  = rows.filter(r => r.querySelector('.yn-yes-on, .yn-no-on')).length;
  pctEl.textContent = `${done}/${total}`;
  pctEl.classList.toggle('all-done', done === total && total > 0);
}

// ── 物件メタ情報の編集・保存 ──────────────────────────────────────────────────

let metaSaveTimer = null;

function bindMetaEvents(infoEl) {
  infoEl.querySelectorAll('[data-meta]').forEach(inp => {
    inp.addEventListener('input', () => {
      const field = inp.dataset.meta;
      const value = (inp.type === 'number' || inp.type === 'range')
        ? (inp.value !== '' ? Number(inp.value) : null)
        : inp.value;

      if (field === 'walkMin') {
        const label = inp.closest('.pi-walk-w')?.querySelector('.pi-walk-val');
        if (label) label.textContent = value > 0 ? `${value}分` : '未入力';
      }
      const prop = properties.find(p => p.id === currentPropId);
      if (prop) prop[field] = value;

      if (field === 'name') {
        const nameEl = document.getElementById('detail-name');
        if (nameEl) nameEl.textContent = value || '';
      }
      if (field === 'rent') {
        const overBudget = value && value > 135000;
        const wrapper = inp.closest('.pi-inp-w');
        let overEl = wrapper?.querySelector('.pi-over');
        if (overBudget && !overEl && wrapper) {
          overEl = document.createElement('span');
          overEl.className = 'pi-over';
          overEl.textContent = '⚠️ 予算オーバー';
          wrapper.appendChild(overEl);
        } else if (!overBudget && overEl) {
          overEl.remove();
        }
      }

      const status = document.getElementById('save-status');
      if (status) { status.textContent = '保存中…'; status.className = 'save-status saving'; }

      clearTimeout(metaSaveTimer);
      metaSaveTimer = setTimeout(async () => {
        const p = properties.find(x => x.id === currentPropId);
        if (!p) return;
        try {
          await updateDoc(doc(db, 'naiken_properties', currentPropId), {
            name:    p.name    ?? '',
            station: p.station ?? '',
            walkMin: p.walkMin ?? null,
            rent:    p.rent    ?? null,
            address: p.address ?? '',
            updatedAt: serverTimestamp(),
          });
          if (status) {
            status.textContent = '✓ 保存済み';
            status.className   = 'save-status saved';
            setTimeout(() => { status.textContent = ''; status.className = 'save-status'; }, 2000);
          }
        } catch (e) {
          console.error('saveMetaField:', e);
          if (status) { status.textContent = '✗ 保存失敗'; status.className = 'save-status error'; }
        }
      }, 700);
    });
  });
}

// ── 保存（デバウンス）────────────────────────────────────────────────────────

function saveCheck(id, value) {
  const prop = properties.find(p => p.id === currentPropId);
  if (!prop) return;
  prop.checks     ??= {};
  prop.checks[id]   = value;

  const status = document.getElementById('save-status');
  if (status) {
    status.textContent = '保存中…';
    status.className   = 'save-status saving';
  }

  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await updateDoc(doc(db, 'naiken_properties', currentPropId), {
        [`checks.${id}`]: value,
        updatedAt: serverTimestamp(),
      });
      if (status) {
        status.textContent = '✓ 保存済み';
        status.className   = 'save-status saved';
        setTimeout(() => {
          status.textContent = '';
          status.className   = 'save-status';
        }, 2000);
      }
    } catch (e) {
      console.error('saveCheck:', e);
      if (status) {
        status.textContent = '✗ 保存失敗';
        status.className   = 'save-status error';
      }
    }
  }, 700);
}
