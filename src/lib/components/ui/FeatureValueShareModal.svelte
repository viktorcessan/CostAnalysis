<!-- FeatureValueShareModal.svelte -->
<script lang="ts">
  import { generateShareLink } from '$lib/utils/featureValueShare';
  import type { FeatureValueResults } from '$lib/stores/featureValueTemplateStore';
  import { clickOutside } from '$lib/actions/clickOutside';
  import { fade } from 'svelte/transition';
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import { page } from '$app/stores';

  export let show = false;
  export let results: FeatureValueResults | null = null;

  let copied = false;
  let shareLink = '';

  $: if (show && browser && results) {
    const queryString = generateShareLink(results);
    const origin = $page.url.origin;
    const path = `${base}/calculator/feature_calculator`;
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
      use:clickOutside={{ enabled: show, callback: handleClose }}
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="px-8 py-5 border-b border-gray-100">
        <h3 class="text-xl font-semibold text-gray-800">Share Analysis</h3>
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
          
          <!-- Project Info -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-2">Project Information</div>
            <div class="text-sm text-gray-600 capitalize flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-secondary/30"></div>
              {results.projectName}
            </div>
          </div>
          
          <!-- Value Components -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-3">Value Components</div>
            <div class="grid grid-cols-1 gap-3">
              {#each results.selectedImpacts as impact}
                <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                  <div>
                    <span class="text-sm font-medium text-gray-700">{impact.impact.name}</span>
                    <div class="text-xs text-gray-500 mt-1">{impact.impact.category}</div>
                  </div>
                  <span class="text-sm font-medium text-gray-900">{formatCurrency(impact.calculatedValue)}</span>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Development & Maintenance -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-3">Development & Maintenance</div>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Development Cost</span>
                <span class="text-sm font-medium text-gray-900">
                  {formatCurrency(results.developmentCost.hourlyRate * results.developmentCost.hours)}
                </span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Annual Maintenance</span>
                <span class="text-sm font-medium text-gray-900">
                  {formatCurrency(results.maintenanceCost.monthly * 12)}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Results -->
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100">
            <div class="text-sm font-medium text-gray-700 mb-3">Results</div>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Total Annual Value</span>
                <span class="text-sm font-medium text-gray-900">{formatCurrency(results.totalValue)}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Total Cost</span>
                <span class="text-sm font-medium text-gray-900">{formatCurrency(results.totalCost)}</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">ROI</span>
                <span class="text-sm font-medium text-gray-900">{formatValue(results.roi)}%</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Break-even Period</span>
                <span class="text-sm font-medium text-gray-900">{results.breakEvenMonths.toFixed(1)} months</span>
              </div>
              <div class="flex items-center justify-between py-2 px-3 bg-white/80 rounded-lg border border-gray-100">
                <span class="text-sm text-gray-600">Confidence Score</span>
                <span class="text-sm font-medium text-gray-900">{formatValue(results.confidenceScore)}%</span>
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