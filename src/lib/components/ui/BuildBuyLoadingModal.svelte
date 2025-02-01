<!-- BuildBuyLoadingModal.svelte -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { clickOutside } from '$lib/actions/clickOutside';
  import type { BuildBuyResults } from '$lib/types/calculator';

  export let show = false;
  export let results: BuildBuyResults | null = null;
  export let onConfirm: (goToResults: boolean) => void;
  export let onCancel: () => void;

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
</script>

{#if show && results}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100"
      use:clickOutside={{ enabled: show, callback: onCancel }}
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="px-8 py-5 border-b border-gray-100">
        <h3 class="text-xl font-semibold text-gray-800">Load Shared Configuration</h3>
        <p class="mt-2 text-sm text-gray-600">
          Review the shared configuration before loading it. This will replace your current configuration.
        </p>
      </div>
      
      <!-- Content -->
      <div class="px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
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
                <span class="text-sm font-medium text-gray-900">{results.formState.timelineNeeded}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Usage Duration</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.usageDuration}</span>
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
                <span class="text-sm text-gray-600">Market Standardization</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.marketStandardization}</span>
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
          
          <!-- Risk Assessment -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-2">Risk Assessment</div>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Build Risks</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.buildRisks.join(', ')}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Buy Risks</span>
                <span class="text-sm font-medium text-gray-900">{results.formState.buyRisks.join(', ')}</span>
              </div>
            </div>
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
          class="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm hover:shadow-md active:shadow-sm"
          on:click={() => onConfirm(false)}
        >
          Start from Beginning
        </button>
        <button
          class="px-5 py-2.5 text-sm font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 transition-all shadow-sm hover:shadow-md active:shadow-sm"
          on:click={() => onConfirm(true)}
        >
          Go to Results
        </button>
      </div>
    </div>
  </div>
{/if} 