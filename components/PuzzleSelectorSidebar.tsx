'use client';

import React, { useState } from 'react';
import {
  Triangle,
  Box,
  Sparkles,
  Layers,
  Compass,
  CircleDot,
  Gem,
  MousePointerClick,
  Orbit,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { usePuzzleStore, puzzleStore, PuzzleType } from '@/lib/puzzle-store';

interface PuzzleOption {
  id: PuzzleType;
  title: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  gradientBg: string;
  borderColor: string;
  glowColor: string;
}

const PUZZLE_OPTIONS: PuzzleOption[] = [
  {
    id: 'pyraminx',
    title: 'Pyraminx',
    badge: 'Tetra',
    desc: 'Triangular 4-face speed puzzle',
    icon: Triangle,
    accentColor: 'text-amber-400',
    gradientBg: 'from-amber-500/20 to-amber-600/5',
    borderColor: 'border-amber-500/40',
    glowColor: 'shadow-amber-500/20'
  },
  {
    id: 'rubiks',
    title: "Rubik's 3×3",
    badge: 'Classic',
    desc: 'Standard WCA speedcube',
    icon: Box,
    accentColor: 'text-blue-400',
    gradientBg: 'from-blue-500/20 to-blue-600/5',
    borderColor: 'border-blue-500/40',
    glowColor: 'shadow-blue-500/20'
  },
  {
    id: 'mirror',
    title: 'Mirror Cube',
    badge: 'Bump',
    desc: 'Chrome metallic shape-shifter',
    icon: Sparkles,
    accentColor: 'text-slate-200',
    gradientBg: 'from-slate-300/20 to-slate-500/5',
    borderColor: 'border-slate-300/40',
    glowColor: 'shadow-white/20'
  },
  {
    id: 'void',
    title: 'Void Cube',
    badge: 'Hollow',
    desc: 'No-center speedcube with hollow core',
    icon: CircleDot,
    accentColor: 'text-orange-400',
    gradientBg: 'from-orange-500/20 to-orange-600/5',
    borderColor: 'border-orange-500/40',
    glowColor: 'shadow-orange-500/20'
  }
];

export const PuzzleSelectorSidebar: React.FC = () => {
  const { puzzleType, interactionMode } = usePuzzleStore();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside
      aria-label="Puzzle Selection Sidebar"
      className="fixed left-3 top-20 z-20 select-none pointer-events-auto transition-all duration-300"
    >
      <div className="flex items-start gap-1.5">
        {/* Main Vertical Card Container */}
        <div
          className={`p-2 rounded-2xl bg-neutral-950/85 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/80 flex flex-col gap-1 transition-all duration-300 ${
            isExpanded ? 'w-56' : 'w-14 items-center'
          }`}
        >
          {/* Header Tag / Mode Toggle */}
          <div className="flex items-center justify-between px-2 py-1 mb-0.5 border-b border-white/10">
            {isExpanded ? (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-neutral-400">
                  PUZZLES ({PUZZLE_OPTIONS.length})
                </span>
              </div>
            ) : (
              <span className="text-[9px] font-mono font-bold text-neutral-400">3D</span>
            )}

            {/* Collapse/Expand Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {isExpanded ? (
                <ChevronLeft className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* 7 Vertical Puzzle Cards */}
          <div className="flex flex-col gap-1">
            {PUZZLE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = puzzleType === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => puzzleStore.setPuzzleType(opt.id)}
                  className={`group relative text-left rounded-xl transition-all duration-200 border ${
                    isActive
                      ? `bg-gradient-to-r ${opt.gradientBg} ${opt.borderColor} ${opt.glowColor} shadow-lg ring-1 ring-white/20`
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.07] hover:border-white/15'
                  } ${isExpanded ? 'p-2 flex items-center gap-2.5' : 'p-2.5 flex items-center justify-center'}`}
                  title={`${opt.title} - ${opt.desc}`}
                >
                  {/* Left glowing bar for active puzzle */}
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-white shadow-sm shadow-white/50" />
                  )}

                  {/* Icon */}
                  <div
                    className={`p-1.5 rounded-lg shrink-0 transition-transform ${
                      isActive
                        ? `bg-black/50 ${opt.accentColor} scale-105`
                        : 'bg-white/5 text-neutral-400 group-hover:text-white group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Text Details (when expanded) */}
                  {isExpanded && (
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isActive ? 'text-white font-bold' : 'text-neutral-300 group-hover:text-white'
                          }`}
                        >
                          {opt.title}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                            isActive
                              ? `${opt.accentColor} border-white/20 bg-black/40`
                              : 'text-neutral-500 border-white/5'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 truncate leading-tight">
                        {opt.desc}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Interaction Mode Control (Turn Layers vs Orbit Camera) */}
          <div className="mt-1 pt-1.5 border-t border-white/10 flex flex-col gap-1">
            {isExpanded ? (
              <div className="flex items-center justify-between gap-1 p-0.5 rounded-xl bg-black/40 border border-white/5">
                <button
                  onClick={() => puzzleStore.setInteractionMode('turn')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-1 rounded-lg text-[10px] font-medium transition-all ${
                    interactionMode === 'turn'
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Drag pieces to turn layers (Camera locked during turn)"
                >
                  <MousePointerClick className="w-3 h-3" />
                  <span>Turn</span>
                </button>
                <button
                  onClick={() => puzzleStore.setInteractionMode('camera')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-1 rounded-lg text-[10px] font-medium transition-all ${
                    interactionMode === 'camera'
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Free 3D Camera Orbit"
                >
                  <Orbit className="w-3 h-3" />
                  <span>Orbit</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() =>
                  puzzleStore.setInteractionMode(
                    interactionMode === 'turn' ? 'camera' : 'turn'
                  )
                }
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all"
                title={`Switch Interaction Mode (Current: ${interactionMode})`}
              >
                {interactionMode === 'turn' ? (
                  <MousePointerClick className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Orbit className="w-3.5 h-3.5 text-blue-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
