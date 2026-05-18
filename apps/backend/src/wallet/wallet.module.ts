import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BanGuard } from '../user/ban.guard';

@Module({
  imports: [PrismaModule],
  controllers: [WalletController], // 这里加载你 12.txt 里的 Controller
  providers: [WalletService, BanGuard],      // 这里加载我提供的 Service
  exports: [WalletService],        // 导出 Service 给 Task/Order 模块扣款用
})
export class WalletModule {}