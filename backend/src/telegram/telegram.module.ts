import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { TelegramParserService } from './telegram-parser.service';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [ConfigModule],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramParserService],
  exports: [TelegramService, TelegramParserService],
})
export class TelegramModule {}

