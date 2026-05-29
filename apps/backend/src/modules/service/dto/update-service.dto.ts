import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateServiceDto {
  @ApiPropertyOptional({
    example: 'Corte premium',
    description: 'Nombre del servicio',
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({
    example: 'Descripción actualizada',
    description: 'Descripción de un servicio.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 45,
    description: 'Duración en minutos',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({
    example: 18.0,
    description: 'Precio del servicio',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Estado activo/inactivo',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
