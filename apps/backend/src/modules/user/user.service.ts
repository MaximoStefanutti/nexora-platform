import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { MembershipHelper } from 'src/common/helpers/membership.helper';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private membershipHelper: MembershipHelper,
  ) {}

  async createUser(
    data: CreateUserDto,
    tenantId: string,
    requestingUserId: string,
  ) {
    await this.membershipHelper.validateCanManageMembers(
      requestingUserId,
      tenantId,
    );

    const hashedPassword = await bcrypt.hash(data.password, 12);
    return this.prisma.db.user.create({
      data: { ...data, password: hashedPassword },
    });
  }

  async findEmail(email: string) {
    return this.prisma.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.db.user.findMany({
      where: {
        memberships: { some: { tenantId } },
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        memberships: {
          where: { tenantId },
          select: {
            id: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }
}
