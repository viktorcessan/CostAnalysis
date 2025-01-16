<!-- Landing Page -->
<script lang="ts">
  import { base } from '$app/paths';
  import '@fontsource/caveat';

  const features = [
    {
      title: 'Build a Business Case',
      description: 'Explore how automation or outsourcing impacts your costs. Calculate ROI, compare options, and identify your break-even point.',
      details: [
        'Monthly cost breakdown',
        'Break-even analysis',
        'ROI projections',
        'Resource utilization metrics'
      ],
      icon: `<svg class="w-12 h-12 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>`
    },
    {
      title: 'Find Platform Budget',
      description: 'Determine how much to invest in your platform to lower costs while meeting your efficiency goals.',
      details: [
        'Process efficiency tracking',
        'Team productivity metrics',
        'Knowledge retention scoring',
        'Volume capacity analysis'
      ],
      icon: `<svg class="w-12 h-12 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>`
    },
    {
      title: 'Reveal Team Dependency Costs',
      description: 'Understand how team dependencies are driving up costs and find actionable ways to reduce them.',
      details: [
        'Collaboration patterns',
        'Knowledge transfer',
        'Process bottlenecks',
        'Efficiency opportunities'
      ],
      icon: `<svg class="w-12 h-12 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
      </svg>`
    }
  ];
</script>

<style>
  :global(.font-handwriting) {
    font-family: 'Caveat', cursive;
  }
</style>

<div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
  <!-- Hero Section -->
  <div class="pt-32 pb-20 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-4xl font-bold text-secondary mb-6 tracking-tight">
          Operations Cost Planning
        </h1>
        <p class="text-xl text-gray-600 mb-8 leading-relaxed">
          Optimize your delivery with tailored analyses to understand your development, application management, and service delivery costs, identify opportunities, and make informed decisions.
        </p>
        <div class="flex justify-center gap-4">
          <a
            href="{base}/calculator"
            class="px-8 py-4 bg-secondary text-white rounded-lg text-lg font-medium hover:bg-secondary/90 transition-all transform hover:scale-105 hover:shadow-lg"
          >
            Start Calculating
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Napkin Analysis Section -->
  <div class="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
    <!-- Background decorative elements -->
    <div class="absolute top-0 left-0 w-full h-full">
      <div class="absolute top-10 left-10 w-32 h-32 bg-secondary/5 rounded-full blur-3xl"></div>
      <div class="absolute bottom-10 right-10 w-48 h-48 bg-secondary/5 rounded-full blur-3xl"></div>
    </div>
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <!-- Section Title -->
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Quick Analysis, Real Insights
        </h2>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Start with a napkin calculation, end with actionable insights
        </p>
      </div>

      <div class="flex flex-col md:flex-row items-center gap-16">
        <!-- Left side: Napkin -->
        <div class="flex-1 transform hover:scale-105 transition-transform duration-300">
          <div class="relative w-full max-w-md mx-auto group">
            <!-- Napkin shadow for depth -->
            <div class="absolute inset-0 bg-gray-900/5 rounded-lg transform translate-x-2 translate-y-2 -rotate-1"></div>
            
            <!-- Main napkin -->
            <div class="bg-[#f7f4eb] p-8 rounded-lg shadow-lg transform rotate-2 relative backdrop-blur-sm backdrop-filter">
              <!-- Napkin texture -->
              <div class="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-lg"></div>
              
              <!-- Napkin border -->
              <div class="absolute top-0 left-0 w-full h-full border-t-4 border-l-4 border-gray-300/50 rounded-lg"></div>
              
              <!-- Content container -->
              <div class="space-y-6 transform -rotate-2 relative">
                <div class="font-handwriting text-2xl mb-2 text-secondary">Operations Analysis</div>
                
                <!-- Team Cost Analysis -->
                <div class="space-y-2 font-handwriting">
                  <div class="text-gray-700 text-lg">Team Structure:</div>
                  <div class="pl-4 space-y-1">
                    <div class="flex justify-between">
                      <span>Dev Team: 8 ppl</span>
                      <span class="text-secondary">×</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Avg Cost: $8k/mo</span>
                      <span class="text-secondary">=</span>
                    </div>
                    <div class="border-t border-gray-400 mt-2 pt-2">
                      <span class="font-bold text-lg">Total: $64k/mo</span>
                    </div>
                  </div>
                </div>

                <!-- Platform Costs -->
                <div class="space-y-2 font-handwriting">
                  <div class="text-gray-700 text-lg">Platform Costs:</div>
                  <div class="pl-4 space-y-1">
                    <div class="flex justify-between">
                      <span>Infrastructure</span>
                      <span>$12k</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Tools & Licenses</span>
                      <span>$3k</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Support</span>
                      <span>$5k</span>
                    </div>
                    <div class="border-t border-gray-400 mt-2 pt-2">
                      <span class="font-bold text-lg">Monthly: $20k</span>
                    </div>
                  </div>
                </div>

                <!-- Quick Analysis -->
                <div class="mt-6 pt-4 border-t-2 border-dashed border-gray-400">
                  <div class="font-handwriting space-y-2">
                    <div class="flex justify-between text-lg">
                      <span>Total Monthly:</span>
                      <span class="font-bold">~$84k</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Per Developer:</span>
                      <span>$10.5k</span>
                    </div>
                    <div class="mt-3 text-secondary font-bold text-lg">
                      Optimization Target: -15%
                      <div class="inline-block ml-2 transform -rotate-12">→</div>
                    </div>
                  </div>
                </div>

                <!-- Coffee stain effects -->
                <div class="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-[#C8A484] opacity-10 transform rotate-12"></div>
                <div class="absolute top-8 -right-2 w-10 h-10 rounded-full bg-[#C8A484] opacity-5"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right side: Text -->
        <div class="flex-1 text-center md:text-left">
          <div class="space-y-6 max-w-lg">
            <h3 class="text-3xl font-bold text-gray-900 mb-4">
              Back-of-Napkin Operations Analysis
            </h3>
            <p class="text-xl text-gray-600 leading-relaxed">
              Sometimes the best operational insights start with a quick calculation. Our tool brings this intuitive approach to life, helping you rapidly evaluate costs and opportunities.
            </p>
            <div class="space-y-4 text-gray-600">
              <div class="flex items-start gap-3">
                <div class="mt-1">
                  <svg class="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p>Quick calculations to validate your operational decisions</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="mt-1">
                  <svg class="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p>Instant visibility into team and platform costs</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="mt-1">
                  <svg class="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p>Clear optimization targets to guide your decisions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Features Section -->
  <div class="py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
         What would you like to do?
        </h2>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose the specific type of analysis you need, and we'll guide you step-by-step:
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {#each features as feature}
          <div class="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div class="flex items-center gap-4 mb-6">
              {@html feature.icon}
              <h3 class="text-xl font-semibold text-gray-900">{feature.title}</h3>
            </div>
            <p class="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
            <ul class="space-y-3">
              {#each feature.details as detail}
                <li class="flex items-center text-gray-700">
                  <div class="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {detail}
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- How It Works -->
  <div class="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          How It Works
        </h2>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Three simple steps to uncover actionable insights:
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300">
          <div class="flex items-center gap-4 mb-4">
            <div class="text-4xl font-bold text-secondary/20">01</div>
            <h3 class="text-xl font-semibold">Choose Your Analysis</h3>
          </div>
          <p class="text-gray-600 leading-relaxed">Select the analysis that matches your goals.</p>
        </div>

        <div class="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300">
          <div class="flex items-center gap-4 mb-4">
            <div class="text-4xl font-bold text-secondary/20">02</div>
            <h3 class="text-xl font-semibold">Input Your Data</h3>
          </div>
          <p class="text-gray-600 leading-relaxed">Add key details about your team, services, and targets.</p>
        </div>

        <div class="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300">
          <div class="flex items-center gap-4 mb-4">
            <div class="text-4xl font-bold text-secondary/20">03</div>
            <h3 class="text-xl font-semibold">Gain Insights</h3>
          </div>
          <p class="text-gray-600 leading-relaxed">Get clear, actionable recommendations tailored to your operations.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- CTA Section -->
  <div class="bg-gradient-to-br from-secondary via-secondary/95 to-secondary py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-3xl font-bold text-white mb-6">
        Ready to Optimize Your Operations Costs?
      </h2>
      <p class="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
        Start using the calculator today to make objective, data-driven decisions for your team.
      </p>
      <a
        href="{base}/calculator"
        class="inline-flex items-center px-8 py-4 bg-white text-secondary rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 hover:shadow-lg"
      >
        Get Started
        <svg class="ml-2 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </a>
    </div>
  </div>

  <!-- Footer -->
  <footer class="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="flex flex-col items-center gap-6">
        <div class="flex items-center gap-6">
          <a href="https://www.linkedin.com/in/viktorcessan" class="text-gray-400 hover:text-white transition-all transform hover:scale-110">
            <img src="https://img.icons8.com/ios-filled/24/cccccc/linkedin.png" alt="LinkedIn" class="w-6 h-6"/>
          </a>
          <a href="https://www.viktorcessan.com/" class="text-gray-400 hover:text-white transition-all transform hover:scale-110">
            <img src="https://img.icons8.com/ios-filled/24/cccccc/globe.png" alt="Website" class="w-6 h-6"/>
          </a>
          <a href="mailto:viktor@cessan.se" class="text-gray-400 hover:text-white transition-all transform hover:scale-110">
            <img src="https://img.icons8.com/ios-filled/24/cccccc/mail.png" alt="Email" class="w-6 h-6"/>
          </a>
        </div>
        <div class="text-sm text-gray-400 flex items-center gap-2">
          Icons by
          <a href="https://icons8.com" class="hover:text-white transition-colors flex items-center gap-2 group">
            <img src="https://img.icons8.com/color/24/000000/icons8-new-logo.png" alt="Icons8" class="w-5 h-5 group-hover:scale-110 transition-transform"/>
            Icons8
          </a>
        </div>
      </div>
    </div>
  </footer>
</div>
