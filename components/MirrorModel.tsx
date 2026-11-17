'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  MirrorCubieDefinition,
  getMirrorCubiesInLayer
} from '@/lib/mirror-math';
import {
  RubiksMoveKey,
  RUBIKS_FACES,
  RUBIKS_SLICES
} from '@/lib/rubiks-math';
import { usePuzzleStore, puzzleStore } from '@/lib/puzzle-store';

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

// Single Asymmetric Mirror Cubie Component
const MirrorCubie: React.FC<{
  cubieDef: MirrorCubieDefinition;
  isHovered: boolean;
  isSelected: boolean;
  isGold: boolean;
  onPointerOver: (e: any) => void;
  onPointerOut: (e: any) => void;
  onPointerDown: (e: any) => void;
}> = React.memo(function MirrorCubie({
  cubieDef,
  isHovered,
  isSelected,
  isGold,
  onPointerOver,
  onPointerOut,
  onPointerDown
}) {
  // Beveled black plastic cubie body
  const bodyGeom = useMemo(() => {
    return new THREE.BoxGeometry(
      cubieDef.dimensions.x,
      cubieDef.dimensions.y,
      cubieDef.dimensions.z
    );
  }, [cubieDef.dimensions]);

  // Brushed Metallic Mirror Sticker Plates (Silver Chrome or Luxury Gold)
  const stickers = useMemo(() => {
    return cubieDef.stickers.map(s => {
      // Plate geometry
      const geom = new THREE.PlaneGeometry(s.width, s.height);

      // Rotate plane to align with normal
      const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        s.normal
      );

      // Brushed Metallic Chrome / Silver or Gold Mirror PBR Material
      const mat = new THREE.MeshPhysicalMaterial({
        color: isGold ? '#f59e0b' : '#e6edf5',
        metalness: isGold ? 0.92 : 0.96,
        roughness: isGold ? 0.14 : 0.10,
        clearcoat: 0.95,
        clearcoatRoughness: 0.08,
        reflectivity: 0.95
      });

      return { geom, mat, position: s.position, quaternion: q };
    });
  }, [cubieDef, isGold]);

  const bodyMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#111317',
      metalness: 0.15,
      roughness: 0.4,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2
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
          position={s.position}
          quaternion={s.quaternion}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
});

export const MirrorModel: React.FC = () => {
  const {
    pieces,
    pieceDefs,
    activeAnimation,
    showcaseAutoRotate,
    hoveredPieceId,
    selectedPieceId,
    interactionMode,
    colorTheme
  } = usePuzzleStore();

  const isGold = colorTheme === 'pastel' || colorTheme === 'cyberpunk';

  const { camera, size } = useThree();

  const rootGroupRef = useRef<THREE.Group>(null);
  const pivotGroupRef = useRef<THREE.Group>(null);
  const cubieRefs = useRef<Map<string, THREE.Group>>(new Map());

  const dragInfo = useRef<{
    isDragging: boolean;
    startScreen: { x: number; y: number };
    cubieId: string;
    hitPoint: THREE.Vector3;
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

    dragInfo.current = {
      isDragging: true,
      startScreen: { x: e.clientX, y: e.clientY },
      cubieId,
      hitPoint: e.point.clone(),
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
          { key: 'M', axis: RUBIKS_SLICES.M.axis },
          { key: 'E', axis: RUBIKS_SLICES.E.axis },
          { key: 'S', axis: RUBIKS_SLICES.S.axis }
        ];

        for (const t of targets) {
          const cubiesInTarget = getMirrorCubiesInLayer(currentPositions, t.key);
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

              candidateMoves.push({
                target: t.key,
                clockwise: false,
                screenTangent: { x: normTx, y: normTy }
              });

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
      {/* Pivot Group for moving slice during turn animation */}
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
                <MirrorCubie
                  cubieDef={def}
                  isHovered={hoveredPieceId === def.id}
                  isSelected={selectedPieceId === def.id}
                  isGold={isGold}
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

      {/* Static / Non-moving pieces */}
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
                <MirrorCubie
                  cubieDef={def}
                  isHovered={hoveredPieceId === def.id}
                  isSelected={selectedPieceId === def.id}
                  isGold={isGold}
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
