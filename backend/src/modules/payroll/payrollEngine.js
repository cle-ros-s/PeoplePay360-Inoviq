const { evaluate } = require('mathjs');
const { AppError } = require('../../utils/responseFormatter');

/**
 * Rounds a number to 2 decimal places
 * @param {number} num 
 * @returns {number}
 */
function round2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

/**
 * Computes individual payslip lines, basic, gross, and net salary
 * @param {Object} params
 * @param {Object} params.contract - Active employee contract (wage, etc.)
 * @param {Array} params.salaryStructureRules - Array of SalaryRule objects
 * @param {Date|string} params.periodStart - Pay period start date
 * @param {Date|string} params.periodEnd - Pay period end date
 * @param {number} params.workedDays - Number of days worked in the period
 * @param {number} params.totalDays - Total working/calendar days in the period
 * @returns {{ lines: Array, basic: number, gross: number, net: number }}
 */
function computePayslip({
  contract,
  salaryStructureRules = [],
  periodStart,
  periodEnd,
  workedDays = 30,
  totalDays = 30,
}) {
  if (!contract || typeof contract.wage !== 'number') {
    throw new AppError('INVALID_CONTRACT_WAGE', 'Contract with a valid wage is required for computation', 422);
  }

  const safeTotalDays = totalDays > 0 ? totalDays : 30;
  const safeWorkedDays = workedDays >= 0 ? workedDays : safeTotalDays;
  const attendanceRatio = safeWorkedDays / safeTotalDays;

  // Initialize calculation context
  const context = {
    CONTRACT_WAGE: contract.wage,
    WORKED_DAYS: safeWorkedDays,
    TOTAL_DAYS: safeTotalDays,
    ATTENDANCE_RATIO: attendanceRatio,
  };

  // Sort rules strictly by sequence ascending
  const sortedRules = [...salaryStructureRules].sort((a, b) => a.sequence - b.sequence);

  const lines = [];
  let basicAmount = 0;
  let grossAmount = 0;
  let netAmount = 0;

  for (const rule of sortedRules) {
    let lineAmount = 0;

    switch (rule.computationType) {
      case 'FIXED': {
        if (rule.amount !== null && rule.amount !== undefined) {
          lineAmount = rule.amount;
        } else if (rule.code === 'BASIC' || rule.category === 'BASIC') {
          // If basic fixed rule with no explicit constant amount, prorate contract wage by attendance
          lineAmount = contract.wage * (safeWorkedDays === safeTotalDays ? 1 : attendanceRatio);
        } else {
          lineAmount = 0;
        }
        break;
      }

      case 'PERCENTAGE': {
        const basisCode = (rule.percentageBasisCode || 'BASIC').toUpperCase();
        const basisValue = context[basisCode] !== undefined ? context[basisCode] : 0;
        const percentage = rule.percentage !== null && rule.percentage !== undefined ? rule.percentage : 0;
        lineAmount = (percentage / 100) * basisValue;
        break;
      }

      case 'FORMULA': {
        if (!rule.formula || typeof rule.formula !== 'string') {
          throw new AppError(
            'INVALID_FORMULA',
            `Salary rule ${rule.code} is marked as FORMULA but has no formula string`,
            422
          );
        }
        try {
          // Evaluate safely with mathjs without eval()
          const result = evaluate(rule.formula, context);
          if (typeof result !== 'number' || isNaN(result)) {
            throw new Error(`Formula for ${rule.code} did not return a valid number`);
          }
          lineAmount = result;
        } catch (err) {
          throw new AppError(
            'FORMULA_EVALUATION_ERROR',
            `Error calculating rule ${rule.code} formula (${rule.formula}): ${err.message}`,
            422
          );
        }
        break;
      }

      default:
        lineAmount = 0;
    }

    lineAmount = round2(lineAmount);

    // Save into calculation context for subsequent dependent rules
    context[rule.code] = lineAmount;

    // Track category totals
    if (rule.category === 'BASIC' || rule.code === 'BASIC') {
      basicAmount = lineAmount;
    }
    if (rule.category === 'GROSS' || rule.code === 'GROSS') {
      grossAmount = lineAmount;
    }
    if (rule.category === 'NET' || rule.code === 'NET') {
      netAmount = lineAmount;
    }

    lines.push({
      salaryRuleId: rule.id || null,
      name: rule.name,
      code: rule.code,
      category: rule.category,
      sequence: rule.sequence,
      amount: lineAmount,
    });
  }

  // Fallbacks if GROSS/NET were not explicit formula rules
  if (grossAmount === 0 && lines.length > 0) {
    grossAmount = lines
      .filter((l) => l.category === 'BASIC' || l.category === 'ALLOWANCE')
      .reduce((sum, l) => sum + l.amount, 0);
  }

  if (netAmount === 0 && lines.length > 0) {
    const totalDeductions = lines
      .filter((l) => l.category === 'DEDUCTION')
      .reduce((sum, l) => sum + l.amount, 0);
    netAmount = grossAmount - totalDeductions;
  }

  return {
    lines,
    basic: round2(basicAmount),
    gross: round2(grossAmount),
    net: round2(netAmount),
  };
}

module.exports = {
  computePayslip,
  round2,
};
