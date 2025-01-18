<script lang="ts">
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import type { CalculationResults, SolutionInputs, PlatformInputs, OutsourceInputs, HybridInputs } from '$lib/types/calculator';
  import { onMount, onDestroy } from 'svelte';
  import { Chart } from 'chart.js';
  import annotationPlugin from 'chartjs-plugin-annotation';
  import '$lib/utils/chartSetup';
  import html2canvas from 'html2canvas';
  import { exportToExcel } from '$lib/utils/exportUtils';
  import LLMTemplateModal from '$lib/components/ui/LLMTemplateModal.svelte';
  import ExpertModal from '$lib/components/ui/ExpertModal.svelte';
  import BaseAnalysisShareModal from '$lib/components/ui/BaseAnalysisShareModal.svelte';
  import { base } from '$app/paths';
  import ExpertConsultationCard from '$lib/components/ui/ExpertConsultationCard.svelte';

  // Register the annotation plugin
  Chart.register(annotationPlugin);

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

  // Calculate crossover point
  function calculateCrossoverPoint(): number {
    if (!results?.monthlySavings || !currentState.solutionInputs) return 0;
    
    const initialCost = getInitialCost($calculatorStore);
    const monthlySavings = results.monthlySavings;
    
    // If no savings or negative savings, no crossover point
    if (monthlySavings <= 0) return 0;
    
    // Calculate when cumulative savings offset the initial investment
    // This is when the cumulative savings equals the initial cost
    return Math.ceil(initialCost / monthlySavings);
  }

  // Calculate break even point
  function calculateBreakEvenPoint(): number {
    if (!results?.monthlySavings || !currentState.solutionInputs) return 0;
    
    const initialCost = getInitialCost($calculatorStore);
    const monthlySavings = results.monthlySavings;
    
    // If no savings or negative savings, no break-even point
    if (monthlySavings <= 0) return 0;
    
    // Calculate when total accumulated savings equal the initial investment
    return Math.ceil((initialCost * 2) / monthlySavings);
  }

  // Initialize chart
  function initChart() {
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext('2d');
    if (!ctx) return;

    const breakEvenPoint = calculateBreakEvenPoint();
    const crossoverPoint = calculateCrossoverPoint();

    const config = {
      type: 'line' as const,
      data: {
        labels: [],
        datasets: [
          {
            label: 'Current Cost',
            data: [],
            borderColor: '#6B7280',
            backgroundColor: 'rgba(107, 114, 128, 0.05)',
            fill: true,
            pointRadius: 0,
            borderWidth: 2,
            tension: 0
          },
          {
            label: 'Solution Cost',
            data: [],
            borderColor: '#dd9933',
            backgroundColor: 'rgba(221, 153, 51, 0.05)',
            fill: true,
            pointRadius: 0,
            borderWidth: 2,
            tension: 0
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
          title: {
            display: true,
            text: 'Cost Analysis Over Time',
            font: {
              size: 16,
              weight: 'bold' as const
            },
            padding: 20
          },
          subtitle: {
            display: true,
            text: 'Compare costs between current operations and proposed solution',
            font: {
              size: 14
            },
            padding: {
              bottom: 20
            }
          },
          datalabels: {
            display: false
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
            display: true,
            position: 'top' as const,
            align: 'end' as const,
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 12
              }
            }
          },
          annotation: {
            common: {
              drawTime: 'afterDatasetsDraw'
            },
            annotations: {
              crossover: {
                type: 'line' as const,
                xMin: crossoverPoint,
                xMax: crossoverPoint,
                borderColor: '#dd9933',
                borderWidth: 2,
                borderDash: [6, 6],
                label: {
                  display: true,
                  content: `Cost Savings Crossover (Month ${crossoverPoint})`,
                  position: 'start',
                  backgroundColor: '#dd9933',
                  color: 'white',
                  font: { size: 12 },
                  padding: 8,
                  yAdjust: -60
                }
              },
              breakEven: {
                type: 'line' as const,
                xMin: breakEvenPoint,
                xMax: breakEvenPoint,
                borderColor: '#10B981',
                borderWidth: 2,
                borderDash: [6, 6],
                label: {
                  display: true,
                  content: `Break-even (Month ${breakEvenPoint})`,
                  position: 'start',
                  backgroundColor: '#10B981',
                  color: 'white',
                  font: { size: 12 },
                  padding: 8,
                  yAdjust: -40
                }
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Month',
              padding: 10,
              font: {
                size: 12,
                weight: 'bold' as const
              }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Cost',
              padding: 10,
              font: {
                size: 12,
                weight: 'bold' as const
              }
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
    let buildPeriod = 0;
    let breakEvenPoint = results.breakEvenMonths || 0;

    // Get build/transition period based on solution type
    const currentState = calculatorStore.getCurrentState();
    if (currentState.solutionInputs) {
      switch (currentState.solutionInputs.type) {
        case 'platform':
          buildPeriod = currentState.solutionInputs.platform?.timeToBuild || 0;
          break;
        case 'outsource':
          buildPeriod = currentState.solutionInputs.outsource?.transitionTime || 0;
          break;
        case 'hybrid':
          buildPeriod = Math.max(
            currentState.solutionInputs.hybrid?.timeToBuild || 0,
            currentState.solutionInputs.hybrid?.transitionTime || 0
          );
          break;
      }
    }

    // Update datasets based on chart type
    switch (activeChart) {
      case 'cumulative':
        // Calculate cumulative costs correctly
        data1 = results.monthlyData.reduce((acc, d) => {
          const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
          // Current cost is always the same monthly
          acc.push(prev + results.totalCost);
          return acc;
        }, [] as number[]);
        
        data2 = results.monthlyData.reduce((acc, d) => {
          const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
          let monthlyCost = 0;
          
          if (d.month <= buildPeriod) {
            // During build period:
            // 1. Full current cost (as we're still operating normally)
            // 2. Plus the implementation cost spread over the build period
            const implementationCost = currentState.solutionInputs?.platform?.platformCost || 0;
            monthlyCost = results.totalCost + (implementationCost / buildPeriod);
          } else {
            // After build period:
            // Just the reduced monthly cost
            monthlyCost = results.totalCost - results.monthlySavings;
          }
          
          acc.push(prev + monthlyCost);
          return acc;
        }, [] as number[]);

        chart.data.datasets[0].label = 'Cumulative Current Cost';
        chart.data.datasets[1].label = 'Cumulative Solution Cost';
        chart.data.datasets[0].borderColor = '#6B7280';
        chart.data.datasets[1].borderColor = '#dd9933';
        chart.data.datasets[0].backgroundColor = 'rgba(107, 114, 128, 0.05)';
        chart.data.datasets[1].backgroundColor = 'rgba(221, 153, 51, 0.05)';
        chart.data.datasets[0].hidden = false;
        chart.data.datasets[1].hidden = false;
        break;

      case 'monthly':
        // Use actual monthly costs
        data1 = results.monthlyData.map(() => results.totalCost); // Current cost is always flat
        data2 = results.monthlyData.map((d) => {
          if (d.month <= buildPeriod) {
            // During build period: current cost + implementation cost
            const implementationCost = currentState.solutionInputs?.platform?.platformCost || 0;
            return results.totalCost + (implementationCost / buildPeriod);
          } else {
            // After build period: just the reduced monthly cost
            return results.totalCost - results.monthlySavings;
          }
        });
        chart.data.datasets[0].label = 'Monthly Current Cost';
        chart.data.datasets[1].label = 'Monthly Solution Cost';
        chart.data.datasets[0].borderColor = '#6B7280';
        chart.data.datasets[1].borderColor = '#dd9933';
        chart.data.datasets[0].backgroundColor = 'rgba(107, 114, 128, 0.05)';
        chart.data.datasets[1].backgroundColor = 'rgba(221, 153, 51, 0.05)';
        chart.data.datasets[0].hidden = false;
        chart.data.datasets[1].hidden = false;
        break;

      case 'savings':
        // Calculate actual monthly savings
        data1 = results.monthlyData.map((d) => {
          if (d.month <= buildPeriod) {
            // During build period: negative savings due to implementation costs
            const implementationCost = currentState.solutionInputs?.platform?.platformCost || 0;
            return -(implementationCost / buildPeriod);
          } else {
            // After build period: constant monthly savings
            return results.monthlySavings;
          }
        });
        
        chart.data.datasets[0].label = 'Monthly Savings';
        chart.data.datasets[0].borderColor = '#dd9933';
        chart.data.datasets[0].backgroundColor = 'rgba(221, 153, 51, 0.05)';
        chart.data.datasets[0].hidden = false;
        // Completely remove second dataset for savings view
        chart.data.datasets[1].data = [];
        chart.data.datasets[1].hidden = true;
        chart.data.datasets[1].label = '';
        break;
    }

    // Update break-even annotation
    if (chart.options.plugins?.annotation?.annotations) {
      const annotations = chart.options.plugins.annotation.annotations as any;
      const crossoverPoint = calculateCrossoverPoint();
      const breakEvenPoint = calculateBreakEvenPoint();
      
      // Update crossover point annotation
      annotations.crossover.xMin = crossoverPoint;
      annotations.crossover.xMax = crossoverPoint;
      annotations.crossover.label.content = `Cost Savings Crossover (Month ${crossoverPoint})`;
      annotations.crossover.display = crossoverPoint > 0;

      // Update break-even point annotation
      annotations.breakEven.xMin = breakEvenPoint;
      annotations.breakEven.xMax = breakEvenPoint;
      annotations.breakEven.label.content = `Break-even Point (Month ${breakEvenPoint})`;
      annotations.breakEven.display = breakEvenPoint > 0;
    }

    // Update chart description
    const chartDescription = document.getElementById('chart-description');
    if (chartDescription) {
      let description = '';
      const solutionType = currentState.solutionInputs?.type || 'solution';
      
      switch (activeChart) {
        case 'cumulative':
          description = `This chart shows the total accumulated costs over time for both your current operation and the proposed ${solutionType} solution. ${
            buildPeriod ? `During the ${buildPeriod}-month ${
              solutionType === 'platform' ? 'build' :
              solutionType === 'outsource' ? 'transition' :
              'build/transition'} period, you'll incur both current operational costs and implementation costs. ` : ''
          }${breakEvenPoint ? `The orange dashed line indicates the break-even point at month ${breakEvenPoint}, after which the solution starts generating net savings.` : ''}`;
          break;
        case 'monthly':
          description = `This chart compares the monthly operational costs between your current operation and the proposed ${solutionType} solution. ${
            buildPeriod ? `During the initial ${buildPeriod}-month ${
              solutionType === 'platform' ? 'build' :
              solutionType === 'outsource' ? 'transition' :
              'build/transition'} period, costs are typically higher due to parallel operations and implementation expenses. ` : ''
          }After this period, you'll see the full effect of the cost reduction strategy.`;
          break;
        case 'savings':
          description = `This chart illustrates your projected monthly savings after implementing the ${solutionType} solution. ${
            buildPeriod ? `Note that during the ${buildPeriod}-month ${
              solutionType === 'platform' ? 'build' :
              solutionType === 'outsource' ? 'transition' :
              'build/transition'} period, savings may be negative due to implementation costs. ` : ''
          }${breakEvenPoint ? `You'll reach the break-even point at month ${breakEvenPoint}, after which you'll see consistent positive savings of ${formatCurrency(results.monthlySavings)}.` : ''}`;
          break;
      }
      chartDescription.textContent = description;
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
      // Wait a moment for the chart to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));

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
        const chartContainer = clone.querySelector('.chart-container');
        if (chartContainer) {
          const newCanvas = document.createElement('canvas');
          newCanvas.width = originalCanvas.width;
          newCanvas.height = originalCanvas.height;
          const ctx = newCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(originalCanvas, 0, 0);
            // Ensure the new canvas has the same dimensions as the chart container
            newCanvas.style.width = '100%';
            newCanvas.style.height = '100%';
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
        <h4 class="text-sm font-medium text-gray-500">Cost Savings Crossover</h4>
        <p class="mt-1 text-2xl font-semibold {calculateCrossoverPoint() ? 'text-gray-900' : 'text-red-600'}">
          {calculateCrossoverPoint() ? `${calculateCrossoverPoint()} months` : 'Not achievable'}
        </p>
        <p class="text-xs text-gray-600 mt-1">When cumulative savings offset initial investment</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-500">Break-even Point</h4>
        <p class="mt-1 text-2xl font-semibold {calculateBreakEvenPoint() ? 'text-gray-900' : 'text-red-600'}">
          {calculateBreakEvenPoint() ? `${calculateBreakEvenPoint()} months` : 'Not achievable'}
        </p>
        <p class="text-xs text-gray-600 mt-1">When total savings equal initial investment</p>
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
  <div class="flex flex-col items-center gap-4">
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
    <p id="chart-description" class="text-sm text-gray-600 text-center max-w-2xl"></p>
  </div>

  <!-- Chart -->
  <div class="h-[500px] chart-container bg-gray-50 rounded-lg p-4">
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
                }">Crossover Period</div>
                <div class="text-xl font-semibold {
                  scenario === 'pessimistic' ? 'text-red-800' :
                  scenario === 'base' ? 'text-blue-800' :
                  'text-green-800'
                }">
                  {Math.ceil(calculateCrossoverPoint() * (
                    scenario === 'pessimistic' ? 1.2 :
                    scenario === 'optimistic' ? 0.8 :
                    1
                  ))} months
                </div>
              </div>
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
                  {Math.ceil(calculateBreakEvenPoint() * (
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
      <div class="lg:col-span-2">
        <ExpertConsultationCard {base} bind:showExpertModal />
      </div>

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
              Generate AI Insights
            </div>
          </button>
        </div>

        <!-- Export Options -->
        <div class="bg-white rounded-xl p-6 border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Export Analysis</h3>
          <p class="text-gray-600 mb-4">Download your analysis for offline review or sharing.</p>
          <div class="flex flex-col gap-3">
            <button
              on:click={handleShare}
              class="w-full px-4 py-3 text-base font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 shadow hover:shadow-lg transition-all duration-200"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632 3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
                Share Analysis
              </div>
            </button>
            <button
              on:click={handleExportExcel}
              class="w-full px-4 py-3 text-base font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow hover:shadow-lg transition-all duration-200"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 00-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export to Excel
              </div>
            </button>
            <button
              on:click={handleExportPDF}
              class="w-full px-4 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow hover:shadow-lg transition-all duration-200"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Export as PNG
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