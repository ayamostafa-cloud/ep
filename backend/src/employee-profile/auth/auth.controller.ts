import { Controller, Put ,Post, Get, Body, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { SystemRole } from '../enums/employee-profile.enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ADMIN_ROLES, HR_ROLES } from '../../common/constants/role-groups';
import { Roles } from '../../common/decorators/roles.decorator';
import { RegisterDto } from '../dto/register.dto';




@Controller('auth')
export class EmployeeProfileController {
  constructor(
    private readonly authService: AuthService,
    
  ) {}
  @Post('login')
  login(@Body() dto: { employeeNumber: string; password: string }) {
    return this.authService.login(dto);
  }
  
@Post('register')
register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}

async updateRoles(
  @Param('id') id: string,
  @Body('roles') roles: string[],
) {
  return this.authService.updateUserRoles(id, roles);
}


}