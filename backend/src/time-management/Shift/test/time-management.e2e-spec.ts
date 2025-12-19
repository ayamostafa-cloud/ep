import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import request from 'supertest';
import { TimeManagementModule } from '../../time-management.module';

describe('Time Management Phase 1 (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TimeManagementModule,
        // Use in-memory MongoDB for testing or configure test database
        MongooseModule.forRoot(
          process.env.MONGODB_URI ||
            'mongodb://localhost:27017/timemanagement-test',
        ),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Shift Template CRUD', () => {
    let shiftTemplateId: string;

    it('POST /time-management/shifts - should create shift template', () => {
      return request(app.getHttpServer())
        .post('/time-management/shifts')
        .set('x-user-role', 'HR Manager') // Simulate role for Phase 1
        .send({
          name: 'Test Normal Shift',
          type: 'normal',
          startTime: '09:00',
          endTime: '17:00',
          restDays: ['Saturday', 'Sunday'],
          gracePeriod: 15,
          isOvernight: false,
          status: 'Active',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe('Test Normal Shift');
          expect(res.body.type).toBe('normal');
          shiftTemplateId = res.body._id;
        });
    });

    it('GET /time-management/shifts - should get all shift templates', () => {
      return request(app.getHttpServer())
        .get('/time-management/shifts')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /time-management/shifts/:id - should get shift template by ID', () => {
      return request(app.getHttpServer())
        .get(`/time-management/shifts/${shiftTemplateId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(shiftTemplateId);
        });
    });

    it('PATCH /time-management/shifts/:id - should update shift template', () => {
      return request(app.getHttpServer())
        .patch(`/time-management/shifts/${shiftTemplateId}`)
        .set('x-user-role', 'HR Manager')
        .send({
          name: 'Updated Test Shift',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Test Shift');
        });
    });

    it('DELETE /time-management/shifts/:id - should delete shift template', () => {
      return request(app.getHttpServer())
        .delete(`/time-management/shifts/${shiftTemplateId}`)
        .set('x-user-role', 'HR Manager')
        .expect(204);
    });
  });

  describe('Schedule Assignment', () => {
    let shiftTemplateId: string;
    let employeeId: string;
    let assignmentId: string;

    beforeAll(async () => {
      // Create a shift template for testing
      const shiftResponse = await request(app.getHttpServer())
        .post('/time-management/shifts')
        .set('x-user-role', 'HR Manager')
        .send({
          name: 'Test Assignment Shift',
          type: 'normal',
          startTime: '09:00',
          endTime: '17:00',
          restDays: ['Saturday', 'Sunday'],
          gracePeriod: 15,
          isOvernight: false,
          status: 'Active',
        });
      shiftTemplateId = shiftResponse.body._id;

      // Get an employee ID (assuming seed data exists)
      const employeesResponse = await request(app.getHttpServer())
        .get('/time-management/employees')
        .expect(200);
      if (employeesResponse.body.length > 0) {
        employeeId = employeesResponse.body[0]._id;
      }
    });

    it('POST /time-management/shifts/assign - should create assignment', async () => {
      if (!employeeId) {
        console.log('Skipping assignment test - no employees found');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/time-management/shifts/assign')
        .set('x-user-role', 'HR Manager')
        .send({
          shiftTemplateId,
          employeeId,
          effectiveFrom: '2025-01-01',
          effectiveTo: '2025-12-31',
          assignedBy: employeeId, // Using same employee for simplicity
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.shiftTemplateId).toBe(shiftTemplateId);
      assignmentId = response.body._id;
    });

    it('GET /time-management/scheduling/assignments - should query assignments', () => {
      return request(app.getHttpServer())
        .get('/time-management/scheduling/assignments')
        .query({ employeeId })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('POST /time-management/shifts/assign/bulk - should bulk assign', async () => {
      if (!employeeId) {
        console.log('Skipping bulk assignment test - no employees found');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/time-management/shifts/assign/bulk')
        .set('x-user-role', 'HR Manager')
        .send({
          shiftTemplateId,
          employeeIds: [employeeId],
          effectiveFrom: '2025-06-01',
          effectiveTo: '2025-06-30',
          assignedBy: employeeId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('failed');
    });
  });

  describe('Shift Expiry Notifications', () => {
    it('GET /time-management/notifications/shifts - should get expiry notifications', () => {
      return request(app.getHttpServer())
        .get('/time-management/notifications/shifts')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /time-management/notifications/shifts?status=pending - should filter by status', () => {
      return request(app.getHttpServer())
        .get('/time-management/notifications/shifts')
        .query({ status: 'pending' })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Conflict Detection', () => {
    let shiftTemplateId: string;
    let employeeId: string;

    beforeAll(async () => {
      // Create shift template
      const shiftResponse = await request(app.getHttpServer())
        .post('/time-management/shifts')
        .set('x-user-role', 'HR Manager')
        .send({
          name: 'Conflict Test Shift',
          type: 'normal',
          startTime: '09:00',
          endTime: '17:00',
          status: 'Active',
        });
      shiftTemplateId = shiftResponse.body._id;

      // Get employee
      const employeesResponse = await request(app.getHttpServer())
        .get('/time-management/employees')
        .expect(200);
      if (employeesResponse.body.length > 0) {
        employeeId = employeesResponse.body[0]._id;
      }
    });

    it('should detect conflicts when assigning overlapping shifts', async () => {
      if (!employeeId) {
        console.log('Skipping conflict test - no employees found');
        return;
      }

      // Create first assignment
      await request(app.getHttpServer())
        .post('/time-management/shifts/assign')
        .set('x-user-role', 'HR Manager')
        .send({
          shiftTemplateId,
          employeeId,
          effectiveFrom: '2025-07-01',
          effectiveTo: '2025-07-31',
          assignedBy: employeeId,
        })
        .expect(201);

      // Try to create conflicting assignment
      await request(app.getHttpServer())
        .post('/time-management/shifts/assign')
        .set('x-user-role', 'HR Manager')
        .send({
          shiftTemplateId,
          employeeId,
          effectiveFrom: '2025-07-15', // Overlaps with first assignment
          effectiveTo: '2025-08-15',
          assignedBy: employeeId,
        })
        .expect(409); // Conflict status
    });
  });
});
