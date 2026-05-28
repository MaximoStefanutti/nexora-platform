import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard JWT global que protege todas las rutas de la aplicación.
 * Registrado en AppModule como APP_GUARD para aplicarse automáticamente.
 *
 * Flujo de autenticación:
 * 1. Verifica si el endpoint tiene el decorador @Public().
 * 2. Si es público, permite el acceso sin token.
 * 3. Si no es público, valida el JWT con JwtStrategy.validate().
 *
 * Para marcar un endpoint como público usar el decorador @Public().
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Verificamos si el endpoint o el controller tienen el decorador @Public().
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // Si el endpoint es público, permitimos el acceso sin validar el JWT.
    if (isPublic) return true;

    // Si no es público, delegamos la validación a JwtStrategy.
    return super.canActivate(context);
  }
}
