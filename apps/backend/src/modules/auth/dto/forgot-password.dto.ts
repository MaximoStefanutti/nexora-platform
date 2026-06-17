import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

/**
 * DTO para token de reseteo de clave.
 * Recibe un email para inicar el flujo de recuperación.
 */
export class ForgotPasswordDto {
  @ApiProperty({
    example: 'owner@demo-nexora.com',
    description: 'Email del usuario',
  })
  @IsEmail()
  email: string;
}
