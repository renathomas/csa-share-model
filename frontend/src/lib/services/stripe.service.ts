import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

export class StripeService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  async initialize() {
    this.stripe = await getStripe();
    if (this.stripe) {
      this.elements = this.stripe.elements();
    }
    return this.stripe;
  }

  createCardElement() {
    if (!this.elements) {
      throw new Error('Stripe elements not initialized');
    }

    return this.elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#9e2146',
        },
      },
    });
  }

  async createPaymentMethod(cardElement: any, billingDetails: {
    name: string;
    email: string;
    phone?: string;
  }) {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const result = await this.stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: billingDetails,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.paymentMethod;
  }

  async confirmPayment(clientSecret: string, paymentMethodId: string) {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const result = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.paymentIntent;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}

export const stripeService = new StripeService(); 