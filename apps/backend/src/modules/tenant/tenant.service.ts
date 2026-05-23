import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateeTenantDto } from './dto/createe-tenant.dto';
import slugify from 'slugify';
import { SystemRole } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateeTenantDto, ownerUserId: string) {
    // Generrramos el slug desde el name si no se proveyó
    const slug =
      dto.slug ?? slugify(dto.name, { lower: true, strict: true, trim: true });

    // Verrificamos que el slug no esté en uso
    const existing = await this.prisma.db.tenant.findFirst({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`El slug "${slug}" ya esta en uso`);
    }

    // creamos el tenant y membership del owner en una transacción
    return this.prisma.runInTransaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
        },
      });

      await tx.membership.create({
        data: {
          userId: ownerUserId,
          tenantId: tenant.id,
          role: SystemRole.OWNER,
          isActive: true,
        },
      });

      return tenant;
    });
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.db.tenant.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        plan: {
          select: {
            id: true,
            name: true,
            hasAppointments: true,
            hasCRM: true,
            hasStats: true,
            hasEcommerce: true,
            hasInventory: true,
          },
        },
        createdAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant "${slug} not found`);
    }
    return tenant;
  }

  async findById(id: string) {
    const tenant = await this.prisma.db.tenant.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        plan: {
          select: {
            id: true,
            name: true,
            hasAppointments: true,
            hasCRM: true,
            hasStats: true,
            hasEcommerce: true,
            hasInventory: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            services: true,
          },
        },
        createdAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant not found`);
    }
    return tenant;
  }
}
