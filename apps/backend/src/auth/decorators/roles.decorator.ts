// apps/backend/src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

/**
 * 在控制器/方法上使用：
 *  @Roles('SUPER_ADMIN')
 *  @Roles('ADMIN', 'SUPER_ADMIN')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
