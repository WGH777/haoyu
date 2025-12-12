import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CompleteOrderDto {
    @ApiProperty({ description: '是否验收通过', example: true })
    @IsBoolean()
    isAccepted!: boolean; // 🔥 核心修复：添加非空断言符 !
    
    @ApiProperty({ description: '验收意见（可选）', required: false })
    @IsOptional()
    @IsString()
    comment?: string;
}