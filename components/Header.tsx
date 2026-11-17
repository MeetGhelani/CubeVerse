'use client';

import React from 'react';
import { Sparkles, Timer, Footprints, Layers, CheckCircle2 } from 'lucide-react';
import { usePuzzleStore } from '@/lib/puzzle-store';

export const Header: React.FC = () => {
  const {
    showcaseAutoRotate,
    autoLayerRotate,
    moveCount,
    isSolved,
    isScrambled,
    elapsedSeconds,
    selectedPieceId,
    pieceDefs
  } = usePuzzleStore();

  // Format timer MM:SS
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Find info about selected piece if any
  const selectedDef = pieceDefs.find(p => p.id === selectedPieceId);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 pointer-events-none p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Brand Title and Subtitle */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 pointer-events-auto">
          <h1 className="text-xl sm:text-2xl font-black tracking-widest text-white drop-shadow-md">
            PYRAMINX
          </h1>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-white/10 text-white/80 border border-white/15">
            3D
          </span>
        </div>
        <p className="text-xs sm:text-sm font-medium text-neutral-400 tracking-wide">
          Interactive Triangular Rubik&apos;s Puzzle
        </p>
      </div>

      {/* Status Badges and Info */}
      <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Showcase Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-md transition-all ${
            showcaseAutoRotate
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
              : 'bg-white/5 text-neutral-400 border-white/10'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              showcaseAutoRotate ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
            }`}
          />
          <span>{showcaseAutoRotate ? 'Showcase Auto' : 'Showcase Paused'}</span>
        </div>

        {/* Auto Layer Rotation Status */}
        {autoLayerRotate && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25 backdrop-blur-md">
            <Layers className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Auto Layers</span>
          </div>
        )}

        {/* Solved Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-md transition-all ${
            isSolved
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
          }`}
        >
          {isSolved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Solved</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Unsolved</span>
            </>
          )}
        </div>

        {/* Moves & Timer Pill (Active when solving or scrambled) */}
        {(moveCount > 0 || isScrambled) && (
          <div className="flex items-center gap-3 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-xs font-mono text-neutral-300">
            <div className="flex items-center gap-1" title="Move Count">
              <Footprints className="w-3.5 h-3.5 text-neutral-400" />
              <span>{moveCount}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400" title="Solve Time">
              <Timer className="w-3.5 h-3.5" />
              <span>{timeFormatted}</span>
            </div>
          </div>
        )}

        {/* Selected Piece Info Pill */}
        {selectedDef && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/80 border border-blue-500/40 text-blue-300 text-xs font-sans backdrop-blur-md">
            <span className="font-semibold capitalize">{selectedDef.type}</span>
            <span className="text-white/60">({selectedDef.id})</span>
          </div>
        )}
      </div>
    </header>
  );
};
