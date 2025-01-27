<!-- Feature Value Calculator Component -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import CurrencySelector from '$lib/components/ui/CurrencySelector.svelte';
  import { currencyStore } from '$lib/stores/currencyStore';

  // Types
  interface ValueObjective {
    name: string;
    type: 'generate' | 'protect' | 'reduce' | 'avoid';
    value: number;
    details: {
      [key: string]: number;
    };
  }

  // Wizard state
  let currentStep = 1;
  const TOTAL_STEPS = 4;
  let projectName = '';
  let projectDescription = '';

  // Form data
  let objectives: ValueObjective[] = [];
  let developmentCost = {
    hourlyRate: 0,
    hours: 0
  };
  let maintenanceCost = {
    monthly: 0
  };

  // Confidence score (0-100)
  $: confidenceScore = calculateConfidenceScore();

  function calculateConfidenceScore(): number {
    let score = 0;
    
    // Project info completeness (20%)
    if (projectName) score += 10;
    if (projectDescription) score += 10;
    
    // Objectives completeness (40%)
    if (objectives.length > 0) {
      score += Math.min(objectives.length * 10, 40);
    }
    
    // Costs completeness (40%)
    if (developmentCost.hourlyRate > 0) score += 20;
    if (developmentCost.hours > 0) score += 10;
    if (maintenanceCost.monthly > 0) score += 10;
    
    return score;
  }

  // Template objectives
  const objectiveTemplates = {
    generate: {
      name: "New Revenue Stream",
      details: {
        revenuePerUnit: 100,
        unitsSold: 100,
        frequency: 12
      }
    },
    protect: {
      name: "Customer Retention",
      details: {
        revenueAtRisk: 10000,
        retentionImprovement: 15
      }
    },
    reduce: {
      name: "Process Optimization",
      details: {
        timeSaved: 30,
        users: 10,
        frequency: 52,
        hourlyRate: 50
      }
    },
    avoid: {
      name: "Risk Mitigation",
      details: {
        potentialCost: 50000,
        probability: 30,
        riskReduction: 80
      }
    }
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

  // Add tooltip component
  let showTooltip = false;
  let tooltipContent = '';
  let tooltipX = 0;
  let tooltipY = 0;

  function showHelpTooltip(event: MouseEvent, content: string) {
    tooltipContent = content;
    tooltipX = event.clientX;
    tooltipY = event.clientY;
    showTooltip = true;
  }

  function hideTooltip() {
    showTooltip = false;
  }

  // Help text content
  const helpText = {
    generate: {
      title: "Generate Revenue",
      description: "Calculate new revenue streams from feature adoption",
      formula: "Annual Value = Revenue per Unit × Units Sold × Annual Frequency",
      example: "Example: A new feature priced at $100, sold to 100 customers monthly = $120,000 annually"
    },
    protect: {
      title: "Protect Revenue",
      description: "Calculate the value of retaining existing revenue",
      formula: "Annual Value = Revenue at Risk × Retention Improvement %",
      example: "Example: $100,000 at risk with 15% improvement = $15,000 saved annually"
    },
    reduce: {
      title: "Reduce Costs",
      description: "Calculate savings from improved efficiency",
      formula: "Annual Value = (Time Saved × Users × Frequency × Hourly Rate) / 60",
      example: "Example: 30 min saved weekly for 10 users at $50/hr = $13,000 annually"
    },
    avoid: {
      title: "Avoid Costs",
      description: "Calculate value from risk mitigation",
      formula: "Annual Value = Potential Cost × Probability % × Risk Reduction %",
      example: "Example: $50,000 risk at 30% probability, reduced by 80% = $12,000 value"
    }
  };

  function addObjective() {
    objectives = [...objectives, {
      name: "",
      type: 'generate',
      value: 0,
      details: {}
    }];
  }

  function removeObjective(index: number) {
    objectives = objectives.filter((_, i) => i !== index);
  }

  // Calculate values based on objective type
  function calculateObjectiveValue(objective: ValueObjective): number {
    switch (objective.type) {
      case 'generate':
        return (objective.details.revenuePerUnit || 0) * 
               (objective.details.unitsSold || 0) * 
               (objective.details.frequency || 0);
      
      case 'protect':
        return (objective.details.revenueAtRisk || 0) * 
               ((objective.details.retentionImprovement || 0) / 100);
      
      case 'reduce':
        if (objective.details.timeSaved) {
          return ((objective.details.timeSaved / 60) * 
                 (objective.details.users || 0) * 
                 (objective.details.frequency || 0) * 
                 (objective.details.hourlyRate || 0));
        }
        return 0;
      
      case 'avoid':
        return (objective.details.potentialCost || 0) * 
               ((objective.details.probability || 0) / 100) * 
               ((objective.details.riskReduction || 0) / 100);
      
      default:
        return 0;
    }
  }

  // Calculated values
  $: objectives.forEach(obj => {
    obj.value = calculateObjectiveValue(obj);
  });
  
  $: totalValue = objectives.reduce((sum, obj) => sum + obj.value, 0) || 0;
  $: initialCost = (developmentCost.hourlyRate * developmentCost.hours) || 0;
  $: annualMaintenance = (maintenanceCost.monthly * 12) || 0;
  $: totalCost = initialCost + annualMaintenance || 0;
  $: roi = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  $: breakEvenMonths = totalValue > 0 ? (initialCost / (totalValue / 12)) : 0;

  let roiChart: Chart;
  let breakEvenChart: Chart;
  let valueDistributionChart: Chart;

  // Debounce chart updates to prevent excessive redraws
  let updateChartsTimeout: NodeJS.Timeout;
  
  function debouncedUpdateCharts() {
    if (updateChartsTimeout) clearTimeout(updateChartsTimeout);
    updateChartsTimeout = setTimeout(updateCharts, 250);
  }

  // Function to calculate and show results
  function calculateResults() {
    hasCalculated = true;
    showResults = true;
    // Force charts to update with a small delay to ensure DOM is ready
    setTimeout(() => {
      updateCharts();
    }, 100);
  }

  // Modify value formatting to use current currency
  function formatMoney(value: number): string {
    return `${currencySymbol}${(value * currencyMultiplier).toLocaleString()}`;
  }

  // Modify the updateCharts function
  function updateCharts() {
    if (!hasCalculated || !showResults) return;

    if (roiChart) roiChart.destroy();
    if (breakEvenChart) breakEvenChart.destroy();
    if (valueDistributionChart) valueDistributionChart.destroy();

    // Only create charts if we have some data
    if (totalValue === 0 && totalCost === 0) return;

    // ROI Chart
    const roiCtx = document.getElementById('roiChart') as HTMLCanvasElement;
    if (roiCtx) {
      roiChart = new Chart(roiCtx, {
        type: 'bar',
        data: {
          labels: ['Total Cost', 'Annual Value'],
          datasets: [{
            data: [totalCost || 0, totalValue || 0].map(v => v * currencyMultiplier),
            backgroundColor: ['#FDA4AF', '#86EFAC'],
            borderRadius: 6,
            maxBarThickness: 50
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                display: false
              },
              ticks: {
                callback: (value) => `${currencySymbol}${value.toLocaleString()}`
              }
            },
            y: {
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = (context.raw as number || 0);
                  return `${currencySymbol}${value.toLocaleString()}`;
                }
              }
            }
          }
        }
      });
    }

    // Break-even Chart
    const breakEvenCtx = document.getElementById('breakEvenChart') as HTMLCanvasElement;
    if (breakEvenCtx) {
      const months = Array.from({ length: 24 }, (_, i) => i + 1);
      const monthlyValue = totalValue / 12;
      const monthlyCost = annualMaintenance / 12;
      
      const costs = months.map(m => {
        if (m === 1) return (initialCost + monthlyCost) * currencyMultiplier;
        return (initialCost + (monthlyCost * m)) * currencyMultiplier;
      });
      
      const values = months.map(m => (monthlyValue * m) * currencyMultiplier);

      breakEvenChart = new Chart(breakEvenCtx, {
        type: 'line',
        data: {
          labels: months.map(m => `Month ${m}`),
          datasets: [
            {
              label: 'Cumulative Cost',
              data: costs,
              borderColor: '#FDA4AF',
              backgroundColor: '#FDA4AF20',
              fill: true,
              tension: 0.1,
              pointRadius: 0,
              borderWidth: 2,
              pointHoverRadius: 0,
              pointHitRadius: 0,
              datalabels: {
                display: false
              }
            },
            {
              label: 'Cumulative Value',
              data: values,
              borderColor: '#86EFAC',
              backgroundColor: '#86EFAC20',
              fill: true,
              tension: 0.1,
              pointRadius: 0,
              borderWidth: 2,
              pointHoverRadius: 0,
              pointHitRadius: 0,
              datalabels: {
                display: false
              }
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
              callbacks: {
                label: (context) => {
                  const value = context.raw as number || 0;
                  return `${context.dataset.label}: ${currencySymbol}${value.toLocaleString()}`;
                }
              }
            },
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                boxWidth: 6,
                boxHeight: 6,
                padding: 20,
                font: {
                  size: 12
                }
              }
            },
            datalabels: {
              display: false // Globally disable data labels
            }
          },
          hover: {
            mode: 'nearest',
            intersect: false
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                maxTicksLimit: 6,
                font: {
                  size: 11
                }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: '#f1f5f9'
              },
              ticks: {
                maxTicksLimit: 6,
                callback: (tickValue) => {
                  const value = Number(tickValue);
                  if (value >= 1000000) {
                    return `${currencySymbol}${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `${currencySymbol}${(value / 1000).toFixed(0)}K`;
                  }
                  return `${currencySymbol}${value}`;
                },
                font: {
                  size: 11
                }
              }
            }
          }
        }
      });
    }

    // Value Distribution Chart
    const valueDistCtx = document.getElementById('valueDistributionChart') as HTMLCanvasElement;
    if (valueDistCtx) {
      const objectivesByType = {
        generate: objectives.filter(o => o.type === 'generate').reduce((sum, o) => sum + (o.value || 0), 0) * currencyMultiplier,
        protect: objectives.filter(o => o.type === 'protect').reduce((sum, o) => sum + (o.value || 0), 0) * currencyMultiplier,
        reduce: objectives.filter(o => o.type === 'reduce').reduce((sum, o) => sum + (o.value || 0), 0) * currencyMultiplier,
        avoid: objectives.filter(o => o.type === 'avoid').reduce((sum, o) => sum + (o.value || 0), 0) * currencyMultiplier
      };

      valueDistributionChart = new Chart(valueDistCtx, {
        type: 'doughnut',
        data: {
          labels: ['Generate Revenue', 'Protect Revenue', 'Reduce Costs', 'Avoid Costs'],
          datasets: [{
            data: [
              objectivesByType.generate || 0,
              objectivesByType.protect || 0,
              objectivesByType.reduce || 0,
              objectivesByType.avoid || 0
            ],
            backgroundColor: [
              '#86EFAC', // green for generate
              '#93C5FD', // blue for protect
              '#FDA4AF', // red for reduce
              '#FCD34D'  // yellow for avoid
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 15,
                padding: 15
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw as number || 0;
                  const total = Object.values(objectivesByType).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                  return `${context.label}: ${currencySymbol}${value.toLocaleString()} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

  // Form validation
  interface ValidationError {
    field: string;
    message: string;
  }

  let errors: ValidationError[] = [];
  let touched: { [key: string]: boolean } = {};

  function validateField(field: string, value: any): string | null {
    switch (field) {
      case 'projectName':
        return !value ? 'Project name is required' : null;
      case 'revenuePerUnit':
      case 'hourlyRate':
        return value < 0 ? 'Value must be positive' : null;
      case 'probability':
      case 'riskReduction':
      case 'retentionImprovement':
        return value < 0 || value > 100 ? 'Percentage must be between 0 and 100' : null;
      default:
        return null;
    }
  }

  function validateForm(): boolean {
    errors = [];
    
    // Validate project info
    if (currentStep === 1) {
      const nameError = validateField('projectName', projectName);
      if (nameError) errors.push({ field: 'projectName', message: nameError });
    }
    
    // Validate objectives
    if (currentStep === 2) {
      objectives.forEach((obj, index) => {
        if (!obj.name) {
          errors.push({ field: `objective-${index}-name`, message: 'Name is required' });
        }
        
        // Validate based on objective type
        switch (obj.type) {
          case 'generate':
            if (obj.details.revenuePerUnit < 0) {
              errors.push({ field: `objective-${index}-revenue`, message: 'Revenue must be positive' });
            }
            break;
          case 'protect':
            if (obj.details.retentionImprovement < 0 || obj.details.retentionImprovement > 100) {
              errors.push({ field: `objective-${index}-retention`, message: 'Percentage must be between 0 and 100' });
            }
            break;
          // ... similar validation for other types
        }
      });
    }
    
    // Validate development costs
    if (currentStep === 3) {
      if (developmentCost.hourlyRate < 0) {
        errors.push({ field: 'hourlyRate', message: 'Hourly rate must be positive' });
      }
      if (developmentCost.hours < 0) {
        errors.push({ field: 'hours', message: 'Hours must be positive' });
      }
    }
    
    return errors.length === 0;
  }

  function handleNext() {
    if (validateForm()) {
      if (currentStep < TOTAL_STEPS) {
        currentStep++;
        if (currentStep === TOTAL_STEPS) {
          // Automatically show results when reaching the last step
          showResults = true;
          hasCalculated = true;
          setTimeout(() => {
            updateCharts();
          }, 100);
        }
      }
    }
  }

  // Input formatting helpers
  function formatPercentage(value: number): string {
    return `${value}%`;
  }

  function formatDuration(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  }

  function addObjectiveFromTemplate(type: 'generate' | 'protect' | 'reduce' | 'avoid') {
    const template = objectiveTemplates[type];
    objectives = [...objectives, {
      name: template.name,
      type: type,
      value: 0,
      details: { ...template.details }
    }];
  }

  // Add insights generation
  function generateInsights(): string[] {
    const insights: string[] = [];
    
    // ROI insights
    const roiValue = Number(roi);
    if (roiValue > 100) {
      insights.push(`Exceptional ROI of ${roiValue.toFixed(1)}% indicates this is a highly profitable investment.`);
    } else if (roiValue > 50) {
      insights.push(`Strong ROI of ${roiValue.toFixed(1)}% suggests this is a worthwhile investment.`);
    } else if (roiValue > 0) {
      insights.push(`Positive ROI of ${roiValue.toFixed(1)}% indicates this investment will generate returns, but consider ways to improve value or reduce costs.`);
    } else {
      insights.push(`The current ROI of ${roiValue.toFixed(1)}% suggests this investment needs optimization. Consider ways to increase value or reduce costs.`);
    }

    // Break-even insights
    const breakEvenValue = Number(breakEvenMonths);
    if (breakEvenValue < 6) {
      insights.push(`Quick break-even period of ${breakEvenValue.toFixed(1)} months indicates rapid value realization.`);
    } else if (breakEvenValue < 12) {
      insights.push(`Break-even within ${breakEvenValue.toFixed(1)} months suggests moderate time to value.`);
    } else {
      insights.push(`Long break-even period of ${breakEvenValue.toFixed(1)} months. Consider ways to accelerate value delivery.`);
    }

    // Value distribution insights
    const valueTypes = objectives.reduce((acc, obj) => {
      acc[obj.type] = (acc[obj.type] || 0) + obj.value;
      return acc;
    }, {} as Record<string, number>);

    const topValueType = Object.entries(valueTypes).sort((a, b) => b[1] - a[1])[0];
    if (topValueType) {
      const [type, value] = topValueType;
      const percentage = ((value / totalValue) * 100).toFixed(1);
      insights.push(`${percentage}% of value comes from ${type} objectives. ${
        Number(percentage) > 70 ? 'Consider diversifying value streams.' : 'This shows a balanced value distribution.'
      }`);
    }

    // Cost structure insights
    const maintenanceRatio = (annualMaintenance / totalCost) * 100;
    if (maintenanceRatio > 50) {
      insights.push(`High maintenance costs (${maintenanceRatio.toFixed(1)}% of total cost). Consider ways to reduce ongoing costs.`);
    }

    return insights;
  }

  // Add new state for onboarding
  let showOnboarding = true;
  let currentOnboardingStep = 1;
  const ONBOARDING_STEPS = 4;

  function completeOnboarding() {
    showOnboarding = false;
  }

  function skipOnboarding() {
    showOnboarding = false;
  }

  onMount(() => {
    updateCharts();
  });
</script>

<!-- Tooltip Component -->
{#if showTooltip}
  <div
    class="fixed z-50 max-w-xs bg-gray-900 text-white p-4 rounded-lg shadow-lg text-sm"
    style="left: {tooltipX + 10}px; top: {tooltipY + 10}px;"
  >
    <div class="space-y-2">
      <h4 class="font-semibold">{tooltipContent}</h4>
      {#if helpText[tooltipContent.toLowerCase() as keyof typeof helpText]}
        <p class="text-gray-300">{helpText[tooltipContent.toLowerCase() as keyof typeof helpText].formula}</p>
        <p class="text-gray-400 text-xs">{helpText[tooltipContent.toLowerCase() as keyof typeof helpText].example}</p>
      {/if}
    </div>
  </div>
{/if}

<div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
  <!-- Progress Bar -->
  <div class="bg-white rounded-xl shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold">Feature Value Calculator</h2>
      <CurrencySelector />
    </div>
    
    <div class="relative pt-1">
      <div class="flex mb-2 items-center justify-between">
        <div>
          <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-secondary bg-secondary/10">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
        </div>
        <div class="text-right">
          <span class="text-xs font-semibold inline-block text-secondary">
            {Math.round((currentStep / TOTAL_STEPS) * 100)}%
          </span>
        </div>
      </div>
      <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-secondary/10">
        <div
          style="width: {(currentStep / TOTAL_STEPS) * 100}%"
          class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary transition-all duration-500"
        ></div>
      </div>
    </div>

    <!-- Step 1: Project Info -->
    {#if currentStep === 1}
      <div class="space-y-6 animate-fade-in">
        <h3 class="text-xl font-semibold">Project Information</h3>
        <div class="space-y-4">
          <div class="form-group">
            <label class="text-sm font-medium text-gray-700" for="projectName">
              Project Name
              <span class="text-red-500">*</span>
            </label>
            <input
              id="projectName"
              type="text"
              class="w-full rounded-lg border-gray-300 focus:border-secondary focus:ring-secondary"
              class:border-red-300={errors.some(e => e.field === 'projectName')}
              placeholder="e.g., Customer Dashboard Redesign"
              bind:value={projectName}
              on:blur={() => touched.projectName = true}
            />
            {#if touched.projectName && errors.some(e => e.field === 'projectName')}
              <p class="text-sm text-red-500 mt-1">
                {errors.find(e => e.field === 'projectName')?.message}
              </p>
            {/if}
          </div>
          
          <div class="form-group">
            <label class="text-sm font-medium text-gray-700" for="projectDescription">
              Description
              <span class="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="projectDescription"
              class="w-full rounded-lg border-gray-300 focus:border-secondary focus:ring-secondary"
              rows="3"
              placeholder="Brief description of the feature and its goals"
              bind:value={projectDescription}
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">
              Tip: Include the main problem this feature solves and its target users
            </p>
          </div>
        </div>
      </div>

    <!-- Step 2: Value Objectives -->
    {:else if currentStep === 2}
      <!-- Onboarding Modal -->
      {#if showOnboarding}
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div class="bg-white rounded-xl max-w-2xl w-full mx-4 p-6 space-y-6">
            <div class="flex justify-between items-center">
              <h3 class="text-xl font-semibold">Understanding Value Types</h3>
              <button 
                class="text-gray-400 hover:text-gray-600"
                on:click={skipOnboarding}
              >
                Skip Tutorial
              </button>
            </div>

            <!-- Onboarding Content -->
            <div class="space-y-6">
              {#if currentOnboardingStep === 1}
                <div class="space-y-4">
                  <div class="flex items-center gap-4">
                    <span class="text-3xl">💰</span>
                    <div>
                      <h4 class="font-semibold text-lg">Generate Revenue</h4>
                      <p class="text-gray-600">New revenue from additional sales or customers</p>
                    </div>
                  </div>
                  <div class="bg-green-50 rounded-lg p-4 text-sm">
                    <p class="font-medium">Example:</p>
                    <p>A new premium feature that customers will pay extra for, generating $100/month from 100 customers</p>
                  </div>
                </div>
              {:else if currentOnboardingStep === 2}
                <div class="space-y-4">
                  <div class="flex items-center gap-4">
                    <span class="text-3xl">🛡️</span>
                    <div>
                      <h4 class="font-semibold text-lg">Protect Revenue</h4>
                      <p class="text-gray-600">Retain existing customers and revenue</p>
                    </div>
                  </div>
                  <div class="bg-blue-50 rounded-lg p-4 text-sm">
                    <p class="font-medium">Example:</p>
                    <p>Improving a feature to prevent customer churn, protecting $50,000 in annual revenue</p>
                  </div>
                </div>
              {:else if currentOnboardingStep === 3}
                <div class="space-y-4">
                  <div class="flex items-center gap-4">
                    <span class="text-3xl">⚡</span>
                    <div>
                      <h4 class="font-semibold text-lg">Reduce Costs</h4>
                      <p class="text-gray-600">Lower operational expenses</p>
                    </div>
                  </div>
                  <div class="bg-amber-50 rounded-lg p-4 text-sm">
                    <p class="font-medium">Example:</p>
                    <p>Automating a manual process to save 2 hours per week for 10 employees</p>
                  </div>
                </div>
              {:else if currentOnboardingStep === 4}
                <div class="space-y-4">
                  <div class="flex items-center gap-4">
                    <span class="text-3xl">⚠️</span>
                    <div>
                      <h4 class="font-semibold text-lg">Avoid Costs</h4>
                      <p class="text-gray-600">Prevent future expenses or risks</p>
                    </div>
                  </div>
                  <div class="bg-red-50 rounded-lg p-4 text-sm">
                    <p class="font-medium">Example:</p>
                    <p>Implementing security features to avoid potential $100,000 in breach-related costs</p>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Navigation -->
            <div class="flex justify-between items-center pt-4 border-t">
              <div class="flex gap-1">
                {#each Array(ONBOARDING_STEPS) as _, i}
                  <div 
                    class="w-2 h-2 rounded-full transition-colors"
                    class:bg-secondary={currentOnboardingStep === i + 1}
                    class:bg-gray-200={currentOnboardingStep !== i + 1}
                  ></div>
                {/each}
              </div>
              <div class="flex gap-4">
                {#if currentOnboardingStep > 1}
                  <button 
                    class="px-4 py-2 text-gray-600 hover:text-gray-800"
                    on:click={() => currentOnboardingStep--}
                  >
                    Previous
                  </button>
                {/if}
                {#if currentOnboardingStep < ONBOARDING_STEPS}
                  <button 
                    class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90"
                    on:click={() => currentOnboardingStep++}
                  >
                    Next
                  </button>
                {:else}
                  <button 
                    class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90"
                    on:click={completeOnboarding}
                  >
                    Get Started
                  </button>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}

      <div class="space-y-2">
        <h3 class="text-xl font-semibold">Value Objectives</h3>
        <p class="text-sm text-gray-600">How will this feature create value? Select one or more value types below.</p>
      </div>

      <!-- New Value Type Selection -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Left Column: Value Type Selection -->
        <div class="space-y-4">
          <div class="bg-white rounded-xl border border-gray-200 divide-y">
            {#each Object.entries(helpText) as [type, help]}
              <button
                class="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors group relative"
                on:click={() => addObjectiveFromTemplate(type as 'generate' | 'protect' | 'reduce' | 'avoid')}
              >
                <div 
                  class="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                  class:bg-green-100={type === 'generate'}
                  class:group-hover:bg-green-200={type === 'generate'}
                  class:bg-blue-100={type === 'protect'}
                  class:group-hover:bg-blue-200={type === 'protect'}
                  class:bg-amber-100={type === 'reduce'}
                  class:group-hover:bg-amber-200={type === 'reduce'}
                  class:bg-red-100={type === 'avoid'}
                  class:group-hover:bg-red-200={type === 'avoid'}
                >
                  <span class="text-2xl">
                    {#if type === 'generate'}💰
                    {:else if type === 'protect'}🛡️
                    {:else if type === 'reduce'}⚡
                    {:else}⚠️{/if}
                  </span>
                </div>
                <div class="flex-1 text-left">
                  <h4 class="font-semibold">{help.title}</h4>
                  <p class="text-sm text-gray-600">{help.description}</p>
                </div>
                <div 
                  class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors"
                  class:border-green-200={type === 'generate'}
                  class:group-hover:border-green-400={type === 'generate'}
                  class:border-blue-200={type === 'protect'}
                  class:group-hover:border-blue-400={type === 'protect'}
                  class:border-amber-200={type === 'reduce'}
                  class:group-hover:border-amber-400={type === 'reduce'}
                  class:border-red-200={type === 'avoid'}
                  class:group-hover:border-red-400={type === 'avoid'}
                >
                  <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Right Column: Added Objectives -->
        <div class="space-y-4">
          {#if objectives.length === 0}
            <div class="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
              <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h4 class="font-medium text-gray-900 mb-2">No objectives added yet</h4>
              <p class="text-sm text-gray-600">Select a value type from the left to add your first objective</p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each objectives as objective, i}
                <div class="relative bg-white rounded-lg border border-gray-200 p-4 hover:border-secondary/20 transition-colors">
                  <!-- Header with Type and Remove -->
                  <div class="flex items-center justify-between gap-4 pb-3 border-b">
                    <div class="flex items-center gap-2">
                      <div 
                        class="w-10 h-10 rounded-full flex items-center justify-center"
                        class:bg-green-100={objective.type === 'generate'}
                        class:bg-blue-100={objective.type === 'protect'}
                        class:bg-amber-100={objective.type === 'reduce'}
                        class:bg-red-100={objective.type === 'avoid'}
                      >
                        <span class="text-xl">
                          {#if objective.type === 'generate'}💰
                          {:else if objective.type === 'protect'}🛡️
                          {:else if objective.type === 'reduce'}⚡
                          {:else}⚠️{/if}
                        </span>
                      </div>
                      <div>
                        <input
                          type="text"
                          class="w-full bg-transparent border-none p-0 font-medium text-lg focus:ring-0"
                          placeholder="Name your objective"
                          bind:value={objective.name}
                        />
                        <span class="text-sm text-gray-500">
                          {#if objective.type === 'generate'}
                            Generate Revenue
                          {:else if objective.type === 'protect'}
                            Protect Revenue
                          {:else if objective.type === 'reduce'}
                            Reduce Costs
                          {:else}
                            Avoid Costs
                          {/if}
                        </span>
                      </div>
                    </div>
                    <button
                      class="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                      on:click={() => removeObjective(i)}
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <!-- Dynamic Input Fields Based on Type -->
                  <div class="mt-4">
                    {#if objective.type === 'generate'}
                      <div class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div class="form-group">
                            <label class="text-sm font-medium text-gray-600">Revenue Per Unit</label>
                            <div class="relative">
                              <input
                                type="number"
                                class="w-full pl-8 py-2 text-sm bg-white rounded-lg border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                                placeholder="0"
                                bind:value={objective.details.revenuePerUnit}
                              />
                              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {currencySymbol}
                              </span>
                            </div>
                          </div>
                          <div class="form-group">
                            <label class="text-sm font-medium text-gray-600">Units Sold</label>
                            <input
                              type="number"
                              class="w-full py-2 text-sm bg-white rounded-lg border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              placeholder="0"
                              bind:value={objective.details.unitsSold}
                            />
                          </div>
                          <div class="form-group">
                            <label class="text-sm font-medium text-gray-600">Frequency</label>
                            <select
                              class="w-full py-2 text-sm bg-white rounded-lg border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              bind:value={objective.details.frequency}
                            >
                              <option value="1">Yearly</option>
                              <option value="4">Quarterly</option>
                              <option value="12">Monthly</option>
                              <option value="52">Weekly</option>
                            </select>
                          </div>
                        </div>
                        <p class="text-sm text-gray-500">
                          Expected revenue from new sales or customers, calculated as revenue per unit × units sold × frequency
                        </p>
                      </div>
                    {:else if objective.type === 'protect'}
                      <div class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div class="form-group">
                            <label class="text-sm font-medium text-gray-600">Revenue at Risk</label>
                            <div class="relative">
                              <input
                                type="number"
                                class="w-full pl-8 py-2 text-sm bg-white rounded-lg border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                                placeholder="0"
                                bind:value={objective.details.revenueAtRisk}
                              />
                              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {currencySymbol}
                              </span>
                            </div>
                          </div>
                          <div class="form-group">
                            <label class="text-sm font-medium text-gray-600">Retention Improvement</label>
                            <div class="relative">
                              <input
                                type="number"
                                class="w-full pr-8 py-2 text-sm bg-white rounded-lg border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                                placeholder="0"
                                bind:value={objective.details.retentionImprovement}
                              />
                              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                            </div>
                          </div>
                        </div>
                        <p class="text-sm text-gray-500">
                          Value from retaining existing revenue, calculated as revenue at risk × retention improvement percentage
                        </p>
                      </div>
                    {:else if objective.type === 'reduce'}
                      <div class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div class="form-group">
                            <label class="text-sm font-medium text-gray-600">Time Saved</label>
                            <div class="relative">
                              <input
                                type="number"
                                class="w-full pr-12 py-2 text-sm bg-white rounded-lg border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                                placeholder="0"
                                bind:value={objective.details.timeSaved}
                              />
                              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">min</span>
                            </div>
                          </div>
                          <div class="form-group">
                            <label class="text-sm font-medium text-gray-600">Users Affected</label>
                            <input
                              type="number"
                              class="w-full py-2 text-sm bg-white rounded-lg border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              placeholder="0"
                              bind:value={objective.details.users}
                            />
                          </div>
                          <div class="form-group">
                            <label class="text-sm font-medium text-gray-600">Frequency</label>
                            <select
                              class="w-full py-2 text-sm bg-white rounded-lg border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              bind:value={objective.details.frequency}
                            >
                              <option value="1">Yearly</option>
                              <option value="4">Quarterly</option>
                              <option value="12">Monthly</option>
                              <option value="52">Weekly</option>
                            </select>
                          </div>
                        </div>
                        <p class="text-sm text-gray-500">
                          Cost savings from improved efficiency, calculated as (time saved × users × frequency × hourly rate) / 60
                        </p>
                      </div>
                    {:else if objective.type === 'avoid'}
                      <div class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div class="form-group">
                            <label class="text-sm font-medium text-gray-600">Potential Cost</label>
                            <div class="relative">
                              <input
                                type="number"
                                class="w-full pl-8 py-2 text-sm bg-white rounded-lg border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                                placeholder="0"
                                bind:value={objective.details.potentialCost}
                              />
                              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {currencySymbol}
                              </span>
                            </div>
                          </div>
                          <div class="form-group">
                            <label class="text-sm font-medium text-gray-600">Probability</label>
                            <div class="relative">
                              <input
                                type="number"
                                class="w-full pr-8 py-2 text-sm bg-white rounded-lg border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                                placeholder="0"
                                bind:value={objective.details.probability}
                              />
                              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                            </div>
                          </div>
                          <div class="form-group">
                            <label class="text-sm font-medium text-gray-600">Risk Reduction</label>
                            <div class="relative">
                              <input
                                type="number"
                                class="w-full pr-8 py-2 text-sm bg-white rounded-lg border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                                placeholder="0"
                                bind:value={objective.details.riskReduction}
                              />
                              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                            </div>
                          </div>
                        </div>
                        <p class="text-sm text-gray-500">
                          Value from risk mitigation, calculated as potential cost × probability × risk reduction percentage
                        </p>
                      </div>
                    {/if}
                  </div>

                  <!-- Value Summary -->
                  <div class="mt-4 pt-3 border-t flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-gray-600">Annual Value:</span>
                      <span class="text-lg font-semibold text-secondary">{formatMoney(objective.value)}</span>
                    </div>
                    <button 
                      class="text-sm text-gray-500 hover:text-secondary flex items-center gap-1"
                      on:mouseenter={(e) => showHelpTooltip(e, objective.type)}
                      on:mouseleave={hideTooltip}
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      View Formula
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

    <!-- Step 3: Development Costs -->
    {:else if currentStep === 3}
      <div class="space-y-6 animate-fade-in">
        <h3 class="text-xl font-semibold">Development & Maintenance</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="space-y-4">
            <h4 class="text-base font-medium text-gray-800">Initial Development</h4>
            <div class="form-group">
              <label class="text-sm text-gray-600">Hourly Rate ({currencySymbol})</label>
              <div class="relative">
                <input
                  type="number"
                  class="w-full rounded-lg border-gray-300 pr-12"
                  bind:value={developmentCost.hourlyRate}
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{currencySymbol}</span>
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
            <div class="bg-white p-3 rounded-lg border border-gray-200">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-600">Total:</span>
                <span class="text-base font-semibold text-red-400">{formatMoney(initialCost)}</span>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h4 class="text-base font-medium text-gray-800">Maintenance</h4>
            <div class="form-group">
              <label class="text-sm text-gray-600">Monthly Cost ({currencySymbol})</label>
              <div class="relative">
                <input
                  type="number"
                  class="w-full rounded-lg border-gray-300 pr-12"
                  bind:value={maintenanceCost.monthly}
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{currencySymbol}</span>
              </div>
            </div>
            <div class="bg-white p-3 rounded-lg border border-gray-200">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-600">Annual:</span>
                <span class="text-base font-semibold text-red-400">{formatMoney(annualMaintenance)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- Step 4: Results -->
    {:else if currentStep === 4}
      <div class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-xl font-semibold">{projectName || 'Untitled Project'}</h3>
            {#if projectDescription}
              <p class="text-sm text-gray-600 mt-1">{projectDescription}</p>
            {/if}
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Confidence Score:</span>
            <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full transition-all duration-500"
                class:bg-red-500={confidenceScore < 40}
                class:bg-yellow-500={confidenceScore >= 40 && confidenceScore < 70}
                class:bg-green-500={confidenceScore >= 70}
                style="width: {confidenceScore}%"
              ></div>
            </div>
            <span class="text-sm font-medium">{confidenceScore}%</span>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-gradient-to-br from-green-50 to-white p-4 rounded-lg border border-green-200">
            <div class="text-sm font-medium text-gray-600">Annual Value</div>
            <div class="text-xl font-bold text-green-500 mt-1">{formatMoney(totalValue)}</div>
            <div class="text-xs text-gray-500 mt-1">Total value generated annually</div>
          </div>

          <div class="bg-gradient-to-br from-rose-50 to-white p-4 rounded-lg border border-rose-200">
            <div class="text-sm font-medium text-gray-600">First Year Cost</div>
            <div class="text-xl font-bold text-rose-500 mt-1">{formatMoney(totalCost)}</div>
            <div class="text-xs text-gray-500 mt-1">Initial investment and maintenance</div>
          </div>

          <div class="bg-gradient-to-br from-sky-50 to-white p-4 rounded-lg border border-sky-200">
            <div class="text-sm font-medium text-gray-600">ROI</div>
            <div class="text-xl font-bold text-sky-500 mt-1">{roi.toFixed(1)}%</div>
            <div class="text-xs text-gray-500 mt-1">Return on investment ratio</div>
          </div>

          <div class="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg border border-purple-200">
            <div class="text-sm font-medium text-gray-600">Break-even</div>
            <div class="text-xl font-bold text-purple-500 mt-1">{breakEvenMonths.toFixed(1)} months</div>
            <div class="text-xs text-gray-500 mt-1">Time to recover investment</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div class="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200 hover:border-secondary/20 transition-all duration-300">
            <h4 class="text-lg font-semibold mb-4">Cost vs Value Comparison</h4>
            <div class="h-[300px]">
              <canvas id="roiChart"></canvas>
            </div>
          </div>
          
          <div class="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200 hover:border-secondary/20 transition-all duration-300">
            <h4 class="text-lg font-semibold mb-4">Break-even Timeline</h4>
            <div class="h-[300px]">
              <canvas id="breakEvenChart"></canvas>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200 hover:border-secondary/20 transition-all duration-300">
            <h4 class="text-lg font-semibold mb-4">Value Distribution</h4>
            <div class="h-[300px]">
              <canvas id="valueDistributionChart"></canvas>
            </div>
          </div>
          
          <div class="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200 hover:border-secondary/20 transition-all duration-300">
            <h4 class="text-lg font-semibold mb-4">Value Breakdown</h4>
            {#if objectives.length === 0}
              <p class="text-gray-600 text-center py-4">Add objectives to see their value breakdown</p>
            {:else}
              <div class="space-y-3">
                {#each objectives as objective}
                  <div class="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                    <div class="min-w-0 flex-1">
                      <span class="text-sm font-medium text-gray-900 truncate block">{objective.name || 'Unnamed Objective'}</span>
                      <span class="text-xs text-gray-500">({objective.type})</span>
                    </div>
                    <span class="text-sm font-semibold text-secondary ml-4">{formatMoney(objective.value)}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- New Insights Section -->
        <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 class="text-lg font-semibold mb-4">Key Insights</h4>
          <div class="space-y-3">
            {#each generateInsights() as insight}
              <div class="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <span class="text-secondary mt-0.5">💡</span>
                <p class="text-sm text-gray-700">{insight}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <!-- Enhanced Navigation -->
    <div class="flex justify-between items-center mt-8">
      <button
        class="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        disabled={currentStep === 1}
        on:click={() => currentStep--}
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>

      {#if currentStep < TOTAL_STEPS}
        <div class="flex items-center gap-2">
          {#if errors.length > 0}
            <span class="text-sm text-red-500">Please fix the errors before continuing</span>
          {/if}
          <button
            class="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={handleNext}
            disabled={errors.length > 0}
          >
            Next
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      {/if}
    </div>
  </div>
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
</style> 