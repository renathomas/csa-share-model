import { apiService } from './api.service';

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

export interface ProcessPaymentRequest {
  subscriptionId: string;
  paymentMethodId: string;
  amount: number;
}

export interface ProcessPaymentResponse {
  success: boolean;
  paymentIntent?: any;
  subscription?: any;
  error?: string;
}

export class PaymentService {
  /**
   * Create payment intent for subscription
   */
  async createPaymentIntent(subscriptionId: string): Promise<PaymentIntentResponse> {
    const response = await apiService.createPaymentIntent(subscriptionId);
    return response.data;
  }

  /**
   * Process subscription payment
   */
  async processSubscriptionPayment(data: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    const response = await apiService.processSubscriptionPayment(data);
    return response.data;
  }

  /**
   * Process addon payment
   */
  async processAddonPayment(orderId: string, paymentMethodId: string): Promise<ProcessPaymentResponse> {
    const response = await apiService.processAddonPayment(orderId, paymentMethodId);
    return response.data;
  }

  /**
   * Get customer payment methods
   */
  async getCustomerPaymentMethods(): Promise<any[]> {
    const response = await apiService.getCustomerPaymentMethods();
    return response.data;
  }

  /**
   * Save payment method
   */
  async savePaymentMethod(paymentMethodId: string): Promise<any> {
    const response = await apiService.savePaymentMethod(paymentMethodId);
    return response.data;
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    await apiService.deletePaymentMethod(paymentMethodId);
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(limit = 20, offset = 0) {
    const response = await apiService.getPaymentHistory(limit, offset);
    return response.data;
  }

  /**
   * Calculate subscription total with discount
   */
  calculateSubscriptionTotal(basePrice: number, paymentInterval: number): {
    basePrice: number;
    discount: number;
    finalPrice: number;
    savings: number;
  } {
    let discount = 0;
    if (paymentInterval === 8) discount = 0.05; // 5% discount for 8 weeks
    if (paymentInterval === 12) discount = 0.10; // 10% discount for 12 weeks

    const totalBase = basePrice * paymentInterval;
    const savings = totalBase * discount;
    const finalPrice = totalBase - savings;

    return {
      basePrice: totalBase,
      discount,
      finalPrice,
      savings,
    };
  }
}

export const paymentService = new PaymentService(); 