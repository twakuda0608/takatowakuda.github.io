const PRESETS = {
  select_all: `SELECT * FROM students;`,
  where:      `SELECT name, score\nFROM students\nWHERE score >= 80;`,
  order:      `SELECT *\nFROM students\nORDER BY score DESC;`,
  aggregate:  `SELECT\n  COUNT(*)   AS 人数,\n  AVG(score) AS 平均点,\n  MAX(score) AS 最高点\nFROM students;`,
  groupby:    `SELECT age, COUNT(*) AS 人数\nFROM students\nGROUP BY age\nORDER BY age;`,
  insert:     `INSERT INTO students (name, age, score)\nVALUES ('Frank', 21, 88);\n\nSELECT * FROM students;`,
  update:     `UPDATE students\nSET score = 100\nWHERE name = 'Eve';\n\nSELECT * FROM students;`,
  delete:     `DELETE FROM students\nWHERE score < 50;\n\nSELECT * FROM students;`,
  join:       `SELECT students.name, clubs.club_name\nFROM students\nJOIN clubs ON students.id = clubs.student_id;`,
};

const INIT_SQL = `
CREATE TABLE students (
  id    INTEGER PRIMARY KEY,
  name  TEXT,
  age   INTEGER,
  score INTEGER
);
INSERT INTO students VALUES (1, 'Alice',   20, 90);
INSERT INTO students VALUES (2, 'Bob',     22, 75);
INSERT INTO students VALUES (3, 'Charlie', 21, 85);
INSERT INTO students VALUES (4, 'Diana',   20, 60);
INSERT INTO students VALUES (5, 'Eve',     23, 45);

CREATE TABLE clubs (
  id         INTEGER PRIMARY KEY,
  student_id INTEGER,
  club_name  TEXT
);
INSERT INTO clubs VALUES (1, 1, '数学クラブ');
INSERT INTO clubs VALUES (2, 2, 'サッカー');
INSERT INTO clubs VALUES (3, 1, 'プログラミング');
INSERT INTO clubs VALUES (4, 3, 'サッカー');
INSERT INTO clubs VALUES (5, 4, '音楽');
`;

let SQL = null;
let db  = null;

function createDb() {
  if (db) db.close();
  db = new SQL.Database();
  db.run(INIT_SQL);
}

function renderResults(stmts) {
  const resultArea  = document.getElementById('result-area');
  const resultLabel = document.getElementById('result-label');

  const selects = stmts.filter(s => s.columns && s.columns.length > 0);

  if (selects.length === 0) {
    resultLabel.textContent = '✓ 実行完了（返された行はありません）';
    resultArea.innerHTML = '';
    return;
  }

  const lastRows = selects[selects.length - 1].values.length;
  resultLabel.textContent = `結果：${lastRows} 行`;
  resultArea.innerHTML = '';

  selects.forEach(result => {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headerRow = document.createElement('tr');
    result.columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    result.values.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell === null ? 'NULL' : cell;
        if (cell === null) td.classList.add('null-cell');
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    resultArea.appendChild(table);
  });
}

function runQuery() {
  if (!db) return;
  const sql = document.getElementById('sql-input').value.trim();
  if (!sql) return;

  const resultArea  = document.getElementById('result-area');
  const resultLabel = document.getElementById('result-label');

  try {
    const results = db.exec(sql);
    renderResults(results);
    resultArea.classList.remove('error');
  } catch (e) {
    resultLabel.textContent = 'エラー';
    resultArea.innerHTML = `<div class="error-msg">${e.message}</div>`;
  }
}

async function main() {
  const runBtn   = document.getElementById('run-btn');
  const resetBtn = document.getElementById('reset-btn');
  const presetEl = document.getElementById('preset');
  const sqlInput = document.getElementById('sql-input');

  runBtn.textContent = '読み込み中...';
  runBtn.disabled = true;

  SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`
  });
  createDb();

  runBtn.textContent = '▶ 実行';
  runBtn.disabled = false;
  sqlInput.value = PRESETS.select_all;

  presetEl.addEventListener('change', () => {
    const val = presetEl.value;
    if (val && PRESETS[val]) sqlInput.value = PRESETS[val];
  });

  runBtn.addEventListener('click', runQuery);

  resetBtn.addEventListener('click', () => {
    createDb();
    document.getElementById('result-label').textContent = '結果がここに表示されます';
    document.getElementById('result-area').innerHTML = '';
  });

  sqlInput.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runQuery();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = sqlInput.selectionStart;
      const end = sqlInput.selectionEnd;
      sqlInput.value = sqlInput.value.substring(0, s) + '  ' + sqlInput.value.substring(end);
      sqlInput.selectionStart = sqlInput.selectionEnd = s + 2;
    }
  });
}

main();
