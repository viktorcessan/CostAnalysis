<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { TeamDependencyParams } from '$lib/utils/teamDependencyShare';

  export let show = false;
  export let params: TeamDependencyParams | null = null;
  export let onConfirm: () => void;
  export let onCancel: () => void;

  function formatRecurrence(recurrence: string): string {
    switch (recurrence) {
      case 'twice-weekly': return 'twice per week';
      case 'weekly': return 'weekly';
      case 'biweekly': return 'every two weeks';
      case 'monthly': return 'monthly';
      default: return recurrence;
    }
  }

  $: isValid = params && params.teams && params.dependencyMatrix && params.costParams;
</script>

{#if show && isValid}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    transition:fade={{ duration: 200 }}
    on:click={onCancel}
  >
    <div
      class="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden border border-gray-100"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="px-8 py-5 border-b border-gray-100">
        <h3 class="text-xl font-semibold text-gray-800">Load Team Analysis</h3>
      </div>
      
      <!-- Content -->
      <div class="px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
        <p class="text-sm text-gray-600">
          You're loading a shared analysis with the following configuration:
        </p>
        
        <!-- Basic Configuration -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-gray-700">Basic Configuration</h4>
          <div class="bg-gray-50/50 rounded-xl p-4 space-y-2">
            <div class="text-sm text-gray-600">
              • Distribution Mode: {params.distributionMode === 'hub-spoke' ? 'Hub and Spoke' : 'Even Distribution'}
            </div>
            <div class="text-sm text-gray-600">
              • Number of Teams: {params.teamCount}
            </div>
            <div class="text-sm text-gray-600">
              • Company Dependency Level: {params.companyDependencyLevel}
            </div>
          </div>
        </div>

        <!-- Teams -->
        {#if params.teams?.length > 0}
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-gray-700">Teams</h4>
            <div class="bg-gray-50/50 rounded-xl p-4 space-y-2">
              {#each params.teams as team}
                <div class="text-sm text-gray-600">
                  • {team.name} (Size: {team.size}, Base Capacity: {team.baseCapacity})
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Cost Parameters -->
        {#if params.costParams?.hourlyRate}
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-gray-700">Cost Parameters</h4>
            <div class="bg-gray-50/50 rounded-xl p-4 space-y-2">
              <div class="text-sm text-gray-600">
                • Developer Rate: ${params.costParams.hourlyRate.developer}/hr
              </div>
              <div class="text-sm text-gray-600">
                • Manager Rate: ${params.costParams.hourlyRate.manager}/hr
              </div>
              <div class="text-sm text-gray-600">
                • Team Lead Rate: ${params.costParams.hourlyRate.teamLead}/hr
              </div>
            </div>
          </div>
        {/if}

        <!-- Meeting Settings -->
        {#if params.costParams?.meetings}
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-gray-700">Meeting Settings</h4>
            <div class="bg-gray-50/50 rounded-xl p-4 space-y-2">
              <div class="text-sm text-gray-600">
                • Duration: {params.costParams.meetings.duration}hr
              </div>
              <div class="text-sm text-gray-600">
                • Frequency: {formatRecurrence(params.costParams.meetings.recurrence)}
              </div>
              <div class="text-sm text-gray-600">
                • Attendees per Team: {params.costParams.meetings.attendeesPerTeam}
              </div>
              <div class="text-sm text-gray-600">
                • Communication Overhead: {(params.costParams.meetings.communicationOverhead * 100).toFixed(0)}%
              </div>
              <div class="text-sm text-gray-600">
                • Additional Hours: {params.costParams.meetings.additionalHours}
              </div>
            </div>
          </div>
        {/if}

        <!-- Overhead Settings -->
        {#if params.costParams?.overhead}
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-gray-700">Overhead Settings</h4>
            <div class="bg-gray-50/50 rounded-xl p-4 space-y-2">
              <div class="text-sm text-gray-600">
                • Communication Overhead: {(params.costParams.overhead.communicationOverhead * 100).toFixed(0)}%
              </div>
              <div class="text-sm text-gray-600">
                • Wait Time Multiplier: {(params.costParams.overhead.waitTimeMultiplier * 100).toFixed(0)}%
              </div>
              <div class="text-sm text-gray-600">
                • Baseline Communication: {params.costParams.overhead.baselineCommunicationHours} hrs/month
              </div>
              <div class="text-sm text-gray-600">
                • Dependency Hours Rate: {params.costParams.overhead.dependencyHoursRate} hrs/dependency
              </div>
            </div>
          </div>
        {/if}

        <p class="text-sm text-gray-600">
          Loading this configuration will replace your current analysis settings.
          Do you want to proceed?
        </p>
      </div>
      
      <!-- Footer -->
      <div class="px-8 py-5 bg-gray-50/50 backdrop-blur-sm flex justify-end gap-3 border-t border-gray-100">
        <button
          class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 transition-all shadow-sm hover:shadow-md active:shadow-sm"
          on:click={onCancel}
        >
          Cancel
        </button>
        <button
          class="px-5 py-2.5 text-sm font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 transition-all shadow-sm hover:shadow-md active:shadow-sm"
          on:click={onConfirm}
        >
          Load Analysis
        </button>
      </div>
    </div>
  </div>
{/if} 