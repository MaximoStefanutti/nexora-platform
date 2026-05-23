import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    // El tenantId puede venir del header o del JWT (ya procesado por el guard)
    const tenantId =
      (req.headers['x-tenant-id'] as string) ?? req.user?.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant not identified');
    }

    // Verifcamos que el tenant existe y está activo
    const tenant = await this.prisma.db.tenant.findUnique({
      where: { id: tenantId, isActive: true },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant or inactive');
    }

    req.tenantId = tenantId; // Guardamos el tenantId en la request para usarlo en los servicios

    next();
  }
}
