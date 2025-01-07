<script lang="ts">
  import { fade } from 'svelte/transition';
  import { generateShareLink, formatShareParams } from '$lib/utils/shareLink';
  import type { TargetPlanningParams } from '$lib/utils/shareLink';
  import { page } from '$app/stores';

  export let show = false;
  export let params: TargetPlanningParams;
  
  let copied = false;
  let shareLink = '';
  
  $: if (show) {
    const baseUrl = $page.url.origin + $page.url.pathname;
    const queryParams = generateShareLink(params);
    shareLink = `${baseUrl}?${queryParams}`;
  }
  
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareLink);
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
  
  function handleClose() {
    show = false;
    copied = false;
  }
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    transition:fade={{ duration: 200 }}
    on:click={handleClose}
  >
    <div
      class="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-gray-100"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="px-8 py-5 border-b border-gray-100">
        <h3 class="text-xl font-semibold text-gray-800">Share Analysis</h3>
      </div>
      
      <!-- Content -->
      <div class="px-8 py-6 space-y-6">
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
        
        <!-- Parameters Summary -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-600">Analysis Configuration</h4>
          <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 space-y-2 border border-gray-100">
            {#each formatShareParams(params) as param}
              <div class="text-sm text-gray-600 flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-secondary/30"></div>
                {param}
              </div>
            {/each}
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

<style>
  /* Add any additional styles here */
</style> 