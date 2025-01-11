<!-- Team Analysis Model Page -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import TeamInteractionDiagram from '../../../../features/internal-analysis/components/TeamInteractionDiagram.svelte';
  import FormulaAccordion from '$lib/components/ui/FormulaAccordion.svelte';

  function handleBack() {
    goto(`${base}/calculator`);
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Top spacing for fixed navigation -->
  <div class="h-16"></div>
  
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="bg-white rounded-xl shadow-lg p-8">
        <div class="flex items-center gap-4 mb-6">
          <button
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
            on:click={handleBack}
          >
            <svg class="w-8 h-8 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 class="text-3xl font-bold text-gray-900">Reveal Team Dependency Costs</h2>
            <p class="text-lg text-gray-600 mt-2">
              See how team dependencies and interactions drive up costs, identify bottlenecks, and find actionable ways to optimize collaboration and workflows.
            </p>
            <ul class="text-lg text-gray-600 mt-4 list-disc pl-6">
              <li>Reveal and discuss the cost of team dependencies with your management team, CTO, or tech leads.</li>
              <li>Proactively access collaboration costs for a planned reorganization.</li>
              <li>Align team structures and architecture with your future product vision.</li>
              <li>Visualize inefficiencies when teams report poor interactions or collaboration.</li>
              <li>Streamline processes and improve efficiency with tech leads or management.</li>
            </ul>
          </div>
        </div>
      </div>

      <TeamInteractionDiagram />
      <div class="mt-6">
        <FormulaAccordion model="team" mode="internal" />
      </div>
    </div>
  </div>
</div> 