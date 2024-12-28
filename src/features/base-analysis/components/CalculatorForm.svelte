<!-- CalculatorForm.svelte -->
<script lang="ts">
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import type { CalculatorModel, SolutionType, PlatformInputs, OutsourceInputs, HybridInputs } from '$lib/types/calculator';
  import { onMount } from 'svelte';
  import type { Instance as TippyInstance } from 'tippy.js';
  import tippy from 'tippy.js';
  import 'tippy.js/dist/tippy.css';
  import 'tippy.js/themes/light-border.css';

  let model: CalculatorModel;
  let solution: SolutionType = 'platform';
  calculatorStore.subscribe(state => {
    model = state.model;
    solution = state.solution;
  });

  // Team model inputs
  let teamSize = 5;
  let hourlyRate = 75;
  let serviceEfficiency = 0.6;
  let operationalOverhead = 0.2;

  // Ticket model inputs
  let monthlyTickets = 50;
  let hoursPerTicket = 4;
  let peoplePerTicket = 2;
  let vendorRate = 75;

  // Platform solution inputs
  let platformInputs: PlatformInputs = {
    baselineCost: 0,
    platformCost: 100000,
    platformMaintenance: 5000,
    timeToBuild: 3,
    teamReduction: 0.3,
    processEfficiency: 0.2
  };

  // Outsource solution inputs
  let outsourceInputs: OutsourceInputs = {
    baselineCost: 0,
    vendorRate: 50,
    managementOverhead: 0.15,
    qualityImpact: -0.15,
    knowledgeLoss: 0.2,
    transitionTime: 3,
    transitionCost: 50000
  };

  // Hybrid solution inputs
  let hybridInputs: HybridInputs = {
    platformPortion: 40,
    vendorPortion: 30,
    baselineCost: 0,
    // Platform portion inputs
    timeToBuild: 3,
    platformCost: 60000,
    platformMaintenance: 3000,
    teamReduction: 0.3,
    processEfficiency: 0.15,
    // Vendor portion inputs
    vendorRate: 55,
    managementOverhead: 0.1,
    qualityImpact: -0.1,
    knowledgeLoss: 0.2,
    transitionTime: 3,
    transitionCost: 30000
  };

  // Input constraints
  const constraints = {
    teamSize: { min: 1, max: 15, step: 1 },
    hourlyRate: { min: 10, max: 150, step: 5 },
    serviceEfficiency: { min: 0, max: 1, step: 0.01 },
    operationalOverhead: { min: 0, max: 1, step: 0.01 },
    monthlyTickets: { min: 1, max: 250, step: 1 },
    hoursPerTicket: { min: 0.1, max: 100, step: 0.1 },
    peoplePerTicket: { min: 1, max: 10, step: 1 },
    vendorRate: { min: 10, max: 150, step: 5 },
    platformCost: { min: 50000, max: 500000, step: 10000 },
    platformMaintenance: { min: 1000, max: 10000, step: 100 },
    timeToBuild: { min: 1, max: 12, step: 1 },
    teamReduction: { min: 0, max: 1, step: 0.01 },
    processEfficiency: { min: 0, max: 1, step: 0.01 },
    managementOverhead: { min: 0, max: 1, step: 0.01 },
    qualityImpact: { min: -0.5, max: 0.5, step: 0.01 },
    knowledgeLoss: { min: 0, max: 1, step: 0.01 },
    transitionTime: { min: 1, max: 12, step: 1 },
    transitionCost: { min: 0, max: 100000, step: 1000 },
    portion: { min: 0, max: 100, step: 5 }
  };

  // Handle team inputs
  function handleTeamInputs() {
    calculatorStore.updateTeamInputs({
      teamSize,
      hourlyRate,
      serviceEfficiency,
      operationalOverhead
    });
  }

  // Handle ticket inputs
  function handleTicketInputs() {
    calculatorStore.updateTicketInputs({
      monthlyTickets,
      hoursPerTicket,
      peoplePerTicket,
      vendorRate  // Use vendorRate directly
    });
  }

  // Type guard functions
  function isHybridSolution(sol: SolutionType): sol is 'hybrid' {
    return sol === 'hybrid';
  }

  function isPlatformSolution(sol: SolutionType): sol is 'platform' {
    return sol === 'platform';
  }

  function isOutsourceSolution(sol: SolutionType): sol is 'outsource' {
    return sol === 'outsource';
  }

  // Update solution change handler to use type guards
  function handleSolutionChange(newSolution: SolutionType) {
    solution = newSolution;
    calculatorStore.updateSolutionType(solution);
    
    if (isHybridSolution(newSolution)) {
      hybridInputs = {
        platformPortion: 50,
        vendorPortion: 50,
        baselineCost: 0,
        // Copy platform inputs
        timeToBuild: platformInputs.timeToBuild,
        platformCost: platformInputs.platformCost,
        platformMaintenance: platformInputs.platformMaintenance,
        teamReduction: platformInputs.teamReduction,
        processEfficiency: platformInputs.processEfficiency,
        // Copy outsource inputs
        vendorRate: outsourceInputs.vendorRate,
        managementOverhead: outsourceInputs.managementOverhead,
        qualityImpact: outsourceInputs.qualityImpact,
        knowledgeLoss: outsourceInputs.knowledgeLoss,
        transitionTime: outsourceInputs.transitionTime,
        transitionCost: outsourceInputs.transitionCost
      };
    }
    
    updateSolutionInputs();
  }

  // Update solution inputs handler to use type guards
  function updateSolutionInputs() {
    calculatorStore.updateSolutionInputs({
      type: solution,
      platform: isPlatformSolution(solution) ? platformInputs : undefined,
      outsource: isOutsourceSolution(solution) ? outsourceInputs : undefined,
      hybrid: isHybridSolution(solution) ? hybridInputs : undefined
    });
  }

  // Handle linked portions in hybrid solution
  function updateHybridPortions(source: 'platform' | 'vendor', value: number) {
    if (source === 'platform') {
      hybridInputs.platformPortion = value;
      hybridInputs.vendorPortion = 100 - value;
    } else {
      hybridInputs.vendorPortion = value;
      hybridInputs.platformPortion = 100 - value;
    }
    hybridInputs = { ...hybridInputs }; // Force reactivity
    updateSolutionInputs();
  }

  // Handle input changes with proper typing
  function handlePercentageInput(e: Event, field: string, isDecimal = true) {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;
    
    const value = isDecimal ? +target.value / 100 : +target.value;
    
    switch (field) {
      case 'serviceEfficiency':
        serviceEfficiency = value;
        handleTeamInputs();
        break;
      case 'operationalOverhead':
        operationalOverhead = value;
        handleTeamInputs();
        break;
      case 'teamReduction':
        if (solution === 'platform') {
          platformInputs.teamReduction = value;
        } else if (solution === 'hybrid') {
          hybridInputs.teamReduction = value;
        }
        updateSolutionInputs();
        break;
      case 'processEfficiency':
        if (solution === 'platform') {
          platformInputs.processEfficiency = value;
        } else if (solution === 'hybrid') {
          hybridInputs.processEfficiency = value;
        }
        updateSolutionInputs();
        break;
      case 'managementOverhead':
        if (solution === 'outsource') {
          outsourceInputs.managementOverhead = value;
        } else if (solution === 'hybrid') {
          hybridInputs.managementOverhead = value;
        }
        updateSolutionInputs();
        break;
      case 'qualityImpact':
        if (solution === 'outsource') {
          outsourceInputs.qualityImpact = value;
        } else if (solution === 'hybrid') {
          hybridInputs.qualityImpact = value;
        }
        updateSolutionInputs();
        break;
      case 'knowledgeLoss':
        if (solution === 'outsource') {
          outsourceInputs.knowledgeLoss = value;
        } else if (solution === 'hybrid') {
          hybridInputs.knowledgeLoss = value;
        }
        updateSolutionInputs();
        break;
    }
  }

  // Handle numeric input with proper typing
  function handleNumericInput(e: Event, field: string) {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;
    
    const value = +target.value;
    
    switch (field) {
      case 'teamSize':
        teamSize = value;
        handleTeamInputs();
        break;
      case 'hourlyRate':
        hourlyRate = value;
        handleTeamInputs();
        break;
      case 'monthlyTickets':
        monthlyTickets = value;
        handleTicketInputs();
        break;
      case 'hoursPerTicket':
        hoursPerTicket = value;
        handleTicketInputs();
        break;
      case 'peoplePerTicket':
        peoplePerTicket = value;
        handleTicketInputs();
        break;
      case 'vendorRate':
        vendorRate = value;
        handleTicketInputs();
        break;
      case 'platformCost':
        if (solution === 'platform') {
          platformInputs.platformCost = value;
        } else if (solution === 'hybrid') {
          hybridInputs.platformCost = value;
        }
        updateSolutionInputs();
        break;
      case 'platformMaintenance':
        if (solution === 'platform') {
          platformInputs.platformMaintenance = value;
        } else if (solution === 'hybrid') {
          hybridInputs.platformMaintenance = value;
        }
        updateSolutionInputs();
        break;
      case 'timeToBuild':
        if (solution === 'platform') {
          platformInputs.timeToBuild = value;
        } else if (solution === 'hybrid') {
          hybridInputs.timeToBuild = value;
        }
        updateSolutionInputs();
        break;
      case 'transitionTime':
        if (solution === 'outsource') {
          outsourceInputs.transitionTime = value;
        } else if (solution === 'hybrid') {
          hybridInputs.transitionTime = value;
        }
        updateSolutionInputs();
        break;
      case 'transitionCost':
        if (solution === 'outsource') {
          outsourceInputs.transitionCost = value;
        } else if (solution === 'hybrid') {
          hybridInputs.transitionCost = value;
        }
        updateSolutionInputs();
        break;
      case 'platformPortion':
        if (solution === 'hybrid') {
          updateHybridPortions('platform', value);
        }
        break;
      case 'vendorPortion':
        if (solution === 'hybrid') {
          updateHybridPortions('vendor', value);
        }
        break;
    }
  }

  // Watch for model changes
  $: if (model === 'team') {
    handleTeamInputs();
  } else {
    handleTicketInputs();
  }

  // Watch for solution changes
  $: if (solution) {
    updateSolutionInputs();
  }

  onMount(() => {
    // Initialize tooltips with mobile-friendly configuration
    tippy('[data-tippy-content]', {
      placement: 'auto',
      arrow: true,
      theme: 'light-border',
      delay: [100, 200],
      touch: 'hold',
      maxWidth: 300,
      hideOnClick: false,
      trigger: 'mouseenter focus click',
      interactive: true
    });
  });

  function updateSolution(newSolution: string) {
    const typedSolution = newSolution as SolutionType;
    solution = typedSolution;
    calculatorStore.updateSolutionType(typedSolution);
    
    // Initialize hybrid inputs with current platform/outsource values when switching to hybrid
    if (typedSolution === 'hybrid') {
      hybridInputs = {
        platformPortion: 50,
        vendorPortion: 50,
        baselineCost: 0,
        // Copy platform inputs
        timeToBuild: platformInputs.timeToBuild,
        platformCost: platformInputs.platformCost,
        platformMaintenance: platformInputs.platformMaintenance,
        teamReduction: platformInputs.teamReduction,
        processEfficiency: platformInputs.processEfficiency,
        // Copy outsource inputs
        vendorRate: outsourceInputs.vendorRate,
        managementOverhead: outsourceInputs.managementOverhead,
        qualityImpact: outsourceInputs.qualityImpact,
        knowledgeLoss: outsourceInputs.knowledgeLoss,
        transitionTime: outsourceInputs.transitionTime,
        transitionCost: outsourceInputs.transitionCost
      };
      updateSolutionInputs();
    }
  }

  // Helper function to get timeToBuild value
  function getTimeToBuildValue(currentSolution: SolutionType): number {
    if (isPlatformSolution(currentSolution)) {
      return platformInputs.timeToBuild;
    }
    if (isHybridSolution(currentSolution)) {
      return hybridInputs.timeToBuild;
    }
    return 0; // Default value for other solution types
  }
</script>

<div class="bg-white rounded-xl shadow-lg p-6 space-y-8">
  <!-- Header Section -->
  <div class="bg-gradient-to-r from-secondary/10 to-secondary/5 p-6 rounded-xl border border-secondary/20">
    <h2 class="text-xl font-semibold text-secondary mb-3">Service Delivery Cost Analysis</h2>
    <p class="text-secondary text-sm leading-relaxed">
      {#if model === 'team'}
        Calculate and optimize your service delivery costs based on team composition and operational metrics. 
        This model helps you analyze costs from a workforce perspective and identify opportunities for efficiency improvements.
      {:else}
        Calculate and optimize your service delivery costs based on workload volume and processing requirements. 
        This model helps you analyze costs from a throughput perspective and identify opportunities for process optimization.
      {/if}
    </p>
  </div>

  <!-- Solution Selection Section -->
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Solution Strategy</h3>
        <p class="text-sm text-gray-600 mt-1">Select the approach that best aligns with your goals</p>
      </div>
      <button 
        class="tooltip bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors" 
        data-tippy-content="Choose between platform automation, outsourcing, or a hybrid approach">
        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each ['platform', 'outsource', 'hybrid'] as solutionType}
        <button
          class="solution-card relative p-4 rounded-lg border transition-all transform {
            solution === solutionType
              ? 'active bg-gradient-to-br from-secondary to-secondary text-white shadow-md'
              : 'bg-white text-gray-900 shadow hover:shadow-md'
          }"
          on:click={() => updateSolution(solutionType)}>
          <!-- Solution Icon and Title in one row -->
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-md bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0">
              {#if solutionType === 'platform'}
                <svg class="w-5 h-5 {solution === solutionType ? 'text-white' : 'text-secondary'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              {:else if solutionType === 'outsource'}
                <svg class="w-5 h-5 {solution === solutionType ? 'text-white' : 'text-secondary'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              {:else}
                <svg class="w-5 h-5 {solution === solutionType ? 'text-white' : 'text-secondary'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              {/if}
            </div>
            
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-medium truncate">
                {solutionType === 'platform' ? 'Platform Solution' :
                 solutionType === 'outsource' ? 'Outsourcing Solution' :
                 'Hybrid Solution'}
              </h3>
              <p class="text-xs mt-0.5 {solution === solutionType ? 'text-white text-opacity-90' : 'text-gray-600'}">
                {solutionType === 'platform' ? 'Automate service delivery through platform investment' :
                 solutionType === 'outsource' ? 'Transfer service delivery to external providers' :
                 'Combine platform automation with outsourcing'}
              </p>
            </div>
            
            {#if solution === solutionType}
              <svg class="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Calculator Form -->
  <div class="space-y-8">
    <!-- Base Configuration -->
    <div class="section-container">
      <div class="section-header">
        <div>
          <h3 class="section-title">Current State Analysis</h3>
          <p class="section-subtitle">
            {#if model === 'team'}
              Define your current team structure and operational parameters
            {:else}
              Define your current workload and processing requirements
            {/if}
          </p>
        </div>
        <button 
          class="tooltip bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 transition-colors" 
          data-tippy-content="These values represent your current operational baseline">
          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      
      <div class="grid grid-cols-1 gap-2">
        {#if model === 'team'}
          <!-- Team Model Fields -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="teamSize">
                  Team Size
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Number of full-time employees on the team">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Define the number of employees currently working on service delivery. This helps calculate baseline operational costs.
                </p>
              </div>
              <div class="input-group">
                <input
                  type="number"
                  id="teamSize"
                  bind:value={teamSize}
                  on:input={handleTeamInputs}
                  min={constraints.teamSize.min}
                  max={constraints.teamSize.max}
                  step={constraints.teamSize.step}
                  class="number-input"
                />
                <input
                  type="range"
                  bind:value={teamSize}
                  on:input={handleTeamInputs}
                  min={constraints.teamSize.min}
                  max={constraints.teamSize.max}
                  step={constraints.teamSize.step}
                  class="slider-input"
                />
              </div>
            </div>
          </div>

          <!-- Hourly Rate -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="hourlyRate">
                  Hourly Rate
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Average hourly cost per team member">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Estimate the average hourly cost per employee. This helps calculate total operational costs.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                  <input
                    type="number"
                    id="hourlyRate"
                    bind:value={hourlyRate}
                    on:input={handleTeamInputs}
                    min={constraints.hourlyRate.min}
                    max={constraints.hourlyRate.max}
                    step={constraints.hourlyRate.step}
                    class="number-input pl-6"
                  />
                </div>
                <input
                  type="range"
                  bind:value={hourlyRate}
                  on:input={handleTeamInputs}
                  min={constraints.hourlyRate.min}
                  max={constraints.hourlyRate.max}
                  step={constraints.hourlyRate.step}
                  class="slider-input"
                />
              </div>
            </div>
          </div>

          <!-- Service Efficiency -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="serviceEfficiency">
                  Service Efficiency
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Percentage of time spent on productive work [0-100%]">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Estimate the percentage of time spent on productive work. This helps calculate the number of productive hours.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="serviceEfficiency"
                    value={serviceEfficiency * 100}
                    on:input={(e) => handlePercentageInput(e, 'serviceEfficiency')}
                    min={constraints.serviceEfficiency.min * 100}
                    max={constraints.serviceEfficiency.max * 100}
                    step={constraints.serviceEfficiency.step * 100}
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                </div>
                <input
                  type="range"
                  value={serviceEfficiency * 100}
                  on:input={(e) => handlePercentageInput(e, 'serviceEfficiency')}
                  min={constraints.serviceEfficiency.min * 100}
                  max={constraints.serviceEfficiency.max * 100}
                  step={constraints.serviceEfficiency.step * 100}
                  class="slider-input"
                />
              </div>
            </div>
          </div>

          <!-- Operational Overhead -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="operationalOverhead">
                  Operational Overhead
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Additional costs as a percentage of base costs [0-100%]">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Estimate the percentage of additional costs beyond base costs. This helps calculate total operational costs.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="operationalOverhead"
                    value={operationalOverhead * 100}
                    on:input={(e) => handlePercentageInput(e, 'operationalOverhead')}
                    min={constraints.operationalOverhead.min * 100}
                    max={constraints.operationalOverhead.max * 100}
                    step={constraints.operationalOverhead.step * 100}
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                </div>
                <input
                  type="range"
                  value={operationalOverhead * 100}
                  on:input={(e) => handlePercentageInput(e, 'operationalOverhead')}
                  min={constraints.operationalOverhead.min * 100}
                  max={constraints.operationalOverhead.max * 100}
                  step={constraints.operationalOverhead.step * 100}
                  class="slider-input"
                />
              </div>
            </div>
          </div>
        {:else}
          <!-- Monthly Tickets -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="monthlyTickets">
                  Monthly Tickets
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Average number of tickets processed per month">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Estimate the average number of tickets processed per month. This helps calculate the workload volume.
                </p>
              </div>
              <div class="input-group">
                <input
                  type="number"
                  id="monthlyTickets"
                  bind:value={monthlyTickets}
                  on:input={handleTicketInputs}
                  min={constraints.monthlyTickets.min}
                  max={constraints.monthlyTickets.max}
                  step={constraints.monthlyTickets.step}
                  class="number-input"
                />
                <input
                  type="range"
                  bind:value={monthlyTickets}
                  on:input={handleTicketInputs}
                  min={constraints.monthlyTickets.min}
                  max={constraints.monthlyTickets.max}
                  step={constraints.monthlyTickets.step}
                  class="slider-input"
                />
              </div>
            </div>
          </div>

          <!-- Hours per Ticket -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="hoursPerTicket">
                  Hours per Ticket
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Average time spent processing each ticket">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Estimate the average time spent processing each ticket. This helps calculate the total processing time.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="hoursPerTicket"
                    bind:value={hoursPerTicket}
                    on:input={handleTicketInputs}
                    min={constraints.hoursPerTicket.min}
                    max={constraints.hoursPerTicket.max}
                    step={constraints.hoursPerTicket.step}
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">hrs</span>
                </div>
                <input
                  type="range"
                  bind:value={hoursPerTicket}
                  on:input={handleTicketInputs}
                  min={constraints.hoursPerTicket.min}
                  max={constraints.hoursPerTicket.max}
                  step={constraints.hoursPerTicket.step}
                  class="slider-input"
                />
              </div>
            </div>
          </div>

          <!-- People per Ticket -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="peoplePerTicket">
                  People per Ticket
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Average number of people needed to handle each ticket">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Estimate the average number of people needed to handle each ticket. This helps calculate the total number of people required.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="peoplePerTicket"
                    bind:value={peoplePerTicket}
                    on:input={handleTicketInputs}
                    min={1}
                    max={10}
                    step={1}
                    class="number-input"
                  />
                </div>
                <input
                  type="range"
                  bind:value={peoplePerTicket}
                  on:input={handleTicketInputs}
                  min={1}
                  max={10}
                  step={1}
                  class="slider-input"
                />
              </div>
            </div>
          </div>

          <!-- Vendor Rate -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="vendorRate">
                  Vendor Rate
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Hourly rate charged by external vendors (v)">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Estimate the hourly rate charged by external vendors. This helps calculate the total cost of outsourcing.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                  <input
                    type="number"
                    id="vendorRate"
                    value={solution === 'hybrid' ? hybridInputs.vendorRate : outsourceInputs.vendorRate}
                    on:input={(e) => handleNumericInput(e, 'vendorRate')}
                    min={10}
                    max={150}
                    step={1}
                    class="number-input pl-6"
                  />
                </div>
                <input
                  type="range"
                  value={solution === 'hybrid' ? hybridInputs.vendorRate : outsourceInputs.vendorRate}
                  on:input={(e) => handleNumericInput(e, 'vendorRate')}
                  min={10}
                  max={150}
                  step={1}
                  class="slider-input"
                />
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Solution Configuration -->
    <div class="section-container mt-4">
      <div class="section-header">
        <div>
          <h3 class="section-title">Solution Configuration</h3>
          <p class="section-subtitle">
            {#if solution === 'platform'}
              Configure platform automation parameters
            {:else if solution === 'outsource'}
              Configure outsourcing parameters
            {:else}
              Configure hybrid solution parameters
            {/if}
          </p>
        </div>
      </div>

      {#if solution === 'hybrid'}
        <div class="space-y-4">
          <!-- Work Distribution -->
          <div class="bg-white p-3 rounded-lg border border-gray-200">
            <h4 class="input-section-title">Work Distribution</h4>
            <div class="grid grid-cols-1 gap-2">
              <!-- Platform Portion -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                    <label class="field-label" for="platformPortion">
                      Platform Portion
                      <button 
                        class="tooltip ml-1" 
                        data-tippy-content="Percentage of work handled by the platform">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                      Determine the percentage of work handled by the platform. This helps calculate the platform's contribution to service delivery.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="platformPortion"
                        bind:value={hybridInputs.platformPortion}
                        on:input={(e) => handleNumericInput(e, 'platformPortion')}
                        min={constraints.portion.min}
                        max={constraints.portion.max}
                        step={constraints.portion.step}
                        class="number-input pr-8"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <input
                      type="range"
                      bind:value={hybridInputs.platformPortion}
                      on:input={(e) => handleNumericInput(e, 'platformPortion')}
                      min={constraints.portion.min}
                      max={constraints.portion.max}
                      step={constraints.portion.step}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Vendor Portion -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                    <label class="field-label" for="vendorPortion">
                      Vendor Portion
                      <button 
                        class="tooltip ml-1" 
                        data-tippy-content="Percentage of work handled by vendors">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                      Determine the percentage of work handled by external vendors. This helps calculate the vendor's contribution to service delivery.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="vendorPortion"
                        bind:value={hybridInputs.vendorPortion}
                        on:input={(e) => handleNumericInput(e, 'vendorPortion')}
                        min={constraints.portion.min}
                        max={constraints.portion.max}
                        step={constraints.portion.step}
                        class="number-input pr-8"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <input
                      type="range"
                      bind:value={hybridInputs.vendorPortion}
                      on:input={(e) => handleNumericInput(e, 'vendorPortion')}
                      min={constraints.portion.min}
                      max={constraints.portion.max}
                      step={constraints.portion.step}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Distribution Visualization -->
              <div class="col-span-full mt-4">
                <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    class="h-full bg-secondary transition-all duration-300"
                    style="width: {hybridInputs.platformPortion}%"
                    title="Platform: {hybridInputs.platformPortion}%"
                  ></div>
                  <div
                    class="h-full bg-green-500 transition-all duration-300"
                    style="width: {hybridInputs.vendorPortion}%"
                    title="Vendor: {hybridInputs.vendorPortion}%"
                  ></div>
                  <div
                    class="h-full bg-gray-300 transition-all duration-300"
                    style="width: {100 - hybridInputs.platformPortion - hybridInputs.vendorPortion}%"
                    title="Remaining: {100 - hybridInputs.platformPortion - hybridInputs.vendorPortion}%"
                  ></div>
                </div>
                <div class="flex justify-between mt-2">
                  <span class="text-xs text-secondary">Platform: {hybridInputs.platformPortion}%</span>
                  <span class="text-xs text-green-600">Vendor: {hybridInputs.vendorPortion}%</span>
                  <span class="text-xs text-gray-500">
                    Remaining: {100 - hybridInputs.platformPortion - hybridInputs.vendorPortion}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Platform Component -->
          <div class="hybrid-section hybrid-platform">
            <h4 class="input-section-title text-secondary">Platform Parameters</h4>
            <div class="grid grid-cols-1 gap-2">
              <!-- Platform Cost -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                    <label class="field-label" for="platformCost">
                      Platform Investment
                      <button 
                        class="tooltip ml-1" 
                        data-tippy-content="Initial investment required for platform development (P_i)">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                      Estimate the initial investment required for platform development. This helps calculate the total cost of the platform.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                      <input
                        type="number"
                        id="platformCost"
                        value={isHybridSolution(solution) ? hybridInputs.platformCost : platformInputs.platformCost}
                        on:input={(e) => handleNumericInput(e, 'platformCost')}
                        min={50000}
                        max={500000}
                        step={1000}
                        class="number-input pl-6"
                      />
                    </div>
                    <input
                      type="range"
                      value={isHybridSolution(solution) ? hybridInputs.platformCost : platformInputs.platformCost}
                      on:input={(e) => handleNumericInput(e, 'platformCost')}
                      min={50000}
                      max={500000}
                      step={1000}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Platform Maintenance -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                    <label class="field-label" for="platformMaintenance">
                      Monthly Maintenance
                      <button 
                        class="tooltip ml-1" 
                        data-tippy-content="Monthly cost to maintain the platform (P_m)">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                      Estimate the monthly cost to maintain the platform. This helps calculate the total cost of platform maintenance.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                      <input
                        type="number"
                        id="platformMaintenance"
                        value={isHybridSolution(solution) ? hybridInputs.platformMaintenance : platformInputs.platformMaintenance}
                        on:input={(e) => handleNumericInput(e, 'platformMaintenance')}
                        min={1000}
                        max={10000}
                        step={100}
                        class="number-input pl-6"
                      />
                    </div>
                    <input
                      type="range"
                      value={isHybridSolution(solution) ? hybridInputs.platformMaintenance : platformInputs.platformMaintenance}
                      on:input={(e) => handleNumericInput(e, 'platformMaintenance')}
                      min={1000}
                      max={10000}
                      step={100}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Time to Build (only for platform solution) -->
              {#if isPlatformSolution(solution)}
                <div class="field-container">
                  <div class="flex items-start justify-between">
                    <div>
                      <label class="field-label" for="timeToBuild">
                        Time to Build
                        <button 
                          class="tooltip ml-1" 
                          data-tippy-content="Time required to build the platform in months (T_b)">
                          <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </label>
                      <p class="input-description">
                        Estimate the time required to build the platform. This helps calculate the total time to market.
                      </p>
                    </div>
                    <div class="input-group">
                      <div class="relative">
                        <input
                          type="number"
                          id="timeToBuild"
                          value={getTimeToBuildValue(solution)}
                          on:input={(e) => handleNumericInput(e, 'timeToBuild')}
                          min={1}
                          max={12}
                          step={1}
                          class="number-input pr-8"
                        />
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">mo</span>
                      </div>
                      <input
                        type="range"
                        value={getTimeToBuildValue(solution)}
                        on:input={(e) => handleNumericInput(e, 'timeToBuild')}
                        min={1}
                        max={12}
                        step={1}
                        class="slider-input"
                      />
                    </div>
                  </div>
                </div>

                <!-- Team Reduction -->
                <div class="field-container">
                  <div class="flex items-start justify-between">
                    <div>
                      <label class="field-label" for="teamReduction">
                        Team Reduction
                        <button 
                          class="tooltip ml-1" 
                          data-tippy-content="Expected reduction in team size through automation [0-100%]">
                          <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </label>
                      <p class="input-description">
                        Estimate the expected reduction in team size through automation. This helps calculate the number of employees that can be reduced.
                      </p>
                    </div>
                    <div class="input-group">
                      <div class="relative">
                        <input
                          type="number"
                          id="teamReduction"
                          value={platformInputs.teamReduction * 100}
                          on:input={(e) => handlePercentageInput(e, 'teamReduction')}
                          min={constraints.teamReduction.min * 100}
                          max={constraints.teamReduction.max * 100}
                          step={constraints.teamReduction.step * 100}
                          class="number-input pr-8"
                        />
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                      </div>
                      <input
                        type="range"
                        value={platformInputs.teamReduction * 100}
                        on:input={(e) => handlePercentageInput(e, 'teamReduction')}
                        min={constraints.teamReduction.min * 100}
                        max={constraints.teamReduction.max * 100}
                        step={constraints.teamReduction.step * 100}
                        class="slider-input"
                      />
                    </div>
                  </div>
                </div>
              {/if}

              <!-- Process Efficiency -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                    <label class="field-label" for="processEfficiency">
                      Process Efficiency
                      <button 
                        class="tooltip ml-1" 
                        data-tippy-content="Expected improvement in process efficiency [0-100%]">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                      Estimate the expected improvement in process efficiency. This helps calculate the potential increase in productivity.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="processEfficiency"
                        value={isHybridSolution(solution) ? hybridInputs.processEfficiency * 100 : platformInputs.processEfficiency * 100}
                        on:input={(e) => handlePercentageInput(e, 'processEfficiency')}
                        min={constraints.processEfficiency.min * 100}
                        max={constraints.processEfficiency.max * 100}
                        step={constraints.processEfficiency.step * 100}
                        class="number-input pr-8"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <input
                      type="range"
                      value={isHybridSolution(solution) ? hybridInputs.processEfficiency * 100 : platformInputs.processEfficiency * 100}
                      on:input={(e) => handlePercentageInput(e, 'processEfficiency')}
                      min={constraints.processEfficiency.min * 100}
                      max={constraints.processEfficiency.max * 100}
                      step={constraints.processEfficiency.step * 100}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Outsourcing Component -->
          <div class="hybrid-section hybrid-outsource">
            <h4 class="input-section-title text-green-600">Outsourcing Parameters</h4>
            <div class="grid grid-cols-1 gap-2">
              <!-- Management Overhead -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                    <label class="field-label" for="managementOverhead">
                      Management Overhead
                      <button 
                        class="tooltip ml-1" 
                        data-tippy-content="Additional overhead for managing outsourced work [0-100%]">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                      Estimate the additional overhead for managing outsourced work. This helps calculate the total cost of outsourcing.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="managementOverhead"
                        value={isHybridSolution(solution) ? hybridInputs.managementOverhead * 100 : outsourceInputs.managementOverhead * 100}
                        on:input={(e) => handlePercentageInput(e, 'managementOverhead')}
                        min={constraints.managementOverhead.min * 100}
                        max={constraints.managementOverhead.max * 100}
                        step={constraints.managementOverhead.step * 100}
                        class="number-input pr-8"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <input
                      type="range"
                      value={isHybridSolution(solution) ? hybridInputs.managementOverhead * 100 : outsourceInputs.managementOverhead * 100}
                      on:input={(e) => handlePercentageInput(e, 'managementOverhead')}
                      min={constraints.managementOverhead.min * 100}
                      max={constraints.managementOverhead.max * 100}
                      step={constraints.managementOverhead.step * 100}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Quality Impact -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                    <label class="field-label" for="qualityImpact">
                      Quality Impact
                      <button 
                        class="tooltip ml-1" 
                        data-tippy-content="Expected impact on service quality [-50% to +50%]">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                      Estimate the expected impact on service quality. This helps calculate the potential increase or decrease in service quality.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="qualityImpact"
                        value={isHybridSolution(solution) ? hybridInputs.qualityImpact * 100 : outsourceInputs.qualityImpact * 100}
                        on:input={(e) => handlePercentageInput(e, 'qualityImpact')}
                        min={constraints.qualityImpact.min * 100}
                        max={constraints.qualityImpact.max * 100}
                        step={constraints.qualityImpact.step * 100}
                        class="number-input pr-8"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <input
                      type="range"
                      value={isHybridSolution(solution) ? hybridInputs.qualityImpact * 100 : outsourceInputs.qualityImpact * 100}
                      on:input={(e) => handlePercentageInput(e, 'qualityImpact')}
                      min={constraints.qualityImpact.min * 100}
                      max={constraints.qualityImpact.max * 100}
                      step={constraints.qualityImpact.step * 100}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Knowledge Loss -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                    <label class="field-label" for="knowledgeLoss">
                      Knowledge Loss
                      <button 
                        class="tooltip ml-1" 
                        data-tippy-content="Expected knowledge loss during transition [0-100%]">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                      Estimate the expected knowledge loss during the transition to outsourcing. This helps calculate the potential loss of expertise.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="knowledgeLoss"
                        value={isHybridSolution(solution) ? hybridInputs.knowledgeLoss * 100 : outsourceInputs.knowledgeLoss * 100}
                        on:input={(e) => handlePercentageInput(e, 'knowledgeLoss')}
                        min={constraints.knowledgeLoss.min * 100}
                        max={constraints.knowledgeLoss.max * 100}
                        step={constraints.knowledgeLoss.step * 100}
                        class="number-input pr-8"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <input
                      type="range"
                      value={isHybridSolution(solution) ? hybridInputs.knowledgeLoss * 100 : outsourceInputs.knowledgeLoss * 100}
                      on:input={(e) => handlePercentageInput(e, 'knowledgeLoss')}
                      min={constraints.knowledgeLoss.min * 100}
                      max={constraints.knowledgeLoss.max * 100}
                      step={constraints.knowledgeLoss.step * 100}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Transition Time -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                    <label class="field-label" for="transitionTime">
                      Transition Time
                      <button 
                        class="tooltip ml-1" 
                        data-tippy-content="Time required for transition in months (T_t)">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                      Estimate the time required for the transition to outsourcing. This helps calculate the total time to transition.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="transitionTime"
                        value={isHybridSolution(solution) ? hybridInputs.transitionTime : outsourceInputs.transitionTime}
                        on:input={(e) => handleNumericInput(e, 'transitionTime')}
                        min={1}
                        max={12}
                        step={1}
                        class="number-input pr-8"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">mo</span>
                    </div>
                    <input
                      type="range"
                      value={isHybridSolution(solution) ? hybridInputs.transitionTime : outsourceInputs.transitionTime}
                      on:input={(e) => handleNumericInput(e, 'transitionTime')}
                      min={1}
                      max={12}
                      step={1}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Transition Cost -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                    <label class="field-label" for="transitionCost">
                      Transition Cost
                      <button 
                        class="tooltip ml-1" 
                        data-tippy-content="One-time cost for transitioning to outsourced solution (O_t)">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                      Estimate the one-time cost for transitioning to the outsourced solution. This helps calculate the total cost of transitioning.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                      <input
                        type="number"
                        id="transitionCost"
                        value={isHybridSolution(solution) ? hybridInputs.transitionCost : outsourceInputs.transitionCost}
                        on:input={(e) => handleNumericInput(e, 'transitionCost')}
                        min={0}
                        max={100000}
                        step={1000}
                        class="number-input pl-6"
                      />
                    </div>
                    <input
                      type="range"
                      value={isHybridSolution(solution) ? hybridInputs.transitionCost : outsourceInputs.transitionCost}
                      on:input={(e) => handleNumericInput(e, 'transitionCost')}
                      min={0}
                      max={100000}
                      step={1000}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-1 gap-2">
          <!-- Platform Cost -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="platformCost">
                  Platform Investment
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Initial investment required for platform development (P_i)">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Estimate the initial investment required for platform development. This helps calculate the total cost of the platform.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                  <input
                    type="number"
                    id="platformCost"
                    value={isHybridSolution(solution) ? hybridInputs.platformCost : platformInputs.platformCost}
                    on:input={(e) => handleNumericInput(e, 'platformCost')}
                    min={50000}
                    max={500000}
                    step={1000}
                    class="number-input pl-6"
                  />
                </div>
                <input
                  type="range"
                  value={isHybridSolution(solution) ? hybridInputs.platformCost : platformInputs.platformCost}
                  on:input={(e) => handleNumericInput(e, 'platformCost')}
                  min={50000}
                  max={500000}
                  step={1000}
                  class="slider-input"
                />
              </div>
            </div>
          </div>

          <!-- Platform Maintenance -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="platformMaintenance">
                  Monthly Maintenance
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Monthly cost to maintain the platform (P_m)">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Estimate the monthly cost to maintain the platform. This helps calculate the total cost of platform maintenance.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                  <input
                    type="number"
                    id="platformMaintenance"
                    value={isHybridSolution(solution) ? hybridInputs.platformMaintenance : platformInputs.platformMaintenance}
                    on:input={(e) => handleNumericInput(e, 'platformMaintenance')}
                    min={1000}
                    max={10000}
                    step={100}
                    class="number-input pl-6"
                  />
                </div>
                <input
                  type="range"
                  value={isHybridSolution(solution) ? hybridInputs.platformMaintenance : platformInputs.platformMaintenance}
                  on:input={(e) => handleNumericInput(e, 'platformMaintenance')}
                  min={1000}
                  max={10000}
                  step={100}
                  class="slider-input"
                />
              </div>
            </div>
          </div>

          <!-- Time to Build (only for platform solution) -->
          {#if isPlatformSolution(solution)}
            <div class="field-container">
              <div class="flex items-start justify-between">
                <div>
                  <label class="field-label" for="timeToBuild">
                    Time to Build
                    <button 
                      class="tooltip ml-1" 
                      data-tippy-content="Time required to build the platform in months (T_b)">
                      <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </label>
                  <p class="input-description">
                    Estimate the time required to build the platform. This helps calculate the total time to market.
                  </p>
                </div>
                <div class="input-group">
                  <div class="relative">
                    <input
                      type="number"
                      id="timeToBuild"
                      value={getTimeToBuildValue(solution)}
                      on:input={(e) => handleNumericInput(e, 'timeToBuild')}
                      min={1}
                      max={12}
                      step={1}
                      class="number-input pr-8"
                    />
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">mo</span>
                  </div>
                  <input
                    type="range"
                    value={getTimeToBuildValue(solution)}
                    on:input={(e) => handleNumericInput(e, 'timeToBuild')}
                    min={1}
                    max={12}
                    step={1}
                    class="slider-input"
                  />
                </div>
              </div>
            </div>

            <!-- Team Reduction -->
            <div class="field-container">
              <div class="flex items-start justify-between">
                <div>
                  <label class="field-label" for="teamReduction">
                    Team Reduction
                    <button 
                      class="tooltip ml-1" 
                      data-tippy-content="Expected reduction in team size through automation [0-100%]">
                      <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </label>
                  <p class="input-description">
                    Estimate the expected reduction in team size through automation. This helps calculate the number of employees that can be reduced.
                  </p>
                </div>
                <div class="input-group">
                  <div class="relative">
                    <input
                      type="number"
                      id="teamReduction"
                      value={platformInputs.teamReduction * 100}
                      on:input={(e) => handlePercentageInput(e, 'teamReduction')}
                      min={constraints.teamReduction.min * 100}
                      max={constraints.teamReduction.max * 100}
                      step={constraints.teamReduction.step * 100}
                      class="number-input pr-8"
                    />
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                  </div>
                  <input
                    type="range"
                    value={platformInputs.teamReduction * 100}
                    on:input={(e) => handlePercentageInput(e, 'teamReduction')}
                    min={constraints.teamReduction.min * 100}
                    max={constraints.teamReduction.max * 100}
                    step={constraints.teamReduction.step * 100}
                    class="slider-input"
                  />
                </div>
              </div>
            </div>
          {/if}

          <!-- Process Efficiency -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="processEfficiency">
                  Process Efficiency
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Expected improvement in process efficiency [0-100%]">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Estimate the expected improvement in process efficiency. This helps calculate the potential increase in productivity.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="processEfficiency"
                    value={isHybridSolution(solution) ? hybridInputs.processEfficiency * 100 : platformInputs.processEfficiency * 100}
                    on:input={(e) => handlePercentageInput(e, 'processEfficiency')}
                    min={constraints.processEfficiency.min * 100}
                    max={constraints.processEfficiency.max * 100}
                    step={constraints.processEfficiency.step * 100}
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                </div>
                <input
                  type="range"
                  value={isHybridSolution(solution) ? hybridInputs.processEfficiency * 100 : platformInputs.processEfficiency * 100}
                  on:input={(e) => handlePercentageInput(e, 'processEfficiency')}
                  min={constraints.processEfficiency.min * 100}
                  max={constraints.processEfficiency.max * 100}
                  step={constraints.processEfficiency.step * 100}
                  class="slider-input"
                />
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Compact container styles */
  .field-container {
    @apply bg-white p-3 rounded-lg border border-gray-100 hover:border-secondary/20 
           transition-all duration-300 shadow-sm hover:shadow-md w-full mb-3 overflow-hidden;
  }

  /* Responsive layout container */
  .field-container > div {
    @apply flex flex-col lg:grid lg:grid-cols-[33%_minmax(250px,1fr)_100px] items-start gap-2 lg:gap-4;
  }

  /* Label and description container */
  .field-info {
    @apply w-full lg:w-auto flex flex-col justify-start pr-2 lg:pr-4 mb-2 lg:mb-0;
  }

  /* Compact label styles */
  .field-label {
    @apply flex items-center text-xs font-medium text-gray-700 mb-1;
  }

  /* Compact input group styles */
  .input-group {
    @apply flex flex-row items-center gap-2 w-full lg:col-span-2 min-w-0;
  }

  /* Slider container */
  .slider-container {
    @apply flex-grow min-w-0;
  }

  /* Value container */
  .value-container {
    @apply flex justify-end w-[80px] lg:w-[100px] flex-shrink-0;
  }

  /* Compact number input styles */
  .number-input {
    @apply w-[80px] px-2 py-1 text-right text-gray-700 bg-gray-50 border border-gray-200 
           rounded-md focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-transparent
           transition-all duration-200 text-xs font-medium tracking-wide flex-shrink-0;
  }

  /* Compact slider styles */
  .slider-input {
    @apply w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer
           focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:ring-offset-1 min-w-0;
  }

  /* Compact thumb styles */
  .slider-input::-webkit-slider-thumb {
    @apply w-2.5 h-2.5 bg-secondary rounded-full border border-white shadow-sm appearance-none cursor-pointer
           hover:scale-125 transition-transform duration-200;
  }

  .slider-input::-moz-range-thumb {
    @apply w-2.5 h-2.5 bg-secondary rounded-full border border-white shadow-sm appearance-none cursor-pointer
           hover:scale-125 transition-transform duration-200;
  }

  /* Compact description styles */
  .input-description {
    @apply text-[11px] text-gray-500 mt-1 leading-tight;
  }

  /* Section styles */
  .section-container {
    @apply bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-secondary/20 
           transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden;
  }

  /* Section header styles */
  .section-header {
    @apply flex flex-wrap items-start justify-between mb-4 pb-2 border-b border-gray-200 gap-2;
  }

  .section-title {
    @apply text-sm font-semibold text-gray-900;
  }

  .section-subtitle {
    @apply text-xs text-gray-600 mt-0.5;
  }

  /* Input section styles */
  .input-section {
    @apply space-y-2;
  }

  .input-section-title {
    @apply text-xs font-medium text-gray-700 mb-2;
  }

  /* Hybrid section styles */
  .hybrid-section {
    @apply bg-white p-3 rounded-lg border-l-2 border shadow-sm hover:shadow-md 
           transition-all duration-300 mb-4 overflow-hidden;
  }

  .hybrid-platform {
    @apply border-secondary bg-secondary/5;
  }

  .hybrid-outsource {
    @apply border-green-500 bg-green-50/50;
  }

  /* Distribution bar styles */
  .distribution-bar {
    @apply h-1.5 rounded-full overflow-hidden shadow-inner bg-opacity-50 mt-2;
  }

  .distribution-labels {
    @apply flex flex-wrap justify-between mt-1 text-[10px] font-medium gap-1;
  }
</style> 