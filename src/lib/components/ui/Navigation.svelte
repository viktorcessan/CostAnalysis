<script lang="ts">
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  
  let isOpen = false;

  $: currentGoal = $page.url.searchParams.get('goal');
  $: isBaseAnalysis = $page.url.pathname.includes('base_analysis') || currentGoal === 'breakeven';
  $: isTargetAnalysis = $page.url.pathname.includes('target_analysis') || currentGoal === 'target';
  $: isTeamAnalysis = $page.url.pathname.includes('team_analysis') || currentGoal === 'team-analysis';
  $: isBuildBuyAnalysis = $page.url.pathname.includes('build_buy') || currentGoal === 'build-buy';
  $: isFeatureCalculator = $page.url.pathname.includes('feature_calculator') || currentGoal === 'feature-calculator';
</script>

<nav class="fixed top-0 inset-x-0 bg-white/80 shadow-sm z-50">
  <div class="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <!-- Left side with logo -->
      <div class="flex-shrink-0">
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
              Napkin Operations Cost Planning
            </span>
            <span class="text-xs text-gray-500">
              Quick insights for Smarter Decisions
            </span>
          </div>
        </a>
      </div>

      <!-- Center navigation -->
      <div class="hidden lg:flex flex-1 justify-center">
        <div class="flex items-center space-x-1 px-4 mx-auto">
          <div class="bg-gray-50/80 rounded-lg p-1.5 flex items-center space-x-1">
            <a
              href="{base}/calculator/team_analysis/team_model"
              class="px-3 py-2 rounded-md text-sm font-medium {isTeamAnalysis ? 'bg-white text-secondary shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'} transition-colors"
              on:click|preventDefault={() => {
                goto(`${base}/calculator/team_analysis/team_model`);
                isOpen = false;
              }}
            >
              Team Dependencies
            </a>
            <a
              href="{base}/calculator/build_buy"
              class="px-3 py-2 rounded-md text-sm font-medium {isBuildBuyAnalysis ? 'bg-white text-secondary shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'} transition-colors"
              on:click|preventDefault={() => {
                goto(`${base}/calculator/build_buy`);
                isOpen = false;
              }}
            >
              Build vs Buy
            </a>
            <a
              href="{base}/calculator/feature_calculator"
              class="px-3 py-2 rounded-md text-sm font-medium {isFeatureCalculator ? 'bg-white text-secondary shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'} transition-colors"
              on:click|preventDefault={() => {
                goto(`${base}/calculator/feature_calculator`);
                isOpen = false;
              }}
            >
              Feature Value
            </a>
            <a
              href="{base}/calculator?goal=breakeven"
              class="px-3 py-2 rounded-md text-sm font-medium {isBaseAnalysis ? 'bg-white text-secondary shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'} transition-colors"
              on:click|preventDefault={() => {
                goto(`${base}/calculator?goal=breakeven`);
                isOpen = false;
              }}
            >
              Business Case
            </a>
            <a
              href="{base}/calculator?goal=target"
              class="px-3 py-2 rounded-md text-sm font-medium {isTargetAnalysis ? 'bg-white text-secondary shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'} transition-colors"
              on:click|preventDefault={() => {
                goto(`${base}/calculator?goal=target`);
                isOpen = false;
              }}
            >
              Platform Budget
            </a>
          </div>
        </div>
      </div>

      <!-- Right side navigation -->
      <div class="hidden lg:flex items-center space-x-6">
        <a
          href="{base}/terms"
          class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Terms of Service
        </a>
        <div class="w-px h-4 bg-gray-300"></div>
        <a
          href="https://www.viktorcessan.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          About Me
        </a>
      </div>

      <!-- Mobile menu button -->
      <div class="flex lg:hidden">
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
    <div class="lg:hidden bg-white border-t border-gray-200" id="mobile-menu">
      <div class="pt-2 pb-3 space-y-1">
        <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Analysis Tools
        </div>
        <a
          href="{base}/calculator/team_analysis/team_model"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium {isTeamAnalysis ? 'border-secondary text-secondary bg-secondary/10' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300'}"
          on:click|preventDefault={() => {
            goto(`${base}/calculator/team_analysis/team_model`);
            isOpen = false;
          }}
        >
          Team Dependencies
        </a>
        <a
          href="{base}/calculator/build_buy"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium {isBuildBuyAnalysis ? 'border-secondary text-secondary bg-secondary/10' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300'}"
          on:click|preventDefault={() => {
            goto(`${base}/calculator/build_buy`);
            isOpen = false;
          }}
        >
          Build vs Buy
        </a>
        <a
          href="{base}/calculator/feature_calculator"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium {isFeatureCalculator ? 'border-secondary text-secondary bg-secondary/10' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300'}"
          on:click|preventDefault={() => {
            goto(`${base}/calculator/feature_calculator`);
            isOpen = false;
          }}
        >
          Feature Value
        </a>
        <a
          href="{base}/calculator?goal=breakeven"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium {isBaseAnalysis ? 'border-secondary text-secondary bg-secondary/10' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300'}"
          on:click|preventDefault={() => {
            goto(`${base}/calculator?goal=breakeven`);
            isOpen = false;
          }}
        >
          Business Case
        </a>
        <a
          href="{base}/calculator?goal=target"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium {isTargetAnalysis ? 'border-secondary text-secondary bg-secondary/10' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300'}"
          on:click|preventDefault={() => {
            goto(`${base}/calculator?goal=target`);
            isOpen = false;
          }}
        >
          Platform Budget
        </a>
        <div class="px-3 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          More
        </div>
        <a
          href="{base}/terms"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium {$page.url.pathname === base + '/terms' ? 'border-secondary text-secondary bg-secondary/10' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300'}"
        >
          Terms of Service
        </a>
        <a
          href="https://www.viktorcessan.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300"
        >
          About Me
        </a>
      </div>
    </div>
  {/if}
</nav> 