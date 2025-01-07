<!-- Expert Consultation Modal -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { clickOutside } from '$lib/actions/clickOutside';
  import { onMount, onDestroy } from 'svelte';
  import { base } from '$app/paths';

  export let show = false;

  let widget: HTMLDivElement;
  let calendlyInitialized = false;

  function initCalendly() {
    if (!widget || calendlyInitialized) return;

    // Load Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.type = 'text/javascript';
    script.async = true;
    
    script.onload = () => {
      // @ts-ignore - Calendly is loaded from external script
      if (window.Calendly) {
        // @ts-ignore - Calendly is loaded from external script
        window.Calendly.initInlineWidget({
          url: 'https://calendly.com/viktor-cessan',
          parentElement: widget,
          prefill: {},
          utm: {}
        });
        calendlyInitialized = true;
      }
    };

    document.head.appendChild(script);
  }

  $: if (show && widget && !calendlyInitialized) {
    initCalendly();
  }

  onDestroy(() => {
    calendlyInitialized = false;
    if (widget) {
      widget.innerHTML = '';
    }
  });
</script>

{#if show}
  <div class="fixed inset-0 bg-black/50 z-50" transition:fade>
    <div
      class="fixed inset-4 md:inset-10 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      use:clickOutside
      on:click_outside={() => show = false}
    >
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
        <h2 class="text-lg font-semibold text-gray-900">Schedule Expert Consultation</h2>
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
      <div class="flex-1 overflow-y-auto">
        <!-- Expert Profile -->
        <div class="p-6 border-b border-gray-200">
          <div class="max-w-3xl mx-auto">
            <div class="flex items-center gap-6 mb-6">
              <div class="relative w-32 h-32 flex-shrink-0 rounded-full overflow-hidden">
                <img
                  src="{base}/viktor2.jpeg"
                  alt="Viktor Cessan"
                  class="absolute w-[150%] h-[150%] object-cover left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                />
                <div class="absolute inset-0 rounded-full border-4 border-secondary/20"></div>
              </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900">Viktor Cessan</h3>
                <p class="text-sm text-gray-600">Agile & Systems Coach</p>
                <p class="text-sm text-gray-600">Stockholm, Sweden</p>
                <div class="mt-4 prose prose-sm">
                  <p class="text-gray-600">
                    I do agile, product, and systems coaching, and am based in Stockholm, Sweden.
                  </p>
                  <p class="text-gray-600">
                    I've been coaching teams and organizations over a decade now, and have experience from software, hardware, and infrastructure contexts.
                  </p>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <span class="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">Agile Coaching</span>
              <span class="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">Product Development</span>
              <span class="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">Systems Thinking</span>
              <span class="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">Team Optimization</span>
              <span class="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">Organizational Design</span>
            </div>
          </div>
        </div>

        <!-- Calendly Widget -->
        <div 
          bind:this={widget}
          id="calendly-embed"
          style="min-width:320px;height:700px;"
        ></div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(#calendly-embed) {
    width: 100% !important;
  }
  
  :global(#calendly-embed iframe) {
    width: 100% !important;
    height: 100% !important;
    background: transparent !important;
    border: 0;
    margin: 0;
    padding: 0;
    display: block;
  }
</style> 