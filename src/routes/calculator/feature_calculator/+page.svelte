<!-- Feature Value Calculator Page -->
<script lang="ts">
  import { base } from '$app/paths';
  import { currencyStore } from '$lib/stores/currencyStore';
  import ExpertConsultationCard from '$lib/components/ui/ExpertConsultationCard.svelte';
  import ExpertModal from '$lib/components/ui/ExpertModal.svelte';
  import { goto } from '$app/navigation';
  import FeatureCalculator from '../../../features/internal-analysis/components/FeatureCalculator.svelte';

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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v.5a2 2 0 0 1 -2 2h-2a2 2 0 0 0 -2 2v.5a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2M12 3v3m0 12v3" />
                </svg>
              </div>
              <div>
                <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Feature Value Calculator</h2>
                <p class="text-base sm:text-lg text-gray-600 mt-2">
                  Quantify the business impact of a feature by evaluating how it generates revenue, protects revenue, reduces costs, or avoids costs. Get clear ROI and break-even analysis to support your decisions.
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
                  <span class="text-base sm:text-lg">Calculate total value created through revenue gains or cost reductions</span>
                </li>
                <li class="flex items-start sm:items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-base sm:text-lg">Evaluate features that combine multiple forms of value creation</span>
                </li>
                <li class="flex items-start sm:items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-base sm:text-lg">Get detailed breakdown of value by objective (revenue, costs, risks)</span>
                </li>
                <li class="flex items-start sm:items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-base sm:text-lg">Visualize ROI and break-even points through interactive graphs</span>
                </li>
                <li class="flex items-start sm:items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3 mt-0.5 sm:mt-0">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-base sm:text-lg">Build strong business cases for feature development decisions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Calculator Component -->
      <FeatureCalculator />

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