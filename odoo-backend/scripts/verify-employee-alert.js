const prisma = require('../src/config/prisma.js');
const { signToken } = require('../src/utils/jwt.js');

async function test() {
  const user = await prisma.user.findFirst({
    where: { email: 'ethan.hunt@payflux.com' },
    include: { employee: true }
  });
  console.log('User found:', user?.email, user?.role, 'Employee ID:', user?.employee?.id);
  
  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employee?.id
  });

  const res = await fetch('http://localhost:5000/api/attendance-alerts/my-alert', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  console.log('Status code:', res.status);
  console.log('Employee Alert Response:');
  console.log(JSON.stringify(data, null, 2));

  await prisma.$disconnect();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
