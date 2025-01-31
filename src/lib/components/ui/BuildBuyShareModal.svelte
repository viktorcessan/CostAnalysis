<!-- Build Buy Share Modal -->
<script lang="ts">
  import { base } from '$app/paths';
  import { generateShareLink } from '$lib/utils/shareLink';
  import { fade } from 'svelte/transition';
  import { clickOutside } from '$lib/actions/clickOutside';

  export let show = false;
  let shareUrl = '';
  let copied = false;
  let loading = false;

  $: if (show) {
    generateLink();
  }

  async function generateLink() {
    loading = true;
    try {
      // Generate a unique share link - implementation will depend on your data structure
      shareUrl = await generateShareLink({
        type: 'build-buy',
        // Add your build/buy analysis data here
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      shareUrl = '';
    } finally {
      loading = false;
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  function handleClose() {
    show = false;
    copied = false;
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" transition:fade>
    <div
      class="bg-white rounded-xl max-w-lg w-full"
      use:clickOutside
      on:click_outside={handleClose}
    >
      <div class="p-6">
        <div class="flex justify-between items-start mb-6">
          <h3 class="text-xl font-semibold text-gray-900">Share Analysis</h3>
          <button
            class="text-gray-400 hover:text-gray-500"
            on:click={handleClose}
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            Share your build vs buy analysis with others. They'll be able to view your analysis and all the calculations.
          </p>

          {#if loading}
            <div class="flex items-center justify-center py-4">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
            </div>
          {:else if shareUrl}
            <div class="relative">
              <input
                type="text"
                readonly
                value={shareUrl}
                class="w-full pr-24 rounded-lg border-gray-200 focus:border-secondary focus:ring-secondary"
              />
              <button
                class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm font-medium {copied ? 'text-green-600 bg-green-50' : 'text-secondary bg-secondary/10'} rounded-md transition-colors"
                on:click={copyToClipboard}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          {:else}
            <div class="text-center py-4 text-sm text-red-600">
              Failed to generate share link. Please try again.
            </div>
          {/if}

          <div class="mt-6 flex justify-end">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              on:click={handleClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if} 