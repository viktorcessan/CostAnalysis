<!-- Target Analysis Model Page -->
<svelte:head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-NR5LB7QX');</script>
  <!-- End Google Tag Manager -->
</svelte:head>

<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import TargetPlanningForm from '../../../../features/target-planning/components/TargetPlanningForm.svelte';
  import FormulaAccordion from '$lib/components/ui/FormulaAccordion.svelte';
  import type { CalculatorModel } from '$lib/types/calculator';
  import { calculatorStore } from '$lib/stores/calculatorStore';

  let model: CalculatorModel = $page.params.model?.replace('_model', '') as CalculatorModel || 'team';
  $: if (model) {
    calculatorStore.updateModel(model);
  }

  function handleBack() {
    goto(`${base}/calculator`);
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NR5LB7QX"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->

  <!-- Top spacing for fixed navigation -->
  <div class="h-16"></div>
  
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="bg-white rounded-xl shadow-lg p-4 sm:p-8">
        <div class="space-y-6">
          <div class="space-y-4">
            <div class="flex flex-wrap gap-4">
              <div class="flex items-center gap-4 flex-nowrap">
                <button
                  class="p-2 rounded-lg hover:bg-gray-100 transition-colors group flex-shrink-0"
                  on:click={handleBack}
                >
                  <svg class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 sm:w-8 sm:h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 flex-1">Determine Your Platform Budget</h2>
            </div>
            <p class="text-base sm:text-lg text-gray-600">
              See how much to invest in your platform to lower costs while meeting efficiency goals. Enter data about your team and service, add performance targets, and discover the budget you can afford.
            </p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <h3 class="text-lg sm:text-xl font-semibold text-gray-900 mb-4">What to use this for</h3>
            <ul class="space-y-3 sm:space-y-4">
              <li class="flex items-start sm:items-center text-gray-700">
                <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                  <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-base sm:text-lg">Identify and address cost increases tied to staff growth</span>
              </li>
              <li class="flex items-start sm:items-center text-gray-700">
                <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                  <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-base sm:text-lg">Plan cost reductions while maintaining performance levels</span>
              </li>
              <li class="flex items-start sm:items-center text-gray-700">
                <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                  <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-base sm:text-lg">Estimate the budget needed to achieve efficiency targets</span>
              </li>
              <li class="flex items-start sm:items-center text-gray-700">
                <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                  <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-base sm:text-lg">Align platform investments with leadership or finance expectations</span>
              </li>
              <li class="flex items-start sm:items-center text-gray-700">
                <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                  <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-base sm:text-lg">Balance performance improvements with financial constraints</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <TargetPlanningForm />
      <div class="mt-6">
        <FormulaAccordion model={model} mode="solutions" />
      </div>
    </div>
  </div>
</div> 