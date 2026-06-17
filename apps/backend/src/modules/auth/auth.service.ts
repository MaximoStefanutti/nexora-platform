import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import slugify from 'slugify';
import { SystemRole } from '@prisma/client';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import {
  generateTokenHelper,
  hashToken,
} from 'src/common/helpers/generate-token.helper';
import { randomUUID } from 'crypto';

/**
 * Servicio de autenticación.
 * Maneja el registro de nuevos negocios, el login de usuarios en el contexto
 * de un tenant específico y la renovación de sesiones vía refresh token.
 *
 * Estrategia de tokens:
 * - accessToken:  corto (ej. 15m), se manda en cada request (Bearer).
 * - refreshToken: largo (ej. 7d), solo se usa contra POST /auth/refresh
 *   para obtener un access token nuevo sin re-login.
 *
 * La sesión se puede invalidar en cualquier momento desactivando la
 * membership: tanto JwtStrategy como /auth/refresh revalidan en DB.
 */
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  /**
   * Genera el par de tokens (access + refresh) para una sesión.
   * El access usa el secreto/expiración por defecto del JwtModule.
   * El refresh se firma con su propio secreto y expiración.
   */
  private async generateTokens(payload: JwtPayload, familyId?: string) {
    const accessToken = await this.jwtService.signAsync(payload);

    const { raw, hash } = generateTokenHelper();
    const family = familyId ?? randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    await this.prisma.db.refreshToken.create({
      data: {
        tokenHash: hash,
        familyId: family,
        membershipId: payload.membershipId,
        expiresAt,
      },
    });
    return { accessToken, refreshToken: raw };
  }

  /**
   * Registra un nuevo negocio (tenant) junto con su usuario OWNER.
   * Crea Tenant + User + Membership(OWNER) en una sola transacción atómica
   * y deja la sesión iniciada devolviendo el par de tokens.
   *
   * @throws ConflictException si el email ya está registrado o el slug está en uso.
   */
  async register(dto: RegisterDto) {
    // Generamos el slug desde el nombre del negocio si no se proveyó.
    const slug =
      dto.slug ??
      slugify(dto.businessName, { lower: true, strict: true, trim: true });

    // Verificamos que el email no esté ya registrado (User.email es único global).
    const existingUser = await this.prisma.db.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Verificamos que el slug del negocio esté disponible.
    const existingTenant = await this.prisma.db.tenant.findFirst({
      where: { slug },
      select: { id: true },
    });
    if (existingTenant) {
      throw new ConflictException(`The slug "${slug}" is already in use`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Asignamos el plan Free por defecto si existe (seed lo crea).
    const freePlan = await this.prisma.db.plan.findUnique({
      where: { name: 'Free' },
      select: { id: true },
    });

    // Tenant + User + Membership en una transacción: si algo falla, se revierte todo.
    const { tenant, user, membership } = await this.prisma.runInTransaction(
      async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: dto.businessName,
            slug,
            isActive: true,
            planId: freePlan?.id,
          },
          select: { id: true, name: true, slug: true },
        });

        const user = await tx.user.create({
          data: {
            email: dto.email,
            password: hashedPassword,
            name: dto.name,
            phone: dto.phone,
          },
          select: { id: true, email: true, name: true },
        });

        const membership = await tx.membership.create({
          data: {
            userId: user.id,
            tenantId: tenant.id,
            role: SystemRole.OWNER,
            isActive: true,
          },
          select: { id: true },
        });

        return { tenant, user, membership };
      },
    );

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: SystemRole.OWNER,
      membershipId: membership.id,
    });

    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    };
  }

  /**
   * Autentica un usuario en el contexto de un tenant específico.
   * Retorna el par de tokens (access + refresh).
   *
   * @param email - Email del usuario.
   * @param password - Password en texto plano (se compara con el hash en DB).
   * @param tenantSlug - Slug del tenant al que el usuario intenta acceder.
   * @throws UnauthorizedException si el tenant, usuario o password son inválidos.
   */
  async login(email: string, password: string, tenantSlug: string) {
    const tenant = await this.prisma.db.tenant.findFirst({
      where: { slug: tenantSlug, isActive: true },
    });
    // Verificamos que el tenant existe y está activo.
    if (!tenant) throw new UnauthorizedException('Invalid credentials');

    // Buscamos el usuario verificando que tenga membresía activa en el tenant.
    const user = await this.prisma.db.user.findFirst({
      where: {
        email,
        memberships: { some: { tenantId: tenant.id, isActive: true } },
      },
      omit: { password: false }, // Incluir el hash de password en la respuesta
      include: {
        memberships: {
          where: { tenantId: tenant.id, isActive: true },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Comparamos la password con el hash almacenado en DB.
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    // Un usuario solo puede tener una membresía activa por tenant.
    const membership = user.memberships[0];

    return this.generateTokens({
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: membership.role,
      membershipId: membership.id,
    });
  }

  /**
   * Renueva la sesión a partir de un refresh token válido.
   * Verifica la firma/expiración del refresh token y revalida en DB que la
   * membership siga activa antes de emitir un nuevo par de tokens.
   *
   * @throws UnauthorizedException si el refresh token es inválido/expiró
   *         o si la membership ya no está activa.
   */
  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    const stored = await this.prisma.db.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        membership: {
          include: { user: { select: { email: true } } },
        },
      },
    });

    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    if (stored.revokedAt) {
      await this.prisma.db.refreshToken.updateMany({
        where: { familyId: stored.familyId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (stored.expiresAt < new Date())
      throw new UnauthorizedException('Refresh token has expired');

    if (!stored.membership.isActive) {
      throw new UnauthorizedException('Membership is no longer active');
    }

    const payload: JwtPayload = {
      sub: stored.membership.userId,
      email: stored.membership.user.email,
      tenantId: stored.membership.tenantId,
      role: stored.membership.role,
      membershipId: stored.membership.id,
    };

    const { raw, hash } = generateTokenHelper();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
    const accessToken = await this.jwtService.signAsync(payload);

    await this.prisma.runInTransaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          tokenHash: hash,
          familyId: stored.familyId,
          membershipId: stored.membership.id,
          expiresAt,
        },
      });
      await tx.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date(), replacedById: created.id },
      });
    });

    return { accessToken, refreshToken: raw };
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    const stored = await this.prisma.db.refreshToken.findUnique({
      where: { tokenHash },
      select: { familyId: true },
    });
    if (!stored) return; // Si el token no existe, no hay nada que revocar

    await this.prisma.db.refreshToken.updateMany({
      where: { familyId: stored.familyId },
      data: { revokedAt: new Date() },
    });
  }
}
