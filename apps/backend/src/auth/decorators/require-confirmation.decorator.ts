import { SetMetadata } from '@nestjs/common';

/** 标记端点需要人工确认（AI断点） */
export const REQUIRE_CONFIRMATION_KEY = 'requireConfirmation';
export const RequireConfirmation = () =>
  SetMetadata(REQUIRE_CONFIRMATION_KEY, true);
