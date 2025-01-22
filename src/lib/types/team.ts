export interface Team {
  name: string;
  size: number;
  efficiency: number;
  baseCapacity?: number;  // Optional since it's calculated
} 