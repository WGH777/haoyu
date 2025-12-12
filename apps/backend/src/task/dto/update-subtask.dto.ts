import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSubTaskDto {
  @ApiPropertyOptional({ description: '子任务标题', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: '子任务标题不能超过 50 个字' })
  title?: string;

  @ApiPropertyOptional({ description: '是否完成' })
  @IsBoolean()
  @IsOptional()
  isDone?: boolean;
}
