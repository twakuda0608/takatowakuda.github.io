// noEquip アイコンを載せるミッション
const NO_EQUIP_MISSIONS = new Set([
  "M01","M04","M05","M09","M11","M12","M13","M14"
]);

const missions = [
  {
    code: "CHECK",
    title: "装備の点検",
    subtitle: "ロボットと全ての装備が発進エリアに完全にイン & 高さ305mm以下",
    parts: [{
      key: "pass",
      label: "点検",
      options: [{label:"0",value:0},{label:"20",value:20}],
      defaultValue: 20
    }]
  },
  {
    code: "M01",
    title: "ミッション01：表面清掃",
    subtitle: "土層（各10点）＋発掘ブラシ（10点）",
    parts: [
      {
        key:"soil",
        label:"土層（完全に取り除かれ，マットに接触）各10点：0〜2個",
        options:[{label:"0",value:0},{label:"10",value:10},{label:"20",value:20}],
        defaultValue:0
      },
      {
        key:"brush",
        label:"発掘ブラシが発掘現場に接触していない：10点",
        options:[{label:"0",value:0},{label:"10",value:10}],
        defaultValue:0
      }
    ]
  },
  {
    code: "M02",
    title: "ミッション02：地図の露出",
    subtitle: "表土のセクション（各10点）",
    parts: [{
      key:"topsoil",
      label:"表土のセクションが完全に取り除かれている：各10点（0〜3個）",
      options:[{label:"0",value:0},{label:"10",value:10},{label:"20",value:20},{label:"30",value:30}],
      defaultValue:0
    }]
  },
  {
    code: "M03",
    title: "ミッション03：鉱坑の探査",
    subtitle: "自チームのトロッコ：30点 / 追加点：+10点",
    parts: [
      {
        key:"cart30",
        label:"自チームのトロッコが相手チームのフィールド上にある：30点",
        options:[{label:"0",value:0},{label:"30",value:30}],
        defaultValue:0
      },
      {
        key:"bonus10",
        label:"追加点：相手チームのトロッコが自チームのフィールド上にある：+10点（相手がいる場合）",
        options:[{label:"0",value:0},{label:"+10",value:10}],
        defaultValue:0
      }
    ]
  },
  {
    code: "M04",
    title: "ミッション04：慎重な回収",
    subtitle: "貴重な遺物 / 支柱",
    parts: [
      {
        key:"artifact",
        label:"貴重な遺物が鉱山に接触していない：30点",
        options:[{label:"0",value:0},{label:"30",value:30}],
        defaultValue:0
      },
      {
        key:"pillars",
        label:"両方の支柱が立っている：10点",
        options:[{label:"0",value:0},{label:"10",value:10}],
        defaultValue:10
      }
    ]
  },
  {
    code:"M05",
    title:"ミッション05：誰が住んでいた？",
    subtitle:"床がまっすぐ上を向いている：30点",
    parts:[{
      key:"main",
      label:"達成",
      options:[{label:"0",value:0},{label:"30",value:30}],
      defaultValue:0
    }]
  },
  {
    code:"M06",
    title:"ミッション06：鍛冶場",
    subtitle:"達成度に応じて各10点（0〜30点）",
    parts:[{
      key:"main",
      label:"各10点（最大30点）",
      options:[{label:"0",value:0},{label:"10",value:10},{label:"20",value:20},{label:"30",value:30}],
      defaultValue:0
    }]
  },
  {
    code:"M07",
    title:"ミッション07：力仕事",
    subtitle:"石臼が台座に接触していない：30点",
    parts:[{
      key:"main",
      label:"達成",
      options:[{label:"0",value:0},{label:"30",value:30}],
      defaultValue:0
    }]
  },
  {
    code:"M08",
    title:"ミッション08：サイロ",
    subtitle:"サイロ：最大3つまで（各10点）",
    parts:[{
      key:"silo",
      label:"各10点（0〜3つ）",
      options:[{label:"0",value:0},{label:"10",value:10},{label:"20",value:20},{label:"30",value:30}],
      defaultValue:0
    }]
  },
  {
    code:"M09",
    title:"ミッション09：何を売っていた？",
    subtitle:"屋根 / 交易品",
    parts:[
      {
        key:"roof",
        label:"屋根が完全に持ち上がっている：20点",
        options:[{label:"0",value:0},{label:"20",value:20}],
        defaultValue:0
      },
      {
        key:"goods",
        label:"市場の交易品が持ち上がっている：10点",
        options:[{label:"0",value:0},{label:"10",value:10}],
        defaultValue:0
      }
    ]
  },
  {
    code:"M10",
    title:"ミッション10：はかり",
    subtitle:"はかりの傾き / 皿",
    parts:[
      {
        key:"tilt",
        label:"はかりが傾き，マットに接触している：20点",
        options:[{label:"0",value:0},{label:"20",value:20}],
        defaultValue:0
      },
      {
        key:"pan",
        label:"はかりの皿が完全に取り除かれている：10点",
        options:[{label:"0",value:0},{label:"10",value:10}],
        defaultValue:0
      }
    ]
  },
  {
    code:"M11",
    title:"ミッション11：港の遺物",
    subtitle:"遺物 / 追加点（旗）",
    parts:[
      {
        key:"artifact",
        label:"遺物が地表の上に持ち上がっている：20点",
        options:[{label:"0",value:0},{label:"20",value:20}],
        defaultValue:0
      },
      {
        key:"bonus",
        label:"追加点：クレーンの旗が少しでも下がっている：+10点",
        options:[{label:"0",value:0},{label:"+10",value:10}],
        defaultValue:0
      }
    ]
  },
  {
    code:"M12",
    title:"ミッション12：船の救出",
    subtitle:"船 / 砂",
    parts:[
      {
        key:"ship",
        label:"船が完全に持ち上がっている：20点",
        options:[{label:"0",value:0},{label:"20",value:20}],
        defaultValue:0
      },
      {
        key:"sand",
        label:"砂が完全に取り除かれている：10点",
        options:[{label:"0",value:0},{label:"10",value:10}],
        defaultValue:0
      }
    ]
  },
  {
    code:"M13",
    title:"ミッション13：像の復元",
    subtitle:"像が完全に持ち上がっている：30点",
    parts:[{
      key:"main",
      label:"達成",
      options:[{label:"0",value:0},{label:"30",value:30}],
      defaultValue:0
    }]
  },
  {
    code:"M14",
    title:"ミッション14：フォーラム",
    subtitle:"フォーラムに置いた対象物：すべて各5点（最大7個）",
    parts:[{
      key:"items",
      label:"各5点（0〜7個）",
      options:[
        {label:"0個: 0",value:0},{label:"1個: 5",value:5},{label:"2個: 10",value:10},{label:"3個: 15",value:15},
        {label:"4個: 20",value:20},{label:"5個: 25",value:25},{label:"6個: 30",value:30},{label:"7個: 35",value:35}
      ],
      defaultValue:0
    }]
  },
  {
    code:"M15",
    title:"ミッション15：発掘現場のマーキング",
    subtitle:"マーキング：各10点（最大3つ）",
    parts:[{
      key:"marks",
      label:"各10点（0〜3つ）",
      options:[
        {label:"0",value:0},{label:"10",value:10},{label:"20",value:20},{label:"30",value:30}
      ],
      defaultValue:0
    }]
  },
  {
    code:"PRECISION",
    title:"精密トークン",
    subtitle:"競技終了時に残っている数に応じた得点",
    parts:[{
      key:"left",
      label:"残数",
      options:[
        {label:"0個: 0",value:0},{label:"1個: 10",value:10},{label:"2個: 15",value:15},
        {label:"3個: 25",value:25},{label:"4個: 35",value:35},{label:"5個: 50",value:50},{label:"6個: 50",value:50}
      ],
      defaultValue:50
    }]
  }
];

const missionList = document.getElementById("missionList");

function renderScoreUI() {
  missions.forEach((m) => {
    const card = document.createElement("section");
    card.className = "card";

    const top = document.createElement("div");
    top.className = "row-top";

    const left = document.createElement("div");

    const t = document.createElement("div");
    t.className = "title";
    t.textContent = m.title;

    const sub = document.createElement("div");
    sub.className = "subtitle";
    sub.textContent = m.subtitle || "";

    left.appendChild(t);
    left.appendChild(sub);

    const codeWrap = document.createElement("div");
    codeWrap.className = "code-wrap";

    if (NO_EQUIP_MISSIONS.has(m.code)) {
      const icon = document.createElement("img");
      icon.src = "noEquip.png";
      icon.alt = "no equip icon";
      icon.className = "code-icon";
      codeWrap.appendChild(icon);
    }

    const code = document.createElement("div");
    code.className = "code";
    code.textContent = m.code;
    codeWrap.appendChild(code);

    top.appendChild(left);
    top.appendChild(codeWrap);
    card.appendChild(top);

    (m.parts || []).forEach((p) => {
      const part = document.createElement("div");
      part.className = "part";

      const pl = document.createElement("div");
      pl.className = "part-label";
      pl.textContent = p.label || "";

      const options = document.createElement("div");
      options.className = "options";

      const groupName = `${m.code}__${p.key}`;

      p.options.forEach((opt, idx) => {
        const id = `${groupName}_${idx}`;

        const input = document.createElement("input");
        input.type = "radio";
        input.name = groupName;
        input.id = id;
        input.value = String(opt.value);

        const label = document.createElement("label");
        label.className = "btn";
        label.setAttribute("for", id);
        label.textContent = opt.label;

        const def = (p.defaultValue != null) ? p.defaultValue : null;
        if (def != null) {
          if (opt.value === def) input.checked = true;
        } else if (idx === 0) {
          input.checked = true;
        }

        options.appendChild(input);
        options.appendChild(label);
      });

      part.appendChild(pl);
      part.appendChild(options);
      card.appendChild(part);
    });

    missionList.appendChild(card);
  });
}

function calcTotal() {
  let total = 0;
  const checked = document.querySelectorAll('input[type="radio"]:checked');
  checked.forEach(r => total += Number(r.value || "0"));
  document.getElementById("totalScore").textContent = String(total);
}

function resetToDefaults() {
  missions.forEach(m => {
    (m.parts || []).forEach(p => {
      const groupName = `${m.code}__${p.key}`;
      const radios = document.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
      if (!radios.length) return;

      const def = (p.defaultValue != null) ? p.defaultValue : Number(radios[0].value || "0");
      let set = false;

      radios.forEach(r => {
        if (Number(r.value) === Number(def)) {
          r.checked = true;
          set = true;
        }
      });

      if (!set) radios[0].checked = true;
    });
  });
  calcTotal();
}

// リセット確認UI
const resetBtn = document.getElementById("resetBtn");
const resetConfirm = document.getElementById("resetConfirm");
const resetDo = document.getElementById("resetDo");
const resetCancel = document.getElementById("resetCancel");

function showConfirm(show) {
  resetConfirm.style.display = show ? "inline-flex" : "none";
  resetBtn.style.display = show ? "none" : "inline-flex";
}

resetBtn.addEventListener("click", () => showConfirm(true));
resetCancel.addEventListener("click", () => showConfirm(false));
resetDo.addEventListener("click", () => {
  resetToDefaults();
  showConfirm(false);
});

document.addEventListener("click", (e) => {
  if (resetConfirm.style.display === "none") return;
  const area = document.getElementById("resetArea");
  if (!area.contains(e.target)) showConfirm(false);
});

// タブ切り替え
const tabs = document.querySelectorAll(".tab");
const views = {
  scoreView: document.getElementById("scoreView"),
  timerView: document.getElementById("timerView")
};
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.target;
    Object.keys(views).forEach(id => {
      views[id].classList.toggle("hidden", id !== target);
    });
  });
});

// ===== Timer ring logic =====
const TOTAL_SECONDS = 150; // 2:30
let remainingSeconds = TOTAL_SECONDS;
let timerId = null;
let running = false;

const timeDisplay = document.getElementById("timeDisplay");
const ringProgress = document.getElementById("ringProgress");
const timerStartStop = document.getElementById("timerStartStop");
const timerReset = document.getElementById("timerReset");

const R = 96;
const C = 2 * Math.PI * R;

ringProgress.style.strokeDasharray = `${C} ${C}`;
ringProgress.style.strokeDashoffset = `0`;

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function setRingByRatio(ratio) {
  const offset = C * (1 - ratio);
  ringProgress.style.strokeDashoffset = String(offset);
}

function updateTimerUI() {
  timeDisplay.textContent = formatTime(remainingSeconds);
  timeDisplay.classList.remove("warning","danger");
  ringProgress.style.stroke = getComputedStyle(document.documentElement).getPropertyValue("--blue");

  if (remainingSeconds <= 30 && remainingSeconds > 10) {
    timeDisplay.classList.add("warning");
    ringProgress.style.stroke = "#f97316";
  } else if (remainingSeconds <= 10) {
    timeDisplay.classList.add("danger");
    ringProgress.style.stroke = "#dc2626";
  }

  const ratio = remainingSeconds / TOTAL_SECONDS;
  setRingByRatio(Math.max(0, Math.min(1, ratio)));
}

function startTimer() {
  if (running) return;
  if (remainingSeconds <= 0) remainingSeconds = TOTAL_SECONDS;
  running = true;
  timerStartStop.textContent = "一時停止";
  timerId = setInterval(() => {
    remainingSeconds -= 1;
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      stopTimer();
    }
    updateTimerUI();
  }, 1000);
}

function stopTimer() {
  if (timerId != null) {
    clearInterval(timerId);
    timerId = null;
  }
  running = false;
  timerStartStop.textContent = "スタート";
}

function resetTimer() {
  stopTimer();
  remainingSeconds = TOTAL_SECONDS;
  updateTimerUI();
}

timerStartStop.addEventListener("click", () => {
  if (running) stopTimer();
  else startTimer();
});
timerReset.addEventListener("click", resetTimer);

// 初期化
renderScoreUI();
calcTotal();
document.addEventListener("change", calcTotal);
updateTimerUI();
