import { ForbiddenException, Injectable } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MembershipHelper {
  constructor(private prisma: PrismaService) {}

  async validateCanManageMembers(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const membership = await this.prisma.db.membership.findFirst({
      where: {
        userId,
        tenantId,
        isActive: true,
        role: { in: [SystemRole.OWNER, SystemRole.ADMIN] },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only OWNER or ADMIN can manage members');
    }
  }

  async validateIsOwner(userId: string, tenantId: string): Promise<void> {
    const membership = await this.prisma.db.membership.findFirst({
      where: {
        userId,
        tenantId,
        isActive: true,
        role: SystemRole.OWNER,
      },
    });
    if (!membership) {
      throw new ForbiddenException('Only the OWNER can perform this action');
    }
  }

  async getMembershipRole(
    userId: string,
    tenantId: string,
  ): Promise<SystemRole | null> {
    const membership = await this.prisma.db.membership.findFirst({
      where: { userId, tenantId, isActive: true },
      select: { role: true },
    });

    return membership?.role ?? null;
  }
}
