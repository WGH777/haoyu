import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @IsNotEmpty()
  taskId!: number; // 👈 必须叫 taskId
}