import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ModerationController } from './moderation.controller';
import { ResourcesModule } from '../resources/resources.module';
import { UsersModule } from '../users/users.module';
import { ChannelPosterModule } from '../channel-poster/channel-poster.module';

@Module({
  imports: [ResourcesModule, UsersModule, ChannelPosterModule],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
