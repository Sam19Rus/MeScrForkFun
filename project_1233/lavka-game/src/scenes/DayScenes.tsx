/* DayScenes.tsx — интро (день 1) и итоги дня. */
import React from 'react';
import { game } from '../app/store';
import { Btn } from '../components/ui/Basics';
import { CONFIG } from '../game/data/config';

export function IntroScene() {
  return (
    <div className="scene intro-scene">
      <div className="intro-card">
        <h2>Лавка 2.0: Аукцион</h2>
        <p>Вам досталась лавка дяди Августина: пыльные стеллажи, долговая книга и репутация «того самого места, где находят чудеса».</p>
        <p>Утром в дверь постучали. Иванычу срочно нужна ретротехника — и он готов платить втрое.</p>
        <p><b>План на день прост:</b> в городе высмотреть аукцион, выторговать лот подешевле, привести находку в порядок на верстаке — и отдать тому, кто заплатит больше.</p>
      </div>
      <div style={{ marginTop: 18 }}>
        <Btn big variant="gold" onClick={() => game.introDone()}>Открыть лавку</Btn>
      </div>
      <div className="hint" style={{ marginTop: 14 }}>{CONFIG.meta.name} · vertical slice {CONFIG.meta.version}</div>
    </div>
  );
}

export function DayResultScene() {
  const s = game.getSnapshot();
  const r = s.dayResult!;
  const save = s.save;
  return (
    <div className="scene result-scene">
      <div className="item-card-big day-summary">
        <div className="title" style={{ color: 'var(--paper)' }}>День {save.day} закрыт</div>
        <div className={`big-num ${r.profit >= 0 ? 'delta-plus' : ''}`}>{r.profit >= 0 ? '+' : ''}{r.profit} ₽</div>
        <div className="stat-line">
          Выиграно лотов: {s.day ? s.day.wins : 0} · ушло соперникам: {s.day ? s.day.losses : 0}<br />
          {r.acc != null ? <>Точность оценок дня: {r.acc}% ({r.ok}/{r.n})<br /></> : null}
          Всего заказов выполнено: {save.stats.ordersDone} · баланс: {save.coins} ₽
        </div>
        {r.hint && <div className="hint" style={{ marginTop: 8 }}>{r.hint}</div>}
        <div className="btn-row" style={{ marginTop: 14 }}>
          <Btn big variant="gold" onClick={() => game.endDay()}>🌙 Спать → новый день</Btn>
        </div>
      </div>
    </div>
  );
}
