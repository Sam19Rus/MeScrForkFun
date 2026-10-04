#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Экономический симулятор «Лавка древностей» — v4 (финальная калибровка MVP-экономики).

Изменения v4:
 1. Каталог 90 предметов (junk30/common30/rare18/epic9/legend3).
 2. Цены: T1=150, T2=320, T3=460; старт 450.
 3. «Коллекционный дивиденд»: ежедневный доход посетителя за уникальные предметы
    (альбом>=30% -> +40/день, >=60% -> +90, >=85% -> +150). Коллекция кормит экономику.
 4. pity=70; legendary T1 .01, T2 .035, T3 .06 (чуть реже в T1).
 5. Звёздные апгрейды дубликатов моделируются аналитически (вне симуляции):
    4 дубля = ★5;поток дубликатов после заполнения альбома — см. отчёт.
"""
import random, statistics, json
from collections import defaultdict

VALUE_RANGE = {"junk": (5, 25), "common": (50, 130), "rare": (260, 600),
               "epic": (900, 1800), "legend": (4000, 9000)}
TIERS = {
    "T1": {"cost": 150, "p": {"junk": .46, "common": .35, "rare": .135, "epic": .045, "legend": .010}},
    "T2": {"cost": 320, "p": {"junk": .16, "common": .40, "rare": .295, "epic": .110, "legend": .035}},
    "T3": {"cost": 460, "p": {"junk": .06, "common": .30, "rare": .375, "epic": .205, "legend": .060}},
}
LICENSE = {"T2": 900, "T3": 2800}
SHARDS_DUP = {"junk": 5, "common": 12, "rare": 40, "epic": 120, "legend": 400}
SHARDS_COST = {"common": 250, "rare": 600, "epic": 1500, "legend": 4000}
UPGRADE_COST = lambda lvl: int(150 * (2.2 ** lvl))
UPGRADE_MAX = 5
DUP_SELL_FRACTION = 0.40
KEEP_REFUND = 0.35
START_COINS = 450
CATALOG = {"junk": 30, "common": 30, "rare": 18, "epic": 9, "legend": 3}
CAT_TOTAL = sum(CATALOG.values())

def ev_tier(tier, mult=0.97):
    return sum(pr * sum(VALUE_RANGE[r]) / 2 for r, pr in TIERS[tier]["p"].items()) * mult

def simulate_player(seed, n_days=30, ads="light", pity=70, start_coins=START_COINS):
    rnd = random.Random(seed)
    coins = start_coins
    upgrades = {"rep": 0, "show": 0, "tools": 0, "reg": 0}
    licensed = {"T2": False, "T3": False}
    owned = set(); shards = 0; skill_mu = 0.62
    boxes_since_legend = 0
    first_day = {"rare": None, "epic": None, "legend": None}
    per_day = []; total_boxes = 0; dup_opens = 0
    dup_by_period = defaultdict(lambda: [0, 0]); shortage_days = 0

    def period(d): return "d1" if d == 1 else ("d2-7" if d <= 7 else "d8-30")

    def album_frac(): return len(owned) / CAT_TOTAL

    def dividend():
        f = album_frac()
        return 150 if f >= 0.85 else (90 if f >= 0.60 else (40 if f >= 0.30 else 0))

    def set_bonus():
        f = album_frac()
        return 1.16 if f >= 0.60 else (1.08 if f >= 0.30 else 1.0)

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
        if upgrades["rep"] >= 2 and not licensed["T2"] and coins >= LICENSE["T2"] + 450:
            coins -= LICENSE["T2"]; licensed["T2"] = True
        if upgrades["rep"] >= 4 and not licensed["T3"] and coins >= LICENSE["T3"] + 960:
            coins -= LICENSE["T3"]; licensed["T3"] = True
        while True:
            cand = [(UPGRADE_COST(upgrades[k]), k) for k in upgrades if upgrades[k] < UPGRADE_MAX]
            if not cand: break
            c, k = min(cand)
            if coins >= 3 * c: coins -= c; upgrades[k] += 1
            else: break

    def open_box(tier, day, free=False):
        nonlocal coins, boxes_since_legend, dup_opens, skill_mu, shards, total_boxes
        if not free: coins -= TIERS[tier]["cost"]
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
        sale = base * m * (1 + 0.04 * upgrades["show"]) * (1 + 0.02 * upgrades["reg"]) * set_bonus()
        item = (rarity, rnd.randrange(CATALOG[rarity]))
        if item in owned:
            dup_opens += 1; dup_by_period[period(day)][0] += 1
            coins += sale * DUP_SELL_FRACTION; shards += SHARDS_DUP[rarity]; shard_exchange()
        else:
            owned.add(item)
            if rarity in ("junk", "common"): coins += sale
            else: coins += sale * KEEP_REFUND
            if rarity in first_day and first_day[rarity] is None: first_day[rarity] = day
        return rarity

    def sessions_on(d): return 3 if d == 1 else (2 if d == 2 else (1.5 if d <= 7 else 1.2))

    for day in range(1, n_days + 1):
        day_boxes = 0; dups_before = dup_opens
        coins += dividend()
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
            if licensed["T3"] and coins >= TIERS["T3"]["cost"] * 1.15: tier = "T3"
            elif licensed["T2"] and coins >= TIERS["T2"]["cost"] * 1.15: tier = "T2"
            elif coins >= TIERS["T1"]["cost"]: tier = "T1"
            if tier is None: break
            open_box(tier, day); day_boxes += 1; bought_paid += 1; cycles_left -= 1
        if ads in ("light", "heavy"): coins += ev_tier("T1") * 0.5 * 0.9
        if ads == "heavy": coins += ev_tier("T1") * 0.5 * 0.9
        if bought_paid == 0 and day > 1: shortage_days += 1
        per_day.append((day_boxes, int(coins), dup_opens - dups_before, album_frac()))

    dup_rate = {p: (v[0] / v[1] if v[1] else 0) for p, v in dup_by_period.items()}
    return {"boxes_d1": per_day[0][0], "boxes_d2": per_day[1][0], "boxes_d7": per_day[6][0],
            "boxes_total30": total_boxes, "album_d1": round(per_day[0][3], 3),
            "album_d7": round(per_day[6][3], 3), "album_d30": round(per_day[29][3], 3),
            "first_rare": first_day["rare"], "first_epic": first_day["epic"],
            "first_legend": first_day["legend"], "dup_d1": round(dup_rate.get("d1", 0), 3),
            "dup_d2_7": round(dup_rate.get("d2-7", 0), 3), "dup_d8_30": round(dup_rate.get("d8-30", 0), 3),
            "shortage_days": shortage_days, "coins_d7": per_day[6][1], "coins_end": per_day[29][1]}

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
    print("=== EV ярусов v4 ===")
    for t in TIERS:
        print(f"{t}: цена {TIERS[t]['cost']}, EV≈{ev_tier(t):.0f}, EV/цена≈{ev_tier(t)/TIERS[t]['cost']:.2f}")
    out = []
    out.append(summarize([simulate_player(i, ads="light") for i in range(100)],   "v4 base/light N=100"))
    out.append(summarize([simulate_player(i, ads="light") for i in range(1000)],  "v4 base/light N=1000"))
    out.append(summarize([simulate_player(i, ads="light") for i in range(10000)], "v4 base/light N=10000"))
    out.append(summarize([simulate_player(i, ads="none")  for i in range(10000)], "v4 base/noads"))
    out.append(summarize([simulate_player(i, ads="heavy") for i in range(10000)], "v4 base/heavy"))
    out.append(summarize([simulate_player(i, ads="light", pity=0) for i in range(10000)], "v4 no-pity/light"))
    with open("economy_results_v4.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    for r in out:
        print(f"\n--- {r['scenario']} ---")
        for k, v in r.items():
            if k == "scenario": continue
            print(f"  {k:14s} mean={v['mean']} p50={v['p50']} p90={v['p90']} none={v['none']}")
