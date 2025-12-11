// 路径：backend/src/common/interceptors/transform.interceptor.ts

import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  
  export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
  }
  
  @Injectable()
  export class TransformInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>>
  {
    intercept(
      _context: ExecutionContext,
      next: CallHandler,
    ): Observable<ApiResponse<T>> {
      return next.handle().pipe(
        map((data: any) => {
          // 已经是 { code, data } 结构就不再包一层
          if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
            return data;
          }
  
          return {
            code: 0,
            message: 'OK',
            data,
          };
        }),
      );
    }
  }
  