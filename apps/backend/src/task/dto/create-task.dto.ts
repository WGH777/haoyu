import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ description: '任务标题', maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: '任务标题不能为空' })
  @MaxLength(100, { message: '任务标题不能超过 100 个字' })
  title!: string;

  @ApiProperty({
    description: '任务描述',
    maxLength: 2000,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: '任务描述不能超过 2000 个字' })
  description?: string;

  @ApiProperty({
    description: '赏金（单位：分，前端已把元转换为分）',
    example: 1000,
  })
  @IsInt({ message: '赏金必须是整数' })
  @Min(1, { message: '赏金至少为 1 分' })
  price!: number;

  @ApiProperty({
    description: '任务配图 URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  image?: string | null;

  @ApiProperty({
    description: '任务分类',
    required: false,
    default: 'SKILL_SERVICE',
    example: 'SKILL_SERVICE',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: '服务模式',
    required: false,
    default: 'ONLINE',
    enum: ['ONLINE', 'OFFLINE'],
  })
  @IsString()
  @IsOptional()
  serviceMode?: string;

  @ApiProperty({
    description: '线下服务地点（serviceMode=OFFLINE 时必填）',
    required: false,
  })
  @IsString()
  @IsOptional()
  serviceLocation?: string;
}
