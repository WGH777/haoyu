import { Module } from '@nestjs/common'
import { OrderService } from './order.service'
import { OrderController } from './order.controller'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationModule } from '../notification/notification.module'

@Module({
  imports: [NotificationModule],
  controllers: [OrderController],
  providers: [OrderService, PrismaService],
  exports: [OrderService],
})
export class OrderModule {}
