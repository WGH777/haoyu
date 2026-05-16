// apps/backend/src/app.module.ts
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
import { NotificationModule } from './notification/notification.module';
import { DisputeModule } from './dispute/dispute.module';

@Module({
  imports: [
    // =========================
    // 基础设施层
    // =========================
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,

    // =========================
    // 核心业务模块
    // =========================
    AuthModule,
    UserModule,
    TaskModule,
    OrderModule,
    WalletModule,
    NotificationModule,
    DisputeModule,

    // =========================
    // 平台治理模块（RBAC / 仲裁 / 审计）
    // =========================
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
