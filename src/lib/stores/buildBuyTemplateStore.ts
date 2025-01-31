import { derived } from 'svelte/store';
import { calculatorStore } from './calculatorStore';
import type { CalculatorModel, SolutionType, CalculationResults } from '$lib/types/calculator';

interface BuildBuyResults extends CalculationResults {
  formState: {
    solutionType: string;
    businessRole: string;
    timelineNeeded: string;
    usageDuration: string;
    alternativeSolutions: string;
    marketEvolution: string;
    marketStandardization: string;
    alternativeTypes: string[];
    controlNeeded: string;
    inHouseCompetency: string;
    buildFTEs: number;
    buildHourlyRate: number;
    buildCost: number;
    buyCost: number;
    userCount: number;
    costPerUser: number;
    buyCustomizationCost: number;
    buyMaintenanceCost: number;
    implementationTime: string;
    strategicAlignment: string;
    buildRisks: string[];
    buyRisks: string[];
  };
  scores: {
    build: {
      businessCriticality: number;
      timeToImplement: number;
      cost: number;
      control: number;
      competency: number;
      marketFit: number;
    };
    buy: {
      businessCriticality: number;
      timeToImplement: number;
      cost: number;
      control: number;
      competency: number;
      marketFit: number;
    };
  };
  riskMatrix: {
    buildRisks: Array<{
      id: string;
      label: string;
      probability: number;
      severity: number;
      description: string;
    }>;
    buyRisks: Array<{
      id: string;
      label: string;
      probability: number;
      severity: number;
      description: string;
    }>;
  };
  recommendation: string;
  confidence: number;
}

function generateBuildBuyTemplate(results: BuildBuyResults): string {
  const { formState, scores, riskMatrix, recommendation, confidence } = results;

  // Helper function to format currency
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Helper function to get solution type description
  const getSolutionTypeDescription = (type: string) => {
    switch (type) {
      case 'platform':
        return 'An end-to-end system that integrates multiple components, similar to platforms like Salesforce, AWS, or a CI/CD platform';
      case 'application':
        return 'A single-purpose software with a user interface, focused on solving a specific need';
      case 'component':
        return 'A specific piece of functionality or service, such as an API or library';
      default:
        return type;
    }
  };

  // Helper function to get business role description
  const getBusinessRoleDescription = (role: string) => {
    switch (role) {
      case 'critical':
        return 'Directly impacts core business, customer experience, or revenue generation';
      case 'enabling':
        return 'Improves team/company operations or efficiency but not directly customer-facing';
      case 'supporting':
        return 'Supports back-office or administrative tasks';
      default:
        return role;
    }
  };

  return `I am analyzing a Build vs Buy decision with the following configuration and would like your expert insights.

==============================================
QUESTIONNAIRE AND RESPONSES
==============================================

1. SOLUTION SCOPE
----------------
Q: What type of solution are you evaluating?
A: ${formState.solutionType}
Context: ${getSolutionTypeDescription(formState.solutionType)}

2. BUSINESS IMPACT & TIMELINE
----------------------------
Q: What is the business criticality of this solution?
A: ${formState.businessRole}
Context: ${getBusinessRoleDescription(formState.businessRole)}

Q: What is your required timeline?
A: ${formState.timelineNeeded}
Context: This represents the target go-live timeline for the solution.

Q: How long will you use this solution?
A: ${formState.usageDuration}
Context: This indicates the expected lifetime/duration of use for the solution.

3. MARKET ANALYSIS
-----------------
Q: How many alternative solutions exist?
A: ${formState.alternativeSolutions}
Context: This represents the number of existing solutions in the market that could potentially meet the requirements.

Q: How is the market evolving?
A: ${formState.marketEvolution}
Context: This indicates the pace of change and innovation in this solution space.

Q: What is the level of standardization?
A: ${formState.marketStandardization}
Context: This shows how well-established and standardized the solution patterns are in the market.

Available Solution Types: ${formState.alternativeTypes.join(', ')}

4. INTERNAL CAPABILITIES
-----------------------
Q: What level of control do you need?
A: ${formState.controlNeeded}
Context: This indicates the required level of customization, updates, and integration flexibility.

Q: Do you have the in-house competency?
A: ${formState.inHouseCompetency}
Context: This represents your team's current technical readiness to build and maintain the solution.

5. COST ANALYSIS
---------------
Build Costs:
• Development Team: ${formState.buildFTEs} FTEs
• Hourly Rate: ${formatCurrency(formState.buildHourlyRate)}
• Total Build Cost: ${formatCurrency(formState.buildCost)}
Context: These costs represent the internal development and maintenance expenses.

Buy Costs:
• License Cost: ${formatCurrency(formState.buyCost)}
• Users: ${formState.userCount}
• Cost per User: ${formatCurrency(formState.costPerUser)}
• Customization Cost: ${formatCurrency(formState.buyCustomizationCost)}
• Maintenance Cost: ${formatCurrency(formState.buyMaintenanceCost)}
Context: These costs represent the total cost of ownership for a purchased solution.

Implementation Timeline: ${formState.implementationTime}

6. STRATEGIC ALIGNMENT
---------------------
Q: How strategic is this solution?
A: ${formState.strategicAlignment}
Context: This indicates how central the solution is to your company's competitive advantage and strategy.

==============================================
ANALYSIS RESULTS
==============================================

1. DIMENSIONAL SCORING (Scale: 1-5)
----------------------------------
Build Option Scores:
${Object.entries(scores.build)
  .map(([dimension, score]) => `• ${dimension}: ${score}/5`)
  .join('\n')}

Buy Option Scores:
${Object.entries(scores.buy)
  .map(([dimension, score]) => `• ${dimension}: ${score}/5`)
  .join('\n')}

2. RISK ASSESSMENT
-----------------
Build Risks:
${riskMatrix.buildRisks
  .map(risk => `• ${risk.label}
  - Probability: ${risk.probability}/5
  - Severity: ${risk.severity}/5
  - Impact Score: ${risk.probability * risk.severity}
  - Description: ${risk.description}`)
  .join('\n')}

Buy Risks:
${riskMatrix.buyRisks
  .map(risk => `• ${risk.label}
  - Probability: ${risk.probability}/5
  - Severity: ${risk.severity}/5
  - Impact Score: ${risk.probability * risk.severity}
  - Description: ${risk.description}`)
  .join('\n')}

3. FINAL RECOMMENDATION
----------------------
Recommendation: ${recommendation}
Confidence Level: ${confidence}%

==============================================
ANALYSIS REQUESTS
==============================================

Based on this comprehensive data, please provide detailed insights on:

1. Decision Validation
---------------------
• Is the ${recommendation} recommendation aligned with the provided data?
• What are the key factors supporting this decision?
• Are there any potential blind spots in the analysis?
• How does the confidence level of ${confidence}% reflect in the data?

2. Risk Management
-----------------
• What specific strategies would you recommend to mitigate each identified risk?
• Are there any additional risks we should consider given the context?
• How can we strengthen our position regardless of the build/buy decision?
• Which risks could have the most significant long-term impact?

3. Implementation Strategy
-------------------------
• What are the critical success factors for implementing the ${recommendation.toLowerCase()} approach?
• What specific milestones should we track during implementation?
• How should we phase the implementation to minimize risk?
• What key metrics should we monitor post-implementation?

4. Cost Optimization
-------------------
• What specific opportunities exist to optimize costs in the recommended approach?
• Are there any hidden costs we should consider?
• How can we improve the ROI of the chosen approach?
• What cost-saving measures could be implemented without increasing risk?

5. Market & Strategic Insights
----------------------------
• How does this decision align with current industry trends?
• What can we learn from similar organizations who have made this choice?
• What future market changes might impact this decision?
• How might this decision affect our competitive position?

6. Organizational Impact
-----------------------
• How will this decision affect our team structure and capabilities?
• What changes to processes and workflows should we anticipate?
• What training or skill development will be needed?
• How should we manage the change process?

Please provide a detailed analysis addressing these questions, incorporating the specific data points provided above. Include concrete recommendations and action items where applicable.`;
}

// Create the derived store
export const buildBuyTemplateStore = derived(calculatorStore, ($calculatorStore) => {
  return {
    generateTemplate: (results: BuildBuyResults) => {
      return generateBuildBuyTemplate(results);
    }
  };
}); 