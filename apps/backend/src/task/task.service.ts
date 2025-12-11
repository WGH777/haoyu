import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  // 创建任务 (带事务扣款)
  async create(userId: number, createTaskDto: CreateTaskDto) {
    // 1. 解构数据：注意这里使用的是 price 而不是 reward
    // 如果 DTO 里还没有 serviceFee，这里默认取 0，防止报错
    const { title, description, price, serviceFee } = createTaskDto as any; 

    // 计算总扣款金额 = 赏金 + 服务费
    const finalServiceFee = serviceFee || 0;
    const totalCost = price + finalServiceFee;

    return this.prisma.$transaction(async (tx:any) => {
      // 2. 检查余额
      const user = await tx.user.findUnique({ where: { id: userId } });
      
      if (!user || user.balance < totalCost) {
        throw new BadRequestException(
          `余额不足，当前: ${user?.balance || 0}，需要: ${totalCost} (含服务费 ${finalServiceFee})`
        );
      }

      // 3. 扣款 (扣除 总金额)
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalCost } },
      });

      // 4. 记账 (记录流水)
      await tx.transaction.create({
        data: {
          amount: -totalCost, // 记录负数
          type: 'PUBLISH',
          status: 'SUCCESS',
          userId: userId,
        },
      });

      // 5. 创建任务到数据库
      return tx.task.create({
        data: {
          title,
          description,
          price: price,          // ✅ 对应数据库的 price 字段
          serviceFee: finalServiceFee, // ✅ 对应数据库的 serviceFee 字段
          publisherId: userId,
          status: 'PENDING',
        },
      });
    });
  }

  // 查询所有
  async findAll() {
    return this.prisma.task.findMany({
      include: { 
        publisher: { 
          select: { nickname: true, email: true, id: true } 
        } 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 查询单个
  async findOne(id: number) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        publisher: { select: { nickname: true, email: true } }
      }
    });
  }

  // 查询我发布的
  async findCreatedBy(userId: number) {
    return this.prisma.task.findMany({
      where: { publisherId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 查询我参与的 (通过 Order 表关联查询)
  async findAssignedTo(userId: number) {
    return this.prisma.order.findMany({
      where: { workerId: userId },
      include: { 
        task: true, // 包含任务详情
        worker: { select: { nickname: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 更新任务
  async update(id: number, updateTaskDto: UpdateTaskDto) {
    // 注意：updateTaskDto 里的字段也需要确保没有 reward，改为 price
    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto as any, // 临时规避类型检查，建议去修改 UpdateTaskDto
    });
  }

  // 删除任务
  async remove(id: number) {
    return this.prisma.task.delete({ where: { id } });
  }

  // 🔥 兼容性补丁：引导旧接口报错
  async assignTask(taskId: number, userId: number) {
    throw new BadRequestException('接口已升级，请使用 POST /order 进行抢单');
  }

  async completeTask(taskId: number, userId: number) {
    throw new BadRequestException('接口已升级，请使用 POST /order/:id/complete 接口结算');
  }
}