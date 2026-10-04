#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Экономический симулятор «Лавка древностей» — v3 (исправления по итогам v2).

Исправления v3:
 1. «Оставить в коллекции» возвращает 35% стоимости продажи (комиссия коллекционера)
    + сет-бонусы: альбом >=30% -> +8% к продажам, >=60% -> +16% (аппроксимация эпох-сетов).
 2. Лицензии ярусов: T2 — разовые 800, T3 — разовые 2500 монет (дополнительный сток).
 3. Апгрейды дороже: 150 * 2.2^lvl.
 4. Pity по умолчанию 65 ящиков (вместо 50) — легендарка как событие 2-й недели.
 5. Цены: T1=140, T2=300, T3=440; старт 420.
 6. Сценарий каталога 90 предметов (junk30/common30/rare18/epic9/legend3) — проверка
    «лечит» ли больший каталог дубликатную усталость.
"""
import random, statistics, json
from collections import defaultdict

VALUE_RANGE = {"junk": (5, 25), "common": (50, 130), "rare": (260, 600),
               "epic": (900, 1800), "legend": (4000, 9000)}
TIERS = {
    "T1": {"cost": 140, "p": {"junk": .45, "common": .35, "rare": .14, "epic": .05, "legend": .01}},
    "T2": {"cost": 300, "p": {"junk": .15, "common": .40, "rare": .30, "epic": .11, "legend": .04}},
    "T3": {"cost": 440, "p": {"junk": .05, "common": .30, "rare": .38, "epic": .20, "legend": .07}},
}
LICENSE = {"T2": 800, "T3": 2500}
SHARDS_DUP = {"junk": 5, "common": 12, "rare": 40, "epic": 120, "legend": 400}
SHARDS_COST = {"common": 250, "rare": 600, "epic": 1500, "legend": 4000}
UPGRADE_COST = lambda lvl: int(150 * (2.2 ** lvl))
UPGRADE_MAX = 5
DUP_SELL_FRACTION = 0.40
KEEP_REFUND = 0.35
START_COINS = 420
CATALOG60 = {"junk": 20, "common": 20, "rare": 12, "epic": 6, "legend": 2}
CATALOG90 = {"junk": 30, "common": 30, "rare": 18, "epic": 9, "legend": 3}

def ev_tier(tier, mult=0.97):
    ev = 0.0
    for r, pr in TIERS[tier]["p"].items():
        lo, hi = VALUE_RANGE[r]; ev += pr * (lo + hi) / 2
    return ev * mult

def simulate_player(seed, n_days=30, ads="light", pity=65, start_coins=START_COINS,
                    catalog=None, t1_cost=None):
    rnd = random.Random(seed)
    cat = catalog or CATALOG60
    CAT_TOTAL = sum(cat.values())
    costT = {"T1": t1_cost or TIERS["T1"]["cost"], "T2": TIERS["T2"]["cost"], "T3": TIERS["T3"]["cost"]}
    coins = start_coins
    upgrades = {"rep": 0, "show": 0, "tools": 0, "reg": 0}
    licensed = {"T2": False, "T3": False}
    owned = set(); shards = 0; skill_mu = 0.62
    boxes_since_legend = 0
    first_day = {"rare": None, "epic": None, "legend": None}
    per_day = []; total_boxes = 0; dup_opens = 0; kept_count = 0
    dup_by_period = defaultdict(lambda: [0, 0]); shortage_days = 0

    def period(d): return "d1" if d == 1 else ("d2-7" if d <= 7 else "d8-30")

    def set_bonus():
        frac = len(owned) / CAT_TOTAL
        return 1.16 if frac >= 0.60 else (1.08 if frac >= 0.30 else 1.0)

    def shard_exchange():
        nonlocal shards
        for r in ("common", "rare", "epic", "legend"):
            c = SHARDS_COST[r]
            missing = [(r, i) for i in range(cat[r]) if (r, i) not in owned]
            while shards >= c and missing:
                shards -= c
                item = rnd.choice(missing); missing.remove(item); owned.add(item)

    def maybe_upgrade():
        nonlocal coins
        # лицензии ярусов — приоритетный сток
        if upgrades["rep"] >= 2 and not licensed["T2"] and coins >= LICENSE["T2"] + 3 * costT["T1"]:
            coins -= LICENSE["T2"]; licensed["T2"] = True
        if upgrades["rep"] >= 4 and not licensed["T3"] and coins >= LICENSE["T3"] + 3 * costT["T2"]:
            coins -= LICENSE["T3"]; licensed["T3"] = True
        while True:
            cand = [(UPGRADE_COST(upgrades[k]), k) for k in upgrades if upgrades[k] < UPGRADE_MAX]
            if not cand: break
            c, k = min(cand)
            if coins >= 3 * c: coins -= c; upgrades[k] += 1
            else: break

    def open_box(tier, day, free=False):
        nonlocal coins, boxes_since_legend, dup_opens, skill_mu, shards, total_boxes, kept_count
        if not free: coins -= costT[tier]
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
        m = (0.6 + 0.6 * q)
        skill_mu = min(0.92, skill_mu + 0.008)
        lo, hi = VALUE_RANGE[rarity]; base = rnd.uniform(lo, hi)
        sale = base * m * (1 + 0.04 * upgrades["show"]) * (1 + 0.02 * upgrades["reg"]) * set_bonus()
        item = (rarity, rnd.randrange(cat[rarity]))
        if item in owned:
            dup_opens += 1; dup_by_period[period(day)][0] += 1
            coins += sale * DUP_SELL_FRACTION; shards += SHARDS_DUP[rarity]; shard_exchange()
        else:
            owned.add(item)
            if rarity in ("junk", "common"):
                coins += sale                       # продаём
            else:
                coins += sale * KEEP_REFUND         # оставляем: комиссия коллекционера 35%
                kept_count += 1
            if rarity in first_day and first_day[rarity] is None: first_day[rarity] = day
        return rarity

    def sessions_on(d): return 3 if d == 1 else (2 if d == 2 else (1.5 if d <= 7 else 1.2))

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
            if licensed["T3"] and coins >= costT["T3"] * 1.15: tier = "T3"
            elif licensed["T2"] and coins >= costT["T2"] * 1.15: tier = "T2"
            elif coins >= costT["T1"]: tier = "T1"
            if tier is None: break
            open_box(tier, day); day_boxes += 1; bought_paid += 1; cycles_left -= 1
        if ads in ("light", "heavy"): coins += ev_tier("T1") * 0.5 * 0.9
        if ads == "heavy": coins += ev_tier("T1") * 0.5 * 0.9
        if bought_paid == 0 and day > 1: shortage_days += 1
        per_day.append((day_boxes, int(coins), dup_opens - dups_before, len(owned) / CAT_TOTAL))

    dup_rate = {p: (v[0] / v[1] if v[1] else 0) for p, v in dup_by_period.items()}
    return {"boxes_d1": per_day[0][0], "boxes_d2": per_day[1][0], "boxes_d7": per_day[6][0],
            "boxes_total30": total_boxes, "album_d1": round(per_day[0][3], 3),
            "album_d7": round(per_day[6][3], 3), "album_d30": round(per_day[29][3], 3),
            "first_rare": first_day["rare"], "first_epic": first_day["epic"],
            "first_legend": first_day["legend"], "dup_d1": round(dup_rate.get("d1", 0), 3),
            "dup_d2_7": round(dup_rate.get("d2-7", 0), 3), "dup_d8_30": round(dup_rate.get("d8-30", 0), 3),
            "shortage_days": shortage_days, "coins_d7": per_day[6][1], "coins_end": per_day[29][1],
            "kept": kept_count}

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
            "dup_d8_30", "shortage_days", "coins_d7", "coins_end", "kept"]
    return {"scenario": name, **{k: col(k) for k in keys}}

if __name__ == "__main__":
    print("=== EV ярусов v3 (restore≈0.97) ===")
    for t in TIERS:
        print(f"{t}: цена {TIERS[t]['cost']}, EV≈{ev_tier(t):.0f}, EV/цена≈{ev_tier(t)/TIERS[t]['cost']:.2f}")
    out = []
    out.append(summarize([simulate_player(i, ads="light") for i in range(100)],   "v3 base/light N=100"))
    out.append(summarize([simulate_player(i, ads="light") for i in range(1000)],  "v3 base/light N=1000"))
    out.append(summarize([simulate_player(i, ads="light") for i in range(10000)], "v3 base/light N=10000"))
    out.append(summarize([simulate_player(i, ads="none")  for i in range(10000)], "v3 base/noads"))
    out.append(summarize([simulate_player(i, ads="heavy") for i in range(10000)], "v3 base/heavy"))
    out.append(summarize([simulate_player(i, ads="light", pity=0)  for i in range(10000)], "v3 no-pity/light"))
    out.append(summarize([simulate_player(i, ads="light", pity=35) for i in range(10000)], "v3 pity35/light"))
    out.append(summarize([simulate_player(i, ads="light", catalog=CATALOG90) for i in range(10000)], "v3 catalog90/light"))
    out.append(summarize([simulate_player(i, ads="light", t1_cost=180) for i in range(10000)], "v3 T1=180/light"))
    with open("economy_results_v3.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    for r in out:
        print(f"\n--- {r['scenario']} ---")
        for k, v in r.items():
            if k == "scenario": continue
            print(f"  {k:14s} mean={v['mean']} p50={v['p50']} p90={v['p90']} none={v['none']}")
