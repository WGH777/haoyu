import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Min, IsOptional } from "class-validator";

export class CreateTaskDto {
  @ApiProperty({ description: '任务标题', example: '设计一个App Logo' })
  @IsNotEmpty()
  @IsString()
  title!: string; 

  @ApiProperty({ description: '任务详细描述', example: '需要简约、科技感的设计，颜色用蓝色系' })
  @IsNotEmpty()
  @IsString()
  description!: string; 

  @ApiProperty({ description: '任务赏金（分），例如 10000 = 100元' })
  @IsNumber()
  @Min(100) 
  price!: number; 
  
  @ApiProperty({ description: '任务配图 URL（可选）', required: false, nullable: true })
  @IsOptional()
  @IsString()
  image?: string | null;
}