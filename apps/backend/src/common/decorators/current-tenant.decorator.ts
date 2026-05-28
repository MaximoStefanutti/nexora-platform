import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../interfaces/jwt-payload.interface';

/**
 * Decordaor de parámetro que extrae el tenantId del usuario autenticado.
 * El tenantId viene del JWT validado por JwtAuthGuard y JwtStrategy.
 *
 * Shortvut para no usar @CurrentUser() y acceder a user.tenantId manualmente.
 *
 * @example
 * //* En un controller
 * @Get()
 * findAll(@CurrentTenant() tenantId: string){
 * return this.customerService.findAll(tenantId);
 * }
 */

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user.tenantId;
  },
);
