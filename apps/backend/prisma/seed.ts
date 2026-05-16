import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  console.log(`🌱 开始执行 Seed (环境: ${process.env.NODE_ENV || 'dev'})...`);

  // 1. 获取环境变量配置
  // 🔒 安全要求：不允许硬编码默认密码。生产环境必须通过环境变量注入。
  // 开发环境：创建 .env 并设置 SUPER_ADMIN_EMAIL 和 SUPER_ADMIN_PASSWORD
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    if (isProduction) {
      throw new Error(
        'SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required in production',
      );
    }
    console.warn(
      '⚠️  开发环境未设置 SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD，跳过管理员创建',
    );
    // 只初始化系统钱包，不创建管理员
    const systemWallets = [
      { code: 'SYSTEM_ESCROW', ownerType: 'SYSTEM' },
      { code: 'SYSTEM_PLATFORM_FEE', ownerType: 'SYSTEM' },
      { code: 'SYSTEM_RISK_RESERVE', ownerType: 'SYSTEM' },
    ];
    for (const item of systemWallets) {
      await prisma.wallet.upsert({
        where: { code: item.code },
        update: { ownerType: item.ownerType, currency: 'CNY' },
        create: { code: item.code, ownerType: item.ownerType, currency: 'CNY', available: 0, frozen: 0 },
      });
    }
    console.log('🏦 系统钱包初始化完成');
    return;
  }

  // 2. 创建/更新超级管理员 (幂等操作)
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'SUPER_ADMIN', // 强制纠正权限
      password: hashedPassword, // 允许通过环境变量重置密码
    },
    create: {
      email: adminEmail,
      nickname: '超级管理员',
      password: hashedPassword,
      role: 'SUPER_ADMIN', // 👑 唯一的皇冠
      walletCount: 1,
    },
  });
  console.log(`👑 超级管理员已就绪: ${superAdmin.email}`);

  // 3. 初始化系统钱包（幂等）
  const systemWallets = [
    { code: 'SYSTEM_ESCROW', ownerType: 'SYSTEM' },
    { code: 'SYSTEM_PLATFORM_FEE', ownerType: 'SYSTEM' },
    { code: 'SYSTEM_RISK_RESERVE', ownerType: 'SYSTEM' },
  ];

  for (const item of systemWallets) {
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
  console.log('🏦 系统钱包初始化完成');

  // 4. 为每个用户创建 CNY 钱包（幂等）
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

  await prisma.user.updateMany({
    data: { walletCount: 1 },
  });

  console.log(`👛 已为 ${users.length} 个用户初始化 CNY 钱包`);

  // 5. (仅开发环境) 清空数据并创建测试号
  if (!isProduction) {
    // 这里可以放你之前的清空逻辑和 worker@test.com 的创建逻辑
    // 为了篇幅简洁，这里暂时省略，重点是上面的超级管理员和钱包初始化
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
