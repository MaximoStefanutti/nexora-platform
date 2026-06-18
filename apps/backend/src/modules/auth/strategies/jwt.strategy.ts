import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  AuthUser,
  JwtPayload,
} from 'src/common/interfaces/jwt-payload.interface';
import { MembershipStatus } from '@prisma/client';

/**
 * Estrategia JWT de Passport para validar tokens en cada request.
 *
 * Flujo de validación:
 * 1. Extrae el token del header Authorization: Bearer <toker>
 * 2. Verifica la firma con JWT_SECRET
 * 3. Valida que la membership del token sigue activa en DB.
 * 4. Intecta el AuthUser en req.user para uso en contrllers via @CurrentUser()
 *
 * Esra validación en DB (paso 3) permite invalidar sesiones activas
 * desactivando la membership, sin necesidad de blacklist de tokens.
 *
 */

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Secreto del ACCESS token. Sin fallback: si falta, el arranque ya
      // habría fallado en la validación de env (env.validation.ts).
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  /**
   * Valida el payload del JWT en cada request autenticado.
   * Se ejecuta automáticamente después de verificar la firma del token.
   *
   * @param payload - Payload decodificado del JWT.
   * @returns AuthUser que se inyecta en req.user
   * @throws UnauthorizedException si la membership no existe o está inactiva.
   */

  async validate(payload: JwtPayload): Promise<AuthUser> {
    // verificamos que el usuario y el membership todavía existan y esten activos.
    // Esto permite invalidar sesiones desactivando la membership sin blacklist.
    const membership = await this.prisma.db.membership.findFirst({
      where: {
        id: payload.membershipId,
        userId: payload.sub,
        tenantId: payload.tenantId,
        status: MembershipStatus.REVOKED,
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Invalid sesion or expired');
    }

    // Retirbanis ek AuthUser que estará disponible via @CurrentUser()
    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
      membershipId: payload.membershipId,
    };
  }
}
