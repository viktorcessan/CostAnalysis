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
          },
          {
            title: 'Cost Savings Analysis',
            formula: `Monthly Savings = Current Monthly Cost - Future Monthly Cost
Break-even Point = Implementation Cost / Monthly Savings
Crossover Point = First month where Cumulative Solution Cost < Cumulative Current Cost
Two Year Total = (Monthly Cost × 24) + Initial Cost`,
            explanation: 'Analyzes cost savings and key financial metrics for the solution.',
            variables: [
              { name: 'Current Monthly Cost', description: 'Current operational costs per month' },
              { name: 'Future Monthly Cost', description: 'Projected costs after solution implementation' },
              { name: 'Implementation Cost', description: 'One-time cost to implement the solution' },
              { name: 'Monthly Savings', description: 'Difference between current and future monthly costs' }
            ],
            assumptions: [
              'Monthly costs remain stable after implementation',
              'Implementation costs are paid upfront',
              'Savings begin after implementation period'
            ]
          },
          {
            title: 'Target Planning Metrics',
            formula: `Target Monthly Cost = Current Cost × (1 - Cost Reduction Target)
Required Efficiency Gain = (Current Cost - Target Cost) / Current Cost
Implementation Budget = Monthly Savings × Target Break-even
Platform Cost Target = Monthly Savings × Platform Cost Factor`,
            explanation: 'Calculates target metrics based on desired outcomes and constraints.',
            variables: [
              { name: 'Cost Reduction Target', description: 'Desired percentage cost reduction' },
              { name: 'Target Break-even', description: 'Desired months to break even' },
              { name: 'Platform Cost Factor', description: 'Portion of savings allocated to platform' },
              { name: 'Current Cost', description: 'Current monthly operational cost' }
            ],
            assumptions: [
              'Targets are achievable within constraints',
              'Linear relationship between costs and efficiency',
              'Stable business environment during transition'
            ]
          },
          {
            title: 'Sensitivity Analysis',
            formula: `Pessimistic Case = Base Savings × 0.8
Optimistic Case = Base Savings × 1.2
Adjusted Break-even = Base Break-even × (Base Savings / Adjusted Savings)
Risk-adjusted ROI = (Expected Savings × Probability) / Implementation Cost`,
            explanation: 'Evaluates the impact of variations in key assumptions.',
            variables: [
              { name: 'Base Savings', description: 'Expected monthly savings' },
              { name: 'Base Break-even', description: 'Expected break-even period' },
              { name: 'Probability', description: 'Likelihood of achieving projected savings' },
              { name: 'Implementation Cost', description: 'Total cost of implementation' }
            ],
            assumptions: [
              '±20% variation for sensitivity bounds',
              'Normal distribution of outcomes',
              'Independent risk factors'
            ]
          }
        ];
      } else {
        return [
          {
            title: 'Direct Meeting Costs',
            formula: `Direct Meeting Cost = Σ(Meeting Hours × Hourly Rate)
where Meeting Hours comes from the team communication matrix`,
            explanation: 'Calculates the cost of direct team meetings based on manually specified meeting hours in the communication matrix.',
            variables: [
              { name: 'Meeting Hours', description: 'Meeting hours per month from communication matrix' },
              { name: 'Hourly Rate', description: 'Average cost per hour per team member' }
            ],
            assumptions: [
              'Meeting hours are accurately tracked in communication matrix',
              'All participants are actively engaged',
              'Hourly rates are consistent across team members'
            ]
          },
          {
            title: 'Communication Overhead',
            formula: `Dependency Overhead = Number of Dependencies × Communication Overhead Multiplier × Hourly Rate × Baseline Hours
Manual Overhead = Σ((Overhead Hours + Additional Hours) × Hourly Rate)
Total Communication Overhead = Dependency Overhead + Manual Overhead`,
            explanation: 'Calculates additional costs from meeting preparation, follow-up, and coordination activities. Combines both dependency-based overhead (from team connections) and manual overhead (from communication matrix).',
            variables: [
              { name: 'Number of Dependencies', description: 'Total count of team connections' },
              { name: 'Communication Overhead Multiplier', description: 'Multiplier for coordination time (default 1.2)' },
              { name: 'Baseline Hours', description: 'Base monthly communication hours per connection (default 8)' },
              { name: 'Overhead Hours', description: 'Manual overhead hours from communication matrix' },
              { name: 'Additional Hours', description: 'Extra communication hours from matrix' },
              { name: 'Hourly Rate', description: 'Average cost per hour per team member' }
            ],
            assumptions: [
              'Dependency overhead scales linearly with number of connections',
              'Communication overhead multiplier applies to all dependencies',
              'Manual overhead is accurately tracked in the communication matrix'
            ]
          },
          {
            title: 'Opportunity Cost',
            formula: 'Opportunity Cost = Direct Meeting Cost + Communication Overhead',
            explanation: 'Represents the total cost of time spent on coordination and communication instead of direct work.',
            variables: [
              { name: 'Direct Meeting Cost', description: 'Cost of scheduled meetings' },
              { name: 'Communication Overhead', description: 'Cost of coordination activities' }
            ],
            assumptions: [
              'All coordination time has opportunity cost',
              'Time could otherwise be spent on direct work',
              'Cost is proportional to time spent'
            ]
          },
          {
            title: 'Flow Efficiency Impact',
            formula: `Total Dependency Strength = Σ(Edge Strength)
Average Dependency Level = Total Dependency Strength / Number of Edges
Impact Factor = MaxImpact × (1 / (1 + e^(-(TotalDependencyStrength - Midpoint) / Steepness)))
Flow Efficiency Cost = Total Monthly Hours × Hourly Rate × Impact Factor`,
            explanation: 'Calculates the cost of reduced productivity due to dependencies using a sigmoid function.',
            variables: [
              { name: 'MaxImpact', description: 'Maximum efficiency loss (40%)' },
              { name: 'TotalDependencyStrength', description: 'Sum of all dependency values' },
              { name: 'Midpoint', description: 'Sigmoid midpoint (15)' },
              { name: 'Steepness', description: 'Curve steepness factor (10)' },
              { name: 'Total Monthly Hours', description: 'Average team size × 160 hours' }
            ],
            assumptions: [
              'Impact follows a sigmoid curve',
              'Maximum efficiency loss is capped at 40%',
              'Impact increases with total dependency strength'
            ]
          },
          {
            title: 'Team Metrics',
            formula: `Flow Efficiency = (Process Time / (Process Time + Wait Time)) × 100%
Process Time = Σ(Throughput × (8 / Efficiency))
Wait Time = Σ(Dependency Strength × Base Lead Time × 0.5)

Dependency Impact Score = (Actual Dependencies / Maximum Dependencies) × 100%
Maximum Dependencies = Teams × (Teams - 1) × 5

Utilization Rate = ((Actual Work + Coordination Overhead) / Total Capacity) × 100%
Total Capacity = Σ(Team Size × 40 hours)
Actual Work = Σ(Throughput × 8 hours × 5 days)
Coordination Overhead = Σ(Dependency Strength × 2 hours)

Service Efficiency = (Total Service Time / (Total Service Time + Overhead Time)) × 100%
Total Service Time = Σ(Throughput × 8 hours × 5 days)
Overhead Time = Σ(Dependency Strength × 4 hours × Number of Teams)`,
            explanation: 'Key metrics for measuring team efficiency, utilization, and service delivery.',
            variables: [
              { name: 'Process Time', description: 'Time spent on direct work' },
              { name: 'Wait Time', description: 'Delay from dependencies' },
              { name: 'Dependency Strength', description: 'Individual dependency values (0-5)' },
              { name: 'Team Size', description: 'Number of people per team' },
              { name: 'Throughput', description: 'Work items completed per week' }
            ],
            assumptions: [
              'Standard 40-hour work week',
              '8-hour workday, 5 days per week',
              'Dependencies affect wait time linearly',
              'Overhead scales with dependency strength'
            ]
          }
        ];
      }
    } else {
      if (mode === 'base') {
        return [
          {
            title: 'Ticket Processing Cost',
            formula: `Monthly Processing Cost = Monthly Tickets × Hours per Ticket × People per Ticket × Hourly Rate
Cost per Ticket = Hours per Ticket × People per Ticket × Hourly Rate
Total Monthly Hours = Monthly Tickets × Hours per Ticket × People per Ticket`,
            explanation: 'Calculates the base cost of processing tickets based on volume and resource requirements.',
            variables: [
              { name: 'Monthly Tickets', description: 'Number of tickets processed per month' },
              { name: 'Hours per Ticket', description: 'Average processing time per ticket' },
              { name: 'People per Ticket', description: 'Average number of people involved per ticket' },
              { name: 'Hourly Rate', description: 'Average cost per person per hour' }
            ],
            assumptions: [
              'Consistent ticket complexity',
              'Linear scaling of processing time',
              'Available resource capacity'
            ]
          },
          {
            title: 'SLA Impact Analysis',
            formula: `SLA Compliance Cost = (1 - SLA Compliance %) × Monthly Tickets × Penalty Rate
Effective Processing Time = Base Processing Time × (1 + (1 - SLA Compliance %))
Quality Impact = (100% - SLA Compliance %) × Quality Cost Factor`,
            explanation: 'Evaluates the cost impact of SLA compliance levels.',
            variables: [
              { name: 'SLA Compliance %', description: 'Percentage of tickets meeting SLA' },
              { name: 'Penalty Rate', description: 'Cost of SLA breach per ticket' },
              { name: 'Quality Cost Factor', description: 'Cost multiplier for quality issues' }
            ],
            assumptions: [
              'SLA breaches have measurable cost impact',
              'Linear relationship between compliance and cost',
              'Quality issues correlate with SLA compliance'
            ]
          },
          {
            title: 'Resource Utilization',
            formula: `Required FTE = (Monthly Tickets × Hours per Ticket × People per Ticket) / Available Hours per FTE
Utilization Rate = (Total Processing Hours / Available Team Hours) × 100%
Overhead Time = Total Hours × (1 - Service Efficiency)`,
            explanation: 'Analyzes resource requirements and utilization.',
            variables: [
              { name: 'Available Hours per FTE', description: 'Monthly working hours per full-time employee' },
              { name: 'Service Efficiency', description: 'Percentage of time spent on direct work' },
              { name: 'Total Hours', description: 'Total hours worked by the team' }
            ],
            assumptions: [
              'Standard working hours per FTE',
              'Consistent resource availability',
              'Measurable service efficiency'
            ]
          }
        ];
      } else if (mode === 'solutions') {
        return [
          {
            title: 'Automation Impact',
            formula: `Automated Processing Cost = Monthly Tickets × Automation Rate × Cost per Automated Ticket
Manual Processing Cost = Monthly Tickets × (1 - Automation Rate) × Cost per Manual Ticket
Total Cost = Automated Processing Cost + Manual Processing Cost + Platform Cost`,
            explanation: 'Calculates the cost impact of automation solutions.',
            variables: [
              { name: 'Automation Rate', description: 'Percentage of tickets that can be automated' },
              { name: 'Cost per Automated Ticket', description: 'Processing cost for automated tickets' },
              { name: 'Cost per Manual Ticket', description: 'Processing cost for manual tickets' },
              { name: 'Platform Cost', description: 'Monthly cost of automation platform' }
            ],
            assumptions: [
              'Clear distinction between automatable and manual tickets',
              'Stable automation success rate',
              'Predictable platform costs'
            ]
          },
          {
            title: 'ROI Calculation',
            formula: `Monthly Savings = Current Processing Cost - (Automated Cost + Manual Cost)
Annual ROI = ((Monthly Savings × 12) - Implementation Cost) / Implementation Cost × 100%
Payback Period = Implementation Cost / Monthly Savings`,
            explanation: 'Evaluates the return on investment for automation solutions.',
            variables: [
              { name: 'Current Processing Cost', description: 'Current monthly cost without automation' },
              { name: 'Implementation Cost', description: 'One-time cost to implement automation' },
              { name: 'Monthly Savings', description: 'Reduction in monthly processing costs' }
            ],
            assumptions: [
              'Savings remain consistent post-implementation',
              'Implementation costs are one-time',
              'Linear cost reduction with automation'
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