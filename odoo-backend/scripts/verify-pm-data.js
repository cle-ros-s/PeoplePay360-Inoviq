const prisma = require('../src/config/prisma.js');
const { signToken } = require('../src/utils/jwt.js');

async function test() {
  const pmUser = await prisma.user.findFirst({
    where: { role: 'HR_PAYROLL_MANAGER' }
  });
  const token = signToken(pmUser);

  // 1. Employees
  const empRes = await fetch('http://localhost:5000/api/employees?search=Ethan', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const empJson = await empRes.json();
  console.log('Employees found for Ethan:', empJson.data?.length || 0);

  // 2. Attendance
  const attRes = await fetch('http://localhost:5000/api/attendance', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const attJson = await attRes.json();
  console.log('Total attendance records for PM:', attJson.total || attJson.data?.length || 0);

  // 3. Payslips
  const psRes = await fetch('http://localhost:5000/api/payslips', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const psJson = await psRes.json();
  console.log('Total payslips for PM:', psJson.total || psJson.data?.length || 0);

  // 4. Attendance Alerts
  const alRes = await fetch('http://localhost:5000/api/attendance-alerts?search=Ethan', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const alJson = await alRes.json();
  console.log('Attendance alerts for Ethan:', alJson.total || alJson.data?.length || 0);

  await prisma.$disconnect();
}
test().catch(console.error);
