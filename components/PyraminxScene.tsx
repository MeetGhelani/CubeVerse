'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { PyraminxModel } from './PyraminxModel';
import { RubiksModel } from './RubiksModel';
import { MirrorModel } from './MirrorModel';
import { VoidModel } from './VoidModel';
import { usePuzzleStore, puzzleStore, CameraViewPreset } from '@/lib/puzzle-store';

const PRESET_CAMERA_POSITIONS: Record<CameraViewPreset, THREE.Vector3> = {
  isometric: new THREE.Vector3(4.8, 3.6, 5.4),
  front: new THREE.Vector3(0, 0, 6.8),         // Direct front view
  right: new THREE.Vector3(6.8, 0, 0),         // Direct right view
  left: new THREE.Vector3(-6.8, 0, 0),         // Direct left view
  bottom: new THREE.Vector3(0, -6.8, 0.01),    // Direct bottom view
  top: new THREE.Vector3(0, 6.8, 0.01)         // Direct top view
};

const TARGET_POS = new THREE.Vector3(0, 0, 0);

const CameraController: React.FC = () => {
  const { cameraResetNonce, cameraViewPreset, isInteractingWithPiece, interactionMode } = usePuzzleStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const isTransitioningRef = useRef(false);
  const transitionProgressRef = useRef(0);
  const startPosRef = useRef(new THREE.Vector3());
  const targetPosRef = useRef(PRESET_CAMERA_POSITIONS.isometric.clone());

  useEffect(() => {
    if (cameraResetNonce > 0) {
      isTransitioningRef.current = true;
      transitionProgressRef.current = 0;
      startPosRef.current.copy(camera.position);

      const preset = cameraViewPreset || 'isometric';
      targetPosRef.current.copy(PRESET_CAMERA_POSITIONS[preset]);
    }
  }, [cameraResetNonce, cameraViewPreset, camera]);

  useFrame((_, delta) => {
    if (isTransitioningRef.current) {
      transitionProgressRef.current += delta * 3.0;
      const t = Math.min(1.0, transitionProgressRef.current);
      const easedT = t * t * (3 - 2 * t);

      camera.position.lerpVectors(startPosRef.current, targetPosRef.current, easedT);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(TARGET_POS, easedT);
        controlsRef.current.update();
      }

      if (t >= 1.0) {
        isTransitioningRef.current = false;
      }
    }
  });

  const orbitEnabled = interactionMode === 'camera' || !isInteractingWithPiece;

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={orbitEnabled}
      enableDamping
      dampingFactor={0.07}
      minDistance={3.0}
      maxDistance={12.0}
      target={[0, 0, 0]}
      onStart={() => puzzleStore.registerUserInteraction()}
      onChange={() => puzzleStore.registerUserInteraction()}
    />
  );
};

export const PyraminxScene: React.FC = () => {
  const { puzzleType } = usePuzzleStore();

  const handleDoubleClick = () => {
    puzzleStore.triggerCameraReset();
  };

  return (
    <div
      className="relative w-full h-full select-none"
      onDoubleClick={handleDoubleClick}
      onPointerUp={() => {
        puzzleStore.setInteractingWithPiece(false);
      }}
    >
      <Canvas
        shadows
        camera={{
          position: [4.8, 3.6, 5.4],
          fov: 44,
          near: 0.1,
          far: 50
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <ambientLight intensity={0.5} />

        <directionalLight
          position={[6, 9, 6]}
          intensity={1.7}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={25}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-bias={-0.00015}
        />

        <directionalLight
          position={[-6, 4, -4]}
          intensity={0.7}
          color="#dbeafe"
        />

        <directionalLight
          position={[0, -5, -6]}
          intensity={0.5}
          color="#fef3c7"
        />

        <directionalLight
          position={[0, 7, 0]}
          intensity={0.6}
          color="#ffffff"
        />

        <Environment
          preset="city"
          environmentIntensity={puzzleType === 'mirror' ? 0.85 : 0.4}
        />

        <ContactShadows
          position={[0, -1.85, 0]}
          opacity={0.65}
          scale={9}
          blur={1.8}
          far={3.8}
          resolution={1024}
          color="#000000"
        />

        <CameraController />

        {/* Dynamic Puzzle Model based on active selection */}
        {puzzleType === 'pyraminx' ? (
          <PyraminxModel />
        ) : puzzleType === 'mirror' ? (
          <MirrorModel />
        ) : puzzleType === 'void' ? (
          <VoidModel />
        ) : (
          <RubiksModel />
        )}
      </Canvas>
    </div>
  );
};
