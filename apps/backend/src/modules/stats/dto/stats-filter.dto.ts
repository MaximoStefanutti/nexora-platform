import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum StatsPeriod {
  TODAY = 'today',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  CUSTOM = 'custom',
}

export class StatsFilterDto {
  @IsOptional()
  @IsEnum(StatsPeriod)
  period?: StatsPeriod;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
