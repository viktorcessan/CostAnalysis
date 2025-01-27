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

  // Form data
  let objectives: ValueObjective[] = [];
  let developmentCost = {
    hourlyRate: 0,
    hours: 0
  };
  let maintenanceCost = {
    monthly: 0
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

  onMount(() => {
    updateCharts();
  });
</script>

<div class="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
  <!-- Input Section -->
  <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 class="text-2xl font-bold">Input Data</h2>
      <CurrencySelector />
    </div>
    <!-- Value Objectives section -->
    <div class="space-y-6">
      <div class="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200 hover:border-secondary/20 transition-all duration-300">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Value Objectives</h3>
            <p class="text-sm text-gray-600 mt-1">Define how your feature creates value</p>
          </div>
          <button
            class="w-full sm:w-auto px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
            on:click={addObjective}
          >
            Add Objective
          </button>
        </div>

        <div class="space-y-4">
          {#each objectives as objective, i}
            <div class="p-4 sm:p-6 bg-white rounded-lg border border-gray-200 hover:border-secondary/20 transition-all duration-300">
              <div class="flex justify-between items-start gap-4">
                <div class="space-y-4 flex-1 min-w-0">
                  <div class="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Objective Name"
                      class="flex-1 rounded-lg border-gray-300 text-sm"
                      bind:value={objective.name}
                    />
                    <select
                      class="w-full sm:w-48 rounded-lg border-gray-300 text-sm"
                      bind:value={objective.type}
                    >
                      <option value="generate">Generate Revenue</option>
                      <option value="protect">Protect Revenue</option>
                      <option value="reduce">Reduce Costs</option>
                      <option value="avoid">Avoid Costs</option>
                    </select>
                  </div>

                  {#if objective.type === 'generate'}
                    <div class="grid grid-cols-1 gap-4">
                      <div class="form-group">
                        <label class="text-sm text-gray-600">Revenue Per Unit ({currencySymbol})</label>
                        <input
                          type="number"
                          class="w-full rounded-lg border-gray-300"
                          bind:value={objective.details.revenuePerUnit}
                        />
                      </div>
                      <div class="form-group">
                        <label class="text-sm text-gray-600">Units Sold/Used</label>
                        <input
                          type="number"
                          class="w-full rounded-lg border-gray-300"
                          bind:value={objective.details.unitsSold}
                        />
                      </div>
                      <div class="form-group">
                        <label class="text-sm text-gray-600">Frequency (per year)</label>
                        <input
                          type="number"
                          class="w-full rounded-lg border-gray-300"
                          bind:value={objective.details.frequency}
                        />
                      </div>
                    </div>
                  {:else if objective.type === 'protect'}
                    <div class="grid grid-cols-1 gap-4">
                      <div class="form-group">
                        <label class="text-sm text-gray-600">Revenue at Risk ({currencySymbol})</label>
                        <input
                          type="number"
                          class="w-full rounded-lg border-gray-300"
                          bind:value={objective.details.revenueAtRisk}
                        />
                      </div>
                      <div class="form-group">
                        <label class="text-sm text-gray-600">Retention Improvement (%)</label>
                        <input
                          type="number"
                          class="w-full rounded-lg border-gray-300"
                          bind:value={objective.details.retentionImprovement}
                        />
                      </div>
                    </div>
                  {:else if objective.type === 'reduce'}
                    <div class="grid grid-cols-1 gap-4">
                      <div class="form-group">
                        <label class="text-sm text-gray-600">Time Saved (min)</label>
                        <input
                          type="number"
                          class="w-full rounded-lg border-gray-300"
                          bind:value={objective.details.timeSaved}
                        />
                      </div>
                      <div class="form-group">
                        <label class="text-sm text-gray-600">Users Affected</label>
                        <input
                          type="number"
                          class="w-full rounded-lg border-gray-300"
                          bind:value={objective.details.users}
                        />
                      </div>
                      <div class="form-group">
                        <label class="text-sm text-gray-600">Frequency (per year)</label>
                        <input
                          type="number"
                          class="w-full rounded-lg border-gray-300"
                          bind:value={objective.details.frequency}
                        />
                      </div>
                      <div class="form-group">
                        <label class="text-sm text-gray-600">Hourly Rate ({currencySymbol})</label>
                        <input
                          type="number"
                          class="w-full rounded-lg border-gray-300"
                          bind:value={objective.details.hourlyRate}
                        />
                      </div>
                    </div>
                  {:else if objective.type === 'avoid'}
                    <div class="grid grid-cols-1 gap-4">
                      <div class="form-group">
                        <label class="text-sm text-gray-600">Potential Cost ({currencySymbol})</label>
                        <input
                          type="number"
                          class="w-full rounded-lg border-gray-300"
                          bind:value={objective.details.potentialCost}
                        />
                      </div>
                      <div class="form-group">
                        <label class="text-sm text-gray-600">Probability (%)</label>
                        <input
                          type="number"
                          class="w-full rounded-lg border-gray-300"
                          bind:value={objective.details.probability}
                        />
                      </div>
                      <div class="form-group">
                        <label class="text-sm text-gray-600">Risk Reduction (%)</label>
                        <input
                          type="number"
                          class="w-full rounded-lg border-gray-300"
                          bind:value={objective.details.riskReduction}
                        />
                      </div>
                    </div>
                  {/if}

                  <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium text-gray-600">Annual Value:</span>
                      <span class="text-base font-semibold text-secondary">{formatMoney(objective.value)}</span>
                    </div>
                  </div>
                </div>
                <button
                  class="p-2 text-red-500 hover:text-red-600 flex-shrink-0"
                  on:click={() => removeObjective(i)}
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Costs -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-xl font-semibold text-gray-900">Development & Maintenance</h3>
          <p class="text-gray-600 mt-1">Estimate implementation and ongoing costs</p>
        </div>
        
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
    </div>
  </div>

  <!-- Calculate Results Button -->
  <div class="flex justify-center">
    <button
      class="px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
      on:click={calculateResults}
    >
      Calculate Results
    </button>
  </div>

  <!-- Results Section -->
  {#if showResults}
    <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6 animate-fade-in">
      <h2 class="text-2xl font-bold mb-6">Analysis Results</h2>
      
      <!-- Key Metrics -->
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

      <!-- Charts Grid -->
      {#if hasCalculated && (totalValue > 0 || totalCost > 0)}
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
      {:else}
        <div class="text-center py-8 text-gray-600">
          <p>Add some objectives and costs to see the analysis results</p>
        </div>
      {/if}
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
</style> 