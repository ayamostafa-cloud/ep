import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeProfile, EmployeeProfileSchema } from '../models/employee-profile.schema';
import { AuthService } from './auth.service';
import { EmployeeProfileController } from './auth.controller';
import { EmployeeSystemRole, EmployeeSystemRoleSchema } from '../models/employee-system-role.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CandidateModule } from '../../candidate/candidate.module';
@Module({
  imports: [
    AuthModule,
    // Register Employee schema for Auth login
    MongooseModule.forFeature([{ name: 'EmployeeProfile', schema: EmployeeProfileSchema },
        { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema }
    ]),
    CandidateModule, // ✅ THIS FIXES THE ERROR
    // Register JWT
    JwtModule.register({
  secret: process.env.JWT_SECRET || 'super-secret-key',
  signOptions: { expiresIn: '1d' },
})

  ],
  controllers: [EmployeeProfileController], // ✅ must be the real controller class
  providers: [AuthService,  RolesGuard],
  exports: [AuthService]

})
export class AuthModule {}