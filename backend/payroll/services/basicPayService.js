/**
 * Basic Pay Calculation Service
 * Handles basic pay, per day calculation, payable amount, and incentive
 */

/**
 * Calculate basic pay components
 * @param {Object} employee - Employee object with gross_salary
 * @param {Object} attendanceSummary - MonthlyAttendanceSummary object
 * @returns {Object} Basic pay calculation result
 */
function calculateBasicPay(employee, attendanceSummary) {
  // Validate inputs
  if (!employee || !employee.gross_salary) {
    throw new Error('Employee or gross_salary is missing');
  }

  if (!attendanceSummary || !attendanceSummary.totalDaysInMonth) {
    throw new Error('Attendance summary or totalDaysInMonth is missing');
  }

  const basicPay = employee.gross_salary || 0;
  const totalDaysInMonth = attendanceSummary.totalDaysInMonth;
  const totalPayableShifts = attendanceSummary.totalPayableShifts || 0;

  // Calculate per day basic pay
  const perDayBasicPay = totalDaysInMonth > 0 ? basicPay / totalDaysInMonth : 0;

  // Calculate payable amount based on shifts
  const payableAmount = perDayBasicPay * totalPayableShifts;

  // Calculate incentive
  // Incentive = Payable Amount - Basic Pay
  // Can be positive (extra shifts) or negative (less shifts)
  const incentive = payableAmount - basicPay;

  return {
    basicPay,
    perDayBasicPay: Math.round(perDayBasicPay * 100) / 100, // Round to 2 decimals
    payableAmount: Math.round(payableAmount * 100) / 100,
    incentive: Math.round(incentive * 100) / 100,
    totalDaysInMonth,
    totalPayableShifts,
  };
}

module.exports = {
  calculateBasicPay,
};

