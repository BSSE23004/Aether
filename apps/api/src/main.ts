import { ValidationPipe } from './common/pipes/validation.pipe';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { RedisIoAdapter } from './redis/redis-io.adapter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log', 'debug'] });

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  // Setup Redis Adapter for Socket.IO
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(process.env.REDIS_URL || 'redis://localhost:6379');
  app.useWebSocketAdapter(redisIoAdapter);

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port);

  Logger.log(`Aether API running on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
