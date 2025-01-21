<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, type Plugin } from 'chart.js/auto';
  import ChartDataLabels from 'chartjs-plugin-datalabels';
  import tippy from 'tippy.js';
  import 'tippy.js/dist/tippy.css';
  import 'tippy.js/themes/light-border.css';
  import TeamDependencyModal from '$lib/components/ui/TeamDependencyModal.svelte';
  import TeamDependencyShareModal from '$lib/components/ui/TeamDependencyShareModal.svelte';
  import TeamDependencyLoadingModal from '$lib/components/ui/TeamDependencyLoadingModal.svelte';
  import ExpertModal from '$lib/components/ui/ExpertModal.svelte';
  import { teamDependencyTemplateStore } from '$lib/stores/teamDependencyTemplateStore';
  import { base } from '$app/paths';
  import { validateShareParams, parseShareLink } from '$lib/utils/teamDependencyShare';
  import type { TeamDependencyParams } from '$lib/utils/teamDependencyShare';
  import { exportTeamDependencyToExcel, exportTeamDependencyToPNG } from '$lib/utils/teamDependencyExport';
  import { initTutorial } from '$lib/utils/tutorial';
  import type { Tour } from 'shepherd.js';
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import type { TeamInputs } from '$lib/types/calculator';
  import MatrixDesign from './MatrixDesign.svelte';
  import CostAnalysisVisualization from './CostAnalysisVisualization.svelte';
  import ImpactAnalysis from './ImpactAnalysis.svelte';
  import ExpertConsultationCard from '$lib/components/ui/ExpertConsultationCard.svelte';

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
      monthlyMeetingCost: costParams.meetings.duration * 
        getMonthlyMeetingMultiplier(costParams.meetings.recurrence) *
        costParams.meetings.attendeesPerTeam * 
        costParams.hourlyRate.developer * 
        matrix.reduce((sum, row) => sum + row.filter(v => v > 0).length, 0),
      communicationCost: matrix.reduce((sum, row) => 
        sum + row.reduce((s, v) => s + (v > 0 ? v * costParams.hourlyRate.developer * 4 : 0), 0), 0),
      get totalCost() {
        return this.monthlyMeetingCost + this.communicationCost;
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

    // Calculate service efficiency
    const serviceEfficiency = Math.max(50, 85 - (avgDependencyStrength * 7));

    return {
      costs,
      flowEfficiency,
      leadTime,
      utilizationRate: 90 - (avgDependencyStrength * 5),
      serviceEfficiency
    };
  }

  interface Team {
    name: string;
    size: number;
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

  interface TeamParams {
    teams: Team[];
    baseLeadTime: number;
    dependencyImpact: number;
  }

  let teamParams: TeamParams = {
    teams: Array(10).fill(null).map((_, i) => ({
      name: `Team ${i + 1}`,
      size: 5,
      efficiency: 1.0
    })),
    baseLeadTime: 3,
    dependencyImpact: 0.15
  };

  // Distribution mode state
  type DistributionMode = 'even' | 'hub-spoke' | 'sequential' | 'mesh' | 'hierarchical' | 'clustered';
  let distributionMode: DistributionMode = 'even';
  let clusterCount = 2; // For clustered mode

  let nodes: any[] = [];
  let edges: any[] = [];
  let teamCount = 5;
  let companyDependencyLevel = 3; // Scale of 1-5 for overall company dependency level
  let dependencyMatrix = initializeDependencyMatrix(teamCount);

  // Add these near the top with other state variables
  let hierarchyLevels = 3;
  let childrenPerNode = 2;

  function initializeDependencyMatrix(size: number): DependencyMatrix {
    // Create teams array using current team names if available
    const teams = teamParams.teams.slice(0, size).map(team => team.name);
    
    // Initialize dependencies array with zeros
    const dependencies = Array.from({ length: size }, () => Array(size).fill(0));
    
    switch (distributionMode) {
      case 'clustered':
        // Calculate balanced cluster sizes
        const teamsPerCluster = Math.floor(size / clusterCount); // Base size
        const remainingTeams = size % clusterCount; // Extra teams to distribute
        
        // Create array of cluster sizes
        const clusterSizes = Array(clusterCount).fill(teamsPerCluster);
        // Distribute remaining teams one by one to the first 'remainingTeams' clusters
        for (let i = 0; i < remainingTeams; i++) {
          clusterSizes[i]++;
        }
        
        // Calculate cluster start indices
        const clusterStartIndices = clusterSizes.reduce((acc, size, i) => {
          acc[i] = i === 0 ? 0 : acc[i - 1] + clusterSizes[i - 1];
          return acc;
        }, Array(clusterCount).fill(0));
        
        // For each team
        for (let i = 0; i < size; i++) {
          // Find which cluster this team belongs to
          let currentCluster = 0;
          while (currentCluster < clusterCount && i >= clusterStartIndices[currentCluster] + clusterSizes[currentCluster]) {
            currentCluster++;
          }
          
          const clusterStart = clusterStartIndices[currentCluster];
          const clusterEnd = clusterStart + clusterSizes[currentCluster];
          
          // Connect teams within the same cluster
          for (let j = clusterStart; j < clusterEnd; j++) {
            if (i !== j) {
              dependencies[i][j] = Math.max(1, Math.min(5, companyDependencyLevel));
              dependencies[j][i] = Math.max(1, Math.min(5, companyDependencyLevel));
            }
          }
          
          // Connect to cluster representative (first team in cluster)
          if (i !== clusterStart && i < clusterEnd) {
            dependencies[i][clusterStart] = Math.max(1, Math.min(5, companyDependencyLevel));
            dependencies[clusterStart][i] = Math.max(1, Math.min(5, companyDependencyLevel));
          }
        }
        break;
        
      case 'even':
        // For even distribution, create circular dependencies
        for (let i = 0; i < size; i++) {
          const nextIndex = (i + 1) % size;
          dependencies[i][nextIndex] = Math.max(1, Math.min(5, companyDependencyLevel));
          dependencies[nextIndex][i] = Math.max(1, Math.min(5, companyDependencyLevel));
        }
        break;
        
      case 'hub-spoke':
        // First team (hub) has dependencies with all other teams
        for (let i = 1; i < size; i++) {
          dependencies[0][i] = Math.max(1, Math.min(5, companyDependencyLevel));
          dependencies[i][0] = Math.max(1, Math.min(5, companyDependencyLevel));
        }
        break;
        
      case 'sequential':
        // Teams depend on the next team in sequence
        for (let i = 0; i < size - 1; i++) {
          dependencies[i][i + 1] = Math.max(1, Math.min(5, companyDependencyLevel));
        }
        break;
        
      case 'mesh':
        // Every team depends on every other team
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            if (i !== j) {
              dependencies[i][j] = Math.max(1, Math.min(5, companyDependencyLevel));
            }
          }
        }
        break;
        
      case 'hierarchical':
        // Calculate parent-child relationships
        for (let i = 0; i < size; i++) {
          // For each node, calculate its children indices
          const childStartIndex = i * childrenPerNode + 1;
          for (let j = 0; j < childrenPerNode; j++) {
            const childIndex = childStartIndex + j;
            if (childIndex < size) {
              // Create bidirectional dependency
              dependencies[i][childIndex] = Math.max(1, Math.min(5, companyDependencyLevel));
              dependencies[childIndex][i] = Math.max(1, Math.min(5, companyDependencyLevel));
            }
          }
        }
        break;
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
      duration: 2, // hours per meeting
      recurrence: 'weekly', // 'twice-weekly' | 'weekly' | 'biweekly' | 'monthly'
      attendeesPerTeam: 5,
      communicationOverhead: 1.2, // multiplier for meeting time
      additionalHours: 0 // Changed from 4 to 0 (default additional communication hours)
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
  let costChartCanvas: HTMLCanvasElement;
  let costDistributionChart: Chart | null = null;

  // Update the CostAnalysis interface
  interface CostAnalysis {
    monthlyMeetingCost: number;
    communicationCost: number;
    totalCost: number;
  }

  function createCostDistributionChart(costs: CostAnalysis) {
  if (!costChartCanvas) return;
  
  if (costDistributionChart) {
    costDistributionChart.destroy();
  }

  const data = [
    costs.directMeetingCost,
    costs.communicationOverhead,
    costs.opportunityCost,
    costs.flowEfficiencyCost
  ];

  const total = costs.totalCost;
  const percentages = data.map(value => ((value / total) * 100).toFixed(0));

  costDistributionChart = new Chart(costChartCanvas, {
    type: 'doughnut',
    data: {
      labels: [
        'Direct Meeting Costs',
        'Communication Overhead',
        'Opportunity Cost',
        'Flow Efficiency Impact'
      ],
      datasets: [{
        data,
        backgroundColor: [
          'rgb(14, 165, 233)',  // sky-500 - matches sky gradient
          'rgb(245, 158, 11)',  // amber-500 - matches amber gradient
          'rgb(16, 185, 129)',  // emerald-500 - matches emerald gradient
          'rgb(244, 63, 94)'    // rose-500 - matches rose gradient
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
              return `$${value.toLocaleString('en-US', {
                maximumFractionDigits: 0
              })} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

  // Add onMount initialization
  onMount(() => {
    if (sharedConfig) {
      showLoadingModal = true;
    }
    
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

    // Initialize tutorial
    tour = initTutorial();
  });

  // Update reactive statement for cost chart
  $: {
    if (costChartCanvas) {
      const costs = calculateCosts();
      createCostDistributionChart(costs);
    }
  }

  // Replace with more comprehensive reactive statement
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
    teamParams.teams;
    dependencyMatrix;
    
    if (costChartCanvas) {
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
    
    // Calculate throughput based on team size and efficiency only
    const team = teams[teamIndex];
    const baseCapacity = team.size * 8;
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
    } else if (distributionMode === 'hub-spoke') {
      generateHubAndSpokeEdges();
    } else {
      // For all other patterns, generate edges directly from dependency matrix
      applyMatrix();
    }

    metrics = updateMetrics();
  }

  function generateEvenEdges(mode: DistributionMode = 'even') {
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

  function generateHubAndSpokeEdges(mode: DistributionMode = 'hub-spoke') {
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
    
    // Calculate direct meeting costs
    const directMeetingCost = 
      costParams.meetings.duration * 
      getMonthlyMeetingMultiplier(costParams.meetings.recurrence) *
      costParams.meetings.attendeesPerTeam * 
      costParams.hourlyRate.developer * 
      totalConnections;

    // Calculate communication overhead
    const communicationOverhead =
      totalConnections * 
      costParams.meetings.communicationOverhead *
      costParams.hourlyRate.developer * 
      costParams.overhead.baselineCommunicationHours;

    // Calculate opportunity cost from context switching
    const contextSwitchingHours = edges.reduce((sum, edge) => 
      sum + (edge.data.strength * 2), 0); // 2 hours per dependency strength level
    const opportunityCost = 
      contextSwitchingHours * 
      costParams.hourlyRate.developer * 
      costParams.meetings.attendeesPerTeam;

    // Calculate flow efficiency impact cost
    const avgDependencyStrength = edges.reduce((sum, edge) => 
      sum + edge.data.strength, 0) / (edges.length || 1);
    const waitTimeHours = totalConnections * avgDependencyStrength * 4; // 4 hours of wait time per dependency strength
    const flowEfficiencyCost = 
      waitTimeHours * 
      costParams.hourlyRate.developer * 
      costParams.overhead.waitTimeMultiplier;

    return {
      directMeetingCost,
      communicationOverhead,
      opportunityCost,
      flowEfficiencyCost,
      totalCost: directMeetingCost + communicationOverhead + opportunityCost + flowEfficiencyCost
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

    // Initialize tutorial
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
    teamParams.teams;
    dependencyMatrix;
    
    if (costChartCanvas) {
      const costs = calculateCosts();
      createCostDistributionChart(costs);
    }
  }

  // Add function to calculate metrics for independent teams
  function calculateIndependentTeamMetrics() {
    const independentCosts = {
      monthlyMeetingCost: costParams.meetings.duration * 
        getMonthlyMeetingMultiplier(costParams.meetings.recurrence) *
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
      utilizationRate: 90,
      serviceEfficiency: 95
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
            efficiency: sharedConfig.teams[i].efficiency || 1.0
          };
        } else {
          return {
            name: `Team ${i + 1}`,
            size: 5,
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
        developer: sharedConfig.costParams.hourlyRate.developer,
        manager: sharedConfig.costParams.hourlyRate.manager,
        teamLead: sharedConfig.costParams.hourlyRate.teamLead
      },
      meetings: {
        ...costParams.meetings,
        duration: sharedConfig.costParams.meetings.duration,
        recurrence: sharedConfig.costParams.meetings.recurrence,
        attendeesPerTeam: sharedConfig.costParams.meetings.attendeesPerTeam,
        communicationOverhead: sharedConfig.costParams.meetings.communicationOverhead,
        additionalHours: sharedConfig.costParams.meetings.additionalHours
      },
      overhead: {
        ...costParams.overhead,
        communicationOverhead: sharedConfig.costParams.overhead.communicationOverhead,
        waitTimeMultiplier: sharedConfig.costParams.overhead.waitTimeMultiplier,
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

  // Add new function to calculate meeting frequency multiplier
  function getMonthlyMeetingMultiplier(recurrence: string): number {
    switch (recurrence) {
      case 'twice-weekly': return 8;
      case 'weekly': return 4;
      case 'biweekly': return 2;
      case 'monthly': return 1;
      default: return 4;
    }
  }

  // Add new interface for team communication metrics
  interface TeamCommunicationMetrics {
    meetingHours: number;
    overheadHours: number;
    additionalHours: number;
    totalHours: number;
  }

  // Add new function to calculate team communication metrics
  function calculateTeamCommunicationMetrics(): TeamCommunicationMetrics[] {
    return teamParams.teams.slice(0, teamCount).map((team, index) => {
      const connectedTeams = dependencyMatrix.dependencies[index]
        .filter((dep, i) => i !== index && dep > 0).length;
      
      const baseMonthlyMeetings = getMonthlyMeetingMultiplier(costParams.meetings.recurrence);
      const meetingHours = Math.round(baseMonthlyMeetings * costParams.meetings.duration * connectedTeams * costParams.meetings.attendeesPerTeam);
      const overheadHours = Math.round(meetingHours * (costParams.meetings.communicationOverhead - 1));
      const additionalHours = Math.round(costParams.meetings.additionalHours * connectedTeams);
      
      return {
        meetingHours,
        overheadHours,
        additionalHours,
        totalHours: meetingHours + overheadHours + additionalHours
      };
    });
  }

  let teamCommunicationMetrics: TeamCommunicationMetrics[] = [];

  // Add new function to apply meeting parameters
  function applyMeetingParameters() {
    teamCommunicationMetrics = calculateTeamCommunicationMetrics();
  }

  // Remove or comment out the reactive statement that automatically updates teamCommunicationMetrics
  // $: {
  //   if (nodes.length > 0) {
  //     teamCommunicationMetrics = calculateTeamCommunicationMetrics();
  //   }
  // }

  // Update reactive statement to recalculate metrics
  $: {
    if (nodes.length > 0) {
      // Watch all meeting parameters
      costParams.meetings.attendeesPerTeam;
      costParams.meetings.duration;
      costParams.meetings.recurrence;
      costParams.meetings.communicationOverhead;
      costParams.meetings.additionalHours;
      
      // Recalculate team communication metrics
      teamCommunicationMetrics = calculateTeamCommunicationMetrics();
    }
  }

  // ... existing code ...
  $: {
    if (sharedConfig) {
      showLoadingModal = true;
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
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Even Distribution -->
        <button
          class="relative p-4 border-2 rounded-lg transition-all {
            distributionMode === 'even'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
          on:click={() => {
            distributionMode = 'even';
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
            <circle cx="100" cy="50" r="8" class="fill-secondary"/>
            {#each Array(5) as _, i}
              {@const angle = (i * Math.PI * 2) / 5}
              {@const x = 100 + Math.cos(angle) * 40}
              {@const y = 50 + Math.sin(angle) * 40}
              <circle cx={x} cy={y} r="5" class="fill-secondary/60"/>
              <line x1="100" y1="50" x2={x} y2={y} class="stroke-secondary" stroke-width="1.5" stroke-opacity="0.5"/>
            {/each}
          </svg>
        </button>

        <!-- Sequential -->
        <button
          class="relative p-4 border-2 rounded-lg transition-all {
            distributionMode === 'sequential'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
          on:click={() => {
            distributionMode = 'sequential';
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
              distributionMode === 'sequential'
                ? 'border-secondary bg-secondary'
                : 'border-gray-300'
            }">
              {#if distributionMode === 'sequential'}
                <svg class="w-4 h-4 text-white" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="4" fill="white"/>
                </svg>
              {/if}
            </div>
            <span class="font-medium text-gray-900">Sequential</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">Teams work in a linear sequence</p>
          <svg class="w-full h-32" viewBox="0 0 200 100">
            {#each Array(5) as _, i}
              {@const x = 40 + i * 30}
              <circle cx={x} cy="50" r="5" class="fill-secondary"/>
              {#if i < 4}
                <line x1={x + 5} y1="50" x2={x + 25} y2="50" class="stroke-secondary" stroke-width="1.5" marker-end="url(#arrowhead)"/>
              {/if}
            {/each}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" class="text-secondary"/>
              </marker>
            </defs>
          </svg>
        </button>

        <!-- Mesh -->
        <button
          class="relative p-4 border-2 rounded-lg transition-all {
            distributionMode === 'mesh'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
          on:click={() => {
            distributionMode = 'mesh';
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
              distributionMode === 'mesh'
                ? 'border-secondary bg-secondary'
                : 'border-gray-300'
            }">
              {#if distributionMode === 'mesh'}
                <svg class="w-4 h-4 text-white" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="4" fill="white"/>
                </svg>
              {/if}
            </div>
            <span class="font-medium text-gray-900">Mesh</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">All teams connected to each other</p>
          <svg class="w-full h-32" viewBox="0 0 200 100">
            {#each Array(5) as _, i}
              {@const angle = (i * Math.PI * 2) / 5}
              {@const x = 100 + Math.cos(angle) * 40}
              {@const y = 50 + Math.sin(angle) * 40}
              <circle cx={x} cy={y} r="5" class="fill-secondary"/>
              {#each Array(5) as _, j}
                {@const angle2 = (j * Math.PI * 2) / 5}
                {@const x2 = 100 + Math.cos(angle2) * 40}
                {@const y2 = 50 + Math.sin(angle2) * 40}
                {#if i < j}
                  <line x1={x} y1={y} x2={x2} y2={y2} class="stroke-secondary" stroke-width="0.5" stroke-opacity="0.3"/>
                {/if}
              {/each}
            {/each}
          </svg>
        </button>

        <!-- Hierarchical -->
        <div
          class="relative p-4 border-2 rounded-lg transition-all {
            distributionMode === 'hierarchical'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
        >
          <div 
            class="w-full h-full absolute inset-0 cursor-pointer"
            on:click={() => {
              distributionMode = 'hierarchical';
              const currentTeams = [...dependencyMatrix.teams];
              const currentTeamParams = [...teamParams.teams];
              dependencyMatrix = initializeDependencyMatrix(teamCount);
              dependencyMatrix.teams = currentTeams;
              teamParams.teams = currentTeamParams;
              generateNodes();
            }}
          />
          
          <div class="flex items-center gap-3 mb-2">
            <div class="w-4 h-4 rounded-full border-2 {
              distributionMode === 'hierarchical'
                ? 'border-secondary bg-secondary'
                : 'border-gray-300'
            }">
              {#if distributionMode === 'hierarchical'}
                <svg class="w-4 h-4 text-white" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="4" fill="white"/>
                </svg>
              {/if}
            </div>
            <span class="font-medium text-gray-900">Hierarchical</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">Teams organized in a tree structure</p>
          <div class="space-y-2">
            <svg class="w-full h-24" viewBox="0 0 200 100">
              <!-- Root -->
              <circle cx="100" cy="20" r="5" class="fill-secondary"/>
              <!-- Level 1 -->
              <circle cx="70" cy="50" r="5" class="fill-secondary"/>
              <circle cx="130" cy="50" r="5" class="fill-secondary"/>
              <!-- Level 2 -->
              <circle cx="55" cy="80" r="5" class="fill-secondary"/>
              <circle cx="85" cy="80" r="5" class="fill-secondary"/>
              <circle cx="115" cy="80" r="5" class="fill-secondary"/>
              <circle cx="145" cy="80" r="5" class="fill-secondary"/>
              <!-- Connections -->
              <line x1="100" y1="20" x2="70" y2="50" class="stroke-secondary" stroke-width="1"/>
              <line x1="100" y1="20" x2="130" y2="50" class="stroke-secondary" stroke-width="1"/>
              <line x1="70" y1="50" x2="55" y2="80" class="stroke-secondary" stroke-width="1"/>
              <line x1="70" y1="50" x2="85" y2="80" class="stroke-secondary" stroke-width="1"/>
              <line x1="130" y1="50" x2="115" y2="80" class="stroke-secondary" stroke-width="1"/>
              <line x1="130" y1="50" x2="145" y2="80" class="stroke-secondary" stroke-width="1"/>
            </svg>
            <div class="flex items-center justify-center gap-4 relative z-10">
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  on:click|stopPropagation={() => {
                    if (hierarchyLevels > 2) {
                      hierarchyLevels--;
                      dependencyMatrix = initializeDependencyMatrix(teamCount);
                      generateNodes();
                    }
                  }}
                >
                  -
                </button>
                <span class="text-sm text-gray-600">{hierarchyLevels} Levels</span>
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  on:click|stopPropagation={() => {
                    const maxLevels = Math.floor(Math.log(teamCount) / Math.log(childrenPerNode)) + 1;
                    if (hierarchyLevels < maxLevels) {
                      hierarchyLevels++;
                      dependencyMatrix = initializeDependencyMatrix(teamCount);
                      generateNodes();
                    }
                  }}
                >
                  +
                </button>
              </div>
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  on:click|stopPropagation={() => {
                    if (childrenPerNode > 2) {
                      childrenPerNode--;
                      dependencyMatrix = initializeDependencyMatrix(teamCount);
                      generateNodes();
                    }
                  }}
                >
                  -
                </button>
                <span class="text-sm text-gray-600">{childrenPerNode} Children</span>
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  on:click|stopPropagation={() => {
                    const maxChildren = Math.floor(Math.sqrt(teamCount));
                    if (childrenPerNode < maxChildren) {
                      childrenPerNode++;
                      dependencyMatrix = initializeDependencyMatrix(teamCount);
                      generateNodes();
                    }
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Clustered -->
        <div
          class="relative p-4 border-2 rounded-lg transition-all {
            distributionMode === 'clustered'
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 hover:border-gray-300'
          }"
        >
          <div 
            class="w-full h-full absolute inset-0 cursor-pointer"
          on:click={() => {
            distributionMode = 'clustered';
            const currentTeams = [...dependencyMatrix.teams];
            const currentTeamParams = [...teamParams.teams];
            dependencyMatrix = initializeDependencyMatrix(teamCount);
            dependencyMatrix.teams = currentTeams;
            teamParams.teams = currentTeamParams;
            generateNodes();
          }}
          />
          
          <div class="flex items-center gap-3 mb-2">
            <div class="w-4 h-4 rounded-full border-2 {
              distributionMode === 'clustered'
                ? 'border-secondary bg-secondary'
                : 'border-gray-300'
            }">
              {#if distributionMode === 'clustered'}
                <svg class="w-4 h-4 text-white" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="4" fill="white"/>
                </svg>
              {/if}
            </div>
            <span class="font-medium text-gray-900">Clustered</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">Teams organized in clusters</p>
          <div class="space-y-2">
            <svg class="w-full h-24" viewBox="0 0 200 100">
              <!-- Cluster 1 -->
              <circle cx="60" cy="40" r="5" class="fill-secondary"/>
              <circle cx="80" cy="40" r="5" class="fill-secondary"/>
              <circle cx="70" cy="60" r="5" class="fill-secondary"/>
              <line x1="60" y1="40" x2="80" y2="40" class="stroke-secondary" stroke-width="1"/>
              <line x1="60" y1="40" x2="70" y2="60" class="stroke-secondary" stroke-width="1"/>
              <line x1="80" y1="40" x2="70" y2="60" class="stroke-secondary" stroke-width="1"/>
              
              <!-- Cluster 2 -->
              <circle cx="130" cy="40" r="5" class="fill-secondary"/>
              <circle cx="150" cy="40" r="5" class="fill-secondary"/>
              <circle cx="140" cy="60" r="5" class="fill-secondary"/>
              <line x1="130" y1="40" x2="150" y2="40" class="stroke-secondary" stroke-width="1"/>
              <line x1="130" y1="40" x2="140" y2="60" class="stroke-secondary" stroke-width="1"/>
              <line x1="150" y1="40" x2="140" y2="60" class="stroke-secondary" stroke-width="1"/>
              
              <!-- Inter-cluster connection -->
              <line x1="70" y1="50" x2="140" y2="50" class="stroke-secondary" stroke-width="1" stroke-dasharray="4 2"/>
            </svg>
            <div class="flex items-center justify-center gap-4 relative z-10">
              <button
                type="button"
                class="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                on:click|stopPropagation={() => {
                  if (clusterCount > 2) {
                    clusterCount--;
                    dependencyMatrix = initializeDependencyMatrix(teamCount);
                    generateNodes();
                  }
                }}
              >
                -
              </button>
              <span class="text-sm text-gray-600">{clusterCount} Clusters</span>
              <button
                type="button"
                class="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                on:click|stopPropagation={() => {
                  if (clusterCount < Math.floor(teamCount / 2)) {
                    clusterCount++;
                    dependencyMatrix = initializeDependencyMatrix(teamCount);
                    generateNodes();
                  }
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
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
                data-tippy-content="Number of teams to include in the analysis. Defines the scope of dependencies and collaboration costs.">
                <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </h4>
            <p class="text-xs text-gray-500 mb-2">Specify the total number of teams you want to map in your organization. This defines the scope of your dependency analysis.</p>
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
              Average Employee Cost ($/hr)
              <button 
                class="tooltip ml-1"
                data-tippy-content="Average hourly cost per team member, including salary, benefits, and overhead. Used to calculate financial impact.">
                <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </h4>
            <p class="text-xs text-gray-500 mb-2">Input the average hourly cost of team members, including pension, hardware, education, salary, other benefits and overhead. This value helps calculate the financial impact of dependencies.</p>
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
                  <th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Team Name
                    <span class="normal-case text-gray-400 ml-1">(click to edit)</span>
                  </th>
                  <th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Size</th>
                  <th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Efficiency</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each teamParams.teams.slice(0, teamCount) as team, i}
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">
                        <div class="relative group">
                      <input
                        type="text"
                        value={team.name}
                        class="w-40 bg-transparent border-b border-gray-200 hover:border-gray-400 focus:border-secondary focus:ring-0 text-sm truncate cursor-pointer"
                        on:change={(e) => updateTeamName(i, e.currentTarget.value)}
                        data-tippy-content={team.name}
                        placeholder="Enter team name"
                      />
                          {#if team.name.length > 12}
                            <div class="hidden group-hover:block absolute z-10 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap">
                              {team.name}
                            </div>
                          {/if}
                        </div>
                    </td>
                    <td class="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        class="w-24 text-center rounded-md border-gray-300 focus:border-secondary focus:ring-secondary text-sm"
                        value={team.size}
                        on:input={(e) => updateTeamParam(i, 'size', parseInt(e.currentTarget.value) || 1)}
                      />
                    </td>
                    <td class="px-4 py-3">
                      <input
                        type="number"
                        min="0.1"
                        max="2"
                        step="0.1"
                        class="w-24 text-center rounded-md border-gray-300 focus:border-secondary focus:ring-secondary text-sm"
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
              <span class="font-medium">Efficiency:</span>
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
              data-tippy-content="Strength of dependencies between teams. Higher values indicate tightly coupled teams; lower values suggest more independence. Use the grid to add very specific and detailed dependencies.">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <p class="text-xs text-gray-500 mb-2">Adjust the slider to set the overall strength of dependencies between teams. Use a higher value for tightly coupled teams and a lower value for more independent teams.</p>
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
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Meeting Duration -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Cross-team Meeting Duration (hours)
            <button class="tooltip ml-1" data-tippy-content="Average length of cross-team meetings. Impacts the total time spent in collaboration.">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <p class="text-xs text-gray-500 mb-2">Enter the average length of cross-team meetings. This helps assess how much time is spent in meetings across the organization.</p>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={costParams.meetings.duration}
              min="0.5"
              max="4"
              step="0.5"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
            />
            <div class="w-16 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
              <span class="text-sm font-medium text-gray-900">{costParams.meetings.duration}h</span>
            </div>
          </div>
        </div>

        <!-- Meeting Recurrence -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Meeting Frequency
            <button class="tooltip ml-1" data-tippy-content="How often cross-team meetings occur (e.g., twice per week, weekly, bi-weekly, monthly). Affects recurring collaboration costs. If it varies a lot, consider making an average outside this calculator, or constructing multiple distinct dependency cost calculations.">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <p class="text-xs text-gray-500 mb-2">Select how often cross-team meetings occur (e.g., weekly, monthly). This frequency impacts the total time and cost of collaboration.</p>
          <select
            bind:value={costParams.meetings.recurrence}
            class="w-full rounded-lg border-gray-300 focus:border-secondary focus:ring-secondary"
          >
            <option value="twice-weekly">Twice per Week</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every Two Weeks</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <!-- Attendees per Team -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Average Attendees per Team
            <button class="tooltip ml-1" data-tippy-content="Average number of participants from each team in cross-team meetings. Helps calculate total meeting costs.">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <p class="text-xs text-gray-500 mb-2">Specify the average number of attendees from each team participating in cross-team meetings. This influences the overall meeting cost calculation.</p>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={costParams.meetings.attendeesPerTeam}
              min="1"
              max="10"
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
            Meeting Communication Overhead
            <button class="tooltip ml-1" data-tippy-content="Additional time spent on preparation, follow-ups, and coordination. Measured as a multiplier of meeting time. If there's additional time spent outside or beyond the meetings and the multiplier, add that under 'additional hours' in the grid.">
              <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </h4>
          <p class="text-xs text-gray-500 mb-2">Adjust the slider to account for additional time spent preparing for or following up on meetings. This includes documentation, coordination, and communication tasks. If there's additional time spent outside or beyond the meetings and the multiplier, add that under "additional hours" in the grid.</p>
          <div class="flex items-center gap-2">
            <input
              type="range"
              bind:value={costParams.meetings.communicationOverhead}
              min="1"
              max="2"
              step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
            />
            <div class="w-16 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 text-center">
              <span class="text-sm font-medium text-gray-900">{costParams.meetings.communicationOverhead}x</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Add this between the meeting parameters and communication matrix -->
      <div class="flex justify-end mt-8 mb-4">
        <button
          type="button"
          class="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
          on:click={applyMeetingParameters}
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          Apply Parameters
        </button>
      </div>

      <!-- Communication Matrix -->
      <div class="mt-4">
        <h4 class="text-sm font-medium text-gray-700 mb-3">Team Communication Matrix</h4>
        <div class="overflow-x-auto border rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th class="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th class="px-3 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider relative group">
                  Meeting Person-Hours
                  <button class="tooltip ml-1 inline-flex" data-tippy-content="Combined meeting hours for everyone in the team, including all cross-team meetings">
                    <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </th>
                <th class="px-3 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider relative group">
                  Overhead Hours
                  <button class="tooltip ml-1 inline-flex" data-tippy-content="Combined time for meeting preparation, follow-ups, and documentation">
                    <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </th>
                <th class="px-3 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider relative group">
                  Additional Hours
                  <button class="tooltip ml-1 inline-flex" data-tippy-content="Time spent on other dependency-related activities like scrums of scrums, coordination meetings, and unplanned communication">
                    <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </th>
                <th class="px-3 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each teamParams.teams.slice(0, teamCount) as team, i}
                <tr class="hover:bg-gray-50">
                  <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{team.name}</td>
                  <td class="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                    <input
                      type="number"
                      class="w-20 text-right rounded-md border-gray-300 focus:border-secondary focus:ring-secondary text-xs"
                      value={teamCommunicationMetrics[i]?.meetingHours}
                      on:input={(e) => {
                        const value = Math.round(parseFloat(e.currentTarget.value));
                        if (!isNaN(value)) {
                          teamCommunicationMetrics[i].meetingHours = value;
                          teamCommunicationMetrics[i].totalHours = value + 
                            teamCommunicationMetrics[i].overheadHours + 
                            teamCommunicationMetrics[i].additionalHours;
                        }
                      }}
                    />
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                    <input
                      type="number"
                      class="w-20 text-right rounded-md border-gray-300 focus:border-secondary focus:ring-secondary text-xs"
                      value={teamCommunicationMetrics[i]?.overheadHours}
                      on:input={(e) => {
                        const value = Math.round(parseFloat(e.currentTarget.value));
                        if (!isNaN(value)) {
                          teamCommunicationMetrics[i].overheadHours = value;
                          teamCommunicationMetrics[i].totalHours = 
                            teamCommunicationMetrics[i].meetingHours + 
                            value + 
                            teamCommunicationMetrics[i].additionalHours;
                        }
                      }}
                    />
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                    <input
                      type="number"
                      class="w-20 text-right rounded-md border-gray-300 focus:border-secondary focus:ring-secondary text-xs"
                      value={teamCommunicationMetrics[i]?.additionalHours}
                      on:input={(e) => {
                        const value = Math.round(parseFloat(e.currentTarget.value));
                        if (!isNaN(value)) {
                          teamCommunicationMetrics[i].additionalHours = value;
                          teamCommunicationMetrics[i].totalHours = 
                            teamCommunicationMetrics[i].meetingHours + 
                            teamCommunicationMetrics[i].overheadHours + 
                            value;
                        }
                      }}
                    />
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {teamCommunicationMetrics[i]?.totalHours}
                  </td>
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


<!-- Replace line 1536 with this -->
<MatrixDesign
  {nodes}
  {edges}
  {visualizationMode}
  {showLegend}
  bind:dependencyMatrix
  bind:costParams
  bind:companyDependencyLevel
  {distributionMode}
  {hierarchyLevels}
  {childrenPerNode}
  on:applyMatrix={applyMatrix}
/>

<!-- Replace the cut section with this component -->
<CostAnalysisVisualization
  {nodes}
  {teamCount}
  {teamParams}
  {costParams}
  {calculateCosts}
  bind:costChartCanvas={costChartCanvas as HTMLCanvasElement}
/>

<!-- Impact Analysis Component -->
<ImpactAnalysis
  {nodes}
  {edges}
  {dependencyMatrix}
  {metrics}
  {visualizationMode}
  bind:comparisonMode
  bind:targetDependencyMatrix
  bind:dependencyAdjustment
  {calculateCosts}
  {calculateComparisonMetrics}
  {costParams}
  {teamParams}
/>

</div>

<!-- Add this at the very end of the file, right before the closing style tag -->
<div class="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg p-8 mt-8">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
  params={sharedConfig}
  onConfirm={handleLoadConfig}
  onCancel={() => showLoadingModal = false}
/>

<ExpertModal bind:show={showExpertModal} />

</div>

<style>
  /* ... existing styles ... */
</style> 
