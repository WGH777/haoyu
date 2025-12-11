import { Controller, Get, Post, Body, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
// 👇 检查路径，如果报错把 /guards 删掉
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    console.log('📝 抢单请求 - User:', req.user);
    console.log('📝 抢单请求 - Body:', createOrderDto);

    // 1. 获取当前抢单的用户 ID
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('无法识别用户身份');
    }

    // 2. 传给 Service (注意：这里假设前端传的是 { taskId: 1 })
    return this.orderService.create(+userId, createOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.orderService.findAll(+userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  // 结算任务 (完成任务)
  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  complete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.orderService.complete(+userId, +id);
  }
}