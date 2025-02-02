<!-- Target Analysis Page -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import TargetPlanningForm from '../../../features/target-planning/components/TargetPlanningForm.svelte';
  import FormulaAccordion from '$lib/components/ui/FormulaAccordion.svelte';
  import type { CalculatorModel } from '$lib/types/calculator';

  let model: CalculatorModel = $page.params.model?.replace('_model', '') as CalculatorModel || 'team';

  function handleBack() {
    goto(`${base}/calculator`);
  }
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
      <div class="bg-white rounded-xl shadow-lg p-8">
        <div class="flex items-center gap-4 mb-6">
          <button
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
            on:click={handleBack}
          >
            <svg class="w-8 h-8 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 class="text-3xl font-bold text-gray-900">Determine Your Platform Budget</h2>
            <p class="text-lg text-gray-600 mt-2">
              See how much to invest in your platform to lower costs while meeting efficiency goals. Enter data about your team and service, add performance targets, and discover the budget you can afford.
            </p>
            <ul class="text-lg text-gray-600 mt-4 list-disc pl-6">
              <li>Identify and address cost increases tied to staff growth.</li>
              <li>Plan cost reductions while maintaining performance levels.</li>
              <li>Estimate the budget needed to achieve efficiency targets.</li>
              <li>Align platform investments with leadership or finance expectations.</li>
              <li>Balance performance improvements with financial constraints.</li>
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