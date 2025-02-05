<!-- Build Buy Share Modal -->
<script lang="ts">
  import { generateShareLink } from '$lib/utils/buildBuyShare';
  import type { BuildBuyResults } from '$lib/types/calculator';
  import { clickOutside } from '$lib/actions/clickOutside';
  import { fade } from 'svelte/transition';
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import { page } from '$app/stores';

  export let show = false;
  export let results: BuildBuyResults | null = null;

  let copied = false;
  let shareLink = '';

  $: if (show && browser && results) {
    const queryString = generateShareLink(results);
    const origin = $page.url.origin;
    const path = `${base}/calculator/build_buy`;
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

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  function getTimelineLabel(index: number): string {
    if (index <= 1) return 'Urgent/Immediate (0-3 months)';
    if (index <= 2) return 'Short term (3-6 months)';
    if (index <= 3) return 'Medium term (6-12 months)';
    return 'Long term (12-24 months)';
  }

  function getUsageDurationLabel(index: number): string {
    if (index <= 1) return 'Short term (Less than 1 year)';
    if (index <= 2) return 'Medium term (1-3 years)';
    if (index <= 3) return 'Extended use (3-5 years)';
    return 'Long term investment (More than 5 years)';
  }
</script>

{#if show && results}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100"
      use:clickOutside={{ enabled: show, callback: handleClose }}
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="px-8 py-5 border-b border-gray-100">
        <h3 class="text-xl font-semibold text-gray-800">Share Configuration</h3>
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
          
          <!-- Basic Info -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-2">Basic Information</div>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Solution Type</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.solutionType}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Business Role</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.businessRole}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Timeline</span>
                <span class="text-sm font-medium text-gray-900">{getTimelineLabel(results.formState.timelineIndex)}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Usage Duration</span>
                <span class="text-sm font-medium text-gray-900">{getUsageDurationLabel(results.formState.usageDurationIndex)}</span>
              </div>
            </div>
          </div>
          
          <!-- Market Analysis -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-2">Market Analysis</div>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Alternative Solutions</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.alternativeSolutions}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Market Evolution</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.marketEvolution}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Landscape Evolution</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.landscapeEvolution}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Market Standardization</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.marketStandardization}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Solution Fit</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.alternativeFitness}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Alternative Types</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.alternativeTypes.join(', ')}</span>
              </div>
            </div>
          </div>
          
          <!-- Build Capability -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-2">Build Capability</div>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Control Needed</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.controlNeeded}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">In-House Competency</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.inHouseCompetency}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Capability Build Time</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.competencyAcquisitionTime}</span>
              </div>
            </div>
          </div>
          
          <!-- Cost Analysis -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-2">Cost Analysis</div>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Build Team Size (FTEs)</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.buildFTEs}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Build Hourly Rate</span>
                <span class="text-sm font-medium text-gray-900">{formatCurrency(results.formState.buildHourlyRate)}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Build Cost</span>
                <span class="text-sm font-medium text-gray-900">{formatCurrency(results.formState.buildCost)}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Buy Cost</span>
                <span class="text-sm font-medium text-gray-900">{formatCurrency(results.formState.buyCost)}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">User Count</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.userCount}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Cost Per User</span>
                <span class="text-sm font-medium text-gray-900">{formatCurrency(results.formState.costPerUser)}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Buy Customization Cost</span>
                <span class="text-sm font-medium text-gray-900">{formatCurrency(results.formState.buyCustomizationCost)}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Buy Maintenance Cost</span>
                <span class="text-sm font-medium text-gray-900">{formatCurrency(results.formState.buyMaintenanceCost)}</span>
              </div>
            </div>
          </div>

          <!-- Maintenance Team -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-2">Maintenance Team</div>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Dedicated Team</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.hasMaintenanceTeam ? 'Yes' : 'No'}</span>
              </div>
              {#if results.formState.hasMaintenanceTeam}
                <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">Team Size (FTEs)</span>
                  <span class="text-sm font-medium text-gray-900">{results.formState.maintenanceTeamSize}</span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Strategic Assessment -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-2">Strategic Assessment</div>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Strategic Alignment</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.strategicAlignment}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Change Difficulty</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.changeDifficulty}</span>
              </div>
            </div>
          </div>

          <!-- Category Weights -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-2">Category Weights</div>
            <div class="grid grid-cols-1 gap-3">
              {#each Object.entries(results.formState.categoryWeights) as [category, weight]}
                <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <span class="text-sm text-gray-600">{category}</span>
                  <span class="text-sm font-medium text-gray-900">{weight}</span>
                </div>
              {/each}
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