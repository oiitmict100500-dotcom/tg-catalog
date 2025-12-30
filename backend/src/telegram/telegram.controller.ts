import { Controller, Post, Body } from '@nestjs/common';
import { TelegramParserService } from './telegram-parser.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly parserService: TelegramParserService) {}

  @Post('parse')
  async parseResource(@Body() body: { url: string }) {
    const result = await this.parserService.parseTelegramResource(body.url);
    return result;
  }
}


