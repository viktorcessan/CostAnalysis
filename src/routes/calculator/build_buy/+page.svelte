<!-- Build vs Buy Analysis Page -->
<script lang="ts">
  import { base } from '$app/paths';
  import { currencyStore } from '$lib/stores/currencyStore';
  import ExpertConsultationCard from '$lib/components/ui/ExpertConsultationCard.svelte';
  import ExpertModal from '$lib/components/ui/ExpertModal.svelte';
  import BuildBuyLLMTemplateModal from '$lib/components/ui/BuildBuyLLMTemplateModal.svelte';
  import BuildBuyShareModal from '$lib/components/ui/BuildBuyShareModal.svelte';
  import BuildBuyForm from '../../../features/build-buy/components/BuildBuyForm.svelte';
  import { goto } from '$app/navigation';
  import html2canvas from 'html2canvas';
  import { exportToExcel } from '$lib/utils/exportUtils';

  let showExpertModal = false;
  let showLLMTemplate = false;
  let showShareModal = false;
  let hasResults = false; // Track if we have analysis results
  let analysisResults: any = null; // Store analysis results

  // Function to handle form completion and results
  function handleFormResults(event: CustomEvent<any>) {
    hasResults = true;
    analysisResults = event.detail; // Store the results
  }

  function handleBack() {
    goto(`${base}/calculator`);
  }

  // Export functions
  async function handleExportExcel() {
    if (!hasResults) return;
    
    await exportToExcel({
      // Add your build/buy analysis data here when available
    });
  }

  async function handleExportPNG() {
    if (!hasResults) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = document.querySelector('#app') || document.querySelector('main');
      if (!element || !(element instanceof HTMLElement)) {
        throw new Error('Could not find main content container');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const link = document.createElement('a');
      link.download = `build-buy-analysis-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('PNG Export Error:', error);
      alert('There was an error generating the PNG. Please try again.');
    }
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
      <BuildBuyForm on:results={handleFormResults} />

      <!-- Expert Consultation Section -->
      <div class="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg p-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Expert Consultation Card -->
          <div class="lg:col-span-2">
            <ExpertConsultationCard {base} bind:showExpertModal />
          </div>

          <!-- Analysis Options Card -->
          <div class="space-y-4">
            <!-- ChatGPT Analysis -->
            <div class="bg-white rounded-xl p-6 border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">AI-Powered Insights</h3>
              <p class="text-gray-600 mb-4">Generate a customized prompt to explore your results using AI tools for deeper analysis and actionable recommendations.</p>
              <button
                on:click={() => showLLMTemplate = true}
                disabled={!hasResults}
                class="w-full px-4 py-3 text-base font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shadow hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div class="flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                  Generate AI Insights
                </div>
              </button>
            </div>

            <!-- Export Options -->
            <div class="bg-white rounded-xl p-6 border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Export Analysis</h3>
              <p class="text-gray-600 mb-4">Download your analysis for offline review or sharing.</p>
              <div class="flex flex-col gap-3">
                <button
                  on:click={() => showShareModal = true}
                  disabled={!hasResults}
                  class="w-full px-4 py-3 text-base font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 shadow hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div class="flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632 3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                    </svg>
                    Share Analysis
                  </div>
                </button>
                <button
                  on:click={handleExportExcel}
                  disabled={!hasResults}
                  class="w-full px-4 py-3 text-base font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div class="flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 00-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Export to Excel
                  </div>
                </button>
                <button
                  on:click={handleExportPNG}
                  disabled={!hasResults}
                  class="w-full px-4 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div class="flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    Export as PNG
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<ExpertModal bind:show={showExpertModal} />
<BuildBuyLLMTemplateModal 
  bind:show={showLLMTemplate}
  results={analysisResults}
/>
<BuildBuyShareModal bind:show={showShareModal} />

<style>
  /* Add any specific styles here */
</style> 