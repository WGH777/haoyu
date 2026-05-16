import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
