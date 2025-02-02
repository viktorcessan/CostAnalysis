<script lang="ts">
  import TargetPlanningForm from '../../features/target-planning/components/TargetPlanningForm.svelte';
</script>

<svelte:head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-NR5LB7QX');</script>
  <!-- End Google Tag Manager -->
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NR5LB7QX"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->

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