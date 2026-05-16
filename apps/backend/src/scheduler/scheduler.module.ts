import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { OrderModule } from '../order/order.module';
import { NotificationModule } from '../notification/notification.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, OrderModule, NotificationModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
