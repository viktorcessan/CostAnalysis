<script lang="ts">
  export let model: 'team' | 'ticket';
  export let mode: 'base' | 'solutions' | 'internal';

  let isOpen = false;

  // Formula definitions based on model and mode
  function getFormulas() {
    if (model === 'team') {
      if (mode === 'base') {
        return [
          {
            title: 'Monthly Operational Cost',
            formula: 'Monthly Cost = Team Size × Hourly Rate × Working Hours × Service Efficiency × (1 + Operational Overhead)',
            explanation: 'Calculates the total monthly operational cost based on team size, hourly rates, and efficiency factors.',
            variables: [
              { name: 'Team Size', description: 'Number of team members (from teamSize input)' },
              { name: 'Hourly Rate', description: 'Average cost per hour per team member (from hourlyRate input)' },
              { name: 'Working Hours', description: 'Standard monthly working hours (fixed at 160)' },
              { name: 'Service Efficiency', description: 'Percentage of time spent on productive work (from serviceEfficiency input, 0-100%)' },
              { name: 'Operational Overhead', description: 'Additional costs as percentage (from operationalOverhead input)' }
            ],
            assumptions: [
              'Standard month has 160 working hours (8 hours × 20 days)',
              'Hourly rates include benefits and standard overhead',
              'Service efficiency accounts for meetings, breaks, and non-productive time',
              'Operational overhead includes tools, infrastructure, and other indirect costs'
            ]
          },
          {
            title: 'Platform Solution Cost',
            formula: `Implementation Cost = Monthly Platform Cost Target × Implementation Time
Monthly Operating Cost = Monthly Platform Cost Target
Time to Value = Implementation Time (months)
Team Cost Reduction = Monthly Cost × Team Reduction %
Process Efficiency Savings = Monthly Cost × Process Efficiency %
Total Monthly Savings = Team Cost Reduction + Process Efficiency Savings - Monthly Platform Cost Target`,
            explanation: 'Calculates the costs and savings for the platform solution based on implementation and efficiency gains, using the target monthly platform cost.',
            variables: [
              { name: 'Monthly Platform Cost Target', description: 'Target monthly cost for platform maintenance (from user input)' },
              { name: 'Implementation Time', description: 'Months until solution is operational (from implementationTarget input)' },
              { name: 'Team Reduction', description: 'Expected team size reduction (from teamReduction input, 0-100%)' },
              { name: 'Process Efficiency', description: 'Expected efficiency improvement (from processEfficiency input, 0-100%)' }
            ],
            assumptions: [
              'Monthly platform cost remains stable at target level',
              'Implementation cost is based on monthly target cost',
              'Team reduction can be achieved as projected',
              'Process efficiency gains are realizable'
            ]
          },
          {
            title: 'Outsourcing Solution Cost',
            formula: `Monthly Outsourcing Cost = Baseline Cost × (1 + Management Overhead)
Quality Impact Cost = Monthly Outsourcing Cost × Quality Impact
Knowledge Loss Impact = Monthly Outsourcing Cost × Knowledge Loss
Transition Period Cost = (Transition Cost ÷ Transition Time)
Total Monthly Cost = Monthly Outsourcing Cost + Quality Impact Cost + Knowledge Loss Impact + Transition Period Cost`,
            explanation: 'Calculates the total cost of outsourcing, including quality and knowledge impacts.',
            variables: [
              { name: 'Vendor Rate', description: 'Outsourcing cost as percentage of baseline (from vendorRate input)' },
              { name: 'Management Overhead', description: 'Additional management cost percentage (from managementOverhead input)' },
              { name: 'Quality Impact', description: 'Cost of quality changes (from qualityImpact input, -100% to 100%)' },
              { name: 'Knowledge Loss', description: 'Impact of knowledge transfer (from knowledgeLoss input, 0-100%)' },
              { name: 'Transition Time', description: 'Months for transition (from transitionTime input)' },
              { name: 'Transition Cost', description: 'One-time transition cost (from transitionCost input)' }
            ],
            assumptions: [
              'Vendor rates are based on current baseline cost',
              'Quality impact can be measured and quantified',
              'Knowledge loss effects are temporary',
              'Transition costs are spread over transition period'
            ]
          },
          {
            title: 'Hybrid Solution Cost',
            formula: `Platform Portion Cost = Platform Cost × Platform Portion
Vendor Portion Cost = Monthly Cost × Vendor Portion × Vendor Rate
Monthly Platform Cost = Platform Maintenance × Platform Portion
Monthly Vendor Cost = Vendor Portion Cost × (1 + Management Overhead)
Quality and Knowledge Impact = (Monthly Vendor Cost × Quality Impact) + (Monthly Vendor Cost × Knowledge Loss)
Total Monthly Cost = Monthly Platform Cost + Monthly Vendor Cost + Quality and Knowledge Impact`,
            explanation: 'Calculates the cost of a hybrid solution combining platform and outsourcing approaches.',
            variables: [
              { name: 'Platform Portion', description: 'Percentage handled by platform (from platformPortion input, 0-100%)' },
              { name: 'Vendor Portion', description: 'Percentage handled by vendor (from vendorPortion input, 0-100%)' },
              { name: 'Platform Cost', description: 'One-time platform cost (from platformCost input)' },
              { name: 'Platform Maintenance', description: 'Monthly platform maintenance (from platformMaintenance input)' },
              { name: 'Vendor Rate', description: 'Vendor cost rate (from vendorRate input)' },
              { name: 'Management Overhead', description: 'Vendor management cost (from managementOverhead input)' },
              { name: 'Quality Impact', description: 'Quality change impact (from qualityImpact input)' },
              { name: 'Knowledge Loss', description: 'Knowledge transfer impact (from knowledgeLoss input)' }
            ],
            assumptions: [
              'Platform portion and vendor portion sum to 100%',
              'Costs scale linearly with portion allocation',
              'Quality and knowledge impacts apply only to vendor portion',
              'Platform and vendor solutions can work together effectively'
            ]
          }
        ];
      } else if (mode === 'solutions') {
        return [
          {
            title: 'Break-Even Analysis',
            formula: 'Break-Even Months = Implementation Cost / (Monthly Savings - Monthly Platform Cost Target)',
            explanation: 'Calculates how long it will take to recover the platform investment based on monthly savings and target platform cost.',
            variables: [
              { name: 'Implementation Cost', description: 'Total cost for platform setup and integration' },
              { name: 'Monthly Savings', description: 'Reduction in monthly operational costs before platform cost' },
              { name: 'Monthly Platform Cost Target', description: 'Target monthly cost for platform maintenance' }
            ],
            assumptions: [
              'Monthly platform cost remains at target level',
              'Monthly savings remain consistent post-implementation',
              'No significant changes in team size during break-even period'
            ]
          },
          {
            title: 'Future Monthly Cost',
            formula: 'Future Cost = Current Cost × (1 - Team Reduction) × (1 - Process Efficiency) + Monthly Platform Cost Target',
            explanation: 'Projects future monthly costs after implementing the platform solution, using the target monthly platform cost.',
            variables: [
              { name: 'Current Cost', description: 'Current monthly operational cost' },
              { name: 'Team Reduction', description: 'Percentage reduction in team size (0-100%)' },
              { name: 'Process Efficiency', description: 'Percentage improvement in process efficiency (0-100%)' },
              { name: 'Monthly Platform Cost Target', description: 'Target monthly cost for platform maintenance' }
            ],
            assumptions: [
              'Platform cost remains at target level',
              'Efficiency gains are realizable and measurable',
              'Team reduction can be achieved through natural attrition',
              'Process improvements can be maintained long-term'
            ]
          }
        ];
      } else {
        return [
          {
            title: 'Team Interaction Cost',
            formula: `Direct Interaction Cost = Σ(Interaction Frequency × Average Duration × Number of Participants × Average Hourly Rate)
Coordination Overhead = Direct Interaction Cost × Coordination Factor
Total Interaction Cost = Direct Interaction Cost + Coordination Overhead`,
            explanation: 'Calculates the cost of team interactions including meetings, communications, and coordination overhead.',
            variables: [
              { name: 'Interaction Frequency', description: 'Number of interactions per month (meetings, calls, etc.)' },
              { name: 'Average Duration', description: 'Average length of each interaction in hours' },
              { name: 'Number of Participants', description: 'Average number of people involved in each interaction' },
              { name: 'Average Hourly Rate', description: 'Weighted average cost per hour of participants' },
              { name: 'Coordination Factor', description: 'Multiplier for additional coordination work (typically 0.2-0.5)' }
            ],
            assumptions: [
              'Interactions are necessary and productive',
              'Coordination overhead scales with direct interaction time',
              'All participants are actively engaged during interactions'
            ]
          },
          {
            title: 'Team Dependency Impact',
            formula: `Dependency Strength Score = Σ(Frequency × Complexity × Impact)
Communication Overhead = Dependency Strength Score × Communication Hours × Average Hourly Rate
Process Delay Cost = Dependency Strength Score × Average Delay Hours × Average Team Cost per Hour
Total Dependency Cost = Communication Overhead + Process Delay Cost`,
            explanation: 'Measures the cost impact of team dependencies through communication overhead and process delays.',
            variables: [
              { name: 'Frequency', description: 'How often teams need to interact (1-5 scale)' },
              { name: 'Complexity', description: 'Complexity of the dependency (1-5 scale)' },
              { name: 'Impact', description: 'Business impact of the dependency (1-5 scale)' },
              { name: 'Communication Hours', description: 'Hours spent on inter-team communication' },
              { name: 'Average Delay Hours', description: 'Average delay in hours due to dependencies' },
              { name: 'Average Team Cost per Hour', description: 'Average cost per hour for affected teams' }
            ],
            assumptions: [
              'Dependencies can be accurately mapped and measured',
              'Impact scores are consistently evaluated across teams',
              'Delays can be attributed to specific dependencies',
              'Communication overhead is proportional to dependency strength'
            ],
            observations: [
              'Higher dependency strength typically leads to increased coordination costs',
              'Complex dependencies often result in longer delays',
              'Regular dependency assessment helps identify optimization opportunities',
              'Strong dependencies may indicate need for team restructuring'
            ]
          }
        ];
      }
    } else {
      if (mode === 'base') {
        return [
          {
            title: 'Monthly Processing Cost',
            formula: 'Monthly Cost = Monthly Tickets × Hours per Ticket × People per Ticket × Hourly Rate',
            explanation: 'Calculates the total monthly cost based on ticket volume and processing requirements.',
            variables: [
              { name: 'Monthly Tickets', description: 'Number of tickets processed per month' },
              { name: 'Hours per Ticket', description: 'Average time spent per ticket' },
              { name: 'People per Ticket', description: 'Average number of people needed per ticket' },
              { name: 'Hourly Rate', description: 'Average cost per hour per person' }
            ],
            assumptions: [
              'Ticket complexity is relatively consistent',
              'Resource availability matches ticket demand',
              'Processing time follows a normal distribution'
            ]
          },
          {
            title: 'Cost per Ticket',
            formula: 'Cost per Ticket = Hours per Ticket × People per Ticket × Hourly Rate',
            explanation: 'Calculates the average cost to process a single ticket.',
            variables: [
              { name: 'Hours per Ticket', description: 'Average time spent per ticket' },
              { name: 'People per Ticket', description: 'Average number of people needed per ticket' },
              { name: 'Hourly Rate', description: 'Average cost per hour per person' }
            ],
            assumptions: [
              'Costs are averaged across ticket types',
              'Resource allocation is optimal',
              'No significant outliers in processing time'
            ]
          },
          {
            title: 'Platform Solution Cost',
            formula: `Implementation Cost = Setup Cost + Integration Cost + Initial Training Cost
Monthly Platform Cost = Base License Fee + (Per-Ticket Fee × Monthly Ticket Volume)
Maintenance Cost = Platform Support + Infrastructure Cost + Ongoing Training
Total Platform Cost = Implementation Cost + (Monthly Platform Cost + Maintenance Cost) × Duration`,
            explanation: 'Estimates the total cost of implementing and maintaining a ticket automation platform.',
            variables: [
              { name: 'Setup Cost', description: 'Initial platform setup and configuration costs' },
              { name: 'Integration Cost', description: 'Cost to integrate with existing systems' },
              { name: 'Initial Training Cost', description: 'Cost to train staff on the new platform' },
              { name: 'Base License Fee', description: 'Monthly base fee for platform usage' },
              { name: 'Per-Ticket Fee', description: 'Additional cost per ticket processed' },
              { name: 'Monthly Ticket Volume', description: 'Expected number of tickets per month' },
              { name: 'Platform Support', description: 'Monthly cost for platform support' },
              { name: 'Infrastructure Cost', description: 'Monthly hosting and infrastructure costs' },
              { name: 'Ongoing Training', description: 'Monthly cost for continuous training' },
              { name: 'Duration', description: 'Number of months for cost projection' }
            ],
            assumptions: [
              'Platform can handle expected ticket volume',
              'Integration with existing systems is feasible',
              'Staff can be effectively trained on the platform',
              'Infrastructure can support the platform',
              'License model is volume-based'
            ],
            observations: [
              'Setup costs vary significantly based on complexity',
              'Training needs often exceed initial estimates',
              'Integration costs depend on existing system compatibility',
              'Volume-based pricing may need negotiation for high volumes'
            ]
          },
          {
            title: 'Outsourcing Solution Cost',
            formula: `Base Ticket Cost = Monthly Tickets × Vendor Per-Ticket Rate
Knowledge Transfer Cost = (Training Hours × Vendor Rate) + (Documentation Cost)
Quality Management Cost = Base Ticket Cost × QA Rate
Vendor Management Cost = Base Ticket Cost × Management Rate
SLA Penalty Risk = (Penalty Rate × Affected Ticket %) × Base Ticket Cost
Total Outsourcing Cost = Base Ticket Cost + Knowledge Transfer Cost + Quality Management Cost + Vendor Management Cost + SLA Penalty Risk`,
            explanation: 'Calculates the total cost of outsourcing ticket processing, including quality management and risks.',
            variables: [
              { name: 'Monthly Tickets', description: 'Number of tickets to be outsourced per month' },
              { name: 'Vendor Per-Ticket Rate', description: 'Vendor\'s charge per ticket processed' },
              { name: 'Training Hours', description: 'Hours required for vendor training' },
              { name: 'Vendor Rate', description: 'Vendor\'s hourly rate during training' },
              { name: 'Documentation Cost', description: 'Cost to prepare training materials' },
              { name: 'QA Rate', description: 'Quality assurance overhead percentage (typically 5-15%)' },
              { name: 'Management Rate', description: 'Vendor management overhead percentage (typically 10-20%)' },
              { name: 'Penalty Rate', description: 'SLA breach penalty as percentage of ticket cost' },
              { name: 'Affected Ticket %', description: 'Expected percentage of tickets at risk of SLA breach' }
            ],
            assumptions: [
              'Vendor can maintain required service levels',
              'Knowledge transfer can be completed effectively',
              'Quality can be maintained with proper oversight',
              'SLA penalties are properly defined in contract',
              'Ticket volumes are predictable'
            ],
            observations: [
              'Per-ticket rates often decrease with volume',
              'Quality management costs decrease over time',
              'SLA penalties need careful contract negotiation',
              'Knowledge transfer is crucial for complex tickets'
            ]
          },
          {
            title: 'Hybrid Solution Cost',
            formula: `Automated Ticket Cost = (Automation Rate × Monthly Tickets) × Platform Per-Ticket Cost
Manual Ticket Cost = ((1 - Automation Rate) × Monthly Tickets) × Internal Processing Cost
Outsourced Ticket Cost = (Outsource Rate × Monthly Tickets) × Vendor Per-Ticket Rate
Platform Costs = Platform License + Monthly Maintenance
Management Overhead = (Outsourced Ticket Cost × Vendor Management Rate) + (Automated Ticket Cost × Platform Management Rate)
Integration Cost = (Platform Costs + Outsourced Ticket Cost) × Integration Factor
Total Hybrid Cost = Automated Ticket Cost + Manual Ticket Cost + Outsourced Ticket Cost + Platform Costs + Management Overhead + Integration Cost`,
            explanation: 'Calculates the total cost of a hybrid solution combining automation, internal processing, and outsourcing for ticket management.',
            variables: [
              { name: 'Automation Rate', description: 'Percentage of tickets suitable for automation (0-100%)' },
              { name: 'Monthly Tickets', description: 'Total number of tickets per month' },
              { name: 'Platform Per-Ticket Cost', description: 'Cost per ticket for automated processing' },
              { name: 'Internal Processing Cost', description: 'Cost per ticket for internal team processing' },
              { name: 'Outsource Rate', description: 'Percentage of tickets to be outsourced (0-100%)' },
              { name: 'Vendor Per-Ticket Rate', description: 'Vendor\'s charge per ticket' },
              { name: 'Platform License', description: 'Monthly platform license fee' },
              { name: 'Monthly Maintenance', description: 'Platform maintenance and support costs' },
              { name: 'Vendor Management Rate', description: 'Overhead for managing outsourced tickets (%)' },
              { name: 'Platform Management Rate', description: 'Overhead for managing automated solution (%)' },
              { name: 'Integration Factor', description: 'Additional cost factor for integration (0.1-0.3)' }
            ],
            assumptions: [
              'Tickets can be effectively categorized for routing',
              'Automation and outsourcing can coexist efficiently',
              'Integration between systems is reliable',
              'Management overhead scales with volume',
              'Service levels can be maintained across all channels'
            ],
            observations: [
              'Optimal balance varies by ticket complexity',
              'Integration costs increase with more components',
              'Regular route optimization is needed',
              'Different ticket types may need different approaches',
              'Monitoring across channels requires robust tools'
            ]
          }
        ];
      } else {
        return [
          {
            title: 'Break-Even Analysis',
            formula: 'Break-Even Months = Total Solution Cost / (Current Monthly Cost - Future Monthly Cost)',
            explanation: 'Calculates how long it will take to recover the automation investment.',
            variables: [
              { name: 'Total Solution Cost', description: 'Total investment in automation solution' },
              { name: 'Current Monthly Cost', description: 'Current monthly operational cost' },
              { name: 'Future Monthly Cost', description: 'Projected monthly cost after automation' }
            ],
            assumptions: [
              'Cost savings remain stable post-implementation',
              'Ticket volume remains relatively consistent',
              'Automation effectiveness meets projections'
            ]
          },
          {
            title: 'Future Monthly Cost',
            formula: `Manual Processing Cost = Monthly Tickets × (1 - Automation Rate) × Hours per Ticket × People per Ticket × Hourly Rate
Automated Processing Cost = Monthly Tickets × Automation Rate × Per-Ticket Automation Cost
Future Cost = Manual Processing Cost + Automated Processing Cost + Platform Maintenance`,
            explanation: 'Projects future monthly costs after implementing automation.',
            variables: [
              { name: 'Automation Rate', description: 'Percentage of tickets that can be automated (0-100%)' },
              { name: 'Per-Ticket Automation Cost', description: 'Cost to process a ticket through automation' },
              { name: 'Platform Maintenance', description: 'Monthly platform maintenance cost' }
            ],
            assumptions: [
              'Automation rate can be achieved and maintained',
              'Manual and automated processes can coexist',
              'Maintenance costs remain stable'
            ],
            observations: [
              'Higher automation rates typically lead to better ROI',
              'Some tickets may require hybrid processing',
              'Regular monitoring helps optimize automation rules'
            ]
          }
        ];
      }
    }
  }
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <button
    class="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
    on:click={() => isOpen = !isOpen}
  >
    <div class="flex items-center gap-3">
      <svg class="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <span class="font-medium text-gray-900">Calculation Formulas & Explanations</span>
    </div>
    <svg
      class="w-5 h-5 text-gray-500 transform transition-transform {isOpen ? 'rotate-180' : ''}"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if isOpen}
    <div class="p-6 space-y-6">
      {#each getFormulas() as formula}
        <div class="space-y-3">
          <h3 class="text-lg font-semibold text-gray-900">{formula.title}</h3>
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <pre class="text-sm text-secondary font-medium whitespace-pre-wrap">{formula.formula}</pre>
          </div>
          <p class="text-sm text-gray-600">{formula.explanation}</p>
          
          <div class="mt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Variables:</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              {#each formula.variables as variable}
                <div class="flex items-start gap-2">
                  <span class="text-xs font-medium text-secondary">{variable.name}:</span>
                  <span class="text-xs text-gray-600">{variable.description}</span>
                </div>
              {/each}
            </div>
          </div>

          {#if formula.assumptions}
            <div class="mt-4">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Assumptions:</h4>
              <ul class="list-disc list-inside space-y-1">
                {#each formula.assumptions as assumption}
                  <li class="text-xs text-gray-600">{assumption}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if formula.observations}
            <div class="mt-4">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Observations:</h4>
              <ul class="list-disc list-inside space-y-1">
                {#each formula.observations as observation}
                  <li class="text-xs text-gray-600">{observation}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div> 