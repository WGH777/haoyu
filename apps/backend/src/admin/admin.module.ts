import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module'; // 引入数据库模块

@Module({
  imports: [PrismaModule], // 发钥匙
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}