import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ModerationService } from './moderation.service';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('pending')
  async getPending() {
    return this.moderationService.getPendingSubmissions();
  }

  @Post('approve/:id')
  async approve(
    @Param('id') id: string,
    @Body() body: { moderatorId: string },
  ) {
    const resource = await this.moderationService.approveSubmission(id, body.moderatorId);
    
    // Auto-publish to Telegram channel if enabled
    // This would be handled by a webhook/event system in production
    
    return resource;
  }

  @Post('reject/:id')
  async reject(
    @Param('id') id: string,
    @Body() body: { moderatorId: string; reason: string },
  ) {
    return this.moderationService.rejectSubmission(
      id,
      body.moderatorId,
      body.reason,
    );
  }
}

