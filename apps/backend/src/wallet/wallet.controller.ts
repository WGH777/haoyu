import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepositDto } from './dto/deposit.dto';

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  getBalance(@Req() req: any) {
    return this.walletService.getBalance(req.user.id);
  }

  @Get('transactions')
  getTransactions(@Req() req: any) {
    // 🔥 修正：使用 Service 中正确的函数名
    return this.walletService.getMyTransactions(req.user.id);
  }

  @Post('deposit')
  deposit(@Req() req: any, @Body() depositDto: DepositDto) {
    const amount = depositDto.amount; 
    return this.walletService.deposit(req.user.id, amount);
  }
}