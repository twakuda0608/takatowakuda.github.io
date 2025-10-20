// ====== 共通：タブ切り替え ======
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tabbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabbtn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // ====== タブ1：ウマ/オカ精算 ======
  const el = id => document.getElementById(id);
  const init1 = el('init1'), oka1 = el('oka1'), uma1 = el('uma1'), rate1 = el('rate1');
  const s1_1 = el('s1_1'), s2_1 = el('s2_1'), s3_1 = el('s3_1'), s4_1 = el('s4_1');
  const r1_1 = el('r1_1'), r2_1 = el('r2_1'), r3_1 = el('r3_1'), r4_1 = el('r4_1');

  function thousandRoundPt1(realScore){
    // realScore は実点（例: 31000）
    return Math.round((Number(realScore) - 100) / 1000);
  }
  function parseUma1(val){
    const v = Number(val);
    const x = Math.round(v/100);
    const y = v - x*100;
    return {x, y};
  }
  function computeTab1(){
    const I = Number(init1.value || 0);   // 百点単位入力
    const O = Number(oka1.value || 0);    // 百点単位入力
    const R = Number(rate1.value || 0);
    const {x:UX, y:UY} = parseUma1(uma1.value);

    const S2 = Number(s2_1.value || 0);
    const S3 = Number(s3_1.value || 0);
    const S4 = Number(s4_1.value || 0);

    // 1位（百点単位で表示）
    const S1 = I*4 - S2 - S3 - S4;
    s1_1.value = S1;

    // 実点（×100）に変換
    const RS2 = S2 * 100, RS3 = S3 * 100, RS4 = S4 * 100;
    const ROka = O * 100; // 実点のオカ

    // pt計算
    const okaPt = ROka / 1000; // (= O/10)
    const p2 = thousandRoundPt1(RS2) + UX - okaPt;
    const p3 = thousandRoundPt1(RS3) - UX - okaPt;
    const p4 = thousandRoundPt1(RS4) - UY - okaPt;
    const p1 = -(p2 + p3 + p4);

    function line(pt){
      const money = Math.round(pt * R);
      return `${pt}pt × ${R} = ${money}`;
    }

    r1_1.textContent = line(p1);
    r2_1.textContent = line(p2);
    r3_1.textContent = line(p3);
    r4_1.textContent = line(p4);
  }
  ['input','change'].forEach(ev => {
    [init1,oka1,uma1,rate1,s2_1,s3_1,s4_1].forEach(e => e.addEventListener(ev, computeTab1));
  });
  computeTab1();

  // ====== タブ2：総合ポイント精算 ======
  const rate2 = el('rate2');
  const n1_2 = el('n1_2'), n2_2 = el('n2_2'), n3_2 = el('n3_2'), n4_2 = el('n4_2');
  const p1_2 = el('p1_2'), p2_2 = el('p2_2'), p3_2 = el('p3_2'), p4_2 = el('p4_2');
  const resultList2 = el('resultList2');
  const check2 = el('check2');

  function settle2(names, amounts) {
    // amounts: 正=受け取り, 負=支払い（円）
    const creditors = [], debtors = [];
    names.forEach((nm, i) => {
      const a = Math.round(amounts[i]);
      if (a > 0) creditors.push({ name: nm, amt: a });
      else if (a < 0) debtors.push({ name: nm, amt: -a });
    });

    // 金額の大きい順で優先マッチング
    creditors.sort((a, b) => b.amt - a.amt);
    debtors.sort((a, b) => b.amt - a.amt);

    const res = [];
    let ci = 0, di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const pay = Math.min(creditors[ci].amt, debtors[di].amt);
      res.push({ from: debtors[di].name, to: creditors[ci].name, amount: pay });
      creditors[ci].amt -= pay;
      debtors[di].amt -= pay;
      if (creditors[ci].amt === 0) ci++;
      if (debtors[di].amt === 0) di++;
      // 保守的な並び替え
      if (ci+1 < creditors.length && creditors[ci]?.amt < creditors[ci+1]?.amt) creditors.sort((a,b)=>b.amt-a.amt);
      if (di+1 < debtors.length && debtors[di]?.amt < debtors[di+1]?.amt) debtors.sort((a,b)=>b.amt-a.amt);
    }
    return res;
  }

  function computeTab2(){
    const R = Number(rate2.value);
    const names = [n1_2.value||'1', n2_2.value||'2', n3_2.value||'3', n4_2.value||'4'];
    const pts = [p1_2.value, p2_2.value, p3_2.value, p4_2.value].map(Number);
    const amounts = pts.map(pt => pt * R);

    const sum = amounts.reduce((a,b)=>a+b,0);
    check2.textContent = `チェック: 合計 = ${sum} （0ならOK）`;

    resultList2.innerHTML = '';
    if (sum === 0) {
      const transfers = settle2(names, amounts);
      transfers.forEach(t=>{
        const li=document.createElement('li');
        li.textContent = `${t.from} → ${t.to}: ${t.amount}円`;
        resultList2.appendChild(li);
      });
    }
  }
  ['input','change'].forEach(ev=>{
    [rate2,n1_2,n2_2,n3_2,n4_2,p1_2,p2_2,p3_2,p4_2].forEach(e=>e.addEventListener(ev,computeTab2));
  });
  computeTab2();
});
