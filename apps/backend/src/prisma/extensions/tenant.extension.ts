import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

//Modelos que pertenecen a un tenant - Tienen campo tenantId
const TENANT_SCOPED_MODELS = [
  'Membership',
  'Service',
  'Customer',
  'Appointment',
] as const;

type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];

function isTenantScopedModel(model?: string): model is TenantScopedModel {
  if (!model) return false;
  return (TENANT_SCOPED_MODELS as readonly string[]).includes(model);
}

type PriismaDelegate = {
  findFirst: (args: {
    where: unknown;
    select: unknown;
  }) => Promise<{ id: string } | null>;
};

function getDelegate(client: object, model: string): PriismaDelegate {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  return (client as Record<string, PriismaDelegate>)[key];
}

export interface TenantContext {
  tenantId?: string; //tenant actual
}

export const createTenantExtension = (context: TenantContext) =>
  Prisma.defineExtension((client) =>
    client.$extends({
      name: 'tenant',

      query: {
        $allModels: {
          async findMany({ args, query, model }) {
            if (isTenantScopedModel(model) && context.tenantId) {
              args.where = { tenantId: context.tenantId, ...args.where };
            }
            return query(args);
          },

          async findFirst({ args, query, model }) {
            if (isTenantScopedModel(model) && context.tenantId) {
              args.where = { tenantId: context.tenantId, ...args.where };
            }
            return query(args);
          },

          async findUnique({ args, query, model }) {
            if (isTenantScopedModel(model) && context.tenantId) {
              args.where = {
                ...args.where,
                tenantId: context.tenantId,
              } as typeof args.where;
            }
            return query(args);
          },

          async create({ args, query, model }) {
            if (isTenantScopedModel(model) && context.tenantId) {
              args.data = {
                ...args.data,
                tenantId: context.tenantId,
              } as typeof args.data;
            }
            return query(args);
          },

          async update({ args, query, model }) {
            //validación: no puede actualizar datos de otros tenant
            if (isTenantScopedModel(model) && context.tenantId) {
              const record = await getDelegate(client, model).findFirst({
                where: {
                  ...(args.where as object),
                  tenantId: context.tenantId,
                },
                select: { id: true },
              });
              if (!record) {
                throw new ForbiddenException(
                  `No tienes acceso a este recurso en el modelo "${model}".`,
                );
              }
            }
            return query(args);
          },
          async delete({ args, query, model }) {
            //validación: no puede eliminar datos de otros tenant
            if (isTenantScopedModel(model) && context.tenantId) {
              const record = await getDelegate(client, model).findFirst({
                where: {
                  ...(args.where as object),
                  tenantId: context.tenantId,
                },
                select: { id: true },
              });
              if (!record) {
                throw new ForbiddenException(
                  `No tienes acceso a este recurso en el modelo "${model}".`,
                );
              }
            }
            return query(args);
          },
        },
      },
    }),
  );
