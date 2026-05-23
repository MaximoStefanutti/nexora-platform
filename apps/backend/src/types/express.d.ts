import { SystemRole } from '@prisma/client';

//! Extendemos el tipo de Request para incluir tenantId
declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      tenantId: string;
      role: SystemRole;
      membershipId: string;
    }
    interface Request {
      tenantId?: string; // Agrega tenantId al objeto Request
    }
  }
}
