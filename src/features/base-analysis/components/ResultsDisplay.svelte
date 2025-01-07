<script lang="ts">
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import type { CalculationResults, SolutionInputs, PlatformInputs, OutsourceInputs, HybridInputs } from '$lib/types/calculator';
  import { onMount, onDestroy } from 'svelte';
  import { Chart } from 'chart.js';
  import '$lib/utils/chartSetup';
  import html2canvas from 'html2canvas';
  import { exportToExcel } from '$lib/utils/exportUtils';
  import LLMTemplateModal from '$lib/components/ui/LLMTemplateModal.svelte';
  import ExpertModal from '$lib/components/ui/ExpertModal.svelte';
  import BaseAnalysisShareModal from '$lib/components/ui/BaseAnalysisShareModal.svelte';
  import { base } from '$app/paths';

  // Chart reference
  let chart: Chart | null = null;
  let chartCanvas: HTMLCanvasElement;
  let activeChart: 'cumulative' | 'monthly' | 'savings' = 'cumulative';

  // Share state
  let showShareModal = false;

  // Chart data types
  type ChartDataPoint = number;
  type ChartDataArray = ChartDataPoint[];

  // Subscribe to the calculator store
  let results: CalculationResults;
  let currentState: { baseInputs: any; solutionInputs: any; };
  calculatorStore.subscribe((value) => {
    results = value;
    currentState = calculatorStore.getCurrentState();
  });

  // Handle share button click
  function handleShare() {
    const currentState = calculatorStore.getCurrentState();
    if (currentState.baseInputs) {
      showShareModal = true;
    }
  }

  // Watch for changes in results and chart
  $: if (chart && results?.monthlyData?.length > 0) {
    updateChart();
  }

  // Format currency values
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  // Format percentage values
  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  // Get chart title
  function getChartTitle(chartType: string): string {
    switch (chartType) {
      case 'cumulative':
        return 'Cumulative Cost';
      case 'monthly':
        return 'Monthly Cost';
      case 'savings':
        return 'Monthly Savings';
      default:
        return '';
    }
  }

  // Calculate sensitivity analysis
  function calculateSensitivity() {
    const monthlySavings = results?.monthlySavings ?? 0;
    return {
      pessimistic: monthlySavings * 0.8, // 20% worse
      base: monthlySavings,
      optimistic: monthlySavings * 1.2 // 20% better
    };
  }

  // Initialize chart
  function initChart() {
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext('2d');
    if (!ctx) return;

    const config = {
      type: 'line' as const,
      data: {
        labels: [],
        datasets: [
          {
            label: 'Baseline Cost',
            data: [],
            borderColor: '#6B7280',
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            fill: true,
            pointRadius: 0 // Hide points
          },
          {
            label: 'Solution Cost',
            data: [],
            borderColor: '#dd9933',
            backgroundColor: 'rgba(221, 153, 51, 0.1)',
            fill: true,
            pointRadius: 0 // Hide points
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index' as const,
          intersect: false
        },
        plugins: {
          datalabels: {
            display: false // Ensure data labels are off
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${formatCurrency(value)}`;
              }
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Month'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Cost'
            },
            ticks: {
              callback: (value: any) => formatCurrency(value)
            }
          }
        }
      }
    };

    chart = new Chart(ctx, config);
  }

  // Update chart data
  function updateChart() {
    if (!chart || !results?.monthlyData?.length) return;

    const labels = results.monthlyData.map(d => `Month ${d.month}`);
    let data1: ChartDataArray = [];
    let data2: ChartDataArray = [];

    switch (activeChart) {
      case 'cumulative':
        data1 = results.monthlyData.map(d => d.baseline);
        data2 = results.monthlyData.map(d => d.solution);
        chart.data.datasets[0].label = 'Baseline Cost';
        chart.data.datasets[1].label = 'Solution Cost';
        break;
      case 'monthly':
        data1 = results.monthlyData.map(d => d.baseline / d.month);
        data2 = results.monthlyData.map(d => d.solution / d.month);
        chart.data.datasets[0].label = 'Monthly Baseline';
        chart.data.datasets[1].label = 'Monthly Solution';
        break;
      case 'savings':
        data1 = results.monthlyData.map(d => d.savings);
        data2 = [];
        chart.data.datasets[0].label = 'Monthly Savings';
        chart.data.datasets[1].label = '';
        break;
    }

    chart.data.labels = labels;
    chart.data.datasets[0].data = data1;
    chart.data.datasets[1].data = data2;
    chart.update();
  }

  // Export functions
  async function handleExportExcel() {
    if (!results || !currentState.baseInputs || !currentState.solutionInputs) return;
    
    await exportToExcel({
      results,
      baseInputs: currentState.baseInputs,
      solutionInputs: currentState.solutionInputs
    });
  }

  async function handleExportPDF() {
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
      const originalCanvas = chartCanvas;
      if (originalCanvas) {
        const chartContainer = clone.querySelector('.h-80');
        if (chartContainer) {
          const newCanvas = document.createElement('canvas');
          newCanvas.width = originalCanvas.width;
          newCanvas.height = originalCanvas.height;
          const ctx = newCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(originalCanvas, 0, 0);
          }
          // Replace the old canvas in the clone
          const oldCanvas = chartContainer.querySelector('canvas');
          if (oldCanvas) {
            oldCanvas.replaceWith(newCanvas);
          }
        }
      }

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
      link.download = `service-delivery-analysis-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('PNG Export Error:', error);
      alert('There was an error generating the PNG. Please try again.');
    }
  }

  // Get savings status message
  function getSavingsMessage(savings: number): string {
    if (savings > 0) {
      return 'Projected Monthly Savings';
    } else if (savings < 0) {
      return 'Additional Monthly Cost';
    }
    return 'No Change in Cost';
  }

  // Get savings color class
  function getSavingsColorClass(savings: number): string {
    if (savings > 0) {
      return 'bg-green-50 text-green-700 border-green-200';
    } else if (savings < 0) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  }

  function getInitialCost(store: any): number {
    if (!store.solution) return 0;
    
    const currentState = calculatorStore.getCurrentState();
    if (!currentState.solutionInputs) return 0;

    const solutionInputs = currentState.solutionInputs as SolutionInputs;
    
    switch (solutionInputs.type) {
      case 'platform':
        const platform = solutionInputs.platform as PlatformInputs;
        return platform?.platformCost || 0;
      case 'outsource':
        const outsource = solutionInputs.outsource as OutsourceInputs;
        return outsource?.transitionCost || 0;
      case 'hybrid':
        const hybrid = solutionInputs.hybrid as HybridInputs;
        return (hybrid?.platformCost || 0) + (hybrid?.transitionCost || 0);
      default:
        return 0;
    }
  }

  function getTwoYearTotal(store: any): number {
    const monthlyCost = store.totalCost - store.monthlySavings;
    const initialCost = getInitialCost(store);
    return (monthlyCost * 24) + initialCost;
  }

  function getTwoYearSavings(store: any): number {
    const baselineTotal = store.totalCost * 24;
    const solutionTotal = getTwoYearTotal(store);
    return baselineTotal - solutionTotal;
  }

  // Add modal state
  let showLLMTemplate = false;
  let showExpertModal = false;

  onMount(() => {
    initChart();
    if (results?.monthlyData?.length > 0) {
      updateChart();
    }
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
</script>

<LLMTemplateModal bind:show={showLLMTemplate} />
<ExpertModal bind:show={showExpertModal} />

<div class="bg-white rounded-lg shadow-md p-6 space-y-6">
  <h3 class="text-xl font-semibold text-gray-900">Calculation Results</h3>

  <!-- Savings Banner -->
  {#if results?.monthlySavings !== undefined}
    <div class="border-2 rounded-lg p-4 {getSavingsColorClass(results.monthlySavings)}">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-lg font-semibold">{getSavingsMessage(results.monthlySavings)}</h4>
          <p class="text-3xl font-bold mt-1">
            {formatCurrency(Math.abs(results.monthlySavings))}
            <span class="text-base font-normal">per month</span>
          </p>
          {#if results.breakEvenMonths}
            <p class="mt-2 text-sm">Break-even in {results.breakEvenMonths} months</p>
          {:else}
            <p class="mt-2 text-sm text-red-600">Break-even point not achievable</p>
          {/if}
        </div>
        <div class="text-5xl">
          {#if results.monthlySavings > 0}
            💰
          {:else if results.monthlySavings < 0}
            ⚠️
          {:else}
            ➖
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Cost Metrics -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-gray-50 rounded-lg p-4">
      <h4 class="text-sm font-medium text-gray-500">Current Monthly Cost</h4>
      <p class="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(results?.totalCost ?? 0)}</p>
    </div>
    {#if results?.model === 'ticket'}
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-500">Cost per Ticket</h4>
        <p class="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(results?.costPerTicket ?? 0)}</p>
      </div>
    {/if}
    <div class="bg-gray-50 rounded-lg p-4">
      <h4 class="text-sm font-medium text-gray-500">Annual Cost</h4>
      <p class="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(results?.annualCost ?? 0)}</p>
    </div>
    {#if results?.solution}
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-500">Break-even Point</h4>
        <p class="mt-1 text-2xl font-semibold {results?.breakEvenMonths ? 'text-gray-900' : 'text-red-600'}">
          {results?.breakEvenMonths ? `${results.breakEvenMonths} months` : 'Not achievable'}
        </p>
      </div>
    {/if}
  </div>

  <!-- Cost Comparison Table -->
  <div class="bg-white rounded-lg shadow p-6 mt-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Cost Comparison</h3>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cost Category
            </th>
            <th class="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Baseline
            </th>
            <th class="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Solution
            </th>
            <th class="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Difference
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- Monthly Total -->
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Monthly Total
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
              {formatCurrency($calculatorStore.totalCost)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
              {formatCurrency($calculatorStore.totalCost - $calculatorStore.monthlySavings)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium {
              $calculatorStore.monthlySavings > 0 ? 'text-green-600' : 'text-red-600'
            }">
              {$calculatorStore.monthlySavings > 0 ? formatCurrency($calculatorStore.monthlySavings) + ' saved' : formatCurrency(Math.abs($calculatorStore.monthlySavings)) + ' extra'}
            </td>
          </tr>
          <!-- Initial Cost -->
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Initial Cost
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
              {formatCurrency(0)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
              {formatCurrency(getInitialCost($calculatorStore))}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
              {formatCurrency(getInitialCost($calculatorStore))} extra
            </td>
          </tr>
          <!-- 2-Year Total -->
          <tr class="bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              2-Year Total
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
              {formatCurrency($calculatorStore.totalCost * 24)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
              {formatCurrency(getTwoYearTotal($calculatorStore))}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium {
              getTwoYearSavings($calculatorStore) > 0 ? 'text-green-600' : 'text-red-600'
            }">
              {getTwoYearSavings($calculatorStore) > 0 
                ? formatCurrency(getTwoYearSavings($calculatorStore)) + ' saved'
                : formatCurrency(Math.abs(getTwoYearSavings($calculatorStore))) + ' extra'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Chart Controls -->
  <div class="flex justify-center gap-4">
    {#each ['cumulative', 'monthly', 'savings'] as chartType}
      <button
        class="px-4 py-2 rounded-lg transition-all {
          activeChart === chartType
            ? 'bg-secondary text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }"
        on:click={() => {
          activeChart = chartType as typeof activeChart;
          updateChart();
        }}
      >
        {getChartTitle(chartType)}
      </button>
    {/each}
  </div>

  <!-- Chart -->
  <div class="h-80 bg-gray-50 rounded-lg p-4">
    <canvas bind:this={chartCanvas}></canvas>
  </div>

  <!-- Sensitivity Analysis -->
  <div class="bg-white rounded-lg shadow-lg p-6">
    <div class="flex items-center justify-between mb-6">
      <h4 class="text-lg font-semibold text-gray-900">Sensitivity Analysis</h4>
      <div class="text-sm text-gray-600">
        Analysis based on ±20% variation in cost savings
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each Object.entries(calculateSensitivity()) as [scenario, value]}
        <div class="{
          scenario === 'pessimistic' ? 'bg-red-50 border-red-100' :
          scenario === 'base' ? 'bg-blue-50 border-blue-100' :
          'bg-green-50 border-green-100'
        } rounded-lg p-6 border shadow-sm">
          <h5 class="text-base font-semibold capitalize {
            scenario === 'pessimistic' ? 'text-red-800' :
            scenario === 'base' ? 'text-blue-800' :
            'text-green-800'
          }">{scenario} Case</h5>
          <p class="mt-2 text-sm {
            scenario === 'pessimistic' ? 'text-red-600' :
            scenario === 'base' ? 'text-blue-600' :
            'text-green-600'
          }">
            {scenario === 'pessimistic' ? 'Assumes 20% lower cost savings, accounting for potential risks and implementation challenges.' :
             scenario === 'base' ? 'Expected savings based on current projections and standard assumptions.' :
             'Assumes 20% higher cost savings, representing potential upside from efficiency gains.'}
          </p>
          <div class="mt-4 space-y-3">
            <div>
              <div class="text-sm {
                scenario === 'pessimistic' ? 'text-red-600' :
                scenario === 'base' ? 'text-blue-600' :
                'text-green-600'
              }">Monthly Impact</div>
              <div class="text-2xl font-bold {
                value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
              }">
                {formatCurrency(Math.abs(value))}
                <span class="text-base font-medium">
                  {value >= 0 ? 'saved' : 'cost'}
                </span>
              </div>
            </div>
            <div>
              <div class="text-sm {
                scenario === 'pessimistic' ? 'text-red-600' :
                scenario === 'base' ? 'text-blue-600' :
                'text-green-600'
              }">Annual Impact</div>
              <div class="text-xl font-semibold {
                value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
              }">
                {formatCurrency(Math.abs(value * 12))}
              </div>
            </div>
            {#if results?.breakEvenMonths}
              <div>
                <div class="text-sm {
                  scenario === 'pessimistic' ? 'text-red-600' :
                  scenario === 'base' ? 'text-blue-600' :
                  'text-green-600'
                }">Break-even Period</div>
                <div class="text-xl font-semibold {
                  scenario === 'pessimistic' ? 'text-red-800' :
                  scenario === 'base' ? 'text-blue-800' :
                  'text-green-800'
                }">
                  {Math.ceil(results.breakEvenMonths * (
                    scenario === 'pessimistic' ? 1.2 :
                    scenario === 'optimistic' ? 0.8 :
                    1
                  ))} months
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Export Buttons -->
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
            <p class="text-gray-600">Schedule a consultation with our service delivery expert to dive deeper into your analysis and develop a tailored optimization strategy.</p>
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
                  <span>Personalized optimization strategy</span>
                </li>
                <li class="flex items-center text-gray-700 gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                    <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <span>Implementation roadmap</span>
                </li>
                <li class="flex items-center text-gray-700 gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                    <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <span>Risk assessment and mitigation</span>
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
          <p class="text-gray-600 mb-4">Get instant AI insights about your service delivery model and potential optimizations.</p>
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

        <!-- Export Options -->
        <div class="bg-white rounded-xl p-6 border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Export Analysis</h3>
          <p class="text-gray-600 mb-4">Download your analysis for offline review or sharing.</p>
          <div class="flex gap-3">
            <button
              on:click={handleShare}
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 shadow hover:shadow-lg transition-all duration-200"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
                Share
              </div>
            </button>
            <button
              on:click={handleExportExcel}
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow hover:shadow-lg transition-all duration-200"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Excel
              </div>
            </button>
            <button
              on:click={handleExportPDF}
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow hover:shadow-lg transition-all duration-200"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                PNG
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Share Modal -->
  {#if showShareModal}
    <BaseAnalysisShareModal
      bind:show={showShareModal}
      model={$calculatorStore.model}
      baseInputs={currentState.baseInputs}
      solutionInputs={currentState.solutionInputs}
    />
  {/if}
</div> 