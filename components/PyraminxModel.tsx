'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePuzzleStore, puzzleStore } from '@/lib/puzzle-store';
import { PyraminxPiece } from './PyraminxPiece';
import { AXES, getPiecesInLayer, getMoveNotation, VERTICES } from '@/lib/pyraminx-math';

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export const PyraminxModel: React.FC = () => {
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
  const pieceRefs = useRef<Map<string, THREE.Group>>(new Map());

  // Mouse / Touch Drag tracking
  const dragInfo = useRef<{
    isDragging: boolean;
    startScreen: { x: number; y: number };
    pieceId: string;
    hitPoint: THREE.Vector3;
    hasTriggered: boolean;
  } | null>(null);

  // Sync piece positions and quaternions from store when not actively animating
  useEffect(() => {
    if (activeAnimation) return;

    for (const [id, pieceState] of pieces.entries()) {
      const group = pieceRefs.current.get(id);
      if (group) {
        group.position.copy(pieceState.position);
        group.quaternion.copy(pieceState.quaternion);
      }
    }
  }, [pieces, activeAnimation]);

  // Animation Loop via R3F useFrame
  useFrame((state, delta) => {
    const now = Date.now();
    const time = state.clock.getElapsedTime();

    // 1. Handle Active Move Animation
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

    // 2. Handle Showcase Auto-Rotation (idle showcase)
    // Only runs when explicitly enabled, user is idle > 3.5s, not interacting, and no animation
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

  // Direct Piece Drag Handling
  const handlePointerDown = (e: any, pieceId: string) => {
    // If user is in explicit camera orbit mode, let event bubble to OrbitControls
    if (interactionMode === 'camera') return;

    e.stopPropagation();
    puzzleStore.registerUserInteraction();

    // Immediately tell CameraController that piece interaction started -> FREEZES CAMERA!
    puzzleStore.setInteractingWithPiece(true);

    if (activeAnimation) return;

    dragInfo.current = {
      isDragging: true,
      startScreen: { x: e.clientX, y: e.clientY },
      pieceId,
      hitPoint: e.point.clone(),
      hasTriggered: false
    };

    puzzleStore.setSelectedPieceId(
      selectedPieceId === pieceId ? null : pieceId
    );
  };

  // Window-level pointer listeners for drag detection
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!dragInfo.current || !dragInfo.current.isDragging || dragInfo.current.hasTriggered) {
        return;
      }

      const dx = e.clientX - dragInfo.current.startScreen.x;
      const dy = e.clientY - dragInfo.current.startScreen.y;
      const distance = Math.hypot(dx, dy);

      // Snappy threshold: 12px
      if (distance > 12) {
        const pieceId = dragInfo.current.pieceId;
        const hitPoint = dragInfo.current.hitPoint;

        const currentPieces = puzzleStore.getState().pieces;
        const currentPositions = new Map<string, THREE.Vector3>();
        for (const [id, p] of currentPieces.entries()) {
          currentPositions.set(id, p.position.clone());
        }

        const candidateMoves: {
          vertexIndex: number;
          isTipOnly: boolean;
          clockwise: boolean;
          screenTangent: { x: number; y: number };
        }[] = [];

        for (let vIdx = 0; vIdx < 4; vIdx++) {
          const axis = AXES[vIdx];
          const tipPieces = getPiecesInLayer(currentPositions, vIdx, true);
          const layerPieces = getPiecesInLayer(currentPositions, vIdx, false);

          const isTipCandidate = tipPieces.includes(pieceId);
          const isLayerCandidate = layerPieces.includes(pieceId);

          if (isTipCandidate || isLayerCandidate) {
            // Velocity vector at hitPoint when rotating around axis
            let worldTangent = new THREE.Vector3().crossVectors(axis, hitPoint);
            if (worldTangent.lengthSq() < 0.04) {
              // Hitpoint is close to axis (center piece); use displacement of piece centroid
              const pieceState = currentPieces.get(pieceId);
              const piecePos = pieceState?.position || hitPoint;
              const radial = piecePos.clone().sub(axis.clone().multiplyScalar(piecePos.dot(axis)));
              if (radial.lengthSq() > 0.01) {
                worldTangent = new THREE.Vector3().crossVectors(axis, radial);
              } else {
                worldTangent = new THREE.Vector3(1, 0, 0).cross(axis);
                if (worldTangent.lengthSq() < 0.01) {
                  worldTangent = new THREE.Vector3(0, 0, 1).cross(axis);
                }
              }
            }

            const p1 = hitPoint.clone().project(camera);
            const p2 = hitPoint.clone().add(worldTangent).project(camera);

            const screenTx = ((p2.x - p1.x) * size.width) / 2;
            const screenTy = (-(p2.y - p1.y) * size.height) / 2;
            const len = Math.hypot(screenTx, screenTy);

            if (len > 0.001) {
              const normTx = screenTx / len;
              const normTy = screenTy / len;

              const isTip = isTipCandidate && pieceId.startsWith('tip');

              candidateMoves.push({
                vertexIndex: vIdx,
                isTipOnly: isTip,
                clockwise: false,
                screenTangent: { x: normTx, y: normTy }
              });

              candidateMoves.push({
                vertexIndex: vIdx,
                isTipOnly: isTip,
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
          const notation = getMoveNotation(
            bestMove.vertexIndex,
            bestMove.isTipOnly,
            bestMove.clockwise
          );
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
      {/* Pivot Group: holds only pieces that are currently rotating */}
      <group ref={pivotGroupRef}>
        {pieceDefs
          .filter(def => movingPieceIdSet.has(def.id))
          .map(def => {
            const pieceState = pieces.get(def.id);
            return (
              <group
                key={def.id}
                ref={el => {
                  if (el) pieceRefs.current.set(def.id, el);
                  else pieceRefs.current.delete(def.id);
                }}
                position={pieceState?.position || def.homePosition}
                quaternion={pieceState?.quaternion || new THREE.Quaternion()}
              >
                <PyraminxPiece
                  pieceDef={def}
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

      {/* Static Pieces */}
      <group>
        {pieceDefs
          .filter(def => !movingPieceIdSet.has(def.id))
          .map(def => {
            const pieceState = pieces.get(def.id);
            return (
              <group
                key={def.id}
                ref={el => {
                  if (el) pieceRefs.current.set(def.id, el);
                  else pieceRefs.current.delete(def.id);
                }}
                position={pieceState?.position || def.homePosition}
                quaternion={pieceState?.quaternion || new THREE.Quaternion()}
              >
                <PyraminxPiece
                  pieceDef={def}
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
