import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class SubmitResultDto {
    @ApiProperty({ description: '任务成果描述/链接' })
    @IsNotEmpty()
    @IsString()
    content!: string; // 🔥 核心修复：添加非空断言符 !
    
    @ApiProperty({ description: '成果图片链接（可选）', required: false, nullable: true })
    @IsOptional() // 🔥 确保可选
    @IsString()
    image?: string;
}