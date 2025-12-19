
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { HierarchyService } from './hierarchy/hierarchy.service';
import { OrganizationStructureService } from './organization-structure.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { SetReportingLineDto } from './dto/set-reporting-line.dto';

  


@Controller('organization-structure')
export class OrganizationStructureController {
  constructor(
    private readonly orgService: OrganizationStructureService ,
    private readonly organizationStructureService: OrganizationStructureService,
    private readonly hierarchyService: HierarchyService,
  ) {}

  // 🔹 Full org hierarchy (all departments + trees of positions)
  @Get('hierarchy')
  getOrganizationHierarchy() {
    return this.hierarchyService.getOrgHierarchy();
  }

  // 🔹 Hierarchy for a single position (that position as a node + its children)
  @Get('positions/:id/hierarchy')
  getPositionHierarchy(@Param('id') id: string) {
    return this.hierarchyService.getPositionHierarchy(id);
  }
  // 🔥 TEMPORARY VALIDATION TEST ENDPOINT
  @Get('validation/test/:id')
  async testValidation(@Param('id') id: string) {
    try {
      const result = await this.hierarchyService['validation']?.validateObjectId(id); // just a quick test
      return { message: "VALID OBJECT ID", id };
    } catch (error) {
      return error;
    }
  }

    // CREATE DEPARTMENT
  @Post('departments')
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.orgService.createDepartment(dto);
  }

  // GET ALL
  @Get('departments')
  getAllDepartments() {
    return this.orgService.getAllDepartments();
  }

  // GET SINGLE
  @Get('departments/:id')
  getDepartment(@Param('id') id: string) {
    return this.orgService.getDepartmentById(id);
  }

  // UPDATE
  @Patch('departments/:id')
  updateDepartment(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.orgService.updateDepartment(id, dto);
  }

  // DEACTIVATE
  @Patch('departments/deactivate/:id')
  deactivateDepartment(@Param('id') id: string) {
    return this.orgService.deactivateDepartment(id);
  }
  @Patch('departments/activate/:id')
activateDepartment(@Param('id') id: string) {
  return this.orgService.activateDepartment(id);
}

  // -----------------------------------------
// POSITIONS
// -----------------------------------------

@Post('positions')
createPosition(@Body() dto: CreatePositionDto) {
  return this.orgService.createPosition(dto);
}

@Get('positions')
getPositions() {
  return this.orgService.getPositions();
}

@Get('positions/:id')
getPosition(@Param('id') id: string) {
  return this.orgService.getPositionById(id);
}

@Patch('positions/:id')
updatePosition(
  @Param('id') id: string,
  @Body() dto: UpdatePositionDto,
) {
  return this.orgService.updatePosition(id, dto);
}

@Patch('positions/:id/deactivate')
deactivatePosition(@Param('id') id: string) {
  return this.orgService.deactivatePosition(id);
}
@Patch('positions/activate/:id')
activatePosition(@Param('id') id: string) {
  return this.orgService.activatePosition(id);
}
// -------------------------------
// SET REPORTING LINE
@Patch('positions/:id/report-to')
setReportingLine(
  @Param('id') id: string,
  @Body('reportsToPositionId') reportsToPositionId: string,
) {
  return this.orgService.setReportingLine(id, reportsToPositionId);
}

// -------------------------------
// REMOVE REPORTING LINE
// -------------------------------
@Patch('positions/:id/remove-report-to')
removeReportingLine(@Param('id') id: string) {
  return this.orgService.removeReportingLine(id);
}
// GET MANAGER OF A POSITION
@Get('positions/:id/manager')
async getManager(@Param('id') id: string) {
  return this.orgService.getManagerOfPosition(id);
}
// GET ALL POSITIONS IN A DEPARTMENT
@Get('departments/:id/positions')
getPositionsInDepartment(@Param('id') id: string) {
  return this.orgService.getPositionsInDepartment(id);
}
// -----------------------------
// VALIDATION ENDPOINTS
// -----------------------------

// Validate Department
@Get('validate/department/:id')
validateDepartment(@Param('id') id: string) {
  return this.orgService.validateDepartment(id);
}

// Validate Position
@Get('validate/position/:id')
validatePosition(@Param('id') id: string) {
  return this.orgService.validatePosition(id);
}

// Validate Reporting Line (source → target)
@Get('validate/reporting-line')
validateReportingLine(
  @Query('source') sourceId: string,
  @Query('target') targetId: string,
) {
  return this.orgService.validateReportingLine(sourceId, targetId);
}

}
