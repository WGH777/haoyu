import { SetMetadata } from '@nestjs/common';

export const DUAL_SIGN_KEY = 'requireDualSign';

/**
 * 标记端点需要双签确认
 * — 第二位管理员必须通过 POST /admin/dual-sign/approve 批准
 * — 请求携带 X-Dual-Sign: <token>
 */
export const RequireDualSign = () => SetMetadata(DUAL_SIGN_KEY, true);
