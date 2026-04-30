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
  ・区間所要時間はオフピーク時刻（10:00）で取得

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
            wait = 5.0 * (2 ** attempt) + random.uniform(0, 2)
            print(f"      ⚠ リトライ {attempt + 1}/{max_retries}（{wait:.1f}s 後）")
            time.sleep(wait)
    return None


def _parse_dep_arr(text: str, from_st: str, to_st: str) -> tuple[str | None, str | None]:
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


def fetch_route(from_st: str, to_st: str, date: datetime.date, t: int) -> tuple[str | None, str | None]:
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


def get_travel_min(from_st: str, to_st: str, date: datetime.date, ref_t: int = T(10, 0)) -> int | None:
    """オフピーク時刻で駅間所要時間(分)を取得する"""
    dep_str, arr_str = fetch_route(from_st, to_st, date, ref_t)
    if dep_str is None or arr_str is None:
        return None
    dt = parse_time(arr_str) - parse_time(dep_str)
    print(f"  {from_st} → {to_st}: {dep_str}発 {arr_str}着 = {dt}分")
    return dt if dt > 0 else None


def collect_trains(
    anchors: list[int],
    from_before: str,
    to_after: str,
    date: datetime.date,
    rough_before: int,
) -> list[dict]:
    """
    各アンカー（西大宮出発時刻の目安）に対して 1 列車あたり 2 回 Yahoo を検索する。

    Step 1: 西大宮 → to_after   → dep_nishiomiya, arr_after を確認
    Step 2: from_before → 西大宮 → dep_before, arr_nishiomiya を確認
             (Step 1 の dep_nishiomiya を基点に rough_before + 余裕2分 手前で検索)

    戻り値: [{dep_before, arr_nishiomiya, dep_nishiomiya, arr_after}, ...]
    """
    NISHI = "西大宮"
    results: list[dict] = []
    seen: set[int] = set()
    n = len(anchors)

    for i, anchor in enumerate(anchors, 1):
        prefix = f"  [{i:3d}/{n}]"

        # ── Step 1: 西大宮 → 次駅 ──
        dep_nishi_str, arr_after_str = fetch_route(NISHI, to_after, date, anchor)

        if dep_nishi_str is None:
            print(f"{prefix} {fmt(anchor)} → ✗ 取得失敗 (西大宮→{to_after})")
            if i < n:
                polite_sleep()
            continue

        dep_nishi = parse_time(dep_nishi_str)

        if dep_nishi in seen:
            print(f"{prefix} {fmt(anchor)} → 西大宮 {dep_nishi_str}発（重複, スキップ）")
            if i < n:
                polite_sleep()
            continue

        polite_sleep()

        # ── Step 2: 前駅 → 西大宮 ──
        # dep_nishiomiya より (rough_before + 余裕2分) 前を起点に検索
        search_anchor = dep_nishi - rough_before - 2
        dep_before_str, arr_nishi_str = fetch_route(from_before, NISHI, date, search_anchor)

        dep_before = parse_time(dep_before_str) if dep_before_str else None
        arr_nishi  = parse_time(arr_nishi_str)  if arr_nishi_str  else None
        arr_after  = parse_time(arr_after_str)  if arr_after_str  else None

        # 西大宮到着と出発が 10 分以上離れていたら別列車を拾っている可能性あり
        if arr_nishi is not None and abs(arr_nishi - dep_nishi) > 10:
            print(f"{prefix} ⚠ 西大宮 {fmt(arr_nishi)}着/{dep_nishi_str}発 — 10分超ズレ、別列車の可能性")
        else:
            print(f"{prefix} {fmt(dep_before)}発 → {fmt(arr_nishi)}着 / {dep_nishi_str}発 → {fmt(arr_after)}着")

        results.append({
            "dep_before":     dep_before,
            "arr_nishiomiya": arr_nishi,
            "dep_nishiomiya": dep_nishi,
            "arr_after":      arr_after,
        })
        seen.add(dep_nishi)

        if i < n:
            polite_sleep()

    return results


# ──────────────────────────────────────────────────────────────
# アンカー時刻表（西大宮駅出発時刻）
# ──────────────────────────────────────────────────────────────

def make_range(h_start: int, h_end: int, mins: list[int]) -> list[int]:
    return [T(h, m) for h in range(h_start, h_end + 1) for m in mins]


def weekend_up_core() -> list[int]:
    result = []
    for h in range(9, 23):
        if h % 2 == 1:
            result += [T(h, 12), T(h, 36)]
        else:
            result += [T(h, 0), T(h, 24), T(h, 48)]
    return result


NISHIOMIYA: dict[str, dict[str, list[int]]] = {
    "weekday": {
        "up": [
            T(4, 51),
            T(5, 2),  T(5, 11), T(5, 19), T(5, 28), T(5, 36), T(5, 49), T(5, 59),
            T(6, 8),  T(6, 17), T(6, 27), T(6, 36), T(6, 45), T(6, 54),
            T(7, 3),  T(7, 12), T(7, 21), T(7, 30), T(7, 39), T(7, 48), T(7, 57),
            T(8, 6),  T(8, 15), T(8, 24), T(8, 33), T(8, 42), T(8, 51),
            *make_range(9, 22, [0, 12, 24, 36, 48]),
            T(23, 5), T(23, 18), T(23, 32), T(23, 47),
        ],
        "down": [
            T(5, 44),
            T(6, 11), T(6, 33), T(6, 57),
            *make_range(7, 22, [13, 28, 43, 58]),
            T(23, 13), T(23, 35), T(23, 56),
        ],
    },
    "weekend": {
        "up": [
            T(4, 51),
            T(5, 11), T(5, 28), T(5, 49),
            T(6, 8),  T(6, 27), T(6, 45),
            T(7, 3),  T(7, 21), T(7, 39), T(7, 57),
            T(8, 15), T(8, 33), T(8, 51),
            *weekend_up_core(),
            T(23, 18), T(23, 47),
        ],
        "down": [
            T(5, 44),
            T(6, 33),
            *make_range(7, 22, [13, 43]),
            T(23, 35),
        ],
    },
}


# ──────────────────────────────────────────────────────────────
# メイン
# ──────────────────────────────────────────────────────────────

FALLBACK = {
    "日進_西大宮": 3,
    "西大宮_指扇": 2,
    "指扇_西大宮": 2,
    "西大宮_日進": 3,
}


def main() -> None:
    weekday_date = next_date(weekday=True)
    weekend_date = next_date(weekday=False)

    total_anchors = sum(len(v) for d in NISHIOMIYA.values() for v in d.values())
    total_req = total_anchors * 2 + 4
    est_lo, est_hi = total_req * 2 // 60, total_req * 4 // 60
    print(f"平日: {weekday_date.isoformat()} / 土休日: {weekend_date.isoformat()}")
    print(f"合計リクエスト数: 約 {total_req} 回 / 推定所要時間: {est_lo}〜{est_hi} 分\n")

    # ── 区間所要時間を先に取得（Step 2 の検索起点に使う）──────────
    print(f"{'─' * 52}")
    print("  区間所要時間（オフピーク 10:00 基準）")
    print(f"{'─' * 52}")

    dt: dict[str, int] = {}
    for from_st, to_st in [("日進", "西大宮"), ("西大宮", "指扇"), ("指扇", "西大宮"), ("西大宮", "日進")]:
        key = f"{from_st}_{to_st}"
        val = get_travel_min(from_st, to_st, weekday_date)
        if val is None:
            print(f"  ⚠ {key}: フォールバック {FALLBACK[key]} 分を使用")
            val = FALLBACK[key]
        dt[key] = val
        polite_sleep()

    # ── 各方向・日種で列車情報を収集 ───────────────────────────────
    collected: dict[str, dict[str, list[dict]]] = {}

    configs = [
        # (day_type, direction, from_before, to_after, date, rough_before)
        ("weekday", "up",   "指扇", "日進", weekday_date, dt["指扇_西大宮"]),
        ("weekday", "down", "日進", "指扇", weekday_date, dt["日進_西大宮"]),
        ("weekend", "up",   "指扇", "日進", weekend_date, dt["指扇_西大宮"]),
        ("weekend", "down", "日進", "指扇", weekend_date, dt["日進_西大宮"]),
    ]

    for day_type, direction, from_before, to_after, date, rough_before in configs:
        label     = "平日" if day_type == "weekday" else "土休日"
        dir_label = "上り" if direction == "up" else "下り"
        print(f"\n{'─' * 52}")
        print(f"  {label} {dir_label}  ({from_before} → 西大宮 → {to_after})")
        print(f"{'─' * 52}")
        anchors = NISHIOMIYA[day_type][direction]
        trains = collect_trains(anchors, from_before, to_after, date, rough_before)
        collected.setdefault(day_type, {})[direction] = trains
        polite_sleep()

    # ── timetable.json 生成 ────────────────────────────────────────
    output = {
        "generated": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "source_dates": {
            "weekday": weekday_date.isoformat(),
            "weekend": weekend_date.isoformat(),
        },
        "timetable": collected,
    }

    with open("timetable.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✓ timetable.json を生成しました")


if __name__ == "__main__":
    main()
