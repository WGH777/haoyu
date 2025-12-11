import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 允许前端端口访问
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 全局参数校验
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // 过滤 DTO 里不存在的字段
      forbidNonWhitelisted: false, // 不直接报错，只是忽略多余字段
    }),
  );

  // 全局异常过滤器（统一错误返回结构 + 日志）
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('浩煜平台 API 文档')
    .setDescription('宇宙级悬赏平台的后端接口说明')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
