import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'usuario@ejemplo.com',
    description: 'Email del usuario',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Password del usuario',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#\-.])[A-Za-z\d@$!%*?&_#\-.]+$/,
    {
      message:
        'La password deebe contener al menos una maypuscula, una minúscula, un número y un caracter especial (@$!%*?&_#-.)',
    },
  )
  password: string;

  @ApiPropertyOptional({
    example: 'Marcos Real',
    description: 'Nombre completo del usuario',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '+54 351 1234-5678',
    description: 'Número telefonico del usuario',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
