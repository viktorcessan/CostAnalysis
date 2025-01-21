<script lang="ts">
  import type { Node, Edge, DependencyMatrix } from '$lib/types/teamDependency';

  export let nodes: Node[];
  export let edges: Edge[];
  export let dependencyMatrix: DependencyMatrix;
  export let metrics: {
    flowEfficiency: number;
    avgLeadTime: number;
  };
  export let visualizationMode: 'weighted' | 'multiple';
  export let comparisonMode: 'topology' | 'lazy' | 'advanced';
  export let targetDependencyMatrix: number[][];
  export let dependencyAdjustment: number;
  export let calculateCosts: () => {
    monthlyMeetingCost: number;
    communicationCost: number;
    totalCost: number;
  };

  export let costParams: {
    meetings: {
      duration: number;
      recurrence: string;
      attendeesPerTeam: number;
      communicationOverhead: number;
    };
    hourlyRate: {
      developer: number;
    };
    overhead: {
      baselineCommunicationHours: number;
      dependencyHoursRate: number;
    };
  };

  export let teamParams: {
    baseLeadTime: number;
    teams: {
      name: string;
      size: number;
      baseCapacity: number;
      efficiency: number;
    }[];
  };

  function getMonthlyMeetingMultiplier(recurrence: string): number {
    switch (recurrence) {
      case 'twice-weekly': return 8;
      case 'weekly': return 4;
      case 'biweekly': return 2;
      case 'monthly': return 1;
      default: return 4;
    }
  }

  type ComparisonMode = 'topology' | 'lazy' | 'advanced';

  export let calculateComparisonMetrics: (mode: ComparisonMode) => {
    costs: {
      monthlyMeetingCost: number;
      communicationCost: number;
      totalCost: number;
    };
    flowEfficiency: number;
    leadTime: number;
    utilizationRate: number;
    serviceEfficiency: number;
  };

  function updateTargetDependency(fromIndex: number, toIndex: number, value: number) {
    targetDependencyMatrix[fromIndex][toIndex] = Math.max(0, Math.min(5, value));
    targetDependencyMatrix = targetDependencyMatrix;
  }

  function calculateModeMetrics(mode: ComparisonMode) {
    if (mode === 'topology') {
      // For topology mode, use independent team metrics (minimal dependencies)
      const baseMeetingCost = costParams.meetings.duration * 
        getMonthlyMeetingMultiplier(costParams.meetings.recurrence) *
        costParams.meetings.attendeesPerTeam * 
        costParams.hourlyRate.developer * 
        nodes.length;

      return {
        costs: {
          directMeetingCost: baseMeetingCost,
          communicationOverhead: nodes.length * costParams.hourlyRate.developer * 2,
          opportunityCost: 0, // No context switching in independent teams
          flowEfficiencyCost: 0, // No dependency-related delays
          totalCost: baseMeetingCost + (nodes.length * costParams.hourlyRate.developer * 2)
        },
        flowEfficiency: 95,
        leadTime: teamParams.baseLeadTime,
        utilizationRate: 90,
        serviceEfficiency: 95
      };
    } else if (mode === 'lazy') {
      // For lazy mode, adjust costs based on dependency adjustment
      const adjustedEdges = edges.map(edge => ({
        ...edge,
        data: {
          ...edge.data,
          strength: Math.max(0, Math.min(5, edge.data.strength + dependencyAdjustment))
        }
      }));

      // Calculate costs with adjusted dependencies
      const totalConnections = adjustedEdges.length;
      
      // Direct meeting costs
      const directMeetingCost = 
        costParams.meetings.duration * 
        getMonthlyMeetingMultiplier(costParams.meetings.recurrence) *
        costParams.meetings.attendeesPerTeam * 
        costParams.hourlyRate.developer * 
        totalConnections;

      // Communication overhead
      const communicationOverhead =
        totalConnections * 
        costParams.meetings.communicationOverhead *
        costParams.hourlyRate.developer * 
        costParams.overhead.baselineCommunicationHours;

      // Opportunity cost from context switching
      const contextSwitchingHours = adjustedEdges.reduce((sum, edge) => 
        sum + (edge.data.strength * 2), 0);
      const opportunityCost = 
        contextSwitchingHours * 
        costParams.hourlyRate.developer * 
        costParams.meetings.attendeesPerTeam;

      // Flow efficiency impact cost
      const avgDependencyStrength = adjustedEdges.reduce((sum, edge) => 
        sum + edge.data.strength, 0) / (adjustedEdges.length || 1);
      const waitTimeHours = totalConnections * avgDependencyStrength * 4;
      const flowEfficiencyCost = 
        waitTimeHours * 
        costParams.hourlyRate.developer * 
        costParams.overhead.waitTimeMultiplier;

      const totalCost = directMeetingCost + communicationOverhead + opportunityCost + flowEfficiencyCost;

      return {
        costs: {
          directMeetingCost,
          communicationOverhead,
          opportunityCost,
          flowEfficiencyCost,
          totalCost
        },
        flowEfficiency: Math.max(0, Math.min(100, metrics.flowEfficiency - (dependencyAdjustment * 5))),
        leadTime: Math.max(1, metrics.avgLeadTime + (dependencyAdjustment * 2)),
        utilizationRate: 85 - (dependencyAdjustment * 5),
        serviceEfficiency: 90 - (dependencyAdjustment * 5)
      };
    } else {
      // For advanced mode, use the target dependency matrix
      const totalConnections = targetDependencyMatrix.reduce((sum, row, i) => 
        sum + row.reduce((rowSum, val, j) => i !== j ? rowSum + (val > 0 ? 1 : 0) : rowSum, 0), 0);
      
      // Direct meeting costs
      const directMeetingCost = 
        costParams.meetings.duration * 
        getMonthlyMeetingMultiplier(costParams.meetings.recurrence) *
        costParams.meetings.attendeesPerTeam * 
        costParams.hourlyRate.developer * 
        totalConnections;

      // Communication overhead
      const communicationOverhead =
        totalConnections * 
        costParams.meetings.communicationOverhead *
        costParams.hourlyRate.developer * 
        costParams.overhead.baselineCommunicationHours;

      // Opportunity cost from context switching
      const totalDependencyStrength = targetDependencyMatrix.reduce((sum, row, i) => 
        sum + row.reduce((rowSum, val, j) => i !== j ? rowSum + val : rowSum, 0), 0);
      const contextSwitchingHours = totalDependencyStrength * 2;
      const opportunityCost = 
        contextSwitchingHours * 
        costParams.hourlyRate.developer * 
        costParams.meetings.attendeesPerTeam;

      // Flow efficiency impact cost
      const avgDependencyStrength = totalDependencyStrength / (totalConnections || 1);
      const waitTimeHours = totalConnections * avgDependencyStrength * 4;
      const flowEfficiencyCost = 
        waitTimeHours * 
        costParams.hourlyRate.developer * 
        costParams.overhead.waitTimeMultiplier;

      const totalCost = directMeetingCost + communicationOverhead + opportunityCost + flowEfficiencyCost;

      // Calculate average dependency level
      const avgDependencyLevel = totalDependencyStrength / (totalConnections || 1);
      const efficiencyImpact = (avgDependencyLevel - 2) * 5;
      const leadTimeImpact = (avgDependencyLevel - 2) * 2;

      return {
        costs: {
          directMeetingCost,
          communicationOverhead,
          opportunityCost,
          flowEfficiencyCost,
          totalCost
        },
        flowEfficiency: Math.max(0, Math.min(100, metrics.flowEfficiency - efficiencyImpact)),
        leadTime: Math.max(1, metrics.avgLeadTime + leadTimeImpact),
        utilizationRate: 85 - ((avgDependencyLevel - 2) * 5),
        serviceEfficiency: 90 - ((avgDependencyLevel - 2) * 5)
      };
    }
  }
</script>

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
          <span class="font-medium text-gray-900">Inverse Conway Maneuver</span>
        </div>
        <p class="text-xs text-gray-600 mb-2">Utilize Team Topologies heuristics, by Manuel Pais, and Matthew Skelton</p>
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
    {@const modeMetrics = calculateModeMetrics(comparisonMode)}
    {@const currentCosts = calculateCosts()}
    {@const costDifference = currentCosts.totalCost - modeMetrics.costs.totalCost}
    
    <div class="mb-8">
      <h4 class="text-sm font-medium text-gray-700 mb-4">Cost Impact of Team Dependencies</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Current Model -->
        <div class="bg-white rounded-lg p-4 border border-gray-200">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-medium text-gray-600">Current Dependency Costs</div>
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
                    <span class="font-medium">${modeMetrics.costs.totalCost.toFixed(0)}</span>
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
                <span class="font-medium">{modeMetrics.flowEfficiency.toFixed(1)}%</span>
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
                <span class="font-medium">{modeMetrics.leadTime.toFixed(1)} days</span>
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
            ({((costDifference / modeMetrics.costs.totalCost) * 100).toFixed(2)}% increase).
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