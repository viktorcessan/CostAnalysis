<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  let isOpen = false;
  let isScrolled = false;

  onMount(() => {
    const handleScroll = () => {
      isScrolled = window.scrollY > 10;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  $: isLandingTop = $page.url.pathname === '/' && !isScrolled;
</script>

<nav class="fixed w-full z-50 transition-all duration-200 {isScrolled || $page.url.pathname !== '/' ? 'bg-white shadow-sm' : 'bg-transparent'}">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <!-- Logo and Navigation Links -->
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="group flex items-center space-x-2">
            <div class="relative">
              <div class="w-8 h-8 bg-gradient-to-br {isLandingTop ? 'from-secondary/80 to-secondary' : 'from-secondary to-secondary/80'} rounded-lg shadow-lg transform group-hover:scale-110 transition-all duration-300"></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <svg class="w-5 h-5 {isLandingTop ? 'text-white' : 'text-white'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
            <div class="flex flex-col">
              <span class="text-lg font-bold tracking-tight {isLandingTop ? 'text-white' : 'text-secondary'}">
                Service Calculator
              </span>
              <span class="text-xs {isLandingTop ? 'text-white/80' : 'text-gray-500'}">
                Optimize Your Delivery
              </span>
            </div>
          </a>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
          <a
            href="/"
            class="inline-flex items-center px-1 pt-1 border-b-2 {$page.url.pathname === '/' ? 'border-secondary font-semibold' : 'border-transparent hover:border-gray-300'} transition-colors {isLandingTop ? 'text-white hover:text-white/90' : 'text-gray-600 hover:text-gray-900'}"
          >
            Home
          </a>
          <a
            href="/calculator"
            class="inline-flex items-center px-1 pt-1 border-b-2 {$page.url.pathname === '/calculator' ? 'border-secondary font-semibold' : 'border-transparent hover:border-gray-300'} transition-colors {isLandingTop ? 'text-white hover:text-white/90' : 'text-gray-600 hover:text-gray-900'}"
          >
            Calculator
          </a>
        </div>
      </div>

      <!-- Mobile menu button -->
      <div class="flex items-center sm:hidden">
        <button
          type="button"
          class="inline-flex items-center justify-center p-2 rounded-md {isLandingTop ? 'text-white hover:text-white/90 hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} transition-colors"
          aria-controls="mobile-menu"
          aria-expanded={isOpen}
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
    <div class="sm:hidden bg-white" id="mobile-menu" transition:slide>
      <div class="pt-2 pb-3 space-y-1">
        <a
          href="/"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium {$page.url.pathname === '/' ? 'border-secondary text-secondary bg-secondary/10' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300'}"
        >
          Home
        </a>
        <a
          href="/calculator"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium {$page.url.pathname === '/calculator' ? 'border-secondary text-secondary bg-secondary/10' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300'}"
        >
          Calculator
        </a>
      </div>
    </div>
  {/if}
</nav>

<style>
  nav {
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }
</style> 