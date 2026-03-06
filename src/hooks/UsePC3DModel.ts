'use client';

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

export function usePC3DModel() {
  const modelRef = useRef<THREE.Group>(null)
  const materialsRef = useRef<Map<string, THREE.Material>>(new Map())

  useEffect(() => {
    if (!modelRef.current) return

    // Traverse and store materials
    modelRef.current.traverse((node) => {
      if (node instanceof THREE.Mesh && node.material) {
        const originalMaterial = node.material as THREE.Material
        materialsRef.current.set(node.uuid, originalMaterial)
      }
    })
  }, [])

  const applyWireframe = (enabled: boolean) => {
    if (!modelRef.current) return

    modelRef.current.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        if (Array.isArray(node.material)) {
          node.material.forEach((mat) => {
            mat.wireframe = enabled
          })
        } else if (node.material) {
          node.material.wireframe = enabled
        }
      }
    })
  }

  const setEmissiveIntensity = (intensity: number) => {
    if (!modelRef.current) return

    modelRef.current.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        if (Array.isArray(node.material)) {
          node.material.forEach((mat) => {
            if ('emissiveIntensity' in mat) {
              mat.emissiveIntensity = intensity
            }
          })
        } else if (node.material && 'emissiveIntensity' in node.material) {
          node.material.emissiveIntensity = intensity
        }
      }
    })
  }

  const setOpacity = (opacity: number) => {
    if (!modelRef.current) return

    modelRef.current.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        if (Array.isArray(node.material)) {
          node.material.forEach((mat) => {
            if ('opacity' in mat) {
              mat.opacity = opacity
              mat.transparent = true
            }
          })
        } else if (node.material && 'opacity' in node.material) {
          node.material.opacity = opacity
          node.material.transparent = true
        }
      }
    })
  }

  return {
    modelRef,
    applyWireframe,
    setEmissiveIntensity,
    setOpacity,
  }
}
