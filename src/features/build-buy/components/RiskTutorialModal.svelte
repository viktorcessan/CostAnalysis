<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  export let showModal = false;
  export let onClose: () => void;

  let currentStep = 1;
  const totalSteps = 4;
  let modalContent: HTMLElement;

  function nextStep() {
    if (currentStep < totalSteps) {
      currentStep++;
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }
  }

  function previousStep() {
    if (currentStep > 1) {
      currentStep--;
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }
  }

  function closeModal() {
    currentStep = 1;
    onClose();
  }

  // Build risks data
  const buildRisks = [
    {
      label: 'Development Delays',
      description: 'Risk of project timeline delays and scope overruns',
      probability: {
        score: 3,
        factors: [
          'Project complexity and dependencies',
          'Team experience with similar projects',
          'Resource availability',
          'Requirements clarity'
        ]
      },
      severity: {
        score: 4,
        factors: [
          'Impact on business timelines',
          'Additional resource costs',
          'Opportunity costs',
          'Stakeholder relationships'
        ]
      }
    },
    {
      label: 'Technical Debt',
      description: 'Risk of accumulating technical debt and maintenance burden',
      probability: {
        score: 4,
        factors: [
          'Development time pressure',
          'Team expertise gaps',
          'Architecture complexity',
          'Rapid requirement changes'
        ]
      },
      severity: {
        score: 3,
        factors: [
          'Future development slowdown',
          'Maintenance cost increase',
          'System reliability impact',
          'Team productivity impact'
        ]
      }
    },
    {
      label: 'Resource Dependencies',
      description: 'Risk of critical resource dependencies and knowledge silos',
      probability: {
        score: 3,
        factors: [
          'Team size and composition',
          'Specialized skill requirements',
          'Knowledge documentation practices',
          'Team turnover history'
        ]
      },
      severity: {
        score: 3,
        factors: [
          'Project continuity impact',
          'Knowledge transfer costs',
          'Development velocity impact',
          'Quality assurance challenges'
        ]
      }
    },
    {
      label: 'Maintenance Burden',
      description: 'Risk of ongoing maintenance and support requirements',
      probability: {
        score: 4,
        factors: [
          'System complexity',
          'Custom code volume',
          'Integration points',
          'Technology stack stability'
        ]
      },
      severity: {
        score: 4,
        factors: [
          'Operational cost impact',
          'Resource allocation needs',
          'System evolution capability',
          'Business agility impact'
        ]
      }
    },
    {
      label: 'Integration Complexity',
      description: 'Risk of complex system integration challenges',
      probability: {
        score: 3,
        factors: [
          'System interdependencies',
          'API complexity',
          'Data synchronization needs',
          'Technology compatibility'
        ]
      },
      severity: {
        score: 4,
        factors: [
          'System reliability impact',
          'Performance implications',
          'Development effort increase',
          'Maintenance complexity'
        ]
      }
    },
    {
      label: 'Scope Creep',
      description: 'Risk of expanding requirements and feature additions',
      probability: {
        score: 4,
        factors: [
          'Requirement clarity',
          'Stakeholder alignment',
          'Project governance',
          'Change management process'
        ]
      },
      severity: {
        score: 3,
        factors: [
          'Timeline impact',
          'Resource allocation',
          'Budget overruns',
          'Quality compromises'
        ]
      }
    },
    {
      label: 'Knowledge Gaps',
      description: 'Risk of missing domain expertise or technical skills',
      probability: {
        score: 3,
        factors: [
          'Team expertise level',
          'Technology novelty',
          'Domain complexity',
          'Training availability'
        ]
      },
      severity: {
        score: 4,
        factors: [
          'Development quality',
          'Implementation time',
          'Architecture decisions',
          'Maintenance capability'
        ]
      }
    },
    {
      label: 'Security Implementation',
      description: 'Risk of security vulnerabilities and compliance issues',
      probability: {
        score: 3,
        factors: [
          'Security expertise',
          'Compliance requirements',
          'System complexity',
          'Integration points'
        ]
      },
      severity: {
        score: 5,
        factors: [
          'Data breach impact',
          'Compliance violations',
          'Reputation damage',
          'Recovery costs'
        ]
      }
    },
    {
      label: 'Opportunity Cost',
      description: 'Risk of team unavailability for other strategic projects',
      probability: {
        score: 4,
        factors: [
          'Resource allocation',
          'Project duration',
          'Team size',
          'Parallel initiatives'
        ]
      },
      severity: {
        score: 3,
        factors: [
          'Strategic impact',
          'Revenue loss',
          'Market position',
          'Innovation capacity'
        ]
      }
    },
    {
      label: 'Testing Complexity',
      description: 'Risk of inadequate testing coverage and quality assurance',
      probability: {
        score: 3,
        factors: [
          'System complexity',
          'Test automation maturity',
          'QA expertise',
          'Integration points'
        ]
      },
      severity: {
        score: 4,
        factors: [
          'Production issues',
          'User satisfaction',
          'Maintenance cost',
          'Release velocity'
        ]
      }
    }
  ];

  // Buy risks data
  const buyRisks = [
    {
      label: 'Vendor Lock-in',
      description: 'Risk of becoming dependent on vendor systems and processes',
      probability: {
        score: 4,
        factors: [
          'Proprietary technology use',
          'Data migration complexity',
          'Integration depth',
          'Vendor market position'
        ]
      },
      severity: {
        score: 4,
        factors: [
          'Switching cost impact',
          'Business flexibility limitation',
          'Negotiation power loss',
          'Technology evolution constraints'
        ]
      }
    },
    {
      label: 'Limited Customization',
      description: 'Risk of constrained ability to customize and adapt the solution',
      probability: {
        score: 3,
        factors: [
          'Product architecture',
          'Vendor customization policy',
          'Feature roadmap alignment',
          'Extension capabilities'
        ]
      },
      severity: {
        score: 3,
        factors: [
          'Business process adaptation needs',
          'Competitive differentiation impact',
          'User experience limitations',
          'Process efficiency impact'
        ]
      }
    },
    {
      label: 'Cost Escalation',
      description: 'Risk of unexpected cost increases and pricing changes',
      probability: {
        score: 3,
        factors: [
          'Vendor pricing history',
          'Market competition level',
          'Usage growth projections',
          'Contract terms flexibility'
        ]
      },
      severity: {
        score: 4,
        factors: [
          'Budget impact',
          'ROI reduction',
          'Total cost of ownership',
          'Resource allocation impact'
        ]
      }
    },
    {
      label: 'Integration Limitations',
      description: 'Risk of restricted integration capabilities and API constraints',
      probability: {
        score: 3,
        factors: [
          'API maturity',
          'Integration documentation',
          'Technical support quality',
          'Update frequency'
        ]
      },
      severity: {
        score: 3,
        factors: [
          'System interoperability',
          'Data flow efficiency',
          'Process automation potential',
          'Development complexity'
        ]
      }
    },
    {
      label: 'Support Quality',
      description: 'Risk of inadequate vendor support and response times',
      probability: {
        score: 2,
        factors: [
          'Vendor support history',
          'Support team size',
          'Geographic coverage',
          'SLA commitments'
        ]
      },
      severity: {
        score: 4,
        factors: [
          'System availability impact',
          'Issue resolution time',
          'Business continuity risk',
          'User satisfaction impact'
        ]
      }
    },
    {
      label: 'Vendor Viability',
      description: 'Risk of vendor business stability and long-term sustainability',
      probability: {
        score: 2,
        factors: [
          'Financial health',
          'Market position',
          'Competition landscape',
          'Growth trajectory'
        ]
      },
      severity: {
        score: 5,
        factors: [
          'Service continuity',
          'Data access',
          'Migration costs',
          'Business disruption'
        ]
      }
    },
    {
      label: 'Performance Issues',
      description: 'Risk of performance limitations and scalability constraints',
      probability: {
        score: 3,
        factors: [
          'Infrastructure control',
          'Resource sharing',
          'Geographic distribution',
          'Peak load handling'
        ]
      },
      severity: {
        score: 4,
        factors: [
          'User experience',
          'Business operations',
          'Data processing',
          'System reliability'
        ]
      }
    },
    {
      label: 'Data Privacy Concerns',
      description: 'Risk of data handling and privacy compliance issues',
      probability: {
        score: 3,
        factors: [
          'Data location',
          'Privacy regulations',
          'Third-party access',
          'Security measures'
        ]
      },
      severity: {
        score: 5,
        factors: [
          'Compliance violations',
          'Reputation damage',
          'Legal consequences',
          'Customer trust'
        ]
      }
    },
    {
      label: 'Feature Dependency',
      description: 'Risk of reliance on vendor roadmap for critical features',
      probability: {
        score: 4,
        factors: [
          'Roadmap alignment',
          'Development pace',
          'Feature prioritization',
          'Market focus'
        ]
      },
      severity: {
        score: 3,
        factors: [
          'Business capabilities',
          'Competitive position',
          'User satisfaction',
          'Process efficiency'
        ]
      }
    },
    {
      label: 'Migration Complexity',
      description: 'Risk of complex data transitions and system migrations',
      probability: {
        score: 4,
        factors: [
          'Data volume',
          'Schema complexity',
          'Integration dependencies',
          'Business continuity'
        ]
      },
      severity: {
        score: 4,
        factors: [
          'Data integrity',
          'Service disruption',
          'Resource requirements',
          'Timeline impact'
        ]
      }
    }
  ];
</script>

{#if showModal}
  <!-- Modal Backdrop -->
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-50"
    on:click={closeModal}
    transition:fade
  />

  <!-- Modal Content -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    transition:fade
  >
    <div
      class="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      on:click|stopPropagation
      transition:fly={{ y: 20 }}
      bind:this={modalContent}
    >
      <!-- Modal Header -->
      <div class="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-semibold text-gray-900">Understanding Risk Analysis</h3>
          <button
            class="text-gray-400 hover:text-gray-500"
            on:click={closeModal}
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Progress Bar -->
        <div class="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-secondary transition-all duration-300"
            style="width: {(currentStep / totalSteps) * 100}%"
          />
        </div>
        <div class="mt-2 text-sm text-gray-600">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      <!-- Modal Content -->
      <div class="p-6">
        {#if currentStep === 1}
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900">What is the Risk Matrix?</h4>
            <p class="text-gray-600">
              The risk matrix is a visual tool that helps evaluate and compare risks between building and buying a solution. It plots risks based on two key factors:
            </p>
            <ul class="list-disc list-inside space-y-2 text-gray-600">
              <li><span class="font-medium">Probability (Y-axis)</span>: How likely is this risk to occur?</li>
              <li><span class="font-medium">Impact (X-axis)</span>: How severe would the consequences be?</li>
            </ul>
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-sm text-gray-600">
                Each cell in the matrix represents a combination of probability and impact, with a risk score calculated as: <span class="font-mono text-secondary">Risk Score = Probability × Impact</span>
              </p>
            </div>
          </div>
        {:else if currentStep === 2}
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900">Risk Levels</h4>
            <p class="text-gray-600">
              The matrix uses color coding to indicate different risk levels:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-3 bg-green-50 rounded-lg border border-green-200">
                <h5 class="font-medium text-gray-900">Low Risk (1-6)</h5>
                <p class="text-sm text-gray-600">Minimal impact and/or low probability</p>
              </div>
              <div class="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <h5 class="font-medium text-gray-900">Medium Risk (7-12)</h5>
                <p class="text-sm text-gray-600">Moderate impact and/or probability</p>
              </div>
              <div class="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <h5 class="font-medium text-gray-900">High Risk (13-18)</h5>
                <p class="text-sm text-gray-600">Significant impact and/or high probability</p>
              </div>
              <div class="p-3 bg-red-50 rounded-lg border border-red-200">
                <h5 class="font-medium text-gray-900">Critical Risk (19-25)</h5>
                <p class="text-sm text-gray-600">Severe impact and very high probability</p>
              </div>
            </div>
          </div>
        {:else if currentStep === 3}
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900">Build Risk Details</h4>
            <div class="space-y-6">
              {#each buildRisks as risk}
                <div class="p-4 bg-gray-50 rounded-lg">
                  <div class="flex justify-between items-start mb-3">
                    <h5 class="font-medium text-gray-900">{risk.label}</h5>
                    <span class="px-2 py-1 text-xs font-medium bg-secondary/10 text-secondary rounded-full">
                      Score: {risk.probability.score * risk.severity.score}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-4">{risk.description}</p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h6 class="text-sm font-medium text-gray-900 mb-2">Probability Factors (P{risk.probability.score})</h6>
                      <ul class="list-disc list-inside text-xs text-gray-600 space-y-1">
                        {#each risk.probability.factors as factor}
                          <li>{factor}</li>
                        {/each}
                      </ul>
                    </div>
                    <div>
                      <h6 class="text-sm font-medium text-gray-900 mb-2">Severity Factors (I{risk.severity.score})</h6>
                      <ul class="list-disc list-inside text-xs text-gray-600 space-y-1">
                        {#each risk.severity.factors as factor}
                          <li>{factor}</li>
                        {/each}
                      </ul>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else if currentStep === 4}
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900">Buy Risk Details</h4>
            <div class="space-y-6">
              {#each buyRisks as risk}
                <div class="p-4 bg-gray-50 rounded-lg">
                  <div class="flex justify-between items-start mb-3">
                    <h5 class="font-medium text-gray-900">{risk.label}</h5>
                    <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      Score: {risk.probability.score * risk.severity.score}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-4">{risk.description}</p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h6 class="text-sm font-medium text-gray-900 mb-2">Probability Factors (P{risk.probability.score})</h6>
                      <ul class="list-disc list-inside text-xs text-gray-600 space-y-1">
                        {#each risk.probability.factors as factor}
                          <li>{factor}</li>
                        {/each}
                      </ul>
                    </div>
                    <div>
                      <h6 class="text-sm font-medium text-gray-900 mb-2">Severity Factors (I{risk.severity.score})</h6>
                      <ul class="list-disc list-inside text-xs text-gray-600 space-y-1">
                        {#each risk.severity.factors as factor}
                          <li>{factor}</li>
                        {/each}
                      </ul>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="p-6 border-t border-gray-200">
        <div class="flex justify-between">
          <button
            class="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 disabled:opacity-50"
            on:click={previousStep}
            disabled={currentStep === 1}
          >
            Previous
          </button>
          <button
            class="px-4 py-2 bg-secondary text-white font-medium rounded-lg hover:bg-secondary/90 disabled:opacity-50"
            on:click={currentStep === totalSteps ? closeModal : nextStep}
          >
            {currentStep === totalSteps ? 'Got it!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if} 