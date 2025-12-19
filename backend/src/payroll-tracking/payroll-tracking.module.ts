import { forwardRef, Module } from '@nestjs/common';
import { PayrollTrackingController } from './payroll-tracking.controller';
import { PayrollTrackingService } from './payroll-tracking.service';
import { MongooseModule } from '@nestjs/mongoose';
import { refunds, refundsSchema } from './models/refunds.schema';
import { claims, claimsSchema } from './models/claims.schema';
import { disputes, disputesSchema } from './models/disputes.schema';
import { PayrollConfigurationModule } from '../payroll-configuration/payroll-configuration.module';
import { PayrollExecutionModule } from '../payroll-execution/payroll-execution.module';
import { paySlip, paySlipSchema } from '../payroll-execution/models/payslip.schema';
import { payrollRuns, payrollRunsSchema } from '../payroll-execution/models/payrollRuns.schema';
import { employeePayrollDetails, employeePayrollDetailsSchema } from '../payroll-execution/models/employeePayrollDetails.schema';

@Module({
  
  imports: [
    PayrollConfigurationModule,forwardRef(()=> PayrollExecutionModule),
    MongooseModule.forFeature([
      { name: refunds.name, schema: refundsSchema },
      { name: claims.name, schema: claimsSchema },
      { name: disputes.name, schema: disputesSchema },
      { name: paySlip.name, schema: paySlipSchema },
      { name: payrollRuns.name, schema: payrollRunsSchema },
      { name: employeePayrollDetails.name, schema: employeePayrollDetailsSchema },
    ])],
  controllers: [PayrollTrackingController],
  providers: [PayrollTrackingService],
  exports:[PayrollTrackingService]
})
export class PayrollTrackingModule { }
