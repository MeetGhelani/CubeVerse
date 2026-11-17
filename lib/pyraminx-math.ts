import * as THREE from 'three';

// Regular tetrahedron geometry constants
export const TETRA_RADIUS = 2.4;
export const RX_Z = (TETRA_RADIUS * 2 * Math.SQRT2) / 3;

// The 4 vertices of the regular tetrahedron centered at (0, 0, 0)
// V0 is top (+Y), V1 is Left/Front-Left, V2 is Right/Front-Right, V3 is Back
export const VERTICES: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] = [
  new THREE.Vector3(0, TETRA_RADIUS, 0),                                      // 0: Up (U)
  new THREE.Vector3(-RX_Z * Math.sqrt(3) / 2, -TETRA_RADIUS / 3, -RX_Z / 2),  // 1: Left (L)
  new THREE.Vector3(RX_Z * Math.sqrt(3) / 2, -TETRA_RADIUS / 3, -RX_Z / 2),   // 2: Right (R)
  new THREE.Vector3(0, -TETRA_RADIUS / 3, RX_Z)                                // 3: Back (B)
];

// 4 rotation axes passing from origin through each vertex
export const AXES: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] = [
  VERTICES[0].clone().normalize(),
  VERTICES[1].clone().normalize(),
  VERTICES[2].clone().normalize(),
  VERTICES[3].clone().normalize()
];

export const VERTEX_NAMES = ['U', 'L', 'R', 'B'] as const;
export type VertexKey = (typeof VERTEX_NAMES)[number];

export interface FaceDefinition {
  id: number;
  name: string;
  oppositeVertex: number;
  vertices: [number, number, number]; // 3 vertices forming this face (counter-clockwise from outside)
  normal: THREE.Vector3;
  color: string;
  colorName: string;
}

// 4 faces of the Pyraminx
// Face 0: Bottom (opposite V0 - Yellow)
// Face 1: Right (opposite V1 - Blue)
// Face 2: Left (opposite V2 - Green)
// Face 3: Front (opposite V3 - Red)
export const FACES: FaceDefinition[] = [
  {
    id: 0,
    name: 'Bottom',
    oppositeVertex: 0,
    vertices: [1, 3, 2],
    normal: new THREE.Vector3(0, -1, 0),
    color: '#FACC15', // Vibrant Speedcube Yellow
    colorName: 'Yellow'
  },
  {
    id: 1,
    name: 'Right',
    oppositeVertex: 1,
    vertices: [0, 2, 3],
    normal: VERTICES[1].clone().negate().normalize(),
    color: '#2563EB', // Vibrant Speedcube Blue
    colorName: 'Blue'
  },
  {
    id: 2,
    name: 'Left',
    oppositeVertex: 2,
    vertices: [0, 3, 1],
    normal: VERTICES[2].clone().negate().normalize(),
    color: '#16A34A', // Vibrant Speedcube Green
    colorName: 'Green'
  },
  {
    id: 3,
    name: 'Front',
    oppositeVertex: 3,
    vertices: [0, 1, 2],
    normal: VERTICES[3].clone().negate().normalize(),
    color: '#E11D48', // Vibrant Speedcube Red
    colorName: 'Red'
  }
];

export type PieceType = 'tip' | 'center' | 'edge';

export interface StickerDefinition {
  faceId: number;
  triVertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
  center: THREE.Vector3;
  color: string;
}

export interface PieceDefinition {
  id: string;
  type: PieceType;
  homePosition: THREE.Vector3;
  stickers: StickerDefinition[];
  vertexIndices: number[];
}

// Helper to compute a face center
function faceCenter(vA: THREE.Vector3, vB: THREE.Vector3, vC: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3);
}

// Generate the 14 standard pieces and their initial 36 stickers
export function generateInitialPieceDefinitions(): PieceDefinition[] {
  const pieces: PieceDefinition[] = [];

  // 1. 4 Tip pieces (at each vertex)
  for (let i = 0; i < 4; i++) {
    const vI = VERTICES[i];
    const tipCenter = vI.clone().multiplyScalar(2 / 3);
    const stickers: StickerDefinition[] = [];

    // Tip i meets the 3 faces that contain vertex i (all faces except face i)
    for (const face of FACES) {
      if (face.oppositeVertex === i) continue;
      const otherVerts = face.vertices.filter(vIdx => vIdx !== i);
      const vJ = VERTICES[otherVerts[0]];
      const vK = VERTICES[otherVerts[1]];

      const pA = vI.clone();
      const pB = new THREE.Vector3().addVectors(vI.clone().multiplyScalar(2), vJ).divideScalar(3);
      const pC = new THREE.Vector3().addVectors(vI.clone().multiplyScalar(2), vK).divideScalar(3);
      const sCenter = new THREE.Vector3().add(pA).add(pB).add(pC).divideScalar(3);

      stickers.push({
        faceId: face.id,
        triVertices: [pA, pB, pC],
        center: sCenter,
        color: face.color
      });
    }

    pieces.push({
      id: `tip-${i}`,
      type: 'tip',
      homePosition: tipCenter,
      stickers,
      vertexIndices: [i]
    });
  }

  // 2. 4 Axial Center pieces (along each vertex axis)
  for (let i = 0; i < 4; i++) {
    const vI = VERTICES[i];
    const otherIndices = [0, 1, 2, 3].filter(idx => idx !== i);

    // Compute exact centroid of axial center 7 vertices
    const centerPts = [
      new THREE.Vector3().addVectors(vI.clone().multiplyScalar(2), VERTICES[otherIndices[0]]).divideScalar(3),
      new THREE.Vector3().addVectors(vI.clone().multiplyScalar(2), VERTICES[otherIndices[1]]).divideScalar(3),
      new THREE.Vector3().addVectors(vI.clone().multiplyScalar(2), VERTICES[otherIndices[2]]).divideScalar(3),
      faceCenter(vI, VERTICES[otherIndices[0]], VERTICES[otherIndices[1]]),
      faceCenter(vI, VERTICES[otherIndices[1]], VERTICES[otherIndices[2]]),
      faceCenter(vI, VERTICES[otherIndices[2]], VERTICES[otherIndices[0]]),
      vI.clone().multiplyScalar(0.08)
    ];
    const centerPos = new THREE.Vector3();
    centerPts.forEach(p => centerPos.add(p));
    centerPos.divideScalar(centerPts.length);

    const stickers: StickerDefinition[] = [];

    // Meets 3 faces containing vertex i
    for (const face of FACES) {
      if (face.oppositeVertex === i) continue;
      const otherVerts = face.vertices.filter(vIdx => vIdx !== i);
      const vJ = VERTICES[otherVerts[0]];
      const vK = VERTICES[otherVerts[1]];

      const p1 = new THREE.Vector3().addVectors(vI.clone().multiplyScalar(2), vJ).divideScalar(3);
      const p2 = new THREE.Vector3().addVectors(vI.clone().multiplyScalar(2), vK).divideScalar(3);
      const fc = faceCenter(vI, vJ, vK);
      const sCenter = new THREE.Vector3().add(p1).add(p2).add(fc).divideScalar(3);

      stickers.push({
        faceId: face.id,
        triVertices: [p1, p2, fc],
        center: sCenter,
        color: face.color
      });
    }

    pieces.push({
      id: `center-${i}`,
      type: 'center',
      homePosition: centerPos,
      stickers,
      vertexIndices: [i]
    });
  }

  // 3. 6 Edge pieces (between each pair of vertices)
  const edgePairs: [number, number][] = [
    [0, 1], [0, 2], [0, 3],
    [1, 2], [1, 3], [2, 3]
  ];

  for (const [a, b] of edgePairs) {
    const vA = VERTICES[a];
    const vB = VERTICES[b];
    const otherIndices = [0, 1, 2, 3].filter(idx => idx !== a && idx !== b);

    // Compute exact centroid of edge piece 5 vertices
    const edgePts = [
      new THREE.Vector3().addVectors(vA.clone().multiplyScalar(2), vB).divideScalar(3),
      new THREE.Vector3().addVectors(vA, vB.clone().multiplyScalar(2)).divideScalar(3),
      faceCenter(vA, vB, VERTICES[otherIndices[0]]),
      faceCenter(vA, vB, VERTICES[otherIndices[1]]),
      new THREE.Vector3().addVectors(vA, vB).multiplyScalar(0.18)
    ];
    const edgePos = new THREE.Vector3();
    edgePts.forEach(p => edgePos.add(p));
    edgePos.divideScalar(edgePts.length);

    const stickers: StickerDefinition[] = [];

    // An edge (a, b) belongs to the two faces that contain both vertex a and vertex b
    for (const face of FACES) {
      if (face.vertices.includes(a) && face.vertices.includes(b)) {
        const c = face.vertices.find(v => v !== a && v !== b)!;
        const vC = VERTICES[c];

        const p1 = new THREE.Vector3().addVectors(vA.clone().multiplyScalar(2), vB).divideScalar(3);
        const p2 = new THREE.Vector3().addVectors(vA, vB.clone().multiplyScalar(2)).divideScalar(3);
        const fc = faceCenter(vA, vB, vC);
        const sCenter = new THREE.Vector3().add(p1).add(p2).add(fc).divideScalar(3);

        stickers.push({
          faceId: face.id,
          triVertices: [p1, p2, fc],
          center: sCenter,
          color: face.color
        });
      }
    }

    pieces.push({
      id: `edge-${a}-${b}`,
      type: 'edge',
      homePosition: edgePos,
      stickers,
      vertexIndices: [a, b]
    });
  }

  return pieces;
}

export interface Move {
  vertexIndex: number;
  vertexKey: VertexKey;
  isTipOnly: boolean;
  clockwise: boolean; // looking from outside vertex towards center: CW is negative angle (-120deg)
  notation: string;
}

// Notation helper: e.g. 'U', "U'", 'u', "u'"
export function getMoveNotation(vertexIndex: number, isTipOnly: boolean, clockwise: boolean): string {
  const base = VERTEX_NAMES[vertexIndex];
  const char = isTipOnly ? base.toLowerCase() : base;
  return clockwise ? char : `${char}'`;
}

export function parseMoveNotation(notation: string): Move {
  const isPrime = notation.endsWith("'");
  const char = notation.replace("'", '');
  const isTipOnly = char === char.toLowerCase();
  const upper = char.toUpperCase();
  const vertexIndex = VERTEX_NAMES.indexOf(upper as VertexKey);
  if (vertexIndex === -1) {
    throw new Error(`Invalid move notation: ${notation}`);
  }
  return {
    vertexIndex,
    vertexKey: upper as VertexKey,
    isTipOnly,
    clockwise: !isPrime,
    notation
  };
}

export const ALL_MOVE_NOTATIONS = [
  'U', "U'", 'L', "L'", 'R', "R'", 'B', "B'",
  'u', "u'", 'l', "l'", 'r', "r'", 'b', "b'"
];

// Returns the pieces currently belonging to the layer or tip of vertexIndex
export function getPiecesInLayer(
  currentPositions: Map<string, THREE.Vector3>,
  vertexIndex: number,
  isTipOnly: boolean
): string[] {
  const axis = AXES[vertexIndex];
  const threshold = isTipOnly ? 0.48 * TETRA_RADIUS : 0.05 * TETRA_RADIUS;
  const result: string[] = [];

  for (const [id, pos] of currentPositions.entries()) {
    if (pos.dot(axis) > threshold) {
      result.push(id);
    }
  }

  return result;
}

// Generate a random scramble of valid moves (12-16 moves)
export function generateScramble(length: number = 14): Move[] {
  const moves: Move[] = [];
  let lastVertex = -1;

  for (let i = 0; i < length; i++) {
    let vertexIndex: number;
    do {
      vertexIndex = Math.floor(Math.random() * 4);
    } while (vertexIndex === lastVertex);

    lastVertex = vertexIndex;
    const isTip = Math.random() < 0.25;
    const clockwise = Math.random() < 0.5;
    const notation = getMoveNotation(vertexIndex, isTip, clockwise);

    moves.push({
      vertexIndex,
      vertexKey: VERTEX_NAMES[vertexIndex],
      isTipOnly: isTip,
      clockwise,
      notation
    });
  }

  return moves;
}
