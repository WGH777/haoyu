// apps/backend/src/task/task.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  Patch,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { TaskService } from './task.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BanGuard } from '../user/ban.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateSubTaskDto } from './dto/create-subtask.dto';
import { UpdateSubTaskDto } from './dto/update-subtask.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { validateFileMagic } from '../common/upload-validator';

@ApiTags('任务管理')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UseGuards(JwtAuthGuard, BanGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建任务' })
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    return this.taskService.create(req.user.id, createTaskDto);
  }

  @Get('related/:id')
  @ApiOperation({ summary: '推荐相关任务' })
  findRelated(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findRelated(id);
  }

  @Get()
  @ApiOperation({ summary: '获取任务列表（任务大厅）' })
  findAll() {
    return this.taskService.findAll();
  }

  @Get('detail/:id')
  @ApiOperation({ summary: '获取任务详情（包含发布者信息 + 子任务）' })
  @ApiParam({ name: 'id', description: '任务 ID', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Get('my-published')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我发布的任务列表（含子任务）' })
  findCreated(@Req() req: any) {
    return this.taskService.findCreatedBy(req.user.id);
  }

  /**
   * 更新任务基础信息（资源级权限：发布者/管理员）
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, BanGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新任务基础信息（发布者/管理员）' })
  @ApiParam({ name: 'id', description: '任务 ID', type: Number })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: any,
  ) {
    return this.taskService.update(id, updateTaskDto, req.user.id, req.user.role);
  }

  /**
   * 删除任务（资源级权限：发布者/管理员）
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, BanGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除任务（发布者/管理员）' })
  @ApiParam({ name: 'id', description: '任务 ID', type: Number })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.taskService.remove(id, req.user.id, req.user.role);
  }

  // =============== 子任务相关 ===============

  @Post(':id/subtasks')
  @UseGuards(JwtAuthGuard, BanGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '为任务新增子任务（仅发布者）' })
  @ApiParam({ name: 'id', description: '任务 ID', type: Number })
  createSubTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSubTaskDto,
    @Req() req: any,
  ) {
    return this.taskService.createSubTask(id, req.user.id, dto.title);
  }

  @Patch(':taskId/subtasks/:subTaskId')
  @UseGuards(JwtAuthGuard, BanGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '更新子任务（发布者：标题/完成状态；执行者：仅完成状态 isDone）',
  })
  @ApiParam({ name: 'taskId', description: '任务 ID', type: Number })
  @ApiParam({ name: 'subTaskId', description: '子任务 ID', type: Number })
  updateSubTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('subTaskId', ParseIntPipe) subTaskId: number,
    @Body() dto: UpdateSubTaskDto,
    @Req() req: any,
  ) {
    return this.taskService.updateSubTask(taskId, subTaskId, req.user.id, dto);
  }

  @Delete(':taskId/subtasks/:subTaskId')
  @UseGuards(JwtAuthGuard, BanGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除子任务（仅发布者）' })
  @ApiParam({ name: 'taskId', description: '任务 ID', type: Number })
  @ApiParam({ name: 'subTaskId', description: '子任务 ID', type: Number })
  deleteSubTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('subTaskId', ParseIntPipe) subTaskId: number,
    @Req() req: any,
  ) {
    return this.taskService.deleteSubTask(taskId, subTaskId, req.user.id);
  }

  // =============== 图片上传 ===============

  // Phase 0-3: 上传安全 — 限制文件大小 5MB，仅允许 jpeg/png/gif/webp
  @Post('upload-image')
  @UseGuards(JwtAuthGuard, BanGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传任务图片' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: '/var/www/haoyu/uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
        }
      },
    }),
  )
  @ApiBody({
    description: '任务图片文件',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    // 🔒 魔数验证：防止 mimetype 伪造
    validateFileMagic(file.path, file.originalname, file.size);
    return { url: `/uploads/${file.filename}` };
  }
}
