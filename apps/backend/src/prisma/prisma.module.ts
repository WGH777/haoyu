import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  // ❗ 必须导出，否则其他模块不能使用 PrismaService
  exports: [PrismaService],
})
export class PrismaModule {}
