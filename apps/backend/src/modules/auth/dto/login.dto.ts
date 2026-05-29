import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'owner@demo-nexora.com',
    description: 'Email del usuari',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password del usuario' })
  @IsString()
  password: string;

  @ApiProperty({
    example: 'demo-nexora',
    description: 'Slug del tenant al que accede el usuario',
  })
  @IsString()
  tenantSlug: string;
}
