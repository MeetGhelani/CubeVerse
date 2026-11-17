import * as THREE from 'three';
import {
  CUBIE_SPACING,
  CUBIE_SIZE,
  RubiksFaceKey,
  RubiksMoveKey,
  RUBIKS_FACES,
  CubieDefinition,
  CubieSticker,
  CubieType
} from './rubiks-math';

// Void Cube: Identical to 3x3 Rubik's cube, but WITHOUT the 6 center pieces
// A hollow hole runs straight through the cube along X, Y, and Z axes
export function generateInitialVoidCubies(themeColors?: Record<RubiksFaceKey, string>): CubieDefinition[] {
  const cubies: CubieDefinition[] = [];
  const getColor = (f: RubiksFaceKey) => (themeColors && themeColors[f]) || RUBIKS_FACES[f].color;

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // Skip core center
        if (x === 0 && y === 0 && z === 0) continue;

        // In a Void Cube, ALL 6 center pieces are completely absent!
        const isCenter = (x === 0 && y === 0) || (x === 0 && z === 0) || (y === 0 && z === 0);
        if (isCenter) continue;

        const homePosition = new THREE.Vector3(
          x * CUBIE_SPACING,
          y * CUBIE_SPACING,
          z * CUBIE_SPACING
        );

        const stickers: CubieSticker[] = [];

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
        const type: CubieType = stickerCount === 3 ? 'corner' : 'edge';

        cubies.push({
          id: `void-cubie-${x}-${y}-${z}`,
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
