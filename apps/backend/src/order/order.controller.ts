import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('订单管理')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '抢单（创建订单）' })
  create(@Body() body: { taskId: number }, @Req() req: any) {
    const workerId = req.user.id;
    return this.orderService.create(workerId, body.taskId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询我抢到的订单' })
  findMyOrders(@Req() req: any) {
    return this.orderService.findMyOrders(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  @ApiBearerAuth()
  @ApiOperation({ summary: '完成订单（结算赏金）' })
  complete(@Param('id') id: string, @Req() req: any) {
    return this.orderService.complete(+id, req.user.id);
  }
}