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
  {
    id: 'reduce-churn',
    name: 'Reduce Customer Churn Rate',
    description: 'Lower the rate at which customers stop using your product or service',
    category: 'protect',
    formula: '((currentChurnRate - expectedChurnReduction)/100) * totalUsers * averageRevenue * 12',
    formulaDescription: 'Churn Rate Reduction × Total Users × Average Revenue × 12 months',
    inputs: [
      { name: 'totalUsers', type: 'number', placeholder: 'Total current monthly active users', defaultValue: 10000 },
      { name: 'averageRevenue', type: 'currency', placeholder: 'Average revenue per user per month', defaultValue: 100 },
      { name: 'currentChurnRate', type: 'percentage', placeholder: 'Current monthly churn rate', suffix: '%', defaultValue: 5 },
      { name: 'expectedChurnReduction', type: 'percentage', placeholder: 'Expected reduction in churn rate', suffix: '%', defaultValue: 2 }
    ]
  },
  {
    id: 'maintain-nrr',
    name: 'Maintain Net Revenue Retention',
    description: 'Preserve the revenue from your existing customer base while fostering natural growth',
    category: 'protect',
    formula: 'currentAnnualRevenue * ((expectedNrr - currentNrr)/100)',
    formulaDescription: 'Current Annual Revenue × (New NRR% - Current NRR%)',
    inputs: [
      { name: 'currentAnnualRevenue', type: 'currency', placeholder: 'Current annual recurring revenue', defaultValue: 1000000 },
      { name: 'currentNrr', type: 'percentage', placeholder: 'Current NRR', suffix: '%', defaultValue: 100 },
      { name: 'expectedNrr', type: 'percentage', placeholder: 'Expected NRR after improvement', suffix: '%', defaultValue: 110 }
    ]
  },
  {
    id: 'system-reliability',
    name: 'Improve System Reliability',
    description: 'Maintain consistent system performance and availability to prevent revenue loss',
    category: 'protect',
    formula: '(additionalUptimeHours * revenuePerHour) + (errorReduction/100 * errorsPerHour * revenuePerError) * 12',
    formulaDescription: '(Additional Uptime Hours × Revenue per Hour) + (Error Reduction × Revenue Impact per Error) × 12 months',
    inputs: [
      { name: 'revenuePerHour', type: 'currency', placeholder: 'Average revenue per hour', defaultValue: 1000 },
      { name: 'additionalUptimeHours', type: 'number', placeholder: 'Expected improvement in uptime (hours/month)', defaultValue: 2 },
      { name: 'errorsPerHour', type: 'number', placeholder: 'Current errors per hour', defaultValue: 10 },
      { name: 'revenuePerError', type: 'currency', placeholder: 'Average revenue impact per error', defaultValue: 50 },
      { name: 'errorReduction', type: 'percentage', placeholder: 'Expected reduction in error rate', suffix: '%', defaultValue: 50 }
    ]
  },
  {
    id: 'feature-adoption',
    name: 'Improve Feature Adoption',
    description: 'Increase the usage of key features that correlate with long-term retention',
    category: 'protect',
    formula: '((expectedAdoption - currentAdoption)/100) * totalUsers * averageRevenue * (retentionImpact/100) * 12',
    formulaDescription: '(New Adoption Rate - Current Rate) × Total Users × Average Revenue × Retention Impact × 12 months',
    inputs: [
      { name: 'totalUsers', type: 'number', placeholder: 'Total users with feature access', defaultValue: 10000 },
      { name: 'averageRevenue', type: 'currency', placeholder: 'Average revenue per user', defaultValue: 100 },
      { name: 'currentAdoption', type: 'percentage', placeholder: 'Current feature adoption rate', suffix: '%', defaultValue: 20 },
      { name: 'expectedAdoption', type: 'percentage', placeholder: 'Expected adoption rate', suffix: '%', defaultValue: 40 },
      { name: 'retentionImpact', type: 'percentage', placeholder: 'Impact on user retention', suffix: '%', defaultValue: 80 }
    ]
  },
  {
    id: 'time-to-value',
    name: 'Reduce Time-to-Value',
    description: 'Decrease the time it takes for new users to realize product value',
    category: 'protect',
    formula: '((expectedUsersInThreshold - currentUsersInThreshold)/100) * totalNewUsers * annualRevenue * ((retentionWithin - retentionBeyond)/100)',
    formulaDescription: 'Additional Users Within Threshold × Annual Revenue × Retention Rate Difference',
    inputs: [
      { name: 'totalNewUsers', type: 'number', placeholder: 'Total new users per month', defaultValue: 1000 },
      { name: 'annualRevenue', type: 'currency', placeholder: 'Average annual revenue per activated user', defaultValue: 1200 },
      { name: 'currentUsersInThreshold', type: 'percentage', placeholder: 'Current users within threshold', suffix: '%', defaultValue: 60 },
      { name: 'expectedUsersInThreshold', type: 'percentage', placeholder: 'Expected users within threshold', suffix: '%', defaultValue: 80 },
      { name: 'retentionWithin', type: 'percentage', placeholder: 'Retention rate within threshold', suffix: '%', defaultValue: 90 },
      { name: 'retentionBeyond', type: 'percentage', placeholder: 'Retention rate beyond threshold', suffix: '%', defaultValue: 40 }
    ]
  },
  {
    id: 'support-churn',
    name: 'Reduce Support-Driven Churn',
    description: 'Prevent customer losses due to support-related frustrations and issues',
    category: 'protect',
    formula: '(supportChurnReduction/100) * highSupportUsers * annualRevenue',
    formulaDescription: 'Reduction in High Support Users × Average Revenue × Support-to-Churn Rate',
    inputs: [
      { name: 'highSupportUsers', type: 'number', placeholder: 'Users with high support needs', defaultValue: 1000 },
      { name: 'annualRevenue', type: 'currency', placeholder: 'Average annual revenue per user', defaultValue: 1200 },
      { name: 'supportChurnReduction', type: 'percentage', placeholder: 'Expected reduction in support-driven churn', suffix: '%', defaultValue: 30 }
    ]
  },
  {
    id: 'prevent-downgrades',
    name: 'Prevent Product Downgrades',
    description: 'Maintain premium tier revenue by reducing plan downgrades',
    category: 'protect',
    formula: '(downgradeReduction/100) * premiumUsers * revenueDifference * 12',
    formulaDescription: 'Downgrade Reduction × Annual Revenue Difference between Tiers',
    inputs: [
      { name: 'premiumUsers', type: 'number', placeholder: 'Total premium users', defaultValue: 5000 },
      { name: 'revenueDifference', type: 'currency', placeholder: 'Average revenue difference between tiers', defaultValue: 50 },
      { name: 'downgradeReduction', type: 'percentage', placeholder: 'Expected reduction in downgrade rate', suffix: '%', defaultValue: 25 }
    ]
  },
  {
    id: 'competitive-losses',
    name: 'Reduce Competitive Losses',
    description: 'Prevent customer switches to competitor products',
    category: 'protect',
    formula: '(competitorChurnReduction/100) * totalCustomers * annualRevenue',
    formulaDescription: 'Churn Reduction × Average Annual Revenue per Customer',
    inputs: [
      { name: 'totalCustomers', type: 'number', placeholder: 'Total customers', defaultValue: 10000 },
      { name: 'annualRevenue', type: 'currency', placeholder: 'Average annual revenue per customer', defaultValue: 1200 },
      { name: 'competitorChurnReduction', type: 'percentage', placeholder: 'Expected reduction in competitor-driven churn', suffix: '%', defaultValue: 20 }
    ]
  },
  {
    id: 'api-reliability',
    name: 'Maintain API Reliability',
    description: 'Ensure stable integration performance for partners and customers',
    category: 'protect',
    formula: '(errorRateReduction/100) * annualApiCalls * revenuePerError',
    formulaDescription: 'Error Rate Reduction × Annual API Calls × Revenue Impact per Error',
    inputs: [
      { name: 'annualApiCalls', type: 'number', placeholder: 'Number of API calls per year', defaultValue: 1000000 },
      { name: 'revenuePerError', type: 'currency', placeholder: 'Revenue impact per error', defaultValue: 10 },
      { name: 'errorRateReduction', type: 'percentage', placeholder: 'Expected reduction in error rate', suffix: '%', defaultValue: 50 }
    ]
  },
  {
    id: 'customer-complaints',
    name: 'Reduce Customer Complaints',
    description: 'Lower the rate of customer-reported issues and dissatisfaction',
    category: 'protect',
    formula: '(complaintReduction/100) * totalCustomers * annualRevenue * (churnCorrelation/100)',
    formulaDescription: 'Complaint Reduction × Average Revenue × Complaint-to-Churn Rate',
    inputs: [
      { name: 'totalCustomers', type: 'number', placeholder: 'Total active customers', defaultValue: 10000 },
      { name: 'annualRevenue', type: 'currency', placeholder: 'Average annual revenue per customer', defaultValue: 1200 },
      { name: 'complaintReduction', type: 'percentage', placeholder: 'Expected reduction in complaint rate', suffix: '%', defaultValue: 30 },
      { name: 'churnCorrelation', type: 'percentage', placeholder: 'Correlation between complaints and churn', suffix: '%', defaultValue: 40 }
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
  {
    id: 'automation-hourly',
    name: 'Reduce Operational Costs (Time-Based)',
    description: 'Eliminate repetitive human tasks through automation - based on time spent',
    category: 'reduce',
    formula: '((timesPerMonth * minutesPerTime * hourlyCost / 60) + (timesPerMonth * (errorRate/100) * minutesToFix * hourlyCost / 60)) * (automationPercentage/100) * 12',
    formulaDescription: '(Regular work cost + Error handling cost) × Automation Percentage × 12 months',
    inputs: [
      { name: 'timesPerMonth', type: 'number', placeholder: 'Times this work is done per month', defaultValue: 100 },
      { name: 'minutesPerTime', type: 'number', placeholder: 'Minutes it takes to complete once', defaultValue: 30 },
      { name: 'hourlyCost', type: 'currency', placeholder: 'Average hourly employee cost', defaultValue: 50 },
      { name: 'errorRate', type: 'percentage', placeholder: 'How often mistakes happen', suffix: '%', defaultValue: 10 },
      { name: 'minutesToFix', type: 'number', placeholder: 'Minutes spent fixing each mistake', defaultValue: 45 },
      { name: 'automationPercentage', type: 'percentage', placeholder: 'How much can be automated', suffix: '%', defaultValue: 80 }
    ]
  },
  {
    id: 'automation-transaction',
    name: 'Reduce Operational Costs (Transaction-Based)',
    description: 'Eliminate repetitive tasks through automation - based on transaction volume',
    category: 'reduce',
    formula: '((transactionsPerMonth * costPerTransaction) + (transactionsPerMonth * (failureRate/100) * redoCost) - (transactionsPerMonth * (automationPercentage/100) * newCostPerTransaction)) * 12',
    formulaDescription: '(Current Transaction Costs - New Transaction Costs) × 12 months',
    inputs: [
      { name: 'transactionsPerMonth', type: 'number', placeholder: 'Number of transactions per month', defaultValue: 1000 },
      { name: 'costPerTransaction', type: 'currency', placeholder: 'Current cost per transaction', defaultValue: 10 },
      { name: 'failureRate', type: 'percentage', placeholder: 'How often transactions need redoing', suffix: '%', defaultValue: 5 },
      { name: 'redoCost', type: 'currency', placeholder: 'Cost to redo a transaction', defaultValue: 15 },
      { name: 'automationPercentage', type: 'percentage', placeholder: 'Transactions that can be automated', suffix: '%', defaultValue: 70 },
      { name: 'newCostPerTransaction', type: 'currency', placeholder: 'New cost per automated transaction', defaultValue: 2 }
    ]
  },
  {
    id: 'error-reduction',
    name: 'Reduce Error Costs',
    description: 'Lower the financial impact of mistakes through automated validation and prevention',
    category: 'reduce',
    formula: '((errorsPerMonth * hoursPerError * hourlyCost) + (errorsPerMonth * businessImpact)) * (errorReduction/100) * 12',
    formulaDescription: '(Resolution Cost + Business Impact Cost) × Error Reduction × 12 months',
    inputs: [
      { name: 'errorsPerMonth', type: 'number', placeholder: 'Number of errors per month', defaultValue: 20 },
      { name: 'hoursPerError', type: 'number', placeholder: 'Average hours spent fixing each error', defaultValue: 4 },
      { name: 'hourlyCost', type: 'currency', placeholder: 'Average hourly cost of people fixing', defaultValue: 75 },
      { name: 'businessImpact', type: 'currency', placeholder: 'Average business impact per error', defaultValue: 1000 },
      { name: 'errorReduction', type: 'percentage', placeholder: 'How many errors can be prevented', suffix: '%', defaultValue: 60 }
    ]
  },
  {
    id: 'downtime-recovery',
    name: 'Minimize Downtime & Recovery',
    description: 'Reduce the cost of recovering from incidents through automated recovery',
    category: 'reduce',
    formula: '((incidentsPerMonth * peopleInvolved * recoveryHours * hourlyTeamCost) + (downtimeHours * revenuePerHour)) * ((recoveryReduction + downtimeReduction)/200) * 12',
    formulaDescription: '(Recovery Cost + Revenue Loss) × Average Reduction × 12 months',
    inputs: [
      { name: 'incidentsPerMonth', type: 'number', placeholder: 'Incidents per month', defaultValue: 5 },
      { name: 'peopleInvolved', type: 'number', placeholder: 'People involved in recovery', defaultValue: 4 },
      { name: 'recoveryHours', type: 'number', placeholder: 'Hours per recovery', defaultValue: 6 },
      { name: 'hourlyTeamCost', type: 'currency', placeholder: 'Average hourly cost of recovery team', defaultValue: 100 },
      { name: 'downtimeHours', type: 'number', placeholder: 'Hours of downtime per month', defaultValue: 8 },
      { name: 'revenuePerHour', type: 'currency', placeholder: 'Revenue lost per hour of downtime', defaultValue: 5000 },
      { name: 'recoveryReduction', type: 'percentage', placeholder: 'Recovery time reduction', suffix: '%', defaultValue: 40 },
      { name: 'downtimeReduction', type: 'percentage', placeholder: 'Downtime prevention', suffix: '%', defaultValue: 50 }
    ]
  },
  {
    id: 'support-request-time',
    name: 'Lower Support Costs (Time-Based)',
    description: 'Decrease the cost of supporting users through self-service solutions',
    category: 'reduce',
    formula: '((requestsPerMonth * minutesPerRequest * hourlyCost / 60) + (requestsPerMonth * (multipleContactRate/100) * extraMinutes * hourlyCost / 60)) * ((automationPercentage + handlingReduction)/200) * 12',
    formulaDescription: '(Regular Support Cost + Multiple Contact Cost) × Average Reduction × 12 months',
    inputs: [
      { name: 'requestsPerMonth', type: 'number', placeholder: 'Support requests per month', defaultValue: 500 },
      { name: 'minutesPerRequest', type: 'number', placeholder: 'Average minutes per request', defaultValue: 20 },
      { name: 'hourlyCost', type: 'currency', placeholder: 'Hourly cost of support staff', defaultValue: 40 },
      { name: 'multipleContactRate', type: 'percentage', placeholder: 'Requests needing multiple contacts', suffix: '%', defaultValue: 25 },
      { name: 'extraMinutes', type: 'number', placeholder: 'Extra minutes for multiple contacts', defaultValue: 30 },
      { name: 'automationPercentage', type: 'percentage', placeholder: 'Requests that can be automated', suffix: '%', defaultValue: 40 },
      { name: 'handlingReduction', type: 'percentage', placeholder: 'Reduction in handling time', suffix: '%', defaultValue: 30 }
    ]
  },
  {
    id: 'infrastructure-fixed',
    name: 'Optimize Fixed Infrastructure Costs',
    description: 'Reduce ongoing infrastructure costs by better matching capacity to actual needs',
    category: 'reduce',
    formula: '((monthlyInfraCost * (1 - averageUsage/100) * (infraReduction/100)) + ((totalStorage - usedStorage) * storageUnitCost * (storageReduction/100))) * 12',
    formulaDescription: '(Infrastructure waste × Cost reduction + Storage waste × Storage reduction) × 12 months',
    inputs: [
      { name: 'monthlyInfraCost', type: 'currency', placeholder: 'Current monthly infrastructure cost', defaultValue: 10000 },
      { name: 'averageUsage', type: 'percentage', placeholder: 'Average usage outside peak hours', suffix: '%', defaultValue: 30 },
      { name: 'totalStorage', type: 'number', placeholder: 'Total storage being paid for (GB)', defaultValue: 1000 },
      { name: 'usedStorage', type: 'number', placeholder: 'Storage actually being used (GB)', defaultValue: 400 },
      { name: 'storageUnitCost', type: 'currency', placeholder: 'Cost per storage unit', defaultValue: 0.1 },
      { name: 'infraReduction', type: 'percentage', placeholder: 'Expected reduction in base cost', suffix: '%', defaultValue: 40 },
      { name: 'storageReduction', type: 'percentage', placeholder: 'Expected reduction in storage', suffix: '%', defaultValue: 50 }
    ]
  },
  {
    id: 'infrastructure-usage',
    name: 'Optimize Usage-Based Infrastructure',
    description: 'Optimize costs for infrastructure with variable usage-based pricing',
    category: 'reduce',
    formula: '(((peakHours * peakCost + (24 - peakHours) * averageCost) * 30 + storageCost + processingCost) * ((peakReduction + avgReduction + storageReduction)/300)) * 12',
    formulaDescription: '(Daily cost × 30 + Storage & Processing) × Average Reduction × 12 months',
    inputs: [
      { name: 'peakHours', type: 'number', placeholder: 'Number of peak hours per day', defaultValue: 8 },
      { name: 'peakCost', type: 'currency', placeholder: 'Peak hour cost', defaultValue: 100 },
      { name: 'averageCost', type: 'currency', placeholder: 'Average daily cost', defaultValue: 50 },
      { name: 'storageCost', type: 'currency', placeholder: 'Monthly storage cost', defaultValue: 2000 },
      { name: 'processingCost', type: 'currency', placeholder: 'Processing costs per month', defaultValue: 1500 },
      { name: 'peakReduction', type: 'percentage', placeholder: 'Expected reduction in peak costs', suffix: '%', defaultValue: 30 },
      { name: 'avgReduction', type: 'percentage', placeholder: 'Expected reduction in average costs', suffix: '%', defaultValue: 20 },
      { name: 'storageReduction', type: 'percentage', placeholder: 'Expected reduction in storage costs', suffix: '%', defaultValue: 25 }
    ]
  },
  {
    id: 'data-lifecycle',
    name: 'Optimize Data Storage & Processing',
    description: 'Reduce costs through better data lifecycle management',
    category: 'reduce',
    formula: '((activeStorageCost * (1 - 1/compressionRatio) + archiveVolume * (activeStorageCost - archiveStorageCost) + processingCost * (processingReduction/100) + transferCost * (transferReduction/100)) * 12)',
    formulaDescription: 'Sum of Storage, Archive, Processing, and Transfer savings × 12 months',
    inputs: [
      { name: 'activeStorageCost', type: 'currency', placeholder: 'Monthly active storage cost', defaultValue: 5000 },
      { name: 'archiveStorageCost', type: 'currency', placeholder: 'Monthly archive storage cost', defaultValue: 1000 },
      { name: 'archiveVolume', type: 'number', placeholder: 'Archive data volume (TB)', defaultValue: 10 },
      { name: 'processingCost', type: 'currency', placeholder: 'Monthly data processing cost', defaultValue: 3000 },
      { name: 'transferCost', type: 'currency', placeholder: 'Data transfer costs per month', defaultValue: 1000 },
      { name: 'compressionRatio', type: 'number', placeholder: 'Expected compression ratio', defaultValue: 3 },
      { name: 'processingReduction', type: 'percentage', placeholder: 'Expected reduction in processing', suffix: '%', defaultValue: 30 },
      { name: 'transferReduction', type: 'percentage', placeholder: 'Expected reduction in transfer', suffix: '%', defaultValue: 25 }
    ]
  },
  {
    id: 'testing-automation',
    name: 'Automate Testing Costs',
    description: 'Reduce manual testing effort through automation',
    category: 'reduce',
    formula: '(monthlyTestHours * testersRequired * testerCost * (automationCoverage/100)) * 12',
    formulaDescription: 'Current Testing Cost × Automation Coverage × 12 months',
    inputs: [
      { name: 'monthlyTestHours', type: 'number', placeholder: 'Monthly testing hours', defaultValue: 160 },
      { name: 'testersRequired', type: 'number', placeholder: 'Number of testers required', defaultValue: 3 },
      { name: 'testerCost', type: 'currency', placeholder: 'Average tester cost per hour', defaultValue: 50 },
      { name: 'automationCoverage', type: 'percentage', placeholder: 'Additional testing to be automated', suffix: '%', defaultValue: 70 }
    ]
  },
  {
    id: 'compliance-costs',
    name: 'Reduce Compliance Process Costs',
    description: 'Reduce the effort needed for compliance activities',
    category: 'reduce',
    formula: '((complianceHours * teamSize * hourlyCost * (hoursReduction/100)) + (toolCosts * (toolCostReduction/100)) + (annualAuditCost/12)) * 12',
    formulaDescription: '(Compliance Cost Reduction + Tool Cost Savings + Audit Savings) × 12 months',
    inputs: [
      { name: 'complianceHours', type: 'number', placeholder: 'Monthly compliance hours', defaultValue: 80 },
      { name: 'teamSize', type: 'number', placeholder: 'Team members involved', defaultValue: 4 },
      { name: 'hourlyCost', type: 'currency', placeholder: 'Average hourly cost', defaultValue: 75 },
      { name: 'toolCosts', type: 'currency', placeholder: 'Monthly compliance tool costs', defaultValue: 2000 },
      { name: 'annualAuditCost', type: 'currency', placeholder: 'Annual audit costs', defaultValue: 50000 },
      { name: 'hoursReduction', type: 'percentage', placeholder: 'Expected reduction in hours', suffix: '%', defaultValue: 40 },
      { name: 'toolCostReduction', type: 'percentage', placeholder: 'Expected reduction in tool costs', suffix: '%', defaultValue: 30 }
    ]
  },
  {
    id: 'deployment-costs',
    name: 'Reduce Deployment Costs',
    description: 'Minimize the resources required for releasing and maintaining software',
    category: 'reduce',
    formula: '((deploymentsPerMonth * peoplePerDeployment * hoursPerDeployment * hourlyTeamCost) + (failedDeployments * fixHours * peopleFixing * hourlyTeamCost)) * (improvementPercentage/100) * 12',
    formulaDescription: '(Regular Deployment Cost + Failed Deployment Cost) × Improvement × 12 months',
    inputs: [
      { name: 'deploymentsPerMonth', type: 'number', placeholder: 'Number of deployments per month', defaultValue: 20 },
      { name: 'peoplePerDeployment', type: 'number', placeholder: 'Average people per deployment', defaultValue: 3 },
      { name: 'hoursPerDeployment', type: 'number', placeholder: 'Average hours per deployment', defaultValue: 2 },
      { name: 'hourlyTeamCost', type: 'currency', placeholder: 'Average hourly team cost', defaultValue: 100 },
      { name: 'failedDeployments', type: 'number', placeholder: 'Failed deployments per month', defaultValue: 2 },
      { name: 'fixHours', type: 'number', placeholder: 'Hours to fix failed deployment', defaultValue: 4 },
      { name: 'peopleFixing', type: 'number', placeholder: 'People involved in fixing', defaultValue: 4 },
      { name: 'improvementPercentage', type: 'percentage', placeholder: 'Expected overall improvement', suffix: '%', defaultValue: 60 }
    ]
  },
  {
    id: 'testing-costs',
    name: 'Reduce Testing Costs',
    description: 'Lower the cost of ensuring quality through automated testing',
    category: 'reduce',
    formula: '((manualHours * testers * hourlyCost) * (automationCoverage/100) - (maintenanceHours * engineerCost)) * 12',
    formulaDescription: '(Manual Testing Savings - Automation Maintenance Cost) × 12 months',
    inputs: [
      { name: 'manualHours', type: 'number', placeholder: 'Manual test hours per month', defaultValue: 160 },
      { name: 'testers', type: 'number', placeholder: 'Number of testers', defaultValue: 4 },
      { name: 'hourlyCost', type: 'currency', placeholder: 'Average hourly cost per tester', defaultValue: 50 },
      { name: 'automationCoverage', type: 'percentage', placeholder: 'Additional test coverage to automate', suffix: '%', defaultValue: 70 },
      { name: 'maintenanceHours', type: 'number', placeholder: 'Expected automation maintenance hours', defaultValue: 40 },
      { name: 'engineerCost', type: 'currency', placeholder: 'Hourly cost of automation engineer', defaultValue: 75 }
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
  },
  {
    id: 'technical-debt',
    name: 'Proactively Manage Technical Debt',
    description: 'Reduce future development costs by addressing technical debt before it becomes a blocker',
    category: 'avoid',
    formula: 'annualDevHours * hourlyDevCost * (techDebtImpact/100) * (preventionRate/100)',
    formulaDescription: 'Annual Development Cost × Technical Debt Impact × Prevention Rate',
    inputs: [
      { name: 'annualDevHours', type: 'number', placeholder: 'Total development hours per year', defaultValue: 2000 },
      { name: 'hourlyDevCost', type: 'currency', placeholder: 'Average developer hourly cost', defaultValue: 100 },
      { name: 'techDebtImpact', type: 'percentage', placeholder: 'Development time lost to technical debt', suffix: '%', defaultValue: 20 },
      { name: 'preventionRate', type: 'percentage', placeholder: 'Technical debt that can be prevented', suffix: '%', defaultValue: 50 }
    ]
  },
  {
    id: 'compliance-risk',
    name: 'Mitigate Compliance & Regulatory Risks',
    description: 'Lower the likelihood of costly fines, legal issues, and operational disruptions',
    category: 'avoid',
    formula: '(potentialFines * riskProbability/100 * mitigationRate/100) + (complianceIncidentCost * incidentsPerYear * preventionRate/100)',
    formulaDescription: '(Potential Fines × Risk Probability × Mitigation Rate) + (Incident Costs × Prevention Rate)',
    inputs: [
      { name: 'potentialFines', type: 'currency', placeholder: 'Maximum potential regulatory fines', defaultValue: 1000000 },
      { name: 'riskProbability', type: 'percentage', placeholder: 'Likelihood of compliance issues', suffix: '%', defaultValue: 10 },
      { name: 'mitigationRate', type: 'percentage', placeholder: 'Expected reduction in risk exposure', suffix: '%', defaultValue: 70 },
      { name: 'complianceIncidentCost', type: 'currency', placeholder: 'Average cost per compliance incident', defaultValue: 50000 },
      { name: 'incidentsPerYear', type: 'number', placeholder: 'Expected annual compliance incidents', defaultValue: 4 },
      { name: 'preventionRate', type: 'percentage', placeholder: 'Incidents that can be prevented', suffix: '%', defaultValue: 60 }
    ]
  },
  {
    id: 'future-proof',
    name: 'Future-Proof Architecture & Scalability',
    description: 'Prevent infrastructure and performance bottlenecks that could require expensive rework',
    category: 'avoid',
    formula: '(reworkCost * reworkProbability/100 * preventionRate/100) + (scalingInefficiencyCost * growthRate/100)',
    formulaDescription: '(Rework Cost × Risk Probability × Prevention Rate) + (Inefficiency Cost × Growth Rate)',
    inputs: [
      { name: 'reworkCost', type: 'currency', placeholder: 'Estimated cost of major architectural rework', defaultValue: 500000 },
      { name: 'reworkProbability', type: 'percentage', placeholder: 'Likelihood of needing rework', suffix: '%', defaultValue: 30 },
      { name: 'preventionRate', type: 'percentage', placeholder: 'Rework that can be prevented', suffix: '%', defaultValue: 70 },
      { name: 'scalingInefficiencyCost', type: 'currency', placeholder: 'Annual cost of inefficient scaling', defaultValue: 100000 },
      { name: 'growthRate', type: 'percentage', placeholder: 'Expected annual growth rate', suffix: '%', defaultValue: 25 }
    ]
  },
  {
    id: 'incident-prevention',
    name: 'Reduce Incident Probability & Recovery',
    description: 'Minimize the likelihood and impact of production incidents',
    category: 'avoid',
    formula: '(incidentCost * annualIncidents * severityFactor) * (preventionRate/100) + (recoveryHours * peopleInvolved * hourlyRate * annualIncidents * reductionRate/100)',
    formulaDescription: '(Incident Costs × Prevention Rate) + (Recovery Costs × Reduction Rate)',
    inputs: [
      { name: 'incidentCost', type: 'currency', placeholder: 'Average cost per incident', defaultValue: 25000 },
      { name: 'annualIncidents', type: 'number', placeholder: 'Expected incidents per year', defaultValue: 12 },
      { name: 'severityFactor', type: 'number', placeholder: 'Weighted impact factor (1-3)', defaultValue: 2 },
      { name: 'preventionRate', type: 'percentage', placeholder: 'Incidents that can be prevented', suffix: '%', defaultValue: 40 },
      { name: 'recoveryHours', type: 'number', placeholder: 'Hours spent on incident recovery', defaultValue: 8 },
      { name: 'peopleInvolved', type: 'number', placeholder: 'Team members involved in recovery', defaultValue: 5 },
      { name: 'hourlyRate', type: 'currency', placeholder: 'Average hourly cost of recovery team', defaultValue: 100 },
      { name: 'reductionRate', type: 'percentage', placeholder: 'Reduction in recovery time', suffix: '%', defaultValue: 50 }
    ]
  },
  {
    id: 'hiring-prevention',
    name: 'Prevent Additional Hiring Costs',
    description: 'Reduce the need for future headcount growth through automation and efficiency',
    category: 'avoid',
    formula: '(projectedHires * (recruitingCost + onboardingCost + annualSalary)) * (preventionRate/100)',
    formulaDescription: 'Total Hiring Costs × Prevention Rate',
    inputs: [
      { name: 'projectedHires', type: 'number', placeholder: 'Expected new hires needed', defaultValue: 5 },
      { name: 'recruitingCost', type: 'currency', placeholder: 'Cost per hire for recruitment', defaultValue: 20000 },
      { name: 'onboardingCost', type: 'currency', placeholder: 'Cost per hire for onboarding', defaultValue: 10000 },
      { name: 'annualSalary', type: 'currency', placeholder: 'Average annual salary per hire', defaultValue: 100000 },
      { name: 'preventionRate', type: 'percentage', placeholder: 'Hires that can be prevented', suffix: '%', defaultValue: 40 }
    ]
  },
  {
    id: 'brand-protection',
    name: 'Protect Brand Reputation & Goodwill',
    description: 'Avoid PR crises, customer churn, and lost revenue due to incidents',
    category: 'avoid',
    formula: '(reputationIncidentCost * incidentProbability/100 * preventionRate/100) + (churnRevenue * churnReduction/100)',
    formulaDescription: '(Reputation Incident Cost × Prevention Rate) + (Churn Revenue × Reduction Rate)',
    inputs: [
      { name: 'reputationIncidentCost', type: 'currency', placeholder: 'Average cost of reputation incident', defaultValue: 500000 },
      { name: 'incidentProbability', type: 'percentage', placeholder: 'Likelihood of reputation incident', suffix: '%', defaultValue: 15 },
      { name: 'preventionRate', type: 'percentage', placeholder: 'Incidents that can be prevented', suffix: '%', defaultValue: 70 },
      { name: 'churnRevenue', type: 'currency', placeholder: 'Annual revenue lost to reputation churn', defaultValue: 200000 },
      { name: 'churnReduction', type: 'percentage', placeholder: 'Expected reduction in churn', suffix: '%', defaultValue: 40 }
    ]
  },
  {
    id: 'vendor-lockin',
    name: 'Minimize Vendor Lock-in Risks',
    description: 'Prevent high switching costs by designing flexible integrations',
    category: 'avoid',
    formula: '(vendorSwitchingCost * switchingProbability/100 * flexibilityBenefit/100) + (annualVendorPremium * premiumReduction/100)',
    formulaDescription: '(Switching Cost Savings) + (Vendor Premium Reduction)',
    inputs: [
      { name: 'vendorSwitchingCost', type: 'currency', placeholder: 'Cost to switch vendors', defaultValue: 250000 },
      { name: 'switchingProbability', type: 'percentage', placeholder: 'Likelihood of needing to switch', suffix: '%', defaultValue: 25 },
      { name: 'flexibilityBenefit', type: 'percentage', placeholder: 'Switching costs that can be avoided', suffix: '%', defaultValue: 60 },
      { name: 'annualVendorPremium', type: 'currency', placeholder: 'Annual cost premium for vendor lock-in', defaultValue: 50000 },
      { name: 'premiumReduction', type: 'percentage', placeholder: 'Reduction in vendor premium', suffix: '%', defaultValue: 30 }
    ]
  },
  {
    id: 'scalability-prevention',
    name: 'Prevent Scalability Issues Before Growth',
    description: 'Ensure systems scale efficiently to avoid expensive retrofitting',
    category: 'avoid',
    formula: '(retrofitCost * growthProbability/100 * preventionRate/100) + (performanceCost * userGrowth/100)',
    formulaDescription: '(Retrofit Cost Prevention) + (Performance Cost Savings)',
    inputs: [
      { name: 'retrofitCost', type: 'currency', placeholder: 'Cost to fix scalability issues', defaultValue: 400000 },
      { name: 'growthProbability', type: 'percentage', placeholder: 'Likelihood of hitting scale issues', suffix: '%', defaultValue: 40 },
      { name: 'preventionRate', type: 'percentage', placeholder: 'Issues that can be prevented', suffix: '%', defaultValue: 75 },
      { name: 'performanceCost', type: 'currency', placeholder: 'Annual cost of performance issues', defaultValue: 100000 },
      { name: 'userGrowth', type: 'percentage', placeholder: 'Expected annual user growth', suffix: '%', defaultValue: 30 }
    ]
  },
  {
    id: 'litigation-prevention',
    name: 'Avoid Litigation & IP Risks',
    description: 'Reduce exposure to legal disputes and intellectual property conflicts',
    category: 'avoid',
    formula: '(litigationCost * riskProbability/100 * preventionRate/100) + (settlementCost * settlementProbability/100)',
    formulaDescription: '(Litigation Cost Prevention) + (Settlement Cost Prevention)',
    inputs: [
      { name: 'litigationCost', type: 'currency', placeholder: 'Average cost of litigation', defaultValue: 750000 },
      { name: 'riskProbability', type: 'percentage', placeholder: 'Likelihood of legal issues', suffix: '%', defaultValue: 10 },
      { name: 'preventionRate', type: 'percentage', placeholder: 'Risks that can be prevented', suffix: '%', defaultValue: 80 },
      { name: 'settlementCost', type: 'currency', placeholder: 'Average settlement cost', defaultValue: 250000 },
      { name: 'settlementProbability', type: 'percentage', placeholder: 'Likelihood of needing settlement', suffix: '%', defaultValue: 20 }
    ]
  },
  {
    id: 'business-continuity',
    name: 'Ensure Business Continuity & Disaster Preparedness',
    description: 'Prevent major disruptions through backup and resilience planning',
    category: 'avoid',
    formula: '(disasterCost * disasterProbability/100 * mitigationRate/100) + (recoveryTime * hourlyRevenue * incidentRate)',
    formulaDescription: '(Disaster Cost Prevention) + (Recovery Time Cost Savings)',
    inputs: [
      { name: 'disasterCost', type: 'currency', placeholder: 'Average cost of major disaster', defaultValue: 1000000 },
      { name: 'disasterProbability', type: 'percentage', placeholder: 'Likelihood of disaster', suffix: '%', defaultValue: 5 },
      { name: 'mitigationRate', type: 'percentage', placeholder: 'Impact that can be mitigated', suffix: '%', defaultValue: 80 },
      { name: 'recoveryTime', type: 'number', placeholder: 'Hours of recovery time', defaultValue: 24 },
      { name: 'hourlyRevenue', type: 'currency', placeholder: 'Revenue lost per hour', defaultValue: 5000 },
      { name: 'incidentRate', type: 'number', placeholder: 'Expected incidents per year', defaultValue: 2 }
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