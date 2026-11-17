'use client';

import React, { useMemo } from 'react';
import { PieceDefinition, FACES } from '@/lib/pyraminx-math';
import {
  createPieceBodyGeometry,
  createStickerGeometry,
  PyraminxMaterials
} from '@/lib/pyraminx-geometry';

interface PyraminxPieceProps {
  pieceDef: PieceDefinition;
  isHovered: boolean;
  isSelected: boolean;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
  onPointerDown?: (e: any) => void;
}

export const PyraminxPiece: React.FC<PyraminxPieceProps> = React.memo(function PyraminxPiece({
  pieceDef,
  isHovered,
  isSelected,
  onPointerOver,
  onPointerOut,
  onPointerDown
}) {
  // Pre-generate body geometry in local piece coordinates
  const bodyGeom = useMemo(() => {
    return createPieceBodyGeometry(pieceDef);
  }, [pieceDef]);

  // Pre-generate sticker geometries in local piece coordinates
  const stickerData = useMemo(() => {
    return pieceDef.stickers.map(sticker => {
      const face = FACES[sticker.faceId];
      const geom = createStickerGeometry(
        sticker.triVertices,
        face.normal,
        pieceDef.homePosition
      );
      const mat = PyraminxMaterials.getStickerMaterial(sticker.color);
      return {
        geom,
        mat,
        faceId: sticker.faceId
      };
    });
  }, [pieceDef]);

  // Select body material based on hover / selection state
  const bodyMat = isSelected
    ? PyraminxMaterials.blackBodySelectedMaterial
    : isHovered
    ? PyraminxMaterials.blackBodyHoverMaterial
    : PyraminxMaterials.blackBodyMaterial;

  return (
    <group
      userData={{ pieceId: pieceDef.id, pieceType: pieceDef.type }}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onPointerDown={onPointerDown}
    >
      {/* Black Plastic Piece Housing */}
      <mesh
        geometry={bodyGeom}
        material={bodyMat}
        castShadow
        receiveShadow
      />

      {/* Colored Speedcube Plastic Tiles */}
      {stickerData.map((s, idx) => (
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
