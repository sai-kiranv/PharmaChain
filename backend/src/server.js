const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('./config/db');

// Route imports
const healthRoutes = require('./routes/healthRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const consumerRoutes = require('./routes/consumerRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const drugRoutes = require('./routes/drugRoutes');
const batchRoutes = require('./routes/batchRoutes');
const storageLocationRoutes = require('./routes/storageLocationRoutes');
const batchStorageRoutes = require('./routes/batchStorageRoutes');
const custodyTransferRoutes = require('./routes/custodyTransferRoutes');
const complianceCheckRoutes = require('./routes/complianceCheckRoutes');
const verificationLogRoutes = require('./routes/verificationLogRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount API routes
app.use('/api', healthRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/consumers', consumerRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/storage-locations', storageLocationRoutes);
app.use('/api/batch-storage', batchStorageRoutes);
app.use('/api/custody-transfers', custodyTransferRoutes);
app.use('/api/compliance-checks', complianceCheckRoutes);
app.use('/api/verification-logs', verificationLogRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    project: 'PharmaChain DBMS REST API',
    database: 'Oracle Database 21c Express Edition',
    status: 'ONLINE',
    endpoints: {
      health: '/api/health',
      schema_tables: '/api/schema/tables',
      analytics: '/api/analytics/overview',
      consumers: '/api/consumers',
      organizations: '/api/organizations',
      drugs: '/api/drugs',
      batches: '/api/batches',
      storage_locations: '/api/storage-locations',
      batch_storage: '/api/batch-storage',
      custody_transfers: '/api/custody-transfers',
      compliance_checks: '/api/compliance-checks',
      verification_logs: '/api/verification-logs'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.friendlyMessage || err.message || 'Internal Server Error'
  });
});

// Start server & initialize connection pool
let server;
async function startServer() {
  try {
    console.log('[PharmaChain Server] Connecting to Oracle Database...');
    await db.initializePool();

    // Verify initial health check
    const isHealthy = await db.checkHealth();
    if (isHealthy) {
      console.log('[PharmaChain Server] Oracle Health Check PASSED: SELECT 1 FROM dual succeeded.');
    }

    server = app.listen(PORT, () => {
      console.log(`[PharmaChain Server] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[PharmaChain Server] Fatal startup failure:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n[PharmaChain Server] Received ${signal}. Closing HTTP server and Oracle pool...`);
  if (server) {
    server.close(async () => {
      await db.closePool();
      console.log('[PharmaChain Server] Shutdown complete.');
      process.exit(0);
    });
  } else {
    await db.closePool();
    process.exit(0);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
