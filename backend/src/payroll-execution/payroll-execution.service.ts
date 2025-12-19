import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  Connection,
  FilterQuery,
  Model,
  Types,
} from 'mongoose';
import {
  employeeSigningBonus,
  employeeSigningBonusDocument,
} from './models/EmployeeSigningBonus.schema';
// Avoid importing recruitment/termination schema types directly to prevent reflect-metadata enum typing errors
// Use `any` for termination benefit document typing to keep runtime import behavior unchanged
import { BonusStatus, BenefitStatus } from './enums/payroll-execution-enum';
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from '../employee-profile/models/employee-profile.schema';
import { signingBonusDocument } from '../payroll-configuration/models/signingBonus.schema';
import { terminationAndResignationBenefitsDocument } from '../payroll-configuration/models/terminationAndResignationBenefits';
import { payrollRuns, payrollRunsDocument } from './models/payrollRuns.schema';
import { employeePayrollDetails, employeePayrollDetailsDocument } from './models/employeePayrollDetails.schema';
import { PayRollStatus, PayRollPaymentStatus, BankStatus } from './enums/payroll-execution-enum';
import { allowance } from '../payroll-configuration/models/allowance.schema';
import { taxRules } from '../payroll-configuration/models/taxRules.schema';
import { insuranceBrackets } from '../payroll-configuration/models/insuranceBrackets.schema';
import { payGrade } from '../payroll-configuration/models/payGrades.schema';
import { Contract } from '../recruitment/models/contract.schema';
import { EmployeeStatus } from '../employee-profile/enums/employee-profile.enums';
import { ConfigStatus } from '../payroll-configuration/enums/payroll-configuration-enums';

export interface SigningBonusReviewFilter {
  employeeId?: string;
  status?: BonusStatus;
}

export class ApproveSigningBonusDto {
  approverId?: string;
  comment?: string;
  paymentDate?: string | Date;
}

export class ManualOverrideSigningBonusDto {
  authorizedBy!: string;
  comment?: string;
  paymentDate?: string | Date;
  status?: BonusStatus | string;
}

export interface TerminationBenefitReviewFilter {
  employeeId?: string;
  status?: BenefitStatus;
}

export class ApproveTerminationBenefitDto {
  approverId?: string;
  comment?: string;
}

export class ManualOverrideTerminationBenefitDto {
  authorizedBy!: string;
  comment?: string;
  status?: BenefitStatus | string;
}

export interface PayrollRunReviewFilter {
  status?: string;
  payrollPeriod?: string;
}

export class ReviewPayrollRunDto {
  action!: 'approve' | 'reject';
  reviewerId?: string;
  comment?: string;
  rejectionReason?: string;
}

export class EditPayrollRunDto {
  authorizedBy!: string;
  comment?: string;
  payrollPeriod?: string | Date;
  entity?: string;
  employees?: number;
  exceptions?: number;
  totalnetpay?: number;
}

export class ProcessPayrollRunDto {
  payrollSpecialistId?: string;
  payrollPeriod: string | Date;
  entity: string;
}

export class CalculatePayrollDto {
  employeeIds?: string[]; // List of employee IDs to process (if not using area)
  payrollPeriod: string | Date;
  payrollRunId?: string; // Optional: if updating existing run
  payrollSpecialistId?: string;
  entity: string; // Organization/entity name
  includeAllowances?: boolean; // Default: true
  includeInsurance?: boolean; // Default: true
  includeTaxes?: boolean; // Default: true
}

export interface TerminationBenefitReviewItem {
  id: string;
  employeeId: string;
  employeeName: string;
  status: BenefitStatus;
  benefitId?: string;
  benefitName?: string;
  benefitAmount?: number;
  terminationId?: string;
  terminationStatus?: string;
  hrClearanceCompleted: boolean;
  eligible: boolean;
  approvedBy?: string;
  comment?: string;
  overrideAuthorizedBy?: string;
  overrideComment?: string;
}

export interface PayrollRunReviewItem {
  id: string;
  runId: string;
  payrollPeriod: Date;
  status: string;
  entity: string;
  employees: number;
  exceptions: number;
  totalnetpay: number;
  payrollSpecialistId?: string;
  payrollManagerId?: string;
  financeStaffId?: string;
  paymentStatus: string;
  rejectionReason?: string;
  managerApprovalDate?: Date;
  financeApprovalDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PayrollIrregularity {
  type: 'salary_spike' | 'missing_bank' | 'negative_net_pay' | 'unusual_deduction' | 'zero_salary' | 'excessive_overtime';
  severity: 'high' | 'medium' | 'low';
  employeeId: string;
  employeeName: string;
  message: string;
  currentValue?: number;
  previousValue?: number;
  threshold?: number;
}

export interface PayrollPreviewDashboard {
  payrollRunId: string;
  runId: string;
  status: string;
  payrollPeriod: Date;
  entity: string;
  summary: {
    totalEmployees: number;
    processedEmployees: number;
    exceptions: number;
    totalGrossPay: number;
    totalDeductions: number;
    totalNetPay: number;
    totalTaxes: number;
    totalInsurance: number;
  };
  irregularities: PayrollIrregularity[];
  employeeBreakdown: Array<{
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    baseSalary: number;
    allowances: number;
    grossSalary: number;
    deductions: number;
    netSalary: number;
    netPay: number;
    bankStatus: string;
    hasIrregularities: boolean;
  }>;
  approvalWorkflow: {
    currentStep: 'specialist' | 'manager' | 'finance' | 'completed';
    specialist: { id?: string; date?: Date; status?: string };
    manager: { id?: string; date?: Date; status?: string };
    finance: { id?: string; date?: Date; status?: string };
  };
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
}

export class GenerateDraftPayrollDto {
  entity: string;
  payrollSpecialistId?: string;
  payrollPeriod?: string | Date; // If not provided, uses end of current month
}

export interface EscalatedIrregularity {
  irregularityId: string;
  type: string;
  severity: string;
  employeeId: string;
  employeeName: string;
  message: string;
  escalatedBy?: string;
  escalatedDate?: Date;
  resolution?: string;
  resolvedBy?: string;
  resolvedDate?: Date;
  status: 'pending' | 'resolved' | 'rejected';
}

export class ResolveIrregularityDto {
  irregularityId: string;
  resolution: string;
  resolvedBy: string;
  action: 'resolve' | 'reject';
}

export class LockPayrollDto {
  payrollManagerId: string;
  comment?: string;
}

export class UnlockPayrollDto {
  payrollManagerId: string;
  unlockReason: string;
  comment?: string;
}

export interface PayslipDistribution {
  payslipId: string;
  employeeId: string;
  employeeName: string;
  distributionMethod: 'email' | 'portal' | 'pdf';
  distributionDate: Date;
  status: 'sent' | 'failed' | 'pending';
  email?: string;
  downloadUrl?: string;
}

export interface SigningBonusReviewItem {
  id: string;
  employeeId: string;
  employeeName: string;
  status: BonusStatus;
  signingBonusId?: string;
  signingBonusAmount?: number;
  paymentDate: Date | null;
  eligible: boolean;
  contractId?: string;
  contractReference?: string;
  approvedBy?: string;
  comment?: string;
  overrideAuthorizedBy?: string;
  overrideComment?: string;
}

type ContractDetails = {
  contractId?: Types.ObjectId | string;
  contractReference?: string;
  signingBonusEligible?: boolean;
};

type EmployeeProfileWithContract = Record<string, any> & {
  contractDetails?: ContractDetails;
  _id?: Types.ObjectId;
  employeeId?: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  fullName?: string;
};

type LeanSigningBonus = Record<string, any> & {
  _id?: Types.ObjectId | string;
  amount?: number;
};

type LeanEmployeeSigningBonus = Record<string, any> & {
  _id?: Types.ObjectId;
  employeeId?: Types.ObjectId;
  signingBonusId?: Types.ObjectId | LeanSigningBonus;
  status?: BonusStatus;
  paymentDate?: Date | null;
};

type LeanTerminationBenefit = Record<string, any> & {
  _id?: Types.ObjectId | string;
  name?: string;
  amount?: number;
};

type LeanEmployeeTerminationResignation = Record<string, any> & {
  _id?: Types.ObjectId;
  employeeId?: Types.ObjectId;
  benefitId?: Types.ObjectId | LeanTerminationBenefit;
  terminationId?: Types.ObjectId | Record<string, any>;
  status?: BenefitStatus;
};

@Injectable()
export class PayrollExecutionService {
  private readonly signingBonusModel: Model<employeeSigningBonusDocument>;
  private readonly terminationBenefitModel: Model<any>;
  private readonly payrollRunModel: Model<payrollRunsDocument>;
  private readonly employeePayrollDetailsModel: Model<employeePayrollDetailsDocument>;
  private readonly employeeProfileModel: Model<EmployeeProfileDocument>;
  private readonly terminationRequestModel: Model<any>;
  private readonly clearanceChecklistModel: Model<any>;
  private readonly contractModel: Model<any>;
  private readonly allowanceModel: Model<any>;
  private readonly taxRulesModel: Model<any>;
  private readonly insuranceBracketsModel: Model<any>;
  private readonly payGradeModel: Model<any>;

  constructor(
    @Optional()
    @InjectModel(employeeSigningBonus.name)
    signingBonusModel?: Model<employeeSigningBonusDocument>,
    @Optional()
    @InjectModel('EmployeeTerminationResignation')
    terminationBenefitModel?: Model<any>,
    @Optional()
    @InjectModel(payrollRuns.name)
    payrollRunModel?: Model<payrollRunsDocument>,
    @Optional()
    @InjectModel(employeePayrollDetails.name)
    employeePayrollDetailsModel?: Model<employeePayrollDetailsDocument>,
    @Optional() @InjectConnection() connection?: Connection,
  ) {
    this.signingBonusModel =
      signingBonusModel ??
      (this.createUnavailableModelProxy(
        employeeSigningBonus.name,
      ) as Model<employeeSigningBonusDocument>);

    this.terminationBenefitModel =
      terminationBenefitModel ??
      (this.createUnavailableModelProxy('EmployeeTerminationResignation') as Model<any>);

    this.payrollRunModel =
      payrollRunModel ??
      (this.createUnavailableModelProxy(
        payrollRuns.name,
      ) as Model<payrollRunsDocument>);

    this.employeePayrollDetailsModel =
      employeePayrollDetailsModel ??
      (this.createUnavailableModelProxy(
        employeePayrollDetails.name,
      ) as Model<employeePayrollDetailsDocument>);

    if (!connection) {
      this.employeeProfileModel = this.createUnavailableModelProxy(
        EmployeeProfile.name,
      ) as Model<EmployeeProfileDocument>;
      this.terminationRequestModel = this.createUnavailableModelProxy(
        'TerminationRequest',
      ) as Model<any>;
      this.clearanceChecklistModel = this.createUnavailableModelProxy(
        'ClearanceChecklist',
      ) as Model<any>;
      return;
    }

    const existingModel = connection.models[
      EmployeeProfile.name
    ] as Model<EmployeeProfileDocument> | undefined;
    this.employeeProfileModel =
      existingModel ??
      connection.model<EmployeeProfileDocument>(EmployeeProfile.name);

    this.terminationRequestModel =
      (connection.models['TerminationRequest'] as Model<any>) ??
      connection.model<any>('TerminationRequest');

    this.clearanceChecklistModel =
      (connection.models['ClearanceChecklist'] as Model<any>) ??
      connection.model<any>('ClearanceChecklist');

    this.contractModel =
      (connection.models['Contract'] as Model<any>) ??
      connection.model<any>('Contract');

    this.allowanceModel =
      (connection.models[allowance.name] as Model<any>) ??
      connection.model<any>(allowance.name);

    this.taxRulesModel =
      (connection.models[taxRules.name] as Model<any>) ??
      connection.model<any>(taxRules.name);

    this.insuranceBracketsModel =
      (connection.models[insuranceBrackets.name] as Model<any>) ??
      connection.model<any>(insuranceBrackets.name);

    this.payGradeModel =
      (connection.models[payGrade.name] as Model<any>) ??
      connection.model<any>(payGrade.name);
  }

  async getProcessedSigningBonuses(
    filter: SigningBonusReviewFilter = {},
  ): Promise<SigningBonusReviewItem[]> {
    const query: FilterQuery<employeeSigningBonusDocument> = {
      paymentDate: { $ne: null },
    };

    if (filter.status) {
      if (!Object.values(BonusStatus).includes(filter.status)) {
        throw new BadRequestException('Unsupported signing bonus status filter');
      }
      query.status = filter.status;
    } else {
      query.status = {
        $in: [BonusStatus.PENDING, BonusStatus.APPROVED, BonusStatus.PAID],
      };
    }

    if (filter.employeeId) {
      if (!Types.ObjectId.isValid(filter.employeeId)) {
        throw new BadRequestException('Invalid employeeId filter');
      }
      query.employeeId = new Types.ObjectId(filter.employeeId);
    }

    const signingBonuses = await this.signingBonusModel
      .find(query)
      .populate('signingBonusId')
      .lean<LeanEmployeeSigningBonus[]>()
      .exec();

    if (!signingBonuses.length) {
      return [];
    }

    const employeeIds = Array.from(
      new Set(
        signingBonuses
          .map((bonus) => bonus.employeeId?.toString())
          .filter(Boolean) as string[],
      ),
    );

    const employees = await this.employeeProfileModel
      .find({ _id: { $in: employeeIds } })
      .lean<EmployeeProfileWithContract>()
      .exec();

    const employeeMap = new Map(
      employees.map((employee) => [employee._id.toString(), employee]),
    );

    const reviewItems: SigningBonusReviewItem[] = [];

    for (const bonus of signingBonuses) {
      if (!bonus.employeeId) continue;
      const employee = employeeMap.get(bonus.employeeId.toString());
      if (!employee) {
        continue;
      }

      if (!this.isContractEligible(employee)) {
        continue;
      }

      reviewItems.push(this.buildReviewItem(bonus, employee));
    }

    return reviewItems;
  }

  async approveSigningBonus(
    signingBonusId: string,
    dto: ApproveSigningBonusDto = {},
  ): Promise<SigningBonusReviewItem> {
    if (!Types.ObjectId.isValid(signingBonusId)) {
      throw new BadRequestException('Invalid signing bonus identifier');
    }

    const signingBonus = await this.signingBonusModel
      .findById(signingBonusId)
      .populate('signingBonusId')
      .exec();

    if (!signingBonus) {
      throw new NotFoundException('Signing bonus record not found');
    }

    if (signingBonus.status === BonusStatus.REJECTED) {
      throw new BadRequestException(
        'Rejected signing bonuses cannot be approved',
      );
    }

    const employee = await this.employeeProfileModel
      .findById(signingBonus.employeeId)
      .lean<EmployeeProfileWithContract>()
      .exec();

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    if (!this.isContractEligible(employee)) {
      throw new ForbiddenException(
        'Employee contract is not eligible for signing bonuses',
      );
    }

    const overridePaymentDate = this.normalizeDate(dto.paymentDate);

    if (!signingBonus.paymentDate && !overridePaymentDate) {
      throw new BadRequestException(
        'Signing bonus has not been processed yet',
      );
    }

    if (overridePaymentDate) {
      signingBonus.paymentDate = overridePaymentDate;
    } else if (!signingBonus.paymentDate) {
      signingBonus.paymentDate = new Date();
    }

    signingBonus.status = BonusStatus.APPROVED;
    await signingBonus.save();

    const leanBonus = signingBonus.toObject() as LeanEmployeeSigningBonus;
    const reviewItem = this.buildReviewItem(leanBonus, employee);
    reviewItem.approvedBy = dto.approverId;
    reviewItem.comment = dto.comment;
    return reviewItem;
  }

  async manuallyOverrideSigningBonus(
    signingBonusId: string,
    dto: ManualOverrideSigningBonusDto,
  ): Promise<SigningBonusReviewItem> {
    if (!Types.ObjectId.isValid(signingBonusId)) {
      throw new BadRequestException('Invalid signing bonus identifier');
    }

    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Override payload is required');
    }

    const authorizedBy = dto.authorizedBy?.trim();
    if (!authorizedBy) {
      throw new ForbiddenException(
        'Manual overrides require authorization details',
      );
    }

    if (dto.paymentDate === null) {
      throw new BadRequestException(
        'Manual overrides require a valid payment date value',
      );
    }

    const signingBonus = await this.signingBonusModel
      .findById(signingBonusId)
      .populate('signingBonusId')
      .exec();

    if (!signingBonus) {
      throw new NotFoundException('Signing bonus record not found');
    }

    const employee = await this.employeeProfileModel
      .findById(signingBonus.employeeId)
      .lean<EmployeeProfileWithContract>()
      .exec();

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    if (!this.isContractEligible(employee)) {
      throw new ForbiddenException(
        'Employee contract is not eligible for signing bonuses',
      );
    }

    const overrideStatus = this.normalizeOverrideStatus(dto.status);
    if (
      overrideStatus &&
      signingBonus.status === BonusStatus.APPROVED &&
      overrideStatus !== BonusStatus.APPROVED
    ) {
      // allow downgrading from approved only during phase 0 before payroll initiation
      signingBonus.status = overrideStatus;
    } else if (overrideStatus) {
      signingBonus.status = overrideStatus;
    }

    const overridePaymentDate =
      dto.paymentDate === undefined
        ? undefined
        : this.normalizeDate(dto.paymentDate);

    if (!signingBonus.paymentDate && !overridePaymentDate) {
      throw new BadRequestException(
        'Signing bonus has not been processed yet; provide a payment date override first',
      );
    }

    if (overridePaymentDate) {
      signingBonus.paymentDate = overridePaymentDate;
    }

    await signingBonus.save();

    const reviewItem = this.buildReviewItem(
      signingBonus.toObject() as LeanEmployeeSigningBonus,
      employee,
    );
    reviewItem.overrideAuthorizedBy = authorizedBy;
    reviewItem.overrideComment = dto.comment;
    return reviewItem;
  }

  private isContractEligible(
    employee?: EmployeeProfileWithContract,
  ): boolean {
    return !!employee?.contractDetails?.signingBonusEligible;
  }

  private buildReviewItem(
    bonus: LeanEmployeeSigningBonus,
    employee: EmployeeProfileWithContract,
  ): SigningBonusReviewItem {
    const { id, amount } = this.extractSigningBonusDetails(bonus.signingBonusId);
    return {
      id: bonus._id?.toString() || '',
      employeeId: bonus.employeeId?.toString() || '',
      employeeName: this.buildEmployeeName(employee),
      status: bonus.status || BonusStatus.PENDING,
      signingBonusId: id,
      signingBonusAmount: amount,
      paymentDate: bonus.paymentDate ?? null,
      eligible: true,
      contractId: this.normalizeObjectId(employee.contractDetails?.contractId),
      contractReference: employee.contractDetails?.contractReference,
    };
  }

  private extractSigningBonusDetails(
    signingBonus: LeanEmployeeSigningBonus['signingBonusId'],
  ): { id?: string; amount?: number } {
    if (!signingBonus) {
      return {};
    }

    if (signingBonus instanceof Types.ObjectId) {
      return { id: signingBonus.toString() };
    }

    const leanBonus = signingBonus as LeanSigningBonus & {
      _id?: Types.ObjectId | string;
    };

    return {
      id: this.normalizeObjectId(leanBonus._id),
      amount: leanBonus.amount,
    };
  }

  private buildEmployeeName(employee: EmployeeProfileWithContract): string {
    if (employee.fullName?.trim()) {
      return employee.fullName.trim();
    }

    return [employee.firstName, employee.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private normalizeOverrideStatus(
    status?: string | BonusStatus,
  ): BonusStatus | undefined {
    if (!status) {
      return undefined;
    }

    const normalized = Object.values(BonusStatus).find(
      (candidate) =>
        candidate === status ||
        candidate.toLowerCase() === status.toString().toLowerCase(),
    );

    if (!normalized) {
      throw new BadRequestException('Unsupported signing bonus status value');
    }

    if (normalized === BonusStatus.APPROVED) {
      throw new BadRequestException(
        'Manual overrides cannot directly approve signing bonuses',
      );
    }

    return normalized;
  }

  private normalizeObjectId(
    id?: Types.ObjectId | string,
  ): string | undefined {
    if (!id) {
      return undefined;
    }
    return id instanceof Types.ObjectId ? id.toString() : id;
  }

  private normalizeDate(value?: string | Date): Date | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid payment date value');
    }
    return parsed;
  }

  async getProcessedTerminationBenefits(
    filter: TerminationBenefitReviewFilter = {},
  ): Promise<TerminationBenefitReviewItem[]> {
    const query: FilterQuery<any> = {};

    if (filter.status) {
      if (!Object.values(BenefitStatus).includes(filter.status)) {
        throw new BadRequestException('Unsupported termination benefit status filter');
      }
      query.status = filter.status;
    } else {
      query.status = { $in: [BenefitStatus.PENDING, BenefitStatus.PAID] };
    }

    if (filter.employeeId) {
      if (!Types.ObjectId.isValid(filter.employeeId)) {
        throw new BadRequestException('Invalid employeeId filter');
      }
      query.employeeId = new Types.ObjectId(filter.employeeId);
    }

    const terminationBenefits = await this.terminationBenefitModel
      .find(query)
      .populate('benefitId')
      .populate('terminationId')
      .lean<LeanEmployeeTerminationResignation[]>()
      .exec();

    if (!terminationBenefits.length) {
      return [];
    }

    const employeeIds = Array.from(
      new Set(
        terminationBenefits
          .map((benefit) => benefit.employeeId?.toString())
          .filter(Boolean) as string[],
      ),
    );

    const employees = await this.employeeProfileModel
      .find({ _id: { $in: employeeIds } })
      .lean<EmployeeProfileWithContract>()
      .exec();

    const employeeMap = new Map(
      employees.map((employee) => [employee._id.toString(), employee]),
    );

    const terminationIds = Array.from(
      new Set(
        terminationBenefits
          .map((benefit) => {
            const termId = benefit.terminationId;
            return termId instanceof Types.ObjectId
              ? termId.toString()
              : (termId as any)?._id?.toString();
          })
          .filter(Boolean),
      ),
    );

    const terminationRequests = await this.terminationRequestModel
      .find({ _id: { $in: terminationIds } })
      .lean()
      .exec();

    const terminationMap = new Map(
      terminationRequests.map((req: any) => [req._id.toString(), req]),
    );

    const clearanceChecklists = await this.clearanceChecklistModel
      .find({ terminationId: { $in: terminationIds } })
      .lean()
      .exec();

    const clearanceMap = new Map(
      clearanceChecklists.map((checklist: any) => [
        checklist.terminationId.toString(),
        checklist,
      ]),
    );

    const reviewItems: TerminationBenefitReviewItem[] = [];

    for (const benefit of terminationBenefits) {
      if (!benefit.employeeId) continue;
      const employee = employeeMap.get(benefit.employeeId.toString());
      if (!employee) {
        continue;
      }

      const termId =
        benefit.terminationId instanceof Types.ObjectId
          ? benefit.terminationId.toString()
          : (benefit.terminationId as any)?._id?.toString();

      if (!termId) {
        continue;
      }

      const terminationRequest = terminationMap.get(termId);
      const clearanceChecklist = clearanceMap.get(termId);

      const hrClearanceCompleted = this.isHrClearanceCompleted(
        terminationRequest,
        clearanceChecklist,
      );

      if (!hrClearanceCompleted) {
        continue;
      }

      reviewItems.push(
        this.buildTerminationBenefitReviewItem(
          benefit,
          employee,
          terminationRequest,
          hrClearanceCompleted,
        ),
      );
    }

    return reviewItems;
  }

  async approveTerminationBenefit(
    terminationBenefitId: string,
    dto: ApproveTerminationBenefitDto = {},
  ): Promise<TerminationBenefitReviewItem> {
    if (!Types.ObjectId.isValid(terminationBenefitId)) {
      throw new BadRequestException('Invalid termination benefit identifier');
    }

    const terminationBenefit = await this.terminationBenefitModel
      .findById(terminationBenefitId)
      .populate('benefitId')
      .populate('terminationId')
      .exec();

    if (!terminationBenefit) {
      throw new NotFoundException('Termination benefit record not found');
    }

    if (terminationBenefit.status === BenefitStatus.REJECTED) {
      throw new BadRequestException(
        'Rejected termination benefits cannot be approved',
      );
    }

    const employee = await this.employeeProfileModel
      .findById(terminationBenefit.employeeId)
      .lean<EmployeeProfileWithContract>()
      .exec();

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const termId = terminationBenefit.terminationId.toString();
    const terminationRequest = await this.terminationRequestModel
      .findById(termId)
      .lean<{ status?: string; _id: Types.ObjectId }>()
      .exec();

    if (!terminationRequest) {
      throw new NotFoundException('Termination request not found');
    }

    const clearanceChecklist = await this.clearanceChecklistModel
      .findOne({ terminationId: termId })
      .lean()
      .exec();

    const hrClearanceCompleted = this.isHrClearanceCompleted(
      terminationRequest,
      clearanceChecklist,
    );

    if (!hrClearanceCompleted) {
      throw new ForbiddenException(
        'Termination benefits cannot be processed until HR clearance and final approvals are completed',
      );
    }

    if (terminationRequest.status !== 'approved') {
      throw new ForbiddenException(
        'Termination request must be approved before processing benefits',
      );
    }

    terminationBenefit.status = BenefitStatus.APPROVED;
    await terminationBenefit.save();

    const leanBenefit = terminationBenefit.toObject() as LeanEmployeeTerminationResignation;
    const reviewItem = this.buildTerminationBenefitReviewItem(
      leanBenefit,
      employee,
      terminationRequest,
      hrClearanceCompleted,
    );
    reviewItem.approvedBy = dto.approverId;
    reviewItem.comment = dto.comment;
    return reviewItem;
  }

  private isHrClearanceCompleted(
    terminationRequest?: any,
    clearanceChecklist?: any,
  ): boolean {
    if (!terminationRequest) {
      return false;
    }

    if (terminationRequest.status !== 'approved') {
      return false;
    }

    if (!clearanceChecklist) {
      return false;
    }

    if (!clearanceChecklist.items || !Array.isArray(clearanceChecklist.items)) {
      return false;
    }

    const allItemsApproved = clearanceChecklist.items.every(
      (item: any) => item.status === 'approved',
    );

    if (!allItemsApproved) {
      return false;
    }

    if (clearanceChecklist.equipmentList && Array.isArray(clearanceChecklist.equipmentList)) {
      const allEquipmentReturned = clearanceChecklist.equipmentList.every(
        (equipment: any) => equipment.returned === true,
      );
      if (!allEquipmentReturned) {
        return false;
      }
    }

    if (clearanceChecklist.cardReturned !== true) {
      return false;
    }

    return true;
  }

  private buildTerminationBenefitReviewItem(
    benefit: LeanEmployeeTerminationResignation,
    employee: EmployeeProfileWithContract,
    terminationRequest: any,
    hrClearanceCompleted: boolean,
  ): TerminationBenefitReviewItem {
    const { id, name, amount } = this.extractTerminationBenefitDetails(
      benefit.benefitId,
    );

    return {
      id: benefit._id?.toString() || '',
      employeeId: benefit.employeeId?.toString() || '',
      employeeName: this.buildEmployeeName(employee),
      status: benefit.status || BenefitStatus.PENDING,
      benefitId: id,
      benefitName: name,
      benefitAmount: amount,
      terminationId: this.normalizeObjectId(
        benefit.terminationId instanceof Types.ObjectId
          ? benefit.terminationId
          : (benefit.terminationId as any)?._id,
      ),
      terminationStatus: terminationRequest?.status,
      hrClearanceCompleted,
      eligible: hrClearanceCompleted,
    };
  }

  private extractTerminationBenefitDetails(
    benefit: LeanEmployeeTerminationResignation['benefitId'],
  ): { id?: string; name?: string; amount?: number } {
    if (!benefit) {
      return {};
    }

    if (benefit instanceof Types.ObjectId) {
      return { id: benefit.toString() };
    }

    const leanBenefit = benefit as LeanTerminationBenefit & {
      _id?: Types.ObjectId | string;
    };

    return {
      id: this.normalizeObjectId(leanBenefit._id),
      name: leanBenefit.name,
      amount: leanBenefit.amount,
    };
  }

  async manuallyOverrideTerminationBenefit(
    terminationBenefitId: string,
    dto: ManualOverrideTerminationBenefitDto,
  ): Promise<TerminationBenefitReviewItem> {
    if (!Types.ObjectId.isValid(terminationBenefitId)) {
      throw new BadRequestException('Invalid termination benefit identifier');
    }

    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Override payload is required');
    }

    const authorizedBy = dto.authorizedBy?.trim();
    if (!authorizedBy) {
      throw new ForbiddenException(
        'Manual overrides require Payroll Specialist authorization',
      );
    }

    const terminationBenefit = await this.terminationBenefitModel
      .findById(terminationBenefitId)
      .populate('benefitId')
      .populate('terminationId')
      .exec();

    if (!terminationBenefit) {
      throw new NotFoundException('Termination benefit record not found');
    }

    const employee = await this.employeeProfileModel
      .findById(terminationBenefit.employeeId)
      .lean<EmployeeProfileWithContract>()
      .exec();

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const termId = terminationBenefit.terminationId.toString();
    const terminationRequest = await this.terminationRequestModel
      .findById(termId)
      .lean<{ status?: string; _id: Types.ObjectId }>()
      .exec();

    if (!terminationRequest) {
      throw new NotFoundException('Termination request not found');
    }

    const clearanceChecklist = await this.clearanceChecklistModel
      .findOne({ terminationId: termId })
      .lean()
      .exec();

    const hrClearanceCompleted = this.isHrClearanceCompleted(
      terminationRequest,
      clearanceChecklist,
    );

    if (!hrClearanceCompleted) {
      throw new ForbiddenException(
        'Termination benefits cannot be manually adjusted until HR clearance is completed',
      );
    }

    const overrideStatus = this.normalizeBenefitStatus(dto.status);
    if (overrideStatus) {
      if (
        terminationBenefit.status === BenefitStatus.APPROVED &&
        overrideStatus !== BenefitStatus.APPROVED
      ) {
        terminationBenefit.status = overrideStatus;
      } else if (overrideStatus !== BenefitStatus.APPROVED) {
        terminationBenefit.status = overrideStatus;
      }
    }

    await terminationBenefit.save();

    this.logSystemAction('TERMINATION_BENEFIT_MANUAL_OVERRIDE', {
      terminationBenefitId: terminationBenefitId,
      authorizedBy,
      previousStatus: terminationBenefit.status,
      newStatus: overrideStatus || terminationBenefit.status,
      comment: dto.comment,
      employeeId: terminationBenefit.employeeId.toString(),
    });

    const leanBenefit = terminationBenefit.toObject() as LeanEmployeeTerminationResignation;
    const reviewItem = this.buildTerminationBenefitReviewItem(
      leanBenefit,
      employee,
      terminationRequest,
      hrClearanceCompleted,
    );
    reviewItem.overrideAuthorizedBy = authorizedBy;
    reviewItem.overrideComment = dto.comment;
    return reviewItem;
  }

  async getPayrollRunsForReview(
    filter: PayrollRunReviewFilter = {},
  ): Promise<PayrollRunReviewItem[]> {
    const query: FilterQuery<payrollRunsDocument> = {};

    if (filter.status) {
      if (!Object.values(PayRollStatus).includes(filter.status as PayRollStatus)) {
        throw new BadRequestException('Unsupported payroll run status filter');
      }
      query.status = filter.status as PayRollStatus;
    } else {
      query.status = {
        $in: [
          PayRollStatus.DRAFT,
          PayRollStatus.UNDER_REVIEW,
          PayRollStatus.PENDING_FINANCE_APPROVAL,
        ],
      };
    }

    if (filter.payrollPeriod) {
      const periodDate = this.normalizeDate(filter.payrollPeriod);
      if (periodDate) {
        query.payrollPeriod = periodDate;
      }
    }

    const payrollRuns = await this.payrollRunModel.find(query).lean().exec();

    return payrollRuns.map((run: any) => this.buildPayrollRunReviewItem(run));
  }

  async reviewPayrollRun(
    payrollRunId: string,
    dto: ReviewPayrollRunDto,
  ): Promise<PayrollRunReviewItem> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    if (!dto.action || !['approve', 'reject'].includes(dto.action)) {
      throw new BadRequestException('Review action must be either "approve" or "reject"');
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (dto.action === 'approve') {
      if (payrollRun.status === PayRollStatus.DRAFT) {
        payrollRun.status = PayRollStatus.UNDER_REVIEW;
        if (dto.reviewerId) {
          payrollRun.payrollManagerId = new Types.ObjectId(dto.reviewerId) as any;
        }
        payrollRun.managerApprovalDate = new Date();
      } else if (payrollRun.status === PayRollStatus.UNDER_REVIEW) {
        payrollRun.status = PayRollStatus.PENDING_FINANCE_APPROVAL;
        if (dto.reviewerId) {
          payrollRun.financeStaffId = new Types.ObjectId(dto.reviewerId) as any;
        }
        payrollRun.financeApprovalDate = new Date();
      } else if (payrollRun.status === PayRollStatus.PENDING_FINANCE_APPROVAL) {
        payrollRun.status = PayRollStatus.APPROVED;
        payrollRun.paymentStatus = PayRollPaymentStatus.PAID;
      } else {
        throw new BadRequestException(
          'Payroll run cannot be approved in its current status',
        );
      }
    } else if (dto.action === 'reject') {
      if (
        payrollRun.status === PayRollStatus.APPROVED ||
        payrollRun.status === PayRollStatus.LOCKED
      ) {
        throw new BadRequestException(
          'Approved or locked payroll runs cannot be rejected',
        );
      }
      payrollRun.status = PayRollStatus.REJECTED;
      payrollRun.rejectionReason = dto.rejectionReason || dto.comment || 'Rejected by reviewer';
    }

    await payrollRun.save();

    this.logSystemAction('PAYROLL_RUN_REVIEWED', {
      payrollRunId: payrollRunId,
      action: dto.action,
      reviewerId: dto.reviewerId,
      previousStatus: payrollRun.status,
      comment: dto.comment,
      rejectionReason: dto.rejectionReason,
    });

    return this.buildPayrollRunReviewItem(payrollRun.toObject());
  }

  async editPayrollRun(
    payrollRunId: string,
    dto: EditPayrollRunDto,
  ): Promise<PayrollRunReviewItem> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Edit payload is required');
    }

    const authorizedBy = dto.authorizedBy?.trim();
    if (!authorizedBy) {
      throw new ForbiddenException(
        'Manual edits require Payroll Specialist authorization',
      );
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayRollStatus.REJECTED && payrollRun.status !== PayRollStatus.DRAFT) {
      throw new ForbiddenException(
        'Payroll runs can only be edited when in DRAFT or REJECTED status',
      );
    }

    const previousState = {
      payrollPeriod: payrollRun.payrollPeriod,
      entity: payrollRun.entity,
      employees: payrollRun.employees,
      exceptions: payrollRun.exceptions,
      totalnetpay: payrollRun.totalnetpay,
    };

    if (dto.payrollPeriod) {
      const periodDate = this.normalizeDate(dto.payrollPeriod);
      if (periodDate) {
        payrollRun.payrollPeriod = periodDate;
      }
    }

    if (dto.entity !== undefined) {
      payrollRun.entity = dto.entity;
    }

    if (dto.employees !== undefined) {
      payrollRun.employees = dto.employees;
    }

    if (dto.exceptions !== undefined) {
      payrollRun.exceptions = dto.exceptions;
    }

    if (dto.totalnetpay !== undefined) {
      payrollRun.totalnetpay = dto.totalnetpay;
    }

    if (payrollRun.status === PayRollStatus.REJECTED) {
      payrollRun.status = PayRollStatus.DRAFT;
      payrollRun.rejectionReason = undefined;
    }

    await payrollRun.save();

    this.logSystemAction('PAYROLL_RUN_MANUAL_EDIT', {
      payrollRunId: payrollRunId,
      authorizedBy,
      previousState,
      newState: {
        payrollPeriod: payrollRun.payrollPeriod,
        entity: payrollRun.entity,
        employees: payrollRun.employees,
        exceptions: payrollRun.exceptions,
        totalnetpay: payrollRun.totalnetpay,
      },
      comment: dto.comment,
    });

    return this.buildPayrollRunReviewItem(payrollRun.toObject());
  }

  async processPayrollRunAutomatically(
    dto: ProcessPayrollRunDto,
  ): Promise<PayrollRunReviewItem> {
    if (!dto.payrollPeriod || !dto.entity) {
      throw new BadRequestException(
        'Payroll period and entity are required for automatic processing',
      );
    }

    const payrollPeriod = this.normalizeDate(dto.payrollPeriod);
    if (!payrollPeriod) {
      throw new BadRequestException('Invalid payroll period date');
    }

    const existingRun = await this.payrollRunModel
      .findOne({
        payrollPeriod,
        entity: dto.entity,
      })
      .exec();

    if (existingRun && existingRun.status !== PayRollStatus.REJECTED) {
      throw new BadRequestException(
        'A payroll run already exists for this period and entity',
      );
    }

    const payrollSpecialistId = dto.payrollSpecialistId
      ? new Types.ObjectId(dto.payrollSpecialistId)
      : undefined;

    const runId = await this.generatePayrollRunId(payrollPeriod);

    const newPayrollRun = new this.payrollRunModel({
      runId,
      payrollPeriod,
      entity: dto.entity,
      status: PayRollStatus.DRAFT,
      employees: 0,
      exceptions: 0,
      totalnetpay: 0,
      payrollSpecialistId: payrollSpecialistId,
      paymentStatus: 'pending',
    });

    await newPayrollRun.save();

    this.logSystemAction('PAYROLL_RUN_AUTOMATIC_PROCESSING_STARTED', {
      payrollRunId: newPayrollRun._id.toString(),
      runId: newPayrollRun.runId,
      payrollPeriod: payrollPeriod.toISOString(),
      entity: dto.entity,
      payrollSpecialistId: dto.payrollSpecialistId,
    });

    return this.buildPayrollRunReviewItem(newPayrollRun.toObject());
  }

  private normalizeBenefitStatus(
    status?: string | BenefitStatus,
  ): BenefitStatus | undefined {
    if (!status) {
      return undefined;
    }

    const normalized = Object.values(BenefitStatus).find(
      (candidate) =>
        candidate === status ||
        candidate.toLowerCase() === status.toString().toLowerCase(),
    );

    if (!normalized) {
      throw new BadRequestException('Unsupported termination benefit status value');
    }

    if (normalized === BenefitStatus.APPROVED) {
      throw new BadRequestException(
        'Manual overrides cannot directly approve termination benefits',
      );
    }

    return normalized;
  }

  private buildPayrollRunReviewItem(run: any): PayrollRunReviewItem {
    return {
      id: run._id.toString(),
      runId: run.runId,
      payrollPeriod: run.payrollPeriod,
      status: run.status,
      entity: run.entity,
      employees: run.employees,
      exceptions: run.exceptions,
      totalnetpay: run.totalnetpay,
      payrollSpecialistId: run.payrollSpecialistId?.toString(),
      payrollManagerId: run.payrollManagerId?.toString(),
      financeStaffId: run.financeStaffId?.toString(),
      paymentStatus: run.paymentStatus,
      rejectionReason: run.rejectionReason,
      managerApprovalDate: run.managerApprovalDate,
      financeApprovalDate: run.financeApprovalDate,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };
  }

  private async generatePayrollRunId(payrollPeriod: Date): Promise<string> {
    const year = payrollPeriod.getFullYear();
    const month = String(payrollPeriod.getMonth() + 1).padStart(2, '0');

    const existingRuns = await this.payrollRunModel
      .find({
        runId: new RegExp(`^PR-${year}-`),
      })
      .sort({ runId: -1 })
      .limit(1)
      .exec();

    let sequence = 1;
    if (existingRuns.length > 0) {
      const lastRunId = existingRuns[0].runId;
      const match = lastRunId.match(/PR-\d{4}-(\d+)/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    return `PR-${year}-${String(sequence).padStart(4, '0')}`;
  }

  async calculatePayrollAutomatically(
    dto: CalculatePayrollDto,
  ): Promise<PayrollRunReviewItem> {
    const payrollPeriod = this.normalizeDate(dto.payrollPeriod);
    if (!payrollPeriod) {
      throw new BadRequestException('Invalid payroll period date');
    }

    if (!dto.entity) {
      throw new BadRequestException('Entity name is required');
    }

    let payrollRun: payrollRunsDocument;
    if (dto.payrollRunId && Types.ObjectId.isValid(dto.payrollRunId)) {
      const foundRun = await this.payrollRunModel.findById(dto.payrollRunId).exec();
      if (!foundRun) {
        throw new NotFoundException('Payroll run not found');
      }
      payrollRun = foundRun;
      if (payrollRun.status !== PayRollStatus.DRAFT) {
        throw new BadRequestException(
          'Can only calculate payroll for draft payroll runs',
        );
      }
    } else {
      const runId = await this.generatePayrollRunId(payrollPeriod);
      const payrollSpecialistId = dto.payrollSpecialistId
        ? new Types.ObjectId(dto.payrollSpecialistId)
        : undefined;

      payrollRun = new this.payrollRunModel({
        runId,
        payrollPeriod,
        entity: dto.entity,
        status: PayRollStatus.DRAFT,
        employees: 0,
        exceptions: 0,
        totalnetpay: 0,
        payrollSpecialistId: payrollSpecialistId,
        paymentStatus: PayRollPaymentStatus.PENDING,
      });
      await payrollRun.save();
    }

    let employeeIds: Types.ObjectId[] = [];
    if (dto.employeeIds && dto.employeeIds.length > 0) {
      employeeIds = dto.employeeIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));
    } else {
      const allEmployees = await this.employeeProfileModel
        .find({
          status: { $in: [EmployeeStatus.ACTIVE, EmployeeStatus.PROBATION] },
        })
        .select('_id')
        .lean()
        .exec();
      employeeIds = allEmployees.map((emp: any) => emp._id);
    }

    if (employeeIds.length === 0) {
      throw new BadRequestException('No employees found to process');
    }

    const employees = await this.employeeProfileModel
      .find({ _id: { $in: employeeIds } })
      .lean()
      .exec();

    const contracts = await this.contractModel
      .find({ employeeId: { $in: employeeIds } })
      .lean()
      .exec();

    const contractMap = new Map(
      contracts.map((contract: any) => [
        contract.employeeId?.toString(),
        contract,
      ]),
    );

    const allowances = await this.allowanceModel
      .find({ status: ConfigStatus.APPROVED })
      .lean()
      .exec();

    const taxRules = await this.taxRulesModel
      .find({ status: ConfigStatus.APPROVED })
      .lean()
      .exec();

    const insuranceBrackets = await this.insuranceBracketsModel
      .find({ status: ConfigStatus.APPROVED })
      .lean()
      .exec();

    const payGrades = await this.payGradeModel
      .find({ status: ConfigStatus.APPROVED })
      .lean()
      .exec();

    let totalNetPay = 0;
    let processedEmployees = 0;
    let exceptions = 0;
    const exceptionsList: string[] = [];

    for (const employee of employees) {
      try {
        const validationResult = this.validateEmployeeForPayroll(
          employee,
          contractMap.get(employee._id.toString()),
          payrollPeriod,
        );

        if (!validationResult.valid) {
          exceptions++;
          exceptionsList.push(
            `${employee.employeeNumber || employee._id}: ${validationResult.reason}`,
          );
          continue;
        }

        const contract = contractMap.get(employee._id.toString());
        const includeAllowances = dto.includeAllowances !== false;
        const includeInsurance = dto.includeInsurance !== false;
        const includeTaxes = dto.includeTaxes !== false;

            const calculation = await this.calculateEmployeePayroll(
              employee,
              contract,
              payrollPeriod,
              { includeAllowances, includeInsurance, includeTaxes },
              allowances,
              taxRules,
              insuranceBrackets,
              payGrades,
            );

        const existingDetail = await this.employeePayrollDetailsModel
          .findOne({
            employeeId: employee._id,
            payrollRunId: payrollRun._id,
          })
          .exec();

        if (existingDetail) {
          existingDetail.baseSalary = calculation.baseSalary;
          existingDetail.allowances = calculation.totalAllowances;
          existingDetail.deductions = calculation.totalDeductions;
          existingDetail.netSalary = calculation.netSalary;
          existingDetail.netPay = calculation.netPay;
          existingDetail.bonus = calculation.bonus;
          existingDetail.benefit = calculation.benefit;
          existingDetail.bankStatus = calculation.bankStatus as any;
          existingDetail.exceptions = calculation.exceptions;
          await existingDetail.save();
        } else {
          const payrollDetail = new this.employeePayrollDetailsModel({
            employeeId: employee._id,
            payrollRunId: payrollRun._id,
            baseSalary: calculation.baseSalary,
            allowances: calculation.totalAllowances,
            deductions: calculation.totalDeductions,
            netSalary: calculation.netSalary,
            netPay: calculation.netPay,
            bonus: calculation.bonus,
            benefit: calculation.benefit,
            bankStatus: calculation.bankStatus as BankStatus,
            exceptions: calculation.exceptions,
          });
          await payrollDetail.save();
        }

        totalNetPay += calculation.netPay;
        processedEmployees++;
      } catch (error: any) {
        exceptions++;
        exceptionsList.push(
          `${employee.employeeNumber || employee._id}: ${error.message}`,
        );
      }
    }

    payrollRun.employees = processedEmployees;
    payrollRun.exceptions = exceptions;
    payrollRun.totalnetpay = totalNetPay;
    await payrollRun.save();

    this.logSystemAction('PAYROLL_AUTOMATIC_CALCULATION', {
      payrollRunId: payrollRun._id.toString(),
      employeeIds: dto.employeeIds || 'all',
      payrollPeriod: payrollPeriod.toISOString(),
      processedEmployees,
      exceptions,
      totalNetPay,
      exceptionsList,
      includeAllowances: dto.includeAllowances !== false,
      includeInsurance: dto.includeInsurance !== false,
      includeTaxes: dto.includeTaxes !== false,
    });

    return this.buildPayrollRunReviewItem(payrollRun.toObject());
  }

  private validateEmployeeForPayroll(
    employee: any,
    contract: any,
    payrollPeriod: Date,
  ): { valid: boolean; reason?: string } {
    if (!employee) {
      return { valid: false, reason: 'Employee not found' };
    }

    if (
      employee.status !== EmployeeStatus.ACTIVE &&
      employee.status !== EmployeeStatus.PROBATION
    ) {
      return {
        valid: false,
        reason: `Employee status is ${employee.status} (must be ACTIVE or PROBATION)`,
      };
    }

    if (employee.status === EmployeeStatus.SUSPENDED) {
      return { valid: false, reason: 'Employee is suspended' };
    }

    if (!contract) {
      return { valid: false, reason: 'Employee contract not found' };
    }

    if (employee.contractEndDate && new Date(employee.contractEndDate) < payrollPeriod) {
      return { valid: false, reason: 'Employee contract has expired' };
    }

    if (
      employee.contractStartDate &&
      new Date(employee.contractStartDate) > payrollPeriod
    ) {
      return { valid: false, reason: 'Employee contract has not started yet' };
    }

    if (!contract.grossSalary || contract.grossSalary <= 0) {
      return { valid: false, reason: 'Invalid contract gross salary' };
    }

    return { valid: true };
  }

  private async calculateEmployeePayroll(
    employee: any,
    contract: any,
    payrollPeriod: Date,
    schemaOptions: { includeAllowances: boolean; includeInsurance: boolean; includeTaxes: boolean },
    allowances: any[],
    taxRules: any[],
    insuranceBrackets: any[],
    payGrades: any[],
  ): Promise<{
    baseSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    netSalary: number;
    netPay: number;
    bonus?: number;
    benefit?: number;
    breakdown: any;
    bankStatus: BankStatus;
    exceptions?: string;
  }> {
    // Step 1: Determine base salary (from contract or pay grade)
    let baseSalary = this.calculateBaseSalary(employee, contract, payGrades);

    // Step 2: Calculate proration for mid-month hires/terminations
    const periodStart = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth(), 1);
    const periodEnd = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth() + 1, 0);
    const daysInPeriod = periodEnd.getDate();

    const contractStart = contract.startDate ? new Date(contract.startDate) : (employee.hireDate ? new Date(employee.hireDate) : null);
    const contractEnd = contract.endDate ? new Date(contract.endDate) : (employee.contractEndDate ? new Date(employee.contractEndDate) : null);

    let workedDays = daysInPeriod;
    if (contractStart && contractStart > periodStart) {
      const from = contractStart;
      const to = contractEnd && contractEnd < periodEnd ? contractEnd : periodEnd;
      if (to >= from) {
        workedDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      } else {
        workedDays = 0;
      }
    } else if (contractEnd && contractEnd < periodEnd) {
      const from = contractStart && contractStart > periodStart ? contractStart : periodStart;
      const to = contractEnd;
      if (to >= from) {
        workedDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      } else {
        workedDays = 0;
      }
    }

    const prorateFactor = daysInPeriod > 0 ? Math.max(0, Math.min(1, workedDays / daysInPeriod)) : 1;
    const proratedBaseSalary = Math.round(baseSalary * prorateFactor * 100) / 100;
    baseSalary = proratedBaseSalary;

    // Step 3: Calculate allowances (prorated)
    const allowanceBreakdown: { name: string; amount: number }[] = [];
    let totalAllowances = 0;
    if (schemaOptions.includeAllowances) {
      for (const allowance of allowances) {
        const amount = allowance.amount || 0;
        const proratedAmount = Math.round(amount * prorateFactor * 100) / 100;
        allowanceBreakdown.push({ name: allowance.name, amount: proratedAmount });
        totalAllowances += proratedAmount;
      }
    }

    // Step 4: Calculate Gross Salary = Base Pay + Allowances
    const grossSalary = Math.round((baseSalary + totalAllowances) * 100) / 100;

    // Step 5: Deduction Phase 1 - Taxes (applied to gross salary)
    const taxBreakdown: { name: string; rate: number; amount: number }[] = [];
    let totalTaxes = 0;
    if (schemaOptions.includeTaxes) {
      for (const taxRule of taxRules) {
        const taxAmount = Math.round((grossSalary * (taxRule.rate || 0)) / 100 * 100) / 100;
        taxBreakdown.push({ name: taxRule.name, rate: taxRule.rate, amount: taxAmount });
        totalTaxes += taxAmount;
      }
    }

    // Step 6: Deduction Phase 2 - Social/Health Insurance (applied to gross salary)
    const insuranceBreakdown: {
      name: string;
      employeeRate: number;
      employerRate: number;
      employeeAmount: number;
      employerAmount: number;
    }[] = [];
    let totalInsurance = 0;
    if (schemaOptions.includeInsurance) {
      for (const insurance of insuranceBrackets) {
        if (grossSalary >= (insurance.minSalary || 0) && grossSalary <= (insurance.maxSalary || Infinity)) {
          const employeeAmount = Math.round((grossSalary * (insurance.employeeRate || 0)) / 100 * 100) / 100;
          const employerAmount = Math.round((grossSalary * (insurance.employerRate || 0)) / 100 * 100) / 100;
          insuranceBreakdown.push({
            name: insurance.name,
            employeeRate: insurance.employeeRate,
            employerRate: insurance.employerRate,
            employeeAmount,
            employerAmount
          });
          totalInsurance += employeeAmount;
        }
      }
    }

    // Step 7: Calculate Net Salary = Gross - Taxes - Insurance
    const netSalary = Math.round((grossSalary - totalTaxes - totalInsurance) * 100) / 100;

    // Step 8: Deduction Phase 3 - Unpaid Leave Days (deducted from net salary)
    const unpaidLeaveDays = employee.unpaidLeaveDays ?? 0;
    const dailyRate = grossSalary / 30; // Egyptian labor law: monthly salary / 30 days
    const unpaidLeaveDeduction = Math.round(unpaidLeaveDays * dailyRate * 100) / 100;

    // Step 9: Deduction Phase 4 - Penalties (must not reduce below minimum wage)
    const penalties = await this.getEmployeePenalties(employee._id);
    const penaltiesAmount = penalties > 0 ? penalties : 0;

    // Determine statutory minimum wage (Egyptian labor law 2025)
    const payGrade = employee.payGradeId ? payGrades.find((pg: any) => pg._id.toString() === employee.payGradeId.toString()) : undefined;
    const statutoryMin = (contract.minimumWage || payGrade?.minimumWage || Number(process.env.STATUTORY_MIN_WAGE) || 6000);

    // Calculate net after unpaid leave
    const netAfterUnpaidLeave = Math.round((netSalary - unpaidLeaveDeduction) * 100) / 100;

    // Apply penalties but ensure we don't go below minimum wage
    const maxPenaltyAllowed = Math.max(0, netAfterUnpaidLeave - statutoryMin);
    const appliedPenalties = Math.min(penaltiesAmount, maxPenaltyAllowed);

    // Step 10: Apply recoveries and refunds
    const recoveries = employee.recoveries ?? 0;
    const refunds = employee.refunds ?? 0;

    // Step 11: Calculate Final Net Pay
    let netPay = Math.round((netAfterUnpaidLeave - appliedPenalties - recoveries + refunds) * 100) / 100;

    // Ensure net pay never goes below statutory minimum
    if (netPay < statutoryMin) {
      netPay = statutoryMin;
    }

    // Build other deductions breakdown
    const otherDeductions: { name: string; amount: number }[] = [];
    if (unpaidLeaveDeduction > 0) {
      otherDeductions.push({ name: 'Unpaid Leave', amount: unpaidLeaveDeduction });
    }
    if (appliedPenalties > 0) {
      otherDeductions.push({ name: 'Penalties', amount: appliedPenalties });
    }
    if (recoveries > 0) {
      otherDeductions.push({ name: 'Recoveries', amount: recoveries });
    }

    // Total deductions = taxes + insurance + unpaid leave + penalties + recoveries
    const totalDeductions = Math.round((totalTaxes + totalInsurance + unpaidLeaveDeduction + appliedPenalties + recoveries) * 100) / 100;

    const breakdown = {
      grossSalary,
      baseSalary,
      prorateFactor,
      workedDays,
      daysInPeriod,
      allowances: allowanceBreakdown,
      taxes: taxBreakdown,
      insurance: insuranceBreakdown,
      otherDeductions,
      penalties: penaltiesAmount || 0,
      appliedPenalties,
      unpaidLeaveDays,
      unpaidLeaveDeduction,
      refunds: refunds || 0,
      recoveries: recoveries || 0,
      statutoryMinimum: statutoryMin,
      bonuses: 0,
      benefits: 0,
    };

    const bankStatus = this.checkBankStatus(employee);

    return {
      baseSalary,
      totalAllowances,
      totalDeductions,
      netSalary,
      netPay,
      breakdown,
      bankStatus,
    };
  }

  private calculateBaseSalary(
    employee: any,
    contract: any,
    payGrades: any[],
  ): number {
    if (contract?.grossSalary) {
      return contract.grossSalary;
    }

    if (employee.payGradeId) {
      const payGrade = payGrades.find(
        (pg: any) => pg._id.toString() === employee.payGradeId.toString(),
      );
      if (payGrade?.baseSalary) {
        return payGrade.baseSalary;
      }
    }

    throw new BadRequestException(
      `Unable to determine base salary for employee ${employee.employeeNumber || employee._id}`,
    );
  }

  private async getEmployeePenalties(employeeId: Types.ObjectId): Promise<number> {
    try {
      const penaltiesModel = this.employeeProfileModel.db.models['employeePenalties'];
      if (!penaltiesModel) {
        return 0;
      }
      const penalties = await penaltiesModel
        .find({ employeeId })
        .lean()
        .exec();
      return penalties.reduce(
        (sum: number, p: any) => sum + (p.amount || 0),
        0,
      );
    } catch {
      return 0;
    }
  }

  private checkBankStatus(employee: any): BankStatus {
    return employee.bankAccountNumber ? BankStatus.VALID : BankStatus.MISSING;
  }

  private logSystemAction(action: string, details: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date(),
      action,
      details: JSON.stringify(details),
    };

    console.log('[PAYROLL_SYSTEM_LOG]', JSON.stringify(logEntry, null, 2));
  }

  private createUnavailableModelProxy(modelName: string) {
    return new Proxy(
      {},
      {
        get: (_, prop) => {
          throw new Error(
            `Model "${modelName}" is unavailable (missing provider for property "${String(
              prop,
            )}").`,
          );
        },
      },
    );
  }

  /**
   * Auto-process signing bonus when a new hire onboarding event occurs.
   * Creates a signing bonus record (status PENDING) so Payroll Specialist can review.
   * onboardingPayload may include: { signingBonusFlag?: boolean, signingBonusAmount?: number, paymentDate?: string|Date }
   */
  async handleNewHireEvent(
    employeeId: string,
    onboardingPayload?: { signingBonusFlag?: boolean; signingBonusAmount?: number; paymentDate?: string | Date },
  ) {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee identifier');
    }

    const employee = await this.employeeProfileModel.findById(employeeId).lean().exec();
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const contract = await this.contractModel.findOne({ employeeId: new Types.ObjectId(employeeId) }).lean().exec();

    const eligibleByContract = !!(contract && !Array.isArray(contract) && (contract.signingBonusEligible || contract.signingBonusAmount));
    const eligibleByOnboarding = !!onboardingPayload?.signingBonusFlag;
    const amount = onboardingPayload?.signingBonusAmount ?? (contract && !Array.isArray(contract) ? contract.signingBonusAmount : undefined) ?? 0;

    if (!eligibleByContract && !eligibleByOnboarding) {
      // nothing to auto-process
      return null;
    }

    // prepare payment date: use provided or now
    const paymentDate = (onboardingPayload?.paymentDate ? this.normalizeDate(onboardingPayload.paymentDate) : undefined) ?? new Date();

    const newRecord: any = {
      employeeId: new Types.ObjectId(employeeId),
      signingBonusId: (contract && !Array.isArray(contract) ? contract.signingBonusId : undefined) ?? undefined,
      givenAmount: amount, // Updated to use givenAmount to match schema
      paymentDate,
      status: BonusStatus.PENDING,
      processedAutomatically: true,
      createdAt: new Date(),
    };

    const created = await this.signingBonusModel.create(newRecord as any);

    this.logSystemAction('AUTO_PROCESS_SIGNING_BONUS', {
      employeeId,
      signingBonusId: created._id?.toString?.(),
      amount,
      paymentDate: paymentDate.toISOString(),
    });

    return created;
  }

  /**
   * Auto-process benefits upon resignation. Calculates gratuity, accrued leave payout and pending allowances
   * and creates termination/resignation benefit records with status PENDING for payroll review.
   */
  async handleResignationEvent(
    employeeId: string,
    terminationId: string,
    opts?: { terminationDate?: string | Date },
  ) {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee identifier');
    }

    const employee = await this.employeeProfileModel.findById(employeeId).lean().exec();
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const contract = await this.contractModel.findOne({ employeeId: new Types.ObjectId(employeeId) }).lean().exec();
    if (!contract || Array.isArray(contract)) {
      throw new BadRequestException('Employee contract not found');
    }

    const termDate = (opts?.terminationDate ? this.normalizeDate(opts.terminationDate) : undefined) ?? new Date();

    // compute tenure in years
    const start = contract.startDate ? new Date(contract.startDate) : ((employee as any).hireDate ? new Date((employee as any).hireDate) : null);
    const tenureYears = start ? Math.max(0, (termDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0;

    const grossSalary = contract.grossSalary || 0;

    // basic gratuity estimation: company policy placeholder (e.g., 1/12 of gross per year)
    const gratuity = Math.floor((grossSalary * (tenureYears || 0)) / 12);

    // accrued leave payout: if employee has accruedLeaveDays
    const accruedDays = (employee as any).accruedLeaveDays ?? 0;
    const dailyRate = grossSalary / 30;
    const accruedLeavePayout = Math.round(accruedDays * dailyRate);

    // pending allowances -- try to sum from allowances that apply (simple placeholder)
    const pendingAllowances = 0; // detailed logic would query allowanceModel per employee; placeholder left intentionally minimal

    const benefitsToCreate = [
      { name: 'Gratuity', amount: gratuity },
      { name: 'Accrued Leave Payout', amount: accruedLeavePayout },
    ];

    const createdRecords: any[] = [];

    for (const b of benefitsToCreate) {
      const record: any = {
        employeeId: new Types.ObjectId(employeeId),
        benefitId: { _id: b.name, name: b.name, amount: b.amount },
        terminationId: new Types.ObjectId(terminationId),
        amount: b.amount,
        status: BenefitStatus.PENDING,
        createdAt: new Date(),
        processedAutomatically: true,
      };
      const created = await this.terminationBenefitModel.create(record as any);
      createdRecords.push(created);
    }

    this.logSystemAction('AUTO_PROCESS_RESIGNATION_BENEFITS', {
      employeeId,
      terminationId,
      termDate: termDate.toISOString(),
      createdCount: createdRecords.length,
    });

    return createdRecords;
  }

  /**
   * Auto-process benefits upon termination. Calculates severance, gratuity and pending compensation
   * and creates termination benefit records with status PENDING.
   */
  async handleTerminationEvent(
    employeeId: string,
    terminationId: string,
    opts?: { terminationDate?: string | Date; includeSeverance?: boolean },
  ) {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee identifier');
    }

    const employee = await this.employeeProfileModel.findById(employeeId).lean().exec();
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const contract = await this.contractModel.findOne({ employeeId: new Types.ObjectId(employeeId) }).lean().exec();
    if (!contract || Array.isArray(contract)) {
      throw new BadRequestException('Employee contract not found');
    }

    const termDate = (opts?.terminationDate ? this.normalizeDate(opts.terminationDate) : undefined) ?? new Date();
    const start = contract.startDate ? new Date(contract.startDate) : ((employee as any).hireDate ? new Date((employee as any).hireDate) : null);
    const tenureYears = start ? Math.max(0, (termDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0;

    const grossSalary = contract.grossSalary || 0;

    // severance: simple placeholder (e.g., one month gross per year of service if included)
    const includeSeverance = opts?.includeSeverance ?? true;
    const severance = includeSeverance ? Math.round(grossSalary * tenureYears) : 0;

    // gratuity: same placeholder as resignation
    const gratuity = Math.floor((grossSalary * (tenureYears || 0)) / 12);

    // pending compensation placeholder
    const pendingCompensation = 0;

    const benefitsToCreate = [
      { name: 'Severance', amount: severance },
      { name: 'Gratuity', amount: gratuity },
      { name: 'Pending Compensation', amount: pendingCompensation },
    ];

    const createdRecords: any[] = [];
    for (const b of benefitsToCreate) {
      if (!b.amount || b.amount <= 0) continue;
      const record: any = {
        employeeId: new Types.ObjectId(employeeId),
        benefitId: { _id: b.name, name: b.name, amount: b.amount },
        terminationId: new Types.ObjectId(terminationId),
        givenAmount: b.amount, // Updated to use givenAmount to match schema
        status: BenefitStatus.PENDING,
        createdAt: new Date(),
        processedAutomatically: true,
      };
      const created = await this.terminationBenefitModel.create(record as any);
      createdRecords.push(created);
    }

    this.logSystemAction('AUTO_PROCESS_TERMINATION_BENEFITS', {
      employeeId,
      terminationId,
      termDate: termDate.toISOString(),
      createdCount: createdRecords.length,
    });

    return createdRecords;
  }

  /**
   * Generate payslip for an employee in a specific payroll run
   * This creates a detailed payslip document with all earnings and deductions breakdown
   */
  async generatePayslip(
    employeeId: string,
    payrollRunId: string,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(employeeId) || !Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid employee or payroll run identifier');
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();
    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    const employeePayrollDetail = await this.employeePayrollDetailsModel
      .findOne({
        employeeId: new Types.ObjectId(employeeId),
        payrollRunId: new Types.ObjectId(payrollRunId),
      })
      .exec();

    if (!employeePayrollDetail) {
      throw new NotFoundException('Employee payroll details not found for this payroll run');
    }

    const employee = await this.employeeProfileModel.findById(employeeId).lean().exec();
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const contract = await this.contractModel.findOne({ employeeId: new Types.ObjectId(employeeId) }).lean().exec();
    const allowances = await this.allowanceModel.find({ status: ConfigStatus.APPROVED }).lean().exec();
    const taxRules = await this.taxRulesModel.find({ status: ConfigStatus.APPROVED }).lean().exec();
    const insuranceBrackets = await this.insuranceBracketsModel.find({ status: ConfigStatus.APPROVED }).lean().exec();
    const payGrades = await this.payGradeModel.find({ status: ConfigStatus.APPROVED }).lean().exec();

    // Recalculate or use existing breakdown
    const calculation = await this.calculateEmployeePayroll(
      employee,
      contract,
      payrollRun.payrollPeriod,
      { includeAllowances: true, includeInsurance: true, includeTaxes: true },
      allowances,
      taxRules,
      insuranceBrackets,
      payGrades,
    );

    // Build earnings details
    const earningsDetails = {
      baseSalary: calculation.baseSalary,
      allowances: calculation.breakdown.allowances || [],
      bonuses: [],
      benefits: [],
      refunds: calculation.breakdown.refunds > 0 ? [{ name: 'Refund', amount: calculation.breakdown.refunds }] : [],
    };

    // Build deductions details
    const deductionsDetails = {
      taxes: calculation.breakdown.taxes || [],
      insurances: calculation.breakdown.insurance || [],
      penalties: calculation.breakdown.appliedPenalties > 0 ? {
        reason: 'Misconduct penalties',
        amount: calculation.breakdown.appliedPenalties,
      } : undefined,
    };

    // Check if payslip already exists
    const PaySlipModel = this.employeeProfileModel.db.models['paySlip'];
    if (!PaySlipModel) {
      throw new Error('PaySlip model not available');
    }

    const existingPayslip = await PaySlipModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      payrollRunId: new Types.ObjectId(payrollRunId),
    }).exec();

    if (existingPayslip) {
      // Update existing payslip
      existingPayslip.earningsDetails = earningsDetails;
      existingPayslip.deductionsDetails = deductionsDetails;
      existingPayslip.totalGrossSalary = calculation.breakdown.grossSalary;
      existingPayslip.totaDeductions = calculation.totalDeductions;
      existingPayslip.netPay = calculation.netPay;
      await existingPayslip.save();

      this.logSystemAction('PAYSLIP_UPDATED', {
        employeeId,
        payrollRunId,
        payslipId: existingPayslip._id.toString(),
        netPay: calculation.netPay,
      });

      return existingPayslip.toObject();
    }

    // Create new payslip
    const newPayslip = new PaySlipModel({
      employeeId: new Types.ObjectId(employeeId),
      payrollRunId: new Types.ObjectId(payrollRunId),
      earningsDetails,
      deductionsDetails,
      totalGrossSalary: calculation.breakdown.grossSalary,
      totaDeductions: calculation.totalDeductions,
      netPay: calculation.netPay,
      paymentStatus: 'pending',
    });

    await newPayslip.save();

    this.logSystemAction('PAYSLIP_GENERATED', {
      employeeId,
      payrollRunId,
      payslipId: newPayslip._id.toString(),
      netPay: calculation.netPay,
    });

    return newPayslip.toObject();
  }

  /**
   * Generate payslips for all employees in a payroll run
   */
  async generatePayslipsForPayrollRun(payrollRunId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();
    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayRollStatus.APPROVED) {
      throw new BadRequestException('Payroll run must be approved before generating payslips');
    }

    const employeePayrollDetails = await this.employeePayrollDetailsModel
      .find({ payrollRunId: new Types.ObjectId(payrollRunId) })
      .lean()
      .exec();

    if (!employeePayrollDetails.length) {
      throw new NotFoundException('No employee payroll details found for this payroll run');
    }

    const payslips: any[] = [];
    const errors: string[] = [];

    for (const detail of employeePayrollDetails) {
      try {
        const payslip = await this.generatePayslip(
          detail.employeeId.toString(),
          payrollRunId,
        );
        payslips.push(payslip);
      } catch (error: any) {
        errors.push(`Employee ${detail.employeeId}: ${error.message}`);
      }
    }

    this.logSystemAction('PAYSLIPS_BATCH_GENERATED', {
      payrollRunId,
      successCount: payslips.length,
      errorCount: errors.length,
      errors,
    });

    return payslips;
  }

  /**
   * Get payslip for a specific employee in a payroll run
   */
  async getPayslip(employeeId: string, payrollRunId: string): Promise<any> {
    if (!Types.ObjectId.isValid(employeeId) || !Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid employee or payroll run identifier');
    }

    const PaySlipModel = this.employeeProfileModel.db.models['paySlip'];
    if (!PaySlipModel) {
      throw new Error('PaySlip model not available');
    }

    const payslip = await PaySlipModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      payrollRunId: new Types.ObjectId(payrollRunId),
    })
      .populate('employeeId')
      .populate('payrollRunId')
      .lean()
      .exec();

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    return payslip;
  }

  /**
   * Get all payslips for a payroll run
   */
  async getPayslipsForPayrollRun(payrollRunId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    const PaySlipModel = this.employeeProfileModel.db.models['paySlip'];
    if (!PaySlipModel) {
      throw new Error('PaySlip model not available');
    }

    const payslips = await PaySlipModel.find({
      payrollRunId: new Types.ObjectId(payrollRunId),
    })
      .populate('employeeId')
      .lean()
      .exec();

    return payslips;
  }

  /**
   * Generate draft payroll automatically at the end of payroll cycle
   * This creates a draft payroll run and calculates all employee salaries
   */
  async generateDraftPayrollAutomatically(
    dto: GenerateDraftPayrollDto,
  ): Promise<PayrollPreviewDashboard> {
    if (!dto.entity) {
      throw new BadRequestException('Entity name is required');
    }

    // Determine payroll period (default: end of current month)
    let payrollPeriod: Date;
    if (dto.payrollPeriod) {
      payrollPeriod = this.normalizeDate(dto.payrollPeriod)!;
    } else {
      const now = new Date();
      payrollPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    }

    // Check if draft already exists for this period
    const existingDraft = await this.payrollRunModel
      .findOne({
        payrollPeriod,
        entity: dto.entity,
        status: PayRollStatus.DRAFT,
      })
      .exec();

    if (existingDraft) {
      // Return preview of existing draft
      return this.getPayrollPreviewDashboard(existingDraft._id.toString());
    }

    // Generate new draft payroll run
    const runId = await this.generatePayrollRunId(payrollPeriod);
    const payrollSpecialistId = dto.payrollSpecialistId
      ? new Types.ObjectId(dto.payrollSpecialistId)
      : undefined;

    const draftPayrollRun = new this.payrollRunModel({
      runId,
      payrollPeriod,
      entity: dto.entity,
      status: PayRollStatus.DRAFT,
      employees: 0,
      exceptions: 0,
      totalnetpay: 0,
      payrollSpecialistId,
      paymentStatus: PayRollPaymentStatus.PENDING,
    });

    await draftPayrollRun.save();

    // Auto-calculate payroll for all active employees
    const calculateDto: CalculatePayrollDto = {
      payrollPeriod,
      entity: dto.entity,
      payrollRunId: draftPayrollRun._id.toString(),
      payrollSpecialistId: dto.payrollSpecialistId,
      includeAllowances: true,
      includeInsurance: true,
      includeTaxes: true,
    };

    await this.calculatePayrollAutomatically(calculateDto);

    this.logSystemAction('DRAFT_PAYROLL_AUTO_GENERATED', {
      payrollRunId: draftPayrollRun._id.toString(),
      runId,
      payrollPeriod: payrollPeriod.toISOString(),
      entity: dto.entity,
      payrollSpecialistId: dto.payrollSpecialistId,
    });

    // Return preview dashboard
    return this.getPayrollPreviewDashboard(draftPayrollRun._id.toString());
  }

  /**
   * Get payroll preview dashboard with irregularities and breakdown
   */
  async getPayrollPreviewDashboard(
    payrollRunId: string,
  ): Promise<PayrollPreviewDashboard> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();
    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    // Get all employee payroll details
    const employeePayrollDetails = await this.employeePayrollDetailsModel
      .find({ payrollRunId: new Types.ObjectId(payrollRunId) })
      .lean()
      .exec();

    // Get employee profiles
    const employeeIds = employeePayrollDetails.map((d) => d.employeeId);
    const employees = await this.employeeProfileModel
      .find({ _id: { $in: employeeIds } })
      .lean()
      .exec();

    const employeeMap = new Map(
      employees.map((emp: any) => [emp._id.toString(), emp]),
    );

    // Calculate summary
    let totalGrossPay = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;
    let totalTaxes = 0;
    let totalInsurance = 0;

    const employeeBreakdown: PayrollPreviewDashboard['employeeBreakdown'] = [];

    for (const detail of employeePayrollDetails) {
      const employee = employeeMap.get(detail.employeeId.toString());
      if (!employee) continue;

      const grossSalary = detail.baseSalary + detail.allowances;
      totalGrossPay += grossSalary;
      totalDeductions += detail.deductions;
      totalNetPay += detail.netPay;

      employeeBreakdown.push({
        employeeId: detail.employeeId.toString(),
        employeeName: this.buildEmployeeName(employee),
        employeeNumber: employee.employeeNumber || 'N/A',
        baseSalary: detail.baseSalary,
        allowances: detail.allowances,
        grossSalary,
        deductions: detail.deductions,
        netSalary: detail.netSalary,
        netPay: detail.netPay,
        bankStatus: detail.bankStatus,
        hasIrregularities: false, // Will be updated below
      });
    }

    // Detect irregularities
    const irregularities = await this.detectPayrollIrregularities(
      payrollRunId,
      employeePayrollDetails,
      employeeMap,
    );

    // Mark employees with irregularities
    const employeesWithIrregularities = new Set(
      irregularities.map((i) => i.employeeId),
    );
    employeeBreakdown.forEach((emp) => {
      emp.hasIrregularities = employeesWithIrregularities.has(emp.employeeId);
    });

    // Determine approval workflow state
    const approvalWorkflow = this.buildApprovalWorkflow(payrollRun);

    // Determine permissions
    const canEdit =
      payrollRun.status === PayRollStatus.DRAFT ||
      payrollRun.status === PayRollStatus.REJECTED;
    const canApprove = payrollRun.status !== PayRollStatus.APPROVED && payrollRun.status !== PayRollStatus.LOCKED;
    const canReject = payrollRun.status !== PayRollStatus.APPROVED && payrollRun.status !== PayRollStatus.LOCKED;

    return {
      payrollRunId: payrollRun._id.toString(),
      runId: payrollRun.runId,
      status: payrollRun.status,
      payrollPeriod: payrollRun.payrollPeriod,
      entity: payrollRun.entity,
      summary: {
        totalEmployees: employees.length,
        processedEmployees: payrollRun.employees,
        exceptions: payrollRun.exceptions,
        totalGrossPay: Math.round(totalGrossPay * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalNetPay: Math.round(totalNetPay * 100) / 100,
        totalTaxes: Math.round(totalTaxes * 100) / 100,
        totalInsurance: Math.round(totalInsurance * 100) / 100,
      },
      irregularities,
      employeeBreakdown,
      approvalWorkflow,
      canEdit,
      canApprove,
      canReject,
    };
  }

  /**
   * Detect irregularities in payroll run
   * Flags: salary spikes, missing bank accounts, negative net pay, etc.
   */
  private async detectPayrollIrregularities(
    payrollRunId: string,
    currentPayrollDetails: any[],
    employeeMap: Map<string, any>,
  ): Promise<PayrollIrregularity[]> {
    const irregularities: PayrollIrregularity[] = [];

    // Get previous payroll run for comparison
    const currentRun = await this.payrollRunModel.findById(payrollRunId).exec();
    if (!currentRun) return irregularities;

    const previousRun = await this.payrollRunModel
      .findOne({
        entity: currentRun.entity,
        payrollPeriod: { $lt: currentRun.payrollPeriod },
        status: { $in: [PayRollStatus.APPROVED, PayRollStatus.LOCKED] },
      })
      .sort({ payrollPeriod: -1 })
      .limit(1)
      .exec();

    let previousPayrollDetails: any[] = [];
    if (previousRun) {
      previousPayrollDetails = await this.employeePayrollDetailsModel
        .find({ payrollRunId: previousRun._id })
        .lean()
        .exec();
    }

    const previousPayrollMap = new Map(
      previousPayrollDetails.map((d) => [d.employeeId.toString(), d]),
    );

    // Check each employee for irregularities
    for (const currentDetail of currentPayrollDetails) {
      const employee = employeeMap.get(currentDetail.employeeId.toString());
      if (!employee) continue;

      const employeeName = this.buildEmployeeName(employee);
      const employeeId = currentDetail.employeeId.toString();

      // 1. Check for missing bank account
      if (currentDetail.bankStatus === BankStatus.MISSING) {
        irregularities.push({
          type: 'missing_bank',
          severity: 'high',
          employeeId,
          employeeName,
          message: `Employee ${employeeName} has missing bank account details`,
        });
      }

      // 2. Check for negative net pay
      if (currentDetail.netPay < 0) {
        irregularities.push({
          type: 'negative_net_pay',
          severity: 'high',
          employeeId,
          employeeName,
          message: `Employee ${employeeName} has negative net pay: ${currentDetail.netPay} EGP`,
          currentValue: currentDetail.netPay,
        });
      }

      // 3. Check for zero salary (unusual)
      if (currentDetail.netPay === 0 && currentDetail.baseSalary > 0) {
        irregularities.push({
          type: 'zero_salary',
          severity: 'medium',
          employeeId,
          employeeName,
          message: `Employee ${employeeName} has zero net pay despite having base salary`,
          currentValue: currentDetail.netPay,
        });
      }

      // 4. Check for salary spike (if previous data available)
      if (previousPayrollMap.has(employeeId)) {
        const previousDetail = previousPayrollMap.get(employeeId);
        const currentNetPay = currentDetail.netPay;
        const previousNetPay = previousDetail.netPay;

        // Detect spike if current is more than 30% different from previous
        const threshold = 0.3; // 30%
        const percentageChange = Math.abs(
          (currentNetPay - previousNetPay) / previousNetPay,
        );

        if (percentageChange > threshold && previousNetPay > 0) {
          const direction = currentNetPay > previousNetPay ? 'increase' : 'decrease';
          irregularities.push({
            type: 'salary_spike',
            severity: percentageChange > 0.5 ? 'high' : 'medium',
            employeeId,
            employeeName,
            message: `Employee ${employeeName} has sudden salary ${direction}: ${Math.round(percentageChange * 100)}% change`,
            currentValue: currentNetPay,
            previousValue: previousNetPay,
            threshold: threshold * 100,
          });
        }
      }

      // 5. Check for unusual deductions (more than 40% of gross salary)
      const grossSalary = currentDetail.baseSalary + currentDetail.allowances;
      const deductionPercentage = (currentDetail.deductions / grossSalary) * 100;

      if (deductionPercentage > 40 && grossSalary > 0) {
        irregularities.push({
          type: 'unusual_deduction',
          severity: deductionPercentage > 60 ? 'high' : 'medium',
          employeeId,
          employeeName,
          message: `Employee ${employeeName} has unusually high deductions: ${Math.round(deductionPercentage)}% of gross salary`,
          currentValue: currentDetail.deductions,
          threshold: 40,
        });
      }

      // 6. Check for exceptions in payroll detail
      if (currentDetail.exceptions && currentDetail.exceptions.trim() !== '') {
        irregularities.push({
          type: 'zero_salary',
          severity: 'low',
          employeeId,
          employeeName,
          message: `Employee ${employeeName} has processing exception: ${currentDetail.exceptions}`,
        });
      }
    }

    return irregularities;
  }

  /**
   * Build approval workflow state from payroll run
   */
  private buildApprovalWorkflow(
    payrollRun: payrollRunsDocument,
  ): PayrollPreviewDashboard['approvalWorkflow'] {
    let currentStep: 'specialist' | 'manager' | 'finance' | 'completed' =
      'specialist';

    if (payrollRun.status === PayRollStatus.DRAFT) {
      currentStep = 'specialist';
    } else if (payrollRun.status === PayRollStatus.UNDER_REVIEW) {
      currentStep = 'manager';
    } else if (payrollRun.status === PayRollStatus.PENDING_FINANCE_APPROVAL) {
      currentStep = 'finance';
    } else if (payrollRun.status === PayRollStatus.APPROVED || payrollRun.status === PayRollStatus.LOCKED) {
      currentStep = 'completed';
    }

    return {
      currentStep,
      specialist: {
        id: payrollRun.payrollSpecialistId?.toString(),
        date: (payrollRun as any).createdAt,
        status: payrollRun.status === PayRollStatus.DRAFT ? 'pending' : 'completed',
      },
      manager: {
        id: payrollRun.payrollManagerId?.toString(),
        date: payrollRun.managerApprovalDate,
        status:
          payrollRun.status === PayRollStatus.DRAFT
            ? 'pending'
            : payrollRun.status === PayRollStatus.UNDER_REVIEW
            ? 'in_review'
            : payrollRun.managerApprovalDate
            ? 'completed'
            : 'pending',
      },
      finance: {
        id: payrollRun.financeStaffId?.toString(),
        date: payrollRun.financeApprovalDate,
        status:
          payrollRun.status === PayRollStatus.APPROVED || payrollRun.status === PayRollStatus.LOCKED
            ? 'completed'
            : payrollRun.status === PayRollStatus.PENDING_FINANCE_APPROVAL
            ? 'in_review'
            : 'pending',
      },
    };
  }

  /**
   * Send payroll for manager approval
   * Transitions from DRAFT to UNDER_REVIEW
   */
  async sendForManagerApproval(
    payrollRunId: string,
    payrollSpecialistId?: string,
  ): Promise<PayrollRunReviewItem> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();
    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayRollStatus.DRAFT) {
      throw new BadRequestException(
        'Only DRAFT payroll runs can be sent for manager approval',
      );
    }

    // Check for high-severity irregularities
    const employeePayrollDetails = await this.employeePayrollDetailsModel
      .find({ payrollRunId: new Types.ObjectId(payrollRunId) })
      .lean()
      .exec();

    const employeeIds = employeePayrollDetails.map((d) => d.employeeId);
    const employees = await this.employeeProfileModel
      .find({ _id: { $in: employeeIds } })
      .lean()
      .exec();

    const employeeMap = new Map(
      employees.map((emp: any) => [emp._id.toString(), emp]),
    );

    const irregularities = await this.detectPayrollIrregularities(
      payrollRunId,
      employeePayrollDetails,
      employeeMap,
    );

    const highSeverityIrregularities = irregularities.filter(
      (i) => i.severity === 'high',
    );

    if (highSeverityIrregularities.length > 0) {
      throw new BadRequestException(
        `Cannot send for approval: ${highSeverityIrregularities.length} high-severity irregularities detected. Please resolve them first.`,
      );
    }

    // Update status
    payrollRun.status = PayRollStatus.UNDER_REVIEW;
    if (payrollSpecialistId) {
      payrollRun.payrollSpecialistId = new Types.ObjectId(
        payrollSpecialistId,
      ) as any;
    }
    await payrollRun.save();

    this.logSystemAction('PAYROLL_SENT_FOR_MANAGER_APPROVAL', {
      payrollRunId: payrollRunId,
      runId: payrollRun.runId,
      payrollSpecialistId,
      irregularitiesCount: irregularities.length,
    });

    return this.buildPayrollRunReviewItem(payrollRun.toObject());
  }

  /**
   * Send payroll for finance approval (after manager approval)
   * Transitions from UNDER_REVIEW to PENDING_FINANCE_APPROVAL
   */
  async sendForFinanceApproval(
    payrollRunId: string,
    payrollManagerId?: string,
  ): Promise<PayrollRunReviewItem> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();
    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayRollStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Only payroll runs UNDER_REVIEW can be sent for finance approval',
      );
    }

    // Update status
    payrollRun.status = PayRollStatus.PENDING_FINANCE_APPROVAL;
    if (payrollManagerId) {
      payrollRun.payrollManagerId = new Types.ObjectId(payrollManagerId) as any;
    }
    payrollRun.managerApprovalDate = new Date();
    await payrollRun.save();

    this.logSystemAction('PAYROLL_SENT_FOR_FINANCE_APPROVAL', {
      payrollRunId: payrollRunId,
      runId: payrollRun.runId,
      payrollManagerId,
    });

    return this.buildPayrollRunReviewItem(payrollRun.toObject());
  }

  /**
   * Final approval by finance
   * Transitions from PENDING_FINANCE_APPROVAL to APPROVED
   * Sets payment status to PAID and triggers payslip generation
   */
  async finalApprovalByFinance(
    payrollRunId: string,
    financeStaffId?: string,
  ): Promise<PayrollRunReviewItem> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();
    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayRollStatus.PENDING_FINANCE_APPROVAL) {
      throw new BadRequestException(
        'Only payroll runs PENDING_FINANCE_APPROVAL can be finally approved',
      );
    }

    // Update status
    payrollRun.status = PayRollStatus.APPROVED;
    payrollRun.paymentStatus = PayRollPaymentStatus.PAID;
    if (financeStaffId) {
      payrollRun.financeStaffId = new Types.ObjectId(financeStaffId) as any;
    }
    payrollRun.financeApprovalDate = new Date();
    await payrollRun.save();

    this.logSystemAction('PAYROLL_FINAL_APPROVAL_BY_FINANCE', {
      payrollRunId: payrollRunId,
      runId: payrollRun.runId,
      financeStaffId,
    });

    // Automatically generate and distribute payslips after finance approval
    try {
      await this.generateAndDistributePayslipsAutomatically(payrollRunId);
    } catch (error: any) {
      this.logSystemAction('PAYSLIP_AUTO_GENERATION_ERROR', {
        payrollRunId,
        error: error.message,
      });
      // Don't fail the approval if payslip generation fails
    }

    return this.buildPayrollRunReviewItem(payrollRun.toObject());
  }

  /**
   * Get escalated irregularities for manager review
   * Returns all irregularities that need managerial decision
   */
  async getEscalatedIrregularities(
    payrollRunId: string,
  ): Promise<EscalatedIrregularity[]> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();
    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    // Get all employee payroll details
    const employeePayrollDetails = await this.employeePayrollDetailsModel
      .find({ payrollRunId: new Types.ObjectId(payrollRunId) })
      .lean()
      .exec();

    const employeeIds = employeePayrollDetails.map((d) => d.employeeId);
    const employees = await this.employeeProfileModel
      .find({ _id: { $in: employeeIds } })
      .lean()
      .exec();

    const employeeMap = new Map(
      employees.map((emp: any) => [emp._id.toString(), emp]),
    );

    // Detect all irregularities
    const irregularities = await this.detectPayrollIrregularities(
      payrollRunId,
      employeePayrollDetails,
      employeeMap,
    );

    // Convert to escalated irregularities format
    // In real implementation, this would check a tracking table for escalation status
    const escalatedIrregularities: EscalatedIrregularity[] = irregularities
      .filter((i) => i.severity === 'high' || i.severity === 'medium')
      .map((irregularity, index) => ({
        irregularityId: `${payrollRunId}-${irregularity.employeeId}-${index}`,
        type: irregularity.type,
        severity: irregularity.severity,
        employeeId: irregularity.employeeId,
        employeeName: irregularity.employeeName,
        message: irregularity.message,
        status: 'pending' as const,
      }));

    return escalatedIrregularities;
  }

  /**
   * Resolve escalated irregularity
   * Allows manager to provide resolution for complex issues
   */
  async resolveEscalatedIrregularity(
    dto: ResolveIrregularityDto,
  ): Promise<EscalatedIrregularity> {
    if (!dto.irregularityId || !dto.resolution || !dto.resolvedBy) {
      throw new BadRequestException(
        'Irregularity ID, resolution, and resolver are required',
      );
    }

    // In real implementation, this would update a tracking table
    // For now, we'll return the resolved irregularity
    const resolvedIrregularity: EscalatedIrregularity = {
      irregularityId: dto.irregularityId,
      type: 'resolved',
      severity: 'low',
      employeeId: '',
      employeeName: '',
      message: dto.resolution,
      resolvedBy: dto.resolvedBy,
      resolvedDate: new Date(),
      resolution: dto.resolution,
      status: dto.action === 'resolve' ? 'resolved' : 'rejected',
    };

    this.logSystemAction('IRREGULARITY_RESOLVED_BY_MANAGER', {
      irregularityId: dto.irregularityId,
      resolution: dto.resolution,
      resolvedBy: dto.resolvedBy,
      action: dto.action,
    });

    return resolvedIrregularity;
  }

  /**
   * Manager reviews and approves payroll draft
   * Enhanced with irregularity review
   */
  async managerReviewAndApprove(
    payrollRunId: string,
    payrollManagerId: string,
    comment?: string,
  ): Promise<PayrollRunReviewItem> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();
    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayRollStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Only payroll runs UNDER_REVIEW can be approved by manager',
      );
    }

    // Check for unresolved high-severity irregularities
    const escalatedIrregularities = await this.getEscalatedIrregularities(
      payrollRunId,
    );
    const unresolvedHighSeverity = escalatedIrregularities.filter(
      (i) => i.severity === 'high' && i.status === 'pending',
    );

    if (unresolvedHighSeverity.length > 0) {
      throw new BadRequestException(
        `Cannot approve: ${unresolvedHighSeverity.length} high-severity irregularities remain unresolved. Please resolve or escalate them first.`,
      );
    }

    // Manager approves and sends to finance
    return this.sendForFinanceApproval(payrollRunId, payrollManagerId);
  }

  /**
   * Lock/Freeze finalized payroll
   * Prevents any modifications after finalization
   */
  async lockPayroll(
    payrollRunId: string,
    dto: LockPayrollDto,
  ): Promise<PayrollRunReviewItem> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    if (!dto.payrollManagerId) {
      throw new BadRequestException('Payroll Manager ID is required to lock payroll');
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();
    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    // Can only lock APPROVED payrolls
    if (payrollRun.status !== PayRollStatus.APPROVED) {
      throw new BadRequestException(
        'Only APPROVED payroll runs can be locked. Current status: ' +
          payrollRun.status,
      );
    }

    // Update status to LOCKED
    payrollRun.status = PayRollStatus.LOCKED;
    if (!payrollRun.payrollManagerId) {
      payrollRun.payrollManagerId = new Types.ObjectId(
        dto.payrollManagerId,
      ) as any;
    }
    await payrollRun.save();

    this.logSystemAction('PAYROLL_LOCKED', {
      payrollRunId: payrollRunId,
      runId: payrollRun.runId,
      lockedBy: dto.payrollManagerId,
      comment: dto.comment,
      lockDate: new Date(),
    });

    return this.buildPayrollRunReviewItem(payrollRun.toObject());
  }

  /**
   * Unlock/Unfreeze payroll with reason
   * Allows corrections under exceptional circumstances
   */
  async unlockPayroll(
    payrollRunId: string,
    dto: UnlockPayrollDto,
  ): Promise<PayrollRunReviewItem> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    if (!dto.payrollManagerId) {
      throw new BadRequestException(
        'Payroll Manager ID is required to unlock payroll',
      );
    }

    if (!dto.unlockReason || dto.unlockReason.trim() === '') {
      throw new BadRequestException(
        'Unlock reason is required for audit trail',
      );
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();
    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    // Can only unlock LOCKED payrolls
    if (payrollRun.status !== PayRollStatus.LOCKED) {
      throw new BadRequestException(
        'Only LOCKED payroll runs can be unlocked. Current status: ' +
          payrollRun.status,
      );
    }

    // Update status back to APPROVED (or UNLOCKED if that status exists)
    payrollRun.status = PayRollStatus.UNLOCKED;
    payrollRun.unlockReason = dto.unlockReason;
    await payrollRun.save();

    this.logSystemAction('PAYROLL_UNLOCKED', {
      payrollRunId: payrollRunId,
      runId: payrollRun.runId,
      unlockedBy: dto.payrollManagerId,
      unlockReason: dto.unlockReason,
      comment: dto.comment,
      unlockDate: new Date(),
    });

    return this.buildPayrollRunReviewItem(payrollRun.toObject());
  }

  /**
   * Generate and distribute payslips automatically
   * Triggered after finance approval
   */
  async generateAndDistributePayslipsAutomatically(
    payrollRunId: string,
  ): Promise<PayslipDistribution[]> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    const payrollRun = await this.payrollRunModel.findById(payrollRunId).exec();
    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    // Verify payroll is approved
    if (payrollRun.status !== PayRollStatus.APPROVED && payrollRun.status !== PayRollStatus.LOCKED) {
      throw new BadRequestException(
        'Payslips can only be generated for APPROVED or LOCKED payroll runs',
      );
    }

    // Generate payslips for all employees
    const payslips = await this.generatePayslipsForPayrollRun(payrollRunId);

    // Distribute payslips
    const distributions: PayslipDistribution[] = [];

    for (const payslip of payslips) {
      const p: any = payslip;
      const employee = await this.employeeProfileModel
        .findById(p.employeeId)
        .lean()
        .exec();

      if (!employee) continue;

      const distribution: PayslipDistribution = {
        payslipId: p._id?.toString?.(),
        employeeId: p.employeeId?.toString?.(),
        employeeName: this.buildEmployeeName(employee),
        distributionMethod: 'portal', // Default method
        distributionDate: new Date(),
        status: 'sent',
        email: (employee as any).email || undefined,
        downloadUrl: `/api/payroll-execution/payslips/${p._id}/download`,
      };

      distributions.push(distribution);

      // In real implementation, this would:
      // 1. Generate PDF
      // 2. Send email notification
      // 3. Make available in employee portal
      // 4. Update distribution tracking table
    }

    this.logSystemAction('PAYSLIPS_AUTO_GENERATED_AND_DISTRIBUTED', {
      payrollRunId: payrollRunId,
      runId: payrollRun.runId,
      payslipsGenerated: payslips.length,
      distributionsAttempted: distributions.length,
      distributionDate: new Date(),
    });

    return distributions;
  }

  /**
   * Get payslip distribution status
   */
  async getPayslipDistributionStatus(
    payrollRunId: string,
  ): Promise<PayslipDistribution[]> {
    if (!Types.ObjectId.isValid(payrollRunId)) {
      throw new BadRequestException('Invalid payroll run identifier');
    }

    const payslips = await this.getPayslipsForPayrollRun(payrollRunId);

    const distributions: PayslipDistribution[] = [];

    for (const payslip of payslips) {
      const p: any = payslip;
      const employee = await this.employeeProfileModel
        .findById(p.employeeId)
        .lean()
        .exec();

      if (!employee) continue;

      distributions.push({
        payslipId: p._id?.toString?.(),
        employeeId: p.employeeId?.toString?.(),
        employeeName: this.buildEmployeeName(employee),
        distributionMethod: 'portal',
        distributionDate: p.createdAt || new Date(),
        status: p.paymentStatus === 'paid' ? 'sent' : 'pending',
        email: (employee as any).email || undefined,
        downloadUrl: `/api/payroll-execution/payslips/${p._id}/download`,
      });
    }

    return distributions;
  }

  /**
   * Download payslip as PDF
   * Returns payslip data formatted for PDF generation
   */
  async downloadPayslipPDF(payslipId: string): Promise<any> {
    if (!Types.ObjectId.isValid(payslipId)) {
      throw new BadRequestException('Invalid payslip identifier');
    }

    const PaySlipModel = this.employeeProfileModel.db.models['paySlip'];
    if (!PaySlipModel) {
      throw new Error('PaySlip model not available');
    }

    const payslip = await PaySlipModel.findById(payslipId)
      .populate('employeeId')
      .populate('payrollRunId')
      .lean()
      .exec();

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    // Format data for PDF generation
    const p: any = payslip;
    const pdfData = {
      payslipId: p._id?.toString(),
      employee: {
        name: this.buildEmployeeName(p.employeeId),
        employeeNumber: p.employeeId?.employeeNumber,
        department: p.employeeId?.department,
        position: p.employeeId?.position,
      },
      payrollRun: {
        runId: p.payrollRunId?.runId,
        period: p.payrollRunId?.payrollPeriod,
        entity: p.payrollRunId?.entity,
      },
      earnings: {
        baseSalary: p.earningsDetails?.baseSalary,
        allowances: p.earningsDetails?.allowances || [],
        bonuses: p.earningsDetails?.bonuses || [],
        benefits: p.earningsDetails?.benefits || [],
        refunds: p.earningsDetails?.refunds || [],
        totalGross: p.totalGrossSalary,
      },
      deductions: {
        taxes: p.deductionsDetails?.taxes,
        insurances: p.deductionsDetails?.insurances || [],
        penalties: p.deductionsDetails?.penalties,
        totalDeductions: p.totaDeductions,
      },
      netPay: p.netPay,
      paymentStatus: p.paymentStatus,
      generatedDate: p.createdAt,
    };

    // In real implementation, this would:
    // 1. Use PDF generation library (e.g., PDFKit, Puppeteer)
    // 2. Apply company template
    // 3. Return PDF buffer or stream

    return pdfData;
  }

  /**
   * Resend payslip to employee
   * Manual distribution trigger
   */
  async resendPayslip(
    payslipId: string,
    distributionMethod: 'email' | 'portal',
  ): Promise<PayslipDistribution> {
    if (!Types.ObjectId.isValid(payslipId)) {
      throw new BadRequestException('Invalid payslip identifier');
    }

    const PaySlipModel = this.employeeProfileModel.db.models['paySlip'];
    if (!PaySlipModel) {
      throw new Error('PaySlip model not available');
    }

    const payslip = await PaySlipModel.findById(payslipId)
      .populate('employeeId')
      .lean()
      .exec();

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    const p: any = payslip;
    const employee = p.employeeId;

    const distribution: PayslipDistribution = {
      payslipId: p._id?.toString?.(),
      employeeId: employee._id.toString(),
      employeeName: this.buildEmployeeName(employee),
      distributionMethod,
      distributionDate: new Date(),
      status: 'sent',
      email: employee.email || undefined,
      downloadUrl: `/api/payroll-execution/payslips/${p._id}/download`,
    };

    this.logSystemAction('PAYSLIP_RESENT', {
      payslipId: p._id?.toString?.(),
      employeeId: employee._id.toString(),
      distributionMethod,
    });

    return distribution;
  }
}
