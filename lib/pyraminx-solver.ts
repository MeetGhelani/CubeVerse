import * as THREE from 'three';
import { PieceState } from './puzzle-store';

export interface SolverStepInfo {
  stage: number;
  totalStages: number;
  stageName: string;
  shortHint: string;
  description: string;
  recommendedAlgorithm?: {
    name: string;
    notation: string;
    description: string;
  };
  isCurrentStageComplete: boolean;
}

export interface PyraminxAlgorithm {
  id: string;
  name: string;
  moves: string;
  category: 'First Layer' | 'Last Layer' | 'Tips';
  description: string;
  whenToUse: string;
}

export const POPULAR_ALGORITHMS: PyraminxAlgorithm[] = [
  {
    id: 'sledgehammer',
    name: 'Sledgehammer',
    moves: "R' L R L'",
    category: 'Last Layer',
    description: 'Cycles three top edges without flipping them.',
    whenToUse: 'When all centers and bottom edges are solved, and top edges need permutation.'
  },
  {
    id: 'sune',
    name: 'Right Sune',
    moves: "R U R' U R U R'",
    category: 'Last Layer',
    description: 'Cycles top 3 edges clockwise.',
    whenToUse: 'When the 3 top edges are in the right position but need cycling clockwise.'
  },
  {
    id: 'left-sune',
    name: 'Left Sune',
    moves: "L' U' L U' L' U' L",
    category: 'Last Layer',
    description: 'Cycles top 3 edges counter-clockwise.',
    whenToUse: 'When the 3 top edges need cycling counter-clockwise.'
  },
  {
    id: 'two-edge-flip',
    name: 'Two-Edge Flip',
    moves: "R' L R L' U' L' U L",
    category: 'Last Layer',
    description: 'Flips the front two top edges in place.',
    whenToUse: 'When all edges are in their correct slots, but two edges are flipped upside-down.'
  },
  {
    id: 'insert-right',
    name: 'Right Edge Insert',
    moves: "U R U' R'",
    category: 'First Layer',
    description: 'Inserts a matching edge from the top layer into the right base slot.',
    whenToUse: 'To insert a first-layer edge into the bottom face on the right side.'
  },
  {
    id: 'insert-left',
    name: 'Left Edge Insert',
    moves: "U' L' U L",
    category: 'First Layer',
    description: 'Inserts a matching edge from the top layer into the left base slot.',
    whenToUse: 'To insert a first-layer edge into the bottom face on the left side.'
  }
];

// Analyzes the current puzzle state and returns the current stage and dynamic advice
export function analyzePuzzleState(pieces: Map<string, PieceState>, isSolved: boolean): SolverStepInfo {
  if (isSolved) {
    return {
      stage: 4,
      totalStages: 4,
      stageName: 'Fully Solved',
      shortHint: '🎉 Congratulations! The Pyraminx is completely solved.',
      description: 'All 4 faces have uniform colors. Scramble the puzzle anytime to practice speed solving!',
      isCurrentStageComplete: true
    };
  }

  // Check 1: Are the 4 tips oriented correctly relative to their axial centers?
  const tipsSolved = [0, 1, 2, 3].every(idx => {
    const tip = pieces.get(`tip-${idx}`);
    const center = pieces.get(`center-${idx}`);
    if (!tip || !center) return true;
    // Difference between tip quaternion and center quaternion
    const diffQ = tip.quaternion.clone().invert().multiply(center.quaternion);
    return Math.abs(Math.abs(diffQ.w) - 1.0) < 0.05;
  });

  if (!tipsSolved) {
    return {
      stage: 1,
      totalStages: 4,
      stageName: 'Step 1: Orient Corner Tips',
      shortHint: 'Rotate the 4 corner tips (u, l, r, b) so their colors match the centers below them.',
      description: 'The 4 tips are independent and trivial. Turn each tip (u, l, r, b) by 120° until its colors align with the center piece directly underneath it.',
      recommendedAlgorithm: {
        name: 'Tip Turns',
        notation: 'u / l / r / b',
        description: 'Single 120° twists on any misaligned corner tip'
      },
      isCurrentStageComplete: false
    };
  }

  // Check 2: Are the 4 axial centers aligned?
  const centersSolved = [0, 1, 2, 3].every(idx => {
    const center = pieces.get(`center-${idx}`);
    if (!center) return true;
    return Math.abs(Math.abs(center.quaternion.w) - 1.0) < 0.05;
  });

  if (!centersSolved) {
    return {
      stage: 2,
      totalStages: 4,
      stageName: 'Step 2: Align Axial Centers',
      shortHint: 'Rotate vertex layers so all 3 axial centers on a common face share the same color.',
      description: 'Choose a base face (typically Yellow). Turn the corners so that the 3 yellow axial centers form the "hazard symbol" on the bottom face.',
      recommendedAlgorithm: {
        name: 'Vertex Turns',
        notation: 'U, L, R, B',
        description: 'Rotate the main vertex layers to unify center colors on the base face'
      },
      isCurrentStageComplete: false
    };
  }

  // Check 3: First layer (Base edges)
  const baseEdgeIds = ['edge-1-2', 'edge-1-3', 'edge-2-3'];
  const baseEdgesSolved = baseEdgeIds.every(id => {
    const edge = pieces.get(id);
    if (!edge) return false;
    const dist = edge.position.distanceTo(edge.homePosition);
    const isIdentityQ = Math.abs(Math.abs(edge.quaternion.w) - 1.0) < 0.05;
    return dist < 0.08 && isIdentityQ;
  });

  if (!baseEdgesSolved) {
    return {
      stage: 3,
      totalStages: 4,
      stageName: 'Step 3: Solve Base Edges (First Layer)',
      shortHint: 'Place the 3 bottom edges into the base layer using Insertion moves.',
      description: 'Bring a yellow edge into the top layer, match its side color with the center, and insert it into the base without breaking your centers.',
      recommendedAlgorithm: {
        name: 'Edge Insertion',
        notation: "U R U' R'  or  U' L' U L",
        description: 'Standard right or left first-layer edge insert'
      },
      isCurrentStageComplete: false
    };
  }

  // Check 4: Last Layer (Top 3 edges)
  return {
    stage: 4,
    totalStages: 4,
    stageName: 'Step 4: Solve Last Layer',
    shortHint: 'Use Sledgehammer or Sune to cycle and flip the remaining 3 top edges.',
    description: 'Only 3 top edges remain! If they need cycling, use Sledgehammer (R\' L R L\'). If two edges are flipped, use Two-Edge Flip (R\' L R L\' U\' L\' U L).',
    recommendedAlgorithm: {
      name: 'Sledgehammer',
      notation: "R' L R L'",
      description: 'Cycle top edges or orient top layer'
    },
    isCurrentStageComplete: false
  };
}
