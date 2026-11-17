import * as THREE from 'three';

export const CUBE_DIM = 3;
export const CUBIE_SIZE = 0.94;
export const CUBIE_SPACING = 1.0; // Distance between cubie centers

export type RubiksFaceKey = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
export type RubiksSliceKey = 'M' | 'E' | 'S';
export type RubiksMoveKey = RubiksFaceKey | RubiksSliceKey;

export interface RubiksFaceDef {
  key: RubiksFaceKey;
  name: string;
  axis: THREE.Vector3; // Normal of the face
  layerCoord: number;  // +1 or -1
  color: string;
  colorName: string;
}

// Modern Speedcube WCA Competition Colors (Vibrant, high-contrast, semi-matte)
export const RUBIKS_FACES: Record<RubiksFaceKey, RubiksFaceDef> = {
  U: {
    key: 'U',
    name: 'Up (White)',
    axis: new THREE.Vector3(0, 1, 0),
    layerCoord: 1,
    color: '#FFFFFF', // Modern Pure Pearlescent Studio White
    colorName: 'White'
  },
  D: {
    key: 'D',
    name: 'Down (Yellow)',
    axis: new THREE.Vector3(0, -1, 0),
    layerCoord: -1,
    color: '#FFD600', // Modern High-Luminance Fluorescent Yellow
    colorName: 'Yellow'
  },
  F: {
    key: 'F',
    name: 'Front (Green)',
    axis: new THREE.Vector3(0, 0, 1),
    layerCoord: 1,
    color: '#00E070', // Modern Electric Mint Neo-Green
    colorName: 'Green'
  },
  B: {
    key: 'B',
    name: 'Back (Blue)',
    axis: new THREE.Vector3(0, 0, -1),
    layerCoord: -1,
    color: '#0084FF', // Modern Vivid Azure / Cobalt Blue
    colorName: 'Blue'
  },
  R: {
    key: 'R',
    name: 'Right (Red)',
    axis: new THREE.Vector3(1, 0, 0),
    layerCoord: 1,
    color: '#FF2449', // Modern Neon Coral / Crimson Red
    colorName: 'Red'
  },
  L: {
    key: 'L',
    name: 'Left (Orange)',
    axis: new THREE.Vector3(-1, 0, 0),
    layerCoord: -1,
    color: '#FF6F00', // Modern Vivid Tangerine Orange
    colorName: 'Orange'
  }
};

export interface RubiksSliceDef {
  key: RubiksSliceKey;
  name: string;
  axis: THREE.Vector3;
  description: string;
}

// Middle Center Slices (Center Lines)
export const RUBIKS_SLICES: Record<RubiksSliceKey, RubiksSliceDef> = {
  M: {
    key: 'M',
    name: 'Middle (Vertical Line)',
    axis: new THREE.Vector3(-1, 0, 0), // Follows L direction
    description: 'Vertical center line between Left and Right'
  },
  E: {
    key: 'E',
    name: 'Equator (Horizontal Line)',
    axis: new THREE.Vector3(0, -1, 0), // Follows D direction
    description: 'Horizontal center line between Up and Down'
  },
  S: {
    key: 'S',
    name: 'Standing (Axial Line)',
    axis: new THREE.Vector3(0, 0, 1),  // Follows F direction
    description: 'Standing center line between Front and Back'
  }
};

export interface CubieSticker {
  faceKey: RubiksFaceKey;
  normal: THREE.Vector3;
  color: string;
}

export type CubieType = 'center' | 'edge' | 'corner' | 'core';

export interface CubieDefinition {
  id: string;
  type: CubieType;
  gridCoord: [number, number, number]; // x, y, z in {-1, 0, 1}
  homePosition: THREE.Vector3;
  stickers: CubieSticker[];
}

// Generate the 26 visible cubies
export function generateInitialCubies(themeColors?: Record<RubiksFaceKey, string>): CubieDefinition[] {
  const cubies: CubieDefinition[] = [];
  const getColor = (f: RubiksFaceKey) => (themeColors && themeColors[f]) || RUBIKS_FACES[f].color;

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // Skip hidden internal center cubie
        if (x === 0 && y === 0 && z === 0) continue;

        const homePosition = new THREE.Vector3(
          x * CUBIE_SPACING,
          y * CUBIE_SPACING,
          z * CUBIE_SPACING
        );

        const stickers: CubieSticker[] = [];

        // Check which faces this cubie touches
        if (y === 1) {
          stickers.push({ faceKey: 'U', normal: new THREE.Vector3(0, 1, 0), color: getColor('U') });
        } else if (y === -1) {
          stickers.push({ faceKey: 'D', normal: new THREE.Vector3(0, -1, 0), color: getColor('D') });
        }

        if (x === 1) {
          stickers.push({ faceKey: 'R', normal: new THREE.Vector3(1, 0, 0), color: getColor('R') });
        } else if (x === -1) {
          stickers.push({ faceKey: 'L', normal: new THREE.Vector3(-1, 0, 0), color: getColor('L') });
        }

        if (z === 1) {
          stickers.push({ faceKey: 'F', normal: new THREE.Vector3(0, 0, 1), color: getColor('F') });
        } else if (z === -1) {
          stickers.push({ faceKey: 'B', normal: new THREE.Vector3(0, 0, -1), color: getColor('B') });
        }

        const stickerCount = stickers.length;
        const type: CubieType = stickerCount === 3 ? 'corner' : stickerCount === 2 ? 'edge' : 'center';

        cubies.push({
          id: `cubie-${x}-${y}-${z}`,
          type,
          gridCoord: [x, y, z],
          homePosition,
          stickers
        });
      }
    }
  }

  return cubies;
}

export interface RubiksMove {
  target: RubiksMoveKey;
  face: RubiksFaceKey; // For compatibility
  axis: THREE.Vector3;
  clockwise: boolean; // looking from outside towards center: CW is negative angle (-90deg)
  double: boolean;    // 180 turn
  notation: string;
}

export function parseRubiksMove(notation: string): RubiksMove {
  const clean = notation.trim();
  const key = clean[0].toUpperCase() as RubiksMoveKey;

  let axis: THREE.Vector3;
  let fallbackFace: RubiksFaceKey = 'U';

  if (RUBIKS_SLICES[key as RubiksSliceKey]) {
    axis = RUBIKS_SLICES[key as RubiksSliceKey].axis;
    fallbackFace = key === 'M' ? 'L' : key === 'E' ? 'D' : 'F';
  } else if (RUBIKS_FACES[key as RubiksFaceKey]) {
    axis = RUBIKS_FACES[key as RubiksFaceKey].axis;
    fallbackFace = key as RubiksFaceKey;
  } else {
    throw new Error(`Invalid Rubik's move: ${notation}`);
  }

  const isPrime = clean.includes("'");
  const isDouble = clean.includes('2');

  return {
    target: key,
    face: fallbackFace,
    axis,
    clockwise: !isPrime,
    double: isDouble,
    notation: clean
  };
}

export const ALL_RUBIKS_MOVES = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'M', "M'", 'M2',
  'E', "E'", 'E2',
  'S', "S'", 'S2'
];

// Returns cubies currently located in the given face layer or center slice
export function getCubiesInLayer(
  currentPositions: Map<string, THREE.Vector3>,
  target: RubiksMoveKey
): string[] {
  const threshold = 0.5 * CUBIE_SPACING;
  const result: string[] = [];

  if (target === 'M') {
    // Vertical center line between Left and Right
    for (const [id, pos] of currentPositions.entries()) {
      if (Math.abs(pos.x) < threshold) {
        result.push(id);
      }
    }
  } else if (target === 'E') {
    // Horizontal center line between Up and Down
    for (const [id, pos] of currentPositions.entries()) {
      if (Math.abs(pos.y) < threshold) {
        result.push(id);
      }
    }
  } else if (target === 'S') {
    // Standing center line between Front and Back
    for (const [id, pos] of currentPositions.entries()) {
      if (Math.abs(pos.z) < threshold) {
        result.push(id);
      }
    }
  } else {
    const faceDef = RUBIKS_FACES[target as RubiksFaceKey];
    const axis = faceDef.axis;
    for (const [id, pos] of currentPositions.entries()) {
      if (pos.dot(axis) > threshold) {
        result.push(id);
      }
    }
  }

  return result;
}

// Generate valid WCA standard scramble (18-22 moves)
export function generateRubiksScramble(length: number = 20): RubiksMove[] {
  const faces: RubiksFaceKey[] = ['U', 'D', 'L', 'R', 'F', 'B'];
  const moves: RubiksMove[] = [];
  let lastFace = '';
  let secondLastFace = '';

  for (let i = 0; i < length; i++) {
    let face: RubiksFaceKey;
    do {
      face = faces[Math.floor(Math.random() * faces.length)];
    } while (face === lastFace || (face === secondLastFace && areOppositeFaces(face, lastFace as RubiksFaceKey)));

    secondLastFace = lastFace;
    lastFace = face;

    const modifier = Math.random();
    let notation: string = face;
    let clockwise = true;
    let double = false;

    if (modifier < 0.35) {
      notation = `${face}'`;
      clockwise = false;
    } else if (modifier < 0.6) {
      notation = `${face}2`;
      double = true;
    }

    moves.push({
      target: face,
      face,
      axis: RUBIKS_FACES[face].axis,
      clockwise,
      double,
      notation
    });
  }

  return moves;
}

function areOppositeFaces(f1: RubiksFaceKey, f2: RubiksFaceKey): boolean {
  return (
    (f1 === 'U' && f2 === 'D') || (f1 === 'D' && f2 === 'U') ||
    (f1 === 'L' && f2 === 'R') || (f1 === 'R' && f2 === 'L') ||
    (f1 === 'F' && f2 === 'B') || (f1 === 'B' && f2 === 'F')
  );
}
