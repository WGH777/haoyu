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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { UserService } from './user.service';
import { RequireConfirmation } from '../auth/decorators/require-confirmation.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireDualSign } from '../auth/dual-sign/dual-sign.decorator';
import { DualSignGuard } from '../auth/dual-sign/dual-sign.guard';
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
   * ★ 修改用户角色（ADMIN / SUPER_ADMIN）
   *
   * 规则：
   *  - SUPER_ADMIN：可设置任意角色，但系统只允许存在 1 个 SUPER_ADMIN
   *  - ADMIN：只能将 USER 设为 ADMIN / 将 ADMIN 降为 USER，不能动 SUPER_ADMIN
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
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
  @ApiOperation({ summary: '（管理员/超管）修改用户角色' })
  async changeRole(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { role: RoleStr },
  ) {
    const operatorId = req.user.id;
    const operatorRole: RoleStr = req.user.role;

    if (!body?.role || !ROLE_ALLOWLIST.includes(body.role)) {
      throw new BadRequestException(
        `role 非法，可选值：${ROLE_ALLOWLIST.join(', ')}`,
      );
    }

    // 不能操作自己
    if (id === operatorId) {
      throw new BadRequestException('不能修改自己的角色');
    }

    const target = await this.userService.findById(id);
    if (!target) throw new BadRequestException('用户不存在');

    const targetRole: RoleStr = target.role as RoleStr;

    // ──── ADMIN 权限边界 ────
    if (operatorRole === 'ADMIN') {
      // ADMIN 不能动 SUPER_ADMIN
      if (targetRole === 'SUPER_ADMIN') {
        throw new ForbiddenException('管理员无权修改超级管理员的角色');
      }
      // ADMIN 不能把人设为 SUPER_ADMIN
      if (body.role === 'SUPER_ADMIN') {
        throw new ForbiddenException('只有超级管理员才能设置超级管理员角色');
      }
    }

    // ──── 唯一超管约束 ────
    if (body.role === 'SUPER_ADMIN') {
      const existingSuperAdmin = await this.userService.findSuperAdmin();
      if (existingSuperAdmin && existingSuperAdmin.id !== id) {
        throw new BadRequestException(
          `系统只允许存在一位超级管理员（当前：${existingSuperAdmin.nickname || existingSuperAdmin.email}）。如需转让，请先将现任超管降级。`,
        );
      }
    }

    await this.audit.log({ adminId: operatorId, action: 'CHANGE_ROLE', targetType: 'USER', targetId: id, detail: `role=${body.role}` }).catch(() => {});
    return this.userService.update(id, { role: body.role } as any);
  }

  /**
   * ★ 管理员/超管重置指定用户密码（无需旧密码）
   * ADMIN 只能重置 USER 的密码；SUPER_ADMIN 可重置任何人
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
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
  @ApiOperation({ summary: '（管理员/超管）重置用户密码' })
  async resetPasswordByAdmin(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPassword: string },
  ) {
    const operatorRole: RoleStr = req.user.role;
    const target = await this.userService.findById(id);
    if (!target) throw new BadRequestException('用户不存在');

    if (operatorRole === 'ADMIN' && (target.role as RoleStr) === 'SUPER_ADMIN') {
      throw new ForbiddenException('管理员无权重置超级管理员的密码');
    }

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
   * （超级管理员）修改任意用户的昵称
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch(':id/nickname')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { nickname: { type: 'string', example: '新昵称' } },
      required: ['nickname'],
    },
  })
  @ApiOperation({ summary: '（超级管理员）修改用户昵称' })
  async updateNickname(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { nickname: string },
  ) {
    if (!body.nickname || !body.nickname.trim()) {
      throw new BadRequestException('昵称不能为空');
    }
    const result = await this.userService.updateNickname(id, body.nickname.trim());
    await this.audit.log({ adminId: req.user.id, action: 'UPDATE_NICKNAME', targetType: 'USER', targetId: id, detail: `nickname=${body.nickname}` }).catch(() => {});
    return result;
  }

  /**
   * （超级管理员）批量删除用户（按 ID 数组）
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Delete('batch')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'number' },
          example: [2, 3, 5],
          description: '要删除的用户 ID 列表',
        },
      },
      required: ['ids'],
    },
  })
  @ApiOperation({ summary: '（超级管理员）批量删除用户及关联数据' })
  async removeBatch(@Req() req: any, @Body() body: { ids: number[] }) {
    if (!body?.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      throw new BadRequestException('ids 不能为空');
    }
    // 禁止删除自己
    if (body.ids.includes(req.user.id)) {
      throw new BadRequestException('不能删除自己');
    }
    const result = await this.userService.removeBatch(body.ids);
    await this.audit.log({ adminId: req.user.id, action: 'DELETE_USERS_BATCH', targetType: 'USER', targetId: 0, detail: `ids=[${body.ids.join(',')}] deleted=${result.deleted}` }).catch(() => {});
    return result;
  }

  /**
   * （超级管理员）一键清理所有测试账号
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Delete('test-users')
  @ApiBearerAuth()
  @ApiOperation({ summary: '（超级管理员）清理所有测试账号及关联数据' })
  async cleanTestUsers(@Req() req: any) {
    const result = await this.userService.deleteTestUsers();
    await this.audit.log({ adminId: req.user.id, action: 'CLEAN_TEST_USERS', targetType: 'USER', targetId: 0, detail: `deleted=${result.deleted}` }).catch(() => {});
    return result;
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
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const result = await this.userService.remove(id);
    this.audit.log({ adminId: req.user.id, action: 'DELETE_USER', targetType: 'USER', targetId: id }).catch(() => {});
    return result;
  }

  /**
   * （管理员/超管）封禁用户
   * ADMIN 只能封禁 USER；SUPER_ADMIN 可封禁任何人（除自己）
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id/ban')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: '违规发布' } } } })
  @ApiOperation({ summary: '（管理员/超管）封禁用户' })
  async banUser(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { reason?: string },
  ) {
    const operatorRole: RoleStr = req.user.role;
    if (id === req.user.id) throw new BadRequestException('不能封禁自己');

    const target = await this.userService.findById(id);
    if (!target) throw new BadRequestException('用户不存在');

    if (operatorRole === 'ADMIN' && (target.role as RoleStr) !== 'USER') {
      throw new ForbiddenException('管理员只能封禁普通用户');
    }

    const result = await this.userService.ban(id, body?.reason);
    this.audit.log({ adminId: req.user.id, action: 'BAN_USER', targetType: 'USER', targetId: id, detail: body?.reason }).catch(() => {});
    return result;
  }

  /**
   * （管理员/超管）解封用户
   * ADMIN 只能解封 USER；SUPER_ADMIN 可解封任何人
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id/unban')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @ApiOperation({ summary: '（管理员/超管）解封用户' })
  async unbanUser(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const operatorRole: RoleStr = req.user.role;
    const target = await this.userService.findById(id);
    if (!target) throw new BadRequestException('用户不存在');

    if (operatorRole === 'ADMIN' && (target.role as RoleStr) !== 'USER') {
      throw new ForbiddenException('管理员只能解封普通用户');
    }

    const result = await this.userService.unban(id);
    this.audit.log({ adminId: req.user.id, action: 'UNBAN_USER', targetType: 'USER', targetId: id }).catch(() => {});
    return result;
  }
}