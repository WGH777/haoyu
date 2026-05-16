import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  const prisma: any = {
    wallet: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    ledgerEntry: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (cb: any) => cb(prisma)),
    $tx: jest.fn(async (cb: any) => cb(prisma)),
  };

  let service: WalletService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WalletService(prisma);
  });

  describe('deposit', () => {
    it('should deposit successfully', async () => {
      prisma.wallet.updateMany.mockResolvedValue({ count: 1 });
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'w1',
        userId: 1,
        available: 1000,
        frozen: 0,
      });

      const result = await service.deposit('w1', 1000);

      expect(prisma.wallet.updateMany).toHaveBeenCalledWith({
        where: { id: 'w1' },
        data: { available: { increment: 1000 } },
      });
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            walletId: 'w1',
            amount: 1000,
            direction: 'IN',
            type: 'DEPOSIT',
            balanceAfter: 1000,
            frozenAfter: 0,
          }),
        }),
      );
      expect(result).not.toBeNull();
      expect((result as any).available).toBe(1000);
    });

    it('should throw when amount <= 0', async () => {
      await expect(service.deposit('w1', 0)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.deposit('w1', -1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('freeze', () => {
    it('should freeze successfully', async () => {
      prisma.wallet.updateMany.mockResolvedValue({ count: 1 });
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'w1',
        userId: 1,
        available: 500,
        frozen: 500,
      });

      const result = await service.freeze('w1', 500, 11);

      expect(prisma.wallet.updateMany).toHaveBeenCalledWith({
        where: { id: 'w1', available: { gte: 500 } },
        data: {
          available: { decrement: 500 },
          frozen: { increment: 500 },
        },
      });
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'FREEZE',
            orderId: 11,
            direction: 'OUT',
          }),
        }),
      );
      expect(result).not.toBeNull();
      expect((result as any).frozen).toBe(500);
    });

    it('should throw when insufficient available balance', async () => {
      prisma.wallet.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.freeze('w1', 500)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('unfreeze', () => {
    it('should unfreeze successfully', async () => {
      prisma.wallet.updateMany.mockResolvedValue({ count: 1 });
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'w1',
        userId: 1,
        available: 1000,
        frozen: 0,
      });

      const result = await service.unfreeze('w1', 300, 22);

      expect(prisma.wallet.updateMany).toHaveBeenCalledWith({
        where: { id: 'w1', frozen: { gte: 300 } },
        data: {
          frozen: { decrement: 300 },
          available: { increment: 300 },
        },
      });
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'UNFREEZE',
            orderId: 22,
            direction: 'IN',
          }),
        }),
      );
      expect(result).not.toBeNull();
      expect((result as any).available).toBe(1000);
    });

    it('should throw when insufficient frozen balance', async () => {
      prisma.wallet.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.unfreeze('w1', 500)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('settle', () => {
    it('should settle from frozen successfully', async () => {
      prisma.wallet.updateMany.mockResolvedValue({ count: 1 });
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'w1',
        userId: 1,
        available: 1000,
        frozen: 200,
      });

      const result = await service.settle('w1', 300, 33);

      expect(prisma.wallet.updateMany).toHaveBeenCalledWith({
        where: { id: 'w1', frozen: { gte: 300 } },
        data: { frozen: { decrement: 300 } },
      });
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'SETTLEMENT',
            direction: 'OUT',
            orderId: 33,
          }),
        }),
      );
      expect(result).not.toBeNull();
      expect((result as any).frozen).toBe(200);
    });
  });

  describe('platformFee', () => {
    it('should deduct frozen and transfer to platform fee wallet', async () => {
      prisma.wallet.findUnique
        .mockResolvedValueOnce({ id: 'sys-fee', code: 'SYSTEM_PLATFORM_FEE' })
        .mockResolvedValueOnce({
          id: 'w1',
          userId: 1,
          available: 1000,
          frozen: 100,
        });
      prisma.wallet.updateMany.mockResolvedValue({ count: 1 });
      prisma.wallet.update.mockResolvedValue({});

      const result = await service.platformFee('w1', 200, 44);

      expect(prisma.wallet.updateMany).toHaveBeenCalledWith({
        where: { id: 'w1', frozen: { gte: 200 } },
        data: { frozen: { decrement: 200 } },
      });
      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'sys-fee' },
        data: { available: { increment: 200 } },
      });
      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'PLATFORM_FEE',
            direction: 'OUT',
            orderId: 44,
          }),
        }),
      );
      expect(result).not.toBeNull();
      expect((result as any).frozen).toBe(100);
    });

    it('should throw when system fee wallet not found', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce(null);
      await expect(service.platformFee('w1', 100)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('refund', () => {
    it('should call unfreeze and return refunded wallet', async () => {
      const spy = jest
        .spyOn(service, 'unfreeze')
        .mockResolvedValue({ id: 'w1', available: 800, frozen: 0 } as any);

      const result = await service.refund('w1', 100, 55);

      expect(spy).toHaveBeenCalledWith('w1', 100, 55, '退款');
      expect(result).toEqual({ id: 'w1', available: 800, frozen: 0 });
    });
  });
});
