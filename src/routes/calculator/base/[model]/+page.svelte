<!-- +page.svelte -->
<script lang="ts">
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import CalculatorForm from '../../../../features/base-analysis/components/CalculatorForm.svelte';
  import ResultsDisplay from '../../../../features/base-analysis/components/ResultsDisplay.svelte';
  import BaseAnalysisShareModal from '$lib/components/ui/BaseAnalysisShareModal.svelte';
  import BaseAnalysisLoadingModal from '$lib/components/ui/BaseAnalysisLoadingModal.svelte';
  import FormulaAccordion from '$lib/components/ui/FormulaAccordion.svelte';
  import type { CalculatorModel, TeamInputs, TicketInputs } from '$lib/types/calculator';
  import { validateShareParams } from '$lib/utils/baseAnalysisShare';

  export let data;
  const model = data.model as CalculatorModel;
  const sharedConfig = data.sharedConfig;

  let showShareModal = false;
  let showLoadingModal = false;

  // Handle share button click
  function handleShare() {
    const currentState = calculatorStore.getCurrentState();
    if (currentState.baseInputs) {
      showShareModal = true;
    }
  }

  // Handle loading shared configuration
  function handleLoadConfig() {
    if (sharedConfig && validateShareParams(sharedConfig)) {
      calculatorStore.reset();
      calculatorStore.updateModel(sharedConfig.model);
      
      if (sharedConfig.model === 'team' && 'teamSize' in sharedConfig.baseInputs) {
        calculatorStore.updateTeamInputs(sharedConfig.baseInputs);
      } else if (sharedConfig.model === 'ticket' && 'monthlyTickets' in sharedConfig.baseInputs) {
        calculatorStore.updateTicketInputs(sharedConfig.baseInputs);
      }
      
      if (sharedConfig.solutionInputs) {
        calculatorStore.updateSolutionInputs(sharedConfig.solutionInputs);
      }
      
      showLoadingModal = false;
    }
  }

  // Show loading modal if shared config is present
  onMount(() => {
    console.log('Shared config:', sharedConfig); // Debug log
    if (sharedConfig && validateShareParams(sharedConfig)) {
      // First update the model to match the shared config
      calculatorStore.updateModel(sharedConfig.model);
      // Then show the loading modal
      showLoadingModal = true;
    }
  });

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
          <CalculatorForm {model} />
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

  <!-- Share Modal -->
  {#if showShareModal}
    <BaseAnalysisShareModal
      bind:show={showShareModal}
      model={$calculatorStore.model}
      baseInputs={calculatorStore.getCurrentState().baseInputs}
      solutionInputs={calculatorStore.getCurrentState().solutionInputs}
    />
  {/if}

  <!-- Loading Modal -->
  {#if showLoadingModal && sharedConfig}
    <BaseAnalysisLoadingModal
      bind:show={showLoadingModal}
      model={sharedConfig.model}
      baseInputs={sharedConfig.baseInputs}
      solutionInputs={sharedConfig.solutionInputs}
      onConfirm={handleLoadConfig}
      onCancel={() => showLoadingModal = false}
    />
  {/if}
</div> 