import * as THREE from 'three';
import { PetalData } from '../types';

export const generateSakuraTree = (depth: number = 4): { 
  petalData: PetalData, 
  branchGeometry: THREE.BufferGeometry 
} => {
  
  const branches: THREE.Matrix4[] = [];
  const petals: THREE.Vector3[] = [];
  const petalRandoms: THREE.Vector3[] = []; // Random attributes for shader

  // Helper to create a branch segment
  const createBranch = (
    start: THREE.Vector3, 
    direction: THREE.Vector3, 
    length: number, 
    width: number, 
    level: number
  ) => {
    // End point of this branch
    const end = start.clone().add(direction.clone().multiplyScalar(length));

    // Store branch data (visualized usually as instances, but for single geometry merging is easier for static parts)
    // For this high-fidelity demo, we will focus on the Particles (Petals). 
    // The branches will be a simplified single mesh for performance, or we just generate points for petals.
    
    // Generate Petals at the end of thin branches
    if (level >= depth - 1) {
      const petalCountPerTip = 8;
      for (let i = 0; i < petalCountPerTip; i++) {
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5
        );
        petals.push(end.clone().add(offset));
        petalRandoms.push(new THREE.Vector3(Math.random(), Math.random(), Math.random()));
      }
    }

    // Recursion
    if (level < depth) {
      const numChildren = 2 + Math.floor(Math.random() * 2); // 2 or 3 branches
      for (let i = 0; i < numChildren; i++) {
        // Randomize direction
        const spread = 0.8;
        const newDir = direction.clone().applyEuler(new THREE.Euler(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread
        )).normalize();
        
        createBranch(end, newDir, length * 0.7, width * 0.7, level + 1);
      }
    }
  };

  // Start generation
  createBranch(new THREE.Vector3(0, -10, 0), new THREE.Vector3(0, 1, 0), 10, 1.5, 0);

  // Process Petal Data for InstancedMesh
  const count = petals.length;
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = petals[i].x;
    positions[i * 3 + 1] = petals[i].y;
    positions[i * 3 + 2] = petals[i].z;

    randoms[i * 3] = petalRandoms[i].x;
    randoms[i * 3 + 1] = petalRandoms[i].y;
    randoms[i * 3 + 2] = petalRandoms[i].z;
  }

  // Create a placeholder geometry for trunk (simple cylinder logic would go here if we wanted a mesh)
  // For this visual, we primarily care about the glowing points/petals.
  const branchGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 5); 

  return {
    petalData: {
      positions,
      randoms,
      count
    },
    branchGeometry: branchGeo
  };
};
