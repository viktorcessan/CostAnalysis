<script lang="ts">
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import type { CalculatorModel, SolutionType, PlatformInputs, TeamInputs, TicketInputs, TargetBasedPlanningResults } from '$lib/types/calculator';
  import { onMount, onDestroy } from 'svelte';
  import tippy from 'tippy.js';
  import 'tippy.js/dist/tippy.css';
  import 'tippy.js/themes/light-border.css';
  import Chart from 'chart.js/auto';
  import type { ChartConfiguration, ScaleOptionsByType, CartesianScaleTypeRegistry, Scale, CoreScaleOptions } from 'chart.js';

  // Subscribe to calculator store
  let model: CalculatorModel;
  let solution: SolutionType = 'platform';
  calculatorStore.subscribe(state => {
    model = state.model;
    solution = state.solution;
  });

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

  // Base configuration (matching base analysis)
  let teamSize = 5;
  let hourlyRate = 75;
  let serviceEfficiency = 60;
  let operationalOverhead = 20;

  // Ticket-based inputs
  let monthlyTickets = 50;
  let hoursPerTicket = 4;
  let peoplePerTicket = 2;
  let vendorRate = 75;

  // Results
  let results: TargetBasedPlanningResults | null = null;

  // Input constraints (matching base analysis)
  const constraints = {
    teamSize: { min: 1, max: 15, step: 1 },
    hourlyRate: { min: 10, max: 150, step: 5 },
    serviceEfficiency: { min: 0, max: 1, step: 0.01 },
    operationalOverhead: { min: 0, max: 1, step: 0.01 },
    monthlyTickets: { min: 1, max: 250, step: 1 },
    hoursPerTicket: { min: 0.1, max: 100, step: 0.1 },
    peoplePerTicket: { min: 1, max: 10, step: 1 },
    vendorRate: { min: 10, max: 150, step: 5 },
    timeframe: { min: 12, max: 60, step: 3 }, // 12-60 months
    targetTeamReduction: { min: 0, max: 75, step: 5 }, // 0-75%
    targetEfficiency: { min: 0, max: 75, step: 5 }, // 0-75%
    platformCost: { min: 50000, max: 10000000, step: 10000 }, // $50k to $10M
    platformMaintenance: { min: 1000, max: 1000000, step: 1000 } // $1k to $1M
  };

  // Update reactive calculation
  $: {
    // Calculate base costs
    const workingHoursPerMonth = 160;
    const monthlyBaseCost = model === 'team'
      ? teamSize * hourlyRate * workingHoursPerMonth * (serviceEfficiency / 100) * (1 + operationalOverhead / 100)
      : monthlyTickets * hoursPerTicket * peoplePerTicket * vendorRate;
    
    const annualBaseCost = monthlyBaseCost * 12;
    const breakEvenMonths = targets[0].value;
    const teamTarget = targets[1].value / 100;
    const efficiencyTarget = targets[2].value / 100;
    const implementationMonths = targets[3].value;

    // Calculate reduced operating costs after implementation
    const monthlyOperatingCost = monthlyBaseCost * (1 - teamTarget) * (1 - efficiencyTarget);
    const monthlySavings = monthlyBaseCost - monthlyOperatingCost;
    const annualSavings = monthlySavings * 12;

    // Calculate platform cost based on savings and break-even target
    const platformCost = Math.min(
      Math.max(
        annualSavings * (breakEvenMonths / 12),
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

  // Initialize tooltips
  onMount(() => {
    tippy('[data-tippy-content]', {
      theme: 'light-border',
      placement: 'right'
    });
  });

  let cumulativeChart: Chart | null = null;
  let monthlyChart: Chart | null = null;

  // Update chart tabs to match base analysis
  let selectedTab = 'costs';
  const tabs = [
    { id: 'costs', label: 'Cost Analysis' },
    { id: 'monthly', label: 'Monthly View' }
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
    const monthlyPlatformOperatingCost = (results.baselineCost * (1 - results.teamReduction) * (1 - results.processEfficiency)) / 12 + results.platformMaintenance;

    // Generate cost arrays
    const baselineCosts = Array.from({length: months + 1}, (_, i) => monthlyBaseline * i);
    const platformCosts = Array.from({length: months + 1}, (_, i) => {
      if (i <= results.timeToBuild) {
        // During implementation: Only platform investment (spread evenly)
        return (results.platformCost * i / results.timeToBuild);
      } else {
        // After implementation: Platform cost + cumulative reduced operating costs
        const operatingMonths = i - results.timeToBuild;
        return results.platformCost + (monthlyPlatformOperatingCost * operatingMonths);
      }
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
            fill: true
          },
          {
            label: 'Platform Solution',
            data: platformCosts,
            borderColor: '#dd9933',
            backgroundColor: '#dd993380',
            fill: true
          }
        ],
        monthly: [
          {
            label: 'Current Monthly Cost',
            data: Array.from({length: months + 1}, () => monthlyBaseline),
            borderColor: '#475569',
            borderDash: [5, 5],
            fill: false
          },
          {
            label: 'Platform Monthly Cost',
            data: Array.from({length: months + 1}, (_, i) => {
              if (i <= results.timeToBuild) {
                // During implementation: Platform investment rate
                return results.platformCost / results.timeToBuild;
              } else {
                // After implementation: Only reduced operating costs
                return monthlyPlatformOperatingCost;
              }
            }),
            borderColor: '#b97d27',
            borderDash: [5, 5],
            fill: false
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
    const chartId = selectedTab === 'costs' ? 'cumulativeCostChart' : 'monthlyCostChart';
    const ctx = document.getElementById(chartId) as HTMLCanvasElement;
    if (!ctx) return;

    // Destroy existing charts
    if (cumulativeChart) {
      cumulativeChart.destroy();
      cumulativeChart = null;
    }
    if (monthlyChart) {
      monthlyChart.destroy();
      monthlyChart = null;
    }

    const chartConfig: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: data.datasets[selectedTab === 'costs' ? 'costs' : 'monthly']
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          datalabels: false,
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
                    minimumFractionDigits: 2
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            type: 'category',
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: selectedTab === 'costs' ? 'Cumulative Cost ($)' : 'Monthly Cost ($)'
            },
            ticks: {
              callback: function(this: Scale<CoreScaleOptions>, tickValue: number | string, index: number, ticks: any[]) {
                const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value);
              }
            }
          }
        }
      }
    };

    if (selectedTab === 'costs') {
      cumulativeChart = new Chart(ctx, chartConfig);
    } else {
      monthlyChart = new Chart(ctx, chartConfig);
    }
  }

  // Update reactive statements for charts
  $: if (results && selectedTab) {
    setTimeout(updateCharts, 0);
  }

  onDestroy(() => {
    if (cumulativeChart) {
      cumulativeChart.destroy();
    }
    if (monthlyChart) {
      monthlyChart.destroy();
    }
  });
</script>

<div class="bg-white rounded-xl shadow-lg p-4 space-y-6">
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
    <h3 class="text-sm font-semibold text-gray-900 mb-4">Current Configuration</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {#if model === 'team'}
        <!-- Team Model Fields -->
        <div class="field-container">
          <label class="field-label" for="teamSize">
            Team Size
            <button 
              class="tooltip"
              aria-label="Help information" 
              data-tippy-content="Number of full-time employees on the team">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </label>
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

        <!-- Hourly Rate -->
        <div class="field-container">
          <label class="field-label" for="hourlyRate">
            Hourly Rate
            <button 
              class="tooltip"
              aria-label="Help information" 
              data-tippy-content="Average hourly cost per team member">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </label>
          <div class="input-group">
            <div class="relative">
              <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
              <input
                type="number"
                id="hourlyRate"
                bind:value={hourlyRate}
                min={constraints.hourlyRate.min}
                max={constraints.hourlyRate.max}
                step={constraints.hourlyRate.step}
                class="number-input pl-6"
              />
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

        <!-- Service Efficiency -->
        <div class="field-container">
          <label class="field-label" for="serviceEfficiency">
            Service Efficiency
            <button 
              class="tooltip"
              aria-label="Help information" 
              data-tippy-content="Percentage of time spent on productive work">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </label>
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
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
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

        <!-- Operational Overhead -->
        <div class="field-container">
          <label class="field-label" for="operationalOverhead">
            Operational Overhead
            <button 
              class="tooltip"
              aria-label="Help information" 
              data-tippy-content="Additional costs as percentage of base costs">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </label>
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
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
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
      {:else}
        <!-- Ticket Model Fields -->
        <div class="field-container">
          <label class="field-label" for="monthlyTickets">
            Monthly Tickets
            <button 
              class="tooltip"
              aria-label="Help information" 
              data-tippy-content="Average number of tickets processed per month">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </label>
          <div class="input-group">
            <input
              type="number"
              id="monthlyTickets"
              bind:value={monthlyTickets}
              min={constraints.monthlyTickets.min}
              max={constraints.monthlyTickets.max}
              step={constraints.monthlyTickets.step}
              class="number-input"
            />
            <input
              type="range"
              bind:value={monthlyTickets}
              min={constraints.monthlyTickets.min}
              max={constraints.monthlyTickets.max}
              step={constraints.monthlyTickets.step}
              class="slider-input"
            />
          </div>
        </div>

        <!-- Hours per Ticket -->
        <div class="field-container">
          <label class="field-label" for="hoursPerTicket">
            Hours per Ticket
            <button 
              class="tooltip"
              aria-label="Help information" 
              data-tippy-content="Average hours spent per ticket">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </label>
          <div class="input-group">
            <div class="relative">
              <input
                type="number"
                id="hoursPerTicket"
                bind:value={hoursPerTicket}
                min={constraints.hoursPerTicket.min}
                max={constraints.hoursPerTicket.max}
                step={constraints.hoursPerTicket.step}
                class="number-input pr-8"
              />
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">hrs</span>
            </div>
            <input
              type="range"
              bind:value={hoursPerTicket}
              min={constraints.hoursPerTicket.min}
              max={constraints.hoursPerTicket.max}
              step={constraints.hoursPerTicket.step}
              class="slider-input"
            />
          </div>
        </div>

        <!-- People per Ticket -->
        <div class="field-container">
          <label class="field-label" for="peoplePerTicket">
            People per Ticket
            <button 
              class="tooltip"
              aria-label="Help information" 
              data-tippy-content="Average number of people involved per ticket">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </label>
          <div class="input-group">
            <input
              type="number"
              id="peoplePerTicket"
              bind:value={peoplePerTicket}
              min={constraints.peoplePerTicket.min}
              max={constraints.peoplePerTicket.max}
              step={constraints.peoplePerTicket.step}
              class="number-input"
            />
            <input
              type="range"
              bind:value={peoplePerTicket}
              min={constraints.peoplePerTicket.min}
              max={constraints.peoplePerTicket.max}
              step={constraints.peoplePerTicket.step}
              class="slider-input"
            />
          </div>
        </div>

        <!-- Vendor Rate -->
        <div class="field-container">
          <label class="field-label" for="vendorRate">
            Vendor Rate
            <button 
              class="tooltip"
              aria-label="Help information" 
              data-tippy-content="Average hourly rate charged by vendors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </label>
          <div class="input-group">
            <div class="relative">
              <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
              <input
                type="number"
                id="vendorRate"
                bind:value={vendorRate}
                min={constraints.vendorRate.min}
                max={constraints.vendorRate.max}
                step={constraints.vendorRate.step}
                class="number-input pl-6"
              />
            </div>
            <input
              type="range"
              bind:value={vendorRate}
              min={constraints.vendorRate.min}
              max={constraints.vendorRate.max}
              step={constraints.vendorRate.step}
              class="slider-input"
            />
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Target Goals -->
  <div>
    <h3 class="text-sm font-semibold text-gray-900 mb-4">Target Goals</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Break Even Target -->
      <div class="field-container">
        <label class="field-label" for="breakEvenTarget">
          Break Even Time
          <button 
            class="tooltip"
            aria-label="Help information" 
            data-tippy-content="Target months to break even on investment">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </label>
        <div class="input-group">
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
            <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">mo</span>
          </div>
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

      <!-- Team Reduction Target -->
      <div class="field-container">
        <label class="field-label" for="teamReductionTarget">
          Team Reduction
          <button 
            class="tooltip"
            aria-label="Help information" 
            data-tippy-content="Target percentage reduction in team size">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </label>
        <div class="input-group">
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
            <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
          </div>
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

      <!-- Process Efficiency Target -->
      <div class="field-container">
        <label class="field-label" for="efficiencyTarget">
          Process Efficiency
          <button 
            class="tooltip"
            aria-label="Help information" 
            data-tippy-content="Target improvement in process efficiency">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </label>
        <div class="input-group">
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
            <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
          </div>
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

      <!-- Implementation Time Target -->
      <div class="field-container">
        <label class="field-label" for="implementationTarget">
          Implementation Time
          <button 
            class="tooltip"
            aria-label="Help information" 
            data-tippy-content="Target time to implement the platform">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </label>
        <div class="input-group">
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
            <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">mo</span>
          </div>
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

  <!-- Results Display -->
  {#if results}
    <div class="space-y-6">
      <!-- Metrics Overview -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Current Solution -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">Current Solution</h3>
          <div class="space-y-4">
            <div>
              <p class="text-sm text-gray-500">Monthly Cost</p>
              <p class="text-2xl font-semibold text-gray-900">${(results.baselineCost / 12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Annual Cost</p>
              <p class="text-2xl font-semibold text-gray-900">${results.baselineCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div class="pt-2 border-t border-gray-100">
              <p class="text-sm text-gray-500">Service Efficiency</p>
              <p class="text-lg font-medium text-gray-900">{serviceEfficiency}%</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Operational Overhead</p>
              <p class="text-lg font-medium text-gray-900">{operationalOverhead}%</p>
            </div>
          </div>
        </div>

        <!-- Platform Solution -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">Platform Solution</h3>
          <div class="space-y-4">
            <div>
              <p class="text-sm text-gray-500">Platform Investment</p>
              <p class="text-2xl font-semibold text-gray-900">${results.platformCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Monthly Maintenance</p>
              <p class="text-2xl font-semibold text-gray-900">${results.platformMaintenance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div class="pt-2 border-t border-gray-100">
              <p class="text-sm text-gray-500">Implementation Time</p>
              <p class="text-lg font-medium text-gray-900">{results.timeToBuild} months</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Break-Even Period</p>
              <p class="text-lg font-medium text-gray-900">{results.timeframe} months</p>
            </div>
          </div>
        </div>

        <!-- Efficiency Gains -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">Efficiency Gains</h3>
          <div class="space-y-4">
            <div>
              <p class="text-sm text-gray-500">Monthly Savings</p>
              <p class="text-2xl font-semibold text-green-600">${((results.baselineCost / 12) - ((results.baselineCost * (1 - results.teamReduction) * (1 - results.processEfficiency)) / 12 + results.platformMaintenance)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Annual Savings</p>
              <p class="text-2xl font-semibold text-green-600">${(results.baselineCost - (results.baselineCost * (1 - results.teamReduction) * (1 - results.processEfficiency) + results.platformMaintenance * 12)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div class="pt-2 border-t border-gray-100">
              <p class="text-sm text-gray-500">Team Size Reduction</p>
              <p class="text-lg font-medium text-gray-900">{(results.teamReduction * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Process Efficiency Gain</p>
              <p class="text-lg font-medium text-gray-900">{(results.processEfficiency * 100).toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cost Analysis Charts -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8" aria-label="Tabs">
            {#each tabs as tab}
              <button
                class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                {selectedTab === tab.id ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                on:click={() => selectedTab = tab.id}
              >
                {tab.label}
              </button>
            {/each}
          </nav>
        </div>

        <div class="mt-4">
          {#if selectedTab === 'costs'}
            <div class="h-80 relative">
              <canvas id="cumulativeCostChart"></canvas>
            </div>
          {:else}
            <div class="h-80 relative">
              <canvas id="monthlyCostChart"></canvas>
            </div>
          {/if}
        </div>

        <div class="mt-4 grid grid-cols-2 gap-4">
          <div class="text-sm text-gray-500">
            <span class="inline-block w-3 h-3 bg-secondary rounded-full mr-2"></span>
            Break-Even Point: {results.timeframe} months
          </div>
          <div class="text-sm text-gray-500 text-right">
            <span class="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Annual Savings: ${((results.baselineCost - (results.baselineCost * (1 - results.teamReduction) * (1 - results.processEfficiency) + results.platformMaintenance * 12))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .field-container {
    @apply bg-white p-2 rounded-lg border border-gray-100 hover:border-secondary/20 transition-colors duration-200;
  }

  .field-label {
    @apply flex items-center justify-between text-xs font-medium text-gray-700 mb-1;
  }

  .input-group {
    @apply space-y-2;
  }

  .number-input {
    @apply w-full px-2 py-1 text-right text-gray-700 bg-gray-50 border border-gray-200 
           rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-transparent
           transition-all duration-200 text-xs;
  }

  .slider-input {
    @apply w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer
           focus:outline-none focus:ring-1 focus:ring-secondary focus:ring-offset-1;
  }

  .slider-input::-webkit-slider-thumb {
    @apply w-4 h-4 bg-secondary rounded-full border-none appearance-none cursor-pointer;
  }

  .slider-input::-moz-range-thumb {
    @apply w-4 h-4 bg-secondary rounded-full border-none appearance-none cursor-pointer;
  }

  .number-input.pl-6 {
    padding-left: 1.5rem;
  }

  .number-input.pr-8 {
    padding-right: 2rem;
  }
</style> 