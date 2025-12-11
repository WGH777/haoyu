// 文件路径: apps/backend/src/task/dto/create-task.dto.ts
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string; // 👈 必须加 ! (感叹号)

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  price!: number; // 👈 必须加 ! 且必须叫 price

  @IsNumber()
  @IsOptional()
  serviceFee?: number;
}