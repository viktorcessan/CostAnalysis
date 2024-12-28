<script lang="ts">
  import type { CalculatorModel } from '$lib/types/calculator';
  import { createEventDispatcher } from 'svelte';

  export let activeModel: CalculatorModel;
  const dispatch = createEventDispatcher<{modelSelect: CalculatorModel}>();

  const models = [
    {
      id: 'team',
      name: 'Team-Based',
      description: 'Calculate based on team size and efficiency',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    },
    {
      id: 'ticket',
      name: 'Ticket-Based',
      description: 'Calculate based on ticket volume and complexity',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
    }
  ];
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {#each models as model}
    <button
      class="relative p-4 rounded-lg border transition-all {
        activeModel === model.id
          ? 'bg-gradient-to-br from-secondary to-secondary/90 text-white shadow-xl'
          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-secondary/20'
      }"
      on:click={() => dispatch('modelSelect', model.id as CalculatorModel)}
    >
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0">
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={model.icon}
            />
          </svg>
        </div>
        <div class="flex-1">
          <div class="font-medium">{model.name}</div>
          <div class="text-sm {
            activeModel === model.id
              ? 'text-white/90'
              : 'text-gray-500'
          }">
            {model.description}
          </div>
        </div>
      </div>
    </button>
  {/each}
</div> 