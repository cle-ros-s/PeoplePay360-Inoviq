const PDFDocument = require('pdfkit');

/**
 * Generates a professional PDF for a given payslip
 * @param {Object} payslip - Full payslip record with lines, employee, contract, salaryStructure, department
 * @returns {Promise<Buffer>} PDF file buffer
 */
function generatePayslipPdfBuffer(payslip) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#1E3A8A'; // Deep Navy
      const secondaryColor = '#3B82F6';
      const textColor = '#1F2937';
      const mutedColor = '#6B7280';
      const successColor = '#059669';
      const borderColor = '#E5E7EB';

      const emp = payslip.employee || {};
      const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
      const formatDateStr = (dateVal) => {
        if (!dateVal) return 'N/A';
        try {
          const d = new Date(dateVal);
          return isNaN(d.getTime()) ? String(dateVal) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
          return String(dateVal);
        }
      };

      // --- HEADER ---
      doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text('PeoplePay360', 50, 50);
      doc.fillColor(mutedColor).fontSize(10).font('Helvetica').text('Human Resource & Payroll Management Platform', 50, 75);

      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text('PAYSLIP', 400, 50, { align: 'right' });
      const periodText = `${formatDateStr(payslip.periodStart)} - ${formatDateStr(payslip.periodEnd)}`;
      doc.fillColor(mutedColor).fontSize(9).font('Helvetica').text(`Period: ${periodText}`, 350, 72, { align: 'right' });
      doc.text(`Status: ${payslip.status || 'COMPUTED'}`, 350, 85, { align: 'right' });

      // Horizontal Rule
      doc.strokeColor(borderColor).lineWidth(1).moveTo(50, 105).lineTo(545, 105).stroke();

      // --- EMPLOYEE INFORMATION SECTION ---
      let y = 120;
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('EMPLOYEE DETAILS', 50, y);
      y += 18;

      const leftColX = 50;
      const rightColX = 300;

      doc.font('Helvetica-Bold').fontSize(9).fillColor(textColor).text('Name: ', leftColX, y);
      doc.font('Helvetica').fillColor(mutedColor).text(empName, leftColX + 70, y);

      doc.font('Helvetica-Bold').fillColor(textColor).text('Designation: ', rightColX, y);
      doc.font('Helvetica').fillColor(mutedColor).text(emp.jobPosition || 'N/A', rightColX + 80, y);
      y += 16;

      doc.font('Helvetica-Bold').fillColor(textColor).text('Email: ', leftColX, y);
      doc.font('Helvetica').fillColor(mutedColor).text(emp.email || 'N/A', leftColX + 70, y);

      doc.font('Helvetica-Bold').fillColor(textColor).text('Department: ', rightColX, y);
      const deptName = emp.department ? (typeof emp.department === 'string' ? emp.department : emp.department.name || 'N/A') : 'N/A';
      doc.font('Helvetica').fillColor(mutedColor).text(deptName, rightColX + 80, y);
      y += 16;

      doc.font('Helvetica-Bold').fillColor(textColor).text('Bank Name: ', leftColX, y);
      doc.font('Helvetica').fillColor(mutedColor).text(emp.bankName || 'N/A', leftColX + 70, y);

      doc.font('Helvetica-Bold').fillColor(textColor).text('Account No: ', rightColX, y);
      doc.font('Helvetica').fillColor(mutedColor).text(emp.bankAccountNumber || 'N/A', rightColX + 80, y);
      y += 18;

      // --- PAYROLL & ATTENDANCE SUMMARY SECTION ---
      const attSum = payslip.attendanceSummary || {
        totalWorkingDays: payslip.totalDays || 0,
        daysWorked: payslip.workedDays || 0,
        leaveDays: 0,
        absentDays: 0,
        totalHoursWorked: 0,
      };
      const paySum = payslip.payrollSummary || {
        totalEarnings: payslip.gross || 0,
        totalDeductions: 0,
        netSalary: payslip.net || 0,
      };
      const leaveSum = payslip.leaveSummary || { byType: [], totalLeave: 0 };

      // Horizontal Rule
      doc.strokeColor(borderColor).lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
      y += 12;

      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('PAYROLL & ATTENDANCE SUMMARY', 50, y);
      y += 16;

      // Summary Card Boxes (2 columns)
      const boxW = 240;
      const boxH = 68;

      // Left Box: Attendance Metrics
      doc.rect(50, y, boxW, boxH).fill('#F8FAFC');
      doc.rect(50, y, boxW, boxH).strokeColor(borderColor).stroke();

      let boxY = y + 8;
      doc.fontSize(8.5).fillColor(textColor);
      doc.font('Helvetica-Bold').text('Working Days:', 60, boxY);
      doc.font('Helvetica').text(`${attSum.totalWorkingDays} Days`, 135, boxY);
      doc.font('Helvetica-Bold').text('Days Worked:', 175, boxY);
      doc.font('Helvetica').text(`${attSum.daysWorked} Days`, 245, boxY);

      boxY += 16;
      doc.font('Helvetica-Bold').text('Leave Days:', 60, boxY);
      doc.font('Helvetica').text(`${attSum.leaveDays} Days`, 135, boxY);
      doc.font('Helvetica-Bold').text('Absent Days:', 175, boxY);
      doc.font('Helvetica').fillColor(attSum.absentDays > 0 ? '#DC2626' : textColor).text(`${attSum.absentDays} Days`, 245, boxY);

      boxY += 16;
      doc.fillColor(textColor);
      doc.font('Helvetica-Bold').text('Total Hours:', 60, boxY);
      doc.font('Helvetica-Bold').fillColor('#4F46E5').text(`${attSum.totalHoursWorked} hrs`, 135, boxY);

      if (leaveSum.totalLeave > 0) {
        const leaveDetailStr = leaveSum.byType?.map((b) => `${b.typeName}: ${b.days}d`).join(', ') || `${leaveSum.totalLeave} days`;
        doc.font('Helvetica').fontSize(7.5).fillColor(mutedColor).text(`(${leaveDetailStr})`, 185, boxY);
      }

      // Right Box: Payroll Financials
      doc.rect(305, y, boxW, boxH).fill('#F8FAFC');
      doc.rect(305, y, boxW, boxH).strokeColor(borderColor).stroke();

      let rBoxY = y + 8;
      doc.fontSize(8.5).fillColor(textColor);
      doc.font('Helvetica-Bold').text('Total Earnings:', 315, rBoxY);
      doc.font('Helvetica-Bold').text(`Rs. ${(paySum.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 425, rBoxY, { align: 'right' });

      rBoxY += 16;
      doc.font('Helvetica-Bold').text('Total Deductions:', 315, rBoxY);
      doc.font('Helvetica-Bold').fillColor('#DC2626').text(`Rs. ${(paySum.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 425, rBoxY, { align: 'right' });

      rBoxY += 16;
      doc.font('Helvetica-Bold').fillColor(successColor).text('Net Salary:', 315, rBoxY);
      doc.fontSize(9.5).font('Helvetica-Bold').text(`Rs. ${(paySum.netSalary || payslip.net || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 415, rBoxY, { align: 'right' });

      y += boxH + 14;

      // Horizontal Rule
      doc.strokeColor(borderColor).lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
      y += 14;

      // --- SALARY BREAKDOWN TABLE ---
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('SALARY COMPUTATION BREAKDOWN', 50, y);
      y += 18;

      // Table Header
      doc.rect(50, y, 495, 20).fill('#F3F4F6');
      doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold');
      doc.text('Rule / Component', 60, y + 5);
      doc.text('Code', 220, y + 5);
      doc.text('Category', 320, y + 5);
      doc.text('Amount (Rs.)', 460, y + 5, { align: 'right' });
      y += 22;

      const lines = payslip.lines || [];
      lines.sort((a, b) => a.sequence - b.sequence);

      for (const line of lines) {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        // Alternating row background
        doc.fillColor(textColor).fontSize(9).font('Helvetica');
        doc.text(line.name, 60, y + 5);
        doc.text(line.code, 220, y + 5);
        doc.fillColor(mutedColor).text(line.category, 320, y + 5);

        const formattedAmount = (Number(line.amount) || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        doc.fillColor(line.category === 'DEDUCTION' ? '#DC2626' : textColor);
        doc.font('Helvetica-Bold').text(formattedAmount, 460, y + 5, { align: 'right' });

        doc.strokeColor(borderColor).lineWidth(0.5).moveTo(50, y + 20).lineTo(545, y + 20).stroke();
        y += 22;
      }

      y += 15;

      // --- SUMMARY TOTALS CARD ---
      if (y > 680) {
        doc.addPage();
        y = 50;
      }

      doc.rect(300, y, 245, 95).fill('#F8FAFC');
      doc.rect(300, y, 245, 95).strokeColor(borderColor).stroke();

      let summaryY = y + 10;
      doc.fillColor(textColor).fontSize(9).font('Helvetica').text('Basic Wage:', 315, summaryY);
      doc.font('Helvetica-Bold').text(`Rs. ${(payslip.basic || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, summaryY, { align: 'right' });
      summaryY += 18;

      doc.font('Helvetica').text('Gross Salary:', 315, summaryY);
      doc.font('Helvetica-Bold').text(`Rs. ${(payslip.gross || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, summaryY, { align: 'right' });
      summaryY += 18;

      doc.strokeColor(borderColor).lineWidth(0.5).moveTo(315, summaryY).lineTo(530, summaryY).stroke();
      summaryY += 8;

      doc.fillColor(successColor).fontSize(12).font('Helvetica-Bold').text('Net Payable:', 315, summaryY);
      doc.text(`Rs. ${(payslip.net || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 430, summaryY, { align: 'right' });

      // Footer
      doc.fillColor(mutedColor).fontSize(8).font('Helvetica').text('This is a system-generated payslip from PeoplePay360. No signature is required.', 50, 770, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generatePayslipPdfBuffer,
};
