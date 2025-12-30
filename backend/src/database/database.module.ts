import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Resource } from '../resources/entities/resource.entity';
import { Category } from '../categories/entities/category.entity';
import { Submission } from '../resources/entities/submission.entity';
import { Review } from '../resources/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'tg_catalog'),
        entities: [User, Resource, Category, Submission, Review],
        synchronize: configService.get('NODE_ENV') === 'development',
        // Логируем только ошибки и предупреждения, а не все SQL-запросы
        logging: configService.get('DB_LOGGING') === 'true' ? ['error', 'warn'] : false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}


