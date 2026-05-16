import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('订单留言')
@Controller('comment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: '发送留言' })
  create(@Body() body: { orderId: number; content: string }, @Req() req: any) {
    return this.commentService.addComment(body.orderId, req.user.id, body.content);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: '获取订单留言列表' })
  findByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.commentService.getComments(orderId);
  }
}
