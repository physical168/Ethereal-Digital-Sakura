import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateSakuraTree } from './TreeGenerator';
import { sakuraVertexShader, sakuraFragmentShader, trunkVertexShader, trunkFragmentShader } from './Shaders';

interface SakuraTreeProps {
  progress: number; // 0 to 1
}

const SakuraTree: React.FC<SakuraTreeProps> = ({ progress }) => {
  // Refs
  const petalMeshRef = useRef<THREE.InstancedMesh>(null);
  const petalMatRef = useRef<THREE.ShaderMaterial>(null);
  
  const branchMeshRef = useRef<THREE.InstancedMesh>(null);
  const branchMatRef = useRef<THREE.ShaderMaterial>(null);

  // Generate Data Once
  // Use depth 6 for a fuller tree
  const { petalData, branchData } = useMemo(() => generateSakuraTree(6), []);

  // Setup Petal Instances
  useEffect(() => {
    if (!petalMeshRef.current) return;

    const tempObj = new THREE.Object3D();
    
    // Set initial matrices for petals
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
      
      // Random scale - Slightly smaller petals for cluster effect
      const s = 0.3 + Math.random() * 0.4;
      tempObj.scale.set(s, s, s);

      tempObj.updateMatrix();
      petalMeshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    petalMeshRef.current.instanceMatrix.needsUpdate = true;
    
    // Custom Attribute for Randomness
    petalMeshRef.current.geometry.setAttribute(
      'aRandom',
      new THREE.InstancedBufferAttribute(petalData.randoms, 3)
    );

  }, [petalData]);

  // Setup Branch Instances
  useEffect(() => {
    if (!branchMeshRef.current) return;
    
    const mat = new THREE.Matrix4();
    for (let i = 0; i < branchData.count; i++) {
      mat.fromArray(branchData.matrices, i * 16);
      branchMeshRef.current.setMatrixAt(i, mat);
    }
    branchMeshRef.current.instanceMatrix.needsUpdate = true;

  }, [branchData]);

  // Animation Loop
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Update Petals
    if (petalMatRef.current) {
      petalMatRef.current.uniforms.uTime.value = time;
      petalMatRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        petalMatRef.current.uniforms.uProgress.value,
        progress,
        0.05
      );
    }

    // Update Trunk
    if (branchMatRef.current) {
      branchMatRef.current.uniforms.uTime.value = time;
      branchMatRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        branchMatRef.current.uniforms.uProgress.value,
        progress,
        0.05
      );
    }
  });

  const petalUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColor1: { value: new THREE.Color("#FFB7C5") }, // Sakura Pink
    uColor2: { value: new THREE.Color("#E066FF") }, // Deep Magenta
  }), []);

  const trunkUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColor: { value: new THREE.Color("#2a1a1a") }, // Dark Brown
  }), []);

  return (
    <group>
      {/* Branches */}
      <instancedMesh ref={branchMeshRef} args={[undefined, undefined, branchData.count]} frustumCulled={false}>
        {/* Unit Cylinder: Diameter 1, Height 1. Scale comes from Matrix. */}
        <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
        <shaderMaterial
          ref={branchMatRef}
          vertexShader={trunkVertexShader}
          fragmentShader={trunkFragmentShader}
          uniforms={trunkUniforms}
          transparent={true}
        />
      </instancedMesh>

      {/* Petals */}
      <instancedMesh ref={petalMeshRef} args={[undefined, undefined, petalData.count]} frustumCulled={false}>
        <planeGeometry args={[0.4, 0.4, 1, 1]} />
        <shaderMaterial
          ref={petalMatRef}
          vertexShader={sakuraVertexShader}
          fragmentShader={sakuraFragmentShader}
          uniforms={petalUniforms}
          side={THREE.DoubleSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
};

export default SakuraTree;
