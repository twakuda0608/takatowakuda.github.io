"use strict";

// DOM の構築が終わったらメイン処理を開始
document.addEventListener("DOMContentLoaded", () => {
  main().catch((err) => {
    console.error(err);
  });
});

async function main() {

  // -----------------------------
  // 1. kanji.txt から作る漢字→学年マップ
  // -----------------------------
  const gradeMap = {};

  const OTHER_LABEL = "小・中学校で習わない漢字";

  async function loadKanjiFile() {
    try {
      // index.html と同じ階層に kanji.txt を置く前提
      const response = await fetch("kanji.txt");

      if (!response.ok) {
        throw new Error("HTTP status " + response.status);
      }

      const text = await response.text();
      const lines = text.split(/\r?\n/);

      // ★ここを「行ごとに学年を割り当てる」ように修正
      lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // 1行目 → 1年生, 2行目 → 2年生 … 6行目 → 6年生, それ以降 → 7(中学とか)
        const grade = lineIndex + 1 <= 6 ? lineIndex + 1 : 7;

        for (const ch of trimmed) {
          // 改行や全角スペースが混じっても一応ガード
          if (!/[\u4E00-\u9FFF]/.test(ch)) continue;
          gradeMap[ch] = grade;
        }
      });

      console.log("kanji.txt loaded. entries:", Object.keys(gradeMap).length);
    } catch (e) {
      console.error("kanji.txt の読み込みに失敗しました", e);
      alert("kanji.txt の読み込みに失敗しました。学年判定が正しく行えない可能性があります。");
    }
  }

  // kanji.txt の読み込みが終わるまで待つ
  await loadKanjiFile();

  // -----------------------------
  // 2. 学年表示用のラベル関数
  // -----------------------------
  const gradeLabel = (g) => {
    if (!g) return "未登録";
    if (g >= 1 && g <= 6) return `小学校${g}年`;
    if (g === 7) return "中学校以降";
    return "未登録";
  };

  // -----------------------------
  // 3. DOM 要素の取得
  // -----------------------------
  const tabButtons = document.querySelectorAll(".tabbtn");
  const tabs = document.querySelectorAll(".tab");

  const inputText = document.getElementById("inputText");
  const resultBody = document.getElementById("resultBody");
  const emptyMessage = document.getElementById("emptyMessage");

  // CJK 漢字の判定用（ざっくり）
  const kanjiRegex = /[\u4E00-\u9FFF]/;

  // -----------------------------
  // 4. タブ切り替え（タブがないなら何もしない）
  // -----------------------------
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.tab;

      tabButtons.forEach((b) => b.classList.remove("active"));
      tabs.forEach((tab) => tab.classList.remove("active"));

      btn.classList.add("active");
      const targetTab = document.getElementById(targetId);
      if (targetTab) targetTab.classList.add("active");
    });
  });

  // -----------------------------
  // 5. テキスト解析
  //    ※ 同じ漢字は自動で1行にまとめる
  // -----------------------------
  function analyzeText() {
    const text = inputText ? inputText.value || "" : "";
    const rows = [];
    const seen = new Set(); // 自動的に重複排除

    for (const ch of text) {
      // 漢字以外は無視
      if (!kanjiRegex.test(ch)) continue;

      // 既に出てきた漢字ならスキップ
      if (seen.has(ch)) continue;
      seen.add(ch);

      const g = gradeMap[ch]; // undefined の場合もある
      const known = typeof g === "number";

      rows.push({
        char: ch,
        grade: g ?? null,
        known
      });
    }

    renderResult(rows);
  }

  // -----------------------------
  // 6. 判定結果の描画
  // -----------------------------
  function renderResult(rows) {
    if (!resultBody) return;

    resultBody.innerHTML = "";

    if (!rows || rows.length === 0) {
      if (emptyMessage) emptyMessage.style.display = "block";
      return;
    }

    if (emptyMessage) emptyMessage.style.display = "none";

    const frag = document.createDocumentFragment();

    rows.forEach((row) => {
      const tr = document.createElement("tr");

      const tdChar = document.createElement("td");
      tdChar.textContent = row.char;
      tr.appendChild(tdChar);

      const tdGrade = document.createElement("td");
      const span = document.createElement("span");
      span.className = "grade-badge";

      if (row.known) {
      // 学年が分かっている → grade-1 ～ grade-7 の色を使う
      span.classList.add("grade-" + row.grade);
      span.textContent = gradeLabel(row.grade);
      } else {
      // マップにない漢字 → 「未登録」用の別色
      span.classList.add("grade-other");
      span.textContent = "未登録";
      }
      tdGrade.appendChild(span);
      tr.appendChild(tdGrade);

      const tdNote = document.createElement("td");
      tdNote.textContent = row.known
        ? "教育漢字として登録されています。"
        : OTHER_LABEL;
      tr.appendChild(tdNote);

      frag.appendChild(tr);
    });

    resultBody.appendChild(frag);
  }

  // -----------------------------
  // 7. イベント登録
  // -----------------------------
  if (inputText) {
    inputText.addEventListener("input", analyzeText);
  }

  // 初期描画
  if (!inputText || inputText.value.trim() === "") {
  // テキストが空なら「勉強」を仮表示
    const defaultText = "涌田貴斗";
    const rows = [];
    const seen = new Set();

    for (const ch of defaultText) {
        if (!/[\u4E00-\u9FFF]/.test(ch)) continue;
        if (seen.has(ch)) continue;
        seen.add(ch);

        const g = gradeMap[ch];
        const known = typeof g === "number";

        rows.push({
        char: ch,
        grade: g ?? null,
        known
        });
    }

    renderResult(rows);
    } else {
    analyzeText();
    }
}