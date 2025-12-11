import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TaskModule } from './task/task.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';

// 🔥 核心修复：导入 OrderModule
import { OrderModule } from './order/order.module'; 

@Module({
  imports: [
    UserModule,
    TaskModule,
    AuthModule,
    // 🔥 核心修复：把 OrderModule 加到这里
    OrderModule, 
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}