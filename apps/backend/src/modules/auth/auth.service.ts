import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string, tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) throw new UnauthorizedException('Invalid credentials');

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        memberships: {
          some: {
            tenantId: tenant.id,
          },
        },
      },
      include: {
        memberships: {
          where: {
            tenantId: tenant.id,
          },
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException();

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: user.memberships[0].role.name,
      membershipId: user.memberships[0].id,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
    };
  }
}
