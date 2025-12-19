import { Controller, Post, Body, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { CreatePunchDto } from '../dto/create-punch.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('punch')
  async punch(@Body() dto: CreatePunchDto) {
    return this.attendanceService.createPunch(dto);
  }

  @Get(':employeeId')
  async getAttendance(
  @Param('employeeId') employeeId: string, 
  @Query('date') date?: string
) {
  if (!employeeId) {
    throw new BadRequestException('Employee ID is required');
  }

  let dateObj: Date | undefined;
  if (date) {
    dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
      return this.attendanceService.getAttendance(employeeId, dateObj);

  }
  return this.attendanceService.getAttendance(employeeId);
}

}
