import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { initCategories } from './scripts/init-categories';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS - разрешаем запросы с frontend и Vercel доменов
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'https://tg-catalog-one.vercel.app',
    'https://oiitmict100500-dotcom-tg-catalog.vercel.app',
    /^https:\/\/.*\.vercel\.app$/, // Разрешаем все Vercel preview домены
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (например, Postman, мобильные приложения)
      if (!origin) {
        return callback(null, true);
      }
      
      // Проверяем, разрешен ли origin
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        }
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Initialize categories
  try {
    const dataSource = app.get<DataSource>(getDataSourceToken());
    await initCategories(dataSource);
    console.log('Categories initialized');
  } catch (error: any) {
    console.warn('Could not initialize categories:', error?.message || error);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();


