import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: '550557dd3aad1db0f07cb99325fac6ee32fd...',
    description: 'Token obtendio de la solicitud de resetear password',
  })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, {
    message: 'El token debe ser un string hexadecimal de 64 caracteres',
  })
  token: string;

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
  newPassword: string;
}
