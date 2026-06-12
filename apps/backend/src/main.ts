import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: merge defaults with CORS_ORIGIN so local dev origins are never lost.
  const defaultCorsOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'https://www.haoyulv.com',
    'https://haoyulv.com',
  ];
  const envCorsOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const corsOrigins = Array.from(new Set([...defaultCorsOrigins, ...envCorsOrigins]));

  app.enableCors({
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
  });

  // 瀹夊叏鍝嶅簲澶?
  app.use(helmet({ contentSecurityPolicy: false }));

  // 鍏ㄥ眬璺敱鍓嶇紑
  app.setGlobalPrefix('api');

  // 鍏ㄥ眬鍙傛暟鏍￠獙
  app.useGlobalPipes(new ValidationPipe({
    transform: true, 
    whitelist: true, 
  }));

  // 鍏ㄥ眬寮傚父杩囨护鍣?鈥?缁熶竴閿欒鍝嶅簲鏍煎紡
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // 馃敟馃敟馃敟 4. 閰嶇疆 Swagger 鏂囨。 馃敟馃敟馃敟
  const config = new DocumentBuilder()
    .setTitle('娴╃厹鎮祻骞冲彴 API 鏂囨。')
    .setDescription('鎻愪緵鐢ㄦ埛銆佷换鍔°€侀挶鍖呫€佽鍗曠瓑鏍稿績鎺ュ彛')
    .setVersion('1.0')
    .addBearerAuth( // 鍚敤 JWT 璁よ瘉
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '璇疯緭鍏ユ偍鐨?JWT 浠ょ墝',
        in: 'header',
      },
      'bearer', // 浠ょ墝鐨勫悕绉帮紝涓?@ApiBearerAuth() 鍖归厤
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // 鏂囨。璁块棶璺緞锛歨ttp://localhost:3000/api/docs
  SwaggerModule.setup('api/docs', app, document);
  
  // 鍚姩
  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port, '127.0.0.1');
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation is available at: ${await app.getUrl()}/api/docs`);
}
bootstrap();


