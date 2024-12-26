<!-- Calculator Page -->
<script lang="ts">
  import CalculatorForm from '../../features/base-analysis/components/CalculatorForm.svelte';
  import ResultsDisplay from '../../features/base-analysis/components/ResultsDisplay.svelte';
  import TargetPlanningForm from '../../features/target-planning/components/TargetPlanningForm.svelte';
  import TeamInteractionDiagram from '../../features/internal-analysis/components/TeamInteractionDiagram.svelte';
  import ModelSelector from '../../features/base-analysis/components/ModelSelector.svelte';
  import type { CalculatorModel } from '$lib/types/calculator';
  import { calculatorStore } from '$lib/stores/calculatorStore';

  type Mode = 'base' | 'solutions' | 'internal';
  let activeModel: CalculatorModel = 'team';
  let activeMode: Mode = 'base';

  function handleModelSelect(event: CustomEvent<CalculatorModel>) {
    activeModel = event.detail;
    calculatorStore.updateModel(activeModel);
  }

  const teamModes = [
    {
      id: 'base',
      name: 'Base Analysis',
      description: 'Establish current state baseline and costs',
      icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>`
    },
    {
      id: 'solutions',
      name: 'Target Planning',
      description: 'Plan and optimize solution targets',
      icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>`
    },
    {
      id: 'internal',
      name: 'Internal Analysis',
      description: 'Analyze team dependencies and interactions',
      icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>`
    }
  ];

  const ticketModes = [
    {
      id: 'base',
      name: 'Base Analysis',
      description: 'Establish current state baseline and costs',
      icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>`
    },
    {
      id: 'solutions',
      name: 'Target Planning',
      description: 'Plan and optimize solution targets',
      icon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>`
    }
  ];

  $: modes = activeModel === 'team' ? teamModes : ticketModes;

  $: {
    if (activeModel === 'ticket' && activeMode === 'internal') {
      activeMode = 'base';
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Top spacing for fixed navigation -->
  <div class="h-16"></div>
  
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Model Selection and Analysis Mode -->
      <div class="bg-white rounded-lg shadow-sm p-4 space-y-6">
        <!-- Model Selection -->
        <div>
          <h3 class="text-base font-medium text-gray-900 mb-3">Model Selection</h3>
          <ModelSelector {activeModel} on:modelSelect={handleModelSelect} />
        </div>

        <!-- Mode Selection -->
        <div>
          <h3 class="text-base font-medium text-gray-900 mb-3">Analysis Mode</h3>
          <div class="grid grid-cols-1 {activeModel === 'team' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3">
            {#each modes as mode}
              <button
                class="relative p-3 rounded-lg border transition-all {
                  activeMode === mode.id
                    ? 'bg-gradient-to-br from-secondary to-secondary/90 text-white border-transparent shadow-sm'
                    : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200'
                }"
                on:click={() => activeMode = mode.id as Mode}
              >
                <div class="flex items-center gap-2">
                  {@html mode.icon}
                  <div class="text-left">
                    <div class="text-sm font-medium">{mode.name}</div>
                    <div class="text-xs opacity-90">{mode.description}</div>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="space-y-6">
        {#if activeMode === 'base'}
          <!-- Base Analysis -->
          <div>
            <CalculatorForm />
          </div>
          <div>
            <ResultsDisplay />
          </div>
        {:else if activeMode === 'solutions'}
          <!-- Target-Based Planning -->
          <div>
            <TargetPlanningForm />
          </div>
        {:else if activeMode === 'internal'}
          <!-- Internal Analysis -->
          <div>
            <TeamInteractionDiagram />
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  /* Scale transform on hover */
  button:hover {
    transform: scale(1.02);
  }

  /* Active mode styling */
  button.active {
    transform: scale(1.05);
  }

  /* SVG color for active mode */
  button.active svg {
    @apply text-white;
  }

  /* SVG color for inactive mode */
  button:not(.active) svg {
    @apply text-secondary;
  }
</style> 