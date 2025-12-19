import { IsMongoId, IsEnum, IsDate, IsArray, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStage } from '../enums/application-stage.enum';
import { InterviewMethod } from '../enums/interview-method.enum';

export class ScheduleInterviewDto {
  @IsMongoId()
  applicationId: string;

  @IsEnum(ApplicationStage)
  @IsNotEmpty()
  stage: ApplicationStage;

  @IsDate()
  @Type(() => Date)
  scheduledDate: Date;

  @IsEnum(InterviewMethod)
  method: InterviewMethod;

  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  panel: string[]; // Panel member IDs

  @IsString()
  @IsOptional()
  videoLink?: string;

  @IsString()
  @IsOptional()
  calendarEventId?: string;
}

