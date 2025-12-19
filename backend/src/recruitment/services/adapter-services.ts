import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IEmployeeProfileService } from '../interfaces/employee-profile.interface';
import type { IOrganizationStructureService } from '../interfaces/organization-structure.interface';
import { EmployeeProfileService } from '../../employee-profile/employee-profile.service';
import { OrganizationStructureService } from '../../organization-structure/organization-structure.service';

/**
 * Adapter services bridge real subsystem services with recruitment interfaces.
 * 
 * REQUIREMENTS:
 * - EmployeeProfileService MUST be exported from EmployeeProfileModule
 * - OrganizationStructureService MUST be exported from OrganizationStructureModule
 */

@Injectable()
export class EmployeeProfileServiceAdapter implements IEmployeeProfileService {
  private readonly logger = new Logger(EmployeeProfileServiceAdapter.name);
  private readonly realService: EmployeeProfileService;

  constructor(
    @Inject(EmployeeProfileService) employeeProfileService: EmployeeProfileService,
  ) {
    if (!employeeProfileService) {
      throw new Error(
        'EmployeeProfileService is required. Ensure EmployeeProfileModule exports EmployeeProfileService.'
      );
    }
    this.realService = employeeProfileService;
    this.logger.log('✓ Using REAL EmployeeProfileService');
  }

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
    const nameParts = offerDetails.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const employeeNumber = `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const createEmployeeDto = {
      firstName,
      lastName,
      nationalId: `NID-${candidateId}`,
      address: { street: 'TBD', city: 'TBD', country: 'TBD' },
      phone: 'TBD',
      personalEmail: offerDetails.email,
      password: 'TempPassword123!',
      employeeNumber,
      dateOfHire: offerDetails.startDate.toISOString(),
      workEmail: offerDetails.email,
      primaryDepartmentId: offerDetails.department,
    };

    this.logger.log(`Creating employee profile from candidate ${candidateId}`);
    const employee = await this.realService.create(createEmployeeDto as any);
    this.logger.log(`Employee profile created: ${employee._id.toString()}`);
    
    return { employeeId: employee._id.toString() };
  }
}

@Injectable()
export class OrganizationStructureServiceAdapter implements IOrganizationStructureService {
  private readonly logger = new Logger(OrganizationStructureServiceAdapter.name);
  private readonly realService: OrganizationStructureService;

  constructor(
    @Inject(OrganizationStructureService) organizationStructureService: OrganizationStructureService,
  ) {
    if (!organizationStructureService) {
      throw new Error(
        'OrganizationStructureService is required. Ensure OrganizationStructureModule exports OrganizationStructureService.'
      );
    }
    this.realService = organizationStructureService;
    this.logger.log('✓ Using REAL OrganizationStructureService');
  }

  async validateDepartment(departmentId: string): Promise<boolean> {
    try {
      const result = await this.realService.validateDepartment(departmentId);
      return result.valid === true;
    } catch (error) {
      this.logger.error(`Error validating department ${departmentId}:`, error);
      return false;
    }
  }

  async getDepartment(
    departmentId: string,
  ): Promise<{ id: string; name: string; managerId?: string } | null> {
    try {
      const department = await this.realService.getDepartmentById(departmentId);
      if (!department) return null;

      return {
        id: department._id.toString(),
        name: department.name,
        managerId: department.headPositionId?.toString(),
      };
    } catch (error) {
      this.logger.error(`Error getting department ${departmentId}:`, error);
      return null;
    }
  }
}