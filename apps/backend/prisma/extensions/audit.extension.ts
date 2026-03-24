import { Prisma } from '@prisma/client';

export const auditExtension = (userId?: string) =>
  Prisma.defineExtension({
    name: 'audit',
    query: {
      $allModels: {
        async create({ args, query }) {
          if (userId && args?.data) {
            const data = args.data as Record<string, unknown>;

            if ('createBy' in data) {
              data.createBy = userId;
            }
            if ('updateBy' in data) {
              data.updateBy = userId;
            }
          }
          return await query(args);
        },

        async update({ args, query }) {
          if (userId && args?.data) {
            const data = args.data as Record<string, unknown>;

            if ('updateBBy' in data) {
              data.updateBy = userId;
            }
          }
          return await query(args);
        },
      },
    },
  });
