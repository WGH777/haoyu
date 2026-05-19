import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomBytes } from 'crypto';

export interface PendingApproval {
  requestId: string;
  operation: string;
  targetType: string;
  targetId: number;
  detail: string;
  requesterId: number;
  createdAt: number;
}

/**
 * 管理员双签服务
 * - 关键操作（封禁/解封/删用户/改角色/重置密码）需要两名管理员确认
 * - 第一人发起 → 第二人批准 → 生成一次性 token → 第一人携带 token 完成操作
 */
@Injectable()
export class DualSignService {
  /** 内存存储（生产可换 Redis/DB），TTL 5 分钟 */
  private pending = new Map<string, PendingApproval>();
  private approvedTokens = new Map<string, { requestId: string; expiresAt: number }>();

  /** 发起双签请求 */
  requestApproval(
    requesterId: number,
    operation: string,
    targetType: string,
    targetId: number,
    detail = '',
  ): { requestId: string; message: string } {
    const requestId = `ds-${Date.now()}-${randomBytes(3).toString('hex')}`;
    this.pending.set(requestId, {
      requestId,
      operation,
      targetType,
      targetId,
      detail,
      requesterId,
      createdAt: Date.now(),
    });

    return {
      requestId,
      message: `[双签] 管理员 #${requesterId} 请求 ${operation}(${targetType}#${targetId})，等待第二人批准`,
    };
  }

  /** 第二人批准，返回一次性 token */
  approve(approverId: number, requestId: string): { token: string; message: string } {
    const pending = this.pending.get(requestId);
    if (!pending) {
      throw new BadRequestException('双签请求不存在或已过期');
    }

    if (pending.requesterId === approverId) {
      throw new ForbiddenException('不能自己批准自己的操作，需要另一位管理员');
    }

    // 检查是否在 5 分钟内
    if (Date.now() - pending.createdAt > 5 * 60 * 1000) {
      this.pending.delete(requestId);
      throw new BadRequestException('双签请求已过期（5分钟）');
    }

    const token = `ds-tok-${randomBytes(16).toString('hex')}`;
    this.approvedTokens.set(token, {
      requestId,
      expiresAt: Date.now() + 3 * 60 * 1000, // token 3分钟有效
    });

    this.pending.delete(requestId);

    return {
      token,
      message: `✅ 已批准: ${pending.operation}(${pending.targetType}#${pending.targetId})，token 3分钟内有效`,
    };
  }

  /** 验证双签 token，消费后销毁 */
  verifyToken(token: string): boolean {
    const record = this.approvedTokens.get(token);
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
      this.approvedTokens.delete(token);
      return false;
    }

    // 一次性使用，消费即销毁
    this.approvedTokens.delete(token);
    return true;
  }

  /** 列出待批准的双签请求 */
  listPending(): PendingApproval[] {
    // 清理过期
    const now = Date.now();
    for (const [id, p] of this.pending) {
      if (now - p.createdAt > 5 * 60 * 1000) {
        this.pending.delete(id);
      }
    }
    return Array.from(this.pending.values());
  }
}
