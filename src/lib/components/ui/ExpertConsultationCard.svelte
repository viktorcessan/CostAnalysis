<script>
  export let base; // For the image path
  export let showExpertModal = false;
</script>

<!-- Expert Consultation Card -->
<div class="lg:col-span-2 bg-white rounded-xl p-8 border border-secondary/20 relative overflow-hidden">
  <!-- Background Pattern -->
  <div class="absolute inset-0 opacity-[0.02] pointer-events-none">
    <svg class="w-full h-full" viewBox="0 0 100 100">
      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="0.5"/>
      </pattern>
      <rect width="100" height="100" fill="url(#grid)"/>
    </svg>
  </div>
  
  <!-- Content -->
  <div class="flex flex-col relative">
    <div class="text-center max-w-2xl mx-auto mb-8">
      <h3 class="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">Talk It Through</h3>
      <p class="text-gray-600 text-lg leading-relaxed">Schedule a free 30-minute consultation to review your results, dive deeper into your analysis, and discuss next steps tailored to your needs.</p>
    </div>

    <div class="flex flex-col md:flex-row items-center justify-between gap-10 max-w-3xl mx-auto w-full">
      <!-- Expert Image -->
      <div class="flex-shrink-0 order-1 md:order-2">
        <div class="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-secondary/10 shadow-xl">
          <img src="{base}/viktor2.jpeg" alt="Viktor Cessan" class="w-full h-full object-cover" />
        </div>
      </div>

      <!-- Features List -->
      <div class="flex-grow order-2 md:order-1">
        <ul class="space-y-4 md:space-y-5">
          <li class="flex items-start text-gray-700 gap-4">
            <div class="flex-shrink-0 w-8 h-8 mt-1 rounded-full bg-secondary/10 flex items-center justify-center">
              <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="text-base md:text-lg leading-relaxed">Clarify your findings and identify opportunities for improvement.</span>
          </li>
          <li class="flex items-start text-gray-700 gap-4">
            <div class="flex-shrink-0 w-8 h-8 mt-1 rounded-full bg-secondary/10 flex items-center justify-center">
              <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="text-base md:text-lg leading-relaxed">Explore team structure, collaboration workflows, or knowledge-sharing strategies.</span>
          </li>
          <li class="flex items-start text-gray-700 gap-4">
            <div class="flex-shrink-0 w-8 h-8 mt-1 rounded-full bg-secondary/10 flex items-center justify-center">
              <svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="text-base md:text-lg leading-relaxed">Get practical advice on how to move forward with actionable insights.</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- CTA Button -->
    <div class="mt-10 text-center">
      <button
        on:click={() => showExpertModal = true}
        class="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary/60 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <svg class="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Schedule Free Consultation
      </button>
    </div>
  </div>
</div> 