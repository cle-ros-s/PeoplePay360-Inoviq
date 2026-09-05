const assert = require('assert');
const { computePayslip } = require('../src/modules/payroll/payrollEngine');

console.log('Testing Payroll Engine Standalone Unit Test...');

const rules = [
  {
    id: 'rule-basic',
    name: 'Basic Salary',
    code: 'BASIC',
    category: 'BASIC',
    sequence: 1,
    computationType: 'FIXED',
    amount: null,
  },
  {
    id: 'rule-hra',
    name: 'House Rent Allowance',
    code: 'HRA',
    category: 'ALLOWANCE',
    sequence: 2,
    computationType: 'PERCENTAGE',
    percentage: 40,
    percentageBasisCode: 'BASIC',
  },
  {
    id: 'rule-pf',
    name: 'Provident Fund',
    code: 'PF',
    category: 'DEDUCTION',
    sequence: 3,
    computationType: 'PERCENTAGE',
    percentage: 12,
    percentageBasisCode: 'BASIC',
  },
  {
    id: 'rule-gross',
    name: 'Gross Salary',
    code: 'GROSS',
    category: 'GROSS',
    sequence: 4,
    computationType: 'FORMULA',
    formula: 'BASIC + HRA',
  },
  {
    id: 'rule-net',
    name: 'Net Salary',
    code: 'NET',
    category: 'NET',
    sequence: 5,
    computationType: 'FORMULA',
    formula: 'GROSS - PF',
  },
];

const contract = {
  id: 'contract-1',
  wage: 50000,
};

const result = computePayslip({
  contract,
  salaryStructureRules: rules,
  periodStart: new Date('2026-09-01'),
  periodEnd: new Date('2026-09-30'),
  workedDays: 30,
  totalDays: 30,
});

console.log('Calculation Result:', JSON.stringify(result, null, 2));

assert.strictEqual(result.basic, 50000, 'BASIC must be 50000');
assert.strictEqual(result.lines.find((l) => l.code === 'HRA').amount, 20000, 'HRA must be 20000');
assert.strictEqual(result.lines.find((l) => l.code === 'PF').amount, 6000, 'PF must be 6000');
assert.strictEqual(result.gross, 70000, 'GROSS must be 70000');
assert.strictEqual(result.net, 64000, 'NET must be 64000');

console.log('✓ All payroll engine unit assertions passed successfully!');
