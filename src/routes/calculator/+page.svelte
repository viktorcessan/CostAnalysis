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
    comingSoon?: boolean;
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
      id: 'feature-value',
      name: 'Calculate Feature Value',
      description: 'Quantify the business impact of a project, initiative, feature, or idea by evaluating how it either increases or protects revenue, or reduces or avoids costs.',
      longDescription: 'Calculate and visualize the total value created through revenue gains, cost reductions, and risk mitigation. Get clear ROI and break-even analysis to support your decisions.',
      benefits: [
        'Calculate the aggregated total value',
        'Analyze the value across value dimensions',
        'Visualize the ROI, and identify the break even point',
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
    },
    {
      id: 'team-size-budget',
      name: 'Determine Team Size Budget',
      description: 'Identify and determine the optimal team size based on the potential value they have for your company, and your total headcount budget.',
      longDescription: 'Calculate and visualize the optimal team size based on value creation potential, cost constraints, and organizational goals to make data-driven decisions about team scaling.',
      benefits: [
        'Set cost and value creation targets',
        'Calculate the potential value of each team',
        'Visualize ROI per team',
        'Create a organization plan'
      ],
      mode: 'solutions',
      requiresModel: true,
      comingSoon: true,
      path: 'team_size_budget',
      icon: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else if (goal.id === 'build-buy') {
          goto(`${base}/calculator/build_buy`);
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else if (goal.id === 'feature-value') {
          goto(`${base}/calculator/feature_calculator`);
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else {
          showModelSelection = true;
          window.scrollTo({ top: 0, behavior: 'instant' });
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
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else if (goal.id === 'build-buy') {
          goto(`${base}/calculator/build_buy`);
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else if (goal.id === 'feature-value') {
          goto(`${base}/calculator/feature_calculator`);
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else {
          showModelSelection = true;
          window.scrollTo({ top: 0, behavior: 'instant' });
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
    } else if (goal.id === 'feature-value') {
      goto(`${base}/calculator/feature_calculator`);
    } else {
      showModelSelection = true;
      // Update URL with goal parameter
      goto(`${base}/calculator?goal=${goal.id}`, { replaceState: true });
    }
  }

  $: selectedGoalData = selectedGoal ? goals.find(g => g.id === selectedGoal) : null;
</script>

<svelte:head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-NR5LB7QX');</script>
  <!-- End Google Tag Manager -->
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NR5LB7QX"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->

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
              {#if goal.comingSoon}
                <div
                  class="group relative bg-white rounded-xl shadow-sm border-2 border-gray-100 
                         overflow-hidden"
                  data-goal={goal.id}
                >
                  <div class="absolute -right-12 top-6 rotate-45 bg-secondary/90 text-white px-12 py-1 text-sm font-medium shadow-sm">
                    Coming Soon
                  </div>
                  <div class="p-8 opacity-60">
                    <div class="flex items-center mb-6">
                      <div class="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center">
                        {@html goal.icon}
                      </div>
                      <h3 class="text-xl font-semibold text-gray-900 ml-4">{goal.name}</h3>
                    </div>
                    <p class="text-sm text-gray-600 mb-6 leading-relaxed">{goal.description}</p>
                    <div class="space-y-3">
                      {#each goal.benefits as benefit}
                        <div class="flex items-start text-sm text-gray-700">
                          <div class="w-6 h-6 rounded-full bg-secondary/10 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                            <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span class="text-left">{benefit}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              {:else}
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
                        <div class="flex items-start text-sm text-gray-700">
                          <div class="w-6 h-6 rounded-full bg-secondary/10 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                            <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span class="text-left">{benefit}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                </button>
              {/if}
            {/each}
          </div>
        </div>
      {:else if showModelSelection}
        <!-- Model Selection -->
        <div class="bg-white rounded-xl shadow-lg p-4 sm:p-8">
          <div class="space-y-6">
            <div class="space-y-4">
              <div class="flex flex-wrap gap-4">
                <div class="flex items-center gap-4 flex-nowrap">
                  <button
                    class="p-2 rounded-lg hover:bg-gray-100 transition-colors group flex-shrink-0"
                    on:click={() => selectedGoal = null}
                  >
                    <svg class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 sm:w-8 sm:h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {@html selectedGoalData?.icon}
                    </svg>
                  </div>
                </div>
                <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 flex-1">{selectedGoalData?.name}</h2>
              </div>
              <p class="text-base sm:text-lg text-gray-600">
                {selectedGoalData?.description}
              </p>
            </div>
            <div class="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <h3 class="text-lg sm:text-xl font-semibold text-gray-900 mb-4">What to use this for</h3>
              <ul class="space-y-3 sm:space-y-4">
                {#each selectedGoalData?.benefits || [] as benefit}
                  <li class="flex items-start sm:items-center text-gray-700">
                    <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                      <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span class="text-base sm:text-lg">{benefit}</span>
                  </li>
                {/each}
              </ul>
            </div>
          </div>

          <!-- Model Selection -->
          <div class="mt-8 space-y-6">
            <div class="max-w-3xl">
              <h2 class="text-3xl font-bold text-gray-900">How do you track operational costs?</h2>
              <p class="text-lg text-gray-600 mt-2">Choose the model that best represents how your organization measures and allocates operational costs.</p>
            </div>

            <!-- Model Choices -->
            <div>
              <ModelSelector {activeModel} on:modelSelect={handleModelSelect} />
            </div>
          </div>
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