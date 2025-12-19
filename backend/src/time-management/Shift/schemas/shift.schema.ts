import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShiftTemplateDocument = ShiftTemplate & Document;

@Schema({ timestamps: true })
export class ShiftTemplate {
  @Prop({ required: true })
  name: string; // Normal, Split, Overnight, etc.

  @Prop({
    required: true,
    enum: [
      'normal',
      'split',
      'overnight',
      'rotational',
      'flexible',
      'compressed',
    ],
  })
  type: string; // Shift type: normal, split, overnight, rotational, flexible, compressed

  @Prop({ required: false })
  startTime: string; // e.g., "09:00" (required for non-flexible shifts)

  @Prop({ required: false })
  endTime: string; // e.g., "17:00" (required for non-flexible shifts)

  @Prop({ type: [String], default: [] })
  restDays: string[]; // e.g., ["Saturday", "Sunday"] - days when shift doesn't apply

  @Prop({ default: 0 })
  gracePeriod: number; // Minutes allowed for late arrival (e.g., 15 minutes)

  @Prop({ default: false })
  isOvernight: boolean; // Does shift cross midnight (e.g., 22:00 to 06:00)

  @Prop({ type: String, default: null })
  rotationalPattern: string | null; // e.g., "4-on/3-off", "6-on/2-off" - pattern for rotational shifts (null for non-rotational)

  @Prop({ type: Date, default: null })
  expirationDate: Date | null; // When this shift template expires (null = never expires)

  @Prop({
    default: 'Active',
    enum: ['Active', 'Inactive', 'Expired', 'Cancelled'],
  })
  status: string; // Template status

  @Prop()
  description: string; // Optional description of the shift

  // Flexible hours support (for type: 'flexible')
  @Prop()
  flexibleStartWindow: string; // e.g., "06:00" - earliest time employee can start
  @Prop()
  flexibleEndWindow: string; // e.g., "20:00" - latest time employee can end
  @Prop()
  requiredHours: number; // e.g., 8 - number of hours employee must work within the window

  // Compressed workweek support (for type: 'compressed')
  @Prop()
  workDaysPerWeek: number; // e.g., 4 - number of working days per week
  @Prop()
  hoursPerDay: number; // e.g., 10 - number of hours per working day
}

export const ShiftTemplateSchema = SchemaFactory.createForClass(ShiftTemplate);
