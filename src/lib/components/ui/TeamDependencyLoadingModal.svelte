<script lang="ts">
  import { fade } from 'svelte/transition';
  import { clickOutside } from '$lib/actions/clickOutside';
  import type { Team, DependencyMatrix } from '$lib/types/teamDependency';

  export let show = false;
  export let distributionMode: 'even' | 'hub-spoke';
  export let teamCount: number;
  export let companyDependencyLevel: number;
  export let teams: Team[];
  export let dependencyMatrix: DependencyMatrix;
  export let costParams = {
    hourlyRate: {
      developer: 75
    },
    meetings: {
      monthlyDuration: 16,
      attendeesPerTeam: 5
    },
    overhead: {
      communicationOverhead: 1.2,
      baselineCommunicationHours: 10,
      dependencyHoursRate: 4
    }
  };
  export let onConfirm: () => void;
  export let onCancel: () => void;

  function formatValue(value: number): string {
    if (value >= 1) return value.toString();
    return (value * 100).toFixed(1) + '%';
  }

  function handleClickOutside() {
    onCancel();
  }
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100"
      use:clickOutside={{
        enabled: true,
        callback: handleClickOutside
      }}
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="px-8 py-5 border-b border-gray-100">
        <h3 class="text-xl font-semibold text-gray-800">Load Shared Configuration</h3>
        <p class="mt-2 text-sm text-gray-600">
          Review the shared team dependency configuration before loading it. This will replace your current configuration.
        </p>
      </div>
      
      <!-- Content -->
      <div class="px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
        <!-- Basic Parameters -->
        <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
          <div class="text-sm font-medium text-gray-700 mb-3">Basic Parameters</div>
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
              <span class="text-sm text-gray-600">Distribution Mode</span>
              <span class="text-sm font-medium text-gray-900">{distributionMode === 'even' ? 'Even Distribution' : 'Hub and Spoke'}</span>
            </div>
            <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
              <span class="text-sm text-gray-600">Number of Teams</span>
              <span class="text-sm font-medium text-gray-900">{teamCount}</span>
            </div>
            <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
              <span class="text-sm text-gray-600">Dependency Level</span>
              <span class="text-sm font-medium text-gray-900">{companyDependencyLevel}</span>
            </div>
            <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
              <span class="text-sm text-gray-600">Dev Rate ($/hr)</span>
              <span class="text-sm font-medium text-gray-900">${costParams.hourlyRate.developer}</span>
            </div>
            <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
              <span class="text-sm text-gray-600">Monthly Meeting Hours</span>
              <span class="text-sm font-medium text-gray-900">{costParams.meetings.monthlyDuration}</span>
            </div>
            <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
              <span class="text-sm text-gray-600">Meeting Attendees</span>
              <span class="text-sm font-medium text-gray-900">{costParams.meetings.attendeesPerTeam}</span>
            </div>
            <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
              <span class="text-sm text-gray-600">Communication Overhead</span>
              <span class="text-sm font-medium text-gray-900">{formatValue(costParams.overhead.communicationOverhead)}</span>
            </div>
            <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
              <span class="text-sm text-gray-600">Baseline Communication Hours</span>
              <span class="text-sm font-medium text-gray-900">{costParams.overhead.baselineCommunicationHours}</span>
            </div>
            <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
              <span class="text-sm text-gray-600">Dependency Hours Rate</span>
              <span class="text-sm font-medium text-gray-900">{costParams.overhead.dependencyHoursRate}</span>
            </div>
          </div>
        </div>

        <!-- Team Configuration -->
        <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
          <div class="text-sm font-medium text-gray-700 mb-3">Team Configuration</div>
          <div class="space-y-3">
            {#each teams as team, i}
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">{team.name}</span>
                <div class="flex items-center gap-4">
                  <span class="text-xs text-gray-500">Size: <span class="font-medium text-gray-900">{team.size}</span></span>
                  <span class="text-xs text-gray-500">Capacity: <span class="font-medium text-gray-900">{team.baseCapacity}</span></span>
                  <span class="text-xs text-gray-500">Efficiency: <span class="font-medium text-gray-900">{team.efficiency}x</span></span>
                </div>
              </div>
            {/each}
          </div>
        </div>
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
          Load Configuration
        </button>
      </div>
    </div>
  </div>
{/if} 