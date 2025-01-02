<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import ChartDataLabels from 'chartjs-plugin-datalabels';
  import type { ChartConfiguration, ChartData, ChartOptions, DoughnutControllerChartOptions, Plugin } from 'chart.js';
  import tippy from 'tippy.js';
  import 'tippy.js/dist/tippy.css';
  import 'tippy.js/themes/light-border.css';
  
  Chart.register(ChartDataLabels);  // Register the plugin

  // Visualization state
  let visualizationMode: 'weighted' | 'multiple' = 'weighted';
  let showLegend = true;

  // Comparison mode state
  type ComparisonMode = 'topology' | 'lazy' | 'advanced';
  let comparisonMode: ComparisonMode = 'topology';
  let dependencyAdjustment = 0;
  let targetDependencyMatrix: number[][] = [];

  // Initialize target matrix when dependency matrix changes
  $: {
    dependencyMatrix;
    targetDependencyMatrix = dependencyMatrix.dependencies.map(row => [...row]);
  }

  // Update target dependency based on comparison mode
  function updateTargetDependency(fromIndex: number, toIndex: number, value: number) {
    targetDependencyMatrix[fromIndex][toIndex] = Math.max(0, Math.min(5, value));
    targetDependencyMatrix = targetDependencyMatrix;
  }

  // Calculate metrics for comparison mode
  function calculateComparisonMetrics(mode: ComparisonMode) {
    if (mode === 'topology') {
      return calculateIndependentTeamMetrics();
    } else if (mode === 'lazy') {
      if (dependencyAdjustment === 0) {
        // Return current metrics when no adjustment
        return {
          costs: calculateCosts(),
          flowEfficiency: metrics.flowEfficiency,
          leadTime: metrics.avgLeadTime,
          utilizationRate: metrics.utilizationRate,
          serviceEfficiency: metrics.serviceEfficiency
        };
      }
      // Create adjusted dependency matrix
      const adjustedMatrix = dependencyMatrix.dependencies.map(row =>
        row.map(value => Math.max(0, Math.min(5, value + dependencyAdjustment)))
      );
      return calculateMetricsForMatrix(adjustedMatrix);
    } else {
      // For advanced mode, if the target matrix matches current dependencies, return current metrics
      const isMatrixEqual = targetDependencyMatrix.every((row, i) => 
        row.every((value, j) => value === dependencyMatrix.dependencies[i][j])
      );
      
      if (isMatrixEqual) {
        return {
          costs: calculateCosts(),
          flowEfficiency: metrics.flowEfficiency,
          leadTime: metrics.avgLeadTime,
          utilizationRate: metrics.utilizationRate,
          serviceEfficiency: metrics.serviceEfficiency
        };
      }
      return calculateMetricsForMatrix(targetDependencyMatrix);
    }
  }

  // Calculate metrics for a given dependency matrix
  function calculateMetricsForMatrix(matrix: number[][]) {
    const costs = {
      weeklyMeetingCost: costParams.meetings.weeklyDuration * 
        costParams.meetings.attendeesPerTeam * 
        costParams.hourlyRate.developer * 
        matrix.reduce((sum, row) => sum + row.filter(v => v > 0).length, 0),
      communicationCost: matrix.reduce((sum, row) => 
        sum + row.reduce((s, v) => s + (v > 0 ? v * costParams.hourlyRate.developer * 4 : 0), 0), 0),
      processOverhead: matrix.reduce((sum, row) => 
        sum + row.reduce((s, v) => s + (v * costParams.hourlyRate.developer * 2), 0), 0),
      get totalCost() {
        return this.weeklyMeetingCost + this.communicationCost + this.processOverhead;
      }
    };

    // Calculate efficiency based on dependency strength
    const totalDependencies = matrix.reduce((sum, row) => 
      sum + row.reduce((s, v) => s + v, 0), 0);
    const avgDependencyStrength = totalDependencies / (matrix.length * matrix.length);
    const flowEfficiency = Math.max(60, 95 - (avgDependencyStrength * 10));

    // Calculate lead time based on dependencies
    const baseLeadTime = teamParams.baseLeadTime;
    const leadTime = baseLeadTime * (1 + (avgDependencyStrength * 0.5));

    return {
      costs,
      flowEfficiency,
      leadTime,
      utilizationRate: 90 - (avgDependencyStrength * 5),
      serviceEfficiency: 85 - (avgDependencyStrength * 7)
    };
  }

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
      isHub: boolean;
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

  // Distribution mode state
  type DistributionMode = 'even' | 'hub-spoke';
  let distributionMode: DistributionMode = 'even';

  let nodes: any[] = [];
  let edges: any[] = [];
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

  function initializeDependencyMatrix(size: number) {
    const teams = Array.from({ length: size }, (_, i) => `Team ${i + 1}`);
    const dependencies = Array.from({ length: size }, () => Array(size).fill(0));
    
    // Initialize dependencies based on mode and company dependency level
    if (distributionMode === 'even') {
      // For even distribution, create circular dependencies with strength based on company dependency level
      for (let i = 0; i < size; i++) {
        const nextIndex = (i + 1) % size;
        dependencies[i][nextIndex] = Math.max(1, Math.min(5, companyDependencyLevel));
        dependencies[nextIndex][i] = Math.max(1, Math.min(5, companyDependencyLevel));
      }
    } else { // hub and spoke
      // First team (hub) has dependencies with all other teams
      for (let i = 1; i < size; i++) {
        dependencies[0][i] = Math.max(1, Math.min(5, companyDependencyLevel)); // Hub to spoke
        dependencies[i][0] = Math.max(1, Math.min(5, companyDependencyLevel)); // Spoke to hub
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
      
      // Update team names in dependency matrix if the name changed
      if (param === 'name') {
        dependencyMatrix.teams[index] = value as string;
        dependencyMatrix = dependencyMatrix;
      }
      
      // Only regenerate nodes without resetting dependencies
      nodes = nodes.map((node, i) => {
        if (i === index) {
          const metrics = calculateTeamMetrics(i, dependencyMatrix.dependencies, teamParams.teams);
          return {
            ...node,
            data: {
              ...node.data,
              label: teamParams.teams[i].name,
              size: teamParams.teams[i].size,
              efficiency: teamParams.teams[i].efficiency,
              throughput: metrics.throughput,
              leadTime: metrics.leadTime,
              dependencyFactor: metrics.dependencyFactor,
              isHub: distributionMode === 'hub-spoke' && i === 0
            }
          };
        }
        return node;
      });
      
      // Update metrics without regenerating dependencies
      metrics = updateMetrics();
    }
  }

  function updateDependency(fromIndex: number, toIndex: number, value: number) {
    dependencyMatrix.dependencies[fromIndex][toIndex] = Math.max(0, Math.min(5, value));
    dependencyMatrix = dependencyMatrix;
  }

  function updateTeamName(index: number, newName: string) {
    teamParams.teams[index].name = newName;
    teamParams = teamParams;
    
    // Update team names in dependency matrix
    dependencyMatrix.teams[index] = newName;
    dependencyMatrix = dependencyMatrix;

    // Update team names in target dependency matrix if in advanced mode
    if (comparisonMode === 'advanced') {
      targetDependencyMatrix = targetDependencyMatrix;
    }
    
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
              type: distributionMode === 'even' ? 'balanced' : 
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
        size: teamParams.teams[0].size,
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
          dependencyFactor: metrics.dependencyFactor,
          isHub: distributionMode === 'hub-spoke' && i === 0
        }
      };
      nodes = [...nodes, node];
    }

    // Generate edges based on mode
    if (distributionMode === 'even') {
      generateEvenEdges();
    } else {
      generateHubAndSpokeEdges();
    }

    metrics = updateMetrics();
  }

  function generateEvenEdges() {
    edges = [];
    nodes.forEach((source, i) => {
      const nextIndex = (i + 1) % nodes.length;
      // Add edge in both directions with strength based on company dependency level
      edges = [...edges, 
        {
          id: `edge-${edges.length + 1}`,
          source: source.id,
          target: `node-${nextIndex + 1}`,
          data: {
            strength: Math.max(1, Math.min(5, companyDependencyLevel)),
            type: 'balanced'
          }
        },
        {
          id: `edge-${edges.length + 2}`,
          source: `node-${nextIndex + 1}`,
          target: source.id,
          data: {
            strength: Math.max(1, Math.min(5, companyDependencyLevel)),
            type: 'balanced'
          }
        }
      ];
    });
  }

  function generateHubAndSpokeEdges() {
    edges = [];
    // Hub is always the first node (index 0)
    const hubNode = nodes[0];
    
    // Create edges from hub to all spokes and back
    nodes.slice(1).forEach((spokeNode, i) => {
      edges = [...edges,
        {
          id: `edge-${edges.length + 1}`,
          source: hubNode.id,
          target: spokeNode.id,
          data: {
            strength: Math.max(1, Math.min(5, companyDependencyLevel)),
            type: 'hub'
          }
        },
        {
          id: `edge-${edges.length + 2}`,
          source: spokeNode.id,
          target: hubNode.id,
          data: {
            strength: Math.max(1, Math.min(5, companyDependencyLevel)),
            type: 'spoke'
          }
        }
      ];
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
    
    // Initialize tooltips
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

  $: {
    distributionMode;
    teamCount;
    generateNodes();
  }

  // Add new reactive statement for company dependency level
  $: {
    companyDependencyLevel;
    if (distributionMode !== 'hub-spoke') {
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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Even Distribution -->
        <button
          class="relative p-4 border-2 rounded-lg transition-all {
            distributionMode === 'even'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
          on:click={() => {
            distributionMode = 'even';
            dependencyMatrix = initializeDependencyMatrix(teamCount);
            generateNodes();
          }}
        >
          <div class="flex items-center gap-3 mb-2">
            <div class="w-4 h-4 rounded-full border-2 {
              distributionMode === 'even'
                ? 'border-secondary bg-secondary'
                : 'border-gray-300'
            }">
              {#if distributionMode === 'even'}
                <svg class="w-4 h-4 text-white" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="4" fill="white"/>
                </svg>
              {/if}
            </div>
            <span class="font-medium text-gray-900">Even Distribution</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">Teams work together with balanced dependencies</p>
          <svg class="w-full h-32" viewBox="0 0 200 100">
            {#each Array(6) as _, i}
              {@const angle = (i * Math.PI * 2) / 6}
              {@const x = 100 + Math.cos(angle) * 40}
              {@const y = 50 + Math.sin(angle) * 40}
              <circle
                cx={x}
                cy={y}
                r="5"
                class="fill-secondary"
              />
              {#each Array(6) as _, j}
                {@const angle2 = (j * Math.PI * 2) / 6}
                {@const x2 = 100 + Math.cos(angle2) * 40}
                {@const y2 = 50 + Math.sin(angle2) * 40}
                {#if (i + 1) % 6 === j}
                  <line
                    x1={x}
                    y1={y}
                    x2={x2}
                    y2={y2}
                    class="stroke-secondary"
                    stroke-width="1"
                    stroke-opacity="0.3"
                  />
                {/if}
              {/each}
            {/each}
          </svg>
        </button>

        <!-- Hub and Spoke -->
        <button
          class="relative p-4 border-2 rounded-lg transition-all {
            distributionMode === 'hub-spoke'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
          on:click={() => {
            distributionMode = 'hub-spoke';
            dependencyMatrix = initializeDependencyMatrix(teamCount);
            generateNodes();
          }}
        >
          <div class="flex items-center gap-3 mb-2">
            <div class="w-4 h-4 rounded-full border-2 {
              distributionMode === 'hub-spoke'
                ? 'border-secondary bg-secondary'
                : 'border-gray-300'
            }">
              {#if distributionMode === 'hub-spoke'}
                <svg class="w-4 h-4 text-white" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="4" fill="white"/>
                </svg>
              {/if}
            </div>
            <span class="font-medium text-gray-900">Hub and Spoke</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">Central team coordinates with satellite teams</p>
          <svg class="w-full h-32" viewBox="0 0 200 100">
            <!-- Center hub -->
            <circle
              cx="100"
              cy="50"
              r="8"
              class="fill-secondary"
            />
            {#each Array(5) as _, i}
              {@const angle = (i * Math.PI * 2) / 5}
              {@const x = 100 + Math.cos(angle) * 40}
              {@const y = 50 + Math.sin(angle) * 40}
              <circle
                cx={x}
                cy={y}
                r="5"
                class="fill-secondary/60"
              />
              <line
                x1="100"
                y1="50"
                x2={x}
                y2={y}
                class="stroke-secondary"
                stroke-width="1.5"
                stroke-opacity="0.5"
              />
            {/each}
          </svg>
        </button>
      </div>
    </div>

    <!-- Configuration Panel -->
    <div class="space-y-6">
      <!-- Basic Parameters -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Number of Teams -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Number of Teams
            <button 
              class="tooltip ml-1"
              data-tippy-content="Adjust the number of teams in the organization (3-10 teams)">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={teamCount}
              min="3"
              max="10"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              on:input={() => {
                dependencyMatrix = initializeDependencyMatrix(teamCount);
                generateNodes();
              }}
              data-tippy-content="Drag to adjust the number of teams"
            />
            <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
              <span class="text-sm font-medium text-gray-900">{teamCount}</span>
            </div>
          </div>
        </div>

        <!-- Company Dependency Level -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Dependency Level
            <button 
              class="tooltip ml-1"
              data-tippy-content="Set the overall dependency level between teams (1: Very Low, 5: Very High). Higher levels indicate stronger dependencies and more coordination needed.">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={companyDependencyLevel}
              min="1"
              max="5"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              on:input={() => {
                dependencyMatrix = initializeDependencyMatrix(teamCount);
                generateNodes();
              }}
              data-tippy-content="Drag to adjust the dependency strength between teams"
            />
            <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
              <span class="text-sm font-medium text-gray-900">{companyDependencyLevel}</span>
            </div>
          </div>
        </div>

        <!-- Dev Rate -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Dev Rate ($/hr)
            <button 
              class="tooltip ml-1"
              data-tippy-content="Set the average hourly rate for developers, including benefits and overhead costs ($20-$200/hr)">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={costParams.hourlyRate.developer}
              min="20"
              max="200"
              step="5"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              data-tippy-content="Drag to adjust the hourly rate for developers"
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
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Weekly Meeting Hours
            <button 
              class="tooltip ml-1"
              data-tippy-content="Set the average number of hours spent in meetings per week (1-20 hours). Includes team syncs, planning, and coordination meetings.">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={costParams.meetings.weeklyDuration}
              min="1"
              max="20"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              data-tippy-content="Drag to adjust weekly meeting hours"
            />
            <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
              <span class="text-sm font-medium text-gray-900">{costParams.meetings.weeklyDuration}</span>
            </div>
          </div>
        </div>

        <!-- Meeting Attendees -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Meeting Attendees
            <button 
              class="tooltip ml-1"
              data-tippy-content="Set the average number of attendees per team in meetings (1-20 people). Consider both regular participants and occasional contributors.">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={costParams.meetings.attendeesPerTeam}
              min="1"
              max="20"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              data-tippy-content="Drag to adjust the number of meeting attendees"
            />
            <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
              <span class="text-sm font-medium text-gray-900">{costParams.meetings.attendeesPerTeam}</span>
            </div>
          </div>
        </div>

        <!-- Communication Overhead -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Communication Overhead
            <button 
              class="tooltip ml-1"
              data-tippy-content="Set the communication overhead multiplier (1.0: No overhead, 2.0: Double overhead). Accounts for additional time spent on coordination and communication.">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={costParams.overhead.communicationOverhead}
              min="1"
              max="2"
              step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
              data-tippy-content="Drag to adjust the communication overhead multiplier"
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
                        on:input={(e) => updateTeamParam(i, 'efficiency', parseFloat(e.currentTarget.value) || 0.1)}
                      />
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="mt-2 space-y-1 text-xs text-gray-500">
            <div class="flex gap-2">
              <span class="font-medium">Size:</span>
              <span>Number of team members</span>
            </div>
            <div class="flex gap-2">
              <span class="font-medium">Cap:</span>
              <span>Base capacity (story points/sprint)</span>
            </div>
            <div class="flex gap-2">
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
  </div>

  <!-- Team Visualization -->
  <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
    <div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Team Dependencies</h3>
      
      <!-- Visualization Controls -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
        <!-- Toggle Legend -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Show Legend</span>
          <button
            class="w-10 h-6 rounded-full transition-colors relative {showLegend ? 'bg-secondary' : 'bg-gray-200'}"
            on:click={() => showLegend = !showLegend}
          >
            <div class="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform {showLegend ? 'translate-x-5' : 'translate-x-1'}"/>
          </button>
        </div>
        
        <!-- Visualization Mode -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="text-sm text-gray-600">Visualization</span>
          <div class="flex rounded-lg border border-gray-200 p-1 flex-1 sm:flex-initial">
            <button
              class="flex-1 sm:flex-initial px-3 py-1 text-sm rounded-md transition-colors {visualizationMode === 'weighted' ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-50'}"
              on:click={() => visualizationMode = 'weighted'}
            >
              Weighted
            </button>
            <button
              class="flex-1 sm:flex-initial px-3 py-1 text-sm rounded-md transition-colors {visualizationMode === 'multiple' ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-50'}"
              on:click={() => visualizationMode = 'multiple'}
            >
              Multiple Lines
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="relative w-full h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
      <!-- Legend -->
      {#if showLegend}
        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-sm">
          <h4 class="text-xs font-medium text-gray-900 mb-2">Dependency Strength</h4>
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <div class="w-6 h-0.5 bg-green-500"/>
              <span class="text-xs text-gray-600">Very Low (1)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-6 h-1 bg-green-500"/>
              <span class="text-xs text-gray-600">Low (2)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-6 h-1.5 bg-yellow-500"/>
              <span class="text-xs text-gray-600">Medium (3)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-6 h-2 bg-orange-500"/>
              <span class="text-xs text-gray-600">High (4)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-6 h-2.5 bg-red-500"/>
              <span class="text-xs text-gray-600">Very High (5)</span>
            </div>
          </div>
        </div>
      {/if}

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
          <!-- Arrow markers for each strength level -->
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
          
          {#if visualizationMode === 'weighted'}
            <!-- Single weighted line -->
            {@const midX = (x1 + x2) / 2}
            {@const midY = (y1 + y2) / 2}
            {@const dx = x2 - x1}
            {@const dy = y2 - y1}
            {@const normalX = -dy / Math.sqrt(dx * dx + dy * dy) * 50}
            {@const normalY = dx / Math.sqrt(dx * dx + dy * dy) * 50}
            {@const nodeRadius = 85}
            {@const totalLength = Math.sqrt(dx * dx + dy * dy)}
            {@const endX = x2 - (dx * nodeRadius / totalLength)}
            {@const endY = y2 - (dy * nodeRadius / totalLength)}
            {@const startX = x1 + (dx * nodeRadius / totalLength)}
            {@const startY = y1 + (dy * nodeRadius / totalLength)}
            {@const strength = edge.data.strength}
            {@const strokeWidth = 1 + (strength - 1) * 0.8}
            {@const color = strength <= 1 ? '#22c55e' : 
                           strength <= 2 ? '#84cc16' :
                           strength <= 3 ? '#eab308' :
                           strength <= 4 ? '#f97316' : '#ef4444'}
            {@const opacity = 0.6 + (strength - 1) * 0.1}
            
            <path 
              d="M {startX} {startY} Q {midX + normalX} {midY + normalY} {endX} {endY}"
              fill="none"
              stroke={color}
              stroke-width={strokeWidth}
              stroke-opacity={opacity}
              marker-end="url(#arrowhead-{strength})"
            />
          {:else}
            <!-- Multiple lines based on dependency strength -->
            {#each Array(edge.data.strength) as _, lineIndex}
              {@const offset = (lineIndex - (edge.data.strength - 1) / 2) * 40}
              {@const midX = (x1 + x2) / 2}
              {@const midY = (y1 + y2) / 2}
              {@const dx = x2 - x1}
              {@const dy = y2 - y1}
              {@const normalX = -dy / Math.sqrt(dx * dx + dy * dy) * (100 + offset)}
              {@const normalY = dx / Math.sqrt(dx * dx + dy * dy) * (100 + offset)}
              {@const nodeRadius = 85}
              {@const totalLength = Math.sqrt(dx * dx + dy * dy)}
              {@const endX = x2 - (dx * nodeRadius / totalLength)}
              {@const endY = y2 - (dy * nodeRadius / totalLength)}
              {@const startX = x1 + (dx * nodeRadius / totalLength)}
              {@const startY = y1 + (dy * nodeRadius / totalLength)}
              {@const strength = edge.data.strength}
              {@const color = strength <= 1 ? '#22c55e' : 
                             strength <= 2 ? '#84cc16' :
                             strength <= 3 ? '#eab308' :
                             strength <= 4 ? '#f97316' : '#ef4444'}
              
              <path 
                d="M {startX} {startY} Q {midX + normalX} {midY + normalY} {endX} {endY}"
                fill="none"
                stroke={color}
                stroke-width="2"
                stroke-opacity="0.7"
                marker-end="url(#arrowhead-{strength})"
              />
            {/each}
          {/if}
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
      </svg>
    </div>
  </div>

  <!-- Analysis Summary -->
  <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Impact Analysis</h3>
    
    <!-- Comparison Mode Selection -->
    <div class="mb-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Select Comparison Model</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Team Topology -->
        <button
          class="relative p-3 border-2 rounded-lg transition-all {
            comparisonMode === 'topology'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
          on:click={() => comparisonMode = 'topology'}
        >
          <div class="flex items-center gap-2 mb-1">
            <div class="w-3 h-3 rounded-full border-2 {
              comparisonMode === 'topology'
                ? 'border-secondary bg-secondary'
                : 'border-gray-300'
            }"/>
            <span class="font-medium text-gray-900">Team Topology</span>
          </div>
          <p class="text-xs text-gray-600 mb-2">Compare with independent teams</p>
          <svg class="w-full h-16" viewBox="0 0 160 60">
            {#each Array(4) as _, i}
              {@const x = 40 + i * 40}
              <circle
                cx={x}
                cy="30"
                r="12"
                class="fill-secondary/20 stroke-secondary"
                stroke-width="2"
              />
            {/each}
          </svg>
        </button>

        <!-- Lazy Edit -->
        <button
          class="relative p-3 border-2 rounded-lg transition-all {
            comparisonMode === 'lazy'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
          on:click={() => comparisonMode = 'lazy'}
        >
          <div class="flex items-center gap-2 mb-1">
            <div class="w-3 h-3 rounded-full border-2 {
              comparisonMode === 'lazy'
                ? 'border-secondary bg-secondary'
                : 'border-gray-300'
            }"/>
            <span class="font-medium text-gray-900">Lazy Edit</span>
          </div>
          <p class="text-xs text-gray-600 mb-2">Adjust dependency levels</p>
          <svg class="w-full h-16" viewBox="0 0 160 60">
            <circle cx="40" cy="30" r="12" class="fill-secondary"/>
            <line x1="52" y1="30" x2="76" y2="30" class="stroke-secondary/50" stroke-width="2" stroke-dasharray="4 2"/>
            <circle cx="88" cy="30" r="12" class="fill-secondary/60"/>
            <line x1="100" y1="30" x2="124" y2="30" class="stroke-secondary/30" stroke-width="1" stroke-dasharray="4 2"/>
            <circle cx="136" cy="30" r="12" class="fill-secondary/30"/>
          </svg>
        </button>

        <!-- Advanced -->
        <button
          class="relative p-3 border-2 rounded-lg transition-all {
            comparisonMode === 'advanced'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
          on:click={() => comparisonMode = 'advanced'}
        >
          <div class="flex items-center gap-2 mb-1">
            <div class="w-3 h-3 rounded-full border-2 {
              comparisonMode === 'advanced'
                ? 'border-secondary bg-secondary'
                : 'border-gray-300'
            }"/>
            <span class="font-medium text-gray-900">Advanced</span>
          </div>
          <p class="text-xs text-gray-600 mb-2">Custom dependency matrix</p>
          <svg class="w-full h-16" viewBox="0 0 160 60">
            <rect x="30" y="10" width="100" height="40" rx="4" fill="none" class="stroke-secondary" stroke-width="2" stroke-dasharray="4 2"/>
            <text x="80" y="35" text-anchor="middle" class="text-[8px] fill-secondary font-medium">Custom Matrix</text>
          </svg>
        </button>
      </div>
    </div>

    <!-- Comparison Controls based on Mode -->
    {#if comparisonMode === 'lazy'}
      <div class="mb-6 p-6 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
        <h4 class="text-sm font-medium text-gray-700 mb-4">Dependency Level Adjustment</h4>
        <div class="space-y-6">
          <!-- Adjustment Controls -->
          <div class="flex flex-col items-center gap-4">
            <div class="flex items-center gap-6">
              <button 
                class="h-12 w-12 flex items-center justify-center rounded-xl transition-all font-medium text-base {
                  dependencyAdjustment === -2 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-500'
                }"
                on:click={() => dependencyAdjustment = -2}
              >-2</button>
              <button 
                class="h-12 w-12 flex items-center justify-center rounded-xl transition-all font-medium text-base {
                  dependencyAdjustment === -1 
                    ? 'bg-green-400 text-white shadow-lg shadow-green-400/20' 
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-400 hover:text-green-400'
                }"
                on:click={() => dependencyAdjustment = -1}
              >-1</button>
              <button 
                class="h-14 w-20 flex items-center justify-center rounded-xl transition-all font-medium text-xl {
                  dependencyAdjustment === 0 
                    ? 'bg-gray-100 text-gray-900 shadow-lg shadow-gray-500/10' 
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-400'
                }"
                on:click={() => dependencyAdjustment = 0}
              >0</button>
              <button 
                class="h-12 w-12 flex items-center justify-center rounded-xl transition-all font-medium text-base {
                  dependencyAdjustment === 1 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-amber-500 hover:text-amber-500'
                }"
                on:click={() => dependencyAdjustment = 1}
              >+1</button>
              <button 
                class="h-12 w-12 flex items-center justify-center rounded-xl transition-all font-medium text-base {
                  dependencyAdjustment === 2 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-500 hover:text-red-500'
                }"
                on:click={() => dependencyAdjustment = 2}
              >+2</button>
            </div>
            <div class="w-full max-w-lg h-2 bg-gradient-to-r from-green-500 via-amber-500 to-red-500 rounded-full opacity-20"/>
          </div>

          <!-- Legend -->
          <div class="grid grid-cols-3 gap-4 text-xs">
            <div class="flex flex-col items-center gap-1.5">
              <div class="flex items-center gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <span class="text-gray-700 font-medium">Reduce Dependencies</span>
              </div>
              <span class="text-gray-500">Lower coordination costs</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <div class="flex items-center gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                <span class="text-gray-700 font-medium">No Change</span>
              </div>
              <span class="text-gray-500">Current structure</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <div class="flex items-center gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <span class="text-gray-700 font-medium">Increase Dependencies</span>
              </div>
              <span class="text-gray-500">Higher coordination</span>
            </div>
          </div>

          <!-- Info Box -->
          <div class="bg-secondary/5 p-4 rounded-xl border border-secondary/10">
            <div class="flex items-start gap-3">
              <div class="p-2 bg-secondary/10 rounded-lg">
                <svg class="w-4 h-4 text-secondary" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-700">
                  <span class="font-medium">How it works:</span> This adjustment will modify all existing dependencies by the selected level while maintaining their relative proportions. For example, selecting -1 will reduce each dependency by one level.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if comparisonMode === 'advanced'}
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-700 mb-3">Target Dependency Matrix</h4>
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
                            {targetDependencyMatrix[fromIndex][toIndex] <= 1 ? 'bg-green-50' : 
                             targetDependencyMatrix[fromIndex][toIndex] <= 3 ? 'bg-yellow-50' : 'bg-red-50'}"
                          value={targetDependencyMatrix[fromIndex][toIndex]}
                          on:input={(e) => updateTargetDependency(fromIndex, toIndex, parseInt(e.currentTarget.value) || 0)}
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
    {/if}

    <!-- Comparison Results -->
    {#if nodes.length > 0}
      {@const comparisonMetrics = calculateComparisonMetrics(comparisonMode)}
      {@const currentCosts = calculateCosts()}
      {@const costDifference = currentCosts.totalCost - comparisonMetrics.costs.totalCost}
      
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
                <div class="text-xs text-gray-500 mt-1">
                  Including dependencies and coordination
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Team Efficiency</span>
                  <span class="font-medium">{metrics.flowEfficiency.toFixed(1)}%</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  Time spent on value-adding work
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Average Lead Time</span>
                  <span class="font-medium">{metrics.avgLeadTime.toFixed(1)} days</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  Time to complete work items
                </div>
              </div>
            </div>
          </div>

          <!-- Comparison Model -->
          <div class="bg-white rounded-lg p-4 border border-gray-200">
            <div class="text-sm font-medium text-gray-600 mb-2">
              {#if comparisonMode === 'topology'}
                If Teams Were Independent
              {:else if comparisonMode === 'lazy'}
                With Adjusted Dependencies
              {:else}
                With Custom Dependencies
              {/if}
            </div>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Weekly Cost</span>
                  <span class="font-medium">${comparisonMetrics.costs.totalCost.toFixed(2)}</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {#if comparisonMode === 'topology'}
                    Minimal coordination needed
                  {:else if comparisonMode === 'lazy'}
                    With {dependencyAdjustment > 0 ? 'increased' : 'reduced'} dependencies
                  {:else}
                    Based on custom matrix
                  {/if}
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Team Efficiency</span>
                  <span class="font-medium">{comparisonMetrics.flowEfficiency.toFixed(1)}%</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {#if comparisonMode === 'topology'}
                    Theoretical maximum efficiency
                  {:else if comparisonMode === 'lazy'}
                    Adjusted flow efficiency
                  {:else}
                    Custom configuration efficiency
                  {/if}
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Average Lead Time</span>
                  <span class="font-medium">{comparisonMetrics.leadTime.toFixed(1)} days</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {#if comparisonMode === 'topology'}
                    Without dependency delays
                  {:else if comparisonMode === 'lazy'}
                    With adjusted dependencies
                  {:else}
                    Based on custom configuration
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Before and After Visualization -->
        <div class="mt-6">
          <!-- Visualization Controls -->
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-sm font-medium text-gray-900">Team Structure Comparison</h4>
            <div class="flex items-center gap-4">
              <div class="flex rounded-lg border border-gray-200 p-1">
                <button
                  class="px-3 py-1 text-xs rounded-md transition-colors {visualizationMode === 'weighted' ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-50'}"
                  on:click={() => visualizationMode = 'weighted'}
                >
                  Weighted
                </button>
                <button
                  class="px-3 py-1 text-xs rounded-md transition-colors {visualizationMode === 'multiple' ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-50'}"
                  on:click={() => visualizationMode = 'multiple'}
                >
                  Multiple Lines
                </button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Current Structure -->
            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <h5 class="text-sm font-medium text-gray-900 mb-4">Current Team Structure</h5>
              <div class="relative w-full h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                <svg width="100%" height="100%" viewBox="-50 -50 600 400" preserveAspectRatio="xMidYMid meet">
                  <!-- Background grid -->
                  <defs>
                    <pattern id="smallGrid2" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f1f5f9" stroke-width="0.5"/>
                    </pattern>
                    <pattern id="grid2" width="100" height="100" patternUnits="userSpaceOnUse">
                      <rect width="100" height="100" fill="url(#smallGrid2)"/>
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" stroke-width="1"/>
                    </pattern>
                    <!-- Node gradient -->
                    <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid2)" />

                  <!-- Draw current edges -->
                  {#each edges as edge}
                    {@const sourceNode = nodes.find(n => n.id === edge.source)}
                    {@const targetNode = nodes.find(n => n.id === edge.target)}
                    {@const sourceIndex = nodes.findIndex(n => n.id === edge.source)}
                    {@const targetIndex = nodes.findIndex(n => n.id === edge.target)}
                    {@const angleStep = (2 * Math.PI) / nodes.length}
                    {@const sourceAngle = angleStep * sourceIndex - Math.PI / 2}
                    {@const targetAngle = angleStep * targetIndex - Math.PI / 2}
                    {@const radiusX = 200}
                    {@const radiusY = 150}
                    {@const x1 = 250 + radiusX * Math.cos(sourceAngle)}
                    {@const y1 = 150 + radiusY * Math.sin(sourceAngle)}
                    {@const x2 = 250 + radiusX * Math.cos(targetAngle)}
                    {@const y2 = 150 + radiusY * Math.sin(targetAngle)}
                    {@const strength = edge.data.strength}
                    {@const color = strength <= 1 ? '#22c55e' : 
                                 strength <= 2 ? '#84cc16' :
                                 strength <= 3 ? '#eab308' :
                                 strength <= 4 ? '#f97316' : '#ef4444'}
                    
                    {#if visualizationMode === 'weighted'}
                      <!-- Single weighted line -->
                      <path 
                        d="M {x1} {y1} L {x2} {y2}"
                        stroke={color}
                        stroke-width={1 + strength * 0.5}
                        stroke-opacity="0.6"
                      />
                    {:else}
                      <!-- Multiple lines -->
                      {#each Array(strength) as _, lineIndex}
                        {@const offset = (lineIndex - (strength - 1) / 2) * 15}
                        {@const midX = (x1 + x2) / 2}
                        {@const midY = (y1 + y2) / 2}
                        {@const dx = x2 - x1}
                        {@const dy = y2 - y1}
                        {@const normalX = -dy / Math.sqrt(dx * dx + dy * dy) * offset}
                        {@const normalY = dx / Math.sqrt(dx * dx + dy * dy) * offset}
                        
                        <path 
                          d="M {x1} {y1} Q {midX + normalX} {midY + normalY} {x2} {y2}"
                          stroke={color}
                          stroke-width="2"
                          stroke-opacity="0.7"
                          fill="none"
                        />
                      {/each}
                    {/if}
                  {/each}

                  <!-- Draw current nodes -->
                  {#each nodes as node, i}
                    {@const angleStep = (2 * Math.PI) / nodes.length}
                    {@const angle = angleStep * i - Math.PI / 2}
                    {@const radiusX = 200}
                    {@const radiusY = 150}
                    {@const x = 250 + radiusX * Math.cos(angle)}
                    {@const y = 150 + radiusY * Math.sin(angle)}
                    
                    <!-- Node background with shadow -->
                    <circle
                      cx={x}
                      cy={y}
                      r="25"
                      fill="url(#nodeGradient)"
                      stroke="#e2e8f0"
                      stroke-width="2"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                    />
                    <!-- Node label background -->
                    <rect
                      x={x - 30}
                      y={y - 8}
                      width="60"
                      height="16"
                      rx="4"
                      fill="#f8fafc"
                      stroke="#e2e8f0"
                      stroke-width="1"
                    />
                    <!-- Node label -->
                    <text
                      x={x}
                      y={y}
                      text-anchor="middle"
                      dominant-baseline="middle"
                      class="text-xs font-medium fill-gray-700"
                    >{node.data.label}</text>
                  {/each}
                </svg>
              </div>
            </div>

            <!-- Target Structure -->
            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <h5 class="text-sm font-medium text-gray-900 mb-4">
                {#if comparisonMode === 'topology'}
                  Independent Teams
                {:else if comparisonMode === 'lazy'}
                  Adjusted Dependencies
                {:else}
                  Target Structure
                {/if}
              </h5>
              <div class="relative w-full h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                <svg width="100%" height="100%" viewBox="-50 -50 600 400" preserveAspectRatio="xMidYMid meet">
                  <rect width="100%" height="100%" fill="url(#grid2)" />

                  <!-- Draw target edges based on comparison mode -->
                  {#if comparisonMode === 'topology'}
                    <!-- No edges for independent teams -->
                  {:else if comparisonMode === 'lazy'}
                    {#each edges as edge}
                      {@const sourceNode = nodes.find(n => n.id === edge.source)}
                      {@const targetNode = nodes.find(n => n.id === edge.target)}
                      {@const sourceIndex = nodes.findIndex(n => n.id === edge.source)}
                      {@const targetIndex = nodes.findIndex(n => n.id === edge.target)}
                      {@const angleStep = (2 * Math.PI) / nodes.length}
                      {@const sourceAngle = angleStep * sourceIndex - Math.PI / 2}
                      {@const targetAngle = angleStep * targetIndex - Math.PI / 2}
                      {@const radiusX = 200}
                      {@const radiusY = 150}
                      {@const x1 = 250 + radiusX * Math.cos(sourceAngle)}
                      {@const y1 = 150 + radiusY * Math.sin(sourceAngle)}
                      {@const x2 = 250 + radiusX * Math.cos(targetAngle)}
                      {@const y2 = 150 + radiusY * Math.sin(targetAngle)}
                      {@const adjustedStrength = Math.max(0, Math.min(5, edge.data.strength + dependencyAdjustment))}
                      {@const color = adjustedStrength <= 1 ? '#22c55e' : 
                                   adjustedStrength <= 2 ? '#84cc16' :
                                   adjustedStrength <= 3 ? '#eab308' :
                                   adjustedStrength <= 4 ? '#f97316' : '#ef4444'}
                      
                      {#if visualizationMode === 'weighted'}
                        <!-- Single weighted line -->
                        <path 
                          d="M {x1} {y1} L {x2} {y2}"
                          stroke={color}
                          stroke-width={1 + adjustedStrength * 0.5}
                          stroke-opacity="0.6"
                        />
                      {:else}
                        <!-- Multiple lines -->
                        {#each Array(adjustedStrength) as _, lineIndex}
                          {@const offset = (lineIndex - (adjustedStrength - 1) / 2) * 15}
                          {@const midX = (x1 + x2) / 2}
                          {@const midY = (y1 + y2) / 2}
                          {@const dx = x2 - x1}
                          {@const dy = y2 - y1}
                          {@const normalX = -dy / Math.sqrt(dx * dx + dy * dy) * offset}
                          {@const normalY = dx / Math.sqrt(dx * dx + dy * dy) * offset}
                          
                          <path 
                            d="M {x1} {y1} Q {midX + normalX} {midY + normalY} {x2} {y2}"
                            stroke={color}
                            stroke-width="2"
                            stroke-opacity="0.7"
                            fill="none"
                          />
                        {/each}
                      {/if}
                    {/each}
                  {:else}
                    {#each dependencyMatrix.teams as fromTeam, fromIndex}
                      {#each dependencyMatrix.teams as toTeam, toIndex}
                        {#if fromIndex !== toIndex && targetDependencyMatrix[fromIndex][toIndex] > 0}
                          {@const angleStep = (2 * Math.PI) / nodes.length}
                          {@const sourceAngle = angleStep * fromIndex - Math.PI / 2}
                          {@const targetAngle = angleStep * toIndex - Math.PI / 2}
                          {@const radiusX = 200}
                          {@const radiusY = 150}
                          {@const x1 = 250 + radiusX * Math.cos(sourceAngle)}
                          {@const y1 = 150 + radiusY * Math.sin(sourceAngle)}
                          {@const x2 = 250 + radiusX * Math.cos(targetAngle)}
                          {@const y2 = 150 + radiusY * Math.sin(targetAngle)}
                          {@const strength = targetDependencyMatrix[fromIndex][toIndex]}
                          {@const color = strength <= 1 ? '#22c55e' : 
                                       strength <= 2 ? '#84cc16' :
                                       strength <= 3 ? '#eab308' :
                                       strength <= 4 ? '#f97316' : '#ef4444'}
                          
                          {#if visualizationMode === 'weighted'}
                            <!-- Single weighted line -->
                            <path 
                              d="M {x1} {y1} L {x2} {y2}"
                              stroke={color}
                              stroke-width={1 + strength * 0.5}
                              stroke-opacity="0.6"
                            />
                          {:else}
                            <!-- Multiple lines -->
                            {#each Array(strength) as _, lineIndex}
                              {@const offset = (lineIndex - (strength - 1) / 2) * 15}
                              {@const midX = (x1 + x2) / 2}
                              {@const midY = (y1 + y2) / 2}
                              {@const dx = x2 - x1}
                              {@const dy = y2 - y1}
                              {@const normalX = -dy / Math.sqrt(dx * dx + dy * dy) * offset}
                              {@const normalY = dx / Math.sqrt(dx * dx + dy * dy) * offset}
                              
                              <path 
                                d="M {x1} {y1} Q {midX + normalX} {midY + normalY} {x2} {y2}"
                                stroke={color}
                                stroke-width="2"
                                stroke-opacity="0.7"
                                fill="none"
                              />
                            {/each}
                          {/if}
                        {/if}
                      {/each}
                    {/each}
                  {/if}

                  <!-- Draw nodes -->
                  {#each nodes as node, i}
                    {@const angleStep = (2 * Math.PI) / nodes.length}
                    {@const angle = angleStep * i - Math.PI / 2}
                    {@const radiusX = 200}
                    {@const radiusY = 150}
                    {@const x = 250 + radiusX * Math.cos(angle)}
                    {@const y = 150 + radiusY * Math.sin(angle)}
                    
                    <!-- Node background with shadow -->
                    <circle
                      cx={x}
                      cy={y}
                      r="25"
                      fill="url(#nodeGradient)"
                      stroke="#e2e8f0"
                      stroke-width="2"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                    />
                    <!-- Node label background -->
                    <rect
                      x={x - 30}
                      y={y - 8}
                      width="60"
                      height="16"
                      rx="4"
                      fill="#f8fafc"
                      stroke="#e2e8f0"
                      stroke-width="1"
                    />
                    <!-- Node label -->
                    <text
                      x={x}
                      y={y}
                      text-anchor="middle"
                      dominant-baseline="middle"
                      class="text-xs font-medium fill-gray-700"
                    >{node.data.label}</text>
                  {/each}
                </svg>
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
              ({((costDifference / comparisonMetrics.costs.totalCost) * 100).toFixed(2)}% increase).
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
    {/if}
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
                  {((costs.weeklyMeetingCost / costs.totalCost) * 100).toFixed(2)}% of total
                </div>
              </div>
              <div class="bg-gradient-to-br from-amber-50 to-white p-4 rounded-lg border border-amber-200">
                <div class="text-sm font-medium text-gray-600">Communication</div>
                <div class="text-xl font-bold text-amber-600 mt-1">
                  ${costs.communicationCost.toFixed(2)}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {((costs.communicationCost / costs.totalCost) * 100).toFixed(2)}% of total
                </div>
              </div>
              <div class="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-lg border border-emerald-200">
                <div class="text-sm font-medium text-gray-600">Process Overhead</div>
                <div class="text-xl font-bold text-emerald-600 mt-1">
                  ${costs.processOverhead.toFixed(2)}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {((costs.processOverhead / costs.totalCost) * 100).toFixed(2)}% of total
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