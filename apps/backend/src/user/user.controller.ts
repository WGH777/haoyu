import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminAuditService } from '../admin/admin-audit.service';

type RoleStr = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
const ROLE_ALLOWLIST: RoleStr[] = ['USER', 'ADMIN', 'SUPER_ADMIN'];

@ApiTags('用户管理')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly audit: AdminAuditService,
  ) {}

  /**
   * （超级管理员）创建用户
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '（超级管理员）创建用户' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  /**
   * 当前登录用户的个人信息
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前登录用户的个人信息' })
  async getProfile(@Req() req: any) {
    const userId = req.user.id;
    const [profile, credit] = await Promise.all([
      this.userService.findById(userId),
      this.userService.getCreditStats(userId),
    ]);
    return { ...profile, credit };
  }

  /**
   * 当前登录用户修改自己的个人资料（昵称 / 简介）
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '当前用户修改自己的资料（昵称/简介）' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const userId = req.user.id;
    return this.userService.updateProfile(userId, dto);
  }

  /**
   * （管理员）查询所有用户
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '（管理员）获取用户列表' })
  findAll() {
    return this.userService.findAll();
  }

  /**
   * （管理员）查看指定用户详情
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get(':id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @ApiOperation({ summary: '（管理员）查看用户详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findById(id);
  }

  /**
   * （管理员）更新指定用户（例如封号、改邮箱等）
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @ApiOperation({ summary: '（管理员）更新用户信息' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  /**
   * Phase 2: 余额操作已迁移至 WalletService
   * 此接口暂时禁用，Phase 3 通过 WalletService 重新实现
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id/balance')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @ApiOperation({ summary: '（已废弃）直接修改用户余额 — 请使用 Wallet API' })
  updateBalance(
    @Param('id', ParseIntPipe) _id: number,
    @Body() _body: { amount: number },
  ) {
    throw new BadRequestException(
      '余额操作已迁移至 WalletService。请使用 POST /wallet/deposit 充值。',
    );
  }

  /**
   * ★ 修改用户角色（仅 SUPER_ADMIN）
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch(':id/role')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
          example: 'ADMIN',
        },
      },
      required: ['role'],
    },
  })
  @ApiOperation({ summary: '（超级管理员）修改用户角色' })
  async changeRole(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { role: RoleStr },
  ) {
    if (!body?.role || !ROLE_ALLOWLIST.includes(body.role)) {
      throw new BadRequestException(
        `role 非法，可选值：${ROLE_ALLOWLIST.join(', ')}`,
      );
    }
    await this.audit.log({ adminId: req.user.id, action: 'CHANGE_ROLE', targetType: 'USER', targetId: id, detail: `role=${body.role}` }).catch(() => {});
    return this.userService.update(id, { role: body.role } as any);
  }

  /**
   * ★ 超级管理员重置指定用户密码（无需旧密码）
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch(':id/reset-password')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newPassword: {
          type: 'string',
          example: 'ResetPassword123!',
          description: '要设置的新密码',
        },
      },
      required: ['newPassword'],
    },
  })
  @ApiOperation({ summary: '（超级管理员）重置用户密码' })
  async resetPasswordByAdmin(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPassword: string },
  ) {
    await this.userService.adminResetPassword(id, body.newPassword);
    await this.audit.log({ adminId: req.user.id, action: 'RESET_PASSWORD', targetType: 'USER', targetId: id }).catch(() => {});
    return { message: '密码已重置' };
  }

  /**
   * （管理员）审核服务者认证
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: '（管理员）审核服务者认证' })
  async verifyUser(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { verified: boolean; certLevel?: string },
  ) {
    const result = await this.userService.verify(id, body.verified, body.certLevel || 'BASIC');
    await this.audit.log({ adminId: req.user.id, action: 'VERIFY_USER', targetType: 'USER', targetId: id, detail: `verified=${body.verified} level=${body.certLevel}` }).catch(() => {});
    return result;
  }

  /** 用户自助申请认证 */
  @UseGuards(JwtAuthGuard)
  @Patch('verify-request')
  @ApiBearerAuth()
  async requestVerify(@Req() req: any) {
    return this.userService.requestVerify(req.user.id);
  }

  /**
   * （超级管理员）删除用户
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @ApiOperation({ summary: '（超级管理员）删除用户' })
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const result = this.userService.remove(id);
    this.audit.log({ adminId: req.user.id, action: 'DELETE_USER', targetType: 'USER', targetId: id }).catch(() => {});
    return result;
  }

  /**
   * （超级管理员）封禁用户
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch(':id/ban')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: '违规发布' } } } })
  @ApiOperation({ summary: '（超级管理员）封禁用户' })
  async banUser(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { reason?: string },
  ) {
    const result = await this.userService.ban(id, body?.reason);
    this.audit.log({ adminId: req.user.id, action: 'BAN_USER', targetType: 'USER', targetId: id, detail: body?.reason }).catch(() => {});
    return result;
  }

  /**
   * （超级管理员）解封用户
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch(':id/unban')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @ApiOperation({ summary: '（超级管理员）解封用户' })
  async unbanUser(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const result = await this.userService.unban(id);
    this.audit.log({ adminId: req.user.id, action: 'UNBAN_USER', targetType: 'USER', targetId: id }).catch(() => {});
    return result;
  }
}