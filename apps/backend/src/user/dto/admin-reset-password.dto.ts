// apps/backend/src/user/dto/admin-reset-password.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(6, { message: '新密码至少 6 位' })
  newPassword!: string;
}
