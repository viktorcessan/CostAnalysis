<script lang="ts">
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  
  let isOpen = false;
</script>

<nav class="fixed top-0 inset-x-0 bg-white/80 shadow-sm z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex">
        <!-- Logo section -->
        <div class="flex-shrink-0 flex items-center">
          <a href="{base}/" class="flex items-center gap-3 group">
            <div class="w-8 h-8 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg shadow-lg transform group-hover:scale-110 transition-all duration-300">
              <div class="absolute inset-0 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
            <div class="flex flex-col">
              <span class="text-lg font-bold tracking-tight text-secondary">
                Service Calculator
              </span>
              <span class="text-xs text-gray-500">
                Optimize Your Delivery
              </span>
            </div>
          </a>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
          <a
            href="{base}/"
            class="inline-flex items-center px-1 pt-1 border-b-2 {$page.url.pathname === base + '/' ? 'border-secondary text-gray-900 font-semibold' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'} transition-colors"
          >
            Home
          </a>
          <a
            href="{base}/calculator"
            class="inline-flex items-center px-1 pt-1 border-b-2 {$page.url.pathname === base + '/calculator' ? 'border-secondary text-gray-900 font-semibold' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'} transition-colors"
          >
            Calculator
          </a>
        </div>
      </div>

      <!-- Mobile menu button -->
      <div class="flex items-center sm:hidden">
        <button
          type="button"
          class="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-controls="mobile-menu"
          aria-expanded="false"
          on:click={() => isOpen = !isOpen}
        >
          <span class="sr-only">Open main menu</span>
          {#if !isOpen}
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          {:else}
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if isOpen}
    <div class="sm:hidden bg-white border-t border-gray-200" id="mobile-menu">
      <div class="pt-2 pb-3 space-y-1">
        <a
          href="{base}/"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium {$page.url.pathname === base + '/' ? 'border-secondary text-secondary bg-secondary/10' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300'}"
        >
          Home
        </a>
        <a
          href="{base}/calculator"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium {$page.url.pathname === base + '/calculator' ? 'border-secondary text-secondary bg-secondary/10' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300'}"
        >
          Calculator
        </a>
      </div>
    </div>
  {/if}
</nav> 