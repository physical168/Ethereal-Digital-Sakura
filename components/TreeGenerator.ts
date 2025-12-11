import * as THREE from 'three';
import { PetalData, BranchData } from '../types';

export const generateSakuraTree = (depth: number = 5): { 
  petalData: PetalData, 
  branchData: BranchData
} => {
  
  const petalPositions: number[] = [];
  const petalRandoms: number[] = [];
  const branchMatrices: number[] = [];

  // Helper to create a branch segment
  const createBranch = (
    start: THREE.Vector3, 
    direction: THREE.Vector3, 
    length: number, 
    width: number, 
    level: number
  ) => {
    // 1. Calculate End Point
    const end = start.clone().add(direction.clone().multiplyScalar(length));
    
    // 2. Generate Branch Segment Instance (Cylinder)
    // Cylinder is Y-up, centered at (0,0,0).
    // We need to position it at the midpoint between start and end.
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    
    // Calculate rotation to align Y-axis with direction
    const up = new THREE.Vector3(0, 1, 0);
    // Ensure direction is normalized
    const dirNorm = direction.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dirNorm);
    
    // Create Matrix: Position + Rotation + Scale
    // Scale X/Z is width (thickness), Y is length.
    // Base geometry assumes diameter 1, height 1.
    const matrix = new THREE.Matrix4().compose(
      midpoint,
      quaternion,
      new THREE.Vector3(width, length, width)
    );
    
    matrix.toArray(branchMatrices, branchMatrices.length);

    // 3. Generate Petals
    // Generate on tips and slightly on the second to last level for density
    if (level >= depth - 1) {
      const petalCountPerTip = 12; // Increased density
      for (let i = 0; i < petalCountPerTip; i++) {
        // Random offset sphere around the end of branch
        const r = Math.random() * 2.5; // Radius of cluster
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const offset = new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );

        const pPos = end.clone().add(offset);
        
        petalPositions.push(pPos.x, pPos.y, pPos.z);
        // Randoms: x=phase, y=speed/turbulence, z=radius offset
        petalRandoms.push(Math.random(), Math.random(), Math.random());
      }
    }

    // 4. Recursion
    if (level < depth) {
      // 2 to 3 branches
      const numChildren = 2 + (Math.random() > 0.4 ? 1 : 0); 
      
      for (let i = 0; i < numChildren; i++) {
        // Randomize direction
        // Spread factor reduces as we go up to keep shape somewhat contained but still organic
        const spread = 0.6 + (level * 0.1); 
        
        const newDir = direction.clone().applyEuler(new THREE.Euler(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread
        )).normalize();
        
        // Decay length and width
        createBranch(
          end, 
          newDir, 
          length * 0.75, 
          width * 0.7, 
          level + 1
        );
      }
    }
  };

  // Start generation from trunk base
  createBranch(
    new THREE.Vector3(0, -12, 0), // Start lower to center tree in view
    new THREE.Vector3(0, 1, 0), 
    11, 
    2.5, 
    0
  );

  return {
    petalData: {
      positions: new Float32Array(petalPositions),
      randoms: new Float32Array(petalRandoms),
      count: petalPositions.length / 3
    },
    branchData: {
      matrices: new Float32Array(branchMatrices),
      count: branchMatrices.length / 16
    }
  };
};
