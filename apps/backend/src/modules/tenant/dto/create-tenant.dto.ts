import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

/**
 * DTO para la creación de un nuevo tenant.
 * El slug se genera automáticamente desde el name si no se provee.
 */

export class CreateTenantDto {
  @ApiProperty({
    example: 'Mi peluqería',
    description: 'Nombre del tenant',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name: string;

  /**
   * Slug único del tenant - se usa en la url y como identificador público.
   * Si no se provee, se genera automáticamente desde el name.
   * Ejemplo: "Mi Peluqeria" -> "mi-peluqueria"
   */

  @ApiPropertyOptional({
    example: 'mi-peluqeria',
    description:
      'Slug único del tenant. Si no se provee se genera automáticamente desde el name',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'El slug solo puedee contener letras minúsculas, números y guiones',
  })
  slug?: string;
}
