<!-- Build vs Buy Analysis Page -->
<script lang="ts">
  import { base } from '$app/paths';
  import { currencyStore } from '$lib/stores/currencyStore';
  import ExpertConsultationCard from '$lib/components/ui/ExpertConsultationCard.svelte';
  import ExpertModal from '$lib/components/ui/ExpertModal.svelte';
  import BuildBuyForm from '../../../features/build-buy/components/BuildBuyForm.svelte';
  import { goto } from '$app/navigation';

  let showExpertModal = false;

  function handleBack() {
    goto(`${base}/calculator`);
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Top spacing for fixed navigation -->
  <div class="h-16"></div>
  
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="bg-white rounded-xl shadow-lg p-4 sm:p-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <button
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
            on:click={handleBack}
          >
            <svg class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="space-y-4 sm:space-y-6 w-full">
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 sm:w-8 sm:h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div>
                <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Build vs Buy Analysis</h2>
                <p class="text-base sm:text-lg text-gray-600 mt-2">
                  Make objective, data-driven decisions about whether to build or buy solutions by scoring options across key dimensions: business criticality, time to implement, cost, control, competency, and market fit.
                </p>
              </div>
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
                  <span class="text-base sm:text-lg">Evaluate whether to develop an in-house solution or purchase an existing one</span>
                </li>
                <li class="flex items-start sm:items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-base sm:text-lg">Compare options objectively across multiple dimensions like cost, time, and control</span>
                </li>
                <li class="flex items-start sm:items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-base sm:text-lg">Get clear recommendations with confidence levels to support your decision</span>
                </li>
                <li class="flex items-start sm:items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-base sm:text-lg">Visualize trade-offs and strengths of each option through data visualization</span>
                </li>
                <li class="flex items-start sm:items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-base sm:text-lg">Align technology decisions with business strategy and competencies</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Build Buy Form -->
      <BuildBuyForm />

      <!-- Expert Consultation Section -->
      <div class="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg p-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ExpertConsultationCard {base} bind:showExpertModal />
        </div>
      </div>
    </div>
  </div>
</div>

<ExpertModal bind:show={showExpertModal} />

<style>
  /* Add any specific styles here */
</style> 