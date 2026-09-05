const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAllocationFlow() {
  console.log('Testing Leave Allocation creation & dashboard metrics...');
  
  // Find an employee and time off type
  const emp = await prisma.employee.findFirst({
    include: { user: true }
  });
  const tot = await prisma.timeOffType.findFirst();

  console.log(`Using Employee: ${emp.firstName} ${emp.lastName} (${emp.id})`);
  console.log(`Using TimeOffType: ${tot.name} (${tot.id})`);

  // Create an allocation
  const alloc = await prisma.leaveAllocation.create({
    data: {
      employeeId: emp.id,
      timeOffTypeId: tot.id,
      allocatedAmount: 30.0,
      takenAmount: 0.0,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      validTo: new Date('2026-12-31T23:59:59Z'),
      status: 'APPROVED'
    }
  });

  console.log(`Created allocation: ${alloc.id} with status ${alloc.status}`);

  // Count active allocations
  const activeCount = await prisma.leaveAllocation.count({
    where: { status: 'APPROVED' }
  });

  console.log(`Total Active Allocations in DB: ${activeCount}`);
}

testAllocationFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
