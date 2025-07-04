<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore, isAuthenticated } from './lib/stores/auth.store.js';
  import LoginForm from './lib/components/LoginForm.svelte';
  import Dashboard from './lib/components/Dashboard.svelte';
  import './app.css';

  let loading = true;

  onMount(() => {
    // Initialize auth from localStorage
    authStore.initFromStorage();
    loading = false;
  });

  function handleLogout() {
    authStore.logout();
  }
</script>

<main class="min-h-screen bg-gray-50">
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-gray-900">
          🥬 CSA Management
        </h1>
        {#if $isAuthenticated}
          <button
            on:click={handleLogout}
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        {/if}
      </div>
    </header>

    {#if loading}
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    {:else if $isAuthenticated}
      <Dashboard />
    {:else}
      <LoginForm />
    {/if}
  </div>
</main>

<style>
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
</style>
