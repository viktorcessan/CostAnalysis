<!-- Landing Page -->
<script lang="ts">
  import { base } from '$app/paths';

  const features = [
    {
      title: 'Cost Analysis',
      description: 'Compare team-based vs ticket-based service delivery models',
      details: [
        'Monthly cost breakdown',
        'Break-even analysis',
        'ROI projections',
        'Resource utilization metrics'
      ]
    },
    {
      title: 'Target Planning',
      description: 'Set and track efficiency targets with real-time insights',
      details: [
        'Process efficiency tracking',
        'Team productivity metrics',
        'Knowledge retention scoring',
        'Volume capacity analysis'
      ]
    },
    {
      title: 'Team Interactions',
      description: 'Visualize and optimize team dynamics and workflows',
      details: [
        'Collaboration patterns',
        'Knowledge transfer',
        'Process bottlenecks',
        'Efficiency opportunities'
      ]
    }
  ];
</script>

<div class="min-h-screen">
  <!-- Hero Section -->
  <div class="bg-secondary py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-3xl font-semibold text-white mb-4">
          Service Delivery Calculator
        </h1>
        <p class="text-xl text-white/90 mb-6">
          Optimize your service delivery model with data-driven insights
        </p>
        <div class="flex justify-center gap-4">
          <a
            href="{base}/calculator"
            class="px-6 py-3 bg-white text-secondary rounded-lg text-lg font-medium"
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
          Analysis Tools
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Make informed decisions with our analytics and planning tools
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
          Three simple steps to optimize your service delivery
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white p-6 rounded-lg border border-gray-200">
          <div class="text-2xl font-semibold text-secondary mb-3">01</div>
          <h3 class="text-lg font-medium mb-2">Input Your Data</h3>
          <p class="text-gray-600">Enter your current service delivery metrics, team size, and costs</p>
        </div>

        <div class="bg-white p-6 rounded-lg border border-gray-200">
          <div class="text-2xl font-semibold text-secondary mb-3">02</div>
          <h3 class="text-lg font-medium mb-2">Compare Models</h3>
          <p class="text-gray-600">Analyze team-based vs ticket-based approaches with our algorithms</p>
        </div>

        <div class="bg-white p-6 rounded-lg border border-gray-200">
          <div class="text-2xl font-semibold text-secondary mb-3">03</div>
          <h3 class="text-lg font-medium mb-2">Get Insights</h3>
          <p class="text-gray-600">Receive detailed analysis and optimization strategies</p>
        </div>
      </div>
    </div>
  </div>

  <!-- CTA Section -->
  <div class="bg-secondary py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-2xl font-semibold text-white mb-4">
        Ready to Optimize Your Service Delivery?
      </h2>
      <p class="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
        Start using our calculator today to make data-driven decisions about your service delivery model
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
  <footer class="bg-gray-900 text-white py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-6">
          <a href="mailto:contact@viktorcessan.com" class="text-gray-400">
            contact@viktorcessan.com
          </a>
          <a href="https://linkedin.com/in/viktorcessan" target="_blank" rel="noopener noreferrer" class="text-gray-400">
            LinkedIn
          </a>
        </div>
        <div class="text-sm text-gray-400">
          <a href="https://viktorcessan.com" target="_blank" rel="noopener noreferrer">
            viktorcessan.com
          </a>
        </div>
      </div>
    </div>
  </footer>
</div>
