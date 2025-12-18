// apps/backend/src/auth/auth.controller.ts
import {
  BadRequestException,
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
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  AdminResetPasswordDto,
} from './dto/auth.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('认证与登录')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({ type: LoginDto })
  async signIn(@Body() dto: LoginDto) {
    if (!dto || !dto.email || !dto.password) {
      throw new BadRequestException('email/password required');
    }
    return this.authService.signIn(dto.email, dto.password);
  }

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ type: RegisterDto })
  async signUp(@Body() dto: RegisterDto) {
    if (!dto || !dto.email || !dto.password) {
      throw new BadRequestException('email/password required');
    }
    return this.authService.signUp(dto.email, dto.password, dto.nickname || '新用户');
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: '使用 refreshToken 换取新的 accessToken（并轮换 refreshToken）' })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(@Body() dto: RefreshTokenDto) {
    if (!dto || !dto.refreshToken) {
      throw new BadRequestException('refreshToken is required');
    }
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: '当前用户修改自己的密码' })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(req.user.id, dto.oldPassword, dto.newPassword);
    return { message: '密码修改成功，请重新登录' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch('admin/reset-password/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '超级管理员重置用户密码' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiBody({ type: AdminResetPasswordDto })
  async adminResetPassword(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: AdminResetPasswordDto,
  ) {
    await this.authService.resetPasswordByAdmin(userId, dto.newPassword);
    return { message: '密码已重置' };
  }
}
