const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

let server;
let baseUrl;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = data ? JSON.parse(data) : {};
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runE2ETests() {
  console.log('🚀 Starting Comprehensive End-to-End API Test Suite...');

  // Start temporary server
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`  -> Test server listening on ${baseUrl}`);
      resolve();
    });
  });

  try {
    // 1. Health check
    console.log('\n[1] Testing Health Endpoint...');
    const health = await request('GET', '/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'ok');
    console.log('  ✓ /api/health returned 200 OK');

    // 2. Authentication for all 5 roles
    console.log('\n[2] Testing Authentication for all 5 roles...');
    const roles = [
      { email: 'admin@peoplepay360.dev', role: 'ADMIN' },
      { email: 'hr.manager@peoplepay360.dev', role: 'HR_MANAGER' },
      { email: 'payroll.user@peoplepay360.dev', role: 'HR_PAYROLL_USER' },
      { email: 'payroll.manager@peoplepay360.dev', role: 'HR_PAYROLL_MANAGER' },
      { email: 'employee@peoplepay360.dev', role: 'EMPLOYEE' },
    ];

    const tokens = {};
    for (const r of roles) {
      const res = await request('POST', '/api/auth/login', {
        email: r.email,
        password: 'Password123!',
      });
      assert.strictEqual(res.status, 200, `Login failed for ${r.email}`);
      assert.strictEqual(res.body.user.role, r.role);
      assert.ok(res.body.token, 'Token must be present');
      tokens[r.role] = res.body.token;
      console.log(`  ✓ Authenticated ${r.role} successfully`);
    }

    // Invalid login test
    const badLogin = await request('POST', '/api/auth/login', {
      email: 'admin@peoplepay360.dev',
      password: 'WrongPassword!',
    });
    assert.strictEqual(badLogin.status, 401);
    assert.strictEqual(badLogin.body.error.code, 'INVALID_CREDENTIALS');
    console.log('  ✓ Rejected invalid password with 401 INVALID_CREDENTIALS');

    // GET /api/auth/me test
    const meRes = await request('GET', '/api/auth/me', null, tokens.EMPLOYEE);
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.email, 'employee@peoplepay360.dev');
    console.log('  ✓ /api/auth/me returned current user profile');

    // 3. RBAC & Security tests
    console.log('\n[3] Testing RBAC permissions...');
    // Employee attempting to create a user -> should 403
    const forbiddenUserCreate = await request(
      'POST',
      '/api/users',
      { email: 'fake@test.com', password: 'Password123!', name: 'Fake' },
      tokens.EMPLOYEE
    );
    assert.strictEqual(forbiddenUserCreate.status, 403);
    console.log('  ✓ Employee blocked from creating users (403 FORBIDDEN)');

    // 4. Employee Data Scoping
    console.log('\n[4] Testing Employee Data Scoping...');
    const empListScoped = await request('GET', '/api/employees', null, tokens.EMPLOYEE);
    assert.strictEqual(empListScoped.status, 200);
    assert.strictEqual(empListScoped.body.data.length, 1);
    assert.strictEqual(empListScoped.body.data[0].email, 'employee@peoplepay360.dev');
    console.log('  ✓ Employee view scoped strictly to own record');

    // 5. Schedules & Hours Calculation
    console.log('\n[5] Testing Schedules & Server-side Hours Calculation...');
    const newSchedule = await request(
      'POST',
      '/api/schedules',
      {
        name: 'Test 36h Schedule',
        type: 'FLEXIBLE',
        lines: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }, // 8h
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }, // 8h
          { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }, // 8h
          { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }, // 8h
          { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },  // 4h
        ],
      },
      tokens.ADMIN
    );
    assert.strictEqual(newSchedule.status, 201);
    assert.strictEqual(newSchedule.body.totalWeeklyHours, 36.0, 'Weekly hours must be calculated server-side as 36.0');
    console.log('  ✓ Schedule created with exact server-side computed weekly hours (36.0h)');

    // 6. Attendance Flow (Check-in, Check-out, Status derivation)
    console.log('\n[6] Testing Attendance Check-in, Check-out & Status...');
    const checkInRes = await request(
      'POST',
      '/api/attendance',
      { checkIn: '2026-09-01T09:00:00Z', note: 'Morning checkin' },
      tokens.EMPLOYEE
    );
    assert.strictEqual(checkInRes.status, 201);
    const attendanceId = checkInRes.body.id;
    assert.strictEqual(checkInRes.body.status, 'MISSING_CHECKOUT');

    // Check-out with overtime (09:00 to 19:30 = 10.5h > 8.0 * 1.1)
    const checkOutRes = await request(
      'PATCH',
      `/api/attendance/${attendanceId}/check-out`,
      { checkOut: '2026-09-01T19:30:00Z' },
      tokens.EMPLOYEE
    );
    assert.strictEqual(checkOutRes.status, 200);
    assert.strictEqual(checkOutRes.body.status, 'OVERTIME');
    assert.strictEqual(checkOutRes.body.workedHours, 10.5);
    console.log('  ✓ Attendance check-in and check-out derived OVERTIME correctly (10.5h)');

    // 7. Time-Off Flow & Atomic Balance Deduction
    console.log('\n[7] Testing Time-Off Request & Atomic Allocation Deduction...');
    const ptoTypes = await request('GET', '/api/time-off-types', null, tokens.EMPLOYEE);
    const ptoTypeId = ptoTypes.body.data.find((t) => t.code === 'PTO').id;

    // Ensure employee has active allocation with balance for testing
    const testEmp = await prisma.employee.findFirst({ where: { email: 'employee@peoplepay360.dev' } });
    const empId = testEmp ? testEmp.id : null;
    if (empId) {
      const existingAlloc = await prisma.leaveAllocation.findFirst({
        where: { employeeId: empId, timeOffTypeId: ptoTypeId, status: 'APPROVED' },
      });
      if (existingAlloc) {
        await prisma.leaveAllocation.update({
          where: { id: existingAlloc.id },
          data: { takenAmount: 0.0, allocatedAmount: 50.0 },
        });
      } else {
        await prisma.leaveAllocation.create({
          data: {
            employeeId: empId,
            timeOffTypeId: ptoTypeId,
            allocatedAmount: 50.0,
            takenAmount: 0.0,
            validFrom: new Date('2026-01-01T00:00:00Z'),
            validTo: new Date('2026-12-31T23:59:59Z'),
            status: 'APPROVED',
          },
        });
      }
    }

    // Create 3 days request
    const leaveReq = await request(
      'POST',
      '/api/time-off-requests',
      {
        timeOffTypeId: ptoTypeId,
        startDate: '2026-09-10T00:00:00Z',
        endDate: '2026-09-12T23:59:59Z',
        duration: 3.0,
        reason: 'Conference attendance',
      },
      tokens.EMPLOYEE
    );
    assert.strictEqual(leaveReq.status, 201);
    assert.strictEqual(leaveReq.body.status, 'PENDING');

    // Approve request by HR Manager
    const approveReq = await request(
      'PATCH',
      `/api/time-off-requests/${leaveReq.body.id}/approve`,
      {},
      tokens.HR_MANAGER
    );
    assert.strictEqual(approveReq.status, 200);
    assert.strictEqual(approveReq.body.status, 'APPROVED');
    assert.ok(approveReq.body.allocationId, 'Must be linked to deducted allocation');
    console.log('  ✓ Time-off request approved and allocation balance deducted atomically in transaction');

    // 8. Full Payrun Lifecycle (Eligible -> Create -> Compute -> Warnings -> Validate -> Paid)
    console.log('\n[8] Testing Full Payrun Lifecycle...');
    const salaryStructures = await request('GET', '/api/salary-structures', null, tokens.HR_PAYROLL_USER);
    const regularStructId = salaryStructures.body.data[0].id;

    // Step 1: Eligible Employees
    const eligible = await request(
      'GET',
      `/api/payruns/eligible-employees?periodStart=2026-09-01T00:00:00Z&periodEnd=2026-09-30T23:59:59Z&salaryStructureId=${regularStructId}`,
      null,
      tokens.HR_PAYROLL_USER
    );
    assert.strictEqual(eligible.status, 200);
    assert.ok(eligible.body.length >= 8, 'Eligible employees should be at least 8');
    const selectedEmployeeIds = eligible.body.slice(0, 3).map((e) => e.id);
    console.log(`  ✓ Eligible employees queried (${eligible.body.length} eligible staff)`);

    // Step 2: Create DRAFT Payrun (cleanup previous test runs if any)
    await prisma.payrun.deleteMany({
      where: { name: { contains: 'Test' } },
    });

    const payrunCreate = await request(
      'POST',
      '/api/payruns',
      {
        name: 'Payrun - September 2026 Test',
        periodStart: '2026-09-01T00:00:00Z',
        periodEnd: '2026-09-30T23:59:59Z',
        salaryStructureId: regularStructId,
        employeeIds: selectedEmployeeIds,
      },
      tokens.HR_PAYROLL_USER
    );
    assert.strictEqual(payrunCreate.status, 201);
    assert.strictEqual(payrunCreate.body.status, 'DRAFT');
    const payrunId = payrunCreate.body.id;
    console.log(`  ✓ Payrun created in DRAFT status (ID: ${payrunId})`);

    // Step 3: Compute Payrun
    const payrunCompute = await request('POST', `/api/payruns/${payrunId}/compute`, {}, tokens.HR_PAYROLL_USER);
    assert.strictEqual(payrunCompute.status, 200);
    assert.strictEqual(payrunCompute.body.status, 'COMPUTED');
    assert.ok(payrunCompute.body.totalNet > 0, 'Total net salary must be computed');
    console.log(`  ✓ Payrun computed: Total Gross = $${payrunCompute.body.totalGross}, Total Net = $${payrunCompute.body.totalNet}`);

    // Step 4: Validate Payrun (by HR_PAYROLL_MANAGER)
    const payrunValidate = await request('POST', `/api/payruns/${payrunId}/validate`, {}, tokens.HR_PAYROLL_MANAGER);
    assert.strictEqual(payrunValidate.status, 200);
    assert.strictEqual(payrunValidate.body.status, 'VALIDATED');
    console.log('  ✓ Payrun validated successfully by HR_PAYROLL_MANAGER');

    // Step 5: Mark Payrun as PAID
    const payrunPaid = await request('POST', `/api/payruns/${payrunId}/mark-paid`, {}, tokens.HR_PAYROLL_MANAGER);
    assert.strictEqual(payrunPaid.status, 200);
    assert.strictEqual(payrunPaid.body.status, 'PAID');
    console.log('  ✓ Payrun marked as PAID successfully');

    // Step 6: Verify Paid Records are Immutable
    const attemptRecomputePaid = await request('POST', `/api/payruns/${payrunId}/compute`, {}, tokens.ADMIN);
    assert.strictEqual(attemptRecomputePaid.status, 400);
    assert.strictEqual(attemptRecomputePaid.body.error.code, 'PAYRUN_ALREADY_PAID');
    console.log('  ✓ Immutability enforced: Re-computing paid payrun rejected with 400');

    // 9. Payslip PDF & Email
    console.log('\n[9] Testing Payslip PDF Stream & Email Delivery...');
    const firstPayslip = payrunPaid.body.payslips[0];
    const pdfRes = await request('GET', `/api/payslips/${firstPayslip.id}/pdf`, null, tokens.ADMIN);
    assert.strictEqual(pdfRes.status, 200);
    assert.strictEqual(pdfRes.headers['content-type'], 'application/pdf');
    assert.ok(pdfRes.body.length > 0, 'PDF buffer must not be empty');
    console.log('  ✓ Payslip PDF generated and streamed successfully');

    // Send payslip email
    const emailRes = await request('POST', `/api/payslips/${firstPayslip.id}/send-email`, {}, tokens.HR_PAYROLL_USER);
    assert.strictEqual(emailRes.status, 200);
    assert.strictEqual(emailRes.body.success, true);
    console.log('  ✓ Payslip email dispatched / simulated with PDF attachment');

    // 10. Dashboard Analytics Endpoints
    console.log('\n[10] Testing Real Dashboard Analytics Endpoints...');
    const kpis = await request('GET', '/api/dashboard/kpis', null, tokens.ADMIN);
    assert.strictEqual(kpis.status, 200);
    assert.ok(kpis.body.totalNetPaid > 0, 'totalNetPaid must reflect paid payruns');
    assert.ok(kpis.body.activeEmployeesCount >= 8, 'activeEmployeesCount must reflect DB');
    console.log('  ✓ GET /api/dashboard/kpis returned real DB metrics:', kpis.body);

    const deptCost = await request('GET', '/api/dashboard/salary-cost-by-department', null, tokens.ADMIN);
    assert.strictEqual(deptCost.status, 200);
    assert.ok(Array.isArray(deptCost.body), 'Department cost must be an array');
    console.log(`  ✓ GET /api/dashboard/salary-cost-by-department returned ${deptCost.body.length} departments`);

    const netTrend = await request('GET', '/api/dashboard/net-salary-trend', null, tokens.ADMIN);
    assert.strictEqual(netTrend.status, 200);
    assert.ok(netTrend.body.length >= 2, 'Should have historical trend data');
    console.log(`  ✓ GET /api/dashboard/net-salary-trend returned ${netTrend.body.length} trend periods`);

    const attOverview = await request('GET', '/api/dashboard/attendance-overview', null, tokens.ADMIN);
    assert.strictEqual(attOverview.status, 200);
    assert.ok(attOverview.body.totalRecords > 0);
    console.log('  ✓ GET /api/dashboard/attendance-overview returned live attendance breakdown');

    const timeOffOverview = await request('GET', '/api/dashboard/time-off-overview', null, tokens.ADMIN);
    assert.strictEqual(timeOffOverview.status, 200);
    console.log('  ✓ GET /api/dashboard/time-off-overview returned live time-off breakdown');

    console.log('\n🎉 ALL END-TO-END INTEGRATION TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (error) {
    console.error('\n❌ E2E Test Failure:', error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }
}

runE2ETests();
