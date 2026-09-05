const nodemailer = require('nodemailer');
const env = require('../../config/env');
const prisma = require('../../config/prisma');
const { generatePayslipPdfBuffer } = require('./payslipPdf.service');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (env.SMTP_HOST && env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      // Test/development transporter (jsonTransport or ethereal fallback)
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'dev@ethereal.email',
          pass: 'ethereal_password',
        },
      });
    }
  }
  return transporter;
}

/**
 * Sends single payslip email with PDF attachment
 * @param {Object} payslip - Full payslip with employee and lines
 * @returns {Promise<Object>} delivery result
 */
async function sendPayslipEmail(payslip) {
  const emp = payslip.employee;
  if (!emp || !emp.email) {
    throw new Error('Employee email address is missing');
  }

  const pdfBuffer = await generatePayslipPdfBuffer(payslip);
  const periodText = `${new Date(payslip.periodStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;

  const mailOptions = {
    from: env.SMTP_FROM,
    to: emp.email,
    subject: `Your Payslip for ${periodText} — PeoplePay360`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1F2937;">
        <h2 style="color: #1E3A8A;">PeoplePay360 Payslip Notification</h2>
        <p>Dear ${emp.firstName} ${emp.lastName},</p>
        <p>Your payslip for the pay period <strong>${periodText}</strong> has been generated and finalized.</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Gross Salary:</strong> $${(payslip.gross || 0).toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Net Pay:</strong> $${(payslip.net || 0).toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${payslip.status}</p>
        </div>
        <p>Please find your detailed PDF payslip attached to this email.</p>
        <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
          Best regards,<br/>PeoplePay360 Payroll Team
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `Payslip_${emp.firstName}_${emp.lastName}_${periodText.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    const currentTransporter = getTransporter();
    const info = await currentTransporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId, email: emp.email };
  } catch (error) {
    // In dev mode when SMTP is unconfigured, log and simulate delivery
    if (process.env.NODE_ENV !== 'production' && (!env.SMTP_USER || error.code === 'EAUTH' || error.code === 'EDNS')) {
      console.warn(`[DEV SIMULATED EMAIL]: Payslip email for ${emp.email} generated successfully (SMTP not configured).`);
      return { success: true, simulated: true, email: emp.email };
    }
    throw error;
  }
}

/**
 * Sends payslip emails in bulk for an entire payrun
 * @param {string} payrunId
 * @returns {Promise<{ sent: number, failed: number, results: Array }>}
 */
async function sendBulkPayrunPayslips(payrunId) {
  const payrun = await prisma.payrun.findUnique({
    where: { id: payrunId },
    include: {
      payslips: {
        include: {
          employee: {
            include: { department: true },
          },
          salaryStructure: true,
          lines: { orderBy: { sequence: 'asc' } },
        },
      },
    },
  });

  if (!payrun) {
    throw new Error('Payrun not found');
  }

  const results = [];
  let sent = 0;
  let failed = 0;

  for (const payslip of payrun.payslips) {
    try {
      const res = await sendPayslipEmail(payslip);
      results.push({ payslipId: payslip.id, employee: `${payslip.employee.firstName} ${payslip.employee.lastName}`, ...res });
      sent++;
    } catch (err) {
      console.error(`Failed to send payslip email for employee ${payslip.employee.email}:`, err.message);
      results.push({
        payslipId: payslip.id,
        employee: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
        success: false,
        error: err.message,
      });
      failed++;
    }
  }

  return { sent, failed, results };
}

module.exports = {
  sendPayslipEmail,
  sendBulkPayrunPayslips,
};
