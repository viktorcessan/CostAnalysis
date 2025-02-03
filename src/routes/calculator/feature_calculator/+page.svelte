<!-- Feature Value Calculator Page -->
<script lang="ts">
  import { base } from '$app/paths';
  import { currencyStore } from '$lib/stores/currencyStore';
  import ExpertConsultationCard from '$lib/components/ui/ExpertConsultationCard.svelte';
  import ExpertModal from '$lib/components/ui/ExpertModal.svelte';
  import FeatureValueLLMTemplateModal from '$lib/components/ui/FeatureValueLLMTemplateModal.svelte';
  import FeatureValueShareModal from '$lib/components/ui/FeatureValueShareModal.svelte';
  import FeatureValueLoadingModal from '$lib/components/ui/FeatureValueLoadingModal.svelte';
  import { goto } from '$app/navigation';
  import FeatureCalculator from '../../../features/internal-analysis/components/FeatureCalculator.svelte';
  import { exportToExcel } from '$lib/utils/exportUtils';
  import html2canvas from 'html2canvas';
  import { page } from '$app/stores';
  import { parseShareLink } from '$lib/utils/featureValueShare';
  import type { FeatureValueResults } from '$lib/stores/featureValueTemplateStore';
  import { onMount } from 'svelte';

  let showExpertModal = false;
  let showLLMTemplate = false;
  let showShareModal = false;
  let showLoadingModal = false;
  let hasResults = false;
  let analysisResults: FeatureValueResults | null = null;
  let sharedResults: FeatureValueResults | null = null;
  let calculatorComponent: FeatureCalculator;

  function handleBack() {
    goto(`${base}/calculator`);
  }

  // Handle results from FeatureCalculator
  function handleResults(event: CustomEvent<any>) {
    hasResults = true;
    analysisResults = event.detail;
  }

  // Export functions
  async function handleExportExcel() {
    if (!hasResults || !analysisResults) return;
    
    await exportToExcel({
      results: {
        model: 'team' as const,
        solution: 'platform' as const,
        totalCost: analysisResults.totalCost,
        annualCost: analysisResults.totalValue,
        monthlySavings: analysisResults.totalValue / 12,
        breakEvenMonths: analysisResults.breakEvenMonths,
        monthlyData: [{
          month: 1,
          baseline: analysisResults.totalCost,
          solution: analysisResults.totalValue,
          savings: analysisResults.totalValue - analysisResults.totalCost
        }],
        costPerTicket: 0,
        efficiency: analysisResults.confidenceScore,
        recommendedTeamSize: 0,
        isViable: true
      },
      baseInputs: {
        teamSize: 1,
        hourlyRate: analysisResults.developmentCost.hourlyRate,
        serviceEfficiency: 1,
        operationalOverhead: 0
      },
      solutionInputs: {
        type: 'platform' as const,
        platform: {
          platformCost: analysisResults.totalCost,
          platformMaintenance: analysisResults.maintenanceCost.monthly,
          timeToBuild: 1,
          teamReduction: 0,
          processEfficiency: analysisResults.confidenceScore / 100,
          baselineCost: analysisResults.totalCost
        }
      }
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
      link.download = `feature-value-analysis-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('PNG Export Error:', error);
      alert('There was an error generating the PNG. Please try again.');
    }
  }

  // Handle loading shared configuration
  onMount(() => {
    const searchParams = new URLSearchParams($page.url.search);
    if (searchParams.size > 0) {
      const parsedResults = parseShareLink(searchParams);
      if (parsedResults) {
        sharedResults = parsedResults;
        showLoadingModal = true;
      }
    }
  });

  function handleLoadConfig() {
    if (sharedResults && calculatorComponent) {
      calculatorComponent.loadSharedConfig(sharedResults);
      showLoadingModal = false;
    }
  }

  function handleCancelLoad() {
    showLoadingModal = false;
    sharedResults = null;
    // Clear URL parameters
    goto($page.url.pathname, { replaceState: true });
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v.5a2 2 0 0 1 -2 2h-2a2 2 0 0 0 -2 2v.5a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2M12 3v3m0 12v3" />
                  </svg>
                </div>
              </div>
              <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 flex-1">Calculate Feature Value</h2>
            </div>
            <p class="text-base sm:text-lg text-gray-600">
              This tool helps you understand and quantify the business impact of your initiatives whether a
              project, epic, or a story. You can use this whether you're building new features, improving
              existing ones, or tackling technical improvements. The calculator guides you in
              evaluating your ideas' full potential value across four key dimensions: Increase Revenue, Protect Revenue, 
              Reduce Costs, and Avoid Costs.
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

      <!-- Feature Calculator Component -->
      <FeatureCalculator 
        on:results={handleResults} 
        bind:this={calculatorComponent}
      />

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
              id="ai_insight_feature"
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
                  id="share_analysis_feature"
                  on:click={() => showShareModal = true}
                  disabled={!hasResults}
                  class="w-full px-4 py-3 text-base font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 shadow hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div class="flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                    </svg>
                    Share Analysis
                  </div>
                </button>
                <button
                  id="export_excel_feature"
                  on:click={handleExportExcel}
                  disabled={!hasResults}

                  class="w-full px-4 py-3 text-base font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div class="flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Export to Excel
                  </div>
                </button>
                <button
                  id="export_png_feature"
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
<FeatureValueLLMTemplateModal 
  bind:show={showLLMTemplate}
  results={analysisResults}
/>
<FeatureValueShareModal 
  bind:show={showShareModal}
  results={analysisResults}
/>
<FeatureValueLoadingModal
  bind:show={showLoadingModal}
  results={sharedResults}
  onConfirm={handleLoadConfig}
  onCancel={handleCancelLoad}
/> 