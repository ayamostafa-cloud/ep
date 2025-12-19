/**
 * Interface for organization structure subsystem integration
 * This allows the recruitment module to work standalone with a stub implementation,
 * and later swap in the real organization structure module when integrated.
 */
export interface IOrganizationStructureService {
  /**
   * Validate that a department exists in the organization structure
   * @param departmentId - Department ID or name
   */
  validateDepartment(departmentId: string): Promise<boolean>;

  /**
   * Get department details
   * @param departmentId - Department ID or name
   */
  getDepartment(departmentId: string): Promise<{ id: string; name: string; managerId?: string } | null>;
}

