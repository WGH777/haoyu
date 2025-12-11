import { IsNumber, IsPositive, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class DepositDto {
  // 确保金额是数字、大于 0，且不为空
  @IsNumber({}, { message: '充值金额必须是数字' })
  @IsPositive({ message: '充值金额必须大于 0' })
  @IsNotEmpty({ message: '充值金额不能为空' })
  @Type(() => Number) // 确保从 JSON 接收的金额是 Number 类型
  amount!: number;
}