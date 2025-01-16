export interface Team {
  name: string;
  size: number;
  efficiency: number;
}

export interface Node {
  id: string;
  data: {
    label: string;
    size: number;
    efficiency: number;
    throughput: number;
    leadTime: number;
    dependencyFactor: number;
    isHub: boolean;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  data: {
    strength: number;
    type: string;
  };
}

export interface DependencyMatrix {
  teams: string[];
  dependencies: number[][];
}

export interface Metrics {
  avgThroughput: number;
  avgLeadTime: number;
  dependencyComplexity: number;
  flowEfficiency: number;
  dependencyImpactScore: number;
  utilizationRate: number;
  serviceEfficiency: number;
  costPerFTE: number;
  overheadRatio: number;
}

export interface CostAnalysis {
  directMeetingCost: number;
  communicationOverhead: number;
  opportunityCost: number;
  flowEfficiencyCost: number;
  totalCost: number;
} 