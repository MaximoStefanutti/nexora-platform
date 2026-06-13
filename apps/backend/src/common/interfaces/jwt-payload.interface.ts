import { SystemRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // Subject (user ID)
  email: string;
  tenantId: string;
  role: SystemRole;
  membershipId: string;
}

/**
 * Payload del REFRESH token.
 * Contiene lo mínimo necesario para reconstruir la sesión:
 * con membershipId + userId + tenantId revalidamos en DB y reemitimos
 * un access token fresco con el rol y email actuales.
 */
export interface RefreshTokenPayload {
  sub: string; // user ID
  tenantId: string;
  membershipId: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  tenantId: string;
  role: SystemRole;
  membershipId: string;
}
