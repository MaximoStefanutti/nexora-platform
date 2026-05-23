import { Prisma } from '@prisma/client';

export const SOFT_DELETE_EXTENSION = [
  'Tenant',
  'User',
  'Customer',
  'Service',
] as const;

export type SoftDeletemodel = (typeof SOFT_DELETE_EXTENSION)[number];

export function isSoftDeleteModel(model?: string): model is SoftDeletemodel {
  if (!model) return false;
  return (SOFT_DELETE_EXTENSION as readonly string[]).includes(model);
}

export const softDeleteExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: 'soft-delete',

    model: {
      $allModels: {
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
        async findMany({ args, query, model }) {
          if (isSoftDeleteModel(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },

        async findFirst({ args, query, model }) {
          if (isSoftDeleteModel(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },

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
