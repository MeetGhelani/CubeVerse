'use client';

import React from 'react';
import { X, MousePointer, Hand, Keyboard } from 'lucide-react';
import { usePuzzleStore, puzzleStore } from '@/lib/puzzle-store';

export const ShortcutsModal: React.FC = () => {
  const { isHelpOpen } = usePuzzleStore();

  if (!isHelpOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl bg-neutral-900/90 border border-white/15 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Pyraminx Controls & Shortcuts
            </h2>
            <p className="text-xs text-neutral-400">
              Interactive 3D puzzle guide & reference
            </p>
          </div>
          <button
            onClick={() => puzzleStore.setIsHelpOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 mt-4 text-sm">
          {/* Mouse Controls */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              <MousePointer className="w-4 h-4" />
              <span>Mouse & Drag Controls</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="font-semibold text-white block">Drag on Puzzle Piece:</span>
                <span className="text-neutral-400">Rotates the corresponding puzzle layer along the drag gesture</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="font-semibold text-white block">Left-Click & Drag Background:</span>
                <span className="text-neutral-400">Orbit & inspect the camera around the 3D puzzle</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="font-semibold text-white block">Scroll Wheel / Pinch:</span>
                <span className="text-neutral-400">Zoom in and zoom out smoothly</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="font-semibold text-white block">Double-Click Canvas:</span>
                <span className="text-neutral-400">Smoothly resets camera back to isometric view</span>
              </div>
            </div>
          </div>

          {/* Touch Controls */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
              <Hand className="w-4 h-4" />
              <span>Touch & Mobile Gestures</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="font-semibold text-white block">Swipe Piece:</span>
                <span className="text-neutral-400">Rotates selected vertex layer</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="font-semibold text-white block">One-Finger Drag:</span>
                <span className="text-neutral-400">Rotate camera orbit</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="font-semibold text-white block">Pinch / Spread:</span>
                <span className="text-neutral-400">Smooth zoom in / zoom out</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="font-semibold text-white block">Tap Piece:</span>
                <span className="text-neutral-400">Highlights and selects piece</span>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              <Keyboard className="w-4 h-4" />
              <span>Keyboard Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">U / Shift+U</span>
                <span className="text-neutral-500 font-sans text-[11px]">Up Layer</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">L / Shift+L</span>
                <span className="text-neutral-500 font-sans text-[11px]">Left Layer</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">R / Shift+R</span>
                <span className="text-neutral-500 font-sans text-[11px]">Right Layer</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">B / Shift+B</span>
                <span className="text-neutral-500 font-sans text-[11px]">Back Layer</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">1, 2, 3, 4</span>
                <span className="text-neutral-500 font-sans text-[11px]">Tip Turns</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Space</span>
                <span className="text-neutral-500 font-sans text-[11px]">Play / Pause</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">S</span>
                <span className="text-neutral-500 font-sans text-[11px]">Scramble</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Ctrl+Z / Z</span>
                <span className="text-neutral-500 font-sans text-[11px]">Undo</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-neutral-300">Ctrl+Y / Y</span>
                <span className="text-neutral-500 font-sans text-[11px]">Redo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={() => puzzleStore.setIsHelpOpen(false)}
            className="px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-all"
          >
            Got it, Let&apos;s Play
          </button>
        </div>
      </div>
    </div>
  );
};
