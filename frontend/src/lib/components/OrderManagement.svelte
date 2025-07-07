<script lang="ts">
  import { onMount } from 'svelte';
  import { orderService } from '../services/order.service';
  import { notificationService } from '../services/notification.service';

  export let userId: string;

  let orders: any[] = [];
  let selectedOrder: any = null;
  let loading = true;
  let error = '';
  let showOrderModal = false;
  let orderNotes = '';

  onMount(async () => {
    await loadOrders();
  });

  async function loadOrders() {
    try {
      loading = true;
      orders = await orderService.getUserOrders();
    } catch (err: any) {
      error = err.message || 'Failed to load orders';
    } finally {
      loading = false;
    }
  }

  async function selectOrder(order: any) {
    selectedOrder = order;
    orderNotes = order.notes || '';
    showOrderModal = true;
  }

  async function updateOrder() {
    if (!selectedOrder) return;

    try {
      await orderService.updateOrder(selectedOrder.id, {
        notes: orderNotes,
      });
      
      // Refresh orders
      await loadOrders();
      showOrderModal = false;
      
      // Show success notification
      await notificationService.showBrowserNotification(
        'Order Updated',
        'Your order has been updated successfully'
      );
    } catch (err: any) {
      error = err.message || 'Failed to update order';
    }
  }

  async function cancelOrder(orderId: string) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      await orderService.cancelOrder(orderId);
      await loadOrders();
      
      await notificationService.showBrowserNotification(
        'Order Cancelled',
        'Your order has been cancelled'
      );
    } catch (err: any) {
      error = err.message || 'Failed to cancel order';
    }
  }

  function closeModal() {
    showOrderModal = false;
    selectedOrder = null;
    orderNotes = '';
  }

  function getTimeUntilCutoff(order: any) {
    return orderService.getTimeUntilCutoff(order);
  }

  function canModify(order: any) {
    return orderService.canModifyOrder(order);
  }
</script>

<div class="order-management">
  <div class="header">
    <h2>My Orders</h2>
    <button class="refresh-btn" on:click={loadOrders}>
      🔄 Refresh
    </button>
  </div>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading orders...</p>
    </div>
  {:else if error}
    <div class="error-message">
      <span class="error-icon">❌</span>
      {error}
    </div>
  {:else if orders.length === 0}
    <div class="empty-state">
      <p>📦 No orders found</p>
      <p>Orders will appear here when you create a subscription.</p>
    </div>
  {:else}
    <div class="orders-grid">
      {#each orders as order}
        <div class="order-card" class:locked={order.status === 'locked'}>
          <div class="order-header">
            <span class="order-id">#{order.id.slice(-6)}</span>
            <span class="order-status" class:pending={order.status === 'pending'} 
                  class:locked={order.status === 'locked'} 
                  class:fulfilled={order.status === 'fulfilled'}
                  class:cancelled={order.status === 'cancelled'}>
              {orderService.formatOrderStatus(order.status)}
            </span>
          </div>

          <div class="order-details">
            <p><strong>Fulfillment Date:</strong> {order.fulfillmentDate}</p>
            <p><strong>Time:</strong> {order.fulfillmentTime}</p>
            <p><strong>Amount:</strong> {orderService.formatCurrency(order.totalAmount)}</p>
            
            {#if order.status === 'pending'}
              {@const timeLeft = getTimeUntilCutoff(order)}
              <div class="cutoff-info">
                {#if timeLeft.isPastCutoff}
                  <span class="cutoff-passed">⏰ Cutoff time passed</span>
                {:else}
                  <span class="cutoff-remaining">
                    ⏰ {timeLeft.hours}h {timeLeft.minutes}m until cutoff
                  </span>
                {/if}
              </div>
            {/if}

            {#if order.notes}
              <div class="order-notes">
                <strong>Notes:</strong> {order.notes}
              </div>
            {/if}
          </div>

          <div class="order-actions">
            <button class="view-btn" on:click={() => selectOrder(order)}>
              View Details
            </button>
            
            {#if canModify(order)}
              <button class="modify-btn" on:click={() => selectOrder(order)}>
                Modify
              </button>
            {/if}
            
            {#if order.status === 'pending'}
              <button class="cancel-btn" on:click={() => cancelOrder(order.id)}>
                Cancel
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showOrderModal && selectedOrder}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Order #{selectedOrder.id.slice(-6)}</h3>
        <button class="close-btn" on:click={closeModal}>×</button>
      </div>

      <div class="modal-content">
        <div class="order-info">
          <p><strong>Status:</strong> {orderService.formatOrderStatus(selectedOrder.status)}</p>
          <p><strong>Fulfillment:</strong> {selectedOrder.fulfillmentDate} at {selectedOrder.fulfillmentTime}</p>
          <p><strong>Amount:</strong> {orderService.formatCurrency(selectedOrder.totalAmount)}</p>
          
          {#if selectedOrder.status === 'pending'}
            {@const timeLeft = getTimeUntilCutoff(selectedOrder)}
            <p><strong>Cutoff:</strong> 
              {#if timeLeft.isPastCutoff}
                <span class="cutoff-passed">Passed</span>
              {:else}
                <span class="cutoff-remaining">{timeLeft.hours}h {timeLeft.minutes}m remaining</span>
              {/if}
            </p>
          {/if}
        </div>

        {#if canModify(selectedOrder)}
          <div class="form-group">
            <label for="notes">Order Notes</label>
            <textarea
              id="notes"
              bind:value={orderNotes}
              placeholder="Add any special instructions or notes..."
              rows="3"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button class="update-btn" on:click={updateOrder}>
              Update Order
            </button>
            <button class="cancel-btn" on:click={() => cancelOrder(selectedOrder.id)}>
              Cancel Order
            </button>
          </div>
        {:else}
          <div class="readonly-note">
            <p>This order can no longer be modified.</p>
            {#if selectedOrder.notes}
              <p><strong>Notes:</strong> {selectedOrder.notes}</p>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .order-management {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .header h2 {
    margin: 0;
    color: #1a202c;
  }

  .refresh-btn {
    padding: 0.5rem 1rem;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .refresh-btn:hover {
    background: #edf2f7;
  }

  .loading {
    text-align: center;
    padding: 3rem;
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #059669;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #dc2626;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  .orders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .order-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
    background: white;
    transition: border-color 0.2s;
  }

  .order-card:hover {
    border-color: #d1d5db;
  }

  .order-card.locked {
    border-left: 4px solid #3b82f6;
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .order-id {
    font-family: monospace;
    font-weight: 600;
    color: #374151;
  }

  .order-status {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }

  .order-status.pending {
    background: #fef3c7;
    color: #92400e;
  }

  .order-status.locked {
    background: #dbeafe;
    color: #1e40af;
  }

  .order-status.fulfilled {
    background: #d1fae5;
    color: #065f46;
  }

  .order-status.cancelled {
    background: #fee2e2;
    color: #991b1b;
  }

  .order-details {
    margin-bottom: 1rem;
  }

  .order-details p {
    margin: 0.25rem 0;
    color: #374151;
  }

  .cutoff-info {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
  }

  .cutoff-remaining {
    color: #059669;
    font-weight: 500;
  }

  .cutoff-passed {
    color: #dc2626;
    font-weight: 500;
  }

  .order-notes {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .order-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .view-btn, .modify-btn, .cancel-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .view-btn {
    background: #f9fafb;
    color: #374151;
  }

  .modify-btn {
    background: #eff6ff;
    color: #1e40af;
    border-color: #3b82f6;
  }

  .cancel-btn {
    background: #fef2f2;
    color: #991b1b;
    border-color: #f87171;
  }

  .view-btn:hover {
    background: #f3f4f6;
  }

  .modify-btn:hover {
    background: #dbeafe;
  }

  .cancel-btn:hover {
    background: #fee2e2;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h3 {
    margin: 0;
    color: #1a202c;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
  }

  .close-btn:hover {
    color: #374151;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .order-info {
    margin-bottom: 1.5rem;
  }

  .order-info p {
    margin: 0.5rem 0;
    color: #374151;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }

  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    resize: vertical;
    box-sizing: border-box;
  }

  .form-group textarea:focus {
    outline: none;
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
  }

  .update-btn {
    flex: 1;
    padding: 0.75rem;
    background: #059669;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }

  .update-btn:hover {
    background: #047857;
  }

  .readonly-note {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 6px;
    color: #6b7280;
  }

  .readonly-note p {
    margin: 0.5rem 0;
  }
</style> 