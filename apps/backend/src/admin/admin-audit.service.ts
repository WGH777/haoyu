// apps/backend/src/admin/admin-audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AdminAuditAction =
  | 'FORCE_CANCEL_TASK'
  | 'FORCE_COMPLETE_ORDER'
  | 'FORCE_REJECT_ORDER'
  | string;

export type AdminAuditTargetType = 'TASK' | 'ORDER' | 'USER' | 'TRANSACTION' | string;

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    adminId: number;
    action: AdminAuditAction;
    targetType: AdminAuditTargetType;
    targetId?: number | null;
    reason?: string | null;
    detail?: any; // 会被 JSON.stringify
  }) {
    const { adminId, action, targetType, targetId, reason, detail } = params;

    return this.prisma.adminActionLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId: targetId ?? null,
        reason: reason ?? null,
        detailJson: detail === undefined ? null : JSON.stringify(detail),
      },
    });
  }
}
