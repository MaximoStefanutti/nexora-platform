import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Registra un nuevo negocio junto con su usuario propietario (OWNER).
   * Deja la sesión iniciada devolviendo el par de tokens.
   *
   * Rate limit estricto para evitar abuso de creación de cuentas.
   * POST /auth/register
   */
  @ApiOperation({
    summary: 'Registrar negocio',
    description:
      'Crea un nuevo negocio (tenant) con su usuario OWNER y retorna access + refresh token',
  })
  @ApiResponse({
    status: 201,
    description: 'Registro exitoso',
    schema: {
      example: {
        accessToken: 'eyJhbGci...',
        refreshToken: 'eyJhbGci...',
        user: { id: 'uuid', email: 'owner@minegocio.com', name: 'Marcos Real' },
        tenant: { id: 'uuid', name: 'Mi Peluquería', slug: 'mi-peluqueria' },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email o slug ya en uso' })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Autentica un usuario y retorna el par de tokens.
   * El tenantSlug identifica el contexto del tenant al que accede el usuario.
   *
   * Rate limit estricto para mitigar fuerza bruta.
   * POST /auth/login
   */
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica un usuario en el contexto de un tenant y retorna access + refresh token',
  })
  @ApiResponse({
    status: 201,
    description: 'Login exitoso',
    schema: {
      example: { accessToken: 'eyJhbGci...', refreshToken: 'eyJhbGci...' },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password, dto.tenantSlug);
  }

  /**
   * Renueva la sesión a partir de un refresh token válido.
   * Retorna un nuevo par de tokens.
   *
   * POST /auth/refresh
   */
  @ApiOperation({
    summary: 'Renovar sesión',
    description:
      'Emite un nuevo access + refresh token a partir de un refresh token válido',
  })
  @ApiResponse({
    status: 201,
    description: 'Tokens renovados',
    schema: {
      example: { accessToken: 'eyJhbGci...', refreshToken: 'eyJhbGci...' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }
}
