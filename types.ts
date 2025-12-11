export interface TreeData {
  positions: Float32Array;
  rotations: Float32Array;
  scales: Float32Array;
  colors: Float32Array;
  count: number;
}

export interface PetalData {
  positions: Float32Array;
  randoms: Float32Array;
  count: number;
}

export interface BranchData {
  matrices: Float32Array;
  count: number;
}
