'use client';

import React, { useState } from 'react';
import { Sparkles, Timer, Footprints, Layers, CheckCircle2, Box, Triangle, Palette } from 'lucide-react';
import { usePuzzleStore, puzzleStore, PuzzleType } from '@/lib/puzzle-store';
import { ColorThemeId, COLOR_THEMES } from '@/lib/puzzle-themes';

export const Header: React.FC = () => {
  const {
    puzzleType,
    colorTheme,
    showcaseAutoRotate,
    autoLayerRotate,
    moveCount,
    isSolved,
    isScrambled,
    elapsedSeconds,
    selectedPieceId,
    pieceDefs
  } = usePuzzleStore();

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const selectedDef = pieceDefs.find(p => p.id === selectedPieceId);

  const themeList: { id: ColorThemeId; name: string; dotColor: string }[] = [
    { id: 'modern', name: 'Modern Neo', dotColor: 'bg-[#00E575]' },
    { id: 'pastel', name: 'Pastel Macaron', dotColor: 'bg-[#FB7185]' },
    { id: 'cyberpunk', name: 'Cyberpunk Glow', dotColor: 'bg-[#00F0FF]' },
    { id: 'classic', name: 'Classic WCA', dotColor: 'bg-[#EF4444]' }
  ];

  const PUZZLE_META: Record<PuzzleType, { title: string; badge: string }> = {
    pyraminx: { title: 'PYRAMINX', badge: '3D TETRA' },
    rubiks: { title: "RUBIK'S CUBE", badge: '3×3' },
    mirror: { title: 'MIRROR CUBE', badge: 'BUMP' },
    void: { title: 'VOID CUBE', badge: 'HOLLOW' }
  };

  const meta = PUZZLE_META[puzzleType] || PUZZLE_META.pyraminx;

  return (
    <header className="fixed top-0 left-0 right-0 z-20 pointer-events-none p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Brand Title and Active Puzzle Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 pointer-events-auto">
          <h1 className="text-xl sm:text-2xl font-black tracking-widest text-white drop-shadow-md">
            {meta.title}
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-white/10 text-white/90 border border-white/20 shadow-sm">
            {meta.badge}
          </span>
        </div>

        {/* Color Theme Selector Pill */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-xl shadow-black/40 text-xs font-semibold text-neutral-300 hover:text-white hover:border-white/30 transition-all"
            title="Change Side Colors & Theme"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span className="capitalize">{COLOR_THEMES[colorTheme]?.name.split(' ')[0]} Colors</span>
          </button>

          {isThemeMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 p-1.5 rounded-2xl bg-neutral-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl z-50 flex flex-col gap-1">
              {themeList.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    puzzleStore.setColorTheme(t.id);
                    setIsThemeMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all text-left ${
                    colorTheme === t.id
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${t.dotColor}`} />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
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

        {/* Moves & Timer Pill */}
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
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/80 border border-white/15 text-neutral-300 text-xs font-sans backdrop-blur-md">
            <span className="font-semibold capitalize">{selectedDef.type}</span>
            <span className="text-white/60">({selectedDef.id})</span>
          </div>
        )}
      </div>
    </header>
  );
};
