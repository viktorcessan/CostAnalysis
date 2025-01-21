<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Node, Edge, DependencyMatrix } from '$lib/types/teamDependency';

  const dispatch = createEventDispatcher();

  export let nodes: Node[];
  export let edges: Edge[];
  export let visualizationMode: 'weighted' | 'multiple';
  export let showLegend: boolean;
  export let dependencyMatrix: DependencyMatrix;
  export let costParams: {
    hourlyRate: {
      developer: number;
    };
    meetings: {
      duration: number;
      recurrence: string;
      attendeesPerTeam: number;
      communicationOverhead: number;
      additionalHours: number;
    };
    overhead: {
      communicationOverhead: number;
      baselineCommunicationHours: number;
      dependencyHoursRate: number;
    };
  };
  export let companyDependencyLevel: number;
  export let distributionMode: 'even' | 'hub-spoke' | 'sequential' | 'mesh' | 'hierarchical' | 'clustered';
  export let hierarchyLevels: number;
  export let childrenPerNode: number;

  function applyMatrix() {
    dispatch('applyMatrix');
  }

  function calculateCircularPosition(index: number, totalNodes: number) {
    const angleStep = (2 * Math.PI) / totalNodes;
    const angle = angleStep * index - Math.PI / 2;
    const horizontalScale = 1.4;
    const radiusX = Math.min(450, Math.max(350, 1000 / totalNodes));
    const radiusY = Math.min(350, Math.max(300, 800 / totalNodes));
    
    return {
      x: 500 + radiusX * Math.cos(angle) * horizontalScale,
      y: 400 + radiusY * Math.sin(angle)
    };
  }

  function calculateHierarchicalPosition(index: number, totalNodes: number) {
    // Calculate the level of this node
    let level = 0;
    let nodesInPreviousLevels = 0;
    let nodesInCurrentLevel = 1;
    
    while (nodesInPreviousLevels + nodesInCurrentLevel <= index) {
      nodesInPreviousLevels += nodesInCurrentLevel;
      level++;
      nodesInCurrentLevel = Math.pow(childrenPerNode, level);
    }
    
    // Calculate position within level
    const positionInLevel = index - nodesInPreviousLevels;
    const totalNodesInLevel = Math.min(Math.pow(childrenPerNode, level), totalNodes - nodesInPreviousLevels);
    
    // Calculate x and y coordinates
    const levelHeight = 800 / (hierarchyLevels + 1);
    const levelWidth = 900;
    const nodeSpacing = levelWidth / (totalNodesInLevel + 1);
    
    return {
      x: 50 + nodeSpacing * (positionInLevel + 1),
      y: 50 + levelHeight * level
    };
  }

  function calculateSequentialPosition(index: number, totalNodes: number) {
    const padding = 100; // Padding from edges
    const availableWidth = 1000 - (padding * 2); // Total width minus padding
    
    if (totalNodes <= 5) {
      // Single row layout
      const spacing = availableWidth / (totalNodes - 1 || 1);
      return {
        x: padding + (spacing * index),
        y: 400 // Middle of the view
      };
    } else {
      // Two row layout
      const nodesFirstRow = 5;
      const spacing = availableWidth / (nodesFirstRow - 1);
      
      if (index < nodesFirstRow) {
        // First row (left to right)
        return {
          x: padding + (spacing * index),
          y: 300 // Upper row
        };
      } else {
        // Second row (right to left)
        const secondRowIndex = index - nodesFirstRow;
        const nodesSecondRow = Math.min(5, totalNodes - nodesFirstRow);
        const secondRowSpacing = availableWidth / (nodesSecondRow - 1 || 1);
        return {
          x: padding + availableWidth - (secondRowSpacing * secondRowIndex),
          y: 500 // Lower row
        };
      }
    }
  }
</script>

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
        
        {@const sourcePos = distributionMode === 'hierarchical' 
          ? calculateHierarchicalPosition(sourceIndex, nodes.length)
          : distributionMode === 'sequential'
          ? calculateSequentialPosition(sourceIndex, nodes.length)
          : calculateCircularPosition(sourceIndex, nodes.length)}
        {@const targetPos = distributionMode === 'hierarchical'
          ? calculateHierarchicalPosition(targetIndex, nodes.length)
          : distributionMode === 'sequential'
          ? calculateSequentialPosition(targetIndex, nodes.length)
          : calculateCircularPosition(targetIndex, nodes.length)}
        
        {#if visualizationMode === 'weighted'}
          <!-- Single weighted line -->
          {@const midX = (sourcePos.x + targetPos.x) / 2}
          {@const midY = (sourcePos.y + targetPos.y) / 2}
          {@const dx = targetPos.x - sourcePos.x}
          {@const dy = targetPos.y - sourcePos.y}
          {@const normalX = distributionMode === 'hierarchical' || distributionMode === 'sequential'
            ? 0 
            : -dy / Math.sqrt(dx * dx + dy * dy) * 40}
          {@const normalY = distributionMode === 'hierarchical' || distributionMode === 'sequential'
            ? distributionMode === 'sequential' ? -40 : 0
            : dx / Math.sqrt(dx * dx + dy * dy) * 40}
          {@const nodeRadius = 75}
          {@const totalLength = Math.sqrt(dx * dx + dy * dy)}
          {@const endX = targetPos.x - (dx * nodeRadius / totalLength)}
          {@const endY = targetPos.y - (dy * nodeRadius / totalLength)}
          {@const startX = sourcePos.x + (dx * nodeRadius / totalLength)}
          {@const startY = sourcePos.y + (dy * nodeRadius / totalLength)}
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
            {@const offset = (lineIndex - (edge.data.strength - 1) / 2) * (distributionMode === 'hierarchical' ? 15 : 30)}
            {@const midX = (sourcePos.x + targetPos.x) / 2}
            {@const midY = (sourcePos.y + targetPos.y) / 2}
            {@const dx = targetPos.x - sourcePos.x}
            {@const dy = targetPos.y - sourcePos.y}
            {@const normalX = distributionMode === 'hierarchical'
              ? offset
              : -dy / Math.sqrt(dx * dx + dy * dy) * (80 + offset)}
            {@const normalY = distributionMode === 'hierarchical'
              ? 0
              : dx / Math.sqrt(dx * dx + dy * dy) * (80 + offset)}
            {@const nodeRadius = 75}
            {@const totalLength = Math.sqrt(dx * dx + dy * dy)}
            {@const endX = targetPos.x - (dx * nodeRadius / totalLength)}
            {@const endY = targetPos.y - (dy * nodeRadius / totalLength)}
            {@const startX = sourcePos.x + (dx * nodeRadius / totalLength)}
            {@const startY = sourcePos.y + (dy * nodeRadius / totalLength)}
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
        {@const position = distributionMode === 'hierarchical' 
          ? calculateHierarchicalPosition(i, nodes.length)
          : distributionMode === 'sequential'
          ? calculateSequentialPosition(i, nodes.length)
          : calculateCircularPosition(i, nodes.length)}
        
        <!-- Team Node -->
        <g transform="translate({position.x}, {position.y})">
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