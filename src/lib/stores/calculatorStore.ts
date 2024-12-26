import { writable } from 'svelte/store';
import type {
  CalculatorModel,
  SolutionType,
  TeamInputs,
  TicketInputs,
  PlatformInputs,
  OutsourceInputs,
  HybridInputs,
  SolutionInputs,
  CalculationResults,
  MonthlyData,
  AnalysisMode,
  ReverseAnalysisInputs,
  ProcessEfficiencyInputs,
  ReverseAnalysisResults,
  ProcessEfficiencyResults,
  BreakEvenScenario,
  LimitedTeamMetrics,
  TeamDependency,
  TargetBasedPlanningInputs,
  TargetBasedPlanningResults
} from '$lib/types/calculator';

interface ExtendedMonthlyData extends MonthlyData {
  cumulative_savings: number;
}

const initialResults: CalculationResults = {
  model: 'team',
  solution: 'platform',
  totalCost: 0,
  costPerTicket: 0,
  annualCost: 0,
  efficiency: 0,
  recommendedTeamSize: 0,
  monthlySavings: 0,
  isViable: false,
  breakEvenMonths: null,
  monthlyData: []
};

function calculateHybridCosts(baselineCost: number, baseEfficiency: number, inputs: HybridInputs) {
  const {
    platformPortion,
    vendorPortion,
    processEfficiency,
    platformMaintenance,
    vendorRate,
    managementOverhead,
    qualityImpact,
    knowledgeLoss,
    transitionTime,
    teamReduction
  } = inputs;

  // Platform portion
  const platformPercentage = platformPortion / 100;
  const processEfficiencyFactor = processEfficiency / 100;
  const teamReductionFactor = 1 - (teamReduction / 100);
  const platformBaseCost = baselineCost * platformPercentage;
  const platformLaborCost = platformBaseCost * teamReductionFactor * (1 - processEfficiencyFactor);
  const platformMonthly = platformLaborCost + platformMaintenance;

  // Vendor portion
  const vendorPercentage = vendorPortion / 100;
  const vendorBaseCost = baselineCost * vendorPercentage;
  const vendorHours = vendorBaseCost / vendorRate;
  const vendorBase = vendorHours * vendorRate;
  const overheadFactor = 1 + (managementOverhead / 100);
  const qualityFactor = qualityImpact >= 0 
    ? (1 - qualityImpact / 100)
    : (1 + Math.abs(qualityImpact) / 100);
  const knowledgeFactor = 1 + (knowledgeLoss / 100) * Math.log10(transitionTime + 1);
  const vendorMonthly = vendorBase * overheadFactor * qualityFactor * knowledgeFactor;

  return {
    platformCost: platformMonthly,
    vendorCost: vendorMonthly,
    totalCost: platformMonthly + vendorMonthly
  };
}

function calculateReverseAnalysis(inputs: ReverseAnalysisInputs): ReverseAnalysisResults {
  const { targetROIPeriod, desiredSavings, maxBudget, teamMetrics } = inputs;
  
  // Calculate maximum allowable cost based on ROI period and desired savings
  const maxAllowableCost = teamMetrics 
    ? calculateMaxAllowableCost(teamMetrics, targetROIPeriod, desiredSavings)
    : maxBudget || 0;

  // Calculate required efficiency improvements
  const requiredEfficiencyGains = calculateRequiredEfficiencyGains(desiredSavings, teamMetrics);

  // Generate break-even scenarios
  const breakEvenScenarios = generateBreakEvenScenarios(maxAllowableCost, teamMetrics);

  return {
    maxAllowableCost,
    requiredEfficiencyGains,
    breakEvenScenarios
  };
}

function calculateMaxAllowableCost(
  metrics: LimitedTeamMetrics,
  targetROIPeriod: number,
  desiredSavings: number
): number {
  const monthlyLaborCost = metrics.teamSize * metrics.hourlyRate * 160; // 160 hours per month
  const annualCost = monthlyLaborCost * 12;
  const targetSavings = desiredSavings * targetROIPeriod;
  
  return Math.min(
    annualCost * 0.5, // Max 50% of annual cost
    targetSavings * 1.5 // 1.5x target savings for buffer
  );
}

function calculateRequiredEfficiencyGains(
  desiredSavings: number,
  teamMetrics?: LimitedTeamMetrics
): number {
  if (!teamMetrics) return 0;
  
  const currentManualWork = teamMetrics.manualWorkPercentage;
  const requiredReduction = (desiredSavings / (teamMetrics.teamSize * teamMetrics.hourlyRate * 160)) * 100;
  
  return Math.min(requiredReduction, currentManualWork);
}

function generateBreakEvenScenarios(
  maxCost: number,
  teamMetrics?: LimitedTeamMetrics
): BreakEvenScenario[] {
  const scenarios: BreakEvenScenario[] = [];
  
  // Conservative scenario (24 months)
  scenarios.push({
    timeframe: 24,
    requiredSavings: maxCost / 24,
    assumptions: {
      efficiencyGain: 0.15,
      teamReduction: 0.1,
      qualityImprovement: 0.05
    }
  });

  // Moderate scenario (18 months)
  scenarios.push({
    timeframe: 18,
    requiredSavings: maxCost / 18,
    assumptions: {
      efficiencyGain: 0.25,
      teamReduction: 0.15,
      qualityImprovement: 0.1
    }
  });

  // Aggressive scenario (12 months)
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

  // Calculate quality value
  const qualityValue = calculateQualityValue(qualityImprovementTarget);

  // Calculate knowledge retention impact
  const knowledgeRetentionImpact = calculateKnowledgeRetentionImpact(knowledgeRetentionGoal);

  // Calculate standardization benefits
  const standardizationBenefits = calculateStandardizationBenefits(standardizationLevel);

  // Calculate dependency metrics
  const dependencyMetrics = calculateDependencyMetrics(teamDependencies);

  return {
    qualityValue,
    knowledgeRetentionImpact,
    standardizationBenefits,
    dependencyMetrics
  };
}

function calculateQualityValue(target: number): number {
  return target * 1.5; // Simplified calculation
}

function calculateKnowledgeRetentionImpact(goal: number): number {
  return goal * 1.2; // Simplified calculation
}

function calculateStandardizationBenefits(level: number): number {
  return level * 2; // Simplified calculation
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

function calculateTargetBasedPlanningResults(inputs: TargetBasedPlanningInputs): TargetBasedPlanningResults {
  const {
    targetType,
    targetValue,
    timeframe,
    baseInputs
  } = inputs;

  // Calculate baseline cost
  const baselineCost = calculateTotalCost(baseInputs);
  const annualBaseline = calculateAnnualCost(baseInputs);

  let platformCost = 0;
  let platformMaintenance = 0;
  let teamReduction = 0;
  let processEfficiency = 0;
  const timeToBuild = 3; // Default time to build

  switch (targetType) {
    case 'roi':
      // ROI = (Savings - Investment) / Investment
      // Solve for required investment
      const targetROI = targetValue / 100;
      const requiredSavings = baselineCost * (targetValue / 100) * (timeframe / 12);
      platformCost = requiredSavings / (1 + targetROI);
      platformMaintenance = platformCost * 0.1; // Estimate 10% maintenance
      teamReduction = 0.3; // Default team reduction
      processEfficiency = 0.2; // Default process efficiency
      break;

    case 'team':
      teamReduction = targetValue / 100;
      // Calculate required investment based on team reduction target
      const annualSavings = annualBaseline * (targetValue / 100);
      platformCost = annualSavings * 1.5; // Estimate 1.5x annual savings
      platformMaintenance = platformCost * 0.1;
      processEfficiency = 0.2; // Default process efficiency
      break;

    case 'efficiency':
      processEfficiency = targetValue / 100;
      // Calculate required investment based on efficiency target
      const efficiencySavings = annualBaseline * (targetValue / 100);
      platformCost = efficiencySavings * 2; // Estimate 2x efficiency savings
      platformMaintenance = platformCost * 0.1;
      teamReduction = 0.3; // Default team reduction
      break;
  }

  return {
    platformCost,
    platformMaintenance,
    timeToBuild,
    teamReduction,
    processEfficiency,
    baselineCost,
    annualBaseline,
    targetType,
    targetValue,
    timeframe
  };
}

function createCalculatorStore() {
  const { subscribe, set, update } = writable<CalculationResults>(initialResults);

  // Keep track of current inputs
  let currentBaseInputs: TeamInputs | TicketInputs | null = null;
  let currentSolutionInputs: SolutionInputs | null = null;

  function recalculateWithCurrentInputs(state: CalculationResults): CalculationResults {
    if (!currentBaseInputs) return state;

    const baseState = {
      ...state,
      totalCost: calculateTotalCost(currentBaseInputs),
      costPerTicket: calculateCostPerTicket(currentBaseInputs),
      annualCost: calculateAnnualCost(currentBaseInputs),
      efficiency: 'serviceEfficiency' in currentBaseInputs ? currentBaseInputs.serviceEfficiency : calculateEfficiency(currentBaseInputs),
      recommendedTeamSize: calculateRecommendedTeamSize(currentBaseInputs)
    };

    if (!currentSolutionInputs) {
      return {
        ...baseState,
        monthlyData: calculateMonthlyData(currentBaseInputs, null)
      };
    }

    // Special handling for hybrid solution
    if (currentSolutionInputs.type === 'hybrid' && currentSolutionInputs.hybrid) {
      const hybridCosts = calculateHybridCosts(
        baseState.totalCost,
        baseState.efficiency,
        currentSolutionInputs.hybrid
      );

      const monthlySavings = baseState.totalCost - hybridCosts.totalCost;
      const breakEvenMonths = calculateBreakEvenMonths(monthlySavings, currentSolutionInputs);
      const monthlyData = calculateMonthlyData(currentBaseInputs, currentSolutionInputs);

      return {
        ...baseState,
        solution: 'hybrid',
        monthlySavings,
        isViable: monthlySavings > 0,
        breakEvenMonths,
        monthlyData
      };
    }

    // Handle other solution types
    const updatedSolutionInputs: SolutionInputs = {
      type: currentSolutionInputs.type,
      [currentSolutionInputs.type]: {
        ...currentSolutionInputs[currentSolutionInputs.type],
        baselineCost: baseState.totalCost
      }
    };

    const monthlySavings = calculateMonthlySavings(baseState, updatedSolutionInputs);
    const breakEvenMonths = calculateBreakEvenMonths(monthlySavings, updatedSolutionInputs);
    const monthlyData = calculateMonthlyData(currentBaseInputs, updatedSolutionInputs);

    return {
      ...baseState,
      solution: updatedSolutionInputs.type,
      monthlySavings,
      isViable: monthlySavings > 0,
      breakEvenMonths,
      monthlyData
    };
  }

  return {
    subscribe,
    updateModel: (model: CalculatorModel) => update(state => ({ ...state, model })),
    updateSolutionType: (solution: SolutionType) => update(state => {
      currentSolutionInputs = null;
      return { ...state, solution };
    }),
    updateTeamInputs: (inputs: TeamInputs) => update(state => {
      currentBaseInputs = { ...inputs };
      return recalculateWithCurrentInputs({
        ...state,
        model: 'team'
      });
    }),
    updateTicketInputs: (inputs: TicketInputs) => update(state => {
      currentBaseInputs = { ...inputs };
      return recalculateWithCurrentInputs({
        ...state,
        model: 'ticket'
      });
    }),
    updateSolutionInputs: (inputs: SolutionInputs) => update(state => {
      // Create a completely new object for solution inputs
      currentSolutionInputs = {
        type: inputs.type,
        [inputs.type]: { ...inputs[inputs.type] }
      };

      // Force immediate recalculation
      const newState = recalculateWithCurrentInputs({
        ...state,
        solution: inputs.type
      });

      // For hybrid solutions, ensure we're using the latest costs
      if (inputs.type === 'hybrid' && inputs.hybrid) {
        const hybridCosts = calculateHybridCosts(
          newState.totalCost,
          newState.efficiency,
          inputs.hybrid
        );
        return {
          ...newState,
          monthlySavings: newState.totalCost - hybridCosts.totalCost
        };
      }

      return newState;
    }),
    reset: () => {
      currentBaseInputs = null;
      currentSolutionInputs = null;
      set(initialResults);
    },
    calculateReverseAnalysis: (inputs: ReverseAnalysisInputs) => {
      return calculateReverseAnalysis(inputs);
    },
    
    calculateProcessEfficiency: (inputs: ProcessEfficiencyInputs) => {
      return calculateProcessEfficiency(inputs);
    },
    
    getCurrentState: () => ({
      baseInputs: currentBaseInputs ? { ...currentBaseInputs } : null,
      solutionInputs: currentSolutionInputs ? {
        type: currentSolutionInputs.type,
        [currentSolutionInputs.type]: { ...currentSolutionInputs[currentSolutionInputs.type] }
      } : null
    }),
    calculateTargetBasedPlanning: (inputs: TargetBasedPlanningInputs) => {
      const results = calculateTargetBasedPlanningResults(inputs);
      return results;
    },
    updatePlatformInputs: (inputs: PlatformInputs) => {
      update(state => {
        const solutionInputs = {
          ...inputs,
          solution: 'platform' as SolutionType
        };
        return recalculateWithCurrentInputs({ ...state, solution: 'platform', solutionInputs });
      });
    }
  };
}

// Calculation functions
function calculateTotalCost(inputs: TeamInputs | TicketInputs): number {
  if (!inputs) return 0;
  
  if ('teamSize' in inputs) {
    // Team model: C_b = n · h · w · η_s · (1 + η_o)
    const workingHoursPerMonth = 160;
    return inputs.teamSize * inputs.hourlyRate * workingHoursPerMonth * 
           inputs.serviceEfficiency * (1 + inputs.operationalOverhead);
  } else if ('monthlyTickets' in inputs) {
    // Ticket model: C_t = m · t_h · p · h
    return inputs.monthlyTickets * inputs.hoursPerTicket * inputs.peoplePerTicket * inputs.vendorRate;
  }
  return 0;
}

function calculateCostPerTicket(inputs: TeamInputs | TicketInputs): number {
  if ('teamSize' in inputs) {
    // For team-based model, calculate monthly ticket capacity
    const workingHoursPerMonth = 160;
    const monthlyHours = inputs.teamSize * workingHoursPerMonth * inputs.serviceEfficiency;
    const monthlyTickets = monthlyHours / 4; // Assuming 4 hours per ticket average
    return calculateTotalCost(inputs) / monthlyTickets;
  } else {
    // For ticket-based model, it's direct calculation
    return inputs.hoursPerTicket * inputs.peoplePerTicket * inputs.vendorRate;
  }
}

function calculateAnnualCost(inputs: TeamInputs | TicketInputs): number {
  if (!inputs) return 0;
  return calculateTotalCost(inputs) * 12;
}

function calculateEfficiency(inputs: TicketInputs): number {
  // For ticket-based model, efficiency is based on vendor performance
  return 85; // Default vendor efficiency
}

function calculateRecommendedTeamSize(inputs: TeamInputs | TicketInputs): number {
  if ('teamSize' in inputs) {
    return Math.ceil(inputs.teamSize * (100 / inputs.serviceEfficiency));
  } else {
    return Math.ceil((inputs.monthlyTickets * inputs.hoursPerTicket) / 160);
  }
}

function calculateMonthlySavings(state: CalculationResults, inputs: SolutionInputs): number {
  const baselineCost = state.totalCost;
  const baseEfficiency = state.efficiency;

  switch (inputs.type) {
    case 'platform':
      if (inputs.platform) {
        // C_p = C_b · (1 - α_t) · (1 - α_p) + P_m
        const { teamReduction, processEfficiency, platformMaintenance } = inputs.platform;
        const solutionCost = baselineCost * (1 - teamReduction) * (1 - processEfficiency) + platformMaintenance;
        return baselineCost - solutionCost;
      }
      break;
    case 'outsource':
      if (inputs.outsource) {
        // C_o = v · h_b · (1 + β_m) · Q(β_q) · K(β_k, T_t)
        const { vendorRate, managementOverhead, qualityImpact, knowledgeLoss, transitionTime } = inputs.outsource;
        const baseHours = baselineCost / vendorRate;
        const knowledgeFactor = 1 + knowledgeLoss * Math.log10(transitionTime + 1);
        const qualityFactor = qualityImpact >= 0 ? (1 - qualityImpact) : (1 + Math.abs(qualityImpact));
        const solutionCost = vendorRate * baseHours * (1 + managementOverhead) * qualityFactor * knowledgeFactor;
        return baselineCost - solutionCost;
      }
      break;
    case 'hybrid':
      if (inputs.hybrid) {
        // C_h = γ_p · C_p + γ_v · C_o + (1 - γ_p - γ_v) · C_b
        const { platformPortion, vendorPortion } = inputs.hybrid;
        const platformPercentage = platformPortion / 100;
        const vendorPercentage = vendorPortion / 100;
        
        // Calculate platform portion cost
        const platformCost = baselineCost * platformPercentage * 
                           (1 - inputs.hybrid.teamReduction) * 
                           (1 - inputs.hybrid.processEfficiency) + 
                           inputs.hybrid.platformMaintenance;
        
        // Calculate vendor portion cost
        const baseHours = baselineCost / inputs.hybrid.vendorRate;
        const knowledgeFactor = 1 + inputs.hybrid.knowledgeLoss * Math.log10(inputs.hybrid.transitionTime + 1);
        const qualityFactor = inputs.hybrid.qualityImpact >= 0 ? 
                            (1 - inputs.hybrid.qualityImpact) : 
                            (1 + Math.abs(inputs.hybrid.qualityImpact));
        const vendorCost = inputs.hybrid.vendorRate * baseHours * vendorPercentage * 
                          (1 + inputs.hybrid.managementOverhead) * qualityFactor * knowledgeFactor;
        
        // Calculate remaining portion cost
        const remainingPercentage = 1 - platformPercentage - vendorPercentage;
        const remainingCost = baselineCost * remainingPercentage;
        
        const totalCost = platformCost + vendorCost + remainingCost;
        return baselineCost - totalCost;
      }
      break;
  }

  return 0;
}

function calculateMonthlyData(
  baseInputs: TeamInputs | TicketInputs | null,
  solutionInputs: SolutionInputs | null
): ExtendedMonthlyData[] {
  if (!baseInputs) return [];

  const months = 24;
  const data: ExtendedMonthlyData[] = [];
  const monthlyCost = calculateTotalCost(baseInputs);
  const baseEfficiency = 'serviceEfficiency' in baseInputs ? baseInputs.serviceEfficiency : 85;

  let setupCost = 0;
  let buildTime = 0;

  if (solutionInputs) {
    switch (solutionInputs.type) {
      case 'platform':
        if (solutionInputs.platform) {
          setupCost = solutionInputs.platform.platformCost;
          buildTime = solutionInputs.platform.timeToBuild || 3;
        }
        break;
      case 'outsource':
        if (solutionInputs.outsource) {
          setupCost = solutionInputs.outsource.transitionCost;
          buildTime = solutionInputs.outsource.transitionTime || 1;
        }
        break;
      case 'hybrid':
        if (solutionInputs.hybrid) {
          setupCost = solutionInputs.hybrid.platformCost + solutionInputs.hybrid.transitionCost;
          buildTime = Math.max(solutionInputs.hybrid.timeToBuild || 3, solutionInputs.hybrid.transitionTime || 1);
        }
        break;
    }
  }

  let cumulativeSavings = 0;
  for (let i = 1; i <= months; i++) {
    const baseline = monthlyCost * i;
    let solution = baseline;
    let savings = 0;

    if (solutionInputs) {
      if (i <= buildTime) {
        solution = setupCost + baseline;
        savings = 0;
      } else {
        switch (solutionInputs.type) {
          case 'platform':
            if (solutionInputs.platform) {
              const { teamReduction, processEfficiency, platformMaintenance } = solutionInputs.platform;
              const efficiencyGain = processEfficiency / 100;
              const teamReductionFactor = 1 - (teamReduction / 100);
              const efficiencyFactor = 1 - (efficiencyGain * (baseEfficiency / 100));
              const monthlySolutionCost = monthlyCost * teamReductionFactor * efficiencyFactor + platformMaintenance;
              solution = setupCost + (monthlySolutionCost * (i - buildTime));
            }
            break;
          case 'outsource':
            if (solutionInputs.outsource) {
              const { vendorRate, managementOverhead, qualityImpact, knowledgeLoss } = solutionInputs.outsource;
              const baseHours = monthlyCost / vendorRate;
              const knowledgeFactor = 1 + (knowledgeLoss / 100) * Math.log10(i - buildTime + 1);
              const monthlySolutionCost = baseHours * vendorRate * (1 + managementOverhead / 100) * (1 + Math.abs(qualityImpact) / 100) * knowledgeFactor;
              solution = setupCost + (monthlySolutionCost * (i - buildTime));
            }
            break;
          case 'hybrid':
            if (solutionInputs.hybrid) {
              const { totalCost } = calculateHybridCosts(monthlyCost, baseEfficiency, {
                ...solutionInputs.hybrid,
                transitionTime: i - buildTime + 1 // Use current month for knowledge loss calculation
              });
              solution = setupCost + (totalCost * (i - buildTime));
            }
            break;
        }
        savings = baseline - solution;
      }
    }

    cumulativeSavings += savings;
    data.push({
      month: i,
      baseline,
      solution,
      savings,
      cumulative_savings: cumulativeSavings
    });
  }

  return data;
}

function calculateBreakEvenMonths(monthlySavings: number, inputs: SolutionInputs): number | null {
  if (monthlySavings <= 0) return null;

  let setupCost = 0;
  let buildTime = 0;

  switch (inputs.type) {
    case 'platform':
      if (inputs.platform) {
        setupCost = inputs.platform.platformCost;
        buildTime = inputs.platform.timeToBuild;
      }
      break;
    case 'outsource':
      if (inputs.outsource) {
        setupCost = inputs.outsource.transitionCost;
        buildTime = inputs.outsource.transitionTime;
      }
      break;
    case 'hybrid':
      if (inputs.hybrid) {
        setupCost = inputs.hybrid.platformCost + inputs.hybrid.transitionCost;
        buildTime = Math.max(inputs.hybrid.timeToBuild, inputs.hybrid.transitionTime);
      }
      break;
  }

  return buildTime + Math.ceil(setupCost / monthlySavings);
}

export const calculatorStore = createCalculatorStore();
