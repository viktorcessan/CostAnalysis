<!-- Calculator Page -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import ModelSelector from '../../features/base-analysis/components/ModelSelector.svelte';
  import type { CalculatorModel } from '$lib/types/calculator';
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import { onMount } from 'svelte';

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
      id: 'team-analysis',
      name: 'Reveal Team Dependency Costs',
      description: 'Understand how team dependencies are driving up costs and find actionable ways to reduce them.',
      longDescription: 'Visualize and analyze how your teams interact, identify bottlenecks, and discover opportunities to optimize collaboration and knowledge sharing.',
      benefits: [
        'Uncover hidden costs',
        'Map team dependencies',
        'Optimize team efficiency',
        'Reduce dependency costs'
      ],
      mode: 'internal',
      requiresModel: false,
      defaultModel: 'team',
      path: 'team_analysis',
      icon: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>`
    },
    {
      id: 'build-buy',
      name: 'Build vs Buy Analysis',
      description: 'Make data-driven decisions about whether to build or buy solutions by analyzing costs, benefits, and strategic factors.',
      longDescription: 'Evaluate build vs buy options objectively by scoring them across key dimensions like business criticality, time to implement, cost, control, competency, and market fit.',
      benefits: [
        'Score options across dimensions',
        'Visualize trade-offs',
        'Get clear recommendations',
        'Receive actionable insights'
      ],
      mode: 'solutions',
      requiresModel: false,
      path: 'build_buy',
      icon: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>`
    },
    {
      id: 'feature-calculator',
      name: 'Feature Value Calculator',
      description: 'Quantify the business impact of a feature by evaluating how it generates revenue, protects revenue, reduces costs, or avoids costs.',
      longDescription: 'Calculate and visualize the total value created by features through revenue gains, cost reductions, and risk mitigation. Get clear ROI and break-even analysis to support your decisions.',
      benefits: [
        'Calculate total value created',
        'Analyze multiple value streams',
        'Visualize ROI and break-even',
        'Build strong business cases'
      ],
      mode: 'solutions',
      requiresModel: false,
      path: 'feature_calculator',
      icon: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v.5a2 2 0 0 1 -2 2h-2a2 2 0 0 0 -2 2v.5a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2M12 3v3m0 12v3" />
            </svg>`
    },
    {
      id: 'breakeven',
      name: 'Build a Business Case',
      description: 'Explore how automation or outsourcing impacts your costs. Calculate ROI, compare options, and identify your break-even point.',
      longDescription: 'Explore how automation or outsourcing impacts your costs. Calculate ROI, compare options, and identify your break-even point to build a strong case for change. Put your existing data to work to uncover actionable insights and make better investment decisions. Perfect for analyzing, projecting, and comparing opportunities in platform automation and service outsourcing..',
      benefits: [
        'Analyze and justify costs',
        'Calculate ROI',
        'Identify break-even points',
        'See future cost implications'
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
      name: 'Determine your Platform Budget',
      description: 'Determine an optimal platform investment size that enables lower costs while meeting efficiency goals.',
      longDescription: 'Set your desired targets for ROI, team reduction, or process efficiency, and we will help you determine the optimal investment parameters to achieve these goals.',
      benefits: [
        'Set cost and efficiency targets',
        'Identify break-even points',
        'See monthly cost reductions',
        'Identify total investment size'
      ],
      mode: 'solutions',
      requiresModel: true,
      path: 'target_analysis',
      icon: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>`
    }
  ];

  onMount(() => {
    const urlGoal = $page.url.searchParams.get('goal');
    if (urlGoal) {
      const goal = goals.find(g => g.id === urlGoal);
      if (goal) {
        selectedGoal = urlGoal;
        if (goal.id === 'team-analysis') {
          activeModel = 'team';
          calculatorStore.updateModel(activeModel);
          goto(`${base}/calculator/team_analysis/team_model`);
        } else if (goal.id === 'build-buy') {
          goto(`${base}/calculator/build_buy`);
        } else if (goal.id === 'feature-calculator') {
          goto(`${base}/calculator/feature_calculator`);
        } else {
          showModelSelection = true;
        }
      }
    }
  });

  // Subscribe to URL changes to update the selected goal
  $: {
    const urlGoal = $page.url.searchParams.get('goal');
    if (urlGoal) {
      const goal = goals.find(g => g.id === urlGoal);
      if (goal) {
        selectedGoal = urlGoal;
        if (goal.id === 'team-analysis') {
          activeModel = 'team';
          calculatorStore.updateModel(activeModel);
          goto(`${base}/calculator/team_analysis/team_model`);
        } else if (goal.id === 'build-buy') {
          goto(`${base}/calculator/build_buy`);
        } else if (goal.id === 'feature-calculator') {
          goto(`${base}/calculator/feature_calculator`);
        } else {
          showModelSelection = true;
        }
      }
    }
  }

  function handleModelSelect(event: CustomEvent<CalculatorModel>) {
    activeModel = event.detail;
    showModelSelection = false;
    calculatorStore.updateModel(activeModel);
    
    const urlGoal = $page.url.searchParams.get('goal');
    if (urlGoal === 'breakeven') {
      goto(`${base}/calculator/base_analysis/${activeModel}_model`, { replaceState: false });
    } else if (urlGoal === 'target') {
      goto(`${base}/calculator/target_analysis/${activeModel}_model`, { replaceState: false });
    }
  }

  function handleGoalSelect(goal: Goal) {
    selectedGoal = goal.id;
    if (goal.id === 'team-analysis') {
      activeModel = 'team';
      calculatorStore.updateModel(activeModel);
      goto(`${base}/calculator/team_analysis/team_model`);
    } else if (goal.id === 'build-buy') {
      goto(`${base}/calculator/build_buy`);
    } else if (goal.id === 'feature-calculator') {
      goto(`${base}/calculator/feature_calculator`);
    } else {
      showModelSelection = true;
      // Update URL with goal parameter
      goto(`${base}/calculator?goal=${goal.id}`, { replaceState: true });
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
            <h2 class="text-3xl font-bold text-gray-900 mb-4">What would you like to do?</h2>
            <p class="text-lg text-gray-600">
              Choose the specific type of cost analysis you need, and we'll guide you step-by-step.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {#each goals as goal}
              <button
                class="group relative bg-white rounded-xl shadow-sm hover:shadow-md border-2 border-gray-200 hover:border-secondary/20 
                       transition-all duration-300 overflow-hidden hover:scale-[1.02]"
                on:click={() => handleGoalSelect(goal)}
                data-goal={goal.id}
              >
                <div class="p-8">
                  <div class="flex items-center mb-6">
                    <div class="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                      {@html goal.icon}
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 ml-4">{goal.name}</h3>
                  </div>
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
              <h2 class="text-3xl font-bold text-gray-900">How do you track operational costs?
              </h2>
              <p class="text-lg text-gray-600 mt-2">Choose the model that best represents how your organization measures and allocates operational costs. This impacts how you approach building a business case or identifying your platform budget.</p>
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