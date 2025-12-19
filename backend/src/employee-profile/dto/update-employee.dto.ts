import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';
import {IsArray, IsString, IsOptional, IsDateString, IsEnum, IsObject } from 'class-validator';
import { ContractType, WorkType, EmployeeStatus, SystemRole } from '../enums/employee-profile.enums';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
   @IsArray()
  @IsEnum(SystemRole, { each: true })
  roles: SystemRole[];
}
