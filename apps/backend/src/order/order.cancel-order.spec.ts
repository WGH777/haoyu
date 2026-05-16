import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderService } from './order.service';

describe('OrderService cancelOrder', () => {
  let service: OrderService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      order: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      task: {
        updateMany: jest.fn(),
      },
      wallet: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      ledgerEntry: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    service = new OrderService(prisma);
  });

  it('normal cancel: frozen -> available and order -> CANCELLED', async () => {
    prisma.order.findUnique.mockResolvedValueOnce({
      id: 1,
      status: 'ASSIGNED',
      task: { id: 10, publisherId: 100, price: 1000, serviceFee: 0 },
    });

    prisma.order.updateMany.mockResolvedValue({ count: 1 });
    prisma.task.updateMany.mockResolvedValue({ count: 1 });

    prisma.wallet.findUnique
      .mockResolvedValueOnce({ id: 'w1', userId: 100, available: 0, frozen: 1000 })
      .mockResolvedValueOnce({ id: 'w1', userId: 100, available: 1000, frozen: 0 });

    prisma.order.findUnique.mockResolvedValueOnce({ id: 1, status: 'CANCELLED' });

    const res = await service.cancelOrder(1, 100);

    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: 1, status: { in: ['ASSIGNED', 'SUBMITTED'] } },
      data: { status: 'CANCELLED' },
    });
    expect(prisma.wallet.update).toHaveBeenCalledWith({
      where: { id: 'w1' },
      data: {
        frozen: { decrement: 1000 },
        available: { increment: 1000 },
      },
    });
    expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'REFUND',
          direction: 'IN',
          amount: 1000,
        }),
      }),
    );
    expect(res).toEqual({ id: 1, status: 'CANCELLED' });
  });

  it('should fail when canceller is not publisher/admin', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 2,
      status: 'ASSIGNED',
      task: { id: 11, publisherId: 100, price: 1000, serviceFee: 0 },
    });

    await expect(service.cancelOrder(2, 200, 'USER')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should fail when order already completed', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 3,
      status: 'COMPLETED',
      task: { id: 12, publisherId: 100, price: 1000, serviceFee: 0 },
    });

    await expect(service.cancelOrder(3, 100)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
