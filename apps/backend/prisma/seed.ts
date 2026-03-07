import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.createMany({
    data: [
      { name: 'Free', price: 0, maxStaff: 2, maxServices: 5 },
      { name: 'Pro', price: 29.99, maxStaff: 20, maxServices: 50 },
      { name: 'Enterprise', price: 99.99, maxStaff: 200, maxServices: 500 },
    ],
    skipDuplicates: true,
  });

  const permissions = [
    'user.create',
    'user.update',
    'user.delete',

    'staff.create',
    'staff.update',
    'staff.delete',

    'service.create',
    'service.update',
    'service.delete',

    'appointment.create',
    'appointment.update',
    'appointment.delete',
  ];

  await prisma.permission.createMany({
    data: permissions.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-salon' },
    update: {},
    create: {
      name: 'Demo Salon',
      slug: 'demo-salon',
    },
  });

  const roles = ['Owner', 'Admin', 'Staff'];

  await prisma.role.createMany({
    data: roles.map((name) => ({
      name,
      tenantId: tenant.id,
    })),
    skipDuplicates: true,
  });

  const [allPermissions, allRoles] = await Promise.all([
    prisma.permission.findMany(),
    prisma.role.findMany({
      where: { tenantId: tenant.id },
    }),
  ]);

  const roleMap: Record<string, (typeof allRoles)[number]> = Object.fromEntries(
    allRoles.map((role) => [role.name, role]),
  );

  const ownerPermissions = allPermissions.map((perm) => ({
    roleId: roleMap['Owner'].id,
    permissionId: perm.id,
  }));

  const adminPermissions = allPermissions
    .filter((perm) => !perm.name.startsWith('user.delete'))
    .map((perm) => ({
      roleId: roleMap['Admin'].id,
      permissionId: perm.id,
    }));

  const staffPermissions = allPermissions
    .filter(
      (perm) =>
        perm.name.startsWith('appointment') || perm.name.startsWith('service'),
    )
    .map((perm) => ({
      roleId: roleMap['Staff'].id,
      permissionId: perm.id,
    }));

  await prisma.rolePermission.createMany({
    data: [...ownerPermissions, ...adminPermissions, ...staffPermissions],
  });

  console.log('Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
