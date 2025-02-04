<!-- Build vs Buy Analysis Form -->
<script lang="ts">
  import { writable, derived } from 'svelte/store';
  import { onMount, onDestroy, tick, createEventDispatcher } from 'svelte';
  import { Chart, type ChartConfiguration } from 'chart.js/auto';
  import CurrencySelector from '$lib/components/ui/CurrencySelector.svelte';
  import { currencyStore, type Currency } from '$lib/stores/currencyStore';
  import { calculatorStore } from '$lib/stores/calculatorStore';
  import { calculateRiskMatrix, type RiskFormState, type RiskMatrix, type RiskAssessment, type RiskProbability, type RiskSeverity } from '$lib/utils/riskMatrixCalculator';
  import RiskTutorialModal from './RiskTutorialModal.svelte';

  const dispatch = createEventDispatcher();

  // Add state for onboarding and restart
  let showOnboarding = true;
  let showResults = false;

  // Add state for sliders
  let timelineIndex = 0;
  let usageDurationIndex = 0;
  let solutionsCount = 0;
  let capabilityBuildMonths = 0;
  let buildTimeMonths = 0;

  // Add state for completed steps
  let completedSteps = new Set<number>();

  // Add state for tutorial modal
  let showRiskTutorial = false;

  // Form state
  interface FormState {
    // Section 1: Define your Need
    solutionType: string;
    
    // Section 2: Business Impact & Timeline
    businessRole: string;
    timelineIndex: number;
    timelineNeeded: string;
    usageDurationIndex: number;
    usageDuration: string;
    
    // Section 3: Market Maturity
    solutionsCount: number;
    alternativeSolutions: string;
    marketEvolution: string;
    landscapeEvolution: string;
    marketStandardization: string;
    alternativeTypes: string[];
    
    // Section 4: Build Capability
    teamCapability: string;
    controlNeeded: string;
    inHouseCompetency: string;
    capabilityBuildMonths: number;
    competencyAcquisitionTime: string;
    
    // Section 5: Costs Analysis
    buildFTEs: number;
    buildHourlyRate: number;
    buildCost: number;
    buyCost: number;
    userCount: number;
    costPerUser: number;
    buyCustomizationCost: number;
    buyMaintenanceCost: number;
    implementationTime: string;
    
    // Section 6: Strategic Assessment
    strategicValue: string;
    strategicAlignment: string;
    alternativeFitness: string;
    buildRisks: string[];
    buyRisks: string[];
    hasMaintenanceTeam: boolean;
    maintenanceTeamSize: number;
  }

  // Update the initial form state
  const initialFormState: FormState = {
    // Section 1
    solutionType: '',
    
    // Section 2
    businessRole: '',
    timelineIndex: 0,
    timelineNeeded: '',
    usageDurationIndex: 0,
    usageDuration: '',
    
    // Section 3
    solutionsCount: 4,
    alternativeSolutions: '4-10',
    marketEvolution: '', // Changed from 'moderate' to empty string
    landscapeEvolution: '', // Changed from 'moderate' to empty string
    marketStandardization: '', // Changed from 'moderate' to empty string
    alternativeTypes: [],
    
    // Section 4
    teamCapability: '',
    controlNeeded: '',
    inHouseCompetency: '',
    capabilityBuildMonths: 0,
    competencyAcquisitionTime: '',
    
    // Section 5
    buildFTEs: 0,
    buildHourlyRate: 0,
    buildCost: 0,
    buyCost: 0,
    userCount: 0,
    costPerUser: 0,
    buyCustomizationCost: 0,
    buyMaintenanceCost: 0,
    implementationTime: '',
    
    // Section 6
    strategicValue: '',
    strategicAlignment: '',
    alternativeFitness: '',
    buildRisks: [],
    buyRisks: [],
    hasMaintenanceTeam: false,
    maintenanceTeamSize: 0
  };

  const formState = writable<FormState>(initialFormState);

  // Results state
  type ScoreKey = 'businessCriticality' | 'timeToImplement' | 'cost' | 'control' | 'competency' | 'marketFit';
  type Scores = Record<ScoreKey, number>;

  // Risk Matrix Types
  type TimelineKey = '0-3' | '3-6' | '6-12' | '12-24';
  
  let riskMatrix: RiskMatrix = {
    buildRisks: [],
    buyRisks: []
  };

  // Risk Matrix Labels
  const probabilityLabels = {
    1: 'Rare',
    2: 'Unlikely',
    3: 'Possible',
    4: 'Likely',
    5: 'Very Likely'
  };

  const severityLabels = {
    1: 'Minimal',
    2: 'Minor',
    3: 'Moderate',
    4: 'Major',
    5: 'Critical'
  };

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
    { value: 'high', label: 'High fit', description: 'Available solutions meet needs with minimal changes' },
    { value: 'moderate', label: 'Moderate fit', description: 'Some customization needed but feasible' },
    { value: 'low', label: 'Poor fit', description: 'Extensive modifications required' }
  ];

  const strategicLevels = [
    { value: 'core', label: 'Core to differentiation or competitive advantage', description: 'Critical for maintaining market position' },
    { value: 'necessary', label: 'Necessary for operational efficiency', description: 'Important for operations but not differentiating' },
    { value: 'nice', label: 'Nice to have', description: 'Beneficial but not critical for operations' },
    { value: 'cost', label: 'Cost of doing business', description: 'Everyone needs and has it' }
  ];

  const buildRiskOptions = [
    { value: 'delays', label: 'Delivery delays (Timeline and scope overruns)' },
    { value: 'debt', label: 'Technical debt (Maintenance and code complexity burden)' },
    { value: 'dependencies', label: 'Resource dependencies (Key personnel reliance)' },
    { value: 'scope', label: 'Feature scope creep (Expanding requirements)' },
    { value: 'maintenance', label: 'Maintenance burden (Updates and fixes)' },
    { value: 'integration', label: 'Integration complexity (System connections)' },
    { value: 'knowledge', label: 'Knowledge gaps (Missing domain expertise)' },
    { value: 'security', label: 'Security vulnerabilities (Security implementation)' },
    { value: 'opportunity', label: 'Opportunity cost (Team availability)' },
    { value: 'testing', label: 'Testing complexity (Quality assurance burden)' }
  ];

  const buyRiskOptions = [
    { value: 'lockin', label: 'Vendor lock-in (Difficult to change providers)' },
    { value: 'customization', label: 'Limited customization (Inflexible constraints)' },
    { value: 'costs', label: 'Rising costs (Unexpected pricing changes)' },
    { value: 'viability', label: 'Vendor viability (Provider stability)' },
    { value: 'integration', label: 'Integration limitations (API restrictions)' },
    { value: 'performance', label: 'Performance issues (Limited control)' },
    { value: 'privacy', label: 'Data privacy concerns (Third-party handling)' },
    { value: 'features', label: 'Feature dependency (Vendor roadmap reliance)' },
    { value: 'support', label: 'Support quality (Variable responsiveness)' },
    { value: 'migration', label: 'Migration complexity (Data transitions)' }
  ];

  type SectionNumber = 1 | 2 | 3 | 4 | 5 | 6;

  interface SectionValidationState {
    1: boolean;
    2: boolean;
    3: boolean;
    4: boolean;
    5: boolean;
    6: boolean;
  }

  let sectionValidation: SectionValidationState = {
    1: false, // Define your Need
    2: false, // Business Impact & Timeline
    3: false, // Market Maturity
    4: false, // Build Capability
    5: false, // Costs Analysis
    6: false  // Strategic Assessment
  };

  let activeSection: SectionNumber = 1;
  let totalSections: SectionNumber = 6;

  // Update validation state based on form values
  $: {
    // Section 1: Define your Need
    sectionValidation[1] = !!$formState.solutionType;

    // Section 2: Business Impact & Timeline
    sectionValidation[2] = !!$formState.businessRole && 
                          $formState.timelineIndex >= 0 && 
                          $formState.usageDurationIndex >= 0;

    // Section 3: Market Maturity
    sectionValidation[3] = !!$formState.alternativeSolutions && 
                          !!$formState.landscapeEvolution && 
                          !!$formState.marketStandardization;

    // Section 4: Build Capability
    sectionValidation[4] = !!$formState.controlNeeded && 
                          !!$formState.inHouseCompetency;

    // Section 5: Costs Analysis
    sectionValidation[5] = $formState.buildFTEs > 0 && 
                          $formState.buildHourlyRate > 0 &&
                          $formState.buyCost > 0;

    // Section 6: Strategic Assessment
    sectionValidation[6] = !!$formState.strategicAlignment && 
                          !!$formState.alternativeFitness;
  }

  function canNavigateToSection(section: SectionNumber): boolean {
    // Can always go back
    if (section < activeSection) return true;
    
    // Can only go forward one step at a time if previous section is valid
    if (section === activeSection + 1) {
      return sectionValidation[activeSection];
    }
    
    // Can't skip sections
    return false;
  }

  function getSectionTitle(section: SectionNumber): string {
    switch (section) {
      case 1: return 'Define your Need';
      case 2: return 'Business Impact & Timeline';
      case 3: return 'Market Maturity';
      case 4: return 'Build Capability';
      case 5: return 'Costs Analysis';
      case 6: return 'Strategic Assessment';
    }
  }

  function getSectionDescription(section: SectionNumber): string {
    switch (section) {
      case 1: return 'Choose the type of solution you want to evaluate';
      case 2: return 'Determine criticality and timeline requirements';
      case 3: return 'Understand market alternatives and evolution';
      case 4: return 'Assess your team\'s capabilities';
      case 5: return 'Compare costs of building vs buying';
      case 6: return 'Evaluate strategic alignment and risks';
    }
  }

  function canProceed(): boolean {
    return sectionValidation[activeSection];
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
      activeSection = (activeSection + 1) as SectionNumber;
      await tick();
      const navHeight = getNavHeight();
      if (formContainer) {
        scrollToElement(formContainer, navHeight);
      }
    }
  }

  async function previousSection() {
    if (activeSection > 1) {
      activeSection = (activeSection - 1) as SectionNumber;
      await tick();
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

    // Dispatch results event with the analysis data
    dispatch('results', {
      formState: $formState,
      scores,
      riskMatrix,
      recommendation,
      confidence
    });
  }

  function calculateScores() {
    // Create RiskFormState from form values
    const riskFormState: RiskFormState = {
      solutionType: $formState.solutionType,
      businessRole: $formState.businessRole,
      timelineNeeded: $formState.timelineNeeded || '6-12', // Default to medium timeline if not set
      usageDuration: $formState.usageDuration || '1-3', // Default to medium duration if not set
      alternativeSolutions: $formState.alternativeSolutions || '4-10', // Default to moderate alternatives if not set
      marketEvolution: $formState.marketEvolution || 'moderate', // Default to moderate evolution if not set
      marketStandardization: $formState.marketStandardization || 'moderate', // Default to moderate standardization if not set
      teamCompetency: $formState.inHouseCompetency || 'partial', // Default to partial competency if not set
      controlNeeded: $formState.controlNeeded || 'partial', // Default to partial control if not set
      buildFTEs: $formState.buildFTEs || 3, // Default to medium team size if not set
      strategicAlignment: $formState.strategicAlignment || 'necessary', // Default to necessary if not set
      alternativeFitness: $formState.alternativeFitness || 'moderate' // Default to moderate fitness if not set
    };

    // Calculate risk matrix using the utility function
    const calculatedMatrix = calculateRiskMatrix(riskFormState);
    
    // Update risk matrix state
    riskMatrix = calculatedMatrix;

    // Calculate business criticality score
    scores.build.businessCriticality = $formState.businessRole === 'critical' ? 5 : 
                                     $formState.businessRole === 'enabling' ? 3 : 1;
    scores.buy.businessCriticality = scores.build.businessCriticality;

    // Calculate time to implement score using the timeline mapping
    const timelineScores = {
      '0-3': 5,
      '3-6': 4,
      '6-12': 3,
      '12-24': 1
    };
    
    scores.build.timeToImplement = timelineScores[$formState.implementationTime as TimelineKey] || 3;
    scores.buy.timeToImplement = timelineScores[$formState.timelineNeeded as TimelineKey] || 3;

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
    formState.set(initialFormState);
    activeSection = 1;
    showResults = false;
    if (tcoChart) {
      tcoChart.destroy();
    }
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

  // Helper function to filter out null values and ensure type safety
  function isValidRisk(risk: RiskAssessment | null): risk is RiskAssessment {
    return risk !== null;
  }

  // Update risk matrix based on selected risks
  $: {
    const selectedBuildRisks = Object.entries($formState.buildRisks || {})
      .filter(([_, selected]) => selected)
      .map(([risk, _]) => {
        const { probability, severity } = getBuildRiskProbabilityAndSeverity(risk);
        return {
          id: `build-${risk}`,
          value: risk,
          label: getBuildRiskLabel(risk),
          probability,
          severity,
          description: getBuildRiskDescription(risk),
          details: {
            reasoning: [],
            probabilityFactors: [],
            severityFactors: [],
            calculation: {
              probability: [],
              severity: []
            }
          }
        } as RiskAssessment;
      });

    const selectedBuyRisks = Object.entries($formState.buyRisks || {})
      .filter(([_, selected]) => selected)
      .map(([risk, _]) => {
        const { probability, severity } = getBuyRiskProbabilityAndSeverity(risk);
        return {
          id: `buy-${risk}`,
          value: risk,
          label: getBuyRiskLabel(risk),
          probability,
          severity,
          description: getBuyRiskDescription(risk),
          details: {
            reasoning: [],
            probabilityFactors: [],
            severityFactors: [],
            calculation: {
              probability: [],
              severity: []
            }
          }
        } as RiskAssessment;
      });

    riskMatrix = {
      buildRisks: selectedBuildRisks,
      buyRisks: selectedBuyRisks
    };
  }

  function getBuildRiskProbabilityAndSeverity(risk: string): { probability: RiskProbability; severity: RiskSeverity } {
    switch (risk) {
      case 'delays':
        return { probability: 3, severity: 4 };
      case 'debt':
        return { probability: 4, severity: 3 };
      case 'dependencies':
        return { probability: 3, severity: 3 };
      case 'maintenance':
        return { probability: 4, severity: 4 };
      case 'resources':
        return { probability: 3, severity: 5 };
      default:
        return { probability: 3, severity: 3 };
    }
  }

  function getBuyRiskProbabilityAndSeverity(risk: string): { probability: RiskProbability; severity: RiskSeverity } {
    switch (risk) {
      case 'lockin':
        return { probability: 4, severity: 4 };
      case 'customization':
        return { probability: 3, severity: 3 };
      case 'costs':
        return { probability: 3, severity: 4 };
      case 'integration':
        return { probability: 3, severity: 3 };
      case 'support':
        return { probability: 2, severity: 4 };
      default:
        return { probability: 3, severity: 3 };
    }
  }

  // Risk-related variables
  let selectedBuildRisks: string[] = [];
  let selectedBuyRisks: string[] = [];

  // Risk label functions
  function getBuildRiskLabel(risk: string): string {
    switch (risk) {
      case 'delays': return 'Development Delays';
      case 'debt': return 'Technical Debt';
      case 'dependencies': return 'Dependencies Management';
      case 'maintenance': return 'Ongoing Maintenance';
      case 'resources': return 'Resource Constraints';
      default: return risk;
    }
  }

  function getBuyRiskLabel(risk: string): string {
    switch (risk) {
      case 'lockin': return 'Vendor Lock-in';
      case 'customization': return 'Limited Customization';
      case 'costs': return 'Unexpected Costs';
      case 'integration': return 'Integration Challenges';
      case 'support': return 'Support Quality';
      default: return risk;
    }
  }

  // Bind selected risks to form state
  $: {
    selectedBuildRisks = $formState.buildRisks;
    selectedBuyRisks = $formState.buyRisks;
  }

  // Chart cleanup
  let tcoChart: any;
  onDestroy(() => {
    if (tcoChart) {
      tcoChart.destroy();
    }
  });

  // Helper functions for risk descriptions
  function getBuildRiskDescription(risk: string): string {
    switch (risk) {
      case 'delays': return 'Risk of project timeline delays and scope overruns';
      case 'debt': return 'Risk of accumulating technical debt';
      case 'dependencies': return 'Risk of critical resource dependencies';
      case 'maintenance': return 'Risk of ongoing maintenance burden';
      case 'resources': return 'Risk of resource constraints';
      default: return '';
    }
  }

  function getBuyRiskDescription(risk: string): string {
    switch (risk) {
      case 'lockin': return 'Risk of vendor lock-in';
      case 'customization': return 'Risk of limited customization options';
      case 'costs': return 'Risk of unexpected cost increases';
      case 'integration': return 'Risk of integration challenges';
      case 'support': return 'Risk of inadequate support';
      default: return '';
    }
  }

  let showCalculations = false;
  let showLegend = false;

  let showRiskDetails = false;
  let selectedRisks: RiskAssessment[] | null = null;
  let selectedCell: { probability: number; severity: number; riskLevel: number } | null = null;

  function generateMitigationStrategies(riskLevel: number, risks: RiskAssessment[]): string[] {
    const strategies: string[] = [];
    
    if (riskLevel <= 6) {
      strategies.push('Regular monitoring and documentation of potential issues');
      strategies.push('Standard risk management procedures');
    } else if (riskLevel <= 12) {
      strategies.push('Develop specific mitigation plans for each identified risk');
      strategies.push('Monthly risk assessment reviews');
      strategies.push('Assign risk owners for active monitoring');
    } else if (riskLevel <= 18) {
      strategies.push('Weekly risk assessment meetings');
      strategies.push('Detailed contingency plans for each high-impact risk');
      strategies.push('Continuous stakeholder communication');
      strategies.push('Regular testing of mitigation measures');
    } else {
      strategies.push('Daily monitoring and reporting');
      strategies.push('Immediate escalation procedures');
      strategies.push('Crisis management team activation');
      strategies.push('Stakeholder emergency communication plan');
    }

    // Add risk-specific strategies
    risks.forEach(risk => {
      if (risk.id.startsWith('build-')) {
        strategies.push(`For ${risk.label}: ${getBuildRiskMitigation(risk.value)}`);
      } else {
        strategies.push(`For ${risk.label}: ${getBuyRiskMitigation(risk.value)}`);
      }
    });

    return strategies;
  }

  function getBuildRiskMitigation(risk: string): string {
    switch (risk) {
      case 'delays': return 'Implement agile methodologies with shorter delivery cycles';
      case 'debt': return 'Regular code reviews and technical debt tracking';
      case 'dependencies': return 'Cross-training team members and documentation';
      case 'maintenance': return 'Automated testing and monitoring systems';
      case 'resources': return 'Resource allocation planning and backup staffing';
      default: return 'Develop specific mitigation plan';
    }
  }

  function getBuyRiskMitigation(risk: string): string {
    switch (risk) {
      case 'lockin': return 'Maintain data portability and standardized interfaces';
      case 'customization': return 'Detailed vendor capability assessment pre-purchase';
      case 'costs': return 'Clear SLAs and cost escalation clauses in contracts';
      case 'integration': return 'Proof of concept testing before full implementation';
      case 'support': return 'Multiple support channels and internal expertise building';
      default: return 'Develop specific mitigation plan';
    }
  }

  // Add this method to load shared configuration
  export function loadSharedConfig(results: BuildBuyResults, goToResults = false) {
    // First, update all the slider values since they affect other fields
    // Convert timeline string back to index
    timelineIndex = getIndexFromTimeline(results.formState.timelineNeeded || '6-12');
    usageDurationIndex = getIndexFromUsageDuration(results.formState.usageDuration || '1-3');
    solutionsCount = getCountFromAlternativeSolutions(results.formState.alternativeSolutions || '4-10');
    capabilityBuildMonths = getMonthsFromCompetencyTime(results.formState.competencyAcquisitionTime || '6-12');
    buildTimeMonths = calculateBuildTimeMonths(results.formState.implementationTime || '6-12');

    // Set form state with all fields
    formState.set({
      // Section 1: Define your Need
      solutionType: results.formState.solutionType,
      
      // Section 2: Business Impact & Timeline
      businessRole: results.formState.businessRole,
      timelineIndex: timelineIndex,
      timelineNeeded: results.formState.timelineNeeded || getTimelineFromIndex(timelineIndex),
      usageDurationIndex: usageDurationIndex,
      usageDuration: results.formState.usageDuration || getUsageDurationFromIndex(usageDurationIndex),
      
      // Section 3: Market Maturity
      solutionsCount: solutionsCount,
      alternativeSolutions: results.formState.alternativeSolutions || getAlternativeSolutionsFromCount(solutionsCount),
      marketEvolution: results.formState.marketEvolution || '',
      landscapeEvolution: results.formState.landscapeEvolution || '',
      marketStandardization: results.formState.marketStandardization || '',
      alternativeTypes: results.formState.alternativeTypes || [],
      
      // Section 4: Build Capability
      teamCapability: results.formState.teamCapability || '',
      controlNeeded: results.formState.controlNeeded || '',
      inHouseCompetency: results.formState.inHouseCompetency || '',
      capabilityBuildMonths: capabilityBuildMonths,
      competencyAcquisitionTime: results.formState.competencyAcquisitionTime || getCompetencyTimeFromMonths(capabilityBuildMonths),
      
      // Section 5: Costs Analysis
      buildFTEs: results.formState.buildFTEs || 0,
      buildHourlyRate: results.formState.buildHourlyRate || 0,
      buildCost: results.formState.buildCost || 0,
      buyCost: results.formState.buyCost || 0,
      userCount: results.formState.userCount || 0,
      costPerUser: results.formState.costPerUser || 0,
      buyCustomizationCost: results.formState.buyCustomizationCost || 0,
      buyMaintenanceCost: results.formState.buyMaintenanceCost || 0,
      implementationTime: results.formState.implementationTime || getImplementationTimeFromMonths(buildTimeMonths),
      
      // Section 6: Strategic Assessment
      strategicValue: results.formState.strategicValue || '',
      strategicAlignment: results.formState.strategicAlignment || '',
      alternativeFitness: results.formState.alternativeFitness || '',
      buildRisks: results.formState.buildRisks || [],
      buyRisks: results.formState.buyRisks || [],
      hasMaintenanceTeam: results.formState.hasMaintenanceTeam ?? false,
      maintenanceTeamSize: results.formState.maintenanceTeamSize || 0
    });
    
    if (goToResults) {
      // Go directly to results
      activeSection = 6;
      showOnboarding = false;
      showResults = true;
      completedSteps = new Set([1, 2, 3, 4, 5, 6]);
      
      // Set scores and results
      scores = results.scores;
      riskMatrix = results.riskMatrix;
      recommendation = results.recommendation;
      confidence = results.confidence;
      
      // Update charts after a short delay to ensure DOM is ready
      setTimeout(() => {
        updateRadarChart();
      }, 100);
    } else {
      // Start from the first step
      activeSection = 1;
      showOnboarding = false;
      showResults = false;
      completedSteps = new Set<number>();
    }
  }

  // Helper functions for converting between slider values and text
  function getTimelineFromIndex(index: number): string {
    if (index <= 1) return '0-3';
    if (index <= 2) return '3-6';
    if (index <= 3) return '6-12';
    return '12-24';
  }

  function getIndexFromTimeline(timeline: string): number {
    switch (timeline) {
      case '0-3': return 1;
      case '3-6': return 2;
      case '6-12': return 3;
      case '12-24': return 4;
      default: return 3;
    }
  }

  function getUsageDurationFromIndex(index: number): string {
    if (index <= 1) return '0-1';
    if (index <= 2) return '1-3';
    if (index <= 3) return '3-5';
    return '5+';
  }

  function getIndexFromUsageDuration(duration: string): number {
    switch (duration) {
      case '0-1': return 1;
      case '1-3': return 2;
      case '3-5': return 3;
      case '5+': return 4;
      default: return 2;
    }
  }

  function getAlternativeSolutionsFromCount(count: number): string {
    if (count <= 2) return '0-3';
    if (count <= 5) return '4-10';
    return '10+';
  }

  function getCountFromAlternativeSolutions(solutions: string): number {
    switch (solutions) {
      case '0-3': return 2;
      case '4-10': return 5;
      case '10+': return 8;
      default: return 5;
    }
  }

  function getCompetencyTimeFromMonths(months: number): string {
    if (months <= 3) return '0-3';
    if (months <= 6) return '3-6';
    if (months <= 12) return '6-12';
    return '12-24';
  }

  function getMonthsFromCompetencyTime(time: string): number {
    switch (time) {
      case '0-3': return 3;
      case '3-6': return 6;
      case '6-12': return 12;
      case '12-24': return 24;
      default: return 12;
    }
  }

  function getImplementationTimeFromMonths(months: number): string {
    if (months <= 3) return '0-3';
    if (months <= 6) return '3-6';
    if (months <= 12) return '6-12';
    return '12-24';
  }

  function calculateBuildTimeMonths(timeRange: string): number {
    switch (timeRange) {
      case '0-3': return 3;
      case '3-6': return 6;
      case '6-12': return 12;
      case '12-24': return 24;
      default: return 12;
    }
  }
</script>

<style>
  .form-sections {
    /* Ensure the container takes full available height */
    height: 100%;
    /* Hide overflow to prevent scrollbar */
    overflow: hidden;
  }

  /* Add slider styles */
  :global(input[type="range"]) {
    -webkit-appearance: none;
    appearance: none;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: rgb(229 231 235);
    outline: none;
  }

  :global(input[type="range"]::-webkit-slider-thumb) {
    -webkit-appearance: none;
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    background: rgb(230 105 0);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.15s ease-in-out;
  }

  :global(input[type="range"]::-moz-range-thumb) {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    background: rgb(230 105 0);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.15s ease-in-out;
  }

  :global(input[type="range"]::-webkit-slider-thumb:hover) {
    transform: scale(1.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  :global(input[type="range"]::-moz-range-thumb:hover) {
    transform: scale(1.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  :global(input[type="range"]:active::-webkit-slider-thumb) {
    transform: scale(0.95);
  }

  :global(input[type="range"]:active::-moz-range-thumb) {
    transform: scale(0.95);
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
          Answer a few questions to help decide whether to build in-house or buy a solution.
        </p>
      </div>

      <div class="grid gap-6 sm:gap-8 lg:gap-12 md:grid-cols-2">
        <!-- Left Column: Steps -->
        <div class="relative">
          <!-- Timeline line -->
          <div class="absolute left-[19px] top-[28px] bottom-4 w-px bg-gradient-to-b from-secondary to-secondary/20"></div>

          <div class="space-y-6 sm:space-y-8">
            {#each Array(6) as _, i}
              <div class="relative flex items-start">
                <div class="absolute left-0 top-0 w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-white border-2 border-secondary flex items-center justify-center">
                  <span class="text-xs sm:text-sm font-medium text-secondary">{i + 1}</span>
                </div>
                <div class="ml-12 sm:ml-16">
                  <h4 class="text-sm sm:text-base font-medium text-gray-900 mb-1">
                    {i === 0 ? 'Define your Need' :
                     i === 1 ? 'Business Impact & Timeline' :
                     i === 2 ? 'Market Maturity' :
                     i === 3 ? 'Build Capability' :
                     i === 4 ? 'Costs Analysis' :
                     'Strategic Assessment'}
                  </h4>
                  <p class="text-xs sm:text-sm text-gray-600">
                    {i === 0 ? 'Choose the type of solution you want to evaluate' :
                     i === 1 ? 'Determine criticality and timeline requirements' :
                     i === 2 ? 'Understand market alternatives and evolution' :
                     i === 3 ? 'Assess your team\'s capabilities' :
                     i === 4 ? 'Compare costs of building vs buying' :
                     'Evaluate strategic alignment and risks'}
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
  </div>
{:else}
  <!-- Form View -->
  <div class="w-full bg-white rounded-xl shadow-lg" bind:this={formContainer}>
    <div class="p-4 sm:p-6 relative">
      <!-- Title and Currency Area -->
      <div class="flex flex-col items-center mb-6 sm:mb-8 relative pt-12 sm:pt-0">
        <!-- Currency Selector - Repositioned -->
        <div class="absolute top-0 left-0 right-0 flex justify-center sm:justify-end sm:right-4 sm:top-4">
          <CurrencySelector />
        </div>

        <h3 class="text-lg sm:text-xl font-semibold text-gray-900">Build vs Buy Analysis</h3>
        <p class="text-xs sm:text-sm text-gray-600 mt-1 text-center">Answer a few questions to help decide whether to build in-house or buy a solution</p>
      </div>

      <!-- Progress Bar -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="relative pt-1">
          <div class="flex mb-2 items-center justify-between">
            <div>
              <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-secondary bg-secondary/10">
                {getSectionTitle(activeSection)}
              </span>
            </div>
            <div class="text-right">
              <span class="text-xs font-semibold inline-block text-secondary">
                {Math.round((activeSection / totalSections) * 100)}%
              </span>
            </div>
          </div>
          <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-secondary/10">
            <div
              style="width: {(activeSection / totalSections) * 100}%"
              class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary transition-all duration-500"
            ></div>
          </div>
        </div>

        <!-- Step Title -->
        <div>
          <h3 class="text-lg font-medium text-gray-900">{getSectionTitle(activeSection)}</h3>
          <p class="text-sm text-gray-600">{getSectionDescription(activeSection)}</p>
        </div>
      </div>

      <!-- Form sections -->
      <div class="form-sections">
        <form on:submit|preventDefault={handleSubmit} class="space-y-6 sm:space-y-8">
          <!-- Section 1: Solution Scope -->
          <div class="space-y-4 sm:space-y-6" class:hidden={activeSection !== 1}>
            <div class="bg-white p-4 sm:p-8 rounded-xl border border-gray-200">
              <div class="w-full">
                <h2 class="text-lg sm:text-xl font-semibold text-gray-900 mb-2">What are you evaluating?</h2>
                <p class="text-sm text-gray-600 mb-4 sm:mb-6">Select the scope of the solution you want to get a Build vs Buy analysis for.</p>
                
                <div class="grid grid-cols-1 gap-3 sm:gap-4">
                    <label class="block">
                    <div class="flex items-start p-4 sm:p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.solutionType === 'platform' ? 'border-secondary bg-secondary/5' : ''}">
                        <input
                          type="radio"
                          name="solutionType"
                        value="platform"
                          bind:group={$formState.solutionType}
                          class="mt-1 text-secondary focus:ring-secondary"
                        />
                        <div class="ml-3 flex-1">
                        <span class="block text-lg font-medium text-gray-900">Platform</span>
                        <span class="block text-sm text-gray-500 mt-2">A collection of integrated systems that work together, like Salesforce, AWS, or a CI/CD platform, or Data platform.</span>
                        </div>
                      </div>
                    </label>
                  <label class="block">
                    <div class="flex items-start p-4 sm:p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.solutionType === 'application' ? 'border-secondary bg-secondary/5' : ''}">
                      <input
                        type="radio"
                        name="solutionType"
                        value="application"
                        bind:group={$formState.solutionType}
                        class="mt-1 text-secondary focus:ring-secondary"
                      />
                      <div class="ml-3 flex-1">
                        <span class="block text-lg font-medium text-gray-900">Single Application</span>
                        <span class="block text-sm text-gray-500 mt-2">A focused solution for a specific need, like a scheduling tool or reporting dashboard.</span>
                      </div>
                    </div>
                  </label>
                  <label class="block">
                    <div class="flex items-start p-4 sm:p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.solutionType === 'component' ? 'border-secondary bg-secondary/5' : ''}">
                      <input
                        type="radio"
                        name="solutionType"
                        value="component"
                        bind:group={$formState.solutionType}
                        class="mt-1 text-secondary focus:ring-secondary"
                      />
                      <div class="ml-3 flex-1">
                        <span class="block text-lg font-medium text-gray-900">Specific Component</span>
                        <span class="block text-sm text-gray-500 mt-2">A distinct piece of functionality, like a payment processing service or authentication system.</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Business Criticality -->
          <div class="space-y-6" class:hidden={activeSection !== 2}>
            <div class="bg-white p-8 rounded-xl border border-gray-200">
              <div class="w-full">
                <h2 class="text-xl font-semibold text-gray-900 mb-2">How critical is this solution to your business?</h2>
                <p class="text-gray-600 mb-8">Evaluate the solution's impact on your operations and define your timeline requirements.</p>
                
                <div class="space-y-8">
                  <!-- Business Role -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">What is the primary business function of this solution?</h3>
                      <p class="text-sm text-gray-600 mt-1">Choose the category that best reflects this solution's business impact.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                        <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.businessRole === 'critical' ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="businessRole"
                            value="critical"
                              bind:group={$formState.businessRole}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Revenue Critical</span>
                            <span class="block text-sm text-gray-500 mt-2">Directly impacts your core business, customer experience, or revenue generation</span>
                            </div>
                          </div>
                        </label>
                      <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.businessRole === 'enabling' ? 'border-secondary bg-secondary/5' : ''}">
                          <input
                            type="radio"
                            name="businessRole"
                            value="enabling"
                            bind:group={$formState.businessRole}
                            class="mt-1 text-secondary focus:ring-secondary"
                          />
                          <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Business Enabling</span>
                            <span class="block text-sm text-gray-500 mt-2">Enhances key operations, improves team efficiency, or reduces significant costs</span>
                          </div>
                        </div>
                      </label>
                      <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.businessRole === 'supporting' ? 'border-secondary bg-secondary/5' : ''}">
                          <input
                            type="radio"
                            name="businessRole"
                            value="supporting"
                            bind:group={$formState.businessRole}
                            class="mt-1 text-secondary focus:ring-secondary"
                          />
                          <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Internal Support</span>
                            <span class="block text-sm text-gray-500 mt-2">Helps with back-office operations, administrative tasks, or internal processes</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- Timeline Needed -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">When do you need this ready?</h3>
                      <p class="text-sm text-gray-600 mt-1">What is your target go-live timeline?</p>
                    </div>
                    <!-- Time Period Slider -->
                    <div class="px-4">
                            <input
                        type="range" 
                        min="0" 
                        max="3" 
                        step="1"
                        class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        bind:value={timelineIndex}
                        on:input={() => {
                          const values = ['0-3', '3-6', '6-12', '12-24'];
                          $formState.timelineNeeded = values[timelineIndex];
                        }}
                      />
                      <div class="flex justify-between mt-2 text-sm text-gray-600">
                        <span class="text-center">
                          {#if timelineIndex === 0}
                            <div class="font-medium text-secondary">Urgent/Immediate</div>
                            <div class="text-xs">0-3 months</div>
                          {:else if timelineIndex === 1}
                            <div class="font-medium text-secondary">Short term</div>
                            <div class="text-xs">3-6 months</div>
                          {:else if timelineIndex === 2}
                            <div class="font-medium text-secondary">Medium term</div>
                            <div class="text-xs">6-12 months</div>
                          {:else}
                            <div class="font-medium text-secondary">Long term</div>
                            <div class="text-xs">12-24 months</div>
                          {/if}
                        </span>
                            </div>
                    </div>
                  </div>

                  <!-- Usage Duration -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">How long will you use this solution?</h3>
                      <p class="text-sm text-gray-600 mt-1">What's the expected lifetime use of this solution?</p>
                    </div>
                    <!-- Usage Duration Slider -->
                    <div class="px-4">
                            <input
                        type="range" 
                        min="0" 
                        max="3" 
                        step="1"
                        class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        bind:value={usageDurationIndex}
                        on:input={() => {
                          const values = ['<1', '1-3', '3-5', '>5'];
                          $formState.usageDuration = values[usageDurationIndex];
                        }}
                      />
                      <div class="flex justify-between mt-2 text-sm text-gray-600">
                        <span class="text-center">
                          {#if usageDurationIndex === 0}
                            <div class="font-medium text-secondary">Short term</div>
                            <div class="text-xs">Less than 1 year</div>
                          {:else if usageDurationIndex === 1}
                            <div class="font-medium text-secondary">Medium term</div>
                            <div class="text-xs">1-3 years</div>
                          {:else if usageDurationIndex === 2}
                            <div class="font-medium text-secondary">Extended use</div>
                            <div class="text-xs">3-5 years</div>
                          {:else}
                            <div class="font-medium text-secondary">Long term investment</div>
                            <div class="text-xs">More than 5 years</div>
                          {/if}
                        </span>
                            </div>
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
                <h2 class="text-xl font-semibold text-gray-900 mb-2">How Mature is the Market?</h2>
                <p class="text-gray-600 mb-8">Evaluate how evolved solutions in this space are.</p>
                
                <div class="space-y-8">
                  <!-- Alternative Solutions -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">How many alternative solutions exist in the market?</h3>
                      <p class="text-sm text-gray-600 mt-1">Consider both commercial and open-source solutions to gauge market maturity.</p>
                    </div>
                    <!-- Solutions Count Slider -->
                    <div class="px-4">
                      <input
                        type="range" 
                        min="0" 
                        max="10" 
                        step="1"
                        class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        bind:value={solutionsCount}
                        on:input={() => {
                          if (solutionsCount === 0) {
                            $formState.alternativeSolutions = 'none';
                          } else if (solutionsCount <= 3) {
                            $formState.alternativeSolutions = '1-3';
                          } else if (solutionsCount <= 10) {
                            $formState.alternativeSolutions = '4-10';
                          } else {
                            $formState.alternativeSolutions = '>10';
                          }
                          $formState.solutionsCount = solutionsCount;
                        }}
                      />
                      <div class="flex justify-between mt-2">
                        <span class="text-sm text-gray-600">0</span>
                        <span class="text-sm font-medium text-secondary">{solutionsCount}+ solutions</span>
                        <span class="text-sm text-gray-600">10+</span>
                      </div>
                    </div>
                  </div>

                  <!-- Landscape Evolution -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">What is the pace of evolution for this solution space?</h3>
                      <p class="text-sm text-gray-600 mt-1">Assess how rapidly solutions are evolving and the speed of iterations.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                        <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.landscapeEvolution === 'fast' ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="landscapeEvolution"
                            value="fast"
                              bind:group={$formState.landscapeEvolution}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Very fast</span>
                            <span class="block text-sm text-gray-500 mt-2">New solutions and features are introduced frequently, most don't become standards or make it long term.</span>
                            </div>
                          </div>
                        </label>
                      <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.landscapeEvolution === 'moderate' ? 'border-secondary bg-secondary/5' : ''}">
                          <input
                            type="radio"
                            name="landscapeEvolution"
                            value="moderate"
                            bind:group={$formState.landscapeEvolution}
                            class="mt-1 text-secondary focus:ring-secondary"
                          />
                          <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Moderate</span>
                            <span class="block text-sm text-gray-500 mt-2">New solutions and features are introduced regularly, and there's steady progression towards standardization.</span>
                          </div>
                        </div>
                      </label>
                      <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.landscapeEvolution === 'slow' ? 'border-secondary bg-secondary/5' : ''}">
                          <input
                            type="radio"
                            name="landscapeEvolution"
                            value="slow"
                            bind:group={$formState.landscapeEvolution}
                            class="mt-1 text-secondary focus:ring-secondary"
                          />
                          <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Slow</span>
                            <span class="block text-sm text-gray-500 mt-2">New solutions are features are introduced occasionally. There are established patterns with minimal change.</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- Market Standardization -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">What is the level of standardization in this solution space?</h3>
                      <p class="text-sm text-gray-600 mt-1">Evaluate how well-defined and accepted the solution patterns are.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                        <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.marketStandardization === 'high' ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="marketStandardization"
                            value="high"
                              bind:group={$formState.marketStandardization}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">High</span>
                            <span class="block text-sm text-gray-500 mt-2">Well-established patterns, commodity solutions. Customization is uncommon.</span>
                            </div>
                          </div>
                        </label>
                      <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.marketStandardization === 'moderate' ? 'border-secondary bg-secondary/5' : ''}">
                          <input
                            type="radio"
                            name="marketStandardization"
                            value="moderate"
                            bind:group={$formState.marketStandardization}
                            class="mt-1 text-secondary focus:ring-secondary"
                          />
                          <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Moderate</span>
                            <span class="block text-sm text-gray-500 mt-2">Emerging standards, some customization needed.</span>
                          </div>
                        </div>
                      </label>
                      <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.marketStandardization === 'low' ? 'border-secondary bg-secondary/5' : ''}">
                          <input
                            type="radio"
                            name="marketStandardization"
                            value="low"
                            bind:group={$formState.marketStandardization}
                            class="mt-1 text-secondary focus:ring-secondary"
                          />
                          <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Low</span>
                            <span class="block text-sm text-gray-500 mt-2">Mostly novel, and custom solutions, limited standardization.</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- Solution Fit -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">How well do existing solutions match your needs?</h3>
                      <p class="text-sm text-gray-600 mt-1">Assess the gap between market solutions and your requirements.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                      {#each fitnessLevels as level}
                        <label class="block">
                          <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.alternativeFitness === level.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="alternativeFitness"
                              value={level.value}
                              bind:group={$formState.alternativeFitness}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                              <span class="block text-lg font-medium text-gray-900">{level.label}</span>
                              <span class="block text-sm text-gray-500 mt-2">{level.description}</span>
                            </div>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- Solution Types -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">What solution types are established?</h3>
                      <p class="text-sm text-gray-600 mt-1">Select all types of solutions that exist in the market.</p>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label class="block">
                        <div class="flex items-center p-4 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.alternativeTypes.includes('opensource') ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="checkbox"
                            value="opensource"
                              bind:group={$formState.alternativeTypes}
                              class="h-4 w-4 text-secondary focus:ring-secondary rounded"
                            />
                          <span class="ml-3 text-sm sm:text-base font-medium text-gray-900">Open Source</span>
                          </div>
                        </label>
                      <label class="block">
                        <div class="flex items-center p-4 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.alternativeTypes.includes('commercial') ? 'border-secondary bg-secondary/5' : ''}">
                          <input
                            type="checkbox"
                            value="commercial"
                            bind:group={$formState.alternativeTypes}
                            class="h-4 w-4 text-secondary focus:ring-secondary rounded"
                          />
                          <span class="ml-3 text-sm sm:text-base font-medium text-gray-900">Commercial</span>
                        </div>
                      </label>
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
                <h2 class="text-xl font-semibold text-gray-900 mb-2">Build Capability Assessment</h2>
                <p class="text-gray-600 mb-8">Evaluate your organization's ability to develop and maintain this solution long-term.</p>
                
                <div class="space-y-8">
                  <!-- Control Needed -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">What level of solution control do you need?</h3>
                      <p class="text-sm text-gray-600 mt-1">Consider your initial and ongoing requirements for customization, updates, and integration.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                        <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.controlNeeded === 'full' ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="controlNeeded"
                            value="full"
                              bind:group={$formState.controlNeeded}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Full control</span>
                            <span class="block text-sm text-gray-500 mt-2">We require extensive customization and frequent updates.</span>
                            </div>
                          </div>
                        </label>
                      <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.controlNeeded === 'partial' ? 'border-secondary bg-secondary/5' : ''}">
                          <input
                            type="radio"
                            name="controlNeeded"
                            value="partial"
                            bind:group={$formState.controlNeeded}
                            class="mt-1 text-secondary focus:ring-secondary"
                          />
                          <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Partial control</span>
                            <span class="block text-sm text-gray-500 mt-2">We need specific customization and periodic updates.</span>
                          </div>
                        </div>
                      </label>
                      <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.controlNeeded === 'none' ? 'border-secondary bg-secondary/5' : ''}">
                          <input
                            type="radio"
                            name="controlNeeded"
                            value="none"
                            bind:group={$formState.controlNeeded}
                            class="mt-1 text-secondary focus:ring-secondary"
                          />
                          <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Standard control</span>
                            <span class="block text-sm text-gray-500 mt-2">The out-of-box functionality meets our needs, and we require security updates mainly.</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- In-House Competency -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">What is your team's technical readiness?</h3>
                      <p class="text-sm text-gray-600 mt-1">Assess your current technical capabilities versus requirements.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                        <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.inHouseCompetency === 'full' ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="inHouseCompetency"
                            value="full"
                              bind:group={$formState.inHouseCompetency}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Ready now</span>
                            <span class="block text-sm text-gray-500 mt-2">The team has the required skills and experience for building this.</span>
                            </div>
                          </div>
                        </label>
                      <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.inHouseCompetency === 'partial' ? 'border-secondary bg-secondary/5' : ''}">
                          <input
                            type="radio"
                            name="inHouseCompetency"
                            value="partial"
                            bind:group={$formState.inHouseCompetency}
                            class="mt-1 text-secondary focus:ring-secondary"
                          />
                          <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Ready with investment</span>
                            <span class="block text-sm text-gray-500 mt-2">The team needs targeted training or additional expertise to build this.</span>
                    </div>
                  </div>
                      </label>
                          <label class="block">
                        <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.inHouseCompetency === 'none' ? 'border-secondary bg-secondary/5' : ''}">
                              <input
                                type="radio"
                            name="inHouseCompetency"
                            value="none"
                            bind:group={$formState.inHouseCompetency}
                            class="mt-1 text-secondary focus:ring-secondary"
                          />
                          <div class="ml-3 flex-1">
                            <span class="block text-lg font-medium text-gray-900">Significant gaps</span>
                            <span class="block text-sm text-gray-500 mt-2">We require substantial capability building.</span>
                          </div>
                            </div>
                          </label>
                      </div>
                    </div>

                  <!-- Competency Acquisition Time -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">How long will it take to build the required capabilities?</h3>
                      <p class="text-sm text-gray-600 mt-1">Estimate time needed for hiring, training, and skill development.</p>
                    </div>
                    <!-- Capability Building Time Slider -->
                    <div class="px-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="24" 
                        step="1"
                        class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        bind:value={capabilityBuildMonths}
                        on:input={() => {
                          if (capabilityBuildMonths <= 3) {
                            $formState.competencyAcquisitionTime = '0-3';
                          } else if (capabilityBuildMonths <= 6) {
                            $formState.competencyAcquisitionTime = '3-6';
                          } else if (capabilityBuildMonths <= 12) {
                            $formState.competencyAcquisitionTime = '6-12';
                          } else {
                            $formState.competencyAcquisitionTime = '12-24';
                          }
                        }}
                      />
                      <div class="flex justify-between mt-2">
                        <span class="text-sm text-gray-600">0</span>
                        <span class="text-sm font-medium text-secondary">
                          {#if capabilityBuildMonths <= 3}
                            Quick training or readily available hires
                          {:else if capabilityBuildMonths <= 6}
                            Standard recruitment and onboarding
                          {:else if capabilityBuildMonths <= 12}
                            Significant training or specialized hiring
                          {:else}
                            Complete capability building required
                  {/if}
                          <div class="text-xs text-center mt-1">{capabilityBuildMonths} months</div>
                        </span>
                        <span class="text-sm text-gray-600">24</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 5: Cost and Resources -->
          <div class="space-y-6" class:hidden={activeSection !== 5}>
            <div class="bg-white p-8 rounded-xl border border-gray-200">
              <div class="w-full">
                <h2 class="text-xl font-semibold text-gray-900 mb-2">Cost Comparison Analysis</h2>
                <p class="text-gray-600 mb-8">Compare the financial investment required for building versus buying.</p>
                
                <div class="space-y-8">
                  <!-- Build Investment Requirements -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">Build Investment Requirements</h3>
                      <p class="text-sm text-gray-600 mt-1">Calculate the investment required for building the solution.</p>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div class="p-6 rounded-xl border-2 border-gray-200">
                        <label class="block text-base font-medium text-gray-900 mb-2">Development Team Size</label>
                        <p class="text-sm text-gray-600 mb-4">Full-time employees needed for development</p>
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
                        <p class="text-sm text-gray-600 mb-4">Average hourly cost per team member</p>
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
                    <!-- Build Time Needed -->
                    <div class="p-6 rounded-xl border-2 border-gray-200">
                      <label class="block text-base font-medium text-gray-900 mb-2">Build Time Needed</label>
                      <p class="text-sm text-gray-600 mb-4">Estimated time required for development</p>
                      <div class="px-4">
                        <input 
                          type="range" 
                          min="0" 
                          max="24" 
                          step="1"
                          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          bind:value={buildTimeMonths}
                          on:input={() => {
                            if (buildTimeMonths <= 3) {
                              $formState.implementationTime = '0-3';
                            } else if (buildTimeMonths <= 6) {
                              $formState.implementationTime = '3-6';
                            } else if (buildTimeMonths <= 12) {
                              $formState.implementationTime = '6-12';
                            } else {
                              $formState.implementationTime = '12-24';
                            }
                            // Update build cost based on time
                            $formState.buildCost = $formState.buildFTEs * $formState.buildHourlyRate * (buildTimeMonths * 160); // 160 hours per month
                          }}
                        />
                        <div class="flex justify-between mt-2">
                          <span class="text-sm text-gray-600">0</span>
                          <span class="text-sm font-medium text-secondary">
                            {buildTimeMonths} months
                          </span>
                          <span class="text-sm text-gray-600">24</span>
                        </div>
                      </div>
                    </div>

                    <!-- Maintenance Team Configuration -->
                    <div class="space-y-4">
                      <div class="mb-4">
                        <h3 class="text-base font-medium text-gray-900">Maintenance Team Configuration</h3>
                        <p class="text-sm text-gray-600 mt-1">Configure your maintenance team setup</p>
                      </div>
                      <div class="grid grid-cols-1 gap-4">
                        <label class="block">
                          <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.hasMaintenanceTeam ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="checkbox"
                              bind:checked={$formState.hasMaintenanceTeam}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                              <span class="block text-lg font-medium text-gray-900">Dedicated Maintenance Team</span>
                              <span class="block text-sm text-gray-500 mt-2">We will have a dedicated team for maintenance and support</span>
                            </div>
                          </div>
                        </label>
                        {#if $formState.hasMaintenanceTeam}
                          <div class="p-6 rounded-xl border-2 border-gray-200">
                            <label class="block text-base font-medium text-gray-900 mb-2">Team Size (FTEs)</label>
                            <p class="text-sm text-gray-600 mb-4">Number of full-time employees for maintenance</p>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              bind:value={$formState.maintenanceTeamSize}
                              class="block w-full rounded-lg border-gray-200 shadow-sm focus:border-secondary focus:ring-secondary text-lg"
                              placeholder="0"
                            />
                          </div>
                        {/if}
                      </div>
                    </div>

                    <!-- Cost Preview -->
                    <div class="mt-4 p-4 bg-secondary/5 rounded-lg space-y-3">
                      <!-- Build Cost -->
                      <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600">Build Cost ({buildTimeMonths} months):</span>
                        <span class="text-lg font-semibold text-secondary">
                          {formatCurrency($formState.buildCost)}
                        </span>
                      </div>

                      <!-- Yearly Maintenance Cost -->
                      {#if $formState.hasMaintenanceTeam}
                        <div class="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span class="text-sm font-medium text-gray-600">Yearly Maintenance Cost:</span>
                          <span class="text-lg font-semibold text-secondary">
                            {formatCurrency($formState.maintenanceTeamSize * $formState.buildHourlyRate * 2080)}
                          </span>
                        </div>
                      {/if}

                      <!-- Total First Year Cost -->
                      <div class="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span class="text-sm font-medium text-gray-600">Total First Year Cost:</span>
                        <span class="text-lg font-semibold text-secondary">
                          {formatCurrency(
                            Math.min($formState.buildCost, ($formState.buildCost * 12 / buildTimeMonths)) +
                            ($formState.hasMaintenanceTeam && buildTimeMonths <= 12 
                              ? ($formState.maintenanceTeamSize * $formState.buildHourlyRate * 2080 * (12 - buildTimeMonths) / 12) 
                              : 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Buy Cost Analysis -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">Buy Cost Analysis</h3>
                      <p class="text-sm text-gray-600 mt-1">Break down the full cost of acquiring and maintaining a solution.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                      <div class="p-6 rounded-xl border-2 border-gray-200">
                        <label class="block text-base font-medium text-gray-900 mb-2">License Purchase Cost</label>
                        <p class="text-sm text-gray-600 mb-4">One-time solution acquisition cost</p>
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
                        <label class="block text-base font-medium text-gray-900 mb-2">Implementation Cost</label>
                        <p class="text-sm text-gray-600 mb-4">Costs associated with implementation and customization such as installations, integrations, and feature additions for you</p>
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
                        <label class="block text-base font-medium text-gray-900 mb-2">Annual Operating Cost</label>
                        <p class="text-sm text-gray-600 mb-4">Yearly licensing, support, and maintenance fees for the solution</p>
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
                      <!-- User Subscription Costs -->
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="p-6 rounded-xl border-2 border-gray-200">
                          <label class="block text-base font-medium text-gray-900 mb-2">Number of Users</label>
                          <p class="text-sm text-gray-600 mb-4">Total number of users requiring access</p>
                          <input
                            type="number"
                            min="0"
                            bind:value={$formState.userCount}
                            class="block w-full rounded-lg border-gray-200 shadow-sm focus:border-secondary focus:ring-secondary text-lg"
                            placeholder="0"
                          />
                        </div>
                        <div class="p-6 rounded-xl border-2 border-gray-200">
                          <label class="block text-base font-medium text-gray-900 mb-2">Cost per User</label>
                          <p class="text-sm text-gray-600 mb-4">Monthly subscription fee per user</p>
                          <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 text-lg">
                              {getCurrencySymbol($currencyStore)}
                            </span>
                            <input
                              type="number"
                              min="0"
                              bind:value={$formState.costPerUser}
                              class="block w-full pl-10 rounded-lg border-gray-200 shadow-sm focus:border-secondary focus:ring-secondary text-lg"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Total First Year Cost Preview -->
                    <div class="mt-4 p-4 bg-secondary/5 rounded-lg">
                      <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600">Total First Year Cost:</span>
                        <span class="text-lg font-semibold text-secondary">
                          {formatCurrency($formState.buyCost + $formState.buyCustomizationCost + $formState.buyMaintenanceCost + ($formState.userCount * $formState.costPerUser * 12))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 6: Strategic Fit Assessment -->
          <div class="space-y-6" class:hidden={activeSection !== 6}>
            <div class="bg-white p-8 rounded-xl border border-gray-200">
              <div class="w-full">
                <h2 class="text-xl font-semibold text-gray-900 mb-2">Strategic Fit Assessment</h2>
                <p class="text-gray-600 mb-8">Evaluate the strategic value and risk factors of the solution.</p>
                
                <div class="space-y-8">
                  <!-- Strategic Alignment -->
                  <div class="space-y-4">
                    <div class="mb-4">
                      <h3 class="text-base font-medium text-gray-900">How central is this solution to your strategy?</h3>
                      <p class="text-sm text-gray-600 mt-1">Evaluate the strategic importance and competitive impact.</p>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
                      {#each strategicLevels as level}
                        <label class="block">
                          <div class="flex items-start p-6 rounded-xl border-2 border-gray-200 hover:border-secondary cursor-pointer transition-all duration-200 {$formState.strategicAlignment === level.value ? 'border-secondary bg-secondary/5' : ''}">
                            <input
                              type="radio"
                              name="strategicAlignment"
                              value={level.value}
                              bind:group={$formState.strategicAlignment}
                              class="mt-1 text-secondary focus:ring-secondary"
                            />
                            <div class="ml-3 flex-1">
                              <span class="block text-lg font-medium text-gray-900">{level.label}</span>
                              <span class="block text-sm text-gray-500 mt-2">{level.description}</span>
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
            
            {#if activeSection === 6}
              <button
                id="calculate_build_buy"
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
      <!-- Back to Steps Button -->
      <div class="flex justify-center mb-4">
        <button
          type="button"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          on:click={() => {
            const navHeight = getNavHeight();
            if (formContainer) {
              scrollToElement(formContainer, navHeight);
            }
          }}
        >
          <svg class="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Back to Steps
        </button>
      </div>

      <div class="bg-white p-4 sm:p-8 rounded-xl border border-gray-200">
        <!-- Header with Project Info -->
        <div class="text-center mb-6 sm:mb-8">
          <h3 class="text-xl sm:text-2xl font-semibold text-gray-900">Analysis Summary and Recommendation</h3>
          <p class="text-base sm:text-lg font-medium text-gray-700 mt-2">{$formState.solutionType === 'platform' ? 'Platform Solution' : 
            $formState.solutionType === 'application' ? 'Application Solution' : 'Component Solution'}</p>
        </div>
        
        <!-- Primary Recommendation -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div class="md:col-span-2 p-6 bg-gradient-to-br from-purple-50 to-transparent rounded-xl border border-purple-200"
               data-gtm-build-buy-section="recommendation"
               data-gtm-recommendation="{recommendation}"
               data-gtm-confidence="{confidence}">
            <div class="flex items-start justify-between">
              <div>
                <h4 class="text-lg font-semibold text-gray-900 mb-2">Recommendation</h4>
                <p class="text-3xl font-bold text-purple-600 mb-4" data-gtm-recommendation-text>{recommendation}</p>
                <div class="prose prose-sm text-gray-600">
                  {#if recommendation === 'Build'}
                    <ul class="space-y-2">
                      <li>Market solutions require significant customization</li>
                      <li>Team has required technical capabilities</li>
                      <li>Strategic importance justifies investment</li>
                    </ul>
                  {:else if recommendation === 'Buy'}
                    <ul class="space-y-2">
                      <li>Market solutions align with requirements</li>
                      <li>3-month faster time to market</li>
                      <li>83% lower initial investment</li>
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
                <div class="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white border-4 border-purple-500 relative">
                  <div class="text-center">
                    <p class="text-3xl font-bold text-purple-600">{confidence}%</p>
                    <p class="text-xs text-gray-600">Confidence</p>
                  </div>
                  <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="4" class="text-purple-100"/>
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="4" 
                      stroke-dasharray={`${confidence * 3.02} 302`} class="text-purple-500 transition-all duration-1000"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Cost Summary -->
          <div class="p-6 bg-emerald-50 rounded-xl border border-emerald-200">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h4>
            <div class="space-y-4">
              <div class="p-3 bg-white rounded-lg border border-emerald-100">
                <p class="text-sm text-gray-600">Build (First Year)</p>
                <p class="text-xl font-semibold text-gray-900">
                  {formatCurrency($formState.buildFTEs * $formState.buildHourlyRate * 2080)}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Based on {$formState.buildFTEs} FTEs at {formatCurrency($formState.buildHourlyRate)}/hour
                </p>
              </div>
              <div class="p-3 bg-white rounded-lg border border-emerald-100">
                <p class="text-sm text-gray-600">Buy (First Year)</p>
                <p class="text-xl font-semibold text-gray-900">
                  {formatCurrency($formState.buyCost + $formState.buyCustomizationCost + $formState.buyMaintenanceCost + ($formState.userCount * $formState.costPerUser * 12))}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Including license, setup, maintenance, and user costs
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Analysis -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
          <!-- Score Comparison -->
          <div class="bg-white p-6 rounded-xl border border-gray-200">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Comparative Analysis</h4>
            <div class="space-y-4">
              {#each ['businessCriticality', 'timeToImplement', 'cost', 'control', 'competency', 'marketFit'] as dimension}
                {@const buildScore = scores.build[dimension as keyof typeof scores.build]}
                {@const buyScore = scores.buy[dimension as keyof typeof scores.buy]}
                <div class="p-4 bg-gray-50 rounded-lg">
                  <div class="flex justify-between items-center mb-2">
                    <h5 class="font-medium text-gray-900">
                      {dimension === 'businessCriticality' ? 'Business Impact' :
                       dimension === 'timeToImplement' ? 'Implementation Speed' :
                       dimension === 'cost' ? 'Cost Efficiency' :
                       dimension === 'control' ? 'Solution Control' :
                       dimension === 'competency' ? 'Team Readiness' :
                       'Market Fit'}
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
                  <p class="text-xs text-gray-500 mt-2">
                    {dimension === 'businessCriticality' ? 'Higher score indicates greater business value' :
                     dimension === 'timeToImplement' ? 'Higher score indicates faster implementation' :
                     dimension === 'cost' ? 'Higher score indicates better cost efficiency' :
                     dimension === 'control' ? 'Higher score indicates more control over solution' :
                     dimension === 'competency' ? 'Higher score indicates better team readiness' :
                     'Higher score indicates better fit with requirements'}
                  </p>
                </div>
              {/each}
            </div>
          </div>

          <!-- Implementation Details -->
          <div class="bg-white p-6 rounded-xl border border-gray-200">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Implementation Comparison</h4>
            <div class="space-y-6">
              <!-- Build Timeline -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <h5 class="font-medium text-gray-900 mb-2">Build Approach</h5>
                <div class="space-y-3">
                  <div>
                    <p class="text-sm font-medium text-gray-700">Implementation Timeline</p>
                    <p class="text-sm text-gray-600">{buildTimeMonths} months development time</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-700">Resource Requirements</p>
                    <p class="text-sm text-gray-600">{$formState.buildFTEs} FTE developers needed</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-700">Success Factors</p>
                    <ul class="text-sm text-gray-600 list-disc list-inside">
                      <li>Clear technical specifications</li>
                      <li>Strong project management</li>
                      <li>Adequate testing resources</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Buy Timeline -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <h5 class="font-medium text-gray-900 mb-2">Buy Approach</h5>
                <div class="space-y-3">
                  <div>
                    <p class="text-sm font-medium text-gray-700">Implementation Timeline</p>
                    <p class="text-sm text-gray-600">{$formState.timelineNeeded} months to deploy</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-700">Resource Requirements</p>
                    <p class="text-sm text-gray-600">Integration and training team needed</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-700">Success Factors</p>
                    <ul class="text-sm text-gray-600 list-disc list-inside">
                      <li>Vendor relationship management</li>
                      <li>Clear SLA requirements</li>
                      <li>User adoption strategy</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Analysis -->
        <div class="grid grid-cols-1 gap-4 sm:gap-8">
          <!-- Risk Matrix -->
          <div class="bg-white p-6 rounded-xl border border-gray-200">
            <div class="flex justify-between items-start mb-4">
              <h4 class="text-lg font-semibold text-gray-900">Risk Matrix Analysis</h4>
              <button
                type="button"
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-secondary bg-secondary/10 rounded-lg hover:bg-secondary/20 transition-colors"
                on:click={() => showRiskTutorial = true}
              >
                <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learn about Risk Analysis
              </button>
            </div>
            
            <!-- Risk Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <!-- Build Risks Summary Card -->
              <div class="p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-4 h-4 rounded-full bg-secondary"></div>
                  <h5 class="font-medium text-gray-900">Build Risks</h5>
                </div>
                <div class="flex justify-between items-center">
                  <div class="text-sm text-gray-600">Total Risk Score</div>
                  <div class="text-xl font-bold text-secondary">
                    {riskMatrix.buildRisks.reduce((sum, risk) => sum + (risk.probability * risk.severity), 0)}
                  </div>
                </div>
                <div class="mt-1 text-xs text-gray-500">{riskMatrix.buildRisks.length} identified risks</div>
              </div>

              <!-- Buy Risks Summary Card -->
              <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-4 h-4 rounded-full bg-blue-500"></div>
                  <h5 class="font-medium text-gray-900">Buy Risks</h5>
                </div>
                <div class="flex justify-between items-center">
                  <div class="text-sm text-gray-600">Total Risk Score</div>
                  <div class="text-xl font-bold text-blue-600">
                    {riskMatrix.buyRisks.reduce((sum, risk) => sum + (risk.probability * risk.severity), 0)}
                  </div>
                </div>
                <div class="mt-1 text-xs text-gray-500">{riskMatrix.buyRisks.length} identified risks</div>
              </div>
            </div>

            <!-- Matrix Grid -->
            <div class="relative w-full mt-4">
              <div class="w-full max-w-5xl mx-auto pl-12 sm:pl-16">
                <!-- Y-axis Label -->
                <div class="absolute -left-1 sm:left-0 top-1/2 -translate-y-1/2 -rotate-90 transform whitespace-nowrap">
                  <span class="text-sm font-medium text-gray-900">Probability</span>
                </div>
                
                <!-- Matrix -->
                <div class="overflow-x-auto pb-2">
                  <div class="min-w-[600px]">
                    <div class="grid grid-cols-5 gap-1 sm:gap-2">
                      <!-- Headers -->
                      {#each [1, 2, 3, 4, 5] as severity}
                        <div class="h-6 text-center">
                          <span class="text-xs font-medium text-gray-700">{severity}</span>
                        </div>
                      {/each}
                      
                      <!-- Matrix Cells -->
                      {#each [5, 4, 3, 2, 1] as probability}
                        {#each [1, 2, 3, 4, 5] as severity}
                          {@const riskLevel = probability * severity}
                          {@const buildRisks = riskMatrix.buildRisks.filter(risk => 
                            risk.probability === probability && 
                            risk.severity === severity
                          )}
                          {@const buyRisks = riskMatrix.buyRisks.filter(risk => 
                            risk.probability === probability && 
                            risk.severity === severity
                          )}
                          
                          <div class="relative h-28 sm:h-32 border border-gray-200 rounded p-2 transition-colors {
                            riskLevel <= 6 ? 'bg-green-50 hover:bg-green-100' :
                            riskLevel <= 12 ? 'bg-yellow-50 hover:bg-yellow-100' :
                            riskLevel <= 18 ? 'bg-orange-50 hover:bg-orange-100' :
                            'bg-red-50 hover:bg-red-100'
                          } {(buildRisks.length > 0 || buyRisks.length > 0) ? 'cursor-pointer' : ''}"
                          on:click={() => {
                            if (buildRisks.length > 0 || buyRisks.length > 0) {
                              selectedRisks = {
                                buildRisks,
                                buyRisks
                              };
                              selectedCell = { 
                                probability, 
                                severity, 
                                riskLevel 
                              };
                              showRiskDetails = true;
                            }
                          }}>
                            <!-- Risk Level Indicator -->
                            <div class="absolute top-1 right-1 text-xs font-medium {
                              riskLevel <= 6 ? 'text-green-700' :
                              riskLevel <= 12 ? 'text-yellow-700' :
                              riskLevel <= 18 ? 'text-orange-700' :
                              'text-red-700'
                            }">
                              {riskLevel}
                            </div>
                            
                            <!-- Risk Counts and Preview -->
                            {#if buildRisks.length > 0 || buyRisks.length > 0}
                              <div class="absolute inset-0 p-2">
                                <div class="h-full flex flex-col justify-between">
                                  <!-- Risk Counts -->
                                  <div class="flex gap-1.5">
                                    {#if buildRisks.length > 0}
                                      <div class="flex items-center gap-1 bg-white/80 rounded-full px-1.5 py-0.5">
                                        <div class="w-2 h-2 rounded-full bg-secondary"></div>
                                        <span class="text-xs font-medium text-gray-900">{buildRisks.length}</span>
                                      </div>
                                    {/if}
                                    {#if buyRisks.length > 0}
                                      <div class="flex items-center gap-1 bg-white/80 rounded-full px-1.5 py-0.5">
                                        <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span class="text-xs font-medium text-gray-900">{buyRisks.length}</span>
                                      </div>
                                    {/if}
                                  </div>
                                  
                                  <!-- Risk Preview -->
                                  <div class="text-xs text-gray-600">
                                    {#if buildRisks.length > 0 || buyRisks.length > 0}
                                      <div class="bg-white/80 rounded p-1.5">
                                        {#if buildRisks.length > 0}
                                          <div class="truncate text-[11px] leading-tight">
                                            {buildRisks[0].label}{buildRisks.length > 1 ? ` +${buildRisks.length - 1}` : ''}
                                          </div>
                                        {/if}
                                        {#if buyRisks.length > 0}
                                          <div class="truncate text-[11px] leading-tight">
                                            {buyRisks[0].label}{buyRisks.length > 1 ? ` +${buyRisks.length - 1}` : ''}
                                          </div>
                                        {/if}
                                      </div>
                                    {/if}
                                  </div>
                                </div>
                              </div>
                            {/if}
                          </div>
                        {/each}
                      {/each}
                    </div>
                  </div>
                </div>
                
                <!-- X-axis Label -->
                <div class="text-center mt-4">
                  <span class="text-sm font-medium text-gray-900">Impact</span>
                </div>
              </div>
            </div>

            <!-- Simplified Risk Details Modal -->
            {#if showRiskDetails && selectedCell}
              <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div class="p-6">
                    <!-- Modal Header -->
                    <div class="flex justify-between items-start mb-6">
                      <div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Risk Analysis</h3>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                          <div class="flex items-center gap-1">
                            <span class="font-medium">Probability:</span>
                            <span class="px-2 py-1 bg-gray-100 rounded">{selectedCell.probability}</span>
                          </div>
                          <span>×</span>
                          <div class="flex items-center gap-1">
                            <span class="font-medium">Impact:</span>
                            <span class="px-2 py-1 bg-gray-100 rounded">{selectedCell.severity}</span>
                          </div>
                          <span>=</span>
                          <span class="px-2 py-1 text-sm font-medium rounded-full {
                            selectedCell.riskLevel <= 6 ? 'bg-green-100 text-green-800' :
                            selectedCell.riskLevel <= 12 ? 'bg-yellow-100 text-yellow-800' :
                            selectedCell.riskLevel <= 18 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }">{selectedCell.riskLevel}</span>
                        </div>
                      </div>
                      <button
                        class="text-gray-400 hover:text-gray-500"
                        on:click={() => {
                          showRiskDetails = false;
                          selectedRisks = null;
                          selectedCell = null;
                        }}
                      >
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <!-- Risks List -->
                    <div class="space-y-6">
                      {#if selectedRisks}
                        <!-- Build Risks -->
                        {#if selectedRisks.buildRisks.length > 0}
                          <div class="p-4 bg-secondary/5 rounded-xl border border-secondary/20">
                            <div class="flex items-center gap-2 mb-4">
                              <div class="w-3 h-3 rounded-full bg-secondary"></div>
                              <h4 class="text-lg font-medium text-gray-900">Build Risks ({selectedRisks.buildRisks.length})</h4>
                            </div>
                            <div class="space-y-4">
                              {#each selectedRisks.buildRisks as risk}
                                <div class="p-4 bg-white rounded-lg border border-gray-100">
                                  <div class="flex justify-between items-start mb-2">
                                    <h5 class="font-medium text-gray-900">{risk.label}</h5>
                                    <span class="px-2 py-1 text-xs font-medium bg-secondary/10 text-secondary rounded-full">
                                      P{risk.probability} × I{risk.severity}
                                    </span>
                                  </div>
                                  <p class="text-sm text-gray-600 mb-3">{risk.description}</p>
                                  {#if risk.details}
                                    <div class="mt-3 pt-3 border-t border-gray-100">
                                      <div class="grid grid-cols-2 gap-4">
                                        <div>
                                          <h6 class="text-xs font-medium text-gray-700 mb-2">Probability Factors</h6>
                                          <ul class="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                            {#each risk.details.probabilityFactors || [] as factor}
                                              <li>{factor}</li>
                                            {/each}
                                          </ul>
                                        </div>
                                        <div>
                                          <h6 class="text-xs font-medium text-gray-700 mb-2">Severity Factors</h6>
                                          <ul class="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                            {#each risk.details.severityFactors || [] as factor}
                                              <li>{factor}</li>
                                            {/each}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          </div>
                        {/if}

                        <!-- Buy Risks -->
                        {#if selectedRisks.buyRisks.length > 0}
                          <div class="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div class="flex items-center gap-2 mb-4">
                              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                              <h4 class="text-lg font-medium text-gray-900">Buy Risks ({selectedRisks.buyRisks.length})</h4>
                            </div>
                            <div class="space-y-4">
                              {#each selectedRisks.buyRisks as risk}
                                <div class="p-4 bg-white rounded-lg border border-gray-100">
                                  <div class="flex justify-between items-start mb-2">
                                    <h5 class="font-medium text-gray-900">{risk.label}</h5>
                                    <span class="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                                      P{risk.probability} × I{risk.severity}
                                    </span>
                                  </div>
                                  <p class="text-sm text-gray-600 mb-3">{risk.description}</p>
                                  {#if risk.details}
                                    <div class="mt-3 pt-3 border-t border-gray-100">
                                      <div class="grid grid-cols-2 gap-4">
                                        <div>
                                          <h6 class="text-xs font-medium text-gray-700 mb-2">Probability Factors</h6>
                                          <ul class="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                            {#each risk.details.probabilityFactors || [] as factor}
                                              <li>{factor}</li>
                                            {/each}
                                          </ul>
                                        </div>
                                        <div>
                                          <h6 class="text-xs font-medium text-gray-700 mb-2">Severity Factors</h6>
                                          <ul class="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                            {#each risk.details.severityFactors || [] as factor}
                                              <li>{factor}</li>
                                            {/each}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          </div>
                        {/if}
                      {:else}
                        <div class="text-center py-6 text-gray-500">
                          No risks found in this cell.
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Risk Calculations Accordion -->
            <div class="mt-8">
              <button
                class="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                on:click={() => showCalculations = !showCalculations}
              >
                <span class="text-sm font-medium text-gray-900">Risk Calculations Details</span>
                <svg
                  class="w-5 h-5 transform transition-transform {showCalculations ? 'rotate-180' : ''}"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {#if showCalculations}
                <div class="mt-4 space-y-6">
                  <!-- Risk Level Legend -->
                  <div class="p-4 bg-gray-50 rounded-lg">
                    <h5 class="font-medium text-gray-900 mb-4">Risk Level Categories</h5>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div class="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div class="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
                        <div class="flex flex-col">
                          <span class="text-sm font-medium text-gray-900">Low Risk (1-6)</span>
                          <span class="text-xs text-gray-600">Minimal impact/probability</span>
                        </div>
                      </div>
                      <div class="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div class="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
                        <div class="flex flex-col">
                          <span class="text-sm font-medium text-gray-900">Medium Risk (7-12)</span>
                          <span class="text-xs text-gray-600">Moderate impact/probability</span>
                        </div>
                      </div>
                      <div class="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div class="w-3 h-3 bg-orange-100 border border-orange-300 rounded mr-2"></div>
                        <div class="flex flex-col">
                          <span class="text-sm font-medium text-gray-900">High Risk (13-18)</span>
                          <span class="text-xs text-gray-600">Significant impact/probability</span>
                        </div>
                      </div>
                      <div class="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div class="w-3 h-3 bg-red-100 border border-red-300 rounded mr-2"></div>
                        <div class="flex flex-col">
                          <span class="text-sm font-medium text-gray-900">Critical Risk (19-25)</span>
                          <span class="text-xs text-gray-600">Severe impact/probability</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Build Risk Calculations -->
                  <div class="p-4 bg-gray-50 rounded-lg">
                    <h5 class="font-medium text-gray-900 mb-4">Build Risk Calculations</h5>
                    <div class="space-y-4">
                      {#each riskMatrix.buildRisks as risk}
                        <div class="p-4 bg-white rounded-lg border border-gray-200">
                          <div class="flex justify-between items-start mb-3">
                            <div>
                              <h6 class="font-medium text-gray-900">{risk.label}</h6>
                              <p class="text-sm text-gray-600 mt-1">{risk.description}</p>
                            </div>
                            <div class="flex items-center gap-2 text-sm">
                              <span class="px-2 py-1 rounded bg-secondary/10 text-secondary">
                                P{risk.probability} × S{risk.severity}
                              </span>
                            </div>
                          </div>

                          <!-- Key Considerations -->
                          <div class="mb-4">
                            <h6 class="text-sm font-medium text-gray-900 mb-2">Key Considerations</h6>
                            <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {#each risk.details.reasoning as reason}
                                <li>{reason}</li>
                              {/each}
                            </ul>
                          </div>

                          <!-- Probability Factors -->
                          <div class="mb-4">
                            <h6 class="text-sm font-medium text-gray-900 mb-2">Probability Factors</h6>
                            <div class="bg-gray-50 p-3 rounded">
                              <ul class="list-none text-sm text-gray-600 space-y-1">
                                {#each risk.details.probabilityFactors as factor}
                                  <li class="flex items-center">
                                    <span class="w-2 h-2 rounded-full bg-secondary mr-2"></span>
                                    {factor}
                                  </li>
                                {/each}
                              </ul>
                            </div>
                          </div>

                          <!-- Severity Factors -->
                          <div class="mb-4">
                            <h6 class="text-sm font-medium text-gray-900 mb-2">Severity Factors</h6>
                            <div class="bg-gray-50 p-3 rounded">
                              <ul class="list-none text-sm text-gray-600 space-y-1">
                                {#each risk.details.severityFactors as factor}
                                  <li class="flex items-center">
                                    <span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                    {factor}
                                  </li>
                                {/each}
                              </ul>
                            </div>
                          </div>

                          <!-- Calculation Method -->
                          <div>
                            <h6 class="text-sm font-medium text-gray-900 mb-2">Calculation Method</h6>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <h7 class="text-xs font-medium text-gray-700">Probability</h7>
                                <ul class="mt-1 text-xs text-gray-600 space-y-1">
                                  {#each risk.details.calculation.probability as step}
                                    <li>{step}</li>
                                  {/each}
                                </ul>
                              </div>
                              <div>
                                <h7 class="text-xs font-medium text-gray-700">Severity</h7>
                                <ul class="mt-1 text-xs text-gray-600 space-y-1">
                                  {#each risk.details.calculation.severity as step}
                                    <li>{step}</li>
                                  {/each}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>

                  <!-- Buy Risk Calculations -->
                  <div class="p-4 bg-gray-50 rounded-lg">
                    <h5 class="font-medium text-gray-900 mb-4">Buy Risk Calculations</h5>
                    <div class="space-y-4">
                      {#each riskMatrix.buyRisks as risk}
                        <div class="p-4 bg-white rounded-lg border border-gray-200">
                          <div class="flex justify-between items-start mb-3">
                            <div>
                              <h6 class="font-medium text-gray-900">{risk.label}</h6>
                              <p class="text-sm text-gray-600 mt-1">{risk.description}</p>
                            </div>
                            <div class="flex items-center gap-2 text-sm">
                              <span class="px-2 py-1 rounded bg-blue-500/10 text-blue-500">
                                P{risk.probability} × S{risk.severity}
                              </span>
                            </div>
                          </div>

                          <!-- Key Considerations -->
                          <div class="mb-4">
                            <h6 class="text-sm font-medium text-gray-900 mb-2">Key Considerations</h6>
                            <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {#each risk.details.reasoning as reason}
                                <li>{reason}</li>
                              {/each}
                            </ul>
                          </div>

                          <!-- Probability Factors -->
                          <div class="mb-4">
                            <h6 class="text-sm font-medium text-gray-900 mb-2">Probability Factors</h6>
                            <div class="bg-gray-50 p-3 rounded">
                              <ul class="list-none text-sm text-gray-600 space-y-1">
                                {#each risk.details.probabilityFactors as factor}
                                  <li class="flex items-center">
                                    <span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                    {factor}
                                  </li>
                                {/each}
                              </ul>
                            </div>
                          </div>

                          <!-- Severity Factors -->
                          <div class="mb-4">
                            <h6 class="text-sm font-medium text-gray-900 mb-2">Severity Factors</h6>
                            <div class="bg-gray-50 p-3 rounded">
                              <ul class="list-none text-sm text-gray-600 space-y-1">
                                {#each risk.details.severityFactors as factor}
                                  <li class="flex items-center">
                                    <span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                    {factor}
                                  </li>
                                {/each}
                              </ul>
                            </div>
                          </div>

                          <!-- Calculation Method -->
                          <div>
                            <h6 class="text-sm font-medium text-gray-900 mb-2">Calculation Method</h6>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <h7 class="text-xs font-medium text-gray-700">Probability</h7>
                                <ul class="mt-1 text-xs text-gray-600 space-y-1">
                                  {#each risk.details.calculation.probability as step}
                                    <li>{step}</li>
                                  {/each}
                                </ul>
                              </div>
                              <div>
                                <h7 class="text-xs font-medium text-gray-700">Severity</h7>
                                <ul class="mt-1 text-xs text-gray-600 space-y-1">
                                  {#each risk.details.calculation.severity as step}
                                    <li>{step}</li>
                                  {/each}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              {/if}
            </div>

          <!-- Risk Summary -->
          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Build Risks Summary -->
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-4 h-4 rounded-full bg-secondary"></div>
                <h5 class="font-medium text-gray-900">Build Risk Summary</h5>
              </div>
              <div class="space-y-2">
                {#each riskMatrix.buildRisks as risk}
                  <div class="flex items-center justify-between text-sm p-2 bg-white rounded border border-gray-200">
                    <span class="text-gray-900 text-xs">{risk.label}</span>
                    <span class="text-gray-600 font-medium text-xs">P{risk.probability} × I{risk.severity}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Buy Risks Summary -->
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-4 h-4 rounded-full bg-blue-500"></div>
                <h5 class="font-medium text-gray-900">Buy Risk Summary</h5>
              </div>
              <div class="space-y-2">
                {#each riskMatrix.buyRisks as risk}
                  <div class="flex items-center justify-between text-sm p-2 bg-white rounded border border-gray-200">
                    <span class="text-gray-900 text-xs">{risk.label}</span>
                    <span class="text-gray-600 font-medium text-xs">P{risk.probability} × I{risk.severity}</span>
                  </div>
                {/each}
              </div>
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
        </div>
      </div>
    </div>
  {/if}

  <RiskTutorialModal 
    showModal={showRiskTutorial}
    onClose={() => showRiskTutorial = false}
  />
{/if}
