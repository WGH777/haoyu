import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PrismaModule } from '../prisma/prisma.module'; // 关键点：引入 Prisma 模块

@Module({
  imports: [PrismaModule], // 关键点：在这里注册，告诉系统我要用数据库
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}