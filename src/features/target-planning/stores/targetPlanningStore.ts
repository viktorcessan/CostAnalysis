import { writable } from 'svelte/store';
import type {
  TargetBasedPlanningInputs,
  TargetBasedPlanningResults,
  ReverseAnalysisInputs,
  ReverseAnalysisResults,
  ProcessEfficiencyInputs,
  ProcessEfficiencyResults,
  TeamDependency
} from '$lib/types/calculator';

export interface TargetPlanningState {
  targetBasedResults: TargetBasedPlanningResults | null;
  reverseAnalysisResults: ReverseAnalysisResults | null;
  processEfficiencyResults: ProcessEfficiencyResults | null;
}

const initialState: TargetPlanningState = {
  targetBasedResults: null,
  reverseAnalysisResults: null,
  processEfficiencyResults: null
};

function calculateTargetBasedPlanningResults(inputs: TargetBasedPlanningInputs): TargetBasedPlanningResults {
  const {
    targetType,
    targetValue,
    timeframe,
    baseInputs
  } = inputs;

  // Calculate baseline metrics
  const monthlyBaseCost = calculateTotalCost(baseInputs);
  const annualBaseline = monthlyBaseCost * 12;

  let platformCost = 0;
  let platformMaintenance = 0;
  let teamReduction = 0;
  let processEfficiency = 0;
  const timeToBuild = 3; // Default time to build

  switch (targetType) {
    case 'roi':
      const targetROI = targetValue / 100;
      const requiredSavings = monthlyBaseCost * (targetValue / 100) * (timeframe / 12);
      platformCost = requiredSavings / (1 + targetROI);
      platformMaintenance = platformCost * 0.1;
      teamReduction = 0.3;
      processEfficiency = 0.2;
      break;

    case 'team':
      teamReduction = targetValue / 100;
      const annualSavings = annualBaseline * (targetValue / 100);
      platformCost = annualSavings * 1.5;
      platformMaintenance = platformCost * 0.1;
      processEfficiency = 0.2;
      break;

    case 'efficiency':
      processEfficiency = targetValue / 100;
      const efficiencySavings = annualBaseline * (targetValue / 100);
      platformCost = efficiencySavings * 2;
      platformMaintenance = platformCost * 0.1;
      teamReduction = 0.3;
      break;
  }

  const monthlyOperatingCostReduction = monthlyBaseCost * (teamReduction + processEfficiency);

  return {
    platformCost,
    platformMaintenance,
    timeToBuild,
    teamReduction,
    processEfficiency,
    baselineCost: monthlyBaseCost,
    annualBaseline,
    monthlyBaseCost,
    monthlyOperatingCostReduction,
    targetType,
    targetValue,
    timeframe
  };
}

function calculateReverseAnalysis(inputs: ReverseAnalysisInputs): ReverseAnalysisResults {
  const { targetROIPeriod, desiredSavings, maxBudget, teamMetrics } = inputs;
  
  const maxAllowableCost = teamMetrics 
    ? calculateMaxAllowableCost(teamMetrics, targetROIPeriod, desiredSavings)
    : maxBudget || 0;

  const requiredEfficiencyGains = calculateRequiredEfficiencyGains(desiredSavings, teamMetrics);
  const breakEvenScenarios = generateBreakEvenScenarios(maxAllowableCost, teamMetrics);

  return {
    maxAllowableCost,
    requiredEfficiencyGains,
    breakEvenScenarios
  };
}

function calculateMaxAllowableCost(metrics: any, targetROIPeriod: number, desiredSavings: number): number {
  const monthlyLaborCost = metrics.teamSize * metrics.hourlyRate * 160;
  const annualCost = monthlyLaborCost * 12;
  const targetSavings = desiredSavings * targetROIPeriod;
  
  return Math.min(
    annualCost * 0.5,
    targetSavings * 1.5
  );
}

function calculateRequiredEfficiencyGains(desiredSavings: number, teamMetrics?: any): number {
  if (!teamMetrics) return 0;
  
  const currentManualWork = teamMetrics.manualWorkPercentage;
  const requiredReduction = (desiredSavings / (teamMetrics.teamSize * teamMetrics.hourlyRate * 160)) * 100;
  
  return Math.min(requiredReduction, currentManualWork);
}

function generateBreakEvenScenarios(maxCost: number, teamMetrics?: any) {
  const scenarios = [];
  
  scenarios.push({
    timeframe: 24,
    requiredSavings: maxCost / 24,
    assumptions: {
      efficiencyGain: 0.15,
      teamReduction: 0.1,
      qualityImprovement: 0.05
    }
  });

  scenarios.push({
    timeframe: 18,
    requiredSavings: maxCost / 18,
    assumptions: {
      efficiencyGain: 0.25,
      teamReduction: 0.15,
      qualityImprovement: 0.1
    }
  });

  scenarios.push({
    timeframe: 12,
    requiredSavings: maxCost / 12,
    assumptions: {
      efficiencyGain: 0.35,
      teamReduction: 0.2,
      qualityImprovement: 0.15
    }
  });

  return scenarios;
}

function calculateProcessEfficiency(inputs: ProcessEfficiencyInputs): ProcessEfficiencyResults {
  const {
    qualityImprovementTarget,
    knowledgeRetentionGoal,
    standardizationLevel,
    teamDependencies
  } = inputs;

  const qualityValue = calculateQualityValue(qualityImprovementTarget);
  const knowledgeRetentionImpact = calculateKnowledgeRetentionImpact(knowledgeRetentionGoal);
  const standardizationBenefits = calculateStandardizationBenefits(standardizationLevel);
  const dependencyMetrics = calculateDependencyMetrics(teamDependencies);

  return {
    qualityValue,
    knowledgeRetentionImpact,
    standardizationBenefits,
    dependencyMetrics
  };
}

function calculateQualityValue(target: number): number {
  return target * 1.5;
}

function calculateKnowledgeRetentionImpact(goal: number): number {
  return goal * 1.2;
}

function calculateStandardizationBenefits(level: number): number {
  return level * 2;
}

function calculateDependencyMetrics(dependencies: TeamDependency[]) {
  const totalImpact = dependencies.reduce((sum, dep) => sum + dep.impactLevel, 0);
  const avgWipLimit = dependencies.reduce((sum, dep) => sum + dep.wipLimit, 0) / dependencies.length;
  const avgLeadTime = dependencies.reduce((sum, dep) => sum + dep.leadTime, 0) / dependencies.length;

  return {
    totalImpact,
    wipEffects: avgWipLimit * 0.8,
    leadTimeOptimization: 100 - avgLeadTime
  };
}

function calculateTotalCost(inputs: any): number {
  if (!inputs) return 0;
  
  if ('teamSize' in inputs) {
    const workingHoursPerMonth = 160;
    return inputs.teamSize * inputs.hourlyRate * workingHoursPerMonth * 
           inputs.serviceEfficiency * (1 + inputs.operationalOverhead);
  } else if ('monthlyTickets' in inputs) {
    return inputs.monthlyTickets * inputs.hoursPerTicket * inputs.peoplePerTicket * inputs.vendorRate;
  }
  return 0;
}

function createTargetPlanningStore() {
  const { subscribe, set, update } = writable<TargetPlanningState>(initialState);

  return {
    subscribe,
    calculateTargetBasedPlanning: (inputs: TargetBasedPlanningInputs) => update(state => ({
      ...state,
      targetBasedResults: calculateTargetBasedPlanningResults(inputs)
    })),
    calculateReverseAnalysis: (inputs: ReverseAnalysisInputs) => update(state => ({
      ...state,
      reverseAnalysisResults: calculateReverseAnalysis(inputs)
    })),
    calculateProcessEfficiency: (inputs: ProcessEfficiencyInputs) => update(state => ({
      ...state,
      processEfficiencyResults: calculateProcessEfficiency(inputs)
    })),
    reset: () => set(initialState)
  };
}

export const targetPlanningStore = createTargetPlanningStore(); 