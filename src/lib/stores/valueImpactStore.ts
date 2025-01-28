import { writable } from 'svelte/store';

export interface ValueImpact {
  id: string;
  name: string;
  description: string;
  category: 'generate' | 'protect' | 'reduce' | 'avoid';
  formula: string;
  formulaDescription: string;
  inputs: {
    name: string;
    type: 'number' | 'currency' | 'percentage';
    placeholder: string;
    suffix?: string;
    defaultValue: number;
  }[];
}

const valueImpacts: ValueImpact[] = [
  // Generate Revenue
  {
    id: 'expand-market',
    name: 'Expand Total Addressable Market',
    description: 'Increase potential market size by reaching new customer segments',
    category: 'generate',
    formula: 'newMarketSize * conversionRate * averageRevenue * 12',
    formulaDescription: 'Annual value = New market size × Expected conversion rate × Average monthly revenue × 12 months',
    inputs: [
      { name: 'newMarketSize', type: 'number', placeholder: 'Potential new customers', defaultValue: 1000 },
      { name: 'conversionRate', type: 'percentage', placeholder: 'Expected conversion rate', suffix: '%', defaultValue: 5 },
      { name: 'averageRevenue', type: 'currency', placeholder: 'Average monthly revenue per customer', defaultValue: 100 }
    ]
  },
  {
    id: 'increase-sales',
    name: 'Increase Sales Conversion',
    description: 'Improve conversion rate of existing prospects',
    category: 'generate',
    formula: 'monthlyProspects * conversionIncrease * averageRevenue * 12',
    formulaDescription: 'Annual value = Monthly prospects × Conversion rate increase × Average revenue × 12 months',
    inputs: [
      { name: 'monthlyProspects', type: 'number', placeholder: 'Monthly prospects', defaultValue: 100 },
      { name: 'conversionIncrease', type: 'percentage', placeholder: 'Expected conversion increase', suffix: '%', defaultValue: 10 },
      { name: 'averageRevenue', type: 'currency', placeholder: 'Average revenue per sale', defaultValue: 1000 }
    ]
  },

  // Protect Revenue
  {
    id: 'reduce-downtime',
    name: 'Reduce System Downtime',
    description: 'Minimize revenue loss from system outages',
    category: 'protect',
    formula: 'hourlyRevenue * expectedDowntime * downtimeReduction',
    formulaDescription: 'Annual value = Hourly revenue at risk × Expected annual downtime hours × Downtime reduction %',
    inputs: [
      { name: 'hourlyRevenue', type: 'currency', placeholder: 'Revenue per hour', defaultValue: 1000 },
      { name: 'expectedDowntime', type: 'number', placeholder: 'Expected annual downtime (hours)', defaultValue: 24 },
      { name: 'downtimeReduction', type: 'percentage', placeholder: 'Expected reduction in downtime', suffix: '%', defaultValue: 50 }
    ]
  },
  {
    id: 'improve-recovery',
    name: 'Improve Recovery Times',
    description: 'Reduce impact of incidents through faster recovery',
    category: 'protect',
    formula: 'incidentsPerYear * hoursReduced * hourlyRevenue',
    formulaDescription: 'Annual value = Incidents per year × Hours reduced per incident × Revenue per hour',
    inputs: [
      { name: 'incidentsPerYear', type: 'number', placeholder: 'Expected incidents per year', defaultValue: 12 },
      { name: 'hoursReduced', type: 'number', placeholder: 'Hours reduced per incident', defaultValue: 2 },
      { name: 'hourlyRevenue', type: 'currency', placeholder: 'Revenue per hour', defaultValue: 1000 }
    ]
  },

  // Reduce Costs
  {
    id: 'reduce-coordination',
    name: 'Reduce Coordination Overhead',
    description: 'Decrease time spent on team coordination and meetings',
    category: 'reduce',
    formula: 'peopleAffected * hoursPerWeek * hourlyRate * 52',
    formulaDescription: 'Annual value = People affected × Hours saved per week × Hourly rate × 52 weeks',
    inputs: [
      { name: 'peopleAffected', type: 'number', placeholder: 'Number of people affected', defaultValue: 10 },
      { name: 'hoursPerWeek', type: 'number', placeholder: 'Hours saved per person per week', defaultValue: 2 },
      { name: 'hourlyRate', type: 'currency', placeholder: 'Average hourly rate', defaultValue: 50 }
    ]
  },
  {
    id: 'reduce-manual-work',
    name: 'Reduce Manual Work',
    description: 'Automate repetitive tasks and processes',
    category: 'reduce',
    formula: 'monthlyHours * hourlyRate * 12',
    formulaDescription: 'Annual value = Monthly hours saved × Hourly rate × 12 months',
    inputs: [
      { name: 'monthlyHours', type: 'number', placeholder: 'Hours saved per month', defaultValue: 40 },
      { name: 'hourlyRate', type: 'currency', placeholder: 'Average hourly rate', defaultValue: 50 }
    ]
  },

  // Avoid Costs
  {
    id: 'avoid-scaling',
    name: 'Avoid Infrastructure Scaling',
    description: 'Prevent need for additional infrastructure investment',
    category: 'avoid',
    formula: 'expectedCost * probability',
    formulaDescription: 'Annual value = Expected infrastructure cost × Probability of needing it',
    inputs: [
      { name: 'expectedCost', type: 'currency', placeholder: 'Expected infrastructure cost', defaultValue: 100000 },
      { name: 'probability', type: 'percentage', placeholder: 'Probability of needing scaling', suffix: '%', defaultValue: 75 }
    ]
  },
  {
    id: 'reduce-legal-risk',
    name: 'Reduce Legal Liability Risk',
    description: 'Minimize potential legal and compliance issues',
    category: 'avoid',
    formula: 'potentialCost * riskProbability * riskReduction',
    formulaDescription: 'Annual value = Potential cost × Risk probability × Risk reduction %',
    inputs: [
      { name: 'potentialCost', type: 'currency', placeholder: 'Potential legal cost', defaultValue: 500000 },
      { name: 'riskProbability', type: 'percentage', placeholder: 'Risk probability', suffix: '%', defaultValue: 10 },
      { name: 'riskReduction', type: 'percentage', placeholder: 'Expected risk reduction', suffix: '%', defaultValue: 80 }
    ]
  },
  {
    id: 'production-recovery',
    name: 'Production Recovery',
    description: 'Reduce cost of production incidents and recovery',
    category: 'avoid',
    formula: 'incidentCost * annualIncidents * preventionRate',
    formulaDescription: 'Annual value = Average incident cost × Expected annual incidents × Prevention rate',
    inputs: [
      { name: 'incidentCost', type: 'currency', placeholder: 'Average cost per incident', defaultValue: 25000 },
      { name: 'annualIncidents', type: 'number', placeholder: 'Expected incidents per year', defaultValue: 4 },
      { name: 'preventionRate', type: 'percentage', placeholder: 'Expected prevention rate', suffix: '%', defaultValue: 75 }
    ]
  }
];

export const valueImpactStore = writable(valueImpacts);

// Helper function to get impacts by category
export function getImpactsByCategory(category: 'generate' | 'protect' | 'reduce' | 'avoid'): ValueImpact[] {
  return valueImpacts.filter(impact => impact.category === category);
}

// Helper function to get impact by ID
export function getImpactById(id: string): ValueImpact | undefined {
  return valueImpacts.find(impact => impact.id === id);
} 