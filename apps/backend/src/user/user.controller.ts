import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
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
    return this.userService.findById(userId);
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
   * （管理员）查询所有用户（支持分页和筛选）
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '（管理员）获取用户列表（分页+筛选）' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认 1' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数，默认 20，最大 100' })
  @ApiQuery({ name: 'email', required: false, description: '按邮箱模糊搜索' })
  @ApiQuery({ name: 'nickname', required: false, description: '按昵称模糊搜索' })
  @ApiQuery({ name: 'role', required: false, description: '按角色筛选：USER | ADMIN | SUPER_ADMIN' })
  @ApiQuery({ name: 'status', required: false, description: '按状态筛选：ACTIVE | SUSPENDED' })
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('email') email?: string,
    @Query('nickname') nickname?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.userService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      email,
      nickname,
      role,
      status,
    });
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
   * ★ 调整用户角色（仅 SUPER_ADMIN）
   * 只允许 USER ↔ ADMIN 之间切换
   * 禁止调整 SUPER_ADMIN，禁止设目标为 SUPER_ADMIN
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch(':id/role')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['role', 'reason'],
      properties: {
        role: {
          type: 'string',
          enum: ['USER', 'ADMIN'],
          example: 'ADMIN',
          description: '目标角色（仅 USER 或 ADMIN）',
        },
        reason: {
          type: 'string',
          example: '该用户经审核具备管理员能力',
          description: '操作原因（必填）',
        },
      },
    },
  })
  @ApiOperation({ summary: '（超级管理员）调整用户角色（仅 USER ↔ ADMIN）' })
  async changeRole(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { role: string; reason: string },
  ) {
    const adminId = Number(req?.user?.id);
    const targetRole = body?.role;
    const reason = (body?.reason || '').trim();

    // 规则 0: reason 必填
    if (!reason) {
      throw new BadRequestException('操作原因不能为空');
    }

    // 规则 1: 仅允许 USER / ADMIN
    if (!targetRole || !['USER', 'ADMIN'].includes(targetRole)) {
      throw new BadRequestException('目标角色仅支持 USER 或 ADMIN，不允许设为 SUPER_ADMIN');
    }

    // 规则 2: 禁止修改自己的角色
    if (adminId === id) {
      throw new ForbiddenException('不能修改自己的角色');
    }

    const result = await this.userService.changeRole(id, targetRole);

    // 审计日志
    await this.audit.log({
      adminId,
      action: 'CHANGE_USER_ROLE',
      targetType: 'USER',
      targetId: id,
      reason,
      detail: {
        fromRole: result.previousRole,
        toRole: targetRole,
      },
    });

    return { message: '角色已更新', userId: id, previousRole: result.previousRole, newRole: targetRole };
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
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPassword: string },
  ) {
    await this.userService.adminResetPassword(id, body.newPassword);
    return { message: '密码已重置' };
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
    // 规则 3: 禁止删除自己
    if (req.user.id === id) {
      throw new ForbiddenException('不能删除自己');
    }
    return this.userService.remove(id);
  }
}