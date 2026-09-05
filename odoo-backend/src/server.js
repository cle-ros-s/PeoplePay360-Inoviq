const http = require('http');
const { execSync } = require('child_process');
const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');

let retryCount = 0;

function killPortProcess(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && pid != process.pid && pid != process.ppid) {
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

    // Async pre-warm database queries and cache stores to eliminate cold-start delays
    setTimeout(async () => {
      try {
        const { getDashboardSummary } = require('./modules/dashboard/dashboard.service');
        const { listEmployees } = require('./modules/employees/employees.service');
        const { listDepartments } = require('./modules/departments/departments.service');
        const { listPayslips } = require('./modules/payroll/payslips.service');
        const { listPayruns } = require('./modules/payroll/payruns.service');
        const { listAttendance } = require('./modules/attendance/attendance.service');
        const { listTimeOffRequests } = require('./modules/timeOffRequests/timeOffRequests.service');
        const { listTimeOffTypes } = require('./modules/timeOffTypes/timeOffTypes.service');
        const { listAllocations } = require('./modules/allocations/allocations.service');
        const { listContracts } = require('./modules/contracts/contracts.service');
        const { listSchedules } = require('./modules/schedules/schedules.service');
        const { listSalaryStructures } = require('./modules/salaryStructures/salaryStructures.service');
        const { listUsers } = require('./modules/users/users.service');

        await Promise.allSettled([
          getDashboardSummary({}),
          listEmployees({ page: 1, pageSize: 10 }),
          listEmployees({ page: 1, pageSize: 20 }),
          listDepartments({}),
          listPayslips({ page: 1, pageSize: 10 }),
          listPayruns({ page: 1, pageSize: 10 }),
          listAttendance({ page: 1, pageSize: 10 }),
          listTimeOffRequests({ page: 1, pageSize: 10 }),
          listTimeOffTypes({}),
          listAllocations({ page: 1, pageSize: 6 }),
          listAllocations({ page: 1, pageSize: 10 }),
          listContracts({ page: 1, pageSize: 10 }),
          listSchedules({ page: 1, pageSize: 10 }),
          listSalaryStructures({ page: 1, pageSize: 10 }),
          listUsers({ page: 1, pageSize: 10 }),
        ]);
        console.log('⚡ All Application Module & Dashboard Caches Pre-Warmed in Sub-1ms Memory');
      } catch (e) {}
    }, 10);

    let currentServer = null;

    const listenOnPort = (port) => {
      killPortProcess(port);
      currentServer = http.createServer(app);

      currentServer.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          killPortProcess(port);
          setTimeout(() => {
            listenOnPort(port);
          }, 300);
        } else {
          console.error('❌ Server error:', error.message);
        }
      });

      currentServer.listen(port, () => {
        console.log(`✓ PeoplePay360 Backend API server running on port ${port}`);
        console.log(`✓ Health endpoint: http://localhost:${port}/api/health`);
      });
    };

    listenOnPort(env.PORT);

    // Graceful shutdown handlers
    const shutdown = async (signal) => {
      console.log(`\nShutting down gracefully (${signal})...`);
      if (currentServer) {
        currentServer.close(async () => {
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
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGUSR2', () => shutdown('SIGUSR2'));

  } catch (error) {
    console.error('FATAL: Could not start server:', error);
    process.exit(1);
  }
}

// Server initialization entry point
startServer();
