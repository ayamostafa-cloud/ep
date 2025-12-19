import { IsString, IsOptional, IsDateString, IsEnum, IsObject } from 'class-validator';
import { ContractType, WorkType, EmployeeStatus, SystemRole } from '../enums/employee-profile.enums';

export class CreateEmployeeDto {
  // UserProfileBase fields
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  nationalId: string;

  @IsObject()
  address: {
    street: string;
    city: string;
    country: string;
  };

  @IsString()
  phone: string;

  @IsString()
  personalEmail: string;
  @IsString()
  password: string;
  // EmployeeProfile fields
  @IsString()
  employeeNumber: string;
   
  @IsEnum(SystemRole)
 role: SystemRole;

  @IsDateString()
  dateOfHire: string;

  @IsOptional()
  @IsString()
  workEmail?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsDateString()
  contractStartDate?: string;

  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional()
  @IsEnum(WorkType)
  workType?: WorkType;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsString()
  primaryPositionId?: string;

  @IsOptional()
  @IsString()
  primaryDepartmentId?: string;

  @IsOptional()
  @IsString()
  supervisorPositionId?: string;

  @IsOptional()
  @IsString()
  payGradeId?: string;



}
