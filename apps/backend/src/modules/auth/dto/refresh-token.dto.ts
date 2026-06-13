import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString } from 'class-validator';

/**
 * DTO para renovar la sesión.
 * Recibe el refresh token emitido en login/register.
 */
export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token válido obtenido en login o register',
  })
  @IsString()
  @IsJWT()
  refreshToken: string;
}
