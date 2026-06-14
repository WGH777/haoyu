import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const isProduction = process.env.NODE_ENV === 'production';

const DEV_PASSWORD = 'Haoyu@2026';
const DEV_INITIAL_AVAILABLE = 1_000_000; // 10,000 煜米，单位：分
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

const DEV_TASKS = [
  {
    title: '品牌视觉升级与首页改版',
    description: '为灯火主题品牌站优化首屏视觉、卡片层级与响应式体验，交付设计稿与落地建议。',
    price: 38000,
    category: 'SKILL_SERVICE',
    serviceMode: 'ONLINE',
    status: 'PENDING',
  },
  {
    title: '智能家居小程序功能梳理',
    description: '梳理设备控制、场景联动、消息提醒等功能流程，输出原型说明与接口清单。',
    price: 32000,
    category: 'REMOTE_ASSISTANCE',
    serviceMode: 'ONLINE',
    status: 'PENDING',
  },
  {
    title: '产品宣传短片脚本策划',
    description: '围绕产品亮点撰写 60 秒宣传片脚本，包含分镜、旁白和拍摄建议。',
    price: 28000,
    category: 'SKILL_SERVICE',
    serviceMode: 'BOTH',
    status: 'PENDING',
  },
  {
    title: '品牌全案传播方案',
    description: '从定位、内容主题、渠道节奏到落地物料，提供一套小型品牌传播方案。',
    price: 45000,
    category: 'OTHER',
    serviceMode: 'ONLINE',
    status: 'ASSIGNED',
  },
  {
    title: '电商详情页文案优化',
    description: '优化商品卖点表达、模块标题和转化引导，适配主流电商详情页结构。',
    price: 16000,
    category: 'SKILL_SERVICE',
    serviceMode: 'ONLINE',
    status: 'PENDING',
  },
  {
    title: '社区活动海报与报名页',
    description: '设计社区线下活动主视觉海报，并整理报名页内容结构和视觉建议。',
    price: 24000,
    category: 'COMMUNITY_COLLABORATION',
    serviceMode: 'BOTH',
    status: 'SUBMITTED',
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

async function ensureDevelopmentWalletBaseline() {
  for (const user of DEV_USERS) {
    const saved = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true, email: true } });
    if (!saved) continue;

    await prisma.wallet.upsert({
      where: { userId_currency: { userId: saved.id, currency: 'CNY' } },
      update: {
        ownerType: 'USER',
        available: DEV_INITIAL_AVAILABLE,
        frozen: 0,
      },
      create: {
        ownerType: 'USER',
        userId: saved.id,
        currency: 'CNY',
        available: DEV_INITIAL_AVAILABLE,
        frozen: 0,
      },
    });
    console.log(`Dev wallet baseline ensured: ${saved.email} / available=${DEV_INITIAL_AVAILABLE} / frozen=0`);
  }
}

async function ensureDevelopmentTasks() {
  const publisher = await prisma.user.findUnique({ where: { email: 'test@haoyu.com' }, select: { id: true } });
  if (!publisher) return;

  for (const item of DEV_TASKS) {
    const existing = await prisma.task.findFirst({
      where: { title: item.title, publisherId: publisher.id },
      select: { id: true },
    });

    if (existing) {
      await prisma.task.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          price: item.price,
          category: item.category,
          serviceMode: item.serviceMode,
          status: item.status,
        },
      });
      console.log(`Dev task updated: #${existing.id} ${item.title}`);
      continue;
    }

    const created = await prisma.task.create({
      data: {
        title: item.title,
        description: item.description,
        price: item.price,
        category: item.category,
        serviceMode: item.serviceMode,
        status: item.status,
        publisherId: publisher.id,
      },
    });
    console.log(`Dev task created: #${created.id} ${item.title}`);
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

  if (!isProduction) {
    await ensureDevelopmentWalletBaseline();
    await ensureDevelopmentTasks();
  }

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
