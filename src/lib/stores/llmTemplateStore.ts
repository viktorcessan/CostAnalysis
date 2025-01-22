import { derived } from 'svelte/store';
import { calculatorStore } from './calculatorStore';
import type { CalculatorModel, SolutionType, CalculationResults, SolutionInputs } from '$lib/types/calculator';

interface ExtendedCalculationResults extends CalculationResults {
  baseInputs?: {
    hourlyRate: number;
    [key: string]: any;
  };
  solutionInputs?: SolutionInputs;
}

// Template generation functions for each model and solution type
function generateTeamPlatformTemplate(inputs: any, results: ExtendedCalculationResults): string {
  const platformInputs = results.solutionInputs?.platform || {
    platformCost: 0,
    platformMaintenance: 0,
    timeToBuild: 0,
    processEfficiency: 0,
    teamReduction: 0
  };

  const defaultInputs = {
    teamSize: 0,
    serviceEfficiency: 0,
    operationalOverhead: 0
  };

  const safeInputs = { ...defaultInputs, ...inputs };
  const hourlyRate = results.baseInputs?.hourlyRate || 0;
  const totalCost = results.totalCost || 0;
  const monthlySavings = results.monthlySavings || 0;
  const breakEvenMonths = results.breakEvenMonths || 0;

  return `I am analyzing an Operations Cost Optimization model with the following configuration:

Model Type: Team-Based Analysis
This model is used when:
- Service delivery is performed by dedicated teams with defined sizes
- Teams have fixed costs (salaries, benefits, overhead)
- Work is measured by team capacity and efficiency
- Focus is on optimizing team performance and costs

Current Team Configuration:
- Team Size: ${safeInputs.teamSize} members
- Hourly Rate: $${hourlyRate}/hour
- Service Efficiency: ${Math.round(safeInputs.serviceEfficiency * 100)}% (productive time vs total time)
- Operational Overhead: ${Math.round(safeInputs.operationalOverhead * 100)}% (additional costs as % of base cost)

Platform Solution Details:
- Initial Platform Cost: $${platformInputs.platformCost.toFixed(2)}
- Monthly Platform Maintenance: $${platformInputs.platformMaintenance.toFixed(2)}
- Implementation Timeline: ${platformInputs.timeToBuild} months
- Expected Process Efficiency Gain: ${Math.round(platformInputs.processEfficiency * 100)}%

Key Formulas and Calculations:

1. Current Monthly Operational Cost:
   Base Cost = Team Size × Hourly Rate × Monthly Working Hours
   - Monthly Working Hours = 160 (standard)
   Efficiency Adjustment = Base Cost × Service Efficiency
   Total Monthly Cost = Efficiency Adjustment × (1 + Operational Overhead)
   
   Your current monthly cost: $${totalCost.toFixed(2)}

2. Platform Solution Impact:
   a) Implementation Investment:
      - One-time Platform Cost: $${platformInputs.platformCost.toFixed(2)}
      - Implementation Timeline: ${platformInputs.timeToBuild} months
      - Monthly Platform Maintenance: $${platformInputs.platformMaintenance.toFixed(2)}
   
   b) Cost Structure:
      Current Monthly Cost = $${totalCost.toFixed(2)}
      
      Implementation Cost = Platform Cost + (Current Monthly Cost × Build Time)
      = $${platformInputs.platformCost.toFixed(2)} + ($${totalCost.toFixed(2)} × ${platformInputs.timeToBuild})
      = $${(platformInputs.platformCost + totalCost * platformInputs.timeToBuild).toFixed(2)}

      Reduced Team Cost = Current Monthly Cost × (1 - Team Reduction) × (1 - Process Efficiency)
      = $${totalCost.toFixed(2)} × (1 - ${(platformInputs.teamReduction || 0).toFixed(2)}) × (1 - ${platformInputs.processEfficiency.toFixed(2)})
      = $${(totalCost * (1 - (platformInputs.teamReduction || 0)) * (1 - platformInputs.processEfficiency)).toFixed(2)}

      Monthly Operating Cost = Reduced Team Cost + Monthly Maintenance
      = $${(totalCost * (1 - (platformInputs.teamReduction || 0)) * (1 - platformInputs.processEfficiency)).toFixed(2)} + $${platformInputs.platformMaintenance.toFixed(2)}
      = $${(totalCost * (1 - (platformInputs.teamReduction || 0)) * (1 - platformInputs.processEfficiency) + platformInputs.platformMaintenance).toFixed(2)}

      Monthly Savings = Current Monthly Cost - Monthly Operating Cost
      = $${totalCost.toFixed(2)} - $${(totalCost * (1 - (platformInputs.teamReduction || 0)) * (1 - platformInputs.processEfficiency) + platformInputs.platformMaintenance).toFixed(2)}
      = $${monthlySavings.toFixed(2)}

3. ROI Analysis:
   Break-Even Period = Implementation Cost ÷ Monthly Savings
   = $${(platformInputs.platformCost + totalCost * platformInputs.timeToBuild).toFixed(2)} ÷ $${monthlySavings.toFixed(2)}
   = ${breakEvenMonths.toFixed(1)} months

   Annual ROI = (Monthly Savings × 12 - Implementation Cost) ÷ Implementation Cost × 100
   = ($${(monthlySavings * 12).toFixed(2)} - $${(platformInputs.platformCost + totalCost * platformInputs.timeToBuild).toFixed(2)}) ÷ $${(platformInputs.platformCost + totalCost * platformInputs.timeToBuild).toFixed(2)} × 100
   = ${((monthlySavings * 12 - (platformInputs.platformCost + totalCost * platformInputs.timeToBuild)) / (platformInputs.platformCost + totalCost * platformInputs.timeToBuild) * 100).toFixed(1)}%

Key Metrics Summary:
- Current Monthly Cost: $${totalCost.toFixed(2)}
- Implementation Cost: $${(platformInputs.platformCost + totalCost * platformInputs.timeToBuild).toFixed(2)}
- Monthly Operating Cost: $${(totalCost * (1 - (platformInputs.teamReduction || 0)) * (1 - platformInputs.processEfficiency) + platformInputs.platformMaintenance).toFixed(2)}
- Monthly Savings: $${monthlySavings.toFixed(2)}
- Break-even Period: ${breakEvenMonths.toFixed(1)} months
- First Year ROI: ${((monthlySavings * 12 - (platformInputs.platformCost + totalCost * platformInputs.timeToBuild)) / (platformInputs.platformCost + totalCost * platformInputs.timeToBuild) * 100).toFixed(1)}%
- 3-Year Total Savings: $${(monthlySavings * 36).toFixed(2)}

Based on this analysis, please provide insights on:
1. What are the key factors driving the current operational costs?
2. How does the platform solution impact operational efficiency?
3. What is your assessment of the ROI and break-even timeline?
4. What industry benchmarks should we consider for platform costs and maintenance?
5. What other operational metrics should we track?

Summary:
We are currently operating with a ${safeInputs.teamSize}-member team at $${hourlyRate}/hour, with ${Math.round(safeInputs.serviceEfficiency * 100)}% service efficiency and ${Math.round(safeInputs.operationalOverhead * 100)}% operational overhead, resulting in a monthly cost of $${totalCost.toFixed(2)}.

By implementing a platform solution with an initial investment of $${platformInputs.platformCost.toFixed(2)} and monthly maintenance of $${platformInputs.platformMaintenance.toFixed(2)}, we expect to achieve ${Math.round(platformInputs.processEfficiency * 100)}% process efficiency gains. This will result in monthly savings of $${monthlySavings.toFixed(2)}.

The break-even point will be reached in ${breakEvenMonths.toFixed(1)} months, with a first-year ROI of ${((monthlySavings * 12 - (platformInputs.platformCost + totalCost * platformInputs.timeToBuild)) / (platformInputs.platformCost + totalCost * platformInputs.timeToBuild) * 100).toFixed(1)}%. Over three years, total savings are projected to be $${(monthlySavings * 36).toFixed(2)}.`;
}

function generateTeamOutsourceTemplate(inputs: any, results: ExtendedCalculationResults): string {
  const outsourceInputs = results.solutionInputs?.outsource || {
    transitionCost: 0,
    vendorRate: 0,
    transitionTime: 0,
    qualityImpact: 0,
    knowledgeLoss: 0,
    managementOverhead: 0
  };

  const defaultInputs = {
    teamSize: 0,
    serviceEfficiency: 0,
    operationalOverhead: 0
  };

  const safeInputs = { ...defaultInputs, ...inputs };
  const hourlyRate = results.baseInputs?.hourlyRate || 0;
  const totalCost = results.totalCost || 0;
  const monthlySavings = results.monthlySavings || 0;
  const breakEvenMonths = results.breakEvenMonths || 0;

  return `I am analyzing an Operations Cost Optimization model with the following configuration:

Model Type: Team-Based Analysis with Outsourcing
This model is used when:
- Current operations are performed by in-house teams
- Considering transition to external service providers
- Need to evaluate cost-benefit of outsourcing
- Focus on maintaining quality while reducing costs

Current Team Configuration:
- Team Size: ${safeInputs.teamSize} members
- Hourly Rate: $${hourlyRate}/hour
- Service Efficiency: ${(safeInputs.serviceEfficiency * 100).toFixed(0)}% (productive time vs total time)
- Operational Overhead: ${(safeInputs.operationalOverhead * 100).toFixed(0)}% (additional costs as % of base cost)

Outsourcing Solution Parameters:
- One-time Transition Cost: $${outsourceInputs.transitionCost.toFixed(2)}
- Vendor Hourly Rate: $${outsourceInputs.vendorRate.toFixed(2)}/hour
- Transition Period: ${outsourceInputs.transitionTime} months
- Expected Quality Impact: ${Math.round(outsourceInputs.qualityImpact * 100)}% (change in service quality)
- Knowledge Transfer Risk: ${Math.round(outsourceInputs.knowledgeLoss * 100)}% (potential knowledge loss)
- Management Overhead: ${Math.round(outsourceInputs.managementOverhead * 100)}% (additional management costs)

Key Formulas and Calculations:

1. Current Monthly Operational Cost:
   Base Cost = Team Size × Hourly Rate × Monthly Working Hours
   - Monthly Working Hours = 160 (standard)
   Efficiency Adjustment = Base Cost × Service Efficiency
   Total Monthly Cost = Efficiency Adjustment × (1 + Operational Overhead)
   
   Your current monthly cost: $${totalCost.toFixed(2)}

2. Outsourcing Cost Structure:
   a) One-time Costs:
      - Transition Cost: $${outsourceInputs.transitionCost.toFixed(2)}
      - Knowledge Transfer Activities
      - Process Documentation
      - Training and Handover
   
   b) Monthly Operating Cost:
      Base Vendor Cost = Team Size × Vendor Rate × Monthly Hours
      = ${safeInputs.teamSize} × $${outsourceInputs.vendorRate.toFixed(2)} × 160
      = $${(safeInputs.teamSize * outsourceInputs.vendorRate * 160).toFixed(2)}

      Total Vendor Cost = Base Vendor Cost × (1 + Management Overhead)
      = $${(safeInputs.teamSize * outsourceInputs.vendorRate * 160).toFixed(2)} × (1 + ${(outsourceInputs.managementOverhead).toFixed(2)})
      = $${(safeInputs.teamSize * outsourceInputs.vendorRate * 160 * (1 + outsourceInputs.managementOverhead)).toFixed(2)}

      Monthly Savings = Current Cost - Total Vendor Cost
      = $${monthlySavings.toFixed(2)}

3. ROI Analysis:
   Break-Even Period = Transition Cost ÷ Monthly Savings
   = $${outsourceInputs.transitionCost.toFixed(2)} ÷ $${monthlySavings.toFixed(2)}
   = ${breakEvenMonths.toFixed(1)} months

   Annual ROI = (Annual Savings ÷ Transition Cost) × 100
   = ($${(monthlySavings * 12).toFixed(2)} ÷ $${outsourceInputs.transitionCost.toFixed(2)}) × 100
   = ${((monthlySavings * 12 / outsourceInputs.transitionCost) * 100).toFixed(1)}%

Key Metrics Summary:
- Current Monthly Cost: $${totalCost.toFixed(2)}
- Vendor Monthly Cost: $${(safeInputs.teamSize * outsourceInputs.vendorRate * 160 * (1 + outsourceInputs.managementOverhead)).toFixed(2)}
- Expected Monthly Savings: $${monthlySavings.toFixed(2)}
- Break-even Period: ${breakEvenMonths.toFixed(1)} months
- First Year ROI: ${((monthlySavings * 12 / outsourceInputs.transitionCost) * 100).toFixed(1)}%
- 3-Year Total Savings: $${(monthlySavings * 36).toFixed(2)}

Risk Factors:
- Quality Impact: ${Math.round(outsourceInputs.qualityImpact * 100)}% potential change in service quality
- Knowledge Loss: ${Math.round(outsourceInputs.knowledgeLoss * 100)}% risk of knowledge transfer issues
- Management Overhead: ${Math.round(outsourceInputs.managementOverhead * 100)}% additional management cost

Based on this analysis, please provide insights on:
1. Is outsourcing a viable option given the team size and cost structure?
2. How significant is the ${Math.round(outsourceInputs.qualityImpact * 100)}% quality impact risk?
3. What strategies would minimize the ${Math.round(outsourceInputs.knowledgeLoss * 100)}% knowledge loss risk?
4. Is the ${Math.round(outsourceInputs.managementOverhead * 100)}% management overhead realistic?
5. What should be included in the service level agreement (SLA)?
6. How can we ensure a smooth transition over the ${outsourceInputs.transitionTime}-month period?
7. What governance model would you recommend for vendor management?

Summary:
We are currently operating with a ${safeInputs.teamSize}-member team at $${hourlyRate}/hour, with ${(safeInputs.serviceEfficiency * 100).toFixed(0)}% service efficiency and ${(safeInputs.operationalOverhead * 100).toFixed(0)}% operational overhead, resulting in a monthly cost of $${totalCost.toFixed(2)}.

By transitioning to an outsourced model with a one-time cost of $${outsourceInputs.transitionCost.toFixed(2)} and a vendor rate of $${outsourceInputs.vendorRate.toFixed(2)}/hour, we expect to reduce costs while managing a ${Math.round(outsourceInputs.qualityImpact * 100)}% quality impact and ${Math.round(outsourceInputs.managementOverhead * 100)}% management overhead. This will result in monthly savings of $${monthlySavings.toFixed(2)}.

The break-even point will be reached in ${breakEvenMonths.toFixed(1)} months, with a first-year ROI of ${((monthlySavings * 12 / outsourceInputs.transitionCost) * 100).toFixed(1)}%. Over three years, total savings are projected to be $${(monthlySavings * 36).toFixed(2)}.`;
}

function generateTeamHybridTemplate(inputs: any, results: ExtendedCalculationResults): string {
  const hybridInputs = results.solutionInputs?.hybrid || {
    platformCost: 0,
    platformMaintenance: 0,
    timeToBuild: 0,
    processEfficiency: 0,
    platformPortion: 0,
    vendorPortion: 0,
    transitionCost: 0,
    vendorRate: 0,
    qualityImpact: 0,
    knowledgeLoss: 0,
    managementOverhead: 0,
    teamReduction: 0
  };

  const defaultInputs = {
    teamSize: 0,
    serviceEfficiency: 0,
    operationalOverhead: 0
  };

  const safeInputs = { ...defaultInputs, ...inputs };
  const hourlyRate = results.baseInputs?.hourlyRate || 0;
  const totalCost = results.totalCost || 0;
  const monthlySavings = results.monthlySavings || 0;
  const breakEvenMonths = results.breakEvenMonths || 0;

  return `I am analyzing an Operations Cost Optimization model with the following configuration:

Model Type: Team-Based Analysis with Hybrid Solution
This model is used when:
- Current operations are performed by in-house teams
- Looking to combine automation with outsourcing
- Need to balance technology investment with service provider costs
- Focus on optimizing through multiple channels

Current Team Configuration:
- Team Size: ${safeInputs.teamSize} members
- Hourly Rate: $${hourlyRate}/hour
- Service Efficiency: ${(safeInputs.serviceEfficiency * 100).toFixed(0)}% (productive time vs total time)
- Operational Overhead: ${(safeInputs.operationalOverhead * 100).toFixed(0)}% (additional costs as % of base cost)

Hybrid Solution Components:

1. Platform Component (${Math.round(hybridInputs.platformPortion * 100)}% of workload):
   - Initial Platform Cost: $${hybridInputs.platformCost.toFixed(2)}
   - Monthly Maintenance: $${hybridInputs.platformMaintenance.toFixed(2)}
   - Implementation Time: ${hybridInputs.timeToBuild} months
   - Process Efficiency Gain: ${Math.round(hybridInputs.processEfficiency * 100)}%

2. Outsourcing Component (${Math.round(hybridInputs.vendorPortion * 100)}% of workload):
   - Transition Cost: $${hybridInputs.transitionCost.toFixed(2)}
   - Vendor Rate: $${hybridInputs.vendorRate.toFixed(2)}/hour
   - Quality Impact: ${Math.round(hybridInputs.qualityImpact * 100)}%
   - Knowledge Loss Risk: ${Math.round(hybridInputs.knowledgeLoss * 100)}%
   - Management Overhead: ${Math.round(hybridInputs.managementOverhead * 100)}%

Overall Impact:
- Total Team Reduction: ${Math.round(hybridInputs.teamReduction * 100)}%
- Combined Process Efficiency: ${Math.round(hybridInputs.processEfficiency * 100)}%

Key Formulas and Calculations:

1. Current Monthly Operational Cost:
   Base Cost = Team Size × Hourly Rate × Monthly Working Hours
   - Monthly Working Hours = 160 (standard)
   Efficiency Adjustment = Base Cost × Service Efficiency
   Total Monthly Cost = Efficiency Adjustment × (1 + Operational Overhead)
   
   Your current monthly cost: $${totalCost.toFixed(2)}

2. Hybrid Solution Costs:
   a) Initial Investment:
      Platform Cost: $${hybridInputs.platformCost.toFixed(2)}
      Transition Cost: $${hybridInputs.transitionCost.toFixed(2)}
      Total Initial Investment: $${(hybridInputs.platformCost + hybridInputs.transitionCost).toFixed(2)}

   b) Monthly Operating Costs:
      Platform Maintenance = $${hybridInputs.platformMaintenance.toFixed(2)}

      Outsourced Portion Cost = Team Size × Vendor Rate × Monthly Hours
      = ${safeInputs.teamSize} × $${hybridInputs.vendorRate.toFixed(2)} × 160 × ${hybridInputs.vendorPortion.toFixed(2)}
      = $${(safeInputs.teamSize * hybridInputs.vendorRate * 160 * hybridInputs.vendorPortion).toFixed(2)}

      Total Monthly Operating Cost = Platform Maintenance + Outsourced Portion Cost
      = $${(hybridInputs.platformMaintenance + safeInputs.teamSize * hybridInputs.vendorRate * 160 * hybridInputs.vendorPortion).toFixed(2)}

3. Savings Analysis:
   Monthly Cost Reduction = Current Cost × Team Reduction %
   = $${totalCost.toFixed(2)} × ${(hybridInputs.teamReduction).toFixed(2)}
   = $${(totalCost * hybridInputs.teamReduction).toFixed(2)}

   Process Efficiency Savings = Remaining Cost × Efficiency Gain %
   = $${(totalCost * (1 - hybridInputs.teamReduction)).toFixed(2)} × ${(hybridInputs.processEfficiency).toFixed(2)}
   = $${(totalCost * (1 - hybridInputs.teamReduction) * hybridInputs.processEfficiency).toFixed(2)}

   Total Monthly Savings = Cost Reduction + Efficiency Savings - Operating Costs
   = $${monthlySavings.toFixed(2)}

4. ROI Analysis:
   Break-Even Period = Total Investment ÷ Monthly Savings
   = $${(hybridInputs.platformCost + hybridInputs.transitionCost).toFixed(2)} ÷ $${monthlySavings.toFixed(2)}
   = ${breakEvenMonths.toFixed(1)} months

   Annual ROI = (Annual Savings ÷ Total Investment) × 100
   = ($${(monthlySavings * 12).toFixed(2)} ÷ $${(hybridInputs.platformCost + hybridInputs.transitionCost).toFixed(2)}) × 100
   = ${((monthlySavings * 12 / (hybridInputs.platformCost + hybridInputs.transitionCost)) * 100).toFixed(1)}%

Key Metrics Summary:
- Current Monthly Cost: $${totalCost.toFixed(2)}
- New Monthly Operating Cost: $${(hybridInputs.platformMaintenance + safeInputs.teamSize * hybridInputs.vendorRate * 160 * hybridInputs.vendorPortion).toFixed(2)}
- Expected Monthly Savings: $${monthlySavings.toFixed(2)}
- Break-even Period: ${breakEvenMonths.toFixed(1)} months
- First Year ROI: ${((monthlySavings * 12 / (hybridInputs.platformCost + hybridInputs.transitionCost)) * 100).toFixed(1)}%
- 3-Year Total Savings: $${(monthlySavings * 36).toFixed(2)}

Risk Factors:
- Platform Implementation: ${hybridInputs.timeToBuild} months timeline
- Quality Impact: ${Math.round(hybridInputs.qualityImpact * 100)}% potential change in service quality
- Knowledge Loss: ${Math.round(hybridInputs.knowledgeLoss * 100)}% risk of knowledge transfer issues
- Management Overhead: ${Math.round(hybridInputs.managementOverhead * 100)}% additional management cost

Based on this analysis, please provide insights on:
1. Is this hybrid approach optimal for the given team size and workload distribution?
2. How realistic is the ${Math.round(hybridInputs.teamReduction * 100)}% team reduction target?
3. What implementation sequence would you recommend between platform and outsourcing?
4. How can we manage the complexity of coordinating between platform and vendor?
5. What governance structure would best support this hybrid model?
6. How can we mitigate the combined risks of platform implementation and outsourcing?
7. What KPIs should we track to ensure both components are delivering value?

Summary:
We are currently operating with a ${safeInputs.teamSize}-member team at $${hourlyRate}/hour, with ${(safeInputs.serviceEfficiency * 100).toFixed(0)}% service efficiency and ${(safeInputs.operationalOverhead * 100).toFixed(0)}% operational overhead, resulting in a monthly cost of $${totalCost.toFixed(2)}.

By implementing a hybrid solution that combines a platform (${Math.round(hybridInputs.platformPortion * 100)}% of workload) and outsourcing (${Math.round(hybridInputs.vendorPortion * 100)}% of workload), with a total investment of $${(hybridInputs.platformCost + hybridInputs.transitionCost).toFixed(2)}, we expect to achieve ${Math.round(hybridInputs.teamReduction * 100)}% team reduction and ${Math.round(hybridInputs.processEfficiency * 100)}% process efficiency gains. This will result in monthly savings of $${monthlySavings.toFixed(2)}.

The break-even point will be reached in ${breakEvenMonths.toFixed(1)} months, with a first-year ROI of ${((monthlySavings * 12 / (hybridInputs.platformCost + hybridInputs.transitionCost)) * 100).toFixed(1)}%. Over three years, total savings are projected to be $${(monthlySavings * 36).toFixed(2)}.`;
}

function generateTicketPlatformTemplate(inputs: any, results: ExtendedCalculationResults): string {
  const platformInputs = results.solutionInputs?.platform || {
    platformCost: 0,
    platformMaintenance: 0,
    timeToBuild: 0,
    teamReduction: 0,
    processEfficiency: 0
  };

  const defaultInputs = {
    monthlyTickets: 0,
    hoursPerTicket: 0,
    peoplePerTicket: 0,
    slaCompliance: 0
  };

  const safeInputs = { ...defaultInputs, ...inputs };
  const hourlyRate = results.baseInputs?.hourlyRate || 0;
  const totalCost = results.totalCost || 0;
  const costPerTicket = results.costPerTicket || 0;
  const monthlySavings = results.monthlySavings || 0;
  const breakEvenMonths = results.breakEvenMonths || 0;

  return `I am analyzing a Operations Costs model with the following configuration:

Model Selection: Ticket-Based Model
- This model is used because the service is delivered based on individual ticket volume and processing
- The analysis focuses on ticket metrics, processing time, and resource allocation

Current Configuration:
- Monthly Tickets: ${safeInputs.monthlyTickets}
- Hours per Ticket: ${safeInputs.hoursPerTicket}
- People per Ticket: ${safeInputs.peoplePerTicket}
- Hourly Rate: $${hourlyRate}/hour
- SLA Compliance: ${safeInputs.slaCompliance}%

Platform Solution Details:
- Platform Cost: $${platformInputs.platformCost.toFixed(2)}
- Monthly Maintenance: $${platformInputs.platformMaintenance.toFixed(2)}
- Implementation Time: ${platformInputs.timeToBuild} months
- Expected Team Reduction: ${Math.round(platformInputs.teamReduction * 100)}%
- Target Process Efficiency: ${Math.round(platformInputs.processEfficiency * 100)}%

Key Formulas Used:
1. Current Monthly Processing Cost:
   Monthly Cost = Monthly Tickets × Hours per Ticket × People per Ticket × Hourly Rate
   = ${safeInputs.monthlyTickets} × ${safeInputs.hoursPerTicket} × ${safeInputs.peoplePerTicket} × $${hourlyRate}
   = $${totalCost.toFixed(2)}

   Cost per Ticket = Monthly Cost ÷ Monthly Tickets
   = $${totalCost.toFixed(2)} ÷ ${safeInputs.monthlyTickets}
   = $${costPerTicket.toFixed(2)}

2. Platform Solution Cost:
   Implementation Cost = Platform Cost + (Current Monthly Cost × Build Time)
   = $${platformInputs.platformCost.toFixed(2)} + ($${totalCost.toFixed(2)} × ${platformInputs.timeToBuild})
   = $${(platformInputs.platformCost + totalCost * platformInputs.timeToBuild).toFixed(2)}

   Reduced Team Cost = Current Monthly Cost × (1 - Team Reduction) × (1 - Process Efficiency)
   = $${totalCost.toFixed(2)} × (1 - ${(platformInputs.teamReduction || 0).toFixed(2)}) × (1 - ${platformInputs.processEfficiency.toFixed(2)})
   = $${(totalCost * (1 - (platformInputs.teamReduction || 0)) * (1 - platformInputs.processEfficiency)).toFixed(2)}

   Monthly Operating Cost = Reduced Team Cost + Monthly Maintenance
   = $${(totalCost * (1 - (platformInputs.teamReduction || 0)) * (1 - platformInputs.processEfficiency)).toFixed(2)} + $${platformInputs.platformMaintenance.toFixed(2)}
   = $${(totalCost * (1 - (platformInputs.teamReduction || 0)) * (1 - platformInputs.processEfficiency) + platformInputs.platformMaintenance).toFixed(2)}

   Monthly Savings = Current Monthly Cost - Monthly Operating Cost
   = $${totalCost.toFixed(2)} - $${(totalCost * (1 - (platformInputs.teamReduction || 0)) * (1 - platformInputs.processEfficiency) + platformInputs.platformMaintenance).toFixed(2)}
   = $${monthlySavings.toFixed(2)}

3. Break-Even Analysis:
   Break-Even Period = Implementation Cost ÷ Monthly Savings
   = $${(platformInputs.platformCost + totalCost * platformInputs.timeToBuild).toFixed(2)} ÷ $${monthlySavings.toFixed(2)}
   = ${breakEvenMonths.toFixed(1)} months

   Annual ROI = (Monthly Savings × 12 - Implementation Cost) ÷ Implementation Cost × 100
   = ($${(monthlySavings * 12).toFixed(2)} - $${(platformInputs.platformCost + totalCost * platformInputs.timeToBuild).toFixed(2)}) ÷ $${(platformInputs.platformCost + totalCost * platformInputs.timeToBuild).toFixed(2)} × 100
   = ${((monthlySavings * 12 - (platformInputs.platformCost + totalCost * platformInputs.timeToBuild)) / (platformInputs.platformCost + totalCost * platformInputs.timeToBuild) * 100).toFixed(1)}%

Current Results:
- Current Monthly Cost: $${totalCost.toFixed(2)}
- Cost per Ticket: $${costPerTicket.toFixed(2)}
- Implementation Cost: $${(platformInputs.platformCost + totalCost * platformInputs.timeToBuild).toFixed(2)}
- Monthly Operating Cost: $${(totalCost * (1 - (platformInputs.teamReduction || 0)) * (1 - platformInputs.processEfficiency) + platformInputs.platformMaintenance).toFixed(2)}
- Monthly Savings: $${monthlySavings.toFixed(2)}
- Break-even Period: ${breakEvenMonths.toFixed(1)} months
- Annual ROI: ${((monthlySavings * 12 - (platformInputs.platformCost + totalCost * platformInputs.timeToBuild)) / (platformInputs.platformCost + totalCost * platformInputs.timeToBuild) * 100).toFixed(1)}%

Based on this analysis, please provide insights on:
1. Is this automation level achievable for our ticket types?
2. What factors could impact the automation success rate?
3. How can we ensure SLA compliance during and after implementation?
4. What change management considerations should we address?
5. How does this compare to similar automation initiatives?

Summary:
We are currently processing ${safeInputs.monthlyTickets} tickets per month, with ${safeInputs.hoursPerTicket} hours and ${safeInputs.peoplePerTicket} people per ticket at $${hourlyRate}/hour, maintaining ${safeInputs.slaCompliance}% SLA compliance. This results in a monthly cost of $${totalCost.toFixed(2)} ($${costPerTicket.toFixed(2)} per ticket).

By implementing a platform solution with an initial investment of $${platformInputs.platformCost.toFixed(2)} and monthly maintenance of $${platformInputs.platformMaintenance.toFixed(2)}, we expect to achieve ${Math.round(platformInputs.teamReduction * 100)}% team reduction and ${Math.round(platformInputs.processEfficiency * 100)}% process efficiency gains. This will result in monthly savings of $${monthlySavings.toFixed(2)}.

The break-even point will be reached in ${breakEvenMonths.toFixed(1)} months, with a first-year ROI of ${((monthlySavings * 12 - (platformInputs.platformCost + totalCost * platformInputs.timeToBuild)) / (platformInputs.platformCost + totalCost * platformInputs.timeToBuild) * 100).toFixed(1)}%. Over three years, total savings are projected to be $${(monthlySavings * 36).toFixed(2)}.`;
}

function generateTicketOutsourceTemplate(inputs: any, results: ExtendedCalculationResults): string {
  const outsourceInputs = results.solutionInputs?.outsource || {
    transitionCost: 0,
    vendorRate: 0,
    transitionTime: 0,
    qualityImpact: 0,
    knowledgeLoss: 0,
    managementOverhead: 0
  };

  const defaultInputs = {
    monthlyTickets: 0,
    hoursPerTicket: 0,
    peoplePerTicket: 0,
    slaCompliance: 0
  };

  const safeInputs = { ...defaultInputs, ...inputs };
  const hourlyRate = results.baseInputs?.hourlyRate || 0;
  const totalCost = results.totalCost || 0;
  const costPerTicket = results.costPerTicket || 0;
  const monthlySavings = results.monthlySavings || 0;
  const breakEvenMonths = results.breakEvenMonths || 0;

  return `I am analyzing a Operations Costs model with the following configuration:

Model Selection: Ticket-Based Model
- This model is used because the service is delivered based on individual ticket volume and processing
- The analysis focuses on ticket metrics, processing time, and resource allocation

Current Configuration:
- Monthly Tickets: ${safeInputs.monthlyTickets}
- Hours per Ticket: ${safeInputs.hoursPerTicket}
- People per Ticket: ${safeInputs.peoplePerTicket}
- Hourly Rate: $${hourlyRate}/hour
- SLA Compliance: ${safeInputs.slaCompliance}%

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
5. What governance model would you recommend?

Summary:
We are currently processing ${safeInputs.monthlyTickets} tickets per month, with ${safeInputs.hoursPerTicket} hours and ${safeInputs.peoplePerTicket} people per ticket at $${hourlyRate}/hour, maintaining ${safeInputs.slaCompliance}% SLA compliance. This results in a monthly cost of $${totalCost.toFixed(2)} ($${costPerTicket.toFixed(2)} per ticket).

By transitioning to an outsourced model with a one-time cost of $${outsourceInputs.transitionCost.toFixed(2)} and a vendor rate of $${outsourceInputs.vendorRate.toFixed(2)}/hour, we expect to reduce costs while managing a ${Math.round(outsourceInputs.qualityImpact * 100)}% quality impact and ${Math.round(outsourceInputs.managementOverhead * 100)}% management overhead. This will result in monthly savings of $${monthlySavings.toFixed(2)}.

The break-even point will be reached in ${breakEvenMonths.toFixed(1)} months, with a first-year ROI of ${((monthlySavings * 12 / outsourceInputs.transitionCost) * 100).toFixed(1)}%. Over three years, total savings are projected to be $${(monthlySavings * 36).toFixed(2)}.`;
}

function generateTicketHybridTemplate(inputs: any, results: ExtendedCalculationResults): string {
  const hybridInputs = results.solutionInputs?.hybrid || {
    platformCost: 0,
    platformMaintenance: 0,
    transitionCost: 0,
    vendorRate: 0,
    timeToBuild: 0,
    teamReduction: 0,
    processEfficiency: 0,
    platformPortion: 0,
    vendorPortion: 0,
    qualityImpact: 0,
    knowledgeLoss: 0,
    managementOverhead: 0
  };

  const defaultInputs = {
    monthlyTickets: 0,
    hoursPerTicket: 0,
    peoplePerTicket: 0,
    slaCompliance: 0
  };

  const safeInputs = { ...defaultInputs, ...inputs };
  const hourlyRate = results.baseInputs?.hourlyRate || 0;
  const totalCost = results.totalCost || 0;
  const costPerTicket = results.costPerTicket || 0;
  const monthlySavings = results.monthlySavings || 0;
  const breakEvenMonths = results.breakEvenMonths || 0;

  return `I am analyzing a Operations Costs model with the following configuration:

Model Selection: Ticket-Based Model
- This model is used because the service is delivered based on individual ticket volume and processing
- The analysis focuses on ticket metrics, processing time, and resource allocation

Current Configuration:
- Monthly Tickets: ${safeInputs.monthlyTickets}
- Hours per Ticket: ${safeInputs.hoursPerTicket}
- People per Ticket: ${safeInputs.peoplePerTicket}
- Hourly Rate: $${hourlyRate}/hour
- SLA Compliance: ${safeInputs.slaCompliance}%

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
5. How should we phase the implementation of both solutions?

Summary:
We are currently processing ${safeInputs.monthlyTickets} tickets per month, with ${safeInputs.hoursPerTicket} hours and ${safeInputs.peoplePerTicket} people per ticket at $${hourlyRate}/hour, maintaining ${safeInputs.slaCompliance}% SLA compliance. This results in a monthly cost of $${totalCost.toFixed(2)} ($${costPerTicket.toFixed(2)} per ticket).

By implementing a hybrid solution that combines a platform (${Math.round(hybridInputs.platformPortion * 100)}% of workload) and outsourcing (${Math.round(hybridInputs.vendorPortion * 100)}% of workload), with a total investment of $${(hybridInputs.platformCost + hybridInputs.transitionCost).toFixed(2)}, we expect to achieve ${Math.round(hybridInputs.teamReduction * 100)}% team reduction and ${Math.round(hybridInputs.processEfficiency * 100)}% process efficiency gains. This will result in monthly savings of $${monthlySavings.toFixed(2)}.

The break-even point will be reached in ${breakEvenMonths.toFixed(1)} months, with a first-year ROI of ${((monthlySavings * 12 / (hybridInputs.platformCost + hybridInputs.transitionCost)) * 100).toFixed(1)}%. Over three years, total savings are projected to be $${(monthlySavings * 36).toFixed(2)}.`;
}

// Create the derived store
export const llmTemplateStore = derived(calculatorStore, ($calculatorStore) => {
  const currentState = calculatorStore.getCurrentState();
  if (!currentState?.baseInputs) return null;

  return {
    generateTemplate: () => {
      const model = $calculatorStore.model;
      const solution = $calculatorStore.solution;
      
      // Create a merged state object with all necessary data
      const mergedState: ExtendedCalculationResults = {
        ...$calculatorStore,
        baseInputs: currentState.baseInputs || undefined,
        solutionInputs: currentState.solutionInputs || undefined
      };
      
      if (model === 'team') {
        switch (solution) {
          case 'platform':
            return generateTeamPlatformTemplate(currentState.baseInputs, mergedState);
          case 'outsource':
            return generateTeamOutsourceTemplate(currentState.baseInputs, mergedState);
          case 'hybrid':
            return generateTeamHybridTemplate(currentState.baseInputs, mergedState);
          default:
            return generateTeamPlatformTemplate(currentState.baseInputs, mergedState);
        }
      } else {
        switch (solution) {
          case 'platform':
            return generateTicketPlatformTemplate(currentState.baseInputs, mergedState);
          case 'outsource':
            return generateTicketOutsourceTemplate(currentState.baseInputs, mergedState);
          case 'hybrid':
            return generateTicketHybridTemplate(currentState.baseInputs, mergedState);
          default:
            return generateTicketPlatformTemplate(currentState.baseInputs, mergedState);
        }
      }
    }
  };
}); 