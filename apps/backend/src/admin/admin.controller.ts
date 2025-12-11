import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';

@UseGuards(AuthGuard('jwt'))
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 获取数据
  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    // 把用户 ID 传给 Service，让 Service 去查库验证
    return this.adminService.getDashboardStats(req.user.id);
  }

  // 自我晋升
  @Post('promote-me')
  async promoteMe(@Req() req: any) {
    return this.adminService.promoteToAdmin(req.user.id);
  }
}