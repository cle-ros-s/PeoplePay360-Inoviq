const http = require('http');
const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');

async function startServer() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('✓ Successfully connected to PostgreSQL database');

    const server = http.createServer(app);

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${env.PORT} is temporarily busy (EADDRINUSE). Retrying listen in 1s...`);
        setTimeout(() => {
          try {
            server.close();
          } catch (e) {}
          server.listen(env.PORT);
        }, 1000);
      } else {
        console.error('❌ Server error:', error.message);
        process.exit(1);
      }
    });

    // Graceful shutdown handlers
    const shutdown = async (signal) => {
      console.log(`\nShutting down gracefully (${signal})...`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
        } catch (e) {}
        console.log('✓ PostgreSQL disconnected. Server closed.');
        if (signal === 'SIGUSR2') {
          process.kill(process.pid, 'SIGUSR2');
        } else {
          process.exit(0);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGUSR2', () => shutdown('SIGUSR2'));

    server.listen(env.PORT, () => {
      console.log(`✓ PeoplePay360 Backend API server running on port ${env.PORT}`);
      console.log(`✓ Health endpoint: http://localhost:${env.PORT}/api/health`);
    });

  } catch (error) {
    console.error('FATAL: Could not start server:', error);
    process.exit(1);
  }
}

// Server initialization entry point
startServer();
