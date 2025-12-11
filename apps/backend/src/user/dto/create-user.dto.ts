import { IsEmail, IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 20, { message: '密码长度需在6-20位之间' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname!: string;

  @IsString()
  @IsOptional()
  bio?: string;
}