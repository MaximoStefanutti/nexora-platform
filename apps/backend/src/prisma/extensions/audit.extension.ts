import { Prisma } from '@prisma/client';

/**
 * Lista de modelos que registran auditoría de cambios.
 * Solo los modelos con campos createBy y updateBy en el schema deben estar acá.
 *
 * Al agregar un nuevo modelo con campos de auditoría, agregarlo a esta lista
 * para que se llenen automáticamente en cada operación de escritura.
 *
 * //*Nota:
 * User no está incluido porque se registra solo (no tiene sentido auditar quién creó user).
 */

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

/**
 * Contexto de auditoría que se pasa al construir el cliente extendido.
 * Contiene el userId del usuario que ejecuta la operación.
 */

export interface AuditContext {
  userId?: string; //quien ejecuta la operación
}

/**
 * Extensión de Prisma que implementa auditoría automática de cambios.
 *
 * //*Funcionalidades:
 * - Rellena createdBy y updatedBy automáticamente en create.
 * - Relleena updatedBy automáticamente en update y updateMany.
 * - Loguea operaciones DELETE como advertencia (en  producción ir a tabla AuditLog)
 *
 * Esta extensión requiere contexto de usuario - usar vía prisma.forTenant()
 * que recibe el AuditContext como segundo parámetro.
 */

export const createAuditExtension = (context: AuditContext) =>
  Prisma.defineExtension((client) =>
    client.$extends({
      name: 'audit',

      query: {
        $allModels: {
          // Rellana createBy y updatedBy al crear un registro.
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

          // Rellana updatedBy al actualizar un registro.
          async update({ args, query, model }) {
            if (isAuditModel(model) && context.userId) {
              args.data = {
                ...args.data,
                updatedBy: context.userId,
              } as typeof args.data;
            }
            return query(args);
          },

          // Rellana updatedBy al actualizar múltiples reegistros
          async updateMany({ args, query, model }) {
            if (isAuditModel(model) && context.userId) {
              args.data = {
                ...args.data,
                updatedBy: context.userId,
              } as typeof args.data;
            }
            return query(args);
          },

          /**
           * Loguea operaciones de eliminación física.
           * TODO: En producción reemplazar el console.warn por
           * una inserción en una tabla AuditLog para trazabilidad completa.
           */
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
