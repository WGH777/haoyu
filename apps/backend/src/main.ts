import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS：从环境变量读取允许域名（逗号分隔，默认开发环境）
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // 安全响应头
  app.use(helmet({ contentSecurityPolicy: false }));

  // 全局路由前缀
  app.setGlobalPrefix('api');

  // 全局参数校验
  app.useGlobalPipes(new ValidationPipe({
    transform: true, 
    whitelist: true, 
  }));
  
  // 🔥🔥🔥 4. 配置 Swagger 文档 🔥🔥🔥
  const config = new DocumentBuilder()
    .setTitle('浩煜悬赏平台 API 文档')
    .setDescription('提供用户、任务、钱包、订单等核心接口')
    .setVersion('1.0')
    .addBearerAuth( // 启用 JWT 认证
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '请输入您的 JWT 令牌',
        in: 'header',
      },
      'bearer', // 令牌的名称，与 @ApiBearerAuth() 匹配
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // 文档访问路径：http://localhost:3000/api/docs
  SwaggerModule.setup('api/docs', app, document);
  
  // 启动
  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port, '127.0.0.1');
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation is available at: ${await app.getUrl()}/api/docs`);
}
bootstrap();