import * as THREE from 'three';
import { RubiksFaceKey, RubiksMoveKey } from './rubiks-math';

// Total puzzle size is 3.0 units (-1.5 to +1.5 along each axis)
export const MIRROR_CUBE_TOTAL_SIZE = 3.0;

// Asymmetric layer thicknesses along X, Y, and Z axes
// This creates the distinctive shape-shifting effect when turned
export const MIRROR_LAYER_SIZES = {
  // X-axis: Left (-1), Middle (0), Right (+1)
  x: [0.65, 0.95, 1.40],
  // Y-axis: Down (-1), Middle (0), Up (+1)
  y: [0.70, 1.05, 1.25],
  // Z-axis: Back (-1), Middle (0), Front (+1)
  z: [0.60, 1.00, 1.40]
};

// Calculate layer centers and boundaries so the solved cube spans [-1.5, 1.5]
function calculateAxisMetrics(sizes: number[]) {
  const halfTotal = MIRROR_CUBE_TOTAL_SIZE / 2; // 1.5
  let currentStart = -halfTotal;

  const centers: number[] = [];
  const boundaries: number[] = [currentStart];

  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i];
    centers.push(currentStart + s / 2);
    currentStart += s;
    boundaries.push(currentStart);
  }

  return { centers, boundaries };
}

export const AXIS_METRICS = {
  x: calculateAxisMetrics(MIRROR_LAYER_SIZES.x),
  y: calculateAxisMetrics(MIRROR_LAYER_SIZES.y),
  z: calculateAxisMetrics(MIRROR_LAYER_SIZES.z)
};

export interface MirrorCubieSticker {
  faceKey: RubiksFaceKey;
  normal: THREE.Vector3;
  width: number;
  height: number;
  position: THREE.Vector3; // relative to cubie center
}

export interface MirrorCubieDefinition {
  id: string;
  gridCoord: [number, number, number]; // index in 0, 1, 2
  dimensions: THREE.Vector3; // width (x), height (y), depth (z)
  homePosition: THREE.Vector3;
  stickers: MirrorCubieSticker[];
}

// Generate the 26 asymmetric mirror cubies
export function generateInitialMirrorCubies(): MirrorCubieDefinition[] {
  const cubies: MirrorCubieDefinition[] = [];

  for (let ix = 0; ix < 3; ix++) {
    for (let iy = 0; iy < 3; iy++) {
      for (let iz = 0; iz < 3; iz++) {
        // Skip hidden internal center mechanism
        if (ix === 1 && iy === 1 && iz === 1) continue;

        const sizeX = MIRROR_LAYER_SIZES.x[ix];
        const sizeY = MIRROR_LAYER_SIZES.y[iy];
        const sizeZ = MIRROR_LAYER_SIZES.z[iz];

        // Slightly inset (0.97) for realistic piece separation seams
        const dimensions = new THREE.Vector3(sizeX * 0.965, sizeY * 0.965, sizeZ * 0.965);

        const posX = AXIS_METRICS.x.centers[ix];
        const posY = AXIS_METRICS.y.centers[iy];
        const posZ = AXIS_METRICS.z.centers[iz];

        const homePosition = new THREE.Vector3(posX, posY, posZ);
        const stickers: MirrorCubieSticker[] = [];

        // Up Face (iy === 2)
        if (iy === 2) {
          stickers.push({
            faceKey: 'U',
            normal: new THREE.Vector3(0, 1, 0),
            width: sizeX * 0.90,
            height: sizeZ * 0.90,
            position: new THREE.Vector3(0, dimensions.y / 2 + 0.002, 0)
          });
        }
        // Down Face (iy === 0)
        else if (iy === 0) {
          stickers.push({
            faceKey: 'D',
            normal: new THREE.Vector3(0, -1, 0),
            width: sizeX * 0.90,
            height: sizeZ * 0.90,
            position: new THREE.Vector3(0, -dimensions.y / 2 - 0.002, 0)
          });
        }

        // Right Face (ix === 2)
        if (ix === 2) {
          stickers.push({
            faceKey: 'R',
            normal: new THREE.Vector3(1, 0, 0),
            width: sizeZ * 0.90,
            height: sizeY * 0.90,
            position: new THREE.Vector3(dimensions.x / 2 + 0.002, 0, 0)
          });
        }
        // Left Face (ix === 0)
        else if (ix === 0) {
          stickers.push({
            faceKey: 'L',
            normal: new THREE.Vector3(-1, 0, 0),
            width: sizeZ * 0.90,
            height: sizeY * 0.90,
            position: new THREE.Vector3(-dimensions.x / 2 - 0.002, 0, 0)
          });
        }

        // Front Face (iz === 2)
        if (iz === 2) {
          stickers.push({
            faceKey: 'F',
            normal: new THREE.Vector3(0, 0, 1),
            width: sizeX * 0.90,
            height: sizeY * 0.90,
            position: new THREE.Vector3(0, 0, dimensions.z / 2 + 0.002)
          });
        }
        // Back Face (iz === 0)
        else if (iz === 0) {
          stickers.push({
            faceKey: 'B',
            normal: new THREE.Vector3(0, 0, -1),
            width: sizeX * 0.90,
            height: sizeY * 0.90,
            position: new THREE.Vector3(0, 0, -dimensions.z / 2 - 0.002)
          });
        }

        cubies.push({
          id: `mirror-cubie-${ix}-${iy}-${iz}`,
          gridCoord: [ix, iy, iz],
          dimensions,
          homePosition,
          stickers
        });
      }
    }
  }

  return cubies;
}

// Slice detection for the Mirror Cube:
// Uses the slice cutting boundaries along X, Y, Z
export function getMirrorCubiesInLayer(
  currentPositions: Map<string, THREE.Vector3>,
  target: RubiksMoveKey
): string[] {
  const result: string[] = [];

  // Thresholds based on layer cutting planes
  // X cutting planes: boundary 1 and boundary 2
  const xBound1 = AXIS_METRICS.x.boundaries[1]; // between L and M
  const xBound2 = AXIS_METRICS.x.boundaries[2]; // between M and R

  // Y cutting planes
  const yBound1 = AXIS_METRICS.y.boundaries[1]; // between D and E
  const yBound2 = AXIS_METRICS.y.boundaries[2]; // between E and U

  // Z cutting planes
  const zBound1 = AXIS_METRICS.z.boundaries[1]; // between B and S
  const zBound2 = AXIS_METRICS.z.boundaries[2]; // between S and F

  for (const [id, pos] of currentPositions.entries()) {
    switch (target) {
      case 'U':
        if (pos.y > yBound2 - 0.08) result.push(id);
        break;
      case 'D':
        if (pos.y < yBound1 + 0.08) result.push(id);
        break;
      case 'E':
        if (pos.y >= yBound1 - 0.08 && pos.y <= yBound2 + 0.08) result.push(id);
        break;
      case 'R':
        if (pos.x > xBound2 - 0.08) result.push(id);
        break;
      case 'L':
        if (pos.x < xBound1 + 0.08) result.push(id);
        break;
      case 'M':
        if (pos.x >= xBound1 - 0.08 && pos.x <= xBound2 + 0.08) result.push(id);
        break;
      case 'F':
        if (pos.z > zBound2 - 0.08) result.push(id);
        break;
      case 'B':
        if (pos.z < zBound1 + 0.08) result.push(id);
        break;
      case 'S':
        if (pos.z >= zBound1 - 0.08 && pos.z <= zBound2 + 0.08) result.push(id);
        break;
    }
  }

  return result;
}
