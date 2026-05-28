import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Middleware de validación de tenant.
 * Se ajecuta en cada request protegido para verificar que el tenant
 * existe, está activo y el usuario tiene acceso a él.
 *
 * El tenantId se obtine en este orden de prioridad:
 * 1. Header x-tenant-id (explícito del cliente).
 * 2. req.user.tenantId (del JWT ya validado por JwtAuthGuard).
 */

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    // EObtenemos el tenantId del eader o del JWT ya procesado
    const tenantId =
      (req.headers['x-tenant-id'] as string) ?? req.user?.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant not identified');
    }

    // Verifcamos que el tenant existe y está activo
    const tenant = await this.prisma.db.tenant.findFirst({
      where: { id: tenantId, isActive: true },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant or inactive');
    }

    // Inyectamos el tenantId en la request para uso en cotrollers y services.
    req.tenantId = tenantId;

    next();
  }
}
