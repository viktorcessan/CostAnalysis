import { derived } from 'svelte/store';
import { calculatorStore } from './calculatorStore';
import type { BuildBuyResults } from '$lib/types/calculator';

function generateBuildBuyTemplate(results: BuildBuyResults): string {
  const { formState, scores, riskMatrix, recommendation, confidence } = results;

  // Helper function to format currency
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Helper function to get solution type description
  const getSolutionTypeDescription = (type: string) => {
    switch (type) {
      case 'platform':
        return 'An end-to-end system that integrates multiple components, like Salesforce, AWS, or a CI/CD platform, or Data platform';
      case 'application':
        return 'A focused solution for a specific need, like a scheduling tool or reporting dashboard';
      case 'component':
        return 'A distinct piece of functionality, like a payment processing service or authentication system';
      default:
        return type;
    }
  };

  // Helper function to get business role description
  const getBusinessRoleDescription = (role: string) => {
    switch (role) {
      case 'critical':
        return 'Critical path for revenue';
      case 'enabling':
        return 'Business enabling';
      case 'supporting':
        return 'Internal supporting';
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
Context: This represents the number of existing solutions in the market.

Q: How is the market evolving?
A: ${formState.marketEvolution}
Context: This indicates the pace of change and innovation in this solution space.

Q: How is the landscape evolving?
A: ${formState.landscapeEvolution}
Context: This shows how the solution landscape is changing over time.

Q: What is the level of standardization?
A: ${formState.marketStandardization}
Context: This shows how well-established and standardized the solution patterns are.

Q: How well do existing solutions fit?
A: ${formState.alternativeFitness}
Context: This indicates how well market solutions match your needs.

Available Solution Types: ${formState.alternativeTypes.join(', ')}

4. BUILD CAPABILITY
------------------
Q: What level of control do you need?
A: ${formState.controlNeeded}
Context: This indicates the required level of customization and control.

Q: What is your team's technical readiness?
A: ${formState.inHouseCompetency}
Context: This represents your team's current capability to build and maintain.

Q: How long to build capabilities?
A: ${formState.competencyAcquisitionTime}
Context: Time needed for hiring, training, and skill development.

5. COST ANALYSIS
---------------
Build Costs:
• Development Team: ${formState.buildFTEs} FTEs
• Hourly Rate: ${formatCurrency(formState.buildHourlyRate)}
• Total Build Cost: ${formatCurrency(formState.buildCost)}
• Implementation Time: ${formState.implementationTime}

${formState.hasMaintenanceTeam ? `Maintenance Team:
• Team Size: ${formState.maintenanceTeamSize} FTEs
• Annual Cost: ${formatCurrency(formState.maintenanceTeamSize * formState.buildHourlyRate * 2080)}` : 'No dedicated maintenance team planned'}

Buy Costs:
• License Cost: ${formatCurrency(formState.buyCost)}
• Users: ${formState.userCount}
• Cost per User: ${formatCurrency(formState.costPerUser)}
• Customization Cost: ${formatCurrency(formState.buyCustomizationCost)}
• Maintenance Cost: ${formatCurrency(formState.buyMaintenanceCost)}

6. STRATEGIC ASSESSMENT
---------------------
Q: How strategic is this solution?
A: ${formState.strategicAlignment}
Context: This indicates how central the solution is to your strategy.

Q: How difficult would it be to change?
A: ${formState.changeDifficulty}
Context: This indicates the effort and impact of switching solutions.

7. CATEGORY WEIGHTS
------------------
Importance weights (1-5):
${Object.entries(formState.categoryWeights)
  .map(([category, weight]) => `• ${category}: ${weight}`)
  .join('\n')}

==============================================
ANALYSIS RESULTS
==============================================

1. DIMENSIONAL SCORING (Scale: 1-5)
----------------------------------
Build Option Scores:
${Object.entries(scores.build)
  .map(([dimension, score]) => `• ${dimension}: ${score.toFixed(1)}/5`)
  .join('\n')}

Buy Option Scores:
${Object.entries(scores.buy)
  .map(([dimension, score]) => `• ${dimension}: ${score.toFixed(1)}/5`)
  .join('\n')}

2. RISK ASSESSMENT
-----------------
Build Risks:
${riskMatrix.buildRisks
  .map(risk => `• ${risk.label}
  - Probability: ${risk.probability}/5
  - Severity: ${risk.severity}/5
  - Impact Score: ${risk.probability * risk.severity}
  - Description: ${risk.description}
  ${risk.details ? `
  - Key Considerations:
    ${risk.details.reasoning.map(r => `* ${r}`).join('\n    ')}
  - Probability Factors:
    ${risk.details.probabilityFactors.map(f => `* ${f}`).join('\n    ')}
  - Severity Factors:
    ${risk.details.severityFactors.map(f => `* ${f}`).join('\n    ')}` : ''}`)
  .join('\n\n')}

Buy Risks:
${riskMatrix.buyRisks
  .map(risk => `• ${risk.label}
  - Probability: ${risk.probability}/5
  - Severity: ${risk.severity}/5
  - Impact Score: ${risk.probability * risk.severity}
  - Description: ${risk.description}
  ${risk.details ? `
  - Key Considerations:
    ${risk.details.reasoning.map(r => `* ${r}`).join('\n    ')}
  - Probability Factors:
    ${risk.details.probabilityFactors.map(f => `* ${f}`).join('\n    ')}
  - Severity Factors:
    ${risk.details.severityFactors.map(f => `* ${f}`).join('\n    ')}` : ''}`)
  .join('\n\n')}

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