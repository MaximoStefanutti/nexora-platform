import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  /**
   * Cierre de sesión
   *
   * POST /auth/logout
   */

  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Invalida el refresh token para cerrar la sesión del usuario',
  })
  @ApiResponse({ status: 204, description: 'Logout exitoso' })
  @HttpCode(204)
  @Public()
  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }
  /**
   * Inica el flujo de reuperación de contraseña.
   * Si el email corresponde a un usuario, genera un reset token de un solo uso
   * y vida corta (1h) y lo envía por emial. En desarrollo, el token se escribe
   * en el log del servidor (no se expone nunca la respuesta HTTP)
   *
   * Respode SIEMPRE 204, exista o no el emial, para no filtrar que cuentas
   * están registradas (anti-enumeración)
   *
   * Rate limit estricto: cada llamada dispara el envío de un email.
   * POST /auth/forgot-password
   */

  @ApiOperation({
    summary: 'Solicitar recuperación de contraseña',
    description: 'Genera y envía un token de recuperación',
  })
  @ApiResponse({
    status: 204,
    description: 'Solicitud procesada (no confirma si el email existe)',
  })
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(204)
  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * Completa el flujo de recuperación de contraseña.
   * Valida el reset token (existen, no usado, expirado), actualiza la
   * contraseña del usuario y revoca TODAS sus sesiones activas (single-use)
   *
   * No inica sesión: el usuario debe volver a loguearse con la nueva contraseña.
   * POST /auth/reset-password
   */
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description:
      'Cambia la contraseña usando un reset token válido y cierra todas las ' +
      'sesiones activas del usuario. Requiere re-login posterior.',
  })
  @ApiResponse({
    status: 204,
    description: 'Contraseña actualizada correctamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, ya usado o expirado',
  })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(204)
  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
