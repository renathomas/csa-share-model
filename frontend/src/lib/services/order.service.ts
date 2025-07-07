import { apiService } from './api.service';

export interface OrderUpdateRequest {
  notes?: string;
  addons?: Array<{ addonId: string; quantity: number }>;
}

export interface OrderFilters {
  status?: 'pending' | 'locked' | 'fulfilled' | 'cancelled';
  subscriptionId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class OrderService {
  /**
   * Get all orders for current user
   */
  async getUserOrders(filters?: OrderFilters, limit = 20, offset = 0) {
    const response = await apiService.getOrders();
    return response.data as any[];
  }

  /**
   * Get specific order by ID
   */
  async getOrder(orderId: string) {
    const response = await apiService.getOrder(orderId);
    return response.data;
  }

  /**
   * Create new order
   */
  async createOrder(orderData: {
    subscriptionId: string;
    notes?: string;
    addons?: Array<{ addonId: string; quantity: number }>;
  }) {
    const response = await apiService.createOrder(orderData);
    return response.data;
  }

  /**
   * Update order (only before cutoff time)
   */
  async updateOrder(orderId: string, updates: OrderUpdateRequest) {
    const response = await apiService.updateOrder(orderId, updates);
    return response.data;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string) {
    const response = await apiService.cancelOrder(orderId);
    return response.data;
  }

  /**
   * Lock order (admin only)
   */
  async lockOrder(orderId: string) {
    const response = await apiService.lockOrder(orderId);
    return response.data;
  }

  /**
   * Fulfill order (admin only)
   */
  async fulfillOrder(orderId: string) {
    const response = await apiService.fulfillOrder(orderId);
    return response.data;
  }

  /**
   * Check if order can be modified
   */
  canModifyOrder(order: any): boolean {
    if (!order) return false;
    
    // Can't modify if order is locked, fulfilled, or cancelled
    if (['locked', 'fulfilled', 'cancelled'].includes(order.status)) {
      return false;
    }

    // Can't modify if cutoff time has passed
    const now = new Date();
    const cutoffTime = new Date(order.cutoffDatetime);
    
    return now < cutoffTime;
  }

  /**
   * Get time until cutoff
   */
  getTimeUntilCutoff(order: any): {
    hours: number;
    minutes: number;
    isPastCutoff: boolean;
  } {
    const now = new Date();
    const cutoffTime = new Date(order.cutoffDatetime);
    const timeDiff = cutoffTime.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return { hours: 0, minutes: 0, isPastCutoff: true };
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, isPastCutoff: false };
  }

  /**
   * Format order status for display
   */
  formatOrderStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      locked: 'Locked',
      fulfilled: 'Fulfilled',
      cancelled: 'Cancelled',
    };

    return statusMap[status] || status;
  }

  /**
   * Get order status color
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      pending: 'orange',
      locked: 'blue',
      fulfilled: 'green',
      cancelled: 'red',
    };

    return colorMap[status] || 'gray';
  }

  /**
   * Calculate order total with add-ons
   */
  calculateOrderTotal(order: any): number {
    let total = parseFloat(order.totalAmount || '0');
    
    if (order.addons && order.addons.length > 0) {
      order.addons.forEach((addon: any) => {
        total += parseFloat(addon.price) * addon.quantity;
      });
    }

    return total;
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}

export const orderService = new OrderService(); 