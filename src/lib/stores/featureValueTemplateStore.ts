import { derived } from 'svelte/store';
import { calculatorStore } from './calculatorStore';
import { currencyStore } from './currencyStore';
import type { CalculatorModel, SolutionType, CalculationResults } from '$lib/types/calculator';

export interface FeatureValueResults {
  projectName: string;
  selectedImpacts: Array<{
    id: string;
    impact: {
      name: string;
      description: string;
      category: 'generate' | 'protect' | 'reduce' | 'avoid';
      formula: string;
      formulaDescription: string;
    };
    inputValues: { [key: string]: number };
    calculatedValue: number;
  }>;
  totalValue: number;
  totalCost: number;
  developmentCost: {
    hourlyRate: number;
    hours: number;
  };
  maintenanceCost: {
    monthly: number;
  };
  roi: number;
  breakEvenMonths: number;
  confidenceScore: number;
}

function generateFeatureValueTemplate(results: FeatureValueResults): string {
  // Helper function to format currency
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Helper function to format percentage
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  // Helper function to get category description
  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'generate':
        return 'Direct revenue generation through new features, markets, or monetization';
      case 'protect':
        return 'Protecting existing revenue by maintaining competitive position and customer satisfaction';
      case 'reduce':
        return 'Reducing operational costs through efficiency and automation';
      case 'avoid':
        return 'Avoiding future costs through risk mitigation and technical sustainability';
      default:
        return category;
    }
  };

  const currencyConfig = currencyStore.getCurrentConfig();

  return `For this analysis, the currency is ${currencyConfig.code} (${currencyConfig.symbol}).

I am analyzing a feature's business value across multiple dimensions and would like your expert insights.

==============================================
FEATURE OVERVIEW
==============================================
Feature Name: ${results.projectName}

==============================================
VALUE ANALYSIS
==============================================

1. VALUE DISTRIBUTION
--------------------
Total Annual Value: ${formatCurrency(results.totalValue)}
ROI: ${formatPercentage(results.roi)}
Break-even Period: ${results.breakEvenMonths.toFixed(1)} months
Confidence Score: ${formatPercentage(results.confidenceScore)}

2. VALUE COMPONENTS
------------------
${results.selectedImpacts.map(impact => `
Category: ${impact.impact.category.toUpperCase()}
Context: ${getCategoryDescription(impact.impact.category)}
Impact: ${impact.impact.name}
Description: ${impact.impact.description}
Annual Value: ${formatCurrency(impact.calculatedValue)}
Formula Used: ${impact.impact.formulaDescription}
Input Parameters:
${Object.entries(impact.inputValues)
  .map(([key, value]) => `• ${key}: ${value}`)
  .join('\n')}
`).join('\n')}

3. COST ANALYSIS
---------------
Development Costs:
• Hourly Rate: ${formatCurrency(results.developmentCost.hourlyRate)}
• Estimated Hours: ${results.developmentCost.hours}
• Total Development Cost: ${formatCurrency(results.developmentCost.hourlyRate * results.developmentCost.hours)}

Maintenance Costs:
• Monthly Maintenance: ${formatCurrency(results.maintenanceCost.monthly)}
• Annual Maintenance: ${formatCurrency(results.maintenanceCost.monthly * 12)}

Total Cost of Ownership (Year 1): ${formatCurrency(results.totalCost)}

==============================================
ANALYSIS REQUESTS
==============================================

Based on this comprehensive data, please provide detailed insights on:

1. Value Assessment
------------------
• How well-balanced is the value distribution across different categories?
• Are there any value categories that seem under-represented?
• How does the confidence score of ${formatPercentage(results.confidenceScore)} reflect in the data quality?
• What additional value streams might we be missing?

2. ROI Analysis
--------------
• Is the ROI of ${formatPercentage(results.roi)} strong for this type of feature?
• How reasonable is the ${results.breakEvenMonths.toFixed(1)}-month break-even period?
• What factors could accelerate or delay the break-even point?
• How could we improve the ROI without compromising value?

3. Cost Optimization
------------------
• Are the development estimates realistic given the scope?
• How do the maintenance costs align with industry standards?
• What opportunities exist to optimize costs?
• Are there any hidden costs we should consider?

4. Implementation Strategy
------------------------
• What are the critical success factors for maximizing each value stream?
• How should we phase the implementation to capture value early?
• What metrics should we track to validate each value component?
• How can we minimize risks during implementation?

5. Value Sustainability
---------------------
• How sustainable are the identified value streams?
• What market changes could impact the value proposition?
• How can we ensure long-term value realization?
• What dependencies might affect value delivery?

6. Organizational Impact
----------------------
• What organizational changes are needed to realize these values?
• What capabilities need to be developed or strengthened?
• How should we manage the change process?
• What training or support will be needed?

Please provide a detailed analysis addressing these questions, incorporating the specific data points provided above. Include concrete recommendations and action items where applicable.`;
}

// Create the derived store
export const featureValueTemplateStore = derived(calculatorStore, ($calculatorStore) => {
  return {
    generateTemplate: (results: FeatureValueResults) => {
      return generateFeatureValueTemplate(results);
    }
  };
}); 