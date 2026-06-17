import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

/**
 * DTO para renovar la sesión.
 * Recibe el refresh token emitido en login/register.
 */
export class RefreshTokenDto {
  @ApiProperty({
    example: '550557dd3aad1db0f07cb99325fac6ee32fd...',
    description: 'Refresh token válido obtenido en login o register',
  })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, {
    message: 'El refresh token debe ser un string hexadecimal de 64 caracteres',
  })
  refreshToken: string;
}
