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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('用户管理')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
   * 获取当前登录用户的个人信息
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
   * 🔥 核心修复：补回修改密码接口 (注意要放在 :id 路由之前)
   */
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  updatePassword(@Req() req: any, @Body() body: any) {
    // 调用 Service 更新密码
    return this.userService.update(req.user.id, { password: body.newPassword });
  }

  /**
   * 当前用户修改自己的资料（昵称/简介）
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '当前用户修改自己的资料' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const userId = req.user.id;
    return this.userService.updateProfile(userId, dto);
  }

  /**
   * 头像上传接口
   */
  @Post('upload-avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传头像' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) return { message: '请选择文件' };
    const avatarUrl = `/uploads/${file.filename}`;
    await this.userService.updateAvatar(req.user.id, avatarUrl);
    return { url: avatarUrl };
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
   * （管理员）更新指定用户基础信息
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
   * （超级管理员）修改用户角色
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
        role: { type: 'string', enum: ['USER', 'ADMIN', 'SUPER_ADMIN'] },
      },
      required: ['role'],
    },
  })
  @ApiOperation({ summary: '（超级管理员）修改用户角色' })
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' },
  ) {
    return this.userService.update(id, { role: body.role } as any);
  }

  /**
   * （超级管理员）重置指定用户密码
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
        newPassword: { type: 'string', example: 'ResetPassword123!' },
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
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}