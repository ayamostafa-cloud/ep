export class ScheduleAssignmentResponseDto {
  _id: string;
  shiftTemplateId: string;
  employeeId?: string;
  departmentId?: string;
  positionId?: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  assignedBy: string;
  source: string;
  metadata?: {
    notes?: string;
    reason?: string;
    previousAssignmentId?: string;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
