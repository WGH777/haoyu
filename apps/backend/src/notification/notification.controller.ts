import { Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('通知中心')
@Controller('notification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '我的通知列表' })
  findMine(@Req() req: any) {
    return this.notificationService.findByUser(req.user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '未读通知数' })
  unreadCount(@Req() req: any) {
    return this.notificationService.unreadCount(req.user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: '标记单条已读' })
  markRead(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notificationService.markRead(id, req.user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: '全部标记已读' })
  markAllRead(@Req() req: any) {
    return this.notificationService.markAllRead(req.user.id);
  }
}
