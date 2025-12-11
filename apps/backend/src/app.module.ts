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
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), 
      serveRoot: '/uploads',
    }),

    PrismaModule,
    AuthModule,
    UserModule,
    TaskModule,
    OrderModule,
    WalletModule, // 🔥 核心修复：确保 WalletModule 注册
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}