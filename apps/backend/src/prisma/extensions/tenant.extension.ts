import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Lista de modelos que pertenecen a un tenant específico.
 * Solo los modelos con campo tenantId en el schema debe estar acá.
 *
 * Al agregar un nuevo modelo con tenantID, agregarlo a esta lista
 * para que el aisalmiento de datos entre tenants sea automático.
 */

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

/**
 * Tipo que representa el delegate de Prisma para un modelo.
 * Usado para acceso dinámico al modelo en las validaciones de update y delete.
 */

type PriismaDelegate = {
  findFirst: (args: {
    where: unknown;
    select: unknown;
  }) => Promise<{ id: string } | null>;
};

/**
 * Obtiene el delegate de Primsa para un modelo dado su nombre.
 * Convierte el nombre del modelo (PascalCasse) a camelCase para acceder al cliente.
 * Ejemplo: 'Customer' ->prismaClient.customer
 */

function getDelegate(client: object, model: string): PriismaDelegate {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  return (client as Record<string, PriismaDelegate>)[key];
}

/**
 * Contexto de tenant que se pasa al construir el cliente extendido.
 */
export interface TenantContext {
  tenantId?: string; //tenant actual
}

/**
 * Extensión de Prisma que implementa el asilamiento de datos por tenant.
 *
 * //* Funcionalidades:
 * - Inyecta tenantId automáticamente en todas las queries de lectura.
 * - Inyecta tenantId automáticamente en create.
 * - Valida que update y delete solo afecten registros del tenant actual.
 *
 * Esta es la primera extensión en aplicarse (orden: tenant -> soft-delete -> audit)
 * para garantizar que el filtrado por tenant sea la primera barrera de seguridad.
 *
 * //*! IMPORTANTE: Esta extensión es la principal defensa contra el acceso
 * //*! cruzado para tenants. No modificar sin revisión exhaustiva.
 */

export const createTenantExtension = (context: TenantContext) =>
  Prisma.defineExtension((client) =>
    client.$extends({
      name: 'tenant',

      query: {
        $allModels: {
          // Filtra automáticamente por tenantId en findMany.
          async findMany({ args, query, model }) {
            if (isTenantScopedModel(model) && context.tenantId) {
              args.where = { tenantId: context.tenantId, ...args.where };
            }
            return query(args);
          },

          // Filtra automáticamente por tenantId en findFirst.
          async findFirst({ args, query, model }) {
            if (isTenantScopedModel(model) && context.tenantId) {
              args.where = { tenantId: context.tenantId, ...args.where };
            }
            return query(args);
          },

          // Filtra automáticamente por tenantId en findunique.
          async findUnique({ args, query, model }) {
            if (isTenantScopedModel(model) && context.tenantId) {
              args.where = {
                ...args.where,
                tenantId: context.tenantId,
              } as typeof args.where;
            }
            return query(args);
          },

          // Inyecta tenantId automáticamente al crear un registro.
          async create({ args, query, model }) {
            if (isTenantScopedModel(model) && context.tenantId) {
              args.data = {
                ...args.data,
                tenantId: context.tenantId,
              } as typeof args.data;
            }
            return query(args);
          },

          /**
           * Valida que el registro a actualizar pertenece al tenant actual.
           * Previen actualizaciones cruzadas entre tenants.
           * @throws ForbiddenException si el registro no pertenece al tenant
           */

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

          /**
           * Valida que el registro a eliminar pertence al tenant actual.
           * Previene eliminaciones cruzadas entre tenants
           * @throws ForbiddenException si el registro no pertenece al tenant
           */

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
