import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateSakuraTree } from './TreeGenerator';
import { sakuraVertexShader, sakuraFragmentShader } from './Shaders';

interface SakuraTreeProps {
  progress: number; // 0 to 1
}

const SakuraTree: React.FC<SakuraTreeProps> = ({ progress }) => {
  // Refs
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate Data Once
  const { petalData } = useMemo(() => generateSakuraTree(5), []);

  // Setup Instance Matrices and Attributes
  useEffect(() => {
    if (!meshRef.current) return;

    const tempObj = new THREE.Object3D();
    
    // Set initial matrices (all at identity rotation/scale, just positioned)
    // We actually handle positions in the Shader for the morphing effect, 
    // so we set the instanceMatrix to store the "Home" position in column 3.
    for (let i = 0; i < petalData.count; i++) {
      const x = petalData.positions[i * 3];
      const y = petalData.positions[i * 3 + 1];
      const z = petalData.positions[i * 3 + 2];
      
      tempObj.position.set(x, y, z);
      
      // Random rotation for natural look
      tempObj.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      // Random scale
      const s = 0.5 + Math.random() * 0.5;
      tempObj.scale.set(s, s, s);

      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    
    // Custom Attribute for Randomness
    meshRef.current.geometry.setAttribute(
      'aRandom',
      new THREE.InstancedBufferAttribute(petalData.randoms, 3)
    );

  }, [petalData]);

  // Animation Loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      // Smoothly interpolate the progress uniform
      materialRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uProgress.value,
        progress,
        0.05 // Damping factor
      );
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColor1: { value: new THREE.Color("#FFB7C5") }, // Sakura Pink
    uColor2: { value: new THREE.Color("#E066FF") }, // Deep Magenta
  }), []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, petalData.count]} frustumCulled={false}>
      {/* Petal Geometry: A simple plane or curved plane */}
      <planeGeometry args={[0.5, 0.5, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={sakuraVertexShader}
        fragmentShader={sakuraFragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        transparent={true}
        depthWrite={false} // Important for particle-like transparency
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};

export default SakuraTree;
