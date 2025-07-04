<script lang="ts">
  import { authStore } from '../stores/auth.store.js';
  import { apiService } from '../services/api.service.js';

  let email = '';
  let password = '';
  let name = '';
  let phone = '';
  let address = '';
  let isRegister = false;
  let loading = false;
  let error = '';

  async function handleSubmit() {
    if (!email || !password) {
      error = 'Please fill in all required fields';
      return;
    }

    loading = true;
    error = '';

    try {
      if (isRegister) {
        if (!name) {
          error = 'Name is required for registration';
          return;
        }
        const response = await apiService.register({
          email,
          password,
          name,
          phone,
          address
        });
        authStore.login(response.data.user, response.data.accessToken, response.data.refreshToken);
      } else {
        const response = await apiService.login(email, password);
        authStore.login(response.data.user, response.data.accessToken, response.data.refreshToken);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading = false;
    }
  }

  function toggleMode() {
    isRegister = !isRegister;
    error = '';
  }
</script>

<div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
  <h2 class="text-2xl font-bold mb-6 text-center">
    {isRegister ? 'Create Account' : 'Sign In'}
  </h2>

  {#if error}
    <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
      <input
        type="email"
        id="email"
        bind:value={email}
        required
        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
      <input
        type="password"
        id="password"
        bind:value={password}
        required
        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
      />
    </div>

    {#if isRegister}
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
        <input
          type="text"
          id="name"
          bind:value={name}
          required
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div>
        <label for="phone" class="block text-sm font-medium text-gray-700">Phone (Optional)</label>
        <input
          type="tel"
          id="phone"
          bind:value={phone}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div>
        <label for="address" class="block text-sm font-medium text-gray-700">Address (Optional)</label>
        <textarea
          id="address"
          bind:value={address}
          rows="3"
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
        ></textarea>
      </div>
    {/if}

    <button
      type="submit"
      disabled={loading}
      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
    >
      {#if loading}
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing...
      {:else}
        {isRegister ? 'Create Account' : 'Sign In'}
      {/if}
    </button>
  </form>

  <div class="mt-4 text-center">
    <button
      on:click={toggleMode}
      class="text-sm text-green-600 hover:text-green-500"
    >
      {isRegister ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
    </button>
  </div>
</div> 