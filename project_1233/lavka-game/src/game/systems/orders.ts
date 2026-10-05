/* orders.ts — OrdersSystem: доска заказов. Порт 1-в-1 из lavka2-vp/js/systems.js. */
import { CONFIG } from '../data/config';
import { CATS } from '../data/world';
import { ORDER_TEMPLATES } from '../data/orders';
import { ITEMS_BY_ID } from '../data/items';
import { Goals } from './goals';
import type { Order, OrderTemplate, ItemDef, Save } from '../types';

const FLAVORS = [
  'Кстати, вещь должна быть с историей.', 'Заберу сам, я рядом живу.', 'Ищу это уже третий месяц.',
  'Если состояние хорошее — накину сверху.', 'Хлам не предлагать.', 'Сроки поджимают, по-настоящему.'
];

export const OrdersSystem = {
  rollOne(save: Save, rnd: () => number, excludeIds: string[]): OrderTemplate | undefined {
    const active = (save.orders || []).map(o => o.id);
    const pool = ORDER_TEMPLATES.filter(t =>
      !excludeIds.includes(t.id) && !active.includes(t.id) &&
      !(t.notWith && t.notWith.some(x => active.includes(x))));
    return pool[Math.floor(rnd() * pool.length)];
  },
  instantiate(tpl: OrderTemplate, day: number, extraDays: number): Order {
    const d = tpl.days + (extraDays || 0);
    const flavor = tpl.id === 'ftue' ? '' : ' ' + FLAVORS[Math.floor(Math.random() * FLAVORS.length)];
    return {
      id: tpl.id, who: tpl.who, whoDat: tpl.whoDat || tpl.who, face: tpl.face,
      want: tpl.want, mult: tpl.mult, text: tpl.text + flavor, deadline: day + d, days: d
    };
  },
  ensureBoard(save: Save, rnd: () => number) {
    save.orders = save.orders || [];
    const slots = Goals.orderSlots(save);
    const extra = (save.fixtures || []).includes('cuckoo') ? 1 : 0;
    while (save.orders.length < slots) {
      const tpl = OrdersSystem.rollOne(save, rnd, save.orders.map(o => o.id));
      if (!tpl) break;
      save.orders.push(OrdersSystem.instantiate(tpl, save.day, extra));
    }
  },
  matching(save: Save, item: ItemDef): Order | null {
    const orders = save.orders || [];
    const matches = orders.filter(o =>
      (o.want.item && o.want.item === item.id) ||
      (o.want.cat && o.want.cat === item.cat) ||
      (o.want.rarity && item.rarity === o.want.rarity) ||
      (o.want.rarity === 'epic' && item.rarity === 'legend'));
    const score = (o: Order) => (o.want.item ? 3 : o.want.cat ? 2 : 1);
    matches.sort((a, b) => score(b) - score(a));
    return matches[0] || null;
  },
  complete(save: Save, orderId: string) {
    save.orders = (save.orders || []).filter(o => o.id !== orderId);
    save.stats.ordersDone = (save.stats.ordersDone || 0) + 1;
  },
  tickDay(save: Save): Order[] {
    const expired: Order[] = [];
    save.orders = (save.orders || []).filter(o => {
      if (o.id === 'ftue') return save.day < 2; // FTUE-заказ живёт до конца дня 2
      if (save.day > o.deadline) { expired.push(o); return false; }
      return true;
    });
    return expired;
  },
  wantLabel(want: Order['want']): string {
    if (want.item) return ITEMS_BY_ID[want.item].name;
    if (want.cat) return `любое: ${CATS[want.cat].name}`;
    if (want.rarity) return `редкость: ${CONFIG.rarityLabels[want.rarity] || want.rarity}`;
    return '?';
  }
};
