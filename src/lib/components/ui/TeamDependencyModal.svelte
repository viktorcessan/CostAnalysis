<!-- Team Dependency Modal -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { clickOutside } from '$lib/actions/clickOutside';
  import ExpertModal from './ExpertModal.svelte';

  export let show = false;
  export let template = '';

  let copied = false;
  let showExpertModal = false;

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

  function openExpertModal() {
    showExpertModal = true;
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black/50 z-50" transition:fade>
    <div
      class="fixed inset-4 md:inset-10 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
      use:clickOutside
      on:click_outside={() => show = false}
    >
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 class="text-lg font-semibold text-gray-900">Team Dependency Analysis</h2>
        <button
          on:click={() => show = false}
          class="text-gray-400 hover:text-gray-500"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto p-4">
        <pre class="whitespace-pre-wrap text-sm text-gray-600 font-mono bg-gray-50 p-4 rounded-lg">{template}</pre>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div class="text-sm text-gray-500">
          Copy this template and paste it into ChatGPT for analysis
        </div>
        <div class="flex gap-2">
          <button
            on:click={copyToClipboard}
            class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors duration-200 flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            {copied ? 'Copied!' : 'Copy Template'}
          </button>
          <button
            on:click={openChatGPT}
            class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open ChatGPT
          </button>
          <button
            on:click={openExpertModal}
            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Schedule Expert Call
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<ExpertModal bind:show={showExpertModal} />

<style>
  pre {
    max-height: calc(100vh - 200px);
  }
</style> 