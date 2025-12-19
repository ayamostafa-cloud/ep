import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationStructureController } from './organization-structure.controller';
import { OrganizationStructureService } from './organization-structure.service';
import { Department, DepartmentSchema } from './models/department.schema';
import { Position, PositionSchema } from './models/position.schema';
import { HierarchyService } from './hierarchy/hierarchy.service'; 
import { StructureValidation } from './utils/structure.validation'; 

import {
  PositionAssignment,
  PositionAssignmentSchema,
} from './models/position-assignment.schema';
import {
  StructureApproval,
  StructureApprovalSchema,
} from './models/structure-approval.schema';
import {
  StructureChangeLog,
  StructureChangeLogSchema,
} from './models/structure-change-log.schema';
import {
  StructureChangeRequest,
  StructureChangeRequestSchema,
} from './models/structure-change-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: Position.name, schema: PositionSchema },
      { name: PositionAssignment.name, schema: PositionAssignmentSchema },
      { name: StructureApproval.name, schema: StructureApprovalSchema },
      { name: StructureChangeLog.name, schema: StructureChangeLogSchema }
      
      ,{
        name: StructureChangeRequest.name,
        schema: StructureChangeRequestSchema,
      },
    ]),
  ],
  controllers: [OrganizationStructureController],
  providers: [OrganizationStructureService,
      HierarchyService, 
      StructureValidation,
  ],

exports: [
    OrganizationStructureService,
    HierarchyService, // optional but helpful
  ],
})
export class OrganizationStructureModule {}