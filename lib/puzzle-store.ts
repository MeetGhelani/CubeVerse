import { useSyncExternalStore } from 'react';
import * as THREE from 'three';
import {
  Move as PyraminxMove,
  generateInitialPieceDefinitions,
  parseMoveNotation,
  generateScramble,
  AXES,
  getPiecesInLayer,
  PieceDefinition,
  ALL_MOVE_NOTATIONS
} from './pyraminx-math';
import {
  generateInitialCubies,
  RubiksMove,
  parseRubiksMove,
  generateRubiksScramble,
  RUBIKS_FACES,
  getCubiesInLayer,
  RubiksFaceKey,
  ALL_RUBIKS_MOVES
} from './rubiks-math';
import {
  generateInitialMirrorCubies,
  getMirrorCubiesInLayer
} from './mirror-math';
import {
  generateInitialVoidCubies
} from './void-math';
import { soundManager } from './audio';
import { ColorThemeId, COLOR_THEMES } from './puzzle-themes';

export type PuzzleType = 'pyraminx' | 'rubiks' | 'mirror' | 'void';

export interface PieceState {
  id: string;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  homePosition: THREE.Vector3;
}

export interface ActiveAnimation {
  notation: string;
  axis: THREE.Vector3;
  targetAngle: number;
  currentAngle: number;
  movingPieceIds: string[];
  durationMs: number;
  startTime: number;
}

export type CameraViewPreset = 'isometric' | 'front' | 'right' | 'left' | 'bottom' | 'top';

export interface PuzzleState {
  puzzleType: PuzzleType;
  pieces: Map<string, PieceState>;
  pieceDefs: any[];
  activeAnimation: ActiveAnimation | null;
  moveQueue: string[]; // Store notation string for flexibility
  history: string[];
  historyIndex: number;
  moveCount: number;
  isSolved: boolean;
  isScrambled: boolean;
  solveStartTime: number | null;
  elapsedSeconds: number;
  timerActive: boolean;

  // Interaction & Camera Controls
  interactionMode: 'turn' | 'camera';
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
  activeVertexGizmo: number | null;
  isHelpOpen: boolean;
  isTipsOpen: boolean;
  soundEnabled: boolean;
  victoryNonce: number;
  colorTheme: ColorThemeId;
}

function createPieceMapForType(type: PuzzleType, themeId: ColorThemeId = 'modern'): { pieces: Map<string, PieceState>; defs: any[] } {
  const theme = COLOR_THEMES[themeId] || COLOR_THEMES.modern;

  if (type === 'pyraminx') {
    const themeColors: Record<number, string> = {
      0: theme.pyraminx.bottom,
      1: theme.pyraminx.right,
      2: theme.pyraminx.left,
      3: theme.pyraminx.front
    };
    const defs = generateInitialPieceDefinitions(themeColors);
    const map = new Map<string, PieceState>();
    for (const def of defs) {
      map.set(def.id, {
        id: def.id,
        position: def.homePosition.clone(),
        quaternion: new THREE.Quaternion(),
        homePosition: def.homePosition.clone()
      });
    }
    return { pieces: map, defs };
  } else if (type === 'mirror') {
    const defs = generateInitialMirrorCubies();
    const map = new Map<string, PieceState>();
    for (const def of defs) {
      map.set(def.id, {
        id: def.id,
        position: def.homePosition.clone(),
        quaternion: new THREE.Quaternion(),
        homePosition: def.homePosition.clone()
      });
    }
    return { pieces: map, defs };
  } else if (type === 'void') {
    const themeColors: Record<RubiksFaceKey, string> = theme.rubiks;
    const defs = generateInitialVoidCubies(themeColors);
    const map = new Map<string, PieceState>();
    for (const def of defs) {
      map.set(def.id, {
        id: def.id,
        position: def.homePosition.clone(),
        quaternion: new THREE.Quaternion(),
        homePosition: def.homePosition.clone()
      });
    }
    return { pieces: map, defs };
  } else {
    const themeColors: Record<RubiksFaceKey, string> = theme.rubiks;
    const defs = generateInitialCubies(themeColors);
    const map = new Map<string, PieceState>();
    for (const def of defs) {
      map.set(def.id, {
        id: def.id,
        position: def.homePosition.clone(),
        quaternion: new THREE.Quaternion(),
        homePosition: def.homePosition.clone()
      });
    }
    return { pieces: map, defs };
  }
}

class PuzzleStore {
  private state: PuzzleState;
  private listeners = new Set<() => void>();
  private timerInterval: NodeJS.Timeout | null = null;
  private autoLayerInterval: NodeJS.Timeout | null = null;

  constructor() {
    const { pieces, defs } = createPieceMapForType('pyraminx');

    this.state = {
      puzzleType: 'pyraminx',
      pieces,
      pieceDefs: defs,
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
      showcaseAutoRotate: false,
      autoLayerRotate: false,
      lastUserInteractionTime: Date.now(),
      selectedPieceId: null,
      hoveredPieceId: null,
      activeVertexGizmo: null,
      isHelpOpen: false,
      isTipsOpen: false,
      soundEnabled: true,
      victoryNonce: 0,
      colorTheme: 'modern'
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

  public setPuzzleType(type: PuzzleType) {
    this.registerUserInteraction();
    if (this.state.puzzleType === type) return;

    const { pieces, defs } = createPieceMapForType(type, this.state.colorTheme);

    this.setState({
      puzzleType: type,
      pieces,
      pieceDefs: defs,
      activeAnimation: null,
      moveQueue: [],
      history: [],
      historyIndex: -1,
      moveCount: 0,
      isSolved: true,
      isScrambled: false,
      timerActive: false,
      elapsedSeconds: 0,
      solveStartTime: null,
      selectedPieceId: null,
      hoveredPieceId: null,
      cameraResetNonce: this.state.cameraResetNonce + 1
    });

    if (this.state.soundEnabled) {
      soundManager.playClick(1.2);
    }
  }

  public setColorTheme(themeId: ColorThemeId) {
    this.registerUserInteraction();
    const { pieces, defs } = createPieceMapForType(this.state.puzzleType, themeId);

    // Keep existing position/quaternion of pieces
    for (const [id, pieceState] of this.state.pieces.entries()) {
      const fresh = pieces.get(id);
      if (fresh) {
        fresh.position.copy(pieceState.position);
        fresh.quaternion.copy(pieceState.quaternion);
      }
    }

    this.setState({
      colorTheme: themeId,
      pieceDefs: defs,
      pieces
    });

    if (this.state.soundEnabled) {
      soundManager.playClick(1.3);
    }
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

  public setIsTipsOpen(open: boolean) {
    this.registerUserInteraction();
    this.setState({ isTipsOpen: open });
  }

  public toggleTips() {
    this.setIsTipsOpen(!this.state.isTipsOpen);
  }

  public executeAlgorithm(movesStr: string) {
    this.registerUserInteraction();
    const tokens = movesStr.trim().split(/\s+/);
    for (const token of tokens) {
      if (token) {
        this.enqueueNotation(token);
      }
    }
  }

  public doNotation(notation: string) {
    this.enqueueNotation(notation);
  }

  public enqueueNotation(notation: string) {
    this.registerUserInteraction();

    const showcaseAutoRotate = false;

    let timerActive = this.state.timerActive;
    let solveStartTime = this.state.solveStartTime;
    if (this.state.isScrambled && !this.state.timerActive) {
      timerActive = true;
      solveStartTime = Date.now() - this.state.elapsedSeconds * 1000;
    }

    const queue = [...this.state.moveQueue, notation];
    this.setState({
      moveQueue: queue,
      showcaseAutoRotate,
      timerActive,
      solveStartTime
    });
    this.processNextMove();
  }

  public processNextMove() {
    if (this.state.activeAnimation || this.state.moveQueue.length === 0) {
      return;
    }

    const nextNotation = this.state.moveQueue[0];
    const remainingQueue = this.state.moveQueue.slice(1);

    const currentPositions = new Map<string, THREE.Vector3>();
    for (const [id, piece] of this.state.pieces.entries()) {
      currentPositions.set(id, piece.position.clone());
    }

    let axis: THREE.Vector3;
    let targetAngle: number;
    let movingPieceIds: string[];

    if (this.state.puzzleType === 'pyraminx') {
      const move = parseMoveNotation(nextNotation);
      movingPieceIds = getPiecesInLayer(currentPositions, move.vertexIndex, move.isTipOnly);
      axis = AXES[move.vertexIndex];
      targetAngle = (move.clockwise ? -1 : 1) * ((2 * Math.PI) / 3);
    } else if (this.state.puzzleType === 'mirror') {
      const move = parseRubiksMove(nextNotation);
      movingPieceIds = getMirrorCubiesInLayer(currentPositions, move.target);
      axis = move.axis;
      const baseAngle = (move.clockwise ? -1 : 1) * (Math.PI / 2);
      targetAngle = move.double ? baseAngle * 2 : baseAngle;
    } else {
      // 'rubiks' or 'void'
      const move = parseRubiksMove(nextNotation);
      movingPieceIds = getCubiesInLayer(currentPositions, move.target);
      axis = move.axis;
      const baseAngle = (move.clockwise ? -1 : 1) * (Math.PI / 2);
      targetAngle = move.double ? baseAngle * 2 : baseAngle;
    }

    const durationMs = this.state.moveQueue.length > 3 ? 110 : 250;

    const activeAnimation: ActiveAnimation = {
      notation: nextNotation,
      axis,
      targetAngle,
      currentAngle: 0,
      movingPieceIds,
      durationMs,
      startTime: Date.now()
    };

    if (this.state.soundEnabled) {
      soundManager.playClick(1.0);
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
    newHistory.push(anim.notation);
    const newHistoryIndex = newHistory.length - 1;

    let allSolved = true;
    for (const piece of updatedPieces.values()) {
      const distToHome = piece.position.distanceTo(piece.homePosition);
      const isIdentityQ = Math.abs(Math.abs(piece.quaternion.w) - 1.0) < 0.03;
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
    let inverseMove: string;

    if (this.state.puzzleType === 'pyraminx') {
      const parsed = parseMoveNotation(moveToUndo);
      inverseMove = parsed.clockwise
        ? `${parsed.isTipOnly ? parsed.vertexKey.toLowerCase() : parsed.vertexKey}'`
        : parsed.isTipOnly
        ? parsed.vertexKey.toLowerCase()
        : parsed.vertexKey;
    } else {
      const parsed = parseRubiksMove(moveToUndo);
      if (parsed.double) {
        inverseMove = `${parsed.face}2`;
      } else {
        inverseMove = parsed.clockwise ? `${parsed.face}'` : parsed.face;
      }
    }

    this.setState({ historyIndex: this.state.historyIndex - 1 });
    this.enqueueNotation(inverseMove);
  }

  public redo() {
    this.registerUserInteraction();
    if (this.state.historyIndex >= this.state.history.length - 1 || this.state.activeAnimation) return;

    const nextIndex = this.state.historyIndex + 1;
    const move = this.state.history[nextIndex];
    this.setState({ historyIndex: nextIndex });
    this.enqueueNotation(move);
  }

  public scramble(moveCount?: number) {
    this.registerUserInteraction();

    let scrambleNotations: string[];
    if (this.state.puzzleType === 'pyraminx') {
      const moves = generateScramble(moveCount || 14);
      scrambleNotations = moves.map(m => m.notation);
    } else {
      const moves = generateRubiksScramble(moveCount || 20);
      scrambleNotations = moves.map(m => m.notation);
    }

    this.setState({
      isScrambled: true,
      timerActive: false,
      elapsedSeconds: 0,
      moveCount: 0,
      solveStartTime: null,
      showcaseAutoRotate: false,
      moveQueue: [...this.state.moveQueue, ...scrambleNotations]
    });

    this.processNextMove();
  }

  public resetPuzzle() {
    this.registerUserInteraction();
    const { pieces, defs } = createPieceMapForType(this.state.puzzleType);

    this.setState({
      pieces,
      pieceDefs: defs,
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
    if (this.state.puzzleType === 'pyraminx') {
      const vertexIndex = Math.floor(Math.random() * 4);
      const isTip = Math.random() < 0.25;
      const clockwise = Math.random() < 0.5;
      const notation = `${isTip ? ['u', 'l', 'r', 'b'][vertexIndex] : ['U', 'L', 'R', 'B'][vertexIndex]}${clockwise ? '' : "'"}`;
      this.doNotation(notation);
    } else {
      const faces: RubiksFaceKey[] = ['U', 'D', 'L', 'R', 'F', 'B'];
      const f = faces[Math.floor(Math.random() * faces.length)];
      const isPrime = Math.random() < 0.5;
      this.doNotation(`${f}${isPrime ? "'" : ''}`);
    }
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
        if (this.state.puzzleType === 'pyraminx') {
          const randNotation = ALL_MOVE_NOTATIONS[Math.floor(Math.random() * ALL_MOVE_NOTATIONS.length)];
          this.doNotation(randNotation);
        } else {
          const randNotation = ALL_RUBIKS_MOVES[Math.floor(Math.random() * ALL_RUBIKS_MOVES.length)];
          this.doNotation(randNotation);
        }
      }
    }, 2400);
  }
}

export const puzzleStore = new PuzzleStore();

export function usePuzzleStore(): PuzzleState {
  return useSyncExternalStore(puzzleStore.subscribe, () => puzzleStore.getState(), () => puzzleStore.getState());
}
