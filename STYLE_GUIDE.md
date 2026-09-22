# スタイルガイド & サイト設計仕様書 (STYLE_GUIDE.md)

本リポジトリ (`takatowakuda.github.io`) の全体構成、デザインシステム、タイポグラフィ、コンポーネント仕様、および開発規約のまとめです。今後のタスク・機能追加・改修時はこのドキュメントに準拠してください。

---

## 1. サイトの基本方針 & セキュリティ

- **公開サイト（Public）前提**:
  - 本サイトは一般公開（GitHub Pages）されているため、**氏名・住所・電話番号・秘密鍵・個人メモ等の個人情報はコード・静的ファイル上に直接記述しない**。
  - 個人に紐づくデータ保存（内見メモ、月々の支払い、単語帳など）は Firebase Authentication（Google ログイン）を使用し、`auth.currentUser.uid` ごとに Firestore でアクセス制御・分離する。
- **軽量・Vanilla 構成**:
  - HTML / CSS / Vanilla JavaScript で完結させ、ビルドツール（Webpack, Vite 等）や過度な外部ライブラリを導入しない。
  - ライブラリが必要な場合は CDN（ES Modules または公式 CDN スクリプト）から直接読み込む。
- **文字コード**:
  - すべて UTF-8（BOM なし）。日本語ファイルが文字化けして見える場合は UTF-8 を明示して読み直す。

---

## 2. サイト構造 & 収録ツール一覧

### ポータル
- `/` (`index.html`, `index.css`): 個人ポータル。カード型グリッドによるツール一覧。

### ツール・アプリ一覧
| パス | ツール名 | 説明 | 主な技術 |
| :--- | :--- | :--- | :--- |
| `/mahjong/` | 麻雀ツール | ウマオカ精算、総合ポイント、戦績保存、逆転計算 | Firebase Firestore, Auth |
| `/mahjong-table/` | 麻雀テーブル | 卓用フルスクリーンデジタル表示、サイコロ、QR連携 | Firebase, Wake Lock, SVG |
| `/clip/` | クリップボード | デバイス間テキスト瞬時共有（3分TTL自動消去） | Firebase Firestore, QRコード |
| `/getsugaku/` | 月々の支払い | 家賃・保険・サブスク月額管理、支払元フィルタ | Firebase Firestore, Auth |
| `/naiken/` | 内見チェック | 物件内見チェックリスト、採点、写真、回線確認 | Firebase Firestore, Auth |
| `/flashcards/` | 単語カード | 単語帳の作成、めくり学習、テストモード | Firebase Firestore, Auth |
| `/buzzer/` | 早押しボタン | PC親機・スマホ子機参加型の早押しクイズ | Firebase Realtime/Firestore, Audio, QR |
| `/currency/` | 為替変換 | 複数通貨の同時為替レート計算 | Exchange API, flag-icons |
| `/dateCalculator/` | 日付計算 | 基準日からの経過日数、期間計算 | Vanilla JS |
| `/kanji/` | 漢字の学習年 | 漢字の習得学年チェッカー（小学校1〜6年・中高） | 独自データ (`kanji.txt`) |
| `/remaining-time/` | 残り時間計算 | 目標日時までのパタパタ時計風カウントダウン | CSS 3D Transforms, Vanilla JS |
| `/scaleMeasure/` | 図面スケール計測 | 間取り図・図面の縮尺キャリブレーションと実寸計測 | HTML Canvas API |
| `/shxtUI/` | クソUI選手権 | あえて使いづらいUIコレクション | Leaflet, jsQR, Vanilla JS |
| `/sql/` | SQLプレイグラウンド | ブラウザ上で動くSQLite学習環境 | sql.js (WebAssembly SQLite) |
| `/test/` | 練習用プレイグラウンド | 各種HTML/JS UIコンポーネントの動作実験場 | Vanilla JS |
| `/timer/` | タイマー | カレンダー連動・時給/経過時間収益計算 | Google Calendar API |
| `/learn/` | 学習ポータル | プログラミング・IT知識を図解するインタラクティブ集 | SVG / Canvas / DOM アニメーション |
| `/fll2025/` | FLL 2025 | ロボットゲームのミッション点数計算 & タイマー | Vanilla JS |

---

## 3. デザインシステム & デザイントークン

共通スタイルは [`common.css`](file:///C:/takatowakuda.github.io/common.css) に集約されています。

### 3.1 CSS 変数（トークン一覧）
```css
:root {
  --brand:        #0078d7;  /* プライマリブランドブルー */
  --brand-dark:   #005bb5;  /* ホバー・アクセント用濃ブルー */
  --brand-darker: #003f88;  /* アクティブ用ダークブルー */
  --border:       #ddd;     /* 標準ボーダー */
  --border-soft:  #e4e4e4;  /* 柔らかい境界線・カード枠 */
  --muted-color:  #64748b;  /* 補助テキスト（Slate） */
  --shadow:       0 4px 6px -1px rgba(0,0,0,.10), 0 2px 4px -1px rgba(0,0,0,.06);
  --radius:       12px;     /* 基本角丸 */
  --font:         'Noto Sans JP', 'Helvetica Neue', system-ui, -apple-system,
                  "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
}
```

### 3.2 カラーパレット
| トークン / 用途 | カラーコード | 備考 |
| :--- | :--- | :--- |
| ブランドカラー (`--brand`) | `#0078d7` | 主要ボタン、見出し、アクティブタブ |
| ブランド濃色 (`--brand-dark`) | `#005bb5` | ボタンホバー時 |
| テキスト基本色 | `#1a202c` / `#111` | 視認性の高いダークチャコール |
| 補助テキスト (`--muted-color`) | `#64748b` | 補足説明、ラベル、日時 |
| 背景グラデーション (サブページ) | `radial-gradient(circle at top left, #ffffff, #e2e8f0)` | `html` タグに適用 |
| トップページ背景 | `#fafafa` | クリーンなオフホワイト |
| カード背景 | `#ffffff` | 白背景カード |
| 成功 / アクセント | `#16a34a` (Green) | 完了ステータス・正解表示など |
| 危険 / 削除 | `#ef4444` (Red) | 削除ボタン・エラー通知など |

### 3.3 タイポグラフィ & フォント
- **フォントスタック**:
  ```css
  font-family: 'Noto Sans JP', 'Helvetica Neue', system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
  ```
- **見出し (`h1`)**:
  - `font-size: 1.4rem;`
  - `color: var(--brand);`
  - `letter-spacing: 2px;`
  - `text-shadow: 1px 1px 3px rgba(0,0,0,.10);`
- **サブページヘッダータイトル (`.page-header-title`)**:
  - `font-size: 1rem;`
  - `font-weight: 700;`
  - `color: #1a202c;`
- **セクション見出し・ラベル (`.section-label`, `.eyebrow`)**:
  - `font-size: 0.72rem ~ 0.76rem;`
  - `font-weight: 700 ~ 800;`
  - `text-transform: uppercase;`
  - `letter-spacing: 1.2px ~ 1.5px;`
  - `color: #aaa` または `var(--muted-color);`

---

## 4. コンポーネント規約

### 4.1 ページ全体のレイアウト
サブページは以下のラッパー階層を標準とします。
```html
<body>
  <!-- 戻るボタン (common.js により自動挿入されるか、静的記述) -->
  <!-- ヘッダーバー -->
  <header class="page-header">
    <span class="page-header-title">ページ名</span>
    <!-- 認証がある場合 -->
    <div class="page-header-auth" id="auth-area">
      <img id="user-avatar" class="user-avatar" src="" alt="">
      <span id="user-name" class="user-name"></span>
      <button id="logout-btn" class="logout-btn">ログアウト</button>
    </div>
  </header>

  <!-- コンテンツラッパー -->
  <div class="wrap"> <!-- または class="app-shell" -->
    <div class="page-card">
      <!-- ページ固有のUI -->
    </div>
  </div>
</body>
```

- **`.wrap` / `.app-shell`**:
  - 最大幅: `max-width: 600px ~ 800px`（ダッシュボード系は `960px`）
  - マージン: `margin: 0 auto;`
  - パディング: `padding: 20px 16px 40px;`

### 4.2 共通ヘッダー (`.page-header`)
- `position: sticky; top: 0; z-index: 100;`
- `height: 52px;`
- `background: rgba(255,255,255,0.95); backdrop-filter: saturate(1.2) blur(6px);`
- `border-bottom: 1px solid var(--border-soft);`
- `padding: 0 16px 0 68px;`（左側の戻る FAB 用に余白を確保）

### 4.3 戻るボタン (`.back-fab`)
- 左上に固定表示される円形ボタン。
- `position: fixed; left: 16px; top: 6px; z-index: 1000; width: 40px; height: 40px; border-radius: 999px;`
- 背景: `#ffffffcc; backdrop-filter: saturate(1.2) blur(4px); border: 1px solid #e4e4e4;`
- `common.js` が自動的に検知して挿入する（`/` や一部除外パスを除く）。

### 4.4 白カードコンテナ (`.page-card`)
- `background: #ffffff;`
- `border: 1px solid var(--border-soft);`
- `border-radius: 16px;`（または `12px`）
- `padding: 24px;`
- `box-shadow: var(--shadow);`

### 4.5 ボタン設計 & 文言ルール
- **【重要ルール】ボタン文言は必ず体言止めにする**:
  - ○：`保存`, `追加`, `削除`, `実行`, `入室`, `リセット`, `設定`, `コピー`, `ログアウト`
  - ×：`保存する`, `追加してください`, `データを消去する`
- **操作名は名詞句を優先**:
  - 短く簡潔にする。
- **ボタンバリエーション**:
  - **プライマリ (`.primary-btn`, `.btn-primary`)**:
    - 背景: `var(--brand, #0078d7)`, 文字色: `#ffffff`
    - 角丸: `8px`, ホバー時に `background: #005bb5; transform: translateY(-1px);`
  - **セカンダリ (`.secondary-btn`)**:
    - 背景: `#ffffff`, 境界線: `1px solid var(--border)`, 文字色: `var(--text)`
  - **Google ログインボタン (`.google-btn`)**:
    - 背景: `#ffffff`, 境界線: `1.5px solid #dadce0`, 4色GマークSVG入り

### 4.6 オートコンプリート (`makeAutocomplete`)
- `common.js` に共通関数 `makeAutocomplete(inputElement, getCandidateArray)` が実装済み。
- ドロップダウンクラス名: `.ac-list`, `.ac-item`, `.ac-active`

---

## 5. レスポンシブ対応基準

- **ブレークポイント**:
  - モバイル: `@media (max-width: 480px)` または `@media (max-width: 600px)`
- **モバイル表示時の必須調整**:
  - `.container` / `.wrap` のパディングを縮小（例: `padding: 16px 12px`）
  - グリッド列を `1fr` または `1fr 1fr` に折り返す
  - フォントサイズを 1 段階下げる（タイトル `1.4rem` 等）
  - 画面からはみ出るテーブルやツールバーには `overflow-x: auto; -webkit-overflow-scrolling: touch;` を設定
  - タップターゲット（ボタン・入力欄）は最小 `40px` 以上の高さを維持する

---

## 6. 改修・新規追加時のチェックリスト

1. [ ] **UTF-8 エンコーディング**: 文字化けがないか確認。
2. [ ] **体言止め**: 新規追加したボタンやアクションが体言止め（名詞句）になっているか確認。
3. [ ] **共通スタイル準拠**: `common.css` の CSS 変数・カードスタイル・ヘッダー構造を活用しているか確認。
4. [ ] **無駄な依存の排除**: 不要な NPM パッケージやビルド設定を追加していないか確認。
5. [ ] **個人情報の保護**: 個人情報や秘密情報が直書きされていないか確認。
6. [ ] **スマホ表示検証**: 入力欄・ボタン・グリッドがスマホ幅で崩れていないか確認。
