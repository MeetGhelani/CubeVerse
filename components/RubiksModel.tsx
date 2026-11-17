'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  generateInitialCubies,
  CubieDefinition,
  RubiksFaceKey,
  RubiksMoveKey,
  RUBIKS_FACES,
  RUBIKS_SLICES,
  CUBIE_SIZE,
  getCubiesInLayer
} from '@/lib/rubiks-math';
import { usePuzzleStore, puzzleStore } from '@/lib/puzzle-store';

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

// Create beveled sticker tile geometry for a square cubie face
function createCubieStickerGeometry(faceNormal: THREE.Vector3): THREE.BufferGeometry {
  const size = CUBIE_SIZE * 0.88; // Sleek border around each tile
  const half = size / 2;
  const radius = 0.08; // Corner fillet

  // Create 2D shape in XY plane with rounded corners
  const shape = new THREE.Shape();
  shape.moveTo(-half + radius, -half);
  shape.lineTo(half - radius, -half);
  shape.quadraticCurveTo(half, -half, half, -half + radius);
  shape.lineTo(half, half - radius);
  shape.quadraticCurveTo(half, half, half - radius, half);
  shape.lineTo(-half + radius, half);
  shape.quadraticCurveTo(-half, half, -half, half - radius);
  shape.lineTo(-half, -half + radius);
  shape.quadraticCurveTo(-half, -half, -half + radius, -half);

  const extrudeSettings = {
    depth: 0.016,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.01,
    bevelThickness: 0.008
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();

  // Orient to face normal
  const defaultNormal = new THREE.Vector3(0, 0, 1);
  const q = new THREE.Quaternion().setFromUnitVectors(defaultNormal, faceNormal);
  geom.applyQuaternion(q);

  // Position on the surface of the cubie
  geom.translate(
    faceNormal.x * (CUBIE_SIZE / 2 + 0.008),
    faceNormal.y * (CUBIE_SIZE / 2 + 0.008),
    faceNormal.z * (CUBIE_SIZE / 2 + 0.008)
  );

  geom.computeVertexNormals();
  return geom;
}

// Single Cubie component
const CubieMesh: React.FC<{
  cubieDef: CubieDefinition;
  isHovered: boolean;
  isSelected: boolean;
  onPointerOver: (e: any) => void;
  onPointerOut: (e: any) => void;
  onPointerDown: (e: any) => void;
}> = React.memo(function CubieMesh({
  cubieDef,
  isHovered,
  isSelected,
  onPointerOver,
  onPointerOut,
  onPointerDown
}) {
  // Beveled black plastic cubie body
  const bodyGeom = useMemo(() => {
    return new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
  }, []);

  const stickers = useMemo(() => {
    return cubieDef.stickers.map(s => {
      const geom = createCubieStickerGeometry(s.normal);
      const mat = new THREE.MeshPhysicalMaterial({
        color: s.color,
        roughness: 0.12,
        metalness: 0.02,
        clearcoat: 0.85,
        clearcoatRoughness: 0.08,
        reflectivity: 0.8,
        sheen: 0.3,
        sheenColor: new THREE.Color(s.color)
      });
      return { geom, mat, faceKey: s.faceKey };
    });
  }, [cubieDef]);

  const bodyMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#161619',
      metalness: 0.12,
      roughness: 0.42,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25
    });
  }, []);

  return (
    <group
      userData={{ cubieId: cubieDef.id }}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onPointerDown={onPointerDown}
    >
      <mesh geometry={bodyGeom} material={bodyMat} castShadow receiveShadow />
      {stickers.map((s, idx) => (
        <mesh
          key={idx}
          geometry={s.geom}
          material={s.mat}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
});

export const RubiksModel: React.FC = () => {
  const {
    pieces,
    pieceDefs,
    activeAnimation,
    showcaseAutoRotate,
    hoveredPieceId,
    selectedPieceId,
    interactionMode
  } = usePuzzleStore();

  const { camera, size } = useThree();

  const rootGroupRef = useRef<THREE.Group>(null);
  const pivotGroupRef = useRef<THREE.Group>(null);
  const cubieRefs = useRef<Map<string, THREE.Group>>(new Map());

  const dragInfo = useRef<{
    isDragging: boolean;
    startScreen: { x: number; y: number };
    cubieId: string;
    hitPoint: THREE.Vector3;
    faceNormal: THREE.Vector3;
    hasTriggered: boolean;
  } | null>(null);

  // Sync piece positions and quaternions from store
  useEffect(() => {
    if (activeAnimation) return;

    for (const [id, pieceState] of pieces.entries()) {
      const group = cubieRefs.current.get(id);
      if (group) {
        group.position.copy(pieceState.position);
        group.quaternion.copy(pieceState.quaternion);
      }
    }
  }, [pieces, activeAnimation]);

  useFrame((state, delta) => {
    const now = Date.now();
    const time = state.clock.getElapsedTime();

    // 1. Active Move Animation
    if (activeAnimation && pivotGroupRef.current) {
      const elapsed = now - activeAnimation.startTime;
      const rawProgress = Math.min(1.0, elapsed / activeAnimation.durationMs);
      const easedProgress = easeOutCubic(rawProgress);

      const currentAngle = activeAnimation.targetAngle * easedProgress;
      pivotGroupRef.current.quaternion.setFromAxisAngle(
        activeAnimation.axis,
        currentAngle
      );

      if (rawProgress >= 1.0) {
        pivotGroupRef.current.quaternion.identity();
        puzzleStore.completeActiveAnimation();
      }
    }

    // 2. Showcase Auto Rotation
    if (rootGroupRef.current) {
      const timeSinceInteraction = now - puzzleStore.getState().lastUserInteractionTime;
      const isIdle = timeSinceInteraction > 3500;

      if (showcaseAutoRotate && isIdle && !activeAnimation && !dragInfo.current?.isDragging) {
        rootGroupRef.current.rotation.y += delta * 0.22;
        rootGroupRef.current.rotation.x = Math.sin(time * 0.4) * 0.04;
        rootGroupRef.current.rotation.z = Math.cos(time * 0.3) * 0.03;
      }
    }
  });

  const handlePointerDown = (e: any, cubieId: string) => {
    if (interactionMode === 'camera') return;

    e.stopPropagation();
    puzzleStore.registerUserInteraction();
    puzzleStore.setInteractingWithPiece(true);

    if (activeAnimation) return;

    // Normal of the clicked face in world coordinates
    const faceNormal = e.face?.normal
      ? e.face.normal.clone().transformDirection(e.object.matrixWorld).normalize()
      : new THREE.Vector3(0, 1, 0);

    dragInfo.current = {
      isDragging: true,
      startScreen: { x: e.clientX, y: e.clientY },
      cubieId,
      hitPoint: e.point.clone(),
      faceNormal,
      hasTriggered: false
    };

    puzzleStore.setSelectedPieceId(
      selectedPieceId === cubieId ? null : cubieId
    );
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!dragInfo.current || !dragInfo.current.isDragging || dragInfo.current.hasTriggered) {
        return;
      }

      const dx = e.clientX - dragInfo.current.startScreen.x;
      const dy = e.clientY - dragInfo.current.startScreen.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 12) {
        const cubieId = dragInfo.current.cubieId;
        const hitPoint = dragInfo.current.hitPoint;

        const currentPieces = puzzleStore.getState().pieces;
        const currentPositions = new Map<string, THREE.Vector3>();
        for (const [id, p] of currentPieces.entries()) {
          currentPositions.set(id, p.position.clone());
        }

        // Test all 6 faces and 3 center slices (M, E, S) for candidate turns
        const candidateMoves: {
          target: RubiksMoveKey;
          clockwise: boolean;
          screenTangent: { x: number; y: number };
        }[] = [];

        const targets: { key: RubiksMoveKey; axis: THREE.Vector3 }[] = [
          { key: 'U', axis: RUBIKS_FACES.U.axis },
          { key: 'D', axis: RUBIKS_FACES.D.axis },
          { key: 'L', axis: RUBIKS_FACES.L.axis },
          { key: 'R', axis: RUBIKS_FACES.R.axis },
          { key: 'F', axis: RUBIKS_FACES.F.axis },
          { key: 'B', axis: RUBIKS_FACES.B.axis },
          { key: 'M', axis: RUBIKS_SLICES.M.axis }, // Center vertical line
          { key: 'E', axis: RUBIKS_SLICES.E.axis }, // Center horizontal line
          { key: 'S', axis: RUBIKS_SLICES.S.axis }  // Center axial line
        ];

        for (const t of targets) {
          const cubiesInTarget = getCubiesInLayer(currentPositions, t.key);
          if (cubiesInTarget.includes(cubieId)) {
            const axis = t.axis;
            const worldTangent = new THREE.Vector3().crossVectors(axis, hitPoint);
            const p1 = hitPoint.clone().project(camera);
            const p2 = hitPoint.clone().add(worldTangent).project(camera);

            const screenTx = ((p2.x - p1.x) * size.width) / 2;
            const screenTy = (-(p2.y - p1.y) * size.height) / 2;
            const len = Math.hypot(screenTx, screenTy);

            if (len > 0.001) {
              const normTx = screenTx / len;
              const normTy = screenTy / len;

              // Positive angle (CCW) aligns with worldTangent
              candidateMoves.push({
                target: t.key,
                clockwise: false,
                screenTangent: { x: normTx, y: normTy }
              });

              // Negative angle (CW) opposes worldTangent
              candidateMoves.push({
                target: t.key,
                clockwise: true,
                screenTangent: { x: -normTx, y: -normTy }
              });
            }
          }
        }

        let bestDot = -1;
        let bestMove: (typeof candidateMoves)[0] | null = null;
        const dragNormX = dx / distance;
        const dragNormY = dy / distance;

        for (const cand of candidateMoves) {
          const dot = dragNormX * cand.screenTangent.x + dragNormY * cand.screenTangent.y;
          if (dot > bestDot) {
            bestDot = dot;
            bestMove = cand;
          }
        }

        if (bestMove && bestDot > 0.28) {
          dragInfo.current.hasTriggered = true;
          const notation = `${bestMove.target}${bestMove.clockwise ? '' : "'"}`;
          puzzleStore.doNotation(notation);
        }
      }
    };

    const onPointerUp = () => {
      if (dragInfo.current) {
        dragInfo.current = null;
      }
      puzzleStore.setInteractingWithPiece(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [camera, size]);

  const movingPieceIdSet = new Set(activeAnimation?.movingPieceIds || []);

  return (
    <group ref={rootGroupRef}>
      {/* Pivot Group for moving cubies during 90° rotation */}
      <group ref={pivotGroupRef}>
        {pieceDefs
          .filter(def => movingPieceIdSet.has(def.id))
          .map(def => {
            const pieceState = pieces.get(def.id);
            return (
              <group
                key={def.id}
                ref={el => {
                  if (el) cubieRefs.current.set(def.id, el);
                  else cubieRefs.current.delete(def.id);
                }}
                position={pieceState?.position || def.homePosition}
                quaternion={pieceState?.quaternion || new THREE.Quaternion()}
              >
                <CubieMesh
                  cubieDef={def as any}
                  isHovered={hoveredPieceId === def.id}
                  isSelected={selectedPieceId === def.id}
                  onPointerOver={e => {
                    e.stopPropagation();
                    puzzleStore.setHoveredPieceId(def.id);
                  }}
                  onPointerOut={e => {
                    e.stopPropagation();
                    if (hoveredPieceId === def.id) {
                      puzzleStore.setHoveredPieceId(null);
                    }
                  }}
                  onPointerDown={e => handlePointerDown(e, def.id)}
                />
              </group>
            );
          })}
      </group>

      {/* Static Cubies */}
      <group>
        {pieceDefs
          .filter(def => !movingPieceIdSet.has(def.id))
          .map(def => {
            const pieceState = pieces.get(def.id);
            return (
              <group
                key={def.id}
                ref={el => {
                  if (el) cubieRefs.current.set(def.id, el);
                  else cubieRefs.current.delete(def.id);
                }}
                position={pieceState?.position || def.homePosition}
                quaternion={pieceState?.quaternion || new THREE.Quaternion()}
              >
                <CubieMesh
                  cubieDef={def as any}
                  isHovered={hoveredPieceId === def.id}
                  isSelected={selectedPieceId === def.id}
                  onPointerOver={e => {
                    e.stopPropagation();
                    puzzleStore.setHoveredPieceId(def.id);
                  }}
                  onPointerOut={e => {
                    e.stopPropagation();
                    if (hoveredPieceId === def.id) {
                      puzzleStore.setHoveredPieceId(null);
                    }
                  }}
                  onPointerDown={e => handlePointerDown(e, def.id)}
                />
              </group>
            );
          })}
      </group>
    </group>
  );
};
