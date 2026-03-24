import { Prisma } from '@prisma/client';

export const tenantExtension = (tenantId?: string) =>
  Prisma.defineExtension({
    name: 'tenant',

    query: {
      $allModels: {
        async findMany({ args, query }) {
          if (!tenantId) return await query(args);

          args.where = {
            ...args.where,
            tenantId,
          };

          return await query(args);
        },

        async findFirst({ args, query }) {
          if (!tenantId) return await query(args);

          args.where = {
            ...args.where,
            tenantId,
          };

          return await query(args);
        },

        async findUnique({ args, query }) {
          if (!tenantId) return await query(args);

          args.where = {
            ...args.where,
            tenantId,
          };

          return await query(args);
        },

        async create({ args, query }) {
          if (tenantId && args.data) {
            (args.data as Record<string, unknown>).tenantId = tenantId;
          }
          return await query(args);
        },

        async update({ args, query }) {
          if (!tenantId) return await query(args);

          args.where = {
            ...args.where,
            tenantId,
          };

          return await query(args);
        },

        async delete({ args, query }) {
          if (!tenantId) return await query(args);

          args.where = {
            ...args.where,
            tenantId,
          };

          return await query(args);
        },
      },
    },
  });
