import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Step1Scope from './Step1Scope';
import Step2SelectEmployees from './Step2SelectEmployees';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function NewPayrunWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [scopeData, setScopeData] = useState(null);

  const handleScopeSubmitted = (data) => {
    setScopeData(data);
    setCurrentStep(2);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Payrun Setup Wizard"
        description="Step-by-step setup workflow. No Payrun record will be created until employee scope selection is confirmed."
        actions={
          <button
            type="button"
            onClick={() => navigate('/payroll/payruns')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel Wizard
          </button>
        }
      />

      {/* Wizard Progress Indicator */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-center gap-8 max-w-xl mx-auto">
        <div className={`flex items-center gap-2 ${currentStep === 1 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            1
          </span>
          <span className="text-sm">1. Scope & Period</span>
        </div>

        <div className="w-12 h-0.5 bg-gray-200" />

        <div className={`flex items-center gap-2 ${currentStep === 2 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            2
          </span>
          <span className="text-sm">2. Select Staff</span>
        </div>
      </div>

      {/* Main Step View Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-4xl mx-auto">
        {currentStep === 1 ? (
          <Step1Scope onScopeSubmitted={handleScopeSubmitted} scopeData={scopeData} />
        ) : (
          <Step2SelectEmployees scopeData={scopeData} onBack={() => setCurrentStep(1)} />
        )}
      </div>
    </div>
  );
}
