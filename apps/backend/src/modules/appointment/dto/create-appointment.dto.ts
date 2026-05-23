import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsDateString()
  startTime: string;

  @IsString()
  customerId: string;

  @IsString()
  serviceId: string;

  @IsString()
  staffId: string; // Membership del staff asignado

  @IsOptional()
  @IsString()
  notes?: string;
}
