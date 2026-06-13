import { PrismaClient, SystemRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(` '🌱 Iniciando seed...`);

  // ─────────────────────────────────────────
  // PLANES
  // ─────────────────────────────────────────

  await prisma.plan.createMany({
    data: [
      {
        name: 'Free',
        price: 0,
        maxStaff: 2,
        maxServices: 5,
        hasAppointments: true,
        hasCRM: true,
        hasStats: false,
        hasEcommerce: false,
        hasInventory: false,
      },
      {
        name: 'Pro',
        price: 29.99,
        maxStaff: 20,
        maxServices: 50,
        hasAppointments: true,
        hasCRM: true,
        hasStats: true,
        hasEcommerce: false,
        hasInventory: false,
      },
      {
        name: 'Enterprise',
        price: 99.99,
        maxStaff: 200,
        maxServices: 500,
        hasAppointments: true,
        hasCRM: true,
        hasStats: true,
        hasEcommerce: true,
        hasInventory: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Planes creados');

  // ─────────────────────────────────────────
  // PERRMISOS
  // Formato: "modulo:accion
  // ─────────────────────────────────────────
  const permissions = [
    // Usuarios
    'user:create',
    'user:read',
    'user:update',
    'user:delete',

    // Staff / Memberships
    'staff:create',
    'staff:read',
    'staff:update',
    'staff:delete',

    // Servicios
    'service:create',
    'service:read',
    'service:update',
    'service:delete',

    // Turnos
    'appointment:create',
    'appointment:read',
    'appointment:update',
    'appointment:delete',

    // CRM / Clientes
    'customer:create',
    'customer:read',
    'customer:update',
    'customer:delete',

    // Estadísticas
    'stats:view',
  ];

  await prisma.permission.createMany({
    data: permissions.map((name) => ({ name })),
    skipDuplicates: true,
  });
  console.log('✅ Permisos creados');

  // ─────────────────────────────────────────
  // TENANT DE DEMO
  // ─────────────────────────────────────────

  const freePlan = await prisma.plan.findUnique({ where: { name: 'Free' } });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-nexora' },
    update: {},
    create: {
      name: 'Demo Nexora',
      slug: 'demo-nexora',
      planId: freePlan?.id,
    },
  });
  console.log('✅ Tenant demo creado');

  // ─────────────────────────────────────────
  // USUARIO OWNER DEL TENANT DEMO
  // ─────────────────────────────────────────

  const hashedPassword = await bcrypt.hash('Nexora2026!', 12);

  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@demo-nexora.com' },
    update: {},
    create: {
      email: 'owner@demo-nexora.com',
      password: hashedPassword,
      name: 'Owner Demo',
    },
    omit: { password: false }, // Nunca incluir el hash de password en la respuesta
  });

  await prisma.membership.upsert({
    where: {
      userId_tenantId: {
        userId: ownerUser.id,
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      userId: ownerUser.id,
      tenantId: tenant.id,
      role: SystemRole.OWNER,
      isActive: true,
    },
  });

  console.log('✅ Usuario owner creado y asignado al tenant demo');

  console.log('🎉 Seed completado exitosamente');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error durante el seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
