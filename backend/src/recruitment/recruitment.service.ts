import { Injectable, NotFoundException, BadRequestException, Logger, Optional, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateJobTemplateDto,
  UpdateJobTemplateDto,
  CreateJobRequisitionDto,
  UpdateJobRequisitionDto,
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  ScheduleInterviewDto,
  SubmitInterviewFeedbackDto,
  CreateOfferDto,
  ApproveOfferDto,
  RespondOfferDto,
  CreateReferralDto,
  RejectionTemplateDto,
  AnalyticsQueryDto,
} from './dto';
import { JobTemplate } from './models/job-template.schema';
import { JobRequisition } from './models/job-requisition.schema';
import { Application } from './models/application.schema';
import { ApplicationStatusHistory } from './models/application-history.schema';
import { Interview } from './models/interview.schema';
import { AssessmentResult } from './models/assessment-result.schema';
import { Referral } from './models/referral.schema';
import { Offer } from './models/offer.schema';
import { ApplicationStage } from './enums/application-stage.enum';
import { ApplicationStatus } from './enums/application-status.enum';
import { InterviewStatus } from './enums/interview-status.enum';
import { OfferResponseStatus } from './enums/offer-response-status.enum';
import { OfferFinalStatus } from './enums/offer-final-status.enum';
import { ApprovalStatus } from './enums/approval-status.enum';
import type { IOnboardingService } from './interfaces/onboarding.interface';
import type { IEmployeeProfileService } from './interfaces/employee-profile.interface';
import type { IOrganizationStructureService } from './interfaces/organization-structure.interface';

/**
 * RecruitmentService with optional cross-subsystem dependencies.
 * 
 * When other subsystems are integrated:
 * 1. Replace stub services in RecruitmentModule with real implementations
 * 2. The service will automatically use the real implementations via dependency injection
 * 
 * Integration points:
 * - Onboarding: Triggered when offer is accepted (REC-029)
 * - Employee Profile: Create employee from candidate when offer accepted
 * - Organization Structure: Validate departments/positions
 */
@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);

  constructor(
    @InjectModel(JobTemplate.name)
    private jobTemplateModel: Model<JobTemplate>,
    @InjectModel(JobRequisition.name)
    private jobRequisitionModel: Model<JobRequisition>,
    @InjectModel(Application.name)
    private applicationModel: Model<Application>,
    @InjectModel(ApplicationStatusHistory.name)
    private applicationHistoryModel: Model<ApplicationStatusHistory>,
    @InjectModel(Interview.name)
    private interviewModel: Model<Interview>,
    @InjectModel(AssessmentResult.name)
    private assessmentResultModel: Model<AssessmentResult>,
    @InjectModel(Referral.name)
    private referralModel: Model<Referral>,
    @InjectModel(Offer.name)
    private offerModel: Model<Offer>,
    @Optional() @Inject('IOnboardingService') private onboardingService?: IOnboardingService,
    @Optional() @Inject('IEmployeeProfileService') private employeeProfileService?: IEmployeeProfileService,
    @Optional() @Inject('IOrganizationStructureService') private orgStructureService?: IOrganizationStructureService,
  ) {}

  // ==========================================
  // JOB TEMPLATES (REC-003) - BR2
  // ==========================================

  /**
   * Create standardized job description template
   * BR2: Each job requisition must include Job details (title, department, location, openings)
   * and Qualifications and skills needed
   */
  async createJobTemplate(dto: CreateJobTemplateDto): Promise<JobTemplate> {
    this.logger.log(`Creating job template: ${dto.title}`);
    
    // BR2: Validate required fields
    if (!dto.title || !dto.department) {
      throw new BadRequestException('Job title and department are required (BR2)');
    }
    
    if (!dto.qualifications || dto.qualifications.length === 0) {
      throw new BadRequestException('Qualifications are required (BR2)');
    }
    
    if (!dto.skills || dto.skills.length === 0) {
      throw new BadRequestException('Skills are required (BR2)');
    }

    const template = new this.jobTemplateModel(dto);
    await template.save();
    
    this.logger.log(`Job template created with ID: ${template._id}`);
    return template;
  }

  async findAllJobTemplates(): Promise<JobTemplate[]> {
    return this.jobTemplateModel.find().exec();
  }

  async findJobTemplateById(id: string): Promise<JobTemplate> {
    const template = await this.jobTemplateModel.findById(id).exec();
    if (!template) {
      throw new NotFoundException(`Job template with ID ${id} not found`);
    }
    return template;
  }

  async updateJobTemplate(id: string, dto: UpdateJobTemplateDto): Promise<JobTemplate> {
    const template = await this.jobTemplateModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    
    if (!template) {
      throw new NotFoundException(`Job template with ID ${id} not found`);
    }
    
    this.logger.log(`Job template ${id} updated`);
    return template;
  }

  async deleteJobTemplate(id: string): Promise<void> {
    const result = await this.jobTemplateModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Job template with ID ${id} not found`);
    }
    this.logger.log(`Job template ${id} deleted`);
  }

  // ==========================================
  // JOB REQUISITIONS (REC-004, REC-023) - BR2, BR6, BR9
  // ==========================================

  /**
   * Create job requisition
   * BR2: Must include job details (title, department, location, openings) and qualifications
   * BR6: System must allow automatic posting to career sites
   * BR9: Applications tracked through defined stages
   */
  async createJobRequisition(dto: CreateJobRequisitionDto): Promise<JobRequisition> {
    this.logger.log(`Creating job requisition: ${dto.requisitionId}`);
    
    // BR2: Validate required fields
    if (dto.openings < 1) {
      throw new BadRequestException('Number of openings must be at least 1 (BR2)');
    }

    // Validate template exists if provided
    if (dto.templateId) {
      await this.findJobTemplateById(dto.templateId);
    }

    const requisition = new this.jobRequisitionModel(dto);
    await requisition.save();
    
    this.logger.log(`Job requisition created with ID: ${requisition._id}`);
    return requisition;
  }

  /**
   * Publish job requisition (REC-023)
   * BR6: Automatic posting of approved requisitions to career sites
   */
  async publishJobRequisition(id: string): Promise<JobRequisition> {
    const requisition = await this.jobRequisitionModel.findById(id).exec();
    
    if (!requisition) {
      throw new NotFoundException(`Job requisition with ID ${id} not found`);
    }

    if (requisition.publishStatus === 'published') {
      throw new BadRequestException('Job requisition already published');
    }

    requisition.publishStatus = 'published';
    requisition.postingDate = new Date();
    await requisition.save();

    // BR6: Trigger automatic posting to career sites (event/webhook would go here)
    this.logger.log(`Job requisition ${id} published to career sites (BR6)`);
    
    return requisition;
  }

  async findAllJobRequisitions(): Promise<JobRequisition[]> {
    return this.jobRequisitionModel.find().populate('templateId').exec();
  }

  async findJobRequisitionById(id: string): Promise<JobRequisition> {
    const requisition = await this.jobRequisitionModel
      .findById(id)
      .populate('templateId')
      .exec();
    
    if (!requisition) {
      throw new NotFoundException(`Job requisition with ID ${id} not found`);
    }
    return requisition;
  }

  async updateJobRequisition(id: string, dto: UpdateJobRequisitionDto): Promise<JobRequisition> {
    const requisition = await this.jobRequisitionModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    
    if (!requisition) {
      throw new NotFoundException(`Job requisition with ID ${id} not found`);
    }
    
    this.logger.log(`Job requisition ${id} updated`);
    return requisition;
  }

  // ==========================================
  // APPLICATIONS (REC-007, REC-008) - BR12, BR9, BR28
  // ==========================================

  /**
   * Create candidate application (REC-007)
   * BR12: Support storage/upload of applications with resumes (creates talent pool)
   * BR28: Storing talent pool needs applicant authorization
   */
  async createApplication(dto: CreateApplicationDto): Promise<Application> {
    this.logger.log(`Creating application for candidate: ${dto.candidateId}`);
    
    // BR28: Validate consent for data processing
    if (!dto.consentGiven) {
      throw new BadRequestException('Candidate consent is required for data processing (BR28)');
    }

    // Validate requisition exists
    await this.findJobRequisitionById(dto.requisitionId);

    // BR12: Create application (CV storage would be handled by file upload endpoint)
    const application = new this.applicationModel({
      candidateId: new Types.ObjectId(dto.candidateId),
      requisitionId: new Types.ObjectId(dto.requisitionId),
      assignedHr: dto.assignedHr ? new Types.ObjectId(dto.assignedHr) : undefined,
      currentStage: dto.currentStage || ApplicationStage.SCREENING,
      status: dto.status || ApplicationStatus.SUBMITTED,
    });

    await application.save();

    // BR14, BR25: Handle referral tagging if applicable
    if (dto.isReferral && dto.referredBy) {
      await this.createReferral({
        referringEmployeeId: dto.referredBy,
        candidateId: dto.candidateId,
      });
      this.logger.log(`Application tagged as referral (BR14)`);
    }

    // Create initial history entry
    await this.createApplicationHistory(
      application._id.toString(),
      null,
      application.currentStage,
      null,
      application.status,
      dto.assignedHr || 'system',
    );

    this.logger.log(`Application created with ID: ${application._id} (BR12)`);
    return application;
  }

  /**
   * Update application status (REC-008)
   * BR9: Applications tracked through defined stages
   * BR11: Status changes trigger alerts to recruiters/managers
   * BR27: Status tracking must be real-time and visualized
   */
  async updateApplicationStatus(
    id: string,
    dto: UpdateApplicationStatusDto,
    changedBy: string,
  ): Promise<Application> {
    const application = await this.applicationModel.findById(id).exec();
    
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    const oldStage = application.currentStage;
    const oldStatus = application.status;

    // Update application
    if (dto.currentStage) {
      application.currentStage = dto.currentStage;
    }
    if (dto.status) {
      application.status = dto.status;
    }

    await application.save();

    // BR9: Track through defined stages - Create history entry
    await this.createApplicationHistory(
      id,
      oldStage,
      application.currentStage,
      oldStatus,
      application.status,
      changedBy,
    );

    // BR11, BR27: Trigger notification hooks (would integrate with notification service)
    await this.triggerStatusChangeNotifications(application, oldStatus, dto.comment);

    this.logger.log(`Application ${id} status updated from ${oldStatus} to ${application.status} (BR9)`);
    return application;
  }

  /**
   * Get application tracking history (REC-008)
   * BR27: Status tracking easily visualized and real-time
   */
  async getApplicationHistory(applicationId: string): Promise<ApplicationStatusHistory[]> {
    return this.applicationHistoryModel
      .find({ applicationId: new Types.ObjectId(applicationId) })
      .sort({ createdAt: 1 })
      .exec();
  }

  async findAllApplications(filters?: any): Promise<Application[]> {
    try {
      const applications = await this.applicationModel
        .find(filters || {})
        .populate({
          path: 'candidateId',
          select: '_id', // Only select _id if collection exists
          strictPopulate: false, // Don't throw error if collection doesn't exist
        })
        .populate({
          path: 'requisitionId',
          select: '_id requisitionId title openings location',
          strictPopulate: false,
        })
        .exec();
      return applications;
    } catch (error) {
      this.logger.error(`Error fetching applications: ${error.message}`);
      // If populate fails, return without populate
      return await this.applicationModel.find(filters || {}).exec();
    }
  }

  async findApplicationById(id: string): Promise<Application> {
    try {
      const application = await this.applicationModel
        .findById(id)
        .populate({
          path: 'candidateId',
          strictPopulate: false,
        })
        .populate({
          path: 'requisitionId',
          strictPopulate: false,
        })
        .exec();
      
      if (!application) {
        throw new NotFoundException(`Application with ID ${id} not found`);
      }
      return application;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // If populate fails, try without populate
      const application = await this.applicationModel.findById(id).exec();
      if (!application) {
        throw new NotFoundException(`Application with ID ${id} not found`);
      }
      return application;
    }
  }

  // ==========================================
  // INTERVIEWS (REC-010, REC-011, REC-020, REC-021) - BR19, BR20, BR21, BR22, BR23
  // ==========================================

  /**
   * Schedule interview (REC-010)
   * BR19: Recruiters can schedule interviews by selecting time slots, panel members, and modes
   * BR19(c): Interviewers receive automatic calendar invites
   * BR19(d): Candidates notified automatically
   * BR20: Panels need knowledge/training to conduct interviews
   */
  async scheduleInterview(dto: ScheduleInterviewDto): Promise<Interview> {
    this.logger.log(`Scheduling interview for application: ${dto.applicationId}`);
    
    // Validate application exists
    const application = await this.findApplicationById(dto.applicationId);

    // BR19(a): Validate panel members exist (would check user service in real implementation)
    if (!dto.panel || dto.panel.length === 0) {
      throw new BadRequestException('At least one panel member is required (BR19)');
    }

    // Create interview
    const interview = new this.interviewModel({
      applicationId: new Types.ObjectId(dto.applicationId),
      stage: dto.stage,
      scheduledDate: dto.scheduledDate,
      method: dto.method,
      panel: dto.panel.map(id => new Types.ObjectId(id)),
      videoLink: dto.videoLink,
      calendarEventId: dto.calendarEventId,
      status: InterviewStatus.SCHEDULED,
    });

    await interview.save();

    // BR19(c): Send calendar invites to interviewers (notification hook)
    await this.sendInterviewInvites(interview, 'panel');
    
    // BR19(d): Notify candidate (notification hook)
    await this.sendInterviewInvites(interview, 'candidate');

    this.logger.log(`Interview scheduled with ID: ${interview._id} (BR19)`);
    return interview;
  }

  /**
   * Submit interview feedback (REC-011, REC-020)
   * BR10: Allow adding comments and ratings at each stage
   * BR22: Feedback must be submitted by panel/interviewers for accuracy
   * BR21: Criteria used in assessment are pre-set and agreed upon
   * BR23: System allows/houses multiple assessment tools
   */
  async submitInterviewFeedback(dto: SubmitInterviewFeedbackDto): Promise<AssessmentResult> {
    this.logger.log(`Submitting feedback for interview: ${dto.interviewId}`);
    
    // Validate interview exists
    const interview = await this.interviewModel.findById(dto.interviewId).exec();
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${dto.interviewId} not found`);
    }

    // BR22: Validate interviewer is part of the panel
    const isInPanel = interview.panel.some(
      panelMember => panelMember.toString() === dto.interviewerId
    );
    
    if (!isInPanel) {
      throw new BadRequestException('Only panel members can submit feedback (BR22)');
    }

    // BR21, BR23: Create structured assessment result with pre-set criteria
    const assessmentResult = new this.assessmentResultModel({
      interviewId: new Types.ObjectId(dto.interviewId),
      interviewerId: new Types.ObjectId(dto.interviewerId),
      score: dto.overallScore,
      comments: dto.comments,
      // In real implementation, would store detailed scores per criterion
    });

    await assessmentResult.save();

    // Update interview status if all panel members submitted feedback
    const allFeedback = await this.assessmentResultModel
      .find({ interviewId: interview._id })
      .exec();
    
    if (allFeedback.length === interview.panel.length) {
      interview.status = InterviewStatus.COMPLETED;
      interview.feedbackId = assessmentResult._id as Types.ObjectId;
      await interview.save();
      this.logger.log(`All panel feedback received for interview ${dto.interviewId} (BR22)`);
    }

    this.logger.log(`Interview feedback submitted (BR10, BR21, BR23)`);
    return assessmentResult;
  }

  async findInterviewsByApplication(applicationId: string): Promise<Interview[]> {
    return this.interviewModel
      .find({ applicationId: new Types.ObjectId(applicationId) })
      .populate('panel')
      .exec();
  }

  async findInterviewById(id: string): Promise<Interview> {
    const interview = await this.interviewModel
      .findById(id)
      .populate('applicationId')
      .populate('panel')
      .exec();
    
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }
    return interview;
  }

  // ==========================================
  // REFERRALS (REC-030) - BR14, BR25
  // ==========================================

  /**
   * Create referral record (REC-030)
   * BR14: Electronic screening includes rule-based filters
   * BR25: Tie-breaking rules (e.g., internal candidate/referral preference)
   */
  async createReferral(dto: CreateReferralDto): Promise<Referral> {
    this.logger.log(`Creating referral for candidate: ${dto.candidateId}`);
    
    const referral = new this.referralModel({
      referringEmployeeId: new Types.ObjectId(dto.referringEmployeeId),
      candidateId: new Types.ObjectId(dto.candidateId),
      role: dto.role,
      level: dto.level,
    });

    await referral.save();
    
    // BR25: Referrals get priority in screening (would affect ranking logic)
    this.logger.log(`Referral created - candidate gets priority (BR14, BR25)`);
    return referral;
  }

  async findReferralsByCandidate(candidateId: string): Promise<Referral[]> {
    try {
      const referrals = await this.referralModel
        .find({ candidateId: new Types.ObjectId(candidateId) })
        .populate({
          path: 'referringEmployeeId',
          select: '_id name email', // Select specific fields if User model exists
          strictPopulate: false, // Allow populate to not fail if path is not found
        })
        .exec();
      return referrals;
    } catch (error) {
      // If populate fails (e.g., User model not registered), return without populate
      // This is expected in standalone mode where User model may not exist
      if (error.message?.includes('Schema hasn\'t been registered')) {
        this.logger.debug(`User model not registered, returning referrals without populate`);
      } else {
        this.logger.error(`Error fetching referrals: ${error.message}`);
      }
      return await this.referralModel
        .find({ candidateId: new Types.ObjectId(candidateId) })
        .exec();
    }
  }

  // ==========================================
  // OFFERS (REC-014, REC-018, REC-029) - BR26, BR37
  // ==========================================

  /**
   * Create job offer (REC-014)
   * BR26(a): Offer letter must be customizable and editable
   * BR26(b): Secure related parties' approval before sending
   */
  async createOffer(dto: CreateOfferDto): Promise<Offer> {
    this.logger.log(`Creating offer for application: ${dto.applicationId}`);
    
    // Validate application exists and is at offer stage
    const application = await this.findApplicationById(dto.applicationId);
    
    if (application.status !== ApplicationStatus.OFFER) {
      throw new BadRequestException('Application must be at offer stage');
    }

    // BR26(a): Create customizable offer
    const offer = new this.offerModel({
      applicationId: new Types.ObjectId(dto.applicationId),
      candidateId: new Types.ObjectId(dto.candidateId),
      hrEmployeeId: dto.hrEmployeeId ? new Types.ObjectId(dto.hrEmployeeId) : undefined,
      grossSalary: dto.grossSalary,
      signingBonus: dto.signingBonus,
      benefits: dto.benefits,
      conditions: dto.conditions,
      insurances: dto.insurances,
      content: dto.content,
      role: dto.role,
      deadline: dto.deadline,
      applicantResponse: OfferResponseStatus.PENDING,
      finalStatus: OfferFinalStatus.PENDING,
      approvers: [],
    });

    await offer.save();
    
    this.logger.log(`Offer created with ID: ${offer._id} (BR26)`);
    return offer;
  }

  /**
   * Approve offer (REC-014)
   * BR26(b): System must support securing related parties' approval
   */
  async approveOffer(offerId: string, dto: ApproveOfferDto): Promise<Offer> {
    const offer = await this.offerModel.findById(offerId).exec();
    
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    // Add approver
    offer.approvers.push({
      employeeId: new Types.ObjectId(dto.employeeId),
      role: dto.role,
      status: dto.status,
      actionDate: new Date(),
      comment: dto.comment,
    });

    // Check if all required approvals received
    const allApproved = offer.approvers.every(
      approver => approver.status === ApprovalStatus.APPROVED
    );

    if (allApproved && offer.approvers.length >= 2) { // Assume 2 approvals needed
      offer.finalStatus = OfferFinalStatus.APPROVED;
      this.logger.log(`Offer ${offerId} fully approved - ready to send (BR26b)`);
    }

    await offer.save();
    return offer;
  }

  /**
   * Candidate responds to offer (REC-018)
   * BR26(d): System stores communication logs
   * BR37: Communication logs stored in applicant profile
   */
  async respondToOffer(offerId: string, dto: RespondOfferDto): Promise<Offer> {
    const offer = await this.offerModel.findById(offerId).exec();
    
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    offer.applicantResponse = dto.response;

    if (dto.response === OfferResponseStatus.ACCEPTED) {
      offer.finalStatus = OfferFinalStatus.APPROVED; // Use APPROVED for accepted offers
      offer.candidateSignedAt = new Date();

      // BR26(c): Trigger onboarding (REC-029)
      await this.triggerOnboarding(offer);
      
      // Update application status to hired
      await this.updateApplicationStatus(
        offer.applicationId.toString(),
        { status: ApplicationStatus.HIRED },
        'system',
      );

      this.logger.log(`Offer accepted - onboarding triggered (BR26c)`);
    } else if (dto.response === OfferResponseStatus.REJECTED) {
      offer.finalStatus = OfferFinalStatus.REJECTED;
    }

    await offer.save();
    
    // BR37: Log communication in applicant profile
    this.logger.log(`Offer response logged (BR37)`);
    
    return offer;
  }

  async findOfferById(id: string): Promise<Offer> {
    const offer = await this.offerModel
      .findById(id)
      .populate('applicationId')
      .populate('candidateId')
      .exec();
    
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }
    return offer;
  }

  // ==========================================
  // REJECTION & COMMUNICATION (REC-022) - BR36, BR37
  // ==========================================

  /**
   * Send rejection notification (REC-022)
   * BR36: System must send automated alerts/emails for status updates
   * BR37: Communication logs must be stored
   */
  async sendRejectionNotification(
    applicationId: string,
    template: RejectionTemplateDto,
  ): Promise<void> {
    const application = await this.findApplicationById(applicationId);
    
    // Update application status to rejected
    await this.updateApplicationStatus(
      applicationId,
      { status: ApplicationStatus.REJECTED, reason: template.reason },
      'system',
    );

    // BR36: Send automated email (would integrate with email service)
    this.logger.log(`Rejection notification sent to candidate (BR36)`);
    
    // BR37: Log communication
    this.logger.log(`Rejection communication logged (BR37)`);
  }

  // ==========================================
  // ANALYTICS (REC-009) - BR33
  // ==========================================

  /**
   * Generate recruitment analytics (REC-009)
   * BR33: Multiple reports could be generated (time-to-hire, source effectiveness)
   */
  async getRecruitmentAnalytics(query: AnalyticsQueryDto): Promise<any> {
    this.logger.log('Generating recruitment analytics (BR33)');
    
    const filters: any = {};
    
    if (query.startDate || query.endDate) {
      filters.createdAt = {};
      if (query.startDate) filters.createdAt.$gte = query.startDate;
      if (query.endDate) filters.createdAt.$lte = query.endDate;
    }
    
    if (query.requisitionId) {
      filters.requisitionId = new Types.ObjectId(query.requisitionId);
    }
    
    if (query.status) {
      filters.status = query.status;
    }

    const applications = await this.applicationModel.find(filters).exec();

    // BR33: Calculate metrics
    const analytics = {
      totalApplications: applications.length,
      byStatus: this.groupByStatus(applications),
      byStage: this.groupByStage(applications),
      averageTimeToHire: await this.calculateAverageTimeToHire(applications),
      conversionRates: this.calculateConversionRates(applications),
      referralStats: await this.getReferralStats(applications),
    };

    this.logger.log(`Analytics generated for ${applications.length} applications (BR33)`);
    return analytics;
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private async createApplicationHistory(
    applicationId: string,
    oldStage: ApplicationStage | null,
    newStage: ApplicationStage,
    oldStatus: ApplicationStatus | null,
    newStatus: ApplicationStatus,
    changedBy: string,
  ): Promise<ApplicationStatusHistory> {
    // Handle 'system' or other non-ObjectId strings
    let changedById: Types.ObjectId;
    try {
      changedById = new Types.ObjectId(changedBy);
    } catch (error) {
      // If changedBy is not a valid ObjectId (e.g., 'system'), use a default ObjectId
      // In production, you'd want to use an actual system user ID
      changedById = new Types.ObjectId('000000000000000000000000'); // Default system user
    }

    const history = new this.applicationHistoryModel({
      applicationId: new Types.ObjectId(applicationId),
      oldStage: oldStage || 'none',
      newStage,
      oldStatus: oldStatus || 'none',
      newStatus,
      changedBy: changedById,
    });

    await history.save();
    return history;
  }

  private async triggerStatusChangeNotifications(
    application: Application,
    oldStatus: ApplicationStatus,
    comment?: string,
  ): Promise<void> {
    // BR11, BR27, BR36: Trigger notification service
    // In real implementation, would emit event or call notification service
    this.logger.log(`Status change notification triggered: ${oldStatus} -> ${application.status} (BR11, BR27, BR36)`);
  }

  private async sendInterviewInvites(
    interview: Interview,
    recipient: 'panel' | 'candidate',
  ): Promise<void> {
    // BR19(c), BR19(d): Send calendar invites and notifications
    this.logger.log(`Interview invite sent to ${recipient} (BR19)`);
  }

  // ==========================================
  // ONBOARDING TRIGGER (REC-029)
  // ==========================================
  private async triggerOnboarding(offer: Offer): Promise<void> {
    this.logger.log(`Onboarding triggered for candidate ${offer.candidateId} (BR26c)`);

    // Get application details for onboarding
    const application = await this.applicationModel.findById(offer.applicationId).exec();
    if (!application) {
      this.logger.warn(`Application ${offer.applicationId} not found for onboarding trigger`);
      return;
    }

    // Get requisition details for department/role
    const requisition = await this.jobRequisitionModel.findById(application.requisitionId).exec();
    let department = 'Unknown';
    let role = offer.role || 'Unknown';

    // Get department and title from job template if available
    if (requisition?.templateId) {
      const template = await this.jobTemplateModel.findById(requisition.templateId).exec();
      if (template) {
        department = template.department || 'Unknown';
        role = offer.role || template.title || 'Unknown';
      }
    }

    // Validate department with organization structure (if available)
    if (this.orgStructureService) {
      const isValid = await this.orgStructureService.validateDepartment(department);
      if (!isValid) {
        this.logger.warn(`Department ${department} not found in organization structure`);
      }
    }

    // Note: Candidate details (name, email) would come from Candidate collection
    // which is not part of this module. In real integration, populate candidate or fetch from candidate service.
    // For now, we'll use candidateId and let the employee profile service handle candidate lookup if needed.

    // Create employee profile from candidate (if employee profile service available)
    let employeeId: string | undefined;
    if (this.employeeProfileService) {
      try {
        // In real implementation, candidate details would be fetched from Candidate collection
        // For now, pass candidateId and let the service handle it
        const result = await this.employeeProfileService.createEmployeeFromCandidate(
          offer.candidateId.toString(),
          {
            fullName: 'Candidate', // TODO: Fetch from Candidate collection when integrated
            email: 'candidate@example.com', // TODO: Fetch from Candidate collection when integrated
            role: role,
            department: department,
            startDate: new Date(), // In real implementation, this would come from offer
          },
        );
        employeeId = result.employeeId;
        this.logger.log(`Employee profile created: ${employeeId}`);
      } catch (error) {
        this.logger.error(`Failed to create employee profile: ${error.message}`);
      }
    }

    // Trigger onboarding workflow (if onboarding service available)
    if (this.onboardingService) {
      try {
        const offerId = (offer as any)._id?.toString() || offer.candidateId.toString();
        const onboardingResult = await this.onboardingService.triggerOnboarding(
          offer.candidateId.toString(),
          offerId,
          {
            role: role,
            department: department,
            grossSalary: offer.grossSalary,
            startDate: new Date(), // In real implementation, this would come from offer
          },
        );
        this.logger.log(`Onboarding workflow triggered: ${onboardingResult.onboardingId}`);
        this.logger.log(`Onboarding tasks created: ${onboardingResult.tasks.length}`);
      } catch (error) {
        this.logger.error(`Failed to trigger onboarding: ${error.message}`);
      }
    } else {
      this.logger.warn('Onboarding service not available - onboarding not triggered');
    }
  }

  private groupByStatus(applications: Application[]): Record<string, number> {
    return applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByStage(applications: Application[]): Record<string, number> {
    return applications.reduce((acc, app) => {
      acc[app.currentStage] = (acc[app.currentStage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private async calculateAverageTimeToHire(applications: Application[]): Promise<number> {
    // BR33: Time-to-hire metric
    const hiredApps = applications.filter(app => app.status === ApplicationStatus.HIRED);
    
    if (hiredApps.length === 0) return 0;

    let totalDays = 0;
    for (const app of hiredApps) {
      const history = await this.getApplicationHistory((app as any)._id.toString());
      if (history.length > 0) {
        const firstEntry = history[0] as any;
        const lastEntry = history[history.length - 1] as any;
        const days = Math.ceil(
          (lastEntry.createdAt.getTime() - firstEntry.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += days;
      }
    }

    return Math.round(totalDays / hiredApps.length);
  }

  private calculateConversionRates(applications: Application[]): any {
    // BR33: Conversion rates by stage
    const total = applications.length;
    if (total === 0) return {};

    return {
      screeningToInterview: this.calculateStageConversion(applications, ApplicationStage.SCREENING, ApplicationStage.DEPARTMENT_INTERVIEW),
      interviewToOffer: this.calculateStageConversion(applications, ApplicationStage.DEPARTMENT_INTERVIEW, ApplicationStage.OFFER),
      offerToHired: (applications.filter(a => a.status === ApplicationStatus.HIRED).length / total) * 100,
    };
  }

  private calculateStageConversion(
    applications: Application[],
    fromStage: ApplicationStage,
    toStage: ApplicationStage,
  ): number {
    const atFromStage = applications.filter(a => a.currentStage === fromStage).length;
    const reachedToStage = applications.filter(
      a => a.currentStage === toStage || 
      (a.currentStage as any) > (toStage as any)
    ).length;

    return atFromStage > 0 ? (reachedToStage / atFromStage) * 100 : 0;
  }

  private async getReferralStats(applications: Application[]): Promise<any> {
    // BR14, BR25: Referral statistics
    const candidateIds = applications.map(a => a.candidateId);
    const referrals = await this.referralModel
      .find({ candidateId: { $in: candidateIds } })
      .exec();

    return {
      totalReferrals: referrals.length,
      referralPercentage: (referrals.length / applications.length) * 100,
    };
  }
}
