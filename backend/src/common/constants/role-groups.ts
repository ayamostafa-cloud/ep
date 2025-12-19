import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';

export const EMPLOYEE_ROLES = [
  SystemRole.DEPARTMENT_EMPLOYEE,
];

export const MANAGER_ROLES = [
  SystemRole.DEPARTMENT_HEAD, // Only real manager of employees
];

export const HR_ROLES = [
  SystemRole.HR_MANAGER,
  SystemRole.HR_EMPLOYEE,
  SystemRole.HR_ADMIN,
];

export const ADMIN_ROLES = [
  SystemRole.SYSTEM_ADMIN,
  SystemRole.LEGAL_POLICY_ADMIN,
  SystemRole.PAYROLL_SPECIALIST,
  SystemRole.FINANCE_STAFF,
];
