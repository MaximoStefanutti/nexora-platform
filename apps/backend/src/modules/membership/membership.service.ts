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

@Injectable()
export class MembershipService {
  constructor(
    private prisma: PrismaService,
    private membershipHelper: MembershipHelper,
  ) {}

  // Listar miembros del tenant
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

  // Invitar un miembro al tenant
  //! Si el usuario no existe lo crea con una password temporal
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
      // Buscamos o creamos el usuario
      let user = await tx.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });
      if (!user) {
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
      // Verificamos que no tenga ya una membership activa en este tenant
      const exisitng = await tx.membership.findUnique({
        where: {
          userId_tenantId: {
            userId: user.id,
            tenantId,
          },
        },
      });

      if (exisitng?.isActive) {
        throw new ConflictException(
          `The user is already a member of this tenant`,
        );
      }

      // Si tiene membership inactiva la reactivamos
      if (exisitng && !exisitng.isActive) {
        return tx.membership.update({
          where: { id: exisitng.id },
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

  // Actualizr rol o estado de un miembro
  async update(
    membershipId: string,
    dto: UpdateMemberDto,
    tenantId: string,
    requestingUserId: string,
  ) {
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

    //! No se puede cambiar el rol de un OWNER salvo que seas OWNER
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

  // Remover miembro del tenant ()soft - desactiva la membership)
  async remove(
    membershipId: string,
    tenantId: string,
    requestingUserId: string,
  ) {
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
    if (membership.role === SystemRole.OWNER) {
      throw new ForbiddenException(
        'The owner cannot be removed from the tenant',
      );
    }
    return this.prisma.db.membership.update({
      where: { id: membershipId },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  }
}
