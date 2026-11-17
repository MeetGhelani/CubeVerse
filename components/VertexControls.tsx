'use client';

import React, { useState } from 'react';
import {
  RotateCw,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Box,
  Triangle,
  Layers,
  CircleDot
} from 'lucide-react';
import { puzzleStore, usePuzzleStore } from '@/lib/puzzle-store';

interface ControlGroup {
  key: string;
  name: string;
  colorBg: string;
  colorText: string;
  borderColor: string;
  layerCW: string;
  layerCCW: string;
  layerDouble?: string;
  tipCW?: string;
  tipCCW?: string;
  shortcut: string;
}

const PYRAMINX_ITEMS: ControlGroup[] = [
  {
    key: 'U',
    name: 'U (Up)',
    colorBg: 'bg-amber-500/15 hover:bg-amber-500/25',
    colorText: 'text-amber-300',
    borderColor: 'border-amber-500/30',
    layerCW: 'U',
    layerCCW: "U'",
    tipCW: 'u',
    tipCCW: "u'",
    shortcut: 'U'
  },
  {
    key: 'L',
    name: 'L (Left)',
    colorBg: 'bg-emerald-500/15 hover:bg-emerald-500/25',
    colorText: 'text-emerald-300',
    borderColor: 'border-emerald-500/30',
    layerCW: 'L',
    layerCCW: "L'",
    tipCW: 'l',
    tipCCW: "l'",
    shortcut: 'L'
  },
  {
    key: 'R',
    name: 'R (Right)',
    colorBg: 'bg-blue-500/15 hover:bg-blue-500/25',
    colorText: 'text-blue-300',
    borderColor: 'border-blue-500/30',
    layerCW: 'R',
    layerCCW: "R'",
    tipCW: 'r',
    tipCCW: "r'",
    shortcut: 'R'
  },
  {
    key: 'B',
    name: 'B (Back)',
    colorBg: 'bg-rose-500/15 hover:bg-rose-500/25',
    colorText: 'text-rose-300',
    borderColor: 'border-rose-500/30',
    layerCW: 'B',
    layerCCW: "B'",
    tipCW: 'b',
    tipCCW: "b'",
    shortcut: 'B'
  }
];

const RUBIKS_FACES: ControlGroup[] = [
  {
    key: 'U',
    name: 'U (Up)',
    colorBg: 'bg-slate-500/15 hover:bg-slate-500/25',
    colorText: 'text-slate-100',
    borderColor: 'border-slate-400/30',
    layerCW: 'U',
    layerCCW: "U'",
    layerDouble: 'U2',
    shortcut: 'U'
  },
  {
    key: 'D',
    name: 'D (Down)',
    colorBg: 'bg-amber-500/15 hover:bg-amber-500/25',
    colorText: 'text-amber-300',
    borderColor: 'border-amber-500/30',
    layerCW: 'D',
    layerCCW: "D'",
    layerDouble: 'D2',
    shortcut: 'D'
  },
  {
    key: 'F',
    name: 'F (Front)',
    colorBg: 'bg-emerald-500/15 hover:bg-emerald-500/25',
    colorText: 'text-emerald-300',
    borderColor: 'border-emerald-500/30',
    layerCW: 'F',
    layerCCW: "F'",
    layerDouble: 'F2',
    shortcut: 'F'
  },
  {
    key: 'B',
    name: 'B (Back)',
    colorBg: 'bg-blue-500/15 hover:bg-blue-500/25',
    colorText: 'text-blue-300',
    borderColor: 'border-blue-500/30',
    layerCW: 'B',
    layerCCW: "B'",
    layerDouble: 'B2',
    shortcut: 'B'
  },
  {
    key: 'R',
    name: 'R (Right)',
    colorBg: 'bg-rose-500/15 hover:bg-rose-500/25',
    colorText: 'text-rose-300',
    borderColor: 'border-rose-500/30',
    layerCW: 'R',
    layerCCW: "R'",
    layerDouble: 'R2',
    shortcut: 'R'
  },
  {
    key: 'L',
    name: 'L (Left)',
    colorBg: 'bg-orange-500/15 hover:bg-orange-500/25',
    colorText: 'text-orange-300',
    borderColor: 'border-orange-500/30',
    layerCW: 'L',
    layerCCW: "L'",
    layerDouble: 'L2',
    shortcut: 'L'
  }
];

const RUBIKS_CENTER_LINES: ControlGroup[] = [
  {
    key: 'E',
    name: 'E (Center Row - H)',
    colorBg: 'bg-teal-500/15 hover:bg-teal-500/25',
    colorText: 'text-teal-300',
    borderColor: 'border-teal-500/30',
    layerCW: 'E',
    layerCCW: "E'",
    layerDouble: 'E2',
    shortcut: 'E'
  },
  {
    key: 'M',
    name: 'M (Center Col - V)',
    colorBg: 'bg-indigo-500/15 hover:bg-indigo-500/25',
    colorText: 'text-indigo-300',
    borderColor: 'border-indigo-500/30',
    layerCW: 'M',
    layerCCW: "M'",
    layerDouble: 'M2',
    shortcut: 'M'
  },
  {
    key: 'S',
    name: 'S (Center Axial)',
    colorBg: 'bg-purple-500/15 hover:bg-purple-500/25',
    colorText: 'text-purple-300',
    borderColor: 'border-purple-500/30',
    layerCW: 'S',
    layerCCW: "S'",
    layerDouble: 'S2',
    shortcut: 'S'
  }
];

export const VertexControls: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [rubiksTab, setRubiksTab] = useState<'faces' | 'centers'>('faces');
  const { puzzleType, activeAnimation } = usePuzzleStore();

  const isPyraminx = puzzleType === 'pyraminx';
  const isVoid = puzzleType === 'void';
  const isCubic = !isPyraminx;

  const displayedCubicItems = rubiksTab === 'faces' || isVoid ? RUBIKS_FACES : RUBIKS_CENTER_LINES;

  return (
    <div className="fixed right-4 top-20 z-20 transition-all select-none pointer-events-auto">
      <div className="flex items-start gap-2">
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Hide Controls' : 'Show Controls'}
          className="p-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 text-neutral-400 hover:text-white shadow-xl shadow-black/40 transition-all"
        >
          {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {isOpen && (
          <div className="w-72 sm:w-80 p-3 rounded-2xl bg-black/75 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/60 text-white flex flex-col gap-2.5 overflow-hidden">
            {/* Header with Title and Mode */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-neutral-300">
                {isPyraminx ? (
                  <Triangle className="w-3.5 h-3.5 text-amber-400" />
                ) : puzzleType === 'mirror' ? (
                  <Sparkles className="w-3.5 h-3.5 text-slate-300" />
                ) : puzzleType === 'void' ? (
                  <CircleDot className="w-3.5 h-3.5 text-orange-400" />
                ) : (
                  <Box className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>
                  {isPyraminx
                    ? 'Pyraminx Turns'
                    : puzzleType === 'mirror'
                    ? 'Mirror Turns'
                    : puzzleType === 'void'
                    ? 'Void Turns'
                    : 'Cube Turns'}
                </span>
              </div>

              {/* Angle / Type Badge */}
              <span className="text-[10px] text-neutral-400 font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                {isPyraminx ? '120°' : '90° / 180°'}
              </span>
            </div>

            {/* Rubik's & Mirror Segmented Tab Bar (Faces vs Center Lines - hidden for Void cube) */}
            {isCubic && !isVoid && (
              <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10 gap-1 text-xs">
                <button
                  onClick={() => setRubiksTab('faces')}
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                    rubiksTab === 'faces'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Faces (6)</span>
                </button>

                <button
                  onClick={() => setRubiksTab('centers')}
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                    rubiksTab === 'centers'
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Centers (3)</span>
                </button>
              </div>
            )}

            {/* Pyraminx Controls (4 Vertices + Tips) */}
            {isPyraminx && (
              <div className="grid grid-cols-2 gap-1.5 max-h-[58vh] overflow-y-auto pr-0.5">
                {PYRAMINX_ITEMS.map(v => (
                  <div
                    key={v.key}
                    className={`p-1.5 rounded-xl bg-white/[0.03] border ${v.borderColor} flex flex-col gap-1 transition-all hover:bg-white/[0.06]`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${v.colorText}`}>{v.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono opacity-80">{v.shortcut}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => puzzleStore.doNotation(v.layerCW)}
                        disabled={!!activeAnimation}
                        title={`Rotate ${v.key} Clockwise (${v.layerCW})`}
                        className={`flex items-center justify-center gap-0.5 py-1 px-1 rounded-lg text-xs font-semibold border border-white/10 transition-all ${
                          activeAnimation
                            ? 'opacity-40 cursor-not-allowed'
                            : `${v.colorBg} text-white hover:border-white/30 active:scale-95`
                        }`}
                      >
                        <RotateCw className="w-2.5 h-2.5 text-neutral-300 shrink-0" />
                        <span>{v.layerCW}</span>
                      </button>

                      <button
                        onClick={() => puzzleStore.doNotation(v.layerCCW)}
                        disabled={!!activeAnimation}
                        title={`Rotate ${v.key} Counter-Clockwise (${v.layerCCW})`}
                        className={`flex items-center justify-center gap-0.5 py-1 px-1 rounded-lg text-xs font-semibold border border-white/10 transition-all ${
                          activeAnimation
                            ? 'opacity-40 cursor-not-allowed'
                            : `${v.colorBg} text-white hover:border-white/30 active:scale-95`
                        }`}
                      >
                        <RotateCcw className="w-2.5 h-2.5 text-neutral-300 shrink-0" />
                        <span>{v.layerCCW}</span>
                      </button>
                    </div>

                    {/* Corner Tip mini buttons */}
                    {v.tipCW && v.tipCCW && (
                      <div className="flex items-center justify-between mt-0.5 pt-0.5 border-t border-white/5">
                        <span className="text-[10px] text-neutral-400">Tip:</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => puzzleStore.doNotation(v.tipCW!)}
                            disabled={!!activeAnimation}
                            title={`Tip ${v.tipCW} CW`}
                            className="px-1 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/15 text-neutral-300 transition-all"
                          >
                            {v.tipCW} ↷
                          </button>
                          <button
                            onClick={() => puzzleStore.doNotation(v.tipCCW!)}
                            disabled={!!activeAnimation}
                            title={`Tip ${v.tipCCW} CCW`}
                            className="px-1 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/15 text-neutral-300 transition-all"
                          >
                            {v.tipCCW} ↶
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Cubic Controls (Rubik's, Mirror, Void) */}
            {isCubic && (
              <div className="grid grid-cols-2 gap-1.5 max-h-[58vh] overflow-y-auto pr-0.5">
                {displayedCubicItems.map(v => (
                  <div
                    key={v.key}
                    className={`p-1.5 rounded-xl bg-white/[0.03] border ${v.borderColor} flex flex-col gap-1 transition-all hover:bg-white/[0.06]`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${v.colorText}`}>{v.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono opacity-80">{v.shortcut}</span>
                    </div>

                    <div className={`grid ${v.layerDouble ? 'grid-cols-3' : 'grid-cols-2'} gap-1`}>
                      <button
                        onClick={() => puzzleStore.doNotation(v.layerCW)}
                        disabled={!!activeAnimation}
                        title={`Rotate ${v.key} Clockwise (${v.layerCW})`}
                        className={`flex items-center justify-center gap-0.5 py-1 px-1 rounded-lg text-xs font-semibold border border-white/10 transition-all ${
                          activeAnimation
                            ? 'opacity-40 cursor-not-allowed'
                            : `${v.colorBg} text-white hover:border-white/30 active:scale-95`
                        }`}
                      >
                        <RotateCw className="w-2.5 h-2.5 text-neutral-300 shrink-0" />
                        <span>{v.layerCW}</span>
                      </button>

                      <button
                        onClick={() => puzzleStore.doNotation(v.layerCCW)}
                        disabled={!!activeAnimation}
                        title={`Rotate ${v.key} Counter-Clockwise (${v.layerCCW})`}
                        className={`flex items-center justify-center gap-0.5 py-1 px-1 rounded-lg text-xs font-semibold border border-white/10 transition-all ${
                          activeAnimation
                            ? 'opacity-40 cursor-not-allowed'
                            : `${v.colorBg} text-white hover:border-white/30 active:scale-95`
                        }`}
                      >
                        <RotateCcw className="w-2.5 h-2.5 text-neutral-300 shrink-0" />
                        <span>{v.layerCCW}</span>
                      </button>

                      {v.layerDouble && (
                        <button
                          onClick={() => puzzleStore.doNotation(v.layerDouble!)}
                          disabled={!!activeAnimation}
                          title={`Rotate ${v.key} 180° (${v.layerDouble})`}
                          className={`flex items-center justify-center py-1 px-1 rounded-lg text-xs font-mono font-bold border border-white/10 transition-all ${
                            activeAnimation
                              ? 'opacity-40 cursor-not-allowed'
                              : `${v.colorBg} text-white hover:border-white/30 active:scale-95`
                          }`}
                        >
                          <span>{v.layerDouble}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
