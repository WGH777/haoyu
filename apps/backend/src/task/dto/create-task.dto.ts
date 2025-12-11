// apps/backend/src/task/dto/create-task.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: '任务标题不能为空' })
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  /**
   * 赏金金额，单位：分
   * 前端用「元」* 100 后传进来
   */
  @IsNumber()
  @Min(1, { message: '赏金至少为 1 分' })
  price!: number;
}
