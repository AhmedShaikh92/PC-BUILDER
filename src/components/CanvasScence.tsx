import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Environment, Preload } from "@react-three/drei";
import { PCModel } from "./PCModel";
import * as THREE from "three";
import { Suspense, memo } from "react";
import { ThreeLoader } from "./Loader";

interface CanvasSceneProps {
  scrollProgress: number;
}

const SceneContent = memo(({ scrollProgress }: CanvasSceneProps) => {
  // Section 1: First 50% of scroll
  const section1Progress = Math.min(scrollProgress / 0.5, 1);

  // Dynamic lighting that increases with scroll
  const ambientIntensity = 0.4 + section1Progress * 0.8;
  const mainLightIntensity = 1 + section1Progress * 1.5;

  return (
    <>
      {/* Fixed Camera - NO MOVEMENT */}
      <PerspectiveCamera
        makeDefault
        near={0.1}
        far={10000}
        position={[0, 1, 5]}
        fov={45}
      />

      {/* Dynamic Lighting - increases brightness as PC appears */}
      <ambientLight intensity={ambientIntensity} />

      {/* Main key light */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={mainLightIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Environment for realistic reflections - optimized preset */}
      <Environment 
        preset="city" 
        environmentIntensity={0.5}
        background={false}
      />

      {/* Futuristic grid - simplified */}
      <gridHelper args={[30, 30, "#000", "#1a1a2e"]} position={[0, -2, 0]} />

      {/* PC Model with all animations */}
      <PCModel scrollProgress={scrollProgress} />

      {/* Preload assets */}
      <Preload all />

      {/* Subtle fog for depth */}
      <fog attach="fog" args={["#0f0f1e", 10, 25]} />
    </>
  );
});

SceneContent.displayName = "SceneContent";

export const CanvasScene = memo(({ scrollProgress }: CanvasSceneProps) => {
  return (
    <Canvas
      style={{
        width: "100%",
        height: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 0,
      }}
      dpr={[1, 1.5]} // Reduced from [1, 2] for better performance
      performance={{ min: 0.5 }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        powerPreference: "high-performance",
        stencil: false, // Disable if not needed
        depth: true,
      }}
      shadows="soft"
      frameloop="always" // Changed from "demand" for smoother animations
    >
      <Suspense fallback={<ThreeLoader />}>
        <SceneContent scrollProgress={scrollProgress} />
      </Suspense>
    </Canvas>
  );
});

CanvasScene.displayName = "CanvasScene";