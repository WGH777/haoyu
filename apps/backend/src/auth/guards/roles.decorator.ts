// 路径：src/auth/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * 声明该接口需要哪些角色才能访问
 * 用法示例：
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('SUPER_ADMIN')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
