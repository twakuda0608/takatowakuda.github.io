// 入力ボックスと結果表示の要素を取得
const input = document.getElementById("num");
const result = document.getElementById("result");

// 入力内容が変わるたびに実行
input.addEventListener("input", () => {
  const value = Number(input.value);

  // 数字でない場合（空欄など）は表示をリセット
  if (isNaN(value)) {
    result.textContent = "結果：—";
  } else {
    const doubled = value * 2;
    result.textContent = `結果：${doubled}`;
  }
});
