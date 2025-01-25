<script lang="ts">
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import { currencyStore, type Currency, currencyConfigs } from '$lib/stores/currencyStore';
  import type { CalculatorModel, SolutionType, PlatformInputs, TeamInputs, TicketInputs, TargetBasedPlanningResults } from '$lib/types/calculator';
  import { onMount, onDestroy } from 'svelte';
  import tippy from 'tippy.js';
  import 'tippy.js/dist/tippy.css';
  import 'tippy.js/themes/light-border.css';
  import Chart from 'chart.js/auto';
  import type { ChartConfiguration } from 'chart.js';
  import LLMTemplateModal from '$lib/components/ui/LLMTemplateModal.svelte';
  import ExpertModal from '$lib/components/ui/ExpertModal.svelte';
  import { base } from '$app/paths';
  import ShareModal from '$lib/components/ui/ShareModal.svelte';
  import LoadingConfirmationModal from '$lib/components/ui/LoadingConfirmationModal.svelte';
  import { parseShareLink, validateShareParams } from '$lib/utils/shareLink';
  import type { TargetPlanningParams } from '$lib/utils/shareLink';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { exportToExcel } from '$lib/utils/exportUtils';
  import html2canvas from 'html2canvas';
  import ExpertConsultationCard from '$lib/components/ui/ExpertConsultationCard.svelte';

  // Modal state
  let showLLMTemplate = false;
  let showExpertModal = false;
  let showShareModal = false;
  let showLoadingModal = false;
  let sharedParams: TargetPlanningParams | null = null;

  // Subscribe to calculator store
  let model: CalculatorModel;
  let solution: SolutionType = 'platform';
  
  // Initialize inputs with defaults
  let teamSize = 5;
  let hourlyRate = 75;
  let serviceEfficiency = 60;
  let operationalOverhead = 20;

  let monthlyTickets = 50;
  let hoursPerTicket = 4;
  let peoplePerTicket = 2;
  let slaCompliance = 95;

  // Subscribe to store changes
  calculatorStore.subscribe(state => {
    model = state.model;
    solution = state.solution;
  });

  // Handle team inputs
  function handleTeamInputs() {
    calculatorStore.updateTeamInputs({
      teamSize,
      hourlyRate,
      serviceEfficiency: serviceEfficiency / 100,
      operationalOverhead: operationalOverhead / 100
    });
  }

  // Handle ticket inputs
  function handleTicketInputs() {
    calculatorStore.updateTicketInputs({
      monthlyTickets,
      hoursPerTicket,
      peoplePerTicket,
      slaCompliance,
      hourlyRate
    });
  }

  // Watch for model changes
  $: if (model === 'team') {
    handleTeamInputs();
  } else if (model === 'ticket') {
    handleTicketInputs();
  }

  // Target inputs without enabled flag
  interface Target {
    type: 'roi' | 'team' | 'efficiency' | 'implementation' | 'platform_cost';
    value: number;
  }

  let targets: Target[] = [
    { type: 'roi', value: 24 }, // Break even in months
    { type: 'team', value: 30 }, // Team reduction %
    { type: 'efficiency', value: 40 }, // Process efficiency %
    { type: 'implementation', value: 6 }, // Implementation time in months
    { type: 'platform_cost', value: 5000 } // Monthly platform cost
  ];

  // Results
  let results: TargetBasedPlanningResults | null = null;

  // Base constraints (USD values)
  const baseConstraints = {
    teamSize: { min: 1, max: 15, step: 1 },
    hourlyRate: { min: 10, max: 150, step: 5 },
    serviceEfficiency: { min: 0, max: 100, step: 1 },
    operationalOverhead: { min: 0, max: 100, step: 1 },
    monthlyTickets: { min: 1, max: 250, step: 1 },
    hoursPerTicket: { min: 0.1, max: 100, step: 0.1 },
    peoplePerTicket: { min: 1, max: 10, step: 1 },
    timeframe: { min: 12, max: 60, step: 3 },
    targetTeamReduction: { min: 0, max: 75, step: 5 },
    targetEfficiency: { min: 0, max: 75, step: 5 },
    platformCost: { min: 0, max: 50000, step: 1000 }
  };

  // Current constraints that will be updated based on currency
  let constraints = { ...baseConstraints };
  let previousMultiplier = 1;

  // Subscribe to currency changes and update constraints
  $: {
    const multiplier = $currencyStore.multiplier;
    if (multiplier !== previousMultiplier) {
      const ratio = multiplier / previousMultiplier;
      
      // Update monetary values
      hourlyRate = Math.round(hourlyRate * ratio);
      targets = targets.map(target => {
        if (target.type === 'platform_cost') {
          return { ...target, value: Math.round(target.value * ratio) };
        }
        return target;
      });

      // Update constraints for monetary fields
      constraints = {
        ...baseConstraints,
        hourlyRate: {
          min: Math.round(baseConstraints.hourlyRate.min * multiplier),
          max: Math.round(baseConstraints.hourlyRate.max * multiplier),
          step: Math.round(baseConstraints.hourlyRate.step * multiplier)
        },
        platformCost: {
          min: Math.round(baseConstraints.platformCost.min * multiplier),
          max: Math.round(baseConstraints.platformCost.max * multiplier),
          step: Math.round(baseConstraints.platformCost.step * multiplier)
        }
      };

      // Update store with new values
      if (model === 'team') {
        handleTeamInputs();
      } else {
        handleTicketInputs();
      }

      previousMultiplier = multiplier;
    }
  }

  // Helper function to format currency
  function formatCurrency(value: number): string {
    return `${$currencyStore.symbol}${(value * $currencyStore.multiplier).toLocaleString('en-US', {
      maximumFractionDigits: 0
    })}`;
  }

  // Helper function to format percentage
  function formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value / 100);
  }

  // Helper function to format months
  function formatMonths(value: number): string {
    return `${value.toLocaleString()} mo`;
  }

  // Helper function to ensure number type
  function ensureNumber(value: string | number): number {
    return typeof value === 'string' ? parseFloat(value) : value;
  }

  // Add function to calculate crossover point
  function calculateCrossoverPoint(monthlySavings: number, platformCost: number): number {
    if (monthlySavings <= 0) return 0;
    return Math.ceil(platformCost / monthlySavings);
  }

  // Add function to calculate break-even point
  function calculateBreakEvenPoint(monthlySavings: number, platformCost: number): number {
    if (monthlySavings <= 0) return 0;
    // Break-even is when we've saved an amount equal to the investment
    // So it's double the crossover point (when we've paid off the investment)
    return Math.ceil((platformCost * 2) / monthlySavings);
  }

  // Update reactive calculation
  $: {
    // Calculate base costs
    const workingHoursPerMonth = 160;
    const monthlyBaseCost = model === 'team'
      ? teamSize * hourlyRate * workingHoursPerMonth * (serviceEfficiency / 100) * (1 + operationalOverhead / 100)
      : monthlyTickets * hoursPerTicket * peoplePerTicket * hourlyRate;
    
    const annualBaseCost = monthlyBaseCost * 12;
    const breakEvenMonths = targets[0].value;
    const teamTarget = targets[1].value / 100;
    const efficiencyTarget = targets[2].value / 100;
    const implementationMonths = targets[3].value;
    const monthlyPlatformCost = targets[4].value;

    // Calculate reduced operating costs after implementation
    const monthlyOperatingCost = monthlyBaseCost * (1 - teamTarget) * (1 - efficiencyTarget);
    const monthlySavings = monthlyBaseCost - monthlyOperatingCost - monthlyPlatformCost;
    const annualSavings = monthlySavings * 12;

    // Calculate maximum possible investment based on savings and break-even target
    // Since break-even is when we've saved an amount equal to investment, we need half the time
    const maxPossibleInvestment = monthlySavings > 0 ? monthlySavings * (breakEvenMonths / 2) : 0;

    // If monthly savings is negative or zero, solution is not viable
    const isViable = monthlySavings > 0;

    // Calculate platform investment based on break-even target
    const platformInvestment = isViable ? maxPossibleInvestment : 0;

    // Calculate actual crossover and break-even points only if viable
    const crossoverPoint = isViable ? calculateCrossoverPoint(monthlySavings, platformInvestment) : 0;
    const breakEvenPoint = isViable ? calculateBreakEvenPoint(monthlySavings, platformInvestment) : 0;

    // Update results
    results = {
      platformCost: platformInvestment,
      platformMaintenance: monthlyPlatformCost,
      timeToBuild: implementationMonths,
      teamReduction: teamTarget,
      processEfficiency: efficiencyTarget,
      baselineCost: monthlyBaseCost,
      annualBaseline: annualBaseCost,
      targetType: 'roi',
      targetValue: breakEvenMonths,
      timeframe: breakEvenMonths,
      monthlyBaseCost,
      monthlyOperatingCostReduction: monthlySavings,
      crossoverPoint,
      breakEvenPoint,
      isViable
    };

    // Update calculator store
    if (results) {
      calculatorStore.updateSolutionInputs({
        type: 'platform',
        platform: {
          baselineCost: results.baselineCost,
          platformCost: results.platformCost,
          platformMaintenance: results.platformMaintenance,
          timeToBuild: results.timeToBuild,
          teamReduction: results.teamReduction,
          processEfficiency: results.processEfficiency
        }
      });
    }
  }

  let cumulativeChart: Chart | null = null;

  // Update chart tabs to only show cumulative costs
  let selectedTab = 'costs';
  const tabs = [
    { id: 'costs', label: 'Cost Analysis' }
  ];

  // Update chart data generation
  function generateTimelineData(results: TargetBasedPlanningResults) {
    const months = Math.max(60, results.timeframe + 24);
    const monthlyBaseline = results.monthlyBaseCost;
    const monthlyOperatingCost = monthlyBaseline - results.monthlyOperatingCostReduction;
    const monthlyPlatformCost = results.platformMaintenance;
    const implementationCost = results.platformCost / results.timeToBuild;
    
    // Get break-even target from user input - this is fixed
    const targetBreakEven = targets[0].value;

    // Generate arrays for different cost components
    const baselineCosts: number[] = Array.from({length: months + 1}, (_, i) => monthlyBaseline * i);
    const platformCosts: number[] = Array.from({length: months + 1}, (_, i) => {
      if (i <= results.timeToBuild) {
        return (implementationCost * i) + (monthlyPlatformCost * i);
      } else {
        const implementationTotal = results.platformCost;
        const operatingMonths = i - results.timeToBuild;
        return implementationTotal + 
               (monthlyPlatformCost * i) + 
               (monthlyOperatingCost * operatingMonths);
      }
    });

    // Calculate required monthly savings to achieve target break-even
    const totalInvestment = results.platformCost;
    const availableMonths = targetBreakEven - results.timeToBuild;
    const requiredMonthlySavings = totalInvestment / availableMonths;

    // Find earliest crossover point that would achieve target break-even
    let crossoverPoint = results.timeToBuild;
    let isViable = false;

    // Try each possible crossover point
    for (let tryPoint = results.timeToBuild; tryPoint < targetBreakEven; tryPoint++) {
      let potentialSavings = 0;
      // Calculate total savings from this crossover point to target break-even
      for (let i = tryPoint + 1; i <= targetBreakEven; i++) {
        const monthlySaving = (baselineCosts[i] - baselineCosts[i-1]) - 
                            (platformCosts[i] - platformCosts[i-1]);
        potentialSavings += monthlySaving;
      }
      
      // If we can achieve enough savings by target break-even, this is our crossover point
      if (potentialSavings >= totalInvestment) {
        crossoverPoint = tryPoint;
        isViable = true;
        break;
      }
    }

    // Create markers for crossover and break-even points
    const crossoverMarker: (number | null)[] = Array.from({length: months + 1}, (_, i) => {
      return i === crossoverPoint && isViable ? platformCosts[i] : null;
    });

    const breakEvenMarker: (number | null)[] = Array.from({length: months + 1}, (_, i) => {
      return i === targetBreakEven && isViable ? platformCosts[i] : null;
    });

    // Update results with our calculated points
    results.crossoverPoint = isViable ? crossoverPoint : null;
    results.breakEvenPoint = isViable ? targetBreakEven : null;
    results.isViable = isViable;

    return {
      labels: Array.from({length: months + 1}, (_, i) => `Month ${i}`),
      datasets: [
        {
          label: 'Current Solution',
          data: baselineCosts,
          borderColor: '#94a3b8',
          backgroundColor: '#94a3b880',
          fill: true,
          pointRadius: 0,
          order: 3
        },
        {
          label: 'Platform Solution',
          data: platformCosts,
          borderColor: '#dd9933',
          backgroundColor: '#dd993380',
          fill: true,
          pointRadius: 0,
          order: 2
        },
        {
          label: 'Cost Savings Crossover',
          data: crossoverMarker,
          borderColor: '#dd9933',
          backgroundColor: '#dd9933',
          pointRadius: 12,
          pointStyle: 'rectRot',
          showLine: false,
          order: 1
        },
        {
          label: 'Break-Even Point',
          data: breakEvenMarker,
          borderColor: '#22c55e',
          backgroundColor: '#22c55e',
          pointRadius: 12,
          pointStyle: 'rectRot',
          showLine: false,
          order: 0
        }
      ]
    };
  }

  // Update chart rendering
  function updateCharts() {
    if (!results) return;

    const data = generateTimelineData(results);
    const ctx = document.getElementById('cumulativeCostChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Destroy existing chart
    if (cumulativeChart) {
      cumulativeChart.destroy();
      cumulativeChart = null;
    }

    const chartConfig: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: data.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: false,
          axis: 'x'
        },
        plugins: {
          tooltip: {
            enabled: false
          },
          datalabels: {
            display: false
          },
          legend: {
            display: false
          }
        },
        elements: {
          point: {
            radius: 0
          },
          line: {
            tension: 0.4
          }
        },
        scales: {
          x: {
            type: 'category',
            title: {
              display: true,
              text: 'Time (Months)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              display: false
            },
            ticks: {
              display: true,
              maxTicksLimit: 12,
              callback: function(value, index) {
                return index % 6 === 0 ? index : '';
              },
              font: {
                size: 12
              }
            }
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: 'Cumulative Cost ($)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: '#e2e8f0'
            },
            ticks: {
              callback: function(value) {
                if (typeof value === 'number') {
                  return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                    notation: 'compact',
                    compactDisplay: 'short'
                  }).format(value);
                }
                return '';
              }
            }
          }
        }
      }
    };

    cumulativeChart = new Chart(ctx, chartConfig);
  }

  // Update reactive statements for charts
  $: if (results) {
    setTimeout(updateCharts, 0);
  }

  onDestroy(() => {
    if (cumulativeChart) {
      cumulativeChart.destroy();
    }
  });

  // Handle URL parameters on mount
  onMount(() => {
    const searchParams = $page.url.searchParams;
    if (searchParams.size > 0) {
      const params = parseShareLink(searchParams);
      if (params && validateShareParams(params)) {
        sharedParams = params;
        showLoadingModal = true;
      }
    }
  });

  // Function to apply shared parameters
  function applySharedParams() {
    if (!sharedParams) return;
    
    // Update model type
    model = sharedParams.model;
    
    // Update model-specific inputs
    if (sharedParams.model === 'team') {
      teamSize = sharedParams.teamSize!;
      hourlyRate = sharedParams.hourlyRate!;
      serviceEfficiency = sharedParams.serviceEfficiency! * 100;
      operationalOverhead = sharedParams.operationalOverhead! * 100;
    } else {
      monthlyTickets = sharedParams.monthlyTickets!;
      hoursPerTicket = sharedParams.hoursPerTicket!;
      peoplePerTicket = sharedParams.peoplePerTicket!;
      slaCompliance = sharedParams.slaCompliance!;
    }
    
    // Update target inputs
    targets = [
      { type: 'roi', value: sharedParams.breakEvenTarget },
      { type: 'team', value: sharedParams.reductionTarget },
      { type: 'efficiency', value: sharedParams.efficiencyTarget },
      { type: 'implementation', value: sharedParams.implementationTarget },
      { type: 'platform_cost', value: sharedParams.platformCostTarget }
    ];
    
    // Clear URL parameters
    goto($page.url.pathname, { replaceState: true });
    showLoadingModal = false;
  }

  // Function to get current parameters for sharing
  function getCurrentParams(): TargetPlanningParams {
    return {
      model,
      ...(model === 'team' ? {
        teamSize,
        hourlyRate,
        serviceEfficiency: serviceEfficiency / 100,
        operationalOverhead: operationalOverhead / 100
      } : {
        monthlyTickets,
        hoursPerTicket,
        peoplePerTicket,
        slaCompliance
      }),
      breakEvenTarget: targets[0].value,
      reductionTarget: targets[1].value,
      efficiencyTarget: targets[2].value,
      implementationTarget: targets[3].value,
      platformCostTarget: targets[4].value
    };
  }

  // Function to handle share button click
  function handleShare() {
    showShareModal = true;
  }

  // Function to handle loading modal cancel
  function handleLoadingCancel() {
    showLoadingModal = false;
    sharedParams = null;
    goto($page.url.pathname, { replaceState: true });
  }

  // Export functions
  async function handleExportExcel() {
    if (!results) return;
    
    await exportToExcel({
      results: {
        model,
        solution: 'platform',
        totalCost: results.monthlyBaseCost,
        annualCost: results.baselineCost,
        monthlySavings: results.monthlyOperatingCostReduction,
        breakEvenMonths: results.timeframe,
        monthlyData: [{
          month: 1,
          baseline: results.monthlyBaseCost,
          solution: results.monthlyBaseCost - results.monthlyOperatingCostReduction,
          savings: results.monthlyOperatingCostReduction
        }],
        costPerTicket: 0,
        efficiency: results.processEfficiency * 100,
        recommendedTeamSize: model === 'team' ? teamSize : 0,
        isViable: true
      },
      baseInputs: model === 'team' ? {
        teamSize,
        hourlyRate,
        serviceEfficiency: serviceEfficiency / 100,
        operationalOverhead: operationalOverhead / 100
      } : {
        monthlyTickets,
        hoursPerTicket,
        peoplePerTicket,
        slaCompliance
      },
      solutionInputs: {
        type: 'platform',
        platform: {
          platformCost: targets[4].value * 12, // Convert monthly to annual
          platformMaintenance: targets[4].value,
          timeToBuild: targets[3].value,
          teamReduction: targets[1].value / 100,
          processEfficiency: targets[2].value / 100,
          baselineCost: results.baselineCost
        }
      }
    });
  }

  async function handleExportPNG() {
    try {
      // Get the main content area
      const element = document.querySelector('#app') || document.querySelector('main');
      if (!element || !(element instanceof HTMLElement)) {
        throw new Error('Could not find main content container');
      }

      // Create a temporary container for the snapshot
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.background = '#ffffff';
      tempContainer.style.width = `${element.offsetWidth}px`;
      document.body.appendChild(tempContainer);

      // Clone the element
      const clone = element.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(clone);

      // Replace input sections with static values display
      const inputSections = clone.querySelectorAll('input, select, .slider-container');
      inputSections.forEach(section => {
        const container = section.closest('.form-group, .input-group');
        if (container) {
          const label = container.querySelector('label')?.textContent || '';
          const value = (section as HTMLInputElement).value;
          const unit = container.querySelector('.unit')?.textContent || '';
          
          const staticValue = document.createElement('div');
          staticValue.className = 'static-value flex justify-between items-center p-2 bg-gray-50 rounded';
          staticValue.innerHTML = `
            <span class="font-medium">${label}</span>
            <span class="text-right font-bold">${value}${unit}</span>
          `;
          
          container.replaceWith(staticValue);
        }
      });

      // Handle the chart - create a new canvas and copy the content
      if (cumulativeChart) {
        const chartContainer = clone.querySelector('.h-80');
        if (chartContainer) {
          const newCanvas = document.createElement('canvas');
          newCanvas.width = cumulativeChart.canvas.width;
          newCanvas.height = cumulativeChart.canvas.height;
          const ctx = newCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(cumulativeChart.canvas, 0, 0);
          }
          // Replace the old canvas in the clone
          const oldCanvas = chartContainer.querySelector('canvas');
          if (oldCanvas) {
            oldCanvas.replaceWith(newCanvas);
          }
        }
      }

      // Ensure all images are loaded
      const images = clone.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      }));

      // Set explicit dimensions
      clone.style.width = `${element.offsetWidth}px`;
      clone.style.height = 'auto';
      clone.style.position = 'relative';
      clone.style.transform = 'none';
      clone.style.background = '#ffffff';
      clone.style.margin = '0';
      clone.style.padding = '24px';
      clone.style.maxWidth = 'none';

      // Create canvas with optimal settings
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.offsetWidth,
        height: clone.scrollHeight,
        windowWidth: element.offsetWidth,
        windowHeight: clone.scrollHeight,
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            if (el.style.position === 'fixed') {
              el.style.position = 'absolute';
            }
            // Remove any height constraints but avoid overflow on canvas
            if (!(el instanceof HTMLCanvasElement)) {
              el.style.maxHeight = 'none';
              el.style.overflow = 'visible';
            }
          }
        }
      });

      // Clean up
      document.body.removeChild(tempContainer);

      // Convert to high-quality PNG and download
      const link = document.createElement('a');
      link.download = `target-planning-analysis-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('PNG Export Error:', error);
      alert('There was an error generating the PNG. Please try again.');
    }
  }
</script>

<!-- Input Container -->
<div class="bg-white rounded-xl shadow-sm p-4 space-y-4 mb-4">
  <!-- Currency Selector -->
  <div class="flex justify-end">
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium text-gray-700">Currency:</span>
      <div class="flex rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
        {#each ['USD', 'EUR', 'SEK'] as code}
          <button
            class="px-3 py-1 text-sm rounded-md transition-colors {$currencyStore.code === code ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-50'}"
            on:click={() => currencyStore.setCurrency(code as Currency)}
          >
            {currencyConfigs[code as Currency].symbol} {code}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Base Configuration -->
  <div>
    <h3 class="text-sm font-semibold text-gray-900 mb-2">Baseline Parameters</h3>
    <div class="space-y-2">
      {#if model === 'team'}
        <!-- Team Model Fields -->
        <div class="field-container">
          <div>
            <div>
              <label class="field-label" for="teamSize">
                Team Size
                <button 
                  class="tooltip ml-1"
                  aria-label="Help information" 
                  data-tippy-content="Input the total number of team members contributing to operational work. This helps calculate the baseline workforce costs.">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Define the number of employees currently working on operational tasks.
              </p>
            </div>
            <div>
              <div class="input-group">
                <input
                  type="number"
                  id="teamSize"
                  bind:value={teamSize}
                  min={constraints.teamSize.min}
                  max={constraints.teamSize.max}
                  step={constraints.teamSize.step}
                  class="number-input"
                />
                <input
                  type="range"
                  bind:value={teamSize}
                  min={constraints.teamSize.min}
                  max={constraints.teamSize.max}
                  step={constraints.teamSize.step}
                  class="slider-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Hourly Rate -->
        <div class="field-container">
          <div>
            <div>
              <label class="field-label" for="hourlyRate">
                Hourly Rate
                <button 
                  class="tooltip ml-1"
                  aria-label="Help information" 
                  data-tippy-content="Include all costs associated with each employee, such as compensation, benefits, and operational expenses.">
                  <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Input the average hourly cost per team member, including salary, benefits, and overhead.
              </p>
            </div>
            <div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="hourlyRate"
                    bind:value={hourlyRate}
                    min={constraints.hourlyRate.min}
                    max={constraints.hourlyRate.max}
                    step={constraints.hourlyRate.step}
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{$currencyStore.symbol}/hr</span>
                </div>
                <input
                  type="range"
                  bind:value={hourlyRate}
                  min={constraints.hourlyRate.min}
                  max={constraints.hourlyRate.max}
                  step={constraints.hourlyRate.step}
                  class="slider-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Service Efficiency -->
        <div class="field-container">
          <div>
            <div>
              <label class="field-label" for="serviceEfficiency">
                Service Efficiency
                <button 
                  class="tooltip ml-1"
                  aria-label="Help information" 
                  data-tippy-content="Specify the proportion of employee time spent on tasks that directly contribute to value delivery, excluding idle or administrative time.">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Estimate the percentage of time spent on productive work.
              </p>
            </div>
            <div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="serviceEfficiency"
                    bind:value={serviceEfficiency}
                    min={0}
                    max={100}
                    step={1}
                    class="number-input pr-8"
                  />
                  <span class="unit-suffix">%</span>
                </div>
                <input
                  type="range"
                  bind:value={serviceEfficiency}
                  min={0}
                  max={100}
                  step={1}
                  class="slider-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Operational Overhead -->
        <div class="field-container">
          <div>
            <div>
              <label class="field-label" for="operationalOverhead">
                Operational Overhead
                <button 
                  class="tooltip ml-1"
                  aria-label="Help information" 
                  data-tippy-content="Include costs like software, tools, and utilities that contribute to the total operational expenses.">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Define the percentage of additional costs beyond salaries.
              </p>
            </div>
            <div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="operationalOverhead"
                    bind:value={operationalOverhead}
                    min={0}
                    max={100}
                    step={1}
                    class="number-input pr-8"
                  />
                  <span class="unit-suffix">%</span>
                </div>
                <input
                  type="range"
                  bind:value={operationalOverhead}
                  min={0}
                  max={100}
                  step={1}
                  class="slider-input"
                />
              </div>
            </div>
          </div>
        </div>
      {:else}
        <!-- Ticket Model Fields -->
        <div class="space-y-2">
          <!-- Monthly Tickets -->
          <div class="field-container">
            <div>
              <div>
                <label class="field-label" for="monthlyTickets">
                  Monthly Tickets
                  <button 
                    class="tooltip ml-1"
                    aria-label="Help information" 
                    data-tippy-content="Average number of tickets processed per month">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Define the average number of tickets your team processes monthly. This helps calculate workload and capacity requirements.
                </p>
              </div>
              <div class="input-group">
                <div class="value-container">
                  <input
                    type="number"
                    id="monthlyTickets"
                    bind:value={monthlyTickets}
                    min={50}
                    max={250}
                    step={1}
                    class="number-input"
                  />
                </div>
                <div class="slider-container">
                  <input
                    type="range"
                    bind:value={monthlyTickets}
                    min={50}
                    max={250}
                    step={1}
                    class="slider-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Hourly Rate -->
          <div class="field-container">
            <div>
              <div>
                <label class="field-label" for="hourlyRateTicket">
                  Hourly Rate
                  <button 
                    class="tooltip ml-1"
                    aria-label="Help information" 
                    data-tippy-content="Include all costs associated with each employee, such as compensation, benefits, and operational expenses.">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Input the average hourly cost per team member, including salary, benefits, and overhead.
                </p>
              </div>
              <div class="input-group">
                <div class="value-container">
                  <div class="relative">
                    <input
                      type="number"
                      id="hourlyRateTicket"
                      bind:value={hourlyRate}
                      min={constraints.hourlyRate.min}
                      max={constraints.hourlyRate.max}
                      step={constraints.hourlyRate.step}
                      class="number-input pr-8"
                    />
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{$currencyStore.symbol}/hr</span>
                  </div>
                </div>
                <div class="slider-container">
                  <input
                    type="range"
                    bind:value={hourlyRate}
                    min={constraints.hourlyRate.min}
                    max={constraints.hourlyRate.max}
                    step={constraints.hourlyRate.step}
                    class="slider-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Hours per Ticket -->
          <div class="field-container">
            <div>
              <div>
                <label class="field-label" for="hoursPerTicket">
                  Hours per Ticket
                  <button 
                    class="tooltip ml-1"
                    aria-label="Help information" 
                    data-tippy-content="Average time required to process each ticket">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Estimate the average time spent processing each ticket. This helps calculate total resource requirements and costs.
                </p>
              </div>
              <div class="input-group">
                <div class="value-container">
                  <div class="relative">
                    <input
                      type="number"
                      id="hoursPerTicket"
                      bind:value={hoursPerTicket}
                      min={0.1}
                      max={100}
                      step={0.1}
                      class="number-input pr-8"
                    />
                    <span class="unit-suffix">hrs</span>
                  </div>
                </div>
                <div class="slider-container">
                  <input
                    type="range"
                    bind:value={hoursPerTicket}
                    min={0.1}
                    max={100}
                    step={0.1}
                    class="slider-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- People per Ticket -->
          <div class="field-container">
            <div>
              <div>
                <label class="field-label" for="peoplePerTicket">
                  People per Ticket
                  <button 
                    class="tooltip ml-1"
                    aria-label="Help information" 
                    data-tippy-content="Average number of people involved in processing each ticket">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Define how many people typically work on each ticket. This helps calculate staffing needs and collaboration overhead.
                </p>
              </div>
              <div class="input-group">
                <div class="value-container">
                  <input
                    type="number"
                    id="peoplePerTicket"
                    bind:value={peoplePerTicket}
                    min={1}
                    max={10}
                    step={1}
                    class="number-input"
                  />
                </div>
                <div class="slider-container">
                  <input
                    type="range"
                    bind:value={peoplePerTicket}
                    min={1}
                    max={10}
                    step={1}
                    class="slider-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- SLA Compliance -->
          <div class="field-container">
            <div>
              <div>
                <label class="field-label" for="slaCompliance">
                  SLA Compliance
                  <button 
                    class="tooltip ml-1"
                    aria-label="Help information" 
                    data-tippy-content="Current service level agreement compliance rate">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Current percentage of tickets meeting SLA targets. This helps measure service quality and identify improvement opportunities.
                </p>
              </div>
              <div class="input-group">
                <div class="value-container">
                  <div class="relative">
                    <input
                      type="number"
                      id="slaCompliance"
                      bind:value={slaCompliance}
                      min={0}
                      max={100}
                      step={1}
                      class="number-input pr-8"
                    />
                    <span class="unit-suffix">%</span>
                  </div>
                </div>
                <div class="slider-container">
                  <input
                    type="range"
                    bind:value={slaCompliance}
                    min={0}
                    max={100}
                    step={1}
                    class="slider-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Target Goals -->
  <div>
    <h3 class="text-sm font-semibold text-gray-900 mb-2">Target Goals</h3>
    <div class="space-y-2">
      <!-- Break Even Target -->
      <div class="field-container">
        <div>
          <div class="field-info">
            <label class="field-label" for="breakEvenTarget">
              Target Break Even Time
              <button 
                class="tooltip ml-1"
                aria-label="Help information" 
                data-tippy-content="Input the target timeframe for the platform to recoup its total investment through cumulative savings.">
                <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <p class="input-description">
              Specify the target number of months to recover the total platform investment through savings.
            </p>
          </div>
          <div class="input-group">
            <div class="value-container">
              <div class="relative">
                <input
                  type="number"
                  id="breakEvenTarget"
                  bind:value={targets[0].value}
                  min={constraints.timeframe.min}
                  max={constraints.timeframe.max}
                  step={constraints.timeframe.step}
                  class="number-input pr-8"
                />
                <span class="unit-suffix">mo</span>
              </div>
            </div>
            <div class="slider-container">
              <input
                type="range"
                bind:value={targets[0].value}
                min={constraints.timeframe.min}
                max={constraints.timeframe.max}
                step={constraints.timeframe.step}
                class="slider-input"
              />
            </div>
          </div>
        </div>
      </div>

      {#if model === 'team'}
        <!-- Team Reduction Target -->
        <div class="field-container">
          <div>
            <div class="field-info">
              <label class="field-label" for="teamReductionTarget">
                Time Freed Up
                <button 
                  class="tooltip ml-1"
                  aria-label="Help information" 
                  data-tippy-content="Provide how much of the teams time you hope to freed up due to improved efficiency from automation.">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Specify how much time that you want to free up once the platform is developed.
              </p>
            </div>
            <div class="input-group">
              <div class="value-container">
                <div class="relative">
                  <input
                    type="number"
                    id="teamReductionTarget"
                    bind:value={targets[1].value}
                    min={constraints.targetTeamReduction.min}
                    max={constraints.targetTeamReduction.max}
                    step={constraints.targetTeamReduction.step}
                    class="number-input pr-8"
                  />
                  <span class="unit-suffix">%</span>
                </div>
              </div>
              <div class="slider-container">
                <input
                  type="range"
                  bind:value={targets[1].value}
                  min={constraints.targetTeamReduction.min}
                  max={constraints.targetTeamReduction.max}
                  step={constraints.targetTeamReduction.step}
                  class="slider-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Process Efficiency Target -->
        <div class="field-container">
          <div>
            <div class="field-info">
              <label class="field-label" for="efficiencyTarget">
                Process Efficiency
                <button 
                  class="tooltip ml-1"
                  aria-label="Help information" 
                  data-tippy-content="Enter the percentage gain in productivity or performance you want to see from the platform.">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Define the desired improvement in process efficiency.
              </p>
            </div>
            <div class="input-group">
              <div class="value-container">
                <div class="relative">
                  <input
                    type="number"
                    id="efficiencyTarget"
                    bind:value={targets[2].value}
                    min={constraints.targetEfficiency.min}
                    max={constraints.targetEfficiency.max}
                    step={constraints.targetEfficiency.step}
                    class="number-input pr-8"
                  />
                  <span class="unit-suffix">%</span>
                </div>
              </div>
              <div class="slider-container">
                <input
                  type="range"
                  bind:value={targets[2].value}
                  min={constraints.targetEfficiency.min}
                  max={constraints.targetEfficiency.max}
                  step={constraints.targetEfficiency.step}
                  class="slider-input"
                />
              </div>
            </div>
          </div>
        </div>
      {:else}
        <!-- Automation Rate Target -->
        <div class="field-container">
          <div>
            <div class="field-info">
              <label class="field-label" for="automationTarget">
                Automation Rate
                <button 
                  class="tooltip ml-1"
                  aria-label="Help information" 
                  data-tippy-content="Target percentage of tickets to be automated">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Target percentage of tickets that will be handled automatically.
              </p>
            </div>
            <div class="input-group">
              <div class="value-container">
                <div class="relative">
                  <input
                    type="number"
                    id="automationTarget"
                    bind:value={targets[1].value}
                    min={0}
                    max={75}
                    step={5}
                    class="number-input pr-8"
                  />
                  <span class="unit-suffix">%</span>
                </div>
              </div>
              <div class="slider-container">
                <input
                  type="range"
                  bind:value={targets[1].value}
                  min={0}
                  max={75}
                  step={5}
                  class="slider-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- SLA Improvement Target -->
        <div class="field-container">
          <div>
            <div class="field-info">
              <label class="field-label" for="slaTarget">
                SLA Improvement
                <button 
                  class="tooltip ml-1"
                  aria-label="Help information" 
                  data-tippy-content="Target improvement in SLA compliance">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Target improvement in service level agreement compliance.
              </p>
            </div>
            <div class="input-group">
              <div class="value-container">
                <div class="relative">
                  <input
                    type="number"
                    id="slaTarget"
                    bind:value={targets[2].value}
                    min={0}
                    max={50}
                    step={5}
                    class="number-input pr-8"
                  />
                  <span class="unit-suffix">%</span>
                </div>
              </div>
              <div class="slider-container">
                <input
                  type="range"
                  bind:value={targets[2].value}
                  min={0}
                  max={50}
                  step={5}
                  class="slider-input"
                />
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Platform Cost Target -->
      <div class="field-container">
        <div>
          <div class="field-info">
            <label class="field-label" for="platformCostTarget">
              Monthly Platform Cost
              <button 
                class="tooltip ml-1"
                aria-label="Help information" 
                data-tippy-content="Include expenses for updates, hosting, and support needed to keep the platform operational.">
                <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <p class="input-description">
              Specify the expected monthly cost for maintaining your platform.
            </p>
          </div>
          <div>
            <div class="input-group">
              <div class="relative">
                <input
                  type="number"
                  id="platformCostTarget"
                  bind:value={targets[4].value}
                  min={constraints.platformCost.min}
                  max={constraints.platformCost.max}
                  step={constraints.platformCost.step}
                  class="number-input pr-8"
                />
                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{$currencyStore.symbol}</span>
              </div>
              <input
                type="range"
                bind:value={targets[4].value}
                min={constraints.platformCost.min}
                max={constraints.platformCost.max}
                step={constraints.platformCost.step}
                class="slider-input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Implementation Time Target -->
      <div class="field-container">
        <div>
          <div class="field-info">
            <label class="field-label" for="implementationTarget">
              Implementation Time
              <button 
                class="tooltip ml-1"
                aria-label="Help information" 
                data-tippy-content="Input the number of months it will take to deploy the platform and realize its benefits.">
                <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <p class="input-description">
              Estimate the time required to implement the platform solution.
            </p>
          </div>
          <div class="input-group">
            <div class="value-container">
              <div class="relative">
                <input
                  type="number"
                  id="implementationTarget"
                  bind:value={targets[3].value}
                  min={6}
                  max={24}
                  step={3}
                  class="number-input pr-8"
                />
                <span class="unit-suffix">mo</span>
              </div>
            </div>
            <div class="slider-container">
              <input
                type="range"
                bind:value={targets[3].value}
                min={6}
                max={24}
                step={3}
                class="slider-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Results Container -->
{#if results}
  <div class="space-y-6">
    <!-- Metrics Display -->
    <div class="space-y-4">
      <!-- Platform Budget Box -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-6">
        <div class="flex justify-between items-center">
          <div>
            <h4 class="text-lg font-semibold text-green-800">Projected Platform Budget</h4>
            <p class="text-sm text-green-600 mt-1">
              {#if results.isViable}
                Total investment required for implementation and operation
              {:else}
                Target not possible - Monthly costs exceed potential savings
              {/if}
            </p>
          </div>
          {#if results.isViable}
            <p class="text-3xl font-bold text-green-700">{formatCurrency(results.platformCost)}</p>
          {:else}
            <p class="text-3xl font-bold text-red-600">Not Viable</p>
          {/if}
        </div>
      </div>

      <!-- Additional Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Monthly Savings -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div class="flex flex-col">
            <p class="text-gray-500 text-sm">Monthly Savings</p>
            {#if results.isViable}
              <p class="text-xl font-semibold text-green-600 mt-1">
                {formatCurrency(results.monthlyOperatingCostReduction)}
              </p>
            {:else}
              <p class="text-xl font-semibold text-red-600 mt-1">
                Negative ({formatCurrency(Math.abs(results.monthlyOperatingCostReduction))})
              </p>
            {/if}
          </div>
        </div>

        <!-- Cost Savings Crossover -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div class="flex flex-col">
            <p class="text-gray-500 text-sm">Cost Savings Crossover</p>
            {#if results.isViable}
              <p class="text-xl font-semibold text-orange-600 mt-1">
                {results.crossoverPoint} months
              </p>
            {:else}
              <p class="text-xl font-semibold text-red-600 mt-1">N/A</p>
            {/if}
          </div>
        </div>

        <!-- Break-Even Point -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div class="flex flex-col">
            <p class="text-gray-500 text-sm">Break-Even Point</p>
            {#if results.isViable}
              <p class="text-xl font-semibold text-green-600 mt-1">
                {results.breakEvenPoint} months
              </p>
            {:else}
              <p class="text-xl font-semibold text-red-600 mt-1">N/A</p>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Cost Analysis Chart -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h3 class="text-sm font-semibold text-gray-900 mb-4">Cost Analysis</h3>
      <div class="h-80 relative">
        <canvas id="cumulativeCostChart"></canvas>
      </div>
      <div class="mt-4 flex flex-wrap gap-6 justify-center items-center text-sm text-gray-600">
        <div class="flex items-center gap-2">
          <span class="inline-block w-3 h-3 bg-[#94a3b8] rounded-full"></span>
          <span>Current Solution</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-block w-3 h-3 bg-[#dd9933] rounded-full"></span>
          <span>Platform Solution</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-block w-4 h-4 bg-[#dd9933] transform rotate-45"></span>
          <span>Crossover Point</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-block w-4 h-4 bg-[#22c55e] transform rotate-45"></span>
          <span>Break-Even Point</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- ChatGPT Analysis Container -->
<div class="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg p-8 mt-8">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Expert Consultation Card -->
    <ExpertConsultationCard {base} bind:showExpertModal />

    <!-- Analysis Options Card -->
    <div class="space-y-4">
      <!-- ChatGPT Analysis -->
      <div class="bg-white rounded-xl p-6 border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">AI-Powered Insights</h3>
        <p class="text-gray-600 mb-4">Generate a customized prompt to explore your results using AI tools, such as large language models, for deeper analysis and actionable recommendations.</p>
        <button
          on:click={() => showLLMTemplate = true}
          class="w-full px-4 py-3 text-base font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shadow hover:shadow-lg transition-all duration-200"
        >
          <div class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            <span>Generate AI Insights</span>
          </div>
        </button>
      </div>

      <!-- Share Options -->
      <div class="bg-white rounded-xl p-6 border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Share & Export</h3>
        <p class="text-gray-600 mb-4">Share or export your target planning analysis.</p>
        <div class="flex flex-col gap-3">
          <button
            on:click={handleShare}
            class="w-full px-4 py-3 text-base font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Share Analysis
          </button>
          <button
            on:click={handleExportExcel}
            class="w-full px-4 py-3 text-base font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export to Excel
          </button>
          <button
            on:click={handleExportPNG}
            class="w-full px-4 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Export as PNG
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Add Modals -->
<LLMTemplateModal bind:show={showLLMTemplate} bind:targets />
<ExpertModal bind:show={showExpertModal} />
<ShareModal
  bind:show={showShareModal}
  params={getCurrentParams()}
/>
<LoadingConfirmationModal
  bind:show={showLoadingModal}
  params={sharedParams || undefined}
  onConfirm={applySharedParams}
  onCancel={handleLoadingCancel}
/>

<style>
  /* Compact container styles */
  .field-container {
    @apply bg-gray-50/50 p-3 rounded-lg border border-gray-200 hover:border-secondary/20 
           transition-all duration-300 shadow-sm hover:shadow-md w-full mb-2;
  }

  /* Responsive layout container */
  .field-container > div {
    @apply flex flex-col lg:grid lg:grid-cols-[33%_minmax(250px,1fr)] items-start gap-2 lg:gap-4;
  }

  /* Label and description container */
  .field-info {
    @apply w-full lg:w-auto flex flex-col justify-start pr-2 lg:pr-4 mb-1 lg:mb-0;
  }

  /* Compact label styles */
  .field-label {
    @apply flex items-center text-xs font-medium text-gray-700 mb-1;
  }

  /* Compact input group styles */
  .input-group {
    @apply flex flex-row items-center gap-3 w-full lg:col-span-1 min-w-0;
  }

  /* Slider container */
  .slider-container {
    @apply flex-grow min-w-0;
  }

  /* Value container */
  .value-container {
    @apply flex justify-end w-[120px] flex-shrink-0;
  }

  /* Compact number input styles */
  .number-input {
    @apply w-[120px] px-3 py-1 text-left text-gray-700 bg-white border border-gray-200 
           rounded-md focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-transparent
           transition-all duration-200 text-sm font-medium tracking-wide flex-shrink-0;
  }

  /* Compact slider styles */
  .slider-input {
    @apply w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer
           focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:ring-offset-1 min-w-0;
  }

  /* Compact thumb styles */
  .slider-input::-webkit-slider-thumb {
    @apply w-2.5 h-2.5 bg-secondary rounded-full border-2 border-white shadow-sm appearance-none cursor-pointer
           hover:scale-125 transition-transform duration-200;
  }

  .slider-input::-moz-range-thumb {
    @apply w-2.5 h-2.5 bg-secondary rounded-full border-2 border-white shadow-sm appearance-none cursor-pointer
           hover:scale-125 transition-transform duration-200;
  }

  /* Compact description styles */
  .input-description {
    @apply text-xs text-gray-500 mt-0.5 leading-tight;
  }

  /* Unit styles */
  .unit-prefix {
    @apply absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm;
  }

  .unit-suffix {
    @apply absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none;
  }

  /* Tooltip styles */
  .tooltip {
    @apply bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 transition-colors ml-1;
  }
</style> 