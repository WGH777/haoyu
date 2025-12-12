import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: '任务标题', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: '任务标题不能超过 100 个字' })
  title?: string;

  @ApiPropertyOptional({ description: '任务描述', maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: '任务描述不能超过 2000 个字' })
  description?: string;

  @ApiPropertyOptional({
    description: '赏金（单位：分）',
  })
  @IsInt({ message: '赏金必须是整数' })
  @Min(1, { message: '赏金至少为 1 分' })
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: '任务配图 URL' })
  @IsString()
  @IsOptional()
  image?: string | null;
}
