<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiService } from '../services/api.service.js';

  const dispatch = createEventDispatcher();

  let boxSize: 'small' | 'large' = 'small';
  let fulfillmentType: 'delivery' | 'pickup' = 'delivery';
  let paymentInterval: 4 | 8 | 12 = 4;
  let loading = false;
  let error = '';

  const boxOptions = [
    { value: 'small', label: 'Small Box', price: 25, description: 'Perfect for 1-2 people' },
    { value: 'large', label: 'Large Box', price: 40, description: 'Perfect for 3-4 people' }
  ];

  const fulfillmentOptions = [
    { value: 'delivery', label: 'Home Delivery', description: 'Delivered to your door' },
    { value: 'pickup', label: 'Farm Pickup', description: 'Pick up at the farm' }
  ];

  const intervalOptions = [
    { value: 4, label: '4 Week Plan', description: 'Monthly payment' },
    { value: 8, label: '8 Week Plan', description: 'Bi-monthly payment (5% discount)' },
    { value: 12, label: '12 Week Plan', description: 'Quarterly payment (10% discount)' }
  ];

  $: selectedBox = boxOptions.find(b => b.value === boxSize);
  $: totalCost = calculateTotalCost();

  function calculateTotalCost() {
    const basePrice = selectedBox?.price || 0;
    const totalOrders = paymentInterval;
    let total = basePrice * totalOrders;
    
    // Apply discounts
    if (paymentInterval === 8) {
      total *= 0.95; // 5% discount
    } else if (paymentInterval === 12) {
      total *= 0.90; // 10% discount
    }
    
    return total;
  }

  async function handleSubmit() {
    loading = true;
    error = '';

    try {
      // For demo purposes, we'll use a dummy payment method ID
      // In a real app, this would come from Stripe integration
      const response = await apiService.createSubscription({
        boxSize,
        fulfillmentType,
        paymentInterval,
        paymentMethodId: 'pm_demo_payment_method'
      });
      
      dispatch('created', response.data);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create subscription';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  {#if error}
    <div class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {error}
    </div>
  {/if}

  <!-- Box Size Selection -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-3">Box Size</label>
    <div class="space-y-2">
      {#each boxOptions as option}
        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 {boxSize === option.value ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
          <input
            type="radio"
            bind:group={boxSize}
            value={option.value}
            class="sr-only"
          />
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="font-medium">{option.label}</span>
              <span class="text-lg font-bold">${option.price}</span>
            </div>
            <p class="text-sm text-gray-600">{option.description}</p>
          </div>
        </label>
      {/each}
    </div>
  </div>

  <!-- Fulfillment Type -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-3">Fulfillment Option</label>
    <div class="space-y-2">
      {#each fulfillmentOptions as option}
        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 {fulfillmentType === option.value ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
          <input
            type="radio"
            bind:group={fulfillmentType}
            value={option.value}
            class="sr-only"
          />
          <div class="flex-1">
            <span class="font-medium">{option.label}</span>
            <p class="text-sm text-gray-600">{option.description}</p>
          </div>
        </label>
      {/each}
    </div>
  </div>

  <!-- Payment Interval -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-3">Payment Plan</label>
    <div class="space-y-2">
      {#each intervalOptions as option}
        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 {paymentInterval === option.value ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
          <input
            type="radio"
            bind:group={paymentInterval}
            value={option.value}
            class="sr-only"
          />
          <div class="flex-1">
            <span class="font-medium">{option.label}</span>
            <p class="text-sm text-gray-600">{option.description}</p>
          </div>
        </label>
      {/each}
    </div>
  </div>

  <!-- Cost Summary -->
  <div class="bg-gray-50 p-4 rounded-lg">
    <h4 class="font-medium text-gray-900 mb-2">Cost Summary</h4>
    <div class="space-y-1 text-sm">
      <div class="flex justify-between">
        <span>{paymentInterval} × {selectedBox?.label}</span>
        <span>${(selectedBox?.price || 0) * paymentInterval}</span>
      </div>
      {#if paymentInterval === 8}
        <div class="flex justify-between text-green-600">
          <span>5% Discount</span>
          <span>-${((selectedBox?.price || 0) * paymentInterval * 0.05).toFixed(2)}</span>
        </div>
      {:else if paymentInterval === 12}
        <div class="flex justify-between text-green-600">
          <span>10% Discount</span>
          <span>-${((selectedBox?.price || 0) * paymentInterval * 0.10).toFixed(2)}</span>
        </div>
      {/if}
      <hr class="my-2">
      <div class="flex justify-between font-medium text-lg">
        <span>Total</span>
        <span>${totalCost.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <button
    type="submit"
    disabled={loading}
    class="w-full py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 font-medium"
  >
    {#if loading}
      Creating Subscription...
    {:else}
      Create Subscription - ${totalCost.toFixed(2)}
    {/if}
  </button>
</form> 