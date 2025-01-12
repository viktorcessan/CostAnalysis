<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, type Plugin } from 'chart.js/auto';
  import type { ChartConfiguration, ChartData, ChartOptions, DoughnutControllerChartOptions } from 'chart.js';
  import ChartDataLabels from 'chartjs-plugin-datalabels';
  import tippy from 'tippy.js';
  import 'tippy.js/dist/tippy.css';
  import 'tippy.js/themes/light-border.css';
  import TeamDependencyModal from '$lib/components/ui/TeamDependencyModal.svelte';
  import TeamDependencyShareModal from '$lib/components/ui/TeamDependencyShareModal.svelte';
  import TeamDependencyLoadingModal from '$lib/components/ui/TeamDependencyLoadingModal.svelte';
  import ExpertModal from '$lib/components/ui/ExpertModal.svelte';
  import { teamDependencyTemplateStore } from '$lib/stores/teamDependencyTemplateStore';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { validateShareParams, parseShareLink } from '$lib/utils/teamDependencyShare';
  import type { TeamDependencyParams } from '$lib/utils/teamDependencyShare';
  import { exportToExcel } from '$lib/utils/exportUtils';
  import html2canvas from 'html2canvas';
  import { exportTeamDependencyToExcel, exportTeamDependencyToPNG } from '$lib/utils/teamDependencyExport';
  import { initTutorial } from '$lib/utils/tutorial';
  import type { Tour } from 'shepherd.js';
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import type { TeamInputs } from '$lib/types/calculator';

  let tour: Tour | null = null;

  Chart.register(ChartDataLabels as unknown as Plugin);  // Register the plugin

  export let sharedConfig: TeamDependencyParams | null = null;

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
      weeklyMeetingCost: costParams.meetings.monthlyDuration * 
        costParams.meetings.attendeesPerTeam * 
        costParams.hourlyRate.developer * 
        matrix.reduce((sum, row) => sum + row.filter(v => v > 0).length, 0),
      communicationCost: matrix.reduce((sum, row) => 
        sum + row.reduce((s, v) => s + (v > 0 ? v * costParams.hourlyRate.developer * 4 : 0), 0), 0),
      get totalCost() {
        return this.weeklyMeetingCost + this.communicationCost;
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

  function initializeDependencyMatrix(size: number): DependencyMatrix {
    // Create teams array using current team names if available
    const teams = teamParams.teams.slice(0, size).map(team => team.name);
    
    // Initialize dependencies array with zeros
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
      monthlyDuration: 16, // Changed from weeklyDuration: 4 to monthlyDuration: 16 (4 weeks * 4 hours)
      attendeesPerTeam: 5
    },
    overhead: {
      communicationOverhead: 1.2,
      waitTimeMultiplier: 1.5,
      baselineCommunicationHours: 8, // Changed from 2 to 8 (2 * 4 weeks)
      dependencyHoursRate: 8 // Changed from 2 to 8 (2 * 4 weeks)
    }
  };

  // Subscribe to calculator store to sync hourly rate
  calculatorStore.subscribe(state => {
    const currentState = calculatorStore.getCurrentState();
    const baseInputs = currentState?.baseInputs as TeamInputs;
    if (baseInputs?.hourlyRate) {
      costParams.hourlyRate.developer = baseInputs.hourlyRate;
    }
  });

  // Update calculator store when hourly rate changes
  function handleHourlyRateChange() {
    const currentState = calculatorStore.getCurrentState();
    const baseInputs = currentState?.baseInputs as TeamInputs;
    if (baseInputs) {
      calculatorStore.updateTeamInputs({
        teamSize: baseInputs.teamSize,
        hourlyRate: costParams.hourlyRate.developer,
        serviceEfficiency: baseInputs.serviceEfficiency,
        operationalOverhead: baseInputs.operationalOverhead
      });
    }
  }

  // Add canvas binding at the top of the script section
  let costChartCanvas: HTMLCanvasElement | undefined;
  let costDistributionChart: Chart | null = null;

  // Update the CostAnalysis interface
  interface CostAnalysis {
    monthlyMeetingCost: number;
    communicationCost: number;
    totalCost: number;
  }

  // Update the cost chart initialization
  function createCostDistributionChart(costs: CostAnalysis) {
    if (!costChartCanvas) return;
    
    if (costDistributionChart) {
      costDistributionChart.destroy();
    }

    const data = [
      costs.monthlyMeetingCost,
      costs.communicationCost
    ];

    const total = costs.totalCost;
    const percentages = data.map(value => ((value / total) * 100).toFixed(1));

    costDistributionChart = new Chart(costChartCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Monthly Meetings', 'Communication'],
        datasets: [{
          data,
          backgroundColor: [
            'rgb(14, 165, 233)',
            'rgb(245, 158, 11)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const percentage = percentages[context.dataIndex];
                return `$${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Add onMount initialization
  onMount(() => {
    if (costChartCanvas) {
      const costs = calculateCosts();
      createCostDistributionChart(costs);
    }

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

    // Initialize tour
    tour = initTutorial();
  });

  // Update reactive statement
  $: {
    if (costChartCanvas && nodes.length > 0) {
      const costs = calculateCosts();
      createCostDistributionChart(costs);
    }
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
    // Update both teamParams and dependencyMatrix
    teamParams.teams[index].name = newName;
    dependencyMatrix.teams[index] = newName;
    
    // Update node labels
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
    
    // Force update of reactive variables
    teamParams = teamParams;
    dependencyMatrix = dependencyMatrix;
    nodes = nodes;
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
    const currentTeams = dependencyMatrix?.teams || [];
    const currentTeamParams = teamParams.teams;
    
    nodes = [];
    edges = [];
    
    // Initialize dependency matrix while preserving team names
    if (!dependencyMatrix || dependencyMatrix.teams.length !== teamCount) {
    dependencyMatrix = initializeDependencyMatrix(teamCount);
      // Restore existing team names
      for (let i = 0; i < teamCount; i++) {
        if (currentTeams[i]) {
          dependencyMatrix.teams[i] = currentTeams[i];
        }
      }
    }
    
    // Ensure team params are in sync
    while (teamParams.teams.length < teamCount) {
      const index = teamParams.teams.length;
      teamParams.teams.push({
        name: dependencyMatrix.teams[index],
        size: currentTeamParams[0]?.size || 5,
        baseCapacity: 8,
        efficiency: 1.0
      });
    }
    
    // Create nodes with current team names
    for (let i = 0; i < teamCount; i++) {
      const metrics = calculateTeamMetrics(i, dependencyMatrix.dependencies, teamParams.teams);
      const node = {
        id: `node-${i + 1}`,
        data: {
          label: dependencyMatrix.teams[i],
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

  function calculateCosts(): CostAnalysis {
    const totalTeams = nodes.length;
    const totalConnections = edges.length;
    const totalPeople = nodes.reduce((sum, node) => sum + node.data.size, 0);
    
    // Meeting costs
    const monthlyMeetingCost = 
      costParams.meetings.monthlyDuration * 
      costParams.meetings.attendeesPerTeam * 
      costParams.hourlyRate.developer * 
      totalConnections * 
      costParams.overhead.communicationOverhead;

    // Communication costs
    const communicationCost =
      totalConnections * costParams.overhead.communicationOverhead *
      costParams.hourlyRate.developer * costParams.overhead.baselineCommunicationHours + // Baseline communication
      edges.reduce((sum, edge) => sum + (edge.data.strength * costParams.overhead.dependencyHoursRate * costParams.hourlyRate.developer), 0); // Additional cost based on dependency strength

    return {
      monthlyMeetingCost,
      communicationCost,
      totalCost: monthlyMeetingCost + communicationCost
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

    // Initialize tour
    tour = initTutorial();
  });

  $: {
    distributionMode;
    teamCount;
    if (!sharedConfig) {  // Only regenerate if not loading a shared config
      generateNodes();
    }
  }

  // Update the reactive statement for dependency level
  $: {
    companyDependencyLevel;
    if (!sharedConfig && distributionMode !== 'hub-spoke') {  // Only regenerate if not loading a shared config
      generateNodes();
    }
  }

  $: {
    // Watch all variables that affect costs
    nodes;
    edges;
    teamCount;
    distributionMode;
    companyDependencyLevel;
    costParams.hourlyRate;
    costParams.meetings;
    costParams.overhead;
    
    if (nodes.length > 0 && costChartCanvas) {
      const costs = calculateCosts();
      createCostDistributionChart(costs);
    }
  }

  // Add function to calculate metrics for independent teams
  function calculateIndependentTeamMetrics() {
    const independentCosts = {
      monthlyMeetingCost: costParams.meetings.monthlyDuration * 
        costParams.meetings.attendeesPerTeam * 
        costParams.hourlyRate.developer * 
        nodes.length,
      communicationCost: nodes.length * costParams.hourlyRate.developer * 5,
      totalCost: 0
    };
    
    independentCosts.totalCost = independentCosts.monthlyMeetingCost + 
      independentCosts.communicationCost;
    
    return {
      costs: independentCosts,
      flowEfficiency: 95,
      leadTime: teamParams.baseLeadTime,
      utilizationRate: 90
    };
  }

  let showLLMTemplate = false;
  let showExpertModal = false;
  let showShareModal = false;
  let showLoadingModal = false;

  function openLLMTemplate() {
    showLLMTemplate = true;
  }

  function openExpertModal() {
    showExpertModal = true;
  }

  // Handle share button click
  function handleShare() {
    showShareModal = true;
  }

  // Handle loading shared configuration
  function handleLoadConfig() {
    if (!sharedConfig || !validateShareParams(sharedConfig)) {
      return;
    }

    console.log('Loading shared config:', sharedConfig);
    
    // First, update team parameters
    teamParams = {
      ...teamParams,
      teams: Array(10).fill(null).map((_, i) => {
        if (i < sharedConfig.teams.length) {
          return {
            name: sharedConfig.teams[i].name,
            size: sharedConfig.teams[i].size || 5,
            baseCapacity: sharedConfig.teams[i].baseCapacity || 8,
            efficiency: sharedConfig.teams[i].efficiency || 1.0
          };
        } else {
          return {
            name: `Team ${i + 1}`,
            size: 5,
            baseCapacity: 8,
            efficiency: 1.0
          };
        }
      })
    };

    // Update team count
    teamCount = sharedConfig.teams.length;

    // Update distribution mode and dependency level
    distributionMode = sharedConfig.distributionMode;
    companyDependencyLevel = sharedConfig.companyDependencyLevel;

    // Update cost parameters
    costParams = {
      ...costParams,
      hourlyRate: {
        ...costParams.hourlyRate,
        developer: sharedConfig.costParams.hourlyRate.developer
      },
      meetings: {
        ...costParams.meetings,
        monthlyDuration: sharedConfig.costParams.meetings.monthlyDuration,
        attendeesPerTeam: sharedConfig.costParams.meetings.attendeesPerTeam
      },
      overhead: {
        ...costParams.overhead,
        communicationOverhead: sharedConfig.costParams.overhead.communicationOverhead,
        baselineCommunicationHours: sharedConfig.costParams.overhead.baselineCommunicationHours,
        dependencyHoursRate: sharedConfig.costParams.overhead.dependencyHoursRate
      }
    };

    // Update dependency matrix
    dependencyMatrix = {
      teams: sharedConfig.dependencyMatrix.teams,
      dependencies: sharedConfig.dependencyMatrix.dependencies
    };

    // Clear existing nodes and edges
    nodes = [];
    edges = [];

    // Generate new nodes
    for (let i = 0; i < teamCount; i++) {
      const metrics = calculateTeamMetrics(i, dependencyMatrix.dependencies, teamParams.teams);
      const node = {
        id: `node-${i + 1}`,
        data: {
          label: teamParams.teams[i].name,
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

    // Apply the matrix to generate edges
    applyMatrix();
    
    showLoadingModal = false;
  }

  // Show loading modal if shared config is present
  onMount(() => {
    if (sharedConfig && validateShareParams(sharedConfig)) {
      showLoadingModal = true;
    }
  });

  // Export functions
  async function handleExportExcel() {
    const costs = calculateCosts();
    await exportTeamDependencyToExcel({
      teams: teamParams.teams,
      dependencyMatrix,
      metrics,
      costs
    });
  }

  async function handleExportPNG() {
    if (nodes.length > 0) {
      const costs = calculateCosts();
      if (costChartCanvas) {
        createCostDistributionChart(costs);
      }
      await exportTeamDependencyToPNG();
    }
  }

  // Add these variables and calculations
  let comparisonMetrics = {
    costs: {
      monthlyMeetingCost: 0,
      communicationCost: 0,
      totalCost: 0
    },
    flowEfficiency: 0,
    leadTime: 0,
    utilizationRate: 0
  };

  let costDifference = 0;

  // Update the reactive statement to calculate comparison metrics
  $: {
    if (nodes.length > 0) {
      const currentCosts = calculateCosts();
      const independentTeamMetrics = calculateIndependentTeamMetrics();
      comparisonMetrics = independentTeamMetrics;
      costDifference = currentCosts.totalCost - comparisonMetrics.costs.totalCost;
    }
  }
</script>

<!-- Add Tour Button -->
<div id="team-dependencies-container" class="space-y-6">
<div class="space-y-6">
  <!-- Mode Selection Controls -->
  <div class="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-8">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Team Structure Configuration</h3>
      <!-- Add Tutorial Button -->
      
      <button
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all flex items-center gap-2 shadow hover:shadow-lg"
        on:click={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => tour?.start(), 300);
        }}
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Tutorial
      </button>
      
      
    </div>
    
    <!-- Distribution Pattern Selection -->
    <div id="distribution-pattern-section">
      <h3 class="text-base font-semibold text-gray-900 mb-4">Distribution Pattern</h3>
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
              // Keep existing team names when changing distribution mode
              const currentTeams = [...dependencyMatrix.teams];
              const currentTeamParams = [...teamParams.teams];
            dependencyMatrix = initializeDependencyMatrix(teamCount);
              dependencyMatrix.teams = currentTeams;
              teamParams.teams = currentTeamParams;
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
              // Keep existing team names when changing distribution mode
              const currentTeams = [...dependencyMatrix.teams];
              const currentTeamParams = [...teamParams.teams];
            dependencyMatrix = initializeDependencyMatrix(teamCount);
              dependencyMatrix.teams = currentTeams;
              teamParams.teams = currentTeamParams;
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

    <!-- Team Parameters Section -->
    <div id="team-params-section" class="border-t pt-8">
      <h3 class="text-base font-semibold text-gray-900 mb-6">Team Parameters</h3>
      <div class="space-y-6">
        <!-- Basic Controls -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              />
              <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
                <span class="text-sm font-medium text-gray-900">{teamCount}</span>
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
                on:input={handleHourlyRateChange}
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

        <!-- Team Details Table -->
        <div id="team-details-table">
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
                        <div class="relative group">
                      <input
                        type="text"
                        value={team.name}
                            class="w-20 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-secondary focus:ring-0 text-xs truncate"
                        on:change={(e) => updateTeamName(i, e.currentTarget.value)}
                            data-tippy-content={team.name}
                          />
                          {#if team.name.length > 12}
                            <div class="hidden group-hover:block absolute z-10 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap">
                              {team.name}
                            </div>
                          {/if}
                        </div>
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
      </div>
    </div>

    <!-- Dependency Parameters Section -->
    <div id="dependency-params-section" class="border-t pt-8">
      <h3 class="text-base font-semibold text-gray-900 mb-6">Dependency Parameters</h3>
      <div class="space-y-6">
        <!-- Dependency Level -->
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
            />
            <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
              <span class="text-sm font-medium text-gray-900">{companyDependencyLevel}</span>
            </div>
          </div>
        </div>

        <!-- Team Dependencies Matrix -->
        <div>
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
          <div id="dependency-matrix-table" class="overflow-x-auto border rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                    <th class="w-12 px-2 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  {#each dependencyMatrix.teams as team}
                      <th class="w-12 px-2 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div class="relative group w-12">
                          <div class="truncate w-12">{team}</div>
                          {#if team.length > 8}
                            <div class="hidden group-hover:block absolute z-10 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap left-1/2 -translate-x-1/2">
                              {team}
                            </div>
                          {/if}
                        </div>
                      </th>
                  {/each}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                {#each dependencyMatrix.teams as fromTeam, fromIndex}
                  <tr class="hover:bg-gray-50">
                      <th class="w-12 px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div class="relative group w-12">
                          <div class="truncate w-12">{fromTeam}</div>
                          {#if fromTeam.length > 8}
                            <div class="hidden group-hover:block absolute z-10 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap left-1/2 -translate-x-1/2">
                      {fromTeam}
                            </div>
                          {/if}
                        </div>
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
    </div>

    <!-- Meeting Parameters Section -->
    <div id="meeting-params-section" class="border-t pt-8">
      <h3 class="text-base font-semibold text-gray-900 mb-6">Meeting Parameters</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Monthly Meeting Hours -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Monthly Meeting Hours
            <button 
              class="tooltip ml-1"
              data-tippy-content="Set the average number of hours spent in meetings per month (4-80 hours). Includes team syncs, planning, and coordination meetings.">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={costParams.meetings.monthlyDuration}
              min="4"
              max="80"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
            />
            <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
              <span class="text-sm font-medium text-gray-900">{costParams.meetings.monthlyDuration}</span>
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
            />
            <div class="w-16 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
              <span class="text-sm font-medium text-gray-900">{costParams.overhead.communicationOverhead}x</span>
            </div>
          </div>
        </div>

        <!-- Baseline Communication Hours -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Baseline Communication Hours
            <button 
              class="tooltip ml-1"
              data-tippy-content="Set the baseline communication hours per week (1-20 hours). This represents the minimum time spent on asynchronous communication and coordination.">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={costParams.overhead.baselineCommunicationHours}
              min="1"
              max="10"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
            />
            <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
              <span class="text-sm font-medium text-gray-900">{costParams.overhead.baselineCommunicationHours}</span>
            </div>
          </div>
        </div>

        <!-- Dependency Hours Rate -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Dependency Hours Rate
            <button 
              class="tooltip ml-1"
              data-tippy-content="Set the hours rate per dependency level (1-10 hours). This represents the additional time spent on coordination and communication due to dependencies.">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={costParams.overhead.dependencyHoursRate}
              min="1"
              max="10"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
            />
            <div class="w-12 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
              <span class="text-sm font-medium text-gray-900">{costParams.overhead.dependencyHoursRate}</span>
            </div>
          </div>
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

    <!-- Team Dependencies Visualization -->
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

      <div id="visualization-container" class="relative w-full h-[660px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
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

        <svg width="100%" height="100%" viewBox="-100 -100 1200 880" preserveAspectRatio="xMidYMid meet">
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
            {@const horizontalScale = 1.4}
            {@const radiusX = Math.min(450, Math.max(350, 1000 / (nodes.length)))}
            {@const radiusY = Math.min(350, Math.max(300, 800 / (nodes.length)))}
          {@const x1 = 500 + radiusX * Math.cos(sourceAngle) * horizontalScale}
            {@const y1 = 400 + radiusY * Math.sin(sourceAngle)}
          {@const x2 = 500 + radiusX * Math.cos(targetAngle) * horizontalScale}
            {@const y2 = 400 + radiusY * Math.sin(targetAngle)}
          
          {#if visualizationMode === 'weighted'}
            <!-- Single weighted line -->
            {@const midX = (x1 + x2) / 2}
            {@const midY = (y1 + y2) / 2}
            {@const dx = x2 - x1}
            {@const dy = y2 - y1}
              {@const normalX = -dy / Math.sqrt(dx * dx + dy * dy) * 40}
              {@const normalY = dx / Math.sqrt(dx * dx + dy * dy) * 40}
              {@const nodeRadius = 75}
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
                {@const offset = (lineIndex - (edge.data.strength - 1) / 2) * 30}
              {@const midX = (x1 + x2) / 2}
              {@const midY = (y1 + y2) / 2}
              {@const dx = x2 - x1}
              {@const dy = y2 - y1}
                {@const normalX = -dy / Math.sqrt(dx * dx + dy * dy) * (80 + offset)}
                {@const normalY = dx / Math.sqrt(dx * dx + dy * dy) * (80 + offset)}
                {@const nodeRadius = 75}
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
            {@const horizontalScale = 1.4}
            {@const radiusX = Math.min(450, Math.max(350, 1000 / (nodes.length)))}
            {@const radiusY = Math.min(350, Math.max(300, 800 / (nodes.length)))}
          {@const x = 500 + radiusX * Math.cos(angle) * horizontalScale}
            {@const y = 400 + radiusY * Math.sin(angle)}
          
          <!-- Team Node -->
          <g transform="translate({x}, {y})">
            <!-- Enhanced node shadow -->
            <rect
                x="-70"
                y="-56"
                width="140"
                height="112"
                rx="8"
              fill="#ffffff"
              filter="url(#shadow)"
            />
            <!-- Node background with gradient -->
            <rect
                x="-70"
                y="-56"
                width="140"
                height="112"
                rx="8"
              fill="url(#bodyGradient)"
              stroke="#e2e8f0"
              stroke-width="2"
            />
            <!-- Node header with gradient -->
            <rect
                x="-70"
                y="-56"
                width="140"
                height="35"
                rx="8"
              fill="url(#headerGradient)"
              stroke="#e2e8f0"
              stroke-width="2"
            />
            <!-- Team name with better styling -->
            <text 
              text-anchor="middle"
                y="-32"
                class="text-sm font-semibold fill-gray-700"
              >
                <tspan>{node.data.label.length > 12 ? node.data.label.slice(0, 12) + '...' : node.data.label}</tspan>
              </text>
              {#if node.data.label.length > 12}
                <title>{node.data.label}</title>
              {/if}
            <!-- Metrics with improved layout -->
            <g class="text-xs fill-gray-700">
              <!-- Team Size and Efficiency -->
                <g transform="translate(-60, -10)">
                <text 
                  text-anchor="start"
                  class="font-medium"
                >Size</text>
                <text 
                  text-anchor="start"
                    y="18"
                    class="text-sm font-semibold fill-gray-900"
                >{node.data.size}</text>
              </g>
                <g transform="translate(60, -10)">
                <text 
                  text-anchor="end"
                  class="font-medium"
                >⚡ Eff</text>
                <text 
                  text-anchor="end"
                    y="18"
                    class="text-sm font-semibold fill-gray-900"
                >{node.data.efficiency.toFixed(1)}x</text>
              </g>
              <!-- Throughput and Lead Time -->
                <g transform="translate(-60, 32)">
                <text 
                  text-anchor="start"
                  class="font-medium"
                >📈 Items/d</text>
                <text 
                  text-anchor="start"
                    y="18"
                    class="text-sm font-semibold fill-gray-900"
                >{node.data.throughput.toFixed(1)}</text>
              </g>
                <g transform="translate(60, 32)">
                <text 
                  text-anchor="end"
                  class="font-medium"
                >⏱️ Days</text>
                <text 
                  text-anchor="end"
                    y="18"
                    class="text-sm font-semibold fill-gray-900"
                >{node.data.leadTime.toFixed(1)}</text>
              </g>
            </g>
          </g>
        {/each}
      </svg>
    </div>
  </div>

    <!-- Cost Analysis of Current Dependencies -->
  <div class="cost-analysis-section bg-white p-6 rounded-lg shadow border border-gray-200">
      {#if nodes.length > 0}
        {@const costs = calculateCosts()}
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 class="text-lg font-semibold text-gray-900">Cost Analysis of Current Team Dependencies</h3>
          <div class="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-2 px-4 py-2 bg-secondary/5 rounded-lg border border-secondary/20">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600 whitespace-nowrap">Total Monthly Cost:</span>
              <span class="text-xl font-bold text-secondary whitespace-nowrap">${costs.totalCost.toFixed(2)}</span>
            </div>
            <span class="text-xs text-gray-500 whitespace-normal sm:whitespace-nowrap">(${(costs.totalCost / (teamCount * teamParams.teams[0].size)).toFixed(2)} per team member)</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Cost Distribution Chart -->
          <div class="bg-white p-6 rounded-lg border border-gray-200">
            <h4 class="text-sm font-medium text-gray-700 mb-4">Cost Distribution</h4>
            <div class="relative h-[400px] w-full">
              <canvas
                bind:this={costChartCanvas}
                class="w-full h-full"
              ></canvas>
            </div>
          </div>

          <!-- Cost Impact Analysis -->
          <div class="space-y-6">
            <!-- Monthly Cost Summary -->
            {#if costs}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="bg-gradient-to-br from-sky-50 to-white p-4 rounded-lg border border-sky-200">
                <div class="text-sm font-medium text-gray-600">Monthly Meetings</div>
                <div class="text-xl font-bold text-sky-500 mt-1">
                  ${costs.monthlyMeetingCost.toFixed(2)}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  Based on {costParams.meetings.monthlyDuration}hr × {costParams.meetings.attendeesPerTeam} attendees × ${costParams.hourlyRate.developer}/hr
                </div>
              </div>

              <div class="bg-gradient-to-br from-amber-50 to-white p-4 rounded-lg border border-amber-200">
                <div class="text-sm font-medium text-gray-600">Communication</div>
                <div class="text-xl font-bold text-amber-500 mt-1">
                  ${costs.communicationCost.toFixed(2)}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  Includes async communication and coordination costs
                </div>
              </div>
            </div>

            <!-- Cost Insights -->
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 class="text-sm font-medium text-gray-900 mb-3">Cost Distribution Insights</h5>
              <div class="space-y-4">
                <!-- Meeting Costs Insight -->
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                    <svg class="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h6 class="text-sm font-medium text-gray-900">Synchronous Coordination</h6>
                    <p class="text-sm text-gray-600 mt-1">
                      {#if (costs.monthlyMeetingCost / costs.totalCost) > 0.6}
                        High meeting costs indicate significant time spent in synchronous coordination. Consider reducing meeting frequency or attendee count.
                      {:else if (costs.monthlyMeetingCost / costs.totalCost) > 0.4}
                        Moderate meeting overhead. Review meeting structures for potential optimization.
                      {:else}
                        Efficient meeting structure with balanced synchronous coordination.
                      {/if}
                    </p>
                  </div>
                </div>

                <!-- Communication Costs Insight -->
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h6 class="text-sm font-medium text-gray-900">Asynchronous Communication</h6>
                    <p class="text-sm text-gray-600 mt-1">
                      {#if (costs.communicationCost / costs.totalCost) > 0.6}
                        High communication overhead suggests complex dependencies. Consider streamlining team interfaces and documentation.
                      {:else if (costs.communicationCost / costs.totalCost) > 0.4}
                        Moderate communication costs. Look for opportunities to improve async communication channels.
                      {:else}
                        Well-managed async communication with effective coordination patterns.
                      {/if}
                    </p>
                  </div>
                </div>

                <!-- Overall Efficiency -->
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h6 class="text-sm font-medium text-gray-900">Cost Efficiency</h6>
                    <p class="text-sm text-gray-600 mt-1">
                      {#if costs.totalCost > (teamCount * teamParams.teams[0].size * costParams.hourlyRate.developer * 40)}
                        Total coordination costs are high relative to team size. Consider reviewing team structure and dependency patterns.
                      {:else if costs.totalCost > (teamCount * teamParams.teams[0].size * costParams.hourlyRate.developer * 20)}
                        Moderate overall costs. Monitor trends and optimize where possible.
                      {:else}
                        Cost-efficient team structure with well-managed coordination overhead.
                      {/if}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Impact Analysis Comparison -->
    <div class="impact-analysis-section bg-white p-6 rounded-lg shadow border border-gray-200">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Impact Analysis</h3>
        <p class="text-gray-600">Analyze potential cost savings and efficiency gains by optimizing your team dependencies through different organizational models.</p>
      </div>
    
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
      <div class="mb-6 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
        <h4 class="text-sm font-medium text-gray-700 mb-4">Dependency Level Adjustment</h4>
        <div class="space-y-6">
          <!-- Adjustment Controls -->
          <div class="flex flex-col items-center gap-4">
            <div class="flex flex-wrap justify-center items-center gap-2 sm:gap-6">
              <button 
                class="h-10 sm:h-12 w-10 sm:w-12 flex items-center justify-center rounded-xl transition-all font-medium text-base {
                  dependencyAdjustment === -2 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-500'
                }"
                on:click={() => dependencyAdjustment = -2}
              >-2</button>
              <button 
                class="h-10 sm:h-12 w-10 sm:w-12 flex items-center justify-center rounded-xl transition-all font-medium text-base {
                  dependencyAdjustment === -1 
                    ? 'bg-green-400 text-white shadow-lg shadow-green-400/20' 
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-400 hover:text-green-400'
                }"
                on:click={() => dependencyAdjustment = -1}
              >-1</button>
              <button 
                class="h-12 sm:h-14 w-16 sm:w-20 flex items-center justify-center rounded-xl transition-all font-medium text-xl {
                  dependencyAdjustment === 0 
                    ? 'bg-gray-100 text-gray-900 shadow-lg shadow-gray-500/10' 
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-400'
                }"
                on:click={() => dependencyAdjustment = 0}
              >0</button>
              <button 
                class="h-10 sm:h-12 w-10 sm:w-12 flex items-center justify-center rounded-xl transition-all font-medium text-base {
                  dependencyAdjustment === 1 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-amber-500 hover:text-amber-500'
                }"
                on:click={() => dependencyAdjustment = 1}
              >+1</button>
              <button 
                class="h-10 sm:h-12 w-10 sm:w-12 flex items-center justify-center rounded-xl transition-all font-medium text-base {
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
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
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
                    <th class="w-12 px-2 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div class="relative group w-12">
                        <div class="truncate w-12">{team}</div>
                        {#if team.length > 8}
                          <div class="hidden group-hover:block absolute z-10 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap left-1/2 -translate-x-1/2">
                            {team}
                          </div>
                        {/if}
                      </div>
                    </th>
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
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm font-medium text-secondary">Current Dependency Costs</div>
              </div>
            <div class="space-y-3">
              <div>
                  <div class="flex justify-between text-sm items-center">
                  <span class="text-gray-600">Monthly Cost</span>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">${currentCosts.totalCost.toFixed(0)}</span>
                    </div>
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
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm font-medium text-gray-600">Future Dependency Costs</div>
                {#if costDifference > 0}
                  <span class="text-sm font-medium text-green-600">(-${costDifference.toFixed(0)})</span>
                {:else if costDifference < 0}
                  <span class="text-sm font-medium text-red-600">(+${(-costDifference).toFixed(0)})</span>
                {/if}
            </div>
            <div class="space-y-3">
              <div>
                  <div class="flex justify-between text-sm items-center">
                  <span class="text-gray-600">Monthly Cost</span>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">${comparisonMetrics.costs.totalCost.toFixed(0)}</span>
                    </div>
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
              Team dependencies are adding <span class="font-medium text-secondary">${costDifference.toFixed(2)}</span> in monthly costs 
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
</div>

<!-- Add this at the very end of the file, right before the closing style tag -->
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
          <p class="text-gray-600">Optimize your team structure and collaboration patterns with our team dependency expert.</p>
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
                <span>Team structure optimization</span>
              </li>
              <li class="flex items-center text-gray-700 gap-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span>Collaboration workflow design</span>
              </li>
              <li class="flex items-center text-gray-700 gap-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span>Knowledge sharing strategy</span>
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
        <p class="text-gray-600 mb-4">Get instant AI insights about your team dependencies and collaboration patterns.</p>
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
          <div class="flex flex-col gap-3">
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
            <button
              on:click={handleExportExcel}
              class="w-full px-4 py-3 text-base font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow hover:shadow-lg transition-all duration-200"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export to Excel
      </div>
            </button>
            <button
              on:click={handleExportPNG}
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

<TeamDependencyModal
  bind:show={showLLMTemplate}
  template={$teamDependencyTemplateStore.generateTemplate(
    distributionMode,
    teamCount,
    companyDependencyLevel,
    teamParams.teams,
    nodes,
    edges,
    dependencyMatrix,
    metrics,
    costParams
  )}
/>

<TeamDependencyShareModal
  bind:show={showShareModal}
  {distributionMode}
  {teamCount}
  {companyDependencyLevel}
  teams={teamParams.teams}
  {dependencyMatrix}
  {costParams}
/>

<TeamDependencyLoadingModal
  bind:show={showLoadingModal}
  distributionMode={sharedConfig?.distributionMode || 'even'}
  teamCount={sharedConfig?.teamCount || teamCount}
  companyDependencyLevel={sharedConfig?.companyDependencyLevel || companyDependencyLevel}
  teams={sharedConfig?.teams || teamParams.teams}
  dependencyMatrix={sharedConfig?.dependencyMatrix || dependencyMatrix}
  costParams={sharedConfig?.costParams || costParams}
  onConfirm={handleLoadConfig}
  onCancel={() => showLoadingModal = false}
/>

<ExpertModal bind:show={showExpertModal} />
</div>

<style>
  /* ... existing styles ... */
</style> 