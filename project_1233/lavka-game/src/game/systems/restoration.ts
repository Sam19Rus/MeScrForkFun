/* restoration.ts — НОВАЯ система реставрации вертикального среза.
   Предмет = набор дефектов (состояний); каждый дефект решается операцией
   (мини-игра или быстрое действие) и может требовать запчасти.
   Качество: progress p = Σ(вес решённого × качество операции) / Σ(всех весов)
             q = Economy.qualityFromProgress(p)   ← формула v4 из прототипа, без изменений
   Продажная цена по-прежнему: trueValue × (0.6+0.6q) × бонусы лавки.
   «Продать как есть» = q=0 (×0.6). Быстрая обтирка хлама = q=CONFIG.restore.quickQuality. */
import { CONFIG } from '../data/config';
import { DEFECTS, DEFECT_POOL_BY_CAT, OPS, PARTS } from '../data/parts';
import { ITEMS_BY_ID } from '../data/items';
import { mulberry32 } from '../rng';
import { qualityFromProgress } from '../economy';
import type { DefectId, DefectInst, ItemDef, LotInst, OpId, PartId, Save } from '../types';

export interface OpView {
  /** дефекты, решаемые этой операцией */
  defects: DefectInst[];
  op: OpId;
  name: string;
  verb: string;
  minigame: 'erase' | 'mosaic' | 'repair' | 'calibrate' | 'instant';
  desc: string;
  cost: Partial<Record<PartId, number>>;
  /** стоимость запчастями в монетах (справочно) */
  costCoins: number;
  /** хватает ли запчастей */
  affordable: boolean;
  /** операция заблокирована другой (calibration после repair) */
  lockedBy?: string;
  done: boolean;
}

export const RestorationSystem = {
  /* ---------- генерация дефектов экземпляра ---------- */
  rollDefects(item: ItemDef, cond: number, rnd: () => number, forced?: DefectId[]): DefectInst[] {
    const mk = (id: DefectId): DefectInst => {
      const d = DEFECTS[id];
      let cost: Partial<Record<PartId, number>> = { ...(d.cost || {}) };
      if (d.costByCat) cost = { ...(d.costByCat[item.cat] || { universal: 1 }) };
      if (id === 'missing_part' && item.requiredPart) cost = { [item.requiredPart]: 1 };
      return {
        id, part: id === 'missing_part' ? item.requiredPart : undefined,
        partName: id === 'missing_part' && item.requiredPart ? PARTS[item.requiredPart].name : undefined,
        weight: d.weight, cost, resolved: false
      };
    };
    if (forced && forced.length) return forced.map(mk);

    let pool: DefectId[] = item.defectPool ? [...item.defectPool] : [...(DEFECT_POOL_BY_CAT[item.cat] || DEFECT_POOL_BY_CAT.free)];
    // особая деталь предмета — почти всегда главный дефект ценных вещей
    const mustHave: DefectId[] = [];
    if (item.requiredPart && item.rarity !== 'junk' && item.rarity !== 'common') {
      mustHave.push('missing_part');
      pool = pool.filter(p => p !== 'missing_part');
    }
    let [lo, hi] = CONFIG.restore.defectCounts[item.rarity] || [1, 2];
    // состояние влияет на число дефектов
    if (cond < 0.85) hi += 1;
    if (cond > 1.15) lo = Math.max(1, lo - 1);
    if (item.defectBias === 'heavy') { lo = hi; hi = hi + 1; }
    hi = Math.min(hi, pool.length + mustHave.length);
    lo = Math.min(lo, hi);
    const n = lo + Math.floor(rnd() * (hi - lo + 1));

    // перемешиваем пул детерминированно
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const ids: DefectId[] = [...mustHave, ...pool.slice(0, Math.max(0, n - mustHave.length))];
    return ids.slice(0, n).map(mk);
  },

  /* ---------- агрегаты ---------- */
  progress(defects: DefectInst[]): number {
    const total = defects.reduce((s, d) => s + d.weight, 0);
    if (!total) return 1;
    const done = defects.reduce((s, d) => s + (d.resolved ? d.weight * (d.opq ?? 1) : 0), 0);
    return done / total;
  },
  qualityFor(defects: DefectInst[]): number {
    return qualityFromProgress(RestorationSystem.progress(defects));
  },
  partsNeeded(defects: DefectInst[]): Partial<Record<PartId, number>> {
    const need: Partial<Record<PartId, number>> = {};
    defects.filter(d => !d.resolved).forEach(d => {
      (Object.keys(d.cost) as PartId[]).forEach(p => { need[p] = (need[p] || 0) + (d.cost[p] || 0); });
    });
    return need;
  },
  costCoins(cost: Partial<Record<PartId, number>>): number {
    return (Object.keys(cost) as PartId[]).reduce((s, p) => s + (cost[p] || 0) * PARTS[p].price, 0);
  },
  canAfford(save: Save, cost: Partial<Record<PartId, number>>): boolean {
    return (Object.keys(cost) as PartId[]).every(p => (save.parts[p] || 0) >= (cost[p] || 0));
  },

  /* ---------- операции как единицы работы ---------- */
  buildOps(save: Save, lot: LotInst): OpView[] {
    const item = ITEMS_BY_ID[lot.itemId];
    const defects = lot.defects || [];
    const byOp = new Map<OpId, DefectInst[]>();
    defects.forEach(d => {
      if (d.resolved) return;
      const list = byOp.get(DEFECTS[d.id].op) || [];
      list.push(d);
      byOp.set(DEFECTS[d.id].op, list);
    });
    const ops: OpView[] = [];
    byOp.forEach((ds, opId) => {
      const op = OPS[opId];
      // суммарная стоимость операции (все нерешённые дефекты операции)
      const cost: Partial<Record<PartId, number>> = {};
      ds.forEach(d => (Object.keys(d.cost) as PartId[]).forEach(p => { cost[p] = (cost[p] || 0) + (d.cost[p] || 0); }));
      let lockedBy: string | undefined;
      if (opId === 'calibrate') {
        // блокируем, пока есть нерешённые дефекты, которые лечатся ОПЕРАЦИЕЙ repair
        // (broken_mech / consumable). Раньше условие смотрело на requiresOp==='repair',
        // что всегда истина для самого calibration → настройка была недоступна никогда.
        const repairPending = defects.some(d => !d.resolved && DEFECTS[d.id].op === 'repair');
        if (repairPending) lockedBy = 'сначала почините механизм';
      }
      ops.push({
        defects: ds, op: opId, name: op.name, verb: op.verb, minigame: op.minigame, desc: op.desc,
        cost, costCoins: RestorationSystem.costCoins(cost),
        affordable: RestorationSystem.canAfford(save, cost),
        lockedBy,
        done: false
      });
    });
    // порядок: сначала бесплатные/дешёвые, особая замена — последняя (драматургия)
    const order: OpId[] = ['clean', 'assemble', 'polish', 'repair', 'calibrate', 'replace'];
    ops.sort((a, b) => order.indexOf(a.op) - order.indexOf(b.op));
    void item;
    return ops;
  },

  /** списать запчасти под операцию */
  spendParts(save: Save, cost: Partial<Record<PartId, number>>): boolean {
    if (!RestorationSystem.canAfford(save, cost)) return false;
    (Object.keys(cost) as PartId[]).forEach(p => { save.parts[p] = (save.parts[p] || 0) - (cost[p] || 0); });
    save.stats.partsSpent = (save.stats.partsSpent || 0) + RestorationSystem.costCoins(cost);
    return true;
  },

  /** завершить операцию: дефекты решаются с качеством perf (0..1) */
  resolveOp(lot: LotInst, opView: OpView, perf: number) {
    const p = Math.max(0, Math.min(1, perf));
    opView.defects.forEach(d => { d.resolved = true; d.opq = p; });
  },

  /** итоговое качество после ручного прогона (пол = 0.35 как в прототипе) */
  manualQuality(lot: LotInst): number {
    const ds = lot.defects || [];
    if (!ds.length) return CONFIG.restore.autoQuality;
    return Math.max(RestorationSystem.qualityFor(ds), 0.35);
  },

  /** авто-реставрация (rewarded): решает всё, что можно решить имеющимися запчастями */
  autoRestore(save: Save, lot: LotInst): boolean {
    const ds = lot.defects || [];
    const ops = RestorationSystem.buildOps(save, lot);
    // проверяем полную доступность
    const need = RestorationSystem.partsNeeded(ds);
    if (!RestorationSystem.canAfford(save, need)) return false;
    ops.forEach(op => {
      RestorationSystem.spendParts(save, op.cost);
      RestorationSystem.resolveOp(lot, op, 1);
    });
    lot.q = CONFIG.restore.autoQuality;
    lot.autoRestore = true;
    return true;
  },

  /** быстрая обтирка хлама: q = quickQuality без запчастей */
  quickWipe(lot: LotInst) {
    (lot.defects || []).forEach(d => { d.resolved = true; d.opq = CONFIG.restore.quickQuality; });
    lot.q = CONFIG.restore.quickQuality;
    lot.strategy = 'quick';
  },

  /** «продать как есть»: качество 0 */
  asIs(lot: LotInst) {
    lot.q = 0;
    lot.strategy = 'asis';
  },

  /* ---------- запчасти / доноры ---------- */
  disassembleYield(item: ItemDef): Partial<Record<PartId, number>> {
    return item.yieldParts || {};
  },

  /** ассортимент особых деталей магазина на сегодня (детерминированно по дню) */
  shopSpecialsToday(day: number): PartId[] {
    const specials = (Object.keys(PARTS) as PartId[]).filter(p => PARTS[p].special);
    const rnd = mulberry32(day * 7919 + 13);
    const out: PartId[] = [];
    const n = CONFIG.partsShop.specialsPerDay;
    const pool = [...specials];
    for (let i = 0; i < n && pool.length; i++) {
      out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    }
    return out;
  }
};
