import { SystemRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // Subject (user ID)
  email: string;
  tenantId: string;
  role: SystemRole;
  membershipId: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  tenantId: string;
  role: SystemRole;
  membershipId: string;
}
