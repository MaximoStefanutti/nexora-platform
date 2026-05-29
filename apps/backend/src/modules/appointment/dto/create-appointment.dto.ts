import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    example: '2026-05-28T10:00:00.000Z',
    description: 'Fecha y hora de inicio del turno',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    example: 'uuid-del-cliente',
    description: 'ID del cliente',
  })
  @IsString()
  customerId: string;

  @ApiProperty({
    example: 'uuid-del-servicio',
    description: 'ID del servicio',
  })
  @IsString()
  serviceId: string;

  @ApiProperty({
    example: 'uuid-del-usuario-staff',
    description: 'ID del miembro del staff que atiende el turno',
  })
  @IsString()
  staffId: string; // Membership del staff asignado

  @ApiPropertyOptional({
    example: 'Primera visita',
    description: 'Notas adicionales del turno',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
