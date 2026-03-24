import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenantExtension } from './extensions/tenant.extension';
import { auditExtension } from './extensions/audit.extension';
import { softDeleteExtension } from './extensions/soft-delete.extension';

@Injectable()
export class PrismaService extends PrismaClient {
  whiteContext(userId?: string, tenantId?: string) {
    return this.$extends(tenantExtension(tenantId))
      .$extends(auditExtension(userId))
      .$extends(softDeleteExtension);
  }
}
