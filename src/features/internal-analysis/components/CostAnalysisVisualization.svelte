<script lang="ts">
  import type { Node } from '$lib/types/teamDependency';

  export let nodes: Node[];
  export let teamCount: number;
  export let teamParams: {
    teams: Array<{
      size: number;
    }>;
  };
  export let costParams: {
    hourlyRate: {
      developer: number;
    };
    meetings: {
      duration: number;        // hours per meeting
      recurrence: string;      // 'twice-weekly' | 'weekly' | 'biweekly' | 'monthly'
      attendeesPerTeam: number;
      communicationOverhead: number;
      additionalHours: number;
    };
  };
  export let calculateCosts: () => {
    directMeetingCost: number;
    communicationOverhead: number;
    opportunityCost: number;
    flowEfficiencyCost: number;
    totalCost: number;
  };
  export let costChartCanvas: HTMLCanvasElement;

  // Helper function to get monthly meeting multiplier
  function getMonthlyMeetingMultiplier(recurrence: string): number {
    switch (recurrence) {
      case 'twice-weekly': return 8;
      case 'weekly': return 4;
      case 'biweekly': return 2;
      case 'monthly': return 1;
      default: return 4;
    }
  }

  // Helper function to get recurrence text
  function getRecurrenceText(recurrence: string): string {
    switch (recurrence) {
      case 'twice-weekly': return 'twice per week';
      case 'weekly': return 'weekly';
      case 'biweekly': return 'every two weeks';
      case 'monthly': return 'monthly';
      default: return 'weekly';
    }
  }
</script>

    <!-- Cost Analysis of Current Dependencies -->
    <div class="cost-analysis-section bg-white p-6 rounded-lg shadow border border-gray-200">
        {#if nodes.length > 0}
          {@const costs = calculateCosts()}
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 class="text-lg font-semibold text-gray-900">Cost Analysis of Current Team Dependencies</h3>
            <div class="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-2 px-4 py-2 bg-secondary/5 rounded-lg border border-secondary/20">
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-600 whitespace-nowrap">Total Monthly Cost:</span>
                <span class="text-xl font-bold text-secondary whitespace-nowrap">${costs.totalCost.toFixed(0)}</span>
              </div>
              <span class="text-xs text-gray-500 whitespace-normal sm:whitespace-nowrap">(${(costs.totalCost / (teamCount * teamParams.teams[0].size)).toFixed(0)} per team member)</span>
            </div>
          </div>
  
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Cost Distribution Chart -->
            <div class="bg-white p-6 rounded-lg border border-gray-200">
              <h4 class="text-sm font-medium text-gray-700 mb-4">Cost Distribution</h4>
              <div class="relative h-[400px] w-full">
                <canvas
                  bind:this={costChartCanvas}
                  class="w-full h-full"
                ></canvas>
              </div>
            </div>
  
            <!-- Cost Impact Analysis -->
            <div class="space-y-6">
              <!-- Monthly Cost Summary -->
              {#if costs}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="bg-gradient-to-br from-sky-50 to-white p-4 rounded-lg border border-sky-200">
                  <div class="text-sm font-medium text-gray-600">Direct Meeting Costs</div>
                  <div class="text-xl font-bold text-sky-500 mt-1">
                    ${costs.directMeetingCost.toFixed(0)}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    Based on {costParams.meetings.duration}hr meetings {getRecurrenceText(costParams.meetings.recurrence)} × {costParams.meetings.attendeesPerTeam} attendees × ${costParams.hourlyRate.developer}/hr
                  </div>
                </div>

                <div class="bg-gradient-to-br from-amber-50 to-white p-4 rounded-lg border border-amber-200">
                  <div class="text-sm font-medium text-gray-600">Communication Overhead</div>
                  <div class="text-xl font-bold text-amber-500 mt-1">
                    ${costs.communicationOverhead.toFixed(0)}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    Async coordination and additional communication costs
                  </div>
                </div>

                <div class="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-lg border border-emerald-200">
                  <div class="text-sm font-medium text-gray-600">Opportunity Cost</div>
                  <div class="text-xl font-bold text-emerald-500 mt-1">
                    ${costs.opportunityCost.toFixed(0)}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    Lost productivity from context switching and coordination
                  </div>
                </div>

                <div class="bg-gradient-to-br from-rose-50 to-white p-4 rounded-lg border border-rose-200">
                  <div class="text-sm font-medium text-gray-600">Flow Efficiency Impact</div>
                  <div class="text-xl font-bold text-rose-500 mt-1">
                    ${costs.flowEfficiencyCost.toFixed(0)}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    Cost of delays and waiting time from dependencies
                  </div>
                </div>
              </div>

              <!-- Cost Insights -->
              <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h5 class="text-sm font-medium text-gray-900 mb-3">Cost Distribution Insights</h5>
                <div class="space-y-4">
                  <!-- Meeting Costs Insight -->
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                      <svg class="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h6 class="text-sm font-medium text-gray-900">Direct Coordination</h6>
                      <p class="text-sm text-gray-600 mt-1">
                        {#if (costs.directMeetingCost / costs.totalCost) > 0.4}
                          High direct meeting costs indicate significant time in synchronous coordination. Consider reducing meeting frequency or attendee count.
                        {:else if (costs.directMeetingCost / costs.totalCost) > 0.25}
                          Moderate meeting overhead. Review meeting structures for potential optimization.
                        {:else}
                          Efficient meeting structure with balanced synchronous coordination.
                        {/if}
                      </p>
                    </div>
                  </div>

                  <!-- Communication Overhead Insight -->
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h6 class="text-sm font-medium text-gray-900">Communication Overhead</h6>
                      <p class="text-sm text-gray-600 mt-1">
                        {#if (costs.communicationOverhead / costs.totalCost) > 0.35}
                          High communication overhead suggests complex coordination patterns. Consider streamlining team interfaces.
                        {:else if (costs.communicationOverhead / costs.totalCost) > 0.25}
                          Moderate communication costs. Look for opportunities to improve async communication.
                        {:else}
                          Well-managed communication overhead with effective coordination patterns.
                        {/if}
                      </p>
                    </div>
                  </div>

                  <!-- Opportunity Cost Insight -->
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h6 class="text-sm font-medium text-gray-900">Lost Productivity</h6>
                      <p class="text-sm text-gray-600 mt-1">
                        {#if (costs.opportunityCost / costs.totalCost) > 0.3}
                          Significant productivity loss from context switching. Consider reducing cross-team dependencies.
                        {:else if (costs.opportunityCost / costs.totalCost) > 0.2}
                          Moderate productivity impact. Review team boundaries and responsibilities.
                        {:else}
                          Good productivity maintenance with minimal context switching overhead.
                        {/if}
                      </p>
                    </div>
                  </div>

                  <!-- Flow Efficiency Impact -->
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                      <svg class="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h6 class="text-sm font-medium text-gray-900">Flow Efficiency</h6>
                      <p class="text-sm text-gray-600 mt-1">
                        {#if (costs.flowEfficiencyCost / costs.totalCost) > 0.3}
                          High dependency-related delays affecting flow efficiency. Focus on reducing wait times and dependencies.
                        {:else if (costs.flowEfficiencyCost / costs.totalCost) > 0.2}
                          Moderate flow efficiency impact. Look for opportunities to optimize handoffs.
                        {:else}
                          Good flow efficiency with well-managed dependencies and minimal waiting time.
                        {/if}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>