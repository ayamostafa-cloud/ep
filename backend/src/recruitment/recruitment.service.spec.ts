import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
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
import { InterviewMethod } from './enums/interview-method.enum';
import { InterviewStatus } from './enums/interview-status.enum';
import { OfferResponseStatus } from './enums/offer-response-status.enum';
import { ApprovalStatus } from './enums/approval-status.enum';

describe('RecruitmentService', () => {
  let service: RecruitmentService;
  let jobTemplateModel: Model<JobTemplate>;
  let jobRequisitionModel: Model<JobRequisition>;
  let applicationModel: Model<Application>;
  let applicationHistoryModel: Model<ApplicationStatusHistory>;
  let interviewModel: Model<Interview>;
  let assessmentResultModel: Model<AssessmentResult>;
  let referralModel: Model<Referral>;
  let offerModel: Model<Offer>;

  const mockObjectId = new Types.ObjectId();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecruitmentService,
        {
          provide: getModelToken(JobTemplate.name),
          useValue: {
            new: jest.fn(),
            constructor: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
            exec: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getModelToken(JobRequisition.name),
          useValue: {
            new: jest.fn(),
            constructor: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            exec: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getModelToken(Application.name),
          useValue: {
            new: jest.fn(),
            constructor: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            exec: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getModelToken(ApplicationStatusHistory.name),
          useValue: {
            new: jest.fn(),
            constructor: jest.fn(),
            find: jest.fn(),
            exec: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getModelToken(Interview.name),
          useValue: {
            new: jest.fn(),
            constructor: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            exec: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getModelToken(AssessmentResult.name),
          useValue: {
            new: jest.fn(),
            constructor: jest.fn(),
            find: jest.fn(),
            exec: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getModelToken(Referral.name),
          useValue: {
            new: jest.fn(),
            constructor: jest.fn(),
            find: jest.fn(),
            exec: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getModelToken(Offer.name),
          useValue: {
            new: jest.fn(),
            constructor: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            exec: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecruitmentService>(RecruitmentService);
    jobTemplateModel = module.get<Model<JobTemplate>>(getModelToken(JobTemplate.name));
    jobRequisitionModel = module.get<Model<JobRequisition>>(getModelToken(JobRequisition.name));
    applicationModel = module.get<Model<Application>>(getModelToken(Application.name));
    applicationHistoryModel = module.get<Model<ApplicationStatusHistory>>(
      getModelToken(ApplicationStatusHistory.name),
    );
    interviewModel = module.get<Model<Interview>>(getModelToken(Interview.name));
    assessmentResultModel = module.get<Model<AssessmentResult>>(
      getModelToken(AssessmentResult.name),
    );
    referralModel = module.get<Model<Referral>>(getModelToken(Referral.name));
    offerModel = module.get<Model<Offer>>(getModelToken(Offer.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==========================================
  // JOB TEMPLATES TESTS (REC-003) - BR2
  // ==========================================

  describe('createJobTemplate', () => {
    it('should create a job template with all required fields (BR2)', async () => {
      const dto = {
        title: 'Senior Software Engineer',
        department: 'Engineering',
        qualifications: ['Bachelor in CS', '5+ years experience'],
        skills: ['TypeScript', 'Node.js', 'MongoDB'],
        description: 'Full stack development role',
      };

      const mockTemplate = {
        _id: mockObjectId,
        ...dto,
        save: jest.fn().mockResolvedValue({ _id: mockObjectId, ...dto }),
      };

      jest.spyOn(jobTemplateModel, 'constructor' as any).mockReturnValue(mockTemplate);
      (jobTemplateModel as any).mockImplementation(() => mockTemplate);

      const result = await service.createJobTemplate(dto);

      expect(mockTemplate.save).toHaveBeenCalled();
      expect(result).toHaveProperty('title', dto.title);
    });

    it('should throw BadRequestException if title is missing (BR2)', async () => {
      const dto: any = {
        department: 'Engineering',
        qualifications: ['Bachelor in CS'],
        skills: ['TypeScript'],
      };

      await expect(service.createJobTemplate(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if qualifications are empty (BR2)', async () => {
      const dto: any = {
        title: 'Senior Software Engineer',
        department: 'Engineering',
        qualifications: [],
        skills: ['TypeScript'],
      };

      await expect(service.createJobTemplate(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if skills are empty (BR2)', async () => {
      const dto: any = {
        title: 'Senior Software Engineer',
        department: 'Engineering',
        qualifications: ['Bachelor in CS'],
        skills: [],
      };

      await expect(service.createJobTemplate(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findJobTemplateById', () => {
    it('should return a job template by ID', async () => {
      const mockTemplate = {
        _id: mockObjectId,
        title: 'Senior Software Engineer',
        department: 'Engineering',
        qualifications: ['Bachelor in CS'],
        skills: ['TypeScript'],
      };

      jest.spyOn(jobTemplateModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTemplate),
      } as any);

      const result = await service.findJobTemplateById(mockObjectId.toString());

      expect(result).toEqual(mockTemplate);
      expect(jobTemplateModel.findById).toHaveBeenCalledWith(mockObjectId.toString());
    });

    it('should throw NotFoundException if template not found', async () => {
      jest.spyOn(jobTemplateModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findJobTemplateById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ==========================================
  // JOB REQUISITIONS TESTS (REC-004, REC-023) - BR2, BR6, BR9
  // ==========================================

  describe('createJobRequisition', () => {
    it('should create a job requisition with valid data (BR2)', async () => {
      const dto = {
        requisitionId: 'REQ-001',
        templateId: mockObjectId.toString(),
        openings: 2,
        location: 'Remote',
        hiringManagerId: mockObjectId.toString(),
        publishStatus: 'draft' as const,
      };

      const mockRequisition = {
        _id: mockObjectId,
        ...dto,
        save: jest.fn().mockResolvedValue({ _id: mockObjectId, ...dto }),
      };

      jest.spyOn(service, 'findJobTemplateById').mockResolvedValue({} as any);
      jest.spyOn(jobRequisitionModel, 'constructor' as any).mockReturnValue(mockRequisition);
      (jobRequisitionModel as any).mockImplementation(() => mockRequisition);

      const result = await service.createJobRequisition(dto);

      expect(mockRequisition.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if openings < 1 (BR2)', async () => {
      const dto: any = {
        requisitionId: 'REQ-001',
        openings: 0,
        hiringManagerId: mockObjectId.toString(),
      };

      await expect(service.createJobRequisition(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('publishJobRequisition', () => {
    it('should publish a job requisition (BR6)', async () => {
      const mockRequisition = {
        _id: mockObjectId,
        publishStatus: 'draft',
        save: jest.fn().mockResolvedValue({ publishStatus: 'published' }),
      };

      jest.spyOn(jobRequisitionModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRequisition),
      } as any);

      const result = await service.publishJobRequisition(mockObjectId.toString());

      expect(mockRequisition.publishStatus).toBe('published');
      expect(mockRequisition.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if already published', async () => {
      const mockRequisition = {
        _id: mockObjectId,
        publishStatus: 'published',
      };

      jest.spyOn(jobRequisitionModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRequisition),
      } as any);

      await expect(service.publishJobRequisition(mockObjectId.toString())).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ==========================================
  // APPLICATIONS TESTS (REC-007, REC-008) - BR12, BR9, BR28
  // ==========================================

  describe('createApplication', () => {
    it('should create an application with consent (BR12, BR28)', async () => {
      const dto = {
        candidateId: mockObjectId.toString(),
        requisitionId: mockObjectId.toString(),
        consentGiven: true,
        isReferral: false,
      };

      const mockApplication = {
        _id: mockObjectId,
        candidateId: new Types.ObjectId(dto.candidateId),
        requisitionId: new Types.ObjectId(dto.requisitionId),
        currentStage: ApplicationStage.SCREENING,
        status: ApplicationStatus.SUBMITTED,
        save: jest.fn().mockResolvedValue({ _id: mockObjectId }),
      };

      jest.spyOn(service, 'findJobRequisitionById').mockResolvedValue({} as any);
      jest.spyOn(applicationModel, 'constructor' as any).mockReturnValue(mockApplication);
      (applicationModel as any).mockImplementation(() => mockApplication);

      const mockHistory = {
        save: jest.fn().mockResolvedValue({}),
      };
      jest.spyOn(applicationHistoryModel, 'constructor' as any).mockReturnValue(mockHistory);
      (applicationHistoryModel as any).mockImplementation(() => mockHistory);

      const result = await service.createApplication(dto);

      expect(mockApplication.save).toHaveBeenCalled();
      expect(mockHistory.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if consent not given (BR28)', async () => {
      const dto: any = {
        candidateId: mockObjectId.toString(),
        requisitionId: mockObjectId.toString(),
        consentGiven: false,
      };

      await expect(service.createApplication(dto)).rejects.toThrow(BadRequestException);
    });

    it('should create referral if isReferral flag is true (BR14, BR25)', async () => {
      const dto = {
        candidateId: mockObjectId.toString(),
        requisitionId: mockObjectId.toString(),
        consentGiven: true,
        isReferral: true,
        referredBy: mockObjectId.toString(),
      };

      const mockApplication = {
        _id: mockObjectId,
        candidateId: new Types.ObjectId(dto.candidateId),
        requisitionId: new Types.ObjectId(dto.requisitionId),
        currentStage: ApplicationStage.SCREENING,
        status: ApplicationStatus.SUBMITTED,
        save: jest.fn().mockResolvedValue({ _id: mockObjectId }),
      };

      const mockReferral = {
        save: jest.fn().mockResolvedValue({}),
      };

      jest.spyOn(service, 'findJobRequisitionById').mockResolvedValue({} as any);
      jest.spyOn(applicationModel, 'constructor' as any).mockReturnValue(mockApplication);
      (applicationModel as any).mockImplementation(() => mockApplication);
      jest.spyOn(referralModel, 'constructor' as any).mockReturnValue(mockReferral);
      (referralModel as any).mockImplementation(() => mockReferral);

      const mockHistory = {
        save: jest.fn().mockResolvedValue({}),
      };
      jest.spyOn(applicationHistoryModel, 'constructor' as any).mockReturnValue(mockHistory);
      (applicationHistoryModel as any).mockImplementation(() => mockHistory);

      await service.createApplication(dto);

      expect(mockReferral.save).toHaveBeenCalled();
    });
  });

  describe('updateApplicationStatus', () => {
    it('should update application status and create history (BR9, BR27)', async () => {
      const mockApplication = {
        _id: mockObjectId,
        currentStage: ApplicationStage.SCREENING,
        status: ApplicationStatus.SUBMITTED,
        save: jest.fn().mockResolvedValue({}),
      };

      const mockHistory = {
        save: jest.fn().mockResolvedValue({}),
      };

      jest.spyOn(applicationModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockApplication),
      } as any);
      jest.spyOn(applicationHistoryModel, 'constructor' as any).mockReturnValue(mockHistory);
      (applicationHistoryModel as any).mockImplementation(() => mockHistory);

      const dto = {
        status: ApplicationStatus.IN_PROCESS,
      };

      const result = await service.updateApplicationStatus(
        mockObjectId.toString(),
        dto,
        mockObjectId.toString(),
      );

      expect(mockApplication.status).toBe(ApplicationStatus.IN_PROCESS);
      expect(mockApplication.save).toHaveBeenCalled();
      expect(mockHistory.save).toHaveBeenCalled();
    });
  });

  // ==========================================
  // INTERVIEWS TESTS (REC-010, REC-011) - BR19, BR20, BR21, BR22
  // ==========================================

  describe('scheduleInterview', () => {
    it('should schedule an interview with panel members (BR19)', async () => {
      const dto = {
        applicationId: mockObjectId.toString(),
        stage: ApplicationStage.DEPARTMENT_INTERVIEW,
        scheduledDate: new Date(Date.now() + 86400000),
        method: InterviewMethod.VIDEO,
        panel: [mockObjectId.toString()],
        videoLink: 'https://meet.example.com/abc',
      };

      const mockInterview = {
        _id: mockObjectId,
        ...dto,
        panel: [new Types.ObjectId(dto.panel[0])],
        status: InterviewStatus.SCHEDULED,
        save: jest.fn().mockResolvedValue({ _id: mockObjectId }),
      };

      jest.spyOn(service, 'findApplicationById').mockResolvedValue({} as any);
      jest.spyOn(interviewModel, 'constructor' as any).mockReturnValue(mockInterview);
      (interviewModel as any).mockImplementation(() => mockInterview);

      const result = await service.scheduleInterview(dto);

      expect(mockInterview.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if no panel members (BR19)', async () => {
      const dto: any = {
        applicationId: mockObjectId.toString(),
        stage: ApplicationStage.DEPARTMENT_INTERVIEW,
        scheduledDate: new Date(Date.now() + 86400000),
        method: InterviewMethod.VIDEO,
        panel: [],
      };

      await expect(service.scheduleInterview(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitInterviewFeedback', () => {
    it('should submit feedback from panel member (BR10, BR22)', async () => {
      const dto = {
        interviewId: mockObjectId.toString(),
        interviewerId: mockObjectId.toString(),
        technicalScore: 8,
        communicationScore: 7,
        cultureFitScore: 9,
        overallScore: 8,
        comments: 'Strong candidate',
        recommendation: 'hire' as const,
      };

      const mockInterview = {
        _id: new Types.ObjectId(dto.interviewId),
        panel: [new Types.ObjectId(dto.interviewerId)],
        status: InterviewStatus.SCHEDULED,
        save: jest.fn().mockResolvedValue({}),
      };

      const mockAssessment = {
        _id: mockObjectId,
        save: jest.fn().mockResolvedValue({ _id: mockObjectId }),
      };

      jest.spyOn(interviewModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockInterview),
      } as any);
      jest.spyOn(assessmentResultModel, 'constructor' as any).mockReturnValue(mockAssessment);
      (assessmentResultModel as any).mockImplementation(() => mockAssessment);
      jest.spyOn(assessmentResultModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockAssessment]),
      } as any);

      const result = await service.submitInterviewFeedback(dto);

      expect(mockAssessment.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if interviewer not in panel (BR22)', async () => {
      const dto = {
        interviewId: mockObjectId.toString(),
        interviewerId: new Types.ObjectId().toString(),
        technicalScore: 8,
        communicationScore: 7,
        cultureFitScore: 9,
        overallScore: 8,
      };

      const mockInterview = {
        _id: new Types.ObjectId(dto.interviewId),
        panel: [new Types.ObjectId()],
      };

      jest.spyOn(interviewModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockInterview),
      } as any);

      await expect(service.submitInterviewFeedback(dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ==========================================
  // OFFERS TESTS (REC-014, REC-018, REC-029) - BR26, BR37
  // ==========================================

  describe('createOffer', () => {
    it('should create an offer with required fields (BR26)', async () => {
      const dto = {
        applicationId: mockObjectId.toString(),
        candidateId: mockObjectId.toString(),
        grossSalary: 100000,
        signingBonus: 10000,
        benefits: ['Health Insurance', '401k'],
        content: 'Offer letter content',
        role: 'Senior Software Engineer',
        deadline: new Date(Date.now() + 604800000),
      };

      const mockApplication = {
        _id: new Types.ObjectId(dto.applicationId),
        status: ApplicationStatus.OFFER,
      };

      const mockOffer = {
        _id: mockObjectId,
        ...dto,
        save: jest.fn().mockResolvedValue({ _id: mockObjectId }),
      };

      jest.spyOn(service, 'findApplicationById').mockResolvedValue(mockApplication as any);
      jest.spyOn(offerModel, 'constructor' as any).mockReturnValue(mockOffer);
      (offerModel as any).mockImplementation(() => mockOffer);

      const result = await service.createOffer(dto);

      expect(mockOffer.save).toHaveBeenCalled();
    });
  });

  describe('approveOffer', () => {
    it('should add approver to offer (BR26b)', async () => {
      const dto = {
        employeeId: mockObjectId.toString(),
        role: 'HR Manager',
        status: ApprovalStatus.APPROVED,
        comment: 'Approved',
      };

      const mockOffer = {
        _id: mockObjectId,
        approvers: [],
        save: jest.fn().mockResolvedValue({}),
      };

      jest.spyOn(offerModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOffer),
      } as any);

      const result = await service.approveOffer(mockObjectId.toString(), dto);

      expect(mockOffer.approvers.length).toBe(1);
      expect(mockOffer.save).toHaveBeenCalled();
    });
  });

  describe('respondToOffer', () => {
    it('should trigger onboarding when offer accepted (BR26c, REC-029)', async () => {
      const dto = {
        response: OfferResponseStatus.ACCEPTED,
      };

      const mockOffer = {
        _id: mockObjectId,
        applicationId: mockObjectId,
        candidateId: mockObjectId,
        applicantResponse: OfferResponseStatus.PENDING,
        save: jest.fn().mockResolvedValue({}),
      };

      jest.spyOn(offerModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOffer),
      } as any);

      const mockApplication = {
        _id: mockObjectId,
        status: ApplicationStatus.OFFER,
        save: jest.fn().mockResolvedValue({}),
      };

      jest.spyOn(applicationModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockApplication),
      } as any);

      const mockHistory = {
        save: jest.fn().mockResolvedValue({}),
      };
      jest.spyOn(applicationHistoryModel, 'constructor' as any).mockReturnValue(mockHistory);
      (applicationHistoryModel as any).mockImplementation(() => mockHistory);

      const result = await service.respondToOffer(mockObjectId.toString(), dto);

      expect(mockOffer.applicantResponse).toBe(OfferResponseStatus.ACCEPTED);
      expect(mockOffer.save).toHaveBeenCalled();
    });
  });

  // ==========================================
  // ANALYTICS TESTS (REC-009) - BR33
  // ==========================================

  describe('getRecruitmentAnalytics', () => {
    it('should generate analytics report (BR33)', async () => {
      const query = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      const mockApplications = [
        {
          _id: mockObjectId,
          status: ApplicationStatus.HIRED,
          currentStage: ApplicationStage.OFFER,
          candidateId: mockObjectId,
        },
        {
          _id: new Types.ObjectId(),
          status: ApplicationStatus.REJECTED,
          currentStage: ApplicationStage.SCREENING,
          candidateId: new Types.ObjectId(),
        },
      ];

      jest.spyOn(applicationModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockApplications),
      } as any);

      jest.spyOn(applicationHistoryModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      jest.spyOn(referralModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await service.getRecruitmentAnalytics(query);

      expect(result).toHaveProperty('totalApplications');
      expect(result).toHaveProperty('byStatus');
      expect(result).toHaveProperty('byStage');
      expect(result).toHaveProperty('averageTimeToHire');
      expect(result).toHaveProperty('conversionRates');
      expect(result).toHaveProperty('referralStats');
      expect(result.totalApplications).toBe(2);
    });
  });
});
