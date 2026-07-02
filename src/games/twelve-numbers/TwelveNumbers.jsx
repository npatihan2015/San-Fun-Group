import { useState, useCallback, useEffect, useRef } from "react";
import "./TwelveNumbers.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL = 12;

function shuffledBag(count) {
  const nums = Array.from({ length: count }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

const DEFAULTS = {
  workplace: [
    "What's your most unusual remote work or office habit?",
    "If you could swap jobs with anyone on the team for a day, who & why?",
    "What's the best advice you've ever gotten from a coworker?",
    "What's your go-to hack when you're totally stuck at work?",
    "If our team were an animal, what would we be and why?",
    "Share a project or win you felt genuinely proud of recently.",
    "What was your very first job and what did it teach you?",
    "If you could add one perk to our workplace, what would it be?",
    "What's your favourite way to unwind after a busy week?",
    "Who's someone on the team you want to thank right now — and why?",
    "If you had to teach a 10-minute class on anything, what would it be?",
    "What skill do you want to master in the next 12 months?",
  ],
  silly: [
    "Do a 5-second drumroll on your desk or knees — go!",
    "Invent a new, wildly over-the-top job title for yourself.",
    "Sketch a quick caricature of the person to your left.",
    "Tell your corniest dad joke. The group rates it 1–5.",
    "Zombie apocalypse — 2 people in this room are your crew. Who?",
    "Speak in a posh accent for the rest of your turn.",
    "Show the most random photo in your recent camera roll.",
    "Name a weird food combo you swear is actually delicious.",
    "If your current mood were a sound effect, what would it be?",
    "High-five three different people in the next 10 seconds.",
    "If you were a superhero, what would your most useless power be?",
    "Do your best dramatic impression of a winning sports moment.",
  ],
  deep: [
    "Name one quality you genuinely admire about the person on your right.",
    "Share a rule or boundary that has genuinely improved your life.",
    "Name a book, film, or song that completely shifted how you think.",
    "What are you most grateful for in your life right now?",
    "When did you fail at something and later feel glad it happened?",
    "What does success look like to you in this current chapter?",
    "What's a goal or dream you've been keeping to yourself lately?",
    "What piece of wisdom would you give your younger self?",
    "How do you prefer to receive appreciation from others?",
    "What instantly makes you feel energised or alive?",
    "Share a challenge you've recently overcome that made you stronger.",
    "If you could have dinner with anyone from history, who would it be?",
  ],
  custom: Array.from({ length: TOTAL }, (_, i) => `Custom Prompt ${i + 1} — tap 'Edit Prompts' to change this!`),
};

const CATEGORY_META = {
  workplace: { icon: "💼", label: "Workplace",       color: "#4a90d9", badge: "PRO"     },
  silly:     { icon: "🎭", label: "Creative & Silly", color: "#e07b3a", badge: "FUN"     },
  deep:      { icon: "❤️", label: "Deep Connections", color: "#c05b8a", badge: "HEART"  },
  custom:    { icon: "⚙️", label: "Custom",           color: "#5aab6d", badge: "YOURS"  },
};

// ─── Audio ────────────────────────────────────────────────────────────────────

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const tone = (freq, start, dur, waveType = "sine", vol = 0.1) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = waveType;
      o.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(vol, start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      o.start(start); o.stop(start + dur);
    };
    if (type === "tap") {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(700, now);
      o.frequency.exponentialRampToValueAtTime(300, now + 0.07);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      o.start(now); o.stop(now + 0.07);
    } else if (type === "reveal") {
      tone(330, now, 0.06, "square", 0.05);
      tone(523.25, now + 0.05, 0.12, "triangle", 0.09);
      tone(783.99, now + 0.12, 0.22, "triangle", 0.11);
    } else if (type === "success") {
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) => tone(f, now + i * 0.09, 0.5, "triangle", 0.09));
    } else if (type === "pass") {
      tone(400, now, 0.08, "sine", 0.05);
      tone(500, now + 0.06, 0.1, "sine", 0.06);
    }
  } catch (e) { /* silent fail */ }
}

// ─── Confetti Component ───────────────────────────────────────────────────────

function Confetti() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    // SF brand palette: amber, charcoal, white
    const colors = ["#efb071", "#313d41", "#ffffff", "#d4875a", "#f5c98a", "#7a8f95"];
    const pieces = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: 6 + Math.random() * 8,
      h: 10 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.12,
      spd: 2.5 + Math.random() * 3.5,
      swingAmp: 40 + Math.random() * 60,
      swingFreq: 0.008 + Math.random() * 0.012,
      t: Math.random() * 100,
    }));
    let raf;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.t += 1;
        p.y += p.spd;
        p.rot += p.rotSpd;
        const x = p.x + Math.sin(p.t * p.swingFreq) * p.swingAmp;
        ctx.save();
        ctx.translate(x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />;
}

// ─── Tap Ripple Component ─────────────────────────────────────────────────────

function TapRipple({ trigger }) {
  const [ripples, setRipples] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const id = Date.now();
    setRipples(r => [...r, { id, x: "50%", y: "50%" }]);
    const t = setTimeout(() => setRipples(r => r.filter(x => x.id !== id)), 800);
    return () => clearTimeout(t);
  }, [trigger]);
  return (
    <div className="ripple-layer" aria-hidden="true">
      {ripples.map(r => (
        <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }} />
      ))}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const IconVolume = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);
const IconMuted = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v6a3 3 0 0 0 3 3h1.586l4.707 4.707A1 1 0 0 0 20 22V4a1 1 0 0 0-1.707-.707L13.586 8H12a3 3 0 0 0-3 1z" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TwelveNumbers({ initialMode, onBackToHub }) {
  const [screen, setScreen]           = useState("setup");
  const [gameMode, setGameMode]       = useState(initialMode);
  const [seatCount, setSeatCount]     = useState(12);
  const [category, setCategory]       = useState("workplace");
  const [promptsMap, setPromptsMap]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("twelve_prompts")) || DEFAULTS; }
    catch { return DEFAULTS; }
  });
  const [editingPrompts, setEditingPrompts] = useState(false);
  const [bag, setBag]                 = useState([]);
  const [drawn, setDrawn]             = useState([]);
  const [current, setCurrent]         = useState(null);
  const [subPhase, setSubPhase]       = useState("pass");
  const [rippleTick, setRippleTick]   = useState(0);
  const [isMuted, setIsMuted]         = useState(() => {
    try { return JSON.parse(localStorage.getItem("twelve_muted")) || false; }
    catch { return false; }
  });

  const sfx = useCallback((type) => { if (!isMuted) playSound(type); }, [isMuted]);
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const v = !prev;
      localStorage.setItem("twelve_muted", JSON.stringify(v));
      return v;
    });
  }, []);

  const handleBackToHub = useCallback(() => {
    sfx("tap");
    if (onBackToHub) onBackToHub();
  }, [sfx, onBackToHub]);

  const startGame = useCallback(() => {
    sfx("tap");
    const count = gameMode === "icebreaker" ? TOTAL : seatCount;
    setBag(shuffledBag(count));
    setDrawn([]); setCurrent(null);
    setSubPhase("pass");
    setScreen("gameplay");
  }, [sfx, gameMode, seatCount]);

  const handleRevealNext = useCallback(() => {
    setRippleTick(t => t + 1);
    if (bag.length === 0) { sfx("success"); setScreen("done"); return; }
    sfx("reveal");
    const [next, ...rest] = bag;
    setCurrent(next); setDrawn(d => [...d, next]); setBag(rest);
    setSubPhase("show");
  }, [bag, sfx]);

  const handleProceedNext = useCallback(() => {
    setRippleTick(t => t + 1);
    if (bag.length === 0) { sfx("success"); setScreen("done"); return; }
    sfx("pass");
    setSubPhase("pass");
  }, [bag, sfx]);

  const handleEditPrompt = useCallback((idx, val) => {
    setPromptsMap(prev => {
      const updated = { ...prev, [category]: prev[category].map((p, i) => i === idx ? val : p) };
      localStorage.setItem("twelve_prompts", JSON.stringify(updated));
      return updated;
    });
  }, [category]);

  const activePrompts = promptsMap[category] || DEFAULTS[category];
  const totalRounds   = gameMode === "icebreaker" ? TOTAL : seatCount;
  const currentPrompt = current !== null ? activePrompts[current - 1] : "";
  const progress      = totalRounds > 0 ? (drawn.length / totalRounds) * 100 : 0;
  const catMeta       = CATEGORY_META[category];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="game-twelve-numbers">

      {/* ── Top bar ── */}
      <header className="top-bar">
        <button type="button" className="nav-back" onClick={handleBackToHub} aria-label="Back to Hub">
          <IconArrowLeft />
          <span>Mini Games Hub</span>
        </button>
        
        {/* Progress bar only during gameplay */}
        {screen === "gameplay" ? (
          <div className="top-progress-wrap" aria-label={`${drawn.length} of ${totalRounds}`}>
            <div className="top-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        ) : (
          <div style={{flex: 1}}></div>
        )}
        <button type="button" className="icon-btn" onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <IconMuted /> : <IconVolume />}
        </button>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          SETUP SCREEN
      ══════════════════════════════════════════════════════════════ */}
      {screen === "setup" && (
        <main className="screen setup-screen" id="setup-screen">
          {gameMode === "icebreaker" ? (
            <>
              <div className="setup-header">
                <div className="setup-mode-tag">💬 Icebreakers</div>
                <h2 className="setup-title">Pick your vibe</h2>
                <p className="setup-desc">Each category unlocks 12 unique prompts for your group.</p>
              </div>

              <div className="category-grid" role="radiogroup" aria-label="Prompt category">
                {Object.entries(CATEGORY_META).map(([key, { icon, label, color, badge }]) => (
                  <button
                    key={key}
                    type="button"
                    id={`cat-${key}`}
                    role="radio"
                    aria-checked={category === key}
                    className={`category-card ${category === key ? "selected" : ""}`}
                    style={{ "--cat-color": color }}
                    onClick={() => { sfx("tap"); setCategory(key); }}
                  >
                    <span className="cat-badge">{badge}</span>
                    <span className="cat-icon">{icon}</span>
                    <span className="category-title">{label}</span>
                    <span className="category-desc">
                      {DEFAULTS[key]?.length ?? 12} prompts ready
                    </span>
                    {category === key && <span className="cat-check">✓</span>}
                  </button>
                ))}
              </div>

              {/* Selected preview */}
              <div className="category-preview">
                <span className="preview-label">Preview prompt</span>
                <p className="preview-text">"{DEFAULTS[category]?.[0]}"</p>
              </div>

              <div className="setup-actions">
                <button type="button" id="btn-customize" className="btn-ghost" onClick={() => { sfx("tap"); setEditingPrompts(true); }}>
                  ✏️ Edit Prompts
                </button>
                <button type="button" id="btn-start" className="btn btn-launch" onClick={startGame}>
                  🚀 Launch Game
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="setup-header">
                <div className="setup-mode-tag">🪑 Seat Selector</div>
                <h2 className="setup-title">How many seats?</h2>
                <p className="setup-desc">Set the total and everyone taps for their unique random number.</p>
              </div>

              <div className="stepper-card">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => { sfx("tap"); setSeatCount(c => Math.max(2, c - 1)); }}
                  disabled={seatCount <= 2}
                  aria-label="Decrease"
                >−</button>
                <div className="stepper-center">
                  <span className="stepper-value" aria-live="polite">{seatCount}</span>
                  <span className="stepper-label">seats</span>
                </div>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => { sfx("tap"); setSeatCount(c => Math.min(30, c + 1)); }}
                  disabled={seatCount >= 30}
                  aria-label="Increase"
                >+</button>
              </div>

              <button type="button" id="btn-start-seat" className="btn btn-launch" onClick={startGame}>
                🚀 Start Selection
              </button>
            </>
          )}
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════
          GAMEPLAY SCREEN
      ══════════════════════════════════════════════════════════════ */}
      {screen === "gameplay" && (
        <div
          className={`screen gameplay-screen${subPhase === "pass" ? " phase-pass" : " phase-show"}`}
          id="gameplay-screen"
          onClick={subPhase === "pass" ? handleRevealNext : handleProceedNext}
        >
          <TapRipple trigger={rippleTick} />

          {/* Round counter chips */}
          <div className="round-chips" aria-label={`${drawn.length} of ${totalRounds} shown`}>
            {Array.from({ length: totalRounds }, (_, i) => (
              <div
                key={i}
                className={`chip${drawn.includes(i + 1) ? " chip-done" : ""}${i + 1 === current && subPhase === "show" ? " chip-current" : ""}`}
              />
            ))}
          </div>

          {/* Pass phase */}
          {subPhase === "pass" && (
            <div className="pass-container" id="pass-state">
              <div className="pass-orb">
                <span className="pass-orb-icon">{gameMode === "icebreaker" ? "👉" : "🪑"}</span>
              </div>
              <h2 className="pass-title">
                {drawn.length === 0 ? "Pass to player 1" : `Player ${drawn.length + 1}'s turn`}
              </h2>
              <p className="pass-round-info">
                Round <strong>{drawn.length + 1}</strong> of <strong>{totalRounds}</strong>
              </p>
              <div className="tap-cta">
                <span className="tap-pulse" aria-hidden="true" />
                Tap to reveal
              </div>
            </div>
          )}

          {/* Reveal phase */}
          {subPhase === "show" && (
            <div className="reveal-container" id="reveal-state">
              <div className="number-wrap">
                <div className="number-glow" aria-hidden="true" />
                <div className="number-display" key={current}>{current}</div>
              </div>

              <div className="prompt-card">
                {gameMode === "icebreaker" ? (
                  <>
                    <div className="prompt-card-label">
                      <span style={{ color: catMeta.color }}>{catMeta.icon}</span>
                      {catMeta.label}
                    </div>
                    <p className="prompt-text">{currentPrompt}</p>
                  </>
                ) : (
                  <>
                    <span className="seat-label">🎟️ Your seat</span>
                    <p className="prompt-text" style={{ fontSize: "2rem", fontWeight: 700 }}>Seat #{current}</p>
                  </>
                )}
              </div>

              <div className="reveal-footer">
                <div className="progress-mini">
                  <div className="progress-mini-bar" style={{ width: `${progress}%` }} />
                </div>
                <p className="tap-hint">
                  {bag.length === 0 ? "🏁 Last one — tap to finish!" : `${drawn.length} / ${totalRounds} · tap to continue`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          DONE SCREEN
      ══════════════════════════════════════════════════════════════ */}
      {screen === "done" && (
        <main className="screen done-screen" id="done-screen">
          <Confetti />

          <div className="done-trophy">🏆</div>
          <div className="done-badge-row">
            <span className="done-badge">COMPLETED</span>
          </div>
          <h2 className="done-title">All {totalRounds} done!</h2>
          <p className="done-desc">
            {gameMode === "icebreaker"
              ? `The team crushed all ${totalRounds} icebreakers. Amazing work!`
              : `Every seat assigned. Time to find your spot!`}
          </p>

          <div className="done-stat-row">
            <div className="done-stat">
              <span className="done-stat-num">{totalRounds}</span>
              <span className="done-stat-label">{gameMode === "icebreaker" ? "Prompts" : "Seats"}</span>
            </div>
            <div className="done-stat-divider" />
            <div className="done-stat">
              <span className="done-stat-num">100%</span>
              <span className="done-stat-label">Complete</span>
            </div>
            <div className="done-stat-divider" />
            <div className="done-stat">
              <span className="done-stat-num">🔥</span>
              <span className="done-stat-label">Streak</span>
            </div>
          </div>

          <div className="done-actions">
            <button type="button" id="btn-play-again" className="btn btn-launch" onClick={startGame}>
              🔄 Play Again
            </button>
            <button type="button" id="btn-home" className="btn-outline" onClick={handleBackToHub}>
              ← Back to Hub
            </button>
          </div>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PROMPT CUSTOMIZER MODAL
      ══════════════════════════════════════════════════════════════ */}
      {editingPrompts && (
        <div className="modal-overlay" id="customizer-modal" onClick={() => setEditingPrompts(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">✏️ Edit Prompts</h2>
              <button type="button" className="modal-close" onClick={() => setEditingPrompts(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <p className="modal-note">Editing <strong>{category}</strong> prompts. Changes save automatically.</p>
              {activePrompts.map((p, idx) => (
                <div key={idx} className="prompt-input-row">
                  <label htmlFor={`pin-${idx}`} className="prompt-input-label">#{idx + 1}</label>
                  <input
                    id={`pin-${idx}`}
                    type="text"
                    className="prompt-input"
                    value={p}
                    onChange={e => handleEditPrompt(idx, e.target.value)}
                    placeholder={`Prompt for number ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button type="button" id="btn-done-edit" className="btn" onClick={() => setEditingPrompts(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
