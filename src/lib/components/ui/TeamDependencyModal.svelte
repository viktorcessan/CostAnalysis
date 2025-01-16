<!-- Team Dependency Modal -->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { clickOutside } from '$lib/actions/clickOutside';

  export let show = false;
  export let template = '';

  let copied = false;

  function copyToClipboard() {
    navigator.clipboard.writeText(template);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  function openChatGPT() {
    window.open('https://chat.openai.com', '_blank');
  }

  function handleModalClick(event: MouseEvent) {
    event.stopPropagation();
  }

  function handleClose() {
    show = false;
  }
</script>

{#if show}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" 
    transition:fade={{ duration: 200 }}
    on:click={handleClose}
  >
    <!-- Modal -->
    <div
      class="fixed inset-4 sm:inset-8 md:inset-16 lg:inset-32 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
      transition:fly={{ y: 20, duration: 200 }}
      use:clickOutside={{ enabled: show, callback: handleClose }}
      on:click={handleModalClick}
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Team Dependency Analysis</h2>
          <p class="text-sm text-gray-500 mt-1">Copy this template to ChatGPT for detailed analysis</p>
        </div>
        <button
          on:click={handleClose}
          class="text-gray-400 hover:text-gray-500 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto p-6">
        <div class="bg-gray-50 rounded-lg border border-gray-200">
          <pre class="whitespace-pre-wrap text-sm text-gray-600 font-mono p-4 overflow-x-auto">{template}</pre>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="text-sm text-gray-500 text-center sm:text-left">
          Use this template to get detailed insights about your analysis
        </div>
        <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            on:click={copyToClipboard}
            class="w-full sm:w-auto px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-secondary/50"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            {copied ? 'Copied!' : 'Copy Template'}
          </button>
          <button
            on:click={openChatGPT}
            class="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open ChatGPT
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  pre {
    max-height: calc(100vh - 300px);
    scrollbar-width: thin;
    scrollbar-color: theme('colors.gray.400') theme('colors.gray.100');
  }
  
  pre::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  pre::-webkit-scrollbar-track {
    background: theme('colors.gray.100');
    border-radius: 4px;
  }
  
  pre::-webkit-scrollbar-thumb {
    background: theme('colors.gray.400');
    border-radius: 4px;
  }
  
  pre::-webkit-scrollbar-thumb:hover {
    background: theme('colors.gray.500');
  }
</style> 