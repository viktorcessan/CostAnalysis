<!-- CalculatorForm.svelte -->
<script context="module">
  function roundToStep(value: number, step: number): number {
    return Math.round(value / step) * step;
  }
</script>

<script lang="ts">
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import { currencyStore, type Currency, currencyConfigs } from '$lib/stores/currencyStore';
  import type { CalculatorModel, SolutionType, PlatformInputs, OutsourceInputs, HybridInputs } from '$lib/types/calculator';
  import { onMount } from 'svelte';
  import type { Instance as TippyInstance } from 'tippy.js';
  import tippy from 'tippy.js';
  import 'tippy.js/dist/tippy.css';
  import 'tippy.js/themes/light-border.css';

  // Initialize variables before store subscription
  let model: CalculatorModel = 'team';
  let solution: SolutionType = 'platform';
  
  // Team model inputs
  let teamSize = 5;
  let hourlyRate = 75;
  let serviceEfficiency = 0.6;
  let operationalOverhead = 0.2;

  // Ticket model inputs
  let monthlyTickets = 50;
  let hoursPerTicket = 4;
  let peoplePerTicket = 2;
  let slaCompliance = 95;

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

  // Local state for percentage values (0-100 integers)
  let serviceEfficiencyPercent = Math.round(serviceEfficiency * 100);
  let operationalOverheadPercent = Math.round(operationalOverhead * 100);
  let teamReductionPercent = Math.round(platformInputs.teamReduction * 100);
  let processEfficiencyPercent = Math.round(platformInputs.processEfficiency * 100);
  let managementOverheadPercent = Math.round(outsourceInputs.managementOverhead * 100);
  let qualityImpactPercent = Math.round(outsourceInputs.qualityImpact * 100);
  let knowledgeLossPercent = Math.round(outsourceInputs.knowledgeLoss * 100);

  // Base constraints (USD values)
  const baseConstraints = {
    teamSize: { min: 1, max: 15, step: 1 },
    hourlyRate: { min: 10, max: 150, step: 5 },
    serviceEfficiency: { min: 0, max: 100, step: 1 },
    operationalOverhead: { min: 0, max: 100, step: 1 },
    monthlyTickets: { min: 1, max: 250, step: 1 },
    hoursPerTicket: { min: 0.1, max: 100, step: 0.1 },
    peoplePerTicket: { min: 1, max: 10, step: 1 },
    vendorRate: { min: 10, max: 150, step: 5 },
    platformCost: { min: 50000, max: 500000, step: 10000 },
    platformMaintenance: { min: 1000, max: 10000, step: 100 },
    timeToBuild: { min: 1, max: 12, step: 1 },
    teamReduction: { min: 0, max: 100, step: 1 },
    processEfficiency: { min: 0, max: 100, step: 1 },
    managementOverhead: { min: 0, max: 100, step: 1 },
    qualityImpact: { min: -50, max: 50, step: 1 },
    knowledgeLoss: { min: 0, max: 100, step: 1 },
    transitionTime: { min: 1, max: 12, step: 1 },
    transitionCost: { min: 0, max: 100000, step: 1000 },
    portion: { min: 0, max: 100, step: 5 }
  };

  // Current constraints that will be updated based on currency
  let constraints = { ...baseConstraints };
  let previousMultiplier = 1;

  // Subscribe to currency changes and update constraints
  $: {
    const multiplier = $currencyStore.multiplier;
    if (multiplier !== previousMultiplier) {
      const ratio = multiplier / previousMultiplier;
      
      // Update monetary values
      hourlyRate = Math.round(hourlyRate * ratio);
      if (platformInputs) {
        platformInputs.platformCost = Math.round(platformInputs.platformCost * ratio);
        platformInputs.platformMaintenance = Math.round(platformInputs.platformMaintenance * ratio);
      }
      if (outsourceInputs) {
        outsourceInputs.vendorRate = Math.round(outsourceInputs.vendorRate * ratio);
        outsourceInputs.transitionCost = Math.round(outsourceInputs.transitionCost * ratio);
      }
      if (hybridInputs) {
        hybridInputs.platformCost = Math.round(hybridInputs.platformCost * ratio);
        hybridInputs.platformMaintenance = Math.round(hybridInputs.platformMaintenance * ratio);
        hybridInputs.vendorRate = Math.round(hybridInputs.vendorRate * ratio);
        hybridInputs.transitionCost = Math.round(hybridInputs.transitionCost * ratio);
      }

      // Update constraints for monetary fields
      constraints = {
        ...baseConstraints,
        hourlyRate: {
          min: Math.round(baseConstraints.hourlyRate.min * multiplier),
          max: Math.round(baseConstraints.hourlyRate.max * multiplier),
          step: Math.round(baseConstraints.hourlyRate.step * multiplier)
        },
        vendorRate: {
          min: Math.round(baseConstraints.vendorRate.min * multiplier),
          max: Math.round(baseConstraints.vendorRate.max * multiplier),
          step: Math.round(baseConstraints.vendorRate.step * multiplier)
        },
        platformCost: {
          min: Math.round(baseConstraints.platformCost.min * multiplier),
          max: Math.round(baseConstraints.platformCost.max * multiplier),
          step: Math.round(baseConstraints.platformCost.step * multiplier)
        },
        platformMaintenance: {
          min: Math.round(baseConstraints.platformMaintenance.min * multiplier),
          max: Math.round(baseConstraints.platformMaintenance.max * multiplier),
          step: Math.round(baseConstraints.platformMaintenance.step * multiplier)
        },
        transitionCost: {
          min: Math.round(baseConstraints.transitionCost.min * multiplier),
          max: Math.round(baseConstraints.transitionCost.max * multiplier),
          step: Math.round(baseConstraints.transitionCost.step * multiplier)
        }
      };

      // Update store with new values
      if (model === 'team') {
        handleTeamInputs();
      } else {
        handleTicketInputs();
      }
      updateSolutionInputs();

      previousMultiplier = multiplier;
    }
  }

  // Subscribe to store changes and sync local state
  calculatorStore.subscribe(state => {
    model = state.model;
    solution = state.solution;
    
    // Sync form state with store
    const currentState = calculatorStore.getCurrentState();
    if (currentState.baseInputs) {
      if ('teamSize' in currentState.baseInputs) {
        teamSize = currentState.baseInputs.teamSize;
        hourlyRate = currentState.baseInputs.hourlyRate;
        serviceEfficiency = currentState.baseInputs.serviceEfficiency;
        operationalOverhead = currentState.baseInputs.operationalOverhead;
      } else {
        monthlyTickets = currentState.baseInputs.monthlyTickets;
        hoursPerTicket = currentState.baseInputs.hoursPerTicket;
        peoplePerTicket = currentState.baseInputs.peoplePerTicket;
        slaCompliance = currentState.baseInputs.slaCompliance;
      }
    }
    
    if (currentState.solutionInputs) {
      const { type, platform, outsource, hybrid } = currentState.solutionInputs;
      solution = type;
      
      if (platform) {
        platformInputs = { ...platformInputs, ...platform };
      }
      if (outsource) {
        outsourceInputs = { ...outsourceInputs, ...outsource };
      }
      if (hybrid) {
        hybridInputs = { ...hybridInputs, ...hybrid };
      }
    }
  });

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
      slaCompliance,
      hourlyRate
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
  function updateHybridPortions(source: 'platform' | 'vendor', event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    
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

  // Simple function to handle percentage inputs
  function handlePercentageChange(e: Event, field: string) {
    const target = e.target as HTMLInputElement;
    if (!target) return;

    let value;
    if (field === 'qualityImpact') {
      value = Math.max(-50, Math.min(50, Math.round(+target.value)));
    } else {
      value = Math.max(0, Math.min(100, Math.round(+target.value)));
    }
    target.value = value.toString();

    switch (field) {
      case 'serviceEfficiency':
        serviceEfficiencyPercent = value;
        serviceEfficiency = value / 100;
        handleTeamInputs();
        break;
      case 'operationalOverhead':
        operationalOverheadPercent = value;
        operationalOverhead = value / 100;
        handleTeamInputs();
        break;
      case 'teamReduction':
        teamReductionPercent = value;
        if (solution === 'platform') {
          platformInputs.teamReduction = value / 100;
        } else if (solution === 'hybrid') {
          hybridInputs.teamReduction = value / 100;
        }
        updateSolutionInputs();
        break;
      case 'processEfficiency':
        processEfficiencyPercent = value;
        if (solution === 'platform') {
          platformInputs.processEfficiency = value / 100;
        } else if (solution === 'hybrid') {
          hybridInputs.processEfficiency = value / 100;
        }
        updateSolutionInputs();
        break;
      case 'managementOverhead':
        managementOverheadPercent = value;
        if (solution === 'outsource') {
          outsourceInputs.managementOverhead = value / 100;
        } else if (solution === 'hybrid') {
          hybridInputs.managementOverhead = value / 100;
        }
        updateSolutionInputs();
        break;
      case 'qualityImpact':
        qualityImpactPercent = value;
        if (solution === 'outsource') {
          outsourceInputs.qualityImpact = value / 100;
        } else if (solution === 'hybrid') {
          hybridInputs.qualityImpact = value / 100;
        }
        updateSolutionInputs();
        break;
      case 'knowledgeLoss':
        knowledgeLossPercent = value;
        if (solution === 'outsource') {
          outsourceInputs.knowledgeLoss = value / 100;
        } else if (solution === 'hybrid') {
          hybridInputs.knowledgeLoss = value / 100;
        }
        updateSolutionInputs();
        break;
    }
  }

  // Handle numeric input with proper typing
  function handleNumericInput(event: Event, field: keyof (HybridInputs & OutsourceInputs & PlatformInputs)) {
    const value = parseFloat((event.target as HTMLInputElement).value);

    if (solution === 'hybrid' && field in hybridInputs) {
      hybridInputs[field as keyof HybridInputs] = value;
      hybridInputs = { ...hybridInputs }; // Force reactivity
    } else if (solution === 'outsource' && field in outsourceInputs) {
      outsourceInputs[field as keyof OutsourceInputs] = value;
      outsourceInputs = { ...outsourceInputs }; // Force reactivity
    } else if (solution === 'platform' && field in platformInputs) {
      platformInputs[field as keyof PlatformInputs] = value;
      platformInputs = { ...platformInputs }; // Force reactivity
    }

    updateSolutionInputs(); // Update solution calculations
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
  <!-- Currency Selector -->
  <div class="flex justify-end">
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium text-gray-700">Currency:</span>
      <div class="flex rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
        {#each ['USD', 'EUR', 'SEK', 'GBP'] as code}
          <button
            class="px-3 py-1 text-sm rounded-md transition-colors {$currencyStore.code === code ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-50'}"
            on:click={() => currencyStore.setCurrency(code as Currency)}
          >
            {currencyConfigs[code as Currency].symbol} {code}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Header Section -->
  <!--
  <div class="bg-gradient-to-r from-secondary/10 to-secondary/5 p-2 rounded-lg border border-secondary/20">
    <p class="text-secondary text-xs leading-relaxed">
      {#if model === 'team'}
        Calculate and optimize your Operations Costs based on team composition and operational metrics. 
        This model helps you analyze costs from a workforce perspective and identify opportunities for efficiency improvements.
      {:else}
        Calculate and optimize your Operations Costs based on workload volume and processing requirements. 
        This model helps you analyze costs from a throughput perspective and identify opportunities for process optimization.
      {/if}
    </p>
  </div>
  -->
   
  <!-- Solution Selection Section -->
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Operational Approach</h3>
        <p class="text-sm text-gray-600 mt-1">Choose how you want to address your operational costs. Select the approach that best aligns with your goals</p>
      </div>
      <button 
        class="tooltip bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 transition-colors" 
        data-tippy-content="Choose between platform automation, outsourcing, or a hybrid approach">
        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each ['platform', 'outsource', 'hybrid'] as solutionType}
        <button
          class="solution-card relative p-3 rounded-lg border transition-all min-h-[90px] {
            solution === solutionType
              ? 'active bg-gradient-to-br from-secondary to-secondary text-white shadow-md'
              : 'bg-white text-gray-900 shadow hover:shadow-md'
          }"
          on:click={() => updateSolution(solutionType)}>
          <div class="flex flex-col h-full">
            <!-- Solution Icon and Title in one row -->
            <div class="flex items-center gap-2 mb-2">
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
                  {solutionType === 'platform' ? 'Platform' :
                   solutionType === 'outsource' ? 'Outsourcing' :
                   'Hybrid'}
                </h3>
                <p class="text-xs mt-0.5 {solution === solutionType ? 'text-white text-opacity-90' : 'text-gray-600'}">
                  {solutionType === 'platform' ? 'Automate operational tasks by investing in a platform development.' :
                   solutionType === 'outsource' ? 'Transfer operational tasks and costs to external providers.' :
                   'Combine platform automation with outsourcing for a balanced solution.'}
                </p>
              </div>
              <div>
                {#if solution === solutionType}
                  <svg class="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                {/if}
              </div>
            </div>
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
                    data-tippy-content="Specify the total number of employees assigned to operations costs tasks. This helps calculate the workforce costs involved.">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Define the number of employees currently working on operational tasks.
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
                    data-tippy-content="Include all direct and indirect costs associated with each employee, such as salaries, benefits, and operational overhead.">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Input the average hourly cost per team member, including salary, benefits, and overhead.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="hourlyRate"
                    bind:value={hourlyRate}
                    on:input={handleTeamInputs}
                    min={constraints.hourlyRate.min}
                    max={constraints.hourlyRate.max}
                    step={constraints.hourlyRate.step}
                    class="number-input"
                  />
                  <span class="unit-suffix">{$currencyStore.symbol}</span>
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
                    data-tippy-content="This is the proportion of employee time dedicated to productive, value-adding tasks. It excludes time spent on meetings, idle time, or administrative overhead.">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Estimate the percentage of time employees spend on productive work.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="serviceEfficiency"
                    value={serviceEfficiencyPercent}
                    on:input={(e) => handlePercentageChange(e, 'serviceEfficiency')}
                    min="0"
                    max="100"
                    step="1"
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                </div>
                <input
                  type="range"
                  value={serviceEfficiencyPercent}
                  on:input={(e) => handlePercentageChange(e, 'serviceEfficiency')}
                  min="0"
                  max="100"
                  step="1"
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
                    data-tippy-content="Include expenses such as tools, software, office costs, and utilities that contribute to overall operational expenses.">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Specify the percentage of additional costs beyond base salaries.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="operationalOverhead"
                    value={operationalOverheadPercent}
                    on:input={(e) => handlePercentageChange(e, 'operationalOverhead')}
                    min={constraints.operationalOverhead.min}
                    max={constraints.operationalOverhead.max}
                    step={constraints.operationalOverhead.step}
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                </div>
                <input
                  type="range"
                  value={operationalOverheadPercent}
                  on:input={(e) => handlePercentageChange(e, 'operationalOverhead')}
                  min={constraints.operationalOverhead.min}
                  max={constraints.operationalOverhead.max}
                  step={constraints.operationalOverhead.step}
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

          <!-- Hourly Rate -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="hourlyRate">
                  Hourly Rate
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Average hourly cost per person working on tickets">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Set the average hourly rate for team members processing tickets. This helps calculate total operational costs.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="hourlyRate"
                    bind:value={hourlyRate}
                    on:input={handleTicketInputs}
                    min={constraints.hourlyRate.min}
                    max={constraints.hourlyRate.max}
                    step={constraints.hourlyRate.step}
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{$currencyStore.symbol}/hr</span>
                </div>
                <input
                  type="range"
                  bind:value={hourlyRate}
                  on:input={handleTicketInputs}
                  min={constraints.hourlyRate.min}
                  max={constraints.hourlyRate.max}
                  step={constraints.hourlyRate.step}
                  class="slider-input"
                />
              </div>
            </div>
          </div>

          <!-- SLA Compliance -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                <label class="field-label" for="slaCompliance">
                  SLA Compliance
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Service level agreement compliance rate [0-100%]">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                  Current service level agreement compliance rate. This helps measure service quality.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="slaCompliance"
                    bind:value={slaCompliance}
                    on:input={handleTicketInputs}
                    min={0}
                    max={100}
                    step={1}
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                </div>
                <input
                  type="range"
                  bind:value={slaCompliance}
                  on:input={handleTicketInputs}
                  min={0}
                  max={100}
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
    <div class="section-container mt-4" style="min-height: 400px; display: flex; flex-direction: column;">
      <div class="section-header">
        <div>
          <h3 class="section-title">Approach Configuration</h3>
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

      {#if solution === 'platform'}
            <div class="grid grid-cols-1 gap-2">
              <!-- Platform Cost -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                    <label class="field-label" for="platformCost">
                      Platform Investment
                      <button 
                        class="tooltip ml-1" 
                    data-tippy-content="This is the one-time upfront cost for platform design, development, and implementation. Include any associated infrastructure or software expenses.">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                  Input the estimated initial investment required to develop or implement the platform.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="platformCost"
                        value={isHybridSolution(solution) ? hybridInputs.platformCost : platformInputs.platformCost}
                        on:input={(e) => handleNumericInput(e, 'platformCost')}
                        min={50000}
                        max={500000}
                        step={1000}
                        class="number-input"
                      />
                      <span class="unit-suffix">{$currencyStore.symbol}</span>
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
                    data-tippy-content="Include costs for updates, hosting, technical support, and other ongoing expenses necessary to keep the platform functional.">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                  Estimate the recurring monthly cost to maintain the platform.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="platformMaintenance"
                        value={isHybridSolution(solution) ? hybridInputs.platformMaintenance : platformInputs.platformMaintenance}
                        on:input={(e) => handleNumericInput(e, 'platformMaintenance')}
                        min={1000}
                        max={10000}
                        step={100}
                        class="number-input"
                      />
                      <span class="unit-suffix">{$currencyStore.symbol}</span>
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

          <!-- Time to Build -->
                <div class="field-container">
                  <div class="flex items-start justify-between">
                    <div>
                      <label class="field-label" for="timeToBuild">
                        Time to Build
                        <button 
                          class="tooltip ml-1" 
                    data-tippy-content="Input the estimated time in months for platform development, testing, and deployment to ensure it's fully operational.">
                          <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </label>
                      <p class="input-description">
                  Specify the estimated time it takes to develop and deploy the platform from when a team starts working on the platform.
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
                  Time Freed Up
                        <button 
                          class="tooltip ml-1" 
                    data-tippy-content="Provide how much of the teams time you anticipate will be freed up due to improved efficiency from automation.">
                          <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </label>
                      <p class="input-description">
                  Estimate the percentage of the original teams time that will be freed up once the platform is developed.
                      </p>
                    </div>
                    <div class="input-group">
                      <div class="relative">
                        <input
                          type="number"
                          id="teamReduction"
                          value={teamReductionPercent}
                          on:input={(e) => handlePercentageChange(e, 'teamReduction')}
                          min="0"
                          max="100"
                          step="1"
                          class="number-input pr-8"
                        />
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                      </div>
                      <input
                        type="range"
                        value={teamReductionPercent}
                        on:input={(e) => handlePercentageChange(e, 'teamReduction')}
                        min="0"
                        max="100"
                        step="1"
                        class="slider-input"
                      />
                    </div>
                  </div>
                </div>

              <!-- Process Efficiency -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                    <label class="field-label" for="processEfficiency">
                      Process Efficiency
                      <button 
                        class="tooltip ml-1" 
                    data-tippy-content="This percentage reflects the productivity gain from implementing the platform. Consider reduced idle time, faster workflows, or improved accuracy.">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                  Define the expected improvement in process efficiency as a result of automation. I.e. how much more effective will the original team get, alternatively how much faster will they be able to complete the same work once the platform is completed.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="processEfficiency"
                        value={processEfficiencyPercent}
                        on:input={(e) => handlePercentageChange(e, 'processEfficiency')}
                        min={constraints.processEfficiency.min}
                        max={constraints.processEfficiency.max}
                        step={constraints.processEfficiency.step}
                        class="number-input pr-8"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <input
                      type="range"
                      value={processEfficiencyPercent}
                      on:input={(e) => handlePercentageChange(e, 'processEfficiency')}
                      min={constraints.processEfficiency.min}
                      max={constraints.processEfficiency.max}
                      step={constraints.processEfficiency.step}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>
            </div>
      {:else if solution === 'outsource'}
            <div class="grid grid-cols-1 gap-2">
              <!-- Vendor Rate -->
              <div class="field-container">
                <div class="flex items-start justify-between">
                  <div>
                <label class="field-label" for="outsourceVendorRate">
                      Vendor Rate
                      <button 
                        class="tooltip ml-1" 
                        data-tippy-content="Hourly rate charged by external vendors">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                  {#if model === 'team'}
                      Specify the hourly rate charged by external vendors. This is used to calculate outsourced Operations Costs costs.
                  {:else}
                    Specify the hourly rate charged by external vendors for ticket processing.
                  {/if}
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                    id="outsourceVendorRate"
                    bind:value={outsourceInputs.vendorRate}
                        on:input={(e) => handleNumericInput(e, 'vendorRate')}
                        min={constraints.vendorRate.min}
                        max={constraints.vendorRate.max}
                        step={constraints.vendorRate.step}
                        class="number-input"
                      />
                      <span class="unit-suffix">{$currencyStore.symbol}</span>
                    </div>
                    <input
                      type="range"
                  bind:value={outsourceInputs.vendorRate}
                      on:input={(e) => handleNumericInput(e, 'vendorRate')}
                      min={constraints.vendorRate.min}
                      max={constraints.vendorRate.max}
                      step={constraints.vendorRate.step}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>

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
                        value={managementOverheadPercent}
                        on:input={(e) => handlePercentageChange(e, 'managementOverhead')}
                        min={constraints.managementOverhead.min}
                        max={constraints.managementOverhead.max}
                        step={constraints.managementOverhead.step}
                        class="number-input pr-8"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <input
                      type="range"
                      value={managementOverheadPercent}
                      on:input={(e) => handlePercentageChange(e, 'managementOverhead')}
                      min={constraints.managementOverhead.min}
                      max={constraints.managementOverhead.max}
                      step={constraints.managementOverhead.step}
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
                        value={qualityImpactPercent}
                        on:input={(e) => handlePercentageChange(e, 'qualityImpact')}
                        min={constraints.qualityImpact.min}
                        max={constraints.qualityImpact.max}
                        step={constraints.qualityImpact.step}
                        class="number-input pr-8"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <input
                      type="range"
                      value={qualityImpactPercent}
                      on:input={(e) => handlePercentageChange(e, 'qualityImpact')}
                      min={constraints.qualityImpact.min}
                      max={constraints.qualityImpact.max}
                      step={constraints.qualityImpact.step}
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
                  Estimate the expected knowledge loss during transition. This helps calculate the impact on service quality over time.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="knowledgeLoss"
                        value={knowledgeLossPercent}
                        on:input={(e) => handlePercentageChange(e, 'knowledgeLoss')}
                        min={constraints.knowledgeLoss.min}
                        max={constraints.knowledgeLoss.max}
                        step={constraints.knowledgeLoss.step}
                        class="number-input pr-8"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                    </div>
                    <input
                      type="range"
                      value={knowledgeLossPercent}
                      on:input={(e) => handlePercentageChange(e, 'knowledgeLoss')}
                      min={constraints.knowledgeLoss.min}
                      max={constraints.knowledgeLoss.max}
                      step={constraints.knowledgeLoss.step}
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
                    data-tippy-content="Time required for transition in months">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                  Estimate the time required for transition. This helps calculate the total transition period and associated costs.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="transitionTime"
                    value={outsourceInputs.transitionTime}
                        on:input={(e) => handleNumericInput(e, 'transitionTime')}
                    min={constraints.transitionTime.min}
                    max={constraints.transitionTime.max}
                    step={constraints.transitionTime.step}
                        class="number-input pr-8"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">mo</span>
                    </div>
                    <input
                      type="range"
                  value={outsourceInputs.transitionTime}
                      on:input={(e) => handleNumericInput(e, 'transitionTime')}
                  min={constraints.transitionTime.min}
                  max={constraints.transitionTime.max}
                  step={constraints.transitionTime.step}
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
                    data-tippy-content="One-time cost for transitioning to outsourced solution">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </label>
                    <p class="input-description">
                  Estimate the one-time cost for transitioning. This helps calculate the total investment required.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="transitionCost"
                    value={outsourceInputs.transitionCost}
                        on:input={(e) => handleNumericInput(e, 'transitionCost')}
                    min={constraints.transitionCost.min}
                    max={constraints.transitionCost.max}
                    step={constraints.transitionCost.step}
                        class="number-input"
                      />
                      <span class="unit-suffix">{$currencyStore.symbol}</span>
                    </div>
                    <input
                      type="range"
                  value={outsourceInputs.transitionCost}
                      on:input={(e) => handleNumericInput(e, 'transitionCost')}
                  min={constraints.transitionCost.min}
                  max={constraints.transitionCost.max}
                  step={constraints.transitionCost.step}
                      class="slider-input"
                    />
                  </div>
                </div>
              </div>
            </div>
      {:else if solution === 'hybrid'}
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
                      Determine the percentage of work handled by the platform. This helps calculate the platform's contribution to Operations Costs.
                    </p>
          </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="platformPortion"
                        bind:value={hybridInputs.platformPortion}
                        on:input={(e) => updateHybridPortions('platform', e)}
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
                      on:input={(e) => updateHybridPortions('platform', e)}
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
                      Determine the percentage of work handled by external vendors. This helps calculate the vendor's contribution to Operations Costs.
                    </p>
                  </div>
                  <div class="input-group">
                    <div class="relative">
                      <input
                        type="number"
                        id="vendorPortion"
                        bind:value={hybridInputs.vendorPortion}
                        on:input={(e) => updateHybridPortions('vendor', e)}
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
                      on:input={(e) => updateHybridPortions('vendor', e)}
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
                  <input
                    type="number"
                    id="platformCost"
                    value={isHybridSolution(solution) ? hybridInputs.platformCost : platformInputs.platformCost}
                    on:input={(e) => handleNumericInput(e, 'platformCost')}
                    min={50000}
                    max={500000}
                    step={1000}
                    class="number-input"
                  />
                  <span class="unit-suffix">{$currencyStore.symbol}</span>
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
                  <input
                    type="number"
                    id="platformMaintenance"
                    value={isHybridSolution(solution) ? hybridInputs.platformMaintenance : platformInputs.platformMaintenance}
                    on:input={(e) => handleNumericInput(e, 'platformMaintenance')}
                    min={1000}
                    max={10000}
                    step={100}
                    class="number-input"
                  />
                  <span class="unit-suffix">{$currencyStore.symbol}</span>
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
                      value={teamReductionPercent}
                      on:input={(e) => handlePercentageChange(e, 'teamReduction')}
                      min="0"
                      max="100"
                      step="1"
                      class="number-input pr-8"
                    />
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                  </div>
                  <input
                    type="range"
                    value={teamReductionPercent}
                    on:input={(e) => handlePercentageChange(e, 'teamReduction')}
                    min="0"
                    max="100"
                    step="1"
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
                    value={processEfficiencyPercent}
                    on:input={(e) => handlePercentageChange(e, 'processEfficiency')}
                    min={constraints.processEfficiency.min}
                    max={constraints.processEfficiency.max}
                    step={constraints.processEfficiency.step}
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                </div>
                <input
                  type="range"
                  value={processEfficiencyPercent}
                  on:input={(e) => handlePercentageChange(e, 'processEfficiency')}
                  min={constraints.processEfficiency.min}
                  max={constraints.processEfficiency.max}
                  step={constraints.processEfficiency.step}
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
          <!-- Vendor Rate -->
          <div class="field-container">
            <div class="flex items-start justify-between">
              <div>
                    <label class="field-label" for="hybridVendorRate">
                  Vendor Rate
                  <button 
                    class="tooltip ml-1" 
                    data-tippy-content="Hourly rate charged by external vendors">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </label>
                <p class="input-description">
                    Specify the hourly rate charged by external vendors. This is used to calculate outsourced Operations Costs costs.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                        id="hybridVendorRate"
                        bind:value={hybridInputs.vendorRate}
                    on:input={(e) => handleNumericInput(e, 'vendorRate')}
                    min={constraints.vendorRate.min}
                    max={constraints.vendorRate.max}
                    step={constraints.vendorRate.step}
                    class="number-input"
                  />
                  <span class="unit-suffix">{$currencyStore.symbol}</span>
                </div>
                <input
                  type="range"
                      bind:value={hybridInputs.vendorRate}
                  on:input={(e) => handleNumericInput(e, 'vendorRate')}
                  min={constraints.vendorRate.min}
                  max={constraints.vendorRate.max}
                  step={constraints.vendorRate.step}
                  class="slider-input"
                />
              </div>
            </div>
          </div>

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
                    value={managementOverheadPercent}
                    on:input={(e) => handlePercentageChange(e, 'managementOverhead')}
                    min={constraints.managementOverhead.min}
                    max={constraints.managementOverhead.max}
                    step={constraints.managementOverhead.step}
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                </div>
                <input
                  type="range"
                  value={managementOverheadPercent}
                  on:input={(e) => handlePercentageChange(e, 'managementOverhead')}
                  min={constraints.managementOverhead.min}
                  max={constraints.managementOverhead.max}
                  step={constraints.managementOverhead.step}
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
                    value={qualityImpactPercent}
                    on:input={(e) => handlePercentageChange(e, 'qualityImpact')}
                    min={constraints.qualityImpact.min}
                    max={constraints.qualityImpact.max}
                    step={constraints.qualityImpact.step}
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                </div>
                <input
                  type="range"
                  value={qualityImpactPercent}
                  on:input={(e) => handlePercentageChange(e, 'qualityImpact')}
                  min={constraints.qualityImpact.min}
                  max={constraints.qualityImpact.max}
                  step={constraints.qualityImpact.step}
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
                    value={knowledgeLossPercent}
                    on:input={(e) => handlePercentageChange(e, 'knowledgeLoss')}
                    min={constraints.knowledgeLoss.min}
                    max={constraints.knowledgeLoss.max}
                    step={constraints.knowledgeLoss.step}
                    class="number-input pr-8"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                </div>
                <input
                  type="range"
                  value={knowledgeLossPercent}
                  on:input={(e) => handlePercentageChange(e, 'knowledgeLoss')}
                  min={constraints.knowledgeLoss.min}
                  max={constraints.knowledgeLoss.max}
                  step={constraints.knowledgeLoss.step}
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
                      Estimate the time required for the transition to outsourcing. This helps calculate the total transition period and associated costs.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="transitionTime"
                        value={hybridInputs.transitionTime}
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
                      value={hybridInputs.transitionTime}
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
                      Estimate the one-time cost for transitioning to the outsourced solution. This helps calculate the total investment required.
                </p>
              </div>
              <div class="input-group">
                <div class="relative">
                  <input
                    type="number"
                    id="transitionCost"
                        value={hybridInputs.transitionCost}
                    on:input={(e) => handleNumericInput(e, 'transitionCost')}
                        min={0}
                        max={100000}
                        step={1000}
                    class="number-input"
                  />
                  <span class="unit-suffix">{$currencyStore.symbol}</span>
                </div>
                <input
                  type="range"
                      value={hybridInputs.transitionCost}
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
    @apply flex justify-end w-[120px] flex-shrink-0;
  }

  /* Compact number input styles */
  .number-input {
    @apply w-[120px] px-3 py-1 text-left text-gray-700 bg-white border border-gray-200 
           rounded-md focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-transparent
           transition-all duration-200 text-sm font-medium tracking-wide flex-shrink-0;
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
    min-height: 400px; 
    display: flex; 
    flex-direction: column;
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
    @apply bg-white p-3 rounded-lg border border-gray-100 mt-4;
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

  /* Unit styles */
  .unit-prefix {
    @apply absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm;
  }

  .unit-suffix {
    @apply absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none;
  }
</style> 