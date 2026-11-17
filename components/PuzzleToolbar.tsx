'use client';

import React from 'react';
import {
  Play,
  Pause,
  Shuffle,
  RotateCcw,
  Undo2,
  Redo2,
  Dices,
  Camera,
  Layers,
  Volume2,
  VolumeX,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { usePuzzleStore, puzzleStore } from '@/lib/puzzle-store';

export const PuzzleToolbar: React.FC = () => {
  const {
    showcaseAutoRotate,
    autoLayerRotate,
    historyIndex,
    history,
    soundEnabled,
    activeAnimation,
    isTipsOpen
  } = usePuzzleStore();

  const canUndo = historyIndex >= 0 && !activeAnimation;
  const canRedo = historyIndex < history.length - 1 && !activeAnimation;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-full px-3">
      <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 text-white transition-all">
        {/* Solver Tips & Suggestions Hub */}
        <button
          onClick={() => puzzleStore.toggleTips()}
          title="Solver Tips & Guide (T)"
          className={`relative p-2.5 rounded-xl transition-all duration-200 group flex items-center justify-center ${
            isTipsOpen
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
          }`}
        >
          <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sr-only">Tips</span>
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

        {/* 1. Play / Pause Showcase */}
        <button
          onClick={() => puzzleStore.toggleShowcaseAutoRotate()}
          title={showcaseAutoRotate ? 'Pause Showcase Rotation (Space)' : 'Play Showcase Rotation (Space)'}
          className={`relative p-2.5 rounded-xl transition-all duration-200 group flex items-center justify-center ${
            showcaseAutoRotate
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'hover:bg-white/10 text-neutral-300 hover:text-white'
          }`}
        >
          {showcaseAutoRotate ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
          <span className="sr-only">Showcase</span>
        </button>

        {/* 2. Auto-scramble */}
        <button
          onClick={() => puzzleStore.scramble(14)}
          title="Auto Scramble (S)"
          className="p-2.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-all duration-200"
        >
          <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sr-only">Scramble</span>
        </button>

        {/* 3. Reset puzzle */}
        <button
          onClick={() => puzzleStore.resetPuzzle()}
          title="Reset Puzzle"
          className="p-2.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sr-only">Reset</span>
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

        {/* 4. Undo */}
        <button
          onClick={() => puzzleStore.undo()}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-2.5 rounded-xl transition-all duration-200 ${
            canUndo
              ? 'hover:bg-white/10 text-neutral-300 hover:text-white'
              : 'text-neutral-600 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sr-only">Undo</span>
        </button>

        {/* 5. Redo */}
        <button
          onClick={() => puzzleStore.redo()}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`p-2.5 rounded-xl transition-all duration-200 ${
            canRedo
              ? 'hover:bg-white/10 text-neutral-300 hover:text-white'
              : 'text-neutral-600 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sr-only">Redo</span>
        </button>

        {/* 6. Random rotation */}
        <button
          onClick={() => puzzleStore.randomRotation()}
          title="Random Rotation (R)"
          className="p-2.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-all duration-200"
        >
          <Dices className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sr-only">Random Move</span>
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

        {/* 7. Reset camera */}
        <button
          onClick={() => puzzleStore.triggerCameraReset()}
          title="Reset Camera (C or Double-Click)"
          className="p-2.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-all duration-200"
        >
          <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sr-only">Reset Camera</span>
        </button>

        {/* 8. Enable / Disable auto layer rotation */}
        <button
          onClick={() => puzzleStore.toggleAutoLayerRotate()}
          title={autoLayerRotate ? 'Disable Auto Layer Rotation' : 'Enable Auto Layer Rotation (A)'}
          className={`p-2.5 rounded-xl transition-all duration-200 ${
            autoLayerRotate
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'hover:bg-white/10 text-neutral-300 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sr-only">Auto Layers</span>
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

        {/* Sound Toggle */}
        <button
          onClick={() => puzzleStore.toggleSound()}
          title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          className="p-2.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-all duration-200"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
          <span className="sr-only">Sound</span>
        </button>

        {/* Help / Shortcuts */}
        <button
          onClick={() => puzzleStore.setIsHelpOpen(true)}
          title="Help & Shortcuts (H)"
          className="p-2.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-all duration-200"
        >
          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sr-only">Help</span>
        </button>
      </div>
    </div>
  );
};
