import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'boss@haoyu.com',
    description: '登录邮箱',
  })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string;

  @ApiProperty({
    example: 'wgh777',
    description: '登录密码',
  })
  @IsString({ message: '密码必须为字符串' })
  @MinLength(6, { message: '密码至少为 6 位' })
  @MaxLength(128, { message: '密码长度过长' })
  password!: string;
}
