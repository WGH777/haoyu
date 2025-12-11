import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

// 登录参数
export class LoginDto {
  @ApiProperty({ example: 'boss@haoyu.com', description: '邮箱' })
  @IsEmail()
  @IsNotEmpty()
  email!: string; // 🔥 加了 !

  @ApiProperty({ example: '123456', description: '密码' })
  @IsString()
  @IsNotEmpty()
  password!: string; // 🔥 加了 !
}

// 注册参数
export class RegisterDto {
  @ApiProperty({ example: 'newuser@test.com' })
  @IsEmail()
  email!: string; // 🔥 加了 !

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string; // 🔥 加了 !

  @ApiProperty({ example: '新用户', required: false })
  @IsOptional()
  @IsString()
  nickname?: string; // 可选参数不用加 !
}

// 修改密码参数
export class ChangePasswordDto {
  @ApiProperty({ description: '旧密码' })
  @IsString()
  @IsNotEmpty()
  oldPassword!: string; // 🔥 加了 !

  @ApiProperty({ description: '新密码', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword!: string; // 🔥 加了 !
}

// 管理员重置密码参数
export class AdminResetPasswordDto {
  @ApiProperty({ description: '新密码', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword!: string; // 🔥 加了 !
}