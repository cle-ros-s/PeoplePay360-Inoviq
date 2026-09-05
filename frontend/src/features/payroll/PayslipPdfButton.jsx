import React from 'react';
import { payslipsApi } from '../../api/payslips.api';
import { FileText, Download } from 'lucide-react';

export default function PayslipPdfButton({ payslipId, className = '' }) {
  const handleOpenPdf = () => {
    const pdfUrl = payslipsApi.getPayslipPdfUrl(payslipId);
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleOpenPdf}
      className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors shadow-2xs ${className}`}
      title="Print PDF Payslip"
    >
      <FileText className="w-4 h-4 text-blue-600" />
      Print Payslip (PDF)
    </button>
  );
}
