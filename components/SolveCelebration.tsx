'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, RefreshCw } from 'lucide-react';
import { usePuzzleStore, puzzleStore } from '@/lib/puzzle-store';

export const SolveCelebration: React.FC = () => {
  const { victoryNonce, moveCount, elapsedSeconds } = usePuzzleStore();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (victoryNonce > 0) {
      setShowBanner(true);

      // Multi-stage confetti celebration
      try {
        const count = 200;
        const defaults = {
          origin: { y: 0.7 },
          colors: ['#ef4444', '#2563eb', '#16a34a', '#facc15', '#ffffff']
        };

        function fire(particleRatio: number, opts: confetti.Options) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
          });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
      } catch {
        // Confetti fallback
      }
    }
  }, [victoryNonce]);

  if (!showBanner) return null;

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${mins > 0 ? `${mins}m ` : ''}${secs}s`;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 max-w-sm w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="p-4 rounded-3xl bg-neutral-900/95 border border-amber-500/40 shadow-2xl shadow-amber-500/20 text-white text-center flex flex-col items-center gap-2.5 backdrop-blur-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Trophy className="w-6 h-6 animate-bounce" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Pyraminx Solved!</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Brilliant work! All 4 faces aligned.
          </p>
        </div>

        <div className="flex items-center gap-4 py-1.5 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
          <div>
            <span className="text-neutral-400 block text-[10px] font-sans">Moves</span>
            <span className="text-emerald-400 font-bold">{moveCount}</span>
          </div>
          <div className="w-[1px] h-6 bg-white/10" />
          <div>
            <span className="text-neutral-400 block text-[10px] font-sans">Time</span>
            <span className="text-amber-400 font-bold">{timeFormatted}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 w-full">
          <button
            onClick={() => {
              setShowBanner(false);
              puzzleStore.scramble(14);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Play Again</span>
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 text-xs transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
