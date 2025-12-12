import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('钱包中心')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('transactions')
  @ApiOperation({ summary: '获取当前用户的交易流水（最近 50 条）' })
  getTransactions(@Req() req: any) {
    return this.walletService.getTransactions(req.user.id);
  }

  @Post('deposit')
  @ApiOperation({ summary: '充值（模拟）' })
  deposit(@Req() req: any, @Body() body: { amount: number }) {
    // amount 单位：分（前端已乘以 100）
    return this.walletService.deposit(req.user.id, body.amount);
  }

  @Post('withdraw')
  @ApiOperation({ summary: '提现（模拟）' })
  withdraw(@Req() req: any, @Body() body: { amount: number }) {
    // amount 单位：分（前端已乘以 100）
    return this.walletService.withdraw(req.user.id, body.amount);
  }
}
