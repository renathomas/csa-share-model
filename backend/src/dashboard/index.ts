import express from 'express';
import basicAuth from 'express-basic-auth';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import { initQueues, queues, queueSpecs } from '../config/queues.js';
import { config } from '../config/index.js';

let server: any = null;

function init() {
  const dashboardBasePath = '/';
  
  // Initialize queues
  initQueues();
  
  const queuesAdapters = [];
  
  for (const queueSpec of queueSpecs) {
    const queue = queues[queueSpec.key];
    if (queue) {
      queuesAdapters.push(
        new BullMQAdapter(queue, {
          readOnlyMode: queueSpec.readOnlyMode,
          allowRetries: queueSpec.allowRetries,
          description: queueSpec.description,
        })
      );
    }
  }
  
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(dashboardBasePath);
  
  createBullBoard({
    queues: queuesAdapters,
    serverAdapter,
    options: {
      uiConfig: {
        boardTitle: 'CSA Management Dashboard',
        boardLogo: {
          path: `${dashboardBasePath}/img/logo.png`,
          width: '32px',
          height: '32px'
        },
        miscLinks: [
          {
            text: 'API Documentation',
            url: '/api/docs'
          },
          {
            text: 'CSA Dashboard',
            url: '/dashboard'
          }
        ],
        favIcon: {
          default: `${dashboardBasePath}/favicon.ico`,
          alternative: `${dashboardBasePath}/favicon.ico`
        }
      },
    },
  });
  
  const app = express();
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      queues: Object.keys(queues).length 
    });
  });
  
  // Queue stats endpoint
  app.get('/api/queue-stats', async (req, res) => {
    try {
      const stats: Record<string, any> = {};
      
      for (const [queueName, queue] of Object.entries(queues)) {
        const waiting = await queue.getWaiting();
        const active = await queue.getActive();
        const completed = await queue.getCompleted();
        const failed = await queue.getFailed();
        
        stats[queueName] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          total: waiting.length + active.length + completed.length + failed.length
        };
      }
      
      res.json(stats);
    } catch (error) {
      console.error('Error getting queue stats:', error);
      res.status(500).json({ error: 'Failed to get queue stats' });
    }
  });
  
  // Basic auth middleware
  app.use(
    dashboardBasePath,
    basicAuth({
      users: {
        [process.env.QUEUES_DASHBOARD_USER || 'admin']: process.env.QUEUES_DASHBOARD_PASSWORD || 'password'
      },
      challenge: true,
      realm: 'csa-dashboard',
    }) as any,
    serverAdapter.getRouter()
  );
  
  const port = parseInt(process.env.DASHBOARD_PORT || '4000');
  
  server = app.listen(port, () => {
    console.log(`🚀 CSA BullMQ Dashboard started at http://localhost:${port}`);
    console.log(`👤 Username: ${process.env.QUEUES_DASHBOARD_USER || 'admin'}`);
    console.log(`🔑 Password: ${process.env.QUEUES_DASHBOARD_PASSWORD || 'password'}`);
    console.log(`📊 Queue Stats: http://localhost:${port}/api/queue-stats`);
    console.log(`💚 Health Check: http://localhost:${port}/health`);
  });
}

function teardown() {
  if (server) {
    server.close((err: any) => {
      if (err) {
        console.error('Error closing dashboard server:', err);
      } else {
        console.log('Dashboard server closed successfully');
      }
    });
  }
  console.log('Dashboard teardown completed');
}

// Handle graceful shutdown
process.on('SIGTERM', teardown);
process.on('SIGINT', teardown);

export { init, teardown };

// Start dashboard if this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  init();
} 