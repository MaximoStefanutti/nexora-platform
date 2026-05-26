import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

/**
 * Servicio de autenticación.
 * Maneja el login de usuarios en el contexto de un tenant específico.
 *
 * Flujo dee auteenticación:
 * 1. Verifica que el tenant existe por slug
 * 2. Busca el usuario por mail con membresia activa en el tenant.
 * 3. Valida la password con bcrypt.
 * 4. Genera un HWT con el contexto completo (userId, tenantId, role, membershipId)
 */

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Autetica un usuario en el contexto de un tenant específico.
   * Retorna un accessToken JWT con 7 días de expiración.
   *
   * @param email - Email del usuario.
   * @param password - password en texto plano (se compara con el hash en DB).
   * @param tenantSlug - Sllug del tenant al que el usuario intenta acceder.
   * @throws UnauthorizedException si el tenant, usuario o password son inválidos.
   */

  async login(email: string, password: string, tenantSlug: string) {
    const tenant = await this.prisma.db.tenant.findFirst({
      where: { slug: tenantSlug, isActive: true },
    });
    // Verificamos que el tenant existe y este activo.
    if (!tenant) throw new UnauthorizedException('Invalid credentials');

    // Buscamos el usuariro verificando que tenga membresía en el tenant.
    const user = await this.prisma.db.user.findFirst({
      where: {
        email,
        memberships: { some: { tenantId: tenant.id, isActive: true } },
      },
      include: {
        memberships: {
          where: { tenantId: tenant.id, isActive: true },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Comparamos la password con el hash almacenado en DB
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    // Un usuario solo puede tener una membresía activa por tenant.
    const membership = user.memberships[0];

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: tenant.id, // SystemRole: OWNEER | ADMIN | STAFF
      role: membership.role,
      membershipId: membership.id,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
