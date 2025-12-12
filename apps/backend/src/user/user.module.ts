import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
  // 导出 UserService，方便其它模块（例如 AuthModule / Admin 模块）复用
  exports: [UserService],
})
export class UserModule {}
