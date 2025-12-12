import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubTaskDto {
  @ApiProperty({ description: '子任务标题', maxLength: 50 })
  @IsString()
  @IsNotEmpty({ message: '子任务标题不能为空' })
  @MaxLength(50, { message: '子任务标题不能超过 50 个字' })
  title!: string;
}
