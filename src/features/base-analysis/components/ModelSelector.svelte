<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CalculatorModel } from '$lib/types/calculator';

  export let activeModel: CalculatorModel | null = null;
  const dispatch = createEventDispatcher<{modelSelect: CalculatorModel}>();

  function selectModel(model: CalculatorModel) {
    dispatch('modelSelect', model);
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <!-- Team-Based Model -->
  <button
    class="relative p-6 bg-white rounded-xl border-2 transition-all duration-300 text-left {activeModel === 'team' ? 'border-secondary shadow-lg' : 'border-gray-200 hover:border-secondary/20 shadow-sm hover:shadow-md'}"
    on:click={() => selectModel('team')}
  >
    <div class="flex items-start gap-4">
      <div class="flex-shrink-0">
        <div class="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
          <svg class="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Team-Based Model</h3>
        <p class="text-sm text-gray-600 mb-4">
          Your service delivery is organized around dedicated teams that handle various types of work. 
          This model focuses on team capacity, utilization, and operational efficiency.
        </p>
        <div class="space-y-2">
          <div class="flex items-center text-sm text-gray-700">
            <svg class="w-4 h-4 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Fixed team size with defined roles
          </div>
          <div class="flex items-center text-sm text-gray-700">
            <svg class="w-4 h-4 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Focus on team utilization and efficiency
          </div>
          <div class="flex items-center text-sm text-gray-700">
            <svg class="w-4 h-4 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Stable resource allocation
          </div>
        </div>
      </div>
      {#if activeModel === 'team'}
        <div class="absolute top-4 right-4">
          <svg class="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      {/if}
    </div>
  </button>

  <!-- Ticket-Based Model -->
  <button
    class="relative p-6 bg-white rounded-xl border-2 transition-all duration-300 text-left {activeModel === 'ticket' ? 'border-secondary shadow-lg' : 'border-gray-200 hover:border-secondary/20 shadow-sm hover:shadow-md'}"
    on:click={() => selectModel('ticket')}
  >
    <div class="flex items-start gap-4">
      <div class="flex-shrink-0">
        <div class="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
          <svg class="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Ticket-Based Model</h3>
        <p class="text-sm text-gray-600 mb-4">
          Your service delivery is organized around individual tickets or work items. 
          This model focuses on throughput, processing time, and resource allocation per ticket.
        </p>
        <div class="space-y-2">
          <div class="flex items-center text-sm text-gray-700">
            <svg class="w-4 h-4 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Variable resource allocation
          </div>
          <div class="flex items-center text-sm text-gray-700">
            <svg class="w-4 h-4 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Focus on throughput and SLAs
          </div>
          <div class="flex items-center text-sm text-gray-700">
            <svg class="w-4 h-4 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Flexible team scaling
          </div>
        </div>
      </div>
      {#if activeModel === 'ticket'}
        <div class="absolute top-4 right-4">
          <svg class="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      {/if}
    </div>
  </button>
</div> 