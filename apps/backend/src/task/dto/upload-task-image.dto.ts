import { ApiProperty } from "@nestjs/swagger";

export class UploadTaskImageDto {
    @ApiProperty({ type: 'string', format: 'binary', description: '任务图片文件' })
    file: any;
}