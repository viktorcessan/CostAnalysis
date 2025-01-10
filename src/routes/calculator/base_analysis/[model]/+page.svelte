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
            <h2 class="text-3xl font-bold text-gray-900">Find Break-Even Point</h2>
            <p class="text-lg text-gray-600 mt-2">
              Determine how long it will take to recover your investment in a new Operations Costs model. Compare different approaches and understand the financial implications of each option.
            </p>
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