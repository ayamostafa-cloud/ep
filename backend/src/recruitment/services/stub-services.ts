import { Injectable } from '@nestjs/common';
import type { IOnboardingService } from '../interfaces/onboarding.interface';
import type { IEmployeeProfileService } from '../interfaces/employee-profile.interface';
import type { IOrganizationStructureService } from '../interfaces/organization-structure.interface';

/**
 * Stub services for standalone operation of the Recruitment module.
 * These are placeholders until the actual services are integrated.
 */
@Injectable()
export class StubOnboardingService implements IOnboardingService {
  async triggerOnboarding(
    candidateId: string,
    offerId: string,
    offerDetails: {
      role: string;
      department: string;
      grossSalary: number;
      startDate?: Date;
    },
  ): Promise<{ onboardingId: string; tasks: any[] }> {
    console.warn('StubOnboardingService.triggerOnboarding called - not implemented');
    return {
      onboardingId: 'stub-onboarding-id',
      tasks: [],
    };
  }
}

@Injectable()
export class StubEmployeeProfileService implements IEmployeeProfileService {
  async createEmployeeFromCandidate(
    candidateId: string,
    offerDetails: {
      fullName: string;
      email: string;
      role: string;
      department: string;
      startDate: Date;
    },
  ): Promise<{ employeeId: string }> {
    console.warn('StubEmployeeProfileService.createEmployeeFromCandidate called - not implemented');
    return { employeeId: 'stub-employee-id' };
  }
}

@Injectable()
export class StubOrganizationStructureService implements IOrganizationStructureService {
  async validateDepartment(departmentId: string): Promise<boolean> {
    console.warn('StubOrganizationStructureService.validateDepartment called - not implemented');
    return true; // Stub always returns true
  }

  async getDepartment(departmentId: string): Promise<{ id: string; name: string; managerId?: string } | null> {
    console.warn('StubOrganizationStructureService.getDepartment called - not implemented');
    return { id: departmentId, name: 'Stub Department' };
  }
}

