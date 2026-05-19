// apps/backend/src/admin/admin.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuditService } from './admin-audit.service';
import { AuthModule } from '../auth/auth.module';

/**
 * 管理员治理模块
 * - 管理员只读监控
 * - 管理员强制干预（仲裁）
 * - 管理员行为审计（RBAC 第 6 步）
 */
@Module({
  imports: [
    PrismaModule, // 提供 PrismaService（事务、查询、审计写入）
    forwardRef(() => AuthModule), // DualSignService
  ],
  controllers: [
    AdminController,
  ],
  providers: [
    AdminAuditService, // ✅ 显式注册，避免 DI 隐患
  ],
  exports: [
    AdminAuditService, // ✅ 未来若其它模块需要审计能力，可直接复用
  ],
})
export class AdminModule {}
