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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateSubTaskDto } from './dto/create-subtask.dto';
import { UpdateSubTaskDto } from './dto/update-subtask.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('任务管理')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // 创建任务
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建任务' })
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    return this.taskService.create(req.user.id, createTaskDto);
  }

  // 任务大厅列表（当前版本：仅后端按状态返回，筛选/排序继续由前端完成）
  @Get()
  @ApiOperation({ summary: '获取任务列表（任务大厅）' })
  findAll() {
    return this.taskService.findAll();
  }

  // 任务详情
  @Get('detail/:id')
  @ApiOperation({ summary: '获取任务详情（包含发布者信息 + 子任务）' })
  @ApiParam({ name: 'id', description: '任务 ID', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  // 更新任务基础信息（保留接口，当前未强制校验发布者身份）
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新任务基础信息（标题/描述/图片）' })
  @ApiParam({ name: 'id', description: '任务 ID', type: Number })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.update(id, updateTaskDto);
  }

  // 删除任务（保留接口）
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除任务（保留接口）' })
  @ApiParam({ name: 'id', description: '任务 ID', type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.remove(id);
  }

  // 我发布的任务
  @Get('my-published')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我发布的任务列表（含子任务）' })
  findCreated(@Req() req: any) {
    return this.taskService.findCreatedBy(req.user.id);
  }

  // =============== 子任务相关 ===============

  // 新增子任务
  @Post(':id/subtasks')
  @UseGuards(JwtAuthGuard)
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

  // 更新子任务
  @Patch(':taskId/subtasks/:subTaskId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '更新子任务（发布者：标题/完成状态；执行者：仅完成状态 isDone）',
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

  // 删除子任务
  @Delete(':taskId/subtasks/:subTaskId')
  @UseGuards(JwtAuthGuard)
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

  // =============== 图片上传（保持原有逻辑） ===============
  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传任务图片' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
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
    return { url: `/uploads/${file.filename}` };
  }
}
