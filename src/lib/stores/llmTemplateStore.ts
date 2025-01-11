import { derived } from 'svelte/store';
import { calculatorStore } from './calculatorStore';
import type { CalculatorModel, SolutionType, CalculationResults } from '$lib/types/calculator';

interface ExtendedCalculationResults extends CalculationResults {
  baseInputs?: {
    hourlyRate: number;
    [key: string]: any;
  };
}

// Template generation functions for each model and solution type
function generateTeamPlatformTemplate(inputs: any, results: ExtendedCalculationResults): string {
  const platformInputs = results.solutionInputs?.platform;
  if (!platformInputs) return '';

  return `I am analyzing a Operations Costs model with the following configuration:

Model Selection: Team-Based Model
- This model is used because the service is delivered by dedicated teams with defined sizes and costs
- The analysis focuses on team capacity, efficiency, and operational overhead

Current Configuration:
- Team Size: ${inputs.teamSize} members
- Hourly Rate: $${results.baseInputs?.hourlyRate}/hour
- Service Efficiency: ${Math.round(inputs.serviceEfficiency * 100)}%
- Operational Overhead: ${Math.round(inputs.operationalOverhead * 100)}%

Platform Solution Details:
- Platform Cost: $${platformInputs.platformCost.toFixed(2)}
- Monthly Maintenance: $${platformInputs.platformMaintenance.toFixed(2)}
- Implementation Time: ${platformInputs.timeToBuild} months
- Expected Team Reduction: ${Math.round(platformInputs.teamReduction * 100)}%
- Target Process Efficiency: ${Math.round(platformInputs.processEfficiency * 100)}%

Key Formulas Used:
1. Monthly Operational Cost:
   Monthly Cost = Team Size × Hourly Rate × Working Hours × Service Efficiency × (1 + Operational Overhead)
   - Working Hours: Standard monthly working hours (160)
   - Service Efficiency: Percentage of time spent on productive work
   - Operational Overhead: Additional costs as percentage

2. Platform Solution Cost:
   Implementation Cost = Platform Cost
   Monthly Operating Cost = Platform Maintenance
   Time to Value = Implementation Time (months)
   Team Cost Reduction = Monthly Cost × Team Reduction %
   Process Efficiency Savings = Monthly Cost × Process Efficiency %
   Total Monthly Savings = Team Cost Reduction + Process Efficiency Savings - Monthly Operating Cost

3. Break-Even Analysis:
   Break-Even Months = Platform Cost / Monthly Savings

Current Results:
- Current Monthly Cost: $${results.totalCost.toFixed(2)}
- Expected Monthly Savings: $${results.monthlySavings.toFixed(2)}
- Break-even Period: ${results.breakEvenMonths?.toFixed(1) || 'N/A'} months
- Annual ROI: ${((results.monthlySavings * 12 / platformInputs.platformCost) * 100).toFixed(1)}%

Based on this analysis, please provide insights on:
1. Is this a realistic and achievable transformation plan?
2. What are the key risks and challenges to consider?
3. What best practices would you recommend for implementation?
4. How does this compare to industry benchmarks?
5. What other factors should be considered in this analysis?`;
}

function generateTeamOutsourceTemplate(inputs: any, results: ExtendedCalculationResults): string {
  const outsourceInputs = results.solutionInputs?.outsource;
  if (!outsourceInputs) return '';

  return `I am analyzing a Operations Costs model with the following configuration:

Model Selection: Team-Based Model
- This model is used because the service is delivered by dedicated teams with defined sizes and costs
- The analysis focuses on team capacity, efficiency, and operational overhead

Current Configuration:
- Team Size: ${inputs.teamSize} members
- Hourly Rate: $${results.baseInputs?.hourlyRate}/hour
- Service Efficiency: ${(inputs.serviceEfficiency * 100).toFixed(0)}%
- Operational Overhead: ${(inputs.operationalOverhead * 100).toFixed(0)}%

Outsourcing Solution Details:
- Transition Cost: $${outsourceInputs.transitionCost.toFixed(2)}
- Vendor Rate: $${outsourceInputs.vendorRate.toFixed(2)}/hour
- Transition Time: ${outsourceInputs.transitionTime} months
- Quality Impact: ${Math.round(outsourceInputs.qualityImpact * 100)}%
- Knowledge Loss Risk: ${Math.round(outsourceInputs.knowledgeLoss * 100)}%
- Management Overhead: ${Math.round(outsourceInputs.managementOverhead * 100)}%

Key Formulas Used:
1. Current Monthly Operational Cost:
   Monthly Cost = Team Size × Hourly Rate × Working Hours × Service Efficiency × (1 + Operational Overhead)
   - Working Hours: Standard monthly working hours (160)
   - Service Efficiency: Percentage of time spent on productive work
   - Operational Overhead: Additional costs as percentage

2. Outsourcing Solution Cost:
   Transition Cost = One-time cost for knowledge transfer and transition
   Monthly Operating Cost = Vendor Rate × Working Hours × Team Size × (1 + Management Overhead)
   Time to Value = Transition Time (months)
   Total Monthly Savings = Current Monthly Cost - Monthly Operating Cost

3. Break-Even Analysis:
   Break-Even Months = Transition Cost / Monthly Savings

Current Results:
- Current Monthly Cost: $${results.totalCost.toFixed(2)}
- Expected Monthly Savings: $${results.monthlySavings.toFixed(2)}
- Break-even Period: ${results.breakEvenMonths?.toFixed(1) || 'N/A'} months
- Annual ROI: ${((results.monthlySavings * 12 / outsourceInputs.transitionCost) * 100).toFixed(1)}%

Based on this analysis, please provide insights on:
1. Is outsourcing a viable option for this service?
2. What are the key risks in transitioning to an outsourced model?
3. How can we ensure service quality is maintained?
4. What should be included in the service level agreement?
5. What transition strategies would you recommend?`;
}

function generateTeamHybridTemplate(inputs: any, results: ExtendedCalculationResults): string {
  const hybridInputs = results.solutionInputs?.hybrid;
  if (!hybridInputs) return '';

  return `I am analyzing a Operations Costs model with the following configuration:

Model Selection: Team-Based Model
- This model is used because the service is delivered by dedicated teams with defined sizes and costs
- The analysis focuses on team capacity, efficiency, and operational overhead

Current Configuration:
- Team Size: ${inputs.teamSize} members
- Hourly Rate: $${results.baseInputs?.hourlyRate}/hour
- Service Efficiency: ${(inputs.serviceEfficiency * 100).toFixed(0)}%
- Operational Overhead: ${(inputs.operationalOverhead * 100).toFixed(0)}%

Hybrid Solution Details:
- Platform Cost: $${hybridInputs.platformCost.toFixed(2)}
- Platform Maintenance: $${hybridInputs.platformMaintenance.toFixed(2)}/month
- Transition Cost: $${hybridInputs.transitionCost.toFixed(2)}
- Vendor Rate: $${hybridInputs.vendorRate.toFixed(2)}/hour
- Implementation Time: ${hybridInputs.timeToBuild} months
- Team Reduction: ${Math.round(hybridInputs.teamReduction * 100)}%
- Process Efficiency: ${Math.round(hybridInputs.processEfficiency * 100)}%
- Platform Portion: ${Math.round(hybridInputs.platformPortion * 100)}%
- Vendor Portion: ${Math.round(hybridInputs.vendorPortion * 100)}%

Key Formulas Used:
1. Current Monthly Operational Cost:
   Monthly Cost = Team Size × Hourly Rate × Working Hours × Service Efficiency × (1 + Operational Overhead)
   - Working Hours: Standard monthly working hours (160)
   - Service Efficiency: Percentage of time spent on productive work
   - Operational Overhead: Additional costs as percentage

2. Hybrid Solution Cost:
   Initial Investment = Platform Cost + Transition Cost
   Monthly Platform Cost = Platform Maintenance
   Monthly Outsourcing Cost = Vendor Rate × Reduced Team Size × Working Hours × Vendor Portion
   Process Efficiency Savings = Monthly Cost × Process Efficiency %
   Total Monthly Savings = Current Monthly Cost - (Monthly Platform Cost + Monthly Outsourcing Cost)

3. Break-Even Analysis:
   Break-Even Months = Initial Investment / Monthly Savings

Current Results:
- Current Monthly Cost: $${results.totalCost.toFixed(2)}
- Expected Monthly Savings: $${results.monthlySavings.toFixed(2)}
- Break-even Period: ${results.breakEvenMonths?.toFixed(1) || 'N/A'} months
- Annual ROI: ${((results.monthlySavings * 12 / (hybridInputs.platformCost + hybridInputs.transitionCost)) * 100).toFixed(1)}%

Based on this analysis, please provide insights on:
1. Is this hybrid approach appropriate for our Operations Costs needs?
2. How should we balance automation vs. outsourcing?
3. What are the key risks in implementing both solutions simultaneously?
4. What implementation sequence would you recommend?
5. How can we ensure effective coordination between platforms and outsourced teams?`;
}

function generateTicketPlatformTemplate(inputs: any, results: ExtendedCalculationResults): string {
  const platformInputs = results.solutionInputs?.platform;
  if (!platformInputs) return '';

  return `I am analyzing a Operations Costs model with the following configuration:

Model Selection: Ticket-Based Model
- This model is used because the service is delivered based on individual ticket volume and processing
- The analysis focuses on ticket metrics, processing time, and resource allocation

Current Configuration:
- Monthly Tickets: ${inputs.monthlyTickets}
- Hours per Ticket: ${inputs.hoursPerTicket}
- People per Ticket: ${inputs.peoplePerTicket}
- SLA Compliance: ${Math.round(inputs.slaCompliance * 100)}%

Platform Solution Details:
- Platform Cost: $${platformInputs.platformCost.toFixed(2)}
- Monthly Maintenance: $${platformInputs.platformMaintenance.toFixed(2)}
- Implementation Time: ${platformInputs.timeToBuild} months
- Expected Team Reduction: ${Math.round(platformInputs.teamReduction * 100)}%
- Target Process Efficiency: ${Math.round(platformInputs.processEfficiency * 100)}%

Key Formulas Used:
1. Current Monthly Processing Cost:
   Monthly Cost = Monthly Tickets × Hours per Ticket × People per Ticket × Hourly Rate
   Cost per Ticket = Monthly Cost / Monthly Tickets

2. Platform Solution Cost:
   Implementation Cost = Platform Cost
   Monthly Operating Cost = Platform Maintenance + (Remaining Manual Tickets × Reduced Processing Cost)
   Team Cost Reduction = Monthly Cost × Team Reduction %
   Process Efficiency Savings = Monthly Cost × Process Efficiency %
   Total Monthly Savings = Team Cost Reduction + Process Efficiency Savings - Monthly Operating Cost

3. Break-Even Analysis:
   Break-Even Months = Platform Cost / Monthly Savings

Current Results:
- Current Monthly Cost: $${results.totalCost.toFixed(2)}
- Cost per Ticket: $${results.costPerTicket.toFixed(2)}
- Expected Monthly Savings: $${results.monthlySavings.toFixed(2)}
- Break-even Period: ${results.breakEvenMonths?.toFixed(1) || 'N/A'} months
- Annual ROI: ${((results.monthlySavings * 12 / platformInputs.platformCost) * 100).toFixed(1)}%

Based on this analysis, please provide insights on:
1. Is this automation level achievable for our ticket types?
2. What factors could impact the automation success rate?
3. How can we ensure SLA compliance during and after implementation?
4. What change management considerations should we address?
5. How does this compare to similar automation initiatives?`;
}

function generateTicketOutsourceTemplate(inputs: any, results: ExtendedCalculationResults): string {
  const outsourceInputs = results.solutionInputs?.outsource;
  if (!outsourceInputs) return '';

  return `I am analyzing a Operations Costs model with the following configuration:

Model Selection: Ticket-Based Model
- This model is used because the service is delivered based on individual ticket volume and processing
- The analysis focuses on ticket metrics, processing time, and resource allocation

Current Configuration:
- Monthly Tickets: ${inputs.monthlyTickets}
- Hours per Ticket: ${inputs.hoursPerTicket}
- People per Ticket: ${inputs.peoplePerTicket}
- SLA Compliance: ${Math.round(inputs.slaCompliance * 100)}%

Outsourcing Solution Details:
- Transition Cost: $${outsourceInputs.transitionCost.toFixed(2)}
- Vendor Rate: $${outsourceInputs.vendorRate.toFixed(2)}/hour
- Transition Time: ${outsourceInputs.transitionTime} months
- Quality Impact: ${Math.round(outsourceInputs.qualityImpact * 100)}%
- Knowledge Loss Risk: ${Math.round(outsourceInputs.knowledgeLoss * 100)}%
- Management Overhead: ${Math.round(outsourceInputs.managementOverhead * 100)}%

Key Formulas Used:
1. Current Monthly Processing Cost:
   Monthly Cost = Monthly Tickets × Hours per Ticket × People per Ticket × Hourly Rate
   Cost per Ticket = Monthly Cost / Monthly Tickets

2. Outsourcing Solution Cost:
   Transition Cost = One-time cost for knowledge transfer and transition
   Monthly Operating Cost = Monthly Tickets × Vendor Rate × Hours per Ticket × (1 + Management Overhead)
   Total Monthly Savings = Current Monthly Cost - Monthly Operating Cost

3. Break-Even Analysis:
   Break-Even Months = Transition Cost / Monthly Savings

Current Results:
- Current Monthly Cost: $${results.totalCost.toFixed(2)}
- Cost per Ticket: $${results.costPerTicket.toFixed(2)}
- Expected Monthly Savings: $${results.monthlySavings.toFixed(2)}
- Break-even Period: ${results.breakEvenMonths?.toFixed(1) || 'N/A'} months
- Annual ROI: ${((results.monthlySavings * 12 / outsourceInputs.transitionCost) * 100).toFixed(1)}%

Based on this analysis, please provide insights on:
1. Is the provider's rate structure competitive?
2. How can we ensure smooth ticket handover?
3. What SLA and quality metrics should we monitor?
4. How should we handle volume fluctuations?
5. What governance model would you recommend?`;
}

function generateTicketHybridTemplate(inputs: any, results: ExtendedCalculationResults): string {
  const hybridInputs = results.solutionInputs?.hybrid;
  if (!hybridInputs) return '';

  return `I am analyzing a Operations Costs model with the following configuration:

Model Selection: Ticket-Based Model
- This model is used because the service is delivered based on individual ticket volume and processing
- The analysis focuses on ticket metrics, processing time, and resource allocation

Current Configuration:
- Monthly Tickets: ${inputs.monthlyTickets}
- Hours per Ticket: ${inputs.hoursPerTicket}
- People per Ticket: ${inputs.peoplePerTicket}
- SLA Compliance: ${Math.round(inputs.slaCompliance * 100)}%

Hybrid Solution Details:
- Platform Cost: $${hybridInputs.platformCost.toFixed(2)}
- Platform Maintenance: $${hybridInputs.platformMaintenance.toFixed(2)}/month
- Transition Cost: $${hybridInputs.transitionCost.toFixed(2)}
- Vendor Rate: $${hybridInputs.vendorRate.toFixed(2)}/hour
- Implementation Time: ${hybridInputs.timeToBuild} months
- Team Reduction: ${Math.round(hybridInputs.teamReduction * 100)}%
- Process Efficiency: ${Math.round(hybridInputs.processEfficiency * 100)}%
- Platform Portion: ${Math.round(hybridInputs.platformPortion * 100)}%
- Vendor Portion: ${Math.round(hybridInputs.vendorPortion * 100)}%

Key Formulas Used:
1. Current Monthly Processing Cost:
   Monthly Cost = Monthly Tickets × Hours per Ticket × People per Ticket × Hourly Rate
   Cost per Ticket = Monthly Cost / Monthly Tickets

2. Hybrid Solution Cost:
   Initial Investment = Platform Cost + Transition Cost
   Monthly Platform Cost = Platform Maintenance
   Monthly Outsourcing Cost = Vendor Rate × Hours per Ticket × Monthly Tickets × Vendor Portion × (1 + Management Overhead)
   Process Efficiency Savings = Monthly Cost × Process Efficiency %
   Total Monthly Savings = Current Monthly Cost - (Monthly Platform Cost + Monthly Outsourcing Cost)

3. Break-Even Analysis:
   Break-Even Months = Initial Investment / Monthly Savings

Current Results:
- Current Monthly Cost: $${results.totalCost.toFixed(2)}
- Cost per Ticket: $${results.costPerTicket.toFixed(2)}
- Expected Monthly Savings: $${results.monthlySavings.toFixed(2)}
- Break-even Period: ${results.breakEvenMonths?.toFixed(1) || 'N/A'} months
- Annual ROI: ${((results.monthlySavings * 12 / (hybridInputs.platformCost + hybridInputs.transitionCost)) * 100).toFixed(1)}%

Based on this analysis, please provide insights on:
1. How should tickets be distributed between automation and outsourcing?
2. What criteria should determine automation vs. manual processing?
3. How can we ensure consistent service quality across both channels?
4. What integration points need to be considered?
5. How should we phase the implementation of both solutions?`;
}

// Create the derived store
export const llmTemplateStore = derived(calculatorStore, ($calculatorStore) => {
  const currentState = calculatorStore.getCurrentState();
  if (!currentState?.baseInputs || !currentState?.solutionInputs) return null;

  return {
    generateTemplate: () => {
      const model = $calculatorStore.model;
      const solution = $calculatorStore.solution;
      
      if (model === 'team') {
        switch (solution) {
          case 'platform':
            return generateTeamPlatformTemplate(currentState.baseInputs, $calculatorStore);
          case 'outsource':
            return generateTeamOutsourceTemplate(currentState.baseInputs, $calculatorStore);
          case 'hybrid':
            return generateTeamHybridTemplate(currentState.baseInputs, $calculatorStore);
          default:
            return '';
        }
      } else {
        switch (solution) {
          case 'platform':
            return generateTicketPlatformTemplate(currentState.baseInputs, $calculatorStore);
          case 'outsource':
            return generateTicketOutsourceTemplate(currentState.baseInputs, $calculatorStore);
          case 'hybrid':
            return generateTicketHybridTemplate(currentState.baseInputs, $calculatorStore);
          default:
            return '';
        }
      }
    }
  };
}); 