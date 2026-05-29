import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum StatsPeriod {
  TODAY = 'today',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  CUSTOM = 'custom',
}

export class StatsFilterDto {
  @ApiPropertyOptional({
    enum: StatsPeriod,
    example: StatsPeriod.LAST_30_DAYS,
    description:
      'Período predefinido. Si se usa "custom" se requiere from y to',
  })
  @IsOptional()
  @IsEnum(StatsPeriod)
  period?: StatsPeriod;

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Fecha de inicio (solo para period=custom)',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-05-31',
    description: 'Fecha de fin (solo para period=custom)',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
