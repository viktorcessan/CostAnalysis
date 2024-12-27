import { writable } from 'svelte/store';
import type { 
  SolutionType,
  PlatformInputs,
  OutsourceInputs,
  HybridInputs,
  SolutionInputs,
  MonthlyData
} from '$lib/types/calculator';

export interface InternalAnalysisResults {
  solution: SolutionType;
  monthlySavings: number;
  isViable: boolean;
  breakEvenMonths: number | null;
  monthlyData: MonthlyData[];
}

interface HybridCosts {
  platformCost: number;
  vendorCost: number;
  totalCost: number;
}

interface ExtendedMonthlyData extends MonthlyData {
  cumulative_savings: number;
}

const initialResults: InternalAnalysisResults = {
  solution: 'platform',
  monthlySavings: 0,
  isViable: false,
  breakEvenMonths: null,
  monthlyData: []
};

function calculateHybridCosts(baselineCost: number, baseEfficiency: number, inputs: HybridInputs): HybridCosts {
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
  const platformCost = platformLaborCost + platformMaintenance;

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
  const vendorCost = vendorBase * overheadFactor * qualityFactor * knowledgeFactor;

  return {
    platformCost,
    vendorCost,
    totalCost: platformCost + vendorCost
  };
}

function calculateMonthlySavings(baselineCost: number, baseEfficiency: number, inputs: SolutionInputs): number {
  switch (inputs.type) {
    case 'platform':
      if (inputs.platform) {
        const { teamReduction, processEfficiency, platformMaintenance } = inputs.platform;
        const solutionCost = baselineCost * (1 - teamReduction) * (1 - processEfficiency) + platformMaintenance;
        return baselineCost - solutionCost;
      }
      break;
    case 'outsource':
      if (inputs.outsource) {
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
        const costs = calculateHybridCosts(baselineCost, baseEfficiency, inputs.hybrid);
        return baselineCost - costs.totalCost;
      }
      break;
  }
  return 0;
}

function calculateMonthlyData(
  baselineCost: number,
  baseEfficiency: number,
  solutionInputs: SolutionInputs
): MonthlyData[] {
  const months = 24;
  const data: ExtendedMonthlyData[] = [];

  let setupCost = 0;
  let buildTime = 0;

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

  let cumulativeSavings = 0;
  for (let i = 1; i <= months; i++) {
    const baseline = baselineCost * i;
    let solution = baseline;
    let savings = 0;

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
            const monthlySolutionCost = baselineCost * teamReductionFactor * efficiencyFactor + platformMaintenance;
            solution = setupCost + (monthlySolutionCost * (i - buildTime));
          }
          break;
        case 'outsource':
          if (solutionInputs.outsource) {
            const { vendorRate, managementOverhead, qualityImpact, knowledgeLoss } = solutionInputs.outsource;
            const baseHours = baselineCost / vendorRate;
            const knowledgeFactor = 1 + (knowledgeLoss / 100) * Math.log10(i - buildTime + 1);
            const monthlySolutionCost = baseHours * vendorRate * (1 + managementOverhead / 100) * (1 + Math.abs(qualityImpact) / 100) * knowledgeFactor;
            solution = setupCost + (monthlySolutionCost * (i - buildTime));
          }
          break;
        case 'hybrid':
          if (solutionInputs.hybrid) {
            const { totalCost } = calculateHybridCosts(baselineCost, baseEfficiency, {
              ...solutionInputs.hybrid,
              transitionTime: i - buildTime + 1
            });
            solution = setupCost + (totalCost * (i - buildTime));
          }
          break;
      }
      savings = baseline - solution;
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

function createInternalAnalysisStore() {
  const { subscribe, set, update } = writable<InternalAnalysisResults>(initialResults);
  
  let currentSolutionInputs: SolutionInputs | null = null;
  let currentBaselineCost = 0;
  let currentBaseEfficiency = 0;

  return {
    subscribe,
    setBaseline: (baselineCost: number, baseEfficiency: number) => {
      currentBaselineCost = baselineCost;
      currentBaseEfficiency = baseEfficiency;
      
      if (currentSolutionInputs) {
        update(state => ({
          ...state,
          monthlySavings: calculateMonthlySavings(baselineCost, baseEfficiency, currentSolutionInputs!),
          monthlyData: calculateMonthlyData(baselineCost, baseEfficiency, currentSolutionInputs!)
        }));
      }
    },
    updateSolutionInputs: (inputs: SolutionInputs) => update(state => {
      currentSolutionInputs = {
        type: inputs.type,
        [inputs.type]: { ...inputs[inputs.type] }
      };
      
      const monthlySavings = calculateMonthlySavings(currentBaselineCost, currentBaseEfficiency, currentSolutionInputs);
      
      return {
        solution: inputs.type,
        monthlySavings,
        isViable: monthlySavings > 0,
        breakEvenMonths: calculateBreakEvenMonths(monthlySavings, currentSolutionInputs),
        monthlyData: calculateMonthlyData(currentBaselineCost, currentBaseEfficiency, currentSolutionInputs)
      };
    }),
    getCurrentSolutionInputs: () => currentSolutionInputs ? {
      type: currentSolutionInputs.type,
      [currentSolutionInputs.type]: { ...currentSolutionInputs[currentSolutionInputs.type] }
    } : null,
    reset: () => {
      currentSolutionInputs = null;
      currentBaselineCost = 0;
      currentBaseEfficiency = 0;
      set(initialResults);
    }
  };
}

export const internalAnalysisStore = createInternalAnalysisStore(); 