export class ShiftTemplateResponseDto {
  _id: string;
  name: string;
  type: string;
  startTime?: string;
  endTime?: string;
  restDays: string[];
  gracePeriod: number;
  isOvernight: boolean;
  rotationalPattern: string | null;
  expirationDate: Date | null;
  status: string;
  description?: string;
  // Flexible hours fields
  flexibleStartWindow?: string;
  flexibleEndWindow?: string;
  requiredHours?: number;
  // Compressed workweek fields
  workDaysPerWeek?: number;
  hoursPerDay?: number;
  createdAt: Date;
  updatedAt: Date;
}
