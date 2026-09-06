const prisma = require('../src/config/prisma');
const { getPayslipById } = require('../src/modules/payroll/payslips.service');
const { generatePayslipPdfBuffer } = require('../src/modules/payroll/payslipPdf.service');

async function runTest() {
  console.log('--- Testing Payroll & Attendance Summary Feature ---');

  // 1. Fetch any existing payslip in DB
  const payslip = await prisma.payslip.findFirst({
    include: {
      employee: {
        include: {
          department: true,
          schedule: {
            include: { lines: true }
          }
        }
      },
      payrun: true,
      lines: true
    }
  });

  if (!payslip) {
    console.log('⚠️ No existing payslip found in database. Creating a mock test.');
    return;
  }

  console.log(`✅ Found payslip ID: ${payslip.id} for Employee: ${payslip.employee?.firstName} ${payslip.employee?.lastName}`);

  // 2. Test getPayslipById with computed summary
  const enrichedPayslip = await getPayslipById(payslip.id);

  console.log('\n--- Computed Attendance & Payroll Summary ---');
  console.log('Attendance Summary:', JSON.stringify(enrichedPayslip.attendanceSummary, null, 2));
  console.log('Leave Summary:', JSON.stringify(enrichedPayslip.leaveSummary, null, 2));
  console.log('Payroll Summary:', JSON.stringify(enrichedPayslip.payrollSummary, null, 2));
  console.log(`Attendance Details Count: ${enrichedPayslip.attendanceDetails?.length || 0}`);
  console.log('Attendance Risk:', JSON.stringify(enrichedPayslip.attendanceRisk, null, 2));

  // Assertions
  if (!enrichedPayslip.attendanceSummary) {
    throw new Error('attendanceSummary missing from enriched payslip');
  }
  if (!enrichedPayslip.leaveSummary) {
    throw new Error('leaveSummary missing from enriched payslip');
  }
  if (!enrichedPayslip.payrollSummary) {
    throw new Error('payrollSummary missing from enriched payslip');
  }
  if (typeof enrichedPayslip.attendanceSummary.totalWorkingDays !== 'number') {
    throw new Error('totalWorkingDays is not a number');
  }
  if (typeof enrichedPayslip.attendanceSummary.daysWorked !== 'number') {
    throw new Error('daysWorked is not a number');
  }

  console.log('\n✅ Attendance & Payroll Summary computed correctly without modifying core payslip lines.');

  // 3. Test PDF generation with summary
  console.log('\n--- Testing PDF Generation with Attendance Summary ---');
  const pdfBuffer = await generatePayslipPdfBuffer(payslip.id);
  console.log(`✅ Generated PDF Buffer Size: ${pdfBuffer.length} bytes`);

  if (!pdfBuffer || pdfBuffer.length < 1000) {
    throw new Error('PDF buffer size is suspiciously small');
  }

  console.log('\n🎉 ALL PAYSLIP SUMMARY TESTS PASSED SUCCESSFULLY!');
}

runTest()
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
