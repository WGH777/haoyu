import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'newuser@haoyu.com',
    description: '注册邮箱',
  })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string;

  @ApiProperty({
    example: 'NewUser123!',
    description: '登录密码（至少 6 位，建议包含字母和数字）',
  })
  @IsString({ message: '密码必须为字符串' })
  @MinLength(6, { message: '密码至少为 6 位' })
  @MaxLength(128, { message: '密码长度过长' })
  password!: string;

  @ApiProperty({
    example: '新用户',
    description: '昵称',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '昵称必须为字符串' })
  @MaxLength(50, { message: '昵称长度不能超过 50 字' })
  nickname?: string;
}
