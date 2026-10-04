/* logic.test.ts — порт lavka2-vp/tests/logic_tests.js (37 проверок) + проверки
   новых систем вертикального среза (запчасти, доноры, покупатели, город). */
import { describe, it, expect } from 'vitest';
import { CONFIG } from '../src/game/data/config';
import { CATS, HOUSES, NPCS, SETS, FIXTURES } from '../src/game/data/world';
import { ORDER_TEMPLATES } from '../src/game/data/orders';
import { ITEMS, ITEMS_BY_ID, DONOR_ITEMS } from '../src/game/data/items';
import { PARTS, CITY_BUILDINGS, DEFECTS, DEFECT_POOL_BY_CAT } from '../src/game/data/parts';
import * as E from '../src/game/economy';
import { Goals } from '../src/game/systems/goals';
import { OrdersSystem } from '../src/game/systems/orders';
import { AuctionSystem } from '../src/game/systems/auction';
import type { Save } from '../src/game/types';

const rnd = E.mulberry32(42);

function fakeSave(over: Partial<Save> = {}): Save {
  return {
    v: 3, day: 1, coins: 600, owned: {}, fixtures: [], vitrine: [], orders: [],
    shopLevel: 1, lastDivDay: 0, pity: 0,
    stats: { wins: 0, losses: 0, sold: 0, kept: 0, ordersDone: 0, ordersExpired: 0, dup: 0, best: 0, motivated: 0 },
    est: { submitted: 0, correct: 0 }, autoRestore: { date: '', count: 0 }, ftue: { done: false },
    parts: { universal: 0, electronic: 0, mechanical: 0, polish: 0, knob: 0, belt: 0, pendulum: 0, lens: 0 },
    ...over
  } as Save;
}

describe('1. целостность каталога', () => {
  it('каталог 30–40 предметов', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(30);
    expect(ITEMS.length).toBeLessThanOrEqual(40);
  });
  it('id уникальны', () => {
    expect(new Set(ITEMS.map(i => i.id)).size).toBe(ITEMS.length);
  });
  it('предметы: story/svg/value/cat/restore/clues валидны', () => {
    ITEMS.forEach(i => {
      expect(i.story && i.story.length >= 40, i.id + ' story').toBeTruthy();
      expect(i.svg.startsWith('<svg'), i.id + ' svg').toBeTruthy();
      expect(i.value[0] > 0 && i.value[1] >= i.value[0], i.id + ' value').toBeTruthy();
      expect(CATS[i.cat], i.id + ' cat').toBeTruthy();
      expect(['clean', 'polish', 'assemble'].includes(i.restore), i.id + ' restore').toBeTruthy();
      expect(i.clues && i.clues.material && i.clues.weight && i.clues.seller, i.id + ' clues').toBeTruthy();
      if (i.set) expect((SETS as any)[i.set], i.id + ' set').toBeTruthy();
      if (i.fixture) expect(FIXTURES.find(f => f.item === i.id), i.id + ' fixture').toBeTruthy();
      if (i.requiredPart) expect(PARTS[i.requiredPart], i.id + ' part').toBeTruthy();
    });
  });
  it('редкости: 5 уровней представлены (≥2 каждого)', () => {
    const rar: Record<string, number> = { junk: 0, common: 0, rare: 0, epic: 0, legend: 0 };
    ITEMS.forEach(i => rar[i.rarity]++);
    Object.values(rar).forEach(v => expect(v).toBeGreaterThanOrEqual(2));
  });
});

describe('2. сеты/заказы/фикстуры ссылаются на существующее', () => {
  it('в каждом сете ≥5 предметов', () => {
    Object.keys(SETS).forEach(s => {
      expect(ITEMS.filter(i => i.set === s).length, s).toBeGreaterThanOrEqual(5);
    });
  });
  it('заказы: item-цели существуют', () => {
    ORDER_TEMPLATES.filter(t => t.want.item).forEach(t => expect(ITEMS_BY_ID[t.want.item!], t.id).toBeTruthy());
  });
  it('заказы: cat-цели существуют', () => {
    ORDER_TEMPLATES.filter(t => t.want.cat).forEach(t => expect(CATS[t.want.cat!], t.id).toBeTruthy());
  });
  it('FTUE-лоты существуют', () => {
    CONFIG.ftue.lots.forEach(l => expect(ITEMS_BY_ID[l.item], l.item).toBeTruthy());
  });
  it('фикстуры ссылаются на предметы', () => {
    FIXTURES.forEach(f => {
      expect(ITEMS_BY_ID[f.item], f.item).toBeTruthy();
      expect(ITEMS_BY_ID[f.item].fixture).toBe(f.item);
    });
  });
});

describe('3. экономика: условие/цена/шаг (v4 без изменений)', () => {
  it('condition в [0.7,1.3], start price в долях дома, increment ≥ min', () => {
    for (let i = 0; i < 5000; i++) {
      const c = E.rollCondition(rnd);
      expect(c).toBeGreaterThanOrEqual(CONFIG.lot.conditionRange[0] - 0.01);
      expect(c).toBeLessThanOrEqual(CONFIG.lot.conditionRange[1] + 0.01);
      const tV = 1000;
      const sp = E.startPrice(tV, HOUSES.city, rnd);
      expect(sp >= tV * 0.18 && sp <= tV * 0.36, `start ${sp}`).toBeTruthy();
      expect(E.increment(100 + i)).toBeGreaterThanOrEqual(CONFIG.lot.minIncrement);
    }
  });
});

describe('4. NPC-потолки (архетипы сохранены)', () => {
  it('Зинаида ниже стоимости, Аркадий переплачивает за технику, Пётр=0 на чужих', () => {
    const phone = ITEMS_BY_ID.phone;
    let zMax = 0, aLoveMin = 1e9, pOther = -1;
    for (let i = 0; i < 2000; i++) {
      const tV = 1000;
      zMax = Math.max(zMax, E.npcCap(NPCS.zinaida, phone, tV, rnd));
      aLoveMin = Math.min(aLoveMin, E.npcCap(NPCS.arkady, phone, tV, rnd));
      pOther = Math.max(pOther, E.npcCap(NPCS.petr, phone, tV, rnd));
    }
    expect(zMax).toBeLessThanOrEqual(1000 * (0.85 * 1.15 + 0.02));
    expect(aLoveMin).toBeGreaterThanOrEqual(1000 * 1.5 * 0.85 * 0.9);
    expect(pOther).toBe(0);
  });
});

describe('5. оценка по уликам', () => {
  it('улики сужают диапазон', () => {
    const u0 = E.uncertainty(0, null), u2 = E.uncertainty(2, null), u4 = E.uncertainty(4, null);
    expect(u0).toBeGreaterThan(u2);
    expect(u2).toBeGreaterThan(u4);
    expect(u4).toBeGreaterThan(1);
  });
  it('bandOf корректен', () => {
    expect(E.bandOf(50)).toBe(0);
    expect(E.bandOf(300)).toBe(1);
    expect(E.bandOf(900)).toBe(2);
    expect(E.bandOf(2000)).toBe(3);
  });
});

describe('6. заказы/сеты/фикстуры/лавка', () => {
  it('доска заказов заполняется (3 слота L1)', () => {
    const save = fakeSave();
    OrdersSystem.ensureBoard(save, rnd);
    expect(save.orders.length).toBe(3);
  });
  it('выплата item ×3', () => {
    const save = fakeSave();
    expect(E.orderPayout({ mult: 'item' } as any, 500, save)).toBe(1500);
  });
  it('сет tech активен при 5 предметах; sellMultiplier учитывает фикстуры/витрину', () => {
    const save = fakeSave();
    ['camera', 'reel', 'radiola', 'player', 'typewriter'].forEach(id => save.owned[id] = { q: 1, day: 1 });
    expect(Goals.setActive(save, 'tech')).toBeTruthy();
    save.fixtures = ['radiola']; save.vitrine = ['watch'];
    expect(Math.abs(Goals.sellMultiplier(save) - 1.05 * 1.08)).toBeLessThan(1e-9);
  });
  it('canUpgrade L2: требует и проходит; альт-гейт 4 заказа', () => {
    const poor = fakeSave({ coins: 10 });
    const c1 = Goals.canUpgrade(poor)!;
    expect(c1.ok).toBeFalsy();
    expect(c1.reqs!.length).toBe(3);
    const rich = fakeSave({ coins: 2000 });
    ['camera', 'reel', 'radiola', 'player', 'typewriter'].forEach(id => rich.owned[id] = { q: 1, day: 1 });
    rich.stats.ordersDone = 2;
    expect(Goals.canUpgrade(rich)!.ok).toBeTruthy();
    const alt = fakeSave({ coins: 2000, day: 2 });
    alt.stats.ordersDone = 4;
    expect(Goals.canUpgrade(alt)!.ok).toBeTruthy();
  });
});

describe('7. аукционный день строится', () => {
  it('buildDay: лоты, NPC, улики, trueValue=base×cond, упаковка, эпоха', () => {
    const save = fakeSave({ day: 3 });
    const day = AuctionSystem.buildDay(save, 'city', rnd);
    expect(day.lots.length).toBe(HOUSES.city.lots);
    day.lots.forEach(l => {
      expect(l.clues && l.clues.length >= 4).toBeTruthy();
      expect(Array.isArray(l.npcs)).toBeTruthy();
      expect(Math.abs(l.trueValue - l.base * l.cond)).toBeLessThanOrEqual(1);
      expect(l.packId).toBeTruthy();
      expect(l.clues!.some(c => c.kind === 'era')).toBeTruthy();
      expect(l.defects && l.defects.length >= 1, 'defects').toBeTruthy();
    });
  });
  it('усадебный аукцион: частичное фото', () => {
    const save = fakeSave({ day: 5 });
    const day = AuctionSystem.buildDay(save, 'estate', rnd);
    day.lots.forEach(l => {
      expect(l.photo).toBeTruthy();
      expect(l.clues!.some(c => c.kind === 'photo')).toBeTruthy();
    });
  });
  it('FTUE: 4 лота, первый — телефон, дефекты скриптованы', () => {
    const ftue = AuctionSystem.buildFTUEDay(fakeSave());
    expect(ftue.lots.length).toBe(4);
    expect(ftue.lots[0].itemId).toBe('phone');
    expect(ftue.lots[0].defects!.map(d => d.id)).toEqual(['dirt']);
  });
});

describe('8. упаковки/эпохи/данные', () => {
  it('5 типов упаковок', () => expect(CONFIG.packs.length).toBe(5));
  it('эпохи описаны для всех категорий', () => {
    Object.keys(CATS).forEach(c => expect(CONFIG.eras[c as keyof typeof CONFIG.eras].length).toBeGreaterThan(5));
  });
  it('заказов ≥16 шаблонов; инстанс получает вкусовой хвост; FTUE без хвоста', () => {
    expect(ORDER_TEMPLATES.length).toBeGreaterThanOrEqual(16);
    const inst = OrdersSystem.instantiate(ORDER_TEMPLATES[10], 1, 0);
    expect(inst.text.length).toBeGreaterThan(ORDER_TEMPLATES[10].text.length);
    const ftueInst = OrdersSystem.instantiate({ ...CONFIG.ftue.order, mult: 'cat' } as any, 1, 0);
    expect(ftueInst.text).toBe(CONFIG.ftue.order.text);
  });
  it('быстрая реставрация доступна хламу (value≤30)', () => {
    ITEMS.filter(i => i.rarity === 'junk').forEach(i => expect(i.value[1]).toBeLessThanOrEqual(30));
  });
});

describe('9. новые системы вертикального среза', () => {
  it('город: 5 зданий, лавка/склад/запчасти открыты сразу', () => {
    expect(CITY_BUILDINGS.length).toBe(5);
    const always = CITY_BUILDINGS.filter(b => b.unlockLevel === 1).map(b => b.id);
    expect(always).toContain('shop');
    expect(always).toContain('city_warehouse');
    expect(always).toContain('parts');
  });
  it('показательные предметы A–G существуют', () => {
    expect(ITEMS_BY_ID.jug, 'A дешёвый').toBeTruthy();                 // A
    expect(ITEMS_BY_ID.radio.requiredPart, 'B редкая деталь').toBe('knob'); // B
    expect(ITEMS_BY_ID.reel.defectBias, 'C тяжёлый').toBe('heavy');    // C
    expect(ITEMS_BY_ID.reel.requiredPart).toBe('belt');
    expect(NPCS.petr.loves).toContain('clocks');                       // D (watch → Пётр)
    expect(ITEMS_BY_ID.player.set, 'E набор').toBe('tech');
    expect(ORDER_TEMPLATES.some(t => t.want.item === 'photoalbum'), 'F заказ').toBeTruthy();
    const donor = ITEMS_BY_ID.radio_broken;                            // G донор
    expect(donor.donor && donor.yieldParts?.knob).toBeTruthy();
    expect(DONOR_ITEMS.length).toBeGreaterThanOrEqual(2);
  });
  it('все дефекты имеют операцию, вес и подсказку; операции из каталога', () => {
    Object.values(DEFECTS).forEach(d => {
      expect(d.weight).toBeGreaterThan(0);
      expect(d.hint.length).toBeGreaterThan(10);
      expect(['clean', 'polish', 'assemble', 'repair', 'replace', 'calibrate'].includes(d.op)).toBeTruthy();
    });
    Object.values(DEFECT_POOL_BY_CAT).forEach(pool => {
      pool.forEach(p => expect(DEFECTS[p]).toBeTruthy());
    });
  });
  it('особые детали привязаны к предметам и стоят дороже базовых', () => {
    const specials = ITEMS.filter(i => i.requiredPart);
    expect(specials.length).toBeGreaterThanOrEqual(4);
    specials.forEach(i => expect(PARTS[i.requiredPart!].special).toBeTruthy());
    expect(PARTS.knob.price).toBeGreaterThan(PARTS.universal.price);
  });
});
