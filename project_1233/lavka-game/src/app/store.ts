/* store.ts — синглтон контроллера + React-подписка через useSyncExternalStore.
   Геймплейная логика живёт в GameController (чистый TS, headless-тестируемый),
   React-компоненты только читают снапшот и вызывают действия. */
import { useSyncExternalStore } from 'react';
import { GameController, type Snapshot } from '../game/director/GameController';

export const game = new GameController();

export function useGame(): Snapshot {
  return useSyncExternalStore(game.subscribe, game.getSnapshot, game.getSnapshot);
}
