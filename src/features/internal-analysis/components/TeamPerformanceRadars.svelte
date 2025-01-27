<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, type ChartConfiguration } from 'chart.js/auto';
  import type { Node, Edge, DependencyMatrix } from '$lib/types/teamDependency';

  export let nodes: Node[];
  export let edges: Edge[];
  export let dependencyMatrix: DependencyMatrix;
  export let metrics: {
    avgThroughput: number;
    avgLeadTime: number;
    flowEfficiency: number;
    utilizationRate: number;
  };
  export let teamCommunicationMetrics: {
    meetingHours: number;
    overheadHours: number;
    additionalHours: number;
    totalHours: number;
  }[];
  export let costParams: {
    hourlyRate: {
      developer: number;
    };
  };

  let radarCharts: { [key: string]: Chart } = {};
  let showLegend = false;

  interface TeamPerformanceMetrics {
    efficiencyScore: number;
    valueDensity: number;
    dependencyImpact: number;
    flowRate: number;
    resourceUtilization: number;
    autonomy: number;
    costEfficiency: number;
    teamVelocity: number;
  }

  function calculateTeamMetrics(node: Node, index: number): TeamPerformanceMetrics {
    // Get dependencies
    const incomingDeps = dependencyMatrix.dependencies.map(row => row[index]).filter(v => v > 0);
    const outgoingDeps = dependencyMatrix.dependencies[index].filter(v => v > 0);
    const totalDeps = incomingDeps.length + outgoingDeps.length;
    const maxPossibleDeps = (nodes.length - 1) * 2; // bidirectional connections to all other nodes
    const totalDependencyStrength = [...incomingDeps, ...outgoingDeps].reduce((sum, val) => sum + val, 0);

    // Calculate metrics
    const efficiencyScore = (node.data.efficiency * calculateFlowRate(node)) / (node.data.leadTime * 100);
    const valueDensity = (node.data.throughput * node.data.efficiency) / (node.data.size * totalDeps || 1);
    const dependencyImpact = totalDeps * (totalDependencyStrength / (totalDeps * 5 || 1));
    const flowRate = calculateFlowRate(node);
    const resourceUtilization = calculateResourceUtilization(index);
    const autonomy = (1 - (totalDeps / maxPossibleDeps)) * 100;
    const costEfficiency = calculateCostEfficiency(node, index);
    const teamVelocity = (node.data.throughput / 30) * (1 - node.data.dependencyFactor); // monthly to daily

    return {
      efficiencyScore,
      valueDensity,
      dependencyImpact,
      flowRate,
      resourceUtilization,
      autonomy,
      costEfficiency,
      teamVelocity
    };
  }

  function calculateFlowRate(node: Node): number {
    // Convert monthly throughput to daily by dividing by workdays in a month (approx 22)
    return (node.data.throughput / 22);
  }

  function calculateResourceUtilization(index: number): number {
    const metrics = teamCommunicationMetrics[index];
    if (!metrics) return 0;
    
    const totalAvailableHours = nodes[index].data.size * 160; // 160 hours per person per month
    const totalUsedHours = metrics.meetingHours + metrics.overheadHours + metrics.additionalHours;
    return (totalUsedHours / totalAvailableHours) * 100;
  }

  function calculateCostEfficiency(node: Node, index: number): number {
    const metrics = teamCommunicationMetrics[index];
    if (!metrics) return 0;
    
    const totalCost = (metrics.totalHours * costParams.hourlyRate.developer);
    return (node.data.throughput * node.data.efficiency) / (totalCost / 1000);
  }

  function normalizeMetrics(metrics: TeamPerformanceMetrics[]): TeamPerformanceMetrics[] {
    const dimensions = Object.keys(metrics[0]) as (keyof TeamPerformanceMetrics)[];
    
    return metrics.map(teamMetrics => {
      const normalizedMetrics = { ...teamMetrics };
      
      dimensions.forEach(dimension => {
        const values = metrics.map(m => m[dimension]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        
        normalizedMetrics[dimension] = range === 0 
          ? 50 // Default to middle if all values are the same
          : ((teamMetrics[dimension] - min) / range) * 100;
      });
      
      return normalizedMetrics;
    });
  }

  function createRadarChart(canvas: HTMLCanvasElement, metrics: TeamPerformanceMetrics, teamName: string) {
    const config: ChartConfiguration = {
      type: 'radar',
      data: {
        labels: [
          'Efficiency Score',
          'Value Density',
          'Dependency Impact',
          'Flow Rate',
          'Resource Utilization',
          'Autonomy',
          'Cost Efficiency',
          'Team Velocity'
        ],
        datasets: [{
          label: teamName,
          data: [
            Number(metrics.efficiencyScore.toFixed(1)),
            Number(metrics.valueDensity.toFixed(1)),
            Number(metrics.dependencyImpact.toFixed(1)),
            Number(metrics.flowRate.toFixed(1)),
            Number(metrics.resourceUtilization.toFixed(1)),
            Number(metrics.autonomy.toFixed(1)),
            Number(metrics.costEfficiency.toFixed(1)),
            Number(metrics.teamVelocity.toFixed(1))
          ],
          fill: true,
          backgroundColor: 'rgba(221, 153, 51, 0.1)', // Using primary color
          borderColor: 'rgb(221, 153, 51)', // Primary color
          borderWidth: 2,
          pointBackgroundColor: 'rgb(221, 153, 51)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(221, 153, 51)',
          pointRadius: 3,
          pointHoverRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            beginAtZero: true,
            ticks: {
              stepSize: 20,
              callback: function(value) {
                if (typeof value === 'number') {
                  return value.toFixed(0);
                }
                return '';
              },
              color: 'rgb(107, 114, 128)'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              lineWidth: 1
            },
            angleLines: {
              color: 'rgba(0, 0, 0, 0.1)',
              lineWidth: 1
            },
            pointLabels: {
              font: {
                size: 11,
                family: "'Inter', system-ui, sans-serif",
                weight: 500
              },
              padding: 8,
              color: 'rgb(55, 65, 81)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: 'rgb(17, 24, 39)',
            bodyColor: 'rgb(55, 65, 81)',
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            titleFont: {
              size: 13,
              weight: 600,
              family: "'Inter', system-ui, sans-serif"
            },
            bodyFont: {
              size: 12,
              family: "'Inter', system-ui, sans-serif"
            },
            callbacks: {
              title: (items) => {
                if (items[0]) {
                  return items[0].label;
                }
                return '';
              },
              label: (context) => {
                const value = typeof context.raw === 'number' ? context.raw.toFixed(1) : '0.0';
                return `Value: ${value}`;
              }
            }
          }
        }
      }
    };

    return new Chart(canvas, config);
  }

  function updateCharts() {
    // Calculate raw metrics for each team
    const rawMetrics = nodes.map((node, index) => calculateTeamMetrics(node, index));
    
    // Normalize metrics
    const normalizedMetrics = normalizeMetrics(rawMetrics);
    
    // Update or create charts
    nodes.forEach((node, index) => {
      const canvas = document.getElementById(`radar-${index}`) as HTMLCanvasElement;
      if (!canvas) return;

      if (radarCharts[index]) {
        radarCharts[index].destroy();
      }

      radarCharts[index] = createRadarChart(canvas, normalizedMetrics[index], node.data.label);
    });
  }

  $: {
    if (nodes.length > 0 && teamCommunicationMetrics.length > 0) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(updateCharts, 0);
    }
  }

  onMount(() => {
    if (nodes.length > 0 && teamCommunicationMetrics.length > 0) {
      updateCharts();
    }
  });
</script>

<div class="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg shadow-lg border border-gray-200">
  <div class="mb-6">
    <h3 class="text-lg font-semibold text-gray-900">Team Performance Radars</h3>
    <p class="text-gray-600 mt-1">
      See how each team's metrics shape their operational profile. Patterns highlight where teams excel and where targeted improvements could boost overall effectiveness.
    </p>
  </div>

  <!-- Radar Charts Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-2 mb-6">
    {#each nodes as node, i}
      <div class="bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div class="p-6">
          <div class="mb-6">
            <h4 class="text-base font-semibold text-gray-800">{node.data.label}</h4>
          </div>
          <div class="relative h-[300px]">
            <canvas id="radar-{i}" class="transition-opacity duration-300"></canvas>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Performance Metrics Legend (Expandable) -->
  <div class="border-t border-gray-200 pt-4">
    <button
      class="w-full flex items-center justify-between p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors group"
      on:click={() => showLegend = !showLegend}
    >
      <div class="flex items-center gap-2">
        <svg
          class="w-5 h-5 text-gray-500 transform transition-transform duration-200 {showLegend ? 'rotate-180' : ''}"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        <span class="text-sm font-medium text-gray-900">Performance Dimensions Details</span>
      </div>
      <span class="text-sm text-gray-500">{showLegend ? 'Hide' : 'Show'} details</span>
    </button>

    {#if showLegend}
      <div class="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-300">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div class="text-sm font-medium text-gray-700">Efficiency Score</div>
            <div class="text-xs text-gray-600">Base efficiency × flow rate / lead time</div>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div class="text-sm font-medium text-gray-700">Value Density</div>
            <div class="text-xs text-gray-600">Throughput × efficiency / team size and dependencies</div>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div class="text-sm font-medium text-gray-700">Dependency Impact</div>
            <div class="text-xs text-gray-600">Total dependencies × average strength</div>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div class="text-sm font-medium text-gray-700">Flow Rate</div>
            <div class="text-xs text-gray-600">Daily throughput / lead time</div>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div class="text-sm font-medium text-gray-700">Resource Utilization</div>
            <div class="text-xs text-gray-600">Used hours / available hours</div>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div class="text-sm font-medium text-gray-700">Autonomy</div>
            <div class="text-xs text-gray-600">Independence from other teams</div>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div class="text-sm font-medium text-gray-700">Cost Efficiency</div>
            <div class="text-xs text-gray-600">Value delivered per cost unit</div>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div class="text-sm font-medium text-gray-700">Team Velocity</div>
            <div class="text-xs text-gray-600">Completion rate adjusted for dependencies</div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div> 