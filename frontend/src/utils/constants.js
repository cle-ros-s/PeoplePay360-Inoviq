// Copy verbatim from 00_SHARED_DATA_CONTRACT.md Section 1

export const Role = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

export const EmployeeStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
};

export const EmployeeType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
};

export const ContractStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
};

export const ScheduleType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  FLEXIBLE: 'FLEXIBLE',
};

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  LATE: 'LATE',
  ABSENT: 'ABSENT',
  OVERTIME: 'OVERTIME',
  MISSING_CHECKOUT: 'MISSING_CHECKOUT',
  MANUALLY_EDITED: 'MANUALLY_EDITED',
};

export const TimeOffUnit = {
  DAYS: 'DAYS',
  HOURS: 'HOURS',
};

export const AllocationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REFUSED: 'REFUSED',
};

export const TimeOffReqStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REFUSED: 'REFUSED',
};

export const SalaryCategory = {
  BASIC: 'BASIC',
  ALLOWANCE: 'ALLOWANCE',
  DEDUCTION: 'DEDUCTION',
  GROSS: 'GROSS',
  NET: 'NET',
  CONTRIBUTION: 'CONTRIBUTION',
};

export const ComputationMethod = {
  FIXED: 'FIXED',
  PERCENTAGE: 'PERCENTAGE',
  FORMULA: 'FORMULA',
};

export const PayrunStatus = {
  DRAFT: 'DRAFT',
  COMPUTED: 'COMPUTED',
  VALIDATED: 'VALIDATED',
  PAID: 'PAID',
};

export const PayslipStatus = {
  DRAFT: 'DRAFT',
  COMPUTED: 'COMPUTED',
  VALIDATED: 'VALIDATED',
  PAID: 'PAID',
};

export const WarningType = {
  MISSING_BANK_DETAILS: 'MISSING_BANK_DETAILS',
  DUPLICATE_PAYSLIP: 'DUPLICATE_PAYSLIP',
  MISSING_CONTRACT: 'MISSING_CONTRACT',
  MISSING_SCHEDULE: 'MISSING_SCHEDULE',
  NEGATIVE_NET: 'NEGATIVE_NET',
  OTHER: 'OTHER',
};

export const WarningSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
};

// Days of week mapping for Working Schedule
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];
