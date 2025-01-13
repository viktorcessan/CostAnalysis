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
    monthlyMeetingCost: number;
    communicationCost: number;
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
                  <div class="text-sm font-medium text-gray-600">Monthly Meetings</div>
                  <div class="text-xl font-bold text-sky-500 mt-1">
                    ${costs.monthlyMeetingCost.toFixed(0)}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    Based on {costParams.meetings.duration}hr meetings {getRecurrenceText(costParams.meetings.recurrence)} × {costParams.meetings.attendeesPerTeam} attendees × ${costParams.hourlyRate.developer}/hr
                  </div>
                </div>
  
                <div class="bg-gradient-to-br from-amber-50 to-white p-4 rounded-lg border border-amber-200">
                  <div class="text-sm font-medium text-gray-600">Communication</div>
                  <div class="text-xl font-bold text-amber-500 mt-1">
                    ${costs.communicationCost.toFixed(0)}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    Includes {costParams.meetings.communicationOverhead}x overhead and additional communication
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
                      <h6 class="text-sm font-medium text-gray-900">Synchronous Coordination</h6>
                      <p class="text-sm text-gray-600 mt-1">
                        {#if (costs.monthlyMeetingCost / costs.totalCost) > 0.6}
                          High meeting costs indicate significant time spent in synchronous coordination. Consider reducing meeting frequency or attendee count.
                        {:else if (costs.monthlyMeetingCost / costs.totalCost) > 0.4}
                          Moderate meeting overhead. Review meeting structures for potential optimization.
                        {:else}
                          Efficient meeting structure with balanced synchronous coordination.
                        {/if}
                      </p>
                    </div>
                  </div>
  
                  <!-- Communication Costs Insight -->
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h6 class="text-sm font-medium text-gray-900">Asynchronous Communication</h6>
                      <p class="text-sm text-gray-600 mt-1">
                        {#if (costs.communicationCost / costs.totalCost) > 0.6}
                          High communication overhead suggests complex dependencies. Consider streamlining team interfaces and documentation.
                        {:else if (costs.communicationCost / costs.totalCost) > 0.4}
                          Moderate communication costs. Look for opportunities to improve async communication channels.
                        {:else}
                          Well-managed async communication with effective coordination patterns.
                        {/if}
                      </p>
                    </div>
                  </div>
  
                  <!-- Overall Efficiency -->
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h6 class="text-sm font-medium text-gray-900">Cost Efficiency</h6>
                      <p class="text-sm text-gray-600 mt-1">
                        {#if costs.totalCost > (teamCount * teamParams.teams[0].size * costParams.hourlyRate.developer * 40)}
                          Total coordination costs are high relative to team size. Consider reviewing team structure and dependency patterns.
                        {:else if costs.totalCost > (teamCount * teamParams.teams[0].size * costParams.hourlyRate.developer * 20)}
                          Moderate overall costs. Monitor trends and optimize where possible.
                        {:else}
                          Cost-efficient team structure with well-managed coordination overhead.
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