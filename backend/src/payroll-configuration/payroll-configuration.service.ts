import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ConfigStatus } from './enums/payroll-configuration-enums';
import { allowance } from './models/allowance.schema';
import { CompanyWideSettings } from './models/CompanyWideSettings.schema';
import { insuranceBrackets } from './models/insuranceBrackets.schema';
import { payGrade } from './models/payGrades.schema';
import { payrollPolicies } from './models/payrollPolicies.schema';
import { payType } from './models/payType.schema';
import { signingBonus } from './models/signingBonus.schema';
import { taxRules } from './models/taxRules.schema';
import { terminationAndResignationBenefits } from './models/terminationAndResignationBenefits';

type SupportedCollection =
  | 'allowance'
  | 'signingBonus'
  | 'taxRules'
  | 'insuranceBrackets'
  | 'payType'
  | 'payrollPolicies'
  | 'terminationAndResignationBenefits'
  | 'CompanyWideSettings'
  | 'payGrade';

const COLLECTION_MODEL_NAMES: Record<SupportedCollection, string> = {
  allowance: allowance.name,
  signingBonus: signingBonus.name,
  taxRules: taxRules.name,
  insuranceBrackets: insuranceBrackets.name,
  payType: payType.name,
  payrollPolicies: payrollPolicies.name,
  terminationAndResignationBenefits: terminationAndResignationBenefits.name,
  CompanyWideSettings: CompanyWideSettings.name,
  payGrade: payGrade.name,
};

@Injectable()
export class PayrollConfigurationService {
  constructor(
    @Optional()
    @InjectConnection()
    private readonly connection?: Connection,
  ) {}

  async editConfiguration(
    collection: string,
    configId: string,
    payload: Record<string, any>,
  ) {
    if (collection === 'insuranceBrackets') {
      return this.updateInsuranceBracket(configId, payload);
    }

    const model = this.getModel(collection);
    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException('Update payload is required');
    }

    // Check if configuration exists and is in DRAFT status
    const existingDoc = await model.findById(configId).lean() as any;
    if (!existingDoc) {
      throw new NotFoundException(
        `Configuration ${configId} not found in ${collection}`,
      );
    }

    if (existingDoc.status !== ConfigStatus.DRAFT) {
      throw new BadRequestException(
        `Configuration can only be edited when status is ${ConfigStatus.DRAFT}`,
      );
    }

    // Remove non-editable fields
    const sanitizedPayload = this.sanitizePayload(payload);

    const updatedDoc = await model
      .findByIdAndUpdate(configId, sanitizedPayload, {
        new: true,
      })
      .lean();

    return updatedDoc;
  }

  async approveConfiguration(
    collection: string,
    configId: string,
    approverId: string,
  ) {
    if (collection === 'insuranceBrackets') {
      return this.approveInsuranceBracket(configId, approverId);
    }

    if (!approverId) {
      throw new BadRequestException('approverId is required');
    }

    const model = this.getModel(collection);
    const approvedDoc = await model
      .findByIdAndUpdate(
        configId,
        {
          status: ConfigStatus.APPROVED,
          approvedBy: approverId,
          approvedAt: new Date(),
        },
        { new: true },
      )
      .lean();

    if (!approvedDoc) {
      throw new NotFoundException(
        `Configuration ${configId} not found in ${collection}`,
      );
    }

    return approvedDoc;
  }

  async deleteConfiguration(collection: string, configId: string) {
    if (collection === 'insuranceBrackets') {
      return this.deleteInsuranceBracket(configId);
    }

    const model = this.getModel(collection);
    const deletedDoc = await model.findByIdAndDelete(configId).lean();

    if (!deletedDoc) {
      throw new NotFoundException(
        `Configuration ${configId} not found in ${collection}`,
      );
    }

    return deletedDoc;
  }

  async rejectInsuranceBracket(configId: string, reviewerId: string) {
    if (!reviewerId) {
      throw new BadRequestException('reviewerId is required');
    }

    const doc = await this.findInsuranceBracketOrThrow(configId);
    if (doc.status === ConfigStatus.REJECTED) {
      throw new BadRequestException('Insurance bracket already rejected.');
    }

    doc.status = ConfigStatus.REJECTED;
    doc.approvedBy = undefined;
    doc.approvedAt = undefined;

    await doc.save();
    return doc.toObject();
  }

  async listInsuranceBrackets(status?: ConfigStatus) {
    const model = this.getModel('insuranceBrackets');
    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }

    return model.find(filter).sort({ createdAt: -1 }).lean();
  }

  async getInsuranceBracket(configId: string) {
    const doc = await this.getInsuranceBracketLean(configId);
    if (!doc) {
      throw new NotFoundException(
        `Configuration ${configId} not found in insuranceBrackets`,
      );
    }

    return doc;
  }

  async createInsuranceBracket(payload: Record<string, any>) {
    const model = this.getModel('insuranceBrackets');
    const newInsuranceBracket = new model({
      ...payload,
      status: ConfigStatus.DRAFT,
    });
    return (await newInsuranceBracket.save()).toObject();
  }

  async updateInsuranceBracket(
    configId: string,
    payload: Record<string, any>,
  ) {
    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException('Update payload is required');
    }

    const sanitizedPayload = this.ensureEditableInsuranceFields(payload);
    if (Object.keys(sanitizedPayload).length === 0) {
      throw new BadRequestException('No editable fields provided');
    }

    const doc = await this.findInsuranceBracketOrThrow(configId);
    if (doc.status !== ConfigStatus.DRAFT) {
      throw new BadRequestException(
        `Insurance bracket can only be edited when status is ${ConfigStatus.DRAFT}`,
      );
    }

    doc.set(sanitizedPayload);
    await doc.save();
    return doc.toObject();
  }

  async approveInsuranceBracket(configId: string, approverId: string) {
    if (!approverId) {
      throw new BadRequestException('approverId is required');
    }

    const doc = await this.findInsuranceBracketOrThrow(configId);
    if (doc.status === ConfigStatus.APPROVED) {
      throw new BadRequestException('Insurance bracket already approved.');
    }

    doc.status = ConfigStatus.APPROVED;
    doc.approvedBy = approverId as any;
    doc.approvedAt = new Date();

    await doc.save();
    return doc.toObject();
  }

  async deleteInsuranceBracket(configId: string) {
    const doc = await this.findInsuranceBracketOrThrow(configId);
    if (doc.status === ConfigStatus.APPROVED) {
      throw new ForbiddenException(
        'Approved insurance brackets cannot be deleted.',
      );
    }

    const plainDoc = doc.toObject();
    await doc.deleteOne();
    return plainDoc;
  }

  private async getInsuranceBracketLean(configId: string) {
    const model = this.getModel('insuranceBrackets');
    return model.findById(configId).lean();
  }

  private async findInsuranceBracketOrThrow(configId: string) {
    const model = this.getModel('insuranceBrackets');
    const doc = await model.findById(configId);
    if (!doc) {
      throw new NotFoundException(
        `Configuration ${configId} not found in insuranceBrackets`,
      );
    }

    return doc;
  }

  private ensureEditableInsuranceFields(payload: Record<string, any>) {
    const sanitizedPayload: Record<string, any> = { ...payload };
    ['status', 'approvedBy', 'approvedAt', '_id', 'createdAt', 'updatedAt'].forEach(
      (field) => delete sanitizedPayload[field],
    );
    return sanitizedPayload;
  }

  private sanitizePayload(payload: Record<string, any>) {
    const sanitizedPayload: Record<string, any> = { ...payload };
    ['status', 'approvedBy', 'approvedAt', '_id', 'createdAt', 'updatedAt'].forEach(
      (field) => delete sanitizedPayload[field],
    );
    return sanitizedPayload;
  }

  // Payroll Policies Configuration
  async createPayrollPolicy(payload: Record<string, any>) {
    const model = this.getModel('payrollPolicies');
    const newPolicy = new model({
      ...payload,
      status: ConfigStatus.DRAFT,
    });
    return (await newPolicy.save()).toObject();
  }

  async updatePayrollPolicy(configId: string, payload: Record<string, any>) {
    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException('Update payload is required');
    }

    const sanitizedPayload = this.sanitizePayload(payload);
    if (Object.keys(sanitizedPayload).length === 0) {
      throw new BadRequestException('No editable fields provided');
    }

    return this.editConfiguration('payrollPolicies', configId, sanitizedPayload);
  }

  async getPayrollPolicy(configId: string) {
    const model = this.getModel('payrollPolicies');
    const doc = await model.findById(configId).lean();
    if (!doc) {
      throw new NotFoundException(
        `Payroll policy ${configId} not found`,
      );
    }
    return doc;
  }

  async listPayrollPolicies(status?: ConfigStatus) {
    const model = this.getModel('payrollPolicies');
    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }
    return model.find(filter).sort({ createdAt: -1 }).lean();
  }

  // Pay Grades Configuration
  async createPayGrade(payload: Record<string, any>) {
    const model = this.getModel('payGrade');
    const newPayGrade = new model({
      ...payload,
      status: ConfigStatus.DRAFT,
    });
    return (await newPayGrade.save()).toObject();
  }

  async updatePayGrade(configId: string, payload: Record<string, any>) {
    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException('Update payload is required');
    }

    const sanitizedPayload = this.sanitizePayload(payload);
    if (Object.keys(sanitizedPayload).length === 0) {
      throw new BadRequestException('No editable fields provided');
    }

    return this.editConfiguration('payGrade', configId, sanitizedPayload);
  }

  async getPayGrade(configId: string) {
    const model = this.getModel('payGrade');
    const doc = await model.findById(configId).lean();
    if (!doc) {
      throw new NotFoundException(
        `Pay grade ${configId} not found`,
      );
    }
    return doc;
  }

  async listPayGrades(status?: ConfigStatus) {
    const model = this.getModel('payGrade');
    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }
    return model.find(filter).sort({ createdAt: -1 }).lean();
  }

  // Pay Types Configuration
  async createPayType(payload: Record<string, any>) {
    const model = this.getModel('payType');
    const newPayType = new model({
      ...payload,
      status: ConfigStatus.DRAFT,
    });
    return (await newPayType.save()).toObject();
  }

  async updatePayType(configId: string, payload: Record<string, any>) {
    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException('Update payload is required');
    }

    const sanitizedPayload = this.sanitizePayload(payload);
    if (Object.keys(sanitizedPayload).length === 0) {
      throw new BadRequestException('No editable fields provided');
    }

    return this.editConfiguration('payType', configId, sanitizedPayload);
  }

  async getPayType(configId: string) {
    const model = this.getModel('payType');
    const doc = await model.findById(configId).lean();
    if (!doc) {
      throw new NotFoundException(
        `Pay type ${configId} not found`,
      );
    }
    return doc;
  }

  async listPayTypes(status?: ConfigStatus) {
    const model = this.getModel('payType');
    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }
    return model.find(filter).sort({ createdAt: -1 }).lean();
  }

  // Allowance Configuration
  async createAllowance(payload: Record<string, any>) {
    const model = this.getModel('allowance');
    const newAllowance = new model({
      ...payload,
      status: ConfigStatus.DRAFT,
    });
    return (await newAllowance.save()).toObject();
  }

  async updateAllowance(configId: string, payload: Record<string, any>) {
    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException('Update payload is required');
    }

    const sanitizedPayload = this.sanitizePayload(payload);
    if (Object.keys(sanitizedPayload).length === 0) {
      throw new BadRequestException('No editable fields provided');
    }

    return this.editConfiguration('allowance', configId, sanitizedPayload);
  }

  async getAllowance(configId: string) {
    const model = this.getModel('allowance');
    const doc = await model.findById(configId).lean();
    if (!doc) {
      throw new NotFoundException(
        `Allowance ${configId} not found`,
      );
    }
    return doc;
  }

  async listAllowances(status?: ConfigStatus) {
    const model = this.getModel('allowance');
    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }
    return model.find(filter).sort({ createdAt: -1 }).lean();
  }

  // Signing Bonus Configuration
  async createSigningBonus(payload: Record<string, any>) {
    const model = this.getModel('signingBonus');
    const newSigningBonus = new model({
      ...payload,
      status: ConfigStatus.DRAFT,
    });
    return (await newSigningBonus.save()).toObject();
  }

  async updateSigningBonus(configId: string, payload: Record<string, any>) {
    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException('Update payload is required');
    }

    const sanitizedPayload = this.sanitizePayload(payload);
    if (Object.keys(sanitizedPayload).length === 0) {
      throw new BadRequestException('No editable fields provided');
    }

    return this.editConfiguration('signingBonus', configId, sanitizedPayload);
  }

  async getSigningBonus(configId: string) {
    const model = this.getModel('signingBonus');
    const doc = await model.findById(configId).lean();
    if (!doc) {
      throw new NotFoundException(
        `Signing bonus ${configId} not found`,
      );
    }
    return doc;
  }

  async listSigningBonuses(status?: ConfigStatus) {
    const model = this.getModel('signingBonus');
    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }
    return model.find(filter).sort({ createdAt: -1 }).lean();
  }

  // Termination and Resignation Benefits Configuration
  async createTerminationResignationBenefits(payload: Record<string, any>) {
    const model = this.getModel('terminationAndResignationBenefits');
    const newBenefit = new model({
      ...payload,
      status: ConfigStatus.DRAFT,
    });
    return (await newBenefit.save()).toObject();
  }

  async updateTerminationResignationBenefits(
    configId: string,
    payload: Record<string, any>,
  ) {
    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException('Update payload is required');
    }

    const sanitizedPayload = this.sanitizePayload(payload);
    if (Object.keys(sanitizedPayload).length === 0) {
      throw new BadRequestException('No editable fields provided');
    }

    return this.editConfiguration(
      'terminationAndResignationBenefits',
      configId,
      sanitizedPayload,
    );
  }

  async getTerminationResignationBenefits(configId: string) {
    const model = this.getModel('terminationAndResignationBenefits');
    const doc = await model.findById(configId).lean();
    if (!doc) {
      throw new NotFoundException(
        `Termination/Resignation benefit ${configId} not found`,
      );
    }
    return doc;
  }

  async listTerminationResignationBenefits(status?: ConfigStatus) {
    const model = this.getModel('terminationAndResignationBenefits');
    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }
    return model.find(filter).sort({ createdAt: -1 }).lean();
  }

  // Company-Wide Settings Configuration
  async createCompanyWideSettings(payload: Record<string, any>) {
    const model = this.getModel('CompanyWideSettings');
    
    // Validate required fields
    if (!payload.payDate) {
      throw new BadRequestException('payDate is required');
    }
    if (!payload.timeZone) {
      throw new BadRequestException('timeZone is required');
    }
    if (!payload.currency) {
      throw new BadRequestException('currency is required');
    }

    // Check if company-wide settings already exist (typically only one should exist)
    const existingSettings = await model.findOne().lean();
    if (existingSettings) {
      throw new BadRequestException(
        'Company-wide settings already exist. Use update endpoint to modify existing settings.',
      );
    }

    const newSettings = new model({
      ...payload,
    });
    return (await newSettings.save()).toObject();
  }

  async updateCompanyWideSettings(configId: string, payload: Record<string, any>) {
    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException('Update payload is required');
    }

    const sanitizedPayload = this.sanitizePayload(payload);
    if (Object.keys(sanitizedPayload).length === 0) {
      throw new BadRequestException('No editable fields provided');
    }

    const model = this.getModel('CompanyWideSettings');
    const existingDoc = await model.findById(configId).lean();
    if (!existingDoc) {
      throw new NotFoundException(
        `Company-wide settings ${configId} not found`,
      );
    }

    // Update the document
    const updatedDoc = await model
      .findByIdAndUpdate(configId, sanitizedPayload, {
        new: true,
      })
      .lean();

    return updatedDoc;
  }

  async getCompanyWideSettings(configId: string) {
    const model = this.getModel('CompanyWideSettings');
    const doc = await model.findById(configId).lean();
    if (!doc) {
      throw new NotFoundException(
        `Company-wide settings ${configId} not found`,
      );
    }
    return doc;
  }

  async listCompanyWideSettings() {
    const model = this.getModel('CompanyWideSettings');
    return model.find().sort({ createdAt: -1 }).lean();
  }

  async getActiveCompanyWideSettings() {
    const model = this.getModel('CompanyWideSettings');
    // Get the most recent settings (typically there should be only one)
    const settings = await model.findOne().sort({ createdAt: -1 }).lean();
    if (!settings) {
      throw new NotFoundException('No company-wide settings found');
    }
    return settings;
  }

  // Tax Rules Configuration
  async createTaxRule(payload: Record<string, any>) {
    const model = this.getModel('taxRules');
    const newTaxRule = new model({
      ...payload,
      status: ConfigStatus.DRAFT,
    });
    return (await newTaxRule.save()).toObject();
  }

  async updateTaxRule(configId: string, payload: Record<string, any>) {
    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException('Update payload is required');
    }

    const sanitizedPayload = this.sanitizePayload(payload);
    if (Object.keys(sanitizedPayload).length === 0) {
      throw new BadRequestException('No editable fields provided');
    }

    return this.editConfiguration('taxRules', configId, sanitizedPayload);
  }

  async getTaxRule(configId: string) {
    const model = this.getModel('taxRules');
    const doc = await model.findById(configId).lean();
    if (!doc) {
      throw new NotFoundException(`Tax rule ${configId} not found`);
    }
    return doc;
  }

  async listTaxRules(status?: ConfigStatus) {
    const model = this.getModel('taxRules');
    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }
    return model.find(filter).sort({ createdAt: -1 }).lean();
  }

  private getModel(collection: string): Model<any> {
    if (!this.connection) {
      throw new InternalServerErrorException('Database connection unavailable');
    }

    if (!this.isSupportedCollection(collection)) {
      throw new BadRequestException(
        `Unsupported collection "${collection}".`,
      );
    }

    const modelName = COLLECTION_MODEL_NAMES[collection];
    return this.connection.model(modelName);
  }

  private isSupportedCollection(
    collection: string,
  ): collection is SupportedCollection {
    return collection in COLLECTION_MODEL_NAMES;
  }
}
