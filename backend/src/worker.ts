#!/usr/bin/env node
import 'dotenv/config';
import { initQueues } from './config/queues.js';
import { workers } from './workers/index.js';
import { init as initDashboard } from './dashboard/index.js';

// Initialize database connection
import { db } from './config/database.js';
import { sql } from 'drizzle-orm';

async function startWorker() {
  console.log('🚀 Starting CSA Worker Process...');
  
  try {
    // Test database connection
    try {
      await db.execute(sql`SELECT 1`);
      console.log('✅ Worker database connection established');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      process.exit(1);
    }

    // Initialize queues
    initQueues();
    console.log('✅ BullMQ queues initialized');

    // Start dashboard (optional)
    if (process.env.ENABLE_DASHBOARD === 'true') {
      initDashboard();
      console.log('✅ BullMQ dashboard started');
    }

    console.log('🎯 CSA Workers are ready to process jobs:');
    console.log('  - Order Processing Worker: 5 concurrent jobs');
    console.log('  - Notification Worker: 3 concurrent jobs');
    console.log('  - Payment Worker: 2 concurrent jobs');
    console.log('  - Subscription Worker: 1 concurrent job');
    
    if (process.env.ENABLE_DASHBOARD === 'true') {
      console.log('  - Dashboard: http://localhost:4000');
    }

    // Keep the process running
    setInterval(() => {
      // Heartbeat to keep process alive
    }, 30000);

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start the worker
startWorker().catch(error => {
  console.error('❌ Worker startup failed:', error);
  process.exit(1);
}); 