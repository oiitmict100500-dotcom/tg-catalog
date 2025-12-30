import { Module } from '@nestjs/common';
import { ChannelPosterService } from './channel-poster.service';
import { ChannelPosterController } from './channel-poster.controller';
import { TelegramModule } from '../telegram/telegram.module';
import { ResourcesModule } from '../resources/resources.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [TelegramModule, ResourcesModule, CategoriesModule],
  controllers: [ChannelPosterController],
  providers: [ChannelPosterService],
  exports: [ChannelPosterService],
})
export class ChannelPosterModule {}

