import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('争议处理')
@Controller('dispute')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @ApiOperation({ summary: '对订单发起争议' })
  create(
    @Body() body: { orderId: number; reason: string; evidence?: string },
    @Req() req: any,
  ) {
    return this.disputeService.create(
      body.orderId,
      req.user.id,
      body.reason,
      body.evidence,
    );
  }

  @Post(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: '管理员裁决争议' })
  resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { result: string },
    @Req() req: any,
  ) {
    return this.disputeService.resolve(
      id,
      req.user.id,
      body.result as any,
      req.user.role,
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '撤回争议（发起人）' })
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.disputeService.cancel(id, req.user.id);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: '查看某订单的争议记录' })
  findByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.disputeService.findByOrder(orderId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: '管理员查看所有争议' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('status') status?: string) {
    return this.disputeService.findAll(status);
  }
}
