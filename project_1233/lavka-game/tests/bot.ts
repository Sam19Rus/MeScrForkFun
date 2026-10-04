/* bot.ts — хелперы headless-прогона контроллера (тесты и симуляции). */
import { game } from '../src/app/store';
import { ITEMS_BY_ID } from '../src/game/data/items';
import { OrdersSystem } from '../src/game/systems/orders';

export async function waitFor(cond: () => boolean, timeout = 15000, msg = 'waitFor'): Promise<void> {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > timeout) throw new Error('timeout: ' + msg + ' | phase=' + game.getSnapshot().phase);
    await new Promise(r => setTimeout(r, 4));
  }
}

export const snap = () => game.getSnapshot();

/** сыграть торги дня до dayResult по политике: bidCap — максимум за лот (0 = пас) */
export async function playAuction(bidCapFor: (lotId: string) => number): Promise<void> {
  await waitFor(() => ['bidding', 'unbox', 'loss', 'dayResult', 'deal', 'workbench'].includes(snap().phase), 15000, 'auction start');
  let guard = 0;
  while (guard++ < 800) {
    const s = snap();
    if (s.phase === 'dayResult') return;
    if (s.phase === 'bidding' && s.auction) {
      if (s.auction.resolved) { await waitFor(() => snap().phase !== 'bidding', 15000, 'post-resolve'); continue; }
      if (s.auction.playerTurn) {
        const cap = bidCapFor(s.lot!.id);
        if (!s.auction.isLeader && cap >= s.auction.nextPrice) game.playerBid();
        else game.playerPass();
        await new Promise(r => setTimeout(r, 2));
        continue;
      }
    }
    if (s.phase === 'unbox') { game.unboxContinue(); await waitFor(() => snap().phase === 'workbench'); continue; }
    if (s.phase === 'workbench') { await playWorkbench(); continue; }
    if (s.phase === 'appraisal') { game.appraisalContinue(); await waitFor(() => snap().phase === 'decision'); continue; }
    if (s.phase === 'decision') { playDecision(); await waitFor(() => ['deal', 'bidding', 'loss', 'dayResult'].includes(snap().phase)); continue; }
    if (s.phase === 'deal') { game.dealContinue(); await new Promise(r => setTimeout(r, 3)); continue; }
    if (s.phase === 'loss') { game.lossContinue(); await new Promise(r => setTimeout(r, 3)); continue; }
    await new Promise(r => setTimeout(r, 4));
  }
  throw new Error('playAuction guard');
}

/** реставрация: решить все доступные операции (perf 0.95), хлам — быстрая обтирка */
export async function playWorkbench(): Promise<void> {
  const s = snap();
  const item = ITEMS_BY_ID[s.lot!.itemId];
  if (item.value[1] <= 30) {
    game.quickWipe();
    await waitFor(() => snap().phase === 'appraisal');
    return;
  }
  let guard = 0;
  while (guard++ < 24) {
    const ops = snap().workbenchOps || [];
    const op = ops.find(o => o.affordable && !o.lockedBy);
    if (!op) break;
    if (!game.startOp(op)) break;
    game.finishOp(0.95);
  }
  game.finishRestore();
  await waitFor(() => snap().phase === 'appraisal');
}

/** решение: заказ > донор(разборка) > NPC-оффер > продать */
export function playDecision(): void {
  const s = snap();
  const item = ITEMS_BY_ID[s.lot!.itemId];
  if (game.isDup()) { game.decideSellDup(); return; }
  const ord = OrdersSystem.matching(s.save, item);
  if (ord) { game.decideOrder(ord.id); return; }
  if (item.donor) { game.decideDisassemble(); return; }
  if (s.buyerOffer) { game.decideNpcOffer(); return; }
  game.decideSell();
}
