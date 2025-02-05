<script lang="ts">
  import { fade, slide } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  
  interface NapkinContent {
    teams?: number;
    members?: number;
    avgCost?: number;
    formation?: string;
    teamSize?: number;
    hourlyRate?: number;
    serviceAllocation?: number;
    platformCost?: number;
    timeToBuild?: number;
    timeToFree?: number;
    efficiency?: number;
    inHouseCost?: number;
    vendorCost?: number;
    maintenanceDiff?: number;
    timeToMarket?: number;
    customization?: number;
    vendorLock?: number;
    revenue?: number;
    retention?: number;
    satisfaction?: number;
    marketShare?: number;
    competitiveEdge?: string;
    infrastructure?: number;
    development?: number;
    operations?: number;
    support?: number;
    generateRevenue?: number;
    protectRevenue?: number;
    reduceCosts?: number;
    avoidCosts?: number;
    developmentCost?: number;
    maintenanceCost?: number;
    breakEven?: number;
    roi?: number;
    riskReduction?: number;
  }

  interface Napkin {
    title: string;
    content: NapkinContent;
  }
  
  let currentNapkin = 0;
  const napkins: Napkin[] = [
    {
      title: "Team Dependency Costs",
      content: {
        teams: 4,
        members: 21,
        avgCost: 75,
        formation: "Cluster"
      }
    },
    {
      title: "Build vs Buy Analysis",
      content: {
        inHouseCost: 850000,
        vendorCost: 450000,
        maintenanceDiff: 25000,
        timeToMarket: 6,
        customization: 85,
        vendorLock: 35
      }
    },
    {
      title: "Feature Value Analysis",
      content: {
        generateRevenue: 450000,
        protectRevenue: 250000,
        reduceCosts: 180000,
        avoidCosts: 120000,
        developmentCost: 85000,
        maintenanceCost: 4500,
        breakEven: 4.2,
        roi: 285,
        riskReduction: 65
      }
    },
    {
      title: "Automation Business Case",
      content: {
        teamSize: 9,
        hourlyRate: 85,
        serviceAllocation: 65,
        platformCost: 750000,
        timeToBuild: 8,
        timeToFree: 45,
        efficiency: 20
      }
    },
    {
      title: "Platform Budget",
      content: {
        infrastructure: 45000,
        development: 120000,
        operations: 35000,
        support: 25000
      }
    }
  ];

  function nextNapkin() {
    currentNapkin = (currentNapkin + 1) % napkins.length;
  }

  function prevNapkin() {
    currentNapkin = (currentNapkin - 1 + napkins.length) % napkins.length;
  }

  $: currentNapkinData = napkins[currentNapkin];
</script>

<!-- Napkin Analysis Section -->
<div class="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
  <!-- Background decorative elements -->
  <div class="absolute top-0 left-0 w-full h-full">
    <div class="absolute top-10 left-10 w-32 h-32 bg-secondary/5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-10 right-10 w-48 h-48 bg-secondary/5 rounded-full blur-3xl"></div>
  </div>
  
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
    <!-- Section Title -->
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-gray-900 mb-4">
        Quick Analysis, Real Insights
      </h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Start with a napkin calculation, end with actionable insights
      </p>
    </div>

    <div class="flex flex-col md:flex-row items-center gap-16">
      <!-- Left side: Napkin Carousel -->
      <div class="flex-1 relative">
        <!-- Navigation Buttons -->
        <button
          class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          on:click={prevNapkin}
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          on:click={nextNapkin}
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- Napkin Display -->
        {#key currentNapkin}
        <div
          class="transform hover:scale-105 transition-transform duration-300"
          in:fade={{ duration: 300, easing: cubicInOut }}
        >
          <div class="relative w-full max-w-md mx-auto group">
            <!-- Napkin shadow -->
            <div class="absolute inset-0 bg-gray-900/5 rounded-lg transform translate-x-2 translate-y-2 -rotate-1"></div>
            
            <!-- Main napkin -->
            <div class="bg-[#f7f4eb] p-8 rounded-lg shadow-lg transform rotate-2 relative backdrop-blur-sm backdrop-filter min-h-[500px]">
              <!-- Napkin texture -->
              <div class="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-lg"></div>
              
              <!-- Napkin border -->
              <div class="absolute top-0 left-0 w-full h-full border-t-4 border-l-4 border-gray-300/50 rounded-lg"></div>
              
              <!-- Content container -->
              <div class="space-y-6 transform -rotate-2 relative">
                <div class="font-handwriting text-3xl mb-4 text-secondary border-b-2 border-dashed border-gray-400 pb-2">
                  {currentNapkinData.title}
                </div>
                
                {#if currentNapkin === 0}
                  <!-- Team Dependency Costs -->
                  <div class="space-y-4 font-handwriting">
                    <div class="space-y-3">
                      <div class="flex justify-between text-xl">
                        <span>Teams:</span>
                        <span>{currentNapkinData.content.teams ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Team Members:</span>
                        <span>{currentNapkinData.content.members ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Avg Cost:</span>
                        <span>${currentNapkinData.content.avgCost ?? '-'}/hr</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Formation:</span>
                        <span>{currentNapkinData.content.formation ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl text-secondary font-bold">
                        <span>Cost of Dependencies:</span>
                        <span>$35,000/mo</span>
                      </div>
                    </div>
                    
                    <!-- Hand-drawn cluster visualization -->
                    <div class="border-2 border-dashed border-gray-400 p-4 rounded">
                      <div class="text-center mb-2 text-xl">Team Cluster Visualization</div>
                      <svg class="w-full h-48" viewBox="0 0 200 150">
                        <!-- Dependencies (drawn first) -->
                        <g class="edges">
                          <path d="M 75 75 Q 100 60 130 45" class="stroke-gray-600" style="fill: none; stroke-width: 1.5; stroke-dasharray: 4"/>
                          <path d="M 75 75 Q 110 75 120 115" class="stroke-gray-600" style="fill: none; stroke-width: 1.5; stroke-dasharray: 4"/>
                          <path d="M 75 75 Q 85 115 120 115" class="stroke-gray-600" style="fill: none; stroke-width: 1.5; stroke-dasharray: 4"/>
                          <path d="M 140 65 Q 140 90 140 93" class="stroke-gray-600" style="fill: none; stroke-width: 1.5; stroke-dasharray: 4"/>
                          <path d="M 70 65 Q 85 45 85 35" class="stroke-gray-600" style="fill: none; stroke-width: 1.5; stroke-dasharray: 4"/>
                          <path d="M 118 35 Q 130 40 135 45" class="stroke-gray-600" style="fill: none; stroke-width: 1.5; stroke-dasharray: 4"/>
                          <path d="M 100 48 Q 120 80 140 95" class="stroke-gray-600" style="fill: none; stroke-width: 1.5; stroke-dasharray: 4"/>
                        </g>
                        
                        <!-- Nodes (drawn second) -->
                        <g class="nodes">
                          <!-- Team A -->
                          <circle cx="50" cy="75" r="25" class="fill-secondary/20 stroke-secondary" style="stroke-width: 2; stroke-dasharray: 4"/>
                          <!-- Team B -->
                          <circle cx="150" cy="45" r="20" class="fill-secondary/20 stroke-secondary" style="stroke-width: 2; stroke-dasharray: 4"/>
                          <!-- Team C -->
                          <circle cx="140" cy="115" r="22" class="fill-secondary/20 stroke-secondary" style="stroke-width: 2; stroke-dasharray: 4"/>
                          <!-- Team D -->
                          <circle cx="100" cy="30" r="18" class="fill-secondary/20 stroke-secondary" style="stroke-width: 2; stroke-dasharray: 4"/>
                        </g>
                        
                        <!-- Labels (drawn last) -->
                        <g class="labels">
                          <text x="45" y="78" class="text-xs text-center">A</text>
                          <text x="145" y="48" class="text-xs text-center">B</text>
                          <text x="135" y="118" class="text-xs text-center">C</text>
                          <text x="95" y="33" class="text-xs text-center">D</text>
                        </g>
                      </svg>
                    </div>

                    <div class="text-lg text-gray-600 mt-4">
                      Cross-team meetings: Bi-weekly (1hr, 2 members)
                    </div>
                  </div>

                {:else if currentNapkin === 1}
                  <!-- Build vs Buy Analysis -->
                  <div class="space-y-4 font-handwriting">
                    <div class="space-y-3">
                      <div class="flex justify-between text-xl">
                        <span>In-house Cost:</span>
                        <span>${currentNapkinData.content.inHouseCost ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Vendor Cost:</span>
                        <span>${currentNapkinData.content.vendorCost ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Maintenance Difference:</span>
                        <span>${currentNapkinData.content.maintenanceDiff ?? '-'}/mo</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Time to Market:</span>
                        <span>{currentNapkinData.content.timeToMarket ?? '-'} months</span>
                      </div>
                    </div>

                    <!-- Risk Matrix -->
                    <div class="border-2 border-dashed border-gray-400 p-4 rounded">
                      <div class="text-center mb-2 text-xl">Risk Analysis</div>
                      <!-- Risk Score Summary -->
                      <div class="flex justify-between mb-4 text-lg">
                        <div class="text-secondary">Build Risk: 45</div>
                        <div class="text-blue-600">Buy Risk: 32</div>
                      </div>
                      <svg class="w-full h-48" viewBox="0 0 200 150">
                        <!-- Grid Lines -->
                        <path d="M 40 20 L 40 120 L 180 120" class="stroke-gray-400" style="fill: none; stroke-width: 1"/>
                        
                        <!-- Grid Sections - Row 1 (top) -->
                        <rect x="40" y="20" width="28" height="20" class="fill-green-50"/>
                        <rect x="68" y="20" width="28" height="20" class="fill-yellow-50"/>
                        <rect x="96" y="20" width="28" height="20" class="fill-red-100"/>
                        <rect x="124" y="20" width="28" height="20" class="fill-red-100"/>
                        <rect x="152" y="20" width="28" height="20" class="fill-red-100"/>
                        
                        <!-- Grid Sections - Row 2 -->
                        <rect x="40" y="40" width="28" height="20" class="fill-green-50"/>
                        <rect x="68" y="40" width="28" height="20" class="fill-yellow-50"/>
                        <rect x="96" y="40" width="28" height="20" class="fill-yellow-50"/>
                        <rect x="124" y="40" width="28" height="20" class="fill-red-100"/>
                        <rect x="152" y="40" width="28" height="20" class="fill-red-100"/>
                        
                        <!-- Grid Sections - Row 3 -->
                        <rect x="40" y="60" width="28" height="20" class="fill-green-50"/>
                        <rect x="68" y="60" width="28" height="20" class="fill-green-50"/>
                        <rect x="96" y="60" width="28" height="20" class="fill-yellow-50"/>
                        <rect x="124" y="60" width="28" height="20" class="fill-yellow-50"/>
                        <rect x="152" y="60" width="28" height="20" class="fill-red-100"/>
                        
                        <!-- Grid Sections - Row 4 -->
                        <rect x="40" y="80" width="28" height="20" class="fill-green-50"/>
                        <rect x="68" y="80" width="28" height="20" class="fill-green-50"/>
                        <rect x="96" y="80" width="28" height="20" class="fill-green-50"/>
                        <rect x="124" y="80" width="28" height="20" class="fill-yellow-50"/>
                        <rect x="152" y="80" width="28" height="20" class="fill-yellow-50"/>
                        
                        <!-- Grid Sections - Row 5 (bottom) -->
                        <rect x="40" y="100" width="28" height="20" class="fill-green-50"/>
                        <rect x="68" y="100" width="28" height="20" class="fill-green-50"/>
                        <rect x="96" y="100" width="28" height="20" class="fill-green-50"/>
                        <rect x="124" y="100" width="28" height="20" class="fill-green-50"/>
                        <rect x="152" y="100" width="28" height="20" class="fill-green-50"/>
                        
                        <!-- Build Risk Points with Labels -->
                        <circle cx="68" cy="35" r="4" class="fill-secondary"/>
                        <text x="74" y="32" class="text-[10px] text-secondary">Technical Debt</text>
                        
                        <!-- Buy Risk Points with Labels -->
                        <circle cx="96" cy="80" r="4" class="fill-blue-500"/>
                        <text x="102" y="77" class="text-[10px] text-blue-500">Limited Customization</text>
                        
                        <!-- Additional Risk Point -->
                        <circle cx="152" cy="100" r="4" class="fill-secondary"/>
                        <text x="158" y="97" class="text-[10px] text-secondary">Delivery Delays</text>
                        
                        <!-- Axis Labels -->
                        <text x="30" y="70" class="text-xs" transform="rotate(-90 30,70)">Impact</text>
                        <text x="100" y="135" class="text-xs text-center">Probability</text>
                        
                        <!-- Legend - moved further left -->
                        <g transform="translate(20, 135)">
                          <circle cx="0" cy="0" r="3" class="fill-secondary"/>
                          <text x="8" y="3" class="text-xs">Build</text>
                          <circle cx="35" cy="0" r="3" class="fill-blue-500"/>
                          <text x="43" y="3" class="text-xs">Buy</text>
                        </g>

                      </svg>
                    </div>
                  </div>

                {:else if currentNapkin === 2}
                  <!-- Feature Value Analysis -->
                  <div class="space-y-4 font-handwriting">
                    <div class="space-y-3">
                      <div class="flex justify-between text-xl">
                        <span>Increase Revenue:</span>
                        <span>${currentNapkinData.content.generateRevenue ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Protect Revenue:</span>
                        <span>${currentNapkinData.content.protectRevenue ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Reduce Costs:</span>
                        <span>${currentNapkinData.content.reduceCosts ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Avoid Costs:</span>
                        <span>${currentNapkinData.content.avoidCosts ?? '-'}</span>
                      </div>
                    </div>

                    <!-- Hand-drawn value distribution chart -->
                    <div class="border-2 border-dashed border-gray-400 p-4 rounded">
                      <div class="text-center mb-2 text-xl">Value Distribution</div>
                      <svg class="w-full h-48" viewBox="0 0 200 150">
                        <!-- Doughnut chart sections -->
                        <path d="M 100 75 L 100 25 A 50 50 0 0 1 145 100 Z" class="fill-green-400/60 stroke-gray-600" style="stroke-width: 1"/>
                        <path d="M 100 75 L 145 100 A 50 50 0 0 1 75 120 Z" class="fill-blue-400/60 stroke-gray-600" style="stroke-width: 1"/>
                        <path d="M 100 75 L 75 120 A 50 50 0 0 1 60 60 Z" class="fill-red-400/60 stroke-gray-600" style="stroke-width: 1"/>
                        <path d="M 100 75 L 60 60 A 50 50 0 0 1 100 25 Z" class="fill-yellow-400/60 stroke-gray-600" style="stroke-width: 1"/>
                        <!-- Labels -->
                        <text x="155" y="45" class="text-xs fill-green-600">Increase</text>
                        <text x="155" y="75" class="text-xs fill-blue-600">Protect</text>
                        <text x="155" y="105" class="text-xs fill-red-600">Reduce</text>
                        <text x="155" y="135" class="text-xs fill-yellow-600">Avoid</text>
                      </svg>
                    </div>

                    <div class="text-lg text-gray-600">
                      Development: ${currentNapkinData.content.developmentCost ?? '-'}<br>
                      Monthly Maintenance: ${currentNapkinData.content.maintenanceCost ?? '-'}<br>
                      Break-even: {currentNapkinData.content.breakEven ?? '-'} months<br>
                      ROI: {currentNapkinData.content.roi ?? '-'}%<br>
                      Risk Reduction: {currentNapkinData.content.riskReduction ?? '-'}%
                    </div>
                  </div>

                {:else if currentNapkin === 3}
                  <!-- Automation Business Case -->
                  <div class="space-y-4 font-handwriting">
                    <div class="space-y-3">
                      <div class="flex justify-between text-xl">
                        <span>Team Size:</span>
                        <span>{currentNapkinData.content.teamSize ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Hourly Rate:</span>
                        <span>${currentNapkinData.content.hourlyRate ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Service Allocation:</span>
                        <span>{currentNapkinData.content.serviceAllocation ?? '-'}%</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Platform Cost:</span>
                        <span>${currentNapkinData.content.platformCost ? (currentNapkinData.content.platformCost/1000) : '-'}k</span>
                      </div>
                    </div>

                    <!-- Hand-drawn break-even graph -->
                    <div class="border-2 border-dashed border-gray-400 p-4 rounded">
                      <div class="text-center mb-2 text-xl">Break-even Analysis</div>
                      <svg class="w-full h-48" viewBox="0 0 200 150">
                        <!-- Axes -->
                        <path d="M 20 130 L 180 130" class="stroke-gray-600" style="fill: none; stroke-width: 2"/>
                        <path d="M 20 130 L 20 20" class="stroke-gray-600" style="fill: none; stroke-width: 2"/>
                        <!-- Axis labels -->
                        <text x="185" y="130" class="text-sm">Time</text>
                        <text x="15" y="15" class="text-sm">Cost</text>
                        <!-- Cost line (curved investment + maintenance) -->
                        <path d="M 20 110 C 40 105, 60 85, 100 82 L 180 78" class="stroke-secondary" style="fill: none; stroke-width: 2; stroke-dasharray: 4"/>
                        <!-- Savings line (linear growth) -->
                        <path d="M 20 110 L 180 30" class="stroke-green-500" style="fill: none; stroke-width: 2; stroke-dasharray: 4"/>
                        <!-- Savings Crossover point -->
                        <circle cx="100" cy="82" r="4" class="fill-blue-500"/>
                        <text x="70" y="70" class="text-sm font-bold fill-blue-500">Savings Crossover</text>
                        <!-- Break-even point -->
                        <circle cx="140" cy="65" r="4" class="fill-red-500"/>
                        <text x="130" y="53" class="text-sm font-bold fill-red-500">Break-even</text>
                        <!-- Legend -->
                        <text x="30" y="40" class="text-xs fill-secondary">Investment + Maintenance</text>
                        <text x="30" y="55" class="text-xs fill-green-500">Cumulative Savings</text>
                      </svg>
                    </div>

                    <div class="text-lg text-gray-600">
                      Time to Free up: {currentNapkinData.content.timeToFree ?? '-'}%<br>
                      Efficiency Improvement: {currentNapkinData.content.efficiency ?? '-'}%
                    </div>
                  </div>

                {:else}
                  <!-- Platform Budget -->
                  <div class="space-y-4 font-handwriting">
                    <div class="space-y-3">
                      <div class="flex justify-between text-xl">
                        <span>Infrastructure:</span>
                        <span>${currentNapkinData.content.infrastructure ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Development:</span>
                        <span>${currentNapkinData.content.development ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Operations:</span>
                        <span>${currentNapkinData.content.operations ?? '-'}</span>
                      </div>
                      <div class="flex justify-between text-xl">
                        <span>Support:</span>
                        <span>${currentNapkinData.content.support ?? '-'}</span>
                      </div>
                    </div>

                    <!-- Hand-drawn pie chart -->
                    <div class="border-2 border-dashed border-gray-400 p-4 rounded">
                      <div class="text-center mb-2 text-xl">Budget Distribution</div>
                      <svg class="w-full h-48" viewBox="0 0 200 150">
                        <!-- Hand-drawn style pie chart -->
                        <path d="M 100 75 L 100 25 A 50 50 0 0 1 145 100 Z" class="fill-secondary/60 stroke-gray-600" style="stroke-width: 1"/>
                        <path d="M 100 75 L 145 100 A 50 50 0 0 1 75 120 Z" class="fill-secondary/40 stroke-gray-600" style="stroke-width: 1"/>
                        <path d="M 100 75 L 75 120 A 50 50 0 0 1 60 60 Z" class="fill-secondary/20 stroke-gray-600" style="stroke-width: 1"/>
                        <path d="M 100 75 L 60 60 A 50 50 0 0 1 100 25 Z" class="fill-secondary/80 stroke-gray-600" style="stroke-width: 1"/>
                      </svg>
                    </div>

                    <div class="text-lg text-gray-600">
                      Total Monthly Budget: ${(
                        (currentNapkinData.content.infrastructure || 0) + 
                        (currentNapkinData.content.development || 0) + 
                        (currentNapkinData.content.operations || 0) + 
                        (currentNapkinData.content.support || 0)
                      )}k
                    </div>
                  </div>
                {/if}

                <!-- Coffee stain effects -->
                <div class="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-[#C8A484] opacity-10 transform rotate-12"></div>
                <div class="absolute top-8 -right-2 w-10 h-10 rounded-full bg-[#C8A484] opacity-5"></div>
              </div>
            </div>
          </div>
        </div>
        {/key}

        <!-- Napkin indicators -->
        <div class="flex justify-center mt-6 gap-2">
          {#each napkins as _, i}
            <button
              class="w-2 h-2 rounded-full transition-colors duration-200 {i === currentNapkin ? 'bg-secondary' : 'bg-gray-300'}"
              on:click={() => currentNapkin = i}
            ></button>
          {/each}
        </div>
      </div>

      <!-- Right side: Text -->
      <div class="flex-1 text-center md:text-left">
        <div class="space-y-6 max-w-lg">
          <h3 class="text-3xl font-bold text-gray-900 mb-4">
            Back-of-Napkin Operations Analysis
          </h3>
          <p class="text-xl text-gray-600 leading-relaxed">
            Sometimes the best operational insights start with a quick calculation. Our tool brings this intuitive approach to life, helping you rapidly evaluate costs and opportunities.
          </p>
          <div class="space-y-4 text-gray-600">
            <div class="flex items-start gap-3">
              <div class="mt-1">
                <svg class="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p>Quick calculations to validate your operational decisions</p>
            </div>
            <div class="flex items-start gap-3">
              <div class="mt-1">
                <svg class="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p>Instant visibility into team and platform costs</p>
            </div>
            <div class="flex items-start gap-3">
              <div class="mt-1">
                <svg class="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p>Clear optimization targets to guide your decisions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>