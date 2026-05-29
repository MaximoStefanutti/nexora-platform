import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Corte de cabello',
    description: 'Nombre del servicio',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({
    example: 'Corte clásico para caballeros',
    description: 'Descripción del servicio',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '30',
    description: 'Duración del servicio en minutos',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({
    example: '15.00',
    description: '¨Precio del servicio',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Si el servicio está activo para ser agendado',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
