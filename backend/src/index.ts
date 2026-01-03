import dotenv from 'dotenv';


import express from 'express';
import cors from 'cors';
import { permissionsRouter } from './api/permissions.js';
import { distributionRouter } from './api/distribution.js';
import { initDatabase } from './db/index.js';
import { SESSION_ACCOUNT_ADDRESS } from './config/clients.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'PulseKeeper Backend',
    sessionAccount: SESSION_ACCOUNT_ADDRESS || 'not configured'
  });
});

// Routes
app.use('/api/permissions', permissionsRouter);
app.use('/api/distribution', distributionRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database and start server
async function start() {
  try {
    console.log('🔌 Connecting to database...');
    await initDatabase();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀 PulseKeeper Backend running on port ${PORT}`);
      console.log(`📡 Permissions API: http://localhost:${PORT}/api/permissions`);
      console.log(`💸 Distribution API: http://localhost:${PORT}/api/distribution`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
