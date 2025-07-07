import { get } from 'svelte/store';
import { authToken } from '../stores/auth.store.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = get(authToken);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    address?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Subscription endpoints
  async createSubscription(subscriptionData: {
    boxSize: 'small' | 'large';
    fulfillmentType: 'delivery' | 'pickup';
    paymentInterval: 4 | 8 | 12;
    paymentMethodId: string;
  }) {
    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  }

  async getSubscriptions() {
    return this.request('/subscriptions');
  }

  async getSubscription(id: string) {
    return this.request(`/subscriptions/${id}`);
  }

  // Orders endpoints
  async getOrders() {
    return this.request('/orders');
  }

  async createOrder(orderData: {
    subscriptionId: string;
    notes?: string;
    addons?: Array<{ addonId: string; quantity: number }>;
  }) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrder(id: string, orderData: {
    notes?: string;
    addons?: Array<{ addonId: string; quantity: number }>;
  }) {
    return this.request(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  // Addons endpoints
  async getAddons() {
    return this.request('/addons');
  }

  // Payment endpoints
  async createPaymentIntent(subscriptionId: string) {
    return this.request('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ subscriptionId }),
    });
  }

  async processSubscriptionPayment(data: {
    subscriptionId: string;
    paymentMethodId: string;
    amount: number;
  }) {
    return this.request('/payments/process-subscription', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async processAddonPayment(orderId: string, paymentMethodId: string) {
    return this.request('/payments/process-addon', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentMethodId }),
    });
  }

  async getCustomerPaymentMethods() {
    return this.request('/payments/payment-methods');
  }

  async savePaymentMethod(paymentMethodId: string) {
    return this.request('/payments/save-payment-method', {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId }),
    });
  }

  async deletePaymentMethod(paymentMethodId: string) {
    return this.request(`/payments/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
    });
  }

  async getPaymentHistory(limit = 20, offset = 0) {
    return this.request('/payments/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Order management endpoints
  async getOrder(orderId: string) {
    return this.request(`/orders/${orderId}`);
  }

  async lockOrder(orderId: string) {
    return this.request(`/orders/${orderId}/lock`, {
      method: 'POST',
    });
  }

  async fulfillOrder(orderId: string) {
    return this.request(`/orders/${orderId}/fulfill`, {
      method: 'POST',
    });
  }

  async cancelOrder(orderId: string) {
    return this.request(`/orders/${orderId}/cancel`, {
      method: 'POST',
    });
  }

  // Notification endpoints
  async getUserNotifications(limit = 20, offset = 0) {
    return this.request('/notifications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService(); 