<!-- Landing Page -->
<script lang="ts">
  import { base } from '$app/paths';

  const features = [
    {
      title: 'Build a Business Case',
      description: 'Explore how automation or outsourcing impacts your costs. Calculate ROI, compare options, and identify your break-even point.',
      details: [
        'Monthly cost breakdown',
        'Break-even analysis',
        'ROI projections',
        'Resource utilization metrics'
      ]
    },
    {
      title: 'Find Platform Budget',
      description: 'Determine how much to invest in your platform to lower costs while meeting your efficiency goals.',
      details: [
        'Process efficiency tracking',
        'Team productivity metrics',
        'Knowledge retention scoring',
        'Volume capacity analysis'
      ]
    },
    {
      title: 'Reveal Team Dependency Costs',
      description: 'Understand how team dependencies are driving up costs and find actionable ways to reduce them.',
      details: [
        'Collaboration patterns',
        'Knowledge transfer',
        'Process bottlenecks',
        'Efficiency opportunities'
      ]
    }
  ];
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Hero Section -->
  <div class="pt-24 pb-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-3xl font-semibold text-secondary mb-4">
          Operations Cost Planning
        </h1>
        <p class="text-xl text-gray-600 mb-6">
          Optimize your delivery with tailored analyses to understand your development, application management, and service delivery costs, identify opportunities, and make informed decisions.
        </p>
        <div class="flex justify-center gap-4">
          <a
            href="{base}/calculator"
            class="px-6 py-3 bg-secondary text-white rounded-lg text-lg font-medium hover:bg-secondary/90 transition-colors"
          >
            Start Calculating
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Features Section -->
  <div class="bg-gray-50 py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">
         What would you like to do?
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose the specific type of analysis you need, and we’ll guide you step-by-step:
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {#each features as feature}
          <div class="bg-white p-6 rounded-lg border border-gray-200">
            <h3 class="text-lg font-medium text-gray-900 mb-3">{feature.title}</h3>
            <p class="text-gray-600 mb-4">{feature.description}</p>
            <ul class="space-y-2">
              {#each feature.details as detail}
                <li class="flex items-center text-gray-700">
                  <span class="text-secondary mr-2">•</span>
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
  <div class="bg-gray-50 py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">
          How It Works
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Three simple steps to uncover actionable insights:
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white p-6 rounded-lg border border-gray-200">
          <div class="text-2xl font-semibold text-secondary mb-3">01</div>
          <h3 class="text-lg font-medium mb-2">1.	Choose Your Analysis</h3>
          <p class="text-gray-600">Select the analysis that matches your goals.</p>
        </div>

        <div class="bg-white p-6 rounded-lg border border-gray-200">
          <div class="text-2xl font-semibold text-secondary mb-3">02</div>
          <h3 class="text-lg font-medium mb-2">Input Your Data</h3>
          <p class="text-gray-600">Add key details about your team, services, and targets.</p>
        </div>

        <div class="bg-white p-6 rounded-lg border border-gray-200">
          <div class="text-2xl font-semibold text-secondary mb-3">03</div>
          <h3 class="text-lg font-medium mb-2">Gain Insights</h3>
          <p class="text-gray-600">Get clear, actionable recommendations tailored to your operations.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- CTA Section -->
  <div class="bg-secondary py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-2xl font-semibold text-white mb-4">
        Ready to Optimize Your Operations Costs?
      </h2>
      <p class="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
        Start using the calculator today to make objective, data-driven decisions for your team.
      </p>
      <a
        href="{base}/calculator"
        class="inline-flex items-center px-6 py-3 bg-white text-secondary rounded-lg text-lg font-medium"
      >
        Get Started
        <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  </div>

  <!-- Footer -->
  <footer class="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col items-center gap-4">
        <div class="flex items-center gap-4">
          <a href="https://www.linkedin.com/in/viktorcessan" class="text-gray-400 hover:text-white transition-colors">
            <img src="https://img.icons8.com/ios-filled/24/cccccc/linkedin.png" alt="LinkedIn" class="w-6 h-6"/>
          </a>
          <a href="https://www.viktorcessan.com/" class="text-gray-400 hover:text-white transition-colors">
            <img src="https://img.icons8.com/ios-filled/24/cccccc/globe.png" alt="Website" class="w-6 h-6"/>
          </a>
          <a href="mailto:viktor@cessan.se" class="text-gray-400 hover:text-white transition-colors">
            <img src="https://img.icons8.com/ios-filled/24/cccccc/mail.png" alt="Email" class="w-6 h-6"/>
          </a>
        </div>
        <div class="text-sm text-gray-400 flex items-center gap-1">
          Icons by
          <a href="https://icons8.com" class="hover:text-white transition-colors flex items-center gap-1">
            <img src="https://img.icons8.com/color/24/000000/icons8-new-logo.png" alt="Icons8" class="w-5 h-5"/>
            Icons8
          </a>
        </div>
      </div>
    </div>
  </footer>
</div>
