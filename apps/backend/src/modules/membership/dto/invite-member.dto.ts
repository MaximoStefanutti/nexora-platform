import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({
    example: 'staff@ejemplo.com',
    description: ' Email del usuario a invitar',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: SystemRole,
    example: SystemRole.STAFF,
    description: 'Rol a asignar al miembro invitado.',
  })
  @IsEnum(SystemRole)
  role: string;

  @ApiPropertyOptional({
    example: 'Juan Pérez',
    description: 'Nombre del usuario (si no existe en el sistema)',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
