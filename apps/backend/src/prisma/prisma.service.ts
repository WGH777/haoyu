import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** 默认事务选项：SQLite 写锁下防止超时 */
const DEFAULT_TX_OPTS = { timeout: 15000, maxWait: 10000 };

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** 带默认超时的事务包装 */
  async $tx<T>(fn: Parameters<PrismaClient['$transaction']>[0]): Promise<T> {
    return (this.$transaction as any)(fn, DEFAULT_TX_OPTS) as Promise<T>;
  }
}
