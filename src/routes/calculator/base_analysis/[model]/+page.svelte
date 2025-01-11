<!-- Base Analysis Model Page -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import CalculatorForm from '../../../../features/base-analysis/components/CalculatorForm.svelte';
  import ResultsDisplay from '../../../../features/base-analysis/components/ResultsDisplay.svelte';
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
            <h2 class="text-3xl font-bold text-gray-900">Build a Business Case</h2>
            <p class="text-lg text-gray-600 mt-2">
              Explore how automation or outsourcing impacts your costs. Calculate ROI, compare options, and identify your break-even point to build a strong case for change. Put your existing data to work to uncover actionable insights and make better investment decisions. Perfect for analyzing, projecting, and comparing opportunities in platform automation and service outsourcing.
            </p>
            <ul class="text-lg text-gray-600 mt-4 list-disc pl-6">
              <li>Gain a clear, objective view of automation and outsourcing costs.</li>
              <li>Justify operational investments to your manager, CTO, or finance team.</li>
              <li>Compare cost models to identify the best long-term approach.</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div>
          <CalculatorForm />
        </div>

        <div>
          <ResultsDisplay />
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <FormulaAccordion model={model} mode="base" />
        </div>
      </div>
    </div>
  </div>
</div> 