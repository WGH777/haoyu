import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: '昵称（可选）',
    example: '荒',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称长度不能超过 50 个字符' })
  nickname?: string;

  @ApiProperty({
    description: '个人简介（可选）',
    example: '浩煜平台创始人',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '个人简介必须是字符串' })
  @MaxLength(200, { message: '个人简介不能超过 200 个字符' })
  bio?: string;

  @ApiProperty({
    description: '头像 URL（可选）。传 null 表示清空头像',
    example: 'https://example.com/avatar.png',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: '头像必须是字符串' })
  @MaxLength(500, { message: '头像 URL 不能超过 500 个字符' })
  avatar?: string | null;
}
