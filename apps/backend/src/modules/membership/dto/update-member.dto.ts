import { ApiPropertyOptional } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateMemberDto {
  @ApiPropertyOptional({
    enum: SystemRole,
    example: SystemRole.ADMIN,
    description: 'Nuevo rol del miembro',
  })
  @IsOptional()
  @IsEnum(SystemRole)
  role?: SystemRole;

  @ApiPropertyOptional({
    example: true,
    description: 'Estado activo/inacto del miembro',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
