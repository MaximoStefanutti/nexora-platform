import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return this.prisma.db.user.create({
      data: { ...data, password: hashedPassword },
    });
  }

  async findEmail(email: string) {
    return this.prisma.db.user.findUnique({
      where: { email },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.db.user.findMany({
      where: {
        memberships: { some: { tenantId } },
      },
      include: {
        memberships: {
          where: { tenantId },
        },
      },
    });
  }
}
