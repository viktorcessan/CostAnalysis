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

  function handleSolutionChange(newSolution: SolutionType) {
    solution = newSolution;
    calculatorStore.updateSolutionType(solution);
    
    // Initialize hybrid inputs with current platform/outsource values when switching to hybrid
    if (newSolution === 'hybrid') {
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

  function updateSolutionInputs() {
    calculatorStore.updateSolutionInputs({
      type: solution,
      platform: solution === 'platform' ? platformInputs : undefined,
      outsource: solution === 'outsource' ? outsourceInputs : undefined,
      hybrid: solution === 'hybrid' ? hybridInputs : undefined
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
</script>

<div class="bg-white rounded-xl shadow-lg p-4 space-y-6">
  <!-- Model Description -->
  <div class="bg-gradient-to-r from-secondary/10 to-secondary/5 p-2 rounded-lg border border-secondary/20">
    <p class="text-secondary text-xs leading-relaxed">
      {#if model === 'team'}
        Calculate costs based on your team size and operational metrics
      {:else}
        Calculate costs based on ticket volume and processing requirements
      {/if}
    </p>
  </div>

  <!-- Solution Selection Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

  <!-- Calculator Form -->
  <div class="space-y-6">
    <!-- Base Configuration -->
    <div>
      <h3 class="text-sm font-semibold text-gray-900 mb-4">Base Configuration</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {#if model === 'team'}
          <!-- Team Model Fields -->
          <div class="field-container">
            <label class="field-label" for="teamSize">
              Team Size
              <button 
                class="tooltip" 
                data-tippy-content="Number of full-time employees on the team"
                aria-label="Information about team size">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
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

          <!-- Hourly Rate -->
          <div class="field-container">
            <label class="field-label" for="hourlyRate">
              Hourly Rate
              <button 
                class="tooltip" 
                data-tippy-content="Average hourly cost per team member"
                aria-label="Information about hourly rate">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
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

          <!-- Service Efficiency -->
          <div class="field-container">
            <label class="field-label" for="serviceEfficiency">
              Service Efficiency
              <button 
                class="tooltip" 
                data-tippy-content="Percentage of time spent on productive work [0-100%]"
                aria-label="Information about service efficiency">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
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

          <!-- Operational Overhead -->
          <div class="field-container">
            <label class="field-label" for="operationalOverhead">
              Operational Overhead
              <button 
                class="tooltip" 
                data-tippy-content="Additional costs as a percentage of base costs [0-100%]"
                aria-label="Information about operational overhead">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
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
        {:else}
          <!-- Monthly Tickets -->
          <div class="field-container">
            <label class="field-label" for="monthlyTickets">
              Monthly Tickets
              <button 
                class="tooltip" 
                data-tippy-content="Average number of tickets processed per month"
                aria-label="Information about monthly tickets">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
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

          <!-- Hours per Ticket -->
          <div class="field-container">
            <label class="field-label" for="hoursPerTicket">
              Hours per Ticket
              <button 
                class="tooltip" 
                data-tippy-content="Average time spent processing each ticket"
                aria-label="Information about hours per ticket">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
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

          <!-- People per Ticket -->
          <div class="field-container">
            <label class="field-label" for="peoplePerTicket">
              People per Ticket
              <button 
                class="tooltip" 
                data-tippy-content="Average number of people needed to handle each ticket"
                aria-label="Information about people per ticket">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
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

          <!-- Vendor Rate -->
          <div class="field-container">
            <label class="field-label" for="vendorRate">
              Vendor Rate
              <button 
                class="tooltip" 
                data-tippy-content="Hourly rate charged by external vendors (v)"
                aria-label="Information about vendor rate">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
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
        {/if}
      </div>
    </div>

    <!-- Solution Configuration -->
    <div>
      <h3 class="text-sm font-semibold text-gray-900 mb-4">Solution Configuration</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {#if solution === 'platform' || solution === 'hybrid'}
          <!-- Platform Cost -->
          <div class="field-container">
            <label class="field-label" for="platformCost">
              Platform Investment
              <button 
                class="tooltip" 
                data-tippy-content="Initial investment required for platform development (P_i)"
                aria-label="Information about platform investment">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <div class="input-group">
              <div class="relative">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  id="platformCost"
                  value={solution === 'hybrid' ? hybridInputs.platformCost : platformInputs.platformCost}
                  on:input={(e) => handleNumericInput(e, 'platformCost')}
                  min={50000}
                  max={500000}
                  step={1000}
                  class="number-input pl-6"
                />
              </div>
              <input
                type="range"
                value={solution === 'hybrid' ? hybridInputs.platformCost : platformInputs.platformCost}
                on:input={(e) => handleNumericInput(e, 'platformCost')}
                min={50000}
                max={500000}
                step={1000}
                class="slider-input"
              />
            </div>
          </div>

          <!-- Platform Maintenance -->
          <div class="field-container">
            <label class="field-label" for="platformMaintenance">
              Monthly Maintenance
              <button 
                class="tooltip" 
                data-tippy-content="Monthly cost to maintain the platform (P_m)"
                aria-label="Information about monthly maintenance">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <div class="input-group">
              <div class="relative">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  id="platformMaintenance"
                  value={solution === 'hybrid' ? hybridInputs.platformMaintenance : platformInputs.platformMaintenance}
                  on:input={(e) => handleNumericInput(e, 'platformMaintenance')}
                  min={1000}
                  max={10000}
                  step={100}
                  class="number-input pl-6"
                />
              </div>
              <input
                type="range"
                value={solution === 'hybrid' ? hybridInputs.platformMaintenance : platformInputs.platformMaintenance}
                on:input={(e) => handleNumericInput(e, 'platformMaintenance')}
                min={1000}
                max={10000}
                step={100}
                class="slider-input"
              />
            </div>
          </div>

          <!-- Time to Build (only for platform solution) -->
          {#if solution === 'platform'}
            <div class="field-container">
              <label class="field-label" for="timeToBuild">
                Time to Build
                <button 
                  class="tooltip" 
                  data-tippy-content="Time required to build the platform in months (T_b)"
                  aria-label="Information about time to build">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="timeToBuild"
                    value={solution === 'hybrid' ? hybridInputs.timeToBuild : platformInputs.timeToBuild}
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
                  value={solution === 'hybrid' ? hybridInputs.timeToBuild : platformInputs.timeToBuild}
                  on:input={(e) => handleNumericInput(e, 'timeToBuild')}
                  min={1}
                  max={12}
                  step={1}
                  class="slider-input"
                />
              </div>
            </div>

            <!-- Team Reduction -->
            <div class="field-container">
              <label class="field-label" for="teamReduction">
                Team Reduction
                <button 
                  class="tooltip" 
                  data-tippy-content="Expected reduction in team size through automation [0-100%]"
                  aria-label="Information about team reduction">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
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
          {/if}

          <!-- Process Efficiency -->
          <div class="field-container">
            <label class="field-label" for="processEfficiency">
              Process Efficiency
              <button 
                class="tooltip" 
                data-tippy-content="Expected improvement in process efficiency [0-100%]"
                aria-label="Information about process efficiency">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <div class="input-group">
              <div class="relative">
                <input
                  type="number"
                  id="processEfficiency"
                  value={solution === 'hybrid' ? hybridInputs.processEfficiency * 100 : platformInputs.processEfficiency * 100}
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
                value={solution === 'hybrid' ? hybridInputs.processEfficiency * 100 : platformInputs.processEfficiency * 100}
                on:input={(e) => handlePercentageInput(e, 'processEfficiency')}
                min={constraints.processEfficiency.min * 100}
                max={constraints.processEfficiency.max * 100}
                step={constraints.processEfficiency.step * 100}
                class="slider-input"
              />
            </div>
          </div>
        {/if}

        {#if solution === 'outsource' || solution === 'hybrid'}
          <!-- Management Overhead -->
          <div class="field-container">
            <label class="field-label" for="managementOverhead">
              Management Overhead
              <button 
                class="tooltip" 
                data-tippy-content="Additional overhead for managing outsourced work [0-100%]"
                aria-label="Information about management overhead">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <div class="input-group">
              <div class="relative">
                <input
                  type="number"
                  id="managementOverhead"
                  value={solution === 'hybrid' ? hybridInputs.managementOverhead * 100 : outsourceInputs.managementOverhead * 100}
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
                value={solution === 'hybrid' ? hybridInputs.managementOverhead * 100 : outsourceInputs.managementOverhead * 100}
                on:input={(e) => handlePercentageInput(e, 'managementOverhead')}
                min={constraints.managementOverhead.min * 100}
                max={constraints.managementOverhead.max * 100}
                step={constraints.managementOverhead.step * 100}
                class="slider-input"
              />
            </div>
          </div>

          <!-- Quality Impact -->
          <div class="field-container">
            <label class="field-label" for="qualityImpact">
              Quality Impact
              <button 
                class="tooltip" 
                data-tippy-content="Expected impact on service quality [-50% to +50%]"
                aria-label="Information about quality impact">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <div class="input-group">
              <div class="relative">
                <input
                  type="number"
                  id="qualityImpact"
                  value={solution === 'hybrid' ? hybridInputs.qualityImpact * 100 : outsourceInputs.qualityImpact * 100}
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
                value={solution === 'hybrid' ? hybridInputs.qualityImpact * 100 : outsourceInputs.qualityImpact * 100}
                on:input={(e) => handlePercentageInput(e, 'qualityImpact')}
                min={constraints.qualityImpact.min * 100}
                max={constraints.qualityImpact.max * 100}
                step={constraints.qualityImpact.step * 100}
                class="slider-input"
              />
            </div>
          </div>

          <!-- Knowledge Loss -->
          <div class="field-container">
            <label class="field-label" for="knowledgeLoss">
              Knowledge Loss
              <button 
                class="tooltip" 
                data-tippy-content="Expected knowledge loss during transition [0-100%]"
                aria-label="Information about knowledge loss">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <div class="input-group">
              <div class="relative">
                <input
                  type="number"
                  id="knowledgeLoss"
                  value={solution === 'hybrid' ? hybridInputs.knowledgeLoss * 100 : outsourceInputs.knowledgeLoss * 100}
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
                value={solution === 'hybrid' ? hybridInputs.knowledgeLoss * 100 : outsourceInputs.knowledgeLoss * 100}
                on:input={(e) => handlePercentageInput(e, 'knowledgeLoss')}
                min={constraints.knowledgeLoss.min * 100}
                max={constraints.knowledgeLoss.max * 100}
                step={constraints.knowledgeLoss.step * 100}
                class="slider-input"
              />
            </div>
          </div>

          <!-- Transition Time -->
          <div class="field-container">
            <label class="field-label" for="transitionTime">
              Transition Time
              <button 
                class="tooltip" 
                data-tippy-content="Time required for transition in months (T_t)"
                aria-label="Information about transition time">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <div class="input-group">
              <div class="relative">
                <input
                  type="number"
                  id="transitionTime"
                  value={solution === 'hybrid' ? hybridInputs.transitionTime : outsourceInputs.transitionTime}
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
                value={solution === 'hybrid' ? hybridInputs.transitionTime : outsourceInputs.transitionTime}
                on:input={(e) => handleNumericInput(e, 'transitionTime')}
                min={1}
                max={12}
                step={1}
                class="slider-input"
              />
            </div>
          </div>

          <!-- Transition Cost -->
          <div class="field-container">
            <label class="field-label" for="transitionCost">
              Transition Cost
              <button 
                class="tooltip" 
                data-tippy-content="One-time cost for transitioning to outsourced solution (O_t)"
                aria-label="Information about transition cost">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <div class="input-group">
              <div class="relative">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  id="transitionCost"
                  value={solution === 'hybrid' ? hybridInputs.transitionCost : outsourceInputs.transitionCost}
                  on:input={(e) => handleNumericInput(e, 'transitionCost')}
                  min={0}
                  max={100000}
                  step={1000}
                  class="number-input pl-6"
                />
              </div>
              <input
                type="range"
                value={solution === 'hybrid' ? hybridInputs.transitionCost : outsourceInputs.transitionCost}
                on:input={(e) => handleNumericInput(e, 'transitionCost')}
                min={0}
                max={100000}
                step={1000}
                class="slider-input"
              />
            </div>
          </div>
        {/if}

        {#if solution === 'hybrid'}
          <!-- Work Distribution -->
          <div class="col-span-full">
            <h4 class="text-sm font-medium text-gray-900 mb-4">Work Distribution</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Platform Portion -->
              <div class="field-container">
                <label class="field-label" for="platformPortion">
                  Platform Portion
                  <button 
                    class="tooltip" 
                    data-tippy-content="Percentage of work handled by the platform"
                    aria-label="Information about platform portion">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
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

              <!-- Vendor Portion -->
              <div class="field-container">
                <label class="field-label" for="vendorPortion">
                  Vendor Portion
                  <button 
                    class="tooltip" 
                    data-tippy-content="Percentage of work handled by vendors"
                    aria-label="Information about vendor portion">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
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
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .field-container {
    @apply bg-white p-2 rounded-lg border border-gray-100 hover:border-secondary/20 transition-colors duration-200;
  }

  .field-label {
    @apply flex items-center justify-between text-xs font-medium text-gray-700 mb-1;
  }

  .input-group {
    @apply space-y-2;
  }

  .number-input {
    @apply w-full px-2 py-1 text-right text-gray-700 bg-gray-50 border border-gray-200 
           rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-transparent
           transition-all duration-200 text-xs;
  }

  .slider-input {
    @apply w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer
           focus:outline-none focus:ring-1 focus:ring-secondary focus:ring-offset-1;
  }

  /* Slider thumb styles */
  .slider-input::-webkit-slider-thumb {
    @apply w-4 h-4 bg-secondary rounded-full border-none appearance-none cursor-pointer;
  }

  .slider-input::-moz-range-thumb {
    @apply w-4 h-4 bg-secondary rounded-full border-none appearance-none cursor-pointer;
  }

  /* Scale transform on hover */
  button:hover {
    transform: scale(1.02);
  }

  /* Additional styles for currency inputs */
  .number-input.pl-6 {
    padding-left: 1.5rem;
  }

  .number-input.pr-8 {
    padding-right: 2rem;
  }

  /* Distribution visualization */
  .bg-secondary {
    background-color: #dd9933;
  }

  .bg-green-500 {
    @apply transition-all duration-300;
  }

  .bg-gray-300 {
    @apply transition-all duration-300;
  }

  /* Update hover scale for solution cards */
  .solution-card:hover {
    transform: scale(1.02);
  }

  .solution-card.active {
    transform: scale(1.05);
  }
</style> 