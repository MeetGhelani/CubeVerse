import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { PieceDefinition, VERTICES, FACES } from './pyraminx-math';

// Create a rounded, beveled 3D tile geometry for a triangular sticker
// All coordinates are relative to the piece's homePosition
export function createStickerGeometry(
  triVerticesWorld: [THREE.Vector3, THREE.Vector3, THREE.Vector3],
  faceNormal: THREE.Vector3,
  pieceHomePosition: THREE.Vector3
): THREE.BufferGeometry {
  // Convert world triangle vertices into piece local coordinates
  const vA = triVerticesWorld[0].clone().sub(pieceHomePosition);
  const vB = triVerticesWorld[1].clone().sub(pieceHomePosition);
  const vC = triVerticesWorld[2].clone().sub(pieceHomePosition);
  const center = new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3);

  // Inset the triangle slightly (0.915) to leave a sleek, clean black border
  const insetFactor = 0.915;
  const pA = center.clone().lerp(vA, insetFactor);
  const pB = center.clone().lerp(vB, insetFactor);
  const pC = center.clone().lerp(vC, insetFactor);

  // Round the three corners
  const cornerRound = 0.10;
  const corners = [
    { curr: pA, prev: pC, next: pB },
    { curr: pB, prev: pA, next: pC },
    { curr: pC, prev: pB, next: pA }
  ];

  const ringPoints: THREE.Vector3[] = [];
  for (const c of corners) {
    const ptPrev = c.curr.clone().lerp(c.prev, cornerRound);
    const ptNext = c.curr.clone().lerp(c.next, cornerRound);
    // Smooth rounded apex
    const ptApex = c.curr.clone().lerp(
      new THREE.Vector3().addVectors(ptPrev, ptNext).multiplyScalar(0.5),
      0.35
    );
    ringPoints.push(ptPrev, ptApex, ptNext);
  }

  // Ensure points are oriented counter-clockwise relative to faceNormal
  const norm = faceNormal.clone().normalize();
  const edge1 = new THREE.Vector3().subVectors(ringPoints[1], ringPoints[0]);
  const edge2 = new THREE.Vector3().subVectors(ringPoints[2], ringPoints[0]);
  const cross = new THREE.Vector3().crossVectors(edge1, edge2);
  if (cross.dot(norm) < 0) {
    ringPoints.reverse();
  }

  const numRingPts = ringPoints.length; // 9 points

  // Build 3D beveled geometry
  // - Base ring: slightly above piece face (0.003)
  // - Top ring: at height 0.015, slightly inset (0.96) for chamfer bevel
  // - Top center: at height 0.016
  const hBase = 0.003;
  const hTop = 0.015;
  const bevelInset = 0.96;

  const positions: number[] = [];
  const indices: number[] = [];

  // 0 to numRingPts - 1: Base ring
  for (let i = 0; i < numRingPts; i++) {
    const p = ringPoints[i].clone().addScaledVector(norm, hBase);
    positions.push(p.x, p.y, p.z);
  }

  // numRingPts to 2 * numRingPts - 1: Top ring (beveled)
  for (let i = 0; i < numRingPts; i++) {
    const p = center.clone().lerp(ringPoints[i], bevelInset).addScaledVector(norm, hTop);
    positions.push(p.x, p.y, p.z);
  }

  // Vertex 2 * numRingPts: Top Center point
  const topCenter = center.clone().addScaledVector(norm, hTop + 0.001);
  const topCenterIdx = 2 * numRingPts;
  positions.push(topCenter.x, topCenter.y, topCenter.z);

  // Side beveled faces
  for (let i = 0; i < numRingPts; i++) {
    const next = (i + 1) % numRingPts;
    const b1 = i;
    const b2 = next;
    const t1 = numRingPts + i;
    const t2 = numRingPts + next;

    indices.push(b1, b2, t2);
    indices.push(b1, t2, t1);
  }

  // Top face: triangle fan from top center
  for (let i = 0; i < numRingPts; i++) {
    const next = (i + 1) % numRingPts;
    const t1 = numRingPts + i;
    const t2 = numRingPts + next;
    indices.push(topCenterIdx, t1, t2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// Create the solid black plastic body for a piece
// All vertices are transformed to piece local coordinates centered at pieceDef.homePosition
export function createPieceBodyGeometry(pieceDef: PieceDefinition): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];

  if (pieceDef.type === 'tip') {
    const vIdx = pieceDef.vertexIndices[0];
    const vI = VERTICES[vIdx];
    const otherIndices = [0, 1, 2, 3].filter(idx => idx !== vIdx);

    points.push(vI.clone());
    for (const otherIdx of otherIndices) {
      const vOther = VERTICES[otherIdx];
      const pBase = new THREE.Vector3().addVectors(vI.clone().multiplyScalar(2), vOther).divideScalar(3);
      points.push(pBase);
    }
  } else if (pieceDef.type === 'center') {
    const vIdx = pieceDef.vertexIndices[0];
    const vI = VERTICES[vIdx];
    const otherIndices = [0, 1, 2, 3].filter(idx => idx !== vIdx);

    for (const otherIdx of otherIndices) {
      const vOther = VERTICES[otherIdx];
      const pBase = new THREE.Vector3().addVectors(vI.clone().multiplyScalar(2), vOther).divideScalar(3);
      points.push(pBase);
    }

    for (const face of FACES) {
      if (face.oppositeVertex === vIdx) continue;
      const otherVerts = face.vertices.filter(idx => idx !== vIdx);
      const vJ = VERTICES[otherVerts[0]];
      const vK = VERTICES[otherVerts[1]];
      const fc = new THREE.Vector3().add(vI).add(vJ).add(vK).divideScalar(3);
      points.push(fc);
    }

    points.push(vI.clone().multiplyScalar(0.08));
  } else if (pieceDef.type === 'edge') {
    const [a, b] = pieceDef.vertexIndices;
    const vA = VERTICES[a];
    const vB = VERTICES[b];

    points.push(new THREE.Vector3().addVectors(vA.clone().multiplyScalar(2), vB).divideScalar(3));
    points.push(new THREE.Vector3().addVectors(vA, vB.clone().multiplyScalar(2)).divideScalar(3));

    for (const face of FACES) {
      if (face.vertices.includes(a) && face.vertices.includes(b)) {
        const c = face.vertices.find(idx => idx !== a && idx !== b)!;
        const vC = VERTICES[c];
        const fc = new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3);
        points.push(fc);
      }
    }

    points.push(new THREE.Vector3().addVectors(vA, vB).multiplyScalar(0.18));
  }

  // Convert points from world space to piece local space (origin at pieceDef.homePosition)
  const origin = pieceDef.homePosition;
  const seamScale = 0.993; // 0.7% hairline seam gap between adjacent pieces

  const localPoints = points.map(p => {
    return p.clone().sub(origin).multiplyScalar(seamScale);
  });

  // Construct convex hull in local space
  const convexGeom = new ConvexGeometry(localPoints);
  convexGeom.computeVertexNormals();

  return convexGeom;
}

// Materials Cache for high performance and WebGL state optimization
export class PyraminxMaterials {
  public static blackBodyMaterial = new THREE.MeshPhysicalMaterial({
    color: '#161619',
    metalness: 0.12,
    roughness: 0.42,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    reflectivity: 0.5
  });

  public static blackBodyHoverMaterial = new THREE.MeshPhysicalMaterial({
    color: '#161619',
    metalness: 0.12,
    roughness: 0.42,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    reflectivity: 0.5
  });

  public static blackBodySelectedMaterial = new THREE.MeshPhysicalMaterial({
    color: '#161619',
    metalness: 0.12,
    roughness: 0.42,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    reflectivity: 0.5
  });

  // Cached tile materials for the 4 faces
  private static stickerMaterialsMap = new Map<string, THREE.MeshPhysicalMaterial>();

  public static getStickerMaterial(colorHex: string): THREE.MeshPhysicalMaterial {
    if (!this.stickerMaterialsMap.has(colorHex)) {
      const mat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        roughness: 0.12,
        metalness: 0.02,
        clearcoat: 0.85,
        clearcoatRoughness: 0.08,
        reflectivity: 0.8,
        sheen: 0.3,
        sheenColor: new THREE.Color(colorHex)
      });
      this.stickerMaterialsMap.set(colorHex, mat);
    }
    return this.stickerMaterialsMap.get(colorHex)!;
  }
}
