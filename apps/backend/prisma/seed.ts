import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  console.log(`🌱 开始执行 Seed (环境: ${process.env.NODE_ENV || 'dev'})...`);

  // 1. 获取环境变量配置 (如果没有配置，则用默认值方便本地开发)
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'boss@haoyu.com';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || '123456';

  // 2. 创建/更新超级管理员 (幂等操作)
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { 
      role: 'SUPER_ADMIN', // 强制纠正权限
      password: hashedPassword // 允许通过环境变量重置密码
    },
    create: {
      email: adminEmail,
      nickname: '超级管理员',
      password: hashedPassword,
      role: 'SUPER_ADMIN', // 👑 唯一的皇冠
      balance: 9999999,
    },
  });
  console.log(`👑 超级管理员已就绪: ${superAdmin.email}`);

  // 3. (仅开发环境) 清空数据并创建测试号
  if (!isProduction) {
    // 这里可以放你之前的清空逻辑和 worker@test.com 的创建逻辑
    // 为了篇幅简洁，这里暂时省略，重点是上面的超级管理员
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