<!-- Calculator Page -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import ModelSelector from '../../features/base-analysis/components/ModelSelector.svelte';
  import type { CalculatorModel } from '$lib/types/calculator';
  import { calculatorStore } from '$lib/stores/calculatorStore';

  type Mode = 'base' | 'solutions' | 'internal';

  interface Goal {
    id: string;
    name: string;
    description: string;
    longDescription: string;
    benefits: string[];
    mode: Mode;
    requiresModel: boolean;
    defaultModel?: CalculatorModel;
    icon: string;
    path: string;
  }

  let activeModel: CalculatorModel = 'team';
  let showModelSelection = false;
  let selectedGoal: string | null = null;

  const goals: Goal[] = [
    {
      id: 'breakeven',
      name: 'Find Break-Even Point',
      description: 'Calculate the break-even point for a given solution',
      longDescription: 'Determine how long it will take to recover your investment in a new Operations Costs model. Compare different approaches and understand the financial implications of each option.',
      benefits: [
        'Compare different Operations Costs models',
        'Calculate ROI and payback period',
        'Understand monthly cost implications',
        'Make data-driven investment decisions'
      ],
      mode: 'base',
      requiresModel: true,
      path: 'base_analysis',
      icon: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>`
    },
    {
      id: 'target',
      name: 'Plan Target Solution',
      description: 'Determine optimal investment and resource allocation',
      longDescription: 'Set your desired targets for ROI, team reduction, or process efficiency, and we will help you determine the optimal investment parameters to achieve these goals.',
      benefits: [
        'Set clear efficiency targets',
        'Optimize resource allocation',
        'Plan phased transitions',
        'Balance cost and performance'
      ],
      mode: 'solutions',
      requiresModel: true,
      path: 'target_analysis',
      icon: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>`
    },
    {
      id: 'team-analysis',
      name: 'Analyze Team Dependencies',
      description: 'Explore team interactions and optimize collaboration',
      longDescription: 'Visualize and analyze how your teams interact, identify bottlenecks, and discover opportunities to optimize collaboration and knowledge sharing.',
      benefits: [
        'Map team interactions',
        'Identify collaboration bottlenecks',
        'Optimize knowledge sharing',
        'Improve team efficiency'
      ],
      mode: 'internal',
      requiresModel: false,
      defaultModel: 'team',
      path: 'team_analysis',
      icon: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>`
    }
  ];

  function handleGoalSelect(goal: Goal) {
    selectedGoal = goal.id;
    
    if (!goal.requiresModel) {
      activeModel = goal.defaultModel!;
      calculatorStore.updateModel(activeModel);
      goto(`${base}/calculator/${goal.path}/team_model`);
    } else {
      showModelSelection = true;
    }
  }

  function handleModelSelect(event: CustomEvent<CalculatorModel>) {
    activeModel = event.detail;
    showModelSelection = false;
    calculatorStore.updateModel(activeModel);
    
    const goal = goals.find(g => g.id === selectedGoal);
    if (goal) {
      goto(`${base}/calculator/${goal.path}/${activeModel}_model`);
    }
  }

  $: selectedGoalData = selectedGoal ? goals.find(g => g.id === selectedGoal) : null;
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Top spacing for fixed navigation -->
  <div class="h-16"></div>
  
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-7xl mx-auto space-y-6">
      {#if !selectedGoal}
        <!-- Goal Selection -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <div class="max-w-3xl mx-auto text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">What would you like to analyze?</h2>
            <p class="text-lg text-gray-600">
              Choose your analysis goal and we'll guide you through the process of optimizing your Operations Costs model.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {#each goals as goal}
              <button
                class="group relative bg-white rounded-xl shadow-sm hover:shadow-md border-2 border-gray-200 hover:border-secondary/20 
                       transition-all duration-300 overflow-hidden hover:scale-[1.02]"
                on:click={() => handleGoalSelect(goal)}
              >
                <div class="p-8">
                  <div class="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {@html goal.icon}
                  </div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-3">{goal.name}</h3>
                  <p class="text-sm text-gray-600 mb-6 leading-relaxed">{goal.description}</p>
                  <div class="space-y-3">
                    {#each goal.benefits as benefit}
                      <div class="flex items-center text-sm text-gray-700">
                        <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3">
                          <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {benefit}
                      </div>
                    {/each}
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {:else if showModelSelection}
        <!-- Model Selection -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <div class="flex items-center gap-4 mb-8">
            <button
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
              on:click={() => selectedGoal = null}
            >
              <svg class="w-8 h-8 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 class="text-3xl font-bold text-gray-900">How do you work today?</h2>
              <p class="text-lg text-gray-600 mt-2">Select your current Operations Costs model to get started.</p>
            </div>
          </div>
          <ModelSelector {activeModel} on:modelSelect={handleModelSelect} />
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  :global(.tippy-box[data-theme~='light-border']) {
    @apply bg-white text-gray-900 shadow-lg border border-gray-200 text-sm;
  }
</style> 