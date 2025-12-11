import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. 获取仪表盘数据 (接收 userId 进行实时验证)
  async getDashboardStats(userId: number) {
    // --- 第一步：先去数据库核实身份 ---
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // 如果找不到人，或者不是管理员，直接报错
    if (!user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('您不是管理员，无权查看核心数据');
    }

    // --- 第二步：身份核实通过，开始统计 ---
    
    // 1. 统计人头
    const totalUsers = await this.prisma.user.count();

    // 2. 统计任务
    const totalTasks = await this.prisma.task.count();
    const completedTasks = await this.prisma.task.count({
      where: { status: 'COMPLETED' },
    });

    // 3. 统计平台收入
    const moneyFlow = await this.prisma.transaction.aggregate({
      where: {
        type: { in: ['PAYMENT', 'INCOME'] },
      },
      _sum: {
        amount: true,
      },
    });

    const netProfit = Math.abs(moneyFlow._sum.amount || 0);

    return {
      users: { total: totalUsers },
      tasks: { total: totalTasks, completed: completedTasks },
      finance: { 
        revenue: netProfit, // 利润
        currency: 'CNY (分)' 
      },
      generatedAt: new Date(),
    };
  }

  // 2. 晋升管理员
  async promoteToAdmin(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
    });
  }
}