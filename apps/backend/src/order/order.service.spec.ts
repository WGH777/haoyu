import { OrderService } from './order.service';

describe('OrderService fee rate', () => {
  it.each([
    [0, 0],
    [30, 0],
    [31, 0.02],
    [50, 0.02],
    [51, 0.05],
    [100, 0.05],
    [101, 0.1],
  ])('completed=%i => rate=%f', async (completed, expected) => {
    const prisma: any = {
      order: {
        count: jest.fn().mockResolvedValue(completed),
      },
    };
    const service = new OrderService(prisma, null as any);

    const rate = await (service as any).getServiceFeeRate(prisma, 99);
    expect(rate).toBe(expected);
  });
});
