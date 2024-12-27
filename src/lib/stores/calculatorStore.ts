import { writable, derived, get } from 'svelte/store';
import type {
  CalculatorModel,
  SolutionType,
  TeamInputs,
  TicketInputs,
  SolutionInputs,
  TargetBasedPlanningInputs,
  ReverseAnalysisInputs,
  ProcessEfficiencyInputs,
  MonthlyData
} from '$lib/types/calculator';
import { baseAnalysisStore } from '../../features/base-analysis';
import { internalAnalysisStore } from '../../features/internal-analysis';
import { targetPlanningStore } from '../../features/target-planning';

export interface CalculatorResults {
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
}

const initialResults: CalculatorResults = {
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

function createCalculatorStore() {
  const { subscribe, set } = writable<CalculatorResults>(initialResults);

  // Create a derived store that combines all feature stores
  const combinedResults = derived(
    [baseAnalysisStore, internalAnalysisStore],
    ([$baseAnalysis, $internalAnalysis]) => ({
      ...$baseAnalysis,
      solution: $internalAnalysis.solution,
      monthlySavings: $internalAnalysis.monthlySavings,
      isViable: $internalAnalysis.isViable,
      breakEvenMonths: $internalAnalysis.breakEvenMonths,
      monthlyData: $internalAnalysis.monthlyData
    })
  );

  // Subscribe to the combined results and update the main store
  combinedResults.subscribe(results => {
    set(results as CalculatorResults);
  });

  return {
    subscribe,
    updateModel: (model: CalculatorModel) => {
      baseAnalysisStore.reset();
      internalAnalysisStore.reset();
      set({ ...initialResults, model });
    },
    updateSolutionType: (solution: SolutionType) => {
      internalAnalysisStore.reset();
      const baseResults = get(baseAnalysisStore);
      if (baseResults.totalCost > 0) {
        internalAnalysisStore.setBaseline(baseResults.totalCost, baseResults.efficiency);
      }
      set({ ...get(baseAnalysisStore), solution, monthlySavings: 0, isViable: false, breakEvenMonths: null, monthlyData: [] });
    },
    updateTeamInputs: (inputs: TeamInputs) => {
      baseAnalysisStore.updateTeamInputs(inputs);
      const baseResults = get(baseAnalysisStore);
      internalAnalysisStore.setBaseline(
        baseResults.totalCost,
        baseResults.efficiency
      );
    },
    updateTicketInputs: (inputs: TicketInputs) => {
      baseAnalysisStore.updateTicketInputs(inputs);
      const baseResults = get(baseAnalysisStore);
      internalAnalysisStore.setBaseline(
        baseResults.totalCost,
        baseResults.efficiency
      );
    },
    updateSolutionInputs: (inputs: SolutionInputs) => {
      const baseResults = get(baseAnalysisStore);
      internalAnalysisStore.setBaseline(baseResults.totalCost, baseResults.efficiency);
      internalAnalysisStore.updateSolutionInputs(inputs);
    },
    calculateTargetBasedPlanning: (inputs: TargetBasedPlanningInputs) => {
      return targetPlanningStore.calculateTargetBasedPlanning(inputs);
    },
    calculateReverseAnalysis: (inputs: ReverseAnalysisInputs) => {
      return targetPlanningStore.calculateReverseAnalysis(inputs);
    },
    calculateProcessEfficiency: (inputs: ProcessEfficiencyInputs) => {
      return targetPlanningStore.calculateProcessEfficiency(inputs);
    },
    getCurrentState: () => ({
      baseInputs: baseAnalysisStore.getCurrentInputs(),
      solutionInputs: internalAnalysisStore.getCurrentSolutionInputs()
    }),
    reset: () => {
      baseAnalysisStore.reset();
      internalAnalysisStore.reset();
      targetPlanningStore.reset();
      set(initialResults);
    }
  };
}

export const calculatorStore = createCalculatorStore();
