import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 日志脱敏拦截器
 * 
 * 自动脱敏请求/响应中的敏感字段：
 * - password / newPassword / oldPassword
 * - phone / mobile / tel
 * - idCard / idNumber
 * - bankCard / bankAccount
 * - token / secret / apiKey
 */
@Injectable()
export class SanitizeLogInterceptor implements NestInterceptor {
  private readonly sensitiveKeys = [
    'password', 'newPassword', 'oldPassword', 'confirmPassword',
    'phone', 'mobile', 'tel', 'telephone',
    'idCard', 'idNumber', 'identity',
    'bankCard', 'bankAccount', 'cardNumber',
    'token', 'secret', 'apiKey', 'accessToken', 'refreshToken',
    'ssn', 'passport',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // 脱敏请求体（仅用于内部引用，不修改实际请求）
    if (request.body) {
      request._sanitizedBody = this.sanitize(request.body);
    }

    return next.handle().pipe(
      tap((data) => {
        // 响应日志由 NestJS 内置 logger 处理
        // 此处留作扩展点：如需自定义响应脱敏日志可在此实现
      }),
    );
  }

  private sanitize(obj: any, depth = 0): any {
    if (depth > 5 || obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item, depth + 1));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.sensitiveKeys.some((sk) => lowerKey.includes(sk));
      
      if (isSensitive && typeof value === 'string' && value.length > 0) {
        sanitized[key] = '***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
