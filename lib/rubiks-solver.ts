import { PieceState } from './puzzle-store';

export interface RubiksSolverStepInfo {
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

export interface RubiksAlgorithm {
  id: string;
  name: string;
  moves: string;
  category: 'First Layer' | 'Second Layer' | 'Last Layer' | 'Essential';
  description: string;
  whenToUse: string;
}

export const POPULAR_RUBIKS_ALGORITHMS: RubiksAlgorithm[] = [
  {
    id: 'sexy-move',
    name: 'The Sexy Move',
    moves: "R U R' U'",
    category: 'Essential',
    description: 'The fundamental 4-move building block used in all Rubik\'s cube methods.',
    whenToUse: 'Inserting corners, orienting yellow corners, and cycle setups.'
  },
  {
    id: 'yellow-cross',
    name: 'Yellow Cross (FRUR\'U\'F\')',
    moves: "F R U R' U' F'",
    category: 'Last Layer',
    description: 'Converts a yellow dot, L-shape, or bar into the Yellow Cross.',
    whenToUse: 'When the first two layers are solved and you need the top yellow cross.'
  },
  {
    id: 'sune',
    name: 'Sune (OLL 27)',
    moves: "R U R' U R U2 R'",
    category: 'Last Layer',
    description: 'Orients yellow corners and aligns top edges.',
    whenToUse: 'When the yellow cross is made and you need to orient the top corners or cycle edges.'
  },
  {
    id: 't-perm',
    name: 'T-Permutation',
    moves: "R U R' U' R' F R2 U' R' U' R U R' F'",
    category: 'Last Layer',
    description: 'Swaps two corners and two edges simultaneously.',
    whenToUse: 'Solving last layer permutation (PLL).'
  },
  {
    id: 'middle-right',
    name: 'Insert Middle Edge (Right)',
    moves: "U R U' R' U' F' U F",
    category: 'Second Layer',
    description: 'Inserts an edge from the top layer into the front-right middle slot.',
    whenToUse: 'Second layer (F2L) right insertion.'
  },
  {
    id: 'middle-left',
    name: 'Insert Middle Edge (Left)',
    moves: "U' L' U L U F U' F'",
    category: 'Second Layer',
    description: 'Inserts an edge from the top layer into the front-left middle slot.',
    whenToUse: 'Second layer (F2L) left insertion.'
  },
  {
    id: 'corner-cycle',
    name: 'Cycle 3 Yellow Corners',
    moves: "U R U' L' U R' U' L",
    category: 'Last Layer',
    description: 'Cycles three yellow corners without affecting the rest of the cube.',
    whenToUse: 'Positioning last layer corners in their correct locations.'
  }
];

export function analyzeRubiksState(
  pieces: Map<string, PieceState>,
  isSolved: boolean
): RubiksSolverStepInfo {
  if (isSolved) {
    return {
      stage: 5,
      totalStages: 5,
      stageName: 'Fully Solved',
      shortHint: '🎉 Brilliant! The 3x3 Rubik\'s Cube is completely solved!',
      description: 'All 6 faces are solid uniform colors. Scramble anytime to test your solve speed!',
      isCurrentStageComplete: true
    };
  }

  // Check 1: White Cross (4 white edges: U-F, U-B, U-R, U-L)
  const whiteEdgeIds = ['cubie-0-1-1', 'cubie-0-1--1', 'cubie-1-1-0', 'cubie--1-1-0'];
  const whiteCrossSolved = whiteEdgeIds.every(id => {
    const cubie = pieces.get(id);
    if (!cubie) return false;
    const dist = cubie.position.distanceTo(cubie.homePosition);
    const isIdentityQ = Math.abs(Math.abs(cubie.quaternion.w) - 1.0) < 0.05;
    return dist < 0.08 && isIdentityQ;
  });

  if (!whiteCrossSolved) {
    return {
      stage: 1,
      totalStages: 5,
      stageName: 'Step 1: The White Cross',
      shortHint: 'Place the 4 white edges on the top face, matching their side colors to the centers.',
      description: 'Form a cross with the 4 white edge pieces around the white center. Ensure each edge\'s side sticker matches the adjacent center (Green, Red, Blue, Orange).',
      recommendedAlgorithm: {
        name: 'White Edge Alignment',
        notation: "F2 or R U R'",
        description: 'Rotate edges into position aligned with their matching side centers'
      },
      isCurrentStageComplete: false
    };
  }

  // Check 2: First Layer (White corners)
  const whiteCornerIds = [
    'cubie-1-1-1', 'cubie--1-1-1', 'cubie-1-1--1', 'cubie--1-1--1'
  ];
  const firstLayerSolved = whiteCornerIds.every(id => {
    const cubie = pieces.get(id);
    if (!cubie) return false;
    const dist = cubie.position.distanceTo(cubie.homePosition);
    const isIdentityQ = Math.abs(Math.abs(cubie.quaternion.w) - 1.0) < 0.05;
    return dist < 0.08 && isIdentityQ;
  });

  if (!firstLayerSolved) {
    return {
      stage: 2,
      totalStages: 5,
      stageName: 'Step 2: First Layer Corners',
      shortHint: 'Insert the 4 white corner pieces using the Sexy Move (R U R\' U\').',
      description: 'Position each white corner directly below its target slot, then repeat the Sexy Move until the corner is correctly oriented and seated.',
      recommendedAlgorithm: {
        name: 'The Sexy Move',
        notation: "R U R' U'",
        description: 'Repeat 1 to 5 times until the white corner settles into place'
      },
      isCurrentStageComplete: false
    };
  }

  // Check 3: Second Layer (Middle edges)
  const middleEdgeIds = ['cubie-1-0-1', 'cubie--1-0-1', 'cubie-1-0--1', 'cubie--1-0--1'];
  const middleLayerSolved = middleEdgeIds.every(id => {
    const cubie = pieces.get(id);
    if (!cubie) return false;
    const dist = cubie.position.distanceTo(cubie.homePosition);
    const isIdentityQ = Math.abs(Math.abs(cubie.quaternion.w) - 1.0) < 0.05;
    return dist < 0.08 && isIdentityQ;
  });

  if (!middleLayerSolved) {
    return {
      stage: 3,
      totalStages: 5,
      stageName: 'Step 3: Second Layer (Middle Edges)',
      shortHint: 'Insert the 4 middle-layer edges using the Left or Right edge insertion algorithms.',
      description: 'Find a non-yellow edge in the bottom/top layer. Align its front color with the center, then insert it into the middle layer.',
      recommendedAlgorithm: {
        name: 'Right Edge Insert',
        notation: "U R U' R' U' F' U F",
        description: 'Inserts edge from top to front-right middle slot'
      },
      isCurrentStageComplete: false
    };
  }

  // Check 4: Yellow Cross & OLL
  return {
    stage: 4,
    totalStages: 5,
    stageName: 'Step 4: Yellow Cross & Last Layer',
    shortHint: 'Use F R U R\' U\' F\' to create the Yellow Cross, then Sune or T-Perm to complete the cube!',
    description: 'Use F R U R\' U\' F\' to create the yellow cross on the opposite face, then cycle and orient the remaining pieces with Sune and corner permute.',
    recommendedAlgorithm: {
      name: 'Yellow Cross Maker',
      notation: "F R U R' U' F'",
      description: 'Converts dot / L-shape / bar into Yellow Cross'
    },
    isCurrentStageComplete: false
  };
}
