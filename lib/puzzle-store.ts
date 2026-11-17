import { useSyncExternalStore } from 'react';
import * as THREE from 'three';
import {
  Move,
  generateInitialPieceDefinitions,
  parseMoveNotation,
  generateScramble,
  AXES,
  getPiecesInLayer,
  PieceDefinition,
  ALL_MOVE_NOTATIONS
} from './pyraminx-math';
import { soundManager } from './audio';

export interface PieceState {
  id: string;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  homePosition: THREE.Vector3;
}

export interface ActiveAnimation {
  move: Move;
  axis: THREE.Vector3;
  targetAngle: number; // in radians: -2*PI/3 for CW, +2*PI/3 for CCW
  currentAngle: number;
  movingPieceIds: string[];
  durationMs: number;
  startTime: number;
}

export type CameraViewPreset = 'isometric' | 'front' | 'right' | 'left' | 'bottom' | 'top';

export interface PuzzleState {
  pieces: Map<string, PieceState>;
  pieceDefs: PieceDefinition[];
  activeAnimation: ActiveAnimation | null;
  moveQueue: Move[];
  history: Move[];
  historyIndex: number;
  moveCount: number;
  isSolved: boolean;
  isScrambled: boolean;
  solveStartTime: number | null;
  elapsedSeconds: number;
  timerActive: boolean;

  // Interaction & Camera Controls
  interactionMode: 'turn' | 'camera'; // 'turn' = drag turns pieces, 'camera' = drag orbits camera
  isInteractingWithPiece: boolean;
  cameraViewPreset: CameraViewPreset | null;
  cameraResetNonce: number;

  // Showcase & Auto modes
  showcaseAutoRotate: boolean;
  autoLayerRotate: boolean;
  lastUserInteractionTime: number;

  // UI & Selection
  selectedPieceId: string | null;
  hoveredPieceId: string | null;
  activeVertexGizmo: number | null; // 0, 1, 2, 3 or null
  isHelpOpen: boolean;
  soundEnabled: boolean;
  victoryNonce: number;
}

// Initial piece definitions
const initialDefs = generateInitialPieceDefinitions();

function createInitialPieceState(): Map<string, PieceState> {
  const map = new Map<string, PieceState>();
  for (const def of initialDefs) {
    map.set(def.id, {
      id: def.id,
      position: def.homePosition.clone(),
      quaternion: new THREE.Quaternion(),
      homePosition: def.homePosition.clone()
    });
  }
  return map;
}

class PuzzleStore {
  private state: PuzzleState;
  private listeners = new Set<() => void>();
  private timerInterval: NodeJS.Timeout | null = null;
  private autoLayerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.state = {
      pieces: createInitialPieceState(),
      pieceDefs: initialDefs,
      activeAnimation: null,
      moveQueue: [],
      history: [],
      historyIndex: -1,
      moveCount: 0,
      isSolved: true,
      isScrambled: false,
      solveStartTime: null,
      elapsedSeconds: 0,
      timerActive: false,
      interactionMode: 'turn',
      isInteractingWithPiece: false,
      cameraViewPreset: null,
      cameraResetNonce: 0,
      showcaseAutoRotate: false, // Default to FALSE when starting so the puzzle stays completely steady for solving!
      autoLayerRotate: false,
      lastUserInteractionTime: Date.now(),
      selectedPieceId: null,
      hoveredPieceId: null,
      activeVertexGizmo: null,
      isHelpOpen: false,
      soundEnabled: true,
      victoryNonce: 0
    };

    if (typeof window !== 'undefined') {
      this.startTimerLoop();
      this.startAutoLayerLoop();
    }
  }

  public getState(): PuzzleState {
    return this.state;
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private setState(partial: Partial<PuzzleState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  public registerUserInteraction() {
    this.state.lastUserInteractionTime = Date.now();
  }

  public setInteractingWithPiece(val: boolean) {
    this.setState({ isInteractingWithPiece: val });
  }

  public setInteractionMode(mode: 'turn' | 'camera') {
    this.registerUserInteraction();
    this.setState({ interactionMode: mode });
  }

  public setCameraViewPreset(preset: CameraViewPreset) {
    this.registerUserInteraction();
    this.setState({
      cameraViewPreset: preset,
      cameraResetNonce: this.state.cameraResetNonce + 1
    });
  }

  public setActiveVertexGizmo(vIdx: number | null) {
    this.setState({ activeVertexGizmo: vIdx });
  }

  // Enqueue a move for animated execution
  public enqueueMove(move: Move) {
    this.registerUserInteraction();

    // When a user makes a move, pause showcase auto-rotation so puzzle stays stable!
    const showcaseAutoRotate = false;

    // Start timer on user move if scrambled
    let timerActive = this.state.timerActive;
    let solveStartTime = this.state.solveStartTime;
    if (this.state.isScrambled && !this.state.timerActive) {
      timerActive = true;
      solveStartTime = Date.now() - this.state.elapsedSeconds * 1000;
    }

    const queue = [...this.state.moveQueue, move];
    this.setState({
      moveQueue: queue,
      showcaseAutoRotate,
      timerActive,
      solveStartTime
    });
    this.processNextMove();
  }

  public doNotation(notation: string) {
    const move = parseMoveNotation(notation);
    this.enqueueMove(move);
  }

  public processNextMove() {
    if (this.state.activeAnimation || this.state.moveQueue.length === 0) {
      return;
    }

    const nextMove = this.state.moveQueue[0];
    const remainingQueue = this.state.moveQueue.slice(1);

    const currentPositions = new Map<string, THREE.Vector3>();
    for (const [id, piece] of this.state.pieces.entries()) {
      currentPositions.set(id, piece.position.clone());
    }

    const movingPieceIds = getPiecesInLayer(
      currentPositions,
      nextMove.vertexIndex,
      nextMove.isTipOnly
    );

    const axis = AXES[nextMove.vertexIndex];
    const targetAngle = (nextMove.clockwise ? -1 : 1) * ((2 * Math.PI) / 3);
    const durationMs = this.state.moveQueue.length > 3 ? 120 : 260;

    const activeAnimation: ActiveAnimation = {
      move: nextMove,
      axis,
      targetAngle,
      currentAngle: 0,
      movingPieceIds,
      durationMs,
      startTime: Date.now()
    };

    if (this.state.soundEnabled) {
      soundManager.playClick(nextMove.isTipOnly ? 1.25 : 1.0);
    }

    this.setState({
      activeAnimation,
      moveQueue: remainingQueue
    });
  }

  public completeActiveAnimation() {
    const anim = this.state.activeAnimation;
    if (!anim) return;

    const rotQ = new THREE.Quaternion().setFromAxisAngle(anim.axis, anim.targetAngle);
    const updatedPieces = new Map(this.state.pieces);

    for (const pieceId of anim.movingPieceIds) {
      const piece = updatedPieces.get(pieceId);
      if (piece) {
        const newPos = piece.position.clone().applyQuaternion(rotQ);
        const newQ = piece.quaternion.clone().premultiply(rotQ).normalize();

        updatedPieces.set(pieceId, {
          ...piece,
          position: newPos,
          quaternion: newQ
        });
      }
    }

    const newHistory = this.state.history.slice(0, this.state.historyIndex + 1);
    newHistory.push(anim.move);
    const newHistoryIndex = newHistory.length - 1;

    let allSolved = true;
    for (const piece of updatedPieces.values()) {
      const distToHome = piece.position.distanceTo(piece.homePosition);
      const isIdentityQ = Math.abs(Math.abs(piece.quaternion.w) - 1.0) < 0.02;
      if (distToHome > 0.08 || !isIdentityQ) {
        allSolved = false;
        break;
      }
    }

    let victoryTrigger = this.state.victoryNonce;
    let timerActive = this.state.timerActive;
    let isScrambled = this.state.isScrambled;

    if (allSolved && this.state.isScrambled) {
      victoryTrigger += 1;
      timerActive = false;
      isScrambled = false;
      if (this.state.soundEnabled) {
        soundManager.playVictory();
      }
    }

    this.setState({
      pieces: updatedPieces,
      activeAnimation: null,
      history: newHistory,
      historyIndex: newHistoryIndex,
      moveCount: this.state.moveCount + 1,
      isSolved: allSolved,
      isScrambled,
      timerActive,
      victoryNonce: victoryTrigger
    });

    if (this.state.moveQueue.length > 0) {
      setTimeout(() => this.processNextMove(), 10);
    }
  }

  public undo() {
    this.registerUserInteraction();
    if (this.state.historyIndex < 0 || this.state.activeAnimation) return;

    const moveToUndo = this.state.history[this.state.historyIndex];
    const inverseMove: Move = {
      vertexIndex: moveToUndo.vertexIndex,
      vertexKey: moveToUndo.vertexKey,
      isTipOnly: moveToUndo.isTipOnly,
      clockwise: !moveToUndo.clockwise,
      notation: moveToUndo.clockwise
        ? `${moveToUndo.isTipOnly ? moveToUndo.vertexKey.toLowerCase() : moveToUndo.vertexKey}'`
        : moveToUndo.isTipOnly
        ? moveToUndo.vertexKey.toLowerCase()
        : moveToUndo.vertexKey
    };

    this.setState({ historyIndex: this.state.historyIndex - 1 });
    this.enqueueMove(inverseMove);
  }

  public redo() {
    this.registerUserInteraction();
    if (this.state.historyIndex >= this.state.history.length - 1 || this.state.activeAnimation) return;

    const nextIndex = this.state.historyIndex + 1;
    const move = this.state.history[nextIndex];
    this.setState({ historyIndex: nextIndex });
    this.enqueueMove(move);
  }

  public scramble(moveCount: number = 14) {
    this.registerUserInteraction();
    const scrambleMoves = generateScramble(moveCount);

    this.setState({
      isScrambled: true,
      timerActive: false,
      elapsedSeconds: 0,
      moveCount: 0,
      solveStartTime: null,
      showcaseAutoRotate: false, // Ensure showcase is off during solving!
      moveQueue: [...this.state.moveQueue, ...scrambleMoves]
    });

    this.processNextMove();
  }

  public resetPuzzle() {
    this.registerUserInteraction();
    this.setState({
      pieces: createInitialPieceState(),
      activeAnimation: null,
      moveQueue: [],
      history: [],
      historyIndex: -1,
      moveCount: 0,
      isSolved: true,
      isScrambled: false,
      timerActive: false,
      elapsedSeconds: 0,
      solveStartTime: null
    });
    if (this.state.soundEnabled) {
      soundManager.playClick(1.5);
    }
  }

  public randomRotation() {
    this.registerUserInteraction();
    const vertexIndex = Math.floor(Math.random() * 4);
    const isTip = Math.random() < 0.25;
    const clockwise = Math.random() < 0.5;
    const notation = `${isTip ? ['u', 'l', 'r', 'b'][vertexIndex] : ['U', 'L', 'R', 'B'][vertexIndex]}${clockwise ? '' : "'"}`;
    this.doNotation(notation);
  }

  public triggerCameraReset() {
    this.registerUserInteraction();
    this.setState({
      cameraViewPreset: 'isometric',
      cameraResetNonce: this.state.cameraResetNonce + 1
    });
  }

  public toggleShowcaseAutoRotate() {
    this.registerUserInteraction();
    this.setState({ showcaseAutoRotate: !this.state.showcaseAutoRotate });
  }

  public toggleAutoLayerRotate() {
    this.registerUserInteraction();
    this.setState({ autoLayerRotate: !this.state.autoLayerRotate });
  }

  public toggleSound() {
    const nextVal = !this.state.soundEnabled;
    soundManager.enabled = nextVal;
    this.setState({ soundEnabled: nextVal });
  }

  public setSelectedPieceId(id: string | null) {
    this.registerUserInteraction();
    this.setState({ selectedPieceId: id });
  }

  public setHoveredPieceId(id: string | null) {
    this.setState({ hoveredPieceId: id });
  }

  public setIsHelpOpen(open: boolean) {
    this.setState({ isHelpOpen: open });
  }

  private startTimerLoop() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state.timerActive && this.state.solveStartTime) {
        const elapsed = Math.floor((Date.now() - this.state.solveStartTime) / 1000);
        this.setState({ elapsedSeconds: elapsed });
      }
    }, 500);
  }

  private startAutoLayerLoop() {
    if (this.autoLayerInterval) clearInterval(this.autoLayerInterval);
    this.autoLayerInterval = setInterval(() => {
      if (
        this.state.autoLayerRotate &&
        !this.state.activeAnimation &&
        this.state.moveQueue.length === 0
      ) {
        const randNotation = ALL_MOVE_NOTATIONS[Math.floor(Math.random() * ALL_MOVE_NOTATIONS.length)];
        this.doNotation(randNotation);
      }
    }, 2400);
  }
}

export const puzzleStore = new PuzzleStore();

export function usePuzzleStore(): PuzzleState {
  return useSyncExternalStore(puzzleStore.subscribe, () => puzzleStore.getState(), () => puzzleStore.getState());
}
