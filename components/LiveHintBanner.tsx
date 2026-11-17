'use client';

import React, { useState } from 'react';
import { Lightbulb, ChevronRight, X, Sparkles } from 'lucide-react';
import { usePuzzleStore, puzzleStore } from '@/lib/puzzle-store';
import { analyzePuzzleState } from '@/lib/pyraminx-solver';
import { analyzeRubiksState } from '@/lib/rubiks-solver';

export const LiveHintBanner: React.FC = () => {
  const { puzzleType, pieces, isSolved } = usePuzzleStore();
  const [isDismissed, setIsDismissed] = useState(false);

  const analysis =
    puzzleType === 'rubiks' || puzzleType === 'mirror'
      ? analyzeRubiksState(pieces, isSolved)
      : analyzePuzzleState(pieces, isSolved);

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-24 right-4 z-20 p-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-xl shadow-black/50 backdrop-blur-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
        title="Show Solve Suggestion"
      >
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <span className="hidden sm:inline">Tips</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 max-w-xl w-[92%] sm:w-auto transition-all animate-in fade-in duration-300 select-none">
      <div className="flex items-center gap-2.5 p-2 px-3.5 rounded-2xl bg-neutral-900/90 backdrop-blur-2xl border border-amber-500/30 shadow-2xl shadow-black/60 text-white">
        {/* Lightbulb Icon with pulse */}
        <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <Lightbulb className="w-4 h-4" />
        </div>

        {/* Dynamic Live Text */}
        <div
          onClick={() => puzzleStore.setIsTipsOpen(true)}
          className="flex-1 cursor-pointer group flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 overflow-hidden"
        >
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{analysis.stageName}:</span>
          </span>
          <span className="text-xs text-neutral-200 truncate group-hover:text-white transition-colors">
            {analysis.shortHint}
          </span>
        </div>

        {/* Open Guide Button */}
        <button
          onClick={() => puzzleStore.setIsTipsOpen(true)}
          className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px] transition-all shrink-0 flex items-center gap-1"
        >
          <span>Guide</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        {/* Dismiss Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors shrink-0"
          title="Minimize suggestion"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
