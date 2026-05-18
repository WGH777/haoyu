import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';

@Module({
  imports: [PrismaModule, NotificationModule, UserModule],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
