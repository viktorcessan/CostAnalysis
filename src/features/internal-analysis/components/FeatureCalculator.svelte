<!-- Feature Value Calculator Component -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import CurrencySelector from '$lib/components/ui/CurrencySelector.svelte';
  import { currencyStore } from '$lib/stores/currencyStore';
  import { valueImpactStore, type ValueImpact } from '$lib/stores/valueImpactStore';

  // Types
  interface SelectedImpact {
    id: string;
    impact: ValueImpact;
    inputValues: { [key: string]: number };
    calculatedValue: number;
  }

  // Wizard state
  let currentStep = 0;
  const TOTAL_STEPS = 8;
  let projectName = '';

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
    'Project Info',
    'Value Categories',
    'Increase Revenue',
    'Protect Value', 
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

  // Calculate totals
  $: totalValue = selectedImpacts.reduce((sum, si) => sum + si.calculatedValue, 0);
  $: annualMaintenance = maintenanceCost.monthly * 12;
  $: developmentCostTotal = developmentCost.hourlyRate * developmentCost.hours;
  $: totalCost = developmentCostTotal + annualMaintenance;
  $: roi = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
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
        return !!projectName.trim();
      case 1:
        return true; // Can always proceed from overview
      case 2:
      case 3:
      case 4:
      case 5:
        return true; // Can proceed from value steps (they're optional)
      case 6:
        return developmentCost.hourlyRate > 0 && developmentCost.hours > 0; // Require basic cost info
      case 7:
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
    updateValueDistributionChart();
    updateCostBreakdownChart();
  }

  function updateValueDistributionChart() {
    const ctx = document.getElementById('valueDistributionChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Group values by category
    const valuesByCategory = selectedImpacts.reduce((acc, si) => {
      const category = si.impact.category;
      acc[category] = (acc[category] || 0) + si.calculatedValue;
      return acc;
    }, {} as { [key: string]: number });

    valueDistributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(valuesByCategory).map(category => 
          category.charAt(0).toUpperCase() + category.slice(1)
        ),
        datasets: [{
          data: Object.values(valuesByCategory),
          backgroundColor: [
            'rgba(34, 197, 94, 0.2)',  // generate - green
            'rgba(59, 130, 246, 0.2)', // protect - blue
            'rgba(245, 158, 11, 0.2)', // reduce - amber
            'rgba(239, 68, 68, 0.2)'   // avoid - red
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number || 0;
                const total = Object.values(valuesByCategory).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${context.label}: ${formatMoney(value)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  function updateCostBreakdownChart() {
    const ctx = document.getElementById('costBreakdownChart') as HTMLCanvasElement;
    if (!ctx) return;

    costBreakdownChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Development', 'Annual Maintenance'],
        datasets: [{
          data: [developmentCostTotal, annualMaintenance],
          backgroundColor: [
            'rgba(99, 102, 241, 0.2)',
            'rgba(168, 85, 247, 0.2)'
          ],
          borderColor: [
            'rgb(99, 102, 241)',
            'rgb(168, 85, 247)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number || 0;
                const total = developmentCostTotal + annualMaintenance;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${context.label}: ${formatMoney(value)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
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
    const valuesByCategory = selectedImpacts.reduce((acc, si) => {
      const category = si.impact.category;
      acc[category] = (acc[category] || 0) + si.calculatedValue;
      return acc;
    }, {} as { [key: string]: number });

    const topCategory = Object.entries(valuesByCategory)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topCategory) {
      const [category, value] = topCategory;
      const percentage = ((value / totalValue) * 100).toFixed(1);
      insights.push(`${percentage}% of value comes from ${category} impacts. ${
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

  function toggleCategory(category: keyof typeof impactsByCategory) {
    activeCategory = activeCategory === category ? null : category;
  }

  // Update navigation buttons
  $: showSkip = currentStep > 1 && currentStep < 6; // Only show skip for value category steps
  $: showNext = currentStep < TOTAL_STEPS - 1;
  $: nextButtonText = currentStep === 0 ? "Let's Start" : 
                     currentStep === 1 ? "Start Selection" :
                     currentStep === 6 ? "Calculate Results" :
                     "Next";

  // Update charts when entering results step
  $: if (currentStep === 7) {
    setTimeout(() => {
      updateCharts();
    }, 100);
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
          style="width: {(currentStep / (TOTAL_STEPS - 1)) * 100}%"
          class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary transition-all duration-500"
        ></div>
      </div>
    </div>

    <!-- Introduction Step -->
    {#if currentStep === 0}
      <div class="space-y-6 animate-fade-in">
        <h3 class="text-xl font-semibold">Welcome to the Feature Value Calculator</h3>
        <p class="text-gray-600">Let's start by gathering some basic information about your feature.</p>

        <div class="bg-gray-50 rounded-lg p-4">
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
                placeholder="e.g., Customer Dashboard Redesign"
                bind:value={projectName}
              />
            </div>
          </div>
        </div>
      </div>

    <!-- Value Categories Overview Step -->
    {:else if currentStep === 1}
      <div class="space-y-6 animate-fade-in">
        <h3 class="text-xl font-semibold">Understanding Value Categories</h3>
        <p class="text-gray-600">Select the types of value your feature will deliver:</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-6 rounded-lg border border-green-200 bg-green-50 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3 mb-4">
              <span class="text-2xl">📈</span>
              <h4 class="font-semibold text-green-800">Increase Revenue</h4>
            </div>
            <p class="text-sm text-gray-600 mb-6">New sales opportunities, revenue streams, and market expansion. Breakthrough features that excite customers or disrupt markets to grow your business footprint.</p>
            <div class="space-y-3">
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                  <svg class="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Market Expansion</span>
              </label>
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                  <svg class="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Platform & Partnership Revenue</span>
              </label>
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                  <svg class="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Premium Features</span>
              </label>
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                  <svg class="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Add-on Services</span>
              </label>
            </div>
          </div>

          <div class="p-6 rounded-lg border border-blue-200 bg-blue-50 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3 mb-4">
              <span class="text-2xl">🔒</span>
              <h4 class="font-semibold text-blue-800">Protect Revenue</h4>
            </div>
            <p class="text-sm text-gray-600 mb-6">Essential upkeep and competitive maintenance. The ongoing improvements needed to maintain your current market position and revenue streams.</p>
            <div class="space-y-3">
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                  <svg class="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Core Product Experience</span>
              </label>
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                  <svg class="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Platform Reliability</span>
              </label>
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                  <svg class="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Customer Success</span>
              </label>
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                  <svg class="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Competitive Position</span>
              </label>
            </div>
          </div>
          
          <div class="p-6 rounded-lg border border-amber-200 bg-amber-50 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3 mb-4">
              <span class="text-2xl">✂️</span>
              <h4 class="font-semibold text-amber-800">Reduce Costs</h4>
            </div>
            <p class="text-sm text-gray-600 mb-6">Currently active expenses that can be lowered. Direct savings through efficiency gains and process improvements in today's operations.</p>
            <div class="space-y-3">
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                  <svg class="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Operational Efficiency</span>
              </label>
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                  <svg class="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Infrastructure Optimization</span>
              </label>
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                  <svg class="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Support Load</span>
              </label>
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                  <svg class="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Development Velocity</span>
              </label>
            </div>
          </div>
          
          <div class="p-6 rounded-lg border border-red-200 bg-red-50 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3 mb-4">
              <span class="text-2xl">🛡️</span>
              <h4 class="font-semibold text-red-800">Avoid Costs</h4>
            </div>
            <p class="text-sm text-gray-600 mb-6">Future expenses and risks we can prevent today. Costs not yet on our books but likely to appear without preventive action.</p>
            <div class="space-y-3">
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
                  <svg class="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Risk Management</span>
              </label>
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
                  <svg class="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Technical Sustainability</span>
              </label>
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
                  <svg class="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Future-Proofing</span>
              </label>
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <div class="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
                  <svg class="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Disaster Prevention</span>
              </label>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-4 mt-6">
          <h4 class="font-semibold mb-2">What's Next:</h4>
          <ol class="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>We'll guide you through each value category</li>
            <li>Select relevant impacts for your feature</li>
            <li>Provide input values for calculations</li>
            <li>Skip categories that don't apply</li>
            <li>Review the total value analysis</li>
          </ol>
        </div>
      </div>

    <!-- Development & Maintenance Costs Step -->
    {:else if currentStep === 6}
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

    <!-- Increase Revenue Step -->
    {:else if currentStep === 2}
      <div class="space-y-6 animate-fade-in">
        <div class="flex items-center gap-3">
          <span class="text-3xl">📈</span>
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
                              class:pl-8={input.type === 'currency'}
                              class:pr-8={input.type === 'percentage'}
                              placeholder="0"
                              value={selectedImpact.inputValues[input.name]}
                              on:input={(e) => updateImpactInput(selectedImpact.id, input.name, +e.currentTarget.value)}
                            />
                            {#if input.type === 'currency'}
                              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                      
    <!-- Protect Value Step -->
    {:else if currentStep === 3}
      <div class="space-y-6 animate-fade-in">
        <div class="flex items-center gap-3">
          <span class="text-3xl">🔒</span>
          <div>
            <h3 class="text-xl font-semibold">Protect Value</h3>
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
                              class:pl-8={input.type === 'currency'}
                              class:pr-8={input.type === 'percentage'}
                              placeholder="0"
                              value={selectedImpact.inputValues[input.name]}
                              on:input={(e) => updateImpactInput(selectedImpact.id, input.name, +e.currentTarget.value)}
                            />
                            {#if input.type === 'currency'}
                              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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

    <!-- Reduce Cost Step -->
    {:else if currentStep === 4}
      <div class="space-y-6 animate-fade-in">
        <div class="flex items-center gap-3">
          <span class="text-3xl">✂️</span>
          <div>
            <h3 class="text-xl font-semibold">Reduce Cost</h3>
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
                              class:pl-8={input.type === 'currency'}
                              class:pr-8={input.type === 'percentage'}
                              placeholder="0"
                              value={selectedImpact.inputValues[input.name]}
                              on:input={(e) => updateImpactInput(selectedImpact.id, input.name, +e.currentTarget.value)}
                            />
                            {#if input.type === 'currency'}
                              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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

    <!-- Avoid Risk Step -->
    {:else if currentStep === 5}
      <div class="space-y-6 animate-fade-in">
        <div class="flex items-center gap-3">
          <span class="text-3xl">🛡️</span>
          <div>
            <h3 class="text-xl font-semibold">Avoid Risk</h3>
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
                              class:pl-8={input.type === 'currency'}
                              class:pr-8={input.type === 'percentage'}
                              placeholder="0"
                              value={selectedImpact.inputValues[input.name]}
                              on:input={(e) => updateImpactInput(selectedImpact.id, input.name, +e.currentTarget.value)}
                            />
                            {#if input.type === 'currency'}
                              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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

    <!-- Results Step -->
    {:else if currentStep === 7}
      <div class="space-y-8 animate-fade-in">
        <div class="bg-white rounded-xl p-6 border border-gray-200">
          <h3 class="text-xl font-semibold mb-4">Results Summary for {projectName}</h3>

          <!-- Selected Impacts Summary -->
          <div class="space-y-4 mb-8">
            <h4 class="text-lg font-semibold">Selected Value Impacts</h4>
            {#if selectedImpacts.length === 0}
              <p class="text-gray-500">No value impacts selected.</p>
            {:else}
              <div class="grid grid-cols-1 gap-4">
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
            <div class="h-[300px]">
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

    <!-- Navigation -->
    <div class="flex justify-between items-center mt-8">
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

      <div class="flex items-center gap-2">
        {#if errors.length > 0}
          <p class="text-sm text-red-500">{errors[0].message}</p>
        {/if}
        
        {#if showSkip}
          <button
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
            on:click={handleSkip}
          >
            Skip this category
          </button>
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