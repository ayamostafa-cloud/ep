import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ShiftTemplate, ShiftTemplateDocument } from '../schemas/shift.schema';
import {
  ScheduleAssignment,
  ScheduleAssignmentDocument,
} from '../schemas/schedule-assignment.schema';
import { CreateShiftTemplateDto } from '../dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from '../dto/update-shift-template.dto';

@Injectable()
export class ShiftTemplateService {
  constructor(
    @InjectModel(ShiftTemplate.name)
    private shiftTemplateModel: Model<ShiftTemplateDocument>,
    @InjectModel(ScheduleAssignment.name)
    private scheduleAssignmentModel: Model<ScheduleAssignmentDocument>,
  ) {}

  /**
   * Validate shift template data based on type
   */
  private validateShiftTemplate(
    dto: CreateShiftTemplateDto | UpdateShiftTemplateDto,
  ): void {
    const type = dto.type;

    if (!type) {
      return; // Type might not be provided in update, skip validation
    }

    // Validate flexible hours shift
    if (type === 'flexible') {
      if ('flexibleStartWindow' in dto && !dto.flexibleStartWindow) {
        throw new BadRequestException(
          'flexibleStartWindow is required for flexible shift type',
        );
      }
      if ('flexibleEndWindow' in dto && !dto.flexibleEndWindow) {
        throw new BadRequestException(
          'flexibleEndWindow is required for flexible shift type',
        );
      }
      if (
        'requiredHours' in dto &&
        (!dto.requiredHours || dto.requiredHours < 1 || dto.requiredHours > 24)
      ) {
        throw new BadRequestException(
          'requiredHours must be between 1 and 24 for flexible shift type',
        );
      }

      // Validate time window format and logic
      if (dto.flexibleStartWindow && dto.flexibleEndWindow) {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (
          !timeRegex.test(dto.flexibleStartWindow) ||
          !timeRegex.test(dto.flexibleEndWindow)
        ) {
          throw new BadRequestException(
            'Time format must be HH:mm (24-hour format)',
          );
        }

        const [startHour, startMin] = dto.flexibleStartWindow
          .split(':')
          .map(Number);
        const [endHour, endMin] = dto.flexibleEndWindow.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (startMinutes >= endMinutes) {
          throw new BadRequestException(
            'flexibleStartWindow must be before flexibleEndWindow',
          );
        }

        const windowHours = (endMinutes - startMinutes) / 60;
        if (dto.requiredHours && dto.requiredHours > windowHours) {
          throw new BadRequestException(
            'requiredHours cannot exceed the time window between flexibleStartWindow and flexibleEndWindow',
          );
        }
      }
    }

    // Validate compressed workweek shift
    if (type === 'compressed') {
      if (
        'workDaysPerWeek' in dto &&
        (!dto.workDaysPerWeek ||
          dto.workDaysPerWeek < 1 ||
          dto.workDaysPerWeek > 7)
      ) {
        throw new BadRequestException(
          'workDaysPerWeek must be between 1 and 7 for compressed shift type',
        );
      }
      if (
        'hoursPerDay' in dto &&
        (!dto.hoursPerDay || dto.hoursPerDay < 1 || dto.hoursPerDay > 24)
      ) {
        throw new BadRequestException(
          'hoursPerDay must be between 1 and 24 for compressed shift type',
        );
      }

      // Validate total weekly hours (should be reasonable, e.g., 35-50 hours)
      if (dto.workDaysPerWeek && dto.hoursPerDay) {
        const totalWeeklyHours = dto.workDaysPerWeek * dto.hoursPerDay;
        if (totalWeeklyHours < 20 || totalWeeklyHours > 60) {
          throw new BadRequestException(
            `Total weekly hours (${totalWeeklyHours}) should be between 20 and 60 for compressed workweek`,
          );
        }
      }
    }

    // Validate standard shift types (normal, split, overnight, rotational)
    if (['normal', 'split', 'overnight', 'rotational'].includes(type)) {
      if ('startTime' in dto && !dto.startTime) {
        throw new BadRequestException(
          `startTime is required for ${type} shift type`,
        );
      }
      if ('endTime' in dto && !dto.endTime) {
        throw new BadRequestException(
          `endTime is required for ${type} shift type`,
        );
      }

      // Validate time format
      if (dto.startTime && dto.endTime) {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(dto.startTime) || !timeRegex.test(dto.endTime)) {
          throw new BadRequestException(
            'Time format must be HH:mm (24-hour format)',
          );
        }
      }
    }
  }

  /**
   * Create a new shift template
   */
  async create(
    createDto: CreateShiftTemplateDto,
  ): Promise<ShiftTemplateDocument> {
    this.validateShiftTemplate(createDto);
    const shiftTemplate = new this.shiftTemplateModel(createDto);
    return shiftTemplate.save();
  }

  /**
   * Get all shift templates
   */
  async findAll(): Promise<ShiftTemplateDocument[]> {
    return this.shiftTemplateModel.find().exec();
  }

  /**
   * Get shift template by ID
   */
  async findById(id: string): Promise<ShiftTemplateDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid shift template ID');
    }
    const shiftTemplate = await this.shiftTemplateModel.findById(id).exec();
    if (!shiftTemplate) {
      throw new NotFoundException(`Shift template with ID ${id} not found`);
    }
    return shiftTemplate;
  }

  /**
   * Update shift template
   */
  async update(
    id: string,
    updateDto: UpdateShiftTemplateDto,
  ): Promise<ShiftTemplateDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid shift template ID');
    }

    // If type is being updated, we need to validate the new type requirements
    // Otherwise, get existing template to validate against current type
    let currentType = updateDto.type;
    if (!currentType) {
      const existing = await this.shiftTemplateModel.findById(id).exec();
      if (existing) {
        currentType = existing.type;
        // Merge existing data with update for validation
        const mergedDto = { ...existing.toObject(), ...updateDto };
        this.validateShiftTemplate(mergedDto as any);
      }
    } else {
      this.validateShiftTemplate(updateDto);
    }

    const shiftTemplate = await this.shiftTemplateModel
      .findByIdAndUpdate(
        id,
        { $set: updateDto },
        { new: true, runValidators: true },
      )
      .exec();
    if (!shiftTemplate) {
      throw new NotFoundException(`Shift template with ID ${id} not found`);
    }
    return shiftTemplate;
  }

  /**
   * Delete shift template
   */
  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid shift template ID');
    }
    // Check if template is used in any assignments
    const assignments = await this.scheduleAssignmentModel
      .countDocuments({
        shiftTemplateId: new Types.ObjectId(id),
        status: 'Active',
      })
      .exec();
    if (assignments > 0) {
      throw new ConflictException(
        `Cannot delete shift template: ${assignments} active assignments exist`,
      );
    }
    const result = await this.shiftTemplateModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Shift template with ID ${id} not found`);
    }
  }
}
