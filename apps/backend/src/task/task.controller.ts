import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile, ParseIntPipe, UnauthorizedException } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadTaskImageDto } from './dto/upload-task-image.dto';

@ApiTags('任务管理')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发布新任务 (包含扣费和事务)' })
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    // 标准方式：使用 req.user.id (由 JwtStrategy 保证存在)
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedException('无法识别用户身份，请重新登录');
    }

    return this.taskService.create(userId, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有待领取和进行中的任务列表 (任务广场)' })
  findAll() {
    return this.taskService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-published')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我发布的任务列表' })
  findMyPublished(@Req() req: any) {
    const userId = req.user.id;
    return this.taskService.findCreatedBy(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取任务详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  // 🔥 任务图片上传接口 (新增)
  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传任务配图' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/task', 
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadTaskImageDto })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { message: '请选择文件' };
    const imageUrl = `/uploads/task/${file.filename}`; 
    return { url: imageUrl };
  }


  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新任务 (发布者可调用)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(id, updateTaskDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除任务 (发布者可调用)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.remove(id);
  }
}