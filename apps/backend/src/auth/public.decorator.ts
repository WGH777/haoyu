import { SetMetadata } from '@nestjs/common';

// 定义一个 Key，用来标记“这是个公共接口”
export const IS_PUBLIC_KEY = 'isPublic';

// 导出 @Public() 装饰器
// 以后只要在接口上写 @Public()，NestJS 就知道这个接口不需要查 Token
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);