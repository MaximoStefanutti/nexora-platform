import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Autentica un usuario y retorna un JWT.
   * El tenantSlug identifica el contexto del tenant al que accede el usuario.
   *
   * POST /auth/login
   * @returns { accessToken: string }
   */
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica un usuario en el contexto de un tenant y retorna un JWT',
  })
  @ApiResponse({
    status: 201,
    description: 'Login exitoso',
    schema: { example: { accessToken: 'eyJhbGci...' } },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password, dto.tenantSlug);
  }
}
