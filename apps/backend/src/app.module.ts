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

@Module({
  imports: [
    // 🔥 核心修复：使用 process.cwd() 获取当前运行目录
    // 这样无论你在哪启动项目，都能精准找到 apps/backend/uploads
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), 
      serveRoot: '/uploads',
    }),

    PrismaModule,
    AuthModule,
    UserModule,
    TaskModule,
    OrderModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}