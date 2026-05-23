import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string, tenantSlug: string) {
    const tenant = await this.prisma.db.tenant.findFirst({
      where: { slug: tenantSlug },
    });
    if (!tenant) throw new UnauthorizedException('Invalid credentials');

    const user = await this.prisma.db.user.findFirst({
      where: {
        email,
        memberships: { some: { tenantId: tenant.id } },
      },
      include: {
        memberships: {
          where: { tenantId: tenant.id },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const membership = user.memberships[0]; // El usuario solo puede tener una membresía por tenant

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: tenant.id, // SystemRole: OWNEER | ADMIN | STAFF
      membershipId: membership.id,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
