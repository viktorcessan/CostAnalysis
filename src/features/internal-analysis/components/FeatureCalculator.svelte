<!-- Feature Value Calculator Component -->
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import Chart from 'chart.js/auto';
  import CurrencySelector from '$lib/components/ui/CurrencySelector.svelte';
  import { currencyStore } from '$lib/stores/currencyStore';
  import { valueImpactStore, type ValueImpact } from '$lib/stores/valueImpactStore';
  import type { FeatureValueResults } from '$lib/stores/featureValueTemplateStore';

  const dispatch = createEventDispatcher();

  // Types
  interface SelectedImpact {
    id: string;
    impact: ValueImpact;
    inputValues: { [key: string]: number };
    calculatedValue: number;
  }

  interface TutorialCategory {
    title: string;
    description: string;
    examples: string[];
    metrics: string[];
  }

  interface TutorialStep {
    title: string;
    subtitle: string;
    description: string;
    color: string;
    icon: string;
    examples?: TutorialCategory[];
    isConclusion?: boolean;
  }

  // Wizard state
  let currentStep = 0;
  const TOTAL_STEPS = 8; // Reduced by 1 since we removed a step
  let projectName = '';

  // Tutorial state
  let isInTutorial = false;
  let currentTutorialStep = 0;
  const TUTORIAL_STEPS: TutorialStep[] = [
    {
      title: 'Increase Revenue',
      subtitle: 'Strategic Growth & Innovation',
      description: 'Every investment we make - whether projects, features, or initiatives - that grows revenue is an example of \'Increase Revenue\'. This could be adding localizations to enter new markets, implementing payment providers to reach more customers, or building premium features that attract larger market segments.\n\nWhen evaluating features that increase revenue, consider three key dimensions:\n● Market reach and expansion that grows total addressable market\n● Product monetization that enhances revenue per customer\n● Business model innovation that creates new revenue streams\n\nThese focus on different ways to grow: expanding who you can reach, getting more value from existing customers, and finding entirely new ways to generate revenue.',
      color: 'green',
      icon: 'feature_icons/increase_revenue.png',
      examples: [
        {
          title: 'Market Expansion',
          description: 'Any investment that allows you to expand into new territories or customer segments.',
          examples: [
            'Localization support for a new markets',
            'White-labeling',
            'Revenue sharing',
            'Missing features',
            'New distribution channels'
          ],
          metrics: [
            'Total Addressable Market',
            'Market Share',
            'Customer Purchase Frequency',
            'Market Penetration Rate',
            'Average Lifetime Value',
            'Free-to-Paid conversion',
            'Revenue Per User'
          ]
        } as TutorialCategory,
        {
          title: 'Premium Features',
          description: 'Investments in new capabilities that customers value enough to pay extra for.',
          examples: [
            'Enterprise-grade security features',
            'Advanced analytics and reporting',
            'API access and integrations',
            'Automation capabilities',
            'Professional services features'
          ],
          metrics: [
            'Premium Tier Adoption',
            'Cross-sell/Upsell Success',
            'Customer Purchase Frequency',
            'Free-to-Paid Conversion Rate',
            'Revenue Per User (ARPU)'
          ]
        },
        {
          title: 'Channel Development',
          description: 'Building new ways to reach and monetize customers.',
          examples: [
            'Mobile app with in-app purchases',
            'API marketplace',
            'Partner integrations',
            'Reseller programs',
            'Self-service platforms'
          ],
          metrics: [
            'Market Share',
            'Market Penetration Rate',
            'Average Lifetime Value (ALTV)',
            'User Activation Rate',
            'Revenue Per User (ARPU)'
          ]
        },
        {
          title: 'Business Model Innovation',
          description: 'Creating new revenue streams through innovative pricing and delivery models',
          examples: [
            'Usage-based pricing',
            'Subscription tiers',
            'Marketplace fees',
            'Data monetization',
            'Platform economics'
          ],
          metrics: [
            'Free-to-Paid Conversion Rate',
            'Premium Tier Adoption',
            'Cross-sell/Upsell Success',
            'Average Lifetime Value (ALTV)',
            'Revenue Per User (ARPU)'
          ]
        }
      ]
    },
    {
      title: 'Protect Revenue',
      subtitle: 'Sustaining Your Core Business',
      description: 'Defending existing revenue is as crucial as pursuing growth. \'Protect Revenue\' focuses on investments that safeguard your revenue streams and customer base. This could be improving system reliability to prevent outages, enhancing support tools to reduce churn, or adding features and user-friendliness to maintain competitive parity.\n\nWhen evaluating features that protect revenue, consider three key dimensions:\n● System reliability and performance that prevent revenue loss\n● Customer retention and satisfaction that maintain revenue\n● Competitive position that defends market share\n\nThese focus on different ways to protect: ensuring technical stability, keeping customers happy, and staying competitive in your market.',
      color: 'blue',
      icon: 'feature_icons/protect_revenue.png',
      examples: [
        {
          title: 'System Performance',
          description: 'Features that minimize revenue loss through reliable technical operations',
          examples: [
            'Infrastructure redundancy',
            'Performance monitoring',
            'Automated failover',
            'Error detection',
            'Load balancing'
          ],
          metrics: [
            'System Downtime',
            'Recovery Times',
            'System Reliability',
            'API Reliability',
            'Feature Adoption'
          ]
        },
        {
          title: 'Customer Defense',
          description: 'Features that prevent customer churn and maintain satisfaction',
          examples: [
            'Support automation',
            'User experience improvements',
            'Self-service capabilities',
            'Engagement tools',
            'Success metrics'
          ],
          metrics: [
            'Customer Churn Rate',
            'Net Revenue Retention',
            'Support-Driven Churn',
            'Time-to-Value',
            'Customer Complaints'
          ]
        },
        {
          title: 'Competitive Parity',
          description: 'Features that maintain competitive position and prevent customer switching',
          examples: [
            'Feature matching',
            'Integration parity',
            'Performance improvements',
            'Industry standards',
            'Market benchmarks'
          ],
          metrics: [
            'Competitive Losses',
            'Product Downgrades',
            'Feature Adoption',
            'Customer Churn Rate',
            'Net Revenue Retention'
          ]
        },
        {
          title: 'Service Quality',
          description: 'Features that ensure consistent service delivery and customer satisfaction',
          examples: [
            'Monitoring tools',
            'SLA management',
            'Quality assurance',
            'Support systems',
            'Incident response'
          ],
          metrics: [
            'Recovery Times',
            'System Reliability',
            'API Reliability',
            'Customer Complaints',
            'Support-Driven Churn'
          ]
        }
      ]
    },
    {
      title: 'Reduce Costs',
      subtitle: 'Operational Excellence',
      description: 'Cost reduction focuses on optimizing operations without compromising value delivery. These investments automate repetitive work, streamline processes, and eliminate waste while maintaining or improving customer experience.\n\nWhen evaluating features that reduce costs, consider three key dimensions:\n● Process automation that eliminates manual work\n● Resource optimization that improves efficiency\n● Infrastructure optimization that reduces operational costs\n\nThese focus on different ways to reduce: automating repetitive tasks, optimizing resource usage, and improving infrastructure efficiency.',
      color: 'amber',
      icon: 'feature_icons/reduce_costs.png',
      examples: [
        {
          title: 'Process Automation',
          description: 'Features that reduce costs by simplifying and eliminating manual work.',
          examples: [
            'Automated testing',
            'Process automation',
            'Self-service tools',
            'Workflow automation',
            'Validation checks',
            'Deployment automation'
          ],
          metrics: [
            'Manual Work',
            'Operational Costs (Time-Based)',
            'Operational Costs (Transaction-Based)',
            'Error Costs',
            'Testing Costs'
          ]
        },
        {
          title: 'Resource Optimization',
          description: 'Features that improve resource allocation and efficiency',
          examples: [
            'Team coordination tools',
            'Capacity planning',
            'Resource scheduling',
            'Usage monitoring',
            'Performance optimization'
          ],
          metrics: [
            'Coordination Overhead',
            'Support Costs',
            'Compliance Process Costs',
            'Error Costs',
            'Testing Costs'
          ]
        },
        {
          title: 'Infrastructure Efficiency',
          description: 'Features that optimize infrastructure costs and usage',
          examples: [
            'Usage-based scaling',
            'Storage optimization',
            'Load balancing',
            'Resource pooling',
            'Capacity planning'
          ],
          metrics: [
            'Fixed Infrastructure Costs',
            'Usage-Based Infrastructure',
            'Data Storage & Processing',
            'Downtime & Recovery',
            'Deployment Costs'
          ]
        },
        {
          title: 'Quality Automation',
          description: 'Features that reduce costs through automated quality assurance',
          examples: [
            'Automated testing',
            'Error prevention',
            'Monitoring tools',
            'Compliance automation',
            'Recovery automation'
          ],
          metrics: [
            'Error Costs',
            'Testing Costs',
            'Deployment Costs',
            'Downtime & Recovery',
            'Compliance Process Costs'
          ]
        }
      ]
    },
    {
      title: 'Avoid Costs',
      subtitle: 'Strategic Risk Management',
      description: 'Prevent future costs by investing proactively in risk mitigation and long-term sustainability. These investments protect against technical debt, compliance issues, and scalability problems before they materialize into actual costs.\n\nWhen evaluating features that avoid costs, consider three key dimensions:\n● Technical sustainability that prevents future rework\n● Risk management that reduces potential losses\n● Strategic planning that avoids future constraints\n\nThese focus on different ways to avoid costs: addressing technical debt early, managing risks proactively, and planning for sustainable growth.',
      color: 'red',
      icon: 'feature_icons/avoid_costs.png',
      examples: [
        {
          title: 'Technical Sustainability',
          description: 'Features that prevent future technical costs and rework.',
          examples: [
            'Architecture improvements',
            'Technical debt reduction',
            'Scalability planning',
            'Performance optimization',
            'Infrastructure modernization'
          ],
          metrics: [
            'Future-Proof Architecture & Scalability',
            'Technical Debt',
            'Infrastructure Scaling',
            'Production Recovery',
            'Business Continuity'
          ]
        },
        {
          title: 'Prevention of Cost Associated Risks',
          description: 'Features that reduce likelihood of costly incidents.',
          examples: [
            'Security improvements',
            'Compliance automation',
            'Disaster recovery',
            'Monitoring systems',
            'Incident prevention',
            'Legal requirements'
          ],
          metrics: [
            'Legal Liability Risk',
            'Compliance & Regulatory Risks',
            'Incident Probability & Recovery',
            'Litigation & IP Risks',
            'Brand Reputation & Goodwill'
          ]
        },
        {
          title: 'Proactive Removal of Projected Constraints',
          description: 'Features that prevent future operational constraints.',
          examples: [
            'Vendor diversification',
            'Integration flexibility',
            'Resource planning',
            'Growth preparation',
            'Platform scalability'
          ],
          metrics: [
            'Vendor Lock-in Risks',
            'Additional Hiring Costs',
            'Scalability Issues Before Growth',
            'Business Continuity',
            'Infrastructure Scaling'
          ]
        },
        {
          title: 'Compliance Management',
          description: 'Features that prevent regulatory and legal issues',
          examples: [
            'Compliance automation',
            'Legal risk management',
            'Data protection',
            'Audit preparation',
            'Policy enforcement'
          ],
          metrics: [
            'Legal Liability Risk',
            'Compliance & Regulatory Risks',
            'Litigation & IP Risks',
            'Brand Reputation',
            'Business Continuity'
          ]
        }
      ]
    },
    {
      title: 'Ready to Start?',
      subtitle: 'Apply Your Knowledge',
      description: 'Now that you understand the different types of value your features can deliver, you can start calculating the value of your own features or test your knowledge with a quick quiz.',
      color: 'secondary',
      icon: '🎯',
      isConclusion: true
    }
  ];

  // Form data
  let selectedImpacts: SelectedImpact[] = [];
  let developmentCost = {
    hourlyRate: 0,
    hours: 0
  };
  let maintenanceCost = {
    monthly: 0
  };

  // Form validation state
  interface ValidationError {
    field: string;
    message: string;
  }
  let errors: ValidationError[] = [];
  let touched: { [key: string]: boolean } = {};

  // Confidence score (0-100)
  $: confidenceScore = calculateConfidenceScore();

  // Add state for selected categories
  let selectedCategories: Set<keyof typeof impactsByCategory> = new Set();

  // Add state for active category
  let activeCategory: keyof typeof impactsByCategory | null = null;

  // Step titles for navigation
  const stepTitles = [
    'Welcome',
    isInTutorial ? 'Tutorial' : 'Project Info',
    'Increase Revenue',
    'Protect Revenue',
    'Reduce Cost',
    'Avoid Risk',
    'Development Costs',
    'Results'
  ];

  // Track which steps user has completed or skipped
  let completedSteps = new Set<number>();

  // Add state for current category
  let currentCategory: 'generate' | 'protect' | 'reduce' | 'avoid' | null = null;

  // Add chart instances
  let valueDistributionChart: Chart | null = null;
  let costBreakdownChart: Chart | null = null;

  // Add modal state
  let showQuizModal = false;

  function calculateConfidenceScore(): number {
    let score = 0;
    
    // Project info completeness (20%)
    if (projectName) score += 10;
    
    // Value impacts completeness (40%)
    if (selectedImpacts.length > 0) {
      score += Math.min(selectedImpacts.length * 10, 40);
    }
    
    // Costs completeness (40%)
    if (developmentCost.hourlyRate > 0) score += 20;
    if (developmentCost.hours > 0) score += 10;
    if (maintenanceCost.monthly > 0) score += 10;
    
    return score;
  }

  // Group impacts by category
  $: impactsByCategory = {
    generate: $valueImpactStore.filter(impact => impact.category === 'generate'),
    protect: $valueImpactStore.filter(impact => impact.category === 'protect'),
    reduce: $valueImpactStore.filter(impact => impact.category === 'reduce'),
    avoid: $valueImpactStore.filter(impact => impact.category === 'avoid')
  };

  // Add state for results visibility
  let showResults = false;
  let hasCalculated = false;

  // Add currency reactivity
  $: currencyMultiplier = $currencyStore.multiplier;
  $: currencySymbol = $currencyStore.symbol;

  // Update monetary values when currency changes
  $: {
    if (currencyMultiplier) {
      // Force chart update when currency changes
      if (hasCalculated) {
        setTimeout(() => {
          updateCharts();
        }, 100);
      }
    }
  }

  // Add tooltip state
  let showTooltip = false;
  let tooltipX = 0;
  let tooltipY = 0;
  let tooltipContent = '';

  function showHelpTooltip(event: MouseEvent, impact: ValueImpact) {
    tooltipX = event.clientX;
    tooltipY = event.clientY;
    tooltipContent = impact.formulaDescription;
    showTooltip = true;
  }

  function hideTooltip() {
    showTooltip = false;
  }

  // Handle impact selection
  function toggleImpact(impact: ValueImpact) {
    const index = selectedImpacts.findIndex(si => si.id === impact.id);
    if (index >= 0) {
      selectedImpacts = selectedImpacts.filter(si => si.id !== impact.id);
    } else {
      const inputValues = impact.inputs.reduce((acc, input) => {
        acc[input.name] = input.defaultValue;
        return acc;
      }, {} as { [key: string]: number });

      selectedImpacts = [...selectedImpacts, {
        id: impact.id,
        impact,
        inputValues,
        calculatedValue: calculateImpactValue(impact, inputValues)
      }];
    }
  }

  // Calculate impact value based on formula and inputs
  function calculateImpactValue(impact: ValueImpact, inputValues: { [key: string]: number }): number {
    // Create a function from the formula string
    const formula = impact.formula;
    const fn = new Function(...Object.keys(inputValues), `return ${formula}`);
    
    try {
      // Convert percentage inputs to decimals for calculation
      const adjustedValues = { ...inputValues };
      impact.inputs.forEach(input => {
        if (input.type === 'percentage') {
          adjustedValues[input.name] = inputValues[input.name] / 100;
        }
      });
      
      return fn(...Object.values(adjustedValues));
    } catch (error) {
      console.error('Error calculating impact value:', error);
        return 0;
    }
  }

  // Update impact input value
  function updateImpactInput(impactId: string, inputName: string, value: number) {
    selectedImpacts = selectedImpacts.map(si => {
      if (si.id === impactId) {
        const newInputValues = { ...si.inputValues, [inputName]: value };
        return {
          ...si,
          inputValues: newInputValues,
          calculatedValue: calculateImpactValue(si.impact, newInputValues)
        };
      }
      return si;
    });
  }

  // Computed values
  $: totalValue = selectedImpacts.reduce((sum, impact) => sum + impact.calculatedValue, 0);
  $: totalDevelopmentCost = developmentCost.hourlyRate * developmentCost.hours;
  $: totalMaintenanceCost = maintenanceCost.monthly * 12;
  $: totalCost = totalDevelopmentCost + totalMaintenanceCost;
  
  // ROI calculation
  $: roi = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  
  // Break-even calculation (in months)
  $: breakEvenMonths = totalValue > 0 ? (totalCost / (totalValue / 12)) : 0;

  // Add reactive validation
  $: {
    if (touched.projectName) {
      validateForm();
    }
  }

  function validateField(field: string, value: any): string | null {
    switch (field) {
      case 'projectName':
        return !value?.trim() ? 'Project name is required' : null;
      case 'hourlyRate':
        return value < 0 ? 'Value must be positive' : null;
      default:
        return null;
    }
  }

  function validateForm(): boolean {
    errors = [];
    
    // Validate project info
    if (currentStep === 0) {
      const nameError = validateField('projectName', projectName);
      if (nameError) errors.push({ field: 'projectName', message: nameError });
    }
    
    // Validate impacts
    if (currentStep === 1 || currentStep === 2 || currentStep === 3 || currentStep === 4) {
      if (selectedImpacts.length === 0) {
        errors.push({ field: 'impacts', message: 'Select at least one value impact' });
      }
    }
    
    // Validate development costs
    if (currentStep === 0 || currentStep === 1 || currentStep === 2 || currentStep === 3 || currentStep === 4) {
      if (developmentCost.hourlyRate < 0) {
        errors.push({ field: 'hourlyRate', message: 'Hourly rate must be positive' });
      }
      if (developmentCost.hours < 0) {
        errors.push({ field: 'hours', message: 'Hours must be positive' });
      }
    }
    
    return errors.length === 0;
  }

  // Add validation for steps
  function canProceedToNext(): boolean {
    switch (currentStep) {
      case 0:
        return true; // Can always proceed from welcome
      case 1:
        return isInTutorial || !!projectName.trim(); // Require project name if not in tutorial
      case 2:
        return true; // Can always proceed from value categories overview
      case 3:
      case 4:
      case 5:
      case 6:
        return true; // Can proceed from value steps (they're optional)
      case 7:
        return developmentCost.hourlyRate > 0 && developmentCost.hours > 0; // Require basic cost info
      case 8:
        return true; // Can always view results
      default:
        return true;
    }
  }

  function handleNext() {
    if (!canProceedToNext()) {
      errors = [{
        field: 'step',
        message: 'Please fill in required fields before proceeding'
      }];
      return;
    }

    completedSteps.add(currentStep);
    
    // Special handling for tutorial flow
    if (isInTutorial && currentStep === 1) {
      if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
        currentTutorialStep++;
        return;
      } else {
        isInTutorial = false;
        // Go directly to Increase Revenue step after tutorial
        currentStep = 2;
        return;
      }
    }

    if (currentStep < TOTAL_STEPS - 1) {
      currentStep++;
      // Reset errors when moving to next step
      errors = [];
    }
  }

  function handleSkip() {
    completedSteps.add(currentStep);
    if (currentStep < TOTAL_STEPS - 1) {
      currentStep++;
      // Reset errors when skipping
      errors = [];
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      currentStep--;
    }
  }

  // Format helpers
  function formatMoney(value: number): string {
    return `${currencySymbol}${(value * currencyMultiplier).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }

  function formatPercentage(value: number): string {
    return `${value}%`;
  }

  // Chart updates
  function updateCharts() {
    // Destroy existing charts
    if (valueDistributionChart) {
      valueDistributionChart.destroy();
      valueDistributionChart = null;
    }
    if (costBreakdownChart) {
      costBreakdownChart.destroy();
      costBreakdownChart = null;
    }

    // Create new charts
    const valueCtx = document.getElementById('valueDistributionChart') as HTMLCanvasElement;
    if (valueCtx) {
      valueDistributionChart = new Chart(valueCtx, {
        type: 'doughnut',
        data: {
          labels: ['Increase', 'Protect', 'Reduce', 'Avoid'],
          datasets: [{
            data: [
              selectedImpacts.filter(i => i.impact.category === 'generate').reduce((sum, i) => sum + i.calculatedValue, 0),
              selectedImpacts.filter(i => i.impact.category === 'protect').reduce((sum, i) => sum + i.calculatedValue, 0),
              selectedImpacts.filter(i => i.impact.category === 'reduce').reduce((sum, i) => sum + i.calculatedValue, 0),
              selectedImpacts.filter(i => i.impact.category === 'avoid').reduce((sum, i) => sum + i.calculatedValue, 0)
            ],
            backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const value = context.raw || 0;
                  const total = selectedImpacts.reduce((sum, i) => sum + i.calculatedValue, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                  return `${context.label}: ${formatMoney(value)} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    const costCtx = document.getElementById('costBreakdownChart') as HTMLCanvasElement;
    if (costCtx) {
      costBreakdownChart = new Chart(costCtx, {
        type: 'doughnut',
        data: {
          labels: ['Development', 'Annual Maintenance'],
          datasets: [{
            data: [totalDevelopmentCost, totalMaintenanceCost],
            backgroundColor: ['#6366f1', '#a855f7'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const value = context.raw || 0;
                  const total = totalDevelopmentCost + totalMaintenanceCost;
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                  return `${context.label}: ${formatMoney(value)} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

  // Update charts when entering results step
  $: if (currentStep === 7) {
    setTimeout(() => {
      updateCharts();
    }, 100);
  }

  // Update scroll behavior with improved positioning
  $: if (currentStep !== undefined) {
    setTimeout(() => {
      const calculator = document.querySelector('.calculator-steps');
      if (calculator && currentStep > 0) { // Only scroll if not on first step
        const navHeight = 64; // Height of the navigation menu
        const marginTop = 120; // Increased margin for better visibility
        const elementRect = calculator.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const scrollTop = absoluteElementTop - navHeight - marginTop;
        
        window.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        });
      }
    }, 50);
  }

  // Add cleanup on component destroy
  onDestroy(() => {
    if (valueDistributionChart) {
      valueDistributionChart.destroy();
    }
    if (costBreakdownChart) {
      costBreakdownChart.destroy();
    }
  });

  // Function to generate insights based on the calculations
  function generateInsights() {
    const insights = [];
    
    // Value distribution insights
    const valueTypes = {
      generate: selectedImpacts.filter(i => i.impact.category === 'generate').reduce((sum, i) => sum + i.calculatedValue, 0),
      protect: selectedImpacts.filter(i => i.impact.category === 'protect').reduce((sum, i) => sum + i.calculatedValue, 0),
      reduce: selectedImpacts.filter(i => i.impact.category === 'reduce').reduce((sum, i) => sum + i.calculatedValue, 0),
      avoid: selectedImpacts.filter(i => i.impact.category === 'avoid').reduce((sum, i) => sum + i.calculatedValue, 0)
    };
    
    // Add value distribution insight
    const topValueType = Object.entries(valueTypes)
      .sort(([,a], [,b]) => b - a)[0];
    if (topValueType[1] > 0) {
      insights.push(`The largest value contribution comes from ${topValueType[0]} impacts at ${formatMoney(topValueType[1])} annually.`);
    }
    
    // ROI insight
    if (roi > 0) {
      insights.push(`With an ROI of ${roi.toFixed(1)}%, this feature is expected to provide positive returns on investment.`);
    }
    
    // Break-even insight
    if (breakEvenMonths > 0 && breakEvenMonths < 12) {
      insights.push(`The feature is expected to break even in ${breakEvenMonths.toFixed(1)} months.`);
    } else if (breakEvenMonths >= 12) {
      insights.push(`The feature will take over a year to break even (${breakEvenMonths.toFixed(1)} months).`);
    }
    
    // Cost structure insight
    const developmentPercentage = (totalDevelopmentCost / totalCost) * 100;
    insights.push(`Development costs represent ${developmentPercentage.toFixed(1)}% of total costs.`);
    
    return insights;
  }

  function toggleCategory(category: keyof typeof impactsByCategory) {
    activeCategory = activeCategory === category ? null : category;
  }

  // Update navigation buttons
  $: showSkip = !isInTutorial && currentStep > 1 && currentStep < 6; // Adjusted step numbers
  $: showNext = currentStep < TOTAL_STEPS - 1 && currentStep !== 0; // Hide next button on welcome page
  $: nextButtonText = isInTutorial && currentStep === 1 ? "Continue" :
                     currentStep === 1 ? "Next" :
                     currentStep === 6 ? "Calculate Results" :
                     "Next";

  // Function to initialize quiz
  function initializeQuiz() {
    if (typeof window !== 'undefined') {
      const quizScript = `
        (function(i,s,o,g,r,a,m){
          var ql=document.querySelectorAll('A[data-quiz],DIV[data-quiz]');
          if(ql){
            if(ql.length){
              for(var k=0;k<ql.length;k++){
                ql[k].id='quiz-embed-'+k;
                ql[k].href="javascript:var i=document.getElementById('quiz-embed-"+k+"');try{qz.startQuiz(i)}catch(e){i.start=1;i.style.cursor='wait';i.style.opacity='0.5'};void(0);";
              }
            }
          };
          i['QP']=r;
          i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();
          a=s.createElement(o),m=s.getElementsByTagName(o)[0];
          a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','https://take.quiz-maker.com/3012/CDN/quiz-embed-v1.js','qp');
      `;

      // Create and append the initialization script
      const script = document.createElement('script');
      script.textContent = quizScript;
      document.body.appendChild(script);
    }
  }

  // Initialize quiz when modal opens
  function toggleQuizModal() {
    showQuizModal = !showQuizModal;
    if (showQuizModal) {
      // Wait for modal to be in DOM
      setTimeout(() => {
        initializeQuiz();
      }, 100);
    }
  }

  onMount(() => {
    if (currentStep === 7) {
      setTimeout(() => {
        updateCharts();
      }, 100);
    }
  });

  // Replace the scrollToTop function with this new one
  function scrollToContainer() {
    if (!isInTutorial) return; // Only scroll if in tutorial mode
    
    const container = document.querySelector('.tutorial-container');
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const scrollTarget = window.pageYOffset + containerRect.top - 20; // Small offset from top
      window.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
      });
    }
  }

  // Update the tutorial navigation handlers to use the new function name
  function handleTutorialNext() {
    if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
      currentTutorialStep++;
      scrollToContainer();
    }
  }

  function handleTutorialPrevious() {
    if (currentTutorialStep > 0) {
      currentTutorialStep--;
      scrollToContainer();
    }
  }

  // Add dispatch in the calculation logic
  $: if (currentStep === 7 && !hasCalculated) {
    hasCalculated = true;
    dispatch('results', {
      projectName,
      selectedImpacts,
      totalValue,
      totalCost,
      developmentCost,
      maintenanceCost,
      roi,
      breakEvenMonths,
      confidenceScore: calculateConfidenceScore()
    });
  }

  // Add this method to load shared configuration
  export function loadSharedConfig(results: FeatureValueResults) {
    // Set project name
    projectName = results.projectName;
    
    // Set selected impacts
    selectedImpacts = results.selectedImpacts;
    
    // Set development costs
    developmentCost = results.developmentCost;
    
    // Set maintenance costs
    maintenanceCost = results.maintenanceCost;
    
    // Mark all steps as completed
    completedSteps = new Set([0, 1, 2, 3, 4, 5, 6]);
    
    // Go to results step
    currentStep = 7;
    
    // Force update of charts
    setTimeout(() => {
      updateCharts();
    }, 100);
  }
</script>

<!-- Tooltip Component -->
{#if showTooltip}
  <div
    class="fixed z-50 max-w-xs bg-gray-900 text-white p-4 rounded-lg shadow-lg text-sm"
    style="left: {tooltipX + 10}px; top: {tooltipY + 10}px;"
  >
    <div class="space-y-2">
      <h4 class="font-semibold">{tooltipContent}</h4>
    </div>
  </div>
{/if}

<!-- Quiz Modal Component -->
{#if showQuizModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4">
    <div class="bg-white w-full h-full sm:h-auto sm:rounded-xl sm:max-w-4xl sm:max-h-[90vh] flex flex-col relative">
      <!-- Header -->
      <div class="p-4 sm:p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🎯</span>
            <h3 class="text-xl font-semibold">Test Your Knowledge</h3>
          </div>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            on:click={toggleQuizModal}
            aria-label="Close modal"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p class="text-sm text-gray-600 mt-2">Challenge yourself to understand the different types of value your features can deliver. Good luck!</p>
      </div>
      
      <!-- Quiz Content -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6">
        <div class="quiz-container bg-gray-50 rounded-lg p-4">
          <a data-quiz="Q12UOG7P5" data-type="4" href="https://take.quiz-maker.com/Q12UOG7P5">Loading Quiz...</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <p class="hidden sm:block text-sm text-gray-600">You can retake the quiz as many times as you want</p>
          <div class="flex gap-3">
            <button
              class="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              on:click={toggleQuizModal}
            >
              Close Quiz
            </button>
            <button
              class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
              on:click={() => {
                toggleQuizModal();
                if (currentStep === 1) handleNext();
              }}
            >
              <span class="hidden sm:inline">Continue to Selection</span>
              <span class="sm:hidden">Continue</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Main Container -->
<div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
  {#if isInTutorial}
    <!-- Tutorial Content -->
    <div class="space-y-6 animate-fade-in tutorial-container">
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-4">
          <h2 class="text-2xl font-bold">Feature Value Tutorial</h2>
          <span class="px-3 py-1 text-xs font-semibold bg-secondary/10 text-secondary rounded-full">
            Step {currentTutorialStep + 1} of {TUTORIAL_STEPS.length}
          </span>
        </div>
        <button
          class="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium flex items-center gap-2 rounded-lg hover:bg-gray-50 transition-colors"
          on:click={() => {
            isInTutorial = false;
            currentStep = 1;
          }}
        >
          Skip Tutorial
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Tutorial Progress Bar -->
      <div class="mb-8">
        <div class="overflow-hidden h-1 mb-4 flex rounded bg-secondary/10">
          <div
            class="bg-secondary rounded-full transition-all duration-500 ease-out"
            style="width: {Math.round(((currentTutorialStep + 1) / TUTORIAL_STEPS.length) * 100)}%"
          ></div>
        </div>
      </div>

      <div class="space-y-8">
        {#if !TUTORIAL_STEPS[currentTutorialStep].isConclusion}
          <div class="space-y-8">
            <!-- Header Section -->
            <div class="bg-white rounded-xl border border-gray-200 p-6">
              <!-- Title Section -->
              <div class="flex items-start gap-4 mb-6">
                <img src={TUTORIAL_STEPS[currentTutorialStep].icon} alt={TUTORIAL_STEPS[currentTutorialStep].title} class="w-12 h-12" />
                <div class="flex-1">
                  <h3 class="text-2xl font-bold mb-1">{TUTORIAL_STEPS[currentTutorialStep].title}</h3>
                  <h4 class="text-lg text-gray-600">{TUTORIAL_STEPS[currentTutorialStep].subtitle}</h4>
                </div>
              </div>
              
              <!-- Description Section -->
              <div class="space-y-4">
                {#each TUTORIAL_STEPS[currentTutorialStep].description.split('\n\n') as paragraph}
                  {#if paragraph.includes('●')}
                    <div class="space-y-3">
                      {#each paragraph.split('●').filter(text => text.trim()) as point}
                        <div class="flex items-start gap-3">
                          <svg class="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <p class="text-gray-600 leading-relaxed">{point.trim()}</p>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <p class="text-gray-600 leading-relaxed">{paragraph}</p>
                  {/if}
                {/each}
              </div>
            </div>

            {#if TUTORIAL_STEPS[currentTutorialStep].examples}
              <!-- Examples Grid -->
              <div class="grid grid-cols-1 gap-6">
                {#each TUTORIAL_STEPS[currentTutorialStep].examples || [] as category}
                  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <!-- Category Header -->
                    <div class="p-4 sm:p-6 border-b border-gray-100">
                      <h5 class="text-xl font-semibold mb-2 flex items-center gap-2">
                        {(category as TutorialCategory).title}
                      </h5>
                      <p class="text-gray-600">{(category as TutorialCategory).description}</p>
                    </div>
                    
                    <!-- Examples and Metrics -->
                    <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                      <!-- Examples Column -->
                      <div class="p-4 sm:p-5">
                        <h6 class="font-medium text-gray-900 mb-4">
                          Examples
                        </h6>
                        <ul class="space-y-3">
                          {#each (category as TutorialCategory).examples as example}
                            <li class="flex items-start gap-3 text-sm text-gray-700">
                              <svg class="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                              </svg>
                              <span>{example}</span>
                            </li>
                          {/each}
                        </ul>
                      </div>
                      
                      <!-- Metrics Column -->
                      <div class="p-4 sm:p-5 bg-gray-50">
                        <h6 class="font-medium text-gray-900 mb-4">
                          Key Metrics
                        </h6>
                        <ul class="space-y-3">
                          {#each (category as TutorialCategory).metrics as metric}
                            <li class="flex items-start gap-3 text-sm text-gray-700">
                              <svg class="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{metric}</span>
                            </li>
                          {/each}
                        </ul>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <!-- Conclusion Step -->
          <div class="space-y-8">
            <div class="text-center">
              <span class="text-4xl mb-4 block">{TUTORIAL_STEPS[currentTutorialStep].icon}</span>
              <h3 class="text-2xl font-bold mb-2">{TUTORIAL_STEPS[currentTutorialStep].title}</h3>
              <h4 class="text-lg text-gray-600 mb-4">{TUTORIAL_STEPS[currentTutorialStep].subtitle}</h4>
              <p class="text-gray-600 max-w-2xl mx-auto">{TUTORIAL_STEPS[currentTutorialStep].description}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              <button
                class="px-6 py-4 rounded-lg border-2 border-secondary bg-secondary/5 hover:bg-secondary/10 transition-colors text-secondary font-medium flex items-center justify-center gap-2"
                on:click={() => {
                  isInTutorial = false;
                  currentStep = 1;
                }}
              >
                <span>Start Calculator</span>
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                class="px-6 py-4 rounded-lg border-2 border-secondary bg-secondary/5 hover:bg-secondary/10 transition-colors text-secondary font-medium flex items-center justify-center gap-2"
                on:click={toggleQuizModal}
              >
                <span>Test Your Knowledge</span>
                <span class="text-xl">🎯</span>
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Tutorial Navigation -->
      <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        {#if currentTutorialStep > 0}
          <button
            class="text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={currentTutorialStep === 0}
            on:click={handleTutorialPrevious}
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
        {:else}
          <div></div>
        {/if}

        {#if currentTutorialStep < TUTORIAL_STEPS.length - 1}
          <button
            class="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
            on:click={handleTutorialNext}
          >
            Next
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Calculator Content -->
  <div class="bg-white rounded-xl shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
        <div class="w-full sm:w-auto text-center sm:text-left">
          <h2 class="text-2xl font-bold">Calculate Feature Value</h2>
        </div>
        <div class="w-full sm:w-auto">
          <CurrencySelector />
        </div>
      </div>
    </div>
    
    <div class="relative pt-1">
      <div class="flex mb-2 items-center justify-between">
        <div>
          <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-secondary bg-secondary/10">
            {stepTitles[currentStep]}
          </span>
        </div>
        <div class="text-right">
          <span class="text-xs font-semibold inline-block text-secondary">
            {Math.round((currentStep / (TOTAL_STEPS - 1)) * 100)}%
          </span>
        </div>
      </div>
      <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-secondary/10">
        <div
            class="bg-secondary rounded-full h-2 transition-all duration-300"
            style="width: {Math.round((currentStep / (TOTAL_STEPS - 1)) * 100)}%"
        ></div>
      </div>
    </div>

      <!-- Calculator Steps -->
      <div class="calculator-steps">
    {#if currentStep === 0}
          <!-- Welcome Step -->
      <div class="space-y-8 animate-fade-in">
        <div class="text-center mb-8">
          <span class="text-4xl mb-4 block">🎯</span>
          <h3 class="text-2xl font-bold mb-2">Welcome to Feature Value Calculator</h3>
          <p class="text-gray-600 max-w-2xl mx-auto">
            Quantify and analyze the business value of your software features across four key dimensions: Generate, Protect, Reduce, and Avoid.
          </p>
        </div>

        <!-- Value Categories Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto mb-8">
          <div class="p-6 rounded-lg border border-gray-200">
            <div class="flex items-center gap-3 mb-4">
              <img src="feature_icons/increase_revenue.png" alt="Increase Revenue" class="w-8 h-8" />
              <h4 class="font-semibold text-gray-900">Increase Revenue</h4>
            </div>
            <p class="text-sm text-gray-600">Features that create new revenue streams through market expansion, partnerships, or premium offerings. These drive business growth and new opportunities.</p>
          </div>

          <div class="p-6 rounded-lg border border-gray-200">
            <div class="flex items-center gap-3 mb-4">
              <img src="feature_icons/protect_revenue.png" alt="Protect Revenue" class="w-8 h-8" />
              <h4 class="font-semibold text-gray-900">Protect Revenue</h4>
            </div>
            <p class="text-sm text-gray-600">Features that maintain existing revenue by improving reliability, user experience, and competitive position. Essential for business continuity.</p>
          </div>

          <div class="p-6 rounded-lg border border-gray-200">
            <div class="flex items-center gap-3 mb-4">
              <img src="feature_icons/reduce_costs.png" alt="Reduce Costs" class="w-8 h-8" />
              <h4 class="font-semibold text-gray-900">Reduce Costs</h4>
            </div>
            <p class="text-sm text-gray-600">Features that optimize operations and lower existing expenses through efficiency gains. Direct impact on bottom-line performance.</p>
          </div>

          <div class="p-6 rounded-lg border border-gray-200">
            <div class="flex items-center gap-3 mb-4">
              <img src="feature_icons/avoid_costs.png" alt="Avoid Costs" class="w-8 h-8" />
              <h4 class="font-semibold text-gray-900">Avoid Costs</h4>
            </div>
            <p class="text-sm text-gray-600">Features that prevent future expenses and mitigate potential risks. Strategic investments in long-term sustainability.</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <button
            class="px-6 py-3 rounded-lg border-2 border-secondary bg-secondary/5 hover:bg-secondary/10 transition-colors text-secondary font-medium"
            on:click={() => {
              isInTutorial = true;
              currentTutorialStep = 0;
              handleNext();
            }}
          >
            Learn More About Value
          </button>

          <button
            class="px-6 py-3 rounded-lg border-2 border-secondary bg-secondary/5 hover:bg-secondary/10 transition-colors text-secondary font-medium"
            on:click={toggleQuizModal}
          >
            Test Your Knowledge
          </button>

          <button
            class="px-6 py-3 rounded-lg border-2 border-secondary bg-secondary/5 hover:bg-secondary/10 transition-colors text-secondary font-medium"
            on:click={() => {
              isInTutorial = false;
              handleNext();
            }}
          >
            Start Calculator
          </button>
        </div>

        <div class="mt-8 text-center">
          <p class="text-sm text-gray-500">
            You can always access the tutorial and quiz later through the help menu
          </p>
        </div>
      </div>
        {:else if currentStep === 1}
          <!-- Project Name Step -->
      <div class="space-y-6 animate-fade-in">
        <div class="max-w-2xl mx-auto text-center">
          <h3 class="text-2xl font-bold mb-2">Name Your Feature</h3>
          <p class="text-gray-600">Give your feature a clear and descriptive name to help identify its purpose.</p>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-xl mx-auto">
          <div class="space-y-4">
            <div class="form-group">
              <input
                id="projectName"
                type="text"
                class="w-full text-lg rounded-lg border-gray-300 focus:border-secondary focus:ring-secondary text-center"
                placeholder="e.g., Customer Dashboard Redesign"
                bind:value={projectName}
              />
            </div>
          </div>
        </div>
      </div>
    {:else if currentStep === 2}
          <!-- Increase Revenue Step -->
      <div class="space-y-6 animate-fade-in">
        <div class="flex items-center gap-3">
          <img src="feature_icons/increase_revenue.png" alt="Increase Revenue" class="w-8 h-8" />
          <div>
            <h3 class="text-xl font-semibold">Increase Revenue</h3>
            <p class="text-sm text-gray-600">Select impacts that will generate new value or revenue</p>
          </div>
        </div>

        <div class="space-y-4">
          {#each impactsByCategory.generate as impact}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <!-- Impact selection UI -->
              <div class="flex items-center justify-between">
                    <div class="flex-1">
                  <h6 class="font-medium">{impact.name}</h6>
                  <p class="text-sm text-gray-500">{impact.description}</p>
                    </div>
                <button 
                  class="px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium"
                  class:border-green-500={selectedImpacts.some(si => si.id === impact.id)}
                  class:text-green-600={selectedImpacts.some(si => si.id === impact.id)}
                  class:bg-green-50={selectedImpacts.some(si => si.id === impact.id)}
                  on:click={() => toggleImpact(impact)}
                >
                  {selectedImpacts.some(si => si.id === impact.id) ? 'Remove' : 'Add'}
                </button>
                  </div>

              <!-- Input fields when selected -->
              {#if selectedImpacts.some(si => si.id === impact.id)}
                {@const selectedImpact = selectedImpacts.find(si => si.id === impact.id)}
                {#if selectedImpact}
                  <div class="mt-4 pt-4 border-t border-gray-100">
                    <!-- Input fields -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {#each selectedImpact.impact.inputs as input}
                      <div class="form-group">
                          <label class="text-sm font-medium text-gray-600">{input.placeholder}</label>
                        <div class="relative">
                          <input
                            type="number"
                              class="w-full rounded-lg border-gray-300"
                              class:pr-8={input.type === 'percentage' || input.type === 'currency'}
                              placeholder="0"
                              value={selectedImpact.inputValues[input.name]}
                              on:input={(e) => updateImpactInput(selectedImpact.id, input.name, +e.currentTarget.value)}
                            />
                            {#if input.type === 'currency'}
                              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {currencySymbol}
                              </span>
                            {/if}
                            {#if input.type === 'percentage'}
                              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                %
                              </span>
                            {/if}
                        </div>
                      </div>
                      {/each}
                    </div>
                    <!-- Value preview -->
                    <div class="flex justify-end mt-4">
                      <span class="text-sm font-medium text-green-600">
                        Annual Value: {formatMoney(selectedImpact.calculatedValue)}
                      </span>
                    </div>
                  </div>
                {/if}
              {/if}
            </div>
          {/each}
                        </div>
                      </div>
    {:else if currentStep === 3}
          <!-- Protect Revenue Step -->
      <div class="space-y-6 animate-fade-in">
        <div class="flex items-center gap-3">
          <img src="feature_icons/protect_revenue.png" alt="Protect Revenue" class="w-8 h-8" />
          <div>
            <h3 class="text-xl font-semibold">Protect Revenue</h3>
            <p class="text-sm text-gray-600">Select impacts that will protect existing value</p>
          </div>
        </div>
        
        <!-- Similar structure as Increase Revenue step but with protect impacts -->
        <div class="space-y-4">
          {#each impactsByCategory.protect as impact}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <!-- Impact selection UI -->
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h6 class="font-medium">{impact.name}</h6>
                  <p class="text-sm text-gray-500">{impact.description}</p>
                </div>
                <button 
                  class="px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium"
                  class:border-blue-500={selectedImpacts.some(si => si.id === impact.id)}
                  class:text-blue-600={selectedImpacts.some(si => si.id === impact.id)}
                  class:bg-blue-50={selectedImpacts.some(si => si.id === impact.id)}
                  on:click={() => toggleImpact(impact)}
                >
                  {selectedImpacts.some(si => si.id === impact.id) ? 'Remove' : 'Add'}
                </button>
              </div>

              <!-- Input fields when selected -->
              {#if selectedImpacts.some(si => si.id === impact.id)}
                {@const selectedImpact = selectedImpacts.find(si => si.id === impact.id)}
                {#if selectedImpact}
                  <div class="mt-4 pt-4 border-t border-gray-100">
                    <!-- Input fields -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {#each selectedImpact.impact.inputs as input}
                      <div class="form-group">
                          <label class="text-sm font-medium text-gray-600">{input.placeholder}</label>
                        <div class="relative">
                          <input
                            type="number"
                              class="w-full rounded-lg border-gray-300"
                              class:pr-8={input.type === 'percentage' || input.type === 'currency'}
                              placeholder="0"
                              value={selectedImpact.inputValues[input.name]}
                              on:input={(e) => updateImpactInput(selectedImpact.id, input.name, +e.currentTarget.value)}
                            />
                            {#if input.type === 'currency'}
                              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {currencySymbol}
                              </span>
                            {/if}
                            {#if input.type === 'percentage'}
                              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                %
                              </span>
                            {/if}
                        </div>
                      </div>
                      {/each}
                    </div>
                    <!-- Value preview -->
                    <div class="flex justify-end mt-4">
                      <span class="text-sm font-medium text-blue-600">
                        Annual Value: {formatMoney(selectedImpact.calculatedValue)}
                      </span>
                    </div>
                  </div>
                {/if}
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {:else if currentStep === 4}
      <!-- Reduce Cost Step -->
      <div class="space-y-6 animate-fade-in">
        <div class="flex items-center gap-3">
          <img src="feature_icons/reduce_costs.png" alt="Reduce Costs" class="w-8 h-8" />
          <div>
            <h3 class="text-xl font-semibold">Reduce Costs</h3>
            <p class="text-sm text-gray-600">Select impacts that will reduce operational costs</p>
          </div>
        </div>
        
        <!-- Similar structure as previous steps -->
        <div class="space-y-4">
          {#each impactsByCategory.reduce as impact}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <!-- Impact selection UI -->
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h6 class="font-medium">{impact.name}</h6>
                  <p class="text-sm text-gray-500">{impact.description}</p>
                </div>
                <button 
                  class="px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium"
                  class:border-amber-500={selectedImpacts.some(si => si.id === impact.id)}
                  class:text-amber-600={selectedImpacts.some(si => si.id === impact.id)}
                  class:bg-amber-50={selectedImpacts.some(si => si.id === impact.id)}
                  on:click={() => toggleImpact(impact)}
                >
                  {selectedImpacts.some(si => si.id === impact.id) ? 'Remove' : 'Add'}
                </button>
              </div>

              <!-- Input fields when selected -->
              {#if selectedImpacts.some(si => si.id === impact.id)}
                {@const selectedImpact = selectedImpacts.find(si => si.id === impact.id)}
                {#if selectedImpact}
                  <div class="mt-4 pt-4 border-t border-gray-100">
                    <!-- Input fields -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {#each selectedImpact.impact.inputs as input}
                      <div class="form-group">
                          <label class="text-sm font-medium text-gray-600">{input.placeholder}</label>
                        <div class="relative">
                          <input
                            type="number"
                              class="w-full rounded-lg border-gray-300"
                              class:pr-8={input.type === 'percentage' || input.type === 'currency'}
                              placeholder="0"
                              value={selectedImpact.inputValues[input.name]}
                              on:input={(e) => updateImpactInput(selectedImpact.id, input.name, +e.currentTarget.value)}
                            />
                            {#if input.type === 'currency'}
                              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {currencySymbol}
                              </span>
                            {/if}
                            {#if input.type === 'percentage'}
                              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                %
                              </span>
                            {/if}
                        </div>
                      </div>
                      {/each}
                    </div>
                    <!-- Value preview -->
                    <div class="flex justify-end mt-4">
                      <span class="text-sm font-medium text-amber-600">
                        Annual Value: {formatMoney(selectedImpact.calculatedValue)}
                      </span>
                    </div>
                  </div>
                {/if}
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {:else if currentStep === 5}
      <!-- Avoid Risk Step -->
      <div class="space-y-6 animate-fade-in">
        <div class="flex items-center gap-3">
          <img src="feature_icons/avoid_costs.png" alt="Avoid Costs" class="w-8 h-8" />
          <div>
            <h3 class="text-xl font-semibold">Avoid Costs</h3>
            <p class="text-sm text-gray-600">Select impacts that will help avoid risks or losses</p>
          </div>
        </div>
        
        <!-- Similar structure as previous steps -->
        <div class="space-y-4">
          {#each impactsByCategory.avoid as impact}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <!-- Impact selection UI -->
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h6 class="font-medium">{impact.name}</h6>
                  <p class="text-sm text-gray-500">{impact.description}</p>
                </div>
                <button
                  class="px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium"
                  class:border-red-500={selectedImpacts.some(si => si.id === impact.id)}
                  class:text-red-600={selectedImpacts.some(si => si.id === impact.id)}
                  class:bg-red-50={selectedImpacts.some(si => si.id === impact.id)}
                  on:click={() => toggleImpact(impact)}
                >
                  {selectedImpacts.some(si => si.id === impact.id) ? 'Remove' : 'Add'}
                </button>
              </div>

              <!-- Input fields when selected -->
              {#if selectedImpacts.some(si => si.id === impact.id)}
                {@const selectedImpact = selectedImpacts.find(si => si.id === impact.id)}
                {#if selectedImpact}
                  <div class="mt-4 pt-4 border-t border-gray-100">
                    <!-- Input fields -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {#each selectedImpact.impact.inputs as input}
                        <div class="form-group">
                          <label class="text-sm font-medium text-gray-600">{input.placeholder}</label>
                          <div class="relative">
                            <input
                              type="number"
                              class="w-full rounded-lg border-gray-300"
                              class:pr-8={input.type === 'percentage' || input.type === 'currency'}
                              placeholder="0"
                              value={selectedImpact.inputValues[input.name]}
                              on:input={(e) => updateImpactInput(selectedImpact.id, input.name, +e.currentTarget.value)}
                            />
                            {#if input.type === 'currency'}
                              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {currencySymbol}
                              </span>
                            {/if}
                            {#if input.type === 'percentage'}
                              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                %
                              </span>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                    <!-- Value preview -->
                    <div class="flex justify-end mt-4">
                      <span class="text-sm font-medium text-red-600">
                        Annual Value: {formatMoney(selectedImpact.calculatedValue)}
                      </span>
                    </div>
                  </div>
                {/if}
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {:else if currentStep === 6}
      <!-- Development & Maintenance Costs Step -->
      <div class="space-y-6 animate-fade-in">
        <h3 class="text-xl font-semibold">Development & Maintenance Costs</h3>
        <p class="text-gray-600">Let's estimate the costs associated with building and maintaining this feature.</p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Development section -->
          <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h4 class="text-lg font-semibold">Development Cost</h4>
            <div class="form-group">
              <label class="text-sm text-gray-600">Hourly Rate ({currencySymbol})</label>
              <div class="relative">
                <input
                  type="number"
                  class="w-full rounded-lg border-gray-300"
                  bind:value={developmentCost.hourlyRate}
                />
              </div>
            </div>
            <div class="form-group">
              <label class="text-sm text-gray-600">Estimated Hours</label>
              <input
                type="number"
                class="w-full rounded-lg border-gray-300"
                bind:value={developmentCost.hours}
              />
            </div>
            {#if developmentCost.hourlyRate > 0 && developmentCost.hours > 0}
              <div class="mt-4 pt-4 border-t border-gray-100">
                <div class="text-sm font-medium text-gray-600">Total Development Cost</div>
                <div class="text-lg font-semibold text-secondary">{formatMoney(developmentCost.hourlyRate * developmentCost.hours)}</div>
              </div>
            {/if}
          </div>

          <!-- Maintenance section -->
          <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h4 class="text-lg font-semibold">Maintenance Cost</h4>
            <div class="form-group">
              <label class="text-sm text-gray-600">Monthly Cost ({currencySymbol})</label>
              <div class="relative">
                <input
                  type="number"
                  class="w-full rounded-lg border-gray-300"
                  bind:value={maintenanceCost.monthly}
                />
              </div>
            </div>
            {#if maintenanceCost.monthly > 0}
              <div class="mt-4 pt-4 border-t border-gray-100">
                <div class="text-sm font-medium text-gray-600">Annual Maintenance Cost</div>
                <div class="text-lg font-semibold text-secondary">{formatMoney(maintenanceCost.monthly * 12)}</div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {:else if currentStep === 7}
          <!-- Results Step -->
      <div class="space-y-8 animate-fade-in">
        <div class="bg-white rounded-xl p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 id="results-summary" class="text-xl font-semibold">Results Summary for {projectName}</h3>
            <button
              class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
              on:click={() => {
                currentStep = 0;
                projectName = '';
                selectedImpacts = [];
                developmentCost = { hourlyRate: 0, hours: 0 };
                maintenanceCost = { monthly: 0 };
                errors = [];
                touched = {};
              }}
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start Over
            </button>
          </div>

          <!-- Selected Impacts Summary -->
          <div class="space-y-4 mb-8">
            <h4 class="text-lg font-semibold">Selected Value Impacts</h4>
            {#if selectedImpacts.length === 0}
              <p class="text-gray-500">No value impacts selected.</p>
            {:else}
              <div class="grid grid-cols-1 gap-4" 
                   data-gtm-feature-calculator="selected-impacts"
                   data-gtm-total-impacts="{selectedImpacts.length}"
                   data-gtm-total-value="{totalValue}">
                {#each selectedImpacts as impact}
                  <div class="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <div class="flex items-center justify-between">
                      <div>
                        <h5 class="font-medium">{impact.impact.name}</h5>
                        <p class="text-sm text-gray-600">{impact.impact.description}</p>
                      </div>
                      <div class="text-right">
                        <div class="text-sm font-medium text-gray-600">Annual Value</div>
                        <div class="text-lg font-semibold text-secondary">{formatMoney(impact.calculatedValue)}</div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Results summary -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Value cards -->
            <div class="bg-gradient-to-br from-green-50 to-white p-4 rounded-lg border border-green-200">
              <div class="text-sm font-medium text-gray-600">Annual Value</div>
              <div class="text-xl font-bold text-green-500 mt-1">{formatMoney(totalValue)}</div>
            </div>

            <div class="bg-gradient-to-br from-rose-50 to-white p-4 rounded-lg border border-rose-200">
              <div class="text-sm font-medium text-gray-600">Total Cost</div>
              <div class="text-xl font-bold text-rose-500 mt-1">{formatMoney(totalCost)}</div>
            </div>

            <div class="bg-gradient-to-br from-sky-50 to-white p-4 rounded-lg border border-sky-200">
              <div class="text-sm font-medium text-gray-600">ROI</div>
              <div class="text-xl font-bold text-sky-500 mt-1">{roi.toFixed(1)}%</div>
            </div>

            <div class="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg border border-purple-200">
              <div class="text-sm font-medium text-gray-600">Break-even</div>
              <div class="text-xl font-bold text-purple-500 mt-1">{breakEvenMonths.toFixed(1)} months</div>
            </div>
          </div>
        </div>

        <!-- Charts and detailed breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Value Distribution Chart -->
          <div class="bg-white rounded-xl p-6 border border-gray-200">
            <h4 class="text-lg font-semibold mb-4">Value Distribution</h4>
            <div class="h-[300px]" 
                 data-gtm-feature-calculator="value-distribution"
                 data-gtm-increase-revenue-count="{selectedImpacts.filter(i => i.impact.category === 'generate').length}"
                 data-gtm-protect-revenue-count="{selectedImpacts.filter(i => i.impact.category === 'protect').length}"
                 data-gtm-reduce-costs-count="{selectedImpacts.filter(i => i.impact.category === 'reduce').length}"
                 data-gtm-avoid-costs-count="{selectedImpacts.filter(i => i.impact.category === 'avoid').length}"
                 data-gtm-most-selected-category="{
                   ['generate', 'protect', 'reduce', 'avoid']
                     .map(cat => ({
                       category: cat,
                       count: selectedImpacts.filter(i => i.impact.category === cat).length
                     }))
                     .sort((a, b) => b.count - a.count)[0].category
                 }">
              <canvas id="valueDistributionChart"></canvas>
            </div>
          </div>
          
          <!-- Cost Breakdown Chart -->
          <div class="bg-white rounded-xl p-6 border border-gray-200">
            <h4 class="text-lg font-semibold mb-4">Cost Breakdown</h4>
            <div class="h-[300px]">
              <canvas id="costBreakdownChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Insights -->
        <div class="bg-white rounded-xl p-6 border border-gray-200">
          <h4 class="text-lg font-semibold mb-4">Key Insights</h4>
          <div class="space-y-3">
            {#each generateInsights() as insight}
              <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span class="text-secondary mt-0.5">💡</span>
                <p class="text-sm text-gray-700">{insight}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
      </div>

    <!-- Navigation -->
    <div class="flex justify-between items-center mt-8">
      {#if currentStep > 0}
        <button
          class="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={currentStep === 0}
          on:click={handlePrevious}
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
      {:else}
        <div></div>
      {/if}

      <div class="flex items-center gap-2">
        {#if errors.length > 0}
          <p class="text-sm text-red-500">{errors[0].message}</p>
        {/if}

        {#if showNext}
          <button
            class="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
            on:click={handleNext}
          >
            {nextButtonText}
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        {/if}
      </div>
    </div>
  </div>
  {/if}
</div>

<style>
  /* Input field styles */
  input[type="number"],
  input[type="text"],
  select {
    @apply px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary focus:border-secondary;
    min-width: 0;
  }

  /* Form group styles */
  .form-group {
    @apply flex flex-col gap-1;
  }

  .form-group label {
    @apply text-sm font-medium text-gray-700;
  }

  /* Card hover effects */
  .hover-card {
    @apply transition-all duration-300 hover:border-secondary/20 hover:shadow-md;
  }

  /* Add animation for results section */
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Add these new mobile-specific styles */
  @media (max-width: 640px) {
    .grid {
      grid-gap: 1rem;
    }
    
    input[type="number"],
    input[type="text"],
    select {
      font-size: 16px;
      padding: 0.75rem;
      width: 100%;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    /* Ensure inputs don't overflow their containers */
    .form-group input,
    .form-group select {
      max-width: 100%;
      min-width: 0;
    }

    /* Better spacing for mobile */
    .p-4 {
      padding: 1rem;
    }

    /* Improve readability on mobile */
    .text-sm {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }

    .text-xs {
      font-size: 0.75rem;
      line-height: 1rem;
    }
  }

  /* Tooltip animations */
  .tooltip-enter {
    opacity: 0;
    transform: translateY(5px);
  }
  
  .tooltip-enter-active {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 200ms, transform 200ms;
  }
  
  .tooltip-exit {
    opacity: 1;
  }
  
  .tooltip-exit-active {
    opacity: 0;
    transition: opacity 200ms;
  }

  /* Enhanced form styles */
  input[type="number"],
  input[type="text"],
  select,
  textarea {
    @apply px-3 py-2 text-sm text-gray-900 bg-white transition-colors duration-200;
  }

  input:focus,
  select:focus,
  textarea:focus {
    @apply outline-none ring-2 ring-secondary/20;
  }

  .form-group {
    @apply flex flex-col gap-1;
  }

  /* Validation styles */
  input.error,
  select.error,
  textarea.error {
    @apply border-red-300 focus:border-red-500 focus:ring-red-500;
  }

  .error-message {
    @apply text-sm text-red-500 mt-1;
  }

  /* Quiz modal styles */
  .quiz-container {
    width: 100%;
    min-height: calc(100vh - 250px);
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }
  
  /* Ensure modal scrolls properly on mobile */
  @media (max-width: 640px) {
    .quiz-container {
      min-height: calc(100vh - 200px);
      border-radius: 0;
    }
  }

  /* Modal animation */
  .modal-enter {
    animation: modalEnter 0.3s ease-out;
  }

  @keyframes modalEnter {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style> 