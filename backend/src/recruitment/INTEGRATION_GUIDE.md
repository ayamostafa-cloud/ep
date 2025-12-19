# Cross-Subsystem Integration Guide

This guide explains how to integrate the Recruitment module with other subsystems when they become available.

## Current Architecture

The Recruitment module is designed to work **standalone** with stub implementations for cross-subsystem dependencies. When other subsystems are integrated, you can easily swap in the real implementations.

## Integration Points

### 1. Onboarding Subsystem (REC-029)

**When:** An offer is accepted by a candidate

**Current Implementation:**
- Stub service: `StubOnboardingService` in `services/stub-services.ts`
- Interface: `IOnboardingService` in `shared/interfaces/onboarding.interface.ts`

**Integration Steps:**
1. Import the `OnboardingModule` in `RecruitmentModule`:
   ```typescript
   @Module({
     imports: [
       MongooseModule.forFeature([...]),
       OnboardingModule, // Add this
     ],
     providers: [
       RecruitmentService,
       // Remove the stub provider for 'IOnboardingService'
     ],
   })
   ```

2. Ensure `OnboardingModule` exports a service that implements `IOnboardingService` with the token `'IOnboardingService'`

3. The `RecruitmentService` will automatically use the real implementation via dependency injection

### 2. Employee Profile Subsystem

**When:** An offer is accepted, create an employee profile from candidate data

**Current Implementation:**
- Stub service: `StubEmployeeProfileService` in `services/stub-services.ts`
- Interface: `IEmployeeProfileService` in `shared/interfaces/employee-profile.interface.ts`

**Integration Steps:**
1. Import the `EmployeeProfileModule` in `RecruitmentModule`:
   ```typescript
   @Module({
     imports: [
       MongooseModule.forFeature([...]),
       EmployeeProfileModule, // Add this
     ],
     providers: [
       RecruitmentService,
       // Remove the stub provider for 'IEmployeeProfileService'
     ],
   })
   ```

2. Ensure `EmployeeProfileModule` exports a service that implements `IEmployeeProfileService` with the token `'IEmployeeProfileService'`

### 3. Organization Structure Subsystem

**When:** Validating departments/positions during requisition creation and onboarding

**Current Implementation:**
- Stub service: `StubOrganizationStructureService` in `services/stub-services.ts`
- Interface: `IOrganizationStructureService` in `shared/interfaces/organization-structure.interface.ts`

**Integration Steps:**
1. Import the `OrganizationStructureModule` in `RecruitmentModule`:
   ```typescript
   @Module({
     imports: [
       MongooseModule.forFeature([...]),
       OrganizationStructureModule, // Add this
     ],
     providers: [
       RecruitmentService,
       // Remove the stub provider for 'IOrganizationStructureService'
     ],
   })
   ```

2. Ensure `OrganizationStructureModule` exports a service that implements `IOrganizationStructureService` with the token `'IOrganizationStructureService'`

## Complete Integration Example

When all subsystems are ready, your `RecruitmentModule` should look like this:

```typescript
import { Module } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { MongooseModule } from '@nestjs/mongoose';
// ... other imports ...

// Import real modules
import { OnboardingModule } from '../onboarding/onboarding.module';
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      // ... all schemas ...
    ]),
    // Real subsystem modules
    OnboardingModule,
    EmployeeProfileModule,
    OrganizationStructureModule,
  ],
  controllers: [RecruitmentController],
  providers: [
    RecruitmentService,
    // No stub services needed - real ones come from imported modules
  ],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
```

## App Module Integration

When integrating all subsystems, update `app.module.ts`:

```typescript
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/hr-system'),
    RecruitmentModule,
    OnboardingModule,        // Add when ready
    EmployeeProfileModule,   // Add when ready
    OrganizationStructureModule, // Add when ready
    TimeManagementModule,    // Add when ready
    LeavesModule,           // Add when ready
    PayrollTrackingModule,  // Add when ready
    PerformanceModule,      // Add when ready
    PayrollConfigurationModule, // Add when ready
    PayrollExecutionModule, // Add when ready
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## Testing Integration

1. **Standalone Testing:** The module works with stub services - all tests pass
2. **Integration Testing:** When real modules are added, integration tests should verify:
   - Onboarding is triggered when offer accepted
   - Employee profile is created from candidate
   - Department validation works

## Notes

- All cross-subsystem dependencies are **optional** using `@Optional()` decorator
- The service gracefully handles missing services (logs warnings)
- Stub services log `[STUB]` messages to indicate they're not real implementations
- No breaking changes when swapping stub → real implementations

