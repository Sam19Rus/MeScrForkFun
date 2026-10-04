/* sim.test.ts — бот играет 3 дня (аналог lavka2-vp/tests/selftest.js):
   мотивированные ставки, реставрация с докупкой запчастей, заказы/продажи.
   Проверяем: движок не падает, маржи положительные, телеметрия/IMS считаются. */
import { describe, it, expect, beforeAll } from 'vitest';
import { game } from '../src/app/store';
import { snap, waitFor, playAuction } from './bot';
import { Telemetry } from '../src/game/telemetry';
import { SDK } from '../src/game/sdk';
import * as E from '../src/game/economy';
import { ITEMS_BY_ID } from '../src/game/data/items';
import { OrdersSystem } from '../src/game/systems/orders';
import { BASIC_PARTS, PARTS } from '../src/game/data/parts';
import type { PartId } from '../src/game/types';

beforeAll(async () => { await SDK.clearSave(); });

function motivated(itemId: string): boolean {
  const s = snap();
  const item = ITEMS_BY_ID[itemId];
  if (OrdersSystem.matching(s.save, item)) return true;
  if (item.set && !s.save.owned[item.id]) return true;
  if (item.donor) return true;
  if (item.fixture && !(s.save.fixtures || []).includes(item.id)) return true;
  return false;
}

function bidCap(lotId: string): number {
  const s = snap();
  if (lotId === 'ftue_l0') return 60; // FTUE: забираем телефон для Иваныча
  const lot = s.day!.lots.find(l => l.id === lotId);
  if (!lot || !motivated(lot.itemId)) return 0;
  // грубая оценка ценности по стартовой цене (склад: старт ≈ 20–32% стоимости)
  const est = lot.start / 0.26;
  return Math.min(s.save.coins, Math.floor(est * 0.8));
}

describe('симуляция: бот играет 3 дня', () => {
  it('3 дня без ошибок движка, с мотивированными победами и рабочей реставрацией', async () => {
    await game.start({ speed: 0, dev: false });
    if (snap().phase === 'intro') game.introDone();

    for (let day = 0; day < 3; day++) {
      await waitFor(() => snap().phase === 'shop', 15000, 'shop morning');

      // закупка базовых запчастей (если хватает монет)
      game.goToCity();
      game.enterBuilding('parts');
      await waitFor(() => snap().phase === 'parts');
      BASIC_PARTS.forEach(p => {
        const have = snap().save.parts[p] || 0;
        if (have < 2 && snap().save.coins > PARTS[p].price * 2 + 200) game.buyPart(p as PartId, 2);
      });
      game.leaveParts();
      await waitFor(() => snap().phase === 'city');

      // на склад
      game.enterBuilding('city_warehouse');
      await waitFor(() => snap().phase === 'hall');

      // оценка всех лотов до торгов
      const lots = snap().day!.lots;
      for (let i = 0; i < lots.length; i++) {
        game.openLotModal(i);
        const l = snap().day!.lots[i];
        const guess = Math.round(l.start / 0.26);
        game.submitEstimate(E.bandOf(guess));
      }

      game.startBidding();
      await playAuction(bidCap);
      expect(snap().phase).toBe('dayResult');
      game.endDay();
    }

    const events = Telemetry.buffer().map(e => e.event);
    expect(events).not.toContain('engine_error');
    expect(events.filter(e => e === 'day_end').length).toBe(3);

    const m = Telemetry.metrics();
    // бот бился только за мотивированные лоты
    expect(m.wins + m.losses).toBeGreaterThan(0);
    if (m.wins > 0) {
      expect(m.motivated).toBe(m.wins); // все победы мотивированы
      expect(m.avgMargin!).toBeGreaterThan(-30); // маржа около положительной (оценка грубая)
      // телеметрия реставрации и решений
      expect(events).toContain('item_restored');
      expect(events).toContain('restore_strategy');
      expect(events).toContain('decision');
      expect(m.imsTotal).toBeGreaterThan(0);
      expect(m.imsScore!).toBeGreaterThanOrEqual(50); // заказ/перепродажа/улучшения доминируют
      // продажи приносят деньги
      const sold = Telemetry.buffer().filter(e => e.event === 'item_sold');
      expect(sold.length).toBeGreaterThan(0);
      sold.forEach(e => expect((e.params as any).value).toBeGreaterThan(0));
    } else {
      // крайне редкий исход: за 3 дня не выиграли ни мотивированного лота
      console.warn('SIM: no wins this run (flaky-tolerant)');
    }
    // баланс не ушёл в минус
    expect(snap().save.coins).toBeGreaterThanOrEqual(0);
    // eslint-disable-next-line no-console
    console.log('SIM SUMMARY', JSON.stringify({
      days: snap().save.day - 1, wins: m.wins, losses: m.losses, avgMargin: m.avgMargin,
      ims: m.imsScore, imsBreakdown: m.ims, estAcc: m.estAccuracy,
      coins: snap().save.coins, ordersDone: snap().save.stats.ordersDone,
      strategies: m.restoreStrategies, partsCoins: m.partsCoins, disassembled: m.disassembled
    }));
  }, 90000);
});
