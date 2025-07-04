<script lang="ts">
  export let subscription: any;

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
  <div class="flex items-center justify-between mb-3">
    <h4 class="text-lg font-semibold capitalize">
      {subscription.boxSize} Box
    </h4>
    <span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(subscription.status)}">
      {subscription.status}
    </span>
  </div>

  <div class="space-y-2 text-sm text-gray-600">
    <div class="flex justify-between">
      <span>Fulfillment:</span>
      <span class="capitalize">{subscription.fulfillmentType}</span>
    </div>
    <div class="flex justify-between">
      <span>Payment Interval:</span>
      <span>{subscription.paymentInterval} weeks</span>
    </div>
    <div class="flex justify-between">
      <span>Price per Box:</span>
      <span>${subscription.boxPrice}</span>
    </div>
    <div class="flex justify-between">
      <span>Remaining Orders:</span>
      <span class="font-medium">{subscription.remainingOrders}/{subscription.totalOrders}</span>
    </div>
    <div class="flex justify-between">
      <span>Period Ends:</span>
      <span>{formatDate(subscription.periodEnd)}</span>
    </div>
  </div>

  <div class="mt-4 w-full bg-gray-200 rounded-full h-2">
    <div 
      class="bg-green-600 h-2 rounded-full transition-all duration-300"
      style="width: {((subscription.totalOrders - subscription.remainingOrders) / subscription.totalOrders) * 100}%"
    ></div>
  </div>

  <div class="mt-4 flex space-x-2">
    <button class="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
      View Details
    </button>
         {#if subscription.status === 'active'}
       <button class="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
         Manage Orders
       </button>
     {/if}
   </div>
 </div>
 