const prisma = require('../src/config/prisma.js');
const { signToken } = require('../src/utils/jwt.js');

async function testEthanDashboard() {
  const ethanUser = await prisma.user.findFirst({
    where: { email: 'ethan.hunt@payflux.com' },
    include: { employee: true }
  });

  if (!ethanUser) {
    console.error('Ethan user not found');
    process.exit(1);
  }

  const token = signToken(ethanUser);

  const endpoints = [
    '/api/dashboard/summary',
    '/api/dashboard/kpis',
    '/api/dashboard/salary-cost-by-department',
    '/api/dashboard/net-salary-trend',
    '/api/dashboard/attendance-overview',
    '/api/dashboard/time-off-overview',
    '/api/employees?pageSize=10',
    '/api/attendance-alerts/my-alert'
  ];

  console.log(`--- Testing Dashboard Endpoints for Ethan (${ethanUser.email}, Role: ${ethanUser.role}) ---`);

  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:5000${ep}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log(`\nEndpoint: ${ep}`);
      console.log(`Status: ${res.status}`);
      console.log(`Response:`, JSON.stringify(data, null, 2).slice(0, 300));
    } catch (err) {
      console.error(`Error on ${ep}:`, err.message);
    }
  }

  await prisma.$disconnect();
}

testEthanDashboard().catch(console.error);
