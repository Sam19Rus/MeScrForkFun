#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Экономический симулятор «Лавка древностей: Тайные ящики» — модель v2 (калиброванная).
Все числа — ДИЗАЙНЕРСКИЕ ГИПОТЕЗЫ до плейтеста.

Целевые метрики калибровки (дизайнерские пороги, не отраслевой стандарт):
 - d1: 6–10 открытий (включая бесплатные), альбом 10–20%
 - d2–7: 4–6 платных открытий/день, лёгкий дефицит валюты с d3–5
 - первый epic: p50 ~ d3–8; первый legend: p50 ~ d10–20 (с pity), без pity — длинный хвост
 - дубликаты: d2–7 <20%, d8–30 <45%
 - альбом d7: 25–40%, d30: 60–85%
 - монеты не должны бесконечно расти (средний остаток < 4 цен ящика T1)
"""
import random, statistics, json
from collections import defaultdict

CATALOG = {"junk": 20, "common": 20, "rare": 12, "epic": 6, "legend": 2}   # 60 предметов
CATALOG_TOTAL = sum(CATALOG.values())
VALUE_RANGE = {"junk": (5, 25), "common": (50, 130), "rare": (260, 600),
               "epic": (900, 1800), "legend": (4000, 9000)}
TIERS = {
    "T1": {"cost": 120, "p": {"junk": .45, "common": .35, "rare": .14, "epic": .05, "legend": .01}},
    "T2": {"cost": 260, "p": {"junk": .15, "common": .40, "rare": .30, "epic": .11, "legend": .04}},
    "T3": {"cost": 380, "p": {"junk": .05, "common": .30, "rare": .38, "epic": .20, "legend": .07}},
}
SHARDS_DUP = {"junk": 5, "common": 12, "rare": 40, "epic": 120, "legend": 400}
SHARDS_COST = {"common": 250, "rare": 600, "epic": 1500, "legend": 4000}
UPGRADE_COST = lambda lvl: int(150 * (2.0 ** lvl))
UPGRADE_MAX = 5
DUP_SELL_FRACTION = 0.40
START_COINS = 300

def ev_tier(tier, restore_mult=1.0, showcase=0, regulars=0):
    t = TIERS[tier]; ev = 0.0
    for r, pr in t["p"].items():
        lo, hi = VALUE_RANGE[r]; ev += pr * (lo + hi) / 2
    return ev * restore_mult * (1 + 0.04 * showcase) * (1 + 0.02 * regulars)

def simulate_player(seed, n_days=30, ads="light", pity=50, start_coins=START_COINS,
                    t1_cost=None, t2_cost=None, t3_cost=None):
    rnd = random.Random(seed)
    cost = {"T1": t1_cost or TIERS["T1"]["cost"],
            "T2": t2_cost or TIERS["T2"]["cost"],
            "T3": t3_cost or TIERS["T3"]["cost"]}
    coins = start_coins
    upgrades = {"rep": 0, "show": 0, "tools": 0, "reg": 0}
    owned = set(); shards = 0; skill_mu = 0.62
    boxes_since_legend = 0
    first_day = {"rare": None, "epic": None, "legend": None}
    per_day = []; total_boxes = 0; dup_opens = 0
    dup_by_period = defaultdict(lambda: [0, 0]); shortage_days = 0

    def period(day): return "d1" if day == 1 else ("d2-7" if day <= 7 else "d8-30")

    def shard_exchange():
        nonlocal shards
        for r in ("common", "rare", "epic", "legend"):
            c = SHARDS_COST[r]
            missing = [(r, i) for i in range(CATALOG[r]) if (r, i) not in owned]
            while shards >= c and missing:
                shards -= c
                item = rnd.choice(missing); missing.remove(item); owned.add(item)

    def maybe_upgrade():
        nonlocal coins
        while True:
            cand = [(UPGRADE_COST(upgrades[k]), k) for k in upgrades if upgrades[k] < UPGRADE_MAX]
            if not cand: break
            c, k = min(cand)
            if coins >= 3 * c: coins -= c; upgrades[k] += 1
            else: break

    def open_box(tier, day, free=False):
        nonlocal coins, boxes_since_legend, dup_opens, skill_mu, shards, total_boxes
        if not free: coins -= cost[tier]
        total_boxes += 1; dup_by_period[period(day)][1] += 1
        boxes_since_legend += 1
        if pity and boxes_since_legend >= pity:
            rarity = "legend"
        else:
            roll = rnd.random(); acc = 0.0; rarity = "junk"
            for r, pr in TIERS[tier]["p"].items():
                acc += pr
                if roll <= acc: rarity = r; break
        if rarity == "legend": boxes_since_legend = 0
        mu = min(0.95, skill_mu + 0.03 * upgrades["tools"])
        q = max(0.35, min(1.0, rnd.gauss(mu, 0.09)))
        m = 0.6 + 0.6 * q
        skill_mu = min(0.92, skill_mu + 0.008)
        lo, hi = VALUE_RANGE[rarity]; base = rnd.uniform(lo, hi)
        sale = base * m * (1 + 0.04 * upgrades["show"]) * (1 + 0.02 * upgrades["reg"])
        item = (rarity, rnd.randrange(CATALOG[rarity]))
        if item in owned:
            dup_opens += 1; dup_by_period[period(day)][0] += 1
            coins += sale * DUP_SELL_FRACTION; shards += SHARDS_DUP[rarity]; shard_exchange()
        else:
            owned.add(item)
            if rarity in ("junk", "common"): coins += sale
            if rarity in first_day and first_day[rarity] is None: first_day[rarity] = day
        return rarity

    def sessions_on(day):
        return 3 if day == 1 else (2 if day == 2 else (1.5 if day <= 7 else 1.2))

    for day in range(1, n_days + 1):
        day_boxes = 0; dups_before = dup_opens
        open_box("T1", day, free=True); day_boxes += 1
        if day % 7 == 0: open_box("T2", day, free=True); day_boxes += 1
        if ads in ("light", "heavy"): open_box("T2", day, free=True); day_boxes += 1
        if ads == "heavy":
            open_box("T1", day, free=True); day_boxes += 1
            open_box("T1", day, free=True); day_boxes += 1
        cycles_left = int(sessions_on(day) * 4.5); bought_paid = 0
        while cycles_left > 0:
            maybe_upgrade()
            tier = None
            if upgrades["rep"] >= 4 and coins >= cost["T3"] * 1.15: tier = "T3"
            elif upgrades["rep"] >= 2 and coins >= cost["T2"] * 1.15: tier = "T2"
            elif coins >= cost["T1"]: tier = "T1"
            if tier is None: break
            open_box(tier, day); day_boxes += 1; bought_paid += 1; cycles_left -= 1
        if ads in ("light", "heavy"): coins += ev_tier("T1") * 0.5 * 0.9  # удвоение продажи ~ среднее
        if ads == "heavy": coins += ev_tier("T1") * 0.5 * 0.9
        if bought_paid == 0 and day > 1: shortage_days += 1
        per_day.append((day_boxes, int(coins), dup_opens - dups_before, len(owned) / CATALOG_TOTAL))

    dup_rate = {p: (v[0] / v[1] if v[1] else 0) for p, v in dup_by_period.items()}
    return {
        "boxes_d1": per_day[0][0], "boxes_d2": per_day[1][0], "boxes_d7": per_day[6][0],
        "boxes_total30": total_boxes,
        "album_d1": round(per_day[0][3], 3), "album_d7": round(per_day[6][3], 3),
        "album_d30": round(per_day[29][3], 3),
        "first_rare": first_day["rare"], "first_epic": first_day["epic"],
        "first_legend": first_day["legend"],
        "dup_d1": round(dup_rate.get("d1", 0), 3), "dup_d2_7": round(dup_rate.get("d2-7", 0), 3),
        "dup_d8_30": round(dup_rate.get("d8-30", 0), 3),
        "shortage_days": shortage_days,
        "coins_d7": per_day[6][1], "coins_end": per_day[29][1],
    }

def summarize(res, name):
    def col(k):
        vals = [r[k] for r in res if r[k] is not None]
        nones = len(res) - len(vals)
        if not vals: return {"mean": None, "p50": None, "p90": None, "none": nones}
        s = sorted(vals)
        return {"mean": round(statistics.mean(s), 2), "p50": s[len(s)//2],
                "p90": s[int(len(s)*0.9)], "none": nones}
    keys = ["boxes_d1", "boxes_d2", "boxes_d7", "boxes_total30", "album_d1", "album_d7",
            "album_d30", "first_rare", "first_epic", "first_legend", "dup_d1", "dup_d2_7",
            "dup_d8_30", "shortage_days", "coins_d7", "coins_end"]
    return {"scenario": name, **{k: col(k) for k in keys}}

if __name__ == "__main__":
    print("=== EV ярусов (restore≈0.97 средний, без апгрейдов) ===")
    for t in TIERS:
        ev = ev_tier(t, restore_mult=0.97)
        print(f"{t}: цена {TIERS[t]['cost']}, EV≈{ev:.0f}, EV/цена≈{ev/TIERS[t]['cost']:.2f}")

    out = []
    out.append(summarize([simulate_player(i, ads="light", pity=50) for i in range(100)],   "v2 base/light N=100"))
    out.append(summarize([simulate_player(i, ads="light", pity=50) for i in range(1000)],  "v2 base/light N=1000"))
    base10k = [simulate_player(i, ads="light", pity=50) for i in range(10000)]
    out.append(summarize(base10k, "v2 base/light N=10000"))
    out.append(summarize([simulate_player(i, ads="none",  pity=50) for i in range(10000)], "v2 base/noads"))
    out.append(summarize([simulate_player(i, ads="heavy", pity=50) for i in range(10000)], "v2 base/heavy"))
    out.append(summarize([simulate_player(i, ads="light", pity=0)  for i in range(10000)], "v2 no-pity/light"))
    out.append(summarize([simulate_player(i, ads="light", pity=30) for i in range(10000)], "v2 pity30/light"))
    out.append(summarize([simulate_player(i, ads="light", pity=50, t1_cost=160) for i in range(10000)], "v2 T1=160 (дороже)"))
    out.append(summarize([simulate_player(i, ads="light", pity=50, t1_cost=90, start_coins=400) for i in range(10000)], "v2 щедро (T1=90, старт 400)"))

    with open("economy_results.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    for r in out:
        print(f"\n--- {r['scenario']} ---")
        for k, v in r.items():
            if k == "scenario": continue
            print(f"  {k:14s} mean={v['mean']} p50={v['p50']} p90={v['p90']} none={v['none']}")
