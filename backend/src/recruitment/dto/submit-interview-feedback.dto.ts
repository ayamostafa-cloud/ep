import { IsMongoId, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class SubmitInterviewFeedbackDto {
  @IsMongoId()
  @IsOptional()
  interviewId?: string; // Optional - comes from URL parameter

  @IsMongoId()
  interviewerId: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  technicalScore: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  communicationScore: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  cultureFitScore: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  overallScore: number;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsString()
  @IsOptional()
  recommendation?: 'hire' | 'reject' | 'maybe';
}

