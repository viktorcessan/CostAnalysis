<!-- Team Analysis Model Page -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import TeamInteractionDiagram from '../../../../features/internal-analysis/components/TeamInteractionDiagram.svelte';
  import FormulaAccordion from '$lib/components/ui/FormulaAccordion.svelte';

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
          <div class="space-y-6 flex-1">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
              </div>
              <div>
                <h2 class="text-3xl font-bold text-gray-900">Reveal Team Dependency Costs</h2>
                <p class="text-lg text-gray-600 mt-2">
                  See how team dependencies and interactions drive up costs, identify bottlenecks, and find actionable ways to optimize collaboration and workflows.
                </p>
              </div>
            </div>
            <div class="bg-white border border-gray-200 rounded-xl p-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">What to use this for</h3>
              <ul class="space-y-4">
                <li class="flex items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-lg">Reveal and discuss the cost of team dependencies with your management team, CTO, or tech leads</span>
                </li>
                <li class="flex items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-lg">Proactively access collaboration costs for a planned reorganization</span>
                </li>
                <li class="flex items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-lg">Align team structures and architecture with your future product vision</span>
                </li>
                <li class="flex items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-lg">Visualize inefficiencies when teams report poor interactions or collaboration</span>
                </li>
                <li class="flex items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span class="text-lg">Streamline processes and improve efficiency with tech leads or management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <TeamInteractionDiagram />
      <div class="mt-6">
        <FormulaAccordion model="team" mode="internal" />
      </div>
    </div>
  </div>
</div> 