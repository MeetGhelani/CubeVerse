'use client';

import React, { useState } from 'react';
import { RotateCw, RotateCcw, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { puzzleStore, usePuzzleStore } from '@/lib/puzzle-store';

interface VertexControlItem {
  key: string;
  name: string;
  colorBg: string;
  colorText: string;
  borderColor: string;
  layerCW: string;
  layerCCW: string;
  tipCW: string;
  tipCCW: string;
  shortcut: string;
}

const VERTEX_ITEMS: VertexControlItem[] = [
  {
    key: 'U',
    name: 'U (Up)',
    colorBg: 'bg-amber-500/10 hover:bg-amber-500/20',
    colorText: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    layerCW: 'U',
    layerCCW: "U'",
    tipCW: 'u',
    tipCCW: "u'",
    shortcut: 'U / Shift+U'
  },
  {
    key: 'L',
    name: 'L (Left)',
    colorBg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    colorText: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    layerCW: 'L',
    layerCCW: "L'",
    tipCW: 'l',
    tipCCW: "l'",
    shortcut: 'L / Shift+L'
  },
  {
    key: 'R',
    name: 'R (Right)',
    colorBg: 'bg-blue-500/10 hover:bg-blue-500/20',
    colorText: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    layerCW: 'R',
    layerCCW: "R'",
    tipCW: 'r',
    tipCCW: "r'",
    shortcut: 'R / Shift+R'
  },
  {
    key: 'B',
    name: 'B (Back)',
    colorBg: 'bg-rose-500/10 hover:bg-rose-500/20',
    colorText: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    layerCW: 'B',
    layerCCW: "B'",
    tipCW: 'b',
    tipCCW: "b'",
    shortcut: 'B / Shift+B'
  }
];

export const VertexControls: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { activeAnimation } = usePuzzleStore();

  return (
    <div className="fixed right-4 top-20 z-20 transition-all select-none">
      <div className="flex items-start gap-2">
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Hide Layer Controls' : 'Show Layer Controls'}
          className="p-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 text-neutral-400 hover:text-white shadow-xl shadow-black/40 transition-all"
        >
          {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {isOpen && (
          <div className="w-64 sm:w-72 p-3.5 rounded-2xl bg-black/65 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/60 text-white flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-neutral-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Layer Rotations</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">120° Turns</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {VERTEX_ITEMS.map(v => (
                <div
                  key={v.key}
                  className={`p-2.5 rounded-xl border ${v.borderColor} bg-white/[0.03] transition-all`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold ${v.colorText}`}>
                      {v.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {v.shortcut}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Main Layer Rotations */}
                    <button
                      onClick={() => puzzleStore.doNotation(v.layerCW)}
                      disabled={!!activeAnimation}
                      title={`Rotate Layer ${v.key} Clockwise 120° (${v.layerCW})`}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium border border-white/10 transition-all ${
                        activeAnimation
                          ? 'opacity-40 cursor-not-allowed'
                          : `${v.colorBg} text-white hover:border-white/30 active:scale-95`
                      }`}
                    >
                      <RotateCw className="w-3 h-3 text-neutral-300" />
                      <span>{v.layerCW} CW</span>
                    </button>

                    <button
                      onClick={() => puzzleStore.doNotation(v.layerCCW)}
                      disabled={!!activeAnimation}
                      title={`Rotate Layer ${v.key} Counter-Clockwise 120° (${v.layerCCW})`}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium border border-white/10 transition-all ${
                        activeAnimation
                          ? 'opacity-40 cursor-not-allowed'
                          : `${v.colorBg} text-white hover:border-white/30 active:scale-95`
                      }`}
                    >
                      <RotateCcw className="w-3 h-3 text-neutral-300" />
                      <span>{v.layerCCW} CCW</span>
                    </button>
                  </div>

                  {/* Corner Tip Turn (Mini Buttons) */}
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/5">
                    <span className="text-[10px] text-neutral-400">Corner Tip:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => puzzleStore.doNotation(v.tipCW)}
                        disabled={!!activeAnimation}
                        title={`Tip ${v.tipCW} CW 120°`}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/15 text-neutral-300 transition-all"
                      >
                        {v.tipCW} ↷
                      </button>
                      <button
                        onClick={() => puzzleStore.doNotation(v.tipCCW)}
                        disabled={!!activeAnimation}
                        title={`Tip ${v.tipCCW} CCW 120°`}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/15 text-neutral-300 transition-all"
                      >
                        {v.tipCCW} ↶
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
