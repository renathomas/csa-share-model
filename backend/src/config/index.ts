import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/csa_management',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // Twilio
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  
  // Email
  EMAIL_HOST: process.env.EMAIL_HOST || 'localhost',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587'),
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@csa-management.com',
  
  // App Configuration
  CSA_CONFIG: {
    boxSizes: [
      { size: 'small', name: 'Small Box', description: 'Perfect for 1-2 people', price: 25.00 },
      { size: 'large', name: 'Large Box', description: 'Perfect for 3-4 people', price: 40.00 }
    ],
    fulfillmentOptions: [
      { 
        type: 'delivery', 
        name: 'Home Delivery', 
        description: 'Delivered to your door',
        schedules: [
          { dayOfWeek: 3, fulfillmentTime: '10:00', cutoffHoursBefore: 48 }, // Thursday delivery
          { dayOfWeek: 6, fulfillmentTime: '10:00', cutoffHoursBefore: 48 }  // Saturday delivery
        ]
      },
      { 
        type: 'pickup', 
        name: 'Farm Pickup', 
        description: 'Pick up at the farm',
        schedules: [
          { dayOfWeek: 2, fulfillmentTime: '14:00', cutoffHoursBefore: 24 }, // Tuesday pickup
          { dayOfWeek: 5, fulfillmentTime: '14:00', cutoffHoursBefore: 24 }  // Friday pickup
        ]
      }
    ],
    paymentIntervals: [
      { weeks: 4, name: '4 Week Plan', description: 'Monthly payment', discount: 0 },
      { weeks: 8, name: '8 Week Plan', description: 'Bi-monthly payment', discount: 0.05 },
      { weeks: 12, name: '12 Week Plan', description: 'Quarterly payment', discount: 0.10 }
    ]
  }
};

export default config; 