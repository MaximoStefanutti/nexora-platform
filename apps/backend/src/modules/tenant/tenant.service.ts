import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import slugify from 'slugify';
import { MembershipStatus, SystemRole } from '@prisma/client';

/**
 * Servicio de gestión de tenants.
 * Un tenant representa una organización o negocio dentro de la plataforma SaaS.
 *
 * Cada tenant tiene:
 * - Un slug único para identificación pública.
 * - Un plan que define los módilos habilitados y límites.
 * - Un owner que se asigna automáticamente al crear el tenant.
 */

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo tenant y asigna automáticameente al creador como OWNER.
   * Ambas operaciones se ejecutan en una transacción atómica.
   *
   * @param dto - Datos del tenant (name y slug opcional)
   * @param ownerUserId  - userId del usuario que crea el tenant, se convierte en OWNER
   * @throws ConfilcException si el slug ya está en uso.
   */

  async create(dto: CreateTenantDto, ownerUserId: string) {
    // Generrramos el slug desde el name si no se proveyó
    const slug =
      dto.slug ?? slugify(dto.name, { lower: true, strict: true, trim: true });

    // Verificamos que el slug no esté en uso
    const existing = await this.prisma.db.tenant.findFirst({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`The slug "${slug}" is already in use`);
    }

    /**
     * Creamos el tenant y la membership del owner een una sola transacción.
     * Si alguna de las dos falla, ambas se revierte.
     */

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

      // El creador del tenant siempre es OWNER
      await tx.membership.create({
        data: {
          userId: ownerUserId,
          tenantId: tenant.id,
          role: SystemRole.OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      return tenant;
    });
  }

  /**
   * Busca un tenant por su slug público.
   * Usado por el frontend para validar slugs y mostrar info del tenant en el login.
   *
   * @param slug - Slug único del tenant
   * @throws NotFoundException si el tenant no existe o está inactivo.
   */

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
      throw new NotFoundException(`Tenant "${slug} not found`);
    }
    return tenant;
  }

  /**
   * Busca un tenant por su ID interno.
   * Incluye contadores de memberships y servicios para el dashboard.
   *
   * @param id - UUID del tenant.
   * @throws NotFoundException si l tenant no existe o está inactivo.
   */

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
        // Contadorees calculados en el timpo de query - sin riesgo d incosistencia.
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
