import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';


import { JobTemplate, JobTemplateDocument } from '../models/job-template.schema';
import { JobRequisition, JobRequisitionDocument } from '../models/job-requisition.schema';
import { Application, ApplicationDocument } from '../models/application.schema';
import { Interview, InterviewDocument } from '../models/interview.schema';
import { Offer, OfferDocument } from '../models/offer.schema';
import { Onboarding, OnboardingDocument } from '../models/onboarding.schema';
import { Document, DocumentDocument } from '../models/document.schema';
import { Contract, ContractDocument } from '../models/contract.schema';
import { ApplicationStatusHistory, ApplicationStatusHistoryDocument } from '../models/application-history.schema';
import { AssessmentResult, AssessmentResultDocument } from '../models/assessment-result.schema';
import { Referral, ReferralDocument } from '../models/referral.schema';
import { TerminationRequest, TerminationRequestDocument } from '../models/termination-request.schema';
import { ClearanceChecklist, ClearanceChecklistDocument } from '../models/clearance-checklist.schema';

import { ApplicationStage } from '../enums/application-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';
import { InterviewMethod } from '../enums/interview-method.enum';
import { InterviewStatus } from '../enums/interview-status.enum';
import { OfferResponseStatus } from '../enums/offer-response-status.enum';
import { OfferFinalStatus } from '../enums/offer-final-status.enum';
import { ApprovalStatus } from '../enums/approval-status.enum';
import { OnboardingTaskStatus } from '../enums/onboarding-task-status.enum';
import { DocumentType } from '../enums/document-type.enum';
import { TerminationInitiation } from '../enums/termination-initiation.enum';
import { TerminationStatus } from '../enums/termination-status.enum';

/**
 * Recruitment Module Seeding Script (ASCII-safe)
 *
 * Covers end-to-end flows for milestone 2:
 * - Job templates and requisitions (published/draft/external)
 * - Applications across stages with histories and interviews
 * - Offers (accepted/pending), contracts, onboarding trigger
 * - Referrals and status history (rejection + notification template marker)
 * - Compliance placeholders (consent doc) without schema changes
 * - Termination and clearance checklist to close the lifecycle
 */
async function seedRecruitment() {
  console.log('Starting Recruitment Module Seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const jobTemplateModel = app.get<Model<JobTemplateDocument>>(getModelToken(JobTemplate.name));
    const jobRequisitionModel = app.get<Model<JobRequisitionDocument>>(getModelToken(JobRequisition.name));
    const applicationModel = app.get<Model<ApplicationDocument>>(getModelToken(Application.name));
    const interviewModel = app.get<Model<InterviewDocument>>(getModelToken(Interview.name));
    const offerModel = app.get<Model<OfferDocument>>(getModelToken(Offer.name));
    const onboardingModel = app.get<Model<OnboardingDocument>>(getModelToken(Onboarding.name));
    const documentModel = app.get<Model<DocumentDocument>>(getModelToken(Document.name));
    const contractModel = app.get<Model<ContractDocument>>(getModelToken(Contract.name));
    const applicationHistoryModel = app.get<Model<ApplicationStatusHistoryDocument>>(
      getModelToken(ApplicationStatusHistory.name),
    );
    const assessmentResultModel = app.get<Model<AssessmentResultDocument>>(getModelToken(AssessmentResult.name));
    const referralModel = app.get<Model<ReferralDocument>>(getModelToken(Referral.name));
    const terminationRequestModel = app.get<Model<TerminationRequestDocument>>(
      getModelToken(TerminationRequest.name),
    );
    const clearanceChecklistModel = app.get<Model<ClearanceChecklistDocument>>(getModelToken(ClearanceChecklist.name));

    const users = {
      hiringManager: new Types.ObjectId(),
      hr: new Types.ObjectId(),
      interviewer: new Types.ObjectId(),
      financeApprover: new Types.ObjectId(),
      employee: new Types.ObjectId(),
      candidateUserPrimary: new Types.ObjectId(),
      candidateUserRejected: new Types.ObjectId(),
      candidateUserReferral: new Types.ObjectId(),
    };

    const candidates = {
      primary: new Types.ObjectId(),
      rejected: new Types.ObjectId(),
      referral: new Types.ObjectId(),
    };

    console.log('Clearing existing recruitment data...');
    await Promise.all([
      jobTemplateModel.deleteMany({}),
      jobRequisitionModel.deleteMany({}),
      applicationModel.deleteMany({}),
      interviewModel.deleteMany({}),
      offerModel.deleteMany({}),
      onboardingModel.deleteMany({}),
      documentModel.deleteMany({}),
      contractModel.deleteMany({}),
      applicationHistoryModel.deleteMany({}),
      assessmentResultModel.deleteMany({}),
      referralModel.deleteMany({}),
      terminationRequestModel.deleteMany({}),
      clearanceChecklistModel.deleteMany({}),
    ]);
    console.log('Existing data cleared.');

    const jobTemplateEngineering = await jobTemplateModel.create({
      title: 'Senior Software Engineer',
      department: 'Engineering',
      qualifications: ["Bachelor's in Computer Science", '5+ years experience'],
      skills: ['TypeScript', 'Node.js', 'React', 'MongoDB'],
      description: 'Employer-branded template. Stages: screening -> department interview -> HR interview -> offer.',
    });

    const jobTemplateHR = await jobTemplateModel.create({
      title: 'HR Business Partner',
      department: 'People',
      qualifications: ['HR certification', '3+ years HRBP experience'],
      skills: ['Employee Relations', 'Analytics', 'Communication'],
      description: 'Internal template. Stages: screening -> HR interview -> offer (with approvals).',
    });

    const jobTemplateMarketing = await jobTemplateModel.create({
      title: 'Marketing Manager',
      department: 'Marketing',
      qualifications: ['Brand management background', 'Portfolio of campaigns'],
      skills: ['Content', 'SEO', 'Campaign Analytics'],
      description: 'External careers page ready. Stages: screening -> panel interview -> offer.',
    });

    const jobRequisitionPublished = await jobRequisitionModel.create({
      requisitionId: 'REQ-2024-001',
      templateId: jobTemplateEngineering._id,
      openings: 2,
      location: 'Remote',
      hiringManagerId: users.hiringManager,
      publishStatus: 'published',
      postingDate: new Date('2024-01-15'),
      expiryDate: new Date('2024-03-15'),
    });

    const jobRequisitionDraft = await jobRequisitionModel.create({
      requisitionId: 'REQ-2024-002',
      templateId: jobTemplateHR._id,
      openings: 1,
      location: 'Cairo HQ',
      hiringManagerId: users.hiringManager,
      publishStatus: 'draft',
      postingDate: undefined,
      expiryDate: new Date('2024-04-01'),
    });

    const jobRequisitionExternal = await jobRequisitionModel.create({
      requisitionId: 'REQ-2024-003',
      templateId: jobTemplateMarketing._id,
      openings: 1,
      location: 'Riyadh (External Careers Page)',
      hiringManagerId: users.hiringManager,
      publishStatus: 'published',
      postingDate: new Date('2024-02-01'),
      expiryDate: new Date('2024-04-01'),
    });

    const applicationPrimary = await applicationModel.create({
      candidateId: candidates.primary,
      requisitionId: jobRequisitionPublished._id,
      assignedHr: users.hr,
      currentStage: ApplicationStage.SCREENING,
      status: ApplicationStatus.IN_PROCESS,
    });

    const applicationRejected = await applicationModel.create({
      candidateId: candidates.rejected,
      requisitionId: jobRequisitionPublished._id,
      assignedHr: users.hr,
      currentStage: ApplicationStage.SCREENING,
      status: ApplicationStatus.SUBMITTED,
    });

    const applicationReferral = await applicationModel.create({
      candidateId: candidates.referral,
      requisitionId: jobRequisitionExternal._id,
      assignedHr: users.hr,
      currentStage: ApplicationStage.HR_INTERVIEW,
      status: ApplicationStatus.IN_PROCESS,
    });

    const applicationHistories = await applicationHistoryModel.create([
      {
        applicationId: applicationPrimary._id,
        oldStage: ApplicationStage.SCREENING,
        newStage: ApplicationStage.DEPARTMENT_INTERVIEW,
        oldStatus: ApplicationStatus.SUBMITTED,
        newStatus: ApplicationStatus.IN_PROCESS,
        changedBy: users.hr,
      },
      {
        applicationId: applicationPrimary._id,
        oldStage: ApplicationStage.DEPARTMENT_INTERVIEW,
        newStage: ApplicationStage.HR_INTERVIEW,
        oldStatus: ApplicationStatus.IN_PROCESS,
        newStatus: ApplicationStatus.IN_PROCESS,
        changedBy: users.hiringManager,
      },
      {
        applicationId: applicationRejected._id,
        oldStage: ApplicationStage.SCREENING,
        newStage: ApplicationStage.SCREENING,
        oldStatus: ApplicationStatus.SUBMITTED,
        newStatus: ApplicationStatus.REJECTED,
        changedBy: users.hr,
      },
      {
        applicationId: applicationReferral._id,
        oldStage: ApplicationStage.SCREENING,
        newStage: ApplicationStage.HR_INTERVIEW,
        oldStatus: ApplicationStatus.SUBMITTED,
        newStatus: ApplicationStatus.IN_PROCESS,
        changedBy: users.hr,
      },
    ]);
    console.log(`Application histories created: ${applicationHistories.length}`);

    const interviewPrimary = await interviewModel.create({
      applicationId: applicationPrimary._id,
      stage: ApplicationStage.DEPARTMENT_INTERVIEW,
      scheduledDate: new Date('2024-02-01T10:00:00Z'),
      method: InterviewMethod.VIDEO,
      panel: [users.interviewer, users.hiringManager],
      videoLink: 'https://meet.example.com/interview-001',
      status: InterviewStatus.COMPLETED,
    });

    const interviewReferral = await interviewModel.create({
      applicationId: applicationReferral._id,
      stage: ApplicationStage.HR_INTERVIEW,
      scheduledDate: new Date('2024-02-07T09:00:00Z'),
      method: InterviewMethod.ONSITE,
      panel: [users.hiringManager],
      calendarEventId: 'CAL-REF-001',
      status: InterviewStatus.SCHEDULED,
      candidateFeedback: 'Pre-panel brief shared with candidate (communication template).',
    });

    const assessmentPrimary = await assessmentResultModel.create({
      interviewId: interviewPrimary._id,
      interviewerId: users.interviewer,
      score: 85,
      comments: 'Strong technical skills, good communication.',
    });

    const assessmentReferral = await assessmentResultModel.create({
      interviewId: interviewReferral._id,
      interviewerId: users.hiringManager,
      score: 90,
      comments: 'Referral candidate with strong campaign portfolio.',
    });

    await interviewModel.updateOne({ _id: interviewPrimary._id }, { feedbackId: assessmentPrimary._id });
    await interviewModel.updateOne({ _id: interviewReferral._id }, { feedbackId: assessmentReferral._id });

    const offerAccepted = await offerModel.create({
      applicationId: applicationPrimary._id,
      candidateId: candidates.primary,
      hrEmployeeId: users.hr,
      grossSalary: 120000,
      signingBonus: 5000,
      benefits: ['Health Insurance', '401k', 'Remote Work'],
      conditions: 'Standard employment terms',
      insurances: 'Full health and dental coverage',
      content: 'Offer letter for Senior Software Engineer.',
      role: 'Senior Software Engineer',
      deadline: new Date('2024-02-15'),
      applicantResponse: OfferResponseStatus.ACCEPTED,
      approvers: [
        {
          employeeId: users.hiringManager,
          role: 'Hiring Manager',
          status: ApprovalStatus.APPROVED,
          actionDate: new Date('2024-02-05'),
          comment: 'Approved',
        },
        {
          employeeId: users.financeApprover,
          role: 'Finance',
          status: ApprovalStatus.APPROVED,
          actionDate: new Date('2024-02-06'),
          comment: 'Budget confirmed',
        },
      ],
      finalStatus: OfferFinalStatus.APPROVED,
      candidateSignedAt: new Date('2024-02-10'),
      hrSignedAt: new Date('2024-02-10'),
    });

    const offerPending = await offerModel.create({
      applicationId: applicationReferral._id,
      candidateId: candidates.referral,
      hrEmployeeId: users.hr,
      grossSalary: 95000,
      benefits: ['Medical', 'Annual Bonus'],
      conditions: 'Pending candidate response',
      content: 'Offer letter for Marketing Manager.',
      role: 'Marketing Manager',
      deadline: new Date('2024-03-05'),
      applicantResponse: OfferResponseStatus.PENDING,
      approvers: [
        {
          employeeId: users.hiringManager,
          role: 'Hiring Manager',
          status: ApprovalStatus.PENDING,
          actionDate: undefined,
          comment: 'Awaiting panel feedback',
        },
      ],
      finalStatus: OfferFinalStatus.PENDING,
    });

    const contractDocument = await documentModel.create({
      ownerId: users.employee,
      type: DocumentType.CONTRACT,
      filePath: '/documents/contracts/contract-001.pdf',
      uploadedAt: new Date('2024-02-10'),
    });

    await documentModel.create({
      ownerId: users.candidateUserRejected,
      type: DocumentType.CV,
      filePath: '/documents/cv/candidate-rejected.pdf',
      uploadedAt: new Date('2024-01-20'),
    });

    await documentModel.create({
      ownerId: users.candidateUserReferral,
      type: DocumentType.ID,
      filePath: '/documents/consents/referral-candidate-consent.txt',
      uploadedAt: new Date('2024-02-01'),
    });

    const contract = await contractModel.create({
      offerId: offerAccepted._id,
      acceptanceDate: new Date('2024-02-10'),
      grossSalary: 120000,
      signingBonus: 5000,
      role: 'Senior Software Engineer',
      benefits: ['Health Insurance', '401k', 'Remote Work'],
      documentId: contractDocument._id,
      employeeSignedAt: new Date('2024-02-10'),
      employerSignedAt: new Date('2024-02-10'),
    });

    await onboardingModel.create({
      employeeId: users.employee,
      tasks: [
        {
          name: 'Pre-boarding paperwork',
          department: 'HR',
          status: OnboardingTaskStatus.COMPLETED,
          deadline: new Date('2024-02-20'),
          completedAt: new Date('2024-02-18'),
          documentId: contractDocument._id,
          notes: 'All compliance forms signed',
        },
        {
          name: 'Set up Email Account',
          department: 'IT',
          status: OnboardingTaskStatus.IN_PROGRESS,
          deadline: new Date('2024-02-25'),
          notes: 'Provisioning requested',
        },
        {
          name: 'Complete Payroll Forms',
          department: 'HR',
          status: OnboardingTaskStatus.PENDING,
          deadline: new Date('2024-02-28'),
          notes: 'Pending employee submission',
        },
      ],
      completed: false,
    });

    await referralModel.create({
      referringEmployeeId: users.employee,
      candidateId: candidates.referral,
      role: 'Marketing Manager',
      level: 'Senior',
    });

    const terminationRequest = await terminationRequestModel.create({
      employeeId: users.employee,
      initiator: TerminationInitiation.EMPLOYEE,
      reason: 'Resignation - Personal reasons',
      employeeComments: 'Moving to a new city',
      status: TerminationStatus.UNDER_REVIEW,
      terminationDate: new Date('2024-04-30'),
      contractId: contract._id,
    });

    await clearanceChecklistModel.create({
      terminationId: terminationRequest._id,
      items: [
        {
          department: 'IT',
          status: ApprovalStatus.PENDING,
          comments: 'Return laptop and access card',
        },
        {
          department: 'Finance',
          status: ApprovalStatus.PENDING,
          comments: 'Settle pending expenses',
        },
        {
          department: 'HR',
          status: ApprovalStatus.PENDING,
          comments: 'Complete exit interview',
        },
      ],
      equipmentList: [
        {
          equipmentId: new Types.ObjectId(),
          name: 'Laptop',
          returned: false,
          condition: 'Good',
        },
      ],
      cardReturned: false,
    });

    console.log('Recruitment Module Seeding Completed Successfully!');
    console.log('Summary:');
    console.log('  - Job Templates: 3');
    console.log('  - Job Requisitions: 3');
    console.log('  - Applications: 3');
    console.log(`  - Application Histories: ${applicationHistories.length}`);
    console.log('  - Interviews: 2');
    console.log('  - Assessment Results: 2');
    console.log('  - Offers: 2 (1 accepted, 1 pending)');
    console.log('  - Contracts: 1');
    console.log('  - Documents: 3 (cv, consent placeholder, contract)');
    console.log('  - Onboarding Records: 1');
    console.log('  - Referrals: 1');
    console.log('  - Terminations: 1');
    console.log('  - Clearance Checklists: 1');
    console.log('This demonstrates:');
    console.log('  - Complete recruitment workflow from job posting to onboarding and termination');
    console.log('  - Published vs draft vs external posting requisitions');
    console.log('  - Application status history, interviews, and referral priority coverage');
    console.log('  - Offer approvals, acceptance, and onboarding trigger');
    console.log('  - Consent placeholder via document record (schema unchanged)');
    console.log('  - Offboarding via termination and clearance checklist');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seedRecruitment()
  .then(() => {
    console.log('Seeding process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
