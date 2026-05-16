import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Fund Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const unique = Date.now();
  const publisher = {
    email: `pub_${unique}@test.com`,
    password: '123456',
    nickname: 'publisher',
  };
  const worker = {
    email: `worker_${unique}@test.com`,
    password: '123456',
    nickname: 'worker',
  };

  let publisherToken = '';
  let workerToken = '';
  let publisherId = 0;
  let workerId = 0;
  let taskId = 0;
  let orderId = 0;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.wallet.upsert({
      where: { code: 'SYSTEM_PLATFORM_FEE' },
      update: {},
      create: {
        ownerType: 'SYSTEM',
        code: 'SYSTEM_PLATFORM_FEE',
        currency: 'CNY',
        available: 0,
        frozen: 0,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('full flow: register -> wallet -> deposit -> create task(freeze) -> complete(settlement)', async () => {
    const pubReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send(publisher)
      .expect(201);

    const workerReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send(worker)
      .expect(201);

    publisherToken = pubReg.body.data?.accessToken || pubReg.body.accessToken;
    workerToken = workerReg.body.data?.accessToken || workerReg.body.accessToken;

    const pubProfile = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${publisherToken}`)
      .expect(200);
    const workerProfile = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${workerToken}`)
      .expect(200);

    publisherId = pubProfile.body.data?.id ?? pubProfile.body.id;
    workerId = workerProfile.body.data?.id ?? workerProfile.body.id;

    await request(app.getHttpServer())
      .post('/wallet/create')
      .set('Authorization', `Bearer ${publisherToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/wallet/create')
      .set('Authorization', `Bearer ${workerToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${publisherToken}`)
      .send({ amount: 10000 })
      .expect(201);

    const taskRes = await request(app.getHttpServer())
      .post('/task')
      .set('Authorization', `Bearer ${publisherToken}`)
      .send({ title: 'e2e-task', description: 'fund flow', price: 3000 })
      .expect(201);

    taskId = taskRes.body.data?.id ?? taskRes.body.id;

    const orderRes = await request(app.getHttpServer())
      .post('/order')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ taskId })
      .expect(201);

    orderId = orderRes.body.data?.id ?? orderRes.body.id;

    await request(app.getHttpServer())
      .post(`/order/${orderId}/submit`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ content: 'done' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/order/${orderId}/complete`)
      .set('Authorization', `Bearer ${publisherToken}`)
      .send({ isAccepted: true })
      .expect(200);

    const pubWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId: publisherId, currency: 'CNY' } },
    });
    const wWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId: workerId, currency: 'CNY' } },
    });
    const feeWallet = await prisma.wallet.findUnique({
      where: { code: 'SYSTEM_PLATFORM_FEE' },
    });

    expect(pubWallet).toBeTruthy();
    expect(wWallet).toBeTruthy();
    expect(feeWallet).toBeTruthy();

    expect(pubWallet!.available).toBe(7000);
    expect(pubWallet!.frozen).toBe(0);
    expect(wWallet!.available).toBe(3000);

    const ledger = await prisma.ledgerEntry.findMany({
      where: {
        OR: [{ userId: publisherId }, { userId: workerId }],
        orderId,
      },
      orderBy: { createdAt: 'asc' },
    });

    const allPubLedger = await prisma.ledgerEntry.findMany({
      where: { userId: publisherId },
    });

    expect(allPubLedger.some((x) => x.type === 'DEPOSIT')).toBe(true);
    expect(allPubLedger.some((x) => x.type === 'FREEZE')).toBe(true);
    expect(ledger.some((x) => x.type === 'SETTLEMENT' && x.direction === 'OUT')).toBe(
      true,
    );
    expect(ledger.some((x) => x.type === 'SETTLEMENT' && x.direction === 'IN')).toBe(
      true,
    );
  });
});
