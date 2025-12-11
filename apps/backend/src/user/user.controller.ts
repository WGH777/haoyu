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

  // 1. 获取自己信息
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前登录用户资料' })
  async getProfile(@Req() req: any) {
    return this.userService.findById(req.user.id);
  }

  // 2. 修改自己资料
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改自己资料' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  // 3. 上传头像 (我们添加的功能)
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
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) return { message: '请选择文件' };
    const avatarUrl = `/uploads/${file.filename}`;
    await this.userService.updateAvatar(req.user.id, avatarUrl);
    return { url: avatarUrl };
  }

  // 4. 管理员接口：获取所有用户
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '（管理员）获取用户列表' })
  findAll() {
    return this.userService.findAll();
  }

  // 5. 超级管理员：修改角色
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch(':id/role')
  @ApiBearerAuth()
  @ApiOperation({ summary: '（超级管理员）修改用户角色' })
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' },
  ) {
    return this.userService.update(id, { role: body.role } as any);
  }

  // 6. 超级管理员：删除用户
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '（超级管理员）删除用户' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}