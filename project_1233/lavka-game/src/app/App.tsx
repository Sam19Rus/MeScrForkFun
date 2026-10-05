/* App.tsx — корень: бут контроллера, роутинг фаз, переходы, тосты, dev-панель. */
import React, { useEffect } from 'react';
import { game, useGame } from './store';
import { TopBar } from '../components/ui/TopBar';
import { Toasts } from '../components/ui/Basics';
import { DevPanel } from '../components/dev/DevPanel';
import { ShopScene, AlbumScene } from '../scenes/ShopScene';
import { CityScene, PartsScene } from '../scenes/CityScene';
import { HallScene, BiddingScene, LossScene } from '../scenes/AuctionScenes';
import { UnboxScene, WorkbenchScene, AppraisalScene, DecisionScene, DealScene } from '../scenes/ItemScenes';
import { IntroScene, DayResultScene } from '../scenes/DayScenes';
import { ArtGlobalDefs, ArtMaterialDefs } from '../art/core';

function SceneRouter({ phase }: { phase: string }) {
  switch (phase) {
    case 'intro': return <IntroScene />;
    case 'shop': return <ShopScene />;
    case 'city': return <CityScene />;
    case 'parts': return <PartsScene />;
    case 'hall': return <HallScene />;
    case 'bidding': return <BiddingScene />;
    case 'unbox': return <UnboxScene />;
    case 'workbench': return <WorkbenchScene />;
    case 'appraisal': return <AppraisalScene />;
    case 'decision': return <DecisionScene />;
    case 'deal': return <DealScene />;
    case 'loss': return <LossScene />;
    case 'dayResult': return <DayResultScene />;
    case 'album': return <AlbumScene />;
    default: return null;
  }
}

export default function App() {
  const s = useGame();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dev = params.get('dev') === '1';
    const fast = params.get('speed') === 'fast';
    if (dev) (window as any).game = game; // dev-доступ к контроллеру (тесты/отладка)
    game.start({ speed: fast ? 40 : 550, dev });
    const onHide = () => game.persist();
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, []);

  return (
    <div className="app">
      <ArtGlobalDefs />
      <ArtMaterialDefs />
      <TopBar />
      <div className="scene-wrap">
        <SceneRouter key={s.phase} phase={s.phase} />
      </div>
      <Toasts toasts={s.toasts} />
      {s.dev && <DevPanel />}
    </div>
  );
}
