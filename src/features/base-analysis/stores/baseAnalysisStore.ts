import { writable } from 'svelte/store';
import type { TeamInputs, TicketInputs } from '$lib/types/calculator';

export interface BaseAnalysisResults {
  model: 'team' | 'ticket';
  totalCost: number;
  costPerTicket: number;
  annualCost: number;
  efficiency: number;
  recommendedTeamSize: number;
}

const initialResults: BaseAnalysisResults = {
  model: 'team',
  totalCost: 0,
  costPerTicket: 0,
  annualCost: 0,
  efficiency: 0,
  recommendedTeamSize: 0
};

function calculateTotalCost(inputs: TeamInputs | TicketInputs): number {
  if (!inputs) return 0;
  
  if ('teamSize' in inputs) {
    const workingHoursPerMonth = 160;
    return inputs.teamSize * inputs.hourlyRate * workingHoursPerMonth * 
           inputs.serviceEfficiency * (1 + inputs.operationalOverhead);
  } else if ('monthlyTickets' in inputs) {
    return inputs.monthlyTickets * inputs.hoursPerTicket * inputs.peoplePerTicket * inputs.hourlyRate;
  }
  return 0;
}

function calculateCostPerTicket(inputs: TeamInputs | TicketInputs): number {
  if ('teamSize' in inputs) {
    const workingHoursPerMonth = 160;
    const monthlyHours = inputs.teamSize * workingHoursPerMonth * inputs.serviceEfficiency;
    const monthlyTickets = monthlyHours / 4;
    return calculateTotalCost(inputs) / monthlyTickets;
  } else {
    return inputs.hoursPerTicket * inputs.peoplePerTicket * inputs.hourlyRate;
  }
}

function calculateAnnualCost(inputs: TeamInputs | TicketInputs): number {
  return calculateTotalCost(inputs) * 12;
}

function calculateEfficiency(inputs: TicketInputs): number {
  return 85; // Default vendor efficiency
}

function calculateRecommendedTeamSize(inputs: TeamInputs | TicketInputs): number {
  if ('teamSize' in inputs) {
    return Math.ceil(inputs.teamSize * (100 / inputs.serviceEfficiency));
  } else {
    return Math.ceil((inputs.monthlyTickets * inputs.hoursPerTicket) / 160);
  }
}

function createBaseAnalysisStore() {
  const { subscribe, set, update } = writable<BaseAnalysisResults>(initialResults);
  
  let currentInputs: TeamInputs | TicketInputs | null = null;

  return {
    subscribe,
    updateTeamInputs: (inputs: TeamInputs) => update(state => {
      currentInputs = { ...inputs };
      return {
        model: 'team',
        totalCost: calculateTotalCost(inputs),
        costPerTicket: calculateCostPerTicket(inputs),
        annualCost: calculateAnnualCost(inputs),
        efficiency: inputs.serviceEfficiency,
        recommendedTeamSize: calculateRecommendedTeamSize(inputs)
      };
    }),
    updateTicketInputs: (inputs: TicketInputs) => update(state => {
      currentInputs = { ...inputs };
      return {
        model: 'ticket',
        totalCost: calculateTotalCost(inputs),
        costPerTicket: calculateCostPerTicket(inputs),
        annualCost: calculateAnnualCost(inputs),
        efficiency: calculateEfficiency(inputs),
        recommendedTeamSize: calculateRecommendedTeamSize(inputs)
      };
    }),
    getCurrentInputs: () => currentInputs ? { ...currentInputs } : null,
    reset: () => {
      currentInputs = null;
      set(initialResults);
    }
  };
}

export const baseAnalysisStore = createBaseAnalysisStore(); 