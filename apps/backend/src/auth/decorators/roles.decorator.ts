// apps/backend/src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * 统一 RBAC Role 类型：所有地方都 import 这个 Role
 */
export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
