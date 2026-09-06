import React, { useState } from 'react';
import { payslipsApi } from '../../api/payslips.api';
import { Download } from 'lucide-react';

export default function PayslipPdfButton({ payslipId, className = '' }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await payslipsApi.downloadPayslipPdf(payslipId);
    } catch (err) {
      console.error('PDF download error:', err);
      const pdfUrl = payslipsApi.getPayslipPdfUrl(payslipId);
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownloadPdf}
      disabled={isDownloading}
      className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors shadow-xs disabled:opacity-50 ${className}`}
      title="Download PDF Payslip Bill"
    >
      <Download className="w-4 h-4 text-blue-600" />
      {isDownloading ? 'Downloading Bill...' : 'Download Payslip (PDF)'}
    </button>
  );
}

