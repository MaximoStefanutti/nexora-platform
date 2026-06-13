import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

/**
 * DTO de registro de un nuevo negocio.
 * Crea en una sola operación: el negocio (tenant), el usuario y su
 * membresía como OWNER. El slug se genera desde businessName si no se provee.
 */
export class RegisterDto {
  @ApiProperty({
    example: 'Mi Peluquería',
    description: 'Nombre del negocio (tenant)',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  businessName: string;

  @ApiPropertyOptional({
    example: 'mi-peluqueria',
    description:
      'Slug único del negocio. Si no se provee se genera desde businessName',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  slug?: string;

  @ApiProperty({
    example: 'owner@minegocio.com',
    description: 'Email del usuario propietario',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Password: mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#\-.])[A-Za-z\d@$!%*?&_#\-.]+$/,
    {
      message:
        'La password debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&_#-.)',
    },
  )
  password: string;

  @ApiPropertyOptional({
    example: 'Marcos Real',
    description: 'Nombre completo del propietario',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '+54 351 1234-5678',
    description: 'Teléfono de contacto del propietario',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
