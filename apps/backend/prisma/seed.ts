import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const isProduction = process.env.NODE_ENV === 'production';

const DEV_PASSWORD = 'Haoyu@2026';
const DEV_USERS = [
  {
    email: 'super@haoyu.com',
    nickname: '浩煜超管',
    role: 'SUPER_ADMIN',
    bio: '开发环境固定超级管理员账号',
  },
  {
    email: 'admin@haoyu.com',
    nickname: '浩煜管理',
    role: 'ADMIN',
    bio: '开发环境固定管理员账号',
  },
  {
    email: 'test@haoyu.com',
    nickname: '浩煜测试',
    role: 'USER',
    bio: '开发环境固定测试用户账号',
  },
];

const SYSTEM_WALLETS = [
  { code: 'SYSTEM_ESCROW', ownerType: 'SYSTEM' },
  { code: 'SYSTEM_PLATFORM_FEE', ownerType: 'SYSTEM' },
  { code: 'SYSTEM_RISK_RESERVE', ownerType: 'SYSTEM' },
];

async function ensureSystemWallets() {
  for (const item of SYSTEM_WALLETS) {
    await prisma.wallet.upsert({
      where: { code: item.code },
      update: { ownerType: item.ownerType, currency: 'CNY' },
      create: {
        code: item.code,
        ownerType: item.ownerType,
        currency: 'CNY',
        available: 0,
        frozen: 0,
      },
    });
  }
}

async function ensureUserWallets() {
  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    await prisma.wallet.upsert({
      where: { userId_currency: { userId: user.id, currency: 'CNY' } },
      update: {},
      create: {
        ownerType: 'USER',
        userId: user.id,
        currency: 'CNY',
        available: 0,
        frozen: 0,
      },
    });
  }

  await prisma.user.updateMany({ data: { walletCount: 1 } });
}

async function upsertUser(email: string, password: string, nickname: string, role: string, bio?: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      nickname,
      role,
      bio,
      status: 'ACTIVE',
      walletCount: 1,
    },
    create: {
      email,
      password: hashedPassword,
      nickname,
      role,
      bio,
      status: 'ACTIVE',
      walletCount: 1,
    },
  });
}

async function ensureProductionSuperAdmin() {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required in production');
  }

  const superAdmin = await upsertUser(
    adminEmail,
    adminPassword,
    process.env.SUPER_ADMIN_NICKNAME || '超级管理员',
    'SUPER_ADMIN',
  );
  console.log(`Production super admin ensured: ${superAdmin.email}`);
}

async function ensureDevelopmentUsers() {
  for (const user of DEV_USERS) {
    const saved = await upsertUser(user.email, DEV_PASSWORD, user.nickname, user.role, user.bio);
    console.log(`Dev account ensured: ${saved.email} / ${DEV_PASSWORD} / ${saved.role}`);
  }
}

async function main() {
  console.log(`Running seed for ${process.env.NODE_ENV || 'development'} environment...`);

  await ensureSystemWallets();

  if (isProduction) {
    await ensureProductionSuperAdmin();
  } else {
    await ensureDevelopmentUsers();
  }

  await ensureUserWallets();
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
