import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common'
import { OrderService } from './order.service'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateOrderDto } from './dto/create-order.dto'
import { SubmitResultDto } from './dto/submit-result.dto'
import { CompleteOrderDto } from './dto/complete-order.dto'

@ApiTags('订单与任务流转')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '抢单/创建订单' })
  @ApiBody({ type: CreateOrderDto })
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.orderService.create(req.user.id, dto.taskId)
  }

  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '提交任务成果' })
  @ApiParam({ name: 'id', description: '订单 ID', type: Number })
  @ApiBody({ type: SubmitResultDto })
  submit(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: SubmitResultDto,
    @Req() req: any,
  ) {
    return this.orderService.submitResult(orderId, req.user.id, dto)
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '验收任务成果并结算 (由发布者调用)' })
  @ApiParam({ name: 'id', description: '订单 ID', type: Number })
  @ApiBody({ type: CompleteOrderDto })
  complete(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CompleteOrderDto,
    @Req() req: any,
  ) {
    return this.orderService.completeOrder(orderId, req.user.id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的所有订单/任务 (我接取的)' })
  findMyOrders(@Req() req: any) {
    return this.orderService.findMyOrders(req.user.id)
  }

  /**
   * 获取指定 Task 的订单详情（用于验收/成果展示）
   */
  @UseGuards(JwtAuthGuard)
  @Get('task/detail/:taskId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取指定 Task 的订单详情（用于验收/成果展示）',
  })
  @ApiParam({ name: 'taskId', description: '任务 ID', type: Number })
  findTaskOrder(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: any,
  ) {
    return this.orderService.findOrderByTaskId(taskId, req.user.id)
  }

  /**
   * Worker 端：查询自己针对某个任务的订单状态
   */
  @UseGuards(JwtAuthGuard)
  @Get('task/:taskId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取当前用户针对某个任务的订单状态 (仅供 Worker)',
  })
  @ApiParam({ name: 'taskId', description: '任务 ID', type: Number })
  findMyOrderForTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: any,
  ) {
    return this.orderService.findMyOrderForTask(taskId, req.user.id)
  }
}
