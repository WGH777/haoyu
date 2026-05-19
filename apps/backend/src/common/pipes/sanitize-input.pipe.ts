import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

/** 注入攻击特征模式 */
const INJECTION_PATTERNS = [
  // SQL 注入试探
  /(\bUNION\s+SELECT\b)/i,
  /(\bDROP\s+TABLE\b)/i,
  /(\bALTER\s+TABLE\b)/i,
  /(\bINSERT\s+INTO\b)/i,
  /(';\s*(DROP|DELETE|UPDATE|INSERT))/i,
  // Prompt 注入试探
  /(ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|directives?))/i,
  /(system\s*:\s*.*(bypass|override|ignore))/i,
  /(you\s+are\s+now\s+(a\s+)?DAN)/i,
  // XSS 试探
  /<script\b[^>]*>/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*"/i,
  // 路径遍历
  /\.\.\/\.\.\//,
];

/** 需要严格校验的字段（不宽松处理） */
const STRICT_FIELDS = ['email', 'password', 'token', 'refreshToken'];

/** 最大字段长度 */
const MAX_STRING_LENGTH = 10000;

/**
 * 全局输入清洗 Pipe
 * - 检测注入攻击模式
 * - 剥离 HTML 标签
 * - 限制字符串长度
 * - 敏感字段严格校验
 */
@Injectable()
export class SanitizeInputPipe implements PipeTransform {
  transform(value: unknown): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item));
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        // 跳过内部字段
        if (key.startsWith('_')) {
          sanitized[key] = val;
          continue;
        }

        if (typeof val === 'string') {
          sanitized[key] = STRICT_FIELDS.includes(key)
            ? this.validateStrictField(key, val)
            : this.sanitizeString(val);
        } else if (typeof val === 'object') {
          sanitized[key] = this.transform(val);
        } else {
          sanitized[key] = val;
        }
      }
      return sanitized;
    }

    return value;
  }

  private sanitizeString(input: string): string {
    let result = input;

    // 长度限制
    if (result.length > MAX_STRING_LENGTH) {
      throw new BadRequestException(`输入长度不能超过 ${MAX_STRING_LENGTH} 字符`);
    }

    // 注入模式检测
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(result)) {
        throw new BadRequestException('输入包含不安全的模式，已被拦截');
      }
    }

    // 剥离 HTML 标签
    result = result.replace(/<[^>]*>/g, '');

    // 剥离潜在危险字符（但保留正常的标点和中文）
    result = result.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');

    return result.trim();
  }

  private validateStrictField(field: string, value: string): string {
    // 邮箱格式（仅检测危险字符，格式由 class-validator 处理）
    if (field === 'email' && /[<>"'(){}\\[\]]/.test(value)) {
      throw new BadRequestException('邮箱包含非法字符');
    }

    // 密码 / token 不应包含换行或控制字符
    if (['password', 'token', 'refreshToken'].includes(field)) {
      if (/[\n\r\t]/.test(value)) {
        throw new BadRequestException(`${field} 包含非法字符`);
      }
    }

    return value;
  }
}
