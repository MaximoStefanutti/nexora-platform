import { Prisma } from '@prisma/client';

const AUDIT_MODELS = [
  'Tenant',
  'Membership',
  'Customer',
  'Appointment',
  'Service',
] as const;

type AuditModel = (typeof AUDIT_MODELS)[number];

function isAuditModel(model?: string): model is AuditModel {
  if (!model) return false;
  return (AUDIT_MODELS as readonly string[]).includes(model);
}

export interface AuditContext {
  userId?: string; //quien ejecuta la operación
}

export const createAuditExtension = (context: AuditContext) =>
  Prisma.defineExtension((client) =>
    client.$extends({
      name: 'audit',

      query: {
        $allModels: {
          async create({ args, query, model }) {
            if (isAuditModel(model) && context.userId) {
              args.data = {
                ...args.data,
                createdBy: context.userId,
                updatedBy: context.userId,
              } as typeof args.data;
            }
            return query(args);
          },

          async update({ args, query, model }) {
            if (isAuditModel(model) && context.userId) {
              args.data = {
                ...args.data,
                updatedBy: context.userId,
              } as typeof args.data;
            }
            return query(args);
          },
          async updateMany({ args, query, model }) {
            if (isAuditModel(model) && context.userId) {
              args.data = {
                ...args.data,
                updatedBy: context.userId,
              } as typeof args.data;
            }
            return query(args);
          },

          // Log de opercaiones destuctivas
          async delete({ args, query, model }) {
            if (context.userId) {
              // En producción esto debería poder ir a una tabla AuditLog
              console.warn(
                `[AUDIT] DELETE en modelo "${model}" por userId: ${context.userId}`,
                { where: args.where },
              );
            }
            return query(args);
          },
        },
      },
    }),
  );
