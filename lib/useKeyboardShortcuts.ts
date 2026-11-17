'use client';

import { useEffect } from 'react';
import { puzzleStore } from './puzzle-store';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Undo: Ctrl+Z or plain 'z'
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          puzzleStore.redo();
        } else {
          puzzleStore.undo();
        }
        return;
      }

      // Redo: Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        puzzleStore.redo();
        return;
      }

      const key = e.key;

      switch (key) {
        // Toggle interaction mode (M: Turn Layers vs Orbit Camera)
        case 'm':
        case 'M':
          e.preventDefault();
          const currentMode = puzzleStore.getState().interactionMode;
          puzzleStore.setInteractionMode(currentMode === 'turn' ? 'camera' : 'turn');
          break;

        // Toggle Tips / Suggestions (T)
        case 't':
        case 'T':
          e.preventDefault();
          puzzleStore.toggleTips();
          break;

        // Space: Toggle showcase auto rotation
        case ' ':
          e.preventDefault();
          puzzleStore.toggleShowcaseAutoRotate();
          break;

        // Scramble
        case 's':
        case 'S':
          e.preventDefault();
          puzzleStore.scramble(14);
          break;

        // Auto Layers toggle
        case 'a':
        case 'A':
          e.preventDefault();
          puzzleStore.toggleAutoLayerRotate();
          break;

        // Camera Reset
        case 'c':
        case 'C':
          e.preventDefault();
          puzzleStore.triggerCameraReset();
          break;

        // Help Modal
        case 'h':
        case 'H':
        case '?':
          e.preventDefault();
          puzzleStore.setIsHelpOpen(!puzzleStore.getState().isHelpOpen);
          break;

        // Undo / Redo
        case 'z':
          puzzleStore.undo();
          break;
        case 'y':
          puzzleStore.redo();
          break;

        // Layer rotations: U, L, R, B
        case 'u':
          if (e.shiftKey) puzzleStore.doNotation("U'");
          else puzzleStore.doNotation('U');
          break;
        case 'U':
          puzzleStore.doNotation('U');
          break;

        case 'l':
          if (e.shiftKey) puzzleStore.doNotation("L'");
          else puzzleStore.doNotation('L');
          break;
        case 'L':
          puzzleStore.doNotation('L');
          break;

        case 'r':
          if (e.shiftKey) puzzleStore.doNotation("R'");
          else puzzleStore.doNotation('R');
          break;
        case 'R':
          puzzleStore.doNotation('R');
          break;

        case 'b':
          if (e.shiftKey) puzzleStore.doNotation("B'");
          else puzzleStore.doNotation('B');
          break;
        case 'B':
          puzzleStore.doNotation('B');
          break;

        // Number keys 1-4 for tip turns
        case '1':
          puzzleStore.doNotation(e.shiftKey ? "u'" : 'u');
          break;
        case '2':
          puzzleStore.doNotation(e.shiftKey ? "l'" : 'l');
          break;
        case '3':
          puzzleStore.doNotation(e.shiftKey ? "r'" : 'r');
          break;
        case '4':
          puzzleStore.doNotation(e.shiftKey ? "b'" : 'b');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
