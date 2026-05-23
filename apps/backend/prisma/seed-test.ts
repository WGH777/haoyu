import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * 测试账号种子脚本
 *
 * 用途：本地开发 / 测试环境快速创建统一密码的测试账号
 * 用法：npx ts-node prisma/seed-test.ts
 *
 * 所有测试账号：
 *  - isTest = true（数据库层面标记，无法从前端修改）
 *  - 统一密码：从 TEST_USER_PASSWORD 环境变量读取，默认 Test123456
 *  - 幂等：重复运行不会重复创建（按 email 去重）
 */

const TEST_USERS = [
  { email: 'test1@haoyu.com', nickname: '测试用户1', role: 'USER', balance: 50000 },
  { email: 'test2@haoyu.com', nickname: '测试用户2', role: 'USER', balance: 30000 },
  { email: 'test3@haoyu.com', nickname: '测试用户3', role: 'USER', balance: 10000 },
  { email: 'admin1@haoyu.com', nickname: '测试管理员', role: 'ADMIN', balance: 100000 },
  { email: 'worker1@haoyu.com', nickname: '测试服务者', role: 'USER', balance: 20000 },
];

async function main() {
  const password = process.env.TEST_USER_PASSWORD || 'Test123456';
  const hashed = await bcrypt.hash(password, 10);

  console.log(`🔧 创建测试账号（密码: ${password}）...\n`);

  for (const u of TEST_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });

    if (existing) {
      // 已存在：更新密码和 isTest 标记
      await prisma.user.update({
        where: { email: u.email },
        data: { password: hashed, isTest: true, role: u.role as any },
      });
      console.log(`  ↻ ${u.email} (${u.nickname}) — 已更新`);
    } else {
      // 新建
      await prisma.user.create({
        data: {
          email: u.email,
          nickname: u.nickname,
          password: hashed,
          role: u.role as any,
          isTest: true,
        },
      });
      console.log(`  ✓ ${u.email} (${u.nickname}) — 已创建`);
    }

    // 确保有钱包
    const walletExists = await prisma.wallet.findFirst({
      where: { userId: (await prisma.user.findUnique({ where: { email: u.email }, select: { id: true } }))!.id },
    });
    if (!walletExists) {
      const userId = (await prisma.user.findUnique({ where: { email: u.email }, select: { id: true } }))!.id;
      await prisma.wallet.create({
        data: {
          userId,
          code: `WALLET_${u.email}`,
          available: u.balance,
          frozen: 0,
          currency: 'CNY',
        },
      });
      console.log(`    💰 钱包已创建 (${(u.balance / 100).toFixed(2)} 元)`);
    }
  }

  // 统计
  const count = await prisma.user.count({ where: { isTest: true } });
  console.log(`\n✅ 完成！共 ${count} 个测试账号`);
}

main()
  .catch((e) => {
    console.error('❌ Seed 失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
