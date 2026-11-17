'use client';

import React, { useState } from 'react';
import {
  MousePointerClick,
  Orbit,
  Compass,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { usePuzzleStore, puzzleStore, CameraViewPreset } from '@/lib/puzzle-store';

export const SolveModeSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { interactionMode, cameraViewPreset } = usePuzzleStore();

  const faceViews: { preset: CameraViewPreset; label: string; color: string; dotColor: string }[] = [
    { preset: 'isometric', label: '3D Isometric', color: 'border-white/20 text-white', dotColor: 'bg-white' },
    { preset: 'front', label: 'Front (Red)', color: 'border-rose-500/40 text-rose-300', dotColor: 'bg-rose-500' },
    { preset: 'right', label: 'Right (Blue)', color: 'border-blue-500/40 text-blue-300', dotColor: 'bg-blue-500' },
    { preset: 'left', label: 'Left (Green)', color: 'border-emerald-500/40 text-emerald-300', dotColor: 'bg-emerald-500' },
    { preset: 'bottom', label: 'Base (Yellow)', color: 'border-amber-500/40 text-amber-300', dotColor: 'bg-amber-400' }
  ];

  return (
    <div className="fixed left-4 top-20 z-20 transition-all select-none pointer-events-auto">
      <div className="flex items-start gap-2">
        {isOpen && (
          <div className="w-48 p-3 rounded-2xl bg-black/65 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/60 text-white flex flex-col gap-3.5">
            {/* Interaction Mode Section */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-neutral-400 mb-2">
                <MousePointerClick className="w-3.5 h-3.5 text-blue-400" />
                <span>Interaction Mode</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => puzzleStore.setInteractionMode('turn')}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    interactionMode === 'turn'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30 font-semibold'
                      : 'bg-white/[0.03] border-white/5 text-neutral-300 hover:text-white hover:bg-white/10'
                  }`}
                  title="Drag pieces or corners to turn layers (Camera locked during drag)"
                >
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="w-3.5 h-3.5" />
                    <span>Turn Layers</span>
                  </div>
                  <span className="text-[10px] opacity-70 font-mono">M</span>
                </button>

                <button
                  onClick={() => puzzleStore.setInteractionMode('camera')}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    interactionMode === 'camera'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30 font-semibold'
                      : 'bg-white/[0.03] border-white/5 text-neutral-300 hover:text-white hover:bg-white/10'
                  }`}
                  title="Drag anywhere to freely orbit and inspect the camera"
                >
                  <div className="flex items-center gap-2">
                    <Orbit className="w-3.5 h-3.5" />
                    <span>Orbit Camera</span>
                  </div>
                  <span className="text-[10px] opacity-70 font-mono">M</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-white/10" />

            {/* Camera View Preset Section */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-neutral-400 mb-2">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Face Views</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {faceViews.map(view => {
                  const isActive = cameraViewPreset === view.preset;
                  return (
                    <button
                      key={view.preset}
                      onClick={() => puzzleStore.setCameraViewPreset(view.preset)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isActive
                          ? `${view.color} bg-white/15 font-bold shadow-md`
                          : 'bg-white/[0.03] border-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${view.dotColor}`} />
                      <span className="truncate">{view.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Hide Control Panel' : 'Show Control Panel'}
          className="p-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 text-neutral-400 hover:text-white shadow-xl shadow-black/40 transition-all"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
