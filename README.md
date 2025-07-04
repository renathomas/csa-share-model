# 🥬 CSA Management System - MVP Demo

A comprehensive CSA (Community Supported Agriculture) management platform built for technical interview demonstration, showcasing the **Share Purchase Model** implementation.

## 🚀 Overview

This project demonstrates a complete end-to-end solution for managing CSA subscriptions with the Share Purchase payment model, where customers pay upfront for a fixed number of orders that are fulfilled over time.

### 🎯 Key Features Implemented

- **Share Purchase Model**: Customers pay upfront for 4, 8, or 12 weeks of orders
- **Subscription Management**: Create, view, and manage CSA subscriptions
- **Order Lifecycle**: Automated order creation with cutoff times and notifications
- **User Authentication**: Secure JWT-based authentication system
- **Real-time Dashboard**: Interactive customer dashboard with subscription analytics
- **Modern UI**: Responsive design built with Tailwind CSS and Svelte

## 🏗️ Architecture

### Frontend
- **Framework**: Vite + Svelte 5 + TypeScript
- **Styling**: Tailwind CSS 4.0
- **State Management**: Svelte Stores
- **API Communication**: Custom API service with authentication

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Job Queue**: BullMQ with Redis (configured, ready for implementation)
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod schemas for type-safe API validation

### Shared
- **Type System**: Shared TypeScript types and Zod schemas
- **Workspace**: Monorepo structure for consistency

## 📋 Requirements

- Node.js 18+ and npm 8+
- PostgreSQL database
- Redis server (for job queue - optional for MVP demo)

## ⚡ Quick Start

### 1. Clone and Install Dependencies

```bash
# Install workspace dependencies
npm install

# Install frontend and backend dependencies
npm run install:all
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb csa_management

# Copy environment variables
cp backend/env.example backend/.env

# Update DATABASE_URL in backend/.env
DATABASE_URL=postgresql://username:password@localhost:5432/csa_management
```

### 3. Generate Database Schema

```bash
cd backend
npm run db:generate
npm run db:migrate
```

### 4. Start Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

## 🗂️ Project Structure

```
csa-management/
├── frontend/                 # Vite + Svelte frontend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── stores/       # Svelte state management
│   │   │   └── services/     # API communication layer
│   │   └── App.svelte        # Main application component
│   └── package.json
├── backend/                  # Node.js + Express backend
│   ├── src/
│   │   ├── config/           # Database and app configuration
│   │   ├── controllers/      # Route handlers
│   │   ├── middlewares/      # Express middlewares
│   │   ├── models/           # Drizzle database schemas
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic layer
│   │   └── index.ts          # Server entry point
│   ├── drizzle.config.ts     # Database configuration
│   └── package.json
├── packages/
│   └── shared/               # Shared types and utilities
│       ├── src/
│       │   ├── types.ts      # TypeScript interfaces
│       │   └── schemas.ts    # Zod validation schemas
│       └── package.json
└── package.json              # Workspace configuration
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Subscriptions
- `POST /api/subscriptions` - Create new subscription
- `GET /api/subscriptions` - Get user subscriptions
- `GET /api/subscriptions/:id` - Get specific subscription

### System
- `GET /health` - API health check

## 💡 Key Implementation Details

### Share Purchase Model Flow

1. **Customer Selection**: Choose box size, fulfillment method, and payment interval
2. **Upfront Payment**: Pay for entire subscription period (4, 8, or 12 weeks)
3. **Order Fulfillment**: Orders are created and fulfilled according to schedule
4. **Auto-Enrollment**: When orders are exhausted, automatically enroll in next period

### Database Schema

The system uses a normalized PostgreSQL schema with the following key tables:

- **users**: Customer information and authentication
- **subscriptions**: Share purchase subscriptions with order counts
- **orders**: Individual order instances with fulfillment tracking
- **payments**: Payment history and transaction tracking
- **notifications**: SMS reminder system (configured for future implementation)

### Frontend Architecture

- **Component-based**: Modular Svelte components for reusability
- **Reactive State**: Svelte stores for real-time UI updates
- **Type Safety**: Full TypeScript integration with shared types
- **Modern UI**: Tailwind CSS for responsive, professional design

## 🎨 UI Components

### Dashboard Features
- **Welcome Section**: Personalized user greeting
- **Subscription Cards**: Visual subscription status with progress bars
- **Quick Stats**: Active subscriptions, total orders, remaining orders
- **Create Subscription**: Modal form for new subscription creation

### Authentication
- **Login/Register**: Unified form with toggle between modes
- **Form Validation**: Real-time validation with error handling
- **Auto-login**: Persistent authentication with localStorage

## 🔮 Future Enhancements

The MVP provides a solid foundation for additional features:

### Job Queue System (BullMQ)
- **Order Cutoff Jobs**: Automated order locking 24 hours before fulfillment
- **SMS Notifications**: 24-hour reminders via Twilio
- **Auto-Enrollment**: Automatic subscription renewal
- **Payment Processing**: Stripe payment integration

### Advanced Features
- **Add-on Management**: Additional items with separate billing
- **Admin Dashboard**: Farm management interface
- **Order Customization**: Customer order modification before cutoff
- **Analytics**: Subscription and order analytics
- **Multi-farm Support**: Platform for multiple CSA operations

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm start
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder to CDN or static hosting
```

## 📝 Environment Variables

Create `backend/.env` with the following variables:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://localhost:5432/csa_management

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# External Services (for future implementation)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## 🤝 Technical Interview Context

This project demonstrates:

- **Full-stack Development**: Complete frontend and backend implementation
- **Database Design**: Normalized schema with proper relationships
- **API Design**: RESTful endpoints with proper error handling
- **Type Safety**: End-to-end TypeScript with shared type definitions
- **Modern Tooling**: Latest versions of frameworks and development tools
- **Code Organization**: Clean architecture with separation of concerns
- **UI/UX Design**: Professional, responsive user interface
- **Business Logic**: Complex subscription and payment model implementation

## 📞 Support

For questions about the implementation or architecture decisions, please refer to the code comments and documentation within the respective modules.

---

**Built with ❤️ for the CSA Management Technical Interview** 