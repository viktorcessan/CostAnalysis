<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import ChartDataLabels from 'chartjs-plugin-datalabels';
  import type { ChartConfiguration, ChartData, ChartOptions, DoughnutControllerChartOptions, Plugin } from 'chart.js';
  
  Chart.register(ChartDataLabels);  // Register the plugin
  
  interface Team {
    name: string;
    size: number;
    baseCapacity: number;
    efficiency: number;
  }

  interface DependencyMatrix {
    teams: string[];
    dependencies: number[][];
  }

  interface Node {
    id: string;
    data: {
      label: string;
      size: number;
      efficiency: number;
      throughput: number;
      leadTime: number;
      dependencyFactor: number;
    };
  }

  interface Edge {
    id: string;
    source: string;
    target: string;
    data: {
      strength: number;
      type: string;
    };
  }

  // Team parameters
  let teamParams = {
    teams: Array(10).fill(null).map((_, i) => ({
      name: `Team ${i + 1}`,
      size: 5,
      baseCapacity: 8,  // Base items per person per week
      efficiency: 1.0   // Team efficiency multiplier
    })) as Team[],
    baseLeadTime: 3,          // Base lead time in days
    dependencyImpact: 0.15    // How much each dependency affects performance
  };

  let nodes: any[] = [];
  let edges: any[] = [];
  let mode: 'even' | 'uneven' | 'advanced' = 'even';
  let teamCount = 5;
  let companyDependencyLevel = 3; // Scale of 1-5 for overall company dependency level
  let dependencyMatrix = initializeDependencyMatrix(teamCount);

  interface Metrics {
    avgThroughput: number;
    avgLeadTime: number;
    dependencyComplexity: number;
    flowEfficiency: number;
    dependencyImpactScore: number;
    utilizationRate: number;
    serviceEfficiency: number;
    costPerFTE: number;
    overheadRatio: number;
  }

  let metrics: Metrics = { 
    avgThroughput: 0, 
    avgLeadTime: 0, 
    dependencyComplexity: 0,
    flowEfficiency: 0,
    dependencyImpactScore: 0,
    utilizationRate: 0,
    serviceEfficiency: 0,
    costPerFTE: 0,
    overheadRatio: 0
  };

  // Cost parameters
  let costParams = {
    hourlyRate: {
      developer: 75,
      manager: 100,
      teamLead: 90
    },
    meetings: {
      weeklyDuration: 4,
      attendeesPerTeam: 5
    },
    overhead: {
      communicationOverhead: 1.2,
      waitTimeMultiplier: 1.5
    }
  };

  let costDistributionChart: Chart | null = null;
  let costChartCanvas: HTMLCanvasElement;

  interface CostAnalysis {
    weeklyMeetingCost: number;
    communicationCost: number;
    processOverhead: number;
    totalCost: number;
  }

  function createCostDistributionChart(costs: CostAnalysis) {
    if (costDistributionChart) {
      costDistributionChart.destroy();
    }

    const chartConfig: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      plugins: [ChartDataLabels as Plugin],
      data: {
        labels: ['Meetings', 'Communication', 'Process'],
        datasets: [{
          data: [
            costs.weeklyMeetingCost,
            costs.communicationCost,
            costs.processOverhead
          ],
          backgroundColor: [
            '#dd9933',  // secondary (was blue)
            '#f59e0b',  // amber
            '#ec4899'   // pink
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
          spacing: 2,
          borderRadius: 4,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 30,
            right: 30,
            bottom: 30,
            left: 30
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const dataset = context.chart.data.datasets[0];
                if (!dataset?.data) return '';
                
                const value = context.raw as number;
                const total = dataset.data.reduce((sum: number, val: number) => sum + (val || 0), 0);
                const percentage = ((value / total) * 100).toFixed(1);
                
                // Add detailed info in tooltip
                const details = [
                  ['Weekly sync meetings', 'Sprint planning', 'Retrospectives'],
                  ['Inter-team coordination', 'Documentation', 'Knowledge sharing'],
                  ['Process maintenance', 'Quality assurance', 'Workflow optimization']
                ][context.dataIndex];
                
                return [
                  `$${value.toFixed(2)} (${percentage}%)`,
                  `Includes:`,
                  ...details.map(d => `• ${d}`)
                ];
              }
            },
            padding: 12,
            bodySpacing: 4,
            bodyFont: {
              size: 12
            }
          },
          datalabels: {
            color: '#ffffff',
            font: {
              size: 13,
              family: 'system-ui, sans-serif'
            },
            formatter: (value: number, context: any) => {
              const total = context.dataset.data.reduce((sum: number, val: number) => sum + (val || 0), 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return [
                context.chart.data.labels[context.dataIndex],
                `${percentage}%`
              ].join('\n');
            },
            textAlign: 'center',
            offset: 8,
            display: 'auto',
            textStrokeColor: 'rgba(0,0,0,0.3)',
            textStrokeWidth: 3,
            textShadowBlur: 6,
            textShadowColor: 'rgba(0,0,0,0.2)',
            padding: 4,
            borderRadius: 4,
            backgroundColor: function(context: any) {
              const color = context.dataset.backgroundColor[context.dataIndex];
              return color + '99';  // Add 60% opacity
            }
          }
        }
      }
    };

    costDistributionChart = new Chart(costChartCanvas, chartConfig);
  }

  $: {
    if (nodes.length > 0 && costChartCanvas) {
      const costs = calculateCosts();
      createCostDistributionChart(costs);
    }
  }

  function initializeDependencyMatrix(size: number): DependencyMatrix {
    const teams = teamParams.teams.slice(0, size).map(t => t.name);
    const dependencies = Array.from({ length: size }, () => 
      Array.from({ length: size }, () => 0)
    );

    // Preload dependencies based on mode
    if (mode === 'even') {
      // Each team depends on the next team in sequence
      for (let i = 0; i < size; i++) {
        const nextIndex = (i + 1) % size;
        dependencies[i][nextIndex] = 3;
      }
    } else { // hub and spoke
      // First team (hub) has dependencies with all other teams
      for (let i = 1; i < size; i++) {
        dependencies[0][i] = 3; // Hub to spoke
      }
    }

    return { teams, dependencies };
  }

  function updateTeamParam(index: number, param: keyof Team, value: number | string) {
    const team = teamParams.teams[index];
    if (team) {
      if (param === 'name') {
        team[param] = value as string;
      } else {
        team[param] = value as number;
      }
      teamParams = teamParams;
      generateNodes();
    }
  }

  function updateDependency(fromIndex: number, toIndex: number, value: number) {
    dependencyMatrix.dependencies[fromIndex][toIndex] = Math.max(0, Math.min(5, value));
    dependencyMatrix = dependencyMatrix;
  }

  function updateTeamName(index: number, newName: string) {
    teamParams.teams[index].name = newName;
    teamParams = teamParams;
    dependencyMatrix = initializeDependencyMatrix(teamCount);
    
    // Update node labels to match
    nodes = nodes.map((node, i) => {
      if (i === index) {
        return {
          ...node,
          data: {
            ...node.data,
            label: newName
          }
        };
      }
      return node;
    });
  }

  function applyMatrix() {
    edges = [];
    dependencyMatrix.dependencies.forEach((row, fromIndex) => {
      row.forEach((strength, toIndex) => {
        if (strength > 0 && fromIndex !== toIndex) {
          edges = [...edges, {
            id: `edge-${edges.length + 1}`,
            source: `node-${fromIndex + 1}`,
            target: `node-${toIndex + 1}`,
            data: {
              strength,
              type: mode === 'even' ? 'balanced' : 
                    fromIndex === 0 ? 'hub' : 'spoke'
            }
          }];
        }
      });
    });
    metrics = updateMetrics();
  }

  function calculateTeamMetrics(teamIndex: number, dependencies: number[][], teams: any[]) {
    const incomingDependencies = dependencies.map(row => row[teamIndex]).filter(val => val > 0);
    const outgoingDependencies = dependencies[teamIndex].filter(val => val > 0);
    
    // Calculate dependency impact
    const totalDependencyStrength = [...incomingDependencies, ...outgoingDependencies]
      .reduce((sum, val) => sum + val, 0);
    
    const dependencyFactor = Math.max(0.5, 1 - (totalDependencyStrength * teamParams.dependencyImpact));
    
    // Calculate throughput
    const team = teams[teamIndex];
    const baseCapacity = team.size * team.baseCapacity * team.efficiency;
    const throughput = baseCapacity * dependencyFactor;
    
    // Calculate lead time
    const waitTime = incomingDependencies.length * teamParams.baseLeadTime * 0.5;
    const processingTime = teamParams.baseLeadTime * (1 + (outgoingDependencies.length * 0.3));
    const leadTime = waitTime + processingTime;
    
    return {
      throughput: throughput / 5, // Convert to daily rate
      leadTime,
      dependencyFactor
    };
  }

  function generateNodes() {
    nodes = [];
    edges = [];
    dependencyMatrix = initializeDependencyMatrix(teamCount);
    
    // Ensure we have enough team sizes
    while (teamParams.teams.length < teamCount) {
      teamParams.teams.push({
        name: `Team ${teamParams.teams.length + 1}`,
        size: 5,
        baseCapacity: 8,
        efficiency: 1.0
      });
    }
    
    // Create nodes with calculated metrics
    for (let i = 0; i < teamCount; i++) {
      const metrics = calculateTeamMetrics(i, dependencyMatrix.dependencies, teamParams.teams);
      
      const node = {
        id: `node-${i + 1}`,
        data: {
          label: `Team ${i + 1}`,
          size: teamParams.teams[i].size,
          efficiency: teamParams.teams[i].efficiency,
          throughput: metrics.throughput,
          leadTime: metrics.leadTime,
          dependencyFactor: metrics.dependencyFactor
        }
      };
      nodes = [...nodes, node];
    }

    if (mode === 'advanced') {
      // For advanced mode, dependencies are manually set in the matrix
      applyMatrix();
    } else if (mode === 'even') {
      generateEvenEdges();
    } else {
      generateHubAndSpokeEdges();
    }

    metrics = updateMetrics();
  }

  function generateEvenEdges() {
    nodes.forEach((source, i) => {
      const nextIndex = (i + 1) % nodes.length;
      edges = [...edges, {
        id: `edge-${edges.length + 1}`,
        source: source.id,
        target: nodes[nextIndex].id,
        data: {
          strength: companyDependencyLevel,
          type: 'balanced'
        }
      }];
    });
  }

  function generateHubAndSpokeEdges() {
    const hub = nodes[0];
    nodes.slice(1).forEach(node => {
      edges = [...edges, {
        id: `edge-${edges.length + 1}`,
        source: hub.id,
        target: node.id,
        data: {
          strength: companyDependencyLevel,
          type: 'hub'
        }
      }];
    });
  }

  // Function to update metrics
  function updateMetrics() {
    // Calculate average throughput
    const avgThroughput = nodes.reduce((sum, node) => sum + node.data.throughput, 0) / nodes.length;
    
    // Calculate average lead time
    const avgLeadTime = nodes.reduce((sum, node) => sum + node.data.leadTime, 0) / nodes.length;
    
    // Calculate dependency complexity
    const dependencyComplexity = edges.reduce((sum, edge) => sum + edge.data.strength, 0) / edges.length;
    
    // Calculate advanced metrics
    const advancedMetrics = calculateAdvancedMetrics(nodes, edges);
    
    return {
      avgThroughput,
      avgLeadTime,
      dependencyComplexity,
      ...advancedMetrics
    };
  }

  function calculateCosts() {
    const totalTeams = nodes.length;
    const totalConnections = edges.length;
    const totalPeople = nodes.reduce((sum, node) => sum + node.data.size, 0);
    
    // Meeting costs
    const weeklyMeetingCost = 
      costParams.meetings.weeklyDuration * 
      costParams.meetings.attendeesPerTeam * 
      costParams.hourlyRate.developer * 
      totalConnections * 
      costParams.overhead.communicationOverhead;

    // Communication costs (including async communication and coordination)
    const communicationCost =
      totalConnections * costParams.overhead.communicationOverhead *
      costParams.hourlyRate.developer * 10 + // 10 hours baseline communication
      edges.reduce((sum, edge) => sum + (edge.data.strength * 4 * costParams.hourlyRate.developer), 0); // Additional cost based on dependency strength

    // Process and coordination overhead
    const processOverhead = 
      edges.reduce((sum, edge) => sum + (edge.data.strength * costParams.hourlyRate.developer * 3), 0); // Coordination overhead

    return {
      weeklyMeetingCost,
      communicationCost,
      processOverhead,
      totalCost: weeklyMeetingCost + communicationCost + processOverhead
    };
  }

  // Add team size configuration to the UI
  function updateTeamSize(index: number, size: number) {
    teamParams.teams[index].size = Math.max(1, Math.min(20, size));
    generateNodes();
  }

  // Add new function to calculate advanced metrics
  function calculateAdvancedMetrics(nodes: Node[], edges: Edge[]) {
    // Calculate Flow Efficiency (FE)
    const totalLeadTime = nodes.reduce((sum: number, node: Node) => sum + node.data.leadTime, 0);
    const avgLeadTime = totalLeadTime / nodes.length;
    const processTime = nodes.reduce((sum: number, node: Node) => 
      sum + (node.data.throughput * (8 / node.data.efficiency)), 0); // Actual work time
    const waitTime = edges.reduce((sum: number, edge: Edge) => 
      sum + (edge.data.strength * teamParams.baseLeadTime * 0.5), 0); // Wait time from dependencies
    const flowEfficiency = Math.min(100, Math.max(0, (processTime / (processTime + waitTime)) * 100));

    // Calculate Dependency Impact Score (DIS)
    const maxPossibleDependencies = nodes.length * (nodes.length - 1) * 5; // max strength is 5
    const actualDependencyScore = edges.reduce((sum: number, edge: Edge) => 
      sum + edge.data.strength, 0);
    const dependencyImpactScore = Math.min(100, (actualDependencyScore / maxPossibleDependencies) * 100);

    // Calculate Team Utilization Rate
    const totalCapacity = nodes.reduce((sum: number, node: Node) => 
      sum + (node.data.size * 40), 0); // 40 hours per week per person
    const actualWork = nodes.reduce((sum: number, node: Node) => 
      sum + (node.data.throughput * 8 * 5), 0); // 8 hours per item, 5 days
    const coordinationOverhead = edges.reduce((sum: number, edge: Edge) => 
      sum + (edge.data.strength * 2), 0); // 2 hours overhead per dependency strength
    const utilizationRate = Math.min(100, Math.max(0, ((actualWork + coordinationOverhead) / totalCapacity) * 100));

    // Calculate Service Efficiency
    const totalServiceTime = nodes.reduce((sum: number, node: Node) => 
      sum + (node.data.throughput * 8 * 5), 0); // Direct service time
    const overheadTime = edges.reduce((sum: number, edge: Edge) => 
      sum + (edge.data.strength * 4 * nodes.length), 0); // 4 hours overhead per dependency strength
    const serviceEfficiency = Math.min(100, Math.max(0, 
      (totalServiceTime / (totalServiceTime + overheadTime + waitTime)) * 100
    ));

    // Calculate Cost Metrics
    const costs = calculateCosts();
    const totalFTE = nodes.reduce((sum: number, node: Node) => sum + node.data.size, 0);
    const costPerFTE = totalFTE > 0 ? costs.totalCost / totalFTE : 0;
    
    // Calculate overhead ratio based on coordination overhead time
    const overheadCost = overheadTime * costParams.hourlyRate.developer;
    const calculatedOverheadRatio = costs.totalCost > 0 ? Math.min(1, overheadCost / costs.totalCost) : 0;

    return {
      flowEfficiency,
      dependencyImpactScore,
      utilizationRate,
      serviceEfficiency,
      costPerFTE,
      overheadRatio: calculatedOverheadRatio
    };
  }

  // Initial setup
  onMount(() => {
    generateNodes();
  });

  $: {
    mode;
    teamCount;
    generateNodes();
  }

  // Add new reactive statement for company dependency level
  $: {
    companyDependencyLevel;
    if (mode !== 'advanced') {
      generateNodes();
    }
  }

  // Add function to calculate metrics for independent teams
  function calculateIndependentTeamMetrics() {
    const independentCosts = {
      weeklyMeetingCost: costParams.meetings.weeklyDuration * 
        costParams.meetings.attendeesPerTeam * 
        costParams.hourlyRate.developer * 
        nodes.length, // Only internal team meetings
      communicationCost: nodes.length * costParams.hourlyRate.developer * 5, // Minimal communication
      processOverhead: nodes.length * costParams.hourlyRate.developer * 2, // Minimal process overhead
    } as CostAnalysis;
    
    independentCosts.totalCost = independentCosts.weeklyMeetingCost + 
      independentCosts.communicationCost + 
      independentCosts.processOverhead;
    
    return {
      costs: independentCosts,
      flowEfficiency: 95, // High efficiency due to independence
      leadTime: teamParams.baseLeadTime, // Minimal lead time
      utilizationRate: 90, // High utilization due to less overhead
    };
  }
</script>

<div class="space-y-6">
  <!-- Mode Selection Controls -->
  <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Team Structure Configuration</h3>
    
    <!-- Distribution Mode Selection -->
    <div class="mb-8">
      <h4 class="text-sm font-medium text-gray-700 mb-4">Select Distribution Pattern</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Even Distribution -->
        <button
          class="relative p-4 border-2 rounded-lg transition-all {
            mode === 'even'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
          on:click={() => mode = 'even'}
        >
          <div class="flex items-center gap-3 mb-2">
            <div class="w-4 h-4 rounded-full border-2 {
              mode === 'even'
                ? 'border-secondary bg-secondary'
                : 'border-gray-300'
            }">
              {#if mode === 'even'}
                <svg class="w-4 h-4 text-white" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="4" fill="white"/>
                </svg>
              {/if}
            </div>
            <span class="font-medium text-gray-900">Even Distribution</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">Teams are evenly connected with balanced dependencies</p>
          <!-- Simple visualization -->
          <svg class="w-full h-20" viewBox="0 0 160 80">
            <circle cx="80" cy="40" r="35" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 2"/>
            {#each Array(6) as _, i}
              {@const angle = (2 * Math.PI * i) / 6}
              {@const x = 80 + 35 * Math.cos(angle)}
              {@const y = 40 + 35 * Math.sin(angle)}
              <circle cx={x} cy={y} r="4" fill="#6366f1"/>
              {#if i > 0}
                <line 
                  x1={x} 
                  y1={y} 
                  x2={80 + 35 * Math.cos((2 * Math.PI * (i-1)) / 6)} 
                  y2={40 + 35 * Math.sin((2 * Math.PI * (i-1)) / 6)}
                  stroke="#6366f1"
                  stroke-width="1"
                  stroke-opacity="0.3"
                />
              {/if}
            {/each}
          </svg>
        </button>

        <!-- Hub and Spoke -->
        <button
          class="relative p-4 border-2 rounded-lg transition-all {
            mode === 'uneven'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
          on:click={() => mode = 'uneven'}
        >
          <div class="flex items-center gap-3 mb-2">
            <div class="w-4 h-4 rounded-full border-2 {
              mode === 'uneven'
                ? 'border-secondary bg-secondary'
                : 'border-gray-300'
            }">
              {#if mode === 'uneven'}
                <svg class="w-4 h-4 text-white" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="4" fill="white"/>
                </svg>
              {/if}
            </div>
            <span class="font-medium text-gray-900">Hub and Spoke</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">Central team coordinates with satellite teams</p>
          <!-- Simple visualization -->
          <svg class="w-full h-20" viewBox="0 0 160 80">
            <circle cx="80" cy="40" r="6" fill="#6366f1"/>
            {#each Array(5) as _, i}
              {@const angle = (2 * Math.PI * i) / 5}
              {@const x = 80 + 30 * Math.cos(angle)}
              {@const y = 40 + 30 * Math.sin(angle)}
              <circle cx={x} cy={y} r="4" fill="#6366f1" fill-opacity="0.6"/>
              <line 
                x1="80" 
                y1="40" 
                x2={x} 
                y2={y}
                stroke="#6366f1"
                stroke-width="1"
                stroke-opacity="0.3"
              />
            {/each}
          </svg>
        </button>

        <!-- Advanced -->
        <button
          class="relative p-4 border-2 rounded-lg transition-all {
            mode === 'advanced'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
          on:click={() => mode = 'advanced'}
        >
          <div class="flex items-center gap-3 mb-2">
            <div class="w-4 h-4 rounded-full border-2 {
              mode === 'advanced'
                ? 'border-secondary bg-secondary'
                : 'border-gray-300'
            }">
              {#if mode === 'advanced'}
                <svg class="w-4 h-4 text-white" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="4" fill="white"/>
                </svg>
              {/if}
            </div>
            <span class="font-medium text-gray-900">Advanced Configuration</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">Customize team dependencies and parameters</p>
          <!-- Simple visualization -->
          <svg class="w-full h-20" viewBox="0 0 160 80">
            <rect x="30" y="20" width="100" height="40" rx="4" fill="none" stroke="#6366f1" stroke-width="1" stroke-dasharray="4 2"/>
            <text x="80" y="45" text-anchor="middle" class="text-xs fill-indigo-600">Custom Matrix</text>
          </svg>
        </button>
      </div>
    </div>

    <!-- Configuration Section -->
    {#if mode !== 'advanced'}
      <!-- Simple Configuration -->
      <div class="space-y-4">
        <!-- Basic Parameters -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Team Count -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Number of Teams</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={teamCount}
                min="2"
                max="10"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{teamCount}</span>
              </div>
            </div>
          </div>

          <!-- Company Dependency Level -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Dependency Level</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={companyDependencyLevel}
                min="1"
                max="5"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{companyDependencyLevel}</span>
              </div>
            </div>
            <div class="mt-1 grid grid-cols-5 gap-1 text-xs text-gray-500">
              <span>V.Low</span>
              <span>Low</span>
              <span>Med</span>
              <span>High</span>
              <span>V.High</span>
            </div>
          </div>

          <!-- Default Team Size -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Team Size</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={teamParams.teams[0].size}
                min="1"
                max="20"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                on:input={() => {
                  teamParams.teams.forEach(team => team.size = teamParams.teams[0].size);
                  generateNodes();
                }}
              />
              <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{teamParams.teams[0].size}</span>
              </div>
            </div>
          </div>

          <!-- Dev Rate -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Dev Rate ($/hr)</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={costParams.hourlyRate.developer}
                min="20"
                max="200"
                step="5"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-16 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">${costParams.hourlyRate.developer}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cost Parameters -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
          <!-- Weekly Meeting Hours -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Weekly Meeting Hours</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={costParams.meetings.weeklyDuration}
                min="1"
                max="20"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{costParams.meetings.weeklyDuration}</span>
              </div>
            </div>
          </div>

          <!-- Meeting Attendees -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Meeting Attendees</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={costParams.meetings.attendeesPerTeam}
                min="1"
                max="20"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{costParams.meetings.attendeesPerTeam}</span>
              </div>
            </div>
          </div>

          <!-- Communication Overhead -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Communication Overhead</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={costParams.overhead.communicationOverhead}
                min="1"
                max="2"
                step="0.1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-16 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{costParams.overhead.communicationOverhead}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Advanced Configuration -->
      <div class="space-y-6">
        <!-- Basic Parameters -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Team Count -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Number of Teams</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={teamCount}
                min="2"
                max="10"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{teamCount}</span>
              </div>
            </div>
          </div>

          <!-- Base Lead Time -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Base Lead Time (days)</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={teamParams.baseLeadTime}
                min="1"
                max="30"
                step="0.5"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-16 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{teamParams.baseLeadTime}</span>
              </div>
            </div>
          </div>

          <!-- Dependency Impact -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Dependency Impact</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={teamParams.dependencyImpact}
                min="0.05"
                max="0.5"
                step="0.05"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-16 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{teamParams.dependencyImpact}</span>
              </div>
            </div>
          </div>

          <!-- Dev Rate -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Dev Rate ($/hr)</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={costParams.hourlyRate.developer}
                min="20"
                max="200"
                step="5"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-16 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">${costParams.hourlyRate.developer}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cost Parameters -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
          <!-- Weekly Meeting Hours -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Weekly Meeting Hours</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={costParams.meetings.weeklyDuration}
                min="1"
                max="20"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{costParams.meetings.weeklyDuration}</span>
              </div>
            </div>
          </div>

          <!-- Meeting Attendees -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Meeting Attendees</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={costParams.meetings.attendeesPerTeam}
                min="1"
                max="20"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{costParams.meetings.attendeesPerTeam}</span>
              </div>
            </div>
          </div>

          <!-- Communication Overhead -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Communication Overhead</h4>
            <div class="flex items-center gap-2">
              <input
                type="range"
                bind:value={costParams.overhead.communicationOverhead}
                min="1"
                max="2"
                step="0.1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div class="w-16 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{costParams.overhead.communicationOverhead}x</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Team Details and Dependencies -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Team Configuration -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-3">Team Details</h4>
            <div class="overflow-x-auto border rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="px-2 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Team</th>
                    <th class="px-2 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Size</th>
                    <th class="px-2 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Cap</th>
                    <th class="px-2 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Eff</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each teamParams.teams.slice(0, teamCount) as team, i}
                    <tr class="hover:bg-gray-50">
                      <td class="px-2 py-2">
                        <input
                          type="text"
                          value={team.name}
                          class="w-20 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-secondary focus:ring-0 text-xs"
                          on:change={(e) => updateTeamName(i, e.currentTarget.value)}
                        />
                      </td>
                      <td class="px-2 py-2">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          class="w-12 text-center rounded-md border-gray-300 focus:border-secondary focus:ring-secondary text-xs"
                          value={team.size}
                          on:input={(e) => updateTeamParam(i, 'size', parseInt(e.currentTarget.value) || 1)}
                        />
                      </td>
                      <td class="px-2 py-2">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          class="w-12 text-center rounded-md border-gray-300 focus:border-secondary focus:ring-secondary text-xs"
                          value={team.baseCapacity}
                          on:input={(e) => updateTeamParam(i, 'baseCapacity', parseInt(e.currentTarget.value) || 1)}
                        />
                      </td>
                      <td class="px-2 py-2">
                        <input
                          type="number"
                          min="0.1"
                          max="2"
                          step="0.1"
                          class="w-12 text-center rounded-md border-gray-300 focus:border-secondary focus:ring-secondary text-xs"
                          value={team.efficiency}
                          on:input={(e) => updateTeamParam(i, 'efficiency', parseFloat(e.currentTarget.value) || 1)}
                        />
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            <div class="mt-2 text-xs text-gray-500 space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-medium">Size:</span>
                <span>Number of team members (1-20)</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-medium">Cap:</span>
                <span>Items/person/week capacity (1-20)</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-medium">Eff:</span>
                <span>Team efficiency multiplier (0.1-2.0)</span>
              </div>
            </div>
          </div>

          <!-- Dependency Matrix -->
          <div class="lg:col-span-2">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-gray-700">Team Dependencies</h4>
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-sm bg-green-100 border border-green-300"></span>
                  <span>0-1: Low</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-300"></span>
                  <span>2-3: Medium</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-sm bg-red-100 border border-red-300"></span>
                  <span>4-5: High</span>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto border rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="w-24 px-2 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    {#each dependencyMatrix.teams as team}
                      <th class="w-12 px-2 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{team}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  {#each dependencyMatrix.teams as fromTeam, fromIndex}
                    <tr class="hover:bg-gray-50">
                      <th class="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {fromTeam}
                      </th>
                      {#each dependencyMatrix.teams as toTeam, toIndex}
                        <td class="px-2 py-2">
                          {#if fromIndex !== toIndex}
                            <input
                              type="number"
                              min="0"
                              max="5"
                              class="w-12 h-8 text-center rounded-md border-gray-300 focus:border-secondary focus:ring-secondary text-xs transition-colors
                                {dependencyMatrix.dependencies[fromIndex][toIndex] <= 1 ? 'bg-green-50' : 
                                 dependencyMatrix.dependencies[fromIndex][toIndex] <= 3 ? 'bg-yellow-50' : 'bg-red-50'}"
                              value={dependencyMatrix.dependencies[fromIndex][toIndex]}
                              on:input={(e) => updateDependency(fromIndex, toIndex, parseInt(e.currentTarget.value) || 0)}
                            />
                          {:else}
                            <div class="w-12 h-8 bg-gray-100 rounded-md"></div>
                          {/if}
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Apply Dependencies Button -->
        <div class="flex justify-end">
          <button
            type="button"
            class="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
            on:click={applyMatrix}
          >
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            Apply Dependencies
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Analysis Summary -->
  <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
    <h3 class="text-lg font-semibold text-gray-900 mb-6">Impact Analysis</h3>
    
    <!-- Comparison with Independent Teams -->
    {#if nodes.length > 0}
      {@const independentMetrics = calculateIndependentTeamMetrics()}
      {@const currentCosts = calculateCosts()}
      {@const costDifference = currentCosts.totalCost - independentMetrics.costs.totalCost}
      
      <div class="mb-8">
        <h4 class="text-sm font-medium text-gray-700 mb-4">Cost Impact of Team Dependencies</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Current Model -->
          <div class="bg-white rounded-lg p-4 border-2 border-secondary">
            <div class="text-sm font-medium text-secondary mb-2">Current Model</div>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Weekly Cost</span>
                  <span class="font-medium">${currentCosts.totalCost.toFixed(2)}</span>
                </div>
                <div class="text-xs text-gray-500">Including dependencies and coordination</div>
              </div>
              <div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Team Efficiency</span>
                  <span class="font-medium">{metrics.flowEfficiency.toFixed(1)}%</span>
                </div>
                <div class="text-xs text-gray-500">Time spent on value-adding work</div>
              </div>
              <div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Average Lead Time</span>
                  <span class="font-medium">{metrics.avgLeadTime.toFixed(1)} days</span>
                </div>
                <div class="text-xs text-gray-500">Time to complete work items</div>
              </div>
            </div>
          </div>

          <!-- Independent Teams -->
          <div class="bg-white rounded-lg p-4 border border-gray-200">
            <div class="text-sm font-medium text-gray-600 mb-2">If Teams Were Independent</div>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Weekly Cost</span>
                  <span class="font-medium">${independentMetrics.costs.totalCost.toFixed(2)}</span>
                </div>
                <div class="text-xs text-gray-500">Minimal coordination needed</div>
              </div>
              <div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Team Efficiency</span>
                  <span class="font-medium">{independentMetrics.flowEfficiency}%</span>
                </div>
                <div class="text-xs text-gray-500">Theoretical maximum efficiency</div>
              </div>
              <div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Average Lead Time</span>
                  <span class="font-medium">{independentMetrics.leadTime.toFixed(1)} days</span>
                </div>
                <div class="text-xs text-gray-500">Without dependency delays</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cost Difference Explanation -->
        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
          <h5 class="text-sm font-medium text-gray-900 mb-2">Impact Summary</h5>
          <div class="space-y-2">
            <p class="text-sm text-gray-600">
              Team dependencies are adding <span class="font-medium text-secondary">${costDifference.toFixed(2)}</span> in weekly costs 
              ({((costDifference / independentMetrics.costs.totalCost) * 100).toFixed(1)}% increase).
            </p>
            <p class="text-sm text-gray-600">
              This cost represents necessary coordination and communication between teams, but can be optimized through:
            </p>
            <ul class="text-sm text-gray-600 space-y-1 mt-2">
              <li>• Clear team boundaries and well-defined interfaces</li>
              <li>• Efficient communication channels and processes</li>
              <li>• Strategic dependency management</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Key Metrics Dashboard -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Flow Efficiency -->
        <div class="bg-gradient-to-br from-secondary/10 to-white p-4 rounded-lg border border-secondary/20">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="text-sm font-medium text-secondary">Flow Efficiency</h4>
              <p class="text-xs text-gray-600 mt-1">How effectively teams deliver value</p>
            </div>
            <div class="relative w-16 h-16">
              <svg class="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#e0e7ff"
                  stroke-width="6"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#6366f1"
                  stroke-width="6"
                  stroke-dasharray={`${metrics.flowEfficiency * 1.76} 176`}
                />
              </svg>
              <span class="absolute inset-0 flex items-center justify-center text-lg font-semibold text-secondary">
                {metrics.flowEfficiency.toFixed(0)}%
              </span>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-gray-600">Value-Adding Time</span>
              <span class="font-medium text-secondary">{metrics.flowEfficiency.toFixed(1)}%</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-600">Wait Time & Overhead</span>
              <span class="font-medium text-red-600">{(100 - metrics.flowEfficiency).toFixed(1)}%</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {metrics.flowEfficiency < 40 ? 'Opportunity to reduce handoffs and streamline processes' :
               metrics.flowEfficiency < 60 ? 'Good balance of coordination and execution' :
               'Excellent flow with minimal bottlenecks'}
            </div>
          </div>
        </div>

        <!-- Dependency Impact -->
        <div class="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-200">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="text-sm font-medium text-blue-900">Dependency Complexity</h4>
              <p class="text-xs text-gray-600 mt-1">How interconnected teams are</p>
            </div>
            <div class="relative w-16 h-16">
              <svg class="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#e0e7ff"
                  stroke-width="6"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="6"
                  stroke-dasharray={`${metrics.dependencyImpactScore * 1.76} 176`}
                />
              </svg>
              <span class="absolute inset-0 flex items-center justify-center text-lg font-semibold text-blue-700">
                {metrics.dependencyImpactScore.toFixed(0)}%
              </span>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-gray-600">Network Density</span>
              <span class="font-medium text-blue-700">{(edges.length / (nodes.length * (nodes.length - 1)) * 100).toFixed(1)}%</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-600">Avg Dependency Strength</span>
              <span class="font-medium text-blue-700">{(edges.reduce((sum, edge) => sum + edge.data.strength, 0) / edges.length).toFixed(1)}/5</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {metrics.dependencyImpactScore < 30 ? 'Low coupling, teams work independently' :
               metrics.dependencyImpactScore < 60 ? 'Moderate dependencies, manageable coordination' :
               'High coupling, consider restructuring teams'}
            </div>
          </div>
        </div>

        <!-- Team Utilization -->
        <div class="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-lg border border-emerald-200">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="text-sm font-medium text-emerald-900">Team Utilization</h4>
              <p class="text-xs text-gray-600 mt-1">How effectively time is used</p>
            </div>
            <div class="relative w-16 h-16">
              <svg class="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#e0e7ff"
                  stroke-width="6"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#10b981"
                  stroke-width="6"
                  stroke-dasharray={`${metrics.utilizationRate * 1.76} 176`}
                />
              </svg>
              <span class="absolute inset-0 flex items-center justify-center text-lg font-semibold text-emerald-700">
                {metrics.utilizationRate.toFixed(0)}%
              </span>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-gray-600">Productive Time</span>
              <span class="font-medium text-emerald-700">{metrics.utilizationRate.toFixed(1)}%</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-600">Overhead Time</span>
              <span class="font-medium text-red-600">{(100 - metrics.utilizationRate).toFixed(1)}%</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {metrics.utilizationRate < 60 ? 'High overhead, review coordination needs' :
               metrics.utilizationRate < 80 ? 'Good balance of work and coordination' :
               'Excellent utilization of team capacity'}
            </div>
          </div>
        </div>
      </div>

      <!-- Key Insights -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 class="text-sm font-medium text-gray-900 mb-3">Key Insights & Recommendations</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Current Strengths -->
          <div>
            <h5 class="text-sm font-medium text-emerald-700 mb-2">What's Working Well</h5>
            <ul class="space-y-2">
              {#if metrics.flowEfficiency >= 60}
                <li class="text-sm text-gray-600">✓ High flow efficiency indicates smooth work processes</li>
              {/if}
              {#if metrics.utilizationRate >= 75}
                <li class="text-sm text-gray-600">✓ Teams are effectively utilizing their capacity</li>
              {/if}
              {#if metrics.dependencyImpactScore <= 40}
                <li class="text-sm text-gray-600">✓ Well-managed team dependencies</li>
              {/if}
              {#if metrics.avgLeadTime <= teamParams.baseLeadTime * 1.5}
                <li class="text-sm text-gray-600">✓ Quick delivery times despite dependencies</li>
              {/if}
            </ul>
          </div>

          <!-- Areas for Improvement -->
          <div>
            <h5 class="text-sm font-medium text-blue-700 mb-2">Opportunities for Improvement</h5>
            <ul class="space-y-2">
              {#if metrics.flowEfficiency < 60}
                <li class="text-sm text-gray-600">• Streamline workflows to reduce wait times</li>
              {/if}
              {#if metrics.utilizationRate < 75}
                <li class="text-sm text-gray-600">• Reduce overhead activities and meetings</li>
              {/if}
              {#if metrics.dependencyImpactScore > 40}
                <li class="text-sm text-gray-600">• Consider restructuring team boundaries</li>
              {/if}
              {#if metrics.avgLeadTime > teamParams.baseLeadTime * 1.5}
                <li class="text-sm text-gray-600">• Look for ways to reduce handoffs between teams</li>
              {/if}
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Team Visualization -->
  <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Team Dependencies</h3>
    <div class="relative w-full h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
      <svg width="100%" height="100%" viewBox="-100 -100 1200 800" preserveAspectRatio="xMidYMid meet">
        <!-- Background grid for professional look -->
        <defs>
          <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f1f5f9" stroke-width="0.5"/>
          </pattern>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#smallGrid)"/>
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" stroke-width="1"/>
          </pattern>
          <!-- Gradient for node header -->
          <linearGradient id="headerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#f1f5f9;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
          </linearGradient>
          <!-- Gradient for node body -->
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <!-- Draw edges first -->
        {#each edges as edge}
          {@const sourceNode = nodes.find(n => n.id === edge.source)}
          {@const targetNode = nodes.find(n => n.id === edge.target)}
          {@const sourceIndex = nodes.findIndex(n => n.id === edge.source)}
          {@const targetIndex = nodes.findIndex(n => n.id === edge.target)}
          {@const angleStep = (2 * Math.PI) / nodes.length}
          {@const sourceAngle = angleStep * sourceIndex - Math.PI / 2}
          {@const targetAngle = angleStep * targetIndex - Math.PI / 2}
          {@const horizontalScale = 1.6}
          {@const radiusX = Math.min(550, Math.max(400, 1100 / (nodes.length)))}
          {@const radiusY = Math.min(350, Math.max(250, 700 / (nodes.length)))}
          {@const x1 = 500 + radiusX * Math.cos(sourceAngle) * horizontalScale}
          {@const y1 = 300 + radiusY * Math.sin(sourceAngle)}
          {@const x2 = 500 + radiusX * Math.cos(targetAngle) * horizontalScale}
          {@const y2 = 300 + radiusY * Math.sin(targetAngle)}
          
          <!-- Calculate control points for curved lines -->
          {@const midX = (x1 + x2) / 2}
          {@const midY = (y1 + y2) / 2}
          {@const dx = x2 - x1}
          {@const dy = y2 - y1}
          {@const normalX = -dy / Math.sqrt(dx * dx + dy * dy) * 50}
          {@const normalY = dx / Math.sqrt(dx * dx + dy * dy) * 50}
          
          <!-- Calculate arrow end point to avoid node overlap -->
          {@const nodeRadius = 85}
          {@const totalLength = Math.sqrt(dx * dx + dy * dy)}
          {@const endX = x2 - (dx * nodeRadius / totalLength)}
          {@const endY = y2 - (dy * nodeRadius / totalLength)}
          {@const startX = x1 + (dx * nodeRadius / totalLength)}
          {@const startY = y1 + (dy * nodeRadius / totalLength)}
          
          <!-- Calculate color and thickness based on dependency strength -->
          {@const strength = edge.data.strength}
          {@const strokeWidth = 1 + (strength - 1) * 0.8} <!-- Scale from 1px to 4.2px -->
          {@const color = strength <= 1 ? '#22c55e' : 
                         strength <= 2 ? '#84cc16' :
                         strength <= 3 ? '#eab308' :
                         strength <= 4 ? '#f97316' : '#ef4444'}
          {@const opacity = 0.6 + (strength - 1) * 0.1} <!-- Scale from 0.6 to 1.0 -->
          
          <path 
            d="M {startX} {startY} Q {midX + normalX} {midY + normalY} {endX} {endY}"
            fill="none"
            stroke={color}
            stroke-width={strokeWidth}
            stroke-opacity={opacity}
            marker-end="url(#arrowhead-{strength})"
          />
        {/each}

        <!-- Draw nodes on top of edges -->
        {#each nodes as node, i}
          {@const angleStep = (2 * Math.PI) / nodes.length}
          {@const angle = angleStep * i - Math.PI / 2}
          {@const horizontalScale = 1.6}
          {@const radiusX = Math.min(550, Math.max(400, 1100 / (nodes.length)))}
          {@const radiusY = Math.min(350, Math.max(250, 700 / (nodes.length)))}
          {@const x = 500 + radiusX * Math.cos(angle) * horizontalScale}
          {@const y = 300 + radiusY * Math.sin(angle)}
          
          <!-- Team Node -->
          <g transform="translate({x}, {y})">
            <!-- Enhanced node shadow -->
            <rect
              x="-80"
              y="-64"
              width="160"
              height="128"
              rx="12"
              fill="#ffffff"
              filter="url(#shadow)"
            />
            <!-- Node background with gradient -->
            <rect
              x="-80"
              y="-64"
              width="160"
              height="128"
              rx="12"
              fill="url(#bodyGradient)"
              stroke="#e2e8f0"
              stroke-width="2"
            />
            <!-- Node header with gradient -->
            <rect
              x="-80"
              y="-64"
              width="160"
              height="40"
              rx="12"
              fill="url(#headerGradient)"
              stroke="#e2e8f0"
              stroke-width="2"
            />
            <!-- Team name with better styling -->
            <text 
              text-anchor="middle"
              y="-38"
              class="text-base font-semibold fill-gray-700"
            >{node.data.label}</text>
            <!-- Metrics with improved layout -->
            <g class="text-xs fill-gray-700">
              <!-- Team Size and Efficiency -->
              <g transform="translate(-70, -10)">
                <text 
                  text-anchor="start"
                  class="font-medium"
                >Size</text>
                <text 
                  text-anchor="start"
                  y="20"
                  class="text-base font-semibold fill-gray-900"
                >{node.data.size}</text>
              </g>
              <g transform="translate(70, -10)">
                <text 
                  text-anchor="end"
                  class="font-medium"
                >⚡ Eff</text>
                <text 
                  text-anchor="end"
                  y="20"
                  class="text-base font-semibold fill-gray-900"
                >{node.data.efficiency.toFixed(1)}x</text>
              </g>
              <!-- Throughput and Lead Time -->
              <g transform="translate(-70, 35)">
                <text 
                  text-anchor="start"
                  class="font-medium"
                >📈 Items/d</text>
                <text 
                  text-anchor="start"
                  y="20"
                  class="text-base font-semibold fill-gray-900"
                >{node.data.throughput.toFixed(1)}</text>
              </g>
              <g transform="translate(70, 35)">
                <text 
                  text-anchor="end"
                  class="font-medium"
                >⏱️ Days</text>
                <text 
                  text-anchor="end"
                  y="20"
                  class="text-base font-semibold fill-gray-900"
                >{node.data.leadTime.toFixed(1)}</text>
              </g>
            </g>
          </g>
        {/each}

        <!-- Enhanced definitions -->
        <defs>
          <!-- Improved shadow filter -->
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.15"/>
          </filter>
          <!-- Enhanced arrow markers for each strength level -->
          {#each [1, 2, 3, 4, 5] as strength}
            {@const color = strength <= 1 ? '#22c55e' : 
                           strength <= 2 ? '#84cc16' :
                           strength <= 3 ? '#eab308' :
                           strength <= 4 ? '#f97316' : '#ef4444'}
            <marker
              id="arrowhead-{strength}"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={color}
                opacity={0.6 + (strength - 1) * 0.1}
              />
            </marker>
          {/each}
        </defs>
      </svg>
    </div>
  </div>

  <!-- Cost Analysis Section -->
  <div class="space-y-8">
    <!-- Cost Summary and Distribution -->
    {#if nodes.length > 0}
      {@const costs = calculateCosts()}
      {@const totalCost = costs.totalCost}

      <!-- Cost Distribution Section -->
      <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">Cost Analysis</h3>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Chart -->
          <div>
            <div class="relative h-[400px]">
              <canvas
                bind:this={costChartCanvas}
                class="w-full h-full"
              ></canvas>
            </div>
          </div>

          <!-- Cost Breakdown -->
          <div class="space-y-6">
            <!-- Weekly Cost Summary -->
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-gradient-to-br from-secondary/10 to-white p-4 rounded-lg border border-secondary/20">
                <div class="text-sm font-medium text-gray-600">Weekly Meetings</div>
                <div class="text-xl font-bold text-secondary mt-1">
                  ${costs.weeklyMeetingCost.toFixed(2)}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {((costs.weeklyMeetingCost / costs.totalCost) * 100).toFixed(1)}% of total
                </div>
              </div>
              <div class="bg-gradient-to-br from-amber-50 to-white p-4 rounded-lg border border-amber-200">
                <div class="text-sm font-medium text-gray-600">Communication</div>
                <div class="text-xl font-bold text-amber-600 mt-1">
                  ${costs.communicationCost.toFixed(2)}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {((costs.communicationCost / costs.totalCost) * 100).toFixed(1)}% of total
                </div>
              </div>
              <div class="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-lg border border-emerald-200">
                <div class="text-sm font-medium text-gray-600">Process Overhead</div>
                <div class="text-xl font-bold text-emerald-600 mt-1">
                  ${costs.processOverhead.toFixed(2)}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {((costs.processOverhead / costs.totalCost) * 100).toFixed(1)}% of total
                </div>
              </div>
            </div>

            <!-- Cost Analysis Details -->
            <div class="space-y-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <h4 class="text-sm font-medium text-gray-900 mb-3">Cost Breakdown & Impact</h4>
                <div class="space-y-4">
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <h5 class="text-sm font-medium text-secondary">Meeting Costs</h5>
                      <span class="text-xs text-gray-500">Per Team Member: ${(costs.weeklyMeetingCost / (teamCount * teamParams.teams[0].size)).toFixed(2)}/week</span>
                    </div>
                    <p class="text-xs text-gray-600">
                      Based on {costParams.meetings.weeklyDuration}hr/week × {costParams.meetings.attendeesPerTeam} attendees × ${costParams.hourlyRate.developer}/hr
                    </p>
                  </div>
                  
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <h5 class="text-sm font-medium text-amber-600">Communication Impact</h5>
                      <span class="text-xs text-gray-500">Overhead Factor: {costParams.overhead.communicationOverhead}x</span>
                    </div>
                    <p class="text-xs text-gray-600">
                      Includes async communication, documentation, and cross-team coordination costs
                    </p>
                  </div>
                  
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <h5 class="text-sm font-medium text-emerald-600">Process Efficiency</h5>
                      <span class="text-xs text-gray-500">Annual Cost: ${(costs.totalCost * 52).toFixed(2)}</span>
                    </div>
                    <p class="text-xs text-gray-600">
                      Total coordination cost per team member: ${(costs.totalCost / (teamCount * teamParams.teams[0].size)).toFixed(2)}/week
                    </p>
                  </div>
                </div>
              </div>

              <!-- Optimization Suggestions -->
              <div class="p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                <h4 class="text-sm font-medium text-gray-900 mb-2">Cost Optimization Opportunities</h4>
                <ul class="space-y-2 text-sm text-gray-600">
                  {#if (costs.weeklyMeetingCost / costs.totalCost) > 0.4}
                    <li class="flex items-start gap-2">
                      <span class="text-secondary">•</span>
                      Consider reducing meeting frequency or attendee count
                    </li>
                  {/if}
                  {#if (costs.communicationCost / costs.totalCost) > 0.4}
                    <li class="flex items-start gap-2">
                      <span class="text-secondary">•</span>
                      Look for ways to streamline team communication channels
                    </li>
                  {/if}
                  {#if (costs.processOverhead / costs.totalCost) > 0.3}
                    <li class="flex items-start gap-2">
                      <span class="text-secondary">•</span>
                      Review and optimize coordination processes
                    </li>
                  {/if}
                  {#if costs.totalCost > (teamCount * teamParams.teams[0].size * costParams.hourlyRate.developer * 10)}
                    <li class="flex items-start gap-2">
                      <span class="text-secondary">•</span>
                      Total coordination costs are high relative to team size
                    </li>
                  {/if}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Add any additional styles here */
</style> 