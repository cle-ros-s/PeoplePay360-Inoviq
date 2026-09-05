const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');

async function startServer() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('✓ Successfully connected to PostgreSQL database');

    const server = app.listen(env.PORT, () => {
      console.log(`✓ PeoplePay360 Backend API server running on port ${env.PORT}`);
      console.log(`✓ Health endpoint: http://localhost:${env.PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\nShutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✓ PostgreSQL disconnected. Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('FATAL: Could not start server:', error);
    process.exit(1);
  }
}

startServer();
