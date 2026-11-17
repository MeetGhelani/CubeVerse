'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { PuzzleSelectorSidebar } from '@/components/PuzzleSelectorSidebar';
import { VertexControls } from '@/components/VertexControls';
import { PuzzleToolbar } from '@/components/PuzzleToolbar';
import { ShortcutsModal } from '@/components/ShortcutsModal';
import { SolverTipsModal } from '@/components/SolverTipsModal';
import { LiveHintBanner } from '@/components/LiveHintBanner';
import { SolveCelebration } from '@/components/SolveCelebration';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';

const PyraminxScene = dynamic(
  () => import('@/components/PyraminxScene').then(mod => mod.PyraminxScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-neutral-400">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono tracking-wider uppercase">Loading 3D Pyraminx...</span>
      </div>
    )
  }
);

export default function Home() {
  useKeyboardShortcuts();

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-radial from-[#181a24] via-[#0d0f17] to-[#07080c]">
      {/* Studio Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,rgba(59,130,246,0.06),transparent_70%)]" />

      {/* Top Header */}
      <Header />

      {/* Left-Side Vertical Puzzle Selector Sidebar */}
      <PuzzleSelectorSidebar />

      {/* 3D Canvas Viewport */}
      <div className="absolute inset-0 w-full h-full z-10">
        <PyraminxScene />
      </div>

      {/* Right-Side Vertex Layer Controls */}
      <VertexControls />

      {/* Dynamic Live Hint & Suggestion Banner */}
      <LiveHintBanner />

      {/* Bottom Floating Toolbar */}
      <PuzzleToolbar />

      {/* Interactive Solver Tips & Algorithms Hub */}
      <SolverTipsModal />

      {/* Guide & Shortcuts Modal */}
      <ShortcutsModal />

      {/* Solved Confetti Celebration */}
      <SolveCelebration />
    </main>
  );
}
