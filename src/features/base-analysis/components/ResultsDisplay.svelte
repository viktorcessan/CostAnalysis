<script lang="ts">
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import type { CalculationResults, SolutionInputs, PlatformInputs, OutsourceInputs, HybridInputs } from '$lib/types/calculator';
  import { onMount, onDestroy } from 'svelte';
  import { Chart } from 'chart.js';
  import '$lib/utils/chartSetup';
  import html2canvas from 'html2canvas';
  import { jsPDF } from 'jspdf';
  import { exportToExcel } from '$lib/utils/exportUtils';

  // Chart reference
  let chart: Chart | null = null;
  let chartCanvas: HTMLCanvasElement;
  let activeChart: 'cumulative' | 'monthly' | 'savings' = 'cumulative';

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
            fill: true
          },
          {
            label: 'Solution Cost',
            data: [],
            borderColor: '#dd9933',
            backgroundColor: 'rgba(221, 153, 51, 0.1)',
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${formatCurrency(value)}`;
              }
            }
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
      // Get the entire results container
      const element = document.querySelector('.bg-white.rounded-lg.shadow-md.p-6.space-y-6');
      if (!element || !(element instanceof HTMLElement)) {
        throw new Error('Could not find results container');
      }

      // Create canvas from the element
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY // Handle scrolled content
      });

      // Create PDF with A4 dimensions
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // Calculate image dimensions to fit the page
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add title
      pdf.setFontSize(16);
      pdf.setTextColor(0);
      const title = 'Service Delivery Cost Analysis';
      const titleWidth = pdf.getStringUnitWidth(title) * 16 / pdf.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(title, titleX, margin + 10);

      // Add timestamp
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      const date = new Date().toLocaleString();
      const dateWidth = pdf.getStringUnitWidth(date) * 10 / pdf.internal.scaleFactor;
      const dateX = (pageWidth - dateWidth) / 2;
      pdf.text(date, dateX, margin + 30);

      // Add image to PDF, automatically handling page breaks
      let heightLeft = imgHeight;
      let position = margin + 50;
      let pageNumber = 1;

      // First page
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - position;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = margin;
        heightLeft -= pageHeight - margin;
        pdf.addPage();
        pageNumber++;
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      }

      // Add page numbers
      for (let i = 1; i <= pageNumber; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        const pageText = `Page ${i} of ${pageNumber}`;
        const pageTextWidth = pdf.getStringUnitWidth(pageText) * 10 / pdf.internal.scaleFactor;
        const pageTextX = (pageWidth - pageTextWidth) / 2;
        pdf.text(pageText, pageTextX, pageHeight - 10);
      }

      // Save the PDF
      pdf.save('service-delivery-analysis.pdf');
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('There was an error generating the PDF. Please try again.');
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
  <div class="flex justify-end gap-4 pt-4 border-t">
    <button
      on:click={handleExportExcel}
      class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export Excel
    </button>
    <button
      on:click={handleExportPDF}
      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export PDF
    </button>
  </div>
</div> 