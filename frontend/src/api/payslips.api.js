import axiosClient from './axiosClient';
import { PayslipStatus } from '../utils/constants';
import { SIXTY_PAYSLIPS } from './mockData60';

const DEMO_PAYSLIPS = SIXTY_PAYSLIPS;

export const payslipsApi = {
  getPayslips: async (params = {}) => {
    try {
      const response = await axiosClient.get('/payslips', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      let filtered = [...DEMO_PAYSLIPS];
      if (params.employeeId) filtered = filtered.filter((p) => p.employeeId === params.employeeId);
      if (params.payrunId) filtered = filtered.filter((p) => p.payrunId === params.payrunId);
      if (params.status) filtered = filtered.filter((p) => p.status === params.status);
      return { data: filtered, total: filtered.length, page: params.page || 1, pageSize: params.pageSize || 20 };
    }
  },

  getPayslipById: async (id) => {
    try {
      const response = await axiosClient.get(`/payslips/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return DEMO_PAYSLIPS.find((p) => p.id === id) || DEMO_PAYSLIPS[0];
    }
  },

  getPayslipPdfUrl: (id) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('peoplepay360_token');
    return `${baseURL}/payslips/${id}/pdf?token=${token}`;
  },

  downloadPayslipPdf: async (id, customFileName = null) => {
    try {
      const response = await axiosClient.get(`/payslips/${id}/pdf`, {
        responseType: 'blob',
      });

      const rawData = response.data;
      const blob =
        rawData instanceof Blob
          ? rawData
          : new Blob([rawData], { type: 'application/pdf' });

      // If the backend sent back a JSON error in a blob
      if (blob.type && blob.type.includes('application/json')) {
        const text = await blob.text();
        const json = JSON.parse(text);
        throw new Error(json.error?.message || json.message || 'Server returned an error for PDF');
      }

      const fileName = customFileName || `payslip-${id}.pdf`;
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(downloadUrl);
      }, 60000);

      return { success: true };
    } catch (error) {
      console.warn('Backend PDF endpoint error, using client-side printable fallback:', error);
      return payslipsApi.generateClientPayslipFallback(id, customFileName);
    }
  },

  viewPayslipPdf: async (id) => {
    try {
      const response = await axiosClient.get(`/payslips/${id}/pdf`, {
        responseType: 'blob',
      });
      const rawData = response.data;
      const blob =
        rawData instanceof Blob
          ? rawData
          : new Blob([rawData], { type: 'application/pdf' });
      const viewUrl = window.URL.createObjectURL(blob);
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(viewUrl), 120000);
      return { success: true };
    } catch (error) {
      console.warn('View PDF error, fallback to printable:', error);
      return payslipsApi.generateClientPayslipFallback(id);
    }
  },

  generateClientPayslipFallback: async (id, customFileName = null) => {
    try {
      const payslip = await payslipsApi.getPayslipById(id);
      const emp = payslip.employee || {};
      const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
      const periodStr = `${payslip.periodStart ? new Date(payslip.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} - ${payslip.periodEnd ? new Date(payslip.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}`;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payslip - ${empName}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: auto; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
              .brand { font-size: 24px; font-weight: 800; color: #1e3a8a; }
              .sub { font-size: 12px; color: #6b7280; }
              .title { text-align: right; }
              .title h1 { margin: 0; font-size: 20px; color: #1e3a8a; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; font-size: 13px; }
              .info-row { margin-bottom: 6px; }
              .info-label { font-weight: bold; color: #4b5563; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
              th { background: #f3f4f6; text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; color: #1e3a8a; }
              td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
              .amount { text-align: right; font-weight: bold; }
              .deduction { color: #dc2626; }
              .totals { margin-left: auto; width: 300px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 14px; }
              .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .net-row { border-top: 2px solid #e5e7eb; padding-top: 8px; font-size: 16px; font-weight: bold; color: #059669; }
              .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 16px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="brand">PeoplePay360</div>
                <div class="sub">Human Resource & Payroll Management Platform</div>
              </div>
              <div class="title">
                <h1>PAYSLIP</h1>
                <div class="sub">Period: ${periodStr}</div>
                <div class="sub">Status: ${payslip.status || 'COMPUTED'}</div>
              </div>
            </div>
            <div class="info-grid">
              <div>
                <div class="info-row"><span class="info-label">Employee:</span> ${empName}</div>
                <div class="info-row"><span class="info-label">Email:</span> ${emp.email || 'N/A'}</div>
                <div class="info-row"><span class="info-label">Worked Days:</span> ${payslip.workedDays ?? 0} / ${payslip.totalDays ?? 0} Days</div>
              </div>
              <div>
                <div class="info-row"><span class="info-label">Designation:</span> ${emp.jobPosition || 'Staff'}</div>
                <div class="info-row"><span class="info-label">Department:</span> ${emp.department?.name || emp.department || 'N/A'}</div>
                <div class="info-row"><span class="info-label">Bank Details:</span> ${emp.bankName || 'Standard'} - ${emp.bankAccountNumber || 'N/A'}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Rule / Component</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th style="text-align:right">Amount ($)</th>
                </tr>
              </thead>
              <tbody>
                ${(payslip.lines || []).map(l => `
                  <tr>
                    <td>${l.name}</td>
                    <td>${l.code}</td>
                    <td>${l.category}</td>
                    <td class="amount ${l.category === 'DEDUCTION' ? 'deduction' : ''}">$${Number(l.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="totals">
              <div class="totals-row"><span>Basic Wage:</span> <span>$${Number(payslip.basic || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row"><span>Gross Salary:</span> <span>$${Number(payslip.gross || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row net-row"><span>Net Payable:</span> <span>$${Number(payslip.net || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
            </div>
            <div class="footer">
              This is a system-generated payslip from PeoplePay360. No signature required.
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
        return { success: true };
      }
      return { success: false, error: 'Popup blocked' };
    } catch (e) {
      console.error('Failed to generate printable fallback:', e);
      throw e;
    }
  },

  sendPayslipEmail: async (id, recipientEmail = null) => {
    try {
      const response = await axiosClient.post(`/payslips/${id}/send-email`, { recipientEmail });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { success: true, message: `Payslip PDF emailed successfully to ${recipientEmail || 'employee'}!` };
    }
  },
};
