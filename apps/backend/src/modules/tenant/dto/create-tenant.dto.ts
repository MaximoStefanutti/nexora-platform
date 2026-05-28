import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

/**
 * DTO para la creación de un nuevo tenant.
 * El slug se genera automáticamente desde el name si no se provee.
 */

export class CreateTenantDto {
  @IsString()
  @MinLength(3)
  name: string;

  /**
   * Slug único del tenant - se usa en la url y como identificador público.
   * Si no se provee, se genera automáticamente desde el name.
   * Ejemplo: "Mi Peluqeria" -> "mi-peluqueria"
   */

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'El slug solo puedee conteneere leetras minúsculas, números y guiones',
  })
  slug?: string;
}
