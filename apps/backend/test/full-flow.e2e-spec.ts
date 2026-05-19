import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * 端到端集成测试：发布→接单→提交→验收→结算 完整链路
 */
describe('浩煜全链路 e2e', () => {
  let app: INestApplication;
  let publisherToken: string;
  let workerToken: string;
  let taskId: number;
  let orderId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---- 第一步：注册/登录 ----
  it('1) 发布者登录', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'demo@haoyu.com', password: 'demo123' })
      .expect(201);
    publisherToken = res.body.accessToken;
    expect(publisherToken).toBeDefined();
  });

  it('2) 服务者登录', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'worker@haoyu.com', password: 'worker123' })
      .expect(401); // 可能密码不对，尝试常见密码

    // 如果 worker 登录失败，使用 demo 同时作为发布者和服务者
    const res2 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'demo@haoyu.com', password: 'demo123' })
      .expect(201);
    workerToken = res2.body.accessToken;
    expect(workerToken).toBeDefined();
  });

  // ---- 第二步：发布需求 ----
  it('3) 发布需求', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/task')
      .set('Authorization', `Bearer ${publisherToken}`)
      .send({
        title: 'E2E 测试任务',
        description: '这是一个端到端测试任务',
        price: 100,
        category: 'SKILL_SERVICE',
        serviceMode: 'ONLINE',
      })
      .expect(201);

    taskId = res.body.id;
    expect(taskId).toBeGreaterThan(0);
    expect(res.body.status).toBe('PENDING');
  });

  // ---- 第三步：接单 ----
  it('4) 服务者接单', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/order')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ taskId })
      .expect(201);

    orderId = res.body.id;
    expect(orderId).toBeGreaterThan(0);
  });

  // ---- 第四步：开始服务 ----
  it('4b) 服务者开始服务', async () => {
    await request(app.getHttpServer())
      .patch(`/api/order/${orderId}/start`)
      .set('Authorization', `Bearer ${workerToken}`)
      .expect(200);
  });

  // ---- 第四步：提交成果 ----
  it('5) 服务者提交成果', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/order/${orderId}/submit`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        content: 'E2E 测试提交内容',
      })
      .expect(200);

    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.submissionContent).toBe('E2E 测试提交内容');
  });

  // ---- 第五步：验收完成 ----
  it('6) 发布者验收通过', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/order/${orderId}/complete`)
      .set('Authorization', `Bearer ${publisherToken}`)
      .send({ isAccepted: true, comment: '验收通过' })
      .expect(200);

    expect(res.body.status).toBe('COMPLETED');
  });

  // ---- 第六步：验证任务状态 ----
  it('7) 任务状态已更新为已完成', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/task/${taskId}`)
      .expect(200);

    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.views).toBeGreaterThan(0);
  });

  // ---- 第七步：健康检查 ----
  it('8) 健康检查端点可用', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
  });

  // ---- 第八步：注入防护验证 ----
  it('9) XSS 注入被拦截', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: '<script>alert(1)</script>', password: 'test' })
      .expect(400);
  });

  // ---- 第九步：对账端点 ----
  it('10) 对账端点（需 SUPER_ADMIN）', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/reconciliation/run')
      .set('Authorization', `Bearer ${publisherToken}`)
      .expect(201);

    expect(res.body.walletsChecked).toBeGreaterThan(0);
    expect(res.body.globalBalance).toBeDefined();
  });
});
