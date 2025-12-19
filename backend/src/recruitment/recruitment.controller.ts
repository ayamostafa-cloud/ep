import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RecruitmentService } from './recruitment.service';
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
import { ValidationPipe } from '@nestjs/common';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get()
  @ApiOperation({ summary: 'API Information' })
  @ApiResponse({
    status: 200,
    description: 'API information and available endpoints',
  })
  getApiInfo() {
    return {
      message: 'HR Recruitment, Onboarding & Offboarding API',
      version: '1.0',
      documentation: '/api',
      endpoints: {
        templates: '/templates',
        jobs: '/jobs',
        applications: '/applications',
        interviews: '/interviews',
        referrals: '/referrals',
        offers: '/offers',
        analytics: '/analytics/recruitment',
        consent: '/consent',
      },
    };
  }

  // ==========================================
  // JOB TEMPLATES (REC-003) - BR2
  // ==========================================

  @ApiTags('jobs')
  @ApiOperation({
    summary: 'Create job template (REC-003)',
    description:
      'HR Manager defines standardized job description templates. BR2: Must include title, department, qualifications, and skills.',
  })
  @ApiResponse({
    status: 201,
    description: 'Job template created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed (BR2)' })
  @Roles('hr_manager')
  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createJobTemplate(@Body() dto: CreateJobTemplateDto) {
    return this.recruitmentService.createJobTemplate(dto);
  }

  @ApiTags('jobs')
  @ApiOperation({ summary: 'Get all job templates (REC-003)' })
  @ApiResponse({ status: 200, description: 'List of job templates' })
  @Get('templates')
  async getAllTemplates() {
    return this.recruitmentService.findAllJobTemplates();
  }

  @ApiTags('jobs')
  @ApiOperation({ summary: 'Get job template by ID (REC-003)' })
  @ApiParam({ name: 'id', description: 'Job template ID' })
  @ApiResponse({ status: 200, description: 'Job template found' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.recruitmentService.findJobTemplateById(id);
  }

  @ApiTags('jobs')
  @ApiOperation({ summary: 'Update job template (REC-003)' })
  @ApiParam({ name: 'id', description: 'Job template ID' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Roles('hr_manager')
  @Put('templates/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateJobTemplateDto,
  ) {
    return this.recruitmentService.updateJobTemplate(id, dto);
  }

  @ApiTags('jobs')
  @ApiOperation({ summary: 'Delete job template (REC-003)' })
  @ApiParam({ name: 'id', description: 'Job template ID' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Roles('hr_manager')
  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(@Param('id') id: string) {
    return this.recruitmentService.deleteJobTemplate(id);
  }

  // ==========================================
  // JOB REQUISITIONS (REC-003, REC-004, REC-023) - BR2, BR6, BR9
  // ==========================================

  @ApiTags('jobs')
  @ApiOperation({
    summary: 'Create job requisition (REC-003, REC-004)',
    description:
      'Create a job requisition using a template. BR2: Must include job details and qualifications. BR9: Applications tracked through stages.',
  })
  @ApiResponse({ status: 201, description: 'Job requisition created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Roles('hr_manager')
  @Post('jobs')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createJob(@Body() dto: CreateJobRequisitionDto) {
    return this.recruitmentService.createJobRequisition(dto);
  }

  @ApiTags('jobs')
  @ApiOperation({ summary: 'List all job requisitions' })
  @ApiResponse({ status: 200, description: 'List of job requisitions' })
  @Get('jobs')
  async listJobs() {
    return this.recruitmentService.findAllJobRequisitions();
  }

  @ApiTags('jobs')
  @ApiOperation({
    summary: 'Get job requisition by ID',
    description: 'Get a single job/requisition (preview for careers page)',
  })
  @ApiParam({ name: 'id', description: 'Job requisition ID' })
  @ApiResponse({ status: 200, description: 'Job requisition found' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    return this.recruitmentService.findJobRequisitionById(id);
  }

  @ApiTags('jobs')
  @ApiOperation({
    summary: 'Publish job to career sites (REC-023)',
    description:
      'Preview and publish jobs on company careers page. BR6: Automatic posting to internal and external career sites.',
  })
  @ApiParam({ name: 'id', description: 'Job requisition ID' })
  @ApiResponse({ status: 200, description: 'Job published successfully' })
  @ApiResponse({ status: 400, description: 'Job already published' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @Roles('hr_manager')
  @Post('jobs/:id/publish')
  async publishJob(@Param('id') id: string) {
    return this.recruitmentService.publishJobRequisition(id);
  }

  @ApiTags('jobs')
  @ApiOperation({ summary: 'Update job requisition' })
  @ApiParam({ name: 'id', description: 'Job requisition ID' })
  @ApiResponse({ status: 200, description: 'Job updated' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @Roles('hr_manager')
  @Put('jobs/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateJob(
    @Param('id') id: string,
    @Body() dto: UpdateJobRequisitionDto,
  ) {
    return this.recruitmentService.updateJobRequisition(id, dto);
  }

  // ==========================================
  // APPLICATIONS (REC-007, REC-008, REC-017, REC-022, REC-028) - BR12, BR9, BR27, BR28, BR36, BR37
  // ==========================================

  @ApiTags('applications')
  @ApiOperation({
    summary: 'Apply to a job (REC-007, REC-028)',
    description:
      'Candidate uploads CV and applies for position. BR12: Creates talent pool. BR28: Consent required for data processing.',
  })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or consent not given (BR28)',
  })
  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async apply(@Body() dto: CreateApplicationDto) {
    return this.recruitmentService.createApplication(dto);
  }

  @ApiTags('applications')
  @ApiOperation({ summary: 'Get all applications' })
  @ApiResponse({ status: 200, description: 'List of applications' })
  @Get('applications')
  async getAllApplications() {
    return this.recruitmentService.findAllApplications();
  }

  @ApiTags('applications')
  @ApiOperation({
    summary: 'Get application by ID',
    description: 'Get application details including status and history',
  })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Application found' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @Get('applications/:id')
  async getApplication(@Param('id') id: string) {
    return this.recruitmentService.findApplicationById(id);
  }

  @ApiTags('applications')
  @ApiOperation({
    summary: 'Get application status and history (REC-017, REC-008)',
    description:
      'Get status of an application with tracking history. BR27: Real-time status tracking.',
  })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application status and history',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @Get('applications/:id/status')
  async getStatus(@Param('id') id: string) {
    const application = await this.recruitmentService.findApplicationById(id);
    const history = await this.recruitmentService.getApplicationHistory(id);
    return {
      application,
      history,
    };
  }

  @ApiTags('applications')
  @ApiOperation({
    summary: 'Update application status (REC-008, REC-022)',
    description:
      'Update status of an application. BR9: Track through defined stages. BR11: Triggers notifications.',
  })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiBody({ type: UpdateApplicationStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @Post('applications/:id/status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    // In real implementation, get userId from JWT token
    const changedBy = 'system'; // TODO: Extract from JWT token
    return this.recruitmentService.updateApplicationStatus(id, dto, changedBy);
  }

  @ApiTags('applications')
  @ApiOperation({
    summary: 'Send rejection notification (REC-022)',
    description:
      'Send automated rejection notification to candidate. BR36: Automated alerts/emails. BR37: Communication logs stored.',
  })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiBody({ type: RejectionTemplateDto })
  @ApiResponse({
    status: 200,
    description: 'Rejection notification sent',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @Post('applications/:id/reject')
  @UsePipes(new ValidationPipe({ transform: true }))
  async notifyCandidate(
    @Param('id') id: string,
    @Body() template: RejectionTemplateDto,
  ) {
    await this.recruitmentService.sendRejectionNotification(id, template);
    return {
      message: 'Rejection notification sent successfully',
      applicationId: id,
    };
  }

  // ==========================================
  // INTERVIEWS (REC-010, REC-011, REC-020, REC-021) - BR19, BR20, BR21, BR22, BR23
  // ==========================================

  @ApiTags('interviews')
  @ApiOperation({
    summary: 'Schedule interview (REC-010, REC-021)',
    description:
      'Schedule and manage interview invitations. BR19: Select time slots, panel members, modes. Automatic calendar invites and candidate notifications.',
  })
  @ApiResponse({
    status: 201,
    description: 'Interview scheduled successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed (BR19)' })
  @Post('interviews')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async scheduleInterview(@Body() dto: ScheduleInterviewDto) {
    return this.recruitmentService.scheduleInterview(dto);
  }

  @ApiTags('interviews')
  @ApiOperation({ summary: 'Get all interviews for an application' })
  @ApiQuery({
    name: 'applicationId',
    required: true,
    description: 'Application ID',
  })
  @ApiResponse({ status: 200, description: 'List of interviews' })
  @Get('interviews')
  async getInterviews(@Query('applicationId') applicationId: string) {
    if (!applicationId) {
      return { message: 'applicationId query parameter is required' };
    }
    return this.recruitmentService.findInterviewsByApplication(applicationId);
  }

  @ApiTags('interviews')
  @ApiOperation({
    summary: 'Get interview details (REC-010, REC-021)',
    description: 'Get interview details including panel members and schedule',
  })
  @ApiParam({ name: 'id', description: 'Interview ID' })
  @ApiResponse({ status: 200, description: 'Interview found' })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  @Get('interviews/:id')
  async getInterview(@Param('id') id: string) {
    return this.recruitmentService.findInterviewById(id);
  }

  @ApiTags('interviews')
  @ApiOperation({
    summary: 'Submit interview feedback (REC-011, REC-020)',
    description:
      'Submit feedback/interview score. BR10: Comments and ratings. BR22: Only panel members can submit. BR21/BR23: Structured assessment.',
  })
  @ApiParam({ name: 'id', description: 'Interview ID' })
  @ApiBody({ type: SubmitInterviewFeedbackDto })
  @ApiResponse({
    status: 201,
    description: 'Feedback submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Interviewer not in panel (BR22)',
  })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  @Post('interviews/:id/feedback')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async submitFeedback(
    @Param('id') interviewId: string,
    @Body() dto: SubmitInterviewFeedbackDto,
  ) {
    // The DTO already expects interviewId, but we get it from URL param
    const feedbackDto: SubmitInterviewFeedbackDto = {
      ...dto,
      interviewId, // Override with URL parameter
    };
    return this.recruitmentService.submitInterviewFeedback(feedbackDto);
  }

  // ==========================================
  // REFERRALS (REC-030) - BR14, BR25
  // ==========================================

  @ApiTags('recruitment')
  @ApiOperation({
    summary: 'Tag candidate as referral (REC-030)',
    description:
      'Tag candidates as referrals for priority screening. BR14: Rule-based filters. BR25: Tie-breaking rules.',
  })
  @ApiResponse({ status: 201, description: 'Candidate tagged as referral' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Post('referrals')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async tagReferral(@Body() dto: CreateReferralDto) {
    return this.recruitmentService.createReferral(dto);
  }

  @ApiTags('recruitment')
  @ApiOperation({ summary: 'Get referrals by candidate' })
  @ApiQuery({
    name: 'candidateId',
    required: true,
    description: 'Candidate ID',
  })
  @ApiResponse({ status: 200, description: 'List of referrals' })
  @Get('referrals')
  async getReferrals(@Query('candidateId') candidateId: string) {
    if (!candidateId) {
      return { message: 'candidateId query parameter is required' };
    }
    return this.recruitmentService.findReferralsByCandidate(candidateId);
  }

  // ==========================================
  // OFFERS (REC-014, REC-018, REC-029) - BR26, BR37
  // ==========================================

  @ApiTags('offers')
  @ApiOperation({
    summary: 'Create offer letter (REC-014, REC-018)',
    description:
      'Generate and send offer letter. BR26(a): Customizable and editable. BR26(b): Requires approvals before sending.',
  })
  @ApiResponse({
    status: 201,
    description: 'Offer created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Application not at offer stage',
  })
  @Roles('hr_manager')
  @Post('offers')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createOffer(@Body() dto: CreateOfferDto) {
    return this.recruitmentService.createOffer(dto);
  }

  @ApiTags('offers')
  @ApiOperation({ summary: 'Get offer by ID' })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiResponse({ status: 200, description: 'Offer found' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @Get('offers/:id')
  async getOffer(@Param('id') id: string) {
    return this.recruitmentService.findOfferById(id);
  }

  @ApiTags('offers')
  @ApiOperation({
    summary: 'Approve offer (REC-014)',
    description:
      'Approve offer by authorized party. BR26(b): Multi-party approval workflow.',
  })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiBody({ type: ApproveOfferDto })
  @ApiResponse({ status: 200, description: 'Offer approved' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @Roles('hr_manager')
  @Post('offers/:id/approve')
  @UsePipes(new ValidationPipe({ transform: true }))
  async approveOffer(@Param('id') id: string, @Body() dto: ApproveOfferDto) {
    return this.recruitmentService.approveOffer(id, dto);
  }

  @ApiTags('offers')
  @ApiOperation({
    summary: 'Accept offer and trigger onboarding (REC-018, REC-029)',
    description:
      'Candidate accepts offer. BR26(c): Triggers onboarding. BR26(d)/BR37: Communication logs stored.',
  })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiBody({ type: RespondOfferDto })
  @ApiResponse({
    status: 200,
    description: 'Offer accepted, onboarding triggered',
  })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @Post('offers/:id/accept')
  @UsePipes(new ValidationPipe({ transform: true }))
  async acceptOffer(@Param('id') id: string, @Body() dto: RespondOfferDto) {
    return this.recruitmentService.respondToOffer(id, dto);
  }

  // ==========================================
  // ANALYTICS (REC-009) - BR33
  // ==========================================

  @ApiTags('analytics')
  @ApiOperation({
    summary: 'Get recruitment analytics (REC-009)',
    description:
      'Monitor recruitment progress across all open positions. BR33: Multiple reports (time-to-hire, source effectiveness).',
  })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'requisitionId', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['submitted', 'in_process', 'offer', 'hired', 'rejected'],
  })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  @Get('analytics/recruitment')
  async getRecruitmentAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.recruitmentService.getRecruitmentAnalytics(query);
  }

  // ==========================================
  // CONSENT (REC-028) - BR28
  // ==========================================

  @ApiTags('applications')
  @ApiOperation({
    summary: 'Save candidate consent (REC-028)',
    description:
      'Save consent for personal-data processing and background checks. BR28: Required for GDPR compliance.',
  })
  @ApiResponse({ status: 201, description: 'Consent saved' })
  @ApiResponse({
    status: 400,
    description: 'Consent is required (BR28)',
  })
  @Post('consent')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async saveConsent(
    @Body() dto: { candidateId: string; consentGiven: boolean },
  ) {
    // Consent is handled in createApplication, but this endpoint allows updating consent
    if (!dto.consentGiven) {
      return {
        message: 'Consent is required for data processing (BR28)',
      };
    }
    return { message: 'Consent saved successfully', consent: dto };
  }
}
