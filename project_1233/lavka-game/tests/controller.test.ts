/* controller.test.ts — headless-смоук полного FTUE-дня через GameController
   (аналог lavka2-vp/tests/smoke_game.js, но без DOM: движок и контроллер headless-safe). */
import { describe, it, expect, beforeAll } from 'vitest';
import { game, } from '../src/app/store';
import { snap, waitFor, playAuction } from './bot';
import { Telemetry } from '../src/game/telemetry';
import { CONFIG } from '../src/game/data/config';
import { SDK } from '../src/game/sdk';
import * as E from '../src/game/economy';

beforeAll(async () => {
  await SDK.clearSave();
});

describe('FTUE-день 1 от интро до дня 2', () => {
  it('полный цикл: интро → лавка → город → склад → торги → верстак → заказ → итоги → день 2', async () => {
    await game.start({ speed: 0, dev: false });
    expect(snap().phase).toBe('intro');

    game.introDone();
    expect(snap().phase).toBe('shop');
    // FTUE-заказ Иваныча на доске
    expect(snap().save.orders.some(o => o.id === 'ftue')).toBeTruthy();
    // дивиденд начислен (день 1)
    expect(snap().save.lastDivDay).toBe(1);

    game.goToCity();
    expect(snap().phase).toBe('city');

    game.enterBuilding('city_warehouse');
    await waitFor(() => snap().phase === 'hall');
    expect(snap().day!.lots.length).toBe(4); // FTUE: 4 скриптованных лота
    expect(snap().day!.lots[0].itemId).toBe('phone');
    expect(snap().day!.ftue).toBe(true);

    // телеметрия: аукцион стартовал, FTUE-шаг
    expect(Telemetry.buffer().some(e => e.event === 'auction_started')).toBeTruthy();
    expect(Telemetry.buffer().some(e => e.event === 'ftue_step' && (e.params as any).step === 'day1_start')).toBeTruthy();

    // оценка лота до торгов (как настоящий игрок): телефон ≈ 81 ₽ → полоса 0–200
    game.openLotModal(0);
    game.submitEstimate(E.bandOf(81));
    expect(snap().day!.lots[0].estimated).toBe(true);

    // торги: бьёмся только за первый лот (телефон) до 60 ₽ — кэп Зинаиды ниже
    game.startBidding();
    await playAuction(lotId => (lotId === 'ftue_l0' ? 80 : 0));

    // к этому моменту день доигран до итогов
    expect(snap().phase).toBe('dayResult');

    const events = Telemetry.buffer().map(e => e.event);
    // ключевые события цикла
    expect(events).toContain('bid_started');
    expect(events).toContain('auction_won');
    expect(events).toContain('item_revealed');
    expect(events).toContain('item_restored');
    expect(events).toContain('goal_completed');
    expect(events).toContain('estimate_resolved');
    expect(events).toContain('day_end');
    const won = Telemetry.buffer().find(e => e.event === 'auction_won')!;
    expect((won.params as any).motivated).toBe(true); // заказ Иваныча
    const dec = Telemetry.buffer().find(e => e.event === 'decision')!;
    expect((dec.params as any).choice).toBe('order');
    expect((dec.params as any).motivation).toBe('order');

    // экономика: заказ телефон×2.2 закрыт, монеты сошлись
    const save = snap().save;
    expect(save.stats.ordersDone).toBeGreaterThanOrEqual(1);
    expect(save.ftue.done).toBe(true);

    // итоги дня и переход на день 2
    game.endDay();
    expect(snap().phase).toBe('shop');
    expect(snap().save.day).toBe(2);
    // доска заказов пополнена до 3 слотов
    expect(snap().save.orders.length).toBe(CONFIG.shop[1].orders);
  }, 40000);

  it('сохранение загружается (refresh-safe)', async () => {
    const raw = await SDK.load();
    expect(raw).toBeTruthy();
    expect(raw.v).toBe(3);
    expect(raw.day).toBe(2);
    expect(raw.parts).toBeTruthy();
  });
});
