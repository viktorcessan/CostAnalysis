<!-- Root Layout -->
<script>
  import '../app.css';
  import Navigation from '$lib/components/ui/Navigation.svelte';
</script>

<div class="min-h-screen bg-gray-50">
  <Navigation />
  <main>
    <slot />
  </main>
</div> 