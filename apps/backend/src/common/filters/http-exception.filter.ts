import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 默认值：500
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = '服务器开小差了，请稍后重试';
    let errorName = 'InternalServerError';

    // 如果是 HttpException（我们主动抛出的，比如 UnauthorizedException / BadRequestException）
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();

      // Nest 内部可能返回 string | { message: string | string[]; ... }
      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const res: any = responseBody;
        if (Array.isArray(res.message)) {
          // class-validator 可能返回 message 数组
          message = res.message.join('; ');
        } else if (res.message) {
          message = res.message;
        } else {
          message = res;
        }

        if (res.error) {
          errorName = res.error;
        }
      }

      errorName = exception.name || errorName;
    } else if (exception instanceof Error) {
      // 未捕获普通 Error
      message = exception.message || message;
      errorName = exception.name || errorName;
    }

    const errorResponse = {
      statusCode: status,
      error: errorName,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // 控制台结构化日志，方便排查
    // eslint-disable-next-line no-console
    console.error('[HttpExceptionFilter]', {
      status,
      error: errorName,
      message,
      path: request.url,
      method: request.method,
    });

    response.status(status).json(errorResponse);
  }
}
