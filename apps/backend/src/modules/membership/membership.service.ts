import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { SystemRole } from '@prisma/client';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembershipHelper } from 'src/common/helpers/membership.helper';

/**
 * Servicio de gestión de membresías.
 * Una membreship representa la relación entre un usuario y un tenant,
 * incluyendo su rol (OWNER, ADMIN, STAFF) y estado activo/inactivo.
 *
 * Reglas de negociio:
 * - Solo OWNER y ADMIN pueden invitar, actualizar o remover miembros.
 * - Solo OWNER puede invitar otros OWNER o cambiar el rol de un OWNER.
 * - El OWNER no puede ser removido del tenant.
 * - Si un usuario ya tiene membership inactiva, se reactiva en vez de crear una nueva.
 * - Si el usuario no existe en el sistema, se crea con password temporal.
 */

@Injectable()
export class MembershipService {
  constructor(
    private prisma: PrismaService,
    private membershipHelper: MembershipHelper,
  ) {}

  /**
   * Lista todos los miembros del tenant con sus datos de usuario.
   * Incluye miembros activos e inactivos.
   *
   * @param tenantId - ID del tenant actual.
   */

  async findAll(tenantId: string) {
    return this.prisma.db.membership.findMany({
      where: { tenantId },
      select: {
        id: true,
        role: true,
        isActive: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Invita un usuario al tenant asignándole un rol.
   * Si el usuario no existe een el sistema lo crea con password temporal.
   * Si ya tiene una membeership inactiva, la reactiva con el nuevo rol.
   *
   * @param dto - Email, rol y nombre opcional del usuario a invitar.
   * @param tenantId - ID del tenant.
   * @param invitedByUserId - userID del usuario que realiza la invitación.
   * @throws ForbiddenException si el invitador no tiene permisos suficientes.
   */

  async invite(
    dto: InviteMemberDto,
    tenantId: string,
    invitedByUserId: string,
  ) {
    //! Solo OWNER y ADMIN pueden invitarr
    await this.membershipHelper.validateCanManageMembers(
      invitedByUserId,
      tenantId,
    );

    //! Solo OWNER puede invitar otros OWNERs
    if (dto.role === SystemRole.OWNER) {
      await this.membershipHelper.validateIsOwner(invitedByUserId, tenantId);
    }

    return this.prisma.runInTransaction(async (tx) => {
      // Buscamos el usuario por emial - si no existe lo creamos
      let user = await tx.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (!user) {
        /**
         * Creamos el usuario con password temporal.
         * TODO: En producción eviar email de bienvenida con link para setear password.
         */
        const tempPassword = await bcrypt.hash(`temp_${Date.now()}`, 12);
        user = await tx.user.create({
          data: {
            email: dto.email,
            password: tempPassword,
            name: dto.name,
          },
          select: { id: true },
        });
      }
      // Verificamos que no tenga ya una membership en el tenant (activa o inactiva).
      const existing = await tx.membership.findUnique({
        where: {
          userId_tenantId: {
            userId: user.id,
            tenantId,
          },
        },
      });

      if (existing?.isActive) {
        throw new ConflictException(
          `The user is already a member of this tenant`,
        );
      }

      // Si tiene meembership inactiva la reactivamos con el nuevo rol
      if (existing && !existing.isActive) {
        return tx.membership.update({
          where: { id: existing.id },
          data: { role: dto.role as SystemRole, isActive: true },
          select: {
            id: true,
            role: true,
            isActive: true,
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        });
      }

      // Si no tiene membership previa, la creamos.
      return tx.membership.create({
        data: {
          userId: user.id,
          tenantId,
          role: dto.role as SystemRole,
          isActive: true,
        },
        select: {
          id: true,
          role: true,
          isActive: true,
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      });
    });
  }

  /**
   * Actualiza el rol o estado activo de un miembro.
   * Solo OWNER puede modificar membresías de otros OWNERs
   *
   * @param membershipId - ID de la membership a actualizar.
   * @param dto - Nuevos valores de role y/o isActive.
   * @param tenantId - ID del tenant actual.
   * @param requestingUserId  - userId del usuario que solicita la actualización.
   * @throws NotFoundException si la membership no existe en el tenant.
   * @throws ForbiddenException si no tiene permisos suficientes.
   */
  async update(
    membershipId: string,
    dto: UpdateMemberDto,
    tenantId: string,
    requestingUserId: string,
  ) {
    //! Solo OWNER y ADMIN pueden actualizar membresías.
    await this.membershipHelper.validateCanManageMembers(
      requestingUserId,
      tenantId,
    );

    const membership = await this.prisma.db.membership.findFirst({
      where: { id: membershipId, tenantId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    //! Solo OWNER puede modificar el rol de otro OWNER.
    if (membership.role === SystemRole.OWNER) {
      await this.membershipHelper.validateIsOwner(requestingUserId, tenantId);
    }

    return this.prisma.db.membership.update({
      where: { id: membershipId },
      data: dto,
      select: {
        id: true,
        role: true,
        isActive: true,
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  /**
   * Remueve un miembro del tenant deesactivando su membership (soft remove)
   * El OWNER no puede ser removido - debe transferir la propiedad primero.
   *
   * @param membershipId - ID de la membersop a desactivar
   * @param tenantId - ID del tenant actual.
   * @param requestingUserId - userId del que solicita la remoción.
   * @throws NotFoundException si la membership no existe en el tenant.
   * @throws ForbiddenException si intenta romever el OWNER o no tiene permisos.
   */

  async remove(
    membershipId: string,
    tenantId: string,
    requestingUserId: string,
  ) {
    //! Solo OWNER y ADMIN pueden remover miembros.
    await this.membershipHelper.validateCanManageMembers(
      requestingUserId,
      tenantId,
    );

    const membership = await this.prisma.db.membership.findFirst({
      where: { id: membershipId, tenantId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    //!El OWNER no puede ser removido - protege la integridad del tenant.
    if (membership.role === SystemRole.OWNER) {
      throw new ForbiddenException(
        'The owner cannot be removed from the tenant',
      );
    }

    // Descativamos la membership en vez de eliminarla (soft remove)
    return this.prisma.db.membership.update({
      where: { id: membershipId },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  }
}
