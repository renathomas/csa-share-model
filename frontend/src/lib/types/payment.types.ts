export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingDetails: {
    name: string;
    email: string;
    phone?: string;
  };
  isDefault: boolean;
  createdAt: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'processing' | 'canceled';
  createdAt: string;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  description: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface SubscriptionPayment {
  subscriptionId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  createdAt: string;
}

export interface PaymentError {
  type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error';
  code: string;
  message: string;
  declineCode?: string;
}

export interface BillingDetails {
  name: string;
  email: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
} 