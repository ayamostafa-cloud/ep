import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceService } from './services/attendance.service';
import { AttendanceController } from './controllers/attendance.controller';
import { AttendanceRecord, AttendanceRecordSchema } from './schemas/attendance-record.schema';
import { AttendanceCorrectionRequest, AttendanceCorrectionRequestSchema } from './schemas/attendance-correction-request.schema';
import { TimeException, TimeExceptionSchema } from './schemas/time-exception.schema';
import { Punch, PunchSchema } from './schemas/punch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Punch.name, schema: PunchSchema },
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: AttendanceCorrectionRequest.name, schema: AttendanceCorrectionRequestSchema },
      { name: TimeException.name, schema: TimeExceptionSchema },
    ]),
  ],
  providers: [AttendanceService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
