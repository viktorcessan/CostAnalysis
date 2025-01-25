<script lang="ts">
  import { currencyStore, type Currency, currencyConfigs } from '$lib/stores/currencyStore';

  export let className = '';

  function handleCurrencyChange(currency: Currency) {
    currencyStore.setCurrency(currency);
  }
</script>

<div class="flex items-center gap-2 {className}">
  <span class="text-sm font-medium text-gray-700">Currency:</span>
  <div class="flex rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
    {#each Object.entries(currencyConfigs) as [code, config]}
      <button
        class="px-3 py-1 text-sm rounded-md transition-colors {$currencyStore.code === code ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-50'}"
        on:click={() => handleCurrencyChange(code as Currency)}
      >
        {config.symbol} {code}
      </button>
    {/each}
  </div>
</div> 