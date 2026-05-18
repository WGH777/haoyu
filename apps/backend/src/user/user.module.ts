import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BanGuard } from './ban.guard';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, BanGuard],
  // 导出 UserService + BanGuard，方便其它模块复用
  exports: [UserService, BanGuard],
})
export class UserModule {}
