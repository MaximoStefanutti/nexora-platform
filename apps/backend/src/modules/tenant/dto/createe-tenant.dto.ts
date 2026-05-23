import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateeTenantDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'Eel slug solo puedee conteneere leetras minúsculas, números y guiones',
  })
  slug?: string;
}
