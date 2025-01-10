<script lang="ts">
  import { calculatorStore } from '$lib/stores/calculatorStore';
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
      slaCompliance
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
    type: 'roi' | 'team' | 'efficiency' | 'implementation';
    value: number;
  }

  let targets: Target[] = [
    { type: 'roi', value: 24 }, // Break even in months
    { type: 'team', value: 30 }, // Team reduction %
    { type: 'efficiency', value: 40 }, // Process efficiency %
    { type: 'implementation', value: 6 } // Implementation time in months
  ];

  // Results
  let results: TargetBasedPlanningResults | null = null;

  // Input constraints
  const constraints = {
    teamSize: { min: 1, max: 15, step: 1 },
    hourlyRate: { min: 10, max: 150, step: 5 },
    serviceEfficiency: { min: 0, max: 1, step: 0.01 },
    operationalOverhead: { min: 0, max: 1, step: 0.01 },
    monthlyTickets: { min: 1, max: 250, step: 1 },
    hoursPerTicket: { min: 0.1, max: 100, step: 0.1 },
    peoplePerTicket: { min: 1, max: 10, step: 1 },
    timeframe: { min: 12, max: 60, step: 3 }, // 12-60 months
    targetTeamReduction: { min: 0, max: 75, step: 5 }, // 0-75%
    targetEfficiency: { min: 0, max: 75, step: 5 }, // 0-75%
    platformCost: { min: 50000, max: 10000000, step: 10000 }, // $50k to $10M
    platformMaintenance: { min: 1000, max: 1000000, step: 1000 } // $1k to $1M
  };

  // Initialize tooltips
  onMount(() => {
    const tooltipInstances = tippy('[data-tippy-content]', {
      theme: 'light-border',
      placement: 'right',
      delay: [100, 200],
      touch: 'hold',
      maxWidth: 300,
      hideOnClick: false,
      trigger: 'mouseenter focus click',
      interactive: true,
      appendTo: () => document.body,
      plugins: [],
      animation: false,
      allowHTML: false
    });
  });

  // Helper function to format currency
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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

  // Update reactive calculation
  $: {
    // Calculate base costs
    const workingHoursPerMonth = 160;
    const monthlyBaseCost = model === 'team'
      ? teamSize * hourlyRate * workingHoursPerMonth * (serviceEfficiency / 100) * (1 + operationalOverhead / 100)
      : monthlyTickets * hoursPerTicket * peoplePerTicket * hourlyRate; // Use actual hourly rate
    
    const annualBaseCost = monthlyBaseCost * 12;
    const breakEvenMonths = targets[0].value;
    const teamTarget = targets[1].value / 100;
    const efficiencyTarget = targets[2].value / 100;
    const implementationMonths = targets[3].value;

    // Calculate reduced operating costs after implementation
    const monthlyOperatingCost = monthlyBaseCost * (1 - teamTarget) * (1 - efficiencyTarget);
    const monthlySavings = monthlyBaseCost - monthlyOperatingCost;
    const annualSavings = monthlySavings * 12;

    // Calculate required platform cost to hit break-even target
    const totalSavingsAtTarget = monthlySavings * breakEvenMonths;
    const platformCost = Math.min(
      Math.max(
        totalSavingsAtTarget,
        constraints.platformCost.min
      ),
      constraints.platformCost.max
    );

    // Calculate monthly maintenance (5% of platform cost annually)
    const platformMaintenance = platformCost * 0.05 / 12;

    // Update results
    results = {
      platformCost,
      platformMaintenance,
      timeToBuild: implementationMonths,
      teamReduction: teamTarget,
      processEfficiency: efficiencyTarget,
      baselineCost: annualBaseCost,
      annualBaseline: annualBaseCost,
      targetType: 'roi',
      targetValue: breakEvenMonths,
      timeframe: breakEvenMonths,
      monthlyBaseCost,
      monthlyOperatingCostReduction: monthlySavings
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

  // Add function to find actual break-even point
  function findBreakEvenPoint(baselineCosts: number[], platformCosts: number[]): number {
    for (let i = 1; i < baselineCosts.length; i++) {
      if (platformCosts[i] <= baselineCosts[i] && platformCosts[i-1] > baselineCosts[i-1]) {
        // Linear interpolation for more accurate break-even point
        const x1 = i - 1;
        const x2 = i;
        const y1 = platformCosts[i-1] - baselineCosts[i-1];
        const y2 = platformCosts[i] - baselineCosts[i];
        const breakEven = x1 + (0 - y1) * (x2 - x1) / (y2 - y1);
        return Math.round(breakEven);
      }
    }
    return -1; // No break-even found
  }

  // Update chart data generation to match base analysis
  function generateTimelineData(results: TargetBasedPlanningResults) {
    const months = Math.max(60, results.timeframe + 24); // Show at least target + 2 years
    const monthlyBaseline = results.baselineCost / 12;
    const targetBreakEvenMonths = results.timeframe;
    
    // Calculate the required platform cost and monthly operating cost to hit break-even
    const baselineCostAtBreakEven = monthlyBaseline * targetBreakEvenMonths;
    const requiredPlatformCost = results.platformCost;
    
    // Calculate the required monthly operating cost to achieve break-even
    const remainingMonths = targetBreakEvenMonths - results.timeToBuild;
    const requiredMonthlyOperatingCost = (baselineCostAtBreakEven - requiredPlatformCost) / remainingMonths;

    // Generate cost arrays
    const baselineCosts: number[] = Array.from({length: months + 1}, (_, i) => monthlyBaseline * i);
    const platformCosts: number[] = Array.from({length: months + 1}, (_, i) => {
      if (i <= results.timeToBuild) {
        // During implementation: Only platform investment (spread evenly)
        return (requiredPlatformCost * i / results.timeToBuild);
      } else {
        // After implementation: Platform cost + cumulative operating costs
        const operatingMonths = i - results.timeToBuild;
        return requiredPlatformCost + (requiredMonthlyOperatingCost * operatingMonths);
      }
    });

    // Add break-even point marker
    const breakEvenPoint = targetBreakEvenMonths;
    const breakEvenMarker: (number | null)[] = Array.from({length: months + 1}, (_, i) => {
      return i === breakEvenPoint ? baselineCosts[i] : null;
    });

    const data = {
      labels: Array.from({length: months + 1}, (_, i) => `Month ${i}`),
      datasets: {
        costs: [
          {
            label: 'Current Solution',
            data: baselineCosts,
            borderColor: '#94a3b8',
            backgroundColor: '#94a3b880',
            fill: true,
            pointRadius: 0
          },
          {
            label: 'Platform Solution',
            data: platformCosts,
            borderColor: '#dd9933',
            backgroundColor: '#dd993380',
            fill: true,
            pointRadius: 0
          }
        ],
        monthly: [
          {
            label: 'Break-Even Point',
            data: breakEvenMarker,
            borderColor: '#22c55e',
            backgroundColor: '#22c55e',
            pointRadius: 6,
            pointStyle: 'circle',
            showLine: false
          }
        ]
      }
    };
    return data;
  }

  // Update chart rendering to fix tick callback type
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
        datasets: [...data.datasets.costs, ...data.datasets.monthly]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          },
          legend: {
            display: false
          },
          datalabels: {
            display: false
          }
        },
        elements: {
          point: {
            radius: 0,
            hitRadius: 10,
            hoverRadius: 5
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
              text: 'Time'
            },
            grid: {
              display: false
            }
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: 'Cumulative Cost ($)'
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
                    maximumFractionDigits: 0
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
      { type: 'implementation', value: sharedParams.implementationTarget }
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
      implementationTarget: targets[3].value
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
</script>

<!-- Input Container -->
<div class="bg-white rounded-xl shadow-sm p-4 space-y-4 mb-4">
  <!-- Model Description -->
  <div class="bg-gradient-to-r from-secondary/10 to-secondary/5 p-2 rounded-lg border border-secondary/20">
    <p class="text-secondary text-xs leading-relaxed">
      {#if model === 'team'}
        Set target goals and calculate required platform investment based on your team metrics
      {:else}
        Set target goals and calculate required platform investment based on your ticket metrics
      {/if}
    </p>
  </div>

  <!-- Base Configuration -->
  <div>
    <h3 class="text-sm font-semibold text-gray-900 mb-2">Current Configuration</h3>
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
                  data-tippy-content="Number of full-time employees on the team">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Define the number of employees currently working on Operations Costs.
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
                  data-tippy-content="Average hourly cost per team member">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Average hourly cost per team member including benefits and overhead.
              </p>
            </div>
            <div>
              <div class="input-group">
                <div class="value-container">
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
                    <span class="unit-suffix">$</span>
                  </div>
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
                  data-tippy-content="Percentage of time spent on productive work">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Percentage of time spent on productive Operations Costs work.
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
                  data-tippy-content="Additional costs as percentage of base costs">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Additional operational costs as a percentage of base costs.
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
              Break Even Time
              <button 
                class="tooltip ml-1"
                aria-label="Help information" 
                data-tippy-content="Target months to break even on investment">
                <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <p class="input-description">
              Target number of months to break even on the platform investment.
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
                Team Reduction
                <button 
                  class="tooltip ml-1"
                  aria-label="Help information" 
                  data-tippy-content="Target percentage reduction in team size">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Target percentage reduction in team size after platform implementation.
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
                  data-tippy-content="Target improvement in process efficiency">
                  <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p class="input-description">
                Target improvement in process efficiency after platform implementation.
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

      <!-- Implementation Time Target -->
      <div class="field-container">
        <div>
          <div class="field-info">
            <label class="field-label" for="implementationTarget">
              Implementation Time
              <button 
                class="tooltip ml-1"
                aria-label="Help information" 
                data-tippy-content="Target time to implement the platform">
                <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <p class="input-description">
              Target time required to implement the platform solution.
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
    <!-- Key Metrics -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">Platform Investment</p>
        <p class="text-xl font-semibold text-gray-900">${results.platformCost.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">Monthly Savings</p>
        <p class="text-xl font-semibold text-green-600">${results.monthlyOperatingCostReduction.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">Break-Even Period</p>
        <p class="text-xl font-semibold text-gray-900">{results.timeframe} months</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">Implementation Time</p>
        <p class="text-xl font-semibold text-gray-900">{results.timeToBuild} months</p>
      </div>
    </div>

    <!-- Detailed Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Current vs Future State -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Cost Comparison</h3>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-sm text-gray-500">Current Monthly Cost</p>
              <p class="text-lg font-medium text-gray-900">${(results.monthlyBaseCost).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">Future Monthly Cost</p>
              <p class="text-lg font-medium text-green-600">${(results.monthlyBaseCost - results.monthlyOperatingCostReduction).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
            </div>
          </div>
          <div class="pt-4 border-t border-gray-100">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-gray-500">Current Annual Cost</p>
                <p class="text-lg font-medium text-gray-900">${results.baselineCost.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500">Future Annual Cost</p>
                <p class="text-lg font-medium text-green-600">${(results.baselineCost - (results.monthlyOperatingCostReduction * 12)).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Efficiency Metrics -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Efficiency Metrics</h3>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-sm text-gray-500">Team Reduction</p>
              <p class="text-lg font-medium text-gray-900">{(results.teamReduction * 100).toFixed(0)}%</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">Process Efficiency Gain</p>
              <p class="text-lg font-medium text-gray-900">{(results.processEfficiency * 100).toFixed(0)}%</p>
            </div>
          </div>
          <div class="pt-4 border-t border-gray-100">
            <div>
              <p class="text-sm text-gray-500">Platform Maintenance</p>
              <p class="text-lg font-medium text-gray-900">${results.platformMaintenance.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} / month</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cost Analysis Chart -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h3 class="text-sm font-semibold text-gray-900 mb-4">Cumulative Cost Analysis</h3>
      <div class="h-80 relative">
        <canvas id="cumulativeCostChart"></canvas>
      </div>
      <div class="mt-4 flex justify-between items-center text-sm text-gray-500">
        <div>
          <span class="inline-block w-3 h-3 bg-[#94a3b8] rounded-full mr-2"></span>
          Current Solution
        </div>
        <div>
          <span class="inline-block w-3 h-3 bg-[#dd9933] rounded-full mr-2"></span>
          Platform Solution
        </div>
        <div>
          <span class="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
          Break-Even: {results.timeframe} months
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- ChatGPT Analysis Container -->
<div class="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg p-8 mt-8">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Expert Consultation Card -->
    <div class="lg:col-span-2 bg-white rounded-xl p-6 border border-secondary/20 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-[0.02] pointer-events-none">
        <svg class="w-full h-full" viewBox="0 0 100 100">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="0.5"/>
          </pattern>
          <rect width="100" height="100" fill="url(#grid)"/>
        </svg>
      </div>
      
      <!-- Content -->
      <div class="flex flex-col relative">
        <div class="text-center mb-6">
          <h3 class="text-2xl font-semibold text-gray-900 mb-2">Get Expert Guidance</h3>
          <p class="text-gray-600">Validate your target goals and develop a concrete implementation plan with our Operations Costs expert.</p>
        </div>

        <div class="flex flex-col md:flex-row items-center gap-8">
          <!-- Expert Image -->
          <div class="flex-shrink-0 order-1 md:order-2">
            <div class="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-secondary/10 shadow-xl">
              <img src="{base}/viktor2.jpeg" alt="Viktor Cessan" class="w-full h-full object-cover" />
            </div>
          </div>

          <!-- Features List -->
          <div class="flex-grow order-2 md:order-1">
            <ul class="space-y-3">
              <li class="flex items-center text-gray-700 gap-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span>Validate target goals and timelines</span>
              </li>
              <li class="flex items-center text-gray-700 gap-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span>Detailed implementation strategy</span>
              </li>
              <li class="flex items-center text-gray-700 gap-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span>ROI optimization recommendations</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="mt-8 text-center">
          <button
            on:click={() => showExpertModal = true}
            class="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Schedule Free Consultation
          </button>
        </div>
      </div>
    </div>

    <!-- Analysis Options Card -->
    <div class="space-y-4">
      <!-- ChatGPT Analysis -->
      <div class="bg-white rounded-xl p-6 border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
        <p class="text-gray-600 mb-4">Get instant AI insights about your target goals and implementation plan.</p>
        <button
          on:click={() => showLLMTemplate = true}
          class="w-full px-4 py-3 text-base font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shadow hover:shadow-lg transition-all duration-200"
        >
          <div class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            Analyze with ChatGPT
          </div>
        </button>
      </div>

      <!-- Share Options -->
      <div class="bg-white rounded-xl p-6 border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Share Analysis</h3>
        <p class="text-gray-600 mb-4">Share your target planning analysis with stakeholders.</p>
        <button
          on:click={handleShare}
          class="w-full px-4 py-3 text-base font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 shadow hover:shadow-lg transition-all duration-200"
        >
          <div class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Share Analysis
          </div>
        </button>
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
  params={sharedParams}
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