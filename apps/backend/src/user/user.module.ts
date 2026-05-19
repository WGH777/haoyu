import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { BanGuard } from './ban.guard';

@Module({
  imports: [PrismaModule, AdminModule, forwardRef(() => AuthModule)],
  controllers: [UserController],
  providers: [UserService, BanGuard],
  // 导出 UserService + BanGuard，方便其它模块复用
  exports: [UserService, BanGuard],
})
export class UserModule {}
