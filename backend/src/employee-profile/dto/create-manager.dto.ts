import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateManagerDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  employeeNumber: string;

  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfHire: string;

  @IsString()
  @IsNotEmpty()
  primaryDepartmentId: string;

  @IsString()
  @IsNotEmpty()
  primaryPositionId: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
