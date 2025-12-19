/**
 * Interface for onboarding subsystem integration
 * This allows the recruitment module to work standalone with a stub implementation,
 * and later swap in the real onboarding module when integrated.
 */
export interface IOnboardingService {
  /**
   * Trigger onboarding workflow when an offer is accepted (REC-029)
   * @param candidateId - The candidate who accepted the offer
   * @param offerId - The offer that was accepted
   * @param offerDetails - Details from the offer (salary, role, etc.)
   */
  triggerOnboarding(
    candidateId: string,
    offerId: string,
    offerDetails: {
      role: string;
      department: string;
      grossSalary: number;
      startDate?: Date;
    },
  ): Promise<{ onboardingId: string; tasks: any[] }>;
}

