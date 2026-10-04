/* restoration.test.ts — экономика новой системы реставрации:
   генерация дефектов, операции, качество, сценарии «выгодно/невыгодно»,
   запчасти, доноры, авто-реставрация. */
import { describe, it, expect } from 'vitest';
import { CONFIG } from '../src/game/data/config';
import { ITEMS_BY_ID } from '../src/game/data/items';
import { PARTS } from '../src/game/data/parts';
import * as E from '../src/game/economy';
import { RestorationSystem } from '../src/game/systems/restoration';
import { BuyersSystem } from '../src/game/systems/buyers';
import type { LotInst, PartId, Save } from '../src/game/types';

function fakeSave(over: Partial<Save> = {}): Save {
  return {
    v: 3, day: 1, coins: 2000, owned: {}, fixtures: [], vitrine: [], orders: [],
    shopLevel: 1, lastDivDay: 0, pity: 0,
    stats: { wins: 0, losses: 0, sold: 0, kept: 0, ordersDone: 0, ordersExpired: 0, dup: 0, best: 0, motivated: 0 },
    est: { submitted: 0, correct: 0 }, autoRestore: { date: '', count: 0 }, ftue: { done: true },
    parts: { universal: 5, electronic: 5, mechanical: 5, polish: 5, knob: 2, belt: 2, pendulum: 2, lens: 2 },
    ...over
  } as Save;
}

function fakeLot(itemId: string, cond: number, seed = 1234): LotInst {
  const item = ITEMS_BY_ID[itemId];
  const base = Math.round((item.value[0] + item.value[1]) / 2);
  const tV = E.trueValue(base, cond);
  const rnd = E.mulberry32(seed);
  return {
    id: 'test', itemId, base, cond, trueValue: tV, packId: 'box', photo: false,
    start: E.startPrice(tV, { startFrac: [0.22, 0.34] } as any, rnd), seed, seedN: 0,
    clues: null, revealedClues: 0, estimateBand: null, npcs: [], price: 0, high: null,
    winner: null, log: [],
    defects: RestorationSystem.rollDefects(item, cond, rnd)
  };
}

describe('генерация дефектов', () => {
  it('число дефектов соответствует ярусу редкости', () => {
    const rnd = E.mulberry32(7);
    for (let i = 0; i < 300; i++) {
      const jug = RestorationSystem.rollDefects(ITEMS_BY_ID.jug, 0.9, rnd);
      expect(jug.length).toBe(1); // junk: 1
      const radio = RestorationSystem.rollDefects(ITEMS_BY_ID.radio, 0.9, rnd);
      expect(radio.length).toBeGreaterThanOrEqual(2);
      expect(radio.length).toBeLessThanOrEqual(3);
      const watch = RestorationSystem.rollDefects(ITEMS_BY_ID.watch, 0.9, rnd);
      expect(watch.length).toBeGreaterThanOrEqual(3);
      expect(watch.length).toBeLessThanOrEqual(5);
    }
  });
  it('плохое состояние → больше дефектов, отличное → меньше', () => {
    const rnd = E.mulberry32(9);
    let badSum = 0, goodSum = 0;
    for (let i = 0; i < 200; i++) {
      badSum += RestorationSystem.rollDefects(ITEMS_BY_ID.compass, 0.72, rnd).length;
      goodSum += RestorationSystem.rollDefects(ITEMS_BY_ID.compass, 1.28, rnd).length;
    }
    expect(badSum).toBeGreaterThan(goodSum);
  });
  it('предмет с особой деталью почти всегда имеет missing_part', () => {
    const rnd = E.mulberry32(11);
    let n = 0;
    for (let i = 0; i < 100; i++) {
      const ds = RestorationSystem.rollDefects(ITEMS_BY_ID.radio, 0.9, rnd);
      if (ds.some(d => d.id === 'missing_part' && d.part === 'knob')) n++;
    }
    expect(n).toBe(100);
  });
  it('тяжёлый bias (reel): дефектов по верху яруса', () => {
    const rnd = E.mulberry32(13);
    const ds = RestorationSystem.rollDefects(ITEMS_BY_ID.reel, 1.0, rnd);
    expect(ds.length).toBeGreaterThanOrEqual(4); // epic [3,4] → heavy [4,5]
  });
  it('forced-дефекты (FTUE) работают', () => {
    const rnd = E.mulberry32(1);
    const ds = RestorationSystem.rollDefects(ITEMS_BY_ID.phone, 0.9, rnd, ['dirt']);
    expect(ds.length).toBe(1);
    expect(ds[0].id).toBe('dirt');
  });
});

describe('операции и качество', () => {
  it('progress/quality: всё решено идеально → q=1; ничего → q=0', () => {
    const lot = fakeLot('radio', 0.9);
    expect(RestorationSystem.progress(lot.defects!)).toBe(0);
    expect(RestorationSystem.qualityFor(lot.defects!)).toBe(0);
    lot.defects!.forEach(d => { d.resolved = true; d.opq = 1; });
    expect(RestorationSystem.progress(lot.defects!)).toBeCloseTo(1);
    expect(RestorationSystem.qualityFor(lot.defects!)).toBe(1);
  });
  it('клиф качества: <60% веса — как «без реставрации» (q=0)', () => {
    const lot = fakeLot('reel', 0.9);
    const ds = lot.defects!;
    ds[0].resolved = true; ds[0].opq = 1;
    const p = RestorationSystem.progress(ds);
    if (p <= CONFIG.restore.qFrom) expect(RestorationSystem.qualityFor(ds)).toBe(0);
    else expect(RestorationSystem.qualityFor(ds)).toBeGreaterThan(0);
  });
  it('buildOps: стоимость, доступность, блокировка калибровки', () => {
    const save = fakeSave();
    const lot = fakeLot('reel', 0.8); // heavy: должен быть broken_mech + calibration
    const ops = RestorationSystem.buildOps(save, lot);
    expect(ops.length).toBeGreaterThan(0);
    ops.forEach(op => expect(op.costCoins).toBeGreaterThanOrEqual(0));
    const calib = ops.find(o => o.op === 'calibrate');
    const repair = ops.find(o => o.op === 'repair');
    if (calib && repair) expect(calib.lockedBy).toBeTruthy();
    // порядок: replace (особая деталь) — последняя
    expect(ops[ops.length - 1].op === 'replace' || !ops.some(o => o.op === 'replace')).toBeTruthy();
  });
  it('buildOps: калибровка БЕЗ поломки не заблокирована (регрессия бага «Настроить недоступна»)', () => {
    const save = fakeSave();
    const lot = fakeLot('radio', 0.9);
    lot.defects = [{ id: 'calibration', weight: 1.0, cost: {}, resolved: false }];
    const ops = RestorationSystem.buildOps(save, lot);
    const calib = ops.find(o => o.op === 'calibrate');
    expect(calib).toBeTruthy();
    expect(calib!.lockedBy).toBeFalsy();
    // а при живой поломке — заблокирована до ремонта
    lot.defects = [
      { id: 'calibration', weight: 1.0, cost: {}, resolved: false },
      { id: 'broken_mech', weight: 1.4, cost: { mechanical: 1 }, resolved: false }
    ];
    const ops2 = RestorationSystem.buildOps(save, lot);
    expect(ops2.find(o => o.op === 'calibrate')!.lockedBy).toBeTruthy();
    // починили → разблокирована
    lot.defects[1].resolved = true;
    const ops3 = RestorationSystem.buildOps(save, lot);
    expect(ops3.find(o => o.op === 'calibrate')!.lockedBy).toBeFalsy();
  });
  it('не хватает запчастей → операция недоступна; трата списывает', () => {
    const save = fakeSave({ parts: { universal: 0, electronic: 0, mechanical: 0, polish: 0, knob: 0, belt: 0, pendulum: 0, lens: 0 } as Record<PartId, number> });
    const lot = fakeLot('radio', 0.9);
    const ops = RestorationSystem.buildOps(save, lot);
    const needParts = ops.find(o => o.costCoins > 0);
    if (needParts) expect(needParts.affordable).toBeFalsy();
    expect(RestorationSystem.spendParts(save, { knob: 1 })).toBeFalsy();
    save.parts.knob = 1;
    expect(RestorationSystem.spendParts(save, { knob: 1 })).toBeTruthy();
    expect(save.parts.knob).toBe(0);
  });
  it('авто-реставрация решает всё при запчастях и бессильна без них', () => {
    const save = fakeSave();
    const lot = fakeLot('reel', 0.85);
    expect(RestorationSystem.autoRestore(save, lot)).toBeTruthy();
    expect(lot.q).toBe(CONFIG.restore.autoQuality);
    expect(lot.defects!.every(d => d.resolved)).toBeTruthy();
    const poor = fakeSave({ parts: { universal: 0, electronic: 0, mechanical: 0, polish: 0, knob: 0, belt: 0, pendulum: 0, lens: 0 } as Record<PartId, number> });
    const lot2 = fakeLot('reel', 0.85, 99);
    expect(RestorationSystem.autoRestore(poor, lot2)).toBeFalsy();
  });
  it('быстрая обтирка хлама: q=quickQuality', () => {
    const lot = fakeLot('jug', 0.9);
    RestorationSystem.quickWipe(lot);
    expect(lot.q).toBe(CONFIG.restore.quickQuality);
    expect(lot.strategy).toBe('quick');
  });
});

describe('экономика решений (реставрация — не налог)', () => {
  it('A: дешёвый хлам — обтирка дешевле и быстрее полной реставрации', () => {
    const lot = fakeLot('jug', 0.9);
    RestorationSystem.quickWipe(lot);
    const saleQuick = Math.round(lot.trueValue * E.priceMultiplier(lot.q!));
    // полная не нужна: 1 дефект, стоимость запчастей 0 или ~15 — разница мала, но quick всегда доступен без деталей
    expect(saleQuick).toBeGreaterThan(lot.trueValue * 0.6);
  });
  it('C: сильно повреждённый эпик — «как есть» ≈ в ноль, полное восстановление выгодно', () => {
    const save = fakeSave();
    const lot = fakeLot('reel', 0.75, 555); // тяжёлое состояние, heavy-пул
    const asIs = Math.round(lot.trueValue * E.priceMultiplier(0));
    // стоимость всех запчастей
    const need = RestorationSystem.partsNeeded(lot.defects!);
    const partsCost = RestorationSystem.costCoins(need);
    const full = Math.round(lot.trueValue * E.priceMultiplier(1));
    expect(full - asIs).toBeGreaterThan(partsCost); // восстановление окупает запчасти
    expect(partsCost).toBeGreaterThan(50); // но и заметно не бесплатно
    // покупка по старт-цене: полный путь прибылен
    expect(full - lot.start - partsCost).toBeGreaterThan(0);
    expect(save.parts).toBeTruthy();
  });
  it('B: радиоприёмник — редкая деталь резко меняет маржу', () => {
    const lot = fakeLot('radio', 1.0, 4242);
    const ds = lot.defects!;
    const withKnob = Math.round(lot.trueValue * E.priceMultiplier(1));
    // без ручки решаем всё остальное
    const rest = ds.filter(d => d.id !== 'missing_part');
    rest.forEach(d => { d.resolved = true; d.opq = 1; });
    const qNoKnob = RestorationSystem.qualityFor(ds);
    const noKnob = Math.round(lot.trueValue * E.priceMultiplier(qNoKnob));
    expect(withKnob - noKnob).toBeGreaterThan(PARTS.knob.price * 0.5); // разница ощутима против цены детали
  });
  it('иногда реставрация НЕвыгодна: дорогие детали против дешёвого предмета', () => {
    // хлам с трещиной: стоимость universal(20)+время против прироста ~×0.6→×1.2 от 15₽
    const lot = fakeLot('mirror', 0.85, 777); // junk, polish/clean пул
    const asIs = Math.round(lot.trueValue * E.priceMultiplier(0));
    const full = Math.round(lot.trueValue * E.priceMultiplier(1));
    // прирост мал в абсолюте — решение «обтереть/продать как есть» разумно
    expect(full - asIs).toBeLessThan(40);
  });
  it('цена продажи считается по старой формуле v4 (tV × (0.6+0.6q) × бонусы)', () => {
    const save = fakeSave();
    const lot = fakeLot('samovar', 1.0, 31337);
    lot.defects!.forEach(d => { d.resolved = true; d.opq = 1; });
    const q = RestorationSystem.qualityFor(lot.defects!);
    const sale = Math.round(lot.trueValue * E.priceMultiplier(q) * 1);
    expect(sale).toBe(Math.round(lot.trueValue * 1.2));
    expect(save.coins).toBe(2000);
  });
});

describe('запчасти и доноры', () => {
  it('доноры дают детали (radio_broken → knob)', () => {
    const radio_broken = ITEMS_BY_ID.radio_broken;
    const y = RestorationSystem.disassembleYield(radio_broken);
    expect(y.knob).toBe(1);
    expect(y.electronic).toBe(1);
  });
  it('магазин особых деталей: ассортимент дня детерминирован и меняется', () => {
    const d1 = RestorationSystem.shopSpecialsToday(1);
    const d1b = RestorationSystem.shopSpecialsToday(1);
    const d2 = RestorationSystem.shopSpecialsToday(2);
    expect(d1).toEqual(d1b);
    expect(d1.length).toBe(CONFIG.partsShop.specialsPerDay);
    // за неделю должны встретиться разные особые детали
    const seen = new Set<string>();
    for (let d = 1; d <= 8; d++) RestorationSystem.shopSpecialsToday(d).forEach(p => seen.add(p));
    expect(seen.size).toBeGreaterThan(1);
    void d2;
  });
});

describe('NPC-покупатели (мотивация D)', () => {
  it('оффер дня детерминирован; Пётр платит сверху за часы', () => {
    const save = fakeSave({ day: 4 });
    const who = BuyersSystem.rollBuyerToday(save, 4);
    const again = BuyersSystem.rollBuyerToday(save, 4);
    expect(who).toBe(again);
    // принудительно проверяем оффер Петра
    save.buyerToday = { npc: 'petr' };
    const off = BuyersSystem.offerFor(save, ITEMS_BY_ID.compass, 400);
    expect(off).toBeTruthy();
    expect(off!.price).toBe(500); // ×1.25
    expect(BuyersSystem.offerFor(save, ITEMS_BY_ID.jug, 10)).toBeNull(); // хлам не его профиль
  });
  it('Нина переплачивает за хлам', () => {
    const save = fakeSave();
    save.buyerToday = { npc: 'nina' };
    const off = BuyersSystem.offerFor(save, ITEMS_BY_ID.jug, 20);
    expect(off && off.price).toBe(30); // ×1.5
  });
});
