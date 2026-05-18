// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfirmationGuard } from './auth/guards/confirmation.guard';
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
import { CommentModule } from './comment/comment.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    // 限流：全局 60秒内最多100次请求
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
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
    SchedulerModule,
    CommentModule,

    // =========================
    // 平台治理模块（RBAC / 仲裁 / 审计）
    // =========================
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ConfirmationGuard },
  ],
})
export class AppModule {}
