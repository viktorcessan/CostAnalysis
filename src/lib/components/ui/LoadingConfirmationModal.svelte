<script lang="ts">
  import { fade } from 'svelte/transition';
  import { formatShareParams } from '$lib/utils/shareLink';
  import type { TargetPlanningParams } from '$lib/utils/shareLink';

  export let show = false;
  export let params: TargetPlanningParams;
  export let onConfirm: () => void;
  export let onCancel: () => void;
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    transition:fade={{ duration: 200 }}
    on:click={onCancel}
  >
    <div
      class="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-gray-100"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="px-8 py-5 border-b border-gray-100">
        <h3 class="text-xl font-semibold text-gray-800">Load Shared Analysis</h3>
      </div>
      
      <!-- Content -->
      <div class="px-8 py-6 space-y-6">
        <p class="text-sm text-gray-600">
          You're loading a shared analysis with the following configuration:
        </p>
        
        <!-- Parameters Summary -->
        <div class="bg-gray-50/50 backdrop-blur-sm rounded-xl p-5 border border-gray-100 space-y-2">
          {#each formatShareParams(params) as param}
            <div class="text-sm text-gray-600 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-secondary/30"></div>
              {param}
            </div>
          {/each}
        </div>
        
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

<style>
  /* Add any additional styles here */
</style> 