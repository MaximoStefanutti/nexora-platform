import { ForbiddenException, Injectable } from '@nestjs/common';
import { SystemRole, MembershipStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Helper de validaciones de membresía.
 * Centraliz las validaciones d permisos basadas en roles
 * para ser reutilizadas en múltiples módulos.
 *
 * Al ser un provider Global (registrado en CommonModule),
 * está disponible en toda la app sin necesidad de importarlo.
 */

@Injectable()
export class MembershipHelper {
  constructor(private prisma: PrismaService) {}

  /**
   * Valida que el usuario tiene rol OWNER o ADMIN en el tenant.
   * Usar antes de operaciones de gestión (crear, modificar, eliminar miembros,
   * servicios, etc.).
   *
   * @param userId - ID del usuario a validar.
   * @param tenantId - ID del tenant.
   * @throws ForbiddeenException si el usuario no es OWNER o ADMIN.
   */

  async validateCanManageMembers(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const membership = await this.prisma.db.membership.findFirst({
      where: {
        userId,
        tenantId,
        status: MembershipStatus.ACTIVE,
        role: { in: [SystemRole.OWNER, SystemRole.ADMIN] },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only OWNER or ADMIN can manage members');
    }
  }

  /**
   * Valida que el usuario tiene rol OWNER en el tenant.
   * Usar antes de operaciones excclusivas del owner (trasnferir propiedad,
   * invitar otros owners, etc.)
   *
   * @param userId - ID del usuario a validar.
   * @param tenantId - ID del tenant
   * @throws ForbiddenException si el usuario no es OWNER.
   */

  async validateIsOwner(userId: string, tenantId: string): Promise<void> {
    const membership = await this.prisma.db.membership.findFirst({
      where: {
        userId,
        tenantId,
        status: MembershipStatus.ACTIVE,
        role: SystemRole.OWNER,
      },
    });
    if (!membership) {
      throw new ForbiddenException('Only the OWNER can perform this action');
    }
  }

  /**
   * Obtiene el rol activo del usuario en el tenant.
   * Retorna null si el usuario no tiene membresía activa.
   * Usado para validaciones condicionales basadas en rol.
   *
   * @param userId - ID del usuario.
   * @param tenantId - ID del tenant.
   * @returns SystemRole del usuario o null si no tiene mebresía acvtiva.
   */

  async getMembershipRole(
    userId: string,
    tenantId: string,
  ): Promise<SystemRole | null> {
    const membership = await this.prisma.db.membership.findFirst({
      where: { userId, tenantId, status: MembershipStatus.ACTIVE },
      select: { role: true },
    });

    return membership?.role ?? null;
  }
}
