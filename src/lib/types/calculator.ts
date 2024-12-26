// Reverse Cost Analysis Types
export type AnalysisMode = 'complete' | 'limited' | 'process' | 'dependencies';

export interface ReverseAnalysisInputs {
  targetROIPeriod: number; // months
  desiredSavings: number;
  maxBudget?: number;
  teamMetrics?: LimitedTeamMetrics;
}

export interface LimitedTeamMetrics {
  teamSize: number;
  hourlyRate: number;
  manualWorkPercentage: number;
}

export interface ProcessEfficiencyInputs {
  qualityImprovementTarget: number;
  knowledgeRetentionGoal: number;
  standardizationLevel: number;
  teamDependencies: TeamDependency[];
}

export interface TeamDependency {
  teamId: string;
  teamName: string;
  dependencyType: 'blocking' | 'non-blocking';
  impactLevel: number; // 1-10
  wipLimit: number;
  leadTime: number;
}

export interface ProcessEfficiencyResults {
  qualityValue: number;
  knowledgeRetentionImpact: number;
  standardizationBenefits: number;
  dependencyMetrics: {
    totalImpact: number;
    wipEffects: number;
    leadTimeOptimization: number;
  };
}

export interface ReverseAnalysisResults {
  maxAllowableCost: number;
  requiredEfficiencyGains: number;
  breakEvenScenarios: BreakEvenScenario[];
}

export interface BreakEvenScenario {
  timeframe: number;
  requiredSavings: number;
  assumptions: {
    efficiencyGain: number;
    teamReduction: number;
    qualityImprovement: number;
  };
}

export type CalculatorModel = 'team' | 'ticket';
export type SolutionType = 'platform' | 'outsource' | 'hybrid';

export interface TeamInputs {
  teamSize: number;
  hourlyRate: number;
  serviceEfficiency: number;
  operationalOverhead: number;
}

export interface TicketInputs {
  monthlyTickets: number;
  hoursPerTicket: number;
  vendorRate: number;
  peoplePerTicket: number;
}

export interface PlatformInputs {
  platformCost: number;
  platformMaintenance: number;
  timeToBuild: number;
  teamReduction: number;
  processEfficiency: number;
  baselineCost: number;
}

export interface OutsourceInputs {
  vendorRate: number;
  managementOverhead: number;
  qualityImpact: number;
  knowledgeLoss: number;
  transitionTime: number;
  transitionCost: number;
  baselineCost: number;
}

export interface HybridInputs {
  platformCost: number;
  platformMaintenance: number;
  timeToBuild: number;
  teamReduction: number;
  processEfficiency: number;
  vendorRate: number;
  managementOverhead: number;
  qualityImpact: number;
  knowledgeLoss: number;
  transitionTime: number;
  transitionCost: number;
  platformPortion: number;
  vendorPortion: number;
  baselineCost: number;
}

export interface SolutionInputs {
  type: SolutionType;
  platform?: PlatformInputs;
  outsource?: OutsourceInputs;
  hybrid?: HybridInputs;
}

export interface MonthlyData {
  month: number;
  baseline: number;
  solution: number;
  savings: number;
}

export interface CalculationResults {
  model: CalculatorModel;
  solution: SolutionType;
  totalCost: number;
  costPerTicket: number;
  annualCost: number;
  efficiency: number;
  recommendedTeamSize: number;
  monthlySavings: number;
  isViable: boolean;
  breakEvenMonths: number | null;
  monthlyData: MonthlyData[];
  solutionInputs?: SolutionInputs;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: string;
  min: number;
  max: number;
  step: number;
  tooltip?: string;
}

// Target-based Planning Types
export interface BaseTargetBasedPlanningInputs {
  model: CalculatorModel;
  desiredROIMonths?: number;
  desiredTeamReduction?: number;
  desiredProcessEfficiency?: number;
  desiredQualityImprovement?: number;
}

export interface TeamTargetBasedPlanningInputs extends BaseTargetBasedPlanningInputs {
  model: 'team';
  currentCapacity: {
    teamSize: number;
    hourlyRate: number;
    serviceEfficiency: number;
    operationalOverhead: number;
  };
}

export interface TicketTargetBasedPlanningInputs extends BaseTargetBasedPlanningInputs {
  model: 'ticket';
  currentCapacity: {
    monthlyTickets: number;
    hoursPerTicket: number;
    peoplePerTicket: number;
    vendorRate: number;
    processingEfficiency: number;
  };
}

export interface TargetBasedPlanningInputs {
  targetType: 'roi' | 'team' | 'efficiency';
  targetValue: number;
  timeframe: number;
  baseInputs: TeamInputs | TicketInputs;
  additionalTargets?: Array<{
    type: 'roi' | 'team' | 'efficiency';
    value: number;
  }>;
}

export interface TargetBasedPlanningResults {
  platformCost: number;
  platformMaintenance: number;
  timeToBuild: number;
  teamReduction: number;
  processEfficiency: number;
  baselineCost: number;
  annualBaseline: number;
  targetType: 'roi' | 'team' | 'efficiency';
  targetValue: number;
  timeframe: number;
  monthlyBaseCost: number;
  monthlyOperatingCostReduction: number;
}

// Other calculator types can be added here 