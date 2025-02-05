import { derived } from 'svelte/store';
import { calculatorStore } from './calculatorStore';
import { currencyStore } from './currencyStore';
import type { CalculatorModel, TargetBasedPlanningResults } from '$lib/types/calculator';

interface Target {
  type: 'roi' | 'team' | 'efficiency' | 'implementation';
  value: number;
}

function generateTeamTargetTemplate(inputs: any, targets: Target[]): string {
  const currencyConfig = currencyStore.getCurrentConfig();

  return `For this analysis, the currency is ${currencyConfig.code} (${currencyConfig.symbol}).

I am analyzing a Operations Costs transformation plan with the following configuration:

Model Selection: Team-Based Model
- This model is used because the service is delivered by dedicated teams with defined sizes and costs
- The analysis focuses on team capacity, efficiency, and operational overhead

Current Configuration:
- Team Size: ${inputs.teamSize} members
- Hourly Rate: $${inputs.hourlyRate}/hour
- Service Efficiency: ${Math.round(inputs.serviceEfficiency * 100)}%
- Operational Overhead: ${Math.round(inputs.operationalOverhead * 100)}%

Target Goals:
- Break Even Time: ${targets.find(t => t.type === 'roi')?.value} months
- Team Reduction: ${targets.find(t => t.type === 'team')?.value}%
- Process Efficiency: ${targets.find(t => t.type === 'efficiency')?.value}%
- Implementation Time: ${targets.find(t => t.type === 'implementation')?.value} months

Key Formulas Used:
1. Monthly Baseline Cost:
   Monthly Cost = Team Size × Hourly Rate × Working Hours × Service Efficiency × (1 + Operational Overhead)
   - Working Hours: Standard monthly working hours (160)
   - Service Efficiency: Percentage of time spent on productive work
   - Operational Overhead: Additional costs as percentage

2. Required Investment Calculation:
   Monthly Operating Cost = Monthly Cost × (1 - Team Reduction) × (1 - Process Efficiency)
   Monthly Savings = Monthly Cost - Monthly Operating Cost - Monthly Platform Cost
   Required Investment = Monthly Platform Cost × Implementation Time

Based on this analysis, please provide insights on:
1. Is this transformation timeline realistic given the team size and target reductions?
2. What are the key risks in achieving these efficiency targets?
3. How does the implementation time affect the ROI calculation?
4. What change management considerations should be addressed?
5. Are the team reduction and efficiency targets achievable simultaneously?
6. What dependencies might affect the success of this transformation?`;
}

function generateTicketTargetTemplate(inputs: any, targets: Target[]): string {
  const currencyConfig = currencyStore.getCurrentConfig();

  return `For this analysis, the currency is ${currencyConfig.code} (${currencyConfig.symbol}).

I am analyzing a Operations Costs transformation plan with the following configuration:

Model Selection: Ticket-Based Model
- This model is used because the service is delivered based on individual ticket volume and processing
- The analysis focuses on ticket metrics, processing time, and resource allocation

Current Configuration:
- Monthly Tickets: ${inputs.monthlyTickets}
- Hours per Ticket: ${inputs.hoursPerTicket}
- People per Ticket: ${inputs.peoplePerTicket}
- SLA Compliance: ${inputs.slaCompliance}%

Target Goals:
- Break Even Time: ${targets[0].value} months
- Automation Rate: ${targets[1].value}%
- SLA Improvement: ${targets[2].value}%
- Implementation Time: ${targets[3].value} months

Key Formulas Used:
1. Monthly Baseline Cost:
   Monthly Cost = Monthly Tickets × Hours per Ticket × People per Ticket × Hourly Rate
   Cost per Ticket = Monthly Cost / Monthly Tickets

2. Required Investment Calculation:
   Monthly Operating Cost = Monthly Cost × (1 - Automation Rate) × (1 - SLA Improvement)
   Monthly Savings = Monthly Cost - Monthly Operating Cost - Monthly Platform Cost
   Required Investment = Monthly Platform Cost × Implementation Time

Based on this analysis, please provide insights on:
1. Is this transformation timeline realistic given the ticket volume and complexity?
2. What factors could impact the success of automation implementation?
3. How might ticket volume variations affect the ROI calculations?
4. What strategies would you recommend for maintaining and improving SLA compliance?
5. Are the automation and SLA improvement targets achievable with the proposed timeline?
6. What monitoring and control mechanisms should be put in place?`;
}

// Create the derived store
export const targetPlanningTemplateStore = derived(calculatorStore, ($calculatorStore) => {
  const currentState = calculatorStore.getCurrentState();
  if (!currentState?.baseInputs) return null;

  return {
    generateTemplate: (targets: Target[]) => {
      const model = $calculatorStore.model;
      
      if (model === 'team') {
        return generateTeamTargetTemplate(currentState.baseInputs, targets);
      } else {
        return generateTicketTargetTemplate(currentState.baseInputs, targets);
      }
    }
  };
}); 