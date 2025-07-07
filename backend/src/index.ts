import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { generalRateLimit } from './middlewares/rate-limit.js';
import { initQueues } from './config/queues.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import orderRoutes from './routes/order.routes.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression() as unknown as express.RequestHandler);

// Rate limiting
app.use(generalRateLimit as unknown as express.RequestHandler);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'CSA Management API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/orders', orderRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.PORT;

// Initialize queues
initQueues();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${config.NODE_ENV}`);
  console.log(`🔄 Queues initialized`);
});

export default app; 