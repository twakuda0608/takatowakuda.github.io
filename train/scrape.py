#!/usr/bin/env python3
"""
西大宮駅 列車時刻表スクレイピングスクリプト

【方針】
  Yahoo!路線情報は「指定時刻以降の最初の1本」しか返さない。
  各列車について2回検索する:
    1. 西大宮 → 次駅  : 西大宮出発・次駅到着を確認
    2. 前駅  → 西大宮 : 前駅出発・西大宮到着を確認
  西大宮ではすれ違い待ちが発生するため arr_nishiomiya ≠ dep_nishiomiya になる場合がある。

【サーバー負荷対策】
  ・リクエスト間に 2〜4 秒のランダム待機（jitter 付き）
  ・requests.Session でコネクション使い回し
  ・HTTP エラー / タイムアウト時は指数バックオフ付きリトライ（最大 2 回）
  ・Step 2 の検索起点は実測区間所要時間 + 1分の固定オフセット

【使い方】
  pip install requests beautifulsoup4
  python scrape.py

【出力】
  timetable.json  各列車エントリ: {dep_before, arr_nishiomiya, dep_nishiomiya, arr_after}
"""

import re
import json
import time
import random
import datetime
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ja,en;q=0.9",
    "Referer": "https://transit.yahoo.co.jp/",
}
BASE_URL = "https://transit.yahoo.co.jp/search/result"

_session = requests.Session()
_session.headers.update(HEADERS)


# ──────────────────────────────────────────────────────────────
# ユーティリティ
# ──────────────────────────────────────────────────────────────


def T(h: int, m: int) -> int:
    return h * 60 + m


def fmt(t: int | None) -> str:
    return f"{t // 60 % 24:02d}:{t % 60:02d}" if t is not None else "--:--"


def parse_time(s: str) -> int:
    h, m = map(int, s.split(":"))
    return h * 60 + m


def next_date(weekday: bool) -> datetime.date:
    d = datetime.date.today()
    while True:
        if (d.weekday() < 5) == weekday:
            return d
        d += datetime.timedelta(days=1)


def polite_sleep():
    time.sleep(random.uniform(2.0, 4.0))


# ──────────────────────────────────────────────────────────────
# スクレイピング
# ──────────────────────────────────────────────────────────────


def _get(url: str, max_retries: int = 2) -> requests.Response | None:
    for attempt in range(max_retries + 1):
        try:
            r = _session.get(url, timeout=10)
            r.raise_for_status()
            return r
        except requests.RequestException as e:
            if attempt == max_retries:
                print(f"      ✗ HTTP エラー: {e}")
                return None
            wait = 5.0 * (2**attempt) + random.uniform(0, 2)
            print(f"      ⚠ リトライ {attempt + 1}/{max_retries}（{wait:.1f}s 後）")
            time.sleep(wait)
    return None


def _parse_dep_arr(
    text: str, from_st: str, to_st: str
) -> tuple[str | None, str | None]:
    # パターン1: "HH:MM 発" / "HH:MM 着"
    deps = re.findall(r"(\d{1,2}:\d{2})\s*発", text)
    arrs = re.findall(r"(\d{1,2}:\d{2})\s*着", text)
    if deps and arrs:
        return deps[0], arrs[0]

    # パターン2: "HH:MM（駅名）"
    dep, arr = None, None
    for t_str, sta in re.findall(r"(\d{1,2}:\d{2})[^\d]*?（([^）]+)）", text):
        if from_st in sta and dep is None:
            dep = t_str
        elif to_st in sta and dep and arr is None:
            arr = t_str
    return dep, arr


def fetch_route(
    from_st: str, to_st: str, date: datetime.date, t: int
) -> tuple[str | None, str | None]:
    """指定時刻以降の1本を取得して (発時刻 HH:MM, 着時刻 HH:MM) を返す"""
    h, m = t // 60 % 24, t % 60
    url = (
        f"{BASE_URL}?from={from_st}&to={to_st}"
        f"&y={date.year}&m={date.month}&d={date.day}"
        f"&hh={h:02d}&m1={m // 10}&m2={m % 10}"
        f"&type=1&ticket=ic&s=0&al=1&shin=1&ex=1&hb=1&lb=1&sr=1"
    )
    r = _get(url)
    if r is None:
        return None, None
    text = BeautifulSoup(r.text, "html.parser").get_text(" ")
    return _parse_dep_arr(text, from_st, to_st)


def collect_trains(
    from_before: str,
    to_after: str,
    date: datetime.date,
    start: int = T(4, 0),
) -> list[dict]:
    """
    始発から終電まで全列車を順番に収集する。

    Step 1: from_before → 西大宮 (start から検索、以降は前の dep_before + 1)
    Step 2: 西大宮 → to_after   (Step 1 の arr_nishiomiya をそのまま起点に使用)

    終了条件: dep_before が前の列車より小さくなったとき（終電の次が翌朝始発に戻る）

    戻り値: [{dep_before, arr_nishiomiya, dep_nishiomiya, arr_after}, ...]
    """
    NISHI = "西大宮"
    results: list[dict] = []
    current = start
    prev_dep_before = -1
    n = 0

    while True:
        # ── Step 1: 前駅 → 西大宮 ──
        dep_before_str, arr_nishi_str = fetch_route(from_before, NISHI, date, current)

        if dep_before_str is None or arr_nishi_str is None:
            print(f"  ✗ 取得失敗 ({from_before}→西大宮, {fmt(current)})")
            break

        dep_before = parse_time(dep_before_str)
        arr_nishi = parse_time(arr_nishi_str)

        # 終電の次は翌朝の始発。2通りのケースを検出:
        #   A) 23:xx → 04:xx : dep_before < prev_dep_before (時刻が巻き戻る)
        #   B) 01:xx → 04:xx : dep_before > prev_dep_before だが 2時間以上ジャンプ
        gap = dep_before - prev_dep_before
        if results and (dep_before < prev_dep_before or gap > 120):
            print(f"  → {dep_before_str} は翌朝始発、終了")
            break

        polite_sleep()

        # ── Step 2: 西大宮 → 次駅（Step 1 の西大宮到着時刻を起点に検索）──
        dep_nishi_str, arr_after_str = fetch_route(NISHI, to_after, date, arr_nishi)

        dep_nishi = parse_time(dep_nishi_str) if dep_nishi_str else None
        arr_after = parse_time(arr_after_str) if arr_after_str else None

        n += 1
        print(
            f"  [{n:3d}] {dep_before_str}発 → {fmt(arr_nishi)}着 / {fmt(dep_nishi)}発 → {fmt(arr_after)}着"
        )

        results.append(
            {
                "dep_before": dep_before,
                "arr_nishiomiya": arr_nishi,
                "dep_nishiomiya": dep_nishi,
                "arr_after": arr_after,
            }
        )

        prev_dep_before = dep_before
        current = dep_before + 1
        polite_sleep()

    return results


# ──────────────────────────────────────────────────────────────
# メイン
# ──────────────────────────────────────────────────────────────

OUT_FILE = "timetable.json"
TMP_FILE = "timetable.json.tmp"


def save(collected: dict, weekday_date: datetime.date, weekend_date: datetime.date) -> None:
    """一時ファイルに書いてからリネーム（中断しても既存ファイルを壊さない）"""
    output = {
        "generated": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "source_dates": {
            "weekday": weekday_date.isoformat(),
            "weekend": weekend_date.isoformat(),
        },
        "timetable": collected,
    }
    import os
    with open(TMP_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    os.replace(TMP_FILE, OUT_FILE)
    print(f"  💾 {OUT_FILE} を保存しました")


def main() -> None:
    weekday_date = next_date(weekday=True)
    weekend_date = next_date(weekday=False)

    print(f"平日: {weekday_date.isoformat()} / 土休日: {weekend_date.isoformat()}\n")

    collected: dict[str, dict[str, list[dict]]] = {}

    configs = [
        ("weekday", "up",   "指扇", "日進", weekday_date),
        ("weekday", "down", "日進", "指扇", weekday_date),
        ("weekend", "up",   "指扇", "日進", weekend_date),
        ("weekend", "down", "日進", "指扇", weekend_date),
    ]

    for day_type, direction, from_before, to_after, date in configs:
        label     = "平日" if day_type == "weekday" else "土休日"
        dir_label = "上り" if direction == "up" else "下り"
        print(f"\n{'─' * 52}")
        print(f"  {label} {dir_label}  ({from_before} → 西大宮 → {to_after})")
        print(f"{'─' * 52}")
        trains = collect_trains(from_before, to_after, date)
        collected.setdefault(day_type, {})[direction] = trains
        save(collected, weekday_date, weekend_date)  # 方向ごとに逐一保存
        polite_sleep()

    print(f"\n✓ 完了")


if __name__ == "__main__":
    main()
