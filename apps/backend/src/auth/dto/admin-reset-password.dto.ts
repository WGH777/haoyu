import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class AdminResetPasswordDto {
  @ApiProperty({
    example: 'ResetUser123!',
    description: '要为该用户设置的新密码（由管理员操作）',
  })
  @IsString({ message: '新密码必须为字符串' })
  @MinLength(6, { message: '新密码至少为 6 位' })
  @MaxLength(128, { message: '新密码长度过长' })
  newPassword!: string;
}
