import { Prisma } from '@prisma/client';

export const softDeleteExtension = Prisma.defineExtension({
  name: 'soft-delete',

  model: {
    $allModels: {
      async softDelete<T>(this: T, where: Prisma.Args<T, 'update'>['where']) {
        const context = Prisma.getExtensionContext(this);

        return await (context as any).update({
          where,
          data: {
            deleteAt: new Date(),
          },
        });
      },
      async restore<T>(this: T, where: Prisma.Args<T, 'update'>['where']) {
        const context = Prisma.getExtensionContext(this);

        return await (context as any).update({
          where,
          data: {
            deleteAt: null,
          },
        });
      },
    },
  },
});
