/**
 * Time Management and Leave Integration Helper
 *
 * This helper provides integration points for Time Management and Leave subsystems.
 * These methods should be implemented when those subsystems are ready.
 *
 * Required Inputs from Other Sub-Systems:
 * - Time Management: Working hours, Overtime hours
 * - Leaves: Paid leave days, Unpaid leave days
 */

import { Types } from 'mongoose';

export interface TimeManagementData {
  employeeId: Types.ObjectId;
  payrollPeriod: Date;
  regularHours: number;
  overtimeHours: number;
  missingHours: number;
  workingDays: number;
  attendanceRate: number;
}

export interface LeaveData {
  employeeId: Types.ObjectId;
  payrollPeriod: Date;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  sickLeaveDays: number;
  annualLeaveDays: number;
  accruedLeaveDays: number;
}

export class TimeLeaveIntegrationHelper {
  /**
   * Fetch time management data for an employee in a payroll period
   * TODO: Implement integration with Time Management subsystem
   *
   * @param employeeId - Employee ObjectId
   * @param payrollPeriod - Payroll period date
   * @returns Time management data including working hours and overtime
   */
  static async getTimeManagementData(
    employeeId: Types.ObjectId,
    payrollPeriod: Date,
  ): Promise<TimeManagementData> {
    // Placeholder implementation
    // In production, this should call the Time Management subsystem API
    return {
      employeeId,
      payrollPeriod,
      regularHours: 0,
      overtimeHours: 0,
      missingHours: 0,
      workingDays: 0,
      attendanceRate: 100,
    };
  }

  /**
   * Fetch leave data for an employee in a payroll period
   * TODO: Implement integration with Leave Management subsystem
   *
   * @param employeeId - Employee ObjectId
   * @param payrollPeriod - Payroll period date
   * @returns Leave data including paid/unpaid leave days
   */
  static async getLeaveData(
    employeeId: Types.ObjectId,
    payrollPeriod: Date,
  ): Promise<LeaveData> {
    // Placeholder implementation
    // In production, this should call the Leave Management subsystem API
    return {
      employeeId,
      payrollPeriod,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      sickLeaveDays: 0,
      annualLeaveDays: 0,
      accruedLeaveDays: 0,
    };
  }

  /**
   * Calculate deduction for missing working hours/days
   * Egyptian Labor Law 2025: Deduction based on daily or hourly rate
   *
   * @param missingHours - Number of missing working hours
   * @param grossSalary - Employee's gross monthly salary
   * @param workingHoursPerDay - Standard working hours per day (default: 8)
   * @param workingDaysPerMonth - Standard working days per month (default: 30)
   * @returns Deduction amount
   */
  static calculateMissingHoursDeduction(
    missingHours: number,
    grossSalary: number,
    workingHoursPerDay: number = 8,
    workingDaysPerMonth: number = 30,
  ): number {
    if (missingHours <= 0) return 0;

    // Calculate hourly rate: (Monthly Salary / Working Days / Working Hours per Day)
    const hourlyRate = grossSalary / workingDaysPerMonth / workingHoursPerDay;

    // Deduction = Missing Hours × Hourly Rate
    const deduction = missingHours * hourlyRate;

    return Math.round(deduction * 100) / 100;
  }

  /**
   * Calculate deduction for unpaid leave days
   * Egyptian Labor Law 2025: Daily rate = Monthly salary / 30 days
   *
   * @param unpaidLeaveDays - Number of unpaid leave days
   * @param grossSalary - Employee's gross monthly salary
   * @returns Deduction amount
   */
  static calculateUnpaidLeaveDeduction(
    unpaidLeaveDays: number,
    grossSalary: number,
  ): number {
    if (unpaidLeaveDays <= 0) return 0;

    // Egyptian Labor Law: Daily rate = Monthly salary / 30
    const dailyRate = grossSalary / 30;

    // Deduction = Unpaid Leave Days × Daily Rate
    const deduction = unpaidLeaveDays * dailyRate;

    return Math.round(deduction * 100) / 100;
  }

  /**
   * Calculate overtime pay
   * Egyptian Labor Law 2025: Overtime = 1.25x for first 2 hours, 1.5x thereafter
   *
   * @param overtimeHours - Number of overtime hours
   * @param grossSalary - Employee's gross monthly salary
   * @param workingHoursPerDay - Standard working hours per day (default: 8)
   * @param workingDaysPerMonth - Standard working days per month (default: 30)
   * @returns Overtime pay amount
   */
  static calculateOvertimePay(
    overtimeHours: number,
    grossSalary: number,
    workingHoursPerDay: number = 8,
    workingDaysPerMonth: number = 30,
  ): number {
    if (overtimeHours <= 0) return 0;

    // Calculate hourly rate
    const hourlyRate = grossSalary / workingDaysPerMonth / workingHoursPerDay;

    let overtimePay = 0;

    // Egyptian Labor Law 2025:
    // First 2 hours: 1.25x hourly rate
    // Additional hours: 1.5x hourly rate
    if (overtimeHours <= 2) {
      overtimePay = overtimeHours * hourlyRate * 1.25;
    } else {
      overtimePay = (2 * hourlyRate * 1.25) + ((overtimeHours - 2) * hourlyRate * 1.5);
    }

    return Math.round(overtimePay * 100) / 100;
  }

  /**
   * Validate that employee has sufficient working hours/days
   * Egyptian Labor Law 2025: Minimum attendance requirements
   *
   * @param workingDays - Actual working days
   * @param requiredDays - Required working days in period
   * @param attendanceRate - Attendance rate percentage
   * @returns Validation result with reason
   */
  static validateAttendance(
    workingDays: number,
    requiredDays: number,
    attendanceRate: number,
  ): { valid: boolean; reason?: string } {
    // Egyptian Labor Law: Minimum attendance threshold
    const minimumAttendanceRate = 80; // 80% minimum attendance

    if (attendanceRate < minimumAttendanceRate) {
      return {
        valid: false,
        reason: `Attendance rate ${attendanceRate}% is below minimum ${minimumAttendanceRate}%`,
      };
    }

    if (workingDays < requiredDays * 0.5) {
      return {
        valid: false,
        reason: `Working days ${workingDays} is significantly below required ${requiredDays}`,
      };
    }

    return { valid: true };
  }

  /**
   * Calculate prorated salary based on actual working days
   * Used for mid-month hires, terminations, or extended unpaid leaves
   *
   * @param baseSalary - Employee's base monthly salary
   * @param workedDays - Actual days worked in the period
   * @param totalDaysInPeriod - Total days in the payroll period
   * @returns Prorated salary amount
   */
  static calculateProratedSalary(
    baseSalary: number,
    workedDays: number,
    totalDaysInPeriod: number,
  ): number {
    if (workedDays <= 0) return 0;
    if (workedDays >= totalDaysInPeriod) return baseSalary;

    const prorateFactor = workedDays / totalDaysInPeriod;
    const proratedAmount = baseSalary * prorateFactor;

    return Math.round(proratedAmount * 100) / 100;
  }
}
