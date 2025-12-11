import * as THREE from 'three';
import { PetalData, BranchData } from '../types';

export const generateSakuraTree = (depth: number = 6): { 
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
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const up = new THREE.Vector3(0, 1, 0);
    const dirNorm = direction.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dirNorm);
    
    // Matrix: Position + Rotation + Scale (Width, Length, Width)
    const matrix = new THREE.Matrix4().compose(
      midpoint,
      quaternion,
      new THREE.Vector3(width, length, width)
    );
    
    matrix.toArray(branchMatrices, branchMatrices.length);

    // 3. Generate Petals (Along the branch, not just at tips)
    // Only generate flowers on the outer ~3 layers of the tree
    if (level >= depth - 3) {
      // Density increases towards the tips
      const density = (level / depth) * 3.0; 
      // Base count based on length - Reduced multiplier from 3 to 1.2 for fewer particles
      const count = Math.ceil(length * density * 1.2); 

      for (let i = 0; i < count; i++) {
        // Linear interpolation along branch
        const t = Math.random();
        const pointOnBranch = new THREE.Vector3().lerpVectors(start, end, t);

        // Radial offset (Cloud volume around branch)
        // Outer branches have tighter clouds, inner ones slightly looser
        const cloudRadius = 0.5 + Math.random() * 1.2; 
        
        // Random spherical offset
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const offset = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        ).multiplyScalar(cloudRadius);

        const pPos = pointOnBranch.add(offset);
        
        petalPositions.push(pPos.x, pPos.y, pPos.z);
        // Randoms: x=phase, y=speed/turbulence, z=radius offset
        petalRandoms.push(Math.random(), Math.random(), Math.random());
      }
    }

    // 4. Recursion
    if (level < depth) {
      // Branching factor: Trunk splits into more, tips split into less
      let numChildren = 2;
      if (level === 0) numChildren = 3 + Math.floor(Math.random() * 2); // 3-4 main boughs
      else if (level < 3) numChildren = 2 + Math.floor(Math.random() * 2); // 2-3 mid branches
      
      for (let i = 0; i < numChildren; i++) {
        // Spread logic
        // Level 0 needs wide spread to create the canopy shape
        // Higher levels need chaos
        const spreadBase = level === 0 ? 0.8 : 0.5 + (Math.random() * 0.4);
        
        const rotation = new THREE.Euler(
          (Math.random() - 0.5) * spreadBase * 2.5, // X spread
          (Math.random() - 0.5) * spreadBase * 2.5, // Y rotation (twist)
          (Math.random() - 0.5) * spreadBase * 2.5  // Z spread
        );

        let newDir = direction.clone().applyEuler(rotation).normalize();

        // Gravity effect: Old branches droop down
        // Apply more gravity at higher levels (thinner branches)
        const gravity = 0.15 * (level / depth);
        newDir.y -= gravity;
        newDir.normalize();

        // Decay
        const lengthDecay = 0.7 + Math.random() * 0.1; // 0.7 to 0.8
        const widthDecay = 0.65;

        createBranch(
          end, 
          newDir, 
          length * lengthDecay, 
          width * widthDecay, 
          level + 1
        );
      }
    }
  };

  // Start generation
  // Start lower, trunk is shorter but thicker initially
  createBranch(
    new THREE.Vector3(0, -10, 0), 
    new THREE.Vector3(0, 1, 0), 
    7,    // Initial Length
    2.2,  // Initial Width
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
