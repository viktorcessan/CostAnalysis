<!-- Build vs Buy Analysis Form -->
<script lang="ts">
  import { writable, derived } from 'svelte/store';
  import { currencyStore, type Currency } from '$lib/stores/currencyStore';
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import { onMount, tick } from 'svelte';
  import { Chart, type ChartConfiguration } from 'chart.js/auto';
  import CurrencySelector from '$lib/components/ui/CurrencySelector.svelte';

  // Add state for onboarding and restart
  let showOnboarding = true;
  let showResults = false;

  // Form state
  const formState = writable({
    // Section 1: Solution Scope
    solutionType: '',
    
    // Section 2: Business Criticality
    businessRole: '',
    timelineNeeded: '',
    usageDuration: '',
    
    // Section 3: Market Landscape
    alternativeSolutions: '',
    landscapeEvolution: '',
    marketStandardization: '',
    alternativeTypes: [] as string[],
    
    // Section 4: Control and Competency
    controlNeeded: '',
    inHouseCompetency: '',
    competencyAcquisitionTime: '',
    
    // Section 5: Cost and Resources
    buildFTEs: 0,
    buildHourlyRate: 0,
    buyCost: 0,
    buyCustomizationCost: 0,
    buyMaintenanceCost: 0,
    
    // Section 6: Time and Fit
    implementationTime: '',
    alternativeFitness: '',
    
    // Section 7: Strategic Alignment
    strategicAlignment: '',
    buildRisks: [] as string[],
    buyRisks: [] as string[]
  });

  // Results state
  type ScoreKey = 'businessCriticality' | 'timeToImplement' | 'cost' | 'control' | 'competency' | 'marketFit';
  type Scores = Record<ScoreKey, number>;

  let scores = {
    build: {
      businessCriticality: 0,
      timeToImplement: 0,
      cost: 0,
      control: 0,
      competency: 0,
      marketFit: 0
    } as Scores,
    buy: {
      businessCriticality: 0,
      timeToImplement: 0,
      cost: 0,
      control: 0,
      competency: 0,
      marketFit: 0
    } as Scores
  };
  let confidence = 0;
  let recommendation = '';

  // Options for form fields
  const solutionTypes = [
    { value: 'platform', label: 'Platform (end-to-end system that integrates multiple components)' },
    { value: 'application', label: 'Application (single-purpose software with a user interface)' },
    { value: 'component', label: 'Component (specific functionality or service, such as an API or library)' }
  ];

  const businessRoles = [
    { value: 'critical', label: 'Critical path for revenue' },
    { value: 'enabling', label: 'Business enabling' },
    { value: 'supporting', label: 'Internal supporting' }
  ];

  const timelineOptions = [
    { value: '0-3', label: '0–3 months' },
    { value: '3-6', label: '3–6 months' },
    { value: '6-12', label: '6–12 months' },
    { value: '12-24', label: '12–24 months' }
  ];

  const usageDurations = [
    { value: '<1', label: 'Less than 1 year' },
    { value: '1-3', label: '1–3 years' },
    { value: '3-5', label: '3–5 years' },
    { value: '>5', label: 'More than 5 years' }
  ];

  const alternativeCounts = [
    { value: 'none', label: 'None' },
    { value: '1-3', label: '1–3' },
    { value: '4-10', label: '4–10' },
    { value: '>10', label: 'More than 10' }
  ];

  const evolutionSpeeds = [
    { value: 'fast', label: 'Very fast (new options and standards emerge regularly)' },
    { value: 'moderate', label: 'Moderate (occasional updates and new entrants)' },
    { value: 'slow', label: 'Slow (market is mature and stable)' }
  ];

  const standardizationLevels = [
    { value: 'high', label: 'High (widely adopted standards exist)' },
    { value: 'moderate', label: 'Moderate (some standards, but variations remain)' },
    { value: 'low', label: 'Low (fragmented with little or no standardization)' }
  ];

  const alternativeTypeOptions = [
    { value: 'opensource', label: 'Open source' },
    { value: 'commercial', label: 'Commercial' }
  ];

  const controlLevels = [
    { value: 'full', label: 'Full control (extensive customization and updates required)' },
    { value: 'partial', label: 'Partial control (minor customization or updates)' },
    { value: 'none', label: 'No control (standard functionality is sufficient)' }
  ];

  const competencyLevels = [
    { value: 'full', label: 'Yes, fully' },
    { value: 'partial', label: 'Yes, partially (requires some upskilling)' },
    { value: 'none', label: 'No' }
  ];

  const fitnessLevels = [
    { value: 'high', label: 'Highly fit (requires minimal adaptation)' },
    { value: 'moderate', label: 'Moderately fit (requires some customization)' },
    { value: 'low', label: 'Poorly fit (requires extensive customization or compromises)' }
  ];

  const strategicLevels = [
    { value: 'core', label: 'Core to differentiation or competitive advantage' },
    { value: 'necessary', label: 'Necessary for operational efficiency, but not differentiating' },
    { value: 'nice', label: 'Nice to have, but not essential' }
  ];

  const buildRiskOptions = [
    { value: 'delays', label: 'Delivery delays' },
    { value: 'debt', label: 'Technical debt' },
    { value: 'staff', label: 'Reliance on internal staff' }
  ];

  const buyRiskOptions = [
    { value: 'lockin', label: 'Vendor lock-in' },
    { value: 'customization', label: 'Limited customization' },
    { value: 'costs', label: 'Rising long-term costs' }
  ];

  let activeSection = 1;
  const totalSections = 7;

  // Type for timeline scores
  type TimelineKey = '0-3' | '3-6' | '6-12' | '12-24';
  const timeScore: Record<TimelineKey, number> = {
    '0-3': 5,
    '3-6': 4,
    '6-12': 3,
    '12-24': 1
  };

  type SectionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;
  
  // Validation state for each section
  const sectionValidation = derived(formState, $formState => ({
    1: !!$formState.solutionType,
    2: !!$formState.businessRole && !!$formState.timelineNeeded && !!$formState.usageDuration,
    3: !!$formState.alternativeSolutions && !!$formState.landscapeEvolution && !!$formState.marketStandardization,
    4: !!$formState.controlNeeded && !!$formState.inHouseCompetency && 
       ($formState.inHouseCompetency !== 'none' || !!$formState.competencyAcquisitionTime),
    5: $formState.buildFTEs > 0 && $formState.buildHourlyRate > 0 && 
       $formState.buyCost > 0 && $formState.buyCustomizationCost >= 0 && $formState.buyMaintenanceCost >= 0,
    6: !!$formState.implementationTime && !!$formState.alternativeFitness,
    7: !!$formState.strategicAlignment && $formState.buildRisks.length > 0 && $formState.buyRisks.length > 0
  } as Record<SectionNumber, boolean>));

  function canProceed(): boolean {
    return $sectionValidation[activeSection as SectionNumber];
  }

  // Bind the parent container and results container
  let formContainer: HTMLElement;
  let resultsContainer: HTMLElement;

  // Helper Function to Scroll with Offset
  async function scrollToElement(element: HTMLElement, offset: number = 0) {
    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const scrollTop = absoluteElementTop - offset;

    window.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  }

  // Get Nav Height
  function getNavHeight(): number {
    const nav = document.querySelector('nav');
    return nav ? nav.clientHeight : 0;
  }

  async function nextSection() {
    if (activeSection < totalSections && canProceed()) {
      activeSection++;
      await tick(); // Wait for the DOM to update
      const navHeight = getNavHeight();
      if (formContainer) {
        scrollToElement(formContainer, navHeight);
      }
    }
  }

  async function previousSection() {
    if (activeSection > 1) {
      activeSection--;
      await tick(); // Wait for the DOM to update
      const navHeight = getNavHeight();
      if (formContainer) {
        scrollToElement(formContainer, navHeight);
      }
    }
  }

  async function handleSubmit() {
    calculateScores();
    showResults = true;
    await tick(); // Wait for DOM updates related to showResults
    const navHeight = getNavHeight();
    if (resultsContainer) {
      scrollToElement(resultsContainer, navHeight);
    }
    updateRadarChart();
  }

  function calculateScores() {
    // Calculate business criticality score
    scores.build.businessCriticality = $formState.businessRole === 'critical' ? 5 : 
                                     $formState.businessRole === 'enabling' ? 3 : 1;
    scores.buy.businessCriticality = scores.build.businessCriticality;

    // Calculate time to implement score
    scores.build.timeToImplement = timeScore[$formState.implementationTime as TimelineKey] || 3;
    scores.buy.timeToImplement = timeScore[$formState.timelineNeeded as TimelineKey] || 3;

    // Calculate cost scores
    const buildCost = ($formState.buildFTEs * $formState.buildHourlyRate * 2080); // Yearly cost
    const buyCost = $formState.buyCost + $formState.buyCustomizationCost + $formState.buyMaintenanceCost;
    
    scores.build.cost = buildCost < buyCost ? 5 : buildCost === buyCost ? 3 : 1;
    scores.buy.cost = buyCost < buildCost ? 5 : buyCost === buildCost ? 3 : 1;

    // Calculate control score
    scores.build.control = 5; // Always full control when building
    scores.buy.control = $formState.controlNeeded === 'full' ? 1 : 
                        $formState.controlNeeded === 'partial' ? 3 : 5;

    // Calculate competency score
    scores.build.competency = $formState.inHouseCompetency === 'full' ? 5 :
                            $formState.inHouseCompetency === 'partial' ? 3 : 1;
    scores.buy.competency = 5; // Assuming vendor has full competency

    // Calculate market fit score
    scores.build.marketFit = 3; // Neutral for build
    scores.buy.marketFit = $formState.alternativeFitness === 'high' ? 5 :
                          $formState.alternativeFitness === 'moderate' ? 3 : 1;

    // Calculate confidence based on the spread of scores
    const buildTotal = Object.values(scores.build).reduce((a, b) => a + b, 0);
    const buyTotal = Object.values(scores.buy).reduce((a, b) => a + b, 0);
    const scoreDiff = Math.abs(buildTotal - buyTotal);
    
    confidence = Math.min(100, Math.round((scoreDiff / 30) * 100)); // 30 is max possible difference

    // Generate recommendation
    if (buildTotal > buyTotal + 3) {
      recommendation = 'Build';
    } else if (buyTotal > buildTotal + 3) {
      recommendation = 'Buy';
    } else {
      recommendation = 'Tie - Consider Other Factors';
    }
  }

  // Format currency for display
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: $currencyStore.code
    }).format(value);
  }

  // Get currency symbol
  function getCurrencySymbol(currencyConfig: { code: Currency; symbol: string }): string {
    return currencyConfig.symbol;
  }

  function startAnalysis() {
    showOnboarding = false;
  }

  function restartAnalysis() {
    // Reset all state
    formState.set({
      solutionType: '',
      businessRole: '',
      timelineNeeded: '',
      usageDuration: '',
      alternativeSolutions: '',
      landscapeEvolution: '',
      marketStandardization: '',
      alternativeTypes: [],
      controlNeeded: '',
      inHouseCompetency: '',
      competencyAcquisitionTime: '',
      buildFTEs: 0,
      buildHourlyRate: 0,
      buyCost: 0,
      buyCustomizationCost: 0,
      buyMaintenanceCost: 0,
      implementationTime: '',
      alternativeFitness: '',
      strategicAlignment: '',
      buildRisks: [],
      buyRisks: []
    });
    activeSection = 1;
    showResults = false;
    showOnboarding = true;
  }

  let radarChart: Chart | null = null;

  function createRadarChart(canvas: HTMLCanvasElement) {
    const config: ChartConfiguration = {
      type: 'radar',
      data: {
        labels: [
          'Business Criticality',
          'Time to Implement',
          'Cost',
          'Control',
          'Competency',
          'Market Fit'
        ],
        datasets: [
          {
            label: 'Build',
            data: Object.values(scores.build),
            fill: true,
            backgroundColor: 'rgba(230, 105, 0, 0.1)', // secondary color with opacity
            borderColor: 'rgb(230, 105, 0)', // secondary color
            borderWidth: 2,
            pointBackgroundColor: 'rgb(230, 105, 0)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(230, 105, 0)',
            pointRadius: 3,
            pointHoverRadius: 4
          },
          {
            label: 'Buy',
            data: Object.values(scores.buy),
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.1)', // blue-500 with opacity
            borderColor: 'rgb(59, 130, 246)', // blue-500
            borderWidth: 2,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(59, 130, 246)',
            pointRadius: 3,
            pointHoverRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 5,
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                if (typeof value === 'number') {
                  return value.toFixed(0);
                }
                return '';
              },
              color: 'rgb(107, 114, 128)'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              lineWidth: 1
            },
            angleLines: {
              color: 'rgba(0, 0, 0, 0.1)',
              lineWidth: 1
            },
            pointLabels: {
              font: {
                size: 11,
                family: "'Inter', system-ui, sans-serif",
                weight: 500
              },
              padding: 8,
              color: 'rgb(55, 65, 81)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                family: "'Inter', system-ui, sans-serif",
                size: 12
              },
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: 'rgb(17, 24, 39)',
            bodyColor: 'rgb(55, 65, 81)',
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            titleFont: {
              size: 13,
              weight: 600,
              family: "'Inter', system-ui, sans-serif"
            },
            bodyFont: {
              size: 12,
              family: "'Inter', system-ui, sans-serif"
            },
            callbacks: {
              title: (items) => items[0]?.label || '',
              label: (context) => {
                const value = typeof context.raw === 'number' ? context.raw.toFixed(1) : '0.0';
                return `${context.dataset.label}: ${value}`;
              }
            }
          }
        }
      }
    };

    return new Chart(canvas, config);
  }

  function updateRadarChart() {
    const canvas = document.getElementById('build-buy-radar') as HTMLCanvasElement;
    if (!canvas) return;

    if (radarChart) {
      radarChart.destroy();
    }

    radarChart = createRadarChart(canvas);
  }

  $: if (showResults) {
    // Use setTimeout to ensure DOM is ready
    setTimeout(updateRadarChart, 0);
  }

  onMount(() => {
    if (showResults) {
      updateRadarChart();
    }
  });
</script>

<style>
  .form-sections {
    /* Ensure the container takes full available height */
    height: 100%;
    /* Hide overflow to prevent scrollbar */
    overflow: hidden;
  }
</style>

{#if showOnboarding}
  <!-- Onboarding View -->
  <div class="w-full bg-white rounded-xl border border-gray-200">
    <div class="max-w-5xl mx-auto p-4 sm:p-8 lg:p-12">
      <!-- Title and Description -->
      <div class="text-center mb-8 sm:mb-12">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Build vs Buy Analysis</h2>
        <p class="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl mx-auto text-center">
          Answer a few questions about your needs and get a data-driven recommendation on whether to build or buy your solution.
        </p>
      </div>

      <div class="grid gap-6 sm:gap-8 lg:gap-12 md:grid-cols-2">
        <!-- Left Column: Steps -->
        <div class="relative">
          <!-- Timeline line -->
          <div class="absolute left-[19px] top-[28px] bottom-4 w-px bg-gradient-to-b from-secondary to-secondary/20"></div>
          
          <div class="space-y-6 sm:space-y-8">
            {#each Array(7) as _, i}
              <div class="relative flex items-start">
                <div class="absolute left-0 top-0 w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-white border-2 border-secondary flex items-center justify-center">
                  <span class="text-xs sm:text-sm font-medium text-secondary">{i + 1}</span>
                </div>
                <div class="ml-12 sm:ml-16">
                  <h4 class="text-sm sm:text-base font-medium text-gray-900 mb-1">
                    {i === 0 ? 'Define Solution Scope' :
                     i === 1 ? 'Assess Business Criticality' :
                     i === 2 ? 'Evaluate Market Landscape' :
                     i === 3 ? 'Review Control & Competency' :
                     i === 4 ? 'Calculate Costs & Resources' :
                     i === 5 ? 'Estimate Implementation Time' :
                     'Consider Strategic Alignment'}
                  </h4>
                  <p class="text-xs sm:text-sm text-gray-600">
                    {i === 0 ? 'Choose the type of solution you want to evaluate' :
                     i === 1 ? 'Determine how critical this solution is for your business' :
                     i === 2 ? 'Understand the available alternatives in the market' :
                     i === 3 ? 'Assess your team\'s capabilities and control requirements' :
                     i === 4 ? 'Compare the costs of building vs buying' :
                     i === 5 ? 'Plan your implementation timeline' :
                     'Align with your strategic objectives'}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Right Column: Benefits -->
        <div class="space-y-6 sm:space-y-8">
          <div class="bg-gray-50 rounded-xl p-4 sm:p-6">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg class="w-5 h-5 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              What You'll Get
            </h3>
            <ul class="space-y-3 sm:space-y-4">
              {#each [
                ['Clear recommendation', 'Get a data-driven build vs buy recommendation with confidence score'],
                ['Detailed analysis', 'See how each option scores across 6 key dimensions'],
                ['Cost comparison', 'Compare total costs and ROI between building and buying'],
                ['Risk assessment', 'Identify potential risks and challenges for both options'],
                ['Strategic insights', 'Understand how each option aligns with your business goals']
              ] as [title, description]}
                <li class="flex items-start">
                  <div class="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <svg class="w-3 h-3 sm:w-4 sm:h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h4 class="text-xs sm:text-sm font-medium text-gray-900">{title}</h4>
                    <p class="text-xs text-gray-500">{description}</p>
                  </div>
                </li>
              {/each}
            </ul>
          </div>

          <!-- Time Estimate -->
          <div class="bg-gray-50 rounded-xl p-4 sm:p-6">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-4">
                <svg class="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-900">Time to Complete</h4>
                <p class="text-xs text-gray-500">Takes approximately 5-10 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Start Button -->
    <div class="flex justify-center pb-6 sm:pb-12">
      <button
        type="button"
        class="group px-6 sm:px-8 py-3 sm:py-4 bg-secondary text-white text-base sm:text-lg font-medium rounded-xl hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all duration-200"
        on:click={startAnalysis}
      >
        <span class="flex items-center">
          Start Analysis
          <svg class="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
      </button>
    </div>
  </div>
{:else}
  <!-- Form View - Keep currency selector here -->
  <div class="w-full bg-white rounded-xl shadow-lg" bind:this={formContainer}>
    <div class="p-4 sm:p-6 relative">
      <!-- Title and Currency Area -->
      <div class="flex flex-col items-center mb-6 sm:mb-8 relative pt-12 sm:pt-0">
        <!-- Currency Selector - Repositioned -->
        <div class="absolute top-0 left-0 right-0 flex justify-center sm:justify-end sm:right-4 sm:top-4">
          <CurrencySelector />
        </div>

        <h3 class="text-lg sm:text-xl font-semibold text-gray-900">Build vs Buy Questionnaire</h3>
        <p class="text-xs sm:text-sm text-gray-600 mt-1 text-center">Answer the questions below to get your personalized recommendation</p>
      </div>

      <!-- Progress indicator -->
      <div class="mb-6 sm:mb-8">
        <div class="flex items-center justify-between mb-2">
          <div class="flex-1 flex items-center">
            {#each Array(totalSections) as _, i}
              <div class="flex-1 flex items-center">
                <div
                  class="w-3 h-3 rounded-full transition-colors duration-200 {i + 1 <= activeSection ? 'bg-secondary' : 'bg-gray-200'}"
                ></div>
                {#if i < totalSections - 1}
                  <div
                    class="flex-1 h-0.5 mx-1 transition-colors duration-200 {i + 1 < activeSection ? 'bg-secondary' : 'bg-gray-200'}"
                  ></div>
                {/if}
              </div>
            {/each}
          </div>
          <span class="ml-4 text-sm text-gray-500 whitespace-nowrap">Step {activeSection} of {totalSections}</span>
        </div>
        <!-- Step Title -->
        <p class="text-sm font-medium text-gray-600 mt-2">
          {#if activeSection === 1}
            Define your solution scope
          {:else if activeSection === 2}
            Assess business criticality
          {:else if activeSection === 3}
            Evaluate market landscape
          {:else if activeSection === 4}
            Review control & competency
          {:else if activeSection === 5}
            Calculate costs & resources
          {:else if activeSection === 6}
            Estimate implementation time
          {:else}
            Consider strategic alignment
          {/if}
        </p>
      </div>

      <!-- Form sections -->
      <div class="form-sections">
        <form on:submit|preventDefault={handleSubmit} class="space-y-6 sm:space-y-8">
          <!-- Section 1: Solution Scope -->
          <div class="space-y-4 sm:space-y-6" class:hidden={activeSection !== 1}>
            <div class="bg-white p-4 sm:p-8 rounded-xl border border-gray-200">
              <div class="w-full">
                <h2 class="text-lg sm:text-xl font-semibold text-gray-900 mb-2">What are you considering building vs. buying?</h2>
                <p class="text-sm text-gray-600 mb-4 sm:mb-6">Choose the type of solution you're evaluating. This helps us tailor the analysis to your specific needs.</p>
                
                <div class="grid grid-cols-1 gap-3 sm:gap-4">
                  {#each solutionTypes as option}
                    <label class="block">
                      <div class="flex items-start p-4 sm:p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.solutionType === option.value ? 'border-secondary bg-secondary/5' : ''}">
                        <input
                          type="radio"
                          name="solutionType"
                          value={option.value}
                          bind:group={$formState.solutionType}
                          class="mt-1 text-secondary focus:ring-secondary"
                        />
                        <div class="ml-3 flex-1">
                          <span class="block text-lg font-medium text-gray-900">{option.label.split('(')[0]}</span>
                          <span class="block text-sm text-gray-500 mt-2">({option.label.split('(')[1]}</span>
                        </div>
                      </div>
                    </label>
                  {/each}
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Business Criticality -->
          <div class="space-y-6" class:hidden={activeSection !== 2}>
            <div class="bg-white p-8 rounded-xl border border-gray-200">
              <div class="w-full">
                <h2 class="text-xl font-semibold text-gray-900 mb-2">How business-critical will this solution be?</h2>
                <p class="text-gray-600 mb-8">Assess the importance and urgency of this solution for your business operations.</p>
                
                <div class="space-y-8">
                  <!-- Business Role -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">What role does this solution play?</h3>
                      <p class="text-sm text-gray-600 mt-1">Select the option that best describes how this solution impacts your business.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                      {#each businessRoles as option}
                        <label class="block">
                          <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.businessRole === option.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="businessRole"
                              value={option.value}
                              bind:group={$formState.businessRole}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                              <span class="block text-lg font-medium text-gray-900">{option.label}</span>
                              <span class="block text-sm text-gray-500 mt-2">
                                {#if option.value === 'critical'}
                                  Direct impact on revenue and customer experience
                                {:else if option.value === 'enabling'}
                                  Improves operational efficiency and team productivity
                                {:else}
                                  Supports internal processes and administrative tasks
                                {/if}
                              </span>
                            </div>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- Timeline Needed -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">When do you need this solution?</h3>
                      <p class="text-sm text-gray-600 mt-1">Specify your target timeline for having the solution in production.</p>
                    </div>
                    <!-- Time Period Grid (Months) - Updated for consistency -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {#each timelineOptions as option}
                        <label class="block">
                          <div class="flex items-center justify-center h-[72px] p-4 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.timelineNeeded === option.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="timelineNeeded"
                              value={option.value}
                              bind:group={$formState.timelineNeeded}
                              class="sr-only"
                            />
                            <div class="text-center">
                              <span class="text-sm sm:text-base font-medium text-gray-900 whitespace-nowrap">{option.label}</span>
                            </div>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- Usage Duration -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">Expected Usage Duration</h3>
                      <p class="text-sm text-gray-600 mt-1">How long do you expect to use this solution?</p>
                    </div>
                    <!-- Usage Duration Grid - Updated for consistency -->
                    <div class="grid grid-cols-2 gap-3">
                      {#each usageDurations as option}
                        <label class="block">
                          <div class="flex items-center justify-center h-[72px] p-4 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.usageDuration === option.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="usageDuration"
                              value={option.value}
                              bind:group={$formState.usageDuration}
                              class="sr-only"
                            />
                            <div class="text-center">
                              <span class="text-sm sm:text-base font-medium text-gray-900 whitespace-nowrap">{option.label}</span>
                            </div>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Market Landscape -->
          <div class="space-y-6" class:hidden={activeSection !== 3}>
            <div class="bg-white p-8 rounded-xl border border-gray-200">
              <div class="w-full">
                <h2 class="text-xl font-semibold text-gray-900 mb-2">Market Landscape Analysis</h2>
                <p class="text-gray-600 mb-8">Evaluate the current market state and available alternatives for your solution.</p>
                
                <div class="space-y-8">
                  <!-- Alternative Solutions -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">How many alternative solutions exist in the market?</h3>
                      <p class="text-sm text-gray-600 mt-1">Consider both commercial and open-source alternatives that could meet your needs.</p>
                    </div>
                    <!-- Alternative Solutions Grid -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {#each alternativeCounts as option}
                        <label class="block">
                          <div class="flex items-center justify-center p-4 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.alternativeSolutions === option.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="alternativeSolutions"
                              value={option.value}
                              bind:group={$formState.alternativeSolutions}
                              class="sr-only"
                            />
                            <span class="text-sm sm:text-base font-medium text-center text-gray-900">{option.label}</span>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- Landscape Evolution -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">How fast is this landscape evolving?</h3>
                      <p class="text-sm text-gray-600 mt-1">Assess the rate of change and innovation in this solution space.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                      {#each evolutionSpeeds as option}
                        <label class="block">
                          <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.landscapeEvolution === option.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="landscapeEvolution"
                              value={option.value}
                              bind:group={$formState.landscapeEvolution}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                              <span class="block text-lg font-medium text-gray-900">{option.label.split('(')[0]}</span>
                              <span class="block text-sm text-gray-500 mt-2">({option.label.split('(')[1]}</span>
                            </div>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- Market Standardization -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">How standardized is the market?</h3>
                      <p class="text-sm text-gray-600 mt-1">Evaluate the level of standardization and maturity in the solution space.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                      {#each standardizationLevels as option}
                        <label class="block">
                          <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.marketStandardization === option.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="marketStandardization"
                              value={option.value}
                              bind:group={$formState.marketStandardization}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                              <span class="block text-lg font-medium text-gray-900">{option.label.split('(')[0]}</span>
                              <span class="block text-sm text-gray-500 mt-2">({option.label.split('(')[1]}</span>
                            </div>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- Alternative Types -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">What types of alternatives are available?</h3>
                      <p class="text-sm text-gray-600 mt-1">Select all types of solutions that exist in the market.</p>
                    </div>
                    <!-- Alternative Types (Open Source/Commercial) -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {#each alternativeTypeOptions as option}
                        <label class="block">
                          <div class="flex items-center p-4 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.alternativeTypes.includes(option.value) ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="checkbox"
                              value={option.value}
                              bind:group={$formState.alternativeTypes}
                              class="h-4 w-4 text-secondary focus:ring-secondary rounded"
                            />
                            <span class="ml-3 text-sm sm:text-base font-medium text-gray-900">{option.label}</span>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 4: Control and Competency -->
          <div class="space-y-6" class:hidden={activeSection !== 4}>
            <div class="bg-white p-8 rounded-xl border border-gray-200">
              <div class="w-full">
                <h2 class="text-xl font-semibold text-gray-900 mb-2">Control and Competency Assessment</h2>
                <p class="text-gray-600 mb-8">Evaluate your team's capabilities and control requirements for the solution.</p>
                
                <div class="space-y-8">
                  <!-- Control Needed -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">How much control do you need over the solution?</h3>
                      <p class="text-sm text-gray-600 mt-1">Consider customization needs, update frequency, and integration requirements.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                      {#each controlLevels as option}
                        <label class="block">
                          <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.controlNeeded === option.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="controlNeeded"
                              value={option.value}
                              bind:group={$formState.controlNeeded}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                              <span class="block text-lg font-medium text-gray-900">{option.label.split('(')[0]}</span>
                              <span class="block text-sm text-gray-500 mt-2">({option.label.split('(')[1]}</span>
                            </div>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- In-House Competency -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">Does your team have the required competencies?</h3>
                      <p class="text-sm text-gray-600 mt-1">Assess your team's current technical capabilities and expertise.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                      {#each competencyLevels as option}
                        <label class="block">
                          <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.inHouseCompetency === option.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="inHouseCompetency"
                              value={option.value}
                              bind:group={$formState.inHouseCompetency}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                              <span class="block text-lg font-medium text-gray-900">{option.label}</span>
                              <span class="block text-sm text-gray-500 mt-2">
                                {option.value === 'full' ? 'Team has all required skills and experience' :
                                 option.value === 'partial' ? 'Team needs some training or additional expertise' :
                                 'Team lacks most required skills'}
                              </span>
                            </div>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- Competency Acquisition Time (Conditional) -->
                  {#if $formState.inHouseCompetency === 'none' || $formState.inHouseCompetency === 'partial'}
                    <div class="space-y-4">
                      <div class="mb-4">
                        <h3 class="text-base font-medium text-gray-900">How long would it take to acquire needed competencies?</h3>
                        <p class="text-sm text-gray-600 mt-1">Estimate time needed for training or hiring to fill skill gaps.</p>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        {#each timelineOptions as option}
                          <label class="block">
                            <div class="flex items-center p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.competencyAcquisitionTime === option.value ? 'border-secondary bg-secondary/5' : ''}">
                              <input
                                type="radio"
                                name="competencyAcquisitionTime"
                                value={option.value}
                                bind:group={$formState.competencyAcquisitionTime}
                                class="text-secondary focus:ring-secondary"
                              />
                              <span class="ml-3 text-lg font-medium text-gray-900">{option.label}</span>
                            </div>
                          </label>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          </div>

          <!-- Section 5: Cost and Resources -->
          <div class="space-y-6" class:hidden={activeSection !== 5}>
            <div class="bg-white p-8 rounded-xl border border-gray-200">
              <div class="w-full">
                <h2 class="text-xl font-semibold text-gray-900 mb-2">Cost and Resource Requirements</h2>
                <p class="text-gray-600 mb-8">Compare the financial implications of building versus buying the solution.</p>
                
                <div class="space-y-8">
                  <!-- Build Costs -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">Build Cost Estimation</h3>
                      <p class="text-sm text-gray-600 mt-1">Calculate the resources and costs needed for in-house development.</p>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div class="p-6 rounded-xl border-2 border-gray-200">
                        <label class="block text-base font-medium text-gray-900 mb-2">Number of FTEs Required</label>
                        <p class="text-sm text-gray-600 mb-4">Full-time equivalent employees needed for development</p>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          bind:value={$formState.buildFTEs}
                          class="block w-full rounded-lg border-gray-200 shadow-sm focus:border-secondary focus:ring-secondary text-lg"
                          placeholder="0.0"
                        />
                      </div>
                      <div class="p-6 rounded-xl border-2 border-gray-200">
                        <label class="block text-base font-medium text-gray-900 mb-2">Average Hourly Rate</label>
                        <p class="text-sm text-gray-600 mb-4">Cost per hour per FTE in {$currencyStore.code}</p>
                        <div class="relative">
                          <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 text-lg">
                            {getCurrencySymbol($currencyStore)}
                          </span>
                          <input
                            type="number"
                            min="0"
                            bind:value={$formState.buildHourlyRate}
                            class="block w-full pl-10 rounded-lg border-gray-200 shadow-sm focus:border-secondary focus:ring-secondary text-lg"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    <!-- Yearly Cost Preview -->
                    <div class="mt-4 p-4 bg-secondary/5 rounded-lg">
                      <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600">Estimated Yearly Cost:</span>
                        <span class="text-lg font-semibold text-secondary">
                          {formatCurrency($formState.buildFTEs * $formState.buildHourlyRate * 2080)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Buy Costs -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">Buy Cost Breakdown</h3>
                      <p class="text-sm text-gray-600 mt-1">Detail the various costs associated with purchasing a solution.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                      <div class="p-6 rounded-xl border-2 border-gray-200">
                        <label class="block text-base font-medium text-gray-900 mb-2">Initial Purchase Cost</label>
                        <p class="text-sm text-gray-600 mb-4">One-time cost to acquire the solution</p>
                        <div class="relative">
                          <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 text-lg">
                            {getCurrencySymbol($currencyStore)}
                          </span>
                          <input
                            type="number"
                            min="0"
                            bind:value={$formState.buyCost}
                            class="block w-full pl-10 rounded-lg border-gray-200 shadow-sm focus:border-secondary focus:ring-secondary text-lg"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div class="p-6 rounded-xl border-2 border-gray-200">
                        <label class="block text-base font-medium text-gray-900 mb-2">Customization & Integration Cost</label>
                        <p class="text-sm text-gray-600 mb-4">One-time cost for adapting the solution to your needs</p>
                        <div class="relative">
                          <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 text-lg">
                            {getCurrencySymbol($currencyStore)}
                          </span>
                          <input
                            type="number"
                            min="0"
                            bind:value={$formState.buyCustomizationCost}
                            class="block w-full pl-10 rounded-lg border-gray-200 shadow-sm focus:border-secondary focus:ring-secondary text-lg"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div class="p-6 rounded-xl border-2 border-gray-200">
                        <label class="block text-base font-medium text-gray-900 mb-2">Annual Maintenance Cost</label>
                        <p class="text-sm text-gray-600 mb-4">Yearly cost for licenses, support, and updates</p>
                        <div class="relative">
                          <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 text-lg">
                            {getCurrencySymbol($currencyStore)}
                          </span>
                          <input
                            type="number"
                            min="0"
                            bind:value={$formState.buyMaintenanceCost}
                            class="block w-full pl-10 rounded-lg border-gray-200 shadow-sm focus:border-secondary focus:ring-secondary text-lg"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    <!-- Total First Year Cost Preview -->
                    <div class="mt-4 p-4 bg-secondary/5 rounded-lg">
                      <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600">Total First Year Cost:</span>
                        <span class="text-lg font-semibold text-secondary">
                          {formatCurrency($formState.buyCost + $formState.buyCustomizationCost + $formState.buyMaintenanceCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 6: Time and Fit -->
          <div class="space-y-6" class:hidden={activeSection !== 6}>
            <div class="bg-white p-8 rounded-xl border border-gray-200">
              <div class="w-full">
                <h2 class="text-xl font-semibold text-gray-900 mb-2">Implementation Time and Fit Assessment</h2>
                <p class="text-gray-600 mb-8">Evaluate the implementation timeline and how well existing solutions match your needs.</p>
                
                <div class="space-y-8">
                  <!-- Implementation Time -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">How long will it take to implement this solution?</h3>
                      <p class="text-sm text-gray-600 mt-1">Estimate the time needed for development, customization, and deployment.</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      {#each timelineOptions as option}
                        <label class="block">
                          <div class="flex items-center p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.implementationTime === option.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="implementationTime"
                              value={option.value}
                              bind:group={$formState.implementationTime}
                              class="text-secondary focus:ring-secondary"
                            />
                            <span class="ml-3 text-lg font-medium text-gray-900">{option.label}</span>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- Alternative Fitness -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">How well do existing solutions fit your needs?</h3>
                      <p class="text-sm text-gray-600 mt-1">Assess how much customization would be needed for available alternatives.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                      {#each fitnessLevels as option}
                        <label class="block">
                          <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.alternativeFitness === option.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="alternativeFitness"
                              value={option.value}
                              bind:group={$formState.alternativeFitness}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                              <span class="block text-lg font-medium text-gray-900">{option.label.split('(')[0]}</span>
                              <span class="block text-sm text-gray-500 mt-2">
                                {option.value === 'high' ? 'Solution can be used with minimal changes' :
                                 option.value === 'moderate' ? 'Some customization needed but feasible' :
                                 'Extensive modifications required to meet needs'}
                              </span>
                            </div>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 7: Strategic Alignment -->
          <div class="space-y-6" class:hidden={activeSection !== 7}>
            <div class="bg-white p-8 rounded-xl border border-gray-200">
              <div class="w-full">
                <h2 class="text-xl font-semibold text-gray-900 mb-2">Strategic Alignment and Risks</h2>
                <p class="text-gray-600 mb-8">Assess how this solution aligns with your strategy and identify potential risks.</p>
                
                <div class="space-y-8">
                  <!-- Strategic Alignment -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">How central is this solution to your strategy?</h3>
                      <p class="text-sm text-gray-600 mt-1">Evaluate the strategic importance and competitive advantage of this solution.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                      {#each strategicLevels as option}
                        <label class="block">
                          <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.strategicAlignment === option.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="strategicAlignment"
                              value={option.value}
                              bind:group={$formState.strategicAlignment}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                              <span class="block text-lg font-medium text-gray-900">{option.label}</span>
                              <span class="block text-sm text-gray-500 mt-2">
                                {option.value === 'core' ? 'Critical for maintaining competitive advantage' :
                                 option.value === 'necessary' ? 'Important for business operations but not a key differentiator' :
                                 'Beneficial but not critical for operations'}
                              </span>
                            </div>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- Risks -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <!-- Build Risks -->
                    <div class="space-y-4">
                      <div class="mb-4">
                        <h3 class="text-base font-medium text-gray-900">Build Risks</h3>
                        <p class="text-sm text-gray-600 mt-1">Select potential risks of building in-house.</p>
                      </div>
                      <div class="p-6 rounded-xl border-2 border-gray-200">
                        <div class="space-y-4">
                          {#each buildRiskOptions as option}
                            <label class="flex items-start">
                              <input
                                type="checkbox"
                                value={option.value}
                                bind:group={$formState.buildRisks}
                                class="mt-1 h-5 w-5 text-secondary focus:ring-secondary rounded"
                              />
                              <div class="ml-3">
                                <span class="block text-base font-medium text-gray-900">{option.label}</span>
                                <span class="block text-sm text-gray-500 mt-1">
                                  {option.value === 'delays' ? 'Project delivery delays' :
                                   option.value === 'debt' ? 'Technical debt accumulation' :
                                   'Key staff dependencies'}
                                </span>
                              </div>
                            </label>
                          {/each}
                        </div>
                      </div>
                    </div>

                    <!-- Buy Risks -->
                    <div class="space-y-4">
                      <div class="mb-4">
                        <h3 class="text-base font-medium text-gray-900">Buy Risks</h3>
                        <p class="text-sm text-gray-600 mt-1">Select potential risks of purchasing a solution.</p>
                      </div>
                      <div class="p-6 rounded-xl border-2 border-gray-200">
                        <div class="space-y-4">
                          {#each buyRiskOptions as option}
                            <label class="flex items-start">
                              <input
                                type="checkbox"
                                value={option.value}
                                bind:group={$formState.buyRisks}
                                class="mt-1 h-5 w-5 text-secondary focus:ring-secondary rounded"
                              />
                              <div class="ml-3">
                                <span class="block text-base font-medium text-gray-900">{option.label}</span>
                                <span class="block text-sm text-gray-500 mt-1">
                                  {option.value === 'lockin' ? 'Vendor lock-in risk' :
                                   option.value === 'customization' ? 'Limited customization options' :
                                   'Potential cost increases'}
                                </span>
                              </div>
                            </label>
                          {/each}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between pt-4 sm:pt-6 gap-3 sm:gap-4">
            <button
              type="button"
              class="min-w-[80px] sm:min-w-[100px] px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:border-secondary hover:text-secondary transition-colors shadow-sm text-sm sm:text-base {activeSection === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
              on:click={previousSection}
              disabled={activeSection === 1}
            >
              Previous
            </button>
            
            {#if activeSection === totalSections}
              <button
                type="submit"
                class="min-w-[80px] sm:min-w-[100px] px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-white font-medium bg-secondary hover:bg-secondary/90 shadow-md transition-colors text-sm sm:text-base {canProceed() ? '' : 'opacity-50 cursor-not-allowed'}"
                disabled={!canProceed()}
              >
                Calculate
              </button>
            {:else}
              <button
                type="button"
                class="min-w-[80px] sm:min-w-[100px] px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-white font-medium bg-secondary hover:bg-secondary/90 shadow-md transition-colors text-sm sm:text-base {canProceed() ? '' : 'opacity-50 cursor-not-allowed'}"
                on:click={nextSection}
                disabled={!canProceed()}
              >
                Next
              </button>
            {/if}
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Results Section -->
  {#if showResults}
    <div class="mt-6 sm:mt-8 space-y-4 sm:space-y-6" bind:this={resultsContainer}>
      <div class="bg-white p-4 sm:p-8 rounded-xl border border-gray-200">
        <!-- Header with Project Info -->
        <div class="text-center mb-6 sm:mb-8">
          <h3 class="text-xl sm:text-2xl font-semibold text-gray-900">Build vs Buy Analysis</h3>
          <p class="text-base sm:text-lg font-medium text-gray-700 mt-2">{$formState.solutionType === 'platform' ? 'Platform Solution' : 
            $formState.solutionType === 'application' ? 'Application Solution' : 'Component Solution'}</p>
          <p class="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl mx-auto">
            Based on your requirements and constraints, here's our detailed analysis
          </p>
        </div>
        
        <!-- Primary Recommendation -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div class="md:col-span-2 p-6 bg-gradient-to-br from-secondary/5 to-transparent rounded-xl border border-secondary/20">
            <div class="flex items-start justify-between">
              <div>
                <h4 class="text-lg font-semibold text-gray-900 mb-2">Recommendation</h4>
                <p class="text-3xl font-bold text-secondary mb-4">{recommendation}</p>
                <div class="prose prose-sm text-gray-600">
                  {#if recommendation === 'Build'}
                    <ul class="space-y-2">
                      <li>Your team has the required competencies</li>
                      <li>The solution is strategically important</li>
                      <li>You need significant customization control</li>
                    </ul>
                  {:else if recommendation === 'Buy'}
                    <ul class="space-y-2">
                      <li>Market solutions fit your needs well</li>
                      <li>Faster time to market</li>
                      <li>Lower initial investment needed</li>
                    </ul>
                  {:else}
                    <ul class="space-y-2">
                      <li>Both options have comparable benefits</li>
                      <li>Consider team preference and long-term strategy</li>
                      <li>Hybrid approach might be worth exploring</li>
                    </ul>
                  {/if}
                </div>
              </div>
              <!-- Confidence Score -->
              <div class="text-right">
                <div class="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white border-4 border-secondary relative">
                  <div class="text-center">
                    <p class="text-3xl font-bold text-secondary">{confidence}%</p>
                    <p class="text-xs text-gray-600">Confidence</p>
                  </div>
                  <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="4" class="text-secondary/20"/>
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="4" 
                      stroke-dasharray={`${confidence * 3.02} 302`} class="text-secondary transition-all duration-1000"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Cost Summary -->
          <div class="p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h4>
            <div class="space-y-4">
              <div class="p-3 bg-white rounded-lg border border-blue-100">
                <p class="text-sm text-gray-600">Build (First Year)</p>
                <p class="text-xl font-semibold text-gray-900">
                  {formatCurrency($formState.buildFTEs * $formState.buildHourlyRate * 2080)}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Based on {$formState.buildFTEs} FTEs at {formatCurrency($formState.buildHourlyRate)}/hour
                </p>
              </div>
              <div class="p-3 bg-white rounded-lg border border-blue-100">
                <p class="text-sm text-gray-600">Buy (First Year)</p>
                <p class="text-xl font-semibold text-gray-900">
                  {formatCurrency($formState.buyCost + $formState.buyCustomizationCost + $formState.buyMaintenanceCost)}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Including setup and maintenance costs
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Analysis -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
          <!-- Score Comparison -->
          <div class="bg-white p-6 rounded-xl border border-gray-200">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Dimension Analysis</h4>
            <div class="space-y-4">
              {#each ['businessCriticality', 'timeToImplement', 'cost', 'control', 'competency', 'marketFit'] as dimension}
                {@const buildScore = scores.build[dimension as keyof typeof scores.build]}
                {@const buyScore = scores.buy[dimension as keyof typeof scores.buy]}
                <div class="p-4 bg-gray-50 rounded-lg">
                  <div class="flex justify-between items-center mb-2">
                    <h5 class="font-medium text-gray-900">
                      {dimension.split(/(?=[A-Z])/).join(' ')}
                    </h5>
                    <div class="flex gap-4 text-sm">
                      <span class="text-secondary">Build: {buildScore}</span>
                      <span class="text-blue-600">Buy: {buyScore}</span>
                    </div>
                  </div>
                  <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="flex h-full">
                      <div class="h-full bg-secondary" style="width: {(buildScore / 5) * 50}%"></div>
                      <div class="h-full bg-blue-500" style="width: {(buyScore / 5) * 50}%"></div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Strategic Alignment -->
          <div class="bg-white p-6 rounded-xl border border-gray-200">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Strategic Considerations</h4>
            <div class="space-y-6">
              <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex items-start gap-4">
                  <div class="p-2 bg-secondary/10 rounded-lg">
                    <svg class="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h5 class="font-medium text-gray-900">
                      {$formState.strategicAlignment === 'core' ? 'Core Strategic Solution' :
                       $formState.strategicAlignment === 'necessary' ? 'Business-Critical Solution' :
                       'Supporting Solution'}
                    </h5>
                    <p class="text-sm text-gray-600 mt-1">
                      {$formState.strategicAlignment === 'core' ? 'This solution directly impacts your competitive advantage.' :
                       $formState.strategicAlignment === 'necessary' ? 'Critical for operations but not a key differentiator.' :
                       'Beneficial but not critical for core operations.'}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Market Context -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex items-start gap-4">
                  <div class="p-2 bg-blue-50 rounded-lg">
                    <svg class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <h5 class="font-medium text-gray-900">Market Context</h5>
                    <p class="text-sm text-gray-600 mt-1">
                      {$formState.alternativeSolutions === 'none' ? 'No viable alternatives in the market.' :
                       $formState.alternativeSolutions === '1-3' ? 'Limited market options available.' :
                       $formState.alternativeSolutions === '4-10' ? 'Healthy market with multiple options.' :
                       'Mature market with many alternatives.'}
                      Market is {$formState.landscapeEvolution} evolving with {$formState.marketStandardization} standardization.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Analysis -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <!-- Build Risks -->
          <div class="bg-white p-6 rounded-xl border border-gray-200">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Build Considerations</h4>
            <div class="space-y-4">
              <!-- Competency -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <h5 class="font-medium text-gray-900 mb-2">Team Competency</h5>
                <p class="text-sm text-gray-600">
                  {$formState.inHouseCompetency === 'full' ? 'Team has full competency for development.' :
                   $formState.inHouseCompetency === 'partial' ? 'Some upskilling needed but basic competency exists.' :
                   'Significant training or hiring would be required.'}
                </p>
              </div>
              <!-- Risks -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <h5 class="font-medium text-gray-900 mb-2">Key Risks</h5>
                <ul class="space-y-2">
                  {#each $formState.buildRisks as risk}
                    <li class="flex items-center text-sm text-gray-600">
                      <svg class="w-5 h-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      {risk === 'delays' ? 'Risk of project delivery delays' :
                       risk === 'debt' ? 'Potential technical debt accumulation' :
                       'Dependencies on key staff members'}
                    </li>
                  {/each}
                </ul>
              </div>
            </div>
          </div>

          <!-- Buy Risks -->
          <div class="bg-white p-6 rounded-xl border border-gray-200">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Buy Considerations</h4>
            <div class="space-y-4">
              <!-- Solution Fit -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <h5 class="font-medium text-gray-900 mb-2">Solution Fit</h5>
                <p class="text-sm text-gray-600">
                  {$formState.alternativeFitness === 'high' ? 'Available solutions highly match requirements.' :
                   $formState.alternativeFitness === 'moderate' ? 'Solutions need moderate customization.' :
                   'Extensive customization would be required.'}
                </p>
              </div>
              <!-- Risks -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <h5 class="font-medium text-gray-900 mb-2">Key Risks</h5>
                <ul class="space-y-2">
                  {#each $formState.buyRisks as risk}
                    <li class="flex items-center text-sm text-gray-600">
                      <svg class="w-5 h-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      {risk === 'lockin' ? 'Risk of vendor lock-in' :
                       risk === 'customization' ? 'Limited customization options' :
                       'Potential for increasing costs'}
                    </li>
                  {/each}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
          <button
            type="button"
            class="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm sm:text-base"
            on:click={restartAnalysis}
          >
            Start New Analysis
          </button>
          <button
            type="button"
            class="w-full sm:w-auto px-4 sm:px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 font-medium transition-colors text-sm sm:text-base"
            on:click={() => {
              // Add export functionality
            }}
          >
            Export Results
          </button>
        </div>
      </div>
    </div>
  {/if}
{/if}
