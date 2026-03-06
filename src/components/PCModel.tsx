import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface PCModelProps {
  scrollProgress: number;
}

// Preload the model outside component to avoid reload on re-render
useGLTF.preload("models/pc_model.glb");

export function PCModel({ scrollProgress }: PCModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { nodes, materials } = useGLTF("models/pc_model.glb") as any;
  
  // Store material references to avoid lookups every frame
  const materialsRef = useRef<Map<THREE.Material, string>>(new Map());
  
  // Initialize material map once
  useMemo(() => {
    if (groupRef.current && materialsRef.current.size === 0) {
      groupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material;
          
          // Handle both single material and material array
          const matsArray = Array.isArray(mat) ? mat : [mat];
          
          matsArray.forEach((material) => {
            if (material) {
              const materialName =
                Object.keys(materials).find((key) => materials[key] === material) || "";
              materialsRef.current.set(material, materialName);
            }
          });
        }
      });
    }
  }, [materials]);

  // Memoize calculated values that don't need frame-by-frame updates
  const modelTransforms = useMemo(() => {
    // Section 1: First 50% of scroll (PC animation)
    const section1Progress = Math.min(scrollProgress / 0.5, 1);

    // Horizontal movement: right to center
    const startX = 2;
    const endX = -2;
    const xPosition = THREE.MathUtils.lerp(startX, endX, section1Progress);
    
    // Rotation animations
    const rotationX = THREE.MathUtils.lerp(0.2, 0, section1Progress);
    const rotationY = THREE.MathUtils.lerp(0.3, 3, section1Progress);
    const rotationZ = THREE.MathUtils.lerp(0, 0, section1Progress);

    const modelScale = 0.006;

    return {
      position: [xPosition, 1, 0] as [number, number, number],
      rotation: [rotationX, rotationY, rotationZ] as [number, number, number],
      scale: modelScale,
      section1Progress,
    };
  }, [scrollProgress]);

  // Optimize frame updates - only update materials when actually needed
  useFrame(() => {
    if (!groupRef.current) return;

    const { section1Progress } = modelTransforms;
    
    // Only update materials if we're in transition zones
    const shouldUpdate = section1Progress < 0.5 || (section1Progress >= 0.5 && section1Progress < 1);
    if (!shouldUpdate) return;

    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material;

        // Handle both single material and material array
        const matsArray = Array.isArray(mat) ? mat : [mat];

        matsArray.forEach((material) => {
          if (
            material &&
            (material instanceof THREE.MeshStandardMaterial ||
              material instanceof THREE.MeshPhysicalMaterial)
          ) {
            // Wireframe mode in first half of scroll
            if (section1Progress < 0.5) {
              if (!material.wireframe) material.wireframe = true;
              material.emissiveIntensity = 0;
              if (!material.transparent) material.transparent = true;
              const newOpacity = 1 - section1Progress * 2;
              if (Math.abs(material.opacity - newOpacity) > 0.01) {
                material.opacity = newOpacity;
                material.needsUpdate = true;
              }
            }
            // Solid material mode in second half
            else {
              if (material.wireframe) {
                material.wireframe = false;
                material.needsUpdate = true;
              }
              
              const solidProgress = (section1Progress - 0.5) * 2;

              if (solidProgress < 1) {
                if (!material.transparent) material.transparent = true;
                const newOpacity = solidProgress;
                if (Math.abs(material.opacity - newOpacity) > 0.01) {
                  material.opacity = newOpacity;
                  material.needsUpdate = true;
                }
              } else {
                if (material.transparent) {
                  material.transparent = false;
                  material.opacity = 1;
                  material.needsUpdate = true;
                }
              }
            }
          }
        });
      }
    });
  });

  return (
    <group
      ref={groupRef}
      position={modelTransforms.position}
      rotation={modelTransforms.rotation}
      scale={modelTransforms.scale}
    >
      <group
        position={[210.908, -247.874, 107.181]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={[76.485, 104.519, 103.793]}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_PC_black_metal_pc_0.geometry}
          material={materials.PC_black_metal_pc}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_PC_black_metal_pc_0_1.geometry}
          material={materials.PC_black_metal_pc}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_PC_black_metal_pc_0_2.geometry}
          material={materials.PC_black_metal_pc}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_PC_grey_0.geometry}
          material={materials["PC._grey"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_PC_black_metal_Shiny_0.geometry}
          material={materials.PC_black_metal_Shiny}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_RGB_pink_0.geometry}
          material={materials.RGB_pink}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_PCglas_0.geometry}
          material={materials["PC.glas"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_PC_DUST_THING_0.geometry}
          material={materials.PC_DUST_THING}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_PC_black_plastic_0.geometry}
          material={materials.PC_black_plastic}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_fan_white_0.geometry}
          material={materials.fan_white}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_Pc_Motherboard_silver_0.geometry}
          material={materials.Pc_Motherboard_silver}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_Pc_Motherboard_gold_0.geometry}
          material={materials.Pc_Motherboard_gold}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_RGB_pink_less_shine_0.geometry}
          material={materials.RGB_pink_less_shine}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Pc_UNDER_PLATE_0.geometry}
          material={materials.UNDER_PLATE}
        />
      </group>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Pc_wire_PC_black_plastic_0.geometry}
        material={materials.PC_black_plastic}
        position={[210.908, -247.874, 107.181]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={[76.485, 104.519, 103.793]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.platform_UNDER_PLATE_0.geometry}
        material={materials.UNDER_PLATE}
        position={[210.908, -247.874, 107.181]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={[76.485, 104.519, 103.793]}
      />
    </group>
  );
}