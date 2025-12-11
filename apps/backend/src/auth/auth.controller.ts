import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

// 新增：DTO
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';

// Swagger 装饰器
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('认证与登录')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 登录
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: '用户登录', description: '使用邮箱和密码登录系统' })
  @ApiBody({ type: LoginDto })
  async signIn(@Body() dto: LoginDto) {
    const { email, password } = dto;
    return this.authService.signIn(email, password);
  }

  /**
   * 注册（公开接口）
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册', description: '创建一个普通用户账号' })
  @ApiBody({ type: RegisterDto })
  async signUp(@Body() dto: RegisterDto) {
    const { email, password, nickname } = dto;
    return this.authService.signUp(email, password, nickname || '新用户');
  }

  /**
   * 当前登录用户修改自己的密码
   */
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '当前用户修改自己的密码',
    description: '需要提供旧密码和新密码',
  })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const userId = req.user?.id;
    await this.authService.changePassword(
      userId,
      dto.oldPassword,
      dto.newPassword,
    );
    return { message: '密码修改成功，请使用新密码重新登录' };
  }

  /**
   * 超级管理员重置任意用户密码
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch('admin/reset-password/:userId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '超级管理员重置用户密码',
    description: '无需旧密码，直接为指定用户设置新密码',
  })
  @ApiParam({
    name: 'userId',
    description: '目标用户的 ID',
    type: Number,
  })
  @ApiBody({ type: AdminResetPasswordDto })
  async adminResetPassword(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: AdminResetPasswordDto,
  ) {
    await this.authService.resetPasswordByAdmin(userId, dto.newPassword);
    return { message: '密码已重置' };
  }
}
