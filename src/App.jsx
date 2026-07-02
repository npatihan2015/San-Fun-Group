import { useState, useCallback } from "react";
import TwelveNumbers from "./games/twelve-numbers/TwelveNumbers";

// ─── Central Hub Component ───────────────────────────────────────────────────

export default function App() {
  const [activeGame, setActiveGame] = useState(null);

  const launchGame = useCallback((gameId) => {
    // Basic click sound for hub
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(600, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.05, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.1);
    } catch (e) { /* ignore */ }
    
    setActiveGame(gameId);
  }, []);

  if (activeGame === 'icebreaker' || activeGame === 'seat') {
    return <TwelveNumbers initialMode={activeGame} onBackToHub={() => setActiveGame(null)} />;
  }

  // HUB UI
  return (
    <div className="hub-shell">
      <header className="hub-header">
        <div className="hub-logo">
          <div className="hub-logo-dot" />
          <span>San Fun Group</span>
        </div>
      </header>

      <main className="hub-main">
        <div className="hub-hero">
          <h1 className="hub-title">Mini Game <span className="hub-title-accent">Hub.</span></h1>
          <p className="hub-desc">
            A growing collection of team-building games, icebreakers, and randomisers for San Fun Group.
          </p>
        </div>

        <div className="hub-grid">
          {/* Game 1: Icebreakers */}
          <button 
            type="button" 
            className="hub-game-card game-twelve"
            onClick={() => launchGame('icebreaker')}
          >
            <div className="hub-card-shine" aria-hidden="true" />
            <span className="hub-game-badge">TEAM</span>
            <div className="hub-game-icon">💬</div>
            <h2 className="hub-game-title">Icebreakers</h2>
            <p className="hub-game-desc">
              12 prompts — questions, dares, and deep-dives that get people talking.
            </p>
            <span className="hub-game-cta">Play Game →</span>
          </button>
          
          {/* Game 2: Seat Selector */}
          <button 
            type="button" 
            className="hub-game-card game-seat"
            onClick={() => launchGame('seat')}
          >
            <div className="hub-card-shine" aria-hidden="true" />
            <span className="hub-game-badge" style={{color: '#efb071', background: 'rgba(239,176,113,0.12)', borderColor: 'rgba(239,176,113,0.3)'}}>RANDOM</span>
            <div className="hub-game-icon">🪑</div>
            <h2 className="hub-game-title">Seat Selector</h2>
            <p className="hub-game-desc">
              No debates, pure luck — everyone taps to get their random seat number.
            </p>
            <span className="hub-game-cta">Play Game →</span>
          </button>

          {/* Placeholder for future games */}
          <div className="hub-game-card game-coming-soon">
            <div className="hub-game-icon">⏳</div>
            <h2 className="hub-game-title">Coming Soon</h2>
            <p className="hub-game-desc">
              More mini-games will be added here in the future without breaking the hub.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
