import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPass123!',
    description: '旧密码',
  })
  @IsString({ message: '旧密码必须为字符串' })
  @MinLength(6, { message: '旧密码至少为 6 位' })
  @MaxLength(128, { message: '旧密码长度过长' })
  oldPassword!: string;

  @ApiProperty({
    example: 'NewPass123!',
    description: '新密码',
  })
  @IsString({ message: '新密码必须为字符串' })
  @MinLength(6, { message: '新密码至少为 6 位' })
  @MaxLength(128, { message: '新密码长度过长' })
  newPassword!: string;
}
