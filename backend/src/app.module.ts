import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ResourcesModule } from './resources/resources.module';
import { CategoriesModule } from './categories/categories.module';
import { ModerationModule } from './moderation/moderation.module';
import { TelegramModule } from './telegram/telegram.module';
import { ChannelPosterModule } from './channel-poster/channel-poster.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ResourcesModule,
    CategoriesModule,
    ModerationModule,
    TelegramModule,
    ChannelPosterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


