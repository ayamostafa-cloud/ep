/**
 * Interface for employee profile subsystem integration
 * This allows the recruitment module to work standalone with a stub implementation,
 * and later swap in the real employee profile module when integrated.
 */
export interface IEmployeeProfileService {
  /**
   * Create employee profile from candidate data when offer is accepted
   * @param candidateId - The candidate ID
   * @param offerDetails - Offer details to populate employee profile
   */
  createEmployeeFromCandidate(
    candidateId: string,
    offerDetails: {
      fullName: string;
      email: string;
      role: string;
      department: string;
      startDate: Date;
    },
  ): Promise<{ employeeId: string }>;
}

