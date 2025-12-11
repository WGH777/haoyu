import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('钱包中心')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('transactions')
  @ApiOperation({ summary: '获取我的流水' })
  getTransactions(@Req() req: any) {
    return this.walletService.getTransactions(req.user.id);
  }

  @Post('deposit')
  @ApiOperation({ summary: '充值 (模拟)' })
  deposit(@Req() req: any, @Body() body: { amount: number }) {
    return this.walletService.deposit(req.user.id, body.amount);
  }

  @Post('withdraw')
  @ApiOperation({ summary: '提现 (模拟)' })
  withdraw(@Req() req: any, @Body() body: { amount: number }) {
    return this.walletService.withdraw(req.user.id, body.amount);
  }
}