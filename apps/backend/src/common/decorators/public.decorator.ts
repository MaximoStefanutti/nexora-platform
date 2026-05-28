import { SetMetadata } from '@nestjs/common';

/**
 * Clave de metadata usado por JwtAuthGuard para identificar rutas públicas.
 */

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador que marca un endpoint como público, excluyéndolo de la
 * validación de JWT del guard global JwtAuthGuard.
 *
 * Usar en endponts que no requieren autenticación:
 * - POST /auth/login
 * - GET /tenant/slug/:slug
 * - GET /health
 *
 * @example
 * @Public()
 * @Post('login')
 * login(@Body() dto: LoginDto) { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
