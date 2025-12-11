import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
// 🔥 1. 引入 PrismaModule
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  // 🔥 2. 在这里注册 PrismaModule，这样 TaskService 才能用数据库
  imports: [PrismaModule], 
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}