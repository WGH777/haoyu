// apps/backend/src/auth/guards/login-throttle.guard.ts
// ✅ 基于内存的登录限流守卫（无持久化，无数据库依赖）

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

// ======================= 配置常量 =======================
const IP_WINDOW_MS = 15 * 60 * 1000; // 15 分钟窗口
const IP_MAX_REQUESTS = 10; // 同一 IP 最多 10 次登录请求 / 窗口

const EMAIL_WINDOW_MS = 15 * 60 * 1000; // 15 分钟窗口
const EMAIL_MAX_FAILS = 5; // 同一 email 最多 5 次失败 / 窗口

// ======================= 内存状态 =======================
// 模块级 Map（单例，所有 guard 实例共享），进程重启后自动重置

interface IpRecord {
  count: number;
  windowStart: number;
}

interface EmailFailRecord {
  count: number;
  windowStart: number;
}

const ipRequestMap = new Map<string, IpRecord>();
const emailFailMap = new Map<string, EmailFailRecord>();

// 定期清理过期记录（每 60 秒）
const CLEANUP_INTERVAL_MS = 60_000;
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of ipRequestMap) {
    if (now - rec.windowStart >= IP_WINDOW_MS) ipRequestMap.delete(key);
  }
  for (const [key, rec] of emailFailMap) {
    if (now - rec.windowStart >= EMAIL_WINDOW_MS) emailFailMap.delete(key);
  }
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref(); // 不阻止进程退出

// ======================= Guard =======================

@Injectable()
export class LoginThrottleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const email: string | undefined = request.body?.email;

    const now = Date.now();

    // ----- 1. IP 请求数限流 -----
    // 不管成功失败，同一 IP 在窗口内不能超过 IP_MAX_REQUESTS 次登录请求
    let ipRec = ipRequestMap.get(ip);
    if (!ipRec || now - ipRec.windowStart >= IP_WINDOW_MS) {
      ipRec = { count: 1, windowStart: now };
      ipRequestMap.set(ip, ipRec);
    } else {
      ipRec.count++;
      if (ipRec.count > IP_MAX_REQUESTS) {
        console.warn(
          `[LoginThrottleGuard] IP ${ip} login rate exceeded: ${ipRec.count}/${IP_MAX_REQUESTS}`,
        );
        throw new HttpException(
          '登录请求过于频繁，请稍后再试',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // ----- 2. Email 失败次数限流 -----
    // 检查该 email 在窗口内是否已累计 5 次失败
    if (email && typeof email === 'string') {
      const emailRec = emailFailMap.get(email);
      if (emailRec && now - emailRec.windowStart < EMAIL_WINDOW_MS) {
        if (emailRec.count >= EMAIL_MAX_FAILS) {
          console.warn(
            `[LoginThrottleGuard] Email ${email.slice(0, 3)}*** login failures exceeded: ${emailRec.count}/${EMAIL_MAX_FAILS}`,
          );
          throw new HttpException(
            '登录请求过于频繁，请稍后再试',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }
    }

    return true;
  }

  // ======================= 外部可控方法 =======================

  /** 登录成功后清除该 email 失败记录 */
  static clearEmailFails(email: string): void {
    emailFailMap.delete(email);
  }

  /** 登录失败后记录该 email 失败 */
  static recordEmailFail(email: string): void {
    const now = Date.now();
    let rec = emailFailMap.get(email);
    if (!rec || now - rec.windowStart >= EMAIL_WINDOW_MS) {
      rec = { count: 1, windowStart: now };
    } else {
      rec.count++;
    }
    emailFailMap.set(email, rec);
  }

  /** 登录成功后清除该 IP 的请求计数（可选，让用户可继续正常操作） */
  static clearIp(ip: string): void {
    ipRequestMap.delete(ip);
  }

  /** 获取 IP 来源 */
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-real-ip'] as string) ||
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.ip ||
      'unknown'
    );
  }
}
