const http = require('http');
const { execSync } = require('child_process');
const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');

function killPortProcess(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && pid != process.pid) {
            console.log(`🧹 Auto-clearing conflicting process PID ${pid} on port ${port}...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          }
        }
      }
    }
  } catch (e) {}
}

async function startServer() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('✓ Successfully connected to PostgreSQL database');

    const server = http.createServer(app);

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${env.PORT} busy. Auto-clearing conflicting process on port ${env.PORT}...`);
        killPortProcess(env.PORT);
        setTimeout(() => {
          try {
            server.close();
          } catch (e) {}
          server.listen(env.PORT);
        }, 500);
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
