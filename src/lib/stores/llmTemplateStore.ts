import { derived } from 'svelte/store';
import { calculatorStore } from './calculatorStore';
import type { CalculatorModel, SolutionType, CalculationResults } from '$lib/types/calculator';

// Template generation functions for each model and solution type
function generateTeamPlatformTemplate(inputs: any, results: CalculationResults): string {
  return `I am analyzing a service delivery model with the following configuration:

Model Selection: Team-Based Model
- This model is used because the service is delivered by dedicated teams with defined sizes and costs
- The analysis focuses on team capacity, efficiency, and operational overhead

Solution Approach: Platform Solution
- A platform solution is being evaluated to automate and streamline team operations
- The goal is to reduce team size and improve process efficiency

Current Configuration:
- Team Size: ${inputs.teamSize} members
- Hourly Rate: $${inputs.hourlyRate}/hour
- Service Efficiency: ${(inputs.serviceEfficiency * 100).toFixed(0)}%
- Operational Overhead: ${(inputs.operationalOverhead * 100).toFixed(0)}%

Platform Solution Details:
- Platform Cost: $${results.platformCost}
- Monthly Maintenance: $${results.platformMaintenance}
- Implementation Time: ${results.timeToBuild} months
- Expected Team Reduction: ${(results.teamReduction * 100).toFixed(0)}%
- Target Process Efficiency: ${(results.processEfficiency * 100).toFixed(0)}%

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
- Current Monthly Cost: $${results.totalCost}
- Expected Monthly Savings: $${results.monthlySavings}
- Break-even Period: ${results.breakEvenMonths} months
- Annual ROI: ${((results.monthlySavings * 12 / results.platformCost) * 100).toFixed(1)}%

Based on this analysis, please provide insights on:
1. Is this a realistic and achievable transformation plan?
2. What are the key risks and challenges to consider?
3. What best practices would you recommend for implementation?
4. How does this compare to industry benchmarks?
5. What other factors should be considered in this analysis?`;
}

function generateTeamOutsourceTemplate(inputs: any, results: CalculationResults): string {
  return `I am analyzing a service delivery model with the following configuration:

Model Selection: Team-Based Model
- This model is used because the service is delivered by dedicated teams with defined sizes and costs
- The analysis focuses on team capacity, efficiency, and operational overhead

Solution Approach: Outsourcing Solution
- An outsourcing solution is being evaluated to transfer operations to a service provider
- The goal is to reduce operational costs and improve service delivery

Current Configuration:
- Team Size: ${inputs.teamSize} members
- Hourly Rate: $${inputs.hourlyRate}/hour
- Service Efficiency: ${(inputs.serviceEfficiency * 100).toFixed(0)}%
- Operational Overhead: ${(inputs.operationalOverhead * 100).toFixed(0)}%

Outsourcing Solution Details:
- Transition Cost: $${results.transitionCost}
- Provider Rate: $${results.providerRate}/hour
- Transition Time: ${results.transitionTime} months
- Service Level: ${results.serviceLevel}%

Key Formulas Used:
1. Current Monthly Operational Cost:
   Monthly Cost = Team Size × Hourly Rate × Working Hours × Service Efficiency × (1 + Operational Overhead)
   - Working Hours: Standard monthly working hours (160)
   - Service Efficiency: Percentage of time spent on productive work
   - Operational Overhead: Additional costs as percentage

2. Outsourcing Solution Cost:
   Transition Cost = One-time cost for knowledge transfer and transition
   Monthly Operating Cost = Provider Rate × Working Hours × Team Size
   Time to Value = Transition Time (months)
   Total Monthly Savings = Current Monthly Cost - Monthly Operating Cost

3. Break-Even Analysis:
   Break-Even Months = Transition Cost / Monthly Savings

Current Results:
- Current Monthly Cost: $${results.totalCost}
- Expected Monthly Savings: $${results.monthlySavings}
- Break-even Period: ${results.breakEvenMonths} months
- Annual ROI: ${((results.monthlySavings * 12 / results.transitionCost) * 100).toFixed(1)}%

Based on this analysis, please provide insights on:
1. Is outsourcing a viable option for this service?
2. What are the key risks in transitioning to an outsourced model?
3. How can we ensure service quality is maintained?
4. What should be included in the service level agreement?
5. What transition strategies would you recommend?`;
}

function generateTeamHybridTemplate(inputs: any, results: CalculationResults): string {
  return `I am analyzing a service delivery model with the following configuration:

Model Selection: Team-Based Model
- This model is used because the service is delivered by dedicated teams with defined sizes and costs
- The analysis focuses on team capacity, efficiency, and operational overhead

Solution Approach: Hybrid Solution
- A hybrid solution combining platform automation and outsourcing is being evaluated
- The goal is to optimize service delivery through both automation and cost-effective staffing

Current Configuration:
- Team Size: ${inputs.teamSize} members
- Hourly Rate: $${inputs.hourlyRate}/hour
- Service Efficiency: ${(inputs.serviceEfficiency * 100).toFixed(0)}%
- Operational Overhead: ${(inputs.operationalOverhead * 100).toFixed(0)}%

Hybrid Solution Details:
- Platform Cost: $${results.platformCost}
- Platform Maintenance: $${results.platformMaintenance}/month
- Transition Cost: $${results.transitionCost}
- Provider Rate: $${results.providerRate}/hour
- Implementation Time: ${results.timeToBuild} months
- Team Reduction: ${(results.teamReduction * 100).toFixed(0)}%
- Process Efficiency: ${(results.processEfficiency * 100).toFixed(0)}%

Key Formulas Used:
1. Current Monthly Operational Cost:
   Monthly Cost = Team Size × Hourly Rate × Working Hours × Service Efficiency × (1 + Operational Overhead)
   - Working Hours: Standard monthly working hours (160)
   - Service Efficiency: Percentage of time spent on productive work
   - Operational Overhead: Additional costs as percentage

2. Hybrid Solution Cost:
   Initial Investment = Platform Cost + Transition Cost
   Monthly Platform Cost = Platform Maintenance
   Monthly Outsourcing Cost = Provider Rate × Reduced Team Size × Working Hours
   Process Efficiency Savings = Monthly Cost × Process Efficiency %
   Total Monthly Savings = Current Monthly Cost - (Monthly Platform Cost + Monthly Outsourcing Cost)

3. Break-Even Analysis:
   Break-Even Months = Initial Investment / Monthly Savings

Current Results:
- Current Monthly Cost: $${results.totalCost}
- Expected Monthly Savings: $${results.monthlySavings}
- Break-even Period: ${results.breakEvenMonths} months
- Annual ROI: ${((results.monthlySavings * 12 / (results.platformCost + results.transitionCost)) * 100).toFixed(1)}%

Based on this analysis, please provide insights on:
1. Is this hybrid approach appropriate for our service delivery needs?
2. How should we balance automation vs. outsourcing?
3. What are the key risks in implementing both solutions simultaneously?
4. What implementation sequence would you recommend?
5. How can we ensure effective coordination between platforms and outsourced teams?`;
}

function generateTicketPlatformTemplate(inputs: any, results: CalculationResults): string {
  return `I am analyzing a service delivery model with the following configuration:

Model Selection: Ticket-Based Model
- This model is used because the service is delivered based on individual ticket volume and processing
- The analysis focuses on ticket metrics, processing time, and resource allocation

Solution Approach: Platform Solution
- A platform solution is being evaluated to automate ticket processing
- The goal is to reduce processing time and improve efficiency

Current Configuration:
- Monthly Tickets: ${inputs.monthlyTickets}
- Hours per Ticket: ${inputs.hoursPerTicket}
- People per Ticket: ${inputs.peoplePerTicket}
- Hourly Rate: $${inputs.hourlyRate}
- SLA Compliance: ${inputs.slaCompliance}%

Platform Solution Details:
- Platform Cost: $${results.platformCost}
- Monthly Maintenance: $${results.platformMaintenance}
- Implementation Time: ${results.timeToBuild} months
- Expected Automation Rate: ${(results.automationRate * 100).toFixed(0)}%
- Processing Time Reduction: ${(results.processingTimeReduction * 100).toFixed(0)}%

Key Formulas Used:
1. Current Monthly Processing Cost:
   Monthly Cost = Monthly Tickets × Hours per Ticket × People per Ticket × Hourly Rate
   Cost per Ticket = Monthly Cost / Monthly Tickets

2. Platform Solution Cost:
   Implementation Cost = Platform Cost
   Monthly Operating Cost = Platform Maintenance + (Remaining Manual Tickets × Reduced Processing Cost)
   Automation Savings = Monthly Tickets × Automation Rate × Current Cost per Ticket
   Efficiency Savings = Remaining Manual Tickets × Current Cost per Ticket × Processing Time Reduction
   Total Monthly Savings = Automation Savings + Efficiency Savings - Monthly Operating Cost

3. Break-Even Analysis:
   Break-Even Months = Platform Cost / Monthly Savings

Current Results:
- Current Monthly Cost: $${results.totalCost}
- Cost per Ticket: $${results.costPerTicket}
- Expected Monthly Savings: $${results.monthlySavings}
- Break-even Period: ${results.breakEvenMonths} months
- Annual ROI: ${((results.monthlySavings * 12 / results.platformCost) * 100).toFixed(1)}%

Based on this analysis, please provide insights on:
1. Is this automation level achievable for our ticket types?
2. What factors could impact the automation success rate?
3. How can we ensure SLA compliance during and after implementation?
4. What change management considerations should we address?
5. How does this compare to similar automation initiatives?`;
}

function generateTicketOutsourceTemplate(inputs: any, results: CalculationResults): string {
  return `I am analyzing a service delivery model with the following configuration:

Model Selection: Ticket-Based Model
- This model is used because the service is delivered based on individual ticket volume and processing
- The analysis focuses on ticket metrics, processing time, and resource allocation

Solution Approach: Outsourcing Solution
- An outsourcing solution is being evaluated to transfer ticket processing to a service provider
- The goal is to reduce processing costs while maintaining service quality

Current Configuration:
- Monthly Tickets: ${inputs.monthlyTickets}
- Hours per Ticket: ${inputs.hoursPerTicket}
- People per Ticket: ${inputs.peoplePerTicket}
- Hourly Rate: $${inputs.hourlyRate}
- SLA Compliance: ${inputs.slaCompliance}%

Outsourcing Solution Details:
- Transition Cost: $${results.transitionCost}
- Provider Rate: $${results.providerRate}/hour
- Transition Time: ${results.transitionTime} months
- Target SLA: ${results.serviceLevel}%
- Volume Commitment: ${results.volumeCommitment} tickets/month

Key Formulas Used:
1. Current Monthly Processing Cost:
   Monthly Cost = Monthly Tickets × Hours per Ticket × People per Ticket × Hourly Rate
   Cost per Ticket = Monthly Cost / Monthly Tickets

2. Outsourcing Solution Cost:
   Transition Cost = One-time cost for knowledge transfer and transition
   Monthly Operating Cost = Monthly Tickets × Provider Rate × Hours per Ticket
   Volume Discount = Discount Rate × (Monthly Tickets - Volume Commitment)
   Total Monthly Cost = Monthly Operating Cost - Volume Discount

3. Break-Even Analysis:
   Break-Even Months = Transition Cost / Monthly Savings

Current Results:
- Current Monthly Cost: $${results.totalCost}
- Cost per Ticket: $${results.costPerTicket}
- Expected Monthly Savings: $${results.monthlySavings}
- Break-even Period: ${results.breakEvenMonths} months
- Annual ROI: ${((results.monthlySavings * 12 / results.transitionCost) * 100).toFixed(1)}%

Based on this analysis, please provide insights on:
1. Is the provider's rate structure competitive?
2. How can we ensure smooth ticket handover?
3. What SLA and quality metrics should we monitor?
4. How should we handle volume fluctuations?
5. What governance model would you recommend?`;
}

function generateTicketHybridTemplate(inputs: any, results: CalculationResults): string {
  return `I am analyzing a service delivery model with the following configuration:

Model Selection: Ticket-Based Model
- This model is used because the service is delivered based on individual ticket volume and processing
- The analysis focuses on ticket metrics, processing time, and resource allocation

Solution Approach: Hybrid Solution
- A hybrid solution combining platform automation and outsourcing is being evaluated
- The goal is to optimize ticket processing through automation while outsourcing remaining manual work

Current Configuration:
- Monthly Tickets: ${inputs.monthlyTickets}
- Hours per Ticket: ${inputs.hoursPerTicket}
- People per Ticket: ${inputs.peoplePerTicket}
- Hourly Rate: $${inputs.hourlyRate}
- SLA Compliance: ${inputs.slaCompliance}%

Hybrid Solution Details:
- Platform Cost: $${results.platformCost}
- Platform Maintenance: $${results.platformMaintenance}/month
- Transition Cost: $${results.transitionCost}
- Provider Rate: $${results.providerRate}/hour
- Implementation Time: ${results.timeToBuild} months
- Automation Rate: ${(results.automationRate * 100).toFixed(0)}%
- Processing Time Reduction: ${(results.processingTimeReduction * 100).toFixed(0)}%

Key Formulas Used:
1. Current Monthly Processing Cost:
   Monthly Cost = Monthly Tickets × Hours per Ticket × People per Ticket × Hourly Rate
   Cost per Ticket = Monthly Cost / Monthly Tickets

2. Hybrid Solution Cost:
   Initial Investment = Platform Cost + Transition Cost
   Automated Tickets = Monthly Tickets × Automation Rate
   Manual Tickets = Monthly Tickets × (1 - Automation Rate)
   Platform Cost = Monthly Maintenance + (Automated Tickets × Platform Cost per Ticket)
   Outsourcing Cost = Manual Tickets × Provider Rate × Reduced Processing Time
   Total Monthly Cost = Platform Cost + Outsourcing Cost

3. Break-Even Analysis:
   Break-Even Months = Initial Investment / Monthly Savings

Current Results:
- Current Monthly Cost: $${results.totalCost}
- Cost per Ticket: $${results.costPerTicket}
- Expected Monthly Savings: $${results.monthlySavings}
- Break-even Period: ${results.breakEvenMonths} months
- Annual ROI: ${((results.monthlySavings * 12 / (results.platformCost + results.transitionCost)) * 100).toFixed(1)}%

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