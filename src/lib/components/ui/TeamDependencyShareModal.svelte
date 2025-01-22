<!-- TeamDependencyShareModal.svelte -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { clickOutside } from '$lib/actions/clickOutside';
  import { generateShareLink } from '$lib/utils/teamDependencyShare';
  import type { Team, DependencyMatrix } from '$lib/types/teamDependency';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { base } from '$app/paths';

  export let show = false;
  export let distributionMode: 'even' | 'hub-spoke' | 'sequential' | 'mesh' | 'hierarchical' | 'clustered';
  export let teamCount: number;
  export let companyDependencyLevel: number;
  export let teams: Team[];
  export let dependencyMatrix: DependencyMatrix;
  export let costParams = {
    hourlyRate: {
      developer: 75,
      manager: 100,
      teamLead: 125
    },
    meetings: {
      duration: 1,
      recurrence: 'weekly',
      attendeesPerTeam: 5,
      communicationOverhead: 1.2,
      additionalHours: 0
    },
    overhead: {
      communicationOverhead: 1.2,
      waitTimeMultiplier: 0.5,
      baselineCommunicationHours: 10,
      dependencyHoursRate: 4
    }
  };

  let copied = false;
  let shareLink = '';

  $: if (show && browser) {
    const params = {
      distributionMode,
      teamCount,
      companyDependencyLevel,
      teams: teams.slice(0, teamCount),
      dependencyMatrix: {
        teams: dependencyMatrix.teams.slice(0, teamCount),
        dependencies: dependencyMatrix.dependencies.slice(0, teamCount).map(row => row.slice(0, teamCount))
      },
      costParams
    };
    const queryString = generateShareLink(params);
    const origin = $page.url.origin;
    const path = `${base}/calculator/team-dependency`;
    shareLink = `${origin}${path}?${queryString}`;
  }

  function handleClose() {
    show = false;
    copied = false;
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareLink);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  function formatValue(value: number): string {
    if (value >= 1) return value.toString();
    return (value * 100).toFixed(1) + '%';
  }
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100"
      use:clickOutside
      on:click_outside={handleClose}
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="px-8 py-5 border-b border-gray-100">
        <h3 class="text-xl font-semibold text-gray-800">Share Team Dependency Analysis</h3>
      </div>
      
      <!-- Content -->
      <div class="px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
        <!-- Share Link -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-gray-600">Share Link</label>
          <div class="flex gap-2">
            <input
              type="text"
              readonly
              value={shareLink}
              class="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all"
            />
            <button
              class="px-5 py-2.5 text-sm font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:shadow-sm"
              on:click={copyToClipboard}
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
        
        <!-- Configuration Summary -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-600">Configuration Summary</h4>
          
          <!-- Basic Parameters -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-3">Basic Parameters</div>
            <div class="grid grid-cols-2 gap-3">
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
                <span class="text-sm text-gray-600">Manager Rate ($/hr)</span>
                <span class="text-sm font-medium text-gray-900">${costParams.hourlyRate.manager}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Team Lead Rate ($/hr)</span>
                <span class="text-sm font-medium text-gray-900">${costParams.hourlyRate.teamLead}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Meeting Duration (hr)</span>
                <span class="text-sm font-medium text-gray-900">{costParams.meetings.duration}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Meeting Frequency</span>
                <span class="text-sm font-medium text-gray-900">{costParams.meetings.recurrence}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Meeting Attendees</span>
                <span class="text-sm font-medium text-gray-900">{costParams.meetings.attendeesPerTeam}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Meeting Communication Overhead</span>
                <span class="text-sm font-medium text-gray-900">{formatValue(costParams.meetings.communicationOverhead)}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Additional Hours</span>
                <span class="text-sm font-medium text-gray-900">{costParams.meetings.additionalHours}</span>
              </div>
              <div class="col-span-2 flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Wait Time Multiplier</span>
                <span class="text-sm font-medium text-gray-900">{formatValue(costParams.overhead.waitTimeMultiplier)}</span>
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
        </div>
      </div>
      
      <!-- Footer -->
      <div class="px-8 py-5 bg-gray-50/50 backdrop-blur-sm flex justify-end border-t border-gray-100">
        <button
          class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 transition-all shadow-sm hover:shadow-md active:shadow-sm"
          on:click={handleClose}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if} 