import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../interfaces/jwt-payload.interface';

/**
 * Decorador de parámetro que extrae el usuario autenticado del request.
 * El usuario es inyectado por JwtAuthGuard vía JtwStrategy.validate()
 *
 * @example
 * //* En un controller
 * @Get('me')
 * getMe(@CurrentUser() user: AuthUser) {
 * return this.userService.findEmail(user.emial);
 * }
 */

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
