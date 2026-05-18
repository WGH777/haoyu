// apps/backend/src/wallet/wallet.controller.ts
// Phase 2: WalletController 重构 — 适配新 WalletService

import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BanGuard } from '../user/ban.guard';
import { RequireConfirmation } from '../auth/decorators/require-confirmation.decorator';

@ApiTags('钱包中心')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /** 获取我的钱包 */
  @Get()
  @ApiOperation({ summary: '获取当前用户钱包（默认 CNY）' })
  async getMyWallet(@Req() req: any) {
    const wallet = await this.walletService.getWallet(req.user.id);
    return {
      ...wallet,
      total: wallet.available + wallet.frozen,
    };
  }

  /** 获取账本流水 */
  @Get('ledger')
  @ApiOperation({ summary: '获取钱包账本流水（LedgerEntry）' })
  async getLedger(@Req() req: any) {
    const wallet = await this.walletService.getWallet(req.user.id);
    return this.walletService.getLedger(wallet.id);
  }

  /** 充值（模拟，单位：分） */
  @Post('deposit')
  @UseGuards(BanGuard)
  @ApiOperation({ summary: '充值（模拟）- amount 单位：分' })
  async deposit(@Req() req: any, @Body() body: { amount: number }) {
    const wallet = await this.walletService.getWallet(req.user.id);
    return this.walletService.deposit(wallet.id, body.amount);
  }

  /** 提现（模拟） */
  @Post('withdraw')
  @UseGuards(BanGuard)
  @RequireConfirmation()
  @ApiOperation({ summary: '提现（模拟）- amount 单位：分' })
  async withdraw(@Req() req: any, @Body() body: { amount: number }) {
    const wallet = await this.walletService.getWallet(req.user.id);
    return this.walletService.withdraw(wallet.id, body.amount);
  }
}
