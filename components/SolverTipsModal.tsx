'use client';

import React, { useState } from 'react';
import {
  Lightbulb,
  X,
  Play,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Zap,
  Target,
  ArrowRight
} from 'lucide-react';
import { usePuzzleStore, puzzleStore } from '@/lib/puzzle-store';
import { analyzePuzzleState, POPULAR_ALGORITHMS } from '@/lib/pyraminx-solver';

export const SolverTipsModal: React.FC = () => {
  const { isTipsOpen, pieces, isSolved, activeAnimation } = usePuzzleStore();
  const [activeTab, setActiveTab] = useState<'current' | 'steps' | 'algorithms'>('current');

  if (!isTipsOpen) return null;

  const currentAnalysis = analyzePuzzleState(pieces, isSolved);

  const handleRunAlgorithm = (moves: string) => {
    puzzleStore.executeAlgorithm(moves);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-3xl bg-neutral-900/95 border border-amber-500/30 shadow-2xl shadow-amber-500/10 text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Pyraminx Solver Tips & Guide
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Interactive
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Step-by-step suggestions & algorithm tutor
              </p>
            </div>
          </div>

          <button
            onClick={() => puzzleStore.setIsTipsOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-5 py-2.5 border-b border-white/10 bg-black/30">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'current'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Live Suggestion</span>
          </button>

          <button
            onClick={() => setActiveTab('steps')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'steps'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>4-Step Method</span>
          </button>

          <button
            onClick={() => setActiveTab('algorithms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'algorithms'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Algorithms Library</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-sm">
          {/* TAB 1: LIVE SUGGESTION */}
          {activeTab === 'current' && (
            <div className="space-y-4">
              {/* Current Stage Card */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{currentAnalysis.stageName}</span>
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                    Stage {currentAnalysis.stage} of {currentAnalysis.totalStages}
                  </span>
                </div>

                <p className="text-sm font-medium text-white leading-relaxed">
                  {currentAnalysis.shortHint}
                </p>

                <p className="text-xs text-neutral-300 leading-normal">
                  {currentAnalysis.description}
                </p>

                {currentAnalysis.recommendedAlgorithm && (
                  <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-[11px] text-neutral-400 block font-sans">
                        Recommended Move:
                      </span>
                      <span className="text-sm font-mono font-bold text-amber-300">
                        {currentAnalysis.recommendedAlgorithm.notation}
                      </span>
                    </div>

                    {currentAnalysis.recommendedAlgorithm.notation.includes('R') && (
                      <button
                        onClick={() =>
                          handleRunAlgorithm(currentAnalysis.recommendedAlgorithm!.notation)
                        }
                        disabled={!!activeAnimation}
                        className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Try on Cube</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Tracker */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="text-xs font-semibold text-neutral-400 block mb-2">
                  Solve Progress Checklist:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div
                    className={`flex items-center gap-2 p-2 rounded-xl border ${
                      currentAnalysis.stage > 1 || isSolved
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/5 bg-white/[0.02] text-neutral-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>1. Orient 4 Corner Tips</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-xl border ${
                      currentAnalysis.stage > 2 || isSolved
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/5 bg-white/[0.02] text-neutral-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>2. Align Axial Centers</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-xl border ${
                      currentAnalysis.stage > 3 || isSolved
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/5 bg-white/[0.02] text-neutral-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>3. Base Layer Edges</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-xl border ${
                      isSolved
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/5 bg-white/[0.02] text-neutral-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>4. Last Layer Solved</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 4-STEP METHOD GUIDE */}
          {activeTab === 'steps' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span>Step 1: Orient the 4 Corner Tips</span>
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  The 4 small corner tips (<code className="text-amber-300">u, l, r, b</code>) only turn in place. Simply twist each tip until its 3 colors match the axial center right below it.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span>Step 2: Unify 3 Axial Centers on the Base</span>
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Pick a base color (Yellow is recommended). Look for the 3 vertices that have a yellow center. Rotate the main vertex layers until all 3 yellow centers point to the bottom face, forming the classic &ldquo;radioactive symbol&rdquo;.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span>Step 3: Insert the 3 Base Edges</span>
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Find a yellow edge in the top layer. Match its side sticker with the center color.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="font-semibold text-white block">Right Insertion:</span>
                    <span className="text-amber-300 font-mono text-[11px] block mt-0.5">U R U&apos; R&apos;</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="font-semibold text-white block">Left Insertion:</span>
                    <span className="text-amber-300 font-mono text-[11px] block mt-0.5">U&apos; L&apos; U L</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span>Step 4: Solve the Last Layer Edges</span>
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Only 3 edges remain on the top. Use the <strong>Sledgehammer</strong> or <strong>Two-Edge Flip</strong> to finish!
                </p>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs">
                  <span className="font-semibold text-white block">Sledgehammer (3-Edge Cycle):</span>
                  <span className="text-amber-300 font-mono text-[11px] block mt-0.5">R&apos; L R L&apos;</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALGORITHM LIBRARY */}
          {activeTab === 'algorithms' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400">
                Click &ldquo;Try on Cube&rdquo; on any algorithm to watch it execute live with smooth animations:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POPULAR_ALGORITHMS.map(algo => (
                  <div
                    key={algo.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-3 hover:border-amber-500/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">
                          {algo.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-neutral-300">
                          {algo.category}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-amber-300 my-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                        {algo.moves}
                      </div>
                      <p className="text-[11px] text-neutral-300 mt-1.5 leading-normal">
                        {algo.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRunAlgorithm(algo.moves)}
                      disabled={!!activeAnimation}
                      className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-neutral-950 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Try on Cube</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-black/30 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white">T</kbd> to toggle tips
          </span>
          <button
            onClick={() => puzzleStore.setIsTipsOpen(false)}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-all"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
