import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PunchDocument = Punch & Document;

@Schema({ timestamps: true })
export class Punch {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true, enum: ['in', 'out'] })
  type: 'in' | 'out';

  @Prop()
  device?: string;

  @Prop()
  location?: string;

  @Prop({ type: Object })
  rawMetadata?: Record<string, any>;
}

export const PunchSchema = SchemaFactory.createForClass(Punch);
