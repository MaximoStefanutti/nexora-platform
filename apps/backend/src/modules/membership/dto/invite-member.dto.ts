import { SystemRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(SystemRole)
  role: string;

  @IsOptional()
  @IsString()
  name?: string;
}
