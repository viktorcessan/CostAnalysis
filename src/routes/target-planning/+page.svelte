<script lang="ts">
  import TargetPlanningForm from '../../features/target-planning/components/TargetPlanningForm.svelte';
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Determine Your Platform Budget</h1>
    <p class="mt-2 text-gray-600">
      See how much to invest in your platform to lower costs while meeting efficiency goals. Enter data about your team and service, add performance targets, and discover the budget you can afford.
    </p>
    <ul class="mt-4 text-gray-600 list-disc pl-6">
      <li>Identify and address cost increases tied to staff growth.</li>
      <li>Plan cost reductions while maintaining performance levels.</li>
      <li>Estimate the budget needed to achieve efficiency targets.</li>
      <li>Align platform investments with leadership or finance expectations.</li>
      <li>Balance performance improvements with financial constraints.</li>
    </ul>
  </div>

  <TargetPlanningForm />
</div> 