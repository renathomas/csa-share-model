<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser } from '../stores/auth.store.js';
  import { apiService } from '../services/api.service.js';
  import SubscriptionCard from './SubscriptionCard.svelte';
  import CreateSubscriptionForm from './CreateSubscriptionForm.svelte';
  import OrderManagement from './OrderManagement.svelte';
  import PaymentForm from './PaymentForm.svelte';

  let subscriptions: any[] = [];
  let loading = true;
  let error = '';
  let showCreateForm = false;
  let activeTab = 'subscriptions'; // subscriptions, orders, payments, notifications

  const tabs = [
    { id: 'subscriptions', label: 'Subscriptions', icon: '📋' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  onMount(async () => {
    await loadSubscriptions();
  });

  async function loadSubscriptions() {
    try {
      loading = true;
      const response = await apiService.getSubscriptions();
      subscriptions = response.data || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load subscriptions';
    } finally {
      loading = false;
    }
  }

  function handleSubscriptionCreated() {
    showCreateForm = false;
    loadSubscriptions();
  }
</script>

<div class="space-y-6">
  <!-- Welcome Section -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-2xl font-bold text-gray-900 mb-2">
      Welcome back, {$currentUser?.name || 'User'}!
    </h2>
    <p class="text-gray-600">
      Manage your CSA subscriptions and orders from your dashboard.
    </p>
  </div>

  <!-- Tab Navigation -->
  <div class="bg-white rounded-lg shadow-md">
    <div class="border-b border-gray-200">
      <nav class="flex space-x-8" aria-label="Tabs">
        {#each tabs as tab}
          <button
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === tab.id 
              ? 'border-green-500 text-green-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
            on:click={() => activeTab = tab.id}
          >
            <span class="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        {/each}
      </nav>
    </div>
  </div>

  <!-- Tab Content -->
  <div class="bg-white rounded-lg shadow-md">
    {#if activeTab === 'subscriptions'}
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Your Subscriptions</h3>
          <button
            on:click={() => showCreateForm = true}
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            + New Subscription
          </button>
        </div>

        {#if loading}
          <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        {:else if error}
          <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        {:else if subscriptions.length === 0}
          <div class="text-center py-8 text-gray-500">
            <p class="mb-4">You don't have any subscriptions yet.</p>
            <button
              on:click={() => showCreateForm = true}
              class="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Create Your First Subscription
            </button>
          </div>
        {:else}
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each subscriptions as subscription}
              <SubscriptionCard {subscription} />
            {/each}
          </div>
        {/if}
      </div>
    
    {:else if activeTab === 'orders'}
      <div class="p-6">
        <OrderManagement userId={$currentUser?.id || ''} />
      </div>
    
    {:else if activeTab === 'payments'}
      <div class="p-6">
        <div class="max-w-2xl mx-auto">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Management</h3>
          <p class="text-gray-600 mb-4">Manage your payment methods and view payment history.</p>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-500">Payment management features coming soon...</p>
          </div>
        </div>
      </div>
    
    {:else if activeTab === 'notifications'}
      <div class="p-6">
        <div class="max-w-2xl mx-auto">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
          <p class="text-gray-600 mb-4">View your order reminders and subscription updates.</p>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-500">Notification center coming soon...</p>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Quick Stats -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h4 class="text-sm font-medium text-gray-500">Active Subscriptions</h4>
      <p class="text-2xl font-bold text-green-600">
        {subscriptions.filter(s => s.status === 'active').length}
      </p>
    </div>
    <div class="bg-white rounded-lg shadow-md p-6">
      <h4 class="text-sm font-medium text-gray-500">Total Orders</h4>
      <p class="text-2xl font-bold text-blue-600">
        {subscriptions.reduce((total, s) => total + (s.totalOrders - s.remainingOrders), 0)}
      </p>
    </div>
    <div class="bg-white rounded-lg shadow-md p-6">
      <h4 class="text-sm font-medium text-gray-500">Remaining Orders</h4>
      <p class="text-2xl font-bold text-orange-600">
        {subscriptions.reduce((total, s) => total + s.remainingOrders, 0)}
      </p>
    </div>
  </div>
</div>

<!-- Create Subscription Modal -->
{#if showCreateForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Create New Subscription</h3>
        <button
          on:click={() => showCreateForm = false}
          class="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <CreateSubscriptionForm on:created={handleSubscriptionCreated} />
    </div>
  </div>
{/if} 