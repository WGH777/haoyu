import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
// 👇 确保这个路径是对的，如果报错就把 /guards 删掉试试
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  // 👇👇👇看这里！我加了 ": any"，报错就会消失
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    console.log('👀 当前请求的用户信息 (req.user):', req.user);

    // 双重保险获取 ID
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      console.error('❌ 无法从 req.user 中获取用户 ID');
      throw new UnauthorizedException('无法识别用户身份，请重新登录');
    }

    return this.taskService.create(+userId, createTaskDto);
  }

  @Get()
  findAll() {
    return this.taskService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-published')
  // 👇👇👇看这里！同样加了 ": any"
  findMyPublished(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.taskService.findCreatedBy(+userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(+id, updateTaskDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(+id);
  }
}