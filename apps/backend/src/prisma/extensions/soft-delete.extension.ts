import { Prisma } from '@prisma/client';

/**
 * Lista de modelos que soportan soft delete.
 * Solo los modelos con campo `deletedAt: DateTime?` en el schema deben estar aqui.
 *
 * Al agregar un nuevo modelo con deletedAt, aegrarlo también a esta lista
 * para que el filtrado automático y los métodos sofDelete/restore funcionen.
 */

export const SOFT_DELETE_EXTENSION = [
  'Tenant',
  'User',
  'Customer',
  'Service',
] as const;

export type SoftDeletemodel = (typeof SOFT_DELETE_EXTENSION)[number];

/**
 * Verifica si un modelo soporta soft delete.
 * Usado como type guard para garantizar type safety en la extensión.
 */

export function isSoftDeleteModel(model?: string): model is SoftDeletemodel {
  if (!model) return false;
  return (SOFT_DELETE_EXTENSION as readonly string[]).includes(model);
}

/**
 * Extensión de Prisma que implemnta el patrón de soft delete.
 *
 * //*Funcionalidades:
 * - `softDelete()`: marca el registro con deletedAt en vez de eliminarlo
 * - `restore()`: reactiva un registro soft delete.
 * - Filtrado automático de registros eliminados en findMany, findFirst y findUnique.
 * - Prevneción de hard delete accidental en modelos con soft delete
 *
 * //*Uso:
 * await prisma.db.customer.softDelete({ id })
 * await prisma.db.customer.restore({ id })
 */

export const softDeleteExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: 'soft-delete',

    model: {
      $allModels: {
        /**
         * Marca el registro como eliminado sin borrarlo de la DB.
         * Solo disponible en modelos con campo deletedAt en el schema.
         * @throws Error si el modelo no soporta soft delete.
         */
        async softDelete<T>(
          this: T,
          where: Record<string, unknown>,
        ): Promise<void> {
          const ctx = Prisma.getExtensionContext(this);

          if (!isSoftDeleteModel(ctx.$name)) {
            throw new Error(
              `softDelete no está soportado en el modelo "${ctx.$name}". ` +
                `Modelos soportados: ${SOFT_DELETE_EXTENSION.join(', ')}`,
            );
          }

          const delegate = ctx as unknown as {
            update: (args: {
              where: unknown;
              data: unknown;
            }) => Promise<unknown>;
          };

          await delegate.update({ where, data: { deletedAt: new Date() } });
        },

        /**
         * Reactiva un registro previamente soft deleted.
         * Seta deletedAt a null para que vuelva a aparecer en las queries.
         * @throws Error si el modelo no soporta soft delete.
         */

        async restore<T>(
          this: T,
          where: Record<string, unknown>,
        ): Promise<void> {
          const ctx = Prisma.getExtensionContext(this);

          if (!isSoftDeleteModel(ctx.$name)) {
            throw new Error(
              `restore no stá soportado en el modelo "${ctx.$name}"`,
            );
          }

          const delegate = ctx as unknown as {
            update: (args: {
              where: unknown;
              data: unknown;
            }) => Promise<unknown>;
          };
          await delegate.update({ where, data: { deletedAt: null } });
        },
      },
    },

    query: {
      $allModels: {
        // Filtra automáticamente registros con deletedAt en findMany.
        async findMany({ args, query, model }) {
          if (isSoftDeleteModel(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },

        //Flitra automáticamente registros con deletedAt en findFirst.
        async findFirst({ args, query, model }) {
          if (isSoftDeleteModel(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },

        // Filtra automáticamente registros con deletedAt en findUnique.
        async findUnique({ args, query, model }) {
          if (isSoftDeleteModel(model)) {
            args.where = {
              ...args.where,
              deletedAt: null,
            } as typeof args.where;
          }
          return query(args);
        },

        //! Previene hard delete accidental en modelos con soft delete
        async delete({ args, query, model }) {
          if (isSoftDeleteModel(model)) {
            throw new Error(
              `Usá softDelete() en vez de delete() para el modelo "${model}"`,
            );
          }
          return query(args);
        },
      },
    },
  }),
);
