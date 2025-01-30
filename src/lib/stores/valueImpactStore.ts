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
    id: 'expand-tam',
    name: 'Expand Total Addressable Market (TAM)',
    description: 'Increase potential market size by expanding into new segments or territories',
    category: 'generate',
    formula: 'potentialCustomers * annualRevenue * (captureRate/100) * Math.pow(1 + (annualGrowth/100), targetYears)',
    formulaDescription: 'Base TAM × Capture Rate × (1 + Annual Growth Rate)^Years',
    inputs: [
      { name: 'potentialCustomers', type: 'number', placeholder: 'Total potential customers', defaultValue: 10000 },
      { name: 'annualRevenue', type: 'currency', placeholder: 'Average annual revenue per customer', defaultValue: 1000 },
      { name: 'captureRate', type: 'percentage', placeholder: 'Expected market capture rate', suffix: '%', defaultValue: 10 },
      { name: 'annualGrowth', type: 'percentage', placeholder: 'Expected annual growth rate', suffix: '%', defaultValue: 20 },
      { name: 'targetYears', type: 'number', placeholder: 'Years to achieve target', defaultValue: 3 }
    ]
  },
  {
    id: 'increase-market-share',
    name: 'Increase Market Share',
    description: 'Grow your portion of the total market revenue',
    category: 'generate',
    formula: 'totalMarketRevenue * (Math.min(currentShare + expectedIncrease, saturationPoint)/100) * (1 + (marketGrowth/100))',
    formulaDescription: 'Total Market × Min(Current Share + Expected Increase, Saturation Point) × (1 + Market Growth)',
    inputs: [
      { name: 'totalMarketRevenue', type: 'currency', placeholder: 'Total market revenue', defaultValue: 1000000 },
      { name: 'currentShare', type: 'percentage', placeholder: 'Current market share', suffix: '%', defaultValue: 5 },
      { name: 'expectedIncrease', type: 'percentage', placeholder: 'Expected share increase', suffix: '%', defaultValue: 10 },
      { name: 'saturationPoint', type: 'percentage', placeholder: 'Market share saturation point', suffix: '%', defaultValue: 30 },
      { name: 'marketGrowth', type: 'percentage', placeholder: 'Market growth rate', suffix: '%', defaultValue: 5 }
    ]
  },
  {
    id: 'improve-penetration',
    name: 'Improve Market Penetration Rate',
    description: 'Increase the percentage of potential customers who become active users',
    category: 'generate',
    formula: 'totalPotential * ((currentPenetration + expectedIncrease - cannibalization)/100) * averageRevenue',
    formulaDescription: 'Total Potential × (Current Penetration + Expected Increase - Cannibalization) × Average Revenue',
    inputs: [
      { name: 'totalPotential', type: 'number', placeholder: 'Total potential customers', defaultValue: 100000 },
      { name: 'currentPenetration', type: 'percentage', placeholder: 'Current penetration rate', suffix: '%', defaultValue: 15 },
      { name: 'expectedIncrease', type: 'percentage', placeholder: 'Expected increase', suffix: '%', defaultValue: 10 },
      { name: 'cannibalization', type: 'percentage', placeholder: 'Cannibalization effect', suffix: '%', defaultValue: 2 },
      { name: 'averageRevenue', type: 'currency', placeholder: 'Average revenue per customer', defaultValue: 1000 }
    ]
  },
  {
    id: 'increase-ltv',
    name: 'Increase Average Lifetime Value (ALTV)',
    description: 'Improve the total revenue generated from each customer over their lifetime',
    category: 'generate',
    formula: 'monthlyRevenue * (1 + revenueIncrease/100) * lifespan * (1 + lifespanIncrease/100) * (margin + marginIncrease)/100 * 12',
    formulaDescription: 'New Monthly Revenue × New Lifespan × New Margin × 12 months',
    inputs: [
      { name: 'monthlyRevenue', type: 'currency', placeholder: 'Current monthly revenue per customer', defaultValue: 100 },
      { name: 'revenueIncrease', type: 'percentage', placeholder: 'Expected revenue increase', suffix: '%', defaultValue: 20 },
      { name: 'lifespan', type: 'number', placeholder: 'Current customer lifespan (months)', defaultValue: 24 },
      { name: 'lifespanIncrease', type: 'percentage', placeholder: 'Expected lifespan increase', suffix: '%', defaultValue: 25 },
      { name: 'margin', type: 'percentage', placeholder: 'Current gross margin', suffix: '%', defaultValue: 70 },
      { name: 'marginIncrease', type: 'percentage', placeholder: 'Expected margin increase', suffix: '%', defaultValue: 5 }
    ]
  },
  {
    id: 'improve-conversion',
    name: 'Improve Free-to-Paid Conversion Rate',
    description: 'Increase the percentage of free users who upgrade to paid plans',
    category: 'generate',
    formula: 'freeUsers * (conversionIncrease/100) * monthlyRevenue * 12',
    formulaDescription: 'Additional Conversions × Monthly Revenue per User × 12 months',
    inputs: [
      { name: 'freeUsers', type: 'number', placeholder: 'Current free users', defaultValue: 10000 },
      { name: 'conversionIncrease', type: 'percentage', placeholder: 'Expected conversion rate increase', suffix: '%', defaultValue: 5 },
      { name: 'monthlyRevenue', type: 'currency', placeholder: 'Monthly revenue per converted user', defaultValue: 50 }
    ]
  },
  {
    id: 'increase-arpu',
    name: 'Increase Average Revenue Per User (ARPU)',
    description: 'Grow the average revenue generated by each active user',
    category: 'generate',
    formula: '(newRevenuePerUser - currentRevenuePerUser) * totalUsers * (1 + userBaseChange/100) * 12',
    formulaDescription: '(New Revenue per User - Current Revenue per User) × Total Users × User Base Change × 12 months',
    inputs: [
      { name: 'currentRevenuePerUser', type: 'currency', placeholder: 'Current monthly revenue per user', defaultValue: 50 },
      { name: 'newRevenuePerUser', type: 'currency', placeholder: 'Expected new monthly revenue per user', defaultValue: 75 },
      { name: 'totalUsers', type: 'number', placeholder: 'Total active users', defaultValue: 5000 },
      { name: 'userBaseChange', type: 'percentage', placeholder: 'Expected change in user base', suffix: '%', defaultValue: 10 }
    ]
  },
  {
    id: 'premium-adoption',
    name: 'Improve Premium Tier Adoption',
    description: 'Increase the number of users on premium pricing tiers',
    category: 'generate',
    formula: '((newStandardUsers * newStandardPrice + newPremiumUsers * newPremiumPrice) - (standardUsers * standardPrice + premiumUsers * premiumPrice)) * 12',
    formulaDescription: 'New Tier Revenue - Current Tier Revenue × 12 months',
    inputs: [
      { name: 'standardUsers', type: 'number', placeholder: 'Current standard tier users', defaultValue: 1000 },
      { name: 'premiumUsers', type: 'number', placeholder: 'Current premium tier users', defaultValue: 200 },
      { name: 'standardPrice', type: 'currency', placeholder: 'Current standard tier price', defaultValue: 10 },
      { name: 'premiumPrice', type: 'currency', placeholder: 'Current premium tier price', defaultValue: 25 },
      { name: 'newStandardUsers', type: 'number', placeholder: 'Expected standard tier users', defaultValue: 900 },
      { name: 'newPremiumUsers', type: 'number', placeholder: 'Expected premium tier users', defaultValue: 400 },
      { name: 'newStandardPrice', type: 'currency', placeholder: 'New standard tier price', defaultValue: 10 },
      { name: 'newPremiumPrice', type: 'currency', placeholder: 'New premium tier price', defaultValue: 25 }
    ]
  },
  {
    id: 'increase-upsell',
    name: 'Increase Cross-sell/Upsell Success',
    description: 'Improve the success rate of upselling and cross-selling attempts',
    category: 'generate',
    formula: 'totalAttempts * (successIncrease/100) * newRevenuePerUpsell * 12',
    formulaDescription: 'Additional Successful Upsells × New Revenue per Upsell × 12 months',
    inputs: [
      { name: 'totalAttempts', type: 'number', placeholder: 'Total monthly upsell attempts', defaultValue: 1000 },
      { name: 'successIncrease', type: 'percentage', placeholder: 'Expected success rate increase', suffix: '%', defaultValue: 15 },
      { name: 'newRevenuePerUpsell', type: 'currency', placeholder: 'New revenue per successful upsell', defaultValue: 200 }
    ]
  },
  {
    id: 'purchase-frequency',
    name: 'Enhance Customer Purchase Frequency',
    description: 'Increase how often customers make purchases',
    category: 'generate',
    formula: 'currentCustomers * currentPurchases * (frequencyIncrease/100) * purchaseValue * (1 + valueChange/100) * 12',
    formulaDescription: 'Additional Purchases × New Average Purchase Value × 12 months',
    inputs: [
      { name: 'currentCustomers', type: 'number', placeholder: 'Current unique customers', defaultValue: 1000 },
      { name: 'currentPurchases', type: 'number', placeholder: 'Average purchases per month', defaultValue: 2 },
      { name: 'frequencyIncrease', type: 'percentage', placeholder: 'Expected frequency increase', suffix: '%', defaultValue: 25 },
      { name: 'purchaseValue', type: 'currency', placeholder: 'Current average purchase value', defaultValue: 100 },
      { name: 'valueChange', type: 'percentage', placeholder: 'Expected change in purchase value', suffix: '%', defaultValue: 10 }
    ]
  },
  {
    id: 'activation-rate',
    name: 'Improve User Activation Rate',
    description: 'Increase the percentage of new users who become activated within the target timeframe',
    category: 'generate',
    formula: 'totalFreeUsers * (activationIncrease/100) * revenuePerActive * 12',
    formulaDescription: 'Additional Activated Users × Revenue per Activated User × 12 months',
    inputs: [
      { name: 'totalFreeUsers', type: 'number', placeholder: 'Total free users', defaultValue: 10000 },
      { name: 'activationIncrease', type: 'percentage', placeholder: 'Expected activation rate increase', suffix: '%', defaultValue: 15 },
      { name: 'revenuePerActive', type: 'currency', placeholder: 'Monthly revenue per activated user', defaultValue: 50 }
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