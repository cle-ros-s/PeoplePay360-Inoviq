const prisma = require('../src/config/prisma.js');

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'ethan', mode: 'insensitive' } },
        { name: { contains: 'ethan', mode: 'insensitive' } }
      ]
    },
    include: {
      employee: {
        include: {
          attendanceAlerts: true
        }
      }
    }
  });

  console.log('--- USERS MATCHING ETHAN ---');
  console.log(JSON.stringify(users, null, 2));

  const employees = await prisma.employee.findMany({
    where: {
      OR: [
        { firstName: { contains: 'ethan', mode: 'insensitive' } },
        { lastName: { contains: 'ethan', mode: 'insensitive' } },
        { email: { contains: 'ethan', mode: 'insensitive' } }
      ]
    },
    include: {
      user: true,
      attendanceAlerts: true
    }
  });

  console.log('--- EMPLOYEES MATCHING ETHAN ---');
  console.log(JSON.stringify(employees, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
