import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TaskModule } from './task/task.module';
import { OrderModule } from './order/order.module';
import { WalletModule } from './wallet/wallet.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // 静态文件（任务配图等）对外暴露 /uploads 前缀
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    PrismaModule,
    AuthModule,
    UserModule,
    TaskModule,
    OrderModule,
    WalletModule, // 钱包模块（发布任务扣费、充值提现、流水）
    AdminModule,  // 管理后台模块（任务/用户只读监控）
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
