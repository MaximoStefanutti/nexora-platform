import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  AuthUser,
  JwtPayload,
} from 'src/common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    // verificamos que el usuario y el membership todavía existan y esten activos
    const membership = await this.prisma.db.membership.findFirst({
      where: {
        id: payload.membershipId,
        userId: payload.sub,
        tenantId: payload.tenantId,
        isActive: true,
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Invalid sesion or expired');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
      membershipId: payload.membershipId,
    };
  }
}
